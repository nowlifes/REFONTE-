
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Smartphone, X, KeyRound } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

import { AppView, CellStatus, TutorialStep, ChallengeType } from './types';
import { HIDDEN_MASTER_PASSWORD } from './constants';
import { useBingoGame } from './hooks/useBingoGame';
import { useAppUI } from './hooks/useAppUI';
import { useLanguage } from './contexts/LanguageContext';
import { useEventSession } from './hooks/useEventSession';
import { useTutorial } from './hooks/useTutorial';
import { gameService } from './services/gameService';

import ShieldLogo from './components/ShieldLogo';
import BackgroundParticles from './components/BackgroundParticles';
import NetworkStatus from './components/NetworkStatus';
import Leaderboard from './components/Leaderboard';
import LockedPage from './components/LockedPage';
import SessionStartOverlay from './components/SessionStartOverlay';
import SessionEndOverlay from './components/SessionEndOverlay';
import MissionReport from './components/MissionReport';
import BarTransitionOverlay from './components/BarTransitionOverlay';

// PAGE COMPONENTS
import NicknamePage from './components/NicknamePage';
import MasterPage from './components/MasterPage';
import GamePage from './components/GamePage';
import GameRoom from './components/GameRoom';
import GameOverPage from './components/GameOverPage';
import LobbyPage from './components/LobbyPage';
import { ErrorBoundary } from './components/ErrorBoundary';

// ─── Rotate overlay ───────────────────────────────────────────────────────────
const RotateDeviceOverlay = () => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[1000] bg-[#0A1629] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <div className="mb-6 animate-[spin_3s_linear_infinite] origin-center">
        <Smartphone className="w-20 h-20 text-[#FFD700] rotate-90" />
      </div>
      <h2 className="text-3xl font-impact text-white mb-4 uppercase tracking-widest italic">{t('rotate_device')}</h2>
      <p className="text-white/50 text-lg font-sans max-w-md">{t('rotate_desc')}</p>
    </div>
  );
};

