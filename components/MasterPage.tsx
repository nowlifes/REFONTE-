
import React, { useState, useEffect, useRef } from 'react';
import {
  Power, DoorOpen, DoorClosed, Gamepad2, Crown, Trash2, AlertTriangle, X,
  Users, List, Sparkles, PartyPopper, MapPin, Clock, XCircle, Expand,
  Play, ChevronRight, StopCircle, UserX, RefreshCw, Check, Zap, Pencil,
  Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppView } from '../types';
import { APP_VERSION, MASTER_VALID_CODE, CHALLENGES_EN, CHALLENGES_FR } from '../constants';
import { gameService } from '../services/gameService';
import { supabase } from '../lib/supabaseClient';
import BackgroundParticles from './BackgroundParticles';

const SESSION_COLORS = ['#FF2E63','#00F5A0','#FFD700','#93C5FD','#FF8C00','#A78BFA','#F472B6','#34D399'];
function sessionColor(uuid: string): string {
  const idx = parseInt(uuid.replace(/-/g, '').slice(0, 4), 16) % SESSION_COLORS.length;
  return SESSION_COLORS[idx];
}

interface MasterPageProps {
  isSessionActive: boolean;
  setSessionActive: (active: boolean) => void;
  resetSession: () => Promise<void>;
  createNewSession: () => Promise<void>;
  onWrapped: () => Promise<void>;
  triggerBarTransition: (durationMinutes: number, barName?: string) => Promise<void>;
  clearBarTransition: () => Promise<void>;
  transitionEndsAt: number | null;
  nextBarName: string | null;
  secureSessionId: string | null;
  state: any;
  actions: any;
  pregamePhase?: string | null;
  pregameSubjectId?: string | null;
  setPregamePhase?: (phase: string | null, subjectId?: string | null) => Promise<void>;
  triggerCountdown?: (seconds: number) => Promise<void>;
  clearCountdown?: () => Promise<void>;
  spotlightDisabled?: boolean;
  setSpotlightDisabled?: (disabled: boolean) => Promise<void>;
  challengeCooldownSecs?: number;
  setChallengeCooldown?: (secs: number) => Promise<void>;
}

const PREGAME_LABELS: Record<string, string> = {
  TRUTH_LIE_SUBMIT: '🎭 2V/1M — Soumission',
  TRUTH_LIE_VOTE:   '🎭 2V/1M — Vote',
  HOT_TAKE_SUBMIT:  '🔥 Hot Take — Soumission',
  HOT_TAKE_VOTE:    '🔥 Hot Take — Vote',
};

