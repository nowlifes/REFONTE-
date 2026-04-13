
import React, { useState, useRef, useEffect } from 'react';
import { Trophy, Crown, Settings, Sparkles, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppView, BingoCellData, TauntType } from '../types';
import BingoCell from './BingoCell';
import QRScanner from './QRScanner';
import ValidationModal from './ValidationModal';
import LegendsModal from './LegendsModal';
import NFTBadgeModal from './NFTBadgeModal';
import BackgroundParticles from './BackgroundParticles';
import Avatar from './Avatar';
import NetworkStatus from './NetworkStatus';
import BadgeNotification from './BadgeNotification';
import ActivityFeed from './ActivityFeed';
import ChallengeRevealSheet from './ChallengeRevealSheet';
import IceBlockOverlay from './IceBlockOverlay';
import TinyTargetOverlay from './TinyTargetOverlay';
import BlobOverlay from './BlobOverlay';
import FlashlightOverlay from './FlashlightOverlay';
import WitnessRequestBanner from './WitnessRequestBanner';
import EditProfileSheet from './EditProfileSheet';

interface GamePageProps {
  state: any;
  actions: any;
  ui: any;
  uiActions: any;
  tutorialActions?: any;
  onTutorialNext?: () => void;
  onCrownClick?: () => void;
  onPhotoProof?: (cellId: number, url: string) => void;
  secureSessionId?: string | null;
  challengeCooldownSecs?: number;
  isGamePaused?: boolean;
  chaosMode?: boolean;
  currentBar?: number;
  barCadence?: string;
}

