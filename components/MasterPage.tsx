
import React, { useState, useEffect, useRef } from 'react';
import {
  Power, DoorOpen, DoorClosed, Gamepad2, Crown, Trash2, AlertTriangle, X,
  Users, List, Sparkles, PartyPopper, MapPin, Clock, XCircle, Expand,
  Play, ChevronRight, StopCircle, UserX, RefreshCw, Check, Zap, Pencil,
  Eye, ChevronDown, ChevronUp, QrCode, Loader2, KeyRound,
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
  setPregamePhase?: (phase: string | null) => Promise<void>;
  triggerCountdown?: (seconds: number) => Promise<void>;
  clearCountdown?: () => Promise<void>;
  spotlightDisabled?: boolean;
  setSpotlightDisabled?: (disabled: boolean) => Promise<void>;
  challengeCooldownSecs?: number;
  setChallengeCooldown?: (secs: number) => Promise<void>;
  isGamePaused?: boolean;
  setGamePaused?: (paused: boolean) => Promise<void>;
  // 5.x bar cadence & chaos
  currentBar?: number;
  barCadence?: string;
  chaosMode?: boolean;
  maxValidationsPerBar?: number;
  advanceBar?: () => Promise<void>;
  setBarCadenceValue?: (cadence: string) => Promise<void>;
  setChaosMode?: (chaos: boolean) => Promise<void>;
  setMaxValidationsPerBar?: (max: number) => Promise<void>;
}

