
import React, { useMemo } from 'react';
import { ADULT_EMOJI_MAP } from '../constants';

interface AvatarProps {
  seed: string;
  size?: number;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}

// "Adult" & Premium dark palette (Luxury bar / VIP Club vibe)
const LUXURY_GRADIENTS = [
  'bg-gradient-to-br from-slate-800 to-black',        // Onyx
  'bg-gradient-to-br from-indigo-900 to-slate-950',   // Midnight
  'bg-gradient-to-br from-red-900 to-slate-950',      // Burgundy
  'bg-gradient-to-br from-emerald-900 to-slate-950',  // Deep Forest
  'bg-gradient-to-br from-violet-900 to-slate-950',   // Royal
  'bg-gradient-to-br from-amber-900 to-slate-950',    // Bronze
  'bg-gradient-to-br from-cyan-900 to-slate-950',     // Ocean
];

const Avatar: React.FC<AvatarProps> = ({ seed, size = 40, className = "", selected = false, onClick }) => {
  
  // Deterministic Emoji from the curated adult list
  const emoji = useMemo(() => {
    // seed can be a key ('Knight') or an emoji char directly ('⚔️') — handle both
    return ADULT_EMOJI_MAP[seed] || seed || '🎲';
  }, [seed]);

  // Deterministic Dark Gradient
  const bgGradient = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % LUXURY_GRADIENTS.length;
    return LUXURY_GRADIENTS[index];
  }, [seed]);

  return (
    <div 
      onClick={onClick}
      className={`
        relative rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 select-none
        ${bgGradient}
        ${selected 
          ? 'shadow-[0_0_20px_rgba(234,179,8,0.5)] ring-2 ring-[#FFD700] scale-105 z-10' 
          : 'shadow-md ring-1 ring-white/10 hover:ring-[#FFD700]/30 hover:scale-105'
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{ width: size, height: size }}
    >
      {/* Inner Bevel/Border for "Token" effect */}
      <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none"></div>
      
      {/* The Emoji - Centered with slight adjustment for optical alignment */}
      <div className="flex items-center justify-center w-full h-full pb-[5%] pl-[1%]">
        <span 
          className="relative z-10 drop-shadow-lg filter saturate-[0.85] contrast-[1.1]"
          style={{ fontSize: size * 0.55, lineHeight: 1 }}
          role="img" 
          aria-label={seed}
        >
          {emoji}
        </span>
      </div>
      
      {/* Glass/Gloss Effect - Top Half */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-40 pointer-events-none h-1/2"></div>
      
      {/* Bottom Glow */}
      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-[#FFD700]/5 to-transparent opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default React.memo(Avatar);
