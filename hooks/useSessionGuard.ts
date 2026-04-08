import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SessionGuardResult {
  /** True once the session UUID from ?s= has been confirmed open */
  isValid: boolean;
  /** True while the initial DB check is in flight */
  isLoading: boolean;
  /** The UUID read from ?s= URL param, or null if absent */
  sessionId: string | null;
  /**
   * Layer 2 guard — call before creating a player in the DB.
   * Returns true if the session is still open, false otherwise.
   */
  guardedCheck: () => Promise<boolean>;
}

/**
 * Implements the three session-security layers:
 *
 * 1. Route guard on mount — validates ?s=UUID against the sessions table.
 *    Calls onKick() and clears the URL param if the session is not open.
 *
 * 2. guardedCheck() — async re-validation right before a player is
 *    inserted in the DB (Layer 2 lives in gameService.createUser, this
 *    hook just exposes the same check for convenience).
 *
 * 3. Realtime kick — subscribes to UPDATE events on the specific session
 *    row. Calls onKick() the instant status changes away from 'open'.
 */
export const useSessionGuard = (onKick: () => void): SessionGuardResult => {
  const sessionId = useRef(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('s')
      : null
  ).current;

  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(!!sessionId);

  // Stable validate helper — used by both the mount check and guardedCheck
  const validate = useCallback(async (uuid: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('status')
        .eq('id', uuid)
        .single();
      if (error || !data) return false;
      return data.status === 'open';
    } catch {
      return false;
    }
  }, []);

  // Stable kick reference so the useEffect doesn't re-subscribe on every render
  const onKickRef = useRef(onKick);
  onKickRef.current = onKick;

  useEffect(() => {
    if (!sessionId) {
      // No ?s= param — existing event_session logic handles access control.
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // --- Layer 1: Route guard on mount ---
    validate(sessionId).then(valid => {
      if (cancelled) return;
      if (!valid) {
        // Remove stale ?s= param from the URL to block the browser back button
        window.history.replaceState(null, '', window.location.pathname);
        setIsValid(false);
        onKickRef.current();
      } else {
        setIsValid(true);
      }
      setIsLoading(false);
    });

    // --- Layer 3: Realtime kick ---
    const channel = supabase
      .channel(`session_guard_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          if (payload.new?.status !== 'open') {
            window.history.replaceState(null, '', window.location.pathname);
            setIsValid(false);
            onKickRef.current();
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sessionId, validate]);

  // --- Layer 2: Convenience re-check before player creation ---
  const guardedCheck = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return true; // No QR param → existing lock logic is authoritative
    return validate(sessionId);
  }, [sessionId, validate]);

  return { isValid, isLoading, sessionId, guardedCheck };
};
