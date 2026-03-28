
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { gameService } from '../services/gameService';

export const useEventSession = () => {
  // On initialise à FALSE par sécurité (fermé par défaut) jusqu'à confirmation du serveur
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false); 
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    // Note: We don't set global isLoading to true here to avoid full page spinner on manual refresh
    // unless it is the initial load, which is handled by the initial state of isLoading
    try {
      const status = await gameService.getSessionStatus();
      setIsSessionActive(status);
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
      // Optimistic update
      setIsSessionActive(active);
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
    await gameService.createNewSession();
    setIsSessionActive(true); // Optimistic open
  };

  return { isSessionActive, isLoading, setSessionActive, resetSession, createNewSession, checkSession };
};
