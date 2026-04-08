
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Crown, Users, Globe, Zap, Star, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gameService } from '../services/gameService';
import { LeaderboardEntry, NationLeaderboardEntry, TauntType } from '../types';

// 🤢 → 💦 (éclaboussure propre, même effet drôle)
const TAUNT_OPTIONS: { type: TauntType; emoji: string; labelFr: string; labelEn: string; descFr: string; descEn: string }[] = [
  { type: TauntType.FREEZE,      emoji: '🥶', labelFr: 'Freeze',      labelEn: 'Freeze',      descFr: 'Bloqué 30 sec',       descEn: 'Locked 30 sec' },
  { type: TauntType.ICE_BLOCK,   emoji: '🧊', labelFr: 'Ice Block',   labelEn: 'Ice Block',   descFr: 'Grille sous la glace', descEn: 'Grid under ice' },
  { type: TauntType.TINY_TARGET, emoji: '🎯', labelFr: 'Tiny Target', labelEn: 'Tiny Target', descFr: 'Bouton qui s\'échappe', descEn: 'Button runs away' },
  { type: TauntType.BLOB,        emoji: '💦', labelFr: 'Blob',        labelEn: 'Blob',        descFr: 'Écran à nettoyer',     descEn: 'Screen to wipe' },
];

interface LeaderboardProps {
  onBack: () => void;
  currentUserId?: string;
  currentGameId?: string;
  tauntsLeft?: number;
  onTaunt?: (targetUserId: string, tauntType: TauntType) => Promise<void>;
}

const FLAG: Record<string, string> = {
  FR: '🇫🇷', US: '🇺🇸', GB: '🇬🇧', ES: '🇪🇸', DE: '🇩🇪',
  IT: '🇮🇹', PT: '🇵🇹', BR: '🇧🇷', CA: '🇨🇦', JP: '🇯🇵',
};

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

// ── Toast component ──
const TauntToast: React.FC<{ visible: boolean; pseudo: string; language: string }> = ({ visible, pseudo, language }) => (
  <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
    <div className="bg-[#FF2E63] border-[3px] border-black rounded-2xl px-5 py-3 shadow-[6px_6px_0px_black] flex items-center gap-2 whitespace-nowrap">
      <span className="text-xl">⚡</span>
      <span className="font-impact text-white uppercase text-sm tracking-tight">
        {language === 'fr' ? `TAUNT ENVOYÉ À ${pseudo} !` : `TAUNT SENT TO ${pseudo}!`}
      </span>
    </div>
  </div>
);

// ── Taunt bottom sheet ──
interface TauntSheetProps {
  entry: LeaderboardEntry;
  tauntsLeft: number;
  language: string;
  onSend: (tauntType: TauntType) => Promise<void>;
  onClose: () => void;
}

const TauntSheet: React.FC<TauntSheetProps> = ({ entry, tauntsLeft, language, onSend, onClose }) => {
  const [sending, setSending] = useState<TauntType | null>(null);

  const handleSend = async (type: TauntType) => {
    setSending(type);
    try { await onSend(type); } finally { setSending(null); }
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[210] animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[#0A1629] border-t-[4px] border-x-[4px] border-black rounded-t-[28px] shadow-[0_-8px_0px_black] px-5 pt-5 pb-10">
          {/* Handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

          {/* Close */}
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center active:scale-90 transition-transform">
            <X className="w-4 h-4 text-white/50" strokeWidth={3} />
          </button>

          {/* Target */}
          <div className="flex items-center gap-3 mb-5">
            <div className="text-3xl">{entry.avatarId}</div>
            <div>
              <p className="font-impact text-white text-lg uppercase italic tracking-tight leading-none">{entry.pseudo}</p>
              <p className="font-impact text-white/30 text-[10px] uppercase tracking-widest">
                {language === 'fr' ? 'Choisis ton taunt' : 'Choose your taunt'}
                {' · '}
                <span className="text-[#FF2E63]">{tauntsLeft} {language === 'fr' ? 'restant' : 'left'}{tauntsLeft > 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>

          {/* Taunt grid */}
          <div className="grid grid-cols-2 gap-3">
            {TAUNT_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => handleSend(opt.type)}
                disabled={!!sending}
                className="flex items-center gap-3 bg-white/5 border-[2px] border-white/10 rounded-2xl px-4 py-3.5 active:scale-95 active:bg-[#FF2E63]/20 active:border-[#FF2E63] transition-all disabled:opacity-40 group"
              >
                <span className="text-3xl leading-none shrink-0">
                  {sending === opt.type ? '⏳' : opt.emoji}
                </span>
                <div className="text-left min-w-0">
                  <p className="font-impact text-white text-sm uppercase italic tracking-tight leading-none">
                    {language === 'fr' ? opt.labelFr : opt.labelEn}
                  </p>
                  <p className="font-impact text-white/30 text-[9px] uppercase tracking-widest mt-0.5 leading-tight">
                    {language === 'fr' ? opt.descFr : opt.descEn}
                  </p>
                </div>
              </button>
            ))}
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
const Leaderboard: React.FC<LeaderboardProps> = ({ onBack, currentUserId, tauntsLeft = 0, onTaunt }) => {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [nationEntries, setNationEntries] = useState<NationLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'PLAYERS' | 'NATIONS'>('PLAYERS');

  // Taunt sheet state
  const [tauntTarget, setTauntTarget] = useState<LeaderboardEntry | null>(null);
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastPseudo, setToastPseudo] = useState('');

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
    // Show toast
    setToastPseudo(pseudo);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const canTaunt = !!onTaunt && tauntsLeft > 0;
  const currentUserEntry = entries.find(e => e.isCurrentUser);

  return (
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col text-white">

      {/* Toast */}
      <TauntToast visible={toastVisible} pseudo={toastPseudo} language={language} />

      {/* Taunt bottom sheet */}
      {tauntTarget && (
        <TauntSheet
          entry={tauntTarget}
          tauntsLeft={tauntsLeft}
          language={language}
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
              {/* ── FLAT LIST — tous les joueurs ── */}
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
