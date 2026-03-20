
import React, { useEffect, useState } from 'react';
import { TutorialStep } from '../types';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TutorialLayerProps {
  step: TutorialStep;
  onNext?: () => void;
}

interface StepConfig {
  targetId: string;
  textKey: string;
  position: 'top' | 'bottom' | 'center';
  anim?: string;
}

const CONFIG: Record<TutorialStep, StepConfig | null> = {
  [TutorialStep.NONE]: null,
  [TutorialStep.STYLES]: {
    targetId: 'tutorial-styles-container',
    textKey: 'tut_styles_text',
    position: 'top', 
    anim: 'animate-pulse'
  },
  [TutorialStep.REWARDS]: {
    targetId: 'tutorial-rewards-container',
    textKey: 'tut_rewards_text',
    position: 'top',
    anim: 'animate-in fade-in slide-in-from-bottom-4 duration-700'
  },
  [TutorialStep.GRID]: {
    targetId: 'tutorial-grid-area',
    textKey: 'tut_grid_text',
    position: 'bottom',
    anim: 'animate-bounce'
  },
  [TutorialStep.CHALLENGE_MODAL]: {
    targetId: 'tutorial-validation-actions',
    textKey: 'tut_challenge_text',
    position: 'bottom',
    anim: 'animate-pulse'
  },
  [TutorialStep.SCORE]: {
    targetId: 'tutorial-score-target',
    textKey: 'tut_score_text',
    position: 'bottom',
    anim: 'animate-pulse'
  }
};

const TutorialLayer: React.FC<TutorialLayerProps> = ({ step, onNext }) => {
  const { language, t } = useLanguage();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const config = CONFIG[step];
  
  const PAD = 8; 

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    if (!config) { setRect(null); return; }

    const updateRect = () => {
      const el = document.getElementById(config.targetId);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) setRect(r);
      }
    };

    updateRect();
    const timers = [100, 300, 600].map(t => setTimeout(updateRect, t));
    const handleResize = () => { setWindowHeight(window.innerHeight); updateRect(); }

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateRect, true);
    return () => {
        timers.forEach(clearTimeout);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', updateRect, true);
    };
  }, [step, config]);

  if (!config || !rect) return null;

  let pos = config.position;
  const tooltipStyle: React.CSSProperties = {};
  
  if (pos === 'top') {
      tooltipStyle.bottom = windowHeight - rect.top + 20;
      tooltipStyle.left = 0; tooltipStyle.right = 0;
  } else if (pos === 'bottom') {
      tooltipStyle.top = rect.bottom + 20;
      tooltipStyle.left = 0; tooltipStyle.right = 0;
  } else {
      tooltipStyle.top = '50%'; tooltipStyle.left = '50%'; tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div 
        className={`absolute rounded-xl transition-all duration-300 ease-out`}
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + (PAD * 2),
          height: rect.height + (PAD * 2),
          boxShadow: '0 0 0 9999px rgba(10, 22, 41, 0.96)', 
          pointerEvents: 'none'
        }}
      >
          <div className="absolute inset-0 border-[4px] border-[#FFD700] rounded-xl animate-pulse shadow-[0_0_30px_rgba(255,215,0,0.3)]"></div>
      </div>

      <div className="absolute flex flex-col items-center justify-center px-4" style={tooltipStyle}>
         <div className="bg-[#FFD700] text-black p-6 rounded-[2rem] border-[4px] border-black shadow-[10px_10px_0px_black] w-full max-w-xs animate-in zoom-in-95 duration-200">
            <p className="text-center font-impact font-[900] uppercase text-xs leading-tight mb-5 tracking-tighter italic">
                {t(config.textKey as any)}
            </p>
            <button 
              onClick={onNext}
              className="w-full py-4 rounded-xl bg-black text-white font-impact uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
            >
               {t('tutorial_got_it')} <ChevronRight size={16} strokeWidth={4} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default TutorialLayer;
