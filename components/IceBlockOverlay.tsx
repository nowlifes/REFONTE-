import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface IceBlockOverlayProps {
  /** Seconds remaining on the taunt */
  secondsLeft: number;
}

const TOTAL_BLOCKS = 12;
const TAPS_PER_BLOCK = 3;

const IceBlockOverlay: React.FC<IceBlockOverlayProps> = ({ secondsLeft }) => {
  const { language } = useLanguage();
  // Each block tracks how many times it's been tapped
  const [taps, setTaps] = useState<number[]>(Array(TOTAL_BLOCKS).fill(0));

  const tapBlock = useCallback((index: number) => {
    if (navigator.vibrate) navigator.vibrate(15);
    setTaps(prev => {
      const next = [...prev];
      next[index] = Math.min(next[index] + 1, TAPS_PER_BLOCK);
      return next;
    });
  }, []);

  const melted = taps.filter(t => t >= TAPS_PER_BLOCK).length;
  const pct = Math.round((melted / TOTAL_BLOCKS) * 100);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-[#0A1629]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xs mx-4 flex flex-col items-center gap-4">

        {/* Header */}
        <div className="text-center">
          <p className="text-4xl mb-1">🧊</p>
          <h2 className="text-3xl font-impact uppercase italic text-white tracking-tighter leading-none">
            {language === 'fr' ? 'ICE BLOCK!' : 'ICE BLOCK!'}
          </h2>
          <p className="text-white/50 font-impact uppercase text-[10px] tracking-widest mt-1">
            {language === 'fr'
              ? 'Tape sur la glace pour libérer ta grille'
              : 'Tap the ice to free your grid'}
          </p>
        </div>

        {/* Ice grid */}
        <div className="grid grid-cols-4 gap-2 w-full">
          {taps.map((t, i) => {
            const melted = t >= TAPS_PER_BLOCK;
            const crackLevel = t; // 0, 1, 2 cracks
            return (
              <button
                key={i}
                onPointerDown={() => !melted && tapBlock(i)}
                disabled={melted}
                className={`
                  h-16 rounded-xl border-[3px] border-black flex items-center justify-center
                  transition-all duration-150 select-none
                  ${melted
                    ? 'bg-[#00F5A0]/20 border-[#00F5A0]/40 shadow-none'
                    : 'bg-[#93C5FD] shadow-[3px_3px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                  }
                `}
                style={{ touchAction: 'none' }}
              >
                {melted
                  ? <span className="text-xl">✅</span>
                  : <span className="text-xl select-none">
                      {crackLevel === 0 ? '🧊' : crackLevel === 1 ? '🫧' : '💧'}
                    </span>
                }
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-black/30 border-[2px] border-black rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-[#00F5A0] rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="font-impact text-white/50 uppercase text-[10px] tracking-widest">
          {pct}% {language === 'fr' ? 'FONDU' : 'MELTED'} · {secondsLeft}s
        </p>
      </div>
    </div>
  );
};

export default IceBlockOverlay;
