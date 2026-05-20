
import React from 'react';
import { Grid3X3, Users, Zap, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingCardsProps {
  onDone: () => void;
}

const OnboardingCards: React.FC<OnboardingCardsProps> = ({ onDone }) => {
  const { language } = useLanguage();
  const fr = language === 'fr';

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A1629] flex flex-col items-center justify-center p-5 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">

      {/* Card */}
      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* Header */}
        <div className="text-center">
          <p className="font-impact uppercase text-[11px] tracking-[0.3em] text-[#FFD700]">
            {fr ? 'LES RÈGLES' : 'THE RULES'}
          </p>
          <h1 className="font-impact uppercase text-4xl italic tracking-tighter text-white leading-none mt-1">
            {fr ? '3 trucs\nà savoir.' : '3 things\nto know.'}
          </h1>
        </div>

        {/* Rule 1 — Grid 5x5 */}
        <div className="bg-[#FFD700] border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_black] p-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-black rounded-xl border-[3px] border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_#FFD700]">
            <Grid3X3 className="w-7 h-7 text-[#FFD700]" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-impact uppercase text-[15px] tracking-tight text-black leading-none">
              {fr ? 'Grille 5×5' : '5×5 Grid'}
            </p>
            <p className="font-impact uppercase text-[11px] tracking-wide text-black/60 mt-1 leading-snug">
              {fr ? '25 défis à cocher dans les bars ce soir' : '25 challenges to tick off across the bars tonight'}
            </p>
          </div>
        </div>

        {/* Rule 2 — Witness */}
        <div className="bg-white border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_black] p-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-[#FF2D6A] rounded-xl border-[3px] border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_black]">
            <Users className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-impact uppercase text-[15px] tracking-tight text-black leading-none">
              {fr ? 'Défis Témoin' : 'Witness Challenges'}
            </p>
            <p className="font-impact uppercase text-[11px] tracking-wide text-black/50 mt-1 leading-snug">
              {fr ? "Un autre joueur doit signer sur ton écran pour valider" : "Another player must sign on your screen to validate"}
            </p>
          </div>
        </div>

        {/* Rule 3 — Line = Joker */}
        <div className="bg-[#00F5A0] border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_black] p-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-black rounded-xl border-[3px] border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_#00F5A0]">
            <Zap className="w-7 h-7 text-[#00F5A0]" strokeWidth={2} fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-impact uppercase text-[15px] tracking-tight text-black leading-none">
              {fr ? 'Ligne = +1 Joker' : 'Line = +1 Joker'}
            </p>
            <p className="font-impact uppercase text-[11px] tracking-wide text-black/60 mt-1 leading-snug">
              {fr ? 'Complète une ligne pour gagner un joker et des récompenses' : 'Complete a line to earn a joker and rewards'}
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onDone}
          className="w-full mt-1 bg-white text-black font-impact uppercase text-xl tracking-tight py-4 rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform flex items-center justify-center gap-2"
        >
          {fr ? "C'EST PARTI !" : "LET'S GO!"}
          <ArrowRight className="w-6 h-6" strokeWidth={3.5} />
        </button>

      </div>
    </div>
  );
};

export default OnboardingCards;
