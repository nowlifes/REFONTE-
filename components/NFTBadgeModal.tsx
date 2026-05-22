
import React from 'react';
import { X, Lock, Trophy, Star, Shield, Crown } from 'lucide-react';
import { Badge } from '../types';
import { BADGE_CONFIG } from '../constants';

interface NFTBadgeModalProps {
  nickname: string;
  score: number;
  badges: Badge[];
  onClose: () => void;
}

type Tier = {
  label: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
};

function getTier(count: number): Tier {
  if (count >= 6) return { label: 'MYTHIC',   color: '#FF2D6A', bg: '#2A0010', Icon: Crown  };
  if (count >= 3) return { label: 'LEGEND',   color: '#FFD700', bg: '#1A1000', Icon: Trophy };
  if (count >= 1) return { label: 'EXPLORER', color: '#00F5A0', bg: '#001A0E', Icon: Star   };
  return               { label: 'ROOKIE',   color: '#6B7280', bg: '#101828', Icon: Shield  };
}

const NFTBadgeModal: React.FC<NFTBadgeModalProps> = ({ nickname, score, badges, onClose }) => {
  const total = Object.keys(BADGE_CONFIG).length;
  const unlocked = badges.length;
  const tier = getTier(unlocked);
  const TierIcon = tier.Icon;
  const pct = (unlocked / total) * 100;

  const nextAt    = unlocked < 1 ? 1 : unlocked < 3 ? 3 : unlocked < 6 ? 6 : null;
  const nextLabel = unlocked < 1 ? 'EXPLORER' : unlocked < 3 ? 'LEGEND' : unlocked < 6 ? 'MYTHIC' : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A1629]/95 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-sm bg-white border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_black] overflow-hidden flex flex-col relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 text-white/70 active:scale-90 transition-transform cursor-pointer"
        >
          <X className="w-6 h-6" strokeWidth={3} />
        </button>

        {/* ── Header : rang + nickname + progress ── */}
        <div
          className="border-b-[4px] border-black relative overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${tier.bg} 0%, #0A1629 100%)` }}
        >
          {/* Glow halo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${tier.color}30, transparent 70%)` }}
          />

          <div className="relative flex items-center gap-4 px-5 pt-5 pb-4">
            {/* Tier icon */}
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0px_black]"
              style={{
                background: `linear-gradient(135deg, ${tier.color}22, ${tier.color}08)`,
                border: `3px solid ${tier.color}`,
              }}
            >
              <TierIcon className="w-8 h-8" style={{ color: tier.color }} />
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <div
                className="text-[9px] font-impact tracking-[0.2em] uppercase mb-0.5"
                style={{ color: `${tier.color}99` }}
              >
                Rang actuel
              </div>
              <div
                className="text-2xl font-impact uppercase tracking-tighter leading-none"
                style={{ color: tier.color }}
              >
                {tier.label}
              </div>
              <div className="text-sm font-impact uppercase text-white/60 italic truncate mt-0.5">
                {nickname}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative px-5 pb-4">
            <div
              className="flex justify-between text-[9px] font-impact uppercase tracking-widest mb-1.5"
              style={{ color: `${tier.color}70` }}
            >
              <span>{unlocked}/{total} badges</span>
              {nextAt && <span>{nextAt - unlocked} pour {nextLabel}</span>}
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden" style={{ border: `1px solid ${tier.color}30` }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${tier.color}99, ${tier.color})` }}
              />
            </div>
          </div>
        </div>

        {/* ── Badge grid ── */}
        <div className="p-4 bg-[#0D1E3A]">
          <div className="text-[9px] font-impact text-white/30 uppercase tracking-[0.2em] mb-3">
            Achievements · {unlocked}/{total}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(BADGE_CONFIG).map(([type, cfg]) => {
              const isUnlocked = badges.some(b => b.badge_type === type);
              return (
                <div
                  key={type}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  style={
                    isUnlocked
                      ? {
                          background: `linear-gradient(135deg, ${cfg.gradient[0]}, ${cfg.gradient[1]})`,
                          border: '2.5px solid #000',
                          boxShadow: '3px 3px 0px #000',
                        }
                      : {
                          background: '#0A1629',
                          border: '2px solid rgba(255,255,255,0.07)',
                        }
                  }
                >
                  {isUnlocked ? (
                    <>
                      <span className="text-2xl leading-none">{cfg.emoji}</span>
                      <span className="text-[7px] font-impact text-white uppercase tracking-tight leading-none text-center px-0.5">
                        {cfg.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-white/15" strokeWidth={2.5} />
                      <span className="text-[7px] font-impact text-white/20 uppercase tracking-tight leading-none text-center px-0.5">
                        {cfg.name}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="bg-black border-t-[4px] border-black px-5 py-3 flex justify-between items-center">
          <div>
            <div className="text-[8px] font-impact text-white/30 uppercase tracking-widest">Score</div>
            <div className="text-[#FFD700] font-impact text-xl italic leading-none">{score} pts</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-impact text-white/30 uppercase tracking-widest">Badges</div>
            <div className="font-impact text-xl italic leading-none" style={{ color: tier.color }}>
              {unlocked}<span className="text-white/30 text-sm">/{total}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NFTBadgeModal;
