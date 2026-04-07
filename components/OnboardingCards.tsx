
import React, { useState } from 'react';
import { ArrowRight, X, HandMetal, Users, Crown, Gift, Wine, Grid3X3 } from 'lucide-react';

interface OnboardingCardsProps {
  onDone: () => void;
}

const CARDS = [
  {
    color: '#FFD700',
    textColor: 'text-black',
    icon: <Grid3X3 className="w-10 h-10 text-black" strokeWidth={2.5} />,
    tag: '01 / 03',
    title: '25 défis\nà relever',
    body: 'Ta grille contient 25 défis à compléter dans les bars de la soirée. Plus tu en coches, mieux c\'est.',
    visual: (
      <div className="grid grid-cols-5 gap-1 w-36">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className={`h-5 rounded border-2 border-black ${i < 7 ? 'bg-black' : 'bg-white/60'}`}
          />
        ))}
      </div>
    )
  },
  {
    color: '#00FF9D',
    textColor: 'text-black',
    icon: <HandMetal className="w-10 h-10 text-black" strokeWidth={2.5} />,
    tag: '02 / 03',
    title: '3 façons\nde valider',
    body: '',
    visual: (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 bg-black/10 border-2 border-black rounded-xl px-3 py-2">
          <HandMetal className="w-4 h-4 shrink-0" strokeWidth={3} />
          <span className="font-impact uppercase text-[10px] tracking-tight">Solo — tu l'as fait, tu valides</span>
        </div>
        <div className="flex items-center gap-2 bg-black/10 border-2 border-black rounded-xl px-3 py-2">
          <Users className="w-4 h-4 shrink-0" strokeWidth={3} />
          <span className="font-impact uppercase text-[10px] tracking-tight">Témoin — un ami confirme</span>
        </div>
        <div className="flex items-center gap-2 bg-black/10 border-2 border-black rounded-xl px-3 py-2">
          <Crown className="w-4 h-4 shrink-0" strokeWidth={3} />
          <span className="font-impact uppercase text-[10px] tracking-tight">Master — le Game Master valide</span>
        </div>
      </div>
    )
  },
  {
    color: '#FF2E63',
    textColor: 'text-white',
    icon: <Gift className="w-10 h-10 text-white" strokeWidth={2.5} />,
    tag: '03 / 03',
    title: 'Lignes =\nRécompenses',
    body: 'Complète une ligne entière sur ta grille pour gagner un reward. Plus tu en fais, plus tu gagnes.',
    visual: (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 bg-white/15 border-2 border-white/40 rounded-xl px-3 py-2">
          <Wine className="w-4 h-4 text-white shrink-0" strokeWidth={3} />
          <span className="font-impact uppercase text-[10px] tracking-tight text-white">1 ligne → 1 verre offert</span>
        </div>
        <div className="flex items-center gap-2 bg-white/15 border-2 border-white/40 rounded-xl px-3 py-2">
          <Gift className="w-4 h-4 text-white shrink-0" strokeWidth={3} />
          <span className="font-impact uppercase text-[10px] tracking-tight text-white">2 lignes → récompense spéciale</span>
        </div>
        <div className="flex items-center gap-2 bg-white/15 border-2 border-white/40 rounded-xl px-3 py-2">
          <Crown className="w-4 h-4 text-white shrink-0" strokeWidth={3} />
          <span className="font-impact uppercase text-[10px] tracking-tight text-white">Grille complète → LÉGENDAIRE</span>
        </div>
      </div>
    )
  }
];

const OnboardingCards: React.FC<OnboardingCardsProps> = ({ onDone }) => {
  const [current, setCurrent] = useState(0);
  const card = CARDS[current];
  const isLast = current === CARDS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A1629] flex flex-col items-center justify-center p-6 animate-in fade-in duration-200 overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#FFD700] opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-[5%] right-[-25%] w-[70%] h-[70%] rounded-full bg-[#FF2E63] opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-[#00FF9D] opacity-20 blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Skip */}
      <button
        onClick={onDone}
        className="absolute top-6 right-6 flex items-center gap-1 bg-black/40 backdrop-blur px-3 py-1.5 rounded-full border-2 border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all z-10"
      >
        <X className="w-3.5 h-3.5" strokeWidth={3} />
        <span className="text-[10px] font-impact uppercase tracking-widest">Passer</span>
      </button>

      {/* Card */}
      <div
        key={current}
        className="w-full max-w-sm rounded-[2rem] border-[4px] border-black shadow-[10px_10px_0px_black] p-7 flex flex-col gap-5 animate-in fade-in slide-in-from-right-8 duration-300 relative z-10"
        style={{ backgroundColor: card.color }}
      >
        {/* Tag + icon */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-impact uppercase tracking-widest font-[900] px-2 py-1 rounded-md ${current === 0 ? 'bg-black text-[#FFD700]' : current === 1 ? 'bg-black text-[#00FF9D]' : 'bg-white text-[#FF2E63]'}`}>
            {card.tag}
          </span>
          <div className={`w-16 h-16 border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_black] ${current === 0 ? 'bg-white' : current === 1 ? 'bg-white' : 'bg-white'}`}>
            {card.icon}
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-4xl font-impact uppercase tracking-tighter italic leading-none whitespace-pre-line ${card.textColor}`}>
          {card.title}
        </h2>

        {/* Visual */}
        <div className="flex justify-center">
          {card.visual}
        </div>

        {/* Body */}
        {card.body && (
          <p className={`text-[11px] font-impact uppercase tracking-wide leading-relaxed ${card.textColor} opacity-80`}>
            {card.body}
          </p>
        )}
      </div>

      {/* Dots + Button */}
      <div className="flex flex-col items-center gap-5 mt-6 w-full max-w-sm relative z-10">
        <div className="flex gap-2">
          {CARDS.map((_, i) => {
            const dotColor = i === 0 ? '#FFD700' : i === 1 ? '#00FF9D' : '#FF2E63';
            return (
              <div
                key={i}
                className={`rounded-full border-2 border-black transition-all duration-300 ${
                  i === current
                    ? 'w-8 h-3 shadow-[2px_2px_0px_black]'
                    : i < current
                    ? 'w-3 h-3'
                    : 'w-3 h-3 bg-white/20'
                }`}
                style={i <= current ? { backgroundColor: dotColor } : undefined}
              />
            );
          })}
        </div>

        <button
          onClick={() => isLast ? onDone() : setCurrent(c => c + 1)}
          className={`w-full font-impact uppercase text-lg py-4 rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 ${
            isLast ? 'bg-[#00FF9D] text-black' : 'bg-white text-black'
          }`}
        >
          {isLast ? "C'EST PARTI !" : 'SUIVANT'}
          <ArrowRight className="w-5 h-5" strokeWidth={4} />
        </button>
      </div>
    </div>
  );
};

export default OnboardingCards;
