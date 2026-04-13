
import React, { useState } from 'react';
import { ArrowRight, X, HandMetal, Users, Crown, Gift, Wine, Grid3X3, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingCardsProps {
  onDone: () => void;
}

const OnboardingCards: React.FC<OnboardingCardsProps> = ({ onDone }) => {
  const [current, setCurrent] = useState(0);
  const { language } = useLanguage();
  const fr = language === 'fr';

  // ── Mini taunt cards for the tutorial visual ──────────────────────────────
  const TauntPreview: React.FC<{
    emoji: string; label: string; desc: string; color: string; locked?: boolean; lockLabel?: string;
  }> = ({ emoji, label, desc, color, locked, lockLabel }) => (
    <div
      className={`flex items-center gap-2.5 rounded-xl border-[2px] border-black px-3 py-2 ${locked ? 'opacity-45' : ''}`}
      style={{ backgroundColor: locked ? '#0D1117' : color + '22', borderColor: locked ? '#1A2540' : 'black' }}
    >
      <div
        className="w-8 h-8 rounded-lg border-[1.5px] border-black flex items-center justify-center text-base shrink-0"
        style={{ backgroundColor: locked ? '#0A1629' : color + '44' }}
      >
        {locked ? '🔒' : emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-impact text-[10px] uppercase italic tracking-tight leading-none truncate ${locked ? 'text-white/30' : 'text-white'}`}>
          {label}
        </p>
        <p className={`font-impact text-[8px] uppercase tracking-widest mt-0.5 ${locked ? 'text-white/20' : 'text-white/40'}`}>
          {locked ? lockLabel : desc}
        </p>
      </div>
      {!locked && (
        <div className="w-6 h-6 rounded-md border border-black flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
          <Zap className="w-3 h-3 text-black" fill="currentColor" strokeWidth={0} />
        </div>
      )}
    </div>
  );

  const CARDS = [
    {
      color: '#FFD700',
      textColor: 'text-black',
      icon: <Grid3X3 className="w-10 h-10 text-black" strokeWidth={2.5} />,
      tag: fr ? '01 / 04' : '01 / 04',
      title: fr ? '25 défis\nà relever' : '25 challenges\nto crush',
      body: fr
        ? "Ta grille contient 25 défis à compléter dans les bars de la soirée. Plus tu en coches, mieux c'est."
        : "Your grid has 25 challenges to complete across the bars tonight. The more you tick off, the better.",
      visual: (
        <div className="grid grid-cols-5 gap-1 w-36">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className={`h-5 rounded border-2 border-black ${i < 7 ? 'bg-black' : 'bg-white/60'}`} />
          ))}
        </div>
      ),
    },
    {
      color: '#1A1A2E',
      textColor: 'text-white',
      icon: <HandMetal className="w-10 h-10 text-white" strokeWidth={2.5} />,
      tag: '02 / 04',
      title: fr ? '3 façons\nde valider' : '3 ways\nto validate',
      body: '',
      visual: (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-3 bg-[#00F5A0] border-[3px] border-black rounded-xl px-3 py-2.5 shadow-[3px_3px_0px_black]">
            <HandMetal className="w-5 h-5 shrink-0 text-black" strokeWidth={3} />
            <div className="flex flex-col leading-none">
              <span className="font-impact uppercase text-[11px] tracking-tight text-black font-black">Solo</span>
              <span className="font-impact uppercase text-[9px] tracking-tight text-black/60 mt-0.5">
                {fr ? 'Tu l\'as fait, tu valides toi-même' : 'You did it, you click it'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#FF2D6A] border-[3px] border-black rounded-xl px-3 py-2.5 shadow-[3px_3px_0px_black]">
            <Users className="w-5 h-5 shrink-0 text-white" strokeWidth={3} />
            <div className="flex flex-col leading-none">
              <span className="font-impact uppercase text-[11px] tracking-tight text-white font-black">
                {fr ? 'Témoin' : 'Witness'}
              </span>
              <span className="font-impact uppercase text-[9px] tracking-tight text-white/60 mt-0.5">
                {fr ? 'Un pote signe sur ton écran' : 'A mate signs on your screen'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#FFD700] border-[3px] border-black rounded-xl px-3 py-2.5 shadow-[3px_3px_0px_black]">
            <Crown className="w-5 h-5 shrink-0 text-black" strokeWidth={3} fill="currentColor" />
            <div className="flex flex-col leading-none">
              <span className="font-impact uppercase text-[11px] tracking-tight text-black font-black">Master</span>
              <span className="font-impact uppercase text-[9px] tracking-tight text-black/60 mt-0.5">
                {fr ? 'Le Game Master valide en direct' : 'The Game Master validates it'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      color: '#0A1629',
      textColor: 'text-white',
      icon: <Gift className="w-10 h-10 text-[#FFD700]" strokeWidth={2.5} />,
      tag: '03 / 04',
      title: fr ? 'Fais des\nlignes. Gagne.' : 'Make lines.\nWin.',
      body: '',
      visual: (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-3 bg-[#00F5A0] border-[3px] border-black rounded-xl px-3 py-2.5 shadow-[3px_3px_0px_black]">
            <Wine className="w-5 h-5 text-black shrink-0" strokeWidth={3} />
            <div className="flex flex-col leading-none">
              <span className="font-impact uppercase text-[11px] tracking-tight text-black font-black">
                {fr ? '1 ligne complète' : '1 full line'}
              </span>
              <span className="font-impact uppercase text-[9px] tracking-tight text-black/60 mt-0.5">
                {fr ? '1 shot offert au bar 🥃' : '1 free shot at the bar 🥃'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#FF2D6A] border-[3px] border-black rounded-xl px-3 py-2.5 shadow-[3px_3px_0px_black]">
            <Gift className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
            <div className="flex flex-col leading-none">
              <span className="font-impact uppercase text-[11px] tracking-tight text-white font-black">
                {fr ? 'Toutes les 2 lignes' : 'Every 2 lines'}
              </span>
              <span className="font-impact uppercase text-[9px] tracking-tight text-white/60 mt-0.5">
                {fr ? '1 cadeau mystère 🎁' : '1 mystery prize 🎁'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#FFD700] border-[3px] border-black rounded-xl px-3 py-2.5 shadow-[3px_3px_0px_black]">
            <Crown className="w-5 h-5 text-black shrink-0" strokeWidth={3} fill="currentColor" />
            <div className="flex flex-col leading-none">
              <span className="font-impact uppercase text-[11px] tracking-tight text-black font-black">
                {fr ? 'Grille 100% complète' : 'Full grid 100%'}
              </span>
              <span className="font-impact uppercase text-[9px] tracking-tight text-black/60 mt-0.5">
                {fr ? 'Statut LÉGENDAIRE + surprise 👑' : 'LEGENDARY status + surprise 👑'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      color: '#0A1629',
      textColor: 'text-white',
      icon: <Zap className="w-10 h-10 text-[#FF2D6A]" strokeWidth={2.5} fill="currentColor" />,
      tag: '04 / 04',
      title: fr ? 'Taunts\n⚡ L\'arsenal' : 'Taunts\n⚡ the arsenal',
      body: fr
        ? '3 armes dès le début. Toutes les 30 min, une nouvelle se débloque — unique pour toi.'
        : '3 weapons from the start. Every 30 min, a new one unlocks — unique to you.',
      visual: (
        <div className="flex flex-col gap-2 w-full">
          {/* 3 unlocked taunts */}
          <TauntPreview emoji="🥶" label={fr ? 'Freeze' : 'Freeze'}           desc={fr ? 'Bloqué 35 sec' : 'Locked 35 sec'}        color="#93C5FD" />
          <TauntPreview emoji="🧊" label={fr ? 'Ice Block' : 'Ice Block'}     desc={fr ? 'Grille sous la glace' : 'Grid under ice'} color="#7DD3FC" />
          <TauntPreview emoji="🎯" label={fr ? 'Tiny Target' : 'Tiny Target'} desc={fr ? "Bouton qui s'échappe" : 'Button runs away'} color="#86EFAC" />

          {/* Separator */}
          <div className="flex items-center gap-2 my-1 px-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-impact text-white/20 text-[7px] uppercase tracking-widest">
              {fr ? 'dans 30 min' : 'in 30 min'}
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* 1 locked taunt */}
          <TauntPreview
            emoji="💦" label={fr ? 'Blob' : 'Blob'} desc="" color="#6EE7B7"
            locked lockLabel={fr ? 'Disponible dans 30:00' : 'Available in 30:00'}
          />
        </div>
      ),
    },
  ];

  const card   = CARDS[current];
  const isLast = current === CARDS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A1629] flex flex-col items-center justify-center p-6 animate-in fade-in duration-200 overflow-hidden">

      {/* Skip */}
      <button
        onClick={onDone}
        className="absolute top-6 right-6 flex items-center gap-1 bg-black/50 px-3 py-1.5 rounded-full border-2 border-white/20 text-white/70 active:text-white active:border-white/40 transition-all z-10"
      >
        <X className="w-3.5 h-3.5" strokeWidth={3} />
        <span className="text-[10px] font-impact uppercase tracking-widest">
          {fr ? 'Passer' : 'Skip'}
        </span>
      </button>

      {/* Card */}
      <div
        key={`${current}-${language}`}
        className="w-full max-w-sm rounded-[2rem] border-[4px] border-black shadow-[10px_10px_0px_black] p-7 flex flex-col gap-5 animate-in fade-in slide-in-from-right-8 duration-300 relative z-10"
        style={{ backgroundColor: card.color }}
      >
        {/* Tag + icon */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-impact uppercase tracking-widest px-2 py-1 rounded-md ${current === 0 ? 'bg-black text-[#FFD700]' : 'bg-[#FFD700] text-black'}`}>
            {card.tag}
          </span>
          <div className={`w-16 h-16 border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_black] ${
            current === 0 ? 'bg-white' : current === 1 ? 'bg-[#00F5A0]' : current === 2 ? 'bg-[#1A1A2E]' : 'bg-[#FF2D6A]/15'
          }`}>
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

      {/* Dots + button */}
      <div className="flex flex-col items-center gap-5 mt-6 w-full max-w-sm relative z-10">
        <div className="flex gap-2">
          {CARDS.map((_, i) => {
            const dotColors = ['#FFD700', '#00F5A0', '#FFD700', '#FF2D6A'];
            return (
              <div
                key={i}
                className={`rounded-full border-2 border-black transition-all duration-300 ${
                  i === current ? 'w-8 h-3 shadow-[2px_2px_0px_black]' : 'w-3 h-3'
                } ${i > current ? 'bg-white/20' : ''}`}
                style={i <= current ? { backgroundColor: dotColors[i] } : undefined}
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
          {isLast ? (fr ? "C'EST PARTI !" : "LET'S GO!") : (fr ? 'SUIVANT' : 'NEXT')}
          <ArrowRight className="w-5 h-5" strokeWidth={4} />
        </button>
      </div>
    </div>
  );
};

export default OnboardingCards;
