
import React, { useState, useEffect, useRef } from 'react';
import { gameService } from '../services/gameService';

interface BoostAuctionBannerProps {
  endsAt: number;
  sessionId: string;
  currentPlayerId: string;
  onExpired?: () => void;
}

const EMOJI_MAP: Record<string, string> = {
  PartyKing: '👑', FireStarter: '🔥', NightOwl: '🦉', ChaosAgent: '🌀',
  IceQueen: '❄️', BeerBaron: '🍺', ShotCaller: '🎯', WildCard: '🃏',
  LegendWait: '⚡', BigEnergy: '💫',
};
const getEmoji = (avatarId: string) => EMOJI_MAP[avatarId] ?? avatarId ?? '🎲';

const BoostAuctionBanner: React.FC<BoostAuctionBannerProps> = ({
  endsAt, sessionId, currentPlayerId, onExpired,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
  const [players, setPlayers] = useState<Array<{ id: string; pseudo: string; emoji: string }>>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const expiredFired = useRef(false);

  // Countdown
  useEffect(() => {
    const update = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && !expiredFired.current) {
        expiredFired.current = true;
        onExpired?.();
      }
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [endsAt, onExpired]);

  // Fetch players
  useEffect(() => {
    if (!sessionId) return;
    gameService.getPlayersWithScores(sessionId).then(list => {
      setPlayers(list
        .filter(p => p.id !== currentPlayerId)
        .map(p => ({ id: p.id, pseudo: p.pseudo, emoji: getEmoji(p.emoji) }))
      );
    });
  }, [sessionId, currentPlayerId]);

  // Subscribe to vote counts
  useEffect(() => {
    if (!sessionId) return;
    const unsub = gameService.subscribeBoostVotes(sessionId, setVoteCounts);
    return unsub;
  }, [sessionId]);

  const handleVote = async (candidateId: string) => {
    if (isVoting || secondsLeft === 0) return;
    setIsVoting(candidateId);
    setMyVote(candidateId);
    try {
      await gameService.castBoostVote(sessionId, currentPlayerId, candidateId);
    } catch (e) {
      console.error('[Boost] castBoostVote failed', e);
    } finally {
      setIsVoting(null);
    }
  };

  if (dismissed || secondsLeft === 0) return null;

  const totalVotes = (Object.values(voteCounts) as number[]).reduce((a: number, b: number) => a + b, 0);
  const topCandidateId = (Object.entries(voteCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="fixed inset-0 z-[250] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Top zone — orange */}
      <div
        className="flex-1 flex flex-col justify-end px-6 pb-6"
        style={{ background: 'linear-gradient(180deg, #FF8C00 0%, #E07000 100%)', paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 40px)' }}
      >
        {/* Timer ring */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 bg-black/20 border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_black]">
            <span className="font-impact text-black text-xl">{secondsLeft}</span>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-black text-[#FF8C00] px-2.5 py-1 rounded-lg mb-1 w-fit">
              <span className="font-impact text-[9px] uppercase tracking-widest">Enchère de boost</span>
            </div>
            <p className="font-impact text-black/70 uppercase text-[10px] tracking-widest">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} · {secondsLeft}s restantes
            </p>
          </div>
        </div>

        <p className="font-impact text-black text-[22px] uppercase leading-tight italic tracking-tight mb-1">
          Qui mérite un taunt gratuit ?
        </p>
        <p className="font-impact text-black/50 text-[11px] uppercase tracking-widest">
          Vote pour un joueur — le groupe décide qui reçoit le boost
        </p>
      </div>

      {/* Player list */}
      <div
        className="shrink-0 bg-[#0A1629] border-t-[3px] border-black px-5 pt-4 flex flex-col gap-2.5 overflow-y-auto"
        style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 0px) + 16px)', maxHeight: '55vh' }}
      >
        {players.length === 0 && (
          <p className="text-center text-white/30 font-impact uppercase text-[11px] tracking-widest py-4">Chargement des joueurs...</p>
        )}

        {players.map(player => {
          const votes = voteCounts[player.id] ?? 0;
          const isLeading = player.id === topCandidateId && votes > 0;
          const isMyChoice = myVote === player.id;

          return (
            <button
              key={player.id}
              onClick={() => handleVote(player.id)}
              disabled={!!isVoting}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-[3px] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 ${
                isMyChoice
                  ? 'bg-[#FF8C00] border-black shadow-[4px_4px_0px_black]'
                  : isLeading
                  ? 'bg-white/10 border-[#FF8C00]/60 shadow-[4px_4px_0px_rgba(255,140,0,0.3)]'
                  : 'bg-white/5 border-white/10 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]'
              }`}
            >
              {/* Emoji */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-[2px] border-black shrink-0 ${isMyChoice ? 'bg-black/20' : 'bg-white/10'}`}>
                <span className="text-xl leading-none">{player.emoji}</span>
              </div>

              {/* Name */}
              <span className={`font-impact uppercase text-sm tracking-tight flex-1 text-left truncate ${isMyChoice ? 'text-black' : 'text-white'}`}>
                {player.pseudo}
              </span>

              {/* Vote count */}
              {votes > 0 && (
                <div className={`px-2.5 py-1 rounded-lg border-[2px] border-black font-impact text-[11px] uppercase ${isMyChoice ? 'bg-black text-[#FF8C00]' : 'bg-[#FF8C00] text-black'}`}>
                  {votes} vote{votes !== 1 ? 's' : ''}
                </div>
              )}

              {isMyChoice && (
                <span className="text-black font-impact text-[10px] uppercase tracking-widest shrink-0">✓ Mon vote</span>
              )}
            </button>
          );
        })}

        {/* Skip */}
        <button
          onClick={() => setDismissed(true)}
          className="w-full py-3 text-white/25 font-impact uppercase text-[11px] tracking-widest active:text-white/50 transition-all"
        >
          Passer
        </button>
      </div>
    </div>
  );
};

export default BoostAuctionBanner;
