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

              const getColors = () => {
                  switch (type) {
                        case ChallengeType.MASTER: return 'bg-[#FFD93D] text-black';
                              case ChallengeType.WITNESS: return 'bg-[#FF2D6A] text-white';
                                    default: return 'bg-[#00F5A0] text-black';
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

                                                                        return (
                                                                            <div
                                                                                  className="relative w-[66px] h-[66px] cursor-pointer select-none perspective-1000 touch-manipulation"
                                                                                        onClick={() => status === CellStatus.EMPTY && onClick(id)}
                                                                                            >
                                                                                                  <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isValidated ? 'rotate-y-180' : ''}`}>
                                                                                                          <div className={`absolute inset-0 backface-hidden rounded-[8px] flex items-center justify-center text-center p-[3px] overflow-hidden ${getColors()} ${isFeverTarget ? 'ring-2 ring-white animate-pulse' : ''}`}>
                                                                                                                    <div
                                                                                                                                className="font-impact font-bold uppercase pointer-events-none w-full"
                                                                                                                                            style={{ fontSize: getFontSize(), lineHeight: '1.1', wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'none' }}
                                                                                                                                                      >
                                                                                                                                                                  {text}
                                                                                                                                                                            </div>
                                                                                                                                                                                    </div>
                                                                                                                                                                                            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[8px] flex items-center justify-center bg-[#FFD93D]">
                                                                                                                                                                                                      <div className="w-10 h-10 bg-[#00F5A0] rounded-full flex items-center justify-center shadow-sm">
                                                                                                                                                                                                                  <Check className="w-6 h-6 text-black" strokeWidth={5} />
                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                export default BingoCell;