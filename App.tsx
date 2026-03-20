
import React, { useEffect, useState, useRef } from 'react';
import { Smartphone, X, KeyRound } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

import { AppView, CellStatus, TutorialStep, ChallengeType } from './types';
import { useBingoGame } from './hooks/useBingoGame';
import { useAppUI } from './hooks/useAppUI';
import { useLanguage } from './contexts/LanguageContext';
import { useEventSession } from './hooks/useEventSession';
import { useTutorial } from './hooks/useTutorial';
import { gameService } from './services/gameService';

import TutorialOverlay from './components/TutorialOverlay'; 
import StyleSelection from './components/StyleSelection'; 
import TutorialLayer from './components/TutorialLayer'; 
import ShieldLogo from './components/ShieldLogo';
import BackgroundParticles from './components/BackgroundParticles';
import NetworkStatus from './components/NetworkStatus';
import Leaderboard from './components/Leaderboard';
import LockedPage from './components/LockedPage';
import SessionStartOverlay from './components/SessionStartOverlay';

// PAGE COMPONENTS
import NicknamePage from './components/NicknamePage';
import MasterPage from './components/MasterPage';
import GamePage from './components/GamePage';

const RotateDeviceOverlay = () => {
    const { t } = useLanguage();
    return (
        <div className="fixed inset-0 z-[1000] bg-navy-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="mb-6 animate-[spin_3s_linear_infinite] origin-center">
                 <Smartphone className="w-20 h-20 text-gold-500 rotate-90" />
            </div>
            <h2 className="text-3xl font-playbook font-bold text-white mb-4 uppercase tracking-widest">{t('rotate_device')}</h2>
            <p className="text-slate-400 text-lg font-sans max-w-md">{t('rotate_desc')}</p>
        </div>
    );
};

