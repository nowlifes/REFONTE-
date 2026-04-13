
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Users, Globe, Zap, X, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gameService } from '../services/gameService';
import { LeaderboardEntry, NationLeaderboardEntry, TauntType } from '../types';

// ─── Taunt catalogue ────────────────────────────────────────────────────────
const TAUNT_OPTIONS: {
  type: TauntType;
  emoji: string;
  labelFr: string; labelEn: string;
  descFr: string;  descEn: string;
  color: string;
}[] = [
  { type: TauntType.FREEZE,      emoji: '🥶', labelFr: 'Freeze',       labelEn: 'Freeze',       descFr: 'Bloqué 35 sec',              descEn: 'Locked 35 sec',              color: '#93C5FD' },
  { type: TauntType.ICE_BLOCK,   emoji: '🧊', labelFr: 'Ice Block',    labelEn: 'Ice Block',    descFr: 'Grille sous la glace',        descEn: 'Grid under ice',             color: '#7DD3FC' },
  { type: TauntType.TINY_TARGET, emoji: '🎯', labelFr: 'Tiny Target',  labelEn: 'Tiny Target',  descFr: 'Bouton qui s\'échappe',       descEn: 'Button runs away',           color: '#86EFAC' },
  { type: TauntType.BLOB,        emoji: '💦', labelFr: 'Blob',         labelEn: 'Blob',         descFr: 'Écran à nettoyer',            descEn: 'Screen to wipe',             color: '#6EE7B7' },
  { type: TauntType.FLASHLIGHT,  emoji: '🔦', labelFr: 'Lampe Torche', labelEn: 'Flashlight',   descFr: 'Noir total 45 sec',           descEn: 'Lights out 45 sec',          color: '#FDE68A' },
];

// ─── Unlock system (time-based) ─────────────────────────────────────────────
const INITIAL_UNLOCKS    = 3;           // 3 taunts dès le départ
const UNLOCK_INTERVAL_MS = 30 * 60_000; // +1 toutes les 30 minutes

function getOrSetUnlockStart(gameId: string): number {
  if (!gameId) return Date.now();
  const key = `taunt_start_${gameId}`;
  const stored = localStorage.getItem(key);
  if (stored) return parseInt(stored, 10);
  const now = Date.now();
  localStorage.setItem(key, String(now));
  return now;
}

function getUnlockedCount(gameId: string): number {
  const start   = getOrSetUnlockStart(gameId);
  const elapsed = Date.now() - start;
  return Math.min(TAUNT_OPTIONS.length, INITIAL_UNLOCKS + Math.floor(elapsed / UNLOCK_INTERVAL_MS));
}

function getUnlockedTaunts(gameId: string): Set<TauntType> {
  const order = deriveUnlockOrder(gameId);
  const count = getUnlockedCount(gameId);
  return new Set(order.slice(0, count));
}

/** ms avant le prochain déblocage, null si tous débloqués */
function getNextUnlockMs(gameId: string): number | null {
  const start   = getOrSetUnlockStart(gameId);
  const elapsed = Date.now() - start;
  const unlocked = INITIAL_UNLOCKS + Math.floor(elapsed / UNLOCK_INTERVAL_MS);
  if (unlocked >= TAUNT_OPTIONS.length) return null;
  const nextAt = start + (unlocked - INITIAL_UNLOCKS + 1) * UNLOCK_INTERVAL_MS;
  return Math.max(0, nextAt - Date.now());
}

/** timestamp de déblocage pour un taunt à la position `position` dans l'ordre */
function getUnlockAtForPosition(gameId: string, position: number): number {
  const start = getOrSetUnlockStart(gameId);
  return start + Math.max(0, position - INITIAL_UNLOCKS + 1) * UNLOCK_INTERVAL_MS;
}

