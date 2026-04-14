/**
 * LobbyPage — Waiting room shown after character creation.
 * Player is registered in DB but game hasn't started yet.
 * Master controls when to launch pregame phases and the actual game.
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
}

const LobbyPage: React.FC<LobbyPageProps> = ({ nickname, avatarId, onCrownClick }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  return (
    <div className="min-h-[100dvh] bg-[#0A1629] flex flex-col items-center justify-between p-8 select-none relative overflow-hidden">
      <BackgroundParticles />

      {/* Hidden master access — top left */}
      <div className="w-full flex justify-start relative z-10">
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

      {/* Centre */}
      <div className="flex flex-col items-center gap-8 text-center relative z-10">

        {/* Avatar card */}
        <div className="w-28 h-28 bg-[#FFD700] border-[4px] border-black rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_black] text-6xl">
          {getEmoji(avatarId)}
        </div>

        {/* Name */}
        <div className="space-y-1">
          <p className="text-white/40 font-impact uppercase text-[10px] tracking-widest">
            {isFr ? 'Prêt à jouer' : 'Ready to play'}
          </p>
          <h2 className="text-4xl font-impact uppercase tracking-tighter text-white italic leading-none">
            {nickname}
          </h2>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F5A0] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F5A0]" />
          </span>
          <span className="text-[10px] font-impact uppercase tracking-widest text-white/60">
            {isFr ? 'En attente du Bingo Master' : 'Waiting for the Bingo Master'}
          </span>
        </div>

        {/* Info */}
        <div className="w-full max-w-xs bg-white border-[4px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_black] text-left">
          <p className="text-[9px] font-impact uppercase tracking-widest text-black/40 mb-3">
            {isFr ? 'La suite ?' : 'What\'s next?'}
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#FF8C00] border-2 border-black rounded-lg flex items-center justify-center shrink-0 font-impact text-xs">🎭</span>
              <span className="text-sm font-impact uppercase text-black leading-tight tracking-tight">
                {isFr ? 'Le Master lance un mini-jeu pré-game' : 'Master launches a pre-game mini-game'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#FFD700] border-2 border-black rounded-lg flex items-center justify-center shrink-0 font-impact text-xs">🎮</span>
              <span className="text-sm font-impact uppercase text-black leading-tight tracking-tight">
                {isFr ? 'Puis la grille Bingo s\'ouvre !' : 'Then the Bingo grid opens!'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Logo bottom */}
      <div className="relative z-10 flex flex-col items-center gap-2 opacity-20">
        <ShieldLogo className="w-6 h-6 text-white" />
        <p className="text-[8px] font-impact uppercase tracking-widest text-white">Bingo Crawl</p>
      </div>
    </div>
  );
};

export default LobbyPage;
