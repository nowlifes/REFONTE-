
import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Crown, Medal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gameService } from '../services/gameService';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  onBack: () => void;
  currentUserId?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack, currentUserId }) => {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await gameService.getLeaderboard(currentUserId);
      setEntries(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const top3 = entries.slice(0, 3);
  const others = entries.slice(3);

  return (
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col text-white">
      <header className="shrink-0 bg-[#FFD700] border-b-[4px] border-black p-4 flex items-center justify-between z-30">
        <button onClick={onBack} className="p-2 bg-black text-white rounded-xl active:scale-90 transition-transform">
           <ArrowLeft size={24} strokeWidth={4} />
        </button>
        <h2 className="font-impact text-2xl font-[900] text-black uppercase tracking-tighter italic">{t('leaderboard_title')}</h2>
        <button onClick={fetchData} className="p-2 bg-black text-white rounded-xl active:rotate-180 transition-transform">
           <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {loading && entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-12 h-12 text-[#FFD700] animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32">
            
            {/* LE PODIUM VISUEL */}
            {top3.length > 0 && (
                <div className="flex items-end justify-center gap-2 pt-14 pb-8 px-2 h-64">
                    {/* 2ème Place */}
                    {top3[1] && (
                        <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700 delay-150">
                            <div className="text-4xl mb-2">{top3[1].avatarId}</div>
                            <div className="w-full bg-[#E5E7EB] h-24 rounded-t-2xl border-[4px] border-black flex flex-col items-center justify-center text-black shadow-[4px_0px_0px_black] relative">
                                <Medal className="w-8 h-8 mb-1 text-slate-500" strokeWidth={3} />
                                <span className="font-impact text-xl leading-none">{top3[1].score}</span>
                                <div className="absolute -bottom-6 w-full text-center">
                                    <span className="text-[9px] font-impact uppercase truncate px-1 bg-black text-white py-1 block">{top3[1].pseudo}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* 1ère Place (Centre) */}
                    {top3[0] && (
                        <div className="flex-1 flex flex-col items-center z-10 animate-in slide-in-from-bottom-20 duration-700">
                            <div className="relative">
                                <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 text-[#FFD700] drop-shadow-[0_4px_0px_black] animate-bounce" fill="currentColor" />
                                <div className="text-6xl mb-2">{top3[0].avatarId}</div>
                            </div>
                            <div className="w-full bg-[#FFD700] h-36 rounded-t-2xl border-[4px] border-black flex flex-col items-center justify-center text-black shadow-[6px_0px_0px_black] relative">
                                <span className="font-impact text-3xl leading-none italic">{top3[0].score}</span>
                                <span className="text-[10px] font-impact uppercase mb-1 font-black">POINTS</span>
                                <div className="absolute -bottom-8 w-[110%] text-center left-1/2 -translate-x-1/2">
                                    <span className="text-[11px] font-impact uppercase truncate bg-white border-2 border-black text-black py-1.5 px-2 block rotate-1">{top3[0].pseudo}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3ème Place */}
                    {top3[2] && (
                        <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700 delay-300">
                            <div className="text-4xl mb-2">{top3[2].avatarId}</div>
                            <div className="w-full bg-[#CD7F32] h-16 rounded-t-2xl border-[4px] border-black flex flex-col items-center justify-center text-black shadow-[4px_0px_0px_black] relative">
                                <Medal className="w-6 h-6 mb-1 text-orange-900 opacity-60" strokeWidth={3} />
                                <span className="font-impact text-lg leading-none">{top3[2].score}</span>
                                <div className="absolute -bottom-6 w-full text-center">
                                    <span className="text-[9px] font-impact uppercase truncate px-1 bg-black text-white py-1 block">{top3[2].pseudo}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* RESTE DU CLASSEMENT */}
            <div className="space-y-4 pt-8">
                {others.map((entry) => (
                    <div key={entry.userId} className={`flex items-center gap-4 p-5 rounded-[1.5rem] border-[4px] border-black shadow-[6px_6px_0px_black] transition-all ${entry.isCurrentUser ? 'bg-[#00FF9D] text-black ring-4 ring-white/20' : 'bg-white text-black'}`}>
                        <div className="w-10 h-10 shrink-0 bg-black text-white rounded-xl flex items-center justify-center font-impact text-xl italic">
                           {entry.rank}
                        </div>
                        <div className="text-3xl shrink-0">{entry.avatarId}</div>
                        <div className="flex-1 min-w-0">
                           <div className="font-impact uppercase text-sm tracking-tighter truncate leading-none mb-1">{entry.pseudo}</div>
                           <div className="text-[9px] font-impact uppercase tracking-widest text-black/40">{entry.country || 'FR'}</div>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="font-impact text-2xl italic leading-none">{entry.score}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
