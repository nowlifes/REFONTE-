
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingCardsProps {
  onDone: () => void;
}

const TIPS = [
  {
    icon: '👁️',
    bg: '#FF2D6A',
    textColor: 'white' as const,
    titleFr: 'Défi TÉMOIN',
    titleEn: 'WITNESS Challenge',
    descFr: 'Tu fais le défi, tu passes le téléphone.',
    descEn: 'Do the challenge, hand the phone over.',
  },
  {
    icon: '✅',
    bg: '#00F5A0',
    textColor: 'black' as const,
    titleFr: 'Le témoin confirme',
    titleEn: 'Witness confirms',
    descFr: 'Il tape "Confirmé" s\'il t\'a vu faire.',
    descEn: 'They tap "Confirmed" if they saw you.',
  },
  {
    icon: '⚠️',
    bg: '#FFD700',
    textColor: 'black' as const,
    titleFr: 'Choisis bien',
    titleEn: 'Choose wisely',
    descFr: 'Prends quelqu\'un qui était vraiment là.',
    descEn: 'Pick someone who actually witnessed it.',
  },
  {
    icon: '🔁',
    bg: '#FF8C00',
    textColor: 'black' as const,
    titleFr: 'Refus ? Réessaie',
    titleEn: 'Refused? Try again',
    descFr: 'Si refusé, choisis un autre témoin.',
    descEn: 'If rejected, pick a different witness.',
  },
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
            {fr ? 'MODE TÉMOIN' : 'WITNESS MODE'}
          </p>
          <h1 className="font-impact uppercase text-4xl italic tracking-tighter text-white leading-none mt-1">
            {fr ? 'Comment\nça marche.' : 'How it\nworks.'}
          </h1>
        </div>

        {/* 4 conseils — 2×2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {TIPS.map((tip, i) => (
            <div
              key={i}
              className="rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] p-3 flex flex-col gap-1.5"
              style={{ background: tip.bg }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl leading-none">{tip.icon}</span>
                <span
                  className="font-impact uppercase text-[13px] tracking-tight leading-none"
                  style={{ color: tip.textColor }}
                >
                  {fr ? tip.titleFr : tip.titleEn}
                </span>
              </div>
              <p
                className="font-impact uppercase text-[10px] tracking-wide leading-snug"
                style={{ color: tip.textColor === 'black' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.70)' }}
              >
                {fr ? tip.descFr : tip.descEn}
              </p>
            </div>
          ))}
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
