
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ADULT_EMOJI_MAP } from '../constants';

interface BoostRevealOverlayProps {
  winner: { name: string; emoji: string; type: 'boost' | 'sabotage' };
  onDone: () => void;
}

const DISPLAY_MS = 4000;

const BoostRevealOverlay: React.FC<BoostRevealOverlayProps> = ({ winner, onDone }) => {
  const { language } = useLanguage();
  const [progress, setProgress] = useState(100);
  const isSabotage = winner.type === 'sabotage';
  const accentColor = isSabotage ? '#FF2D6A' : '#FF8C00';
  const emojiChar = ADULT_EMOJI_MAP[winner.emoji] ?? winner.emoji ?? '🎲';

  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DISPLAY_MS) * 100);
      setProgress(remaining);
      if (remaining === 0) { clearInterval(iv); onDone(); }
    }, 50);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[350] flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #0A1629 60%)`, opacity: 0.97 }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center w-full max-w-sm mx-auto">
        {/* Type label */}
        <div className="inline-flex items-center gap-2 bg-black/40 border-[2px] border-white/20 rounded-xl px-4 py-1.5">
          <span className="font-impact text-white uppercase text-[11px] tracking-widest">
            {isSabotage
              ? (language === 'fr' ? '💀 Sabotage collectif' : '💀 Group sabotage')
              : (language === 'fr' ? '🏆 Boost mérité' : '🏆 Boost earned')}
          </span>
        </div>

        {/* Winner card */}
        <div
          className="w-full bg-white border-[4px] border-black rounded-3xl px-8 py-8 shadow-[8px_8px_0px_black] flex flex-col items-center gap-3"
        >
          <div
            className="w-20 h-20 rounded-2xl border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_black]"
            style={{ backgroundColor: accentColor }}
          >
            <span className="text-4xl leading-none">{emojiChar}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="font-impact text-black/50 uppercase text-[10px] tracking-widest">
              {isSabotage
                ? (language === 'fr' ? 'a été sabotage' : 'got sabotaged')
                : (language === 'fr' ? 'reçoit un boost' : 'gets a boost')}
            </p>
            <p className="font-impact text-black text-[28px] uppercase leading-tight tracking-tight">
              {winner.name}
            </p>
            <p className="font-impact text-[11px] uppercase tracking-widest" style={{ color: accentColor }}>
              {isSabotage
                ? (language === 'fr' ? 'Effet surprise activé !' : 'Surprise effect activated!')
                : (language === 'fr' ? 'Sabotage gratuit débloqué !' : 'Free taunt unlocked!')}
            </p>
          </div>
        </div>

        {/* Countdown bar */}
        <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-none"
            style={{ width: `${progress}%`, backgroundColor: 'white' }}
          />
        </div>
      </div>
    </div>
  );
};

export default BoostRevealOverlay;
