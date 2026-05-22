
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import canvasConfetti from 'canvas-confetti';
import { BingoCellData, ChallengeType, CellStatus, AppView, UserProfile, GameSession, TauntType } from '../types';
import { CHALLENGES_EN, CHALLENGES_FR, INITIAL_JOKERS, SOUNDS } from '../constants';

// Max age of offline-cached session before we discard it (24 hours)
const EXPIRATION_TIME = 24 * 60 * 60 * 1000;
import { gameService } from '../services/gameService';
import { useLanguage } from '../contexts/LanguageContext';
import { useBadges } from './useBadges';

export const useBingoGame = (opts: { spotlightDisabled?: boolean; currentBar?: number } = {}) => {
  const spotlightDisabledRef = useRef(opts.spotlightDisabled ?? false);
  useEffect(() => { spotlightDisabledRef.current = opts.spotlightDisabled ?? false; }, [opts.spotlightDisabled]);
  const currentBarRef = useRef(opts.currentBar ?? 1);
  useEffect(() => { currentBarRef.current = opts.currentBar ?? 1; }, [opts.currentBar]);
  const { language } = useLanguage();
  
  // DEFAULT VIEW IS NOW NICKNAME
  const [view, setView] = useState<AppView>(AppView.NICKNAME);
  const [isLoading, setIsLoading] = useState(true);

  // 7.1 Double connection — persistent device UUID
  const getMyDeviceId = (): string => {
    let id = localStorage.getItem('bingo_device_id');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('bingo_device_id', id); }
    return id;
  };
  const [deviceConflict, setDeviceConflict] = useState<{ playerId: string; onClaim: () => void; onDecline: () => void } | null>(null);
  const [deviceEvicted, setDeviceEvicted] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);

  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState('PartyKing');
  const [country, setCountry] = useState('FR');

  const [cells, setCells] = useState<BingoCellData[]>([]);
  const [jokers, setJokers] = useState(INITIAL_JOKERS);
  
  const [winningIds, setWinningIds] = useState<number[]>([]);
  const [feverCells, setFeverCells] = useState<number[]>([]);
  const [completedLineCount, setCompletedLineCount] = useState(0);
  const [lineCompleteEvent, setLineCompleteEvent] = useState<{ totalLines: number; isFullGrid: boolean; reward: 'joker' | 'taunt' } | null>(null);
  
  const [activeScannerMode, setActiveScannerMode] = useState<'ENTRY' | 'MASTER' | null>(null);
  const [selectedCell, setSelectedCell] = useState<BingoCellData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [lastWitnessTime, setLastWitnessTime] = useState(0);
  const [frozenUntil, setFrozenUntil] = useState<number | undefined>(() => {
    try {
      const v = localStorage.getItem('bingo_frozen_until');
      if (!v) return undefined;
      const t = Number(v);
      return t > Date.now() ? t : undefined;
    } catch { return undefined; }
  });
  useEffect(() => {
    try {
      if (frozenUntil && frozenUntil > Date.now()) {
        localStorage.setItem('bingo_frozen_until', String(frozenUntil));
      } else {
        localStorage.removeItem('bingo_frozen_until');
      }
    } catch {}
  }, [frozenUntil]);
  const [tauntType, setTauntType] = useState<TauntType>(TauntType.FREEZE);
  const [tauntSenderName, setTauntSenderName] = useState<string | null>(null);
  // --- SPOTLIGHT ---
  const [spotlightCellId, setSpotlightCellId] = useState<number | null>(null);
  const [spotlightEndsAt, setSpotlightEndsAt] = useState<number | null>(null);
  const spotlightPicked = useRef(false);
  const spotlightBarCount = useRef(0); // resets on each bar transition
  // Ref so pickSpotlight always reads current cells (avoids stale closure bug).
  const cellsRef = useRef(cells);

  // Keep cellsRef current so spotlight timer always picks from non-validated cells.
  useEffect(() => { cellsRef.current = cells; }, [cells]);

  // --- COMBO ---
  const validationTimestamps = useRef<number[]>([]);
  const [comboActive, setComboActive] = useState(false);
  // Clear combo window on bar transition — timestamps from bar 1 must not trigger bar 2 combo
  useEffect(() => { validationTimestamps.current = []; }, [opts.currentBar]);

  // --- BONUS TAUNT NOTIFICATION ---
  const [bonusTauntActive, setBonusTauntActive] = useState(false);

  // --- CHALLENGE VALIDATED FEEDBACK ---
  const [challengeValidatedEvent, setChallengeValidatedEvent] = useState<{ cellText: string } | null>(null);

  // Badge System
  const { badges, newBadge, injectBadge, clearNewBadge, resetBadges } = useBadges(user?.id);

  // --- AUDIO SYSTEM OPTIMIZED (PRELOAD) ---
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // Preload all sounds on mount to ensure zero latency
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.preload = 'auto';
      audioRefs.current[key] = audio;
    });
    return () => {
      (Object.values(audioRefs.current) as HTMLAudioElement[]).forEach(a => { a.pause(); a.src = ''; });
      audioRefs.current = {};
    };
  }, []);

  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    if (!soundEnabled) return;
    
    const audio = audioRefs.current[type];
    if (audio) {
      audio.currentTime = 0; // Reset for rapid replay
      audio.play().catch(() => {
        // Ignore auto-play blocking errors
      });
    }
  }, [soundEnabled]);

  const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | 'success') => {
    if (!navigator.vibrate) return;
    switch (pattern) {
      case 'light': navigator.vibrate(10); break;
      case 'medium': navigator.vibrate(40); break;
      case 'heavy': navigator.vibrate(70); break;
      case 'success': navigator.vibrate([50, 50, 100]); break;
    }
  };

  // INITIALIZATION
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);

      // 4.3 Account recovery via magic token (?recover=TOKEN)
      // Must run BEFORE the ?s= check so we don't wipe the restored user_id.
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const recoverToken = urlParams?.get('recover');
      if (recoverToken) {
        try {
          const recovered = await gameService.recoverByToken(recoverToken);
          if (recovered) {
            localStorage.setItem('bingo_user_id', recovered.playerId);
            // Immediately claim this device so the device-conflict modal is skipped —
            // the recovery token proves identity, no need to ask "use this phone?".
            try { await gameService.claimDevice(recovered.playerId, getMyDeviceId()); } catch (_) {}
            // If the recovery QR includes ?s=SESSION, sync the session token now so
            // the freshness check below doesn't wipe the just-restored bingo_user_id.
            const sessionInUrl = urlParams?.get('s');
            if (sessionInUrl) localStorage.setItem('bingo_session_token', sessionInUrl);
            console.log('[Recovery] Account restored for', recovered.pseudo);
          }
        } catch (e) {
          console.warn('[Recovery] Token lookup failed', e);
        }
        // Clean URL — remove ?recover= param regardless of success
        const cleanUrl = window.location.pathname + (urlParams?.get('s') ? `?s=${urlParams.get('s')}` : '');
        window.history.replaceState({}, '', cleanUrl);
      }

      // Session freshness check: if the player arrives via a QR code (?s=UUID)
      // and that UUID differs from the one they used last time, force a clean slate.
      // This guarantees that scanning a new QR always starts a brand-new game.
      const urlSessionId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('s')
        : null;
      const storedToken = localStorage.getItem('bingo_session_token');

      if (urlSessionId && storedToken !== urlSessionId) {
        // New session detected via QR — wipe all local state
        localStorage.removeItem('bingo_user_id');
        localStorage.removeItem('bingo_last_session');
        localStorage.setItem('bingo_session_token', urlSessionId);
        setView(AppView.NICKNAME);
        setIsLoading(false);
        return;
      }

      const savedUserId = localStorage.getItem('bingo_user_id');
      if (savedUserId) {
        try {
          const myDeviceId = getMyDeviceId();
          const [foundUser, dbDeviceId] = await Promise.all([
            gameService.getUser(savedUserId),
            gameService.getPlayerDeviceId(savedUserId),
          ]);

          if (foundUser) {
            // 7.1 — Device conflict: another device owns this session
            if (dbDeviceId && dbDeviceId !== myDeviceId) {
              setIsLoading(false);
              await new Promise<void>(resolve => {
                let autoClaimTimer: ReturnType<typeof setTimeout> | null = null;

                const doClaim = async () => {
                  if (autoClaimTimer) clearTimeout(autoClaimTimer);
                  setDeviceConflict(null);
                  setIsLoading(true);
                  await gameService.claimDevice(savedUserId, myDeviceId);
                  resolve();
                };

                const doDecline = () => {
                  if (autoClaimTimer) clearTimeout(autoClaimTimer);
                  setDeviceConflict(null);
                  localStorage.setItem('bingo_user_id_backup', savedUserId);
                  localStorage.removeItem('bingo_user_id');
                  localStorage.removeItem('bingo_last_session');
                  setView(AppView.NICKNAME);
                  setIsLoading(false);
                  resolve();
                };

                setDeviceConflict({
                  playerId: savedUserId,
                  onClaim: doClaim,
                  onDecline: doDecline,
                });

                // Safety net: if the modal is never interacted with (e.g. render bug,
                // user walks away), auto-claim after 30s so the app doesn't stay frozen.
                autoClaimTimer = setTimeout(doClaim, 30_000);
              });
              if (!localStorage.getItem('bingo_user_id')) { return; } // declined
              setIsLoading(true);
            } else {
              // First time on this device OR same device — claim it
              await gameService.claimDevice(savedUserId, myDeviceId);
            }

            setUser(foundUser);
            setNickname(foundUser.nickname);
            setAvatarId(foundUser.avatarId);
            setCountry(foundUser.country || 'FR');

            // Eviction subscription: if device_id changes away from us → auto-logout
            // We keep the user_id in localStorage so the next open on THIS device
            // re-triggers the device-conflict modal instead of wiping their profile.
            const unsubEvict = gameService.subscribePlayerDeviceChange(savedUserId, (newDeviceId) => {
              if (newDeviceId && newDeviceId !== myDeviceId) {
                // Don't wipe user_id — let them reclaim on next load
                localStorage.removeItem('bingo_last_session');
                setDeviceEvicted(true); // Show eviction overlay before redirecting
                setView(AppView.NICKNAME);
                unsubEvict();
              }
            });

            // Resume Active Session
            const activeGame = await gameService.getActiveSession(savedUserId);
            if (activeGame) {
              setGameSession(activeGame);
              setCells(activeGame.grid);
              setJokers(activeGame.jokers);
              setView(AppView.GAME);
            } else {
              // User exists in DB (profile intact) but no active game yet.
              // Send directly to LOBBY — nickname/avatar already set above,
              // no need to re-fill the form. Master countdown will start the game.
              setView(AppView.LOBBY);
            }
          } else {
            // Player not found in DB (session was reset) — wipe local data
            localStorage.removeItem('bingo_user_id');
            localStorage.removeItem('bingo_last_session');
            localStorage.removeItem('bingo_session_token');
            setView(AppView.NICKNAME);
          }
        } catch (err) {
          console.error("Init error", err);
          // Network error during init — try the offline cache FIRST before dropping
          // the player to NicknamePage. navigator.onLine can be true even when Supabase
          // is unreachable (bad hotel wifi, mobile handoff, etc.), so we don't gate on it.
          const cached = localStorage.getItem('bingo_last_session');
          if (cached) {
            try {
              const session = JSON.parse(cached);
              if (session.userId === savedUserId && Date.now() - session.startedAt <= EXPIRATION_TIME) {
                // Restore from cache — nickname/avatar may be stale but better than wipe
                if (session.nickname) setNickname(session.nickname);
                if (session.avatarId) setAvatarId(session.avatarId);
                setCells(session.grid);
                setJokers(session.jokers ?? INITIAL_JOKERS);
                setView(AppView.GAME);
                setIsLoading(false);
                return;
              }
            } catch { /* bad cache, fall through */ }
          }
          // No usable cache — wipe userId so next load doesn't retry the same broken user
          // and loop forever. The player will re-enter via NICKNAME on next successful load.
          localStorage.removeItem('bingo_user_id');
          localStorage.removeItem('bingo_last_session');
          setView(AppView.NICKNAME);
        }
      } else {
        setView(AppView.NICKNAME);
      }
      setIsLoading(false);
    };
    initApp();
  }, []);

  // Keep user/id ref so subscription callbacks can access current userId without stale closure
  const userIdRef = useRef<string | undefined>(undefined);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  // Debounce ref: prevents double-tap opening modal twice (bar environment)
  const lastCellClickRef = useRef<number>(0);

  // FREEZE SUBSCRIPTION + remote cell validation (master approvals)
  useEffect(() => {
    if (!gameSession?.id) return;
    if (gameSession.frozenUntil) setFrozenUntil(gameSession.frozenUntil);
    const unsub = gameService.subscribeToGameUpdates(gameSession.id, async (data) => {
      const incomingType = data.taunt_type as TauntType | undefined;
      if (incomingType) setTauntType(incomingType);
      if (data.taunt_data?.senderName !== undefined) setTauntSenderName(data.taunt_data.senderName || null);

      if (data.frozen_until) {
        setFrozenUntil(new Date(data.frozen_until).getTime());
      } else {
        setFrozenUntil(null);
      }

      if (data.taunts_sent !== undefined) {
        setGameSession(prev => prev ? { ...prev, tauntsSent: data.taunts_sent } : prev);
      }
      if (data.taunts_bonus !== undefined) {
        setGameSession(prev => prev ? { ...prev, tauntsBonus: data.taunts_bonus } : prev);
      }

      // Remote cell update (master validated a MASTER challenge for us) — reload grid
      if (Array.isArray(data.validated_cells) && userIdRef.current) {
        try {
          const updatedGame = await gameService.getActiveSession(userIdRef.current);
          if (updatedGame) {
            setCells(updatedGame.grid);
            setGameSession(updatedGame);
          }
        } catch (e) { console.warn('[BingoGame] Failed to reload after remote validation', e); }
      }
    });

    // Re-sync game state on visibility change or network reconnect (missed realtime events)
    const resync = async () => {
      if (!userIdRef.current) return;
      try {
        const updated = await gameService.getActiveSession(userIdRef.current);
        if (updated) { setCells(updated.grid); setGameSession(updated); }
      } catch {}
    };
    let pollIv = setInterval(resync, 30_000);
    const handleVisibility = () => { if (document.visibilityState === 'visible') resync(); };
    const handleOnline = () => {
      // When coming back online, resync immediately then reset poll to fast cadence briefly
      resync();
      clearInterval(pollIv);
      pollIv = setInterval(resync, 30_000);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      clearInterval(pollIv);
    };
  }, [gameSession?.id]);

  // SPOTLIGHT SYSTEM — every 30 min, max 2 per bar, highlight a random empty cell for a bonus taunt
  const SPOTLIGHT_INTERVAL_MS = 30 * 60 * 1000;
  const SPOTLIGHT_DURATION_MS = 3 * 60 * 1000;
  const SPOTLIGHT_MAX_PER_BAR = 2;

  useEffect(() => {
    if (view !== AppView.GAME) return;
    const pickSpotlight = () => {
      if (spotlightDisabledRef.current) return;
      if (spotlightBarCount.current >= SPOTLIGHT_MAX_PER_BAR) return;
      // Use cellsRef (not stale closure) so we pick from currently empty cells.
      const empty = cellsRef.current.filter(c => c.status === CellStatus.EMPTY);
      if (empty.length === 0) return;
      const pick = empty[Math.floor(Math.random() * empty.length)];
      setSpotlightCellId(pick.id);
      setSpotlightEndsAt(Date.now() + SPOTLIGHT_DURATION_MS);
      spotlightPicked.current = false;
      spotlightBarCount.current += 1;
    };
    const first = setTimeout(pickSpotlight, 15 * 60 * 1000); // first spotlight after 15 min
    const cycle = setInterval(pickSpotlight, SPOTLIGHT_INTERVAL_MS);
    return () => { clearTimeout(first); clearInterval(cycle); };
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // WIN CONDITION CHECKER
  useEffect(() => {
    if (view !== AppView.GAME || cells.length === 0) return;

    const getRow = (r: number) => Array.from({length: 5}, (_, k) => r * 5 + k);
    const getCol = (c: number) => Array.from({length: 5}, (_, k) => k * 5 + c);
    const d1 = [0, 6, 12, 18, 24];
    const d2 = [4, 8, 12, 16, 20];
    const lines = [
      ...Array.from({length: 5}, (_, i) => getRow(i)),
      ...Array.from({length: 5}, (_, i) => getCol(i)),
      d1, d2,
    ];

    let allWinningIndices: number[] = [];
    let potentialFeverIndices: number[] = [];
    let currentLineCount = 0;

    lines.forEach(indices => {
      const validatedCount = indices.filter(i => cells[i]?.status === CellStatus.VALIDATED).length;
      if (validatedCount === 5) {
        allWinningIndices.push(...indices);
        currentLineCount++;
      } else if (validatedCount === 4) {
        const missing = indices.find(i => cells[i]?.status !== CellStatus.VALIDATED);
        if (missing !== undefined) potentialFeverIndices.push(missing);
      }
    });

    const uniqueWinningIds = [...new Set(allWinningIndices)];

    // New line(s) completed — celebrate + award bonus joker
    if (currentLineCount > completedLineCount) {
      const newLines = currentLineCount - completedLineCount;
      setCompletedLineCount(currentLineCount);
      setWinningIds(uniqueWinningIds);

      triggerHaptic('success');

      const isFullGrid = uniqueWinningIds.length === 25;
      canvasConfetti({
        particleCount: isFullGrid ? 200 : 100,
        spread: 120,
        origin: { y: 0.45 },
        colors: ['#FFFFFF', '#FDE047', '#00FF9D', '#FF2D6A'],
      });

      // +1 joker OR +1 taunt per new line (random, optimistic)
      const reward: 'joker' | 'taunt' = Math.random() < 0.5 ? 'joker' : 'taunt';
      if (reward === 'joker') {
        setJokers(prev => prev + newLines);
        if (gameSession) gameService.awardBonusJoker(gameSession.id).catch(() => {});
      } else {
        setGameSession(prev => prev ? { ...prev, tauntsBonus: (prev.tauntsBonus ?? 0) + newLines } : prev);
        if (gameSession) gameService.awardBonusTaunt(gameSession.id).catch(() => {});
      }

      // Trigger celebration banner in GamePage
      setLineCompleteEvent({ totalLines: currentLineCount, isFullGrid, reward });

      if (user) {
        gameService.postActivity(user.id, user.nickname, user.avatarId,
          isFullGrid ? 'GRID_COMPLETED' : 'LINE_COMPLETED');
      }
    } else if (uniqueWinningIds.length !== winningIds.length) {
      // Sync IDs without re-triggering celebration (re-render from other state)
      setWinningIds(uniqueWinningIds);
    }

    const uniqueFeverIds = [...new Set(potentialFeverIndices)].filter(id => !uniqueWinningIds.includes(id));
    setFeverCells(uniqueFeverIds);

  }, [cells, view, completedLineCount, winningIds.length, playSound]); // eslint-disable-line react-hooks/exhaustive-deps

  // BADGE CHECKER
  const checkBadges = useCallback((updatedCells: BingoCellData[]) => {
    const validated = updatedCells.filter(c => c.status === CellStatus.VALIDATED);
    const score = validated.length;

    if (score === 1) injectBadge('FIRST_BLOOD');
    if (score === 10) injectBadge('PARTY_ANIMAL');
    
    const witnessCount = validated.filter(c => c.type === ChallengeType.WITNESS).length;
    if (witnessCount === 5) injectBadge('SOCIAL_BUTTERFLY');

    if (score === 25) injectBadge('PERFECTIONIST');

    if (score === 5 && gameSession) {
      const duration = Date.now() - gameSession.startedAt;
      if (duration < 30 * 60 * 1000) injectBadge('SPEED_DEMON');
    }
  }, [injectBadge, gameSession]);

  const actions = {
    setNickname,
    setAvatarId,
    setCountry,
    setView,
    setSoundEnabled,
    setActiveScannerMode,
    setSelectedCell,
    resetSpotlightCount: () => { spotlightBarCount.current = 0; },
    clearNewBadge,
    clearLineCompleteEvent: () => setLineCompleteEvent(null),
    completeOnboarding: () => {},
    
    resetData: () => {
      if (confirm("Reset all local data? This will clear your current session.")) {
        localStorage.clear();
        window.location.reload();
      }
    },
    
    checkConnection: async () => {
       setIsLoading(true);
       try {
         const ok = await gameService.checkConnection();
         alert(ok ? "✅ Connexion Supabase OK" : "❌ Erreur de connexion");
       } catch (e) {
         alert("Erreur test: " + e);
       } finally {
         setIsLoading(false);
       }
    },

    // Register player in DB (creates user) without starting game session.
    // Called after OnboardingCards — player waits in lobby until Master fires countdown.
    registerPlayer: async (name: string) => {
      if (!name.trim()) return;
      setIsLoading(true);
      try {
        let currentUserId = user?.id;
        if (!currentUserId) {
          const newUser = await gameService.createUser(name, avatarId, country);
          setUser(newUser);
          currentUserId = newUser.id;
          localStorage.setItem('bingo_user_id', newUser.id);
          await gameService.claimDevice(newUser.id, getMyDeviceId());
        }
        setView(AppView.LOBBY);
      } catch (e: any) {
        alert(`Erreur: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    },

    startGame: async (name: string) => {
      if (!name.trim()) return;
      setIsLoading(true);
      try {
        let currentUserId = user?.id;
        if (!currentUserId) {
           const newUser = await gameService.createUser(name, avatarId, country);
           setUser(newUser);
           currentUserId = newUser.id;
           localStorage.setItem('bingo_user_id', newUser.id);
           // Claim device on first creation
           await gameService.claimDevice(newUser.id, getMyDeviceId());
        }
        
        // Fetch challenges from Supabase first, fallback to hardcoded
        let selectedChallenges = language === 'fr' ? CHALLENGES_FR : CHALLENGES_EN;
        try {
          const dbChallenges = await gameService.getChallenges();
          console.log(`[BingoGame] Supabase returned ${dbChallenges?.length || 0} challenges`);
          if (dbChallenges && dbChallenges.length >= 25) {
            console.log("Using challenges from Supabase", dbChallenges.length);
            selectedChallenges = dbChallenges.map(c => ({
              text: language === 'fr' ? (c.text_fr || c.text) : (c.text_en || c.text),
              type: c.type as ChallengeType,
              is_partner: c.is_partner ?? false,
              partner_handle: c.partner_handle ?? undefined,
            }));
          }
        } catch (e) {
          console.warn("Error fetching challenges, using defaults", e);
        }

        const newGame = await gameService.startGame(currentUserId, selectedChallenges);
        setGameSession(newGame);
        setCells(newGame.grid);
        setJokers(newGame.jokers);
        playSound('CLICK');
        triggerHaptic('light');
        setView(AppView.GAME);
      } catch (e: any) {
        alert(`Erreur: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    },

    handleCellClick: (id: number) => {
      const now = Date.now();
      if (now - lastCellClickRef.current < 500) return;
      lastCellClickRef.current = now;
      const cell = cells.find(c => c.id === id);
      if (!cell || cell.status !== CellStatus.EMPTY) return;
      playSound('CLICK');
      triggerHaptic('light');
      setSelectedCell(cell);
    },

    validateCell: async (proofData?: { witnessName: string, witnessSignature: string }) => {
      if (selectedCell && gameSession) {
        if (selectedCell.type === ChallengeType.WITNESS) {
          setLastWitnessTime(Date.now());
        }

        // SPOTLIGHT BONUS: if this was the spotlight cell, +1 taunt
        const isSpotlightCell = selectedCell.id === spotlightCellId &&
          spotlightEndsAt !== null && Date.now() < spotlightEndsAt &&
          !spotlightPicked.current;
        if (isSpotlightCell) {
          spotlightPicked.current = true;
          setSpotlightCellId(null);
          setSpotlightEndsAt(null);
          if (navigator.vibrate) navigator.vibrate([50, 50, 200]);
          canvasConfetti({ particleCount: 80, spread: 120, origin: { y: 0.5 }, colors: ['#FF2D6A', '#FFFFFF', '#7C3AED'] });
          // Persist + notify
          setBonusTauntActive(true);
          setTimeout(() => setBonusTauntActive(false), 2500);
          if (gameSession) gameService.awardBonusTaunt(gameSession.id).catch(() => {});
        }

        // COMBO SYSTEM: 3 validations in 15 min = +1 joker (bar 2+ only)
        const now = Date.now();
        const COMBO_WINDOW = 15 * 60 * 1000;
        validationTimestamps.current = [...validationTimestamps.current.filter(t => now - t < COMBO_WINDOW), now];
        if (validationTimestamps.current.length >= 3 && !isSpotlightCell && currentBarRef.current >= 2) {
          validationTimestamps.current = []; // reset after combo
          setJokers(prev => prev + 1);
          setComboActive(true);
          setTimeout(() => setComboActive(false), 3500);
          if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 100]);
          // Persist + notify
          if (gameSession) gameService.awardBonusJoker(gameSession.id).catch(() => {});
        }

        // Optimistic UI Update
        const oldCells = [...cells];
        const newCells = cells.map(c => c.id === selectedCell.id ? {
          ...c,
          status: CellStatus.VALIDATED,
          witnessName: proofData?.witnessName,
          witnessSignature: proofData?.witnessSignature,
          timestamp: Date.now()
        } : c);

        setCells(newCells);
        // NOTE: setSelectedCell(null) is intentionally NOT called here.
        // The ValidationModal manages its own lifecycle (SUCCESS → FORTUNE) and
        // calls onClose() itself when fully done. onClose = a.setSelectedCell(null).
        setActiveScannerMode(null);
        checkBadges(newCells);

        playSound('VALIDATE');
        triggerHaptic('success');
        canvasConfetti({
            particleCount: 60,
            spread: 100,
            origin: { y: 0.55 },
            colors: ['#FDE047', '#00FF9D', '#FF2D6A', '#FFFFFF']
        });

        // Feedback avatar + texte dans GamePage (auto-dismiss 1.8s)
        setChallengeValidatedEvent({ cellText: selectedCell.text });
        setTimeout(() => setChallengeValidatedEvent(null), 1800);

        // Backend Sync
        try {
          const updatedGame = await gameService.validateCell(gameSession.id, selectedCell.id, proofData);
          setGameSession(updatedGame);

        } catch (e: any) {
          if (!navigator.onLine) return; // Keep optimistic if offline
          setCells(oldCells);
          console.error("Validation failed", e);
          alert('Erreur lors de la validation. Réessaie.');
        }
      }
    },

    useJoker: async () => {
      if (selectedCell && jokers > 0 && gameSession) {
        const selectedChallenges = language === 'fr' ? CHALLENGES_FR : CHALLENGES_EN;
        const currentTexts = new Set(cells.map(c => c.text));
        const availableChallenges = selectedChallenges.filter(c => !currentTexts.has(c.text));
        if (availableChallenges.length === 0) return;

        const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
        
        const oldCells = [...cells];
        const oldJokers = jokers;

        setCells(prev => prev.map(c => c.id === selectedCell.id ? { 
          ...c, text: randomChallenge.text, type: randomChallenge.type, status: CellStatus.EMPTY 
        } : c));
        setJokers(prev => prev - 1);
        setSelectedCell(null);
        
        playSound('JOKER');
        triggerHaptic('medium');

        try {
           const updatedGame = await gameService.useJoker(gameSession.id, selectedCell.id, randomChallenge);
           setGameSession(updatedGame);
        } catch (e: any) {
           if (!navigator.onLine) return;
           setCells(oldCells);
           setJokers(oldJokers);
           alert('Erreur lors du swap. Réessaie.');
        }
      }
    },

    // Déblocage anticipé côté client (Ice Block, Tiny Target, Blob, Flashlight complétés avant expiration)
    clearFreezeLocally: () => {
      setFrozenUntil(undefined);
    },


       resetGame: () => {
      setGameSession(null);
      setUser(null);
      setCells([]);
      setWinningIds([]);
      setFeverCells([]);
      setCompletedLineCount(0);
      setLineCompleteEvent(null);
      resetBadges();
      setJokers(INITIAL_JOKERS);
      setNickname('');
      setAvatarId('PartyKing');
      setCountry('FR');
      setView(AppView.NICKNAME);
      localStorage.removeItem('bingo_last_session');
      localStorage.removeItem('bingo_user_id');
      localStorage.removeItem('bingo_session_token');
    },

    // 4.1 Profile editing — updates pseudo + emoji in DB, syncs local state
    updateProfile: async (newNickname: string, newAvatarKey: string) => {
      const userId = user?.id;
      if (!userId) return;
      try {
        await gameService.updatePlayerProfile(userId, newNickname, newAvatarKey);
        setNickname(newNickname);
        setAvatarId(newAvatarKey);
      } catch (e: any) {
        alert(`Erreur mise à jour profil: ${e.message}`);
      }
    },
  };

  const score = useMemo(() => cells.filter(c => c.status === CellStatus.VALIDATED).length, [cells]);

  return {
    state: {
      view, isLoading, nickname, avatarId, country, cells, jokers, winningIds, feverCells, activeScannerMode, selectedCell, soundEnabled, lastWitnessTime, user, deviceConflict, deviceEvicted,
      score,
      badges, newBadge, gameSession, frozenUntil, tauntType, tauntSenderName,
      isFrozen: !!frozenUntil && Date.now() < frozenUntil,
      tauntsLeft: Math.max(0, 1 + (gameSession?.tauntsBonus ?? 0) - (gameSession?.tauntsSent ?? 0)),
      spotlightCellId, spotlightEndsAt, comboActive, bonusTauntActive,
      lineCompleteEvent, completedLineCount, challengeValidatedEvent
    },
    actions: {
      ...actions,
      dismissEviction: () => setDeviceEvicted(false),
      grantFortuneTaunt: () => {
        if (!gameSession) return;
        setBonusTauntActive(true);
        setTimeout(() => setBonusTauntActive(false), 2500);
        gameService.awardBonusTaunt(gameSession.id).catch(() => {});
        setGameSession(prev => prev ? { ...prev, tauntsBonus: (prev.tauntsBonus ?? 0) + 1 } : prev);
      }
    }
  };
};
