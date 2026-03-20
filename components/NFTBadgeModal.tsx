
import React from 'react';
import { X, Shield, Crown, Medal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Badge } from '../types';
import { BADGE_CONFIG } from '../constants';

interface NFTBadgeModalProps {
  nickname: string;
  score: number;
  badges: Badge[];
  onClose: () => void;
}

const NFTBadgeModal: React.FC<NFTBadgeModalProps> = ({ nickname, score, badges, onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-[#0A1629]/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-sm bg-white border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_black] overflow-hidden flex flex-col relative">
        <button onClick={onClose} className="absolute top-2 right-2 p-3 z-30 text-black active:scale-90 transition-transform">
          <X className="w-7 h-7" strokeWidth={5} />
        </button>

        <div className="bg-[#FFD700] p-6 text-center border-b-[4px] border-black">
          <div className="w-16 h-16 mx-auto bg-white border-[3px] border-black rounded-xl flex items-center justify-center mb-3 shadow-[4px_4px_0px_black]">
             <Shield className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-impact font-[900] text-black uppercase tracking-tighter italic leading-none">{nickname}</h2>
          <span className="text-[9px] font-impact text-black/50 uppercase tracking-widest mt-2 block">{t('certified_adventurer')}</span>
        </div>

        <div className="p-6 bg-white flex-1 min-h-[250px]">
          <h3 className="text-[9px] font-impact text-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <Medal className="w-3 h-3" /> {t('achievements')} ({badges.length})
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.keys(BADGE_CONFIG).map((type) => {
              const badge = badges.find(b => b.badge_type === type);
              const config = BADGE_CONFIG[type as keyof typeof BADGE_CONFIG];
              return (
                <div key={type} className={`aspect-square rounded border-[2.5px] border-black flex items-center justify-center text-xl transition-all ${badge ? 'bg-[#FFD700] shadow-[2px_2px_0px_black]' : 'bg-black/5 opacity-20 grayscale'}`}>
                  {config.emoji}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-black p-4 flex justify-between items-center text-white border-t-[4px] border-black">
           <div className="text-left">
             <div className="text-[7px] font-impact text-white/40 uppercase tracking-widest">STATUS</div>
             <div className="text-[#00FF9D] font-impact text-sm italic uppercase tracking-tighter">{t('active')}</div>
           </div>
           <div className="text-right">
             <div className="text-[7px] font-impact text-white/40 uppercase tracking-widest">{t('progress')}</div>
             <div className="text-white font-impact text-xl italic leading-none">{score}/25</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NFTBadgeModal;
