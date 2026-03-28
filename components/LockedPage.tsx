
import React, { useState, useRef, useEffect } from 'react';
import { Lock, RefreshCw, KeyRound, Sparkles, Shield, Hourglass, QrCode, LogOut } from 'lucide-react';
import BackgroundParticles from './BackgroundParticles';
import { useLanguage } from '../contexts/LanguageContext';
import QRScanner from './QRScanner';
import ShieldLogo from './ShieldLogo';

interface LockedPageProps {
  onMasterAccess: () => void;
  onVipBypass: () => void;
  onRefresh: () => Promise<void>;
  onCrownClick?: () => void;
  onReset?: () => void;
}

const LockedPage: React.FC<LockedPageProps> = ({ onMasterAccess, onVipBypass, onRefresh, onCrownClick, onReset }) => {
  const { t } = useLanguage();
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [isResetPressing, setIsResetPressing] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);
  const resetIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Petite animation de texte qui change
  const [loadingText, setLoadingText] = useState(0);
  const texts = [
    t('polishing_crowns'), 
    t('brewing_potions'), 
    t('summoning_players'), 
    t('securing_gates')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
        setLoadingText(prev => (prev + 1) % texts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [texts.length]);

  // --- SECRET MASTER ACCESS LOGIC (Long Press 3s) ---
  const startPress = () => {
    setIsPressing(true);
    setProgress(0);
    
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 1;
      setProgress(p);
      if (navigator.vibrate) navigator.vibrate(20);
      
      if (p >= 3) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        onMasterAccess(); 
        setIsPressing(false);
        setProgress(0);
      }
    }, 1000); 
  };

  const endPress = () => {
    setIsPressing(false);
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startResetPress = () => {
    setIsResetPressing(true);
    setResetProgress(0);
    let p = 0;
    resetIntervalRef.current = setInterval(() => {
      p += 1;
      setResetProgress(p);
      if (navigator.vibrate) navigator.vibrate(20);
      if (p >= 5) { // 5 seconds for reset
        if (resetIntervalRef.current) clearInterval(resetIntervalRef.current);
        resetIntervalRef.current = null;
        if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
        if (window.confirm("Reset profile and start over?")) {
           onReset?.();
        }
        setIsResetPressing(false);
        setResetProgress(0);
      }
    }, 1000);
  };

  const endResetPress = () => {
    setIsResetPressing(false);
    setResetProgress(0);
    if (resetIntervalRef.current) {
      clearInterval(resetIntervalRef.current);
      resetIntervalRef.current = null;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-navy-950 flex flex-col items-center justify-center p-6 relative overflow-y-auto text-center select-none touch-none no-scrollbar">
      <BackgroundParticles />
      
      {/* Background Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-gold-600/10 to-transparent blur-[100px] pointer-events-none"></div>
      
      {/* Dark Overlay for vignetting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] pointer-events-none z-0"></div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        <div className="relative w-full mb-12 flex flex-col items-center justify-center">
           {/* Layered Glowing Orbs - Simplified */}
           <div className="absolute inset-0 bg-gold-500/5 blur-[100px] animate-pulse-slow"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[80px] animate-pulse"></div>
           
           <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-center gap-6 mb-8">
                 <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
                 <div className="relative">
                    <Sparkles className="w-8 h-8 text-gold-400 animate-spin-slow" />
                    <div className="absolute -inset-3 bg-gold-400/10 blur-lg rounded-full animate-pulse"></div>
                 </div>
                 <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
              </div>
              
              <div className="space-y-4 text-center px-4">
                <div className="flex flex-col items-center gap-1">
                   <p className="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.6em] opacity-70">System Status: Priming</p>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase leading-[1.1] tracking-tight italic text-center drop-shadow-2xl py-2">
                  THE <br/>
                  <span className="relative inline-block py-2 px-2">
                     <span className="text-transparent bg-clip-text bg-gradient-to-br from-gold-200 via-emerald-400 to-purple-500 animate-hologram">LEGEND</span>
                  </span> <br/>
                  <span className="text-xl md:text-3xl tracking-[0.2em] text-white/90 not-italic font-black mt-2 inline-block bg-white/5 backdrop-blur-sm px-6 py-2 border-x border-white/10 skew-x-[-12deg]">AWAKENS</span>
                </h2>
              </div>

              <div className="mt-16 flex flex-col items-center gap-6">
                 <div className="flex items-center gap-4 px-8 py-4 rounded-full bg-navy-900/90 border border-gold-500/40 backdrop-blur-2xl shadow-[0_0_40px_rgba(234,179,8,0.2)] group hover:border-emerald-500/60 transition-all duration-500 cursor-default scale-110">
                    <div className="relative">
                       <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]"></div>
                       <div className="w-3 h-3 bg-emerald-500 rounded-full absolute inset-0 animate-ping opacity-75"></div>
                    </div>
                    <span className="text-base font-black text-white uppercase tracking-[0.35em] group-hover:text-emerald-400 transition-colors duration-300">Something Big is Brewing</span>
                 </div>
                 
                 <div className="flex flex-col items-center gap-2">
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.4em] max-w-[250px] leading-relaxed opacity-80">
                       Prepare your squad.
                    </p>
                    <p className="text-gold-500/60 text-[9px] font-mono uppercase tracking-widest animate-pulse">
                       Coordinates Locked // Frequency Synced
                    </p>
                 </div>
              </div>
           </div>
        </div>

        <div className="text-center space-y-2 mb-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 border border-red-500/30 mb-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em]">{t('access_restricted')}</span>
           </div>
           
           <h1 className="text-4xl font-black text-white uppercase tracking-widest leading-none drop-shadow-xl">
             <span 
               className={`text-transparent bg-clip-text bg-gradient-to-b from-gold-300 to-gold-600 transition-all duration-300 ${isResetPressing ? 'scale-110 opacity-50 blur-[2px]' : ''}`}
               onMouseDown={startResetPress}
               onMouseUp={endResetPress}
               onMouseLeave={endResetPress}
               onTouchStart={startResetPress}
               onTouchEnd={endResetPress}
             >
               {t('closed')}
             </span>
           </h1>
           {isResetPressing && (
             <div className="flex justify-center gap-1 mt-2">
               {[1, 2, 3, 4, 5].map((dot) => (
                 <div 
                   key={dot} 
                   className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${resetProgress >= dot ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-red-900/30'}`}
                 />
               ))}
             </div>
           )}
           
           <p className="text-slate-400 text-sm font-sans tracking-wide max-w-xs mx-auto pt-2">
             {t('closed_desc')} <br/>
             <span className="text-gold-500/80 italic">{t('glory_awaits')}</span>
           </p>
        </div>

        <div className="w-full space-y-4">
            <button 
              onClick={() => setShowScanner(true)}
              className="w-full bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold py-4 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
            >
               <QrCode className="w-5 h-5" />
               {t('scan_to_unlock')}
            </button>

            <button 
              onClick={() => {
                onRefresh();
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className="w-full bg-navy-900/50 hover:bg-navy-800/50 text-gold-500/60 font-bold py-3 rounded-xl uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 border border-gold-500/10 transition-all active:scale-95"
            >
               <RefreshCw className="w-3 h-3 animate-spin-slow" />
               {t('refresh_status')}
            </button>

            <div className="flex flex-col items-center gap-4 pt-4">
               <div className="flex justify-center gap-6 text-gold-500/20">
                  <Shield className="w-5 h-5" />
                  <Sparkles className="w-5 h-5" />
                  <div 
                    onMouseDown={startPress}
                    onMouseUp={endPress}
                    onMouseLeave={endPress}
                    onTouchStart={startPress}
                    onTouchEnd={endPress}
                    className={`transition-all duration-300 cursor-pointer ${isPressing ? 'text-gold-500 scale-125' : 'hover:text-gold-500/40'}`}
                  >
                     <Lock className="w-5 h-5" />
                  </div>
               </div>
               
               {isPressing && (
                 <div className="flex gap-1.5 animate-in fade-in zoom-in duration-200">
                    {[1, 2, 3].map((dot) => (
                      <div 
                        key={dot} 
                        className={`w-1.5 h-1.5 rounded-full border border-gold-500/50 transition-all duration-300 ${progress >= dot ? 'bg-gold-500 shadow-[0_0_8px_#EAB308]' : 'bg-transparent'}`}
                      />
                    ))}
                 </div>
               )}
            </div>
        </div>

      </div>

      {showScanner && (
          <QRScanner 
            mode="ENTRY" 
            onScanSuccess={(data) => {
                // For now any valid scan in ENTRY mode bypasses
                onVipBypass();
                setShowScanner(false);
            }} 
            onClose={() => setShowScanner(false)} 
          />
      )}

      <style>{`
        @keyframes progress {
          to { stroke-dashoffset: 0; }
        }
        @keyframes shine {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LockedPage;
