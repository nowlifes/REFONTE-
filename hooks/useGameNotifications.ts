import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function useGameNotifications() {
  const { language } = useLanguage();
  const permRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      permRef.current = 'granted';
      return;
    }
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
    const isFr = language === 'fr';
    push(
      `👁 ${playerName} ${isFr ? 'a besoin de toi !' : 'needs you!'}`,
      `"${challenge}" — ${isFr ? 'Tu confirmes ?' : 'Can you confirm?'}`,
    );
  }, [push, language]);

  const notifyTaunt = useCallback((msg?: string) => {
    const isFr = language === 'fr';
    push(
      `⚡ ${isFr ? 'SABOTAGE REÇU !' : 'SABOTAGE INCOMING!'}`,
      msg ?? (isFr ? 'Quelqu\'un t\'a attaqué. Regarde ton écran !' : 'Someone just hit you. Check your screen!'),
    );
  }, [push, language]);

  return { notifyWitness, notifyTaunt };
}
