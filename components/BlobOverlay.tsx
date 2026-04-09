/**
 * BlobOverlay — GOOEY edition
 * Des blobs animés envahissent l'écran.
 * Tape-les pour les faire éclater — animations CSS pures, zéro canvas.
 */
import React, { useState, useRef, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface BlobOverlayProps {
  secondsLeft: number;
  onCleaned: () => void;
}

interface Blob {
  id: number;
  x: number;       // % from left (center)
  y: number;       // % from top (center)
  size: number;    // px
  color: string;
  hue: number;     // for CSS filter
  delay: number;   // animation stagger ms
  speed: number;   // pulse speed s
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  color: string;
}

const BLOB_COLORS = [
  { bg: '#00F5A0', shadow: '#00c87a' },
  { bg: '#FFD700', shadow: '#cc9900' },
  { bg: '#FF2D6A', shadow: '#cc0040' },
  { bg: '#7C3AED', shadow: '#4c1d95' },
  { bg: '#FF8C00', shadow: '#cc6200' },
  { bg: '#93C5FD', shadow: '#3b82f6' },
];

const TOTAL = 9;

function generateBlobs(): Blob[] {
  // Spread across screen avoiding header (top 15%) and footer (bottom 10%)
  const positions = [
    { x: 18, y: 22 }, { x: 55, y: 15 }, { x: 82, y: 25 },
    { x: 10, y: 48 }, { x: 48, y: 43 }, { x: 80, y: 52 },
    { x: 25, y: 72 }, { x: 62, y: 70 }, { x: 42, y: 85 },
  ];
  return positions.map((p, i) => ({
    id: i,
    x: p.x,
    y: p.y,
    size: 68 + (i % 3) * 16, // 68, 84, 100 px
    color: BLOB_COLORS[i % BLOB_COLORS.length].bg,
    hue: i * 40,
    delay: i * 180,
    speed: 1.8 + (i % 4) * 0.4,
  }));
}

// Organic border-radius for each blob (different morphing shapes)
const BORDER_RADII = [
  ['42% 58% 62% 38% / 43% 47% 53% 57%', '62% 38% 46% 54% / 60% 44% 56% 40%'],
  ['55% 45% 38% 62% / 52% 62% 38% 48%', '38% 62% 55% 45% / 44% 56% 52% 48%'],
  ['70% 30% 50% 50% / 30% 70% 50% 50%', '30% 70% 60% 40% / 70% 30% 40% 60%'],
  ['48% 52% 68% 32% / 55% 45% 60% 40%', '60% 40% 45% 55% / 38% 62% 48% 52%'],
  ['35% 65% 55% 45% / 60% 40% 65% 35%', '65% 35% 42% 58% / 48% 52% 38% 62%'],
  ['58% 42% 35% 65% / 42% 58% 68% 32%', '45% 55% 65% 35% / 62% 38% 42% 58%'],
];

const BlobOverlay: React.FC<BlobOverlayProps> = ({ secondsLeft, onCleaned }) => {
  const { language } = useLanguage();
  const blobs = useMemo(generateBlobs, []);
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [bursting, setBursting] = useState<Set<number>>(new Set());
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleId = useRef(0);

  const tap = (id: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (popped.has(id) || bursting.has(id)) return;
    if (navigator.vibrate) navigator.vibrate([20, 10, 40]);

    // Spawn particles at tap location
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const blob = blobs[id];
    const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: particleId.current++,
      x: cx,
      y: cy,
      angle: (i * 45),
      color: blob.color,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);

    // Burst animation then remove
    setBursting(prev => new Set(prev).add(id));
    setTimeout(() => {
      setPopped(prev => {
        const next = new Set(prev).add(id);
        if (next.size >= TOTAL) setTimeout(onCleaned, 400);
        return next;
      });
      setBursting(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 280);
  };

  const remaining = TOTAL - popped.size;

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @keyframes blobMorph {
          0%, 100% { border-radius: var(--br-a); }
          50%       { border-radius: var(--br-b); }
        }
        @keyframes blobFloat {
          0%, 100% { transform: translateY(0px) rotate(var(--rot)); }
          50%       { transform: translateY(-10px) rotate(var(--rot)); }
        }
        @keyframes particleFly {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }
        @keyframes blobPop {
          0%   { transform: translateY(var(--ty)) scale(1); opacity: 1; }
          40%  { transform: translateY(var(--ty)) scale(1.6); opacity: 0.8; }
          100% { transform: translateY(var(--ty)) scale(0.2); opacity: 0; }
        }
      `}</style>

      <div className="fixed inset-0 z-[150] bg-[#0A1629]/88 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="pt-12 pb-2 text-center px-4 pointer-events-none shrink-0">
          <h2 className="text-3xl font-impact uppercase italic text-white tracking-tighter leading-none">
            {language === 'fr' ? 'NETTOIE LES BLOBS !' : 'POP ALL THE BLOBS!'}
          </h2>
          <p className="text-white/50 font-impact uppercase text-[10px] tracking-widest mt-1">
            {remaining > 0
              ? (language === 'fr'
                  ? `${remaining} blob${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''} — ${secondsLeft}s`
                  : `${remaining} blob${remaining > 1 ? 's' : ''} left — ${secondsLeft}s`)
              : (language === 'fr' ? 'PROPRE ! 🎉' : 'CLEAN! 🎉')}
          </p>
        </div>

        {/* Play area */}
        <div className="flex-1 relative select-none">
          {blobs.map(blob => {
            if (popped.has(blob.id)) return null;
            const isBursting = bursting.has(blob.id);
            const radii = BORDER_RADII[blob.id % BORDER_RADII.length];
            const rot = (blob.id * 23) % 30 - 15;
            const tyPx = (blob.id % 2 === 0) ? '-8px' : '-4px';

            return (
              <button
                key={blob.id}
                onPointerDown={(e) => tap(blob.id, e)}
                className="absolute border-[3px] border-black/60 flex items-center justify-center"
                style={{
                  left: `${blob.x}%`,
                  top: `${blob.y}%`,
                  width: blob.size,
                  height: blob.size,
                  marginLeft: -blob.size / 2,
                  marginTop: -blob.size / 2,
                  backgroundColor: blob.color,
                  boxShadow: `4px 6px 0px rgba(0,0,0,0.5), inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.25)`,
                  // CSS custom props for keyframes
                  ['--br-a' as any]: radii[0],
                  ['--br-b' as any]: radii[1],
                  ['--rot' as any]: `${rot}deg`,
                  ['--ty' as any]: tyPx,
                  animation: isBursting
                    ? `blobPop 0.28s ease-out forwards`
                    : `blobMorph ${blob.speed}s ease-in-out ${blob.delay}ms infinite, blobFloat ${blob.speed * 1.6}s ease-in-out ${blob.delay * 0.5}ms infinite`,
                  touchAction: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Glossy highlight */}
                <div className="absolute top-[15%] left-[20%] w-[35%] h-[25%] rounded-full bg-white/30 pointer-events-none" />
                {/* Count label */}
                <span className="font-impact text-black/60 text-sm font-black pointer-events-none select-none">
                  {blob.id + 1}
                </span>
              </button>
            );
          })}

          {/* Particles */}
          {particles.map(p => {
            const rad = (p.angle * Math.PI) / 180;
            const dist = 55 + (p.id % 3) * 20;
            const dx = Math.cos(rad) * dist;
            const dy = Math.sin(rad) * dist;
            return (
              <div
                key={p.id}
                className="fixed pointer-events-none rounded-full"
                style={{
                  left: p.x - 6,
                  top: p.y - 6,
                  width: 12,
                  height: 12,
                  backgroundColor: p.color,
                  border: '2px solid black',
                  ['--dx' as any]: `${dx}px`,
                  ['--dy' as any]: `${dy}px`,
                  animation: 'particleFly 0.55s ease-out forwards',
                }}
              />
            );
          })}

          {/* All cleared */}
          {remaining === 0 && (
            <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-75 duration-300 pointer-events-none">
              <div className="bg-[#00F5A0] border-[4px] border-black rounded-3xl px-8 py-6 shadow-[8px_8px_0px_black] text-center">
                <p className="text-5xl mb-2">🎉</p>
                <p className="font-impact text-black uppercase text-2xl tracking-tight italic">
                  {language === 'fr' ? 'PROPRE !' : 'CLEAN!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlobOverlay;
