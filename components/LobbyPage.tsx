/**
 * LobbyPage — Waiting room shown after character creation.
 * Player registered in DB, waiting for Master to launch pre-game phases then the game.
 * Two states visible here:
 *  - No pregame active → "waiting for pre-game launch"
 *  - Pre-game active   → handled by PreGamePage (not this component)
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
    <div className="fixed inset-0 bg-[#0A1629] overflow-hidden">
      <BackgroundParticles />

      <div className="absolute inset-0 flex flex-col select-none" style={{ zIndex: 10 }}>

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

        {/* Centre */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">

          {/* Avatar card */}
          <div className="w-24 h-24 bg-[#FFD700] border-[4px] border-black rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_black] text-5xl">
            {getEmoji(avatarId)}
          </div>

          {/* Name + created check */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-5 h-5 bg-[#00F5A0] border-[2px] border-black rounded-full flex items-center justify-center">
                <span className="text-black text-[10px] font-black leading-none">✓</span>
              </div>
              <p className="text-[#00F5A0] font-impact uppercase text-[11px] tracking-widest">
                {isFr ? 'Personnage créé' : 'Character created'}
              </p>
            </div>
            <h2 className="text-4xl font-impact uppercase tracking-tighter text-white italic leading-none">
              {nickname}
            </h2>
          </div>

          {/* Waiting indicator */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-5 py-3 rounded-full">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFD700]" />
            </span>
            <span className="text-[10px] font-impact uppercase tracking-widest text-white/60">
              {isFr ? 'En attente du Bingo Master' : 'Waiting for the Bingo Master'}
            </span>
          </div>

          {/* Info card — what happens next */}
          <div className="w-full max-w-xs bg-white border-[4px] border-black rounded-2xl shadow-[6px_6px_0px_black] overflow-hidden text-left">
            <div className="bg-black px-4 py-2">
              <p className="text-[9px] font-impact uppercase tracking-widest text-white/50">
                {isFr ? 'Ce qui va se passer' : 'What happens next'}
              </p>
            </div>
            <div className="px-4 py-4 space-y-3">

              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#A78BFA] border-2 border-black rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white font-impact text-xs leading-none">1</span>
                </div>
                <div>
                  <p className="text-[12px] font-impact uppercase text-black leading-tight tracking-tight">
                    {isFr ? 'Le Master lance le Pré-Game' : 'Master launches Pre-Game'}
                  </p>
                  <p className="text-[10px] text-black/50 font-impact uppercase tracking-wide mt-0.5">
                    {isFr ? 'Activité commune avant le Bingo' : 'Group activity before Bingo'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#FFD700] border-2 border-black rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-black font-impact text-xs leading-none">2</span>
                </div>
                <div>
                  <p className="text-[12px] font-impact uppercase text-black leading-tight tracking-tight">
                    {isFr ? 'Le Master lance la grille Bingo' : 'Master launches the Bingo grid'}
                  </p>
                  <p className="text-[10px] text-black/50 font-impact uppercase tracking-wide mt-0.5">
                    {isFr ? 'Countdown 3-2-1 puis on joue !' : 'Countdown 3-2-1 then let\'s play!'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#00F5A0] border-2 border-black rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-black font-impact text-xs leading-none">3</span>
                </div>
                <div>
                  <p className="text-[12px] font-impact uppercase text-black leading-tight tracking-tight">
                    {isFr ? 'Ta grille s\'ouvre — bonne soirée !' : 'Your grid opens — have fun!'}
                  </p>
                </div>
              </div>

            </div>

            {/* Note: must wait */}
            <div className="bg-[#FFD700]/10 border-t-[2px] border-black px-4 py-2.5 flex items-center gap-2">
              <span className="text-sm leading-none shrink-0">⏳</span>
              <p className="text-[10px] font-impact uppercase tracking-wide text-black/60 leading-tight">
                {isFr
                  ? 'Le jeu démarre uniquement quand le Master est prêt'
                  : 'Game starts only when the Master is ready'}
              </p>
            </div>
          </div>
        </div>

        {/* Logo bottom */}
        <div className="shrink-0 flex flex-col items-center gap-2 pb-8 opacity-20" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <ShieldLogo className="w-6 h-6 text-white" />
          <p className="text-[8px] font-impact uppercase tracking-widest text-white">Bingo Crawl</p>
        </div>

      </div>
    </div>
  );
};

export default LobbyPage;
