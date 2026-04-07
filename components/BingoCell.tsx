
import React from 'react';
import { Check, Lock } from 'lucide-react';
import { BingoCellData, ChallengeType, CellStatus } from '../types';

interface BingoCellProps {
  data: BingoCellData;
  onClick: (id: number) => void;
  isWinning: boolean;
  winningIndex?: number;
  isFeverTarget?: boolean;
  isLocked?: boolean;
  isUnlocking?: boolean;
}

const BingoCell: React.FC<BingoCellProps> = React.memo(({
  data, onClick, isWinning, winningIndex = -1, isFeverTarget, isLocked, isUnlocking
}) => {
  const { id, text, type, status } = data;
  const isValidated = status === CellStatus.VALIDATED;

  const getColors = () => {
    if (isLocked) return 'bg-[#0D1527] text-white/20 border-2 border-white/10 border-dashed mystery-halo';
    switch (type) {
      case ChallengeType.MASTER:  return 'bg-[#FFD93D] text-black';
      case ChallengeType.WITNESS: return 'bg-[#FF2D6A] text-white';
      default:                    return 'bg-[#00F5A0] text-black';
    }
  };

  const getFontSize = () => {
    const len = text.length;
    if (len > 40) return '8px';
    if (len > 28) return '9px';
    if (len > 20) return '10px';
    if (len > 14) return '11px';
    return '12px';
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
            ${isFeverTarget && !isLocked ? 'ring-2 ring-white animate-pulse' : ''}
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
            <div
              className="font-impact font-bold uppercase pointer-events-none w-full"
              style={{ fontSize: getFontSize(), lineHeight: '1.1', wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'none' }}
            >
              {text}
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
