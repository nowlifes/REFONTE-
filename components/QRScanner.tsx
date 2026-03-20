
import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { useLanguage } from '../contexts/LanguageContext';

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
            
            if (mode === 'MASTER' && code.data.includes('MASTER_VALID_CODE')) isValid = true;
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

  // Fallback simulation button in case camera fails or env is restricted
  const handleSimulateScan = () => {
    setScanning(false);
    setTimeout(() => {
      onScanSuccess();
    }, 800);
  };

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
    <div className="fixed inset-0 z-50 bg-navy-950 flex flex-col items-center justify-center">
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-20 h-20 border-t-8 border-l-8 border-gold-600 m-0"></div>
      <div className="absolute top-0 right-0 w-20 h-20 border-t-8 border-r-8 border-gold-600 m-0"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 border-b-8 border-l-8 border-gold-600 m-0"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-8 border-r-8 border-gold-600 m-0"></div>

      <button onClick={onClose} className="absolute top-8 right-8 z-20 bg-navy-900/80 p-3 rounded-full border border-gold-500 text-gold-500 active:scale-95">
        <X className="w-8 h-8" strokeWidth={3} />
      </button>

      <div className="relative w-full h-full max-w-lg flex flex-col items-center justify-center p-4">
        {error ? (
           <div className="text-red-400 flex flex-col items-center font-playbook">
             <AlertCircle className="w-12 h-12 mb-2" />
             <p>{error}</p>
             <button onClick={handleSimulateScan} className="mt-4 px-6 py-2 bg-navy-800 border border-gold-500/50 rounded-lg text-gold-400 font-bold uppercase text-xs">
                {t('simulate_scan')} (Dev Mode)
             </button>
           </div>
        ) : (
          <div className="relative w-72 h-72">
             <video ref={videoRef} playsInline muted className="w-full h-full object-cover border-4 border-gold-600 rounded-xl" />
             <canvas ref={canvasRef} className="hidden" />
             
             {/* Scan Overlay */}
             <div className="absolute inset-0 border-2 border-gold-400 opacity-50 m-4 pointer-events-none"></div>
             {scanning && (
               <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-[scan_2s_linear_infinite] shadow-[0_0_10px_rgba(239,68,68,1)] pointer-events-none"></div>
             )}
          </div>
        )}

        <div className="mt-12 text-center px-4 w-full">
          <h3 className="text-3xl font-playbook font-bold text-gold-500 mb-2 uppercase tracking-widest leading-none">
            {getTitle()}
          </h3>
          <p className="text-lg text-slate-300 font-sans mt-4 font-bold uppercase leading-tight">
            {getDesc()}
          </p>
        </div>

        {/* Optional Manual Override if scanning is hard in testing */}
        <button 
          onClick={handleSimulateScan}
          className="mt-8 text-navy-800 hover:text-gold-600/50 text-[10px] uppercase font-bold tracking-widest transition-colors"
        >
          Dev: {t('simulate_scan')}
        </button>
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
