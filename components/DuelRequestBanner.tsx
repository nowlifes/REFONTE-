import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Crosshair } from 'lucide-react';
import { gameService } from '../services/gameService';

interface Props {
  playerId: string;
}

const DuelRequestBanner: React.FC<Props> = ({ playerId }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [phase, setPhase] = useState<'pick' | 'playing'>('pick');
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!playerId) return;
    return gameService.subscribeDuelRequests(playerId, (reqs) => {
      setRequests(reqs);
      reqs.forEach((r: any) => {
        if (!seenRef.current.has(r.id)) {
          seenRef.current.add(r.id);
          if (navigator.vibrate) navigator.vibrate([100, 80, 200]);
        }
        if (r.status === 'ACCEPTED') {
          setPhase('playing');
        }
      });
    });
  }, [playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    setPhase('pick');
  };

  const visible = requests.filter(r => !dismissed.has(r.id) && r.status !== 'DECLINED');
  if (visible.length === 0) return null;
  const current = visible[0];

  const handleAccept = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await gameService.acceptDuel(current.id);
      setPhase('playing');
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await gameService.declineDuel(current.id);
      dismiss(current.id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleResult = async (opponentWon: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      await gameService.declareDuelResult(current.id, opponentWon);
      dismiss(current.id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ background: '#0A1629' }}
    >
      {/* Zone haute — rose, challenge */}
      <div
        className="flex-1 flex flex-col justify-end px-6 pb-8"
        style={{
          background: 'linear-gradient(180deg, #FF2D6A 0%, #CC1A50 100%)',
          paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 40px)',
        }}
      >
        {/* Icône */}
        <div className="mb-6">
          <div className="w-14 h-14 border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_black]" style={{ background: '#FF8C00' }}>
            <Crosshair size={28} strokeWidth={2.5} className="text-white" />
          </div>
        </div>

        {/* Badge statut */}
        <div className="inline-flex items-center gap-1.5 bg-black text-[#FF2D6A] px-2.5 py-1 rounded-lg mb-3 w-fit">
          <span className="font-impact text-[9px] uppercase tracking-widest">
            {phase === 'pick' ? 'DUEL INCOMING' : "C'EST PARTI !"}
          </span>
          {visible.length > 1 && (
            <span className="bg-[#FF2D6A] text-black rounded-md px-1.5 py-0.5 font-impact text-[8px]">
              +{visible.length - 1}
            </span>
          )}
        </div>

        {/* Qui défie */}
        <p className="font-impact text-black/60 uppercase text-[11px] tracking-widest mb-2">
          {current.challenger_emoji} {current.challenger_nickname} te défie
        </p>

        {/* Challenge hero */}
        <div className="bg-black/15 border-[3px] border-black/20 rounded-2xl px-5 py-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
          <p className="font-impact text-black text-[22px] uppercase leading-tight italic tracking-tight">
            "{current.challenge_text}"
          </p>
        </div>

        <p className="mt-4 font-impact text-black/50 uppercase text-[10px] tracking-widest leading-relaxed">
          {phase === 'pick'
            ? 'Acceptes-tu ce défi ?'
            : 'Jouez ! Déclare le résultat quand c\'est terminé.'}
        </p>
      </div>

      {/* Zone basse — sombre, boutons */}
      <div
        className="shrink-0 bg-[#0A1629] border-t-[3px] border-black px-5 pt-5 flex flex-col gap-3"
        style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {phase === 'pick' ? (
          <>
            <button
              onClick={handleAccept}
              disabled={busy}
              className="w-full py-5 bg-[#00FF9D] text-black rounded-2xl font-impact uppercase text-xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {busy
                ? <span className="w-6 h-6 border-[3px] border-black/30 border-t-black rounded-full animate-spin" />
                : <><Check size={22} strokeWidth={3} /> Accepter le duel</>
              }
            </button>
            <button
              onClick={handleDecline}
              disabled={busy}
              className="w-full py-4 bg-white/5 border-[2px] border-white/15 text-white/50 rounded-2xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 active:bg-white/10 transition-all disabled:opacity-40"
            >
              <X size={16} strokeWidth={2.5} />
              Décliner
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleResult(true)}
              disabled={busy}
              className="w-full py-5 bg-[#00FF9D] text-black rounded-2xl font-impact uppercase text-xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-3"
            >
              {busy
                ? <span className="w-6 h-6 border-[3px] border-black/30 border-t-black rounded-full animate-spin" />
                : '🏆 J\'ai gagné'
              }
            </button>
            <button
              onClick={() => handleResult(false)}
              disabled={busy}
              className="w-full py-4 bg-white/5 border-[2px] border-white/15 text-white/50 rounded-2xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 active:bg-white/10 transition-all disabled:opacity-40"
            >
              💀 J&apos;ai perdu
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DuelRequestBanner;
