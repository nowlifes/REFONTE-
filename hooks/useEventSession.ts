
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { gameService } from '../services/gameService';

export const useEventSession = () => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transitionEndsAt, setTransitionEndsAt] = useState<number | null>(null);
  const [nextBarName, setNextBarName] = useState<string | null>(null);
  // UUID for the current secure session (drives the QR code in MasterPage)
  const [secureSessionId, setSecureSessionId] = useState<string | null>(
    gameService.getCurrentSecureSessionId()
  );

  const checkSession = useCallback(async () => {
    try {
      const [status, transition] = await Promise.all([
        gameService.getSessionStatus(),
        gameService.getTransitionState(),
      ]);
      setIsSessionActive(status);
      setTransitionEndsAt(transition.endsAt);
      setNextBarName(transition.barName);

      // Fix 1: recover session UUID from DB so QR survives page reload / cache clear
      if (status) {
        const recovered = await gameService.recoverSecureSessionId();
        if (recovered) setSecureSessionId(recovered);
      } else {
        setSecureSessionId(null);
      }
    } catch (e) {
      console.warn("Could not fetch session status, defaulting to CLOSED (Strict Mode)");
      setIsSessionActive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Fetch initial status
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
              
              // On any change, we re-fetch the latest status to be 100% sure
              // This is more robust than relying on payload.new if the user has multiple rows
              checkSession();
            }
          )
          .subscribe((status) => {
            console.log("[Realtime] Subscription status:", status);
          });

        return () => {
          supabase.removeChannel(subscription);
        };
    }
 else {
        setIsLoading(false);
    }
  }, [checkSession]);

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
    setIsSessionActive(true); // Optimistic open
  };

  const triggerBarTransition = async (durationMinutes: number, barName?: string) => {
    await gameService.triggerBarTransition(durationMinutes, barName);
    // checkSession will be called via realtime
  };

  const clearBarTransition = async () => {
    await gameService.clearBarTransition();
    setTransitionEndsAt(null);
    setNextBarName(null);
  };

  return { isSessionActive, isLoading, setSessionActive, resetSession, createNewSession, checkSession, transitionEndsAt, nextBarName, triggerBarTransition, clearBarTransition, secureSessionId };
};
