
import React, { useState, useRef } from 'react';
import { RefreshCw, Lock } from 'lucide-react';
import ShieldLogo from './ShieldLogo';

interface LockedPageProps {
  onMasterAccess: () => void;
  onVipBypass: () => void;
  onRefresh: () => Promise<void>;
  onCrownClick?: () => void;
  onReset?: () => void;
}

const LockedPage: React.FC<LockedPageProps> = ({ onMasterAccess, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hidden master access — long press 3s on the lock icon
  const [pressing, setPressing] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPress = () => {
    setPressing(true);
    setPressCount(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 1;
      setPressCount(p);
      if (navigator.vibrate) navigator.vibrate(20);
      if (p >= 3) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        onMasterAccess();
        setPressing(false);
        setPressCount(0);
      }
    }, 1000);
  };

  const endPress = () => {
    setPressing(false);
    setPressCount(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A1629] flex flex-col items-center justify-between p-8 select-none touch-none">

      {/* Top — hidden master access */}
      <div className="w-full flex justify-start">
        <button
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          className="p-3 text-white/10 active:text-white/30 transition-colors"
        >
          <Lock className="w-4 h-4" />
        </button>
        {pressing && (
          <div className="flex items-center gap-1 self-center ml-2">
            {[1, 2, 3].map(dot => (
              <div
                key={dot}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${pressCount >= dot ? 'bg-[#FFD700]' : 'bg-white/10'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Centre — main message */}
      <div className="flex flex-col items-center gap-8 text-center">

        {/* Logo */}
        <div className="w-24 h-24 bg-[#FFD700] border-[4px] border-black rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_black]">
          <ShieldLogo className="w-12 h-12 text-black" />
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]" />
          </span>
          <span className="text-[10px] font-impact uppercase tracking-widest text-white/60">
            Waiting for session to start
          </span>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-5xl font-impact uppercase tracking-tighter text-white italic leading-none">
            Bingo<br />
            <span className="text-[#FFD700]">Crawl</span>
          </h1>
          <p className="text-white/40 text-sm font-impact uppercase tracking-widest">
            The night hasn't started yet
          </p>
        </div>

        {/* Info card */}
        <div className="w-full max-w-xs bg-white border-[4px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_black] text-left">
          <p className="text-[9px] font-impact uppercase tracking-widest text-black/40 mb-2">What to do?</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#FFD700] border-2 border-black rounded-lg flex items-center justify-center shrink-0 font-impact text-xs font-bold">1</span>
              <span className="text-sm font-impact uppercase text-black leading-tight tracking-tight">Wait for the Game Master to open the session</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#00FF9D] border-2 border-black rounded-lg flex items-center justify-center shrink-0 font-impact text-xs font-bold">2</span>
              <span className="text-sm font-impact uppercase text-black leading-tight tracking-tight">This page will unlock automatically</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-black border-2 border-black rounded-lg flex items-center justify-center shrink-0 font-impact text-xs font-bold text-white">3</span>
              <span className="text-sm font-impact uppercase text-black leading-tight tracking-tight">Set up your profile and dive in!</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom — discreet refresh */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 text-white/20 hover:text-white/40 transition-colors py-3 disabled:opacity-30"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="text-[9px] font-impact uppercase tracking-widest">Refresh</span>
      </button>

    </div>
  );
};

export default LockedPage;
