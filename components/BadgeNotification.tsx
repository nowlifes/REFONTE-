
import React, { useEffect, useState } from 'react';
import { Sparkles, X, Star } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';
import { Badge } from '../types';
import { BADGE_CONFIG, SOUNDS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface BadgeNotificationProps {
  badge: Badge | null;
  onClose: () => void;
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badge, onClose }) => {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (badge) {
      setShow(true);
      canvasConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      const audio = new Audio(SOUNDS.WIN);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [badge]);

  if (!badge) return null;

  const config = BADGE_CONFIG[badge.badge_type];
  const titleKey = `badge_title_${badge.badge_type}` as any;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 transition-all duration-500 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-sm bg-[#FFD700] border-[5px] border-black rounded-3xl p-8 shadow-[10px_10px_0px_black] transform transition-all duration-500 ${show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-20'}`}>
        
        <div className="relative flex justify-center mb-8">
            <div className={`w-32 h-32 rounded-2xl bg-white border-[4px] border-black flex items-center justify-center text-6xl shadow-[6px_6px_0px_black] rotate-3`}>
              {config.emoji}
            </div>
            <Star className="absolute -top-4 -left-4 text-black w-10 h-10 fill-black animate-pulse" />
            <Sparkles className="absolute -bottom-4 -right-4 text-black w-10 h-10 animate-bounce" />
        </div>

        <div className="text-center space-y-4">
            <span className="text-black font-impact font-black text-xs uppercase tracking-[0.2em]">{t('new_achievement')}</span>
            <h2 className="text-4xl font-impact font-[900] text-black uppercase tracking-tighter leading-none italic drop-shadow-sm">
              {t(titleKey)}
            </h2>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-10 bg-black text-white font-impact font-[900] text-xl uppercase tracking-widest py-5 rounded-2xl shadow-[5px_5px_0px_rgba(0,0,0,0.3)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
        >
          {t('sensational_btn')}
        </button>
      </div>
    </div>
  );
};

export default BadgeNotification;
