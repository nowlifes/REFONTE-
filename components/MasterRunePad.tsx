
import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
// Kept local — not imported from constants to avoid bundle-level export exposure
const MASTER_RUNE_SEQUENCE = [0, 2, 3, 1];

interface MasterRunePadProps {
  onSuccess: () => void;
}

// 0: Up, 1: Right, 2: Down, 3: Left
const RUNES = [
  { id: 0, icon: ChevronUp },
  { id: 1, icon: ChevronRight },
  { id: 2, icon: ChevronDown },
  { id: 3, icon: ChevronLeft },
];

const MasterRunePad: React.FC<MasterRunePadProps> = ({ onSuccess }) => {
  const [shuffledRunes, setShuffledRunes] = useState(RUNES);
  const [sequence, setSequence] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  useEffect(() => {
    setShuffledRunes([...RUNES].sort(() => Math.random() - 0.5));
  }, []);

  const handlePress = (id: number) => {
    if (error || successAnim) return;
    if (navigator.vibrate) navigator.vibrate(10);

    const newSequence = [...sequence, id];
    setSequence(newSequence);

    if (newSequence.length === MASTER_RUNE_SEQUENCE.length) {
      const isCorrect = newSequence.every((val, index) => val === MASTER_RUNE_SEQUENCE[index]);

      if (isCorrect) {
        setSuccessAnim(true);
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        setTimeout(onSuccess, 600);
      } else {
        setError(true);
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => {
          setSequence([]);
          setError(false);
          setShuffledRunes([...RUNES].sort(() => Math.random() - 0.5));
        }, 500);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 p-4">

      {/* Label */}
      <p className="text-[9px] font-impact uppercase tracking-widest text-black/50 text-center">
        CODE SÉQUENCE MAÎTRE
      </p>

      {/* Progress dots */}
      <div className="flex items-center gap-3">
        {Array.from({ length: MASTER_RUNE_SEQUENCE.length }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 border-black transition-all duration-200 ${
              i < sequence.length
                ? error
                  ? 'bg-[#FF2E63] scale-110'
                  : successAnim
                  ? 'bg-[#00FF9D] scale-125'
                  : 'bg-black scale-110'
                : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* 2×2 Button Grid */}
      <div className={`grid grid-cols-2 gap-3 ${error ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
        {shuffledRunes.map((rune) => {
          const Icon = rune.icon;
          return (
            <button
              key={rune.id}
              onClick={() => handlePress(rune.id)}
              className={`w-20 h-20 rounded-2xl border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all bg-white ${
                successAnim ? 'opacity-0 scale-110' : 'opacity-100'
              }`}
            >
              <Icon className="w-10 h-10 text-black" strokeWidth={3} />
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};

export default MasterRunePad;
