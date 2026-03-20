
import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { MASTER_RUNE_SEQUENCE } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface MasterRunePadProps {
  onSuccess: () => void;
}

// 0: Up, 1: Right, 2: Down, 3: Left
const RUNES = [
  { id: 0, icon: ChevronUp, label: 'North' },
  { id: 1, icon: ChevronRight, label: 'East' },
  { id: 2, icon: ChevronDown, label: 'South' },
  { id: 3, icon: ChevronLeft, label: 'West' },
];

const MasterRunePad: React.FC<MasterRunePadProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [shuffledRunes, setShuffledRunes] = useState(RUNES);
  const [sequence, setSequence] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  // Shuffle runes on mount to prevent pattern memorization
  useEffect(() => {
    setShuffledRunes([...RUNES].sort(() => Math.random() - 0.5));
  }, []);

  const handlePress = (id: number) => {
    if (error || successAnim) return;

    // Trigger haptic feedback if available (security through physical feel vs visual)
    if (navigator.vibrate) navigator.vibrate(10);

    const newSequence = [...sequence, id];
    setSequence(newSequence);

    // Check pattern
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
          // Shuffle again on error to frustrate brute-force/guessing
          setShuffledRunes([...RUNES].sort(() => Math.random() - 0.5));
        }, 500);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2">
      
      {/* Container for vertical centering integrity */}
      <div className="flex flex-col items-center justify-center w-full max-w-[280px] space-y-6">
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-navy-800 border-2 border-gold-600 mb-3 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
             <Lock className="w-7 h-7 text-gold-500" />
          </div>
          <h4 className="font-playbook text-gold-400 text-2xl font-bold uppercase tracking-widest mb-1 leading-none">
            {t('security_gate')}
          </h4>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            {t('security_desc')}
          </p>
        </div>

        {/* Rune Grid - Perfectly Centered */}
        <div className={`grid grid-cols-2 gap-4 w-full place-items-center ${error ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
          {shuffledRunes.map((rune) => (
            <button
              key={rune.id}
              onClick={() => handlePress(rune.id)}
              className={`
                w-24 h-24 rounded-2xl border-2 flex items-center justify-center
                transition-all duration-150 active:scale-95 shadow-lg relative overflow-hidden group
                bg-navy-800 border-gold-600/50 hover:border-gold-500 hover:bg-navy-700
                ${successAnim ? 'scale-110 opacity-0' : 'opacity-100'}
              `}
            >
              {/* Inner Glow */}
              <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-active:opacity-100 transition-opacity"></div>
              
              <rune.icon 
                className={`w-12 h-12 text-gold-400 drop-shadow-md transition-transform duration-200 group-active:scale-90`} 
                strokeWidth={2.5} 
              />
            </button>
          ))}
        </div>

        {/* Sequence Feedback Dots - Centered */}
        <div className="flex items-center justify-center gap-4 h-6 w-full">
          {Array.from({ length: MASTER_RUNE_SEQUENCE.length }).map((_, i) => (
            <div 
              key={i}
              className={`
                w-3 h-3 rounded-full transition-all duration-300 shadow-sm
                ${i < sequence.length 
                  ? error ? 'bg-red-500 scale-110' : successAnim ? 'bg-green-400 shadow-[0_0_10px_#4ade80] scale-125' : 'bg-gold-500 scale-110' 
                  : 'bg-navy-900 border border-gold-500/30'}
              `}
            />
          ))}
        </div>

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
