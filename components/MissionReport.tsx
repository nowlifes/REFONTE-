
import React, { useRef, useState, useEffect } from 'react';
import { Share2, Crown, Medal, Shield } from 'lucide-react';
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

const getTitle = (score: number): string => {
  if (score >= 25) return 'LEGEND';
  if (score >= 20) return 'ELITE AGENT';
  if (score >= 15) return 'VETERAN';
  if (score >= 10) return 'OPERATIVE';
  if (score >= 5)  return 'RECRUIT';
  return 'ROOKIE';
};

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

  useEffect(() => {
    gameService.getLeaderboard().then(data => setTopPlayers(data.slice(0, 3))).catch(() => {});
  }, []);

  const score = cells.filter(c => c.status === CellStatus.VALIDATED).length;
  const title = getTitle(score);

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
        await navigator.share({ files: [file], title: 'My Bingo Crawl Report', text: `Score: ${score}/25` });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bingo-report-${nickname}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A1629] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
      <BackgroundParticles />

      {/* Header */}
      <div className="relative z-20 p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white active:scale-90 transition-transform"
        >
          ←
        </button>
        <h2 className="text-xl font-black text-gold-500 uppercase tracking-widest italic">
          Mission Report
        </h2>
        <div className="w-10" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        <div
          ref={reportRef}
          className="relative bg-[#0F172A] border-2 border-gold-500/30 rounded-3xl p-8 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FDE047 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          {/* Classified stamp */}
          <div className="absolute top-8 right-8 -rotate-12 border-4 border-red-500/40 px-4 py-1 rounded text-red-500/40 font-black text-2xl tracking-tighter uppercase pointer-events-none">
            Classified
          </div>

          {/* Player Profile */}
          <div className="flex flex-col items-center mb-10 relative z-10">
            <div className="relative mb-4">
              <div className="absolute -inset-4 bg-gold-500/10 blur-2xl rounded-full" />
              <Avatar seed={avatarId} size={100} className="border-4 border-gold-500 rounded-2xl relative z-10" />
              <div className="absolute -bottom-2 -right-2 bg-gold-500 text-navy-950 p-1.5 rounded-lg border-2 border-navy-950 z-20">
                <Shield className="w-5 h-5" fill="currentColor" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-1 break-words text-center w-full px-4">{nickname}</h3>
            <span className="text-[11px] font-impact text-gold-500 uppercase tracking-[0.4em] mb-1">{title}</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{country} · {score}/25 pts</span>
          </div>

          {/* Top 3 Podium */}
          <div className="relative z-10">
            <h4 className="text-[10px] font-impact text-gold-500 uppercase tracking-[0.4em] mb-6 border-b border-gold-500/20 pb-2">Global Legends</h4>
            {topPlayers.length === 0 ? (
              <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest italic">No rankings yet</p>
            ) : (
              <div className="flex items-end justify-center gap-2 h-36 mb-6">
                {/* 2nd */}
                {topPlayers[1] && (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-2xl mb-1">{topPlayers[1].avatarId}</div>
                    <div className="w-full bg-slate-400/20 border border-white/10 h-14 rounded-t-lg flex flex-col items-center justify-center relative">
                      <Medal className="w-3 h-3 text-slate-400 mb-0.5" />
                      <span className="text-[11px] font-black text-white leading-none">{topPlayers[1].score}</span>
                      <div className="absolute -bottom-5 w-full text-center">
                        <span className="text-[7px] font-mono text-slate-400 uppercase truncate px-1">{topPlayers[1].pseudo}</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* 1st */}
                {topPlayers[0] && (
                  <div className="flex-1 flex flex-col items-center z-10">
                    <div className="relative">
                      <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 text-gold-500 animate-bounce" fill="currentColor" />
                      <div className="text-3xl mb-1">{topPlayers[0].avatarId}</div>
                    </div>
                    <div className="w-full bg-gold-500/20 border border-gold-500/40 h-20 rounded-t-lg flex flex-col items-center justify-center relative">
                      <span className="text-base font-black text-gold-500 leading-none">{topPlayers[0].score}</span>
                      <span className="text-[8px] font-impact text-gold-500/60 uppercase">pts</span>
                      <div className="absolute -bottom-5 w-full text-center">
                        <span className="text-[8px] font-mono text-gold-400 uppercase truncate px-1 font-bold">{topPlayers[0].pseudo}</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* 3rd */}
                {topPlayers[2] && (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-2xl mb-1">{topPlayers[2].avatarId}</div>
                    <div className="w-full bg-orange-900/20 border border-white/10 h-10 rounded-t-lg flex flex-col items-center justify-center relative">
                      <Medal className="w-3 h-3 text-orange-400/60 mb-0.5" />
                      <span className="text-[11px] font-black text-white leading-none">{topPlayers[2].score}</span>
                      <div className="absolute -bottom-5 w-full text-center">
                        <span className="text-[7px] font-mono text-slate-500 uppercase truncate px-1">{topPlayers[2].pseudo}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">The Bingo Crawl</span>
            </div>
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
            <div className="w-6 h-6 border-4 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" />
          ) : (
            <>
              <Share2 className="w-6 h-6" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MissionReport;
