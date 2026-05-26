
import React, { useRef, useState, useEffect } from 'react';
import { Share2, ArrowLeft, Trophy, Star, Users, Medal } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useLanguage } from '../contexts/LanguageContext';
import { BingoCellData, CellStatus, Badge, LeaderboardEntry } from '../types';
import { gameService } from '../services/gameService';
import { BADGE_CONFIG } from '../constants';
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
const getRank = (score: number) => RANK_CONFIG.find(r => score >= r.min)!;

const MEDALS = ['🥇', '🥈', '🥉'];
const FLAG: Record<string, string> = {
  FR: '🇫🇷', US: '🇺🇸', GB: '🇬🇧', ES: '🇪🇸', DE: '🇩🇪',
  IT: '🇮🇹', PT: '🇵🇹', BR: '🇧🇷', CA: '🇨🇦', JP: '🇯🇵',
};

type Tab = 'SOIREE' | 'CLASSEMENT' | 'BADGES';

const MissionReport: React.FC<MissionReportProps> = ({
  nickname, avatarId, country, cells, badges, startedAt, onBack,
}) => {
  const { language } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [tab, setTab] = useState<Tab>('SOIREE');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const score = cells.filter(c => c.status === CellStatus.VALIDATED).length;
  const rank = getRank(score);
  const duration = startedAt ? Math.floor((Date.now() - startedAt) / 60000) : 0;
  const lines = Math.floor(score / 5);
  const pct = Math.round((score / 25) * 100);
  const isMe = (pseudo: string) => pseudo === nickname;

  useEffect(() => {
    if (tab !== 'CLASSEMENT' || leaderboard.length > 0) return;
    setLeaderboardLoading(true);
    gameService.getLeaderboard()
      .then(data => setLeaderboard(data))
      .catch(() => {})
      .finally(() => setLeaderboardLoading(false));
  }, [tab, leaderboard.length]);

  // Also pre-fetch for the card top-3
  const [top3, setTop3] = useState<LeaderboardEntry[]>([]);
  useEffect(() => {
    gameService.getLeaderboard().then(d => setTop3(d.slice(0, 3))).catch(() => {});
  }, []);

  const captureImage = async (): Promise<{ blob: Blob; file: File } | null> => {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#0A1629',
      scale: 3,
      logging: false,
      useCORS: true,
    });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;
    const file = new File([blob], `bingo-crawl-${nickname}.png`, { type: 'image/png' });
    return { blob, file };
  };

  const saveImageToGallery = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bingo-crawl-${nickname}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const result = await captureImage();
      if (!result) return;
      const { blob, file } = result;
      const shareText = language === 'fr'
        ? `${nickname} — ${score}/25 défis complétés ${rank.emoji} #BingoCrawl #TheBingoCrawl`
        : `${nickname} — ${score}/25 challenges done ${rank.emoji} #BingoCrawl #TheBingoCrawl`;
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'The Bingo Crawl', text: shareText });
      } else {
        saveImageToGallery(blob);
      }
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareInstagram = async () => {
    setIsSharing(true);
    try {
      const result = await captureImage();
      if (!result) return;
      const { blob, file } = result;
      // Try native share first (shows Instagram in share sheet on iOS/Android)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'The Bingo Crawl' });
      } else {
        // Save to gallery, then open Instagram
        saveImageToGallery(blob);
        setTimeout(() => { window.location.href = 'instagram://app'; }, 800);
      }
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const TAB_LABELS: Record<Tab, string> = {
    SOIREE: language === 'fr' ? 'MA SOIRÉE' : 'MY NIGHT',
    CLASSEMENT: language === 'fr' ? 'CLASSEMENT' : 'RANKINGS',
    BADGES: language === 'fr' ? 'BADGES' : 'BADGES',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A1629] flex flex-col overflow-hidden animate-in fade-in duration-400">

      {/* ── Header ── */}
      <div className="shrink-0 px-4 pt-4 pb-3 flex items-center justify-between z-20 border-b-[3px] border-black" style={{ backgroundColor: rank.color }}>
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-black/20 border-2 border-black flex items-center justify-center text-black active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={3} />
        </button>
        <span className="font-impact uppercase text-[13px] tracking-[0.3em] text-black">
          {rank.emoji} {language === 'fr' ? 'FIN DE SOIRÉE' : 'NIGHT OVER'} {rank.emoji}
        </span>
        <div className="w-10" />
      </div>

      {/* ── Tabs ── */}
      <div className="shrink-0 flex px-4 pt-3 gap-2 z-20">
        {(['SOIREE', 'CLASSEMENT', 'BADGES'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl font-impact text-[10px] uppercase tracking-widest border-[2px] transition-all ${
              tab === t
                ? 'border-black shadow-[3px_3px_0px_black] text-black'
                : 'border-white/10 text-white/40 bg-transparent'
            }`}
            style={tab === t ? { backgroundColor: rank.color } : {}}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">

        {/* ── SOIRÉE tab ── */}
        {tab === 'SOIREE' && (
          <div className="px-4 pt-4 pb-36 flex flex-col gap-4">

            {/* Shareable card */}
            <div
              ref={cardRef}
              className="rounded-[24px] border-[4px] border-black shadow-[8px_8px_0px_black] overflow-hidden"
              style={{ backgroundColor: '#0A1629' }}
            >
              {/* Rank band */}
              <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${rank.color} 0%, ${rank.bg || '#0A1629'} 100%)` }}>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="font-impact text-[10px] uppercase tracking-[0.25em] px-3 py-1 rounded-lg border-[2px] border-black shadow-[2px_2px_0px_black]"
                    style={{ backgroundColor: rank.color, color: '#000' }}
                  >
                    {rank.emoji} {rank.label}
                  </span>
                  <span className="font-impact text-[10px] text-white/30 uppercase tracking-widest">BINGO CRAWL</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
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
                      {FLAG[country] || '🌍'} {country || 'FR'} · {language === 'fr' ? `${duration} min` : `${duration} min`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="px-5 py-4 bg-[#0A1629] border-t-[3px] border-black">
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <span className="font-impact text-[10px] text-white/30 uppercase tracking-[0.2em]">
                      {language === 'fr' ? 'Score final' : 'Final score'}
                    </span>
                    <div className="flex items-baseline gap-1 leading-none mt-0.5">
                      <span className="font-impact italic" style={{ fontSize: '64px', lineHeight: 1, color: rank.color }}>{score}</span>
                      <span className="font-impact text-2xl text-white/30 italic">/25</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                      <Trophy className="w-3.5 h-3.5" style={{ color: rank.color }} />
                      <span className="font-impact text-[11px] uppercase tracking-tight text-white">{lines} {language === 'fr' ? 'ligne' : 'line'}{lines !== 1 ? 's' : ''}</span>
                    </div>
                    {badges.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                        <span className="text-[13px] leading-none">🏅</span>
                        <span className="font-impact text-[11px] uppercase tracking-tight text-white">{badges.length} badge{badges.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full border-2 border-black overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: rank.color }} />
                </div>
                <span className="font-impact text-[9px] text-white/20 uppercase tracking-widest mt-1 block">{pct}% {language === 'fr' ? 'de la grille' : 'of the grid'}</span>
              </div>

              {/* Mini grid */}
              <div className="px-5 pb-4 bg-[#0A1629]">
                <span className="font-impact text-[8px] text-white/20 uppercase tracking-[0.3em] mb-2 block">
                  {language === 'fr' ? 'Ta grille' : 'Your grid'}
                </span>
                <div className="grid grid-cols-5 gap-[3px]">
                  {cells.map((cell) => (
                    <div
                      key={cell.id}
                      className="h-8 rounded-[4px] border border-black flex items-center justify-center"
                      style={{
                        backgroundColor: cell.status === CellStatus.VALIDATED ? rank.color : '#1A1A2E',
                        opacity: cell.status === CellStatus.VALIDATED ? 1 : 0.3,
                      }}
                    >
                      {cell.status === CellStatus.VALIDATED && <div className="w-2 h-2 rounded-full bg-black/40" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges row (max 4) */}
              {badges.length > 0 && (
                <div className="px-5 pb-4 bg-[#0A1629] border-t border-white/5">
                  <span className="font-impact text-[8px] text-white/20 uppercase tracking-[0.3em] mb-2 block mt-3">
                    {language === 'fr' ? 'Badges gagnés' : 'Earned badges'}
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {badges.slice(0, 4).map((b) => {
                      const cfg = BADGE_CONFIG[b.badge_type];
                      return (
                        <div
                          key={b.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_black]"
                          style={{ background: `linear-gradient(135deg, ${cfg.gradient[0]}, ${cfg.gradient[1]})` }}
                        >
                          <span className="text-base leading-none">{cfg.emoji}</span>
                          <span className="font-impact text-[9px] text-black uppercase tracking-tight">{cfg.name}</span>
                        </div>
                      );
                    })}
                    {badges.length > 4 && (
                      <div className="flex items-center px-2.5 py-1.5 rounded-xl border-[2px] border-white/10 bg-white/5">
                        <span className="font-impact text-[9px] text-white/40 uppercase tracking-tight">+{badges.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Top 3 */}
              {top3.length > 0 && (
                <div className="px-5 pb-5 bg-[#0A1629] border-t border-white/5">
                  <span className="font-impact text-[8px] text-white/20 uppercase tracking-[0.3em] mb-3 block mt-4">
                    {language === 'fr' ? 'Top soirée' : 'Top tonight'}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {top3.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl border-2 border-black"
                        style={{ backgroundColor: isMe(p.pseudo) ? rank.color : '#1A1A2E', boxShadow: isMe(p.pseudo) ? '3px 3px 0px black' : 'none' }}
                      >
                        <span className="text-base leading-none">{MEDALS[i]}</span>
                        <span className={`font-impact text-[11px] uppercase tracking-tight flex-1 ${isMe(p.pseudo) ? 'text-black' : 'text-white/60'}`}>{p.pseudo}</span>
                        <span className={`font-impact text-[13px] ${isMe(p.pseudo) ? 'text-black' : 'text-white'}`}>{p.score}<span className="text-[9px] opacity-50">/25</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-5 py-3.5 bg-[#050D1A] flex items-center justify-between border-t-[3px] border-black">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: rank.color }} />
                  <span className="font-impact text-[10px] uppercase tracking-[0.3em] text-white/50">THE BINGO CRAWL</span>
                </div>
                <span className="font-impact text-[9px] text-white/20 uppercase tracking-widest">#BingoCrawl</span>
              </div>
            </div>

            {/* Share success toast */}
            <div className={`transition-all duration-300 ${shareSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="flex items-center gap-2.5 bg-[#00F5A0]/10 border border-[#00F5A0]/30 rounded-2xl px-4 py-3">
                <span className="text-xl">📸</span>
                <span className="font-impact text-[#00F5A0] text-[11px] uppercase tracking-widest">
                  {language === 'fr' ? 'Prêt à partager !' : 'Ready to share!'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── CLASSEMENT tab ── */}
        {tab === 'CLASSEMENT' && (
          <div className="px-4 pt-4 pb-24">
            {leaderboardLoading && leaderboard.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-[3px] border-[#FFD700]/30 border-t-[#FFD700] rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Podium top 3 */}
                {leaderboard.length >= 3 && (
                  <div className="mb-6">
                    <p className="font-impact text-[9px] uppercase tracking-[0.3em] text-[#FFD700] text-center mb-5">
                      {language === 'fr' ? '🏆 LÉGENDES DE LA SOIRÉE' : '🏆 LEGENDS OF THE NIGHT'}
                    </p>
                    <div className="flex items-end justify-center gap-2 h-32 px-2">
                      {/* 2nd */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-2xl mb-1">{leaderboard[1]?.avatarId}</div>
                        <div
                          className={`w-full rounded-t-xl border-[2px] border-black flex flex-col items-center justify-end pb-2 h-20 ${isMe(leaderboard[1]?.pseudo) ? 'shadow-[3px_3px_0px_black]' : ''}`}
                          style={{ backgroundColor: isMe(leaderboard[1]?.pseudo) ? rank.color : '#1A1A2E' }}
                        >
                          <Medal className={`w-4 h-4 mb-1 ${isMe(leaderboard[1]?.pseudo) ? 'text-black' : 'text-white/50'}`} />
                          <span className={`font-impact text-[11px] italic ${isMe(leaderboard[1]?.pseudo) ? 'text-black' : 'text-white'}`}>{leaderboard[1]?.score}</span>
                        </div>
                        <span className={`font-impact text-[8px] uppercase mt-1 truncate w-full text-center ${isMe(leaderboard[1]?.pseudo) ? 'text-white' : 'text-white/40'}`}>{leaderboard[1]?.pseudo}</span>
                      </div>
                      {/* 1st */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-3xl mb-1">{leaderboard[0]?.avatarId}</div>
                        <div
                          className={`w-full rounded-t-xl border-[2px] border-black flex flex-col items-center justify-end pb-2 h-28 ${isMe(leaderboard[0]?.pseudo) ? 'shadow-[4px_4px_0px_black]' : ''}`}
                          style={{ backgroundColor: isMe(leaderboard[0]?.pseudo) ? rank.color : '#FFD700' + '22' }}
                        >
                          <span className="text-xl mb-0.5">👑</span>
                          <span className={`font-impact text-[13px] italic ${isMe(leaderboard[0]?.pseudo) ? 'text-black' : 'text-[#FFD700]'}`}>{leaderboard[0]?.score}</span>
                        </div>
                        <span className={`font-impact text-[8px] uppercase mt-1 truncate w-full text-center ${isMe(leaderboard[0]?.pseudo) ? 'text-[#FFD700]' : 'text-[#FFD700]/80'}`}>{leaderboard[0]?.pseudo}</span>
                      </div>
                      {/* 3rd */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-2xl mb-1">{leaderboard[2]?.avatarId}</div>
                        <div
                          className={`w-full rounded-t-xl border-[2px] border-black flex flex-col items-center justify-end pb-2 h-14 ${isMe(leaderboard[2]?.pseudo) ? 'shadow-[3px_3px_0px_black]' : ''}`}
                          style={{ backgroundColor: isMe(leaderboard[2]?.pseudo) ? rank.color : '#FF8C00' + '22' }}
                        >
                          <span className={`font-impact text-[11px] italic ${isMe(leaderboard[2]?.pseudo) ? 'text-black' : 'text-[#FF8C00]'}`}>{leaderboard[2]?.score}</span>
                        </div>
                        <span className={`font-impact text-[8px] uppercase mt-1 truncate w-full text-center ${isMe(leaderboard[2]?.pseudo) ? 'text-white' : 'text-white/40'}`}>{leaderboard[2]?.pseudo}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full list */}
                <div className="flex flex-col gap-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 px-3 py-3 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] ${isMe(entry.pseudo) ? 'bg-[#00FF9D]' : 'bg-white'} text-black`}
                    >
                      <div className="w-9 h-9 shrink-0 bg-black text-white rounded-lg flex items-center justify-center font-impact text-lg italic">
                        {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                      </div>
                      <div className="text-2xl shrink-0">{entry.avatarId}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-impact uppercase text-sm tracking-tighter truncate leading-none">
                          {entry.pseudo}
                          {isMe(entry.pseudo) && (
                            <span className="ml-1 text-[8px] bg-black text-white px-1 py-0.5 rounded uppercase">
                              {language === 'fr' ? 'toi' : 'you'}
                            </span>
                          )}
                        </div>
                        <div className="text-[8px] font-impact uppercase tracking-widest text-black/40 mt-0.5">
                          {FLAG[entry.country || 'FR'] || '🌍'} {entry.country || 'FR'}
                        </div>
                      </div>
                      <span className="font-impact text-2xl italic leading-none">{entry.score}</span>
                    </div>
                  ))}
                </div>

                {leaderboard.length === 0 && !leaderboardLoading && (
                  <div className="flex flex-col items-center py-16 gap-3 text-center">
                    <div className="text-5xl">🏜️</div>
                    <p className="font-impact uppercase text-white/40 text-sm tracking-widest">
                      {language === 'fr' ? 'Aucun joueur pour l\'instant' : 'No players yet'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── BADGES tab ── */}
        {tab === 'BADGES' && (
          <div className="px-4 pt-4 pb-24">
            {badges.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-4 text-center">
                <div className="text-6xl">🎖️</div>
                <p className="font-impact uppercase text-white/40 text-sm tracking-widest">
                  {language === 'fr' ? 'Aucun badge cette soirée' : 'No badges tonight'}
                </p>
                <p className="font-impact text-[9px] uppercase text-white/20 tracking-widest max-w-[220px] leading-relaxed">
                  {language === 'fr' ? 'Complete plus de défis pour en débloquer' : 'Complete more challenges to unlock some'}
                </p>
              </div>
            ) : (
              <>
                <p className="font-impact text-[9px] uppercase tracking-[0.3em] text-white/30 text-center mb-5">
                  {badges.length} badge{badges.length > 1 ? 's' : ''} {language === 'fr' ? 'débloqué' : 'unlocked'}{badges.length > 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {badges.map((b) => {
                    const cfg = BADGE_CONFIG[b.badge_type];
                    const unlockedTime = new Date(b.unlocked_at).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={b.id}
                        className="rounded-[20px] border-[3px] border-black shadow-[5px_5px_0px_black] overflow-hidden"
                      >
                        <div
                          className="px-4 py-5 flex flex-col items-center gap-2"
                          style={{ background: `linear-gradient(145deg, ${cfg.gradient[0]}, ${cfg.gradient[1]})` }}
                        >
                          <span className="text-[48px] leading-none">{cfg.emoji}</span>
                          <div className="text-center">
                            <p className="font-impact text-[15px] uppercase tracking-tight text-black leading-none">{cfg.name}</p>
                          </div>
                        </div>
                        <div className="bg-[#0D1525] px-3 py-2 flex items-center justify-between">
                          <span className="font-impact text-[8px] uppercase tracking-widest text-white/30">
                            {language === 'fr' ? 'Débloqué' : 'Unlocked'}
                          </span>
                          <span className="font-impact text-[9px] text-white/50">{unlockedTime}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* All available badges (locked) */}
                {Object.entries(BADGE_CONFIG).filter(([key]) => !badges.some(b => b.badge_type === key)).length > 0 && (
                  <>
                    <div className="flex items-center gap-3 my-5 px-1">
                      <div className="h-px flex-1 bg-white/8" />
                      <span className="font-impact text-[8px] uppercase tracking-[0.2em] text-white/20">
                        {language === 'fr' ? 'Pas encore débloqués' : 'Not yet unlocked'}
                      </span>
                      <div className="h-px flex-1 bg-white/8" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(BADGE_CONFIG).filter(([key]) => !badges.some(b => b.badge_type === key)).map(([key, cfg]) => (
                        <div
                          key={key}
                          className="rounded-2xl border-[2px] border-white/[8%] bg-white/5 px-3 py-4 flex flex-col items-center gap-1.5 opacity-40"
                        >
                          <span className="text-[32px] leading-none grayscale">{cfg.emoji}</span>
                          <span className="font-impact text-[8px] uppercase tracking-tight text-white/40 text-center leading-tight">{cfg.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Share button (fixed, SOIRÉE tab only) ── */}
      {tab === 'SOIREE' && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-[#0A1629] via-[#0A1629]/95 to-transparent z-50">
          <div className="flex gap-2">
            <button
              onClick={handleShareInstagram}
              disabled={isSharing}
              className="flex-1 font-impact text-xl uppercase py-4 rounded-[16px] border-[3px] border-black shadow-[5px_5px_0px_black] flex items-center justify-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
              style={{ backgroundColor: rank.color, color: '#000' }}
            >
              {isSharing ? (
                <div className="w-5 h-5 border-[3px] border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-xl leading-none">📸</span>
                  Instagram
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-14 py-4 rounded-[16px] border-[3px] border-black shadow-[5px_5px_0px_black] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 bg-white/10"
            >
              <Share2 className="w-5 h-5 text-white" strokeWidth={3} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-center font-impact text-[9px] text-white/20 uppercase tracking-widest">
              {language === 'fr' ? 'L\'image est sauvegardée dans ta galerie' : 'Image saved to your gallery'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionReport;
