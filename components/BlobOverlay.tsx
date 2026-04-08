/**
 * BlobOverlay — SPLAT edition
 * Des taches colorées CSS apparaissent sur l'écran.
 * Le joueur doit toutes les taper pour débloquer.
 * Aucun canvas, aucun getImageData — 100% React state.
 */
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface BlobOverlayProps {
  secondsLeft: number;
  onCleaned: () => void;
}

interface Splat {
  id: number;
  x: number;   // % from left
  y: number;   // % from top
  size: number; // px
  color: string;
  emoji: string;
  rotation: number;
}

const COLORS = ['#00F5A0', '#FFD700', '#FF2E63', '#93C5FD', '#FCA5A5', '#86EFAC'];
const EMOJIS = ['💦', '💧', '🫧', '✨'];
const TOTAL = 8;

function generateSplats(): Splat[] {
  // Fixed positions so splats don't overlap badly
  const positions = [
    { x: 15, y: 15 }, { x: 55, y: 10 }, { x: 80, y: 20 },
    { x: 10, y: 45 }, { x: 45, y: 40 }, { x: 78, y: 48 },
    { x: 25, y: 72 }, { x: 65, y: 68 },
  ];
  return positions.map((p, i) => ({
    id: i,
    x: p.x,
    y: p.y,
    size: 64 + Math.floor(Math.sin(i * 1.7) * 20), // 44–84px
    color: COLORS[i % COLORS.length],
    emoji: EMOJIS[i % EMOJIS.length],
    rotation: (i * 47) % 360,
  }));
}

const BlobOverlay: React.FC<BlobOverlayProps> = ({ secondsLeft, onCleaned }) => {
  const { language } = useLanguage();
  const splats = useMemo(generateSplats, []);
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [popAnim, setPopAnim] = useState<Set<number>>(new Set());

  const tap = (id: number) => {
    if (popped.has(id)) return;
    if (navigator.vibrate) navigator.vibrate(25);

    // Pop animation then remove
    setPopAnim(prev => new Set(prev).add(id));
    setTimeout(() => {
      setPopped(prev => {
        const next = new Set(prev).add(id);
        if (next.size >= TOTAL) setTimeout(onCleaned, 300);
        return next;
      });
    }, 200);
  };

  const remaining = TOTAL - popped.size;

  return (
    <div className="fixed inset-0 z-[150] bg-[#0A1629]/90 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col">

      {/* Header */}
      <div className="pt-14 pb-2 text-center px-4 pointer-events-none">
        <p className="text-4xl mb-1">💦</p>
        <h2 className="text-3xl font-impact uppercase italic text-white tracking-tighter leading-none">
          {language === 'fr' ? 'NETTOIE ÇA !' : 'CLEAN IT UP!'}
        </h2>
        <p className="text-white/50 font-impact uppercase text-[10px] tracking-widest mt-1">
          {language === 'fr'
            ? `Tape sur les taches pour les effacer — ${remaining} restante${remaining > 1 ? 's' : ''}`
            : `Tap the splats to clean them — ${remaining} left`}
        </p>
      </div>

      {/* Play area */}
      <div className="flex-1 relative select-none">
        {splats.map(splat => {
          const isPopped = popped.has(splat.id);
          const isPoping = popAnim.has(splat.id);
          if (isPopped) return null;
          return (
            <button
              key={splat.id}
              onPointerDown={() => tap(splat.id)}
              className="absolute flex items-center justify-center font-impact text-black font-black border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,0.4)] active:scale-75 transition-all duration-150"
              style={{
                left: `${splat.x}%`,
                top: `${splat.y}%`,
                width: splat.size,
                height: splat.size,
                borderRadius: `${30 + (splat.id * 13) % 40}% ${60 - (splat.id * 17) % 30}% ${40 + (splat.id * 11) % 30}% ${50 - (splat.id * 7) % 20}%`,
                backgroundColor: splat.color,
                transform: `rotate(${splat.rotation}deg) scale(${isPoping ? 1.5 : 1})`,
                opacity: isPoping ? 0 : 1,
                touchAction: 'none',
              }}
            >
              <span className="text-xl" style={{ transform: `rotate(-${splat.rotation}deg)` }}>
                {splat.emoji}
              </span>
            </button>
          );
        })}

        {/* All cleared */}
        {remaining === 0 && (
          <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-75 duration-300 pointer-events-none">
            <div className="bg-[#00F5A0] border-[4px] border-black rounded-3xl px-8 py-6 shadow-[8px_8px_0px_black] text-center">
              <p className="text-5xl mb-2">✨</p>
              <p className="font-impact text-black uppercase text-2xl tracking-tight italic">
                {language === 'fr' ? 'PROPRE !' : 'CLEAN!'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="pb-10 text-center pointer-events-none">
        <span className="font-impact text-white/30 uppercase text-[10px] tracking-widest">{secondsLeft}s</span>
      </div>
    </div>
  );
};

export default BlobOverlay;
