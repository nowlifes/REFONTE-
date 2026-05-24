
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Crown, Settings, Sparkles, Zap, Pencil, Lock } from 'lucide-react';
import { ADULT_EMOJI_MAP } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { AppView, BingoCellData, CellStatus, TauntType, ChallengeType } from '../types';
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
import BoostAuctionBanner from './BoostAuctionBanner';
import BoostRevealOverlay from './BoostRevealOverlay';
import EditProfileSheet from './EditProfileSheet';
import { gameService } from '../services/gameService';
import { useGameSounds } from '../hooks/useGameSounds';
import { useGameNotifications } from '../hooks/useGameNotifications';

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
  barTransitionActive?: boolean;
  boostAuctionEndsAt?: number | null;
  boostAuctionType?: 'boost' | 'sabotage';
  boostAuctionWinner?: { name: string; emoji: string; type: 'boost' | 'sabotage' } | null;
  onBoostAuctionWinnerDone?: () => void;
}

const GamePage: React.FC<GamePageProps> = ({ state: s, actions: a, ui, uiActions: uia, onCrownClick, onPhotoProof, secureSessionId, challengeCooldownSecs = 0, isGamePaused = false, chaosMode = false, currentBar = 1, barCadence = '1,2,2', barTransitionActive = false, boostAuctionEndsAt, boostAuctionType = 'boost', boostAuctionWinner, onBoostAuctionWinnerDone }) => {
  // Derive the player's emoji character for cell stamps
  const playerEmojiChar = ADULT_EMOJI_MAP[s.avatarId] || s.avatarId || '🎲';
  const [freezeSecondsLeft, setFreezeSecondsLeft] = useState(0);
  const [revealedCell, setRevealedCell] = useState<import('../types').BingoCellData | null>(null);
  const [assignedPlayer, setAssignedPlayer] = useState<string | null>(null);
  const [assignedPlayerId, setAssignedPlayerId] = useState<string | null>(null);
  const [spotlightSecondsLeft, setSpotlightSecondsLeft] = useState(0);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Revenge challenge — active for 5 min after a PvP loss
  const REVANCHE_DURATION_MS = 5 * 60 * 1000;
  const [revancheExpiresAt, setRevancheExpiresAt] = useState<number | null>(null);
  const [revancheSecondsLeft, setRevancheSecondsLeft] = useState(0);
  const [showCooldownFlash, setShowCooldownFlash] = useState(false);

  // Flash animate-pulse only when joker/taunt count changes (not permanently)
  const [jokerFlash, setJokerFlash] = useState(false);
  const [tauntFlash, setTauntFlash] = useState(false);
  const prevJokersRef = useRef(s.jokers);
  const prevTauntsRef = useRef(s.tauntsLeft);
  useEffect(() => {
    if (s.jokers !== prevJokersRef.current) {
      prevJokersRef.current = s.jokers;
      setJokerFlash(true);
      setTimeout(() => setJokerFlash(false), 1500);
    }
  }, [s.jokers]);
  useEffect(() => {
    if (s.tauntsLeft !== prevTauntsRef.current) {
      prevTauntsRef.current = s.tauntsLeft;
      setTauntFlash(true);
      setTimeout(() => setTauntFlash(false), 1500);
    }
  }, [s.tauntsLeft]);

  useEffect(() => {
    if (!revancheExpiresAt) { setRevancheSecondsLeft(0); return; }
    const update = () => {
      const left = Math.max(0, Math.ceil((revancheExpiresAt - Date.now()) / 1000));
      setRevancheSecondsLeft(left);
      if (left === 0) setRevancheExpiresAt(null);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [revancheExpiresAt]);

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

  // ── 1-2-2 Row-based progressive unlock ──────────────────────────
  const cadenceArray = useMemo((): number[] => barCadence.split(',').map(Number), [barCadence]);
  const unlockedRows = useMemo(() => Math.min(5, cadenceArray.slice(0, currentBar).reduce((a: number, b: number) => a + b, 0)), [cadenceArray, currentBar]);

  const bar2Wave1Complete = useMemo(() => currentBar >= 2 &&
    s.cells.length > 0 &&
    s.cells
      .filter((c: BingoCellData) => Math.floor(c.id / 5) === 1)
      .every((c: BingoCellData) => c.status === CellStatus.VALIDATED),
    [currentBar, s.cells]);

  type RowSeparator = { afterRow: number; barLabel: number; isPrimary: boolean; isWave?: boolean };
  const rowSeparators = useMemo((): RowSeparator[] => {
    const result: RowSeparator[] = [];
    let cum = 0;
    cadenceArray.forEach((goal: number, i: number) => {
      cum += goal;
      if (cum < 5 && cum >= unlockedRows) {
        result.push({ afterRow: cum, barLabel: i + 2, isPrimary: cum === unlockedRows });
      }
    });
    if (currentBar === 2 && !bar2Wave1Complete && unlockedRows >= 3) {
      result.push({ afterRow: 2, barLabel: 2, isPrimary: true, isWave: true });
    }
    return result;
  }, [cadenceArray, unlockedRows, currentBar, bar2Wave1Complete]);

  const sounds = useGameSounds();
  const notifications = useGameNotifications();

  // Stable refs for cell onClick — avoids recreating 25 closures per render
  const frozenRef = useRef(s.isFrozen);
  const cellsStateRef = useRef(s.cells);
  const nicknameRef = useRef(s.nickname);
  const userIdRef = useRef(s.user?.id);
  useEffect(() => { frozenRef.current = s.isFrozen; }, [s.isFrozen]);
  useEffect(() => { cellsStateRef.current = s.cells; }, [s.cells]);
  useEffect(() => { nicknameRef.current = s.nickname; }, [s.nickname]);
  useEffect(() => { userIdRef.current = s.user?.id; }, [s.user?.id]);

  const handleCellClickStable = useCallback(async (id: number) => {
    if (frozenRef.current) return;
    const clicked = cellsStateRef.current.find((c: BingoCellData) => c.id === id);
    if (!clicked) return;
    setRevealedCell(clicked);
    if (clicked.text.includes('{JOUEUR}')) {
      try {
        const entries = await gameService.getLeaderboard(userIdRef.current);
        const others = entries.filter((e: any) => e.pseudo !== nicknameRef.current && e.userId !== userIdRef.current);
        if (others.length > 0) {
          const pick = others[Math.floor(Math.random() * others.length)];
          setAssignedPlayer(pick.pseudo);
          setAssignedPlayerId(pick.userId);
        } else {
          setAssignedPlayer(null);
          setAssignedPlayerId(null);
        }
      } catch {
        setAssignedPlayer(null);
        setAssignedPlayerId(null);
      }
    } else {
      setAssignedPlayer(null);
      setAssignedPlayerId(null);
    }
  }, []); // stable — reads mutable state via refs

  // ── Row unlock animation — fires when Master advances the bar ──
  const prevUnlockedRowsRef = useRef(unlockedRows);
  const [unlockingRows, setUnlockingRows] = useState<number[]>([]);

  useEffect(() => {
    if (unlockedRows > prevUnlockedRowsRef.current) {
      const newRows: number[] = [];
      for (let r = prevUnlockedRowsRef.current; r < unlockedRows; r++) newRows.push(r);
      setUnlockingRows(newRows);
      sounds.playRowUnlock();
      if (navigator.vibrate) navigator.vibrate([80, 60, 120, 60, 200]);
      setTimeout(() => setUnlockingRows([]), 900);
    }
    prevUnlockedRowsRef.current = unlockedRows;
  }, [unlockedRows, sounds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bar 2 wave system — state & side-effects ─────────────────────
  const [showWaveCompleteOverlay, setShowWaveCompleteOverlay] = useState(false);
  const prevBar2Wave1CompleteRef = useRef(false);

  useEffect(() => {
    if (bar2Wave1Complete && !prevBar2Wave1CompleteRef.current) {
      setShowWaveCompleteOverlay(true);
      setUnlockingRows(prev => [...prev, 2]);
      sounds.playRowUnlock();
      if (navigator.vibrate) navigator.vibrate([80, 60, 120, 60, 200]);
      setTimeout(() => {
        setShowWaveCompleteOverlay(false);
        setUnlockingRows(prev => prev.filter(r => r !== 2));
      }, 4000);
    }
    prevBar2Wave1CompleteRef.current = bar2Wave1Complete;
  }, [bar2Wave1Complete, sounds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progressive unlock detection — only center mystery cell (id 12) locks at score < 5
  const CENTER_UNLOCK_SCORE = 5;

  const prevScoreRef = useRef(s.score);
  const [mysteryUnlocking, setMysteryUnlocking] = useState(false);

  useEffect(() => {
    const prev = prevScoreRef.current;
    if (prev < CENTER_UNLOCK_SCORE && s.score >= CENTER_UNLOCK_SCORE) {
      setMysteryUnlocking(true);
      sounds.playMysteryUnlock();
      if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
      setTimeout(() => setMysteryUnlocking(false), 800);
    }
    prevScoreRef.current = s.score;
  }, [s.score, sounds]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Live rank — debounced refetch on activity events (5s) ──────────
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  useEffect(() => {
    if (!s.user?.id) return;
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const fetchRank = async () => {
      try {
        const entries = await gameService.getLeaderboard(s.user.id);
        if (!cancelled) {
          const me = entries.find((e: any) => e.isCurrentUser);
          if (me) setPlayerRank(me.rank);
        }
      } catch {}
    };
    const debouncedFetch = () => {
      if (cancelled) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchRank, 5000);
    };
    fetchRank();
    const unsub = gameService.subscribeToActivities(debouncedFetch);
    return () => { cancelled = true; if (debounceTimer) clearTimeout(debounceTimer); unsub(); };
  }, [s.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Taunt received — sound + notification ────────────────────────
  const prevFrozenRef = useRef(s.isFrozen);
  useEffect(() => {
    if (!prevFrozenRef.current && s.isFrozen) {
      sounds.playTauntReceived();
      notifications.notifyTaunt();
    }
    prevFrozenRef.current = s.isFrozen;
  }, [s.isFrozen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cadence cooldown — track last validation time and remaining cooldown
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);
  const [lastValidationTime, setLastValidationTime] = useState(0);
  useEffect(() => {
    if (!challengeCooldownSecs || challengeCooldownSecs <= 0) { setCooldownSecondsLeft(0); return; }
    const update = () => {
      const elapsed = (Date.now() - lastValidationTime) / 1000;
      const left = Math.max(0, Math.ceil(challengeCooldownSecs - elapsed));
      setCooldownSecondsLeft(left);
    };
    const iv = setInterval(update, 500);
    update();
    return () => clearInterval(iv);
  }, [challengeCooldownSecs, lastValidationTime]);

  const handleValidateCell = (data?: any) => {
    if (isGamePaused) return;
    const isMasterCell = s.selectedCell?.type === ChallengeType.MASTER;
    if (!isMasterCell && challengeCooldownSecs > 0 && cooldownSecondsLeft > 0) {
      setShowCooldownFlash(true);
      setTimeout(() => setShowCooldownFlash(false), 800);
      return;
    }
    setLastValidationTime(Date.now());
    if (data?.proofImage && s.selectedCell) onPhotoProof?.(s.selectedCell.id, data.proofImage);
    // PvP loss → start revenge timer
    if (data?.pvpWon === false) {
      setRevancheExpiresAt(Date.now() + REVANCHE_DURATION_MS);
    }
    a.validateCell(data);
    sounds.playValidate();
    if (navigator.vibrate) navigator.vibrate([30, 20, 80]);
  };

  // Line completion celebration — auto-dismiss after 3s
  const lineEventTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!s.lineCompleteEvent) return;
    if (s.lineCompleteEvent.isFullGrid) sounds.playBingo();
    else sounds.playLineComplete();
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

  // Chaos mode announcement — fires once when chaos becomes active
  const prevChaosRef = useRef(chaosMode);
  const [showChaosAnnounce, setShowChaosAnnounce] = useState(false);
  useEffect(() => {
    if (!prevChaosRef.current && chaosMode) {
      setShowChaosAnnounce(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 200, 50, 300]);
      setTimeout(() => setShowChaosAnnounce(false), 3200);
    }
    prevChaosRef.current = chaosMode;
  }, [chaosMode]);

  // ── Joker Discovery — one-time reward moment at score 3 ────────
  const [showJokerDiscovery, setShowJokerDiscovery] = useState(false);
  const jokerDiscoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (s.score < 3) return;
    try {
      if (localStorage.getItem('bingo_joker_discovery_shown') === '1') return;
    } catch {}
    setShowJokerDiscovery(true);
    try { localStorage.setItem('bingo_joker_discovery_shown', '1'); } catch {}
    if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
    if (jokerDiscoveryTimerRef.current) clearTimeout(jokerDiscoveryTimerRef.current);
    jokerDiscoveryTimerRef.current = setTimeout(() => setShowJokerDiscovery(false), 4000);
    return () => { if (jokerDiscoveryTimerRef.current) clearTimeout(jokerDiscoveryTimerRef.current); };
  }, [s.score]);
  const dismissJokerDiscovery = () => {
    if (jokerDiscoveryTimerRef.current) clearTimeout(jokerDiscoveryTimerRef.current);
    setShowJokerDiscovery(false);
  };

  // ── Taunt Discovery — one-time reveal moment when player enters Bar 2 ──
  const [showTauntDiscovery, setShowTauntDiscovery] = useState(false);
  const tauntDiscoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (currentBar !== 2) return;
    try {
      if (localStorage.getItem('bingo_taunt_discovery_shown') === '1') return;
    } catch {}
    setShowTauntDiscovery(true);
    try { localStorage.setItem('bingo_taunt_discovery_shown', '1'); } catch {}
    if (navigator.vibrate) navigator.vibrate([100, 50, 200, 50, 100]);
    if (tauntDiscoveryTimerRef.current) clearTimeout(tauntDiscoveryTimerRef.current);
    tauntDiscoveryTimerRef.current = setTimeout(() => setShowTauntDiscovery(false), 10000);
    return () => { if (tauntDiscoveryTimerRef.current) clearTimeout(tauntDiscoveryTimerRef.current); };
  }, [currentBar]);
  const dismissTauntDiscovery = () => {
    if (tauntDiscoveryTimerRef.current) clearTimeout(tauntDiscoveryTimerRef.current);
    setShowTauntDiscovery(false);
  };

  const [isResetPressing, setIsResetPressing] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startResetPress = () => {
    if (isResetPressing || resetIntervalRef.current) return;
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
    <div className={`fixed inset-0 bg-[#0A1629] text-white flex flex-col items-center overflow-hidden ${chaosMode ? 'ring-[8px] ring-inset ring-[#CC0000]' : isFever ? 'ring-[8px] ring-inset ring-[#FF2D6A] transition-all duration-500' : ''}`}>
      {/* PAUSE OVERLAY */}
      {isGamePaused && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#0A1629]/95 animate-in fade-in duration-300">
          <div className="bg-[#111C35] border-[4px] border-[#FFD700] rounded-3xl p-10 shadow-[8px_8px_0px_black] text-center max-w-xs w-full mx-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FFD700]/15 border-[3px] border-[#FFD700] flex items-center justify-center">
              <span className="text-3xl">⏸</span>
            </div>
            <h2 className="font-impact uppercase text-[#FFD700] text-2xl tracking-wider">{t('game_paused_title')}</h2>
            <p className="text-white/60 text-sm leading-relaxed">{t('game_paused_desc')}</p>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#FFD700] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ⚡ CHAOS MODE — full-screen announcement (shows once on activation) */}
      {showChaosAnnounce && (
        <div className="fixed inset-0 z-[260] flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#CC0000]" />
          {/* Brutalist noise dots */}
          <div className="absolute inset-0 pointer-events-none opacity-15">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="absolute rounded-full bg-black"
                style={{ width: 6 + (i % 4) * 4, height: 6 + (i % 4) * 4, left: `${(i * 19 + 3) % 95}%`, top: `${(i * 23 + 7) % 90}%` }} />
            ))}
          </div>
          <div className="relative z-10 flex flex-col items-center text-center px-6 gap-4">
            <div className="font-impact uppercase italic leading-none text-white animate-in zoom-in-75 duration-300"
              style={{ fontSize: 'clamp(56px, 18vw, 80px)', textShadow: '4px 4px 0px rgba(0,0,0,0.6)' }}>
              ⚡ CHAOS ⚡
            </div>
            <div className="font-impact uppercase italic text-white/90 text-2xl tracking-tight animate-in slide-in-from-bottom-2 duration-300 delay-100"
              style={{ fontSize: 'clamp(20px, 6vw, 28px)', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
              {language === 'fr' ? "ATTAQUE AVANT D'ÊTRE ATTAQUÉ !" : 'ATTACK BEFORE BEING ATTACKED!'}
            </div>
            <div className="bg-black border-[4px] border-black rounded-2xl px-6 py-4 shadow-[6px_6px_0px_rgba(0,0,0,0.4)] animate-in zoom-in-90 duration-300 delay-200">
              <div className="font-impact uppercase text-[#CC0000] leading-tight" style={{ fontSize: 'clamp(16px, 4.5vw, 22px)' }}>
                {language === 'fr' ? 'CHAQUE DÉFI = UN SABOTAGE GRATUIT' : 'EVERY CHALLENGE = 1 FREE SABOTAGE'}
              </div>
              <div className="font-impact uppercase text-white/60 text-[10px] tracking-widest mt-1.5">
                {language === 'fr' ? '⚡ GRILLE ENTIÈRE DÉBLOQUÉE · FONCE OU DISPARAIS ⚡' : '⚡ FULL GRID UNLOCKED · GO OR DISAPPEAR ⚡'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ CHAOS MODE banner — persistent top strip while active */}
      {chaosMode && (
        <div className="fixed top-0 inset-x-0 z-[160] pointer-events-none">
          <div className="bg-[#CC0000] border-b-[3px] border-black py-2 flex items-center justify-center gap-2">
            <span className="font-impact uppercase text-white text-[10px] tracking-[0.25em]">⚡ CHAOS</span>
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <span className="font-impact uppercase text-white text-[10px] tracking-[0.2em]">{language === 'fr' ? 'TOUT LE MONDE A UN SABOTAGE' : 'EVERYONE HAS A SABOTAGE'}</span>
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <span className="font-impact uppercase text-white text-[10px]">⚡</span>
          </div>
        </div>
      )}

      <NetworkStatus />
      {/* Witness request banner — shown when another player designated us as witness */}
      {s.gameSession && (
        <WitnessRequestBanner playerId={localStorage.getItem('bingo_user_id') || ''} />
      )}
      {/* Boost auction — master triggered group vote to give a free taunt */}
      {boostAuctionEndsAt && boostAuctionEndsAt > Date.now() && s.user && secureSessionId && (
        <BoostAuctionBanner
          endsAt={boostAuctionEndsAt}
          sessionId={secureSessionId}
          currentPlayerId={s.user.id}
          auctionType={boostAuctionType}
        />
      )}
      {boostAuctionWinner && onBoostAuctionWinnerDone && (
        <BoostRevealOverlay winner={boostAuctionWinner} onDone={onBoostAuctionWinnerDone} />
      )}
      <ActivityFeed />
      <BackgroundParticles />
      
      <BadgeNotification badge={s.newBadge} onClose={a.clearNewBadge} />

      {/* CHALLENGE VALIDATED — feedback visuel fort */}
      {s.challengeValidatedEvent && (
        <div
          key={s.challengeValidatedEvent.cellText}
          className="fixed top-[62px] inset-x-0 flex justify-center z-[165] pointer-events-none animate-in zoom-in-90 fade-in duration-200"
        >
          <div className="flex items-center gap-3 bg-[#00FF9D] border-[3px] border-black rounded-2xl px-4 py-2.5 shadow-[5px_5px_0px_black] max-w-[88vw]">
            {/* Avatar */}
            <div className="w-9 h-9 bg-[#FFD700] border-[2px] border-black rounded-xl flex items-center justify-center shrink-0 text-xl shadow-[2px_2px_0px_black]">
              {ADULT_EMOJI_MAP[s.avatarId] || s.avatarId || '🎲'}
            </div>
            {/* Texte */}
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-impact text-black uppercase text-[13px] tracking-tight">
                ✓ {language === 'fr' ? 'Défi validé !' : 'Challenge done!'}
              </span>
              <span className="font-impact text-black/50 uppercase text-[9px] tracking-widest truncate max-w-[52vw]">
                {s.challengeValidatedEvent.cellText}
              </span>
            </div>
            {/* +1 pill */}
            <div className="shrink-0 bg-black text-[#00FF9D] font-impact text-[13px] uppercase rounded-lg px-2 py-1 leading-none">
              +1
            </div>
          </div>
        </div>
      )}

      {/* COMBO notification — disponible à partir du bar 2 */}
      {s.comboActive && currentBar >= 2 && (
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
              <span className="font-impact text-white uppercase text-lg tracking-tight">+1 SABOTAGE !</span>
              <span className="font-impact text-white/60 uppercase text-[9px] tracking-widest">{language === 'fr' ? 'Défi spotlight validé' : 'Spotlight challenge cleared'}</span>
            </div>
          </div>
        </div>
      )}

      {/* SPOTLIGHT banner — top center, sous le header */}
      {s.spotlightCellId !== null && spotlightSecondsLeft > 0 && (
        <div className="fixed top-[62px] left-0 right-0 flex justify-center z-[155] pointer-events-none">
          <div className="bg-[#FFD700] border-[3px] border-black rounded-2xl px-3 py-2 shadow-[4px_4px_0px_black] flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <span className="text-base">⚡</span>
            <div className="flex flex-col leading-none">
              <span className="font-impact text-black uppercase text-[11px] tracking-tight">SPOTLIGHT</span>
              <span className="font-impact text-black/50 uppercase text-[8px] tracking-widest">
                {language === 'fr' ? 'Valide → +1 sabotage' : 'Clear → +1 sabotage'}
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
                    {language === 'fr' ? 'SABOTÉ !' : 'SABOTAGED!'}
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
            <div className={`flex items-center gap-2 border-[3px] border-black rounded-2xl px-5 py-2.5 shadow-[4px_4px_0px_black] ${s.lineCompleteEvent?.reward === 'taunt' ? 'bg-[#FF2D6A]' : 'bg-[#00FF9D]'}`}>
              <span className="text-xl">{s.lineCompleteEvent?.reward === 'taunt' ? '⚡' : '🎁'}</span>
              <div className="flex flex-col leading-none">
                <span className={`font-impact uppercase text-[14px] tracking-widest ${s.lineCompleteEvent?.reward === 'taunt' ? 'text-white' : 'text-black'}`}>
                  {s.lineCompleteEvent?.reward === 'taunt'
                    ? (language === 'fr' ? '+1 SABOTAGE GAGNÉ!' : '+1 SABOTAGE EARNED!')
                    : (language === 'fr' ? '+1 JOKER GAGNÉ!' : '+1 JOKER EARNED!')}
                </span>
                <span className={`font-impact uppercase text-[9px] tracking-widest ${s.lineCompleteEvent?.reward === 'taunt' ? 'text-white/60' : 'text-black/50'}`}>
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
          <button onClick={() => setShowEditProfile(true)} className="relative active:scale-90 transition-transform group">
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
            {/* Edit hint — tiny pencil badge */}
            <div className="absolute -bottom-[3px] -right-[3px] w-[14px] h-[14px] bg-white border border-black rounded-full flex items-center justify-center shadow-[1px_1px_0px_black] pointer-events-none">
              <Pencil size={7} className="text-black" strokeWidth={3} />
            </div>
          </button>
          <button id="tutorial-score-target" onClick={() => uia.setShowBadge(true)} className="flex flex-col items-start leading-none active:opacity-70 transition-opacity">
            <span className="font-impact text-[10px] text-[#00F5A0] uppercase tracking-tighter">{s.nickname}</span>
            <span className="text-[7px] text-white/40 font-impact uppercase tracking-widest mt-0.5">{s.country || 'FR'}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
             {/* Bar indicator pill */}
             {(() => {
               const cadenceGoals = barCadence.split(',').map(Number);
               const barGoal = cadenceGoals[currentBar - 1] ?? 1;
               return chaosMode ? (
                 <div className="flex items-center gap-1 bg-[#CC0000]/20 border border-[#CC0000]/50 rounded-lg px-2 py-1 animate-pulse">
                   <span className="text-[9px]">⚡</span>
                   <span className="font-impact text-[#CC0000] text-[9px] uppercase tracking-wider">CHAOS</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1 bg-[#FF8C00]/10 border border-[#FF8C00]/30 rounded-lg px-2 py-1">
                   <span className="font-impact text-[#FF8C00] text-[9px] uppercase tracking-wider">Bar {currentBar}</span>
                   <span className="text-[#FF8C00]/40 text-[8px]">·</span>
                   <span className="font-impact text-white/40 text-[9px] uppercase">{barGoal}L</span>
                 </div>
               );
             })()}
             {/* Live rank pill */}
             {playerRank && (
               <div className="flex items-center bg-[#FF2D6A]/10 border border-[#FF2D6A]/35 rounded-lg px-2 py-1">
                 <span className="font-impact text-[#FF2D6A] text-[11px] uppercase italic leading-none">#{playerRank}</span>
               </div>
             )}
             <div
                className={`bg-[#FFD700] px-3 py-1.5 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_black] flex flex-col items-center transition-all duration-300 cursor-pointer select-none ${isResetPressing ? 'scale-110 bg-red-500' : ''}`}
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
        {/* Outer wrapper — relative anchor for row-unlock separators */}
        <div className="relative p-4 bg-black/40 rounded-[2rem] border-[4px] border-white/5 shadow-2xl">
          <div
            id="tutorial-grid-area"
            className="grid grid-cols-5 gap-[4px] p-[4px] bg-[#1A1A2E] rounded-[12px] shadow-inner"
            style={{ width: '350px', height: '350px' }}
          >
              {(() => {
                const now = Date.now();
                return s.cells.map((cell: BingoCellData) => {
                  const cellRow = Math.floor(cell.id / 5);
                  const isWaveLocked = !chaosMode && cellRow === 2 && currentBar === 2 && !bar2Wave1Complete;
                  const isRowLocked = !chaosMode && (cellRow >= unlockedRows || isWaveLocked);
                  const isCenter = cell.id === 12;
                  const isLocked = !isRowLocked && isCenter && isMysteryCellLocked;
                  const isRowUnlocking = unlockingRows.includes(cellRow);
                  const isUnlocking = (isCenter && mysteryUnlocking) || isRowUnlocking;
                  const rowUnlocksAtBar = isRowLocked
                    ? [...rowSeparators].reverse().find((sep: RowSeparator) => sep.afterRow <= cellRow)?.barLabel
                    : undefined;
                  return (
                    <BingoCell
                      key={cell.id}
                      data={cell}
                      onClick={handleCellClickStable}
                      isWinning={s.winningIds.includes(cell.id)}
                      winningIndex={s.winningIds.indexOf(cell.id)}
                      isFeverTarget={s.feverCells.includes(cell.id)}
                      isLocked={isLocked}
                      isUnlocking={isUnlocking}
                      isSpotlight={cell.id === s.spotlightCellId && !!s.spotlightEndsAt && now < s.spotlightEndsAt}
                      avatarEmoji={playerEmojiChar}
                      rowLocked={isRowLocked}
                      rowUnlocksAtBar={rowUnlocksAtBar}
                      chaosMode={chaosMode}
                    />
                  );
                });
              })()}
          </div>

          {/* ── Row-unlock separators ───────────────────────────── */}
          {rowSeparators.map((sep) => {
            const { afterRow, barLabel, isPrimary } = sep;
            // Position: centered in the 4px gap between row (afterRow-1) and row (afterRow)
            // top = outer_padding(16) + grid_padding(4) + afterRow * row_stride(70) - gap_half(2)
            const topPx = 16 + 4 + afterRow * 70 - 2;
            return (
              <div
                key={sep.isWave ? `wave-${afterRow}` : barLabel}
                className="absolute z-20 pointer-events-none flex items-center justify-center"
                style={{ left: 16, top: topPx - 10, width: 350, height: 20 }}
              >
                {/* Glowing divider line */}
                <div
                  className={`absolute inset-y-[9px] left-0 right-0 h-[1.5px] separator-glow`}
                  style={{
                    background: sep.isWave
                      ? 'linear-gradient(to right, transparent, #00F5A0CC, transparent)'
                      : isPrimary
                        ? 'linear-gradient(to right, transparent, #FF8C00CC, transparent)'
                        : 'linear-gradient(to right, transparent, #ffffff40, transparent)',
                  }}
                />
                {/* Badge */}
                <div
                  className={`relative flex items-center gap-1 rounded-[6px] border-[2px] border-black shadow-[2px_2px_0px_black] px-[7px] py-[3px]`}
                  style={{ background: sep.isWave ? '#00F5A0' : isPrimary ? '#FF8C00' : '#2A3555' }}
                >
                  <Lock size={7} strokeWidth={3} style={{ color: '#000' }} />
                  <span
                    className="font-impact uppercase tracking-widest whitespace-nowrap"
                    style={{ fontSize: '8px', color: '#000' }}
                  >
                    {sep.isWave
                      ? t('wave_challenges').replace('{n}', '5')
                      : isPrimary ? t('unlocked_at_bar').replace('{n}', String(barLabel)) : t('bar_label').replace('{n}', String(barLabel))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* CADENCE COOLDOWN badge + anti-spam gamified message */}
      {challengeCooldownSecs > 0 && cooldownSecondsLeft > 0 && currentBar >= 2 && (
        <div className="shrink-0 flex flex-col items-center gap-1 z-40 -mb-1">
          <div className={`flex items-center gap-2 bg-[#FF8C00] border-[3px] border-black rounded-2xl px-4 py-2 shadow-[4px_4px_0px_black] animate-in slide-in-from-bottom-2 duration-200 transition-transform ${showCooldownFlash ? 'scale-110' : 'scale-100'}`}>
            <span className="text-sm">⏳</span>
            <div className="flex flex-col leading-none">
              <span className="font-impact text-black uppercase text-[11px] tracking-widest">{t('cooldown_title')}</span>
              <span className="font-impact text-black/60 uppercase text-[9px] tracking-widest">
                {t('cooldown_sub').replace('{n}', String(cooldownSecondsLeft))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REVENGE banner — 5 min after a PvP loss */}
      {revancheSecondsLeft > 0 && (
        <div className="shrink-0 flex flex-col items-center gap-1 z-40 -mb-1 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 bg-[#FF2D6A] border-[3px] border-black rounded-2xl px-4 py-2 shadow-[4px_4px_0px_black]">
            <span className="text-sm">⚔️</span>
            <div className="flex flex-col leading-none">
              <span className="font-impact text-white uppercase text-[11px] tracking-widest">{t('revanche_title')}</span>
              <span className="font-impact text-white/60 uppercase text-[9px] tracking-widest">
                {t('revanche_sub').replace('{n}', String(Math.ceil(revancheSecondsLeft / 60)))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Power-ups — jokers + sabotages fusionnés */}
      <div className="shrink-0 pb-1 flex justify-center z-40">
        <div className="flex items-center bg-black/50 border-[2px] border-white/10 rounded-2xl overflow-hidden">
          <div className={`flex items-center gap-1.5 px-4 py-2 transition-all duration-300 ${s.jokers > 0 ? 'text-[#00F5A0]' : 'text-white/20'}`}>
            <Sparkles size={12} className={jokerFlash ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-impact uppercase tracking-widest leading-none">{s.jokers} joker{s.jokers !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-px h-5 bg-white/15 shrink-0" />
          <button
            onClick={() => a.setView(AppView.LEADERBOARD)}
            className={`flex items-center gap-1.5 px-4 py-2 transition-all active:bg-white/5 ${s.tauntsLeft > 0 ? 'text-[#FF2E63]' : 'text-white/20'}`}
          >
            <Zap size={12} fill="currentColor" className={tauntFlash ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-impact uppercase tracking-widest leading-none">{s.tauntsLeft} sabotage{s.tauntsLeft !== 1 ? 's' : ''}</span>
          </button>
        </div>
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
              className={`w-16 h-16 bg-white border-[4px] border-black rounded-2xl flex flex-col items-center justify-center shadow-[6px_6px_0px_black] -mt-16 cursor-pointer transition-all group relative ${isCrownPressing ? 'scale-125 bg-[#FFD700]' : 'active:scale-95'}`}
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
          assignedPlayer={assignedPlayer}
          onConfirm={() => {
            a.handleCellClick(revealedCell.id);
            setRevealedCell(null);
            setAssignedPlayer(null);
            setAssignedPlayerId(null);
          }}
          onClose={() => { setRevealedCell(null); setAssignedPlayer(null); setAssignedPlayerId(null); }}
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
                      await gameService.requestMasterValidation(
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
              sessionId={secureSessionId}
              currentPlayerId={s.gameSession?.userId}
              onRequestPlayerWitness={
                s.selectedCell && s.gameSession && secureSessionId
                  ? async (witnessPlayerId: string) => {
                      await gameService.requestPlayerWitness(
                        s.gameSession!.id,
                        s.selectedCell!.id,
                        s.selectedCell!.text,
                        s.nickname || 'Joueur',
                        s.avatarId || '🎲',
                        secureSessionId!,
                        witnessPlayerId
                      );
                    }
                  : undefined
              }
              onFortuneWon={a.grantFortuneTaunt}
              assignedPlayerId={assignedPlayerId ?? undefined}
              onPvpLost={assignedPlayerId ? async (opponentId: string) => {
                await gameService.awardDuelVictory(opponentId);
                a.setSelectedCell(null);
                setRevancheExpiresAt(Date.now() + REVANCHE_DURATION_MS);
              } : undefined}
          />
        </div>
      )}
      {s.activeScannerMode === 'MASTER' && (
          <QRScanner
            mode={'MASTER'}
            onScanSuccess={() => { a.validateCell(); a.setSelectedCell(null); }}
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

      {/* JOKER DISCOVERY — one-time reward moment when score reaches 3 */}
      {showJokerDiscovery && (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center animate-in fade-in duration-200"
          onClick={dismissJokerDiscovery}
        >
          <div className="absolute inset-0 bg-[#0A1629]/85" />
          <div
            className="relative flex flex-col items-center gap-4 px-7 py-7 bg-[#0A1629] border-[4px] border-[#FFD700] rounded-2xl shadow-[8px_8px_0px_black] max-w-[86vw] animate-in zoom-in-90 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Badge "NEW" pill */}
            <div className="bg-[#FFD700] border-[3px] border-black rounded-lg px-3 py-1 shadow-[3px_3px_0px_black] -mt-12">
              <span className="font-impact uppercase text-black text-[11px] tracking-[0.25em]">
                {language === 'fr' ? '✨ Découverte' : '✨ Unlocked'}
              </span>
            </div>

            {/* Big icon */}
            <div className="text-5xl leading-none">🃏</div>

            {/* Title */}
            <div className="font-impact uppercase italic text-[#FFD700] text-3xl tracking-tight leading-none text-center"
                 style={{ textShadow: '3px 3px 0px black' }}>
              {language === 'fr' ? 'JOKERS DÉBLOQUÉS' : 'JOKERS UNLOCKED'}
            </div>

            {/* Explanation */}
            <p className="font-impact uppercase text-white/80 text-[11px] tracking-widest text-center leading-relaxed max-w-[260px]">
              {language === 'fr'
                ? "Un défi qui te saoule ? Skippe-le avec un joker."
                : "Hate a challenge? Skip it with a joker."}
            </p>

            {/* Joker count pill */}
            <div className="flex items-center gap-2 bg-[#FFD700] border-[3px] border-black rounded-xl px-4 py-2 shadow-[4px_4px_0px_black]">
              <Sparkles size={14} className="text-black" />
              <span className="font-impact uppercase text-black text-sm tracking-widest">
                {language === 'fr' ? `Tu en as ${s.jokers}` : `You have ${s.jokers}`}
              </span>
            </div>

            {/* Tap hint */}
            <span className="font-impact uppercase text-white/35 text-[9px] tracking-[0.3em] mt-1">
              {t('tap_close')}
            </span>
          </div>
        </div>
      )}

      {/* TAUNT DISCOVERY — one-time power-up reveal when entering Bar 2 */}
      {showTauntDiscovery && (
        <div className="fixed inset-0 z-[171] flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/85" />
          <div
            className="relative flex flex-col items-center gap-5 px-7 py-8 bg-[#0A1629] border-[4px] border-[#FF2D6A] rounded-2xl shadow-[8px_8px_0px_black] max-w-[88vw] w-full animate-in zoom-in-90 duration-300"
            style={{ maxWidth: 340 }}
          >
            {/* "POWER UNLOCKED" badge */}
            <div className="bg-[#FF2D6A] border-[3px] border-black rounded-lg px-3 py-1 shadow-[3px_3px_0px_black] -mt-14">
              <span className="font-impact uppercase text-white text-[11px] tracking-[0.25em]">
                💥 {language === 'fr' ? 'NOUVEAU POUVOIR' : 'POWER UNLOCKED'}
              </span>
            </div>

            {/* Title */}
            <div
              className="font-impact uppercase italic text-[#FF2D6A] text-[32px] tracking-tight leading-none text-center"
              style={{ textShadow: '3px 3px 0px black' }}
            >
              {t('taunts_unlocked_title')}
            </div>

            {/* Explanation */}
            <p className="font-impact uppercase text-white/70 text-[11px] tracking-widest text-center leading-relaxed">
              {t('taunts_unlocked_desc')}
            </p>

            {/* FREE sabotage CTA — makes it enticing */}
            <div className="w-full bg-[#FF2D6A] border-[3px] border-black rounded-xl px-5 py-4 shadow-[5px_5px_0px_black] text-center">
              <div className="font-impact uppercase text-white text-[22px] italic leading-none tracking-tight">
                {language === 'fr' ? '🎁 1 SABOTAGE OFFERT' : '🎁 1 FREE SABOTAGE'}
              </div>
              <div className="font-impact uppercase text-white/70 text-[10px] tracking-widest mt-1.5">
                {language === 'fr' ? 'Essaie-le — complète des défis pour en avoir d\'autres' : 'Try it — complete challenges to earn more'}
              </div>
            </div>

            {/* How to earn */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Zap size={13} fill="currentColor" className="text-[#FF2D6A] shrink-0" />
              <span className="font-impact uppercase text-white/60 text-[10px] tracking-widest leading-tight">
                {t('taunts_earn_desc')}
              </span>
            </div>

            {/* Dismiss button */}
            <button
              onClick={dismissTauntDiscovery}
              className="w-full py-3.5 bg-white text-black font-impact uppercase text-[13px] tracking-widest border-[3px] border-black shadow-[4px_4px_0px_black] rounded-xl active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {language === 'fr' ? "J'AI COMPRIS !" : "GOT IT!"}
            </button>
          </div>
        </div>
      )}

      {/* WAVE COMPLETE OVERLAY — 5/5 défis bar 2 vague 1 */}
      {showWaveCompleteOverlay && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-3 bg-[#00F5A0] border-[4px] border-black shadow-[8px_8px_0px_black] rounded-2xl px-8 py-7 text-center">
            <div className="text-4xl">🏆</div>
            <div className="font-impact uppercase text-black text-2xl tracking-tight leading-none">{t('wave_complete_title')}</div>
            <div className="font-impact uppercase text-black/70 text-sm tracking-widest">{t('wave_unlocked')}</div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[350] bg-black/80 flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0A1629] border-t-[4px] border-x-[4px] border-black rounded-t-[28px] shadow-[0_-8px_0px_black] px-5 pt-6 pb-10 animate-in slide-in-from-bottom-4 duration-250">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <h3 className="font-impact uppercase text-white text-xl tracking-tight text-center mb-2">{t('reset_confirm_title')}</h3>
            <p className="font-impact uppercase text-white/40 text-[10px] tracking-widest text-center leading-relaxed mb-6">
              {t('reset_confirm_desc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-4 bg-white/8 border-[2px] border-white/15 rounded-2xl font-impact uppercase text-white/60 text-[13px] tracking-widest active:bg-white/15 transition-all"
              >
                {t('reset_confirm_cancel')}
              </button>
              <button
                onClick={() => { setShowResetConfirm(false); a.resetGame(); a.setView(AppView.NICKNAME); }}
                className="flex-[2] py-4 bg-[#FF2D6A] border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] font-impact uppercase text-white text-[13px] tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                {t('reset_confirm_yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
