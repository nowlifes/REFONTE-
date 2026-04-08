import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface BlobOverlayProps {
  secondsLeft: number;
  onCleaned: () => void;
}

const CLEAN_THRESHOLD = 0.75; // 75% nettoyé pour débloquer

const BlobOverlay: React.FC<BlobOverlayProps> = ({ secondsLeft, onCleaned }) => {
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cleaned, setCleaned] = useState(false);
  const [pct, setPct] = useState(0);
  const cleanedRef = useRef(false);
  const totalPixels = useRef(0);

  useEffect(() => {
    const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || Math.round(window.innerHeight * 0.55);
    totalPixels.current = canvas.width * canvas.height;

    // Draw blobs
    const blobs = [
      { x: canvas.width * 0.3, y: canvas.height * 0.35, r: canvas.width * 0.28 },
      { x: canvas.width * 0.65, y: canvas.height * 0.5, r: canvas.width * 0.22 },
      { x: canvas.width * 0.45, y: canvas.height * 0.6, r: canvas.width * 0.2 },
      { x: canvas.width * 0.2, y: canvas.height * 0.55, r: canvas.width * 0.16 },
      { x: canvas.width * 0.75, y: canvas.height * 0.3, r: canvas.width * 0.14 },
    ];

    blobs.forEach(({ x, y, r }) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(120, 220, 80, 0.95)');
      grad.addColorStop(0.6, 'rgba(80, 180, 40, 0.85)');
      grad.addColorStop(1, 'rgba(40, 140, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Add some emoji splats as text
    ctx.font = `${canvas.width * 0.12}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const splats = ['🤢', '💦', '🫧', '🟢'];
    splats.forEach((s, i) => {
      ctx.globalAlpha = 0.6;
      ctx.fillText(s, canvas.width * (0.25 + i * 0.18), canvas.height * (0.38 + (i % 2) * 0.18));
    });
    ctx.globalAlpha = 1;
    };
    // Wait one frame to ensure the canvas has its layout dimensions
    requestAnimationFrame(draw);
  }, []);

  const computePct = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 20) transparent++;
    }
    return transparent / (data.length / 4);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (cleanedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Sample pct every ~200ms via frame
    const p = computePct();
    setPct(Math.round(p * 100));

    if (p >= CLEAN_THRESHOLD && !cleanedRef.current) {
      cleanedRef.current = true;
      setCleaned(true);
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
      setTimeout(onCleaned, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#0A1629]/80 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-2 text-center px-4 pointer-events-none">
        <p className="text-4xl mb-1">🤢</p>
        <h2 className="text-3xl font-impact uppercase italic text-white tracking-tighter leading-none">
          {language === 'fr' ? 'NETTOIE ÇA !' : 'CLEAN IT UP!'}
        </h2>
        <p className="text-white/50 font-impact uppercase text-[10px] tracking-widest mt-1">
          {language === 'fr'
            ? 'Frotte l\'écran pour débloquer ta grille'
            : 'Wipe the screen to unlock your grid'}
        </p>
      </div>

      {/* Canvas zone */}
      <div className="flex-1 relative mx-4 my-2 rounded-[2rem] overflow-hidden border-[4px] border-black shadow-[8px_8px_0px_black]">
        <div className="absolute inset-0 bg-[#1A1A2E]" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onPointerMove={handlePointerMove}
          style={{ touchAction: 'none', cursor: 'crosshair' }}
        />
        {cleaned && (
          <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-75 duration-300">
            <div className="bg-[#00F5A0] border-[4px] border-black rounded-3xl px-8 py-6 shadow-[8px_8px_0px_black] text-center">
              <p className="text-5xl mb-2">✨</p>
              <p className="font-impact text-black uppercase text-2xl tracking-tight italic">
                {language === 'fr' ? 'PROPRE !' : 'CLEAN!'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="pb-10 px-4 pointer-events-none">
        <div className="w-full bg-black/30 border-[2px] border-black rounded-full h-3 overflow-hidden mb-1">
          <div
            className="h-full bg-[#00F5A0] rounded-full transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-center font-impact text-white/30 uppercase text-[10px] tracking-widest">
          {pct}% {language === 'fr' ? 'NETTOYÉ' : 'CLEANED'} · {secondsLeft}s
        </p>
      </div>
    </div>
  );
};

export default BlobOverlay;
