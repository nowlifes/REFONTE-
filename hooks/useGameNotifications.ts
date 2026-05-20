import { useEffect, useRef, useCallback } from 'react';

export function useGameNotifications() {
  const permRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      permRef.current = 'granted';
      return;
    }
    // Ask on first meaningful interaction (called from a user gesture context upstream)
    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => { permRef.current = p; });
    }
  }, []);

  const push = useCallback((title: string, body: string) => {
    if (!('Notification' in window)) return;
    // Only fire when tab is in background — in-app overlays already handle the visible case
    if (document.visibilityState === 'visible') return;
    if (permRef.current !== 'granted') return;
    try {
      new Notification(title, { body, icon: '/favicon.ico', tag: 'bingo-crawl' });
    } catch {}
  }, []);

  const notifyWitness = useCallback((playerName: string, challenge: string) => {
    push(`👁 ${playerName} a besoin de toi !`, `"${challenge}" — Confirme-le ?`);
  }, [push]);

  const notifyTaunt = useCallback((msg?: string) => {
    push('⚡ TAUNT REÇU !', msg ?? 'Quelqu\'un t\'a envoyé un taunt. Regarde ton écran !');
  }, [push]);

  return { notifyWitness, notifyTaunt };
}
