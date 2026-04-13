
import React, { useEffect, useState } from 'react';
import { Shield, FileText, ArrowRight, Crown, Medal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LeaderboardEntry } from '../types';
import { gameService } from '../services/gameService';

interface SessionEndOverlayProps {
  onViewReport: () => void;
  nickname: string;
}

const SessionEndOverlay: React.FC<SessionEndOverlayProps> = ({ onViewReport, nickname }) => {
  const { t } = useLanguage();
  const [top3, setTop3] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const data = await gameService.getLeaderboard();
        setTop3(data.slice(0, 3));
      } catch (e) {
        console.error(e);
      }
    };
    fetchTop();
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0A1629] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="relative mb-6">
        <div className="absolute -inset-8 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>
        <div className="w-20 h-20 bg-[#1A1A2E] border-2 border-red-500 rounded-2xl flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
      </div>

      <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-1">
        MISSION <br/>
        <span className="text-red-500">TERMINATED</span>
      </h2>
      
      <p className="text-white/50 font-mono text-[10px] uppercase tracking-[0.3em] mb-8 max-w-[250px] leading-relaxed">
        The Bingo Master has closed the gates.
      </p>

      {/* MINI PODIUM */}
      {top3.length > 0 && (
        <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-30"></div>
           <h3 className="text-[10px] font-impact text-[#FFD700] uppercase tracking-[0.4em] mb-6">The Legends</h3>
           
           <div className="flex items-end justify-center gap-3 h-24">
              {/* 2nd */}
              {top3[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="text-lg mb-1">{top3[1].avatarId}</div>
                  <div className="w-full bg-white/10 border border-white/10 h-10 rounded-t-lg flex items-center justify-center">
                     <Medal className="w-3 h-3 text-white/50" />
                  </div>
                  <span className="text-[7px] font-mono text-white/40 uppercase mt-1 truncate w-full">{top3[1].pseudo}</span>
                </div>
              )}
              {/* 1st */}
              {top3[0] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative">
                    <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-5 text-[#FFD700]" fill="currentColor" />
                    <div className="text-2xl mb-1">{top3[0].avatarId}</div>
                  </div>
                  <div className="w-full bg-[#FFD700]/20 border border-[#FFD700]/30 h-14 rounded-t-lg flex items-center justify-center">
                     <span className="text-xs font-impact text-[#FFD700]">{top3[0].score}</span>
                  </div>
                  <span className="text-[8px] font-mono text-[#FFD700] uppercase mt-1 truncate w-full">{top3[0].pseudo}</span>
                </div>
              )}
              {/* 3rd */}
              {top3[2] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="text-lg mb-1">{top3[2].avatarId}</div>
                  <div className="w-full bg-orange-900/20 border border-white/10 h-8 rounded-t-lg flex items-center justify-center">
                     <Medal className="w-3 h-3 text-orange-400/60" />
                  </div>
                  <span className="text-[7px] font-mono text-white/40 uppercase mt-1 truncate w-full">{top3[2].pseudo}</span>
                </div>
              )}
           </div>
        </div>
      )}

      <div className="w-full max-w-xs space-y-4">
        <button 
          onClick={onViewReport}
          className="w-full bg-[#FFD700] text-[#0A1629] font-impact text-xl uppercase py-5 rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_black] tracking-[0.2em] flex items-center justify-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <FileText className="w-6 h-6" />
          <span>VIEW MY REPORT</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        
        <p className="text-[10px] text-white/20 uppercase tracking-widest">
          Agent: {nickname.toUpperCase()} // Status: DEBRIEFING
        </p>
      </div>
    </div>
  );
};

export default SessionEndOverlay;