// ─── MasterApp — /master route, completely isolated ──────────────────────────
const MasterApp: React.FC = () => {
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(() => import.meta.env.DEV);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const { state: s, actions: a } = useBingoGame();
  const {
    isSessionActive, setSessionActive,
    resetSession: baseResetSession,
    createNewSession: baseCreateNewSession,
    transitionEndsAt, nextBarName,
    triggerBarTransition, clearBarTransition,
    secureSessionId,
    pregamePhase, setPregamePhase,
    triggerCountdown, clearCountdown,
    spotlightDisabled, setSpotlightDisabled,
    challengeCooldownSecs, setChallengeCooldown,
    isGamePaused, setGamePaused,
    currentBar, barCadence, chaosMode, maxValidationsPerBar,
    advanceBar, setBarCadenceValue, setChaosMode, setMaxValidationsPerBar,
  } = useEventSession();

  const resetSession = async () => {
    await baseResetSession();
    a.resetGame();
    window.location.reload();
  };

  const createNewSession = async () => {
    await baseCreateNewSession();
    a.resetGame();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === HIDDEN_MASTER_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordInput('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 500);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#0A1629] flex items-center justify-center p-6">
        <BackgroundParticles />
        <div className="relative w-full max-w-sm bg-[#0A1629] border-2 border-red-500 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500/10 rounded-full border-2 border-red-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <KeyRound className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-impact text-red-500 uppercase tracking-tighter italic">
              {t('master_access_title')}
            </h3>
            <p className="text-[10px] text-white/40 font-impact uppercase tracking-widest mt-2">RESTRICTED AREA</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="SECRET KEY"
              className={`w-full bg-white border-2 rounded-xl p-5 text-center text-black text-2xl font-bold tracking-[0.3em] focus:outline-none transition-all ${passwordError ? 'border-red-500 animate-[shake_0.5s_ease-in-out]' : 'border-red-500/30 focus:border-red-500'}`}
              autoFocus
            />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-impact uppercase py-4 rounded-xl tracking-widest transition-all shadow-lg active:scale-95">
              {t('unlock')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <MasterPage
      isSessionActive={isSessionActive}
      setSessionActive={setSessionActive}
      resetSession={resetSession}
      createNewSession={createNewSession}
      onWrapped={async () => { await setSessionActive(false); }}
      triggerBarTransition={triggerBarTransition}
      clearBarTransition={clearBarTransition}
      transitionEndsAt={transitionEndsAt}
      nextBarName={nextBarName}
      secureSessionId={secureSessionId}
      state={s}
      actions={a}
      pregamePhase={pregamePhase}
      setPregamePhase={setPregamePhase}
      triggerCountdown={triggerCountdown}
      clearCountdown={clearCountdown}
      spotlightDisabled={spotlightDisabled}
      setSpotlightDisabled={setSpotlightDisabled}
      challengeCooldownSecs={challengeCooldownSecs}
      setChallengeCooldown={setChallengeCooldown}
      isGamePaused={isGamePaused}
      setGamePaused={setGamePaused}
      currentBar={currentBar}
      barCadence={barCadence}
      chaosMode={chaosMode}
      maxValidationsPerBar={maxValidationsPerBar}
      advanceBar={advanceBar}
      setBarCadenceValue={setBarCadenceValue}
      setChaosMode={setChaosMode}
      setMaxValidationsPerBar={setMaxValidationsPerBar}
    />
  );
};

// ─── PlayerApp — /* route, all player logic ───────────────────────────────────
const PlayerApp: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    isSessionActive, setSessionActive,
    resetSession: baseResetSession,
    createNewSession: baseCreateNewSession,
    checkSession,
    isLoading: isSessionLoading,
    transitionEndsAt, nextBarName,
    triggerBarTransition, clearBarTransition,
    secureSessionId,
    pregamePhase, setPregamePhase,
    triggerCountdown, clearCountdown,
    countdownEndsAt,
    spotlightDisabled, setSpotlightDisabled,
    challengeCooldownSecs, setChallengeCooldown,
    isGamePaused, setGamePaused,
    currentBar, barCadence, chaosMode, maxValidationsPerBar,
    advanceBar, setBarCadenceValue, setChaosMode, setMaxValidationsPerBar,
  } = useEventSession();
  const { state: s, actions: a } = useBingoGame({ spotlightDisabled });
  const aRef = React.useRef(a);
  aRef.current = a;
  const sRef = React.useRef(s);
  sRef.current = s;
  const { state: ui, actions: uia } = useAppUI(a.setView);
  const [photoProofs, setPhotoProofs] = useState<Record<number, string>>({});
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  const [transitionSecondsLeft, setTransitionSecondsLeft] = useState(0);
  const { language } = useLanguage();

  // Keep Supabase alive (free tier pauses after 7 days without activity)
  useEffect(() => {
    const id = setInterval(() => { gameService.checkConnection().catch(() => {}); }, 4 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Quand la session se ferme pendant le jeu → afficher le rapport avant LockedPage
  const prevSessionActiveRef = React.useRef(true);
  useEffect(() => {
    if (!isSessionActive && prevSessionActiveRef.current && s.view === AppView.GAME) {
      aRef.current.setView(AppView.MISSION_REPORT);
    }
    prevSessionActiveRef.current = isSessionActive;
  }, [isSessionActive, s.view]);

  // Poll session every 3s while in LOBBY — ensures countdown_ends_at is picked up
  // even when Supabase Realtime delivery is delayed or subscription not established yet.
  useEffect(() => {
    if (s.view !== AppView.LOBBY) return;
    const id = setInterval(() => { checkSession().catch(() => {}); }, 3000);
    return () => clearInterval(id);
  }, [s.view, checkSession]);

  // Countdown timer + trigger overlay at T=0
  useEffect(() => {
    if (!transitionEndsAt) { setTransitionSecondsLeft(0); setShowTransitionOverlay(false); return; }
    const update = () => {
      const left = Math.max(0, Math.ceil((transitionEndsAt - Date.now()) / 1000));
      setTransitionSecondsLeft(left);
      if (left === 0 && s.view === AppView.GAME) setShowTransitionOverlay(true);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [transitionEndsAt, s.view]);

  // Spotlight disable
  useEffect(() => {
    if (spotlightDisabled) {
      a.resetSpotlightCount();
    }
  }, [spotlightDisabled]);

  // 3-2-1 game launch countdown
  const [launchCountdown, setLaunchCountdown] = useState<{ value: number; isGo: boolean } | null>(null);
  useEffect(() => {
    if (!countdownEndsAt) { setLaunchCountdown(null); return; }
    if (countdownEndsAt - Date.now() < -30000) { setLaunchCountdown(null); return; }
    let fired = false;
    const update = () => {
      const msLeft = countdownEndsAt - Date.now();
      const secLeft = Math.ceil(msLeft / 1000);
      if (secLeft > 0) {
        setLaunchCountdown({ value: secLeft, isGo: false });
      } else if (!fired) {
        fired = true;
        setLaunchCountdown({ value: 0, isGo: true });
        setTimeout(() => {
          setLaunchCountdown(null);
          const cur = sRef.current;
          if (cur.view === AppView.LOBBY && cur.nickname && !cur.gameSession) {
            aRef.current.startGame(cur.nickname);
          }
        }, 800);
      }
    };
    update();
    const iv = setInterval(update, 100);
    return () => { clearInterval(iv); };
  }, [countdownEndsAt, s.view]);

  // Auto-start for late joiners
  useEffect(() => {
    if (s.view !== AppView.LOBBY || !s.nickname || s.gameSession) return;
    if (!countdownEndsAt) return;
    const msSinceCountdown = Date.now() - countdownEndsAt;
    if (msSinceCountdown < 0 || msSinceCountdown > 5 * 60 * 1000) return;
    aRef.current.startGame(s.nickname);
  }, [s.view, s.nickname, s.gameSession, countdownEndsAt]);

  const resetSession = async () => {
    try {
      await baseResetSession();
      a.resetGame();
      a.setView(AppView.NICKNAME);
      window.location.reload();
    } catch (e) {
      console.error('[App] resetSession failed', e);
      alert('Erreur lors du reset. Vérifie ta connexion et réessaie.');
    }
  };

  const createNewSession = async () => {
    await baseCreateNewSession();
    a.resetGame();
    a.setView(AppView.NICKNAME);
  };

  const tut = useTutorial();

  const [vipBypass, setVipBypass] = useState(false);
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const [showHiddenLogin, setShowHiddenLogin] = useState(false);
  const [hiddenCodeInput, setHiddenCodeInput] = useState('');
  const [hiddenLoginError, setHiddenLoginError] = useState(false);

  // Session Start Animation State
  const [showStartAnimation, setShowStartAnimation] = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const isFirstLoad = useRef(true);
  const prevSessionActive = useRef(isSessionActive);

  const handleHiddenLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hiddenCodeInput === HIDDEN_MASTER_PASSWORD) {
      setShowHiddenLogin(false);
      setHiddenCodeInput('');
      setHiddenLoginError(false);
      navigate('/master');
    } else {
      setHiddenLoginError(true);
      setTimeout(() => setHiddenLoginError(false), 500);
    }
  };

  const handleCrownClick = () => {
    if (import.meta.env.DEV) { navigate('/master'); return; }
    setShowHiddenLogin(true);
  };

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

  // --- WITNESS HEAL ---
  useEffect(() => {
    if (!isSessionActive || !secureSessionId) return;
    const userId = localStorage.getItem('bingo_user_id');
    if (!userId) return;
    gameService.linkPlayerToSession(userId, secureSessionId).catch(() => {});
  }, [isSessionActive, secureSessionId]);

  // --- KICK LOGIC & START ANIMATION ---
  useEffect(() => {
    if (isSessionLoading) return;

    console.log(`[SessionEffect] Active: ${isSessionActive}, Prev: ${prevSessionActive.current}, View: ${s.view}`);

    // 1. KICK LOGIC
    if (!isSessionActive) {
      setVipBypass(false);
      if (prevSessionActive.current && !isFirstLoad.current && (s.view === AppView.GAME || s.view === AppView.LEADERBOARD)) {
        setShowEndOverlay(true);
      }
      if (!showEndOverlay && s.view !== AppView.NICKNAME && s.view !== AppView.MISSION_REPORT) {
        aRef.current.setView(AppView.NICKNAME);
        aRef.current.resetGame();
      }
    }

    // 2. START ANIMATION LOGIC
    if (!prevSessionActive.current && isSessionActive && !isFirstLoad.current) {
      setShowStartAnimation(true);
      aRef.current.resetGame();
      aRef.current.setView(AppView.NICKNAME);
      setShowEndOverlay(false);

      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        canvasConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        canvasConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      if (navigator.vibrate) navigator.vibrate([100, 100, 200, 100, 400]);
      setTimeout(() => setShowStartAnimation(false), 3500);
    }

    prevSessionActive.current = isSessionActive;
    if (isFirstLoad.current) isFirstLoad.current = false;
  }, [isSessionActive, s.view, isSessionLoading, showEndOverlay]);

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
    switch (tut.currentStep) {
      case TutorialStep.STYLES:
        tut.nextStep();
        a.setView(AppView.ONBOARDING_REWARDS);
        break;
      case TutorialStep.REWARDS:
        tut.nextStep();
        a.startGame(s.nickname || 'Player');
        break;
      case TutorialStep.GRID: {
        let targetCell = s.cells.find((c: any) => c.status === CellStatus.EMPTY && c.type === ChallengeType.WITNESS);
        if (!targetCell) targetCell = s.cells.find((c: any) => c.status === CellStatus.EMPTY && c.type === ChallengeType.AUTO);
        if (!targetCell) targetCell = s.cells.find((c: any) => c.status === CellStatus.EMPTY);
        if (targetCell) { a.handleCellClick(targetCell.id); tut.nextStep(); }
        break;
      }
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
      <div className="min-h-[100dvh] bg-[#0A1629] flex flex-col items-center justify-center relative">
        <BackgroundParticles />
        <div className="w-24 h-24 mb-6 relative">
          <div className="absolute inset-0 border-4 border-[#FFD700]/30 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-t-4 border-[#FFD700] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldLogo onCrownClick={handleCrownClick} className="w-12 h-12 animate-pulse" />
          </div>
        </div>
        <p className="text-[#FFD700] font-impact text-xl tracking-widest animate-pulse uppercase">{t('loading')}</p>
      </div>
    );
  }

  // LANDSCAPE BLOCKER
  if (isLandscapeMobile) {
    return <RotateDeviceOverlay />;
  }

  // SESSION LOCK
  if (!isSessionActive && s.view !== AppView.MISSION_REPORT && s.view !== AppView.GAME_OVER && !showEndOverlay && !vipBypass) {
    return (
      <>
        <NetworkStatus />
        <LockedPage
          onMasterAccess={handleCrownClick}
          onVipBypass={() => setVipBypass(true)}
          onRefresh={checkSession}
          onCrownClick={handleCrownClick}
        />
      </>
    );
  }

  // Game over
  if (s.view === AppView.GAME_OVER) {
    return <GameOverPage />;
  }

  return (
    <>
      {showStartAnimation && <SessionStartOverlay />}
      {showEndOverlay && (
        <SessionEndOverlay
          nickname={s.nickname}
          onViewReport={() => {
            setShowEndOverlay(false);
            a.setView(AppView.MISSION_REPORT);
          }}
        />
      )}

      <GameRoom setView={a.setView}>

        {/* 1. NICKNAME PAGE */}
        {s.view === AppView.NICKNAME && (
          <NicknamePage state={s} actions={a} ui={ui} uiActions={uia} tutorialActions={tut} onCrownClick={handleCrownClick} />
        )}

        {/* 1b. LOBBY */}
        {s.view === AppView.LOBBY && (
          <LobbyPage
            nickname={s.nickname || ''}
            avatarId={s.avatarId || ''}
            onCrownClick={handleCrownClick}
            onLeave={() => { a.resetGame(); a.setView(AppView.NICKNAME); }}
          />
        )}

        {/* 3. LEADERBOARD */}
        {s.view === AppView.LEADERBOARD && (
          <Leaderboard
            onBack={() => a.setView(AppView.GAME)}
            currentUserId={localStorage.getItem('bingo_user_id') || undefined}
            currentGameId={s.gameSession?.id}
            currentScore={s.score}
            tauntsLeft={s.tauntsLeft}
            onTaunt={s.gameSession?.id ? async (targetUserId, tauntType) => {
              await gameService.sendTaunt(s.gameSession!.id, targetUserId, tauntType, s.nickname || undefined);
            } : undefined}
          />
        )}

        {/* 4 & 5. ONBOARDING — handled inline in NicknamePage via OnboardingCards */}

        {/* 6. GAME PAGE */}
        {s.view === AppView.GAME && !(isSessionActive && pregamePhase && s.nickname && !!localStorage.getItem('bingo_user_id')) && (
          <ErrorBoundary>
            <GamePage
              state={s}
              actions={a}
              ui={ui}
              uiActions={uia}
              onCrownClick={handleCrownClick}
              onPhotoProof={(cellId: number, url: string) => setPhotoProofs((prev: Record<number, string>) => ({ ...prev, [cellId]: url }))}
              secureSessionId={secureSessionId}
              challengeCooldownSecs={chaosMode ? 0 : challengeCooldownSecs}
              isGamePaused={isGamePaused}
              chaosMode={chaosMode}
              currentBar={currentBar}
              barCadence={barCadence}
            />
          </ErrorBoundary>
        )}

        {/* BAR TRANSITION — countdown badge */}
        {s.view === AppView.GAME && isSessionActive && transitionEndsAt && transitionSecondsLeft > 0 && (
          <div className="fixed top-[72px] left-3 right-3 z-[140] pointer-events-none animate-in slide-in-from-top-2 duration-300">
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] transition-all duration-500 ${
              transitionSecondsLeft <= 60
                ? 'bg-[#FF2D6A] animate-pulse'
                : transitionSecondsLeft <= 120
                ? 'bg-[#FF8C00]'
                : 'bg-[#FFD700]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">🚶</span>
                <div className="flex flex-col leading-none">
                  <span className="font-impact text-black uppercase text-[13px] tracking-tight">
                    {language === 'fr' ? 'On bouge bientôt' : 'Moving soon'}
                    {nextBarName ? ` — ${nextBarName}` : ''}
                  </span>
                  <span className="font-impact text-black/50 uppercase text-[9px] tracking-widest">
                    {language === 'fr' ? 'Finis tes défis !' : 'Finish your challenges!'}
                  </span>
                </div>
              </div>
              <div className="bg-black/15 border border-black/20 rounded-xl px-2.5 py-1 shrink-0">
                <span className="font-impact text-black text-sm tabular-nums">
                  {Math.floor(transitionSecondsLeft / 60)}:{String(transitionSecondsLeft % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BAR TRANSITION — full screen overlay at T=0 */}
        {showTransitionOverlay && (
          <BarTransitionOverlay
            nextBarName={nextBarName}
            language={language as 'fr' | 'en'}
            onDismiss={async () => {
              setShowTransitionOverlay(false);
              await clearBarTransition();
              a.resetSpotlightCount();
            }}
          />
        )}

        {/* 7. MISSION REPORT */}
        {s.view === AppView.MISSION_REPORT && (
          <MissionReport
            nickname={s.nickname}
            avatarId={s.avatarId}
            country={s.country}
            cells={s.cells}
            badges={s.badges}
            photoProofs={photoProofs}
            startedAt={s.gameSession?.startedAt || Date.now()}
            onBack={() => a.setView(AppView.GAME)}
            onReset={() => {
              a.resetGame();
              a.setView(AppView.NICKNAME);
            }}
          />
        )}

      </GameRoom>

      {/* DEVICE CONFLICT MODAL */}
      {s.deviceConflict && (
        <div className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-[#111C35] border-[3px] border-[#FFD700] rounded-3xl p-6 max-w-xs w-full shadow-[8px_8px_0px_black]">
            <div className="text-4xl mb-3 text-center">📱</div>
            <h3 className="font-impact uppercase text-[#FFD700] text-xl tracking-wide text-center">Session active</h3>
            <p className="text-white/60 text-[12px] font-impact uppercase tracking-wider mt-2 text-center leading-relaxed">
              Ta session est déjà ouverte sur un autre appareil. Tu veux l'utiliser ici ?
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={s.deviceConflict.onDecline}
                className="flex-1 py-3 bg-white/8 border-[2px] border-white/20 rounded-2xl font-impact uppercase text-white/60 text-[12px] tracking-widest active:scale-95 transition-transform"
              >
                Non
              </button>
              <button
                onClick={s.deviceConflict.onClaim}
                className="flex-[2] py-3 bg-[#FFD700] border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] font-impact uppercase text-black text-[12px] tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                Oui, ce téléphone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEVICE EVICTION OVERLAY */}
      {s.deviceEvicted && (
        <div className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-[#111C35] border-[3px] border-[#FF2D6A] rounded-3xl p-6 max-w-xs w-full shadow-[8px_8px_0px_black]">
            <div className="text-4xl mb-3 text-center">📵</div>
            <h3 className="font-impact uppercase text-[#FF2D6A] text-xl tracking-wide text-center">Session reprise</h3>
            <p className="text-white/60 text-[12px] font-impact uppercase tracking-wider mt-2 text-center leading-relaxed">
              Ta session a été reprise sur un autre appareil. Scanne à nouveau le QR pour rejouer ici.
            </p>
            <button
              onClick={a.dismissEviction}
              className="w-full mt-5 py-3 bg-[#FFD700] border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] font-impact uppercase text-black text-[12px] tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* 3-2-1 LAUNCH COUNTDOWN OVERLAY */}
      {launchCountdown !== null && (
        <div className="fixed inset-0 z-[350] bg-[#0A1629]/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <p className="font-impact text-white/40 uppercase text-[13px] tracking-[0.4em] mb-4">
            {launchCountdown.isGo ? 'PARTEZ !' : 'Prépare-toi...'}
          </p>
          <div
            key={launchCountdown.isGo ? 'go' : launchCountdown.value}
            className="font-impact leading-none italic animate-in zoom-in-75 duration-200"
            style={{
              fontSize: '200px',
              color: launchCountdown.isGo ? '#00FF9D' : '#FFD700',
              textShadow: '6px 6px 0px black',
            }}
          >
            {launchCountdown.isGo ? 'GO!' : launchCountdown.value}
          </div>
          {!launchCountdown.isGo && (
            <div className="flex gap-2 mt-8">
              {[3, 2, 1].map(n => (
                <div
                  key={n}
                  className={`w-3 h-3 rounded-full border-[2px] border-black transition-all ${n >= launchCountdown.value ? 'bg-[#FFD700]' : 'bg-white/20'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* HIDDEN MASTER LOGIN (Crown Trigger) */}
      {showHiddenLogin && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#0A1629] border-2 border-red-500 rounded-2xl p-8 relative shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <button onClick={() => setShowHiddenLogin(false)} className="absolute top-4 right-4 text-white/30 hover:text-white"><X className="w-6 h-6" /></button>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-500/10 rounded-full border-2 border-red-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <KeyRound className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-impact text-red-500 uppercase tracking-tighter italic">
                {t('master_access_title')}
              </h3>
              <p className="text-[10px] text-white/40 font-impact uppercase tracking-widest mt-2">RESTRICTED AREA</p>
            </div>
            <form onSubmit={handleHiddenLoginSubmit} className="space-y-6">
              <input
                type="password"
                value={hiddenCodeInput}
                onChange={(e) => setHiddenCodeInput(e.target.value)}
                placeholder="SECRET KEY"
                className={`w-full bg-white border-2 rounded-xl p-5 text-center text-black text-2xl font-bold tracking-[0.3em] focus:outline-none transition-all ${hiddenLoginError ? 'border-red-500 animate-[shake_0.5s_ease-in-out]' : 'border-red-500/30 focus:border-red-500'}`}
                autoFocus
              />
              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-impact uppercase py-4 rounded-xl tracking-widest transition-all shadow-lg active:scale-95">
                {t('unlock')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Root App — BrowserRouter + Routes ───────────────────────────────────────
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/master" element={<MasterApp />} />
        <Route path="/*" element={<PlayerApp />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