// ─── Ordre déterministe unique par joueur (LCG shuffle sur gameId) ───────────
function deriveUnlockOrder(gameId: string): TauntType[] {
  const types = TAUNT_OPTIONS.map(o => o.type);
  let seed = parseInt((gameId || '').replace(/-/g, '').slice(0, 8) || '0', 16) || 42;
  for (let i = types.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    const j = seed % (i + 1);
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

// ─── Cooldown helpers ────────────────────────────────────────────────────────
const TAUNT_COOLDOWN_MS  = 3 * 60_000;
const GLOBAL_COOLDOWN_MS = 2 * 60_000;
const COOLDOWNS_KEY = 'taunt_cooldowns';

function readCooldowns(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(COOLDOWNS_KEY) || '{}'); } catch { return {}; }
}
function writeCooldown(type: string) {
  const cd = readCooldowns();
  cd[type]    = Date.now() + TAUNT_COOLDOWN_MS;
  cd['global'] = Date.now() + GLOBAL_COOLDOWN_MS;
  localStorage.setItem(COOLDOWNS_KEY, JSON.stringify(cd));
}
function getCooldownLeft(type: string): number {
  const cd = readCooldowns();
  return Math.max(0, (cd[type] || 0) - Date.now(), (cd['global'] || 0) - Date.now());
}

/** Formate mm:ss */
function fmtMs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface LeaderboardProps {
  onBack: () => void;
  currentUserId?: string;
  currentGameId?: string;
  currentScore?: number;
  tauntsLeft?: number;
  onTaunt?: (targetUserId: string, tauntType: TauntType) => Promise<void>;
}

const FLAG: Record<string, string> = {
  FR: '🇫🇷', US: '🇺🇸', GB: '🇬🇧', ES: '🇪🇸', DE: '🇩🇪',
  IT: '🇮🇹', PT: '🇵🇹', BR: '🇧🇷', CA: '🇨🇦', JP: '🇯🇵',
};
const RANK_MEDAL = ['🥇', '🥈', '🥉'];

// ─── Toast ───────────────────────────────────────────────────────────────────
const TauntToast: React.FC<{ visible: boolean; message: string; isError?: boolean }> = ({ visible, message, isError }) => (
  <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
    <div className={`border-[3px] border-black rounded-2xl px-5 py-3 shadow-[6px_6px_0px_black] flex items-center gap-2 whitespace-nowrap ${isError ? 'bg-[#FF8C00]' : 'bg-[#FF2E63]'}`}>
      <span className="text-xl">{isError ? '🛡️' : '⚡'}</span>
      <span className="font-impact text-white uppercase text-sm tracking-tight">{message}</span>
    </div>
  </div>
);

// ─── TauntSheet ──────────────────────────────────────────────────────────────
interface TauntSheetProps {
  entry: LeaderboardEntry;
  tauntsLeft: number;
  language: string;
  gameId: string;
  onSend: (tauntType: TauntType) => Promise<void>;
  onClose: () => void;
}

