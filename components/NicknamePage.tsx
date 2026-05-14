
import React, { useState } from 'react';
import { ArrowRight, Lock, KeyRound, X, Loader2, Globe } from 'lucide-react';
import OnboardingCards from './OnboardingCards';
import { useLanguage } from '../contexts/LanguageContext';
import { AppView } from '../types';
import { AVATAR_SEEDS, COUNTRIES, APP_VERSION } from '../constants';
import BackgroundParticles from './BackgroundParticles';
import Avatar from './Avatar';
import NetworkStatus from './NetworkStatus';
import ShieldLogo from './ShieldLogo';

interface NicknamePageProps {
  state: any;
  actions: any;
  ui: any;
  uiActions: any;
  tutorialActions: any;
  onCrownClick?: () => void;
}

const NicknamePage: React.FC<NicknamePageProps> = ({ state: s, actions: a, ui, uiActions: uia, tutorialActions: tut, onCrownClick }) => {
  const { t, language, setLanguage } = useLanguage();
  const [selectorMode, setSelectorMode] = useState<'NONE' | 'AVATAR' | 'COUNTRY'>('NONE');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startPress = () => {
    setIsPressing(true);
    setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 1;
      setProgress(p);
      if (navigator.vibrate) navigator.vibrate(20);
      if (p >= 3) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        onCrownClick?.();
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

  const currentCountry = COUNTRIES.find(c => c.code === s.country) || COUNTRIES[0];

  return (
    <div className="min-h-[100dvh] bg-[#0A1629] flex flex-col items-center justify-center p-6 relative overflow-hidden">
         <NetworkStatus />
         
         {/* Language Selector + Pointer Animation */}
         <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
             <button 
                onClick={toggleLanguage}
                className="bg-[#FFD700] border-[3px] border-black rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-[3px_3px_0px_black] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all relative z-20"
              >
                <span className="text-lg">{language === 'en' ? '🇬🇧' : '🇫🇷'}</span>
                <span className="text-[10px] font-impact text-black">
                   {language === 'en' ? 'EN' : 'FR'}
                </span>
              </button>
              
              {/* Animated Arrow and Info Bubble */}
              <div className="mt-2 flex flex-col items-end animate-bounce pointer-events-none z-10 mr-2">
                 <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white transform rotate-0 mb-[-1px]"></div>
                 <div className="bg-white text-black text-[9px] font-impact uppercase px-2 py-1 rounded shadow-lg border border-black">
                    {t('select_language')}
                 </div>
              </div>
         </div>
         
         <div className="fixed top-4 left-4 z-50 flex items-center gap-4">
            <div className="relative">
              <button 
                  onClick={() => uia.setShowMasterLogin(true)} 
                  onMouseDown={startPress}
                  onMouseUp={endPress}
                  onMouseLeave={endPress}
                  onTouchStart={startPress}
                  onTouchEnd={endPress}
                  className={`p-2 transition-all duration-300 ${isPressing ? 'text-[#FFD700] scale-125' : 'text-white/20 hover:text-white'}`}
              >
                 <Lock className="w-5 h-5" />
              </button>
              {isPressing && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {[1, 2, 3].map((dot) => (
                    <div 
                      key={dot} 
                      className={`w-1 h-1 rounded-full transition-all duration-300 ${progress >= dot ? 'bg-[#FFD700] shadow-[0_0_5px_#FFD700]' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              )}
            </div>
         </div>

         <BackgroundParticles />
         
         <div className="w-full max-w-sm bg-[#FFD700] border-[4px] border-black rounded-2xl p-6 shadow-[8px_8px_0px_black] relative z-10 animate-in fade-in zoom-in-95 duration-300">
           <div className="text-center mb-6">
             <div className="mb-4 flex flex-col items-center justify-center w-full">
                <div className="flex items-end gap-3 mb-6">
                   {/* Avatar Clickable */}
                   <div 
                      onClick={() => setSelectorMode(selectorMode === 'AVATAR' ? 'NONE' : 'AVATAR')}
                      className={`relative w-24 h-24 cursor-pointer transition-transform active:scale-95 ${selectorMode === 'AVATAR' ? 'scale-110' : ''}`}
                   >
                      <Avatar seed={s.avatarId} size={96} className="shadow-[4px_4px_0px_black] border-[3px] border-black rounded-xl" />
                      <div className="absolute -top-2 -right-2 bg-black text-white p-1 rounded-full border-2 border-white">
                         <X className={`w-3 h-3 transition-transform ${selectorMode === 'AVATAR' ? 'rotate-0' : 'rotate-45'}`} strokeWidth={4} />
                      </div>
                   </div>

                   {/* Country Clickable */}
                   <div 
                      onClick={() => setSelectorMode(selectorMode === 'COUNTRY' ? 'NONE' : 'COUNTRY')}
                      className={`relative w-14 h-14 bg-white border-[3px] border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_black] cursor-pointer transition-transform active:scale-95 ${selectorMode === 'COUNTRY' ? 'scale-110' : ''}`}
                   >
                      <span className="text-3xl">{currentCountry.flag}</span>
                      <div className="absolute -top-1 -right-1 bg-black text-white p-0.5 rounded-full border border-white">
                         <Globe className="w-2.5 h-2.5" />
                      </div>
                   </div>
                </div>

                {/* Grid Selector for Avatars — Premium */}
                {selectorMode === 'AVATAR' && (
                  <div className="mb-4 w-full animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="font-impact text-[9px] uppercase tracking-[0.18em] text-black/50">
                        ⚔️ CHOISIR TON HÉROS
                      </span>
                      <span className="font-impact text-[8px] uppercase tracking-wider text-black/30">
                        {AVATAR_SEEDS.length} CLASSES
                      </span>
                    </div>

                    {/* Grid */}
                    <div className="bg-black/10 border-[2.5px] border-black rounded-xl p-2 grid grid-cols-4 gap-2 max-h-56 overflow-y-auto no-scrollbar">
                      {AVATAR_SEEDS.map((seed) => {
                        const isSelected = s.avatarId === seed;
                        return (
                          <button
                            key={seed}
                            type="button"
                            onClick={() => { a.setAvatarId(seed); setSelectorMode('NONE'); }}
                            className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-150 active:scale-90 ${
                              isSelected
                                ? 'bg-white border-[2.5px] border-black shadow-[2px_2px_0px_black] scale-[1.06]'
                                : 'bg-white/30 border-[2px] border-transparent hover:bg-white/50 hover:border-black/30'
                            }`}
                          >
                            {/* Checkmark badge */}
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-black rounded-full flex items-center justify-center border-[2px] border-white z-10">
                                <span className="text-[#FFD700] text-[9px] font-black leading-none">✓</span>
                              </div>
                            )}

                            <Avatar seed={seed} size={52} />

                            <span className={`font-impact text-[7px] uppercase tracking-tight leading-none w-full text-center truncate ${isSelected ? 'text-black' : 'text-black/50'}`}>
                              {seed}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grid Selector for Countries */}
                {selectorMode === 'COUNTRY' && (
                  <div className="mb-6 w-full animate-in fade-in zoom-in-95">
                    <div className="bg-black/10 border-2 border-black rounded-xl p-2 grid grid-cols-4 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                        {COUNTRIES.map((c) => (
                        <div 
                          key={c.code} 
                          onClick={() => { a.setCountry(c.code); setSelectorMode('NONE'); }} 
                          className={`h-12 bg-white border-2 border-black rounded-lg flex items-center justify-center text-2xl cursor-pointer transition-all hover:scale-105 active:scale-90 ${s.country === c.code ? 'bg-[#00FF9D]' : ''}`}
                        >
                          {c.flag}
                        </div>
                        ))}
                    </div>
                  </div>
                )}
             </div>
             <h2 className="text-3xl font-impact text-black uppercase tracking-tighter italic leading-none">{t('your_card')}</h2>
           </div>
           
           <div className="space-y-1 mb-6">
             <label className="text-black text-[9px] uppercase font-impact tracking-widest ml-1">{t('player_name_label')}</label>
             <input 
                type="text" 
                value={s.nickname} 
                onChange={(e) => a.setNickname(e.target.value.toUpperCase())} 
                className="w-full bg-white border-[3px] border-black rounded-xl p-4 text-center text-black placeholder-black/20 focus:outline-none transition-all text-xl font-impact uppercase italic" 
                placeholder={t('placeholder_name_input')} 
                maxLength={10}
             />
           </div>

           <button
                onClick={() => setShowOnboarding(true)}
                disabled={!s.nickname.trim()}
                className="w-full bg-[#00FF9D] text-black py-5 rounded-xl text-xl font-impact uppercase tracking-widest shadow-[4px_4px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-30 flex items-center justify-center gap-3"
            >
             {t('lets_go_btn')} <ArrowRight className="w-6 h-6" strokeWidth={5} />
           </button>

           {showOnboarding && (
             <OnboardingCards onDone={() => { setShowOnboarding(false); a.registerPlayer(s.nickname); }} />
           )}

         </div>

         <div className="text-[9px] text-white/20 mt-8 font-impact uppercase tracking-widest">VERSION {APP_VERSION}</div>

         {/* Master Login Modal */}
         {ui.showMasterLogin && (
           <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-[#FFD700] border-[4px] border-black rounded-2xl p-8 relative shadow-[8px_8px_0px_black]">
                 <button onClick={() => { uia.setShowMasterLogin(false); uia.setMasterLoginError(false); }} className="absolute top-4 right-4 text-black"><X className="w-6 h-6" strokeWidth={5} /></button>
                 <div className="text-center mb-6">
                   <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4"><KeyRound className="w-8 h-8 text-[#FFD700]" /></div>
                   <h3 className="text-2xl font-impact text-black uppercase tracking-tighter italic">{t('master_access_title')}</h3>
                 </div>
                 <form onSubmit={uia.handleMasterLoginSubmit} className="space-y-4">
                    <input type="password" value={ui.masterCodeInput} onChange={(e) => uia.setMasterCodeInput(e.target.value)} placeholder="••••" className={`w-full bg-white border-[3px] border-black rounded-xl p-4 text-center text-black text-2xl font-impact tracking-widest focus:outline-none transition-all ${ui.masterLoginError ? 'border-red-500 animate-[shake_0.5s_ease-in-out]' : 'border-black'}`} autoFocus disabled={ui.isVerifyingMaster} />
                    <button type="submit" disabled={ui.isVerifyingMaster} className="w-full bg-black text-[#FFD700] font-impact py-4 rounded-xl uppercase tracking-wider text-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                       {ui.isVerifyingMaster ? <Loader2 className="w-6 h-6 animate-spin" /> : t('unlock')}
                    </button>
                 </form>
              </div>
           </div>
         )}
      </div>
  );
};

export default NicknamePage;
