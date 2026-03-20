
import React, { useState, useRef, useEffect } from 'react';
import { Lock, RefreshCw, KeyRound, Sparkles, Shield, Hourglass, QrCode } from 'lucide-react';
import BackgroundParticles from './BackgroundParticles';
import { useLanguage } from '../contexts/LanguageContext';
import QRScanner from './QRScanner';

interface LockedPageProps {
  onMasterAccess: () => void;
  onVipBypass: () => void;
  onRefresh: () => Promise<void>;
}

const LockedPage: React.FC<LockedPageProps> = ({ onMasterAccess, onVipBypass, onRefresh }) => {
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (navigator.vibrate) navigator.vibrate(50);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // --- SECRET MASTER ACCESS LOGIC (Long Press 3s) ---
  const startPress = (e: React.SyntheticEvent) => {
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      onMasterAccess(); 
      setIsPressing(false);
    }, 3000); 
  };

  const endPress = () => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center select-none touch-none">
      <BackgroundParticles />
      
      {/* Background Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-gold-600/10 to-transparent blur-[100px] pointer-events-none"></div>
      
      {/* Dark Overlay for vignetting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] pointer-events-none z-0"></div>

      {/* --- SECRET ZONE (Bottom Right) --- */}
      <div 
        className="absolute bottom-0 right-0 w-32 h-32 z-50 flex items-end justify-end p-6 cursor-pointer"
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
         {isPressing && (
            <div className="relative w-16 h-16 flex items-center justify-center animate-in fade-in zoom-in duration-200">
               <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="#EAB308" strokeWidth="4" 
                    strokeLinecap="round" strokeDasharray="283" strokeDashoffset="283"
                    className="animate-[progress_3s_linear_forwards]"
                  />
               </svg>
               <div className="relative z-10 bg-navy-900 rounded-full p-2 border border-gold-500/30 shadow-lg">
                  <KeyRound className="w-5 h-5 text-gold-400" />
               </div>
            </div>
         )}
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
           <div className="absolute inset-0 bg-gold-500/20 blur-[60px] animate-pulse-slow"></div>
           <div className="absolute inset-0 border border-gold-500/20 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>
           <div className="absolute inset-4 border-2 border-gold-500/10 rounded-full border-t-gold-500/50 animate-[spin_15s_linear_infinite_reverse]"></div>
           
           <div className="relative w-32 h-32 bg-navy-900 rounded-full border-4 border-gold-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center justify-center z-10">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 rounded-full"></div>
               <Lock className="w-14 h-14 text-gold-400 drop-shadow-md" strokeWidth={1.5} />
               
               <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
                  <div className="w-3 h-3 bg-white rounded-full absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 shadow-[0_0_10px_white]"></div>
               </div>
           </div>

           <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent -z-10"></div>
        </div>

        <div className="text-center space-y-2 mb-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 border border-red-500/30 mb-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em]">{t('access_restricted')}</span>
           </div>
           
           <h1 className="text-5xl font-playbook font-bold text-white uppercase tracking-widest leading-none drop-shadow-xl">
             Playbook <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-b from-gold-300 to-gold-600">{t('closed')}</span>
           </h1>
           
           <p className="text-slate-400 text-sm font-sans tracking-wide max-w-xs mx-auto pt-2">
             {t('closed_desc')} <br/>
             <span className="text-gold-500/80 italic">{t('glory_awaits')}</span>
           </p>
        </div>

        <div className="w-full space-y-4">
            
            <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest h-6">
               <Hourglass className="w-3 h-3 animate-spin" />
               <span className="animate-pulse">{texts[loadingText]}</span>
            </div>

            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="group relative w-full bg-navy-800/50 hover:bg-navy-800 border border-gold-500/30 hover:border-gold-500/60 rounded-xl p-4 transition-all active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shine_1s_ease-in-out]"></div>
              
              <div className="flex items-center justify-center gap-3">
                 <RefreshCw className={`w-5 h-5 text-gold-400 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                 <span className="font-bold text-white uppercase tracking-widest text-xs">
                    {isRefreshing ? t('checking_signal') : t('refresh_status')}
                 </span>
              </div>
            </button>

            <button 
              onClick={() => setShowScanner(true)}
              className="w-full bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold py-4 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
            >
               <QrCode className="w-5 h-5" />
               {t('scan_to_unlock')}
            </button>

            <div className="flex justify-center gap-4 text-gold-500/20">
               <Shield className="w-6 h-6" />
               <Sparkles className="w-6 h-6" />
               <Lock className="w-6 h-6" />
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
