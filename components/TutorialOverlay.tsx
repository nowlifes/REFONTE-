
import React from 'react';
import { Crown, Gift, Wine, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TutorialOverlayProps {
  onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-[#0A1629]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm relative flex flex-col max-h-[85vh]">
        
        {/* Scrollable area for content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-4 flex flex-col">
            
            {/* Header (Scrollable with the rest) */}
            <div className="text-center mt-2 mb-6 shrink-0">
                <h2 className="text-4xl font-impact font-[900] text-white uppercase tracking-tighter leading-none italic mb-1">
                    {t('rewards_title')}
                </h2>
                <p className="text-[10px] text-white/50 font-impact uppercase tracking-[0.2em]">
                    {t('rewards_subtitle')}
                </p>
            </div>

            {/* Rewards List - Compact Version */}
            <div className="flex flex-col gap-3 px-1" id="tutorial-rewards-container">
                
                {/* Ligne 1 */}
                <div className="bg-white border-[3px] border-black rounded-xl p-3 flex items-center gap-4 shadow-[4px_4px_0px_#FF2E63]">
                    <div className="w-14 h-14 bg-[#FF2E63] rounded-lg border-[2px] border-black flex items-center justify-center shrink-0">
                        <Wine className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-black font-impact font-[900] text-2xl uppercase leading-none italic">
                            {t('reward_row_1')}
                        </h3>
                        <p className="text-black/50 text-sm font-impact uppercase tracking-wide mt-1">
                            {t('reward_row_1_desc')}
                        </p>
                    </div>
                </div>

                {/* Ligne 2 */}
                <div className="bg-white border-[3px] border-black rounded-xl p-3 flex items-center gap-4 shadow-[4px_4px_0px_#00FF9D]">
                    <div className="w-14 h-14 bg-[#00FF9D] rounded-lg border-[2px] border-black flex items-center justify-center shrink-0">
                        <Gift className="w-7 h-7 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-black font-impact font-[900] text-2xl uppercase leading-none italic">
                            {t('reward_row_2')}
                        </h3>
                        <p className="text-black/50 text-sm font-impact uppercase tracking-wide mt-1">
                            {t('reward_row_2_desc')}
                        </p>
                    </div>
                </div>

                {/* Full Grid */}
                <div className="bg-white border-[3px] border-black rounded-xl p-3 flex items-center gap-4 shadow-[4px_4px_0px_#FFD700]">
                    <div className="w-14 h-14 bg-[#FFD700] rounded-lg border-[2px] border-black flex items-center justify-center shrink-0">
                        <Crown className="w-8 h-8 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-black font-impact font-[900] text-2xl uppercase leading-none italic">
                            {t('reward_full_grid')}
                        </h3>
                        <p className="text-black/50 text-sm font-impact uppercase tracking-wide mt-1">
                            {t('reward_full_grid_desc')}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Button - Sticky at bottom */}
        <div className="mt-2 shrink-0 pt-2 bg-gradient-to-t from-[#0A1629] via-[#0A1629] to-transparent">
            <button
                onClick={onClose}
                className="w-full bg-[#FFD700] text-black font-impact font-[900] text-3xl uppercase tracking-widest py-5 rounded-xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-3"
            >
                {t('cheers_btn')} <ArrowRight className="w-7 h-7" strokeWidth={5} />
            </button>
            <p className="text-center text-white/30 text-[10px] mt-3 font-impact uppercase tracking-widest">
                {t('disclaimer')}
            </p>
        </div>

      </div>
    </div>
  );
};

export default TutorialOverlay;
