
import React, { useRef, useState, useEffect } from 'react';
import { Share2, ArrowLeft, Trophy, Zap, Star } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useLanguage } from '../contexts/LanguageContext';
import { BingoCellData, CellStatus, Badge } from '../types';
import { gameService } from '../services/gameService';
import Avatar from './Avatar';

interface MissionReportProps {
  nickname: string;
  avatarId: string;
  country: string;
  cells: BingoCellData[];
  badges: Badge[];
  photoProofs?: Record<number, string>;
  startedAt: number;
  onBack: () => void;
  onReset?: () => void;
}

const RANK_CONFIG = [
  { min: 25, label: 'LÉGENDAIRE', color: '#FFD700', bg: '#1A1200', emoji: '👑' },
  { min: 20, label: 'ÉLITE',       color: '#00F5A0', bg: '#001A10', emoji: '🔥' },
  { min: 15, label: 'VÉTÉRAN',    color: '#FF8C00', bg: '#1A0800', emoji: '⚡' },
  { min: 10, label: 'OPÉRATIONNEL', color: '#FF2D6A', bg: '#1A0010', emoji: '💪' },
  { min: 5,  label: 'RECRUE',     color: '#00B4D8', bg: '#001020', emoji: '🎯' },
  { min: 0,  label: 'ROOKIE',     color: '#6B7280', bg: '#111827', emoji: '🍺' },
];

const getRankConfig = (score: number) => RANK_CONFIG.find(r => score >= r.min)!;

