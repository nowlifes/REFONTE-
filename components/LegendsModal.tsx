
import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LegendsModalProps {
  onClose: () => void;
}

const RULES_FR = [
  { emoji: '🎯', title: 'Accomplis des défis', desc: 'Tape sur une case pour voir ton défi. Valide-le une fois accompli.' },
  { emoji: '👥', title: 'Solo, Témoin ou Master', desc: 'SOLO = tu te débrouilles. TÉMOIN = un joueur signe. MASTER = le maestro valide en direct.' },
  { emoji: '🏆', title: 'Fais des lignes', desc: 'Complète une ligne (horizontal, vertical ou diagonal) pour gagner un joker.' },
  { emoji: '⚡', title: 'Lance des sabotages', desc: 'Utilise tes jokers pour envoyer des effets à tes adversaires et les ralentir.' },
  { emoji: '👑', title: 'Obéis au Master', desc: 'Le Master mène la soirée. Certains défis nécessitent son accord direct.' },
];

const RULES_EN = [
  { emoji: '🎯', title: 'Complete challenges', desc: 'Tap a cell to reveal your challenge. Validate it once done.' },
  { emoji: '👥', title: 'Solo, Witness or Master', desc: 'SOLO = do it yourself. WITNESS = get a player to sign. MASTER = the host validates live.' },
  { emoji: '🏆', title: 'Make lines', desc: 'Complete a line (horizontal, vertical or diagonal) to earn a joker.' },
  { emoji: '⚡', title: 'Send sabotages', desc: 'Use your jokers to send effects to rivals and slow them down.' },
  { emoji: '👑', title: 'Obey the Master', desc: 'The Master runs the night. Some challenges need their live approval.' },
];

const EXTRA_FR = [
  { emoji: '🥶', title: 'Freeze', desc: 'Bloque un joueur pendant 35 secondes.' },
  { emoji: '🧊', title: 'Bloc de glace', desc: 'Recouvre la grille d\'un bloc de glace.' },
  { emoji: '🎯', title: 'Micro-cible', desc: 'Rétrécit les cases de l\'adversaire.' },
  { emoji: '💦', title: 'Blob', desc: 'Fait trembler la grille de l\'adversaire.' },
  { emoji: '🔦', title: 'Lampe torche', desc: 'Éteint l\'écran sauf sous le doigt.' },
];

const EXTRA_EN = [
  { emoji: '🥶', title: 'Freeze', desc: 'Freezes a player for 35 seconds.' },
  { emoji: '🧊', title: 'Ice block', desc: 'Covers the rival\'s grid with an ice block.' },
  { emoji: '🎯', title: 'Tiny target', desc: 'Shrinks the rival\'s cells.' },
  { emoji: '💦', title: 'Blob', desc: 'Makes the rival\'s grid shake.' },
  { emoji: '🔦', title: 'Flashlight', desc: 'Turns off the screen except where you touch.' },
];

const LegendsModal: React.FC<LegendsModalProps> = ({ onClose }) => {
  const { language } = useLanguage();
  const [showExtra, setShowExtra] = useState(false);
  const rules = language === 'fr' ? RULES_FR : RULES_EN;
  const extra = language === 'fr' ? EXTRA_FR : EXTRA_EN;
  const isFr = language === 'fr';

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0A1629] border-[3px] border-white/15 rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_-8px_40px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="shrink-0 bg-[#FFD700] border-b-[3px] border-black px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-impact text-black uppercase text-[22px] italic tracking-tight leading-none">
              {isFr ? 'Les règles' : 'The rules'}
            </h2>
            <p className="font-impact text-black/50 uppercase text-[10px] tracking-widest mt-0.5">
              {isFr ? '5 règles, 30 secondes' : '5 rules, 30 seconds'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-black border-[2px] border-black rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
          >
            <X size={20} strokeWidth={3} className="text-white" />
          </button>
        </div>

        {/* Rules list */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 no-scrollbar">
          {rules.map((rule, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5 animate-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="text-2xl shrink-0 leading-none mt-0.5">{rule.emoji}</span>
              <div className="min-w-0">
                <div className="font-impact uppercase text-white text-[13px] tracking-wide">{rule.title}</div>
                <div className="font-impact text-white/45 uppercase text-[10px] tracking-widest leading-relaxed mt-0.5">{rule.desc}</div>
              </div>
            </div>
          ))}

          {/* En savoir plus — taunts */}
          <button
            onClick={() => setShowExtra(x => !x)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/3 border border-white/8 rounded-2xl text-white/40 hover:text-white/60 transition-all active:bg-white/8"
          >
            <span className="font-impact uppercase text-[10px] tracking-widest">
              {isFr ? '⚡ Détails des sabotages' : '⚡ Sabotage details'}
            </span>
            {showExtra ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
          </button>

          {showExtra && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-200">
              {extra.map((t, i) => (
                <div key={i} className="bg-white/5 border border-white/8 rounded-2xl p-3">
                  <span className="text-xl block mb-1.5">{t.emoji}</span>
                  <div className="font-impact text-white uppercase text-[11px] italic leading-none">{t.title}</div>
                  <div className="font-impact text-white/40 uppercase text-[9px] tracking-widest leading-relaxed mt-1">{t.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pb-6 pt-3 border-t border-white/8">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#FFD700] border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] font-impact uppercase text-black text-[14px] tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isFr ? "C'est parti ! 🚀" : "Let's go! 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegendsModal;
