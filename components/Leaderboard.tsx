
import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Crown, Users, Globe, Zap, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gameService } from '../services/gameService';
import { LeaderboardEntry, NationLeaderboardEntry } from '../types';

interface LeaderboardProps {
  onBack: () => void;
  currentUserId?: string;
  currentGameId?: string;
  tauntsLeft?: number;
  onTaunt?: (targetUserId: string) => Promise<void>;
}

const FLAG: Record<string, string> = {
  FR: '🇫🇷', US: '🇺🇸', GB: '🇬🇧', ES: '🇪🇸', DE: '🇩🇪',
  IT: '🇮🇹', PT: '🇵🇹', BR: '🇧🇷', CA: '🇨🇦', JP: '🇯🇵',
};

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack, currentUserId, currentGameId, tauntsLeft = 0, onTaunt }) => {
  const [tauntingId, setTauntingId] = useState<string | null>(null);
  const { t } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [nationEntries, setNationEntries] = useState<NationLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'PLAYERS' | 'NATIONS'>('PLAYERS');

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [currentUserId, tab]);

  const top3 = entries.slice(0, 3);
  const others = entries.slice(3);
  const currentUserEntry = entries.find(e => e.isCurrentUser);

  return (
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col text-white">

      {/* ── HEADER ── */}
      <header className="shrink-0 bg-[#FFD700] border-b-[4px] border-black z-30">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>

          <h1 className="font-impact text-2xl font-[900] text-black uppercase tracking-tighter italic">
            {tab === 'PLAYERS' ? '🏆 CLASSEMENT' : '🌍 NATION WARS'}
          </h1>

          <div className="flex items-center gap-2">
            {onTaunt && (
              <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-2 border-black text-[10px] font-impact font-[900] uppercase ${tauntsLeft > 0 ? 'bg-[#FF2E63] text-white' : 'bg-black/20 text-black/40'}`}>
                <Zap className="w-3 h-3" fill="currentColor" />
                {tauntsLeft}
              </div>
            )}
            <button
              onClick={fetchData}
              className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-4 pb-0">
          {(['PLAYERS', 'NATIONS'] as const).map((t_) => (
            <button
              key={t_}
              onClick={() => setTab(t_)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-impact text-[11px] uppercase tracking-widest transition-all border-t-2 border-x-2 rounded-t-xl border-black -mb-[4px] ${
                tab === t_
                  ? 'bg-[#0A1629] text-white shadow-none'
                  : 'bg-black/15 text-black/50'
              }`}
            >
              {t_ === 'PLAYERS' ? <Users size={12} /> : <Globe size={12} />}
              {t_ === 'PLAYERS' ? (t('players_tab') || 'JOUEURS') : (t('nations_tab') || 'NATIONS')}
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
              {/* ── PODIUM TOP 3 ── */}
              {top3.length > 0 && (
                <div className="bg-[#0A1629] px-4 pt-8 pb-2">
                  <div className="flex items-end justify-center gap-3">

                    {/* 2nd */}
                    {top3[1] ? (
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-3xl mb-1">{top3[1].avatarId}</div>
                        <div className="text-lg">🥈</div>
                        <div
                          className="w-full rounded-t-2xl border-[3px] border-black flex flex-col items-center justify-center pt-3 pb-2 bg-[#E5E7EB] shadow-[4px_4px_0px_black]"
                          style={{ height: 72 }}
                        >
                          <span className="font-impact text-2xl text-black leading-none italic">{top3[1].score}</span>
                          <span className="text-[8px] font-impact text-black/50 uppercase tracking-widest">pts</span>
                        </div>
                        <div className="bg-black px-2 py-0.5 rounded max-w-full">
                          <span className="text-[9px] font-impact uppercase text-white truncate block max-w-[70px] text-center">{top3[1].pseudo}</span>
                        </div>
                      </div>
                    ) : <div className="flex-1" />}

                    {/* 1st */}
                    {top3[0] && (
                      <div className="flex-1 flex flex-col items-center gap-1 relative">
                        <Crown className="w-7 h-7 text-[#FFD700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] animate-bounce" fill="currentColor" />
                        <div className="text-4xl mb-1">{top3[0].avatarId}</div>
                        <div className="text-lg">🥇</div>
                        <div
                          className="w-full rounded-t-2xl border-[3px] border-black flex flex-col items-center justify-center pt-3 pb-2 bg-[#FFD700] shadow-[6px_6px_0px_black]"
                          style={{ height: 96 }}
                        >
                          <span className="font-impact text-3xl text-black leading-none italic">{top3[0].score}</span>
                          <span className="text-[8px] font-impact text-black/60 uppercase tracking-widest">pts</span>
                        </div>
                        <div className="bg-white border-2 border-black px-2 py-0.5 rounded max-w-full">
                          <span className="text-[10px] font-impact uppercase text-black truncate block max-w-[80px] text-center">{top3[0].pseudo}</span>
                        </div>
                      </div>
                    )}

                    {/* 3rd */}
                    {top3[2] ? (
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-3xl mb-1">{top3[2].avatarId}</div>
                        <div className="text-lg">🥉</div>
                        <div
                          className="w-full rounded-t-2xl border-[3px] border-black flex flex-col items-center justify-center pt-3 pb-2 bg-[#CD7F32] shadow-[4px_4px_0px_black]"
                          style={{ height: 52 }}
                        >
                          <span className="font-impact text-xl text-black leading-none italic">{top3[2].score}</span>
                          <span className="text-[8px] font-impact text-black/50 uppercase tracking-widest">pts</span>
                        </div>
                        <div className="bg-black px-2 py-0.5 rounded max-w-full">
                          <span className="text-[9px] font-impact uppercase text-white truncate block max-w-[70px] text-center">{top3[2].pseudo}</span>
                        </div>
                      </div>
                    ) : <div className="flex-1" />}

                  </div>
                </div>
              )}

              {/* ── MY POSITION (sticky reminder) ── */}
              {currentUserEntry && currentUserEntry.rank > 3 && (
                <div className="mx-4 mt-4 p-3 bg-[#00FF9D] border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] flex items-center gap-3">
                  <div className="w-8 h-8 bg-black text-[#00FF9D] rounded-lg flex items-center justify-center font-impact text-lg italic">
                    {currentUserEntry.rank}
                  </div>
                  <div className="text-xl">{currentUserEntry.avatarId}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-impact uppercase text-[11px] text-black leading-none truncate">TOI · {currentUserEntry.pseudo}</div>
                    <div className="text-[8px] font-impact text-black/50 uppercase tracking-widest mt-0.5">{currentUserEntry.country || 'FR'}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-black" fill="currentColor" />
                    <span className="font-impact text-xl text-black italic">{currentUserEntry.score}</span>
                  </div>
                </div>
              )}

              {/* ── REST OF LIST ── */}
              {others.length > 0 && (
                <div className="px-4 pt-4 pb-32 space-y-2">
                  <div className="text-[9px] font-impact uppercase tracking-widest text-white/30 mb-3 ml-1">Suite du classement</div>
                  {others.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 px-3 py-3 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] transition-all ${
                        entry.isCurrentUser ? 'bg-[#00FF9D] text-black' : 'bg-white text-black'
                      }`}
                    >
                      <div className="w-9 h-9 shrink-0 bg-black text-white rounded-lg flex items-center justify-center font-impact text-lg italic">
                        {entry.rank}
                      </div>
                      <div className="text-2xl shrink-0">{entry.avatarId}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-impact uppercase text-sm tracking-tighter truncate leading-none">
                          {entry.pseudo}
                          {entry.isCurrentUser && <span className="ml-1 text-[8px] bg-black text-white px-1 py-0.5 rounded uppercase">toi</span>}
                        </div>
                        <div className="text-[8px] font-impact uppercase tracking-widest text-black/40 mt-0.5">{FLAG[entry.country || 'FR'] || '🌍'} {entry.country || 'FR'}</div>
                      </div>
                      <span className="font-impact text-2xl italic leading-none mr-1">{entry.score}</span>
                      {!entry.isCurrentUser && onTaunt && (
                        <button
                          disabled={tauntsLeft === 0 || tauntingId === entry.userId}
                          onClick={async () => {
                            setTauntingId(entry.userId);
                            try { await onTaunt(entry.userId); } finally { setTauntingId(null); }
                          }}
                          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border-2 border-black bg-[#FF2E63] text-white shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title={tauntsLeft === 0 ? 'Plus de taunts' : 'Figer ce joueur 30s'}
                        >
                          {tauntingId === entry.userId
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Zap className="w-3.5 h-3.5" fill="currentColor" />
                          }
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {entries.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-8 text-center">
                  <div className="text-5xl">🏜️</div>
                  <p className="font-impact uppercase text-white/40 text-sm tracking-widest">Aucun joueur pour l'instant</p>
                </div>
              )}
            </>
          ) : (
            /* ── NATIONS TAB ── */
            <div className="px-4 pt-6 pb-32 space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center mb-6">
                <p className="text-[9px] font-impact uppercase tracking-widest text-[#FFD700]">⚔️ MONTHLY NATION WAR</p>
                <p className="text-[8px] font-impact text-white/30 uppercase tracking-widest mt-1">Score cumulé de tous les joueurs</p>
              </div>
              {nationEntries.map((entry) => (
                <div
                  key={entry.country}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] ${
                    entry.rank <= 3 ? 'bg-[#FFD700]' : 'bg-white'
                  } text-black`}
                >
                  <div className="w-9 h-9 shrink-0 bg-black text-white rounded-lg flex items-center justify-center font-impact text-lg italic">
                    {entry.rank <= 3 ? RANK_MEDAL[entry.rank - 1] : entry.rank}
                  </div>
                  <div className="text-3xl shrink-0">{FLAG[entry.country] || '🌍'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-impact uppercase text-lg tracking-tighter leading-none">{entry.country}</div>
                    <div className="text-[8px] font-impact uppercase tracking-widest text-black/40 mt-0.5">{entry.playerCount} joueurs</div>
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
                  <p className="font-impact uppercase text-white/40 text-sm tracking-widest">Aucune nation encore</p>
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
