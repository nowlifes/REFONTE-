
import React, { useRef, useState, useEffect } from 'react';
import { Share2, Download, ArrowLeft, Shield, Clock, Trophy, CheckCircle2, UserCheck, Medal, Crown, LogOut } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useLanguage } from '../contexts/LanguageContext';
import { BingoCellData, CellStatus, Badge, LeaderboardEntry } from '../types';
import { gameService } from '../services/gameService';
import Avatar from './Avatar';
import BackgroundParticles from './BackgroundParticles';

interface MissionReportProps {
  nickname: string;
  avatarId: string;
  country: string;
  cells: BingoCellData[];
  badges: Badge[];
  startedAt: number;
  onBack: () => void;
  onReset?: () => void;
}

const MissionReport: React.FC<MissionReportProps> = ({ 
  nickname, 
  avatarId, 
  country, 
  cells, 
  badges, 
  startedAt, 
  onBack,
  onReset
}) => {
  const { t } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [isResetPressing, setIsResetPressing] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);
  const resetIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const data = await gameService.getLeaderboard();
        setTopPlayers(data.slice(0, 3));
      } catch (e) {
        console.error("Failed to fetch leaderboard for report", e);
      }
    };
    fetchTop();
  }, []);

  const validatedCells = cells.filter(c => c.status === CellStatus.VALIDATED);
  const score = validatedCells.length;
  const durationMs = Date.now() - startedAt;
  const durationMins = Math.floor(durationMs / 60000);
  
  const witnesses = cells
    .filter(c => c.status === CellStatus.VALIDATED && c.witnessName)
    .map(c => c.witnessName);
  const uniqueWitnesses = [...new Set(witnesses)];

  const handleShare = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0A1629',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      const file = new File([blob], `bingo-report-${nickname}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Bingo Crawl Mission Report',
          text: `I just completed my Bingo Crawl mission! Score: ${score}/25. Can you beat me?`
        });
      } else {
        // Fallback: Download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bingo-report-${nickname}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const startResetPress = () => {
    setIsResetPressing(true);
    setResetProgress(0);
    let p = 0;
    resetIntervalRef.current = setInterval(() => {
      p += 1;
      setResetProgress(p);
      if (navigator.vibrate) navigator.vibrate(20);
      if (p >= 5) { // 5 seconds for reset
        if (resetIntervalRef.current) clearInterval(resetIntervalRef.current);
        resetIntervalRef.current = null;
        if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
        if (window.confirm("Reset profile and start over?")) {
           onReset?.();
        }
        setIsResetPressing(false);
        setResetProgress(0);
      }
    }, 1000);
  };

  const endResetPress = () => {
    setIsResetPressing(false);
    setResetProgress(0);
    if (resetIntervalRef.current) {
      clearInterval(resetIntervalRef.current);
      resetIntervalRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A1629] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
      <BackgroundParticles />
      
      {/* Header Nav */}
      <div className="relative z-20 p-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 
          className={`text-xl font-black font-bold text-gold-500 uppercase tracking-widest italic transition-all duration-300 ${isResetPressing ? 'scale-110 text-red-500' : ''}`}
          onMouseDown={startResetPress}
          onMouseUp={endResetPress}
          onMouseLeave={endResetPress}
          onTouchStart={startResetPress}
          onTouchEnd={endResetPress}
        >
          Mission Report
        </h2>
        {isResetPressing && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-1">
            {[1, 2, 3, 4, 5].map((dot) => (
              <div 
                key={dot} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${resetProgress >= dot ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-red-900/30'}`}
              />
            ))}
          </div>
        )}
        <div className="w-10" /> {/* Spacer to balance the back button */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        
        {/* THE DOSSIER (The part that gets captured) */}
        <div 
          ref={reportRef}
          className="relative bg-[#0F172A] border-2 border-gold-500/30 rounded-3xl p-8 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* Decorative Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FDE047 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {/* Top Secret Stamp */}
          <div className="absolute top-8 right-8 -rotate-12 border-4 border-red-500/40 px-4 py-1 rounded text-red-500/40 font-black text-2xl tracking-tighter uppercase pointer-events-none">
            Classified
          </div>

          {/* Profile Section */}
          <div className="flex flex-col items-center mb-10 relative z-10">
            <div className="relative mb-4">
               <div className="absolute -inset-4 bg-gold-500/10 blur-2xl rounded-full"></div>
               <Avatar seed={avatarId} size={100} className="border-4 border-gold-500 rounded-2xl relative z-10" />
               <div className="absolute -bottom-2 -right-2 bg-gold-500 text-navy-950 p-1.5 rounded-lg border-2 border-navy-950 z-20">
                  <Shield className="w-5 h-5" fill="currentColor" />
               </div>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic mb-1 break-words text-center w-full px-4">{nickname}</h3>
            <p className="text-gold-500 font-mono text-xs uppercase tracking-[0.4em] opacity-80">Agent ID: {nickname.slice(0,3).toUpperCase()}-{Math.floor(Math.random()*9000)+1000}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
             <div className="bg-navy-900/50 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                <Clock className="w-5 h-5 text-emerald-400 mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Duration</span>
                <span className="text-xl font-black text-white">{durationMins} MINS</span>
             </div>
             <div className="bg-navy-900/50 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                <Trophy className="w-5 h-5 text-gold-400 mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Score</span>
                <span className="text-xl font-black text-white">{score}/25</span>
             </div>
          </div>

          {/* THE PODIUM (Global Legends) */}
          <div className="mb-10 relative z-10">
             <h4 className="text-[10px] font-impact text-gold-500 uppercase tracking-[0.4em] mb-6 border-b border-gold-500/20 pb-2">Global Legends</h4>
             <div className="flex items-end justify-center gap-2 h-32 mb-4">
                {/* 2nd */}
                {topPlayers[1] && (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-xl mb-1">{topPlayers[1].avatarId}</div>
                    <div className="w-full bg-slate-400/20 border border-white/10 h-12 rounded-t-lg flex flex-col items-center justify-center relative">
                       <Medal className="w-3 h-3 text-slate-400 mb-0.5" />
                       <span className="text-[10px] font-black text-white leading-none">{topPlayers[1].score}</span>
                       <div className="absolute -bottom-4 w-full text-center">
                          <span className="text-[7px] font-mono text-slate-500 uppercase truncate px-1">{topPlayers[1].pseudo}</span>
                       </div>
                    </div>
                  </div>
                )}
                {/* 1st */}
                {topPlayers[0] && (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="relative">
                       <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-5 text-gold-500" fill="currentColor" />
                       <div className="text-2xl mb-1">{topPlayers[0].avatarId}</div>
                    </div>
                    <div className="w-full bg-gold-500/20 border border-gold-500/30 h-16 rounded-t-lg flex flex-col items-center justify-center relative">
                       <span className="text-xs font-black text-gold-500 leading-none">{topPlayers[0].score}</span>
                       <div className="absolute -bottom-5 w-full text-center">
                          <span className="text-[8px] font-mono text-gold-500 uppercase truncate px-1 font-bold">{topPlayers[0].pseudo}</span>
                       </div>
                    </div>
                  </div>
                )}
                {/* 3rd */}
                {topPlayers[2] && (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-xl mb-1">{topPlayers[2].avatarId}</div>
                    <div className="w-full bg-orange-900/20 border border-white/10 h-10 rounded-t-lg flex flex-col items-center justify-center relative">
                       <Medal className="w-3 h-3 text-orange-400/60 mb-0.5" />
                       <span className="text-[10px] font-black text-white leading-none">{topPlayers[2].score}</span>
                       <div className="absolute -bottom-4 w-full text-center">
                          <span className="text-[7px] font-mono text-slate-500 uppercase truncate px-1">{topPlayers[2].pseudo}</span>
                       </div>
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Badges Section */}
          <div className="mb-10 relative z-10">
             <h4 className="text-[10px] font-impact text-gold-500 uppercase tracking-[0.4em] mb-4 border-b border-gold-500/20 pb-2">Unlocked Achievements</h4>
             <div className="flex flex-wrap gap-3 justify-center">
                {badges.length > 0 ? badges.map((badge, idx) => (
                  <div key={idx} className="w-14 h-14 bg-gold-500/10 border border-gold-500/30 rounded-xl flex items-center justify-center relative group">
                     <CheckCircle2 className="w-8 h-8 text-gold-500" />
                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-navy-950">
                        <span className="text-[8px] text-white font-bold">✓</span>
                     </div>
                  </div>
                )) : (
                  <p className="text-slate-600 text-[10px] uppercase tracking-widest italic">No badges earned yet...</p>
                )}
             </div>
          </div>

          {/* Witnesses Section */}
          <div className="relative z-10">
             <h4 className="text-[10px] font-impact text-gold-500 uppercase tracking-[0.4em] mb-4 border-b border-gold-500/20 pb-2">Field Witnesses</h4>
             <div className="space-y-3">
                {uniqueWitnesses.length > 0 ? uniqueWitnesses.slice(0, 5).map((name, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                     <UserCheck className="w-4 h-4 text-emerald-400" />
                     <span className="text-xs font-mono text-white/80 uppercase tracking-wider">{name}</span>
                     <div className="ml-auto h-[1px] flex-1 bg-white/10 mx-2"></div>
                     <span className="text-[8px] text-emerald-500/60 font-mono italic">VERIFIED</span>
                  </div>
                )) : (
                  <p className="text-slate-600 text-[10px] uppercase tracking-widest italic">No witnesses recorded...</p>
                )}
                {uniqueWitnesses.length > 5 && (
                  <p className="text-center text-[9px] text-slate-500 uppercase tracking-widest mt-2">And {uniqueWitnesses.length - 5} others...</p>
                )}
             </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col items-center">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">The Bingo Crawl</span>
             </div>
             <p className="text-[8px] text-slate-600 uppercase tracking-widest">Protocol: LISBOA-2026-ALPHA</p>
          </div>
        </div>

      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0A1629] via-[#0A1629] to-transparent z-50">
        <button 
          onClick={handleShare}
          disabled={isGenerating}
          className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-impact text-xl uppercase py-5 rounded-2xl tracking-[0.2em] shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <div className="w-6 h-6 border-4 border-navy-950/30 border-t-navy-950 rounded-full animate-spin"></div>
          ) : (
            <>
              <Share2 className="w-6 h-6" />
              <span>Share to Instagram</span>
            </>
          )}
        </button>
        <p className="text-center text-[9px] text-slate-500 uppercase tracking-[0.3em] mt-4 opacity-60">
          Generates a classified mission report image
        </p>
      </div>
    </div>
  );
};

export default MissionReport;
