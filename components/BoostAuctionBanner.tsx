
import React, { useState, useEffect, useRef } from 'react';
import { gameService } from '../services/gameService';
import { useLanguage } from '../contexts/LanguageContext';

interface BoostAuctionBannerProps {
  endsAt: number;
  sessionId: string;
  currentPlayerId: string;
  auctionType?: 'boost' | 'sabotage';
  onExpired?: () => void;
}

const EMOJI_MAP: Record<string, string> = {
  PartyKing: '👑', FireStarter: '🔥', NightOwl: '🦉', ChaosAgent: '🌀',
  IceQueen: '❄️', BeerBaron: '🍺', ShotCaller: '🎯', WildCard: '🃏',
  LegendWait: '⚡', BigEnergy: '💫',
};
const getEmoji = (avatarId: string) => EMOJI_MAP[avatarId] ?? avatarId ?? '🎲';

const BoostAuctionBanner: React.FC<BoostAuctionBannerProps> = ({
  endsAt, sessionId, currentPlayerId, auctionType = 'boost', onExpired,
}) => {
  const isSabotage = auctionType === 'sabotage';
  const accentColor = isSabotage ? '#FF2D6A' : '#FF8C00';
  const accentColorDark = isSabotage ? '#CC0040' : '#E07000';
  const { language } = useLanguage();
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
  const [players, setPlayers] = useState<Array<{ id: string; pseudo: string; emoji: string }>>([]);
  const [playersLoadError, setPlayersLoadError] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [voteError, setVoteError] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
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
    setPlayersLoadError(false);
    const load = () =>
      gameService.getPlayersWithScores(sessionId).then(list => {
        const others = list.filter(p => p.id !== currentPlayerId);
        setPlayers(others.map(p => ({ id: p.id, pseudo: p.pseudo, emoji: getEmoji(p.emoji) })));
        setPlayersLoadError(false);
      }).catch(() => setPlayersLoadError(true));
    load();
    // Retry after 3s if initial load fails
    const retry = setTimeout(load, 3000);
    return () => clearTimeout(retry);
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
      navigator.vibrate?.(15);
      setVoteSuccess(true);
      setTimeout(() => setVoteSuccess(false), 2000);
    } catch (e) {
      console.error('[Boost] castBoostVote failed', e);
      setMyVote(null);
      setVoteError(true);
      setTimeout(() => setVoteError(false), 2500);
    } finally {
      setIsVoting(null);
    }
  };

  if (dismissed || secondsLeft === 0) return null;

  const totalVotes = (Object.values(voteCounts) as number[]).reduce((a: number, b: number) => a + b, 0);
  const topCandidateId = (Object.entries(voteCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];
  const isUrgent = secondsLeft <= 5;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Vote success toast */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none ${voteSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="bg-[#00F5A0] border-[3px] border-black rounded-2xl px-5 py-3 shadow-[6px_6px_0px_black] flex items-center gap-2 whitespace-nowrap">
          <span className="font-impact text-black uppercase text-sm tracking-tight">
            ✓ {language === 'fr' ? 'Vote enregistré !' : 'Vote registered!'}
          </span>
        </div>
      </div>

      {/* Vote error toast */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none ${voteError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="bg-black border-[3px] border-[#FF2E63] rounded-2xl px-5 py-3 shadow-[6px_6px_0px_black] flex items-center gap-2 whitespace-nowrap">
          <span className="font-impact text-[#FF2E63] uppercase text-sm tracking-tight">
            {language === 'fr' ? 'Vote non enregistré — réessaie' : 'Vote not registered — try again'}
          </span>
        </div>
      </div>

      {/* Top zone — orange */}
      <div
        className="flex-1 flex flex-col justify-end px-6 pb-6"
        style={{ background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColorDark} 100%)`, paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 40px)' }}
      >
        {/* Timer ring */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-14 h-14 border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_black] transition-colors duration-300 ${isUrgent ? 'bg-[#FF2E63] animate-pulse' : 'bg-black/20'}`}>
            <span className={`font-impact text-xl transition-colors duration-300 ${isUrgent ? 'text-white' : 'text-black'}`}>{secondsLeft}</span>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-black px-2.5 py-1 rounded-lg mb-1 w-fit" style={{ color: accentColor }}>
              <span className="font-impact text-[9px] uppercase tracking-widest">
                {isSabotage
                  ? (language === 'fr' ? '💀 Vote de sabotage' : '💀 Sabotage vote')
                  : (language === 'fr' ? '🏆 Enchère de boost' : '🏆 Boost auction')}
              </span>
            </div>
            <p className="font-impact text-black/70 uppercase text-[10px] tracking-widest">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} — {secondsLeft}s {language === 'fr' ? 'restantes' : 'left'}
            </p>
          </div>
        </div>

        <p className="font-impact text-black text-[22px] uppercase leading-tight italic tracking-tight mb-1">
          {isSabotage
            ? (language === 'fr' ? 'Qui mérite un sabotage ?' : 'Who deserves a sabotage?')
            : (language === 'fr' ? 'Qui mérite un boost gratuit ?' : 'Who deserves a free boost?')}
        </p>
        <p className="font-impact text-black/50 text-[11px] uppercase tracking-widest">
          {isSabotage
            ? (language === 'fr' ? 'Le joueur le plus voté reçoit un effet surprise direct' : 'Most voted player gets a surprise effect applied')
            : (language === 'fr' ? 'Le joueur le plus voté reçoit un sabotage gratuit à utiliser' : 'Most voted player gets a free taunt to use')}
        </p>
      </div>

      {/* Player list */}
      <div
        className="shrink-0 bg-[#0A1629] border-t-[3px] border-black px-5 pt-4 flex flex-col gap-2.5 overflow-y-auto"
        style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 0px) + 16px)', maxHeight: '55vh' }}
      >
        {players.length === 0 && !sessionId && (
          <p className="text-center text-[#FF2D6A]/70 font-impact uppercase text-[11px] tracking-widest py-4">
            {language === 'fr' ? 'Session introuvable — rescanner le QR' : 'Session not found — rescan the QR'}
          </p>
        )}
        {players.length === 0 && sessionId && playersLoadError && (
          <div className="flex flex-col items-center gap-2 py-4">
            <p className="text-center text-[#FF2D6A] font-impact uppercase text-[11px] tracking-widest">
              {language === 'fr' ? 'Erreur réseau — nouvelle tentative...' : 'Network error — retrying...'}
            </p>
            <div className="w-4 h-4 border-[2px] border-[#FF2D6A]/30 border-t-[#FF2D6A] rounded-full animate-spin" />
          </div>
        )}
        {players.length === 0 && sessionId && !playersLoadError && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-4 h-4 border-[2px] border-white/20 border-t-white/60 rounded-full animate-spin" />
            <p className="text-center text-white/30 font-impact uppercase text-[11px] tracking-widest">
              {language === 'fr' ? 'Chargement des joueurs...' : 'Loading players...'}
            </p>
          </div>
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
                  ? 'border-black shadow-[4px_4px_0px_black]'
                  : isLeading
                  ? 'bg-white/10 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]'
                  : 'bg-white/5 border-white/10 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]'
              }`}
              style={isMyChoice ? { backgroundColor: accentColor } : isLeading ? { borderColor: `${accentColor}99` } : undefined}
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
                <div className="px-2.5 py-1 rounded-lg border-[2px] border-black font-impact text-[11px] uppercase text-black" style={{ backgroundColor: isMyChoice ? 'black' : accentColor, color: isMyChoice ? accentColor : 'black' }}>
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