const PREGAME_LABELS: Record<string, string> = {
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
  strong?: boolean; // hero visual weight (SESSION card)
}> = ({ icon, title, accent = '#ffffff', badge, children, collapsible, defaultOpen = true, strong }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-[#1A1A2E] border rounded-2xl overflow-hidden ${strong ? 'border-white/20 shadow-[5px_5px_0px_black]' : 'border-white/10 shadow-[3px_3px_0px_black]'}`}>
      <button
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 ${collapsible ? 'cursor-pointer active:bg-white/5 transition-colors' : 'cursor-default'}`}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}20` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        <span className="font-impact text-white uppercase text-[12px] tracking-widest flex-1 text-left">{title}</span>
        {badge}
        {collapsible && (
          <span className="text-white/30 shrink-0 ml-1">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>
      {(!collapsible || open) && (
        <div className="border-t border-white/8 px-3 pt-2 pb-3">{children}</div>
      )}
    </div>
  );
};

// ─── Small badge ──────────────────────────────────────────────────────────────
const Pill: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="rounded-lg px-2.5 py-1 border border-black shrink-0" style={{ backgroundColor: color }}>
    <span className="font-impact text-[10px] text-black uppercase tracking-widest">{label}</span>
  </div>
);

// ─── MasterPage ───────────────────────────────────────────────────────────────
const MasterPage: React.FC<MasterPageProps> = ({
  isSessionActive, setSessionActive, resetSession, createNewSession, onWrapped,
  triggerBarTransition, clearBarTransition, transitionEndsAt, nextBarName,
  secureSessionId, state: s, actions: a,
  pregamePhase, setPregamePhase, triggerCountdown, clearCountdown,
  spotlightDisabled, setSpotlightDisabled, challengeCooldownSecs, setChallengeCooldown,
  isGamePaused, setGamePaused,
  currentBar = 1, barCadence = '1,2,2', chaosMode = false, maxValidationsPerBar = 0,
  advanceBar, setBarCadenceValue, setChaosMode, setMaxValidationsPerBar,
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
  const [playersList, setPlayersList] = useState<Array<{
    id: string; pseudo: string; emoji: string; score: number; status: string;
    deviceId: string | null; lastSeenAt: string | null; gameId: string | null;
  }>>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [kickingPlayerId, setKickingPlayerId] = useState<string | null>(null);
  const [kickConfirmId, setKickConfirmId] = useState<string | null>(null);
  const [renamingPlayerId, setRenamingPlayerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [clearingDeviceId, setClearingDeviceId] = useState<string | null>(null);
  // ── Recovery QR (4.3)
  const [recoveryQR, setRecoveryQR] = useState<{ playerId: string; token: string | null; loading: boolean } | null>(null);

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
  const [isLaunchingPhase, setIsLaunchingPhase] = useState(false);

  const handleSetPhase = async (phase: string | null) => {
    if (!setPregamePhase) return;
    setIsLaunchingPhase(true);
    try { await setPregamePhase(phase); }
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

  // Players list is now kept live via subscribePlayersWithScores — no separate auto-load needed

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

  // ── Players list — realtime subscription (active whenever session is live)
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
    if (!secureSessionId || !isSessionActive) { setPlayersList([]); return; }
    // Realtime subscription — updates list instantly on any player/game change
    const unsub = gameService.subscribePlayersWithScores(secureSessionId, (list) => {
      setPlayersList(list.sort((a, b) => b.score - a.score));
      setIsLoadingPlayers(false);
    });
    setIsLoadingPlayers(true);
    return unsub;
  }, [secureSessionId, isSessionActive]);

  // Compute double connections from current playersList
  const doubleConnections = React.useMemo(() => {
    const map = new Map<string, typeof playersList>();
    for (const p of playersList) {
      if (!p.deviceId) continue;
      if (!map.has(p.deviceId)) map.set(p.deviceId, []);
      map.get(p.deviceId)!.push(p);
    }
    return [...map.values()].filter(g => g.length > 1);
  }, [playersList]);

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

  // Clear device lock only — keeps the game intact (player reconnects on same device or another)
  const handleClearDeviceLock = async (playerId: string) => {
    setClearingDeviceId(playerId);
    try {
      await gameService.clearDeviceLock(playerId);
      setPlayersList(prev => prev.map(p => p.id === playerId ? { ...p, deviceId: null } : p));
    } catch (e) { console.error(e); }
    finally { setClearingDeviceId(null); }
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
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col">
      {/* Background particles — absolute z:0 */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <BackgroundParticles />
      </div>

      {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
      <header className="relative shrink-0 flex items-center justify-between px-4 pb-2.5" style={{ zIndex: 20, paddingTop: 'max(40px, env(safe-area-inset-top, 0px) + 8px)' }}>
        <div className="flex items-center gap-2.5">
          <Crown size={20} className="text-[#FFD700]" fill="currentColor" />
          <span className="font-impact text-white uppercase text-lg tracking-widest italic">MASTER</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Player count */}
          {isSessionActive && secureSessionId && (
            <button
              onClick={() => setShowPlayers(true)}
              className="flex items-center gap-1.5 bg-white/8 border border-white/15 rounded-xl px-3 py-2 active:bg-white/15 transition-all"
            >
              <Users size={14} className="text-white/60" />
              <span className="font-impact text-white text-sm uppercase tracking-wide">{playerCount}</span>
            </button>
          )}
          {/* Session status pill */}
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-[2px] border-black shadow-[3px_3px_0px_black] ${isSessionActive ? 'bg-[#00FF9D]' : 'bg-[#FF2E63]'}`}>
            <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="font-impact text-black uppercase text-[11px] tracking-widest">
              {isSessionActive ? 'ACTIVE' : 'FERMÉE'}
            </span>
          </div>
        </div>
      </header>

      {/* ── VALIDATIONS ALERT BANNER (always on top) ──────────────────────── */}
      {isSessionActive && pendingValidations.length > 0 && (
        <div className="relative shrink-0 mx-4 mb-2" style={{ zIndex: 20 }}>
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
      <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 pt-2 flex flex-col gap-2 no-scrollbar" style={{ zIndex: 10, paddingBottom: 'max(48px, env(safe-area-inset-bottom, 0px) + 32px)' }}>

        {/* ── QR + SESSION CONTROL ──────────────────────────────────────── */}
        <Section
          icon={<Power size={14} strokeWidth={3} />}
          title="Session"
          accent="#00FF9D"
          strong
          badge={isSessionActive ? <Pill color="#00FF9D" label="LIVE" /> : undefined}
        >
          <div className="flex flex-col gap-2">

          {/* Open / Close */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSessionActive(true)}
              className={`py-3 rounded-xl border-[2px] border-black font-impact uppercase text-[12px] tracking-widest flex flex-col items-center gap-1.5 transition-all ${
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
              className={`py-3 rounded-xl border-[2px] border-black font-impact uppercase text-[12px] tracking-widest flex flex-col items-center gap-1.5 transition-all ${
                !isSessionActive
                  ? 'bg-[#FF2E63] shadow-none translate-x-[1px] translate-y-[1px]'
                  : 'bg-white/10 text-white shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
            >
              <DoorClosed size={20} className="text-white" strokeWidth={2.5} />
              <span className={!isSessionActive ? 'text-white' : 'text-white/70'}>{t('closed')}</span>
            </button>
          </div>

          {/* Pause button — only when session active */}
          {isSessionActive && setGamePaused && (
            <button
              onClick={() => setGamePaused(!isGamePaused)}
              className={`w-full py-3 rounded-xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black transition-all ${
                isGamePaused
                  ? 'bg-[#FFD700] text-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                  : 'bg-white/10 text-white border-white/20 shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
            >
              {isGamePaused ? (
                <><Play size={15} strokeWidth={3} fill="currentColor" /> Reprendre le jeu</>
              ) : (
                <><span className="text-base leading-none">⏸</span> Mettre en pause</>
              )}
            </button>
          )}

          {/* QR code — hero */}
          {secureSessionId ? (
            <button
              onClick={() => setShowQRFullscreen(true)}
              className="relative w-full group"
            >
              <div
                className="bg-white mx-auto rounded-2xl p-3 w-fit border-[4px] shadow-[6px_6px_0px_black] group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-[2px_2px_0px_black] transition-all"
                style={{ borderColor: qrColor }}
              >
                <QRCodeSVG
                  value={`${window.location.origin}${window.location.pathname}?s=${secureSessionId}`}
                  size={120}
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
            <div className="border-[2px] border-dashed border-white/10 rounded-2xl p-6 text-center">
              <p className="font-impact text-white/30 uppercase text-[10px] tracking-widest">
                Crée une nouvelle session<br />pour générer le QR
              </p>
            </div>
          )}

          {/* Launch game — direct CTA when session is active */}
          {isSessionActive && triggerCountdown && (
            <button
              onClick={handleLaunchGame}
              disabled={isLaunchingPhase}
              className="w-full py-4 bg-[#00FF9D] text-black rounded-xl font-impact uppercase text-[14px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40"
            >
              <Play size={18} strokeWidth={3} fill="currentColor" />
              {isLaunchingPhase ? 'Lancement...' : '🚀 Lancer le Jeu !'}
            </button>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setShowNewSessionConfirm(true)}
              className="w-full py-3.5 bg-[#00FF9D] text-black rounded-xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Sparkles size={16} strokeWidth={3} /> {t('create_new_session')}
            </button>
            <button
              onClick={() => a.setView(s.cells.length > 0 ? AppView.GAME : AppView.NICKNAME)}
              className="w-full py-3 bg-white/10 text-white rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 border border-white/15 active:bg-white/15 transition-all"
            >
              <Gamepad2 size={15} strokeWidth={2.5} /> {t('back_to_game')}
            </button>
          </div>

          </div>{/* end flex flex-col gap-3 */}
        </Section>

        {/* ── RÉGLAGES (spotlight, cadence, bar flow, chaos) ─────────────── */}
        {isSessionActive && (
          <Section
            icon={<Zap size={13} strokeWidth={3} />}
            title="Réglages"
            accent="#FFD700"
            collapsible
            defaultOpen={false}
          >
            <div className="flex flex-col gap-4">
            {/* Spotlight toggle */}
            {setSpotlightDisabled && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-impact text-white uppercase text-[13px] tracking-wide">Spotlight ⚡</p>
                  <p className="font-impact text-white/40 uppercase text-[10px] tracking-widest mt-0.5">
                    {spotlightDisabled ? 'Désactivé' : 'Actif — cellule bonus / 30 min'}
                  </p>
                </div>
                <button
                  onClick={() => setSpotlightDisabled(!spotlightDisabled)}
                  className={`relative w-14 h-7 rounded-full border-[2px] border-black transition-all shadow-[2px_2px_0px_black] ${spotlightDisabled ? 'bg-white/10' : 'bg-[#FFD700]'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white border-[2px] border-black rounded-full transition-all shadow-[1px_1px_0px_black] ${spotlightDisabled ? 'left-0.5' : 'left-[26px]'}`} />
                </button>
              </div>
            )}

            {/* Cadence */}
            {setChallengeCooldown && (
              <div>
                <p className="font-impact text-white uppercase text-[12px] tracking-widest mb-2.5">
                  Cadence entre défis
                  {(challengeCooldownSecs ?? 0) > 0 && (
                    <span className="ml-2 text-[#FFD700]">— {challengeCooldownSecs}s</span>
                  )}
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 30, 60, 120, 300].map(secs => (
                    <button
                      key={secs}
                      onClick={() => setChallengeCooldown(secs)}
                      className={`py-2.5 rounded-xl font-impact text-[10px] uppercase border-[2px] border-black transition-all ${
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

              {/* Current bar indicator */}
              <div>
                <p className="font-impact text-[11px] uppercase tracking-widest text-white/50 mb-2">Bar actuel</p>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(b => {
                    const cadenceGoals = (barCadence || '1,2,2').split(',').map(Number);
                    const goal = cadenceGoals[b - 1] ?? 1;
                    return (
                      <div key={b} className={`rounded-xl border-[2px] px-2 py-3 text-center transition-all ${
                        b === currentBar
                          ? 'bg-[#FF8C00]/20 border-[#FF8C00] shadow-[2px_2px_0px_black]'
                          : b < currentBar
                          ? 'bg-white/5 border-white/5 opacity-40'
                          : 'bg-white/5 border-white/10'
                      }`}>
                        <div className="font-impact text-[10px] text-white/40 uppercase tracking-widest">Bar {b}</div>
                        <div className={`font-impact text-[22px] leading-tight ${b === currentBar ? 'text-[#FF8C00]' : 'text-white/30'}`}>{goal}</div>
                        <div className="font-impact text-[9px] text-white/30 uppercase">ligne{goal > 1 ? 's' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advance bar button — primary action of the evening */}
              {currentBar < 3 && advanceBar && (() => {
                const cadenceGoals = (barCadence || '1,2,2').split(',').map(Number);
                const nextGoal = cadenceGoals[currentBar] ?? 0;
                return (
                  <div className="rounded-2xl border-[3px] border-[#FF8C00]/40 bg-[#FF8C00]/8 p-3 flex flex-col gap-2.5">
                    {/* Preview of what unlocks */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-[3px]">
                        {Array.from({ length: 5 }).map((_, colIdx) => (
                          <div key={colIdx} className="flex flex-col gap-[3px]">
                            {Array.from({ length: 5 }).map((_, rowIdx) => {
                              const currentlyUnlocked = cadenceGoals.slice(0, currentBar).reduce((a, b) => a + b, 0);
                              const willUnlock = cadenceGoals.slice(0, currentBar + 1).reduce((a, b) => a + b, 0);
                              const isActive = rowIdx < currentlyUnlocked;
                              const isNew = rowIdx >= currentlyUnlocked && rowIdx < willUnlock;
                              return (
                                <div
                                  key={rowIdx}
                                  className={`w-[10px] h-[10px] rounded-[2px] transition-all ${
                                    isNew    ? 'bg-[#FF8C00] animate-pulse' :
                                    isActive ? 'bg-[#00F5A0]/70' :
                                               'bg-white/8 border border-white/10'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1">
                        <p className="font-impact text-[10px] text-[#FF8C00] uppercase tracking-widest leading-none mb-1">
                          Prochain déblocage
                        </p>
                        <p className="font-impact text-white/60 text-[11px] uppercase tracking-wide">
                          +{nextGoal} ligne{nextGoal > 1 ? 's' : ''} pour tous les joueurs
                        </p>
                      </div>
                    </div>
                    {/* CTA */}
                    <button
                      onClick={async () => { await advanceBar(); }}
                      className="w-full py-4 bg-[#FF8C00] text-black rounded-xl font-impact uppercase text-[14px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[4px_4px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                      <ChevronRight size={20} strokeWidth={3} />
                      On passe au Bar {currentBar + 1} !
                    </button>
                  </div>
                );
              })()}

              {/* Cadence selector */}
              {setBarCadenceValue && (
                <div>
                  <p className="font-impact text-[11px] uppercase tracking-widest text-white/50 mb-2.5">Format de soirée</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1,2,2', '2,2,1', '2,1,2'] as const).map(cadence => (
                      <button
                        key={cadence}
                        onClick={() => setBarCadenceValue(cadence)}
                        className={`py-3 rounded-xl font-impact text-[11px] uppercase tracking-wide border-[2px] transition-all ${
                          barCadence === cadence
                            ? 'bg-[#FF8C00] text-black border-black shadow-[2px_2px_0px_black]'
                            : 'bg-white/5 border-white/10 text-white/50 active:bg-white/10'
                        }`}
                      >
                        {cadence.replace(/,/g, '–')}
                      </button>
                    ))}
                  </div>
                  <p className="text-white/30 text-[10px] font-impact uppercase tracking-widest mt-2 text-center">
                    {barCadence === '1,2,2' ? 'Recommandé · montée en puissance' : barCadence === '2,2,1' ? 'Sprint final réduit' : 'Pic au milieu'}
                  </p>
                </div>
              )}

              {/* Anti-spam: max validations per bar */}
              {setMaxValidationsPerBar && (
                <div>
                  <p className="font-impact text-[11px] uppercase tracking-widest text-white/50 mb-2.5">Anti-spam par bar</p>
                  <div className="flex gap-2">
                    {[0, 2, 3, 5].map(val => (
                      <button
                        key={val}
                        onClick={() => setMaxValidationsPerBar(val)}
                        className={`flex-1 py-3 rounded-xl font-impact text-[12px] uppercase border-[2px] transition-all ${
                          maxValidationsPerBar === val
                            ? 'bg-[#00F5A0] text-black border-black shadow-[2px_2px_0px_black]'
                            : 'bg-white/5 border-white/10 text-white/50 active:bg-white/10'
                        }`}
                      >
                        {val === 0 ? '∞' : val}
                      </button>
                    ))}
                  </div>
                  <p className="text-white/30 text-[10px] font-impact uppercase tracking-widest mt-2 text-center">
                    {maxValidationsPerBar === 0 ? 'Illimité' : `Max ${maxValidationsPerBar} défi${maxValidationsPerBar > 1 ? 's' : ''} validé${maxValidationsPerBar > 1 ? 's' : ''} par bar`}
                  </p>
                </div>
              )}

              {/* ── EFFETS VISUELS — kill switch ──────────────────────── */}
              {secureSessionId && (
                <div className="rounded-xl border-[2px] border-[#FF2D6A]/30 bg-[#FF2D6A]/5 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-impact text-[#FF2D6A] uppercase text-[12px] tracking-wide">💥 Tuer les effets</p>
                    <p className="font-impact text-white/30 uppercase text-[9px] tracking-widest mt-0.5">
                      Spotlight + gels + taunts — reset immédiat
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await Promise.all([
                        setSpotlightDisabled?.(true),
                        gameService.clearAllTaunts(secureSessionId),
                      ]);
                    }}
                    className="shrink-0 px-3 py-2 bg-[#FF2D6A] text-white rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    RESET
                  </button>
                </div>
              )}

              {/* CHAOS MODE toggle — bar 3 only */}
              {setChaosMode && (
                <div className={`rounded-xl border-[2px] p-4 transition-all ${chaosMode ? 'border-[#FF4500] bg-[#FF4500]/10' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-impact uppercase text-[13px] tracking-wide text-white flex items-center gap-2">
                        <span>⚡</span> Mode Chaos
                      </div>
                      <p className="text-white/40 text-[10px] font-impact uppercase tracking-widest mt-0.5">
                        Bar 3 · race aux 2 dernières lignes
                      </p>
                    </div>
                    <button
                      onClick={() => setChaosMode(!chaosMode)}
                      className={`w-14 h-8 rounded-full border-[2px] border-black relative transition-all ${chaosMode ? 'bg-[#FF4500] shadow-[2px_2px_0px_black]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white border border-black shadow-[1px_1px_0px_black] transition-all duration-200 ${chaosMode ? 'left-[calc(100%-22px)]' : 'left-1'}`} />
                    </button>
                  </div>
                  {chaosMode && (
                    <p className="font-impact uppercase text-[10px] text-[#FF4500] tracking-widest mt-3 text-center animate-pulse">
                      ⚡ CHAOS ACTIVÉ — pas de cooldown, qui finit le 1er gagne
                    </p>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── BAR TRANSITION ─────────────────────────────────────────────── */}
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
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowChallenges(true)}
                className="py-3 bg-white/10 text-white rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-1.5 border border-white/15 active:bg-white/15 transition-all"
              >
                <List size={14} strokeWidth={2.5} /> {dbChallenges.length} Défis
              </button>
              <button
                onClick={() => { refreshPlayers(); setShowPlayers(true); }}
                className="py-3 bg-white/10 text-white rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-1.5 border border-white/15 active:bg-white/15 transition-all"
              >
                <Users size={14} strokeWidth={2.5} /> {playerCount} Joueurs
              </button>
            </div>
            <button
              onClick={handleWrapped}
              disabled={isWrapping}
              className="w-full py-3.5 bg-[#FFD700] text-black rounded-xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
            >
              <PartyPopper size={16} className={isWrapping ? 'animate-bounce' : ''} strokeWidth={2.5} />
              {isWrapping ? 'Fermeture...' : 'Fin de soirée (Wrapped)'}
            </button>
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full py-3 bg-white/5 border border-white/10 text-white/60 rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:bg-white/10 transition-all disabled:opacity-50"
            >
              <Users size={13} className={isSimulating ? 'animate-bounce' : ''} strokeWidth={2.5} />
              {isSimulating ? 'Déploiement...' : 'Simuler 5 joueurs'}
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 bg-white/3 border border-red-500/20 text-red-400 rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 active:bg-red-500/10 transition-all"
            >
              <Trash2 size={13} strokeWidth={2.5} /> {t('reset_session')}
            </button>
          </div>
        </Section>

        <div className="text-center pt-2">
          <span className="font-impact text-white/15 uppercase text-[9px] tracking-widest">V{APP_VERSION}</span>
        </div>
      </div>{/* end scrollable content */}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODALS                                                                  */}
      {/* ─────────────────────────────────────────────────────────────────────── */}

      {/* RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#1A1A2E] border-[3px] border-black rounded-2xl p-8 relative shadow-[10px_10px_0px_#FF2E63] animate-in zoom-in duration-300">
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
        <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#1A1A2E] border-[3px] border-black rounded-2xl p-8 relative shadow-[10px_10px_0px_#00FF9D] animate-in zoom-in duration-300">
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
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#1A1A2E] border-[3px] border-black rounded-2xl p-6 relative shadow-[10px_10px_0px_black] flex flex-col max-h-[80vh]">
            <button onClick={() => setShowChallenges(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/60 z-10 transition-colors">
              <X size={22} strokeWidth={2.5} />
            </button>
            <h3 className="text-2xl font-impact text-white uppercase tracking-tighter italic mb-4">
              DÉFIS ({dbChallenges.length})
            </h3>
            <div className="overflow-y-auto flex-1 pr-1 space-y-2 no-scrollbar">
              {dbChallenges.map((c, i) => (
                <div key={i} className="p-3 bg-white/5 border border-white/15 rounded-xl flex items-center gap-3">
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
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#1A1A2E] border-[3px] border-black rounded-2xl relative shadow-[10px_10px_0px_black] flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-impact text-white uppercase tracking-tighter italic">
                  JOUEURS
                </h3>
                <div className="bg-white/10 border border-white/15 rounded-lg px-2.5 py-0.5 flex items-center gap-1.5">
                  {isLoadingPlayers && playersList.length === 0
                    ? <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                    : <span className="font-impact text-white text-sm">{playersList.length}</span>}
                  {isLoadingPlayers && playersList.length > 0 && (
                    <span className="w-2.5 h-2.5 border border-white/20 border-t-white/40 rounded-full animate-spin ml-0.5" />
                  )}
                </div>
                {doubleConnections.length > 0 && (
                  <div className="bg-[#FF8C00] border-[2px] border-black rounded-lg px-2 py-0.5 shadow-[2px_2px_0px_black] flex items-center gap-1">
                    <span className="font-impact text-black text-[10px] uppercase tracking-widest">⚠ {doubleConnections.length} conflit{doubleConnections.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setShowPlayers(false)} className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-2 no-scrollbar">

              {/* ── Double connexions alert ──────────────────────────────── */}
              {doubleConnections.length > 0 && (
                <div className="bg-[#FF8C00]/10 border-[2px] border-[#FF8C00]/40 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#FF8C00]/20">
                    <span className="text-[#FF8C00] text-sm">⚠</span>
                    <span className="font-impact text-[#FF8C00] uppercase text-[11px] tracking-widest flex-1">
                      Double{doubleConnections.length > 1 ? 's' : ''} connexion{doubleConnections.length > 1 ? 's' : ''} détectée{doubleConnections.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    {doubleConnections.map((group, gi) => (
                      <div key={gi} className="bg-black/20 rounded-xl p-2.5 flex flex-col gap-1.5">
                        <p className="font-impact text-white/40 uppercase text-[9px] tracking-widest mb-0.5">
                          Même appareil ({group[0].deviceId?.slice(0, 8)}…)
                        </p>
                        <div className="flex flex-col gap-1">
                          {group.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                              <span className="text-lg leading-none">{p.emoji}</span>
                              <span className="font-impact text-white text-[12px] uppercase flex-1 truncate">{p.pseudo}</span>
                              <span className="font-impact text-white/40 text-[10px]">{p.score}/25</span>
                              <button
                                onClick={() => handleClearDeviceLock(p.id)}
                                disabled={clearingDeviceId === p.id}
                                className="px-2.5 py-1.5 bg-[#00FF9D]/15 border border-[#00FF9D]/30 text-[#00FF9D] rounded-lg font-impact uppercase text-[9px] tracking-widest active:bg-[#00FF9D]/25 transition-all disabled:opacity-40 flex items-center gap-1"
                                title="Libérer ce device — le joueur peut se reconnecter"
                              >
                                {clearingDeviceId === p.id
                                  ? <span className="w-2.5 h-2.5 border border-[#00FF9D]/30 border-t-[#00FF9D] rounded-full animate-spin" />
                                  : <>Libérer</>}
                              </button>
                              <button
                                onClick={() => setKickConfirmId(p.id)}
                                className="w-7 h-7 bg-red-500/10 border border-red-500/20 text-red-400/60 rounded-lg flex items-center justify-center active:bg-red-500/20 transition-all"
                                title="Kick"
                              >
                                <UserX size={12} strokeWidth={2.5} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Players list ───────────────────────────────────────────── */}
              {playersList.length === 0 && !isLoadingPlayers ? (
                <div className="text-center py-10">
                  <p className="font-impact text-[11px] uppercase tracking-widest text-white/20">Aucun joueur</p>
                </div>
              ) : (
                playersList.map((player, i) => {
                  const lines = Math.floor(player.score / 5);
                  const isInDoubleConn = doubleConnections.some(g => g.some(p => p.id === player.id));
                  return (
                    <div key={player.id} className={`bg-white/5 border rounded-xl overflow-hidden transition-all ${isInDoubleConn ? 'border-[#FF8C00]/40' : 'border-white/10'}`}>
                      <div className="p-3 flex items-center gap-3">
                        {/* Rank */}
                        <span className="w-6 h-6 bg-white/8 rounded-md flex items-center justify-center font-impact text-white/30 text-[9px] italic shrink-0">
                          {i + 1}
                        </span>
                        {/* Emoji */}
                        <span className="text-xl leading-none shrink-0">{player.emoji}</span>

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
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-impact text-white text-[13px] uppercase tracking-tight truncate">{player.pseudo}</span>
                                {isInDoubleConn && (
                                  <span className="text-[#FF8C00] text-[10px] shrink-0" title="Double connexion détectée">⚠</span>
                                )}
                                {player.deviceId && !isInDoubleConn && (
                                  <span className="text-white/20 text-[9px] shrink-0" title="Device lié">🔒</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[9px] font-impact uppercase tracking-widest ${player.status === 'ACTIVE' ? 'text-[#00FF9D]' : 'text-white/20'}`}>
                                  {player.status === 'ACTIVE' ? '● EN JEU' : '○ EN ATTENTE'}
                                </span>
                                {player.status === 'ACTIVE' && lines > 0 && (
                                  <span className="text-[9px] font-impact uppercase text-[#FFD700]/60">
                                    {lines} ligne{lines > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            {player.status === 'ACTIVE' && (
                              <div className="flex flex-col items-end gap-0.5 shrink-0">
                                <div className="bg-[#FFD700] border-[2px] border-black rounded-lg px-2 py-0.5 shadow-[2px_2px_0px_black]">
                                  <span className="font-impact text-black text-[12px]">{player.score}/25</span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#FFD700] rounded-full transition-all"
                                    style={{ width: `${(player.score / 25) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {/* Rename button */}
                            <button
                              onClick={() => { setRenamingPlayerId(player.id); setRenameValue(player.pseudo); }}
                              className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center active:bg-white/15 transition-all shrink-0"
                              title="Renommer"
                            >
                              <Pencil size={12} className="text-white/30" strokeWidth={2.5} />
                            </button>
                            {/* Recovery QR */}
                            <button
                              onClick={async () => {
                                setRecoveryQR({ playerId: player.id, token: null, loading: true });
                                try {
                                  const token = await gameService.generateRecoveryToken(player.id);
                                  setRecoveryQR({ playerId: player.id, token, loading: false });
                                } catch {
                                  setRecoveryQR(null);
                                }
                              }}
                              className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center active:bg-white/15 transition-all shrink-0"
                              title="QR de récupération de compte"
                            >
                              <QrCode size={12} className="text-white/30" strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Actions row */}
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
                                : <><UserX size={12} strokeWidth={3} /> Kick définitif</>}
                            </button>
                            <button
                              onClick={() => setKickConfirmId(null)}
                              className="px-3 py-2 bg-white/10 border border-white/15 text-white/50 rounded-lg font-impact uppercase text-[9px] active:bg-white/15 transition-all"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="flex border-t border-white/5">
                            {/* Libérer device — garde la partie, déverrouille le device */}
                            {player.deviceId && (
                              <button
                                onClick={() => handleClearDeviceLock(player.id)}
                                disabled={clearingDeviceId === player.id}
                                className="flex-1 py-1.5 flex items-center justify-center gap-1 text-[#00FF9D]/50 hover:text-[#00FF9D] hover:bg-[#00FF9D]/5 transition-all border-r border-white/5 disabled:opacity-40"
                                title="Libérer le verrou device — la partie reste intacte"
                              >
                                {clearingDeviceId === player.id
                                  ? <span className="w-2.5 h-2.5 border border-[#00FF9D]/30 border-t-[#00FF9D] rounded-full animate-spin" />
                                  : <KeyRound size={11} strokeWidth={2.5} />}
                                <span className="font-impact uppercase text-[8px] tracking-widest">Device</span>
                              </button>
                            )}
                            {/* Reconnexion forcée — reset partie + device */}
                            <button
                              onClick={async () => {
                                await gameService.resetPlayerGame(player.id);
                              }}
                              className="flex-1 py-1.5 flex items-center justify-center gap-1 text-[#FFD700]/50 hover:text-[#FFD700] hover:bg-[#FFD700]/5 transition-all border-r border-white/5"
                              title="Reset jeu + déverrouille device (le joueur repart de zéro)"
                            >
                              <RefreshCw size={11} strokeWidth={2.5} />
                              <span className="font-impact uppercase text-[8px] tracking-widest">Reset</span>
                            </button>
                            <button
                              onClick={() => setKickConfirmId(player.id)}
                              className="flex-1 py-1.5 flex items-center justify-center gap-1 text-red-400/50 hover:text-red-400 hover:bg-red-500/5 transition-all"
                            >
                              <UserX size={11} strokeWidth={2.5} />
                              <span className="font-impact uppercase text-[8px] tracking-widest">Kick</span>
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECOVERY QR MODAL (4.3) */}
      {recoveryQR && (
        <div className="fixed inset-0 z-[210] bg-black/85 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-[#1A1A2E] border-[3px] border-white/15 rounded-3xl p-6 w-full max-w-xs shadow-[8px_8px_0px_black] flex flex-col items-center gap-5 relative">
            <button
              onClick={() => setRecoveryQR(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <X size={18} strokeWidth={2.5} className="text-white/40" />
            </button>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl">🔑</span>
              <h3 className="font-impact uppercase text-[#FFD700] text-[15px] tracking-wide">QR de récupération</h3>
              <p className="text-white/40 text-[10px] font-impact uppercase tracking-widest">
                {playersList.find(p => p.id === recoveryQR.playerId)?.pseudo ?? '...'}
              </p>
            </div>
            {recoveryQR.loading ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <Loader2 size={32} className="text-white/30 animate-spin" />
              </div>
            ) : recoveryQR.token ? (
              <div className="bg-white p-4 rounded-2xl border-[4px] border-[#FFD700] shadow-[4px_4px_0px_black]">
                <QRCodeSVG
                  value={`${window.location.origin}${window.location.pathname}?s=${secureSessionId}&recover=${recoveryQR.token}`}
                  size={180}
                  level="H"
                  fgColor="#000000"
                />
              </div>
            ) : null}
            <p className="text-white/30 text-[9px] font-impact uppercase tracking-widest text-center">
              Valable 24h · 1 scan suffit
            </p>
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