const MissionReport: React.FC<MissionReportProps> = ({
  nickname,
  avatarId,
  country,
  cells,
  badges,
  photoProofs = {},
  startedAt,
  onBack,
}) => {
  const { t, language } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topPlayers, setTopPlayers] = useState<Array<{ pseudo: string; score: number; avatarId: string }>>([]);

  useEffect(() => {
    gameService.getLeaderboard().then(data => setTopPlayers(data.slice(0, 3))).catch(() => {});
  }, []);

  const score = cells.filter(c => c.status === CellStatus.VALIDATED).length;
  const rank = getRankConfig(score);
  const duration = startedAt ? Math.floor((Date.now() - startedAt) / 60000) : 0;
  const lines = Math.floor(score / 5);
  const pct = Math.round((score / 25) * 100);

  const handleShare = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0A1629',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;
      const file = new File([blob], `bingo-crawl-${nickname}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Bingo Crawl',
          text: language === 'fr'
            ? `${nickname} — ${score}/25 défis complétés 🎯 #BingoCrawl`
            : `${nickname} — ${score}/25 challenges done 🎯 #BingoCrawl`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bingo-crawl-${nickname}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A1629] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-400">

      {/* Header */}
      <div className="shrink-0 px-4 py-3 flex items-center justify-between z-20">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white/5 border-2 border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={3} />
        </button>
        <span className="font-impact uppercase text-[11px] tracking-[0.3em] text-white/40">
          {language === 'fr' ? 'RAPPORT DE SOIRÉE' : 'NIGHT REPORT'}
        </span>
        <div className="w-10" />
      </div>

      {/* Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-36 no-scrollbar">

        {/* ───────── SHAREABLE CARD ───────── */}
        <div
          ref={reportRef}
          className="rounded-[28px] border-[4px] border-black shadow-[8px_8px_0px_black] overflow-hidden"
          style={{ backgroundColor: '#0A1629' }}
        >
          {/* Top band — rank color */}
          <div className="px-6 pt-6 pb-4" style={{ backgroundColor: rank.bg }}>
            <div className="flex items-center justify-between mb-4">
              <span
                className="font-impact text-[10px] uppercase tracking-[0.3em] px-3 py-1 rounded-lg border-[2px] border-black shadow-[2px_2px_0px_black]"
                style={{ backgroundColor: rank.color, color: '#000' }}
              >
                {rank.emoji} {rank.label}
              </span>
              <span className="font-impact text-[10px] text-white/30 uppercase tracking-widest">BINGO CRAWL</span>
            </div>

            {/* Player block */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar seed={avatarId} size={72} className="rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black]" />
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0px_black]"
                  style={{ backgroundColor: rank.color }}
                >
                  <Star className="w-3 h-3 text-black" fill="currentColor" />
                </div>
              </div>
              <div>
                <h2 className="font-impact text-3xl text-white uppercase tracking-tight italic leading-none">{nickname}</h2>
                <p className="font-impact text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: rank.color }}>
                  {country || 'FR'} · {language === 'fr' ? `${duration} min de jeu` : `${duration} min played`}
                </p>
              </div>
            </div>
          </div>

          {/* Score hero */}
          <div className="px-6 py-5 bg-[#0A1629] border-t-[3px] border-black">
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="font-impact text-[11px] text-white/30 uppercase tracking-[0.2em]">
                  {language === 'fr' ? 'Score final' : 'Final score'}
                </span>
                <div className="flex items-baseline gap-1 leading-none mt-1">
                  <span className="font-impact italic" style={{ fontSize: '72px', lineHeight: 1, color: rank.color }}>{score}</span>
                  <span className="font-impact text-3xl text-white/30 italic">/25</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                  <Trophy className="w-3.5 h-3.5" style={{ color: rank.color }} />
                  <span className="font-impact text-[11px] uppercase tracking-tight text-white">{lines} {language === 'fr' ? 'ligne' : 'line'}{lines !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#FF2D6A]" />
                  <span className="font-impact text-[11px] uppercase tracking-tight text-white">{badges.length} badge{badges.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-white/5 rounded-full border-2 border-black overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: rank.color }}
              />
            </div>
            <span className="font-impact text-[9px] text-white/20 uppercase tracking-widest mt-1 block">{pct}% {language === 'fr' ? 'de la grille' : 'of the grid'}</span>
          </div>

          {/* Mini bingo grid */}
          <div className="px-6 pb-5 bg-[#0A1629]">
            <span className="font-impact text-[9px] text-white/20 uppercase tracking-[0.3em] mb-2 block">
              {language === 'fr' ? 'Ta grille' : 'Your grid'}
            </span>
            <div className="grid grid-cols-5 gap-[3px]">
              {cells.map((cell) => (
                <div
                  key={cell.id}
                  className="h-8 rounded-[4px] border border-black flex items-center justify-center"
                  style={{
                    backgroundColor: cell.status === CellStatus.VALIDATED
                      ? rank.color
                      : cell.id === 12
                      ? '#1A1A2E'
                      : '#1A1A2E',
                    opacity: cell.status === CellStatus.VALIDATED ? 1 : 0.3,
                  }}
                >
                  {cell.status === CellStatus.VALIDATED && (
                    <div className="w-2 h-2 rounded-full bg-black/40" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 */}
          {topPlayers.length > 0 && (
            <div className="px-6 pb-5 bg-[#0A1629] border-t border-white/5">
              <span className="font-impact text-[9px] text-white/20 uppercase tracking-[0.3em] mb-3 block mt-4">
                {language === 'fr' ? 'Top soirée' : 'Top tonight'}
              </span>
              <div className="flex flex-col gap-1.5">
                {topPlayers.map((p, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const isMe = p.pseudo === nickname;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl border-2 border-black ${isMe ? 'shadow-[3px_3px_0px_black]' : ''}`}
                      style={{ backgroundColor: isMe ? rank.color : '#1A1A2E' }}
                    >
                      <span className="text-base leading-none">{medals[i]}</span>
                      <span className={`font-impact text-[11px] uppercase tracking-tight flex-1 ${isMe ? 'text-black' : 'text-white/60'}`}>{p.pseudo}</span>
                      <span className={`font-impact text-[13px] ${isMe ? 'text-black' : 'text-white'}`}>{p.score}<span className="text-[9px] opacity-50">/25</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photo proofs */}
          {Object.keys(photoProofs).length > 0 && (
            <div className="px-6 pb-5 bg-[#0A1629] border-t border-white/5">
              <span className="font-impact text-[9px] text-white/20 uppercase tracking-[0.3em] mb-3 block mt-4">
                {language === 'fr' ? 'Mes preuves 📸' : 'My proofs 📸'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(photoProofs).slice(0, 6).map(([cellId, url]) => (
                  <div key={cellId} className="aspect-square rounded-xl overflow-hidden border-2 border-black">
                    <img src={url} alt={`proof ${cellId}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer branding */}
          <div className="px-6 py-4 bg-[#050D1A] flex items-center justify-between border-t-[3px] border-black">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: rank.color }} />
              <span className="font-impact text-[10px] uppercase tracking-[0.3em] text-white/50">THE BINGO CRAWL</span>
            </div>
            <span className="font-impact text-[9px] text-white/20 uppercase tracking-widest">bingocrawl.fr</span>
          </div>
        </div>

      </div>

      {/* Share button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0A1629] via-[#0A1629]/95 to-transparent z-50">
        <button
          onClick={handleShare}
          disabled={isGenerating}
          className="w-full font-impact text-xl uppercase py-4 rounded-[16px] border-[3px] border-black shadow-[5px_5px_0px_black] flex items-center justify-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
          style={{ backgroundColor: rank.color, color: '#000' }}
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-[3px] border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Share2 className="w-5 h-5" strokeWidth={3} />
              {language === 'fr' ? 'Partager ma soirée' : 'Share my night'}
            </>
          )}
        </button>
        <p className="text-center font-impact text-[9px] text-white/20 uppercase tracking-widest mt-2">
          {language === 'fr' ? 'Enregistre ou partage en story' : 'Save or share as story'}
        </p>
      </div>
    </div>
  );
};

export default MissionReport;
