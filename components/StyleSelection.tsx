
import React from 'react';
import { HandMetal, Users, Crown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface StyleSelectionProps {
  onSelect: () => void;
}

const StyleSelection: React.FC<StyleSelectionProps> = ({ onSelect }) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      <div className="text-center mb-8">
        <h2 className="text-4xl font-impact text-white uppercase tracking-tighter italic leading-none mb-1">
          {t('your_identity')}
        </h2>
        <p className="text-[10px] text-white/40 font-impact uppercase tracking-widest">
            {t('customize_emblem')}
        </p>
      </div>

      <div id="tutorial-styles-container" className="w-full space-y-4">

        {/* SOLO (AUTO) */}
        <button onClick={onSelect} className="w-full bg-[#00FF9D] border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-left flex items-center gap-4">
            <div className="w-12 h-12 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center shrink-0">
                <HandMetal className="w-6 h-6 text-black" strokeWidth={3} />
            </div>
            <div className="flex-1">
                <h3 className="text-black font-impact text-lg uppercase leading-none mb-1 italic">
                    {t('mode_solo_title')}
                </h3>
                <p className="text-black/60 text-[8.5px] font-impact uppercase leading-tight tracking-tight">
                    {t('mode_solo_desc')}
                </p>
            </div>
        </button>

        {/* WITNESS (SOCIAL) */}
        <button onClick={onSelect} className="w-full bg-[#FF2E63] border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-left flex items-center gap-4">
            <div className="w-12 h-12 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-black" strokeWidth={3} />
            </div>
            <div className="flex-1 text-white">
                <h3 className="font-impact text-lg uppercase leading-none mb-1 italic">
                    {t('mode_social_title')}
                </h3>
                <p className="text-white/70 text-[8.5px] font-impact uppercase leading-tight tracking-tight">
                    {t('mode_social_desc')}
                </p>
            </div>
        </button>

        {/* MASTER (VIP) */}
        <button onClick={onSelect} className="w-full bg-[#FFD700] border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-left flex items-center gap-4">
            <div className="w-12 h-12 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center shrink-0">
                <Crown className="w-7 h-7 text-black" strokeWidth={3} />
            </div>
            <div className="flex-1 text-black">
                <h3 className="font-impact text-lg uppercase leading-none mb-1 italic">
                    {t('mode_master_title')}
                </h3>
                <p className="text-black/60 text-[8.5px] font-impact uppercase leading-tight tracking-tight">
                    {t('mode_master_desc')}
                </p>
            </div>
        </button>

      </div>
    </div>
  );
};

export default StyleSelection;
