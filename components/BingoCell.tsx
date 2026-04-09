
import React from 'react';
import { Check, Lock, Zap, Star } from 'lucide-react';
import { BingoCellData, ChallengeType, CellStatus } from '../types';

interface BingoCellProps {
  data: BingoCellData;
  onClick: (id: number) => void;
  isWinning: boolean;
  winningIndex?: number;
  isFeverTarget?: boolean;
  isLocked?: boolean;
  isUnlocking?: boolean;
  isSpotlight?: boolean;
}

const BingoCell: React.FC<BingoCellProps> = React.memo(({
  data, onClick, isWinning, winningIndex = -1, isFeverTarget, isLocked, isUnlocking, isSpotlight
}) => {
  const { id, text, type, status, isPartner } = data;
  const isValidated = status === CellStatus.VALIDATED;

  const getColors = () => {
    if (isLocked) return 'bg-[#0D1527] text-white/20 border-2 border-white/10 border-dashed mystery-halo';
    switch (type) {
      case ChallengeType.MASTER:  return 'bg-[#FFD93D] text-black';
      case ChallengeType.WITNESS: return 'bg-[#7C3AED] text-white';
      default:                    return 'bg-[#00F5A0] text-black';
    }
  };

  // Short label: first 1-2 meaningful words, max 10 chars
  const STOP_WORDS = new Set(['tu', 'je', 'il', 'de', 'du', 'un', 'une', 'le', 'la', 'les', 'des', 'à', 'au', 'en', 'et', 'ou', 'sur', 'par', 'the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'do', 'get', 'your']);
  const getShortLabel = (): string => {
    const words = text.split(/\s+/);
    let label = '';
    for (const w of words) {
      const clean = w.replace(/[^a-zA-ZÀ-ÿ]/g, '');
      if (clean.length >= 3 && !STOP_WORDS.has(clean.toLowerCase())) {
        label = clean.toUpperCase();
        break;
      }
    }
    if (!label) label = words[0]?.toUpperCase() || text.slice(0, 8).toUpperCase();
    return label.length > 10 ? label.slice(0, 9) + '.' : label;
  };

  const winDelay = isWinning && winningIndex >= 0 ? `${winningIndex * 80}ms` : '0ms';

  return (
    <div
      className="relative w-[66px] h-[66px] select-none perspective-1000 touch-manipulation"
      style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
      onClick={() => !isLocked && status === CellStatus.EMPTY && onClick(id)}
    >
      <div
        className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isValidated ? 'rotate-y-180' : ''} ${isUnlocking ? 'cell-mystery-unlock' : ''}`}
      >
        {/* FRONT */}
        <div
          className={`absolute inset-0 backface-hidden rounded-[8px] flex items-center justify-center text-center p-[3px] overflow-hidden
            ${getColors()}
            ${isPartner && !isValidated ? 'ring-[2px] ring-[#FFD700] ring-offset-[1px] ring-offset-black' : ''}
            ${isFeverTarget && !isLocked ? 'ring-2 ring-white animate-pulse' : ''}
            ${isSpotlight ? 'ring-[3px] ring-white ring-offset-[2px] ring-offset-black animate-pulse' : ''}
            ${isLocked ? 'animate-pulse' : ''}
            ${isWinning ? 'cell-winning' : ''}
          `}
          style={isWinning ? { animationDelay: winDelay } : undefined}
        >
          {isLocked ? (
            <div className="flex flex-col items-center gap-0.5">
              <Lock className="w-4 h-4 text-[#FFD700]/60" strokeWidth={2} />
              <span className="text-[7px] font-impact uppercase tracking-tight leading-none text-[#FFD700]/50">5 pts</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-0.5 pointer-events-none w-full px-1 relative">
              {/* Partner badge — top-right corner */}
              {isPartner && (
                <div className="absolute -top-[3px] -right-[3px] w-4 h-4 bg-[#FFD700] border border-black rounded-bl-md rounded-tr-[6px] flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-black" fill="currentColor" strokeWidth={0} />
                </div>
              )}
              {isSpotlight && (
                <Zap className="w-3 h-3 mb-0.5 shrink-0" fill="currentColor" strokeWidth={0} style={{ color: type === ChallengeType.AUTO ? '#000' : type === ChallengeType.WITNESS ? '#fff' : '#000' }} />
              )}
              <span
                className="font-impact uppercase leading-none text-center w-full"
                style={{ fontSize: getShortLabel().length > 7 ? '11px' : '14px', letterSpacing: '-0.5px' }}
              >
                {getShortLabel()}
              </span>
            </div>
          )}
        </div>

        {/* BACK (validated) */}
        <div
          className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[8px] flex items-center justify-center bg-[#FFD93D]
            ${isWinning ? 'cell-winning' : ''}
          `}
          style={isWinning ? { animationDelay: winDelay } : undefined}
        >
          <div className="w-10 h-10 bg-[#00F5A0] rounded-full flex items-center justify-center shadow-sm">
            <Check className="w-6 h-6 text-black" strokeWidth={5} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default BingoCell;
