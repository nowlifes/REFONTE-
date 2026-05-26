
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

interface BarTransitionOverlayProps {
  nextBarName: string | null;
  language: 'fr' | 'en';
  currentBar?: number;
  onDismiss: () => void;
}

const MECHANIC_UNLOCK: Record<number, { fr: string; en: string; emoji: string }> = {
  2: { emoji: '💣', fr: 'Tu peux saboter tes adversaires — fonce !', en: 'You can sabotage your rivals — go for it!' },
  3: { emoji: '🌀', fr: 'Mode Chaos — plus de limites !', en: 'Chaos Mode — no more limits!' },
};

const AUTO_DISMISS_SECS = 15;
const CIRCUMFERENCE = 2 * Math.PI * 28; // r=28

const BarTransitionOverlay: React.FC<BarTransitionOverlayProps> = ({ nextBarName, language, currentBar, onDismiss }) => {
  const mechanic = currentBar != null ? MECHANIC_UNLOCK[currentBar] : undefined;
  const [secsLeft, setSecsLeft] = useState(AUTO_DISMISS_SECS);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 80, 100, 80, 300]);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setSecsLeft(prev => {
        if (prev <= 1) { clearInterval(iv); onDismissRef.current(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const progress = secsLeft / AUTO_DISMISS_SECS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#FF2D6A] animate-in fade-in duration-400">

      {/* Animated background dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-white rounded-full animate-bounce"
            style={{
              left: `${(i * 27 + 5) % 100}%`,
              top: `${(i * 31 + 10) % 100}%`,
              animationDelay: `${(i * 0.2) % 1}s`,
              animationDuration: `${0.9 + (i % 3) * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-8 gap-5 pb-[env(safe-area-inset-bottom,16px)]">

        {/* Countdown ring */}
        <div className="relative flex items-center justify-center">
          <svg width="72" height="72" className="-rotate-90">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
            <circle
              cx="36" cy="36" r="28" fill="none"
              stroke="white" strokeWidth="5"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          <span className="absolute font-impact text-white text-2xl">{secsLeft}</span>
        </div>

        {/* Title */}
        <div>
          <p className="font-impact text-white/70 uppercase text-[11px] tracking-[0.4em] mb-1">
            {language === 'fr' ? 'Prépare-toi !' : 'Get ready!'}
          </p>
          <h1 className="font-impact text-white uppercase italic leading-[1.05] whitespace-pre-line" style={{ fontSize: '52px', textShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}>
            {language === 'fr' ? 'ON CHANGE\nDE BAR !' : 'MOVING TO\nNEXT BAR!'}
          </h1>
        </div>

        {/* Instruction */}
        <p className="font-impact text-white/70 uppercase text-[12px] tracking-wide leading-tight max-w-[260px]">
          {language === 'fr'
            ? 'Rejoins le groupe — le jeu continue au prochain bar !'
            : 'Join the group — the game continues at the next bar!'}
        </p>

        {/* Next bar */}
        {nextBarName && (
          <div className="bg-white border-[3px] border-black rounded-2xl px-5 py-3 shadow-[5px_5px_0px_black] flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#FF2D6A] shrink-0" strokeWidth={3} fill="currentColor" />
            <div className="flex flex-col items-start leading-none">
              <span className="font-impact text-black/40 uppercase text-[9px] tracking-widest">
                {language === 'fr' ? 'Prochain arrêt' : 'Next stop'}
              </span>
              <span className="font-impact text-black uppercase text-xl tracking-tight mt-0.5">{nextBarName}</span>
            </div>
          </div>
        )}

        {/* New mechanic unlock */}
        {mechanic && (
          <div className="bg-black border-[3px] border-white/20 rounded-2xl px-5 py-3 shadow-[5px_5px_0px_rgba(0,0,0,0.4)] flex items-center gap-3 max-w-[280px]">
            <span className="text-2xl shrink-0">{mechanic.emoji}</span>
            <p className="font-impact text-white uppercase text-[13px] tracking-tight leading-tight text-left">
              {language === 'fr' ? mechanic.fr : mechanic.en}
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onDismiss}
          className="mt-1 bg-white text-[#FF2D6A] font-impact uppercase text-xl px-8 py-4 rounded-[16px] border-[3px] border-black shadow-[5px_5px_0px_black] flex items-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          {language === 'fr' ? "C'est parti !" : "Let's go!"}
          <ArrowRight className="w-5 h-5" strokeWidth={3} />
        </button>

        <p className="font-impact text-white/40 uppercase text-[9px] tracking-widest">
          {language === 'fr' ? 'Ton score est sauvegardé' : 'Your score is saved'}
        </p>
      </div>
    </div>
  );
};

export default BarTransitionOverlay;
