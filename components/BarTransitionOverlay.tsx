
import React, { useEffect } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

interface BarTransitionOverlayProps {
  nextBarName: string | null;
  language: 'fr' | 'en';
  onDismiss: () => void;
}

const BarTransitionOverlay: React.FC<BarTransitionOverlayProps> = ({ nextBarName, language, onDismiss }) => {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 80, 100, 80, 300]);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#FF2D6A] animate-in fade-in duration-400">

      {/* Animated background dots — kept to 8 for performance on weak phones */}
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

      <div className="relative z-10 flex flex-col items-center text-center px-8 gap-6">

        {/* Icon */}
        <div className="w-24 h-24 bg-white border-[4px] border-black rounded-[24px] shadow-[8px_8px_0px_black] flex items-center justify-center animate-bounce">
          <span className="text-5xl">🚶</span>
        </div>

        {/* Title */}
        <div>
          <p className="font-impact text-white/60 uppercase text-[11px] tracking-[0.4em] mb-1">
            {language === 'fr' ? 'Temps écoulé' : "Time's up"}
          </p>
          <h1 className="font-impact text-white uppercase italic leading-none" style={{ fontSize: '56px', textShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}>
            {language === 'fr' ? 'ON BOUGE !' : "LET'S MOVE!"}
          </h1>
        </div>

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

        {/* CTA */}
        <button
          onClick={onDismiss}
          className="mt-2 bg-white text-[#FF2D6A] font-impact uppercase text-xl px-8 py-4 rounded-[16px] border-[3px] border-black shadow-[5px_5px_0px_black] flex items-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          {language === 'fr' ? "J'y vais !" : "I'm moving!"}
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
