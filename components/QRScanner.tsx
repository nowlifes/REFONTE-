
import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';
import { useLanguage } from '../contexts/LanguageContext';
import { MASTER_VALID_CODE } from '../constants';

interface QRScannerProps {
  mode: 'ENTRY' | 'MASTER' | 'PLAYER';
  onScanSuccess: () => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ mode, onScanSuccess, onClose }) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const scanFrame = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            // Check content based on mode
            let isValid = false;

            if (mode === 'MASTER' && code.data.trim() === MASTER_VALID_CODE) isValid = true;
            if (mode === 'ENTRY' && code.data.includes('EVENT_START')) isValid = true;
            if (mode === 'PLAYER' && code.data.includes('BINGO_PLAYER')) isValid = true;
            
            if (isValid) {
               setScanning(false);
               if (navigator.vibrate) navigator.vibrate(50);
               onScanSuccess();
               return; // Stop loop
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready before starting scan loop
          videoRef.current.addEventListener('loadedmetadata', () => {
             videoRef.current?.play().then(() => {
                 scanFrame();
             });
          });
        }
      } catch (err) {
        setError(t('camera_error'));
      }
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      cancelAnimationFrame(animationFrameId);
    };
  }, [t, mode, onScanSuccess]);

  const getTitle = () => {
      switch(mode) {
          case 'ENTRY': return t('scan_entry');
          case 'MASTER': return t('find_master');
          case 'PLAYER': return t('scan_witness');
          default: return t('scan');
      }
  };

  const getDesc = () => {
      switch(mode) {
          case 'ENTRY': return t('find_poster');
          case 'MASTER': return t('locate_person');
          case 'PLAYER': return t('find_player_badge');
          default: return "";
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A1629] flex flex-col">
      {/* Header */}
      <div className="shrink-0 bg-[#FFD700] border-b-[4px] border-black px-4 py-4 flex items-center justify-between">
        <button onClick={onClose} className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
          <X size={20} strokeWidth={3} />
        </button>
        <h2 className="font-impact text-xl text-black uppercase tracking-tighter italic">
          {getTitle()}
        </h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {error ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-14 h-14 text-[#FF2E63]" />
            <p className="font-impact uppercase text-white/60 text-sm tracking-widest">{error}</p>
          </div>
        ) : (
          <>
            {/* Camera viewfinder */}
            <div className="relative w-72 h-72 rounded-2xl overflow-hidden border-[4px] border-[#FFD700] shadow-[0_0_0_4px_black]">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-[4px] border-l-[4px] border-white rounded-tl-lg pointer-events-none" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-[4px] border-r-[4px] border-white rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-[4px] border-l-[4px] border-white rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-[4px] border-r-[4px] border-white rounded-br-lg pointer-events-none" />

              {/* Scan line */}
              {scanning && (
                <div className="absolute left-4 right-4 h-0.5 bg-[#FFD700] shadow-[0_0_12px_#FFD700] animate-[scan_2s_linear_infinite] pointer-events-none" />
              )}
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ScanLine className="w-4 h-4 text-[#FFD700]" />
                <span className="font-impact uppercase text-[11px] tracking-widest text-white/60">{getDesc()}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
