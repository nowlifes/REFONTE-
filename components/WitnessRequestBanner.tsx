
import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { gameService } from '../services/gameService';

interface WitnessRequestBannerProps {
  playerId: string;
}

const WitnessRequestBanner: React.FC<WitnessRequestBannerProps> = ({ playerId }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;
    const unsub = gameService.subscribeWitnessRequests(playerId, setRequests);
    return unsub;
  }, [playerId]);

  if (requests.length === 0) return null;

  const current = requests[0]; // Show one at a time

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] animate-in slide-in-from-top-2 duration-300">
      <div className="bg-[#FF8C00] border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_black] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 bg-black/15 flex items-center gap-2">
          <span className="text-base leading-none">👁️</span>
          <span className="font-impact text-black uppercase text-[10px] tracking-widest">
            Tu as été désigné témoin
          </span>
          {requests.length > 1 && (
            <div className="ml-auto bg-black text-[#FF8C00] rounded-md px-1.5 py-0.5">
              <span className="font-impact text-[9px]">+{requests.length - 1}</span>
            </div>
          )}
        </div>

        {/* Challenge info */}
        <div className="px-4 py-3">
          <p className="font-impact text-black/60 uppercase text-[9px] tracking-widest mb-1">
            {current.player_nickname} dit avoir fait :
          </p>
          <p className="font-impact text-black uppercase text-[13px] leading-tight italic mb-3">
            "{current.challenge_text}"
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (confirmingId) return;
                setConfirmingId(current.id);
                try { await gameService.confirmWitness(current); }
                catch (e) { console.error(e); }
                finally { setConfirmingId(null); }
              }}
              disabled={!!confirmingId || !!rejectingId}
              className="flex-1 py-3 bg-black text-[#FF8C00] rounded-xl font-impact uppercase text-[11px] border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {confirmingId === current.id
                ? <span className="w-4 h-4 border-2 border-[#FF8C00]/40 border-t-[#FF8C00] rounded-full animate-spin" />
                : <><Check size={14} strokeWidth={3} /> Je confirme</>
              }
            </button>
            <button
              onClick={async () => {
                if (rejectingId) return;
                setRejectingId(current.id);
                try { await gameService.rejectWitness(current.id); }
                catch (e) { console.error(e); }
                finally { setRejectingId(null); }
              }}
              disabled={!!confirmingId || !!rejectingId}
              className="flex-1 py-3 bg-white text-black rounded-xl font-impact uppercase text-[11px] border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,0.2)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {rejectingId === current.id
                ? <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                : <><X size={14} strokeWidth={3} /> Je nie</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WitnessRequestBanner;
