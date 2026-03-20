
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Users, Crown, HandMetal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LegendsModalProps {
  onClose: () => void;
}

const LegendsModal: React.FC<LegendsModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const appUrl = window.location.href;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A1629]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white border-[5px] border-black rounded-[2.5rem] shadow-[15px_15px_0px_black] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* MASSIVE CLOSE CROSS */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-black text-white rounded-full z-50 hover:scale-110 active:scale-90 transition-all border-2 border-white/20 shadow-xl"
        >
          <X className="w-7 h-7" strokeWidth={5} />
        </button>

        <div className="bg-[#FFD700] p-8 text-center border-b-[5px] border-black">
          <h2 className="text-3xl font-impact font-[900] text-black uppercase tracking-tighter italic leading-none">
            {t('rules_title')} <span className="bg-black text-white px-3 py-1 ml-1 rounded-lg inline-block rotate-2">BINGO</span>
          </h2>
        </div>

        <div className="p-6 space-y-5 bg-white overflow-y-auto no-scrollbar max-h-[50vh]">
            <div className="bg-[#00FF9D] border-[4px] border-black rounded-3xl p-5 flex items-center gap-5 shadow-[6px_6px_0px_black] transition-all">
                <div className="bg-white p-3 rounded-2xl border-2 border-black">
                  <HandMetal className="w-8 h-8 text-black shrink-0" strokeWidth={3} />
                </div>
                <div>
                    <h3 className="font-impact text-black text-base uppercase italic">{t('mode_solo_title')}</h3>
                    <p className="text-black/60 text-[10px] font-impact uppercase leading-tight tracking-tight mt-1">{t('mode_solo_desc')}</p>
                </div>
            </div>

            <div className="bg-[#FF2E63] border-[4px] border-black rounded-3xl p-5 flex items-center gap-5 shadow-[6px_6px_0px_black] transition-all">
                <div className="bg-white p-3 rounded-2xl border-2 border-black">
                  <Users className="w-8 h-8 text-[#FF2E63] shrink-0" strokeWidth={3} />
                </div>
                <div className="text-white">
                    <h3 className="font-impact text-base uppercase italic">{t('mode_social_title')}</h3>
                    <p className="text-white/80 text-[10px] font-impact uppercase leading-tight tracking-tight mt-1">{t('mode_social_desc')}</p>
                </div>
            </div>

            <div className="bg-[#FFD700] border-[4px] border-black rounded-3xl p-5 flex items-center gap-5 shadow-[6px_6px_0px_black] transition-all">
                <div className="bg-white p-3 rounded-2xl border-2 border-black">
                  <Crown className="w-8 h-8 text-[#EAB308] shrink-0" strokeWidth={3} />
                </div>
                <div>
                    <h3 className="font-impact text-base uppercase italic">{t('mode_master_title')}</h3>
                    <p className="text-black/60 text-[10px] font-impact uppercase leading-tight tracking-tight mt-1">{t('mode_master_desc')}</p>
                </div>
            </div>
        </div>

        <div className="p-6 bg-black flex items-center justify-between gap-6">
            <div className="flex-1 text-white">
                <h4 className="font-impact text-sm italic uppercase mb-1 tracking-tighter">{t('share')}</h4>
                <p className="text-white/40 text-[9px] font-impact uppercase tracking-[0.2em] leading-none">{t('invite_friends')}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border-2 border-white shadow-[6px_6px_0px_#FFD700] rotate-3">
                 <QRCodeSVG value={appUrl} size={80} level="M" fgColor="#000000" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default LegendsModal;
