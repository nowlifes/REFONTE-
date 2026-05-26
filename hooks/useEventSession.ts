
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { gameService } from '../services/gameService';

export const useEventSession = () => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transitionEndsAt, setTransitionEndsAt] = useState<number | null>(null);
  const [nextBarName, setNextBarName] = useState<string | null>(null);
  const [pregamePhase, setPregamePhase] = useState<string | null>(null);
  const [pregameSubjectId, setPregameSubjectId] = useState<string | null>(null);
  const [countdownEndsAt, setCountdownEndsAt] = useState<number | null>(null);
  const [spotlightDisabled, setSpotlightDisabled] = useState(false);
  const [challengeCooldownSecs, setChallengeCooldownSecs] = useState(0);
  const [isGamePaused, setIsGamePaused] = useState(false);
  // 5.x — Bar cadence & chaos mode
  const [currentBar, setCurrentBar] = useState(1);
  const [barCadence, setBarCadence] = useState('1,2,2');
  const [chaosMode, setChaosMode] = useState(false);
  const [maxValidationsPerBar, setMaxValidationsPerBar] = useState(0);
  const [boostAuctionEndsAt, setBoostAuctionEndsAt] = useState<number | null>(null);
  const [boostAuctionType, setBoostAuctionType] = useState<'boost' | 'sabotage'>('boost');
  const [boostAuctionWinner, setBoostAuctionWinner] = useState<{ name: string; emoji: string; type: 'boost' | 'sabotage' } | null>(null);
  // Tracks the winner key already dismissed by the player — prevents checkSession from re-showing it
  const dismissedBoostWinnerKey = useRef<string | null>(null);
  // Track whether we've ever successfully loaded session state.
  // Used by checkSession to fail-open (don't kick players on network errors).
  const hasLoadedOnce = useRef(false);
  // UUID for the current secure session (drives the QR code in MasterPage)
  const [secureSessionId, setSecureSessionId] = useState<string | null>(
    gameService.getCurrentSecureSessionId()
  );
  // Ref so checkSession ([] deps) always sees the current secureSessionId without stale closure
  const secureSessionIdRef = useRef<string | null>(gameService.getCurrentSecureSessionId());

  const checkSession = useCallback(async () => {
    try {
      const { data: row } = await supabase
        .from('event_session')
        .select('id, is_active, transition_ends_at, next_bar_name, pregame_phase, pregame_subject_id, countdown_ends_at, spotlight_disabled, challenge_cooldown_secs, is_paused, current_bar, bar_cadence, chaos_mode, max_validations_per_bar, boost_auction_ends_at, boost_auction_type, boost_auction_winner')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      const status = row?.is_active ?? false;
      const transitionEndsAtVal = row?.transition_ends_at ? new Date(row.transition_ends_at).getTime() : null;
      setIsSessionActive(status);
      setTransitionEndsAt(transitionEndsAtVal);
      setNextBarName(row?.next_bar_name ?? null);
      // Only propagate pregame phase when session is active — prevents stale DB values from auto-launching pregame
      setPregamePhase(status ? (row?.pregame_phase ?? null) : null);
      setPregameSubjectId(status ? (row?.pregame_subject_id ?? null) : null);
      setCountdownEndsAt(row?.countdown_ends_at ? new Date(row.countdown_ends_at).getTime() : null);
      setSpotlightDisabled(row?.spotlight_disabled ?? false);
      setChallengeCooldownSecs(row?.challenge_cooldown_secs ?? 0);
      setIsGamePaused(row?.is_paused ?? false);
      setCurrentBar(row?.current_bar ?? 1);
      setBarCadence(row?.bar_cadence ?? '1,2,2');
      setChaosMode(row?.chaos_mode ?? false);
      setMaxValidationsPerBar(row?.max_validations_per_bar ?? 0);
      setBoostAuctionEndsAt(row?.boost_auction_ends_at ? new Date(row.boost_auction_ends_at).getTime() : null);
      setBoostAuctionType((row?.boost_auction_type as 'boost' | 'sabotage') ?? 'boost');
      const newWinner = row?.boost_auction_winner ?? null;
      const newWinnerKey = newWinner ? `${newWinner.name}:${newWinner.type}` : null;
      if (newWinnerKey !== dismissedBoostWinnerKey.current) setBoostAuctionWinner(newWinner);

      // Recover session UUID only when we don't already have it (page reload / cache clear)
      if (status) {
        if (!secureSessionIdRef.current) {
          const recovered = await gameService.recoverSecureSessionId();
          if (recovered) { secureSessionIdRef.current = recovered; setSecureSessionId(recovered); }
        }
      } else {
        secureSessionIdRef.current = null;
        setSecureSessionId(null);
      }
    } catch (e) {
      if (hasLoadedOnce.current) {
        // Network hiccup while the game is running — fail-open: keep current state.
        // Kicking everyone on a Supabase timeout is worse than briefly keeping a stale state.
        console.warn("[EventSession] Network error during checkSession — keeping current state (fail-open)");
      } else {
        // First load — we have no idea if session is active, default closed.
        console.warn("[EventSession] First-load network error — defaulting to CLOSED");
        setIsSessionActive(false);
      }
    } finally {
      hasLoadedOnce.current = true;
      setIsLoading(false);
    }
  }, []);

  // Debounced checkSession — coalesces rapid reconnect events (visibility + online + SUBSCRIBED)
  // into a single call. Prevents 3 parallel Supabase queries when a phone switches networks.
  const checkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedCheck = useCallback(() => {
    if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);
    checkDebounceRef.current = setTimeout(() => {
      checkSession();
    }, 150);
  }, [checkSession]);

  // Track realtime connectivity to adjust poll frequency
  const isRealtimeConnected = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const restartPoll = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    const interval = isRealtimeConnected.current ? 3_000 : 3_000; // 3s Safari fix — postgres_changes silent on Safari
    pollIntervalRef.current = setInterval(() => checkSession(), interval);
  }, [checkSession]);

  useEffect(() => {
    // 1. Fetch initial status (immediate, no debounce needed on first load)
    checkSession();

    // 2. Subscribe to Realtime updates on table 'event_session'
    if (supabase) {
        const subscription = supabase
          .channel(`session_updates_${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'event_session'
            },
            (payload: any) => {
              // REPLICA IDENTITY FULL → payload.new contient toujours tous les champs.
              // Mise à jour directe du state, pas de refetch nécessaire.
              if (payload.new && typeof payload.new === 'object') {
                const p = payload.new;
                if (p.is_active !== undefined) setIsSessionActive(!!p.is_active);
                if (p.transition_ends_at !== undefined) setTransitionEndsAt(p.transition_ends_at ? new Date(p.transition_ends_at).getTime() : null);
                if (p.next_bar_name !== undefined) setNextBarName(p.next_bar_name ?? null);
                if (p.pregame_phase !== undefined) setPregamePhase(p.is_active ? (p.pregame_phase ?? null) : null);
                if (p.pregame_subject_id !== undefined) setPregameSubjectId(p.is_active ? (p.pregame_subject_id ?? null) : null);
                if (p.countdown_ends_at !== undefined) setCountdownEndsAt(p.countdown_ends_at ? new Date(p.countdown_ends_at).getTime() : null);
                if (p.spotlight_disabled !== undefined) setSpotlightDisabled(p.spotlight_disabled ?? false);
                if (p.challenge_cooldown_secs !== undefined) setChallengeCooldownSecs(p.challenge_cooldown_secs ?? 0);
                if (p.is_paused !== undefined) setIsGamePaused(p.is_paused ?? false);
                if (p.current_bar !== undefined) setCurrentBar(p.current_bar ?? 1);
                if (p.bar_cadence !== undefined) setBarCadence(p.bar_cadence ?? '1,2,2');
                if (p.chaos_mode !== undefined) setChaosMode(p.chaos_mode ?? false);
                if (p.max_validations_per_bar !== undefined) setMaxValidationsPerBar(p.max_validations_per_bar ?? 0);
                if (p.boost_auction_ends_at !== undefined) setBoostAuctionEndsAt(p.boost_auction_ends_at ? new Date(p.boost_auction_ends_at).getTime() : null);
                if (p.boost_auction_type !== undefined) setBoostAuctionType((p.boost_auction_type as 'boost' | 'sabotage') ?? 'boost');
                if (p.boost_auction_winner !== undefined) {
                  const rtWinner = p.boost_auction_winner ?? null;
                  const rtWinnerKey = rtWinner ? `${rtWinner.name}:${rtWinner.type}` : null;
                  if (rtWinnerKey !== dismissedBoostWinnerKey.current) setBoostAuctionWinner(rtWinner);
                }
                // secureSessionId vient d'une table séparée → seul cas qui nécessite un fetch externe
                if (p.is_active === false) {
                  secureSessionIdRef.current = null; setSecureSessionId(null);
                } else if (p.is_active && !secureSessionIdRef.current) {
                  gameService.recoverSecureSessionId().then(id => { if (id) { secureSessionIdRef.current = id; setSecureSessionId(id); } });
                }
              }
            }
          )
          .subscribe((status) => {
            const connected = status === 'SUBSCRIBED';
            if (isRealtimeConnected.current !== connected) {
              isRealtimeConnected.current = connected;
              restartPoll();
            }
            // Re-check on reconnect — catches events missed while offline.
            if (connected) debouncedCheck();
          });

        // 3. Re-check when phone wakes up or tab regains focus
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') debouncedCheck();
        };

        // 4. Re-check when network comes back online
        const handleOnline = () => debouncedCheck();

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('online', handleOnline);

        // 5. Fallback polling — 8 s when realtime is down, 15 s when connected
        restartPoll();

        // 6. Broadcast channel — master pings instantly after bar advance / chaos / pause
        //    Complements postgres_changes: catches the rare case where realtime drops the DB event
        const broadcastCh = supabase.channel('game_master_events')
          .on('broadcast', { event: 'bar_advance' }, debouncedCheck)
          .on('broadcast', { event: 'chaos_mode' }, debouncedCheck)
          .on('broadcast', { event: 'pause' }, debouncedCheck)
          .subscribe();

        return () => {
          if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          supabase.removeChannel(subscription);
          supabase.removeChannel(broadcastCh);
          document.removeEventListener('visibilitychange', handleVisibility);
          window.removeEventListener('online', handleOnline);
        };
    } else {
        setIsLoading(false);
    }
  }, [checkSession, debouncedCheck, restartPoll]);

  const setSessionActive = async (active: boolean) => {
    const previous = isSessionActive;
    try {
      setIsSessionActive(active); // Optimistic update
      if (!active) {
        // Only clear the local secure session reference — do NOT close the sessions table here.
        // closeAllOpenSessions() would trigger useSessionGuard → GAME_OVER for all players,
        // racing against the MISSION_REPORT navigation. Sessions table is cleaned on reset/new session.
        secureSessionIdRef.current = null; setSecureSessionId(null);
      }
      await gameService.setSessionStatus(active);
    } catch (e) {
      console.error("Failed to update session status", e);
      setIsSessionActive(previous); // Rollback
      alert("Erreur: Impossible de changer le statut de la session. Vérifiez votre connexion.");
    }
  };

  const resetSession = async () => {
    const previous = isSessionActive;
    try {
      setIsSessionActive(false);
      await gameService.resetSession();
    } catch (e) {
      setIsSessionActive(previous); // rollback optimistic update
      throw e; // let caller show UI feedback
    }
  };

  const createNewSession = async () => {
    setIsSessionActive(false); // Optimistic close
    const uuid = await gameService.createNewSession();
    secureSessionIdRef.current = uuid; setSecureSessionId(uuid);
    // Reset cadence so the new evening starts clean at Bar 1 with no chaos
    setCurrentBar(1);
    setChaosMode(false);
    await Promise.all([
      gameService.advanceBar().catch(() => {}), // will be ignored — bar reset handled below
      gameService.setChaosMode(false).catch(() => {}),
      gameService.clearBoostAuction().catch(() => {}),
    ]);
    setBoostAuctionEndsAt(null);
    setBoostAuctionType('boost');
    setBoostAuctionWinner(null);
    // Force currentBar = 1 in DB (advanceBar only increments, so we set directly)
    try {
      const { data: latest } = await supabase
        .from('event_session')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest) {
        await supabase
          .from('event_session')
          .update({ current_bar: 1, chaos_mode: false })
          .eq('id', latest.id);
      }
    } catch (e) { console.warn('[EventSession] Failed to reset bar cadence', e); }
    setIsSessionActive(true); // Optimistic open
  };

  const triggerBarTransition = async (durationMinutes: number, barName?: string) => {
    // Optimistic update — countdown starts immediately on the master device
    const newEndsAt = Date.now() + durationMinutes * 60 * 1000;
    setTransitionEndsAt(newEndsAt);
    setNextBarName(barName || null);
    await gameService.triggerBarTransition(durationMinutes, barName);
  };

  const clearBarTransition = async () => {
    await gameService.clearBarTransition();
    setTransitionEndsAt(null);
    setNextBarName(null);
  };

  const setPregamePhaseAction = async (phase: string | null, subjectId?: string | null) => {
    setPregamePhase(phase);
    setPregameSubjectId(subjectId ?? null);
    await gameService.setPregamePhase(phase, subjectId);
  };

  const triggerCountdown = async (seconds: number) => {
    const endsAt = Date.now() + seconds * 1000;
    setCountdownEndsAt(endsAt);
    await gameService.triggerCountdown(seconds);
  };

  const clearCountdown = async () => {
    setCountdownEndsAt(null);
    await gameService.triggerCountdown(0); // sets countdown_ends_at to past
  };

  const clearBoostAuctionWinner = useCallback(() => {
    setBoostAuctionWinner(prev => {
      if (prev) dismissedBoostWinnerKey.current = `${prev.name}:${prev.type}`;
      return null;
    });
  }, []);

  return {
    isSessionActive, isLoading, setSessionActive, resetSession, createNewSession, checkSession,
    transitionEndsAt, nextBarName, triggerBarTransition, clearBarTransition,
    triggerBarTransitionAndAdvance: async (durationMinutes: number, barName?: string) => {
      const newBar = currentBar + 1;
      // Avance le bar sans démarrer le "moving soon" timer
      // (la transition physique est déclenchée séparément via triggerBarTransition)
      setTransitionEndsAt(null);
      setNextBarName(null);
      setCurrentBar(newBar);
      if (newBar >= 3) setChaosMode(true);
      await gameService.triggerBarTransitionAndAdvance(durationMinutes, newBar, barName);
    },
    secureSessionId,
    pregamePhase, pregameSubjectId, countdownEndsAt,
    setPregamePhase: setPregamePhaseAction,
    triggerCountdown,
    clearCountdown,
    spotlightDisabled,
    setSpotlightDisabled: async (disabled: boolean) => {
      setSpotlightDisabled(disabled);
      await gameService.setSpotlightDisabled(disabled);
    },
    challengeCooldownSecs,
    setChallengeCooldown: async (secs: number) => {
      setChallengeCooldownSecs(secs);
      await gameService.setChallengeCooldown(secs);
    },
    isGamePaused,
    setGamePaused: async (paused: boolean) => {
      setIsGamePaused(paused);
      await gameService.setPaused(paused);
    },
    // 5.x — Bar cadence & chaos mode
    currentBar,
    barCadence,
    chaosMode,
    maxValidationsPerBar,
    advanceBar: async () => {
      const newBar = currentBar + 1;
      setCurrentBar(newBar);
      setTransitionEndsAt(null);
      setNextBarName(null);
      await Promise.all([
        gameService.advanceBar(),
        gameService.clearBarTransition(),
      ]);
      if (newBar >= 3) {
        setChaosMode(true);
        await gameService.setChaosMode(true);
      }
    },
    setBarCadenceValue: async (cadence: string) => {
      setBarCadence(cadence);
      await gameService.setBarCadence(cadence);
    },
    setChaosMode: async (chaos: boolean) => {
      setChaosMode(chaos);
      await gameService.setChaosMode(chaos);
    },
    setMaxValidationsPerBar: async (max: number) => {
      setMaxValidationsPerBar(max);
      await gameService.setMaxValidationsPerBar(max);
    },
    boostAuctionEndsAt,
    boostAuctionType,
    boostAuctionWinner,
    clearBoostAuctionWinner,
    startBoostAuction: async (durationSecs?: number, type?: 'boost' | 'sabotage') => {
      const dur = durationSecs ?? 30;
      const t = type ?? 'boost';
      dismissedBoostWinnerKey.current = null; // new auction = new winner to show
      setBoostAuctionEndsAt(Date.now() + dur * 1000);
      setBoostAuctionType(t);
      setBoostAuctionWinner(null);
      await gameService.startBoostAuction(dur, t);
    },
    clearBoostAuction: async () => {
      setBoostAuctionEndsAt(null);
      setBoostAuctionType('boost');
      setBoostAuctionWinner(null);
      dismissedBoostWinnerKey.current = null;
      await gameService.clearBoostAuction();
    },
    closeBoostAuction: async () => {
      setBoostAuctionEndsAt(null);
      await gameService.closeBoostAuction();
    },
  };
};
