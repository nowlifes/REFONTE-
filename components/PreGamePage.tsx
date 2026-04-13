/**
 * PreGamePage — Ice-breaker games before the bingo grid opens.
 *
 * Phases controlled by Master via MasterPage:
 *  TRUTH_LIE_SUBMIT → players enter 3 statements (2 true, 1 lie)
 *  TRUTH_LIE_VOTE   → everyone votes on whose statement is the lie
 *  HOT_TAKE_SUBMIT  → players write their controversial opinion
 *  HOT_TAKE_VOTE    → live thumbs up/down on all hot takes
 *
 * Design: Brutalist Arcade / Bingo Crawl (#0A1629, Impact, hard black shadows)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Zap, CheckCircle, Users, ThumbsUp, ThumbsDown, Clock, Send, ArrowRight } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';
import { useLanguage } from '../contexts/LanguageContext';
import { gameService } from '../services/gameService';
import { PreGamePhase } from '../types';
import BackgroundParticles from './BackgroundParticles';

interface PreGamePageProps {
  phase: string;                   // current PreGamePhase value
  subjectId: string | null;        // TRUTH_LIE_VOTE: whose turn
  secureSessionId: string | null;  // needed as foreign key in tables
  playerId: string | null;
  nickname: string;
  avatarId: string;
}

// ─── EMOJI MAP (same as Avatar) ───────────────────────────────────────────────
const EMOJI_MAP: Record<string, string> = {
  PartyKing: '👑', NightOwl: '🦉', FireStarter: '🔥', IceCold: '🧊',
  WildCard: '🃏', SocialButterfly: '🦋', Maverick: '🎯', DragonHeart: '🐉',
};
const getEmoji = (id: string) => EMOJI_MAP[id] || id || '🎲';

// ─── SHARED UI ATOMS ──────────────────────────────────────────────────────────

const PhaseBadge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span
    className="font-impact uppercase text-[10px] tracking-widest px-2 py-1 rounded-md border-[2px] border-black shadow-[2px_2px_0px_black]"
    style={{ background: color, color: '#000' }}
  >
    {label}
  </span>
);

const BigBtn: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
}> = ({ children, onClick, disabled, loading, color = '#FFD700' }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className="w-full font-impact uppercase tracking-widest text-black py-4 rounded-[12px] border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    style={{ background: disabled ? '#555' : color, color: disabled ? '#888' : '#000' }}
  >
    {loading ? (
      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
    ) : children}
  </button>
);

const StatementInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  isLie?: boolean;
  onToggleLie?: () => void;
}> = ({ value, onChange, placeholder, label, isLie, onToggleLie }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="font-impact text-[10px] uppercase tracking-widest text-white/50">{label}</span>
      {onToggleLie && (
        <button
          onClick={onToggleLie}
          className={`font-impact text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border-[2px] border-black shadow-[2px_2px_0px_black] transition-all duration-150 ${
            isLie
              ? 'bg-[#FF2D6A] text-white'
              : 'bg-[#1A1A2E] text-white/40 border-white/20'
          }`}
        >
          {isLie ? '← C\'est le mensonge' : 'C\'est le mensonge ?'}
        </button>
      )}
    </div>
    <div className={`relative rounded-[12px] border-[3px] transition-all duration-150 ${
      isLie ? 'border-[#FF2D6A] shadow-[4px_4px_0px_black]' : 'border-black shadow-[4px_4px_0px_black]'
    }`}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={120}
        rows={2}
        className="w-full bg-[#1A1A2E] text-white font-sans text-sm rounded-[10px] px-3 py-2.5 resize-none focus:outline-none placeholder:text-white/30"
      />
      {isLie && (
        <div className="absolute -top-2 -right-2 bg-[#FF2D6A] border-[2px] border-black rounded-full w-5 h-5 flex items-center justify-center shadow-[2px_2px_0px_black]">
          <span className="text-white text-[10px] font-bold">✗</span>
        </div>
      )}
    </div>
  </div>
);

// ─── PHASES ────────────────────────────────────────────────────────────────────

/**
 * TRUTH_LIE_SUBMIT — Player enters their 3 statements.
 */
