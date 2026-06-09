
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { gameService } from '../services/gameService';
import type { Badge, BadgeType } from '../types';

export function useBadges(playerId: string | undefined) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const badgesRef = useRef<Badge[]>([]);

  const fetchBadges = useCallback(async () => {
    if (!playerId) return;
    try {
      const { data, error } = await supabase
        .from('player_badges')
        .select('id, player_id, badge_type, unlocked_at')
        .eq('player_id', playerId)
        .order('unlocked_at', { ascending: false });
      
      if (!error && data) {
        setBadges(data);
        badgesRef.current = data;
      }
    } catch (e) {
      console.warn("Failed to fetch badges", e);
    }
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;

    fetchBadges();

    const subscription = supabase
      .channel(`badges:${playerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_badges',
          filter: `player_id=eq.${playerId}`
        },
        (payload) => {
          const badge = payload.new as Badge;
          // Source de vérité = badgesRef (pas de setState dans un updater :
          // évite la double-exécution en StrictMode et le double "new badge").
          if (badgesRef.current.some(b => b.badge_type === badge.badge_type)) return;
          const next = [...badgesRef.current, badge];
          badgesRef.current = next;
          setBadges(next);
          setNewBadge(badge);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [playerId, fetchBadges]);

  const injectBadge = useCallback(async (type: BadgeType) => {
    if (!playerId) return;
    if (badgesRef.current.some(b => b.badge_type === type)) return;

    // Optimistic
    const fakeBadge: Badge = {
      id: 'temp-' + Date.now(),
      player_id: playerId,
      badge_type: type,
      unlocked_at: new Date().toISOString()
    };
    
    setBadges(prev => {
        const next = [...prev, fakeBadge];
        badgesRef.current = next;
        return next;
    });
    setNewBadge(fakeBadge);

    // Persist
    try {
      await gameService.unlockBadge(playerId, type);
    } catch (e) {
      console.error("Exception saving badge:", e);
    }
  }, [playerId]);

  const clearNewBadge = useCallback(() => {
    setNewBadge(null);
  }, []);

  const resetBadges = useCallback(() => {
    setBadges([]);
    setNewBadge(null);
    badgesRef.current = [];
  }, []);

  return { badges, newBadge, injectBadge, clearNewBadge, resetBadges };
}
