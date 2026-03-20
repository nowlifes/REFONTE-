
import React from 'react';
import { Check } from 'lucide-react';
import { BingoCellData, ChallengeType, CellStatus } from '../types';

interface BingoCellProps {
  data: BingoCellData;
  onClick: (id: number) => void;
  isWinning: boolean;
  isFeverTarget?: boolean;
}

const BingoCell: React.FC<BingoCellProps> = React.memo(({ data, onClick, isWinning, isFeverTarget }) => {
  const { id, text, type, status } = data;
  const isValidated = status === CellStatus.VALIDATED;

  // Colors strictly follow the requested layout
  const getColors = () => {
    switch (type) {
      case ChallengeType.MASTER: 
        return 'bg-[#FFD93D] text-black'; // Yellow
      case ChallengeType.WITNESS: 
        return 'bg-[#FF2D6A] text-white'; // Bright Pink
      default: 
        return 'bg-[#00F5A0] text-black'; // Fluo Green
    }
  };

  // Text processing for manual line breaks
  // Very tight line height to fit text in 14px
  const renderText = () => {
    return text.split('/').map((line, i) => (
      <span key={i} className="block leading-[0.95]">
        {line.trim()}
      </span>
    ));
  };

  return (
    <div 
      className="relative w-[66px] h-[66px] cursor-pointer select-none perspective-1000 tap-highlight-transparent touch-manipulation group"
      onClick={() => status === CellStatus.EMPTY && onClick(id)}
    >
      <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isValidated ? 'rotate-y-180' : ''}`}>
        
        {/* CHALLENGE FACE - Anton 14px Bold (Maximum Visibility) */}
        <div 
          className={`
            absolute inset-0 backface-hidden rounded-[8px]
            flex items-center justify-center text-center p-0.5 overflow-hidden
            ${getColors()}
            ${isFeverTarget ? 'ring-2 ring-white animate-pulse' : ''}
          `}
        >
          <div className="font-impact font-bold text-[13.5px] uppercase pointer-events-none w-full break-words">
            {renderText()}
          </div>
        </div>

        {/* VALIDATED FACE - Yellow + Green Check */}
        <div className={`
          absolute inset-0 backface-hidden rotate-y-180 rounded-[8px]
          flex items-center justify-center bg-[#FFD93D]
        `}>
          <div className="w-10 h-10 bg-[#00F5A0] rounded-full flex items-center justify-center shadow-sm">
            <Check className="w-6 h-6 text-black" strokeWidth={5} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default BingoCell;