const TruthLieSubmitPhase: React.FC<{
  playerId: string;
  nickname: string;
  avatarId: string;
  sessionId: string;
}> = ({ playerId, nickname, avatarId, sessionId }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [s3, setS3] = useState('');
  const [lieIndex, setLieIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = s1.trim() && s2.trim() && s3.trim() && lieIndex !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await gameService.submitTruthLie(
        playerId, nickname, avatarId, s1.trim(), s2.trim(), s3.trim(), lieIndex!, sessionId
      );
      setSubmitted(true);
      if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
      canvasConfetti({ particleCount: 60, spread: 90, origin: { y: 0.7 }, colors: ['#FFD700', '#FFFFFF', '#00F5A0'] });
    } catch (e: any) {
      alert(isFr ? `Erreur: ${e.message}` : `Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleLie = (idx: number) => setLieIndex(prev => prev === idx ? null : idx);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
        <div className="w-20 h-20 bg-[#00F5A0] rounded-full border-[4px] border-black shadow-[6px_6px_0px_black] flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-black" />
        </div>
        <div>
          <p className="font-impact text-white uppercase text-2xl tracking-tight">
            {isFr ? 'Soumis !' : 'Submitted!'}
          </p>
          <p className="font-sans text-white/50 text-sm mt-1">
            {isFr ? 'Attends que le Master lance le vote.' : 'Wait for the Master to start the vote.'}
          </p>
        </div>
        <div className="bg-[#1A1A2E] border-[3px] border-black rounded-2xl p-4 shadow-[5px_5px_0px_black] w-full max-w-sm">
          <p className="font-impact text-white/40 uppercase text-[9px] tracking-widest mb-3">
            {isFr ? 'Tes déclarations' : 'Your statements'}
          </p>
          {[s1, s2, s3].map((st, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span className={`font-impact text-xs uppercase px-1.5 py-0.5 rounded border-[2px] border-black shrink-0 ${
                i === lieIndex ? 'bg-[#FF2D6A] text-white' : 'bg-[#FFD700] text-black'
              }`}>
                {i === lieIndex ? (isFr ? 'MENSONGE' : 'LIE') : (isFr ? 'VRAI' : 'TRUE')}
              </span>
              <p className="font-sans text-white/80 text-sm">{st}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="font-impact text-white uppercase text-xl tracking-tight">
          {isFr ? '2 vérités, 1 mensonge' : '2 truths, 1 lie'}
        </p>
        <p className="font-sans text-white/50 text-sm mt-1">
          {isFr
            ? 'Écris 3 déclarations sur toi. Marque laquelle est le mensonge.'
            : 'Write 3 statements about yourself. Mark which one is the lie.'}
        </p>
      </div>

      <StatementInput
        value={s1} onChange={setS1}
        placeholder={isFr ? 'Ex : J\'ai déjà sauté en parachute…' : 'Ex: I once skydived…'}
        label={isFr ? 'Déclaration 1' : 'Statement 1'}
        isLie={lieIndex === 0}
        onToggleLie={() => toggleLie(0)}
      />
      <StatementInput
        value={s2} onChange={setS2}
        placeholder={isFr ? 'Ex : Je parle 3 langues…' : 'Ex: I speak 3 languages…'}
        label={isFr ? 'Déclaration 2' : 'Statement 2'}
        isLie={lieIndex === 1}
        onToggleLie={() => toggleLie(1)}
      />
      <StatementInput
        value={s3} onChange={setS3}
        placeholder={isFr ? 'Ex : J\'ai rencontré une célébrité…' : 'Ex: I met a celebrity…'}
        label={isFr ? 'Déclaration 3' : 'Statement 3'}
        isLie={lieIndex === 2}
        onToggleLie={() => toggleLie(2)}
      />

      {lieIndex === null && (s1 || s2 || s3) && (
        <p className="font-impact text-[#FF2D6A] uppercase text-[10px] tracking-widest text-center animate-pulse">
          {isFr ? '↑ Tape sur "C\'est le mensonge ?" pour marquer lequel' : '↑ Tap "Is this the lie?" to mark which one'}
        </p>
      )}

      <BigBtn onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
        <Send className="w-4 h-4" />
        {isFr ? 'Soumettre' : 'Submit'}
      </BigBtn>
    </div>
  );
};

/**
 * TRUTH_LIE_VOTE — Everyone votes on the current subject's statements.
 */
const TruthLieVotePhase: React.FC<{
  playerId: string;
  subjectId: string;
  sessionId: string;
}> = ({ playerId, subjectId, sessionId }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [submission, setSubmission] = useState<any | null>(null);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load the subject's submission
  useEffect(() => {
    if (!subjectId || !sessionId) return;
    gameService.getTruthLieSubmissions(sessionId).then(subs => {
      const found = subs.find(s => s.player_id === subjectId);
      if (found) {
        setSubmission(found);
        // Shuffle statement order — same seed for all voters (deterministic shuffle by subjectId)
        const seed = subjectId.charCodeAt(0) + subjectId.charCodeAt(4);
        const order = [0, 1, 2].sort(() => Math.sin(seed) - 0.5);
        setShuffledOrder(order);
      }
    });
  }, [subjectId, sessionId]);

  // Subscribe to votes
  useEffect(() => {
    if (!subjectId || !sessionId) return;
    return gameService.subscribeTruthLieVotes(subjectId, sessionId, setVotes);
  }, [subjectId, sessionId]);

  const isMe = playerId === subjectId;
  const statements = submission
    ? [submission.statement_1, submission.statement_2, submission.statement_3]
    : [];

  const handleVote = async (displayIndex: number) => {
    if (myVote !== null || isMe || !submission) return;
    const realIndex = shuffledOrder[displayIndex];
    setMyVote(displayIndex);
    setLoading(true);
    try {
      await gameService.voteTruthLie(playerId, subjectId, realIndex, sessionId);
      if (navigator.vibrate) navigator.vibrate(30);
    } catch { /* keep optimistic */ }
    finally { setLoading(false); }
  };

  const handleReveal = () => {
    setRevealed(true);
    canvasConfetti({ particleCount: 80, spread: 120, origin: { y: 0.5 }, colors: ['#FF2D6A', '#FFD700', '#fff'] });
  };

  if (!submission) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const voteCount = votes.length;
  const voteResults = [0, 1, 2].map(realIdx =>
    votes.filter(v => v.voted_index === realIdx).length
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Subject header */}
      <div className="flex items-center gap-3 bg-[#1A1A2E] border-[3px] border-black rounded-2xl px-4 py-3 shadow-[4px_4px_0px_black]">
        <div className="w-12 h-12 bg-[#FFD700] border-[3px] border-black rounded-[12px] flex items-center justify-center text-2xl shadow-[3px_3px_0px_black] shrink-0">
          {getEmoji(submission.avatar_id)}
        </div>
        <div>
          <p className="font-impact text-white uppercase text-lg tracking-tight leading-none">{submission.nickname}</p>
          <p className="font-sans text-white/40 text-xs">{isFr ? 'Lequel est le mensonge ?' : 'Which one is the lie?'}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-black/30 rounded-xl px-2 py-1">
          <Users className="w-3 h-3 text-white/50" />
          <span className="font-impact text-white/50 text-xs">{voteCount}</span>
        </div>
      </div>

      {isMe ? (
        <div className="bg-[#1A1A2E] border-[3px] border-[#FFD700] rounded-2xl p-4 shadow-[5px_5px_0px_black] text-center">
          <p className="font-impact text-[#FFD700] uppercase text-base tracking-tight">
            {isFr ? 'C\'est ton tour ! 😅' : 'It\'s your turn! 😅'}
          </p>
          <p className="font-sans text-white/50 text-sm mt-1">
            {isFr ? 'Les autres votent sur tes déclarations.' : 'Others are voting on your statements.'}
          </p>
          {/* Show real-time votes (without revealing lie) */}
          <div className="flex justify-center gap-4 mt-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="text-center">
                <span className="font-impact text-white text-xl">{voteResults[i]}</span>
                <p className="font-sans text-white/40 text-[10px]">{isFr ? `Décl. ${i + 1}` : `Stmt ${i + 1}`}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Statement cards */}
          <div className="flex flex-col gap-3">
            {shuffledOrder.map((realIdx, displayIdx) => {
              const stmt = statements[realIdx];
              const votesForThis = votes.filter(v => v.voted_index === realIdx).length;
              const iVoted = myVote === displayIdx;
              const isLie = revealed && realIdx === submission.lie_index;
              const isTrue = revealed && realIdx !== submission.lie_index;

              return (
                <button
                  key={displayIdx}
                  onClick={() => handleVote(displayIdx)}
                  disabled={myVote !== null}
                  className={`w-full text-left p-4 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] transition-all duration-200 ${
                    isLie
                      ? 'bg-[#FF2D6A]'
                      : isTrue
                      ? 'bg-[#00F5A0]'
                      : iVoted
                      ? 'bg-[#FFD700]'
                      : myVote !== null
                      ? 'bg-[#1A1A2E] opacity-60'
                      : 'bg-[#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`font-impact text-sm uppercase px-2 py-0.5 rounded border-[2px] border-black shrink-0 ${
                      isLie ? 'bg-black text-[#FF2D6A]'
                      : isTrue ? 'bg-black text-[#00F5A0]'
                      : iVoted ? 'bg-black text-[#FFD700]'
                      : 'bg-black/30 text-white'
                    }`}>
                      {isLie ? (isFr ? 'MENSONGE' : 'LIE')
                        : isTrue ? (isFr ? 'VRAI' : 'TRUE')
                        : `${displayIdx + 1}`}
                    </span>
                    <p className={`font-sans text-sm leading-snug ${
                      isLie || isTrue || iVoted ? 'text-black' : 'text-white'
                    }`}>
                      {stmt}
                    </p>
                  </div>
                  {myVote !== null && (
                    <div className="flex justify-end mt-2">
                      <span className={`font-impact text-xs uppercase ${
                        isLie || isTrue || iVoted ? 'text-black/60' : 'text-white/40'
                      }`}>
                        {votesForThis} {isFr ? 'vote(s)' : 'vote(s)'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {myVote !== null && !revealed && (
            <div className="text-center">
              <p className="font-sans text-white/50 text-sm">
                {isFr ? 'Attends la révélation du Master…' : 'Wait for the Master to reveal…'}
              </p>
            </div>
          )}

          {myVote === null && (
            <p className="font-impact text-white/40 uppercase text-[10px] tracking-widest text-center animate-pulse">
              {isFr ? 'Tape sur une déclaration pour voter' : 'Tap a statement to vote'}
            </p>
          )}
        </>
      )}
    </div>
  );
};

/**
 * HOT_TAKE_SUBMIT — Player writes their controversial opinion.
 */
const HotTakeSubmitPhase: React.FC<{
  playerId: string;
  nickname: string;
  avatarId: string;
  sessionId: string;
}> = ({ playerId, nickname, avatarId, sessionId }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const MAX = 140;

  const examples = isFr
    ? ['L\'ananas sur la pizza, c\'est de l\'art', 'Les gens qui mettent du lait avant les céréales sont dangereux', 'Dormir plus de 8h = tu rates ta vie']
    : ['Pineapple on pizza is underrated', 'People who reply to emails after midnight need therapy', 'Sleeping in is just giving up on the day'];
  const exampleRef = useRef(0);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await gameService.submitHotTake(playerId, nickname, avatarId, text.trim(), sessionId);
      setSubmitted(true);
      if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
        <div className="text-6xl">🔥</div>
        <div>
          <p className="font-impact text-white uppercase text-2xl tracking-tight">
            {isFr ? 'Hot take envoyée !' : 'Hot take sent!'}
          </p>
          <p className="font-sans text-white/50 text-sm mt-1">
            {isFr ? 'Attends que le vote commence.' : 'Wait for the vote to start.'}
          </p>
        </div>
        <div className="bg-[#1A1A2E] border-[3px] border-[#FF8C00] rounded-2xl p-4 shadow-[5px_5px_0px_black] w-full max-w-sm">
          <p className="font-sans text-white text-sm italic">"{text}"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="font-impact text-white uppercase text-xl tracking-tight">🔥 Hot Take Battle</p>
        <p className="font-sans text-white/50 text-sm mt-1">
          {isFr
            ? 'Balance une opinion controversée. Les autres votent.'
            : 'Drop a controversial opinion. Others vote on it.'}
        </p>
      </div>

      <div>
        <div className="relative rounded-[12px] border-[3px] border-[#FF8C00] shadow-[4px_4px_0px_black]">
          <textarea
            value={text}
            onChange={e => { if (e.target.value.length <= MAX) setText(e.target.value); }}
            placeholder={examples[exampleRef.current]}
            rows={4}
            className="w-full bg-[#1A1A2E] text-white font-sans text-sm rounded-[10px] px-4 py-3 resize-none focus:outline-none placeholder:text-white/25"
          />
          <div className="absolute bottom-2 right-3">
            <span className={`font-impact text-xs ${text.length > MAX * 0.9 ? 'text-[#FF2D6A]' : 'text-white/30'}`}>
              {text.length}/{MAX}
            </span>
          </div>
        </div>

        {/* Example cycling */}
        <button
          onClick={() => { exampleRef.current = (exampleRef.current + 1) % examples.length; setText(examples[exampleRef.current]); }}
          className="mt-2 font-impact text-[#FF8C00] text-[10px] uppercase tracking-widest flex items-center gap-1"
        >
          <ArrowRight className="w-3 h-3" />
          {isFr ? 'Voir un exemple' : 'See example'}
        </button>
      </div>

      <BigBtn onClick={handleSubmit} disabled={!text.trim()} loading={loading} color="#FF8C00">
        <Zap className="w-4 h-4" />
        {isFr ? 'Lancer ma hot take' : 'Drop my hot take'}
      </BigBtn>
    </div>
  );
};

/**
 * HOT_TAKE_VOTE — Real-time thumbs up/down on all hot takes.
 */
const HotTakeVotePhase: React.FC<{
  playerId: string;
  sessionId: string;
}> = ({ playerId, sessionId }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [hotTakes, setHotTakes] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, 'UP' | 'DOWN'>>({});
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    return gameService.subscribeHotTakes(sessionId, setHotTakes);
  }, [sessionId]);

  const handleVote = async (hotTakeId: string, vote: 'UP' | 'DOWN') => {
    // Toggle: voting same direction twice = undo (we just re-upsert for now — DB handles)
    const current = myVotes[hotTakeId];
    if (current === vote) return; // already voted this way
    setMyVotes(prev => ({ ...prev, [hotTakeId]: vote }));
    setLoading(hotTakeId + vote);
    try {
      await gameService.voteHotTake(playerId, hotTakeId, vote, sessionId);
      if (navigator.vibrate) navigator.vibrate(20);
    } catch { /* keep optimistic */ }
    finally { setLoading(null); }
  };

  // Sort by total engagement (upvotes + downvotes) desc
  const sorted = [...hotTakes].sort((a, b) => (b.upvotes + b.downvotes) - (a.upvotes + a.downvotes));

  const controversyScore = (t: any) => {
    const total = t.upvotes + t.downvotes;
    if (total === 0) return 0;
    const ratio = Math.min(t.upvotes, t.downvotes) / total;
    return ratio; // 0.5 = perfectly split = max controversy
  };

  const winner = sorted.length > 0
    ? sorted.reduce((prev, curr) => controversyScore(curr) > controversyScore(prev) ? curr : prev)
    : null;

  if (hotTakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-12 h-12 border-2 border-[#FF8C00] border-t-transparent rounded-full animate-spin" />
        <p className="font-sans text-white/40 text-sm">{isFr ? 'Chargement des hot takes…' : 'Loading hot takes…'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-impact text-white uppercase text-base tracking-tight">
          {hotTakes.length} {isFr ? 'hot takes' : 'hot takes'}
        </p>
        {winner && (
          <div className="flex items-center gap-1.5 bg-[#FF2D6A] border-[2px] border-black rounded-full px-2.5 py-1 shadow-[3px_3px_0px_black]">
            <span className="text-sm">🔥</span>
            <span className="font-impact text-black text-[9px] uppercase tracking-widest">Most controversial</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map(take => {
          const total = take.upvotes + take.downvotes;
          const upPct = total > 0 ? Math.round((take.upvotes / total) * 100) : 50;
          const isWinner = winner?.id === take.id;
          const isMyTake = take.player_id === playerId;
          const myVote = myVotes[take.id];

          return (
            <div
              key={take.id}
              className={`rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] overflow-hidden ${
                isWinner ? 'border-[#FF2D6A]' : ''
              }`}
            >
              {/* Author + text */}
              <div className={`px-4 pt-3 pb-2 ${isWinner ? 'bg-[#FF2D6A]' : 'bg-[#1A1A2E]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getEmoji(take.avatar_id)}</span>
                  <span className={`font-impact text-xs uppercase tracking-widest ${isWinner ? 'text-black' : 'text-white/50'}`}>
                    {take.nickname}
                  </span>
                  {isWinner && (
                    <span className="ml-auto font-impact text-black text-[9px] uppercase tracking-widest bg-black/20 px-1.5 py-0.5 rounded">
                      🔥 Most controversial
                    </span>
                  )}
                </div>
                <p className={`font-sans text-sm leading-snug ${isWinner ? 'text-black font-semibold' : 'text-white'}`}>
                  "{take.text}"
                </p>
              </div>

              {/* Vote bar */}
              {total > 0 && (
                <div className="h-1.5 bg-[#FF2D6A]" style={{ backgroundImage: `linear-gradient(to right, #00F5A0 ${upPct}%, #FF2D6A ${upPct}%)` }} />
              )}

              {/* Vote buttons */}
              <div className="bg-black/40 px-4 py-2 flex items-center gap-3">
                <button
                  onClick={() => !isMyTake && handleVote(take.id, 'UP')}
                  disabled={isMyTake || loading === take.id + 'UP'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100 disabled:opacity-40 ${
                    myVote === 'UP' ? 'bg-[#00F5A0]' : 'bg-[#1A1A2E]'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${myVote === 'UP' ? 'text-black' : 'text-white/60'}`} />
                  <span className={`font-impact text-sm ${myVote === 'UP' ? 'text-black' : 'text-white'}`}>
                    {take.upvotes}
                  </span>
                </button>

                <button
                  onClick={() => !isMyTake && handleVote(take.id, 'DOWN')}
                  disabled={isMyTake || loading === take.id + 'DOWN'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100 disabled:opacity-40 ${
                    myVote === 'DOWN' ? 'bg-[#FF2D6A]' : 'bg-[#1A1A2E]'
                  }`}
                >
                  <ThumbsDown className={`w-4 h-4 ${myVote === 'DOWN' ? 'text-white' : 'text-white/60'}`} />
                  <span className={`font-impact text-sm ${myVote === 'DOWN' ? 'text-white' : 'text-white'}`}>
                    {take.downvotes}
                  </span>
                </button>

                <div className="ml-auto">
                  {total > 0 && (
                    <span className="font-impact text-white/30 text-[10px] uppercase tracking-widest">
                      {upPct}% 👍
                    </span>
                  )}
                </div>

                {isMyTake && (
                  <span className="font-impact text-[#FFD700] text-[9px] uppercase tracking-widest">
                    {isFr ? 'ta hot take' : 'your take'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── TIMER BAR ─────────────────────────────────────────────────────────────────

const TimerBar: React.FC<{ endsAt: number; totalSeconds: number; label: string }> = ({ endsAt, totalSeconds, label }) => {
  const [left, setLeft] = useState(totalSeconds);

  useEffect(() => {
    const update = () => setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    update();
    const iv = setInterval(update, 500);
    return () => clearInterval(iv);
  }, [endsAt]);

  const pct = Math.max(0, (left / totalSeconds) * 100);
  const urgent = left <= 30;

  return (
    <div className={`rounded-xl border-[2px] border-black shadow-[3px_3px_0px_black] overflow-hidden ${urgent ? 'bg-[#FF2D6A]' : 'bg-[#1A1A2E]'}`}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${urgent ? 'text-white animate-pulse' : 'text-white/50'}`} />
          <span className={`font-impact text-[10px] uppercase tracking-widest ${urgent ? 'text-white' : 'text-white/50'}`}>{label}</span>
        </div>
        <span className={`font-impact text-sm tabular-nums ${urgent ? 'text-white' : 'text-white'}`}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </span>
      </div>
      <div className="h-1 bg-black/20">
        <div
          className={`h-full transition-all duration-500 ${urgent ? 'bg-white' : 'bg-[#FFD700]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── MAIN PRE-GAME PAGE ────────────────────────────────────────────────────────

const PreGamePage: React.FC<PreGamePageProps> = ({
  phase, subjectId, secureSessionId, playerId, nickname, avatarId
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const sessionId = secureSessionId ?? '';

  const phaseLabels: Record<string, { label: string; color: string; emoji: string }> = {
    [PreGamePhase.TRUTH_LIE_SUBMIT]: { label: isFr ? '2V / 1M — Soumission' : '2T / 1L — Submit', color: '#FFD700', emoji: '🎭' },
    [PreGamePhase.TRUTH_LIE_VOTE]:   { label: isFr ? '2V / 1M — Vote' : '2T / 1L — Vote', color: '#00F5A0', emoji: '🗳️' },
    [PreGamePhase.HOT_TAKE_SUBMIT]:  { label: isFr ? 'Hot Take — Soumission' : 'Hot Take — Submit', color: '#FF8C00', emoji: '🔥' },
    [PreGamePhase.HOT_TAKE_VOTE]:    { label: isFr ? 'Hot Take — Vote Live' : 'Hot Take — Live Vote', color: '#FF2D6A', emoji: '🔥' },
  };

  const meta = phaseLabels[phase] ?? { label: 'Pre-Game', color: '#FFD700', emoji: '🎮' };

  return (
    <div className="min-h-[100dvh] bg-[#0A1629] flex flex-col relative overflow-hidden">
      <BackgroundParticles />

      {/* Header */}
      <div className="relative z-10 px-4 pt-safe pt-4 pb-3 flex items-center justify-between border-b-[2px] border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] border-[3px] border-black flex items-center justify-center text-xl shadow-[3px_3px_0px_black]"
            style={{ background: meta.color }}
          >
            {meta.emoji}
          </div>
          <div>
            <p className="font-impact text-white uppercase text-sm tracking-tight leading-none">Pre-Game</p>
            <PhaseBadge label={meta.label} color={meta.color} />
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2 bg-[#1A1A2E] border-[2px] border-white/10 rounded-xl px-2.5 py-1.5">
          <span className="text-lg">{getEmoji(avatarId)}</span>
          <span className="font-impact text-white text-xs uppercase tracking-tight">{nickname}</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-safe">
        {phase === PreGamePhase.TRUTH_LIE_SUBMIT && playerId && (
          <TruthLieSubmitPhase
            playerId={playerId}
            nickname={nickname}
            avatarId={avatarId}
            sessionId={sessionId}
          />
        )}

        {phase === PreGamePhase.TRUTH_LIE_VOTE && subjectId && playerId && (
          <TruthLieVotePhase
            playerId={playerId}
            subjectId={subjectId}
            sessionId={sessionId}
          />
        )}

        {phase === PreGamePhase.HOT_TAKE_SUBMIT && playerId && (
          <HotTakeSubmitPhase
            playerId={playerId}
            nickname={nickname}
            avatarId={avatarId}
            sessionId={sessionId}
          />
        )}

        {phase === PreGamePhase.HOT_TAKE_VOTE && playerId && (
          <HotTakeVotePhase
            playerId={playerId}
            sessionId={sessionId}
          />
        )}

        {!playerId && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <p className="font-impact text-white uppercase text-lg tracking-tight">
              {isFr ? 'Crée ton profil d\'abord' : 'Create your profile first'}
            </p>
            <p className="font-sans text-white/50 text-sm">
              {isFr ? 'Reviens une fois ta fiche identité remplie.' : 'Come back once you\'ve set up your identity card.'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="relative z-10 px-4 pb-safe pb-4 pt-2">
        <p className="font-impact text-white/20 uppercase text-[9px] tracking-widest text-center">
          {isFr ? 'Le Master contrôle les phases' : 'Master controls the phases'} · Bingo Crawl
        </p>
      </div>
    </div>
  );
};

export default PreGamePage;
