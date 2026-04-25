/**
 * LobbyPage — Salle d'attente après la création du personnage.
 * Affiche les règles condensées, l'avatar et le pseudo du joueur.
 * Le jeu démarre quand le Master lance le countdown 3-2-1.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import BackgroundParticles from './BackgroundParticles';
import ShieldLogo from './ShieldLogo';

const EMOJI_MAP: Record<string, string> = {
  PartyKing: '👑', NightOwl: '🦉', FireStarter: '🔥', IceCold: '🧊',
  WildCard: '🃏', SocialButterfly: '🦋', Maverick: '🎯', DragonHeart: '🐉',
};
const getEmoji = (id: string) => EMOJI_MAP[id] || id || '🎲';

interface LobbyPageProps {
  nickname: string;
  avatarId: string;
  onCrownClick?: () => void;
  onLeave?: () => void;
}

const RULES_FR = [
  { emoji: '🎯', text: 'Valide des défis pour remplir ta grille 5×5' },
  { emoji: '🤝', text: 'Les défis TÉMOIN nécessitent un autre joueur' },
  { emoji: '🏆', text: 'Complète une ligne → +1 Joker. Bingo = gloire éternelle !' },
];

const RULES_EN = [
  { emoji: '🎯', text: 'Complete challenges to fill your 5×5 grid' },
  { emoji: '🤝', text: 'WITNESS challenges need another player to confirm' },
  { emoji: '🏆', text: 'Complete a row → +1 Joker. Full grid = eternal glory!' },
];

const LobbyPage: React.FC<LobbyPageProps> = ({ nickname, avatarId, onCrownClick, onLeave }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const rules = isFr ? RULES_FR : RULES_EN;

  return (
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col select-none">
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <BackgroundParticles />
      </div>

      <div className="relative flex flex-col flex-1 min-h-0" style={{ zIndex: 10 }}>

        {/* Hidden master access — top left */}
        <div className="shrink-0 flex justify-start px-4" style={{ paddingTop: 'max(48px, env(safe-area-inset-top, 0px) + 12px)' }}>
          <button
            onClick={onCrownClick}
            className="p-3 text-white/10 active:text-white/30 transition-colors"
            aria-label="Master access"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </button>
        </div>

        {/* Contenu central */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 text-center">

          {/* Avatar + nom */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 bg-[#FFD700] border-[4px] border-black rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_black] text-6xl animate-in zoom-in duration-300">
              {getEmoji(avatarId)}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-4 h-4 bg-[#00F5A0] border-[2px] border-black rounded-full flex items-center justify-center">
                  <span className="text-black text-[8px] font-black leading-none">✓</span>
                </div>
                <p className="text-[#00F5A0] font-impact uppercase text-[10px] tracking-widest">
                  {isFr ? 'Prêt à jouer' : 'Ready to play'}
                </p>
              </div>
              <h2 className="text-4xl font-impact uppercase tracking-tighter text-white italic leading-none">
                {nickname}
              </h2>
            </div>
          </div>

          {/* Règles condensées — carte blanche */}
          <div className="w-full max-w-xs bg-white border-[4px] border-black rounded-2xl shadow-[6px_6px_0px_black] overflow-hidden text-left animate-in slide-in-from-bottom-2 duration-400">
            <div className="bg-black px-4 py-2.5 flex items-center gap-2">
              <span className="text-base leading-none">📋</span>
              <p className="text-[10px] font-impact uppercase tracking-widest text-white">
                {isFr ? 'Les règles en 3 points' : '3 rules to remember'}
              </p>
            </div>
            <div className="px-4 py-4 space-y-3.5">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-[#FFD700] border-[2px] border-black rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0px_black]">
                    <span className="text-sm leading-none">{rule.emoji}</span>
                  </div>
                  <p className="text-[12px] font-impact uppercase text-black leading-tight tracking-tight pt-0.5">
                    {rule.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Indicateur d'attente */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-5 py-3 rounded-full">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFD700]" />
            </span>
            <span className="text-[10px] font-impact uppercase tracking-widest text-white/60">
              {isFr ? 'En attente du Bingo Master…' : 'Waiting for the Bingo Master…'}
            </span>
          </div>

        </div>

        {/* Escape hatch — if master never starts */}
        {onLeave && (
          <div className="shrink-0 flex justify-center pb-2">
            <button
              onClick={onLeave}
              className="text-white/20 font-impact text-[9px] uppercase tracking-widest py-2 px-4 hover:text-white/40 transition-colors"
            >
              {isFr ? 'Quitter la session' : 'Leave session'}
            </button>
          </div>
        )}

        {/* Logo bas */}
        <div className="shrink-0 flex flex-col items-center gap-2 opacity-20" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <ShieldLogo className="w-6 h-6 text-white" />
          <p className="text-[8px] font-impact uppercase tracking-widest text-white">Bingo Crawl</p>
        </div>

      </div>
    </div>
  );
};

export default LobbyPage;
