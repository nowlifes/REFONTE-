import React, { useState, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TinyTargetOverlayProps {
  secondsLeft: number;
  onCaught: () => void;
}

const BUTTON_SIZE = 48; // px — petit mais attrapable
const FLEE_DISTANCE = 120; // px — distance de fuite

const TinyTargetOverlay: React.FC<TinyTargetOverlayProps> = ({ secondsLeft, onCaught }) => {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  // Position relative au container (0–1)
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [catches, setCatches] = useState(0);
  const CATCHES_NEEDED = 3;

  const flee = useCallback((touchX: number, touchY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = (pos.x * rect.width);
    const cy = (pos.y * rect.height);

    // Direction opposée au toucher
    const dx = cx - (touchX - rect.left);
    const dy = cy - (touchY - rect.top);
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    const newX = Math.min(Math.max((cx + nx * FLEE_DISTANCE) / rect.width, 0.05), 0.95);
    const newY = Math.min(Math.max((cy + ny * FLEE_DISTANCE) / rect.height, 0.1), 0.9);
    setPos({ x: newX, y: newY });
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    flee(e.clientX, e.clientY);
  }, [flee]);

  const handleCatch = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    const next = catches + 1;
    setCatches(next);
    if (next >= CATCHES_NEEDED) {
      onCaught();
    } else {
      // Jump to random position after catch
      setPos({
        x: 0.1 + Math.random() * 0.8,
        y: 0.2 + Math.random() * 0.6,
      });
    }
  }, [catches, onCaught]);

  return (
    <div className="fixed inset-0 z-[150] bg-[#0A1629]/90 backdrop-blur-md animate-in fade-in duration-200 flex flex-col">
      {/* Instructions */}
      <div className="pt-16 pb-4 text-center px-4 pointer-events-none">
        <p className="text-4xl mb-1">🎯</p>
        <h2 className="text-3xl font-impact uppercase italic text-white tracking-tighter leading-none">
          TINY TARGET!
        </h2>
        <p className="text-white/50 font-impact uppercase text-[10px] tracking-widest mt-1">
          {language === 'fr'
            ? `Attrape le bouton ${CATCHES_NEEDED} fois pour débloquer`
            : `Catch the button ${CATCHES_NEEDED} times to unlock`}
        </p>
        <div className="flex justify-center gap-2 mt-3">
          {Array.from({ length: CATCHES_NEEDED }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 border-black transition-all duration-200 ${i < catches ? 'bg-[#00F5A0]' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      {/* Play area */}
      <div
        ref={containerRef}
        className="flex-1 relative"
        onPointerMove={handlePointerMove}
      >
        <button
          onPointerDown={handleCatch}
          className="absolute bg-[#FFD700] border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] flex items-center justify-center font-impact text-black uppercase text-[10px] tracking-tight transition-all duration-150 active:scale-90"
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            left: `calc(${pos.x * 100}% - ${BUTTON_SIZE / 2}px)`,
            top: `calc(${pos.y * 100}% - ${BUTTON_SIZE / 2}px)`,
            touchAction: 'none',
          }}
        >
          ⚡
        </button>
      </div>

      {/* Timer */}
      <div className="pb-10 text-center pointer-events-none">
        <span className="font-impact text-white/30 uppercase text-[10px] tracking-widest">{secondsLeft}s</span>
      </div>
    </div>
  );
};

export default TinyTargetOverlay;
