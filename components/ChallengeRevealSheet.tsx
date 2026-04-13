
import React, { useEffect } from 'react';
import { X, HandMetal, Users, Crown, Zap, Star, Instagram } from 'lucide-react';
import { BingoCellData, ChallengeType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ChallengeRevealSheetProps {
  cell: BingoCellData;
  onConfirm: () => void;
  onClose: () => void;
}

const TYPE_CONFIG = {
  [ChallengeType.AUTO]: {
    label: 'SOLO',
    color: '#00F5A0',
    textColor: 'text-black',
    bg: 'bg-[#00F5A0]',
    icon: <HandMetal className="w-5 h-5 text-black" strokeWidth={3} />,
    desc: { fr: 'Tu le fais, tu cliques.', en: 'You did it, you click it.' },
  },
  [ChallengeType.WITNESS]: {
    label: 'TÉMOIN',
    color: '#FF2D6A',
    textColor: 'text-white',
    bg: 'bg-[#FF2D6A]',
    icon: <Users className="w-5 h-5 text-white" strokeWidth={3} />,
    desc: { fr: 'Un pote signe sur ton écran.', en: 'A mate signs on your screen.' },
  },
  [ChallengeType.MASTER]: {
    label: 'MASTER',
    color: '#FFD700',
    textColor: 'text-black',
    bg: 'bg-[#FFD700]',
    icon: <Crown className="w-5 h-5 text-black" strokeWidth={3} fill="currentColor" />,
    desc: { fr: 'Le Game Master valide.', en: 'Game Master validates.' },
  },
};

const ChallengeRevealSheet: React.FC<ChallengeRevealSheetProps> = ({ cell, onConfirm, onClose }) => {
  const { language } = useLanguage();
  const cfg = TYPE_CONFIG[cell.type];
  const isPartner = cell.isPartner ?? false;
  const partnerHandle = cell.partnerHandle;

  const openInstagram = () => {
    if (!partnerHandle) return;
    const appUrl = `instagram://user?username=${partnerHandle}`;
    const webUrl = `https://www.instagram.com/${partnerHandle}`;
    // Try app first, fallback to web after 500ms
    window.location.href = appUrl;
    setTimeout(() => { window.open(webUrl, '_blank'); }, 600);
  };

  // Vibration on open
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/70 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[#0A1629] border-t-[4px] border-x-[4px] border-black rounded-t-[28px] shadow-[0_-8px_0px_black] px-5 pt-5 pb-10">

          {/* Handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
          >
            <X className="w-4 h-4 text-white/50" strokeWidth={3} />
          </button>

          {/* Partner badge */}
          {isPartner && (
            <div className="inline-flex items-center gap-1.5 bg-[#FFD700] border-[2px] border-black rounded-xl px-2.5 py-1 shadow-[2px_2px_0px_black] mb-3">
              <Star className="w-3 h-3 text-black" fill="currentColor" strokeWidth={0} />
              <span className="font-impact text-[9px] uppercase tracking-widest text-black">PARTENAIRE OFFICIEL</span>
            </div>
          )}

          {/* Type badge */}
          <div className={`inline-flex items-center gap-2 ${cfg.bg} border-[2px] border-black rounded-xl px-3 py-1.5 shadow-[3px_3px_0px_black] mb-4`}>
            {cfg.icon}
            <span className={`font-impact text-[11px] uppercase tracking-widest ${cfg.textColor}`}>{cfg.label}</span>
          </div>

          {/* Challenge text */}
          <h2 className="font-impact text-white text-2xl uppercase leading-tight tracking-tight italic mb-2">
            {cell.text}
          </h2>

          {/* How to validate */}
          <p className="font-impact text-[11px] uppercase tracking-widest text-white/30 mb-6">
            {language === 'fr' ? cfg.desc.fr : cfg.desc.en}
          </p>

          {/* Instagram shortcut for partner cells (not for bar-follow/bar-story challenges) */}
          {isPartner && partnerHandle && cell.id !== 2 && cell.id !== 4 && (
            <button
              onClick={openInstagram}
              className="w-full mb-3 flex items-center justify-center gap-2 py-3 rounded-[14px] border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              style={{ background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)' }}
            >
              <Instagram className="w-4 h-4 text-white" strokeWidth={2.5} />
              <span className="font-impact uppercase text-white text-[13px] tracking-widest">
                @{partnerHandle}
              </span>
            </button>
          )}

          {/* CTA */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(40);
              onConfirm();
            }}
            className="w-full font-impact text-xl uppercase py-4 rounded-[16px] border-[3px] border-black shadow-[5px_5px_0px_black] flex items-center justify-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            style={{ backgroundColor: cfg.color, color: cell.type === ChallengeType.WITNESS ? '#fff' : '#000' }}
          >
            <Zap className="w-5 h-5" strokeWidth={3} fill="currentColor" />
            {language === 'fr' ? 'Je relève ce défi' : "I'm taking this one"}
          </button>

          <button
            onClick={onClose}
            className="w-full mt-3 font-impact text-[11px] uppercase tracking-widest text-white/30 py-2 active:text-white/60 transition-colors"
          >
            {language === 'fr' ? 'Pas maintenant' : 'Not now'}
          </button>

        </div>
      </div>
    </>
  );
};

export default ChallengeRevealSheet;