const TauntSheet: React.FC<TauntSheetProps> = ({ entry, tauntsLeft, language, gameId, onSend, onClose }) => {
  const [sending, setSending]         = useState<TauntType | null>(null);
  const [cooldownsMs, setCooldownsMs] = useState<Record<string, number>>({});
  const [, tick]                      = useState(0);
  const [alreadyAttacked, setAlreadyAttacked] = useState(false);

  // Tick every second — refreshes cooldowns + unlock countdowns
  useEffect(() => {
    const refresh = () => {
      tick(n => n + 1);
      const next: Record<string, number> = {};
      TAUNT_OPTIONS.forEach(o => { next[o.type] = getCooldownLeft(o.type); });
      setCooldownsMs(next);
    };
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, []);

  const unlockOrder  = deriveUnlockOrder(gameId);
  const unlockedSet  = getUnlockedTaunts(gameId);
  const nextUnlockMs = getNextUnlockMs(gameId);

  const handleSend = async (opt: typeof TAUNT_OPTIONS[number], isLocked: boolean) => {
    if (isLocked || tauntsLeft <= 0 || cooldownsMs[opt.type] > 0 || !!sending) return;
    setSending(opt.type);
    try {
      await onSend(opt.type);
      writeCooldown(opt.type);
      const next: Record<string, number> = {};
      TAUNT_OPTIONS.forEach(o => { next[o.type] = getCooldownLeft(o.type); });
      setCooldownsMs(next);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'ALREADY_TAUNTED') {
        setAlreadyAttacked(true);
        setTimeout(() => setAlreadyAttacked(false), 2500);
      }
    } finally {
      setSending(null);
    }
  };

  const renderCard = (opt: typeof TAUNT_OPTIONS[number]) => {
    const cdMs      = cooldownsMs[opt.type] ?? 0;
    const onCooldown = cdMs > 0;
    const isLocked  = !unlockedSet.has(opt.type);
    const isSending = sending === opt.type;
    const disabled  = isLocked || tauntsLeft <= 0 || onCooldown || !!sending;

    // When does this locked taunt unlock?
    const position     = unlockOrder.indexOf(opt.type);
    const unlockAt     = isLocked ? getUnlockAtForPosition(gameId, position) : null;
    const unlockMsLeft = unlockAt ? Math.max(0, unlockAt - Date.now()) : null;

    return (
      <button
        key={opt.type}
        onPointerDown={() => !disabled && handleSend(opt, isLocked)}
        disabled={disabled}
        className={`relative w-full flex items-center gap-3.5 rounded-2xl px-4 py-3.5 border-[3px] text-left overflow-hidden transition-all duration-150 ${
          isLocked
            ? 'border-[#1A2540] cursor-not-allowed'
            : onCooldown
            ? 'border-[#1A2540] cursor-not-allowed'
            : 'border-black shadow-[3px_3px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
        }`}
        style={{
          backgroundColor: isLocked
            ? '#0D1117'
            : onCooldown
            ? '#121C2E'
            : opt.color + '18',
          opacity: isLocked ? 0.5 : onCooldown ? 0.65 : 1,
        }}
      >
        {/* Subtle color glow when available */}
        {!isLocked && !onCooldown && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{ background: `radial-gradient(ellipse at 15% 50%, ${opt.color} 0%, transparent 65%)` }}
          />
        )}

        {/* Icon */}
        <div
          className="shrink-0 w-11 h-11 rounded-xl border-[2px] border-black flex items-center justify-center text-[22px]"
          style={{ backgroundColor: isLocked || onCooldown ? '#0A1629' : opt.color + '33' }}
        >
          {isSending ? '⏳' : isLocked ? '🔒' : opt.emoji}
        </div>

        {/* Label + desc */}
        <div className="flex-1 min-w-0">
          <p className={`font-impact text-[13px] uppercase italic tracking-tight leading-none truncate ${isLocked ? 'text-white/30' : 'text-white'}`}>
            {language === 'fr' ? opt.labelFr : opt.labelEn}
          </p>
          <p className={`font-impact text-[9px] uppercase tracking-widest mt-1 leading-tight ${isLocked ? 'text-white/20' : onCooldown ? 'text-white/25' : 'text-white/40'}`}>
            {isLocked && unlockMsLeft !== null
              ? (language === 'fr' ? `Dans ${fmtMs(unlockMsLeft)}` : `In ${fmtMs(unlockMsLeft)}`)
              : (language === 'fr' ? opt.descFr : opt.descEn)}
          </p>
        </div>

        {/* Right badge */}
        {onCooldown && !isLocked ? (
          <div className="shrink-0 px-2 py-1 bg-black/40 border border-white/10 rounded-lg">
            <span className="font-impact text-white/40 text-[10px]">{fmtMs(cdMs)}</span>
          </div>
        ) : !isLocked && !onCooldown && tauntsLeft > 0 && !sending ? (
          <div
            className="shrink-0 w-8 h-8 rounded-lg border-[2px] border-black flex items-center justify-center"
            style={{ backgroundColor: opt.color }}
          >
            <Zap className="w-3.5 h-3.5 text-black" fill="currentColor" strokeWidth={0} />
          </div>
        ) : null}
      </button>
    );
  };

  const unlockedTaunts = TAUNT_OPTIONS.filter(o => unlockedSet.has(o.type));
  const lockedTaunts   = TAUNT_OPTIONS.filter(o => !unlockedSet.has(o.type));

  return (
    <>
      {/* Already attacked toast */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none ${alreadyAttacked ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="bg-[#FF8C00] border-[3px] border-black rounded-2xl px-5 py-3 shadow-[6px_6px_0px_black] flex items-center gap-2 whitespace-nowrap">
          <span className="text-xl">🛡️</span>
          <span className="font-impact text-white uppercase text-sm tracking-tight">
            {language === 'fr' ? 'Déjà attaqué !' : 'Already under attack!'}
          </span>
        </div>
      </div>

      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/80" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[210] animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[#0A1629] border-t-[4px] border-x-[4px] border-black rounded-t-[28px] shadow-[0_-8px_0px_black] px-5 pt-5 pb-10 max-h-[88vh] overflow-y-auto no-scrollbar">

          {/* Drag handle */}
          <div className="w-10 h-1.5 bg-white/15 rounded-full mx-auto mb-5" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 bg-white/5 border-[2px] border-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          >
            <X className="w-4 h-4 text-white/40" strokeWidth={3} />
          </button>

          {/* Target header */}
          <div className="flex items-center gap-3 mb-5 pr-12">
            <div className="w-12 h-12 bg-[#1A1A2E] border-[3px] border-black rounded-2xl flex items-center justify-center text-2xl shadow-[3px_3px_0px_black] shrink-0">
              {entry.avatarId}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-impact text-white text-xl uppercase italic tracking-tight leading-none truncate">
                {entry.pseudo}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-impact text-white/30 text-[9px] uppercase tracking-widest">
                  {language === 'fr' ? 'Choisis ton arme' : 'Choose your weapon'}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                <span className={`font-impact text-[9px] uppercase tracking-widest shrink-0 ${tauntsLeft > 0 ? 'text-[#FF2E63]' : 'text-white/20'}`}>
                  {tauntsLeft} taunt{tauntsLeft > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Next unlock countdown — gives anticipation */}
          {nextUnlockMs !== null && (
            <div className="flex items-center gap-2.5 bg-[#FFD700]/8 border border-[#FFD700]/25 rounded-xl px-3.5 py-2.5 mb-5">
              <Clock className="w-3.5 h-3.5 text-[#FFD700] shrink-0" strokeWidth={2.5} />
              <span className="font-impact text-[#FFD700]/70 text-[9px] uppercase tracking-widest flex-1">
                {language === 'fr' ? 'Nouveau taunt dans' : 'Next taunt in'}
              </span>
              <span className="font-impact text-[#FFD700] text-[13px] tabular-nums">
                {fmtMs(nextUnlockMs)}
              </span>
            </div>
          )}

          {/* Unlocked taunts */}
          {unlockedTaunts.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {unlockedTaunts.map(renderCard)}
            </div>
          )}

          {/* Locked taunts — show when some are still coming */}
          {lockedTaunts.length > 0 && (
            <>
              <div className="flex items-center gap-3 my-4 px-1">
                <div className="h-px flex-1 bg-white/8" />
                <span className="font-impact text-white/20 text-[8px] uppercase tracking-[0.2em]">
                  {language === 'fr' ? 'À venir' : 'Coming soon'}
                </span>
                <div className="h-px flex-1 bg-white/8" />
              </div>
              <div className="flex flex-col gap-2">
                {lockedTaunts.map(renderCard)}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Player row ──────────────────────────────────────────────────────────────
interface PlayerRowProps {
  entry: LeaderboardEntry;
  canTaunt: boolean;
  onTauntPress: () => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ entry, canTaunt, onTauntPress }) => {
  const { language } = useLanguage();
  return (
  <div className={`flex items-center gap-3 px-3 py-3 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] ${entry.isCurrentUser ? 'bg-[#00FF9D] text-black' : 'bg-white text-black'}`}>
    <div className="w-9 h-9 shrink-0 bg-black text-white rounded-lg flex items-center justify-center font-impact text-lg italic">
      {entry.rank}
    </div>
    <div className="text-2xl shrink-0">{entry.avatarId}</div>
    <div className="flex-1 min-w-0">
      <div className="font-impact uppercase text-sm tracking-tighter truncate leading-none">
        {entry.pseudo}
        {entry.isCurrentUser && <span className="ml-1 text-[8px] bg-black text-white px-1 py-0.5 rounded uppercase">{language === 'fr' ? 'toi' : 'you'}</span>}
      </div>
      <div className="text-[8px] font-impact uppercase tracking-widest text-black/40 mt-0.5">
        {FLAG[entry.country || 'FR'] || '🌍'} {entry.country || 'FR'}
      </div>
    </div>
    <span className="font-impact text-2xl italic leading-none mr-1">{entry.score}</span>
    {!entry.isCurrentUser && canTaunt && (
      <button
        onClick={onTauntPress}
        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border-2 border-black bg-[#FF2E63] text-white shadow-[3px_3px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
      >
        <Zap className="w-4 h-4" fill="currentColor" />
      </button>
    )}
  </div>
  );
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────
const Leaderboard: React.FC<LeaderboardProps> = ({
  onBack, currentUserId, currentGameId, tauntsLeft = 0, onTaunt,
}) => {
  const { t, language } = useLanguage();
  const [entries, setEntries]           = useState<LeaderboardEntry[]>([]);
  const [nationEntries, setNationEntries] = useState<NationLeaderboardEntry[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<'PLAYERS' | 'NATIONS'>('PLAYERS');
  const [tauntTarget, setTauntTarget]   = useState<LeaderboardEntry | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'PLAYERS') {
        setEntries(await gameService.getLeaderboard(currentUserId));
      } else {
        setNationEntries(await gameService.getCountryLeaderboard());
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [currentUserId, tab]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleTauntSend = async (tauntType: TauntType) => {
    if (!tauntTarget || !onTaunt) return;
    const pseudo = tauntTarget.pseudo;
    await onTaunt(tauntTarget.userId, tauntType);
    setTauntTarget(null);
    setToastMessage(language === 'fr' ? `TAUNT ENVOYÉ À ${pseudo} !` : `TAUNT SENT TO ${pseudo}!`);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const canTaunt = !!onTaunt && tauntsLeft > 0;

  return (
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col text-white">
      <TauntToast visible={toastVisible} message={toastMessage} />

      {tauntTarget && (
        <TauntSheet
          entry={tauntTarget}
          tauntsLeft={tauntsLeft}
          language={language}
          gameId={currentGameId || ''}
          onSend={handleTauntSend}
          onClose={() => setTauntTarget(null)}
        />
      )}

      {/* Header */}
      <header className="shrink-0 bg-[#FFD700] border-b-[4px] border-black z-30">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button onClick={onBack} className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <h1 className="font-impact text-2xl text-black uppercase tracking-tighter italic">
            {tab === 'PLAYERS' ? '🏆 TOP PLAYERS' : '🌍 NATION WARS'}
          </h1>
          <div className="flex items-center gap-2">
            {onTaunt && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-black ${tauntsLeft > 0 ? 'bg-[#FF2E63] text-white' : 'bg-black/20 text-black/40'}`}>
                <Zap className="w-3.5 h-3.5" fill="currentColor" />
                <div className="flex flex-col leading-none">
                  <span className="font-impact text-[11px] uppercase">{tauntsLeft}</span>
                  <span className={`font-impact text-[7px] uppercase tracking-wider leading-none ${tauntsLeft > 0 ? 'text-white/70' : 'text-black/30'}`}>
                    {language === 'fr' ? 'ATTAQUER' : 'ATTACK'}
                  </span>
                </div>
              </div>
            )}
            <button onClick={fetchData} className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {canTaunt && (
          <p className="text-center text-black/40 font-impact text-[9px] uppercase tracking-widest pb-2">
            ⚡ {language === 'fr' ? 'Tape ⚡ sur un joueur pour l\'attaquer' : 'Tap ⚡ on a player to strike them'}
          </p>
        )}

        {/* Tabs */}
        <div className="flex px-4">
          {(['PLAYERS', 'NATIONS'] as const).map((t_) => (
            <button
              key={t_}
              onClick={() => setTab(t_)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-impact text-[11px] uppercase tracking-widest transition-all border-t-2 border-x-2 rounded-t-xl border-black -mb-[4px] ${tab === t_ ? 'bg-[#0A1629] text-white' : 'bg-black/15 text-black/50'}`}
            >
              {t_ === 'PLAYERS' ? <Users size={12} /> : <Globe size={12} />}
              {t_ === 'PLAYERS' ? (t('players_tab') || 'PLAYERS') : (t('nations_tab') || 'NATIONS')}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      {loading && (tab === 'PLAYERS' ? entries.length === 0 : nationEntries.length === 0) ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-10 h-10 text-[#FFD700] animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {tab === 'PLAYERS' ? (
            entries.length > 0 ? (
              <div className="px-4 pt-4 pb-32 space-y-2">
                {entries.map(entry => (
                  <PlayerRow
                    key={entry.userId}
                    entry={entry}
                    canTaunt={canTaunt && !entry.isCurrentUser}
                    onTauntPress={() => setTauntTarget(entry)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-center">
                <div className="text-5xl">🏜️</div>
                <p className="font-impact uppercase text-white/40 text-sm tracking-widest">
                  {language === 'fr' ? 'Aucun joueur pour l\'instant' : 'No players yet'}
                </p>
              </div>
            )
          ) : (
            <div className="px-4 pt-6 pb-32 space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center mb-6">
                <p className="text-[9px] font-impact uppercase tracking-widest text-[#FFD700]">⚔️ MONTHLY NATION WAR</p>
                <p className="text-[8px] font-impact text-white/30 uppercase tracking-widest mt-1">
                  {language === 'fr' ? 'Score cumulé de tous les joueurs' : 'Combined score of all players'}
                </p>
              </div>
              {nationEntries.map(entry => (
                <div
                  key={entry.country}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] ${entry.rank <= 3 ? 'bg-[#FFD700]' : 'bg-white'} text-black`}
                >
                  <div className="w-9 h-9 shrink-0 bg-black text-white rounded-lg flex items-center justify-center font-impact text-lg italic">
                    {entry.rank <= 3 ? RANK_MEDAL[entry.rank - 1] : entry.rank}
                  </div>
                  <div className="text-3xl shrink-0">{FLAG[entry.country] || '🌍'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-impact uppercase text-lg tracking-tighter leading-none">{entry.country}</div>
                    <div className="text-[8px] font-impact uppercase tracking-widest text-black/40 mt-0.5">
                      {entry.playerCount} {language === 'fr' ? 'joueurs' : 'players'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-impact text-2xl italic leading-none">{entry.totalScore}</span>
                    <span className="text-[8px] font-impact uppercase text-black/40">pts</span>
                  </div>
                </div>
              ))}
              {nationEntries.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                  <div className="text-5xl">🌍</div>
                  <p className="font-impact uppercase text-white/40 text-sm tracking-widest">
                    {language === 'fr' ? 'Aucune nation encore' : 'No nations yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