const App: React.FC = () => {
  const { t } = useLanguage();
  const { state: s, actions: a } = useBingoGame();
  const { state: ui, actions: uia } = useAppUI(a.setView);
  const { isSessionActive, setSessionActive, checkSession, isLoading: isSessionLoading } = useEventSession();
  const tut = useTutorial();
  
  const [vipBypass, setVipBypass] = useState(false);
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  
  // Session Start Animation State
  const [showStartAnimation, setShowStartAnimation] = useState(false);
  const isFirstLoad = useRef(true);
  const prevSessionActive = useRef(isSessionActive);

  // --- LANDSCAPE DETECTION ---
  useEffect(() => {
    const checkOrientation = () => {
        if (window.innerWidth > window.innerHeight && window.innerHeight < 550) {
            setIsLandscapeMobile(true);
        } else {
            setIsLandscapeMobile(false);
        }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);
  
  // --- SYNC CHECK ON MOUNT ---
  useEffect(() => {
     if (navigator.onLine) {
         gameService.syncPendingActions();
     }
  }, []);
  
  // --- KICK LOGIC & START ANIMATION ---
  useEffect(() => {
    if (isSessionLoading) return;

    // 1. KICK LOGIC
    if (!isSessionActive) {
      setVipBypass(false);
      // KICK: Force redirect to NICKNAME if user is in GAME view when session closes
      if (s.view !== AppView.MASTER_DASHBOARD && s.view !== AppView.NICKNAME) {
         a.setView(AppView.NICKNAME);
      }
    }

    // 2. START ANIMATION LOGIC
    // We only trigger if it WAS false and IS NOW true, and it's NOT the very first load
    if (!prevSessionActive.current && isSessionActive && !isFirstLoad.current && s.view !== AppView.MASTER_DASHBOARD) {
        setShowStartAnimation(true);
        
        // Confetti Explosion
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          canvasConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          canvasConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
        
        // Haptic
        if (navigator.vibrate) navigator.vibrate([100, 100, 200, 100, 400]);

        // Hide after 3.5s
        setTimeout(() => setShowStartAnimation(false), 3500);
    }

    // Update refs
    prevSessionActive.current = isSessionActive;
    if (isFirstLoad.current) isFirstLoad.current = false;

  }, [isSessionActive, s.view, a, isSessionLoading]);

  // --- WAKE LOCK ---
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
    };
    requestWakeLock();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // --- TUTORIAL NEXT LOGIC ---
  const handleTutorialNext = () => {
    switch(tut.currentStep) {
        case TutorialStep.STYLES:
            tut.nextStep();
            a.setView(AppView.ONBOARDING_REWARDS);
            break;
        case TutorialStep.REWARDS:
            tut.nextStep();
            a.startGame(s.nickname || "Player");
            break;
        case TutorialStep.GRID:
            let targetCell = s.cells.find((c: any) => c.status === CellStatus.EMPTY && c.type === ChallengeType.WITNESS);
            if (!targetCell) {
               targetCell = s.cells.find((c: any) => c.status === CellStatus.EMPTY && c.type === ChallengeType.AUTO);
            }
            if (!targetCell) {
               targetCell = s.cells.find((c: any) => c.status === CellStatus.EMPTY);
            }
            if(targetCell) {
              a.handleCellClick(targetCell.id);
              tut.nextStep();
            }
            break;
        case TutorialStep.CHALLENGE_MODAL:
            a.setSelectedCell(null); 
            tut.nextStep();
            break;
        case TutorialStep.SCORE:
            tut.completeTutorial();
            canvasConfetti({ particleCount: 150, spread: 100, origin: { y: 0.7 } });
            break;
    }
  };

  // GLOBAL LOADING STATE
  if (s.isLoading || isSessionLoading) {
    return (
      <div className="min-h-[100dvh] bg-navy-950 flex flex-col items-center justify-center relative">
        <BackgroundParticles />
        <div className="w-24 h-24 mb-6 relative">
           <div className="absolute inset-0 border-4 border-gold-500/30 rounded-full animate-pulse"></div>
           <div className="absolute inset-0 border-t-4 border-gold-500 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <ShieldLogo className="w-12 h-12 animate-pulse" />
           </div>
        </div>
        <p className="text-gold-400 font-playbook text-xl tracking-widest animate-pulse">{t('loading')}</p>
      </div>
    );
  }
  
  // LANDSCAPE BLOCKER
  if (isLandscapeMobile) {
      return <RotateDeviceOverlay />;
  }

  /* 
     SESSION LOCK - STRICT MODE ENABLED
     This forces the LockedPage if the Master has not opened the session.
     Only the Master Login is accessible here OR via QR Code scan.
  */
  if (!isSessionActive && s.view !== AppView.MASTER_DASHBOARD && !vipBypass) {
     return (
       <>
         <NetworkStatus />
         <LockedPage 
            onMasterAccess={() => uia.setShowMasterLogin(true)} 
            onVipBypass={() => setVipBypass(true)}
            onRefresh={checkSession}
         />
         {ui.showMasterLogin && (
           <div className="fixed inset-0 z-[100] bg-navy-950/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-navy-900 border-2 border-gold-500 rounded-xl p-8 relative shadow-gold-lg">
                 <button onClick={() => uia.setShowMasterLogin(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                 <div className="text-center mb-6">
                   <div className="w-16 h-16 bg-navy-800 rounded-full border border-gold-500 flex items-center justify-center mx-auto mb-4"><KeyRound className="w-8 h-8 text-gold-400" /></div>
                   <h3 className="text-2xl font-playbook font-bold text-gold-400 uppercase">{t('master_access_title')}</h3>
                 </div>
                 <form onSubmit={uia.handleMasterLoginSubmit} className="space-y-4">
                    <input type="password" value={ui.masterCodeInput} onChange={(e) => uia.setMasterCodeInput(e.target.value)} placeholder="Code" className={`w-full bg-navy-950 border-2 rounded-lg p-4 text-center text-white text-xl font-bold tracking-widest focus:outline-none transition-all ${ui.masterLoginError ? 'border-red-500 animate-[shake_0.5s_ease-in-out]' : 'border-gold-500/50 focus:border-gold-400'}`} autoFocus />
                    <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold py-3 rounded-lg uppercase tracking-wider transition-colors">{t('unlock')}</button>
                 </form>
              </div>
           </div>
         )}
       </>
     );
  }

  // --- ROUTING ---

  return (
    <>
      {showStartAnimation && <SessionStartOverlay />}
      
      {/* 1. NICKNAME PAGE */}
      {s.view === AppView.NICKNAME && (
         <NicknamePage state={s} actions={a} ui={ui} uiActions={uia} tutorialActions={tut} />
      )}

      {/* 2. MASTER PAGE */}
      {s.view === AppView.MASTER_DASHBOARD && (
         <MasterPage isSessionActive={isSessionActive} setSessionActive={setSessionActive} state={s} actions={a} />
      )}

      {/* 3. LEADERBOARD */}
      {s.view === AppView.LEADERBOARD && (
         <Leaderboard onBack={() => a.setView(AppView.GAME)} currentUserId={localStorage.getItem('bingo_user_id') || undefined} />
      )}

      {/* 4. ONBOARDING (STYLES) */}
      {s.view === AppView.ONBOARDING_STYLES && (
        <div className="min-h-[100dvh] bg-navy-950 flex flex-col relative overflow-hidden">
           <BackgroundParticles />
           <TutorialLayer step={tut.currentStep} onNext={handleTutorialNext} />
           <StyleSelection onSelect={() => {
               if (tut.currentStep === TutorialStep.STYLES) {
                   tut.nextStep();
               }
               a.setView(AppView.ONBOARDING_REWARDS);
           }} />
        </div>
      )}

      {/* 5. ONBOARDING (REWARDS) */}
      {s.view === AppView.ONBOARDING_REWARDS && (
          <>
            <TutorialLayer step={tut.currentStep} onNext={handleTutorialNext} />
            <TutorialOverlay onClose={() => {
                if (tut.currentStep === TutorialStep.REWARDS) {
                    tut.nextStep(); 
                }
                a.startGame(s.nickname || "Player"); 
            }} />
          </>
      )}

      {/* 6. GAME PAGE (Main View) */}
      {s.view === AppView.GAME && (
         <GamePage state={s} actions={a} ui={ui} uiActions={uia} tutorialActions={tut} onTutorialNext={handleTutorialNext} />
      )}
    </>
  );
};

export default App;
