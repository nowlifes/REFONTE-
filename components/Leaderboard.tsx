
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Users, Globe, Zap, X, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gameService } from '../services/gameService';
import { LeaderboardEntry, NationLeaderboardEntry, TauntType } from '../types';

const TAUNT_OPTIONS: {
  type: TauntType; emoji: string;
  labelFr: string; labelEn: string;
  descFr: string; descEn: string;
  color: string;
}[] = [
  { type: TauntType.FREEZE,      emoji: '🥶', labelFr: 'Freeze',       labelEn: 'Freeze',       descFr: 'Bloqué 35 sec',              descEn: 'Locked 35 sec',              color: '#93C5FD' },
  { type: TauntType.ICE_BLOCK,   emoji: '🧊', labelFr: 'Ice Block',    labelEn: 'Ice Block',    descFr: 'Grille sous la glace',        descEn: 'Grid under ice',             color: '#7DD3FC' },
  { type: TauntType.TINY_TARGET, emoji: '🎯', labelFr: 'Tiny Target',  labelEn: 'Tiny Target',  descFr: 'Bouton qui s\'échappe',       descEn: 'Button runs away',           color: '#86EFAC' },
  { type: TauntType.BLOB,        emoji: '💦', labelFr: 'Blob',         labelEn: 'Blob',         descFr: 'Écran à nettoyer',            descEn: 'Screen to wipe',             color: '#6EE7B7' },
  { type: TauntType.FLASHLIGHT,  emoji: '🔦', labelFr: 'Lampe Torche', labelEn: 'Flashlight',   descFr: 'Noir total 45 sec',           descEn: 'Lights out 45 sec',          color: '#FDE68A' },
  { type: TauntType.TRAP,        emoji: '🪤', labelFr: 'Piège',        labelEn: 'Trap',         descFr: 'Case piégée = −1 pt',        descEn: 'Trapped cell = −1 pt',       color: '#FCA5A5' },
  { type: TauntType.REVERSE,     emoji: '🔁', labelFr: 'Reverse',      labelEn: 'Reverse',      descFr: 'Son prochain défi = ton +1', descEn: 'Their next clear = your +1', color: '#C4B5FD' },
];

// Cooldowns uniformisés à 3 min max
const TAUNT_COOLDOWN_MS = 3 * 60_000;   // 3 min per taunt
const GLOBAL_COOLDOWN_MS = 2 * 60_000;  // 2 min entre n'importe quel taunt
const COOLDOWNS_KEY = 'taunt_cooldowns';

