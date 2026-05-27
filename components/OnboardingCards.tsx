
import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingCardsProps {
  onDone: () => void;
}

const CHALLENGE_TYPES = [
  {
    bg: '#00F5A0',
    textColor: 'black' as const,
    badge: 'AUTO',
    icon: '📸',
    titleFr: 'Défi AUTO',
    titleEn: 'AUTO Challenge',
    descFr: 'Valide toi-même avec une photo ou vidéo.',
    descEn: 'Self-validate with a photo or video.',
  },
  {
    bg: '#FF2D6A',
    textColor: 'white' as const,
    badge: 'TÉMOIN',
    icon: '👁️',
    titleFr: 'Défi TÉMOIN',
    titleEn: 'WITNESS Challenge',
    descFr: 'Tu sélectionnes quelqu\'un dans la salle. C\'est lui qui valide sur son téléphone.',
    descEn: 'Pick someone nearby. They validate on their own phone.',
  },
  {
    bg: '#FFD700',
    textColor: 'black' as const,
    badge: 'MASTER',
    icon: '👑',
    titleFr: 'Défi MASTER',
    titleEn: 'MASTER Challenge',
    descFr: 'Fais valider par le Master via son QR code.',
    descEn: 'Get the Master to validate via their QR code.',
  },
  {
    bg: '#FF8C00',
    textColor: 'black' as const,
    badge: 'DUEL',
    icon: '⚔️',
    titleFr: 'Défi DUEL',
    titleEn: 'DUEL Challenge',
    descFr: 'Affronte un autre joueur. Le premier à gagner valide.',
    descEn: 'Face off against another player. First to win validates.',
  },
];

const OnboardingCards: React.FC<OnboardingCardsProps> = ({ onDone }) => {
  const { language } = useLanguage();
  const fr = language === 'fr';

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A1629] flex flex-col items-center justify-center p-5 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">

      <div className="w-full max-w-sm flex flex-col gap-3">

        {/* Header */}
        <div className="text-center mb-1">
          <p className="font-impact uppercase text-[11px] tracking-[0.3em] text-[#FFD700]">
            {fr ? 'LES 4 TYPES DE DÉFIS' : '4 TYPES OF CHALLENGES'}
          </p>
          <h1 className="font-impact uppercase text-3xl italic tracking-tighter text-white leading-none mt-1">
            {fr ? 'Comment ça marche.' : 'How it works.'}
          </h1>
        </div>

        {/* 4 challenge type cards — 2×2 grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {CHALLENGE_TYPES.map((ct, i) => (
            <div
              key={i}
              className="rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] p-3 flex flex-col gap-1.5"
              style={{ background: ct.bg }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-lg leading-none">{ct.icon}</span>
                <span
                  className="font-impact uppercase text-[12px] tracking-tight leading-none"
                  style={{ color: ct.textColor === 'black' ? '#000' : '#fff' }}
                >
                  {fr ? ct.titleFr : ct.titleEn}
                </span>
              </div>
              <p
                className="font-impact uppercase text-[9.5px] tracking-wide leading-snug"
                style={{ color: ct.textColor === 'black' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)' }}
              >
                {fr ? ct.descFr : ct.descEn}
              </p>
            </div>
          ))}
        </div>

        {/* Joker tip */}
        <div className="bg-white border-[3px] border-black shadow-[4px_4px_0px_black] rounded-2xl px-4 py-3 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#00F5A0] shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <p className="font-impact uppercase text-[11px] tracking-tight text-black leading-none">
              {fr ? 'Joker disponible dès le 3ème défi' : 'Joker unlocks after challenge 3'}
            </p>
            <p className="font-impact uppercase text-[9.5px] text-black/50 tracking-wide leading-snug mt-1">
              {fr
                ? 'Un défi ne te convient pas ? Utilise un joker pour en changer.'
                : "Don't like a challenge? Use a joker to swap it."}
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onDone}
          className="w-full bg-[#FFD700] text-black font-impact uppercase text-xl tracking-tight py-4 rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform flex items-center justify-center gap-2"
        >
          {fr ? "C'EST PARTI !" : "LET'S GO!"}
          <ArrowRight className="w-6 h-6" strokeWidth={3.5} />
        </button>

      </div>
    </div>
  );
};

export default OnboardingCards;
