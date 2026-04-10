
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

interface GamePageProps {
  state: any;
  actions: any;
  ui: any;
  uiActions: any;
  tutorialActions?: any;
  onTutorialNext?: () => void;
  onCrownClick?: () => void;
  onPhotoProof?: (cellId: number, url: string) => void;
}

const GamePage: React.FC<GamePageProps> = ({ state: s, actions: a, ui, uiActions: uia, onCrownClick, onPhotoProof }) => {
  const [freezeSecondsLeft, setFreezeSecondsLeft] = useState(0);
  const [revealedCell, setRevealedCell] = useState<import('../types').BingoCellData | null>(null);
  const [spotlightSecondsLeft, setSpotlightSecondsLeft] = useState(0);

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

  // Mystery cell unlock detection (#2)
  const prevScoreRef = useRef(s.score);
  const [mysteryUnlocking, setMysteryUnlocking] = useState(false);
  useEffect(() => {
    if (prevScoreRef.current < 5 && s.score >= 5) {
      setMysteryUnlocking(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
      setTimeout(() => setMysteryUnlocking(false), 800);
    }
    prevScoreRef.current = s.score;
  }, [s.score]);

  const isMysteryCellLocked = s.score < 5;

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
        if (window.confirm("Reset profile and start over?")) {
           a.resetGame();
           a.setView(AppView.NICKNAME);
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
    <div className={`fixed inset-0 bg-[#0A1629] text-white flex flex-col items-center overflow-hidden ${isFever ? 'ring-[8px] ring-inset ring-[#FF2D6A] transition-all duration-500' : ''}`}>
      <NetworkStatus />
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
              <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-[#0A1629]/90 backdrop-blur-md animate-in fade-in duration-200">
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

      {/* Header compact */}
      <header className="shrink-0 w-full px-4 py-2 flex justify-between items-center z-30 mt-1">
        <button id="tutorial-score-target" onClick={() => uia.setShowBadge(true)} className="flex items-center gap-2 bg-white/5 pr-3 pl-1 py-1 rounded-xl border-2 border-white/10 active:scale-95 transition-transform">
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
          <div className="flex flex-col items-start leading-none">
            <span className="font-impact text-[10px] text-[#00F5A0] uppercase tracking-tighter">{s.nickname}</span>
            <span className="text-[7px] text-slate-500 font-impact uppercase tracking-widest mt-0.5">{s.country || 'FR'}</span>
          </div>
        </button>
        
        <div className="flex items-center gap-2">
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
                className={`bg-[#FFD93D] px-3 py-1.5 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_black] flex flex-col items-center transition-all duration-300 ${isResetPressing ? 'scale-110 bg-red-500' : ''}`}
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
              {s.cells.map((cell: BingoCellData) => (
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
                  isLocked={cell.id === 12 && isMysteryCellLocked}
                  isUnlocking={cell.id === 12 && mysteryUnlocking}
                  isSpotlight={cell.id === s.spotlightCellId && !!s.spotlightEndsAt && Date.now() < s.spotlightEndsAt}
                />
              ))}
          </div>
        </div>
      </main>

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
            {language === 'fr' ? 'TAUNTS' : 'TAUNTS'} : {s.tauntsLeft}
          </span>
        </button>
      </div>

      {/* Footer Nav */}
      <footer className="shrink-0 w-full p-4 pb-10 flex justify-center z-40">
        <div className="flex items-center gap-10 bg-[#FFD93D] border-[3px] border-black rounded-[2rem] px-10 py-3.5 shadow-[8px_8px_0px_black] relative">
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
              onConfirm={(data) => {
                if (data?.proofImage && s.selectedCell) {
                  onPhotoProof?.(s.selectedCell.id, data.proofImage);
                }
                a.validateCell(data);
              }}
              onUseJoker={a.useJoker} 
              onScanRequest={() => a.setActiveScannerMode('MASTER')} 
              onSubmitProof={() => {}}
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
    </div>
  );
};

export default GamePage;
