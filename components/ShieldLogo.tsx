
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ShieldLogoProps {
  className?: string;
  variant?: 'default' | 'print';
  onCrownClick?: () => void;
}

const ShieldLogo: React.FC<ShieldLogoProps> = ({ className = "w-full h-full", variant = 'default', onCrownClick }) => {
  const { t } = useLanguage();
  const isPrint = variant === 'print';
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPressing, setIsPressing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const startPress = () => {
    if (isPrint || !onCrownClick) return;
    setIsPressing(true);
    setProgress(0);
    
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 1;
      setProgress(p);
      if (navigator.vibrate) navigator.vibrate(20);
      
      if (p >= 3) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        onCrownClick();
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
  
  // Colors based on variant
  const c = {
    gold: isPrint ? '#000000' : '#FDE047',
    goldDark: isPrint ? '#000000' : '#CA8A04',
    navyText: isPrint ? '#000000' : '#112240', // Updated to match new Navy
    navyFill: isPrint ? '#FFFFFF' : '#1B2E4B', 
    bg: isPrint ? 'none' : 'none'
  };

  return (
    <svg 
      viewBox="0 0 500 680" 
      className={`${className} ${!isPrint ? 'drop-shadow-gold' : ''}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Definitions for Filters and Paths */}
      <defs>
        {!isPrint && (
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
        {/* Recalibrated Ribbon Curve Path for Text - Smoother curve */}
        <path id="ribbonCurve" d="M 40,560 Q 250,610 460,560" />
      </defs>
      
      {/* --- CROWN (Top Center) --- */}
      <g 
        transform="translate(135, 10) scale(1.1)" 
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        className={!isPrint ? `cursor-pointer transition-all duration-300 ${isPressing ? 'scale-125 opacity-80' : 'hover:scale-105'}` : ""}
      >
         <path 
           d="M105,10 L125,40 L155,30 L175,60 L225,20 L195,100 L15,100 L-15,20 L35,60 L55,30 L85,40 Z" 
           fill={isPrint ? 'none' : c.gold} 
           stroke={c.goldDark} 
           strokeWidth="2" 
           strokeLinejoin="round" 
         />
         {/* Crown Jewels */}
         <circle cx="105" cy="90" r="5" fill={c.goldDark} />
         <circle cx="55" cy="50" r="4" fill={c.goldDark} />
         <circle cx="155" cy="50" r="4" fill={c.goldDark} />
         {/* Base accent */}
         <path d="M15,100 L195,100" stroke={c.goldDark} strokeWidth="4" />

         {/* Progress Dots */}
         {isPressing && (
           <g transform="translate(105, 125)">
              {[1, 2, 3].map((dot, idx) => (
                <circle 
                  key={dot} 
                  cx={(idx - 1) * 30} 
                  cy="0" 
                  r="8" 
                  fill={progress >= dot ? c.gold : 'rgba(255,255,255,0.2)'} 
                  stroke={c.goldDark}
                  strokeWidth="2"
                />
              ))}
           </g>
         )}
      </g>

      {/* --- SHIELD BODY --- */}
      <g transform="translate(0, 30)">
          {/* Main Shape */}
          <path 
            d="M50,120 H450 V250 C450,480 250,580 250,580 C250,580 50,480 50,250 Z" 
            fill="none" 
            stroke={c.gold} 
            strokeWidth="8" 
          />
          {/* Inner Border */}
          <path 
            d="M65,135 H435 V250 C435,465 250,560 250,560 C250,560 65,465 65,250 Z" 
            fill="none" 
            stroke={c.gold} 
            strokeWidth="2" 
          />
      </g>

      {/* --- TYPOGRAPHY (Recalibrated) --- */}
      <g transform="translate(0, 30)">
          {/* THE - Smaller, spaced out */}
          <text x="250" y="195" textAnchor="middle" fill={c.gold} fontSize="24" fontFamily="serif" fontWeight="bold" letterSpacing="6">{t('logo_top')}</text>
          
          {/* BINGO - Reduced size slightly for breathing room */}
          <text x="250" y="275" textAnchor="middle" fill={c.gold} fontSize="85" fontFamily="serif" fontWeight="900" letterSpacing="2" style={{ textShadow: isPrint ? 'none' : `4px 4px 0px ${c.goldDark}` }}>{t('logo_middle')}</text>
          
          {/* CRAWL - Matches BINGO */}
          <text x="250" y="355" textAnchor="middle" fill={c.gold} fontSize="85" fontFamily="serif" fontWeight="900" letterSpacing="2" style={{ textShadow: isPrint ? 'none' : `4px 4px 0px ${c.goldDark}` }}>{t('logo_bottom')}</text>
      </g>

      {/* --- ICONS ROW --- */}
      <g transform="translate(85, 410)">
         {/* Left Beer Mug */}
         <g transform="rotate(-10, 40, 40)">
            <path d="M10,10 L15,55 C15,65 25,70 35,70 H50 C60,70 70,65 70,55 L75,10 Z" fill="none" stroke={c.gold} strokeWidth="3" />
            <path d="M75,20 H85 C90,20 95,25 95,35 V45 C95,55 90,60 85,60 H72" fill="none" stroke={c.gold} strokeWidth="3" strokeLinecap="round"/>
            <line x1="30" y1="10" x2="30" y2="65" stroke={c.gold} strokeWidth="2" />
            <line x1="55" y1="10" x2="55" y2="65" stroke={c.gold} strokeWidth="2" />
            <path d="M5,10 Q20,-10 42,10 Q65,-10 80,10" fill={isPrint ? 'none' : c.gold} stroke={isPrint ? c.gold : 'none'} />
         </g>
         {/* Center Grid */}
         <g transform="translate(105, -10)">
            <rect x="0" y="0" width="110" height="80" rx="2" fill="none" stroke={c.gold} strokeWidth="3" />
            <line x1="36" y1="0" x2="36" y2="80" stroke={c.gold} strokeWidth="2" />
            <line x1="73" y1="0" x2="73" y2="80" stroke={c.gold} strokeWidth="2" />
            <line x1="0" y1="26" x2="110" y2="26" stroke={c.gold} strokeWidth="2" />
            <line x1="0" y1="53" x2="110" y2="53" stroke={c.gold} strokeWidth="2" />
            <path d="M45,32 L65,48 M65,32 L45,48" stroke={c.gold} strokeWidth="3" strokeLinecap="round" />
         </g>
         {/* Right Beer Mug */}
         <g transform="translate(230, 0) rotate(10, 40, 40)">
            <path d="M75,10 L70,55 C70,65 60,70 50,70 H35 C25,70 15,65 15,55 L10,10 Z" fill="none" stroke={c.gold} strokeWidth="3" />
            <path d="M10,20 H0 C-5,20 -10,25 -10,35 V45 C-10,55 -5,60 0,60 H13" fill="none" stroke={c.gold} strokeWidth="3" strokeLinecap="round"/>
            <line x1="30" y1="10" x2="30" y2="65" stroke={c.gold} strokeWidth="2" />
            <line x1="55" y1="10" x2="55" y2="65" stroke={c.gold} strokeWidth="2" />
            <path d="M5,10 Q20,-10 42,10 Q65,-10 80,10" fill={isPrint ? 'none' : c.gold} stroke={isPrint ? c.gold : 'none'} />
         </g>
      </g>

      {/* --- TRAMWAY --- */}
      <g transform="translate(205, 490)">
          <path d="M0,0 H90 V45 C90,55 80,60 45,60 C10,60 0,55 0,45 Z" fill={isPrint ? 'none' : c.gold} stroke={c.goldDark} strokeWidth="2" />
          <rect x="10" y="10" width="20" height="25" rx="2" fill={c.navyFill} stroke={isPrint ? c.gold : 'none'} />
          <rect x="35" y="10" width="20" height="25" rx="2" fill={c.navyFill} stroke={isPrint ? c.gold : 'none'} />
          <rect x="60" y="10" width="20" height="25" rx="2" fill={c.navyFill} stroke={isPrint ? c.gold : 'none'} />
          <circle cx="45" cy="50" r="6" fill={c.navyFill} stroke={c.goldDark} strokeWidth="2" />
          <line x1="5" y1="5" x2="85" y2="5" stroke={c.navyFill} strokeWidth="2" />
      </g>

      {/* --- RIBBON (Bottom) --- */}
      <g transform="translate(0, 30)">
          {/* Back Folds */}
          <path d="M40,540 L10,580 L80,550 Z" fill={c.goldDark} />
          <path d="M460,540 L490,580 L420,550 Z" fill={c.goldDark} />

          {/* Main Ribbon Banner */}
          <path 
            d="M40,540 Q250,600 460,540 L460,590 Q250,650 40,590 Z" 
            fill={isPrint ? 'none' : c.gold} 
            stroke={c.goldDark} 
            strokeWidth="2"
          />
          
          {/* Ribbon Text - Perfectly Calibrated */}
          <text 
            fontSize="17" 
            fontWeight="bold" 
            fontFamily="serif" 
            fill={c.navyText} 
            letterSpacing="3"
            dy="5"
          >
             <textPath href="#ribbonCurve" startOffset="50%" textAnchor="middle">
                {t('logo_ribbon')}
             </textPath>
          </text>
      </g>

      {/* --- BOTTOM GEM --- */}
      <g transform="translate(250, 650)">
          <path d="M-25,0 L0,20 L25,0 L0,-10 Z" fill="none" stroke={c.gold} strokeWidth="3" />
          <path d="M-15,5 L15,5" fill="none" stroke={c.gold} strokeWidth="1" />
      </g>

    </svg>
  );
};

export default ShieldLogo;
