/**
 * ReverseOverlay — MALÉDICTION ACTIVE
 * Banner persistant (non-bloquant) affiché pendant 2min.
 * Quand la victime valide une case → le sender gagne +1 aussi.
 */
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ReverseOverlayProps {
  secondsLeft: number;
  senderName?: string | null;
}

const ReverseOverlay: React.FC<ReverseOverlayProps> = ({ secondsLeft, senderName }) => {
  const { language } = useLanguage();

  const urgent = secondsLeft <= 30;

  return (
    <div className="fixed bottom-24 left-3 right-3 z-[145] pointer-events-none animate-in slide-in-from-bottom-4 duration-300">
      <div className={`rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] px-4 py-3 flex items-center gap-3 transition-colors duration-500 ${
        urgent ? 'bg-[#7C3AED] animate-pulse' : 'bg-[#7C3AED]'
      }`}>
        {/* Icon */}
        <div className="shrink-0 w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center border border-white/20">
          <span className="text-xl">🔁</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-impact text-white uppercase text-[13px] tracking-tight leading-none truncate">
            {senderName
              ? (language === 'fr' ? `${senderName} vole tes points !` : `${senderName} is stealing your points!`)
              : (language === 'fr' ? 'Malédiction active !' : 'Curse active!')}
          </p>
          <p className="font-impact text-white/60 uppercase text-[9px] tracking-widest mt-0.5">
            {language === 'fr'
              ? 'Ton prochain défi validé lui donne +1'
              : 'Your next challenge gives them +1'}
          </p>
        </div>

        {/* Timer */}
        <div className={`shrink-0 px-2.5 py-1.5 rounded-xl border-[2px] border-white/30 ${
          urgent ? 'bg-white/30' : 'bg-black/20'
        }`}>
          <span className="font-impact text-white text-sm">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReverseOverlay;
