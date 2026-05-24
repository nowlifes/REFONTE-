import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { gameService } from '../services/gameService';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  currentPlayerId: string;
  gameId: string;
  cellId: number;
  challengeText: string;
  challengerNickname: string;
  challengerEmoji: string;
  onDuelSent: (duelId: string) => void;
  onClose: () => void;
}

const DuelOpponentPicker: React.FC<Props> = ({
  currentPlayerId, gameId, cellId, challengeText,
  challengerNickname, challengerEmoji, onDuelSent, onClose,
}) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    gameService.getLeaderboard(currentPlayerId).then((entries) => {
      setPlayers(entries.filter(e => e.userId !== currentPlayerId));
    });
  }, [currentPlayerId]);

  const handlePick = async (opponent: any) => {
    if (sending) return;
    setSending(opponent.userId);
    try {
      const duelId = await gameService.requestDuel(
        gameId, cellId, challengeText,
        currentPlayerId, challengerNickname, challengerEmoji,
        opponent.userId, opponent.pseudo,
      );
      onDuelSent(duelId);
    } catch (e) {
      console.error(e);
      setSending(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[350] flex flex-col bg-[#0A1629]"
      style={{ paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 16px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-4 border-b-[3px] border-white/10">
        <p className="font-impact uppercase text-white text-xl tracking-wide">⚔️ Choisir un adversaire</p>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl border-[2px] border-white/20 active:bg-white/20 transition-all"
          aria-label="Fermer"
        >
          <X size={18} strokeWidth={2.5} className="text-white/60" />
        </button>
      </div>

      {/* Challenge rappel */}
      <div className="mx-5 mt-4 px-4 py-3 bg-[#FF2D6A]/15 border-[3px] border-[#FF2D6A] rounded-2xl">
        <p className="font-impact uppercase text-[#FF2D6A] text-xs tracking-widest mb-1">Le défi</p>
        <p className="font-impact text-white text-base uppercase leading-snug">"{challengeText}"</p>
      </div>

      {/* Liste joueurs */}
      <div
        className="flex-1 overflow-y-auto px-5 pt-4 flex flex-col gap-3"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {players.length === 0 && (
          <p className="text-white/40 font-impact uppercase text-center mt-8 text-sm tracking-widest">
            Aucun autre joueur actif
          </p>
        )}
        {players.map((p) => (
          <button
            key={p.userId}
            onClick={() => handlePick(p)}
            disabled={!!sending}
            className="flex items-center gap-4 w-full px-4 py-4 bg-white border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FF2D6A] border-[3px] border-black flex items-center justify-center text-xl">
              {p.avatarId ?? '🎯'}
            </div>
            <div className="flex-1 text-left">
              <p className="font-impact uppercase text-black text-base leading-none">{p.pseudo}</p>
              <p className="font-impact text-black/40 text-xs uppercase tracking-widest mt-0.5">{p.score} pts</p>
            </div>
            {sending === p.userId
              ? <span className="w-5 h-5 border-[3px] border-black/20 border-t-black rounded-full animate-spin" />
              : <span className="font-impact text-[#FF2D6A] uppercase text-xs tracking-widest">Défier ⚔️</span>
            }
          </button>
        ))}
      </div>
    </div>
  );
};

export default DuelOpponentPicker;
