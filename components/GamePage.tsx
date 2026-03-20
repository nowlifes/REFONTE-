
import React from 'react';
import { Trophy, Crown, Settings, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppView, TutorialStep, BingoCellData } from '../types';
import BingoCell from './BingoCell';
import QRScanner from './QRScanner';
import ValidationModal from './ValidationModal';
import TutorialLayer from './TutorialLayer';
import LegendsModal from './LegendsModal';
import NFTBadgeModal from './NFTBadgeModal';
import BackgroundParticles from './BackgroundParticles';
import Avatar from './Avatar';
import NetworkStatus from './NetworkStatus';
import BadgeNotification from './BadgeNotification';

interface GamePageProps {
  state: any;
  actions: any;
  ui: any;
  uiActions: any;
  tutorialActions: any;
  onTutorialNext: () => void;
}

const GamePage: React.FC<GamePageProps> = ({ state: s, actions: a, ui, uiActions: uia, tutorialActions: tut, onTutorialNext }) => {
  const { t, language, setLanguage } = useLanguage();
  const isFever = s.feverCells.length > 0;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <div className={`fixed inset-0 bg-[#0A1629] text-white flex flex-col items-center overflow-hidden ${isFever ? 'ring-[8px] ring-inset ring-[#FF2D6A] transition-all duration-500' : ''}`}>
      <NetworkStatus />
      <BackgroundParticles />
      
      <TutorialLayer step={tut.currentStep} onNext={onTutorialNext} />
      <BadgeNotification badge={s.newBadge} onClose={a.clearNewBadge} />

      {/* Header compact */}
      <header className="shrink-0 w-full px-4 py-2 flex justify-between items-center z-30 mt-1">
        <button id="tutorial-score-target" onClick={() => uia.setShowBadge(true)} className="flex items-center gap-2 bg-white/5 pr-3 pl-1 py-1 rounded-xl border-2 border-white/10 active:scale-95 transition-transform">
          <Avatar seed={s.avatarId} size={36} className="border border-white/20 rounded-lg" />
          <div className="flex flex-col items-start leading-none">
            <span className="font-impact text-[10px] text-[#00F5A0] uppercase tracking-tighter">{s.nickname}</span>
            <span className="text-[7px] text-slate-500 font-impact uppercase tracking-widest mt-0.5">{s.country || 'FR'}</span>
          </div>
        </button>
        
        <div className="flex items-center gap-2">
             {/* Mini Language Switcher */}
             <button 
                onClick={toggleLanguage}
                className="bg-black/40 border border-white/20 rounded-lg px-2 py-1 flex items-center gap-1.5 active:scale-95 transition-all"
             >
                <span className="text-sm leading-none">{language === 'en' ? '🇬🇧' : '🇫🇷'}</span>
                <span className="text-[9px] font-impact font-[900] text-white/70">
                   {language === 'en' ? 'EN' : 'FR'}
                </span>
             </button>

             <div className="bg-[#FFD93D] px-3 py-1.5 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_black] flex flex-col items-center">
                <span className="text-[7px] text-black/60 font-impact uppercase leading-none mb-0.5 font-black tracking-widest">{t('score')}</span>
                <span className="font-impact text-lg text-black leading-none italic">{s.score}/25</span>
             </div>
        </div>
      </header>

      {/* GRILLE BINGO - 350x350px fixe */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden w-full">
        <div className="relative p-4 bg-black/40 rounded-[2rem] border-[4px] border-white/5 shadow-2xl">
          <div 
            id="tutorial-grid-area" 
            className="grid grid-cols-5 gap-[4px] p-[4px] bg-[#1A1A2E] rounded-[12px] shadow-inner"
            style={{ width: '350px', height: '350px' }}
          >
              {s.cells.map((cell: BingoCellData) => (
                <BingoCell 
                  key={cell.id} 
                  data={cell} 
                  onClick={(id) => {
                    a.handleCellClick(id);
                    if (tut.currentStep === TutorialStep.GRID) tut.nextStep();
                  }} 
                  isWinning={s.winningIds.includes(cell.id)} 
                  isFeverTarget={s.feverCells.includes(cell.id)}
                />
              ))}
          </div>
        </div>
      </main>

      {/* Jokers */}
      <div className="shrink-0 py-2 flex justify-center z-40">
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all duration-300 ${s.jokers > 0 ? 'bg-black/60 border-[#00F5A0]/40 text-[#00F5A0]' : 'bg-black/80 border-white/5 text-white/10'}`}>
              <Sparkles size={12} className={s.jokers > 0 ? 'animate-pulse' : ''} />
              <span className="text-[9px] font-impact uppercase tracking-widest leading-none">{t('jokers')} : {s.jokers}</span>
           </div>
      </div>

      {/* Footer Nav */}
      <footer className="shrink-0 w-full p-4 pb-10 flex justify-center z-40">
        <div className="flex items-center gap-10 bg-[#FFD93D] border-[3px] border-black rounded-[2rem] px-10 py-3.5 shadow-[8px_8px_0px_black] relative">
           <button onClick={() => a.setView(AppView.LEADERBOARD)} className="flex flex-col items-center active:scale-90 transition-transform">
              <Trophy size={26} className="text-black" />
              <span className="text-[8px] font-impact uppercase tracking-widest mt-0.5 text-black font-black">TOP</span>
           </button>
           
           <div onClick={() => uia.setShowBadge(true)} className="w-16 h-16 bg-white border-[4px] border-black rounded-2xl flex items-center justify-center shadow-[6px_6px_0px_black] -mt-16 cursor-pointer active:scale-95 transition-all group">
              <Crown size={30} className="text-black group-hover:rotate-12 transition-transform" fill="currentColor" />
           </div>

           <button onClick={() => uia.setShowLegends(true)} className="flex flex-col items-center active:scale-90 transition-transform">
              <Settings size={26} className="text-black" />
              <span className="text-[8px] font-impact uppercase tracking-widest mt-0.5 text-black font-black">{t('help')}</span>
           </button>
        </div>
      </footer>

      {/* MODALS */}
      {ui.showLegends && <LegendsModal onClose={() => uia.setShowLegends(false)} />}
      {ui.showBadge && <NFTBadgeModal nickname={s.nickname} score={s.score} badges={s.badges} onClose={() => uia.setShowBadge(false)} />}
      
      {s.selectedCell && s.activeScannerMode !== 'MASTER' && (
        <div id="tutorial-validation-actions">
          <ValidationModal 
              cell={s.selectedCell} 
              jokerCount={s.jokers} 
              lastWitnessTime={s.lastWitnessTime} 
              onClose={() => a.setSelectedCell(null)} 
              onConfirm={(data) => {
                  if (tut.currentStep === TutorialStep.CHALLENGE_MODAL) {
                     a.setSelectedCell(null);
                     tut.nextStep(); 
                  } else {
                     a.validateCell(data);
                  }
              }} 
              onUseJoker={a.useJoker} 
              onScanRequest={() => a.setActiveScannerMode('MASTER')} 
              onSubmitProof={() => {}}
          />
        </div>
      )}
      {s.activeScannerMode === 'MASTER' && (
          <QRScanner 
            mode={'MASTER'} 
            onScanSuccess={() => a.validateCell()} 
            onClose={() => {a.setActiveScannerMode(null); a.setSelectedCell(null);}}
          />
      )}
    </div>
  );
};

export default GamePage;
