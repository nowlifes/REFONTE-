
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
  // Track whether we've ever successfully loaded session state.
  // Used by checkSession to fail-open (don't kick players on network errors).
  const hasLoadedOnce = useRef(false);
  // UUID for the current secure session (drives the QR code in MasterPage)
  const [secureSessionId, setSecureSessionId] = useState<string | null>(
    gameService.getCurrentSecureSessionId()
  );

  const checkSession = useCallback(async () => {
    try {
      const [status, transition, fullRow] = await Promise.all([
        gameService.getSessionStatus(),
        gameService.getTransitionState(),
        supabase
          .from('event_session')
          .select('pregame_phase, pregame_subject_id, countdown_ends_at, spotlight_disabled, challenge_cooldown_secs, is_paused, current_bar, bar_cadence, chaos_mode, max_validations_per_bar')
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(r => r.data),
      ]);
      setIsSessionActive(status);
      setTransitionEndsAt(transition.endsAt);
      setNextBarName(transition.barName);
      // Only propagate pregame phase when session is active — prevents stale DB values from auto-launching pregame
      setPregamePhase(status ? (fullRow?.pregame_phase ?? null) : null);
      setPregameSubjectId(status ? (fullRow?.pregame_subject_id ?? null) : null);
      setCountdownEndsAt(fullRow?.countdown_ends_at ? new Date(fullRow.countdown_ends_at).getTime() : null);
      setSpotlightDisabled(fullRow?.spotlight_disabled ?? false);
      setChallengeCooldownSecs(fullRow?.challenge_cooldown_secs ?? 0);
      setIsGamePaused(fullRow?.is_paused ?? false);
      setCurrentBar(fullRow?.current_bar ?? 1);
      setBarCadence(fullRow?.bar_cadence ?? '1,2,2');
      setChaosMode(fullRow?.chaos_mode ?? false);
      setMaxValidationsPerBar(fullRow?.max_validations_per_bar ?? 0);

      // Fix 1: recover session UUID from DB so QR survives page reload / cache clear
      if (status) {
        const recovered = await gameService.recoverSecureSessionId();
        if (recovered) setSecureSessionId(recovered);
      } else {
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

  useEffect(() => {
    // 1. Fetch initial status (immediate, no debounce needed on first load)
    checkSession();

    // 2. Subscribe to Realtime updates on table 'event_session'
    if (supabase) {
        const subscription = supabase
          .channel('session_updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'event_session'
            },
            (payload: any) => {
              console.log("[Realtime] Session change detected:", payload.eventType, payload.new);
              // Always do a full DB refetch — realtime UPDATE payloads are partial without REPLICA IDENTITY FULL.
              // Apply what we have from payload optimistically, then confirm with checkSession.
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
                if (p.is_active === false) {
                  setSecureSessionId(null);
                } else if (p.is_active && !gameService.getCurrentSecureSessionId()) {
                  gameService.recoverSecureSessionId().then(id => { if (id) setSecureSessionId(id); });
                }
              }
              // Full refetch to catch any field missing from the partial payload
              debouncedCheck();
            }
          )
          .subscribe((status) => {
            console.log("[Realtime] Subscription status:", status);
            // Re-check on reconnect — catches events missed while offline.
            // Debounced: SUBSCRIBED can fire alongside visibility + online.
            if (status === 'SUBSCRIBED') debouncedCheck();
          });

        // 3. Re-check when phone wakes up or tab regains focus
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') checkSession();
        };

        // 4. Re-check when network comes back online
        const handleOnline = () => checkSession();

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('online', handleOnline);

        // 5. Fallback polling every 8 s — catches realtime misses (bar countdown, pause, etc.)
        const pollInterval = setInterval(() => checkSession(), 8000);

        return () => {
          if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);
          supabase.removeChannel(subscription);
          document.removeEventListener('visibilitychange', handleVisibility);
          window.removeEventListener('online', handleOnline);
          clearInterval(pollInterval);
        };
    } else {
        setIsLoading(false);
    }
  }, [checkSession, debouncedCheck]);

  const setSessionActive = async (active: boolean) => {
    const previous = isSessionActive;
    try {
      setIsSessionActive(active); // Optimistic update
      if (!active) {
        // Closing the session: kill all open secure sessions.
        // Non-blocking if sessions table doesn't exist yet.
        try {
          await gameService.closeAllOpenSessions();
        } catch (e) {
          console.warn("[EventSession] closeAllOpenSessions failed:", e);
        }
        setSecureSessionId(null);
      }
      await gameService.setSessionStatus(active);
    } catch (e) {
      console.error("Failed to update session status", e);
      setIsSessionActive(previous); // Rollback
      alert("Erreur: Impossible de changer le statut de la session. Vérifiez votre connexion.");
    }
  };

  const resetSession = async () => {
    setIsSessionActive(false);
    await gameService.resetSession();
  };

  const createNewSession = async () => {
    setIsSessionActive(false); // Optimistic close
    const uuid = await gameService.createNewSession();
    setSecureSessionId(uuid);
    // Reset cadence so the new evening starts clean at Bar 1 with no chaos
    setCurrentBar(1);
    setChaosMode(false);
    await Promise.all([
      gameService.advanceBar().catch(() => {}), // will be ignored — bar reset handled below
      gameService.setChaosMode(false).catch(() => {}),
    ]);
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

  return {
    isSessionActive, isLoading, setSessionActive, resetSession, createNewSession, checkSession,
    transitionEndsAt, nextBarName, triggerBarTransition, clearBarTransition, secureSessionId,
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
      await gameService.advanceBar();
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
  };
};
