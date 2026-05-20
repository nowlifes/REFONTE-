/**
 * FlashlightOverlay — LAMPE TORCHE
 * Écran noir total + cercle de lumière qui suit le doigt.
 * Le joueur doit naviguer sa grille à l'aveugle pendant 45s.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface FlashlightOverlayProps {
  secondsLeft: number;
  senderName?: string | null;
}

const RADIUS = 110; // px du spotlight de base
const FLICKER_INTERVAL = 4200; // ms entre flickerings

const FlashlightOverlay: React.FC<FlashlightOverlayProps> = ({ secondsLeft, senderName }) => {
  const { language } = useLanguage();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Centre de l'écran comme position par défaut
  const [pos, setPos] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
  }));
  const [flickering, setFlickering] = useState(false);
  const [radius, setRadius] = useState(RADIUS);

  // Track pointer / touch
  const handlePointerMove = useCallback((e: PointerEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      e.preventDefault();
      setPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, []);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handlePointerMove, handleTouchMove]);

  // Flickering aléatoire
  useEffect(() => {
    const id = setInterval(() => {
      setFlickering(true);
      const steps = [80, 110, 60, 110, 95, 110];
      steps.forEach((r, i) => {
        setTimeout(() => setRadius(r), i * 60);
      });
      setTimeout(() => {
        setFlickering(false);
        setRadius(RADIUS);
      }, steps.length * 60 + 100);
    }, FLICKER_INTERVAL + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // Urgence : réduction du spotlight dans les 10 dernières secondes
  const effectiveRadius = secondsLeft <= 10
    ? radius * (0.6 + 0.4 * (secondsLeft / 10))
    : radius;

  const mask = `radial-gradient(circle ${effectiveRadius}px at ${pos.x}px ${pos.y}px, transparent 0%, transparent ${effectiveRadius * 0.6}px, black ${effectiveRadius}px, black 100%)`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[150] select-none"
      style={{ touchAction: 'none', cursor: 'none' }}
    >
      {/* Dark overlay with hole — masked separately so UI elements above are not clipped */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'rgba(0,0,0,0.97)',
        maskImage: mask,
        WebkitMaskImage: mask,
      }} />

      {/* Header info — visible always */}
      <div className="absolute top-0 left-0 right-0 pt-12 pb-4 text-center pointer-events-none">
        <p className="font-impact text-white/60 uppercase text-[11px] tracking-widest">
          {senderName
            ? (language === 'fr' ? `${senderName} a éteint les lumières` : `${senderName} killed the lights`)
            : (language === 'fr' ? 'Les lumières sont éteintes' : 'Lights out')}
        </p>
      </div>

      {/* Timer — positionné en bas */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
        <div className={`px-5 py-2.5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] flex items-center gap-3 transition-all duration-300 ${
          secondsLeft <= 10 ? 'bg-[#FF2D6A] animate-pulse' : 'bg-[#0A1629]/80'
        }`}>
          <span className="text-xl">🔦</span>
          <span className="font-impact text-white text-2xl italic tracking-tight">{secondsLeft}s</span>
        </div>
      </div>

      {/* Crosshair au centre du spotlight */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: pos.x - 12,
          top: pos.y - 12,
          width: 24,
          height: 24,
          opacity: flickering ? 0.3 : 0.5,
          transition: 'opacity 0.1s',
        }}
      >
        <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-200/60" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-200/60" />
      </div>
    </div>
  );
};

export default FlashlightOverlay;