// ─── Section card wrapper ─────────────────────────────────────────────────────
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  accent?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}> = ({ icon, title, accent = '#ffffff', badge, children, collapsible, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#111C35] border border-white/8 rounded-2xl overflow-hidden shadow-[4px_4px_0px_black]">
      <button
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
        className={`w-full flex items-center gap-3 px-4 py-3.5 ${collapsible ? 'cursor-pointer active:bg-white/5 transition-colors' : 'cursor-default'}`}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}20` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        <span className="font-impact text-white uppercase text-[11px] tracking-widest flex-1 text-left">{title}</span>
        {badge}
        {collapsible && (
          <span className="text-white/20 shrink-0">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>
      {(!collapsible || open) && (
        <div className="px-4 pb-4">{children}</div>
      )}
    </div>
  );
};

// ─── Small badge ──────────────────────────────────────────────────────────────
const Pill: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="rounded-lg px-2 py-0.5 border border-black shrink-0" style={{ backgroundColor: color }}>
    <span className="font-impact text-[8px] text-black uppercase tracking-widest">{label}</span>
  </div>
);

// ─── MasterPage ───────────────────────────────────────────────────────────────
const MasterPage: React.FC<MasterPageProps> = ({
  isSessionActive, setSessionActive, resetSession, createNewSession, onWrapped,
  triggerBarTransition, clearBarTransition, transitionEndsAt, nextBarName,
  secureSessionId, state: s, actions: a,
  pregamePhase, pregameSubjectId, setPregamePhase, triggerCountdown, clearCountdown,
  spotlightDisabled, setSpotlightDisabled, challengeCooldownSecs, setChallengeCooldown,
}) => {
  const { t, language } = useLanguage();

  // ── QR fullscreen
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);

  // ── Confirmation modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNewSessionConfirm, setShowNewSessionConfirm] = useState(false);

  // ── Loading states
  const [isResetting, setIsResetting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isWrapping, setIsWrapping] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // ── Challenges
  const [dbChallenges, setDbChallenges] = useState<any[]>([]);
  const [showChallenges, setShowChallenges] = useState(false);

  // ── Player management
  const [showPlayers, setShowPlayers] = useState(false);
  const [playersList, setPlayersList] = useState<Array<{id: string; pseudo: string; emoji: string; score: number; status: string}>>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [kickingPlayerId, setKickingPlayerId] = useState<string | null>(null);
  const [kickConfirmId, setKickConfirmId] = useState<string | null>(null);
  const [renamingPlayerId, setRenamingPlayerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isSavingRename, setIsSavingRename] = useState(false);

  // ── Master validations
  const [pendingValidations, setPendingValidations] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  // Witness mode per validation
  const [witnessMode, setWitnessMode] = useState<Record<string, boolean>>({});
  const [witnessSelectedPlayer, setWitnessSelectedPlayer] = useState<Record<string, string>>({});
  const [sendingWitnessId, setSendingWitnessId] = useState<string | null>(null);

  // ── Player count
  const [playerCount, setPlayerCount] = useState(0);
  useEffect(() => {
    if (!secureSessionId) { setPlayerCount(0); return; }
    supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', secureSessionId)
      .then(({ count }) => setPlayerCount(count ?? 0));
    const ch = supabase
      .channel(`player_count_${secureSessionId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'players',
        filter: `session_id=eq.${secureSessionId}`,
      }, () => setPlayerCount(prev => prev + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [secureSessionId]);

  // ── Pre-game
  const [tlSubmissions, setTlSubmissions] = useState<Array<{player_id: string; nickname: string}>>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isLaunchingPhase, setIsLaunchingPhase] = useState(false);

  useEffect(() => {
    if (!secureSessionId || !isSessionActive) { setTlSubmissions([]); return; }
    gameService.getTruthLieSubmissions(secureSessionId).then((subs: any[]) => {
      const mapped = subs.map((s: any) => ({ player_id: s.player_id, nickname: s.nickname }));
      setTlSubmissions(mapped);
      if (mapped.length > 0 && !selectedSubjectId) setSelectedSubjectId(mapped[0].player_id);
    }).catch(() => {});
  }, [secureSessionId, isSessionActive, pregamePhase]);

  const handleSetPhase = async (phase: string | null, subjectId?: string | null) => {
    if (!setPregamePhase) return;
    setIsLaunchingPhase(true);
    try { await setPregamePhase(phase, subjectId); }
    finally { setIsLaunchingPhase(false); }
  };

  const handleLaunchGame = async () => {
    if (!triggerCountdown) return;
    setIsLaunchingPhase(true);
    try {
      await triggerCountdown(3);
      setTimeout(() => { setPregamePhase?.(null); }, 3500);
    } finally { setIsLaunchingPhase(false); }
  };

  // ── Subscribe master validations
  useEffect(() => {
    if (!secureSessionId || !isSessionActive) { setPendingValidations([]); return; }
    const unsub = gameService.subscribeMasterValidations(secureSessionId, setPendingValidations);
    return unsub;
  }, [secureSessionId, isSessionActive]);

  // ── Auto-load players list so witness picker is always populated
  useEffect(() => {
    if (!secureSessionId || !isSessionActive) { setPlayersList([]); return; }
    refreshPlayers();
  }, [secureSessionId, isSessionActive]);

  const handleApproveValidation = async (v: any) => {
    setApprovingId(v.id);
    try { await gameService.approveMasterValidation(v); }
    catch (e) { console.error(e); alert('Erreur lors de l\'approbation'); }
    finally { setApprovingId(null); }
  };

  const handleRejectValidation = async (validationId: string) => {
    await gameService.rejectMasterValidation(validationId);
  };

  const handleSendWitness = async (v: any) => {
    const witnessId = witnessSelectedPlayer[v.id];
    if (!witnessId) return;
    setSendingWitnessId(v.id);
    try {
      await gameService.requestWitnessConfirmation(v.id, witnessId);
      setWitnessMode(prev => ({ ...prev, [v.id]: false }));
    } catch (e) { console.error(e); }
    finally { setSendingWitnessId(null); }
  };

  // ── Bar transition
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [barNameInput, setBarNameInput] = useState('');
  const [isTriggeringTransition, setIsTriggeringTransition] = useState(false);
  const [transitionSecondsLeft, setTransitionSecondsLeft] = useState(0);

  useEffect(() => {
    if (!transitionEndsAt) { setTransitionSecondsLeft(0); return; }
    const update = () => setTransitionSecondsLeft(Math.max(0, Math.ceil((transitionEndsAt - Date.now()) / 1000)));
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [transitionEndsAt]);

  const handleTriggerTransition = async () => {
    setIsTriggeringTransition(true);
    try {
      await triggerBarTransition(selectedDuration, barNameInput.trim() || undefined);
      setBarNameInput('');
    } catch (e) { console.error(e); }
    finally { setIsTriggeringTransition(false); }
  };

  useEffect(() => {
    gameService.getChallenges().then(setDbChallenges);
  }, []);

  // ── Players list
  const refreshPlayers = async () => {
    if (!secureSessionId) return;
    setIsLoadingPlayers(true);
    try {
      const list = await gameService.getPlayersWithScores(secureSessionId);
      setPlayersList(list.sort((a, b) => b.score - a.score));
    } catch (e) { console.error(e); }
    finally { setIsLoadingPlayers(false); }
  };

  useEffect(() => {
    if (!showPlayers || !secureSessionId) return;
    refreshPlayers();
    const iv = setInterval(refreshPlayers, 5000);
    return () => clearInterval(iv);
  }, [showPlayers, secureSessionId]);

  const handleKickPlayer = async (playerId: string) => {
    setKickingPlayerId(playerId);
    try {
      await gameService.kickPlayer(playerId);
      setPlayersList(prev => prev.filter(p => p.id !== playerId));
      setPlayerCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error(e); }
    finally { setKickingPlayerId(null); setKickConfirmId(null); }
  };

  const handleSaveRename = async (playerId: string) => {
    if (!renameValue.trim()) return;
    setIsSavingRename(true);
    try {
      await gameService.renamePlayer(playerId, renameValue.trim());
      setPlayersList(prev => prev.map(p => p.id === playerId ? { ...p, pseudo: renameValue.trim() } : p));
      setRenamingPlayerId(null);
    } catch (e) { console.error(e); }
    finally { setIsSavingRename(false); }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try { await resetSession(); setShowResetConfirm(false); }
    catch (e) { console.error(e); }
    finally { setIsResetting(false); }
  };

  const handleCreateNew = async () => {
    setIsCreatingNew(true);
    try { await createNewSession(); setShowNewSessionConfirm(false); }
    catch (e) { console.error(e); }
    finally { setIsCreatingNew(false); }
  };

  const handleWrapped = async () => {
    setIsWrapping(true);
    try { await onWrapped(); }
    catch (e) { console.error(e); }
    finally { setIsWrapping(false); }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const challenges = language === 'fr' ? CHALLENGES_FR : CHALLENGES_EN;
      await gameService.simulatePlayers(challenges);
    } catch (e) { console.error(e); }
    finally { setIsSimulating(false); }
  };

  const qrColor = secureSessionId ? sessionColor(secureSessionId) : '#ffffff';

  return (
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col overflow-hidden">
      <BackgroundParticles />

      {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 pt-8 pb-3 z-10">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-[#FFD700]" fill="currentColor" />
          <span className="font-impact text-white uppercase text-[13px] tracking-widest italic">MASTER</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Player count */}
          {isSessionActive && secureSessionId && (
            <button
              onClick={() => setShowPlayers(true)}
              className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-xl px-2.5 py-1.5 active:bg-white/15 transition-all"
            >
              <Users size={12} className="text-white/60" />
              <span className="font-impact text-white text-[11px] uppercase tracking-wide">{playerCount}</span>
            </button>
          )}
          {/* Session status pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[2px] border-black shadow-[3px_3px_0px_black] ${isSessionActive ? 'bg-[#00FF9D]' : 'bg-[#FF2E63]'}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span className="font-impact text-black uppercase text-[10px] tracking-widest">
              {isSessionActive ? 'ACTIVE' : 'FERMÉE'}
            </span>
          </div>
        </div>
      </header>

      {/* ── VALIDATIONS ALERT BANNER (always on top) ──────────────────────── */}
      {isSessionActive && pendingValidations.length > 0 && (
        <div className="shrink-0 mx-4 mb-2 z-10 animate-in slide-in-from-top-1 duration-200">
          <div className="bg-[#FF2D6A] border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-black/10">
              <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center shrink-0">
                <span className="font-impact text-[#FF2D6A] text-[9px]">{pendingValidations.length}</span>
              </div>
              <span className="font-impact text-black uppercase text-[10px] tracking-widest flex-1">
                {pendingValidations.length} validation{pendingValidations.length > 1 ? 's' : ''} en attente
              </span>
            </div>
            <div className="flex flex-col gap-2 px-3 py-3 max-h-52 overflow-y-auto no-scrollbar">
              {pendingValidations.map((v: any) => (
                <div key={v.id} className="bg-black/20 rounded-xl p-3">
                  {/* Player info + challenge */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl leading-none shrink-0">{v.player_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-impact text-white uppercase text-[12px] tracking-tight">{v.player_nickname}</span>
                      <p className="font-impact text-white/60 text-[9px] uppercase tracking-wide truncate">{v.challenge_text}</p>
                    </div>
                  </div>

                  {/* Witness mode toggle */}
                  {!witnessMode[v.id] ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveValidation(v)}
                        disabled={approvingId === v.id}
                        className="flex-1 py-2 bg-white text-black rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {approvingId === v.id
                          ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                          : <><Check size={12} strokeWidth={3} /> OK</>}
                      </button>
                      <button
                        onClick={() => setWitnessMode(prev => ({ ...prev, [v.id]: true }))}
                        className="flex-1 py-2 bg-[#FF8C00] text-black rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
                      >
                        <Eye size={12} strokeWidth={3} /> Témoin
                      </button>
                      <button
                        onClick={() => handleRejectValidation(v.id)}
                        className="w-9 h-9 bg-black/30 border border-white/20 rounded-lg flex items-center justify-center active:scale-90 transition-transform shrink-0"
                      >
                        <X size={14} className="text-white/60" strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    /* Witness picker */
                    <div className="flex flex-col gap-2">
                      <p className="font-impact text-white/70 uppercase text-[9px] tracking-widest">
                        Qui était le témoin ?
                      </p>
                      <select
                        value={witnessSelectedPlayer[v.id] ?? ''}
                        onChange={e => setWitnessSelectedPlayer(prev => ({ ...prev, [v.id]: e.target.value }))}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 font-impact text-white text-[11px] uppercase focus:outline-none focus:border-white/40"
                      >
                        <option value="">— choisir un joueur —</option>
                        {playersList.map(p => (
                          <option key={p.id} value={p.id}>{p.emoji} {p.pseudo}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendWitness(v)}
                          disabled={!witnessSelectedPlayer[v.id] || sendingWitnessId === v.id}
                          className="flex-1 py-2 bg-[#FF8C00] text-black rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                        >
                          {sendingWitnessId === v.id
                            ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                            : <><Eye size={11} strokeWidth={3} /> Envoyer</>}
                        </button>
                        <button
                          onClick={() => setWitnessMode(prev => ({ ...prev, [v.id]: false }))}
                          className="px-3 py-2 bg-black/30 border border-white/20 rounded-lg font-impact uppercase text-[9px] text-white/60 active:scale-90 transition-transform"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1 flex flex-col gap-3 no-scrollbar z-10">

        {/* ── QR + SESSION CONTROL ──────────────────────────────────────── */}
        <Section
          icon={<Power size={14} strokeWidth={3} />}
          title="Session"
          accent="#00FF9D"
          badge={isSessionActive ? <Pill color="#00FF9D" label="LIVE" /> : undefined}
        >
          {/* Open / Close */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setSessionActive(true)}
              className={`py-3.5 rounded-xl border-[2px] border-black font-impact uppercase text-[10px] tracking-widest flex flex-col items-center gap-1 transition-all ${
                isSessionActive
                  ? 'bg-[#00FF9D] shadow-none translate-x-[1px] translate-y-[1px]'
                  : 'bg-white/10 text-white shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
            >
              <DoorOpen size={20} className={isSessionActive ? 'text-black' : 'text-white'} strokeWidth={2.5} />
              <span className={isSessionActive ? 'text-black' : 'text-white/70'}>{t('open')}</span>
            </button>
            <button
              onClick={() => setSessionActive(false)}
              className={`py-3.5 rounded-xl border-[2px] border-black font-impact uppercase text-[10px] tracking-widest flex flex-col items-center gap-1 transition-all ${
                !isSessionActive
                  ? 'bg-[#FF2E63] shadow-none translate-x-[1px] translate-y-[1px]'
                  : 'bg-white/10 text-white shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
            >
              <DoorClosed size={20} className={!isSessionActive ? 'text-white' : 'text-white'} strokeWidth={2.5} />
              <span className={!isSessionActive ? 'text-white' : 'text-white/70'}>{t('closed')}</span>
            </button>
          </div>

          {/* QR code — hero */}
          {secureSessionId ? (
            <button
              onClick={() => setShowQRFullscreen(true)}
              className="relative w-full group mb-3"
            >
              <div
                className="bg-white mx-auto rounded-2xl p-3 w-fit border-[4px] shadow-[6px_6px_0px_black] group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-[2px_2px_0px_black] transition-all"
                style={{ borderColor: qrColor }}
              >
                <QRCodeSVG
                  value={`${window.location.origin}${window.location.pathname}?s=${secureSessionId}`}
                  size={160}
                  level="H"
                  fgColor="#000000"
                />
              </div>
              <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                <div className="bg-black/70 text-white rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                  <Expand size={12} strokeWidth={2.5} />
                  <span className="font-impact text-[9px] uppercase tracking-widest">Plein écran</span>
                </div>
              </div>
            </button>
          ) : (
            <div className="border-[2px] border-dashed border-white/10 rounded-2xl p-6 text-center mb-3">
              <p className="font-impact text-white/30 uppercase text-[10px] tracking-widest">
                Crée une nouvelle session<br />pour générer le QR
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowNewSessionConfirm(true)}
              className="w-full py-3.5 bg-[#00FF9D] text-black rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Sparkles size={15} strokeWidth={3} /> {t('create_new_session')}
            </button>
            <button
              onClick={() => a.setView(s.cells.length > 0 ? AppView.GAME : AppView.NICKNAME)}
              className="w-full py-3 bg-white/10 text-white rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-white/10 active:bg-white/15 transition-all"
            >
              <Gamepad2 size={14} strokeWidth={2.5} /> {t('back_to_game')}
            </button>
          </div>
        </Section>

        {/* ── PRE-GAME ──────────────────────────────────────────────────── */}
        {isSessionActive && (
          <Section
            icon={<Sparkles size={14} strokeWidth={3} />}
            title="Pré-Game"
            accent="#A78BFA"
            collapsible
            defaultOpen={!!pregamePhase}
            badge={pregamePhase ? <Pill color="#A78BFA" label={PREGAME_LABELS[pregamePhase] ?? pregamePhase} /> : undefined}
          >
            {!pregamePhase ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSetPhase('TRUTH_LIE_SUBMIT')}
                  disabled={isLaunchingPhase || !setPregamePhase}
                  className="flex-1 py-3 bg-[#A78BFA] text-white rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 flex flex-col items-center gap-0.5"
                >
                  <span className="text-base leading-none">🎭</span>
                  <span>Vérité/Mensonge</span>
                </button>
                <button
                  onClick={() => handleSetPhase('HOT_TAKE_SUBMIT')}
                  disabled={isLaunchingPhase || !setPregamePhase}
                  className="flex-1 py-3 bg-[#FF8C00] text-white rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 flex flex-col items-center gap-0.5"
                >
                  <span className="text-base leading-none">🔥</span>
                  <span>Hot Takes</span>
                </button>
              </div>
            ) : pregamePhase === 'TRUTH_LIE_SUBMIT' ? (
              <div className="flex flex-col gap-2">
                <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
                  <span className="font-impact text-white/50 uppercase text-[10px] tracking-widest">
                    {tlSubmissions.length} soumission{tlSubmissions.length !== 1 ? 's' : ''} reçue{tlSubmissions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {tlSubmissions.length > 0 && (
                  <>
                    <select
                      value={selectedSubjectId}
                      onChange={e => setSelectedSubjectId(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 font-impact text-white text-[11px] uppercase focus:outline-none focus:border-white/30"
                    >
                      {tlSubmissions.map(sub => (
                        <option key={sub.player_id} value={sub.player_id}>{sub.nickname}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSetPhase('TRUTH_LIE_VOTE', selectedSubjectId)}
                      disabled={isLaunchingPhase || !selectedSubjectId}
                      className="w-full py-2.5 bg-[#A78BFA] text-white rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                    >
                      <ChevronRight size={14} strokeWidth={3} /> Passer au Vote
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleSetPhase('HOT_TAKE_SUBMIT')}
                  disabled={isLaunchingPhase}
                  className="w-full py-2 bg-[#FF8C00] text-white rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40"
                >
                  🔥 Passer Hot Takes
                </button>
                <button onClick={() => handleSetPhase(null)} disabled={isLaunchingPhase} className="w-full py-2 bg-white/5 border border-red-400/30 text-red-400 rounded-xl font-impact uppercase text-[8px] tracking-widest flex items-center justify-center gap-1 transition-all">
                  <StopCircle size={12} /> Arrêter pré-game
                </button>
              </div>
            ) : pregamePhase === 'TRUTH_LIE_VOTE' ? (
              <div className="flex flex-col gap-2">
                <div className="bg-[#A78BFA]/10 border border-[#A78BFA]/30 rounded-xl px-3 py-2 text-center">
                  <span className="font-impact text-[#A78BFA] uppercase text-[9px] tracking-widest">
                    Sujet: {tlSubmissions.find(sub => sub.player_id === pregameSubjectId)?.nickname ?? '—'}
                  </span>
                </div>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 font-impact text-white text-[11px] uppercase focus:outline-none"
                >
                  {tlSubmissions.map(sub => (
                    <option key={sub.player_id} value={sub.player_id}>{sub.nickname}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleSetPhase('TRUTH_LIE_VOTE', selectedSubjectId)}
                  disabled={isLaunchingPhase || !selectedSubjectId}
                  className="w-full py-2.5 bg-[#A78BFA] text-white rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40"
                >
                  Sujet suivant →
                </button>
                <button
                  onClick={() => handleSetPhase('HOT_TAKE_SUBMIT')}
                  disabled={isLaunchingPhase}
                  className="w-full py-2 bg-[#FF8C00] text-white rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40"
                >
                  🔥 Passer Hot Takes
                </button>
                <button onClick={() => handleSetPhase(null)} disabled={isLaunchingPhase} className="w-full py-2 bg-white/5 border border-red-400/30 text-red-400 rounded-xl font-impact uppercase text-[8px] tracking-widest flex items-center justify-center gap-1">
                  <StopCircle size={12} /> Arrêter pré-game
                </button>
              </div>
            ) : pregamePhase === 'HOT_TAKE_SUBMIT' ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSetPhase('HOT_TAKE_VOTE')}
                  disabled={isLaunchingPhase}
                  className="w-full py-2.5 bg-[#FF8C00] text-white rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <ChevronRight size={14} strokeWidth={3} /> Lancer le Vote
                </button>
                <button onClick={() => handleSetPhase(null)} disabled={isLaunchingPhase} className="w-full py-2 bg-white/5 border border-red-400/30 text-red-400 rounded-xl font-impact uppercase text-[8px] tracking-widest flex items-center justify-center gap-1">
                  <StopCircle size={12} /> Arrêter pré-game
                </button>
              </div>
            ) : pregamePhase === 'HOT_TAKE_VOTE' ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleLaunchGame}
                  disabled={isLaunchingPhase || !triggerCountdown}
                  className="w-full py-4 bg-[#00FF9D] text-black rounded-xl font-impact uppercase text-[13px] tracking-widest border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Play size={18} strokeWidth={3} fill="currentColor" />
                  {isLaunchingPhase ? 'Lancement...' : '🚀 Lancer le Jeu !'}
                </button>
                <button onClick={() => handleSetPhase(null)} disabled={isLaunchingPhase} className="w-full py-2 bg-white/5 border border-red-400/30 text-red-400 rounded-xl font-impact uppercase text-[8px] tracking-widest flex items-center justify-center gap-1">
                  <StopCircle size={12} /> Arrêter pré-game
                </button>
              </div>
            ) : (
              <button onClick={() => handleSetPhase(null)} className="w-full py-2 bg-white/5 border border-red-400/30 text-red-400 rounded-xl font-impact uppercase text-[8px] tracking-widest flex items-center justify-center gap-1">
                <StopCircle size={12} /> Réinitialiser pré-game
              </button>
            )}
          </Section>
        )}

        {/* ── SPOTLIGHT + CADENCE ───────────────────────────────────────── */}
        {isSessionActive && (setSpotlightDisabled || setChallengeCooldown) && (
          <Section
            icon={<Zap size={14} strokeWidth={3} />}
            title="Contrôles"
            accent="#FFD700"
            collapsible
            defaultOpen={false}
          >
            {/* Spotlight toggle */}
            {setSpotlightDisabled && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-impact text-white uppercase text-[11px] tracking-widest">Spotlight ⚡</p>
                  <p className="font-impact text-white/30 uppercase text-[8px] tracking-widest mt-0.5">
                    {spotlightDisabled ? 'Désactivé' : 'Actif — cellule bonus / 30 min'}
                  </p>
                </div>
                <button
                  onClick={() => setSpotlightDisabled(!spotlightDisabled)}
                  className={`relative w-12 h-6 rounded-full border-[2px] border-black transition-all shadow-[2px_2px_0px_black] ${spotlightDisabled ? 'bg-white/10' : 'bg-[#FFD700]'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white border-[2px] border-black rounded-full transition-all shadow-[1px_1px_0px_black] ${spotlightDisabled ? 'left-0.5' : 'left-[22px]'}`} />
                </button>
              </div>
            )}

            {/* Cadence */}
            {setChallengeCooldown && (
              <div>
                <p className="font-impact text-white uppercase text-[10px] tracking-widest mb-2">
                  Cadence entre défis
                  {(challengeCooldownSecs ?? 0) > 0 && (
                    <span className="ml-2 text-[#FFD700]">— {challengeCooldownSecs}s</span>
                  )}
                </p>
                <div className="flex gap-1.5">
                  {[0, 30, 60, 120, 300].map(secs => (
                    <button
                      key={secs}
                      onClick={() => setChallengeCooldown(secs)}
                      className={`flex-1 py-2 rounded-xl font-impact text-[10px] uppercase border-[2px] border-black transition-all ${
                        (challengeCooldownSecs ?? 0) === secs
                          ? 'bg-[#FFD700] text-black shadow-none translate-x-[1px] translate-y-[1px]'
                          : 'bg-white/10 text-white shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                      }`}
                    >
                      {secs === 0 ? 'OFF' : secs < 60 ? `${secs}s` : `${secs / 60}m`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── BAR TRANSITION ────────────────────────────────────────────── */}
        <Section
          icon={<MapPin size={14} strokeWidth={3} fill="currentColor" />}
          title={language === 'fr' ? 'Changement de bar' : 'Bar Change'}
          accent="#FF2D6A"
          collapsible
          defaultOpen={!!transitionEndsAt}
          badge={transitionEndsAt ? <Pill color="#FF2D6A" label="ACTIF" /> : undefined}
        >
          {transitionEndsAt ? (
            <div className="flex items-center justify-between bg-[#FF2D6A]/15 border border-[#FF2D6A]/30 rounded-xl p-3">
              <div>
                <p className="font-impact text-white/50 uppercase text-[9px] tracking-widest">
                  {nextBarName ? nextBarName : 'Countdown actif'}
                </p>
                <p className="font-impact text-white text-2xl italic">
                  {Math.floor(transitionSecondsLeft / 60)}:{String(transitionSecondsLeft % 60).padStart(2, '0')}
                </p>
              </div>
              <button
                onClick={clearBarTransition}
                className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              >
                <XCircle size={20} className="text-[#FF2D6A]" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1.5">
                {[2, 5, 10, 15].map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`flex-1 py-2 rounded-xl font-impact text-[11px] uppercase border-[2px] border-black transition-all ${
                      selectedDuration === d
                        ? 'bg-white text-black shadow-none translate-x-[1px] translate-y-[1px]'
                        : 'bg-white/10 text-white shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                    }`}
                  >
                    {d}{language === 'fr' ? 'min' : 'm'}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={barNameInput}
                onChange={e => setBarNameInput(e.target.value)}
                placeholder={language === 'fr' ? 'Nom du bar (optionnel)' : 'Bar name (optional)'}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 font-impact text-white text-[11px] uppercase focus:border-white/30 focus:outline-none placeholder:text-white/20 transition-all"
              />
              <button
                onClick={handleTriggerTransition}
                disabled={isTriggeringTransition}
                className="w-full py-3 bg-[#FF2D6A] text-white rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
              >
                <Clock size={15} strokeWidth={3} />
                {isTriggeringTransition
                  ? 'Envoi...'
                  : `Lancer countdown (${selectedDuration} min)`}
              </button>
            </div>
          )}
        </Section>

        {/* ── AUTRES ACTIONS ────────────────────────────────────────────── */}
        <Section
          icon={<List size={14} strokeWidth={3} />}
          title="Actions"
          accent="#ffffff"
          collapsible
          defaultOpen={false}
        >
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowChallenges(true)}
                className="py-3 bg-white/10 text-white rounded-xl font-impact uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 border border-white/10 active:bg-white/15 transition-all"
              >
                <List size={13} strokeWidth={2.5} /> {dbChallenges.length} Défis
              </button>
              <button
                onClick={() => { refreshPlayers(); setShowPlayers(true); }}
                className="py-3 bg-white/10 text-white rounded-xl font-impact uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 border border-white/10 active:bg-white/15 transition-all"
              >
                <Users size={13} strokeWidth={2.5} /> {playerCount} Joueurs
              </button>
            </div>
            <button
              onClick={handleWrapped}
              disabled={isWrapping}
              className="w-full py-3 bg-[#FFD700] text-black rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
            >
              <PartyPopper size={14} className={isWrapping ? 'animate-bounce' : ''} strokeWidth={2.5} />
              {isWrapping ? 'Fermeture...' : 'Fin de soirée (Wrapped)'}
            </button>
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl font-impact uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:bg-white/10 transition-all disabled:opacity-50"
            >
              <Users size={12} className={isSimulating ? 'animate-bounce' : ''} strokeWidth={2.5} />
              {isSimulating ? 'Déploiement...' : 'Simuler 5 joueurs'}
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 bg-white/3 border border-red-500/20 text-red-400 rounded-xl font-impact uppercase text-[8px] tracking-widest flex items-center justify-center gap-1.5 active:bg-red-500/10 transition-all"
            >
              <Trash2 size={11} strokeWidth={2.5} /> {t('reset_session')}
            </button>
          </div>
        </Section>

        <div className="text-center pt-2">
          <span className="font-impact text-white/15 uppercase text-[9px] tracking-widest">V{APP_VERSION}</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODALS                                                                  */}
      {/* ─────────────────────────────────────────────────────────────────────── */}

      {/* RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#111C35] border-[3px] border-black rounded-2xl p-8 relative shadow-[10px_10px_0px_#FF2E63] animate-in zoom-in duration-300">
            <button onClick={() => setShowResetConfirm(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors">
              <X size={22} strokeWidth={2.5} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 border-[2px] border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <h3 className="text-2xl font-impact text-white uppercase tracking-tighter italic mb-2">
                {t('reset_session')}
              </h3>
              <p className="text-sm font-medium text-white/40 leading-tight">
                {t('reset_session_confirm')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="w-full bg-[#FF2E63] text-white font-impact uppercase py-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
              >
                {isResetting ? t('loading') : t('reset_session_btn')}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full bg-white/10 text-white font-impact uppercase py-3 rounded-xl border border-white/20 active:bg-white/15 transition-all"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SESSION CONFIRMATION */}
      {showNewSessionConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#111C35] border-[3px] border-black rounded-2xl p-8 relative shadow-[10px_10px_0px_#00FF9D] animate-in zoom-in duration-300">
            <button onClick={() => setShowNewSessionConfirm(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors">
              <X size={22} strokeWidth={2.5} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#00FF9D]/10 border-[2px] border-[#00FF9D]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-[#00FF9D]" />
              </div>
              <h3 className="text-2xl font-impact text-white uppercase tracking-tighter italic mb-2">
                {t('create_new_session')}
              </h3>
              <p className="text-sm font-medium text-white/40 leading-tight">
                {t('create_new_session_confirm')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreateNew}
                disabled={isCreatingNew}
                className="w-full bg-[#00FF9D] text-black font-impact uppercase py-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
              >
                {isCreatingNew ? t('loading') : t('create_new_session_btn')}
              </button>
              <button
                onClick={() => setShowNewSessionConfirm(false)}
                className="w-full bg-white/10 text-white font-impact uppercase py-3 rounded-xl border border-white/20 active:bg-white/15 transition-all"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHALLENGES LIST MODAL */}
      {showChallenges && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111C35] border-[3px] border-black rounded-2xl p-6 relative shadow-[10px_10px_0px_black] flex flex-col max-h-[80vh]">
            <button onClick={() => setShowChallenges(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/60 z-10 transition-colors">
              <X size={22} strokeWidth={2.5} />
            </button>
            <h3 className="text-2xl font-impact text-white uppercase tracking-tighter italic mb-4">
              DÉFIS ({dbChallenges.length})
            </h3>
            <div className="overflow-y-auto flex-1 pr-1 space-y-2 no-scrollbar">
              {dbChallenges.map((c, i) => (
                <div key={i} className="p-3 bg-white/5 border border-white/8 rounded-xl flex items-center gap-3">
                  <span className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center font-impact text-white/40 text-[10px] italic shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-impact uppercase text-white/30 mb-0.5">{c.type}</div>
                    <div className="text-[11px] font-medium text-white/70 leading-tight">
                      {language === 'fr' ? (c.text_fr || c.text) : (c.text_en || c.text)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PLAYER LIST MODAL */}
      {showPlayers && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111C35] border-[3px] border-black rounded-2xl p-6 relative shadow-[10px_10px_0px_black] flex flex-col max-h-[85vh]">
            <button onClick={() => setShowPlayers(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/60 z-10 transition-colors">
              <X size={22} strokeWidth={2.5} />
            </button>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-impact text-white uppercase tracking-tighter italic">
                JOUEURS ({playersList.length})
              </h3>
              <button
                onClick={refreshPlayers}
                disabled={isLoadingPlayers}
                className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center active:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw size={15} className={`text-white/40 ${isLoadingPlayers ? 'animate-spin' : ''}`} strokeWidth={2.5} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-2 no-scrollbar">
              {isLoadingPlayers && playersList.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin mx-auto" />
                </div>
              ) : playersList.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-impact text-[11px] uppercase tracking-widest text-white/20">Aucun joueur</p>
                </div>
              ) : (
                playersList.map((player, i) => (
                  <div key={player.id} className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
                    <div className="p-3 flex items-center gap-3">
                      {/* Rank */}
                      <span className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center font-impact text-white/40 text-[10px] italic shrink-0">
                        {i + 1}
                      </span>
                      {/* Emoji */}
                      <span className="text-2xl leading-none shrink-0">{player.emoji}</span>

                      {/* Name — either display or rename input */}
                      {renamingPlayerId === player.id ? (
                        <div className="flex-1 flex gap-2 min-w-0">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(player.id); if (e.key === 'Escape') setRenamingPlayerId(null); }}
                            autoFocus
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 font-impact text-white text-[11px] uppercase focus:outline-none focus:border-white/40 min-w-0"
                          />
                          <button
                            onClick={() => handleSaveRename(player.id)}
                            disabled={isSavingRename}
                            className="w-8 h-8 bg-[#00FF9D] border border-black rounded-lg flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 shrink-0"
                          >
                            {isSavingRename
                              ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                              : <Check size={14} className="text-black" strokeWidth={3} />}
                          </button>
                          <button
                            onClick={() => setRenamingPlayerId(null)}
                            className="w-8 h-8 bg-white/10 border border-white/15 rounded-lg flex items-center justify-center active:scale-90 transition-transform shrink-0"
                          >
                            <X size={14} className="text-white/50" strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="font-impact text-white text-[13px] uppercase tracking-tight truncate">{player.pseudo}</div>
                            <div className={`text-[9px] font-impact uppercase tracking-widest ${player.status === 'ACTIVE' ? 'text-[#00FF9D]' : 'text-white/20'}`}>
                              {player.status === 'ACTIVE' ? '● EN JEU' : '○ EN ATTENTE'}
                            </div>
                          </div>
                          {player.status === 'ACTIVE' && (
                            <div className="bg-[#FFD700] border-[2px] border-black rounded-lg px-2 py-0.5 shadow-[2px_2px_0px_black] shrink-0">
                              <span className="font-impact text-black text-[12px]">{player.score}/25</span>
                            </div>
                          )}
                          {/* Rename button */}
                          <button
                            onClick={() => { setRenamingPlayerId(player.id); setRenameValue(player.pseudo); }}
                            className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center active:bg-white/15 transition-all shrink-0"
                            title="Renommer"
                          >
                            <Pencil size={13} className="text-white/30" strokeWidth={2.5} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Kick — inline confirm */}
                    {renamingPlayerId !== player.id && (
                      kickConfirmId === player.id ? (
                        <div className="flex gap-2 px-3 pb-3 -mt-1">
                          <button
                            onClick={() => handleKickPlayer(player.id)}
                            disabled={kickingPlayerId === player.id}
                            className="flex-1 py-2 bg-[#FF2E63] text-white rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {kickingPlayerId === player.id
                              ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                              : <><UserX size={12} strokeWidth={3} /> Confirmer kick</>}
                          </button>
                          <button
                            onClick={() => setKickConfirmId(null)}
                            className="px-3 py-2 bg-white/10 border border-white/15 text-white/50 rounded-lg font-impact uppercase text-[9px] active:bg-white/15 transition-all"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setKickConfirmId(player.id)}
                          className="w-full py-1.5 border-t border-white/5 flex items-center justify-center gap-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-500/5 transition-all"
                        >
                          <UserX size={11} strokeWidth={2.5} />
                          <span className="font-impact uppercase text-[8px] tracking-widest">Kick</span>
                        </button>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN QR */}
      {showQRFullscreen && secureSessionId && (
        <div className="fixed inset-0 z-[200] bg-[#0A1629] flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
          <button
            onClick={() => setShowQRFullscreen(false)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 border-[2px] border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
          <p className="font-impact text-white/30 uppercase text-[10px] tracking-[0.4em] mb-6">
            {language === 'fr' ? 'Scanne pour rejoindre' : 'Scan to join'}
          </p>
          <div
            className="bg-white p-6 rounded-3xl border-[6px] shadow-[10px_10px_0px_black] mb-8"
            style={{ borderColor: qrColor }}
          >
            <QRCodeSVG
              value={`${window.location.origin}${window.location.pathname}?s=${secureSessionId}`}
              size={260}
              level="H"
              fgColor="#000000"
            />
          </div>
          <h1 className="font-impact text-white uppercase italic tracking-tighter text-5xl leading-none mb-2">
            BINGO CRAWL
          </h1>
          {playerCount > 0 && (
            <div className="flex items-center gap-2 bg-[#00F5A0] border-[3px] border-black rounded-2xl px-5 py-2 shadow-[4px_4px_0px_black] mt-6">
              <Users size={18} className="text-black" strokeWidth={3} />
              <span className="font-impact text-black uppercase text-lg tracking-wide">
                {playerCount} joueur{playerCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MasterPage;
