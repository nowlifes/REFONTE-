
import React from 'react';
import { Power, DoorOpen, DoorClosed, Gamepad2, Crown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppView } from '../types';
import { APP_VERSION, MASTER_VALID_CODE } from '../constants';
import BackgroundParticles from './BackgroundParticles';

interface MasterPageProps {
  isSessionActive: boolean;
  setSessionActive: (active: boolean) => void;
  state: any;
  actions: any;
}

const MasterPage: React.FC<MasterPageProps> = ({ isSessionActive, setSessionActive, state: s, actions: a }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col items-center justify-center p-6">
      <BackgroundParticles />
      <div className="w-full max-w-sm relative z-10 animate-in zoom-in duration-300">
         <div className="bg-white border-[4px] border-black rounded-2xl p-6 shadow-[10px_10px_0px_black] text-center overflow-hidden">
            <div className="mb-6 pb-6 border-b-2 border-black/10">
               <h2 className="text-3xl font-impact font-[900] text-black uppercase tracking-tighter italic mb-4">{t('master_control')}</h2>
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => setSessionActive(true)} className={`p-4 rounded-xl border-[3px] border-black flex flex-col items-center justify-center gap-1 transition-all ${isSessionActive ? 'bg-[#00FF9D] shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[3px_3px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none'}`}>
                     <DoorOpen className="w-8 h-8 text-black" strokeWidth={3} />
                     <span className="font-impact text-[9px] uppercase tracking-widest">{t('open')}</span>
                  </button>
                  <button onClick={() => setSessionActive(false)} className={`p-4 rounded-xl border-[3px] border-black flex flex-col items-center justify-center gap-1 transition-all ${!isSessionActive ? 'bg-[#FF2E63] shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[3px_3px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none'}`}>
                     <DoorClosed className="w-8 h-8 text-black" strokeWidth={3} />
                     <span className="font-impact text-[9px] uppercase tracking-widest">{t('closed')}</span>
                  </button>
               </div>
               <button onClick={() => a.setView(s.cells.length > 0 ? AppView.GAME : AppView.NICKNAME)} className="w-full py-3 bg-black text-white rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Gamepad2 className="w-4 h-4" /> {t('back_to_game')}
               </button>
            </div>

            <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-4 border-[3px] border-black shadow-[4px_4px_0px_#FFD700]">
              <QRCodeSVG value={MASTER_VALID_CODE} size={180} level="H" />
            </div>
            
            <p className="text-[8px] font-impact text-black/40 uppercase tracking-widest italic">{t('show_master_code_desc')}</p>
         </div>
         <div className="text-center mt-4">
           <span className="text-[9px] font-impact text-white/20 uppercase tracking-widest">V{APP_VERSION}</span>
         </div>
      </div>
    </div>
  );
};

export default MasterPage;
