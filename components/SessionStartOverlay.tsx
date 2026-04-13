
import React from 'react';
import { PartyPopper, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const SessionStartOverlay: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#0A1629]/95"></div>
      
      <div className="relative w-full max-w-sm text-center animate-in zoom-in-95 duration-500">
         <div className="mb-8 relative inline-block">
             <div className="relative w-32 h-32 bg-[#FFD700] border-[5px] border-black rounded-2xl flex items-center justify-center mx-auto shadow-[10px_10px_0px_black] animate-bounce">
                 <PartyPopper className="w-16 h-16 text-black" strokeWidth={5} />
             </div>
             <Zap className="absolute -top-4 -right-4 text-[#00FF9D] w-12 h-12 fill-[#00FF9D] animate-pulse" />
             <Zap className="absolute -bottom-4 -left-4 text-[#FF2E63] w-10 h-10 fill-[#FF2E63] animate-pulse delay-100" />
         </div>

         <h1 className="text-4xl font-impact text-white uppercase tracking-tighter leading-none italic mb-4">
            {t('session_start_title')}
         </h1>
         
         <div className="bg-[#00FF9D] border-[3px] border-black rounded-xl p-4 shadow-[5px_5px_0px_black]">
             <p className="text-black font-impact text-sm uppercase italic tracking-tighter">
                {t('session_start_subtitle')}
             </p>
         </div>
      </div>
    </div>
  );
};

export default SessionStartOverlay;
