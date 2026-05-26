import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SessionGuardResult {
  isValid: boolean;
  isLoading: boolean;
  sessionId: string | null;
  guardedCheck: () => Promise<boolean>;
}

export const useSessionGuard = (onKick: () => void): SessionGuardResult => {
  const sessionId = useRef(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('s')
      : null
  ).current;

  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(!!sessionId);

  const validate = useCallback(async (uuid: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('status, expires_at')
        .eq('id', uuid)
        .single();
      if (error || !data) return false;
      if (data.status !== 'open') return false;
      if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
      return true;
    } catch {
      return false;
    }
  }, []);

  const onKickRef = useRef(onKick);
  onKickRef.current = onKick;

  // Ref so visibilitychange / online handlers always see fresh isValid
  const isValidRef = useRef(isValid);
  isValidRef.current = isValid;

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // ─── Layer 1: Route guard on mount ────────────────────────────────────
    validate(sessionId).then(valid => {
      if (cancelled) return;
      if (!valid) {
        window.history.replaceState(null, '', window.location.pathname);
        setIsValid(false);
        onKickRef.current();
      } else {
        setIsValid(true);
      }
      setIsLoading(false);
    });

    // ─── Re-validate helper (used by all reconnection paths) ──────────────
    const revalidate = async () => {
      if (cancelled) return;
      let valid = await validate(sessionId);
      if (cancelled) return;
      if (!valid && isValidRef.current) {
        // Network might not be ready yet (phone wake-up race). Retry once after 2s
        // before kicking — avoids false kicks due to temporary network unavailability.
        await new Promise(r => setTimeout(r, 2000));
        if (cancelled) return;
        valid = await validate(sessionId);
        if (cancelled) return;
      }
      if (!valid && isValidRef.current) {
        window.history.replaceState(null, '', window.location.pathname);
        setIsValid(false);
        onKickRef.current();
      } else if (valid && !isValidRef.current) {
        setIsValid(true);
      }
    };

    // ─── Layer 3: Realtime kick ───────────────────────────────────────────
    // Also re-validates on reconnect so missed events are caught.
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
      .subscribe((status) => {
        // SUBSCRIBED fires both on initial connect AND on reconnect after a drop.
        // Re-validate on every reconnect to catch events missed while offline.
        if (status === 'SUBSCRIBED') {
          revalidate();
        }
      });

    // ─── Foreground restore: re-validate when app comes back into view ────
    // Covers: phone woke up, tab regained focus, PWA resumed from background.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') revalidate();
    };

    // ─── Network restore: re-validate when connectivity returns ──────────
    const handleOnline = () => revalidate();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, [sessionId, validate]);

  // ─── Layer 2: Guard before player creation ────────────────────────────
  const guardedCheck = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return true;
    return validate(sessionId);
  }, [sessionId, validate]);

  return { isValid, isLoading, sessionId, guardedCheck };
};
