
import { useState, useEffect, useCallback, useRef } from 'react';
import canvasConfetti from 'canvas-confetti';
import { BingoCellData, ChallengeType, CellStatus, AppView, UserProfile, GameSession, TauntType } from '../types';
import { CHALLENGES_EN, CHALLENGES_FR, INITIAL_JOKERS, SOUNDS } from '../constants';
import { gameService } from '../services/gameService';
import { useLanguage } from '../contexts/LanguageContext';
import { useBadges } from './useBadges';

export const useBingoGame = () => {
  const { language } = useLanguage();
  
  // DEFAULT VIEW IS NOW NICKNAME
  const [view, setView] = useState<AppView>(AppView.NICKNAME);
  const [isLoading, setIsLoading] = useState(true);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);

  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState('PartyKing');
  const [country, setCountry] = useState('FR');

  const [cells, setCells] = useState<BingoCellData[]>([]);
  const [jokers, setJokers] = useState(INITIAL_JOKERS);
  
  const [winningIds, setWinningIds] = useState<number[]>([]);
  const [feverCells, setFeverCells] = useState<number[]>([]); 
  
  const [activeScannerMode, setActiveScannerMode] = useState<'ENTRY' | 'MASTER' | null>(null);
  const [selectedCell, setSelectedCell] = useState<BingoCellData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [lastWitnessTime, setLastWitnessTime] = useState(0);
  const [frozenUntil, setFrozenUntil] = useState<number | undefined>(undefined);
  const [tauntType, setTauntType] = useState<TauntType>(TauntType.FREEZE);

  // --- SPOTLIGHT ---
  const [spotlightCellId, setSpotlightCellId] = useState<number | null>(null);
  const [spotlightEndsAt, setSpotlightEndsAt] = useState<number | null>(null);
  const spotlightPicked = useRef(false);
  const spotlightBarCount = useRef(0); // resets on each bar transition

  // --- COMBO ---
  const validationTimestamps = useRef<number[]>([]);
  const [comboActive, setComboActive] = useState(false);

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
      const savedUserId = localStorage.getItem('bingo_user_id');
      if (savedUserId) {
        try {
          const foundUser = await gameService.getUser(savedUserId);
          if (foundUser) {
            setUser(foundUser);
            setNickname(foundUser.nickname);
            setAvatarId(foundUser.avatarId);
            setCountry(foundUser.country || 'FR');
            
            // Resume Active Session
            const activeGame = await gameService.getActiveSession(savedUserId);
            if (activeGame) {
              setGameSession(activeGame);
              setCells(activeGame.grid);
              setJokers(activeGame.jokers);
              setView(AppView.GAME);
            } else {
               setView(AppView.NICKNAME);
            }
          } else {
            localStorage.removeItem('bingo_user_id');
            setView(AppView.NICKNAME);
          }
        } catch (err) {
          console.error("Init error", err);
          setView(AppView.NICKNAME);
        }
      } else {
        setView(AppView.NICKNAME);
      }
      setIsLoading(false);
    };
    initApp();
  }, []);

  // FREEZE SUBSCRIPTION
  useEffect(() => {
    if (!gameSession?.id) return;
    if (gameSession.frozenUntil) setFrozenUntil(gameSession.frozenUntil);
    const unsub = gameService.subscribeToGameUpdates(gameSession.id, (data) => {
      if (data.frozen_until) {
        setFrozenUntil(new Date(data.frozen_until).getTime());
        if (data.taunt_type) setTauntType(data.taunt_type as TauntType);
      }
      if (data.taunts_sent !== undefined) {
        setGameSession(prev => prev ? { ...prev, tauntsSent: data.taunts_sent } : prev);
      }
    });
    return unsub;
  }, [gameSession?.id]);

  // SPOTLIGHT SYSTEM — every 3 min, max 2 per bar, highlight a random empty cell for a bonus joker
  const SPOTLIGHT_INTERVAL_MS = 3 * 60 * 1000;
  const SPOTLIGHT_DURATION_MS = 3 * 60 * 1000;
  const SPOTLIGHT_MAX_PER_BAR = 2;

  useEffect(() => {
    if (view !== AppView.GAME || cells.length === 0) return;
    const pickSpotlight = () => {
      if (spotlightBarCount.current >= SPOTLIGHT_MAX_PER_BAR) return;
      const empty = cells.filter(c => c.status === CellStatus.EMPTY);
      if (empty.length === 0) return;
      const pick = empty[Math.floor(Math.random() * empty.length)];
      setSpotlightCellId(pick.id);
      setSpotlightEndsAt(Date.now() + SPOTLIGHT_DURATION_MS);
      spotlightPicked.current = false;
      spotlightBarCount.current += 1;
    };
    const first = setTimeout(pickSpotlight, 60 * 1000); // first spotlight after 1 min
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
    const lines = [...Array.from({length: 5}, (_, i) => getRow(i)), ...Array.from({length: 5}, (_, i) => getCol(i)), d1, d2];

    let allWinningIndices: number[] = [];
    let potentialFeverIndices: number[] = [];

    lines.forEach(indices => {
      const validatedCount = indices.filter(i => cells[i].status === CellStatus.VALIDATED).length;
      if (validatedCount === 5) allWinningIndices.push(...indices);
      if (validatedCount === 4) {
        const missing = indices.find(i => cells[i].status !== CellStatus.VALIDATED);
        if (missing !== undefined) potentialFeverIndices.push(missing);
      }
    });

    const uniqueWinningIds = [...new Set(allWinningIndices)];
    
    // New Line Detected
    if (uniqueWinningIds.length > winningIds.length) {
      setWinningIds(uniqueWinningIds);
      playSound('WIN');
      triggerHaptic('success');
      canvasConfetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#FFFFFF', '#FDE047'] });
      
      // Post Activity
      if (user) {
        const isGridComplete = uniqueWinningIds.length === 25;
        gameService.postActivity(
          user.id, 
          user.nickname, 
          user.avatarId, 
          isGridComplete ? 'GRID_COMPLETED' : 'LINE_COMPLETED'
        );
      }
    }

    const uniqueFeverIds = [...new Set(potentialFeverIndices)].filter(id => !uniqueWinningIds.includes(id));
    setFeverCells(uniqueFeverIds);

  }, [cells, view, winningIds.length, playSound]);

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

        // SPOTLIGHT BONUS: if this was the spotlight cell, +1 joker
        const isSpotlightCell = selectedCell.id === spotlightCellId &&
          spotlightEndsAt !== null && Date.now() < spotlightEndsAt &&
          !spotlightPicked.current;
        if (isSpotlightCell) {
          spotlightPicked.current = true;
          setJokers(prev => prev + 1);
          setSpotlightCellId(null);
          setSpotlightEndsAt(null);
          if (navigator.vibrate) navigator.vibrate([50, 50, 200]);
          canvasConfetti({ particleCount: 80, spread: 120, origin: { y: 0.5 }, colors: ['#FFD700', '#FFFFFF', '#FF2D6A'] });
        }

        // COMBO SYSTEM: 3 validations in 15 min = +1 joker
        const now = Date.now();
        const COMBO_WINDOW = 15 * 60 * 1000;
        validationTimestamps.current = [...validationTimestamps.current.filter(t => now - t < COMBO_WINDOW), now];
        if (validationTimestamps.current.length >= 3 && !isSpotlightCell) {
          validationTimestamps.current = []; // reset after combo
          setJokers(prev => prev + 1);
          setComboActive(true);
          setTimeout(() => setComboActive(false), 3500);
          if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 100]);
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
        setSelectedCell(null);
        setActiveScannerMode(null);
        checkBadges(newCells);

        playSound('VALIDATE');
        triggerHaptic('success');
        canvasConfetti({
            particleCount: 50,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#FDE047', '#EAB308', '#FFFFFF']
        });

        // Backend Sync
        try {
          const updatedGame = await gameService.validateCell(gameSession.id, selectedCell.id, proofData);
          setGameSession(updatedGame);
        } catch (e: any) {
          if (!navigator.onLine) return; // Keep optimistic if offline
          setCells(oldCells); 
          console.error("Validation failed", e);
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
        }
      }
    },

       resetGame: () => {
      setGameSession(null);
      setUser(null);
      setCells([]);
      setWinningIds([]);
      setFeverCells([]);
      resetBadges();
      setJokers(INITIAL_JOKERS);
      setNickname('');
      setAvatarId('PartyKing');
      setCountry('FR');
      setView(AppView.NICKNAME);
      localStorage.removeItem('bingo_last_session');
      localStorage.removeItem('bingo_user_id');
    }
  };

  return {
    state: {
      view, isLoading, nickname, avatarId, country, cells, jokers, winningIds, feverCells, activeScannerMode, selectedCell, soundEnabled, lastWitnessTime,
      score: cells.filter(c => c.status === CellStatus.VALIDATED).length,
      badges, newBadge, gameSession, frozenUntil, tauntType,
      isFrozen: !!frozenUntil && Date.now() < frozenUntil,
      tauntsLeft: Math.max(0, 2 - (gameSession?.tauntsSent ?? 0)),
      spotlightCellId, spotlightEndsAt, comboActive
    },
    actions
  };
};