function readCooldowns(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(COOLDOWNS_KEY) || '{}'); } catch { return {}; }
}
function writeCooldown(type: string) {
  const cd = readCooldowns();
  cd[type] = Date.now() + TAUNT_COOLDOWN_MS;
  cd['global'] = Date.now() + GLOBAL_COOLDOWN_MS;
  localStorage.setItem(COOLDOWNS_KEY, JSON.stringify(cd));
}
function getCooldownLeft(type: string): number {
  const cd = readCooldowns();
  return Math.max(0, (cd[type] || 0) - Date.now(), (cd['global'] || 0) - Date.now());
}
function fmtCooldown(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s` : `${s}s`;
}

/**
 * Dérive un ordre de déblocage unique et déterministe à partir du gameId.
 * Chaque joueur a un ordre différent → taunts différents.
 */
function deriveUnlockOrder(gameId: string): TauntType[] {
  const types = TAUNT_OPTIONS.map(o => o.type);
  // Seeded LCG shuffle based on first 8 hex chars of gameId
  let seed = parseInt((gameId || '').replace(/-/g, '').slice(0, 8) || '0', 16) || 42;
  for (let i = types.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    const j = seed % (i + 1);
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

/**
 * Retourne les types de taunts débloqués pour ce joueur selon son score.
 * 2 dès le départ, +1 toutes les 5 validations.
 */
function getUnlockedTaunts(gameId: string, score: number): Set<TauntType> {
  const order = deriveUnlockOrder(gameId);
  const count = Math.min(order.length, 2 + Math.floor(score / 5));
  return new Set(order.slice(0, count));
}

/** Score requis pour débloquer le taunt à la position donnée dans l'ordre */
function unlockScoreForPosition(position: number): number {
  if (position < 2) return 0;
  return (position - 1) * 5;
}

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

// ── Toast component ──
const TauntToast: React.FC<{ visible: boolean; message: string; isError?: boolean }> = ({ visible, message, isError }) => (
  <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
    <div className={`border-[3px] border-black rounded-2xl px-5 py-3 shadow-[6px_6px_0px_black] flex items-center gap-2 whitespace-nowrap ${isError ? 'bg-[#FF8C00]' : 'bg-[#FF2E63]'}`}>
      <span className="text-xl">{isError ? '🛡️' : '⚡'}</span>
      <span className="font-impact text-white uppercase text-sm tracking-tight">
        {message}
      </span>
    </div>
  </div>
);

// ── Taunt bottom sheet ──
interface TauntSheetProps {
  entry: LeaderboardEntry;
  tauntsLeft: number;
  language: string;
  gameId: string;
  score: number;
  onSend: (tauntType: TauntType) => Promise<void>;
  onClose: () => void;
}

const TauntSheet: React.FC<TauntSheetProps> = ({ entry, tauntsLeft, language, gameId, score, onSend, onClose }) => {
  const [sending, setSending] = useState<TauntType | null>(null);
  const [cooldownsMs, setCooldownsMs] = useState<Record<string, number>>({});
  const [alreadyAttacked, setAlreadyAttacked] = useState(false);

  // Compute unlocked taunts for this player
  const unlocked = getUnlockedTaunts(gameId, score);
  const unlockOrder = deriveUnlockOrder(gameId);

  // Refresh cooldowns every second
  useEffect(() => {
    const refresh = () => {
      const next: Record<string, number> = {};
      TAUNT_OPTIONS.forEach(o => { next[o.type] = getCooldownLeft(o.type); });
      setCooldownsMs(next);
    };
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSend = async (opt: typeof TAUNT_OPTIONS[number], isLocked: boolean) => {
    if (isLocked || tauntsLeft <= 0 || cooldownsMs[opt.type] > 0 || !!sending) return;
    setSending(opt.type);
    try {
      await onSend(opt.type);
      writeCooldown(opt.type);
      // Re-read immediately
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
    const cdMs = cooldownsMs[opt.type] ?? 0;
    const onCooldown = cdMs > 0;
    const isSending  = sending === opt.type;
    const isLocked   = !unlocked.has(opt.type);
    const position   = unlockOrder.indexOf(opt.type);
    const scoreNeeded = unlockScoreForPosition(position);
    const disabled   = isLocked || tauntsLeft <= 0 || onCooldown || !!sending;

    return (
      <button
        key={opt.type}
        onPointerDown={() => handleSend(opt, isLocked)}
        disabled={disabled}
        className={`relative flex items-center gap-3 rounded-2xl px-4 py-3.5 border-[3px] border-black shadow-[3px_3px_0px_black] transition-all duration-150 text-left overflow-hidden ${
          isLocked
            ? 'opacity-40 cursor-not-allowed'
            : disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
        }`}
        style={{
          backgroundColor: isLocked ? '#111827' : onCooldown ? '#1A1A2E' : opt.color + '22',
          borderColor: isLocked ? '#374151' : onCooldown ? '#333' : 'black',
        }}
      >
        {/* Background accent */}
        {!onCooldown && !isLocked && (
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle at 20% 50%, ${opt.color} 0%, transparent 70%)` }} />
        )}

        {/* Emoji / Lock icon */}
        <div
          className="shrink-0 w-10 h-10 rounded-xl border-[2px] border-black flex items-center justify-center text-xl"
          style={{ backgroundColor: isLocked ? '#1F2937' : onCooldown ? '#0A1629' : opt.color + '44' }}
        >
          {isLocked
            ? <Lock className="w-4 h-4 text-white/30" strokeWidth={2.5} />
            : isSending ? '⏳' : opt.emoji}
        </div>

        {/* Labels */}
        <div className="flex-1 min-w-0">
          <p className={`font-impact text-sm uppercase italic tracking-tight leading-none truncate ${isLocked ? 'text-white/30' : 'text-white'}`}>
            {language === 'fr' ? opt.labelFr : opt.labelEn}
          </p>
          <p className={`font-impact text-[9px] uppercase tracking-widest mt-0.5 leading-tight truncate ${isLocked ? 'text-white/20' : 'text-white/40'}`}>
            {isLocked
              ? (language === 'fr' ? `Débloqué à ${scoreNeeded} pts` : `Unlocks at ${scoreNeeded} pts`)
              : (language === 'fr' ? opt.descFr : opt.descEn)}
          </p>
        </div>

        {/* Cooldown badge or lock badge */}
        {onCooldown && !isLocked && (
          <div className="shrink-0 bg-[#0A1629] border border-white/20 rounded-lg px-2 py-1">
            <span className="font-impact text-white/60 text-[10px]">{fmtCooldown(cdMs)}</span>
          </div>
        )}
      </button>
    );
  };

  // Split into standard (first 4) and elite (last 3) based on TAUNT_OPTIONS order
  const standardTaunts = TAUNT_OPTIONS.slice(0, 4);
  const eliteTaunts    = TAUNT_OPTIONS.slice(4);

  return (
    <>
      {/* Already attacked toast (inside sheet) */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none ${alreadyAttacked ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="bg-[#FF8C00] border-[3px] border-black rounded-2xl px-5 py-3 shadow-[6px_6px_0px_black] flex items-center gap-2 whitespace-nowrap">
          <span className="text-xl">🛡️</span>
          <span className="font-impact text-white uppercase text-sm tracking-tight">
            {language === 'fr' ? 'Ce joueur est déjà attaqué !' : 'This player is already under attack!'}
          </span>
        </div>
      </div>

      <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[210] animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[#0A1629] border-t-[4px] border-x-[4px] border-black rounded-t-[28px] shadow-[0_-8px_0px_black] px-5 pt-5 pb-10">
          {/* Handle */}
          <div className="w-10 h-1.5 bg-white/15 rounded-full mx-auto mb-4" />

          {/* Close */}
          <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 bg-white/5 border-[2px] border-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform active:bg-[#FF2E63]/20">
            <X className="w-4 h-4 text-white/50" strokeWidth={3} />
          </button>

          {/* Target header */}
          <div className="flex items-center gap-3 mb-5 pr-12">
            <div className="w-12 h-12 bg-[#1A1A2E] border-[3px] border-black rounded-2xl flex items-center justify-center text-2xl shadow-[3px_3px_0px_black]">
              {entry.avatarId}
            </div>
            <div>
              <p className="font-impact text-white text-xl uppercase italic tracking-tight leading-none">{entry.pseudo}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-impact text-white/30 text-[10px] uppercase tracking-widest">
                  {language === 'fr' ? 'Choisis ton coup' : 'Choose your strike'}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className={`font-impact text-[10px] uppercase tracking-widest ${tauntsLeft > 0 ? 'text-[#FF2E63]' : 'text-white/20'}`}>
                  {tauntsLeft} {language === 'fr' ? `taunt${tauntsLeft > 1 ? 's' : ''}` : `taunt${tauntsLeft !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          </div>

          {/* Standard taunts */}
          <p className="font-impact text-white/30 text-[9px] uppercase tracking-widest mb-2 pl-1">
            {language === 'fr' ? 'Standard' : 'Standard'}
          </p>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {standardTaunts.map(renderCard)}
          </div>

          {/* Elite taunts */}
          <div className="flex items-center gap-2 mb-2 pl-1">
            <p className="font-impact text-[#FFD700] text-[9px] uppercase tracking-widest">
              {language === 'fr' ? 'Élite' : 'Elite'}
            </p>
            <div className="flex-1 h-px bg-[#FFD700]/20" />
          </div>
          <div className="flex flex-col gap-2.5">
            {eliteTaunts.map(renderCard)}
          </div>
        </div>
      </div>
    </>
  );
};

// ── Player row ──
interface PlayerRowProps {
  entry: LeaderboardEntry;
  canTaunt: boolean;
  onTauntPress: () => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ entry, canTaunt, onTauntPress }) => (
  <div className={`flex items-center gap-3 px-3 py-3 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] ${entry.isCurrentUser ? 'bg-[#00FF9D] text-black' : 'bg-white text-black'}`}>
    <div className="w-9 h-9 shrink-0 bg-black text-white rounded-lg flex items-center justify-center font-impact text-lg italic">
      {entry.rank}
    </div>
    <div className="text-2xl shrink-0">{entry.avatarId}</div>
    <div className="flex-1 min-w-0">
      <div className="font-impact uppercase text-sm tracking-tighter truncate leading-none">
        {entry.pseudo}
        {entry.isCurrentUser && <span className="ml-1 text-[8px] bg-black text-white px-1 py-0.5 rounded uppercase">toi</span>}
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

// ── Main component ──
const Leaderboard: React.FC<LeaderboardProps> = ({ onBack, currentUserId, currentGameId, currentScore = 0, tauntsLeft = 0, onTaunt }) => {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [nationEntries, setNationEntries] = useState<NationLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'PLAYERS' | 'NATIONS'>('PLAYERS');

  // Taunt sheet state
  const [tauntTarget, setTauntTarget] = useState<LeaderboardEntry | null>(null);
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'PLAYERS') {
        const data = await gameService.getLeaderboard(currentUserId);
        setEntries(data);
      } else {
        const data = await gameService.getCountryLeaderboard();
        setNationEntries(data);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [currentUserId, tab]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTauntSend = async (tauntType: TauntType) => {
    if (!tauntTarget || !onTaunt) return;
    const pseudo = tauntTarget.pseudo;
    await onTaunt(tauntTarget.userId, tauntType);
    setTauntTarget(null);
    // Show success toast
    setToastMessage(language === 'fr' ? `TAUNT ENVOYÉ À ${pseudo} !` : `TAUNT SENT TO ${pseudo}!`);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const canTaunt = !!onTaunt && tauntsLeft > 0;

  return (
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col text-white">

      {/* Toast */}
      <TauntToast visible={toastVisible} message={toastMessage} />

      {/* Taunt bottom sheet */}
      {tauntTarget && (
        <TauntSheet
          entry={tauntTarget}
          tauntsLeft={tauntsLeft}
          language={language}
          gameId={currentGameId || ''}
          score={currentScore}
          onSend={handleTauntSend}
          onClose={() => setTauntTarget(null)}
        />
      )}

      {/* ── HEADER ── */}
      <header className="shrink-0 bg-[#FFD700] border-b-[4px] border-black z-30">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button onClick={onBack} className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={20} strokeWidth={3} />
          </button>

          <h1 className="font-impact text-2xl font-[900] text-black uppercase tracking-tighter italic">
            {tab === 'PLAYERS' ? '🏆 TOP PLAYERS' : '🌍 NATION WARS'}
          </h1>

          <div className="flex items-center gap-2">
            {onTaunt && (
              <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-2 border-black text-[10px] font-impact font-[900] uppercase ${tauntsLeft > 0 ? 'bg-[#FF2E63] text-white' : 'bg-black/20 text-black/40'}`}>
                <Zap className="w-3 h-3" fill="currentColor" />
                {tauntsLeft}
              </div>
            )}
            <button onClick={fetchData} className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Hint taunts */}
        {canTaunt && (
          <p className="text-center text-black/40 font-impact text-[9px] uppercase tracking-widest pb-2">
            ⚡ {language === 'fr' ? 'Tape ⚡ sur un joueur pour le taunt' : 'Tap ⚡ on a player to taunt them'}
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-0 px-4 pb-0">
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

      {/* ── BODY ── */}
      {loading && (tab === 'PLAYERS' ? entries.length === 0 : nationEntries.length === 0) ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-10 h-10 text-[#FFD700] animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {tab === 'PLAYERS' ? (
            <>
              {entries.length > 0 ? (
                <div className="px-4 pt-4 pb-32 space-y-2">
                  {entries.map((entry) => (
                    <PlayerRow
                      key={entry.userId}
                      entry={entry}
                      canTaunt={canTaunt && !entry.isCurrentUser}
                      onTauntPress={() => setTauntTarget(entry)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-8 text-center">
                  <div className="text-5xl">🏜️</div>
                  <p className="font-impact uppercase text-white/40 text-sm tracking-widest">
                    {language === 'fr' ? 'Aucun joueur pour l\'instant' : 'No players yet'}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* ── NATIONS TAB ── */
            <div className="px-4 pt-6 pb-32 space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center mb-6">
                <p className="text-[9px] font-impact uppercase tracking-widest text-[#FFD700]">⚔️ MONTHLY NATION WAR</p>
                <p className="text-[8px] font-impact text-white/30 uppercase tracking-widest mt-1">
                  {language === 'fr' ? 'Score cumulé de tous les joueurs' : 'Combined score of all players'}
                </p>
              </div>
              {nationEntries.map((entry) => (
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
