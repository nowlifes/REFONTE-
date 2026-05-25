
import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingCardsProps {
  onDone: () => void;
}

const TYPES = [
  { bg: '#00F5A0', textColor: 'black', icon: '✅', labelFr: 'SOLO', labelEn: 'SOLO',   descFr: 'Fais-le, tape "J\'ai réussi"', descEn: 'Do it, tap "I Did It"' },
  { bg: '#FF2D6A', textColor: 'white', icon: '👁️', labelFr: 'TÉMOIN', labelEn: 'WITNESS', descFr: 'Passe le phone à quelqu\'un',    descEn: 'Hand your phone to someone' },
  { bg: '#FFD700', textColor: 'black', icon: '⭐', labelFr: 'MASTER', labelEn: 'MASTER',  descFr: 'Montre au boss de soirée',       descEn: 'Show the game master' },
  { bg: '#FF8C00', textColor: 'black', icon: '⚔️', labelFr: 'DUEL',   labelEn: 'DUEL',    descFr: 'Défie un adversaire, le perdant boit', descEn: 'Challenge someone, loser drinks' },
];

const OnboardingCards: React.FC<OnboardingCardsProps> = ({ onDone }) => {
  const { language } = useLanguage();
  const fr = language === 'fr';

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A1629] flex flex-col items-center justify-center p-5 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">

      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* Header */}
        <div className="text-center">
          <p className="font-impact uppercase text-[11px] tracking-[0.3em] text-[#FFD700]">
            {fr ? 'LES DÉFIS' : 'CHALLENGES'}
          </p>
          <h1 className="font-impact uppercase text-4xl italic tracking-tighter text-white leading-none mt-1">
            {fr ? '4 types\nà connaître.' : '4 types\nto know.'}
          </h1>
        </div>

        {/* 4 types — 2×2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((type) => (
            <div
              key={type.labelEn}
              className="rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] p-3 flex flex-col gap-1.5"
              style={{ background: type.bg }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl leading-none">{type.icon}</span>
                <span
                  className="font-impact uppercase text-[15px] tracking-tight leading-none"
                  style={{ color: type.textColor }}
                >
                  {fr ? type.labelFr : type.labelEn}
                </span>
              </div>
              <p
                className="font-impact uppercase text-[10px] tracking-wide leading-snug"
                style={{ color: type.textColor === 'black' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.65)' }}
              >
                {fr ? type.descFr : type.descEn}
              </p>
            </div>
          ))}
        </div>

        {/* Ligne = Joker */}
        <div className="bg-white border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_black] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0 shadow-[3px_3px_0px_#00F5A0]">
            <Zap className="w-6 h-6 text-[#00F5A0]" strokeWidth={2} fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-impact uppercase text-[15px] tracking-tight text-black leading-none">
              {fr ? 'Ligne = +1 Joker' : 'Line = +1 Joker'}
            </p>
            <p className="font-impact uppercase text-[11px] tracking-wide text-black/55 mt-1 leading-snug">
              {fr ? 'Complète une ligne → joker + récompense' : 'Complete a line → joker + reward'}
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onDone}
          className="w-full mt-1 bg-[#FFD700] text-black font-impact uppercase text-xl tracking-tight py-4 rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform flex items-center justify-center gap-2"
        >
          {fr ? "C'EST PARTI !" : "LET'S GO!"}
          <ArrowRight className="w-6 h-6" strokeWidth={3.5} />
        </button>

      </div>
    </div>
  );
};

export default OnboardingCards;