const GamePage: React.FC<GamePageProps> = ({ state: s, actions: a, ui, uiActions: uia, onCrownClick, onPhotoProof, secureSessionId, challengeCooldownSecs = 0, isGamePaused = false, chaosMode = false, currentBar = 1, barCadence = '1,2,2' }) => {
  const [freezeSecondsLeft, setFreezeSecondsLeft] = useState(0);
  const [revealedCell, setRevealedCell] = useState<import('../types').BingoCellData | null>(null);
  const [spotlightSecondsLeft, setSpotlightSecondsLeft] = useState(0);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Score count-up animation (#6)
  const [displayScore, setDisplayScore] = useState(s.score);
  const scoreAnimRef = useRef(s.score);
  useEffect(() => {
    if (s.score === scoreAnimRef.current) return;
    const target = s.score;
    let current = scoreAnimRef.current;
    scoreAnimRef.current = target;
    const step = () => {
      current = Math.min(current + 1, target);
      setDisplayScore(current);
      if (current < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [s.score]);

  // Progressive unlock detection
  // Stage 1 — corners (ids 0,4,20,24) unlock at score 3
  // Stage 2 — center (id 12) unlocks at score 5
  const CORNER_IDS = [0, 4, 20, 24];
  const CORNER_UNLOCK_SCORE = 3;
  const CENTER_UNLOCK_SCORE = 5;

  const prevScoreRef = useRef(s.score);
  const [cornersUnlocking, setCornersUnlocking] = useState(false);
  const [mysteryUnlocking, setMysteryUnlocking] = useState(false);

  useEffect(() => {
    const prev = prevScoreRef.current;
    // Corners just unlocked
    if (prev < CORNER_UNLOCK_SCORE && s.score >= CORNER_UNLOCK_SCORE) {
      setCornersUnlocking(true);
      if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
      setTimeout(() => setCornersUnlocking(false), 800);
    }
    // Center just unlocked
    if (prev < CENTER_UNLOCK_SCORE && s.score >= CENTER_UNLOCK_SCORE) {
      setMysteryUnlocking(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
      setTimeout(() => setMysteryUnlocking(false), 800);
    }
    prevScoreRef.current = s.score;
  }, [s.score]);

  const isCornersLocked = s.score < CORNER_UNLOCK_SCORE;
  const isMysteryCellLocked = s.score < CENTER_UNLOCK_SCORE;

  useEffect(() => {
    if (!s.frozenUntil) return;
    const update = () => {
      const left = Math.ceil((s.frozenUntil - Date.now()) / 1000);
      setFreezeSecondsLeft(Math.max(0, left));
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [s.frozenUntil]);

  // Spotlight countdown
  useEffect(() => {
    if (!s.spotlightEndsAt) return;
    const update = () => setSpotlightSecondsLeft(Math.max(0, Math.ceil((s.spotlightEndsAt! - Date.now()) / 1000)));
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [s.spotlightEndsAt]);

  const { t, language, setLanguage } = useLanguage();
  const isFever = s.feverCells.length > 0;

  // Cadence cooldown — track last validation time and remaining cooldown
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);
  const lastValidationTimeRef = useRef(0);
  useEffect(() => {
    if (!challengeCooldownSecs || challengeCooldownSecs <= 0) { setCooldownSecondsLeft(0); return; }
    const update = () => {
      const elapsed = (Date.now() - lastValidationTimeRef.current) / 1000;
      const left = Math.max(0, Math.ceil(challengeCooldownSecs - elapsed));
      setCooldownSecondsLeft(left);
    };
    const iv = setInterval(update, 500);
    update();
    return () => clearInterval(iv);
  }, [challengeCooldownSecs, s.score]); // re-run on score change to reset cooldown timer

  const handleValidateCell = (data?: any) => {
    if (challengeCooldownSecs > 0 && cooldownSecondsLeft > 0) return; // blocked by cooldown
    lastValidationTimeRef.current = Date.now();
    if (data?.proofImage && s.selectedCell) onPhotoProof?.(s.selectedCell.id, data.proofImage);
    a.validateCell(data);
  };

  // Line completion celebration — auto-dismiss after 3s
  const lineEventTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!s.lineCompleteEvent) return;
    if (lineEventTimerRef.current) clearTimeout(lineEventTimerRef.current);
    lineEventTimerRef.current = setTimeout(() => { a.clearLineCompleteEvent(); }, 3000);
    return () => { if (lineEventTimerRef.current) clearTimeout(lineEventTimerRef.current); };
  }, [s.lineCompleteEvent]);

  const LINE_ORDINALS_FR = ['1ÈRE', '2ÈME', '3ÈME', '4ÈME', '5ÈME', '6ÈME', '7ÈME', '8ÈME', '9ÈME', '10ÈME', '11ÈME', '12ÈME'];
  const LINE_ORDINALS_EN = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH'];
  
  const crownTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const crownIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pressStartTimeRef = React.useRef<number>(0);
  const [isCrownPressing, setIsCrownPressing] = React.useState(false);
  const [crownProgress, setCrownProgress] = React.useState(0);

  const startCrownPress = (e: React.SyntheticEvent) => {
    if (!onCrownClick) return;
    
    pressStartTimeRef.current = Date.now();
    setIsCrownPressing(true);
    setCrownProgress(0);
    
    let progress = 0;
    crownIntervalRef.current = setInterval(() => {
      progress += 1;
      setCrownProgress(progress);
      if (navigator.vibrate) navigator.vibrate(20);
      
      if (progress >= 3) {
        if (crownIntervalRef.current) clearInterval(crownIntervalRef.current);
        crownIntervalRef.current = null;
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        onCrownClick();
        setIsCrownPressing(false);
        setCrownProgress(0);
      }
    }, 1000);
  };

  const endCrownPress = () => {
    setIsCrownPressing(false);
    setCrownProgress(0);
    if (crownIntervalRef.current) {
      clearInterval(crownIntervalRef.current);
      crownIntervalRef.current = null;
    }
  };

  const handleCrownClick = (e: React.MouseEvent) => {
    const pressDuration = Date.now() - pressStartTimeRef.current;
    // If it was a long press (more than 1s), don't show badges
    if (pressDuration > 1000) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    uia.setShowBadge(true);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const [isResetPressing, setIsResetPressing] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setShowResetConfirm(true);
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
    <div className={`fixed inset-0 bg-[#0A1629] text-white flex flex-col items-center overflow-hidden ${chaosMode ? 'ring-[8px] ring-inset ring-[#FF4500]' : isFever ? 'ring-[8px] ring-inset ring-[#FF2D6A] transition-all duration-500' : ''}`}>
      {/* PAUSE OVERLAY */}
      {isGamePaused && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#0A1629]/95 animate-in fade-in duration-300">
          <div className="bg-[#111C35] border-[4px] border-[#FFD700] rounded-3xl p-10 shadow-[8px_8px_0px_black] text-center max-w-xs w-full mx-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FFD700]/15 border-[3px] border-[#FFD700] flex items-center justify-center">
              <span className="text-3xl">⏸</span>
            </div>
            <h2 className="font-impact uppercase text-[#FFD700] text-2xl tracking-wider">Jeu en pause</h2>
            <p className="text-white/60 text-sm leading-relaxed">Le master a mis la partie en pause. Attends qu'elle reprenne.</p>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#FFD700] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ⚡ CHAOS MODE banner — sticky top strip */}
      {chaosMode && (
        <div className="fixed top-0 inset-x-0 z-[160] pointer-events-none">
          <div className="bg-gradient-to-r from-[#FF4500] via-[#FF8C00] to-[#FF4500] bg-[length:200%_100%] animate-[shimmer_1.5s_linear_infinite] py-1.5 text-center">
            <span className="font-impact uppercase text-black text-[11px] tracking-[0.35em]">⚡ MODE CHAOS — FONCE ⚡</span>
          </div>
        </div>
      )}

      <NetworkStatus />
      {/* Witness request banner — shown when another player designated us as witness */}
      {s.gameSession && (
        <WitnessRequestBanner playerId={localStorage.getItem('bingo_user_id') || ''} />
      )}
      <ActivityFeed />
      <BackgroundParticles />
      
      <BadgeNotification badge={s.newBadge} onClose={a.clearNewBadge} />

      {/* COMBO notification */}
      {s.comboActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[160] animate-in zoom-in-75 fade-in duration-300 pointer-events-none">
          <div className="bg-[#FF2D6A] border-[3px] border-black rounded-2xl px-5 py-3 shadow-[6px_6px_0px_black] flex items-center gap-2">
            <span className="text-white text-2xl">🔥</span>
            <div className="flex flex-col leading-none">
              <span className="font-impact text-white uppercase text-xl tracking-tight">COMBO !</span>
              <span className="font-impact text-white/70 uppercase text-[9px] tracking-widest">{language === 'fr' ? '+1 joker gagné' : '+1 joker earned'}</span>
            </div>
          </div>
        </div>
      )}

      {/* +1 TAUNT banner (spotlight bonus) */}
      {s.bonusTauntActive && !s.comboActive && (
        <div className="fixed top-[68px] left-4 z-[160] animate-in zoom-in-75 fade-in duration-300 pointer-events-none">
          <div className="bg-[#FF2D6A] border-[3px] border-black rounded-2xl px-4 py-2.5 shadow-[6px_6px_0px_black] flex items-center gap-2">
            <span className="text-xl">💥</span>
            <div className="flex flex-col leading-none">
              <span className="font-impact text-white uppercase text-lg tracking-tight">+1 TAUNT !</span>
              <span className="font-impact text-white/60 uppercase text-[9px] tracking-widest">{language === 'fr' ? 'Défi spotlight validé' : 'Spotlight challenge cleared'}</span>
            </div>
          </div>
        </div>
      )}

      {/* SPOTLIGHT banner — compact, near avatar top-left */}
      {s.spotlightCellId !== null && spotlightSecondsLeft > 0 && (
        <div className="fixed top-[68px] left-4 z-[155] pointer-events-none">
          <div className="bg-[#FFD700] border-[3px] border-black rounded-2xl px-3 py-2 shadow-[4px_4px_0px_black] flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
            <span className="text-base">⚡</span>
            <div className="flex flex-col leading-none">
              <span className="font-impact text-black uppercase text-[11px] tracking-tight">SPOTLIGHT</span>
              <span className="font-impact text-black/50 uppercase text-[8px] tracking-widest">
                {language === 'fr' ? 'Valide → +1 taunt' : 'Clear → +1 taunt'}
              </span>
            </div>
            <div className="bg-black/15 rounded-lg px-2 py-0.5 ml-1">
              <span className="font-impact text-black text-[11px]">
                {Math.floor(spotlightSecondsLeft / 60)}:{String(spotlightSecondsLeft % 60).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAUNT OVERLAYS — router selon tauntType */}
      {s.isFrozen && freezeSecondsLeft > 0 && (() => {
        switch (s.tauntType) {
          case TauntType.ICE_BLOCK:
            return <IceBlockOverlay secondsLeft={freezeSecondsLeft} onUnlocked={a.clearFreezeLocally} />;
          case TauntType.TINY_TARGET:
            return <TinyTargetOverlay secondsLeft={freezeSecondsLeft} onCaught={a.clearFreezeLocally} />;
          case TauntType.BLOB:
            return <BlobOverlay secondsLeft={freezeSecondsLeft} onCleaned={a.clearFreezeLocally} />;
          case TauntType.FLASHLIGHT:
            return <FlashlightOverlay secondsLeft={freezeSecondsLeft} senderName={s.tauntSenderName} />;
          default: // FREEZE
            return (
              <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-[#0A1629]/90 animate-in fade-in duration-200">
                <div className="bg-[#FF2E63] border-[4px] border-black rounded-3xl p-8 shadow-[10px_10px_0px_black] text-center max-w-xs w-full mx-6">
                  <Zap className="w-16 h-16 text-white mx-auto mb-4 animate-bounce" fill="currentColor" />
                  <h2 className="text-4xl font-impact uppercase italic text-white tracking-tighter leading-none mb-2">
                    {language === 'fr' ? 'TAUNTED!' : 'TAUNTÉ !'}
                  </h2>
                  <p className="text-white/70 font-impact uppercase text-[11px] tracking-widest mb-6">
                    {s.tauntSenderName
                      ? (language === 'fr' ? `${s.tauntSenderName} t'a figé` : `${s.tauntSenderName} froze you`)
                      : (language === 'fr' ? 'Un joueur t\'a figé' : 'A player froze you')}
                  </p>
                  <div className="w-24 h-24 bg-black/20 border-4 border-white/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-5xl font-impact text-white">{freezeSecondsLeft}</span>
                  </div>
                </div>
              </div>
            );
        }
      })()}

      {/* LINE COMPLETION CELEBRATION */}
      {s.lineCompleteEvent && (
        <div className="fixed inset-0 z-[170] flex flex-col items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-[#0A1629]/75" />
          <div
            key={s.lineCompleteEvent.totalLines}
            className="relative flex flex-col items-center gap-4 px-8 animate-in zoom-in-75 fade-in duration-300"
          >
            {/* Player logo */}
            <Avatar seed={s.avatarId} size={52} className="ring-[3px] ring-[#FFD700] ring-offset-[3px] ring-offset-[#0A1629]" />
            {/* Badge — line number */}
            <div className={`border-[4px] border-black rounded-2xl px-5 py-2 shadow-[6px_6px_0px_black] ${s.lineCompleteEvent.isFullGrid ? 'bg-[#FF2D6A]' : 'bg-[#FFD700]'}`}>
              <span className="font-impact text-black uppercase text-[13px] tracking-widest">
                {s.lineCompleteEvent.isFullGrid
                  ? '🏆 GRILLE COMPLÈTE'
                  : `🎯 ${(language === 'fr' ? LINE_ORDINALS_FR : LINE_ORDINALS_EN)[s.lineCompleteEvent.totalLines - 1] ?? s.lineCompleteEvent.totalLines + 'E'} LIGNE`}
              </span>
            </div>

            {/* Big title */}
            <div
              className="font-impact uppercase italic leading-none text-center"
              style={{
                fontSize: '52px',
                color: s.lineCompleteEvent.isFullGrid ? '#FF2D6A' : '#FFD700',
                textShadow: '5px 5px 0px black',
              }}
            >
              {s.lineCompleteEvent.isFullGrid
                ? (language === 'fr' ? 'BINGO CRAWL!' : 'BINGO CRAWL!')
                : (language === 'fr' ? 'LIGNE TERMINÉE!' : 'LINE CLEARED!')}
            </div>

            {/* Bonus pill */}
            <div className="flex items-center gap-2 bg-[#00FF9D] border-[3px] border-black rounded-2xl px-5 py-2.5 shadow-[4px_4px_0px_black]">
              <span className="text-xl">🎁</span>
              <div className="flex flex-col leading-none">
                <span className="font-impact text-black uppercase text-[14px] tracking-widest">+1 JOKER GAGNÉ!</span>
                <span className="font-impact text-black/50 uppercase text-[9px] tracking-widest">
                  {language === 'fr' ? 'Continue comme ça !' : 'Keep going!'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header compact */}
      <header className="shrink-0 w-full px-4 py-2 flex justify-between items-center z-30 mt-1">
        {/* Avatar (tap → edit profile) + name (tap → badges) */}
        <div className="flex items-center gap-2 bg-white/5 pr-3 pl-1 py-1 rounded-xl border-2 border-white/10">
          <button onClick={() => setShowEditProfile(true)} className="active:scale-90 transition-transform">
            <Avatar
              seed={s.avatarId}
              size={36}
              className={`rounded-lg transition-all duration-300 ${
                s.isFrozen
                  ? 'ring-2 ring-[#FF2E63] ring-offset-1 ring-offset-[#0A1629]'
                  : isFever
                  ? 'ring-2 ring-[#FFD700] ring-offset-1 ring-offset-[#0A1629]'
                  : 'ring-1 ring-[#00F5A0]/50 ring-offset-1 ring-offset-[#0A1629]'
              }`}
            />
          </button>
          <button id="tutorial-score-target" onClick={() => uia.setShowBadge(true)} className="flex flex-col items-start leading-none active:opacity-70 transition-opacity">
            <span className="font-impact text-[10px] text-[#00F5A0] uppercase tracking-tighter">{s.nickname}</span>
            <span className="text-[7px] text-slate-500 font-impact uppercase tracking-widest mt-0.5">{s.country || 'FR'}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
             {/* Bar indicator pill */}
             {(() => {
               const cadenceGoals = barCadence.split(',').map(Number);
               const barGoal = cadenceGoals[currentBar - 1] ?? 1;
               return chaosMode ? (
                 <div className="flex items-center gap-1 bg-[#FF4500]/20 border border-[#FF4500]/50 rounded-lg px-2 py-1 animate-pulse">
                   <span className="text-[9px]">⚡</span>
                   <span className="font-impact text-[#FF4500] text-[9px] uppercase tracking-wider">CHAOS</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1 bg-[#FF8C00]/10 border border-[#FF8C00]/30 rounded-lg px-2 py-1">
                   <span className="font-impact text-[#FF8C00] text-[9px] uppercase tracking-wider">Bar {currentBar}</span>
                   <span className="text-[#FF8C00]/40 text-[8px]">·</span>
                   <span className="font-impact text-white/40 text-[9px] uppercase">{barGoal}L</span>
                 </div>
               );
             })()}
             {/* Mini Language Switcher */}
             <button
                onClick={toggleLanguage}
                className="bg-black/40 border border-white/20 rounded-lg px-2 py-1 flex items-center gap-1.5 active:scale-95 transition-all"
             >
                <span className="text-sm leading-none">{language === 'en' ? '🇬🇧' : '🇫🇷'}</span>
                <span className="text-[9px] font-impact font-[900] text-white/70">
                   {language === 'en' ? 'EN' : 'FR'}
                </span>
             </button>

             <div 
                className={`bg-[#FFD700] px-3 py-1.5 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_black] flex flex-col items-center transition-all duration-300 ${isResetPressing ? 'scale-110 bg-red-500' : ''}`}
                onMouseDown={startResetPress}
                onMouseUp={endResetPress}
                onMouseLeave={endResetPress}
                onTouchStart={startResetPress}
                onTouchEnd={endResetPress}
             >
                <span className="text-[7px] text-black/60 font-impact uppercase leading-none mb-0.5 font-black tracking-widest">{isResetPressing ? 'RESET' : t('score')}</span>
                <span className="font-impact text-lg text-black leading-none italic">{displayScore}/25</span>
                {isResetPressing && (
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <div 
                        key={dot} 
                        className={`w-1 h-1 rounded-full transition-all duration-300 ${resetProgress >= dot ? 'bg-white shadow-[0_0_4px_white]' : 'bg-black/20'}`}
                      />
                    ))}
                  </div>
                )}
             </div>
        </div>
      </header>

      {/* GRILLE BINGO - 350x350px fixe */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden w-full">
        <div className="relative p-4 bg-black/40 rounded-[2rem] border-[4px] border-white/5 shadow-2xl">
          <div 
            id="tutorial-grid-area" 
            className="grid grid-cols-5 gap-[4px] p-[4px] bg-[#1A1A2E] rounded-[12px] shadow-inner"
            style={{ width: '350px', height: '350px' }}
          >
              {s.cells.map((cell: BingoCellData) => {
                const isCorner = CORNER_IDS.includes(cell.id);
                const isCenter = cell.id === 12;
                const isLocked = (isCorner && isCornersLocked) || (isCenter && isMysteryCellLocked);
                const isUnlocking = (isCorner && cornersUnlocking) || (isCenter && mysteryUnlocking);
                return (
                  <BingoCell
                    key={cell.id}
                    data={cell}
                    onClick={(id) => {
                      if (s.isFrozen) return;
                      const clicked = s.cells.find((c: BingoCellData) => c.id === id);
                      if (clicked) setRevealedCell(clicked);
                    }}
                    isWinning={s.winningIds.includes(cell.id)}
                    winningIndex={s.winningIds.indexOf(cell.id)}
                    isFeverTarget={s.feverCells.includes(cell.id)}
                    isLocked={isLocked}
                    isUnlocking={isUnlocking}
                    isSpotlight={cell.id === s.spotlightCellId && !!s.spotlightEndsAt && Date.now() < s.spotlightEndsAt}
                  />
                );
              })}
          </div>
        </div>

        {/* Progressive unlock progress hint */}
        {(isCornersLocked || isMysteryCellLocked) && (
          <div className="mt-2 flex items-center justify-center gap-2 animate-in fade-in duration-300">
            {isCornersLocked ? (
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5">
                <span className="text-xs">🔒</span>
                <span className="font-impact text-white/40 uppercase text-[9px] tracking-widest">
                  Coins à {CORNER_UNLOCK_SCORE}/25
                </span>
                <div className="flex gap-0.5">
                  {Array.from({length: CORNER_UNLOCK_SCORE}).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < s.score ? 'bg-[#FFD700]' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>
            ) : isMysteryCellLocked ? (
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5">
                <span className="text-xs">🔒</span>
                <span className="font-impact text-white/40 uppercase text-[9px] tracking-widest">
                  Mystère à {CENTER_UNLOCK_SCORE}/25
                </span>
                <div className="flex gap-0.5">
                  {Array.from({length: CENTER_UNLOCK_SCORE}).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < s.score ? 'bg-[#FFD700]' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* CADENCE COOLDOWN badge + anti-spam gamified message */}
      {challengeCooldownSecs > 0 && cooldownSecondsLeft > 0 && (
        <div className="shrink-0 flex flex-col items-center gap-1 z-40 -mb-1">
          <div className="flex items-center gap-2 bg-[#FF8C00] border-[3px] border-black rounded-2xl px-4 py-2 shadow-[4px_4px_0px_black] animate-in slide-in-from-bottom-2 duration-200">
            <span className="text-sm">⏳</span>
            <div className="flex flex-col leading-none">
              <span className="font-impact text-black uppercase text-[11px] tracking-widest">Tu es trop fort 😏</span>
              <span className="font-impact text-black/60 uppercase text-[9px] tracking-widest">va socialiser · prochain défi dans {cooldownSecondsLeft}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Jokers — two counters: swap + taunt */}
      <div className="shrink-0 py-2 flex justify-center gap-3 z-40">
        {/* Swap jokers */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all duration-300 ${s.jokers > 0 ? 'bg-black/60 border-[#00F5A0]/40 text-[#00F5A0]' : 'bg-black/80 border-white/5 text-white/10'}`}>
          <Sparkles size={11} className={s.jokers > 0 ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-impact uppercase tracking-widest leading-none">{t('jokers')} : {s.jokers}</span>
        </div>
        {/* Taunt credits — tap to go to leaderboard */}
        <button
          onClick={() => a.setView(AppView.LEADERBOARD)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all active:scale-95 ${s.tauntsLeft > 0 ? 'bg-black/60 border-[#FF2E63]/40 text-[#FF2E63]' : 'bg-black/80 border-white/5 text-white/10'}`}
        >
          <Zap size={11} fill="currentColor" className={s.tauntsLeft > 0 ? 'animate-pulse' : 'opacity-30'} />
          <span className="text-[9px] font-impact uppercase tracking-widest leading-none">
            TAUNTS : {s.tauntsLeft}
          </span>
        </button>
      </div>

      {/* Footer Nav */}
      <footer className="shrink-0 w-full p-4 pb-10 flex justify-center z-40">
        <div className="flex items-center gap-10 bg-[#FFD700] border-[3px] border-black rounded-[2rem] px-10 py-3.5 shadow-[8px_8px_0px_black] relative">
           <button onClick={() => a.setView(AppView.LEADERBOARD)} className="flex flex-col items-center active:scale-90 transition-transform">
              <Trophy size={26} className="text-black" />
              <span className="text-[8px] font-impact uppercase tracking-widest mt-0.5 text-black font-black">TOP</span>
           </button>
           
            <div 
              onMouseDown={startCrownPress}
              onMouseUp={endCrownPress}
              onMouseLeave={endCrownPress}
              onTouchStart={startCrownPress}
              onTouchEnd={endCrownPress}
              onClick={handleCrownClick} 
              className={`w-16 h-16 bg-white border-[4px] border-black rounded-2xl flex flex-col items-center justify-center shadow-[6px_6px_0px_black] -mt-16 cursor-pointer transition-all group relative ${isCrownPressing ? 'scale-125 bg-gold-400' : 'active:scale-95'}`}
            >
               <Crown size={30} className={`text-black transition-transform ${isCrownPressing ? 'animate-bounce' : 'group-hover:rotate-12'}`} fill="currentColor" />
               
               {/* Progress Dots */}
               {isCrownPressing && (
                 <div className="absolute -bottom-6 flex gap-1.5">
                    {[1, 2, 3].map((dot) => (
                      <div 
                        key={dot} 
                        className={`w-2 h-2 rounded-full border border-black transition-colors duration-300 ${crownProgress >= dot ? 'bg-black' : 'bg-white/50'}`}
                      />
                    ))}
                 </div>
               )}
            </div>

           <button onClick={() => uia.setShowLegends(true)} className="flex flex-col items-center active:scale-90 transition-transform">
              <Settings size={26} className="text-black" />
              <span className="text-[8px] font-impact uppercase tracking-widest mt-0.5 text-black font-black">{t('help')}</span>
           </button>
        </div>
      </footer>

      {/* MODALS */}
      {ui.showLegends && <LegendsModal onClose={() => uia.setShowLegends(false)} />}
      {ui.showBadge && <NFTBadgeModal nickname={s.nickname} score={s.score} badges={s.badges} onClose={() => uia.setShowBadge(false)} />}

      {/* Challenge reveal sheet — tap to discover before validating */}
      {revealedCell && !s.selectedCell && s.activeScannerMode !== 'MASTER' && (
        <ChallengeRevealSheet
          cell={revealedCell}
          onConfirm={() => {
            a.handleCellClick(revealedCell.id);
            setRevealedCell(null);
          }}
          onClose={() => setRevealedCell(null)}
        />
      )}

      {s.selectedCell && s.activeScannerMode !== 'MASTER' && (
        <div id="tutorial-validation-actions">
          <ValidationModal
              cell={s.selectedCell}
              jokerCount={s.jokers}
              lastWitnessTime={s.lastWitnessTime}
              onClose={() => a.setSelectedCell(null)}
              onConfirm={handleValidateCell}
              onUseJoker={a.useJoker}
              onScanRequest={() => a.setActiveScannerMode('MASTER')}
              onSubmitProof={() => {}}
              playerNickname={s.nickname}
              playerAvatarId={s.avatarId}
              onRequestMasterValidation={
                s.selectedCell && s.gameSession && secureSessionId
                  ? async () => {
                      const { gameService: gs } = await import('../services/gameService');
                      await gs.requestMasterValidation(
                        s.gameSession!.id,
                        s.selectedCell!.id,
                        s.selectedCell!.text,
                        s.nickname || 'Joueur',
                        s.avatarId || '🎲',
                        secureSessionId!
                      );
                    }
                  : undefined
              }
          />
        </div>
      )}
      {s.activeScannerMode === 'MASTER' && (
          <QRScanner
            mode={'MASTER'}
            onScanSuccess={() => a.validateCell()}
            onClose={() => {a.setActiveScannerMode(null); a.setSelectedCell(null);}}
          />
      )}

      {/* 4.1 Edit Profile Sheet */}
      {showEditProfile && (
        <EditProfileSheet
          currentNickname={s.nickname}
          currentAvatarId={s.avatarId}
          onSave={async (nick, avatarKey) => { await a.updateProfile(nick, avatarKey); }}
          onClose={() => setShowEditProfile(false)}
        />
      )}

      {/* RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[350] bg-black/80 flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0A1629] border-t-[4px] border-x-[4px] border-black rounded-t-[28px] shadow-[0_-8px_0px_black] px-5 pt-6 pb-10 animate-in slide-in-from-bottom-4 duration-250">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <h3 className="font-impact uppercase text-white text-xl tracking-tight text-center mb-2">Recommencer ?</h3>
            <p className="font-impact uppercase text-white/40 text-[10px] tracking-widest text-center leading-relaxed mb-6">
              Ton profil et ta progression seront effacés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-4 bg-white/8 border-[2px] border-white/15 rounded-2xl font-impact uppercase text-white/60 text-[13px] tracking-widest active:bg-white/15 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => { setShowResetConfirm(false); a.resetGame(); a.setView(AppView.NICKNAME); }}
                className="flex-[2] py-4 bg-[#FF2D6A] border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] font-impact uppercase text-white text-[13px] tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                Oui, reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
