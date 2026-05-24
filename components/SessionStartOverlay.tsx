
import React, { useState, useEffect } from 'react';
import { PartyPopper, Zap, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onDone: () => void;
}

const MECHANICS_FR = [
  {
    color: '#00F5A0',
    icon: '✅',
    title: 'Défi Solo',
    desc: 'Réalise le défi toi-même et coche la case dans ta grille.',
  },
  {
    color: '#FF2D6A',
    icon: '🤝',
    title: 'Témoin',
    desc: 'Ces défis nécessitent qu\'un autre joueur confirme que tu l\'as réussi.',
  },
  {
    color: '#FF8C00',
    icon: '⚔️',
    title: 'Duel',
    desc: 'Défie un autre joueur — celui qui valide en premier marque le point.',
  },
  {
    color: '#FFD700',
    icon: '👑',
    title: 'Bingo Master',
    desc: 'Réalise le défi devant le Bingo Master qui valide en personne.',
  },
];

const MECHANICS_EN = [
  {
    color: '#00F5A0',
    icon: '✅',
    title: 'Solo Challenge',
    desc: 'Complete the challenge yourself and check the box on your grid.',
  },
  {
    color: '#FF2D6A',
    icon: '🤝',
    title: 'Witness',
    desc: 'These challenges require another player to confirm you succeeded.',
  },
  {
    color: '#FF8C00',
    icon: '⚔️',
    title: 'Duel',
    desc: 'Challenge another player — whoever validates first scores the point.',
  },
  {
    color: '#FFD700',
    icon: '👑',
    title: 'Bingo Master',
    desc: 'Complete the challenge in front of the Bingo Master who validates in person.',
  },
];

const SessionStartOverlay: React.FC<Props> = ({ onDone }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const mechanics = isFr ? MECHANICS_FR : MECHANICS_EN;

  // step 0 = party animation, steps 1–4 = mechanic cards
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(() => setStep(1), 1800);
      return () => clearTimeout(t);
    }
  }, [step]);

  const advance = () => {
    if (step < mechanics.length) {
      setStep(step + 1);
    } else {
      onDone();
    }
  };

  const mechIndex = step - 1; // 0-based index into mechanics array
  const mech = mechanics[mechIndex];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#0A1629]/95" />

      {/* ── Step 0: Party animation ── */}
      {step === 0 && (
        <div className="relative w-full max-w-sm text-center animate-in zoom-in-95 duration-500">
          <div className="mb-8 relative inline-block">
            <div className="relative w-32 h-32 bg-[#FFD700] border-[5px] border-black rounded-2xl flex items-center justify-center mx-auto shadow-[10px_10px_0px_black] animate-bounce">
              <PartyPopper className="w-16 h-16 text-black" strokeWidth={5} />
            </div>
            <Zap className="absolute -top-4 -right-4 text-[#00FF9D] w-12 h-12 fill-[#00FF9D] animate-pulse" />
            <Zap className="absolute -bottom-4 -left-4 text-[#FF2E63] w-10 h-10 fill-[#FF2E63] animate-pulse delay-100" />
          </div>
          <h1 className="text-4xl font-impact text-white uppercase tracking-tighter leading-none italic mb-4">
            {isFr ? 'La partie commence !' : 'Game on!'}
          </h1>
          <div className="bg-[#00FF9D] border-[3px] border-black rounded-xl p-4 shadow-[5px_5px_0px_black]">
            <p className="text-black font-impact text-sm uppercase italic tracking-tighter">
              {isFr ? 'Bonne chance à tous !' : 'Good luck everyone!'}
            </p>
          </div>
        </div>
      )}

      {/* ── Steps 1-4: Mechanic cards ── */}
      {step >= 1 && step <= mechanics.length && (
        <div className="relative w-full max-w-sm animate-in slide-in-from-right-8 duration-300">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {mechanics.map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full border-[2px] border-black transition-all duration-300"
                style={{
                  width: i === mechIndex ? 24 : 8,
                  background: i === mechIndex ? mech.color : '#ffffff33',
                }}
              />
            ))}
          </div>

          {/* Card */}
          <div
            className="border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_black] p-8 text-center"
            style={{ background: mech.color }}
          >
            <div className="text-6xl mb-4 leading-none">{mech.icon}</div>
            <h2 className="font-impact uppercase text-2xl tracking-tight text-black mb-3">
              {mech.title}
            </h2>
            <p className="text-black/80 font-bold text-base leading-snug">
              {mech.desc}
            </p>
          </div>

          {/* Button */}
          <button
            onClick={advance}
            className="mt-5 w-full bg-white border-[3px] border-black rounded-xl py-4 font-impact uppercase text-lg tracking-tight shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
          >
            {step < mechanics.length
              ? (isFr ? 'Suivant' : 'Next')
              : (isFr ? "C'est parti !" : "Let's go!")}
            <ChevronRight className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionStartOverlay;
