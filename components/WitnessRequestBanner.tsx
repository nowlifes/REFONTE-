
import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { gameService } from '../services/gameService';
import { useGameSounds } from '../hooks/useGameSounds';
import { useGameNotifications } from '../hooks/useGameNotifications';

interface WitnessRequestBannerProps {
  playerId: string;
}

const WitnessRequestBanner: React.FC<WitnessRequestBannerProps> = ({ playerId }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const sounds = useGameSounds();
  const notifications = useGameNotifications();

  useEffect(() => {
    if (!playerId) return;
    const unsub = gameService.subscribeWitnessRequests(playerId, (reqs) => {
      setRequests(reqs);
      // Fire sound + push notification for NEW requests only
      reqs.forEach((r: any) => {
        if (!seenIdsRef.current.has(r.id)) {
          seenIdsRef.current.add(r.id);
          sounds.playWitnessRequest();
          if (navigator.vibrate) navigator.vibrate([100, 80, 200]);
          notifications.notifyWitness(r.player_nickname ?? '?', r.challenge_text ?? '');
        }
      });
    });
    return unsub;
  }, [playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = requests.filter(r => !dismissed.has(r.id));
  if (visible.length === 0) return null;

  const current = visible[0];

  const handleConfirm = async () => {
    if (confirmingId) return;
    const id = current.id;
    const req = current;
    setConfirmingId(id);
    try {
      await gameService.confirmWitness(req);
      setDismissed(prev => new Set([...prev, id]));
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReject = async () => {
    if (rejectingId) return;
    const id = current.id;
    setRejectingId(id);
    try {
      await gameService.rejectWitness(id);
      setDismissed(prev => new Set([...prev, id]));
    } catch (e) {
      console.error(e);
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ background: '#0A1629' }}
    >
      {/* ── Top zone — orange, player + challenge ────────────────────── */}
      <div
        className="flex-1 flex flex-col justify-end px-6 pb-8 pt-safe"
        style={{ background: 'linear-gradient(180deg, #FF8C00 0%, #FF6A00 100%)', paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 40px)' }}
      >
        {/* Eye icon */}
        <div className="mb-6">
          <div className="w-14 h-14 bg-black/20 border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_black]">
            <span className="text-2xl">👁️</span>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-black text-[#FF8C00] px-2.5 py-1 rounded-lg mb-3 w-fit">
          <span className="font-impact text-[9px] uppercase tracking-widest">Témoin requis</span>
          {visible.length > 1 && (
            <span className="bg-[#FF8C00] text-black rounded-md px-1.5 py-0.5 font-impact text-[8px]">
              +{visible.length - 1}
            </span>
          )}
        </div>

        {/* Who's asking */}
        <p className="font-impact text-black/60 uppercase text-[11px] tracking-widest mb-2">
          {current.player_emoji} {current.player_nickname} a besoin de toi :
        </p>

        {/* Challenge text — the hero */}
        <div className="bg-black/15 border-[3px] border-black/20 rounded-2xl px-5 py-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
          <p className="font-impact text-black text-[22px] uppercase leading-tight italic tracking-tight">
            "{current.challenge_text}"
          </p>
        </div>

        <p className="mt-4 font-impact text-black/50 uppercase text-[10px] tracking-widest leading-relaxed">
          Tu as vu cette personne accomplir ce défi ?
        </p>
      </div>

      {/* ── Bottom zone — dark, action buttons ───────────────────────── */}
      <div
        className="shrink-0 bg-[#0A1629] border-t-[3px] border-black px-5 pt-5 flex flex-col gap-3"
        style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={!!confirmingId || !!rejectingId}
          className="w-full py-5 bg-[#00FF9D] text-black rounded-2xl font-impact uppercase text-xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {confirmingId === current.id ? (
            <span className="w-6 h-6 border-[3px] border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Check size={22} strokeWidth={3} />
              Oui, je confirme !
            </>
          )}
        </button>

        {/* Deny */}
        <button
          onClick={handleReject}
          disabled={!!confirmingId || !!rejectingId}
          className="w-full py-4 bg-white/5 border-[2px] border-white/15 text-white/50 rounded-2xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 active:bg-white/10 transition-all disabled:opacity-40"
        >
          {rejectingId === current.id ? (
            <span className="w-5 h-5 border-[2px] border-white/20 border-t-white/60 rounded-full animate-spin" />
          ) : (
            <>
              <X size={16} strokeWidth={2.5} />
              Non, je n'ai pas vu ça
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WitnessRequestBanner;
