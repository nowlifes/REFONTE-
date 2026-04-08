import React from 'react';
import { ShieldOff } from 'lucide-react';
import BackgroundParticles from './BackgroundParticles';

/**
 * Shown when:
 * - A player arrives with a stale / unknown session UUID (?s=xxx)
 * - The master closes the session and the realtime kick fires
 *
 * The back button is blocked by the `replaceState` call in useSessionGuard.
 */
const GameOverPage: React.FC = () => {
  return (
    <div className="min-h-[100dvh] bg-[#0A1629] flex flex-col items-center justify-center relative px-6 text-center">
      <BackgroundParticles />

      <div className="relative z-10 flex flex-col items-center max-w-xs">
        {/* Icon */}
        <div className="w-24 h-24 mb-6 bg-[#FF2D6A]/10 border-[4px] border-[#FF2D6A] rounded-full flex items-center justify-center shadow-[6px_6px_0px_black]">
          <ShieldOff className="w-12 h-12 text-[#FF2D6A]" strokeWidth={2.5} />
        </div>

        {/* Title */}
        <h1 className="font-impact text-4xl uppercase tracking-tighter text-white mb-2">
          SESSION FERMÉE
        </h1>
        <p className="font-impact text-[11px] uppercase tracking-[0.25em] text-white/30 mb-8">
          GAME OVER
        </p>

        {/* Message */}
        <p className="text-white/60 text-sm leading-relaxed mb-10">
          Cette session de jeu est terminée ou le lien n'est plus valide.
          <br />
          Demande un nouveau QR code au Game Master.
        </p>

        {/* Subtle version indicator */}
        <p className="text-[9px] font-impact uppercase tracking-widest text-white/15">
          BINGO CRAWL · LISBONNE
        </p>
      </div>
    </div>
  );
};

export default GameOverPage;
