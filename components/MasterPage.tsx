
import React, { useState, useEffect } from 'react';
import {
  Power, DoorOpen, DoorClosed, Trash2, AlertTriangle, X,
  Users, List, Sparkles, PartyPopper, MapPin, Clock, XCircle, Expand,
  Play, ChevronRight, UserX, RefreshCw, Check, Zap, Pencil,
  Eye, ChevronDown, ChevronUp, QrCode, Loader2, KeyRound, Crown,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppView } from '../types';
import { APP_VERSION, CHALLENGES_EN, CHALLENGES_FR } from '../constants';
import { gameService } from '../services/gameService';
import { supabase } from '../lib/supabaseClient';

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
  currentBar?: number;
  barCadence?: string;
  chaosMode?: boolean;
  maxValidationsPerBar?: number;
  advanceBar?: () => Promise<void>;
  setBarCadenceValue?: (cadence: string) => Promise<void>;
  setChaosMode?: (chaos: boolean) => Promise<void>;
  setMaxValidationsPerBar?: (max: number) => Promise<void>;
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card: React.FC<{
  accent?: string;
  badge?: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  hero?: boolean;
}> = ({ accent = '#ffffff', badge, title, icon, children, collapsible, defaultOpen = true, hero }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: hero ? `2px solid ${accent}` : '2px solid rgba(255,255,255,0.08)',
        boxShadow: hero ? `4px 4px 0px black, 0 0 20px ${accent}15` : '3px 3px 0px black',
      }}
    >
      <button
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
        className={`w-full flex items-center gap-3 px-4 py-3 ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ background: hero ? `${accent}12` : 'transparent' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}20`, border: `1.5px solid ${accent}40` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
        <span className="font-impact text-white uppercase text-[13px] tracking-widest flex-1 text-left leading-none">
          {title}
        </span>
        {badge}
        {collapsible && (
          <span className="text-white/30 shrink-0 ml-1">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>
      {(!collapsible || open) && (
        <div className="px-4 pt-1 pb-4 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Pill badge ───────────────────────────────────────────────────────────────
const Pill: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="rounded-lg px-2.5 py-1 border border-black shrink-0" style={{ backgroundColor: color }}>
    <span className="font-impact text-[10px] text-black uppercase tracking-widest">{label}</span>
  </div>
);

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle: React.FC<{ on: boolean; color?: string; onToggle: () => void }> = ({ on, color = '#FFD700', onToggle }) => (
  <button
    onClick={onToggle}
    className="relative shrink-0 transition-all"
    style={{
      width: 52, height: 28,
      borderRadius: 14,
      border: '2px solid black',
      background: on ? color : 'rgba(255,255,255,0.1)',
      boxShadow: '2px 2px 0px black',
    }}
  >
    <div
      className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-200"
      style={{
        border: '2px solid black',
        boxShadow: '1px 1px 0px black',
        left: on ? 'calc(100% - 22px)' : 3,
      }}
    />
  </button>
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

  const [showQRFullscreen, setShowQRFullscreen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNewSessionConfirm, setShowNewSessionConfirm] = useState(false);

  const [isResetting, setIsResetting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isWrapping, setIsWrapping] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const [dbChallenges, setDbChallenges] = useState<any[]>([]);
  const [showChallenges, setShowChallenges] = useState(false);

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
  const [recoveryQR, setRecoveryQR] = useState<{ playerId: string; token: string | null; loading: boolean } | null>(null);

  const [pendingValidations, setPendingValidations] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [witnessMode, setWitnessMode] = useState<Record<string, boolean>>({});
  const [witnessSelectedPlayer, setWitnessSelectedPlayer] = useState<Record<string, string>>({});
  const [sendingWitnessId, setSendingWitnessId] = useState<string | null>(null);

  const [playerCount, setPlayerCount] = useState(0);
  useEffect(() => {
    if (!secureSessionId) { setPlayerCount(0); return; }
    supabase.from('players').select('id', { count: 'exact', head: true })
      .eq('session_id', secureSessionId)
      .then(({ count }) => setPlayerCount(count ?? 0));
    const ch = supabase.channel(`player_count_${secureSessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players', filter: `session_id=eq.${secureSessionId}` },
        () => setPlayerCount(prev => prev + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [secureSessionId]);

  const [isLaunchingPhase, setIsLaunchingPhase] = useState(false);
  const handleLaunchGame = async () => {
    if (!triggerCountdown) return;
    setIsLaunchingPhase(true);
    try {
      await triggerCountdown(3);
      setTimeout(() => { setPregamePhase?.(null); }, 3500);
    } finally { setIsLaunchingPhase(false); }
  };

  useEffect(() => {
    if (!secureSessionId || !isSessionActive) { setPendingValidations([]); return; }
    const unsub = gameService.subscribeMasterValidations(secureSessionId, setPendingValidations);
    return unsub;
  }, [secureSessionId, isSessionActive]);

  const handleApproveValidation = async (v: any) => {
    setApprovingId(v.id);
    try { await gameService.approveMasterValidation(v); }
    catch (e) { console.error(e); }
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

  useEffect(() => { gameService.getChallenges().then(setDbChallenges); }, []);

  useEffect(() => {
    if (!secureSessionId || !isSessionActive) { setPlayersList([]); return; }
    const unsub = gameService.subscribePlayersWithScores(secureSessionId, (list) => {
      setPlayersList(list.sort((a, b) => b.score - a.score));
      setIsLoadingPlayers(false);
    });
    setIsLoadingPlayers(true);
    return unsub;
  }, [secureSessionId, isSessionActive]);

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

  const qrColor = secureSessionId ? sessionColor(secureSessionId) : '#FFD700';

  // ─── Shared button styles ───────────────────────────────────────────────────
  const btnPrimary = (color: string) =>
    `w-full py-4 rounded-xl font-impact uppercase text-[14px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 text-black`;
  const btnSecondary =
    'w-full py-3 rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all text-white/60 active:text-white';

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0A1629' }}>

      {/* Subtle dot grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header
        className="relative shrink-0 flex items-center justify-between px-4 pb-3 border-b border-white/8"
        style={{ zIndex: 20, paddingTop: 'max(44px, env(safe-area-inset-top, 0px) + 10px)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FFD70020', border: '2px solid #FFD70040' }}>
            <Crown size={16} className="text-[#FFD700]" fill="currentColor" />
          </div>
          <span className="font-impact text-white uppercase text-xl tracking-widest italic leading-none">MASTER</span>
        </div>
        <div className="flex items-center gap-2">
          {isSessionActive && secureSessionId && (
            <button
              onClick={() => setShowPlayers(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 active:bg-white/10 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)' }}
            >
              <Users size={13} className="text-white/50" />
              <span className="font-impact text-white text-sm uppercase tracking-wide">{playerCount}</span>
            </button>
          )}
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-[2px] border-black shadow-[3px_3px_0px_black]"
            style={{ background: isSessionActive ? '#00FF9D' : '#FF2E63' }}
          >
            <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="font-impact text-black uppercase text-[11px] tracking-widest">
              {isSessionActive ? 'LIVE' : 'OFF'}
            </span>
          </div>
        </div>
      </header>

      {/* ── VALIDATIONS BANNER ──────────────────────────────────────────────── */}
      {isSessionActive && pendingValidations.length > 0 && (
        <div className="relative shrink-0 mx-4 mt-3" style={{ zIndex: 20 }}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#FF2D6A', border: '3px solid black', boxShadow: '4px 4px 0px black' }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-black/10">
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center shrink-0">
                <span className="font-impact text-[#FF2D6A] text-[10px] font-bold">{pendingValidations.length}</span>
              </div>
              <span className="font-impact text-black uppercase text-[11px] tracking-widest flex-1">
                {pendingValidations.length} validation{pendingValidations.length > 1 ? 's' : ''} en attente
              </span>
            </div>
            <div className="flex flex-col gap-2 px-3 py-3 max-h-56 overflow-y-auto no-scrollbar">
              {pendingValidations.map((v: any) => (
                <div key={v.id} className="bg-black/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl leading-none shrink-0">{v.player_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-impact text-white uppercase text-[12px] tracking-tight leading-none">{v.player_nickname}</p>
                      <p className="font-impact text-white/60 text-[9px] uppercase tracking-wide truncate mt-0.5">{v.challenge_text}</p>
                    </div>
                  </div>
                  {!witnessMode[v.id] ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveValidation(v)}
                        disabled={approvingId === v.id}
                        className="flex-1 py-2 bg-white text-black rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {approvingId === v.id ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" /> : <><Check size={12} strokeWidth={3} /> OK</>}
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
                    <div className="flex flex-col gap-2">
                      <p className="font-impact text-white/70 uppercase text-[9px] tracking-widest">Qui était le témoin ?</p>
                      <select
                        value={witnessSelectedPlayer[v.id] ?? ''}
                        onChange={e => setWitnessSelectedPlayer(prev => ({ ...prev, [v.id]: e.target.value }))}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 font-impact text-white text-[11px] uppercase focus:outline-none"
                      >
                        <option value="">— choisir —</option>
                        {playersList.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.pseudo}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendWitness(v)}
                          disabled={!witnessSelectedPlayer[v.id] || sendingWitnessId === v.id}
                          className="flex-1 py-2 bg-[#FF8C00] text-black rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                        >
                          {sendingWitnessId === v.id ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" /> : <><Eye size={11} strokeWidth={3} /> Envoyer</>}
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

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────────────────── */}
      <div
        className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-3 flex flex-col gap-3 no-scrollbar"
        style={{ zIndex: 10, paddingBottom: 'max(48px, env(safe-area-inset-bottom, 0px) + 32px)' }}
      >

        {/* ── SESSION ─────────────────────────────────────────────────────── */}
        <Card
          icon={<Power size={15} strokeWidth={2.5} />}
          title="Session"
          accent="#00FF9D"
          hero
          badge={isSessionActive ? <Pill color="#00FF9D" label="LIVE" /> : undefined}
        >

          {/* Open / Close */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSessionActive(true)}
              className="py-3 rounded-xl border-[2px] border-black font-impact uppercase text-[12px] tracking-widest flex flex-col items-center gap-1.5 transition-all"
              style={{
                background: isSessionActive ? '#00FF9D' : 'rgba(255,255,255,0.07)',
                color: isSessionActive ? 'black' : 'rgba(255,255,255,0.6)',
                boxShadow: isSessionActive ? 'none' : '3px 3px 0px black',
                transform: isSessionActive ? 'translate(1px,1px)' : undefined,
              }}
            >
              <DoorOpen size={20} strokeWidth={2.5} />
              <span>{t('open')}</span>
            </button>
            <button
              onClick={() => setSessionActive(false)}
              className="py-3 rounded-xl border-[2px] border-black font-impact uppercase text-[12px] tracking-widest flex flex-col items-center gap-1.5 transition-all text-white"
              style={{
                background: !isSessionActive ? '#FF2E63' : 'rgba(255,255,255,0.07)',
                boxShadow: !isSessionActive ? 'none' : '3px 3px 0px black',
                transform: !isSessionActive ? 'translate(1px,1px)' : undefined,
              }}
            >
              <DoorClosed size={20} strokeWidth={2.5} />
              <span style={{ opacity: !isSessionActive ? 1 : 0.6 }}>{t('closed')}</span>
            </button>
          </div>

          {/* Pause */}
          {isSessionActive && setGamePaused && (
            <button
              onClick={() => setGamePaused(!isGamePaused)}
              className="w-full py-3 rounded-xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black transition-all"
              style={{
                background: isGamePaused ? '#FFD700' : 'rgba(255,255,255,0.07)',
                color: isGamePaused ? 'black' : 'white',
                boxShadow: '3px 3px 0px black',
              }}
            >
              {isGamePaused
                ? <><Play size={15} strokeWidth={3} fill="currentColor" /> Reprendre</>
                : <><span className="text-base leading-none">⏸</span> Pause</>}
            </button>
          )}

          {/* QR */}
          {secureSessionId ? (
            <button onClick={() => setShowQRFullscreen(true)} className="w-full group">
              <div
                className="bg-white mx-auto rounded-2xl p-3 w-fit transition-all group-active:translate-x-[2px] group-active:translate-y-[2px]"
                style={{ border: `4px solid ${qrColor}`, boxShadow: `6px 6px 0px black` }}
              >
                <QRCodeSVG
                  value={`${window.location.origin}${window.location.pathname.replace('/master', '')}?s=${secureSessionId}`}
                  size={120} level="H" fgColor="#000000"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Expand size={11} className="text-white/30" strokeWidth={2} />
                <span className="font-impact text-white/30 uppercase text-[9px] tracking-widest">Tap pour agrandir</span>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl p-6 text-center" style={{ border: '2px dashed rgba(255,255,255,0.1)' }}>
              <p className="font-impact text-white/30 uppercase text-[10px] tracking-widest">
                Crée une session<br />pour générer le QR
              </p>
            </div>
          )}

          {/* Launch CTA */}
          {isSessionActive && triggerCountdown && (
            <button
              onClick={handleLaunchGame}
              disabled={isLaunchingPhase}
              className={btnPrimary('#00FF9D')}
              style={{ background: '#00FF9D' }}
            >
              <Play size={18} strokeWidth={3} fill="currentColor" />
              {isLaunchingPhase ? 'Lancement...' : '🚀 Lancer le Jeu !'}
            </button>
          )}

          {/* New session */}
          <button
            onClick={() => setShowNewSessionConfirm(true)}
            className={btnPrimary('#FFD700')}
            style={{ background: '#FFD700' }}
          >
            <Sparkles size={16} strokeWidth={3} /> {t('create_new_session')}
          </button>

        </Card>

        {/* ── RÉGLAGES ──────────────────────────────────────────────────────── */}
        {isSessionActive && (
          <Card
            icon={<Zap size={14} strokeWidth={2.5} />}
            title="Réglages"
            accent="#FFD700"
            collapsible
            defaultOpen={false}
          >
            {/* Spotlight */}
            {setSpotlightDisabled && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-impact text-white uppercase text-[13px] tracking-wide">Spotlight ⚡</p>
                  <p className="font-impact text-white/40 uppercase text-[10px] tracking-widest mt-0.5">
                    {spotlightDisabled ? 'Désactivé' : 'Actif — cellule bonus / 30 min'}
                  </p>
                </div>
                <Toggle on={!spotlightDisabled} color="#FFD700" onToggle={() => setSpotlightDisabled(!spotlightDisabled)} />
              </div>
            )}

            {/* Cooldown */}
            {setChallengeCooldown && (
              <div>
                <p className="font-impact text-white uppercase text-[11px] tracking-widest mb-2">
                  Cadence
                  {(challengeCooldownSecs ?? 0) > 0 && <span className="ml-2 text-[#FFD700]">· {challengeCooldownSecs}s</span>}
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 30, 60, 120, 300].map(secs => (
                    <button
                      key={secs}
                      onClick={() => setChallengeCooldown(secs)}
                      className="py-2.5 rounded-xl font-impact text-[10px] uppercase border-[2px] border-black transition-all"
                      style={{
                        background: (challengeCooldownSecs ?? 0) === secs ? '#FFD700' : 'rgba(255,255,255,0.07)',
                        color: (challengeCooldownSecs ?? 0) === secs ? 'black' : 'rgba(255,255,255,0.7)',
                        boxShadow: (challengeCooldownSecs ?? 0) === secs ? 'none' : '2px 2px 0px black',
                      }}
                    >
                      {secs === 0 ? 'OFF' : secs < 60 ? `${secs}s` : `${secs / 60}m`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bar indicator */}
            <div>
              <p className="font-impact text-[11px] uppercase tracking-widest text-white/40 mb-2">Bar actuel</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(b => {
                  const goals = (barCadence || '1,2,2').split(',').map(Number);
                  const goal = goals[b - 1] ?? 1;
                  const isActive = b === currentBar;
                  const isPast = b < currentBar;
                  return (
                    <div
                      key={b}
                      className="rounded-xl px-2 py-3 text-center transition-all"
                      style={{
                        background: isActive ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${isActive ? '#FF8C00' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isActive ? '2px 2px 0px black' : 'none',
                        opacity: isPast ? 0.35 : 1,
                      }}
                    >
                      <div className="font-impact text-[9px] text-white/40 uppercase tracking-widest">Bar {b}</div>
                      <div className="font-impact text-[22px] leading-tight" style={{ color: isActive ? '#FF8C00' : 'rgba(255,255,255,0.3)' }}>{goal}</div>
                      <div className="font-impact text-[8px] text-white/30 uppercase">ligne{goal > 1 ? 's' : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Advance bar */}
            {currentBar < 3 && advanceBar && (() => {
              const goals = (barCadence || '1,2,2').split(',').map(Number);
              const nextGoal = goals[currentBar] ?? 0;
              return (
                <div
                  className="rounded-2xl p-3 flex flex-col gap-2.5"
                  style={{ border: '2px solid rgba(255,140,0,0.35)', background: 'rgba(255,140,0,0.08)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-[3px] shrink-0">
                      {Array.from({ length: 5 }).map((_, col) => (
                        <div key={col} className="flex flex-col gap-[3px]">
                          {Array.from({ length: 5 }).map((_, row) => {
                            const unlocked = goals.slice(0, currentBar).reduce((a, b) => a + b, 0);
                            const willUnlock = goals.slice(0, currentBar + 1).reduce((a, b) => a + b, 0);
                            const isNew = row >= unlocked && row < willUnlock;
                            const isDone = row < unlocked;
                            return (
                              <div key={row} className="w-[10px] h-[10px] rounded-[2px] transition-all"
                                style={{ background: isNew ? '#FF8C00' : isDone ? 'rgba(0,245,160,0.7)' : 'rgba(255,255,255,0.08)' }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-impact text-[10px] text-[#FF8C00] uppercase tracking-widest leading-none">Prochain déblocage</p>
                      <p className="font-impact text-white/60 text-[11px] uppercase tracking-wide mt-0.5">+{nextGoal} ligne{nextGoal > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => { await advanceBar(); }}
                    className="w-full py-4 rounded-xl font-impact uppercase text-[14px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black text-black transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    style={{ background: '#FF8C00', boxShadow: '4px 4px 0px black' }}
                  >
                    <ChevronRight size={20} strokeWidth={3} />
                    On passe au Bar {currentBar + 1} !
                  </button>
                </div>
              );
            })()}

            {/* Cadence format */}
            {setBarCadenceValue && (
              <div>
                <p className="font-impact text-[11px] uppercase tracking-widest text-white/40 mb-2">Format soirée</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['1,2,2', '2,2,1', '2,1,2'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setBarCadenceValue(c)}
                      className="py-3 rounded-xl font-impact text-[11px] uppercase tracking-wide border-[2px] transition-all"
                      style={{
                        background: barCadence === c ? '#FF8C00' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${barCadence === c ? 'black' : 'rgba(255,255,255,0.1)'}`,
                        color: barCadence === c ? 'black' : 'rgba(255,255,255,0.5)',
                        boxShadow: barCadence === c ? '2px 2px 0px black' : 'none',
                      }}
                    >
                      {c.replace(/,/g, '–')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Anti-spam */}
            {setMaxValidationsPerBar && (
              <div>
                <p className="font-impact text-[11px] uppercase tracking-widest text-white/40 mb-2">Anti-spam / bar</p>
                <div className="flex gap-2">
                  {[0, 2, 3, 5].map(val => (
                    <button
                      key={val}
                      onClick={() => setMaxValidationsPerBar(val)}
                      className="flex-1 py-3 rounded-xl font-impact text-[12px] uppercase border-[2px] transition-all"
                      style={{
                        background: maxValidationsPerBar === val ? '#00F5A0' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${maxValidationsPerBar === val ? 'black' : 'rgba(255,255,255,0.1)'}`,
                        color: maxValidationsPerBar === val ? 'black' : 'rgba(255,255,255,0.5)',
                        boxShadow: maxValidationsPerBar === val ? '2px 2px 0px black' : 'none',
                      }}
                    >
                      {val === 0 ? '∞' : val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kill switch */}
            {secureSessionId && (
              <div
                className="rounded-xl p-3 flex items-center justify-between gap-3"
                style={{ background: 'rgba(255,45,106,0.08)', border: '2px solid rgba(255,45,106,0.25)' }}
              >
                <div>
                  <p className="font-impact text-[#FF2D6A] uppercase text-[12px] tracking-wide">🔥 Tuer les effets</p>
                  <p className="font-impact text-white/30 uppercase text-[9px] tracking-widest mt-0.5">Spotlight + gels + taunts</p>
                </div>
                <button
                  onClick={async () => {
                    await Promise.all([setSpotlightDisabled?.(true), gameService.clearAllTaunts(secureSessionId)]);
                  }}
                  className="shrink-0 px-3 py-2 font-impact uppercase text-[10px] tracking-widest rounded-xl border-[2px] border-black text-white transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  style={{ background: '#FF2D6A', boxShadow: '3px 3px 0px black' }}
                >
                  RESET
                </button>
              </div>
            )}

            {/* Chaos mode */}
            {setChaosMode && (
              <div
                className="rounded-xl p-4 transition-all"
                style={{
                  background: chaosMode ? 'rgba(255,69,0,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${chaosMode ? '#FF4500' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-impact text-white uppercase text-[13px] tracking-wide">⚡ Mode Chaos</p>
                    <p className="font-impact text-white/40 uppercase text-[9px] tracking-widest mt-0.5">Bar 3 · pas de cooldown</p>
                  </div>
                  <Toggle on={chaosMode} color="#FF4500" onToggle={() => setChaosMode(!chaosMode)} />
                </div>
                {chaosMode && (
                  <p className="font-impact uppercase text-[10px] text-[#FF4500] tracking-widest mt-3 text-center animate-pulse">
                    ⚡ CHAOS ACTIVÉ
                  </p>
                )}
              </div>
            )}
          </Card>
        )}

        {/* ── CHANGEMENT DE BAR ─────────────────────────────────────────────── */}
        <Card
          icon={<MapPin size={14} strokeWidth={2.5} fill="currentColor" />}
          title={language === 'fr' ? 'Changement de bar' : 'Bar Change'}
          accent="#FF2D6A"
          collapsible
          defaultOpen={!!transitionEndsAt}
          badge={transitionEndsAt ? <Pill color="#FF2D6A" label="ACTIF" /> : undefined}
        >
          {transitionEndsAt ? (
            <div
              className="flex items-center justify-between rounded-xl p-3"
              style={{ background: 'rgba(255,45,106,0.12)', border: '1.5px solid rgba(255,45,106,0.25)' }}
            >
              <div>
                {nextBarName && <p className="font-impact text-white/50 uppercase text-[9px] tracking-widest">{nextBarName}</p>}
                <p className="font-impact text-white text-2xl italic">
                  {Math.floor(transitionSecondsLeft / 60)}:{String(transitionSecondsLeft % 60).padStart(2, '0')}
                </p>
              </div>
              <button
                onClick={clearBarTransition}
                className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}
              >
                <XCircle size={20} className="text-[#FF2D6A]" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-1.5">
                {[2, 5, 10, 15].map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className="flex-1 py-2 rounded-xl font-impact text-[11px] uppercase border-[2px] border-black transition-all"
                    style={{
                      background: selectedDuration === d ? 'white' : 'rgba(255,255,255,0.07)',
                      color: selectedDuration === d ? 'black' : 'rgba(255,255,255,0.6)',
                      boxShadow: selectedDuration === d ? 'none' : '2px 2px 0px black',
                    }}
                  >
                    {d}min
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={barNameInput}
                onChange={e => setBarNameInput(e.target.value)}
                placeholder="Nom du bar (optionnel)"
                className="w-full rounded-xl px-3 py-2.5 font-impact text-white text-[11px] uppercase focus:outline-none placeholder:text-white/20 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)' }}
              />
              <button
                onClick={handleTriggerTransition}
                disabled={isTriggeringTransition}
                className="w-full py-3 rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black text-white transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
                style={{ background: '#FF2D6A', boxShadow: '4px 4px 0px black' }}
              >
                <Clock size={15} strokeWidth={3} />
                {isTriggeringTransition ? 'Envoi...' : `Lancer countdown (${selectedDuration} min)`}
              </button>
            </>
          )}
        </Card>

        {/* ── ACTIONS ───────────────────────────────────────────────────────── */}
        <Card
          icon={<List size={14} strokeWidth={2.5} />}
          title="Actions"
          accent="#93C5FD"
          collapsible
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowChallenges(true)}
              className="py-3 rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-1.5 transition-all text-white/70 active:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}
            >
              <List size={14} strokeWidth={2.5} /> {dbChallenges.length} Défis
            </button>
            <button
              onClick={() => setShowPlayers(true)}
              className="py-3 rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-1.5 transition-all text-white/70 active:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}
            >
              <Users size={14} strokeWidth={2.5} /> {playerCount} Joueurs
            </button>
          </div>
          <button
            onClick={handleWrapped}
            disabled={isWrapping}
            className="w-full py-4 rounded-xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black text-black transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
            style={{ background: '#FFD700', boxShadow: '4px 4px 0px black' }}
          >
            <PartyPopper size={16} className={isWrapping ? 'animate-bounce' : ''} strokeWidth={2.5} />
            {isWrapping ? 'Fermeture...' : 'Fin de soirée (Wrapped)'}
          </button>
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full py-3 font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all text-white/40 active:text-white/70 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)' }}
          >
            <Users size={13} className={isSimulating ? 'animate-bounce' : ''} strokeWidth={2.5} />
            {isSimulating ? 'Déploiement...' : 'Simuler 5 joueurs'}
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 rounded-xl transition-all text-red-400/60 active:text-red-400"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(239,68,68,0.15)' }}
          >
            <Trash2 size={13} strokeWidth={2.5} /> {t('reset_session')}
          </button>
        </Card>

        <div className="text-center pt-1 pb-2">
          <span className="font-impact text-white/15 uppercase text-[9px] tracking-widest">V{APP_VERSION}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* RESET CONFIRM */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl p-8 relative" style={{ background: '#0D1F3C', border: '3px solid black', boxShadow: '10px 10px 0px #FF2E63' }}>
            <button onClick={() => setShowResetConfirm(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors"><X size={22} strokeWidth={2.5} /></button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,46,99,0.15)', border: '2px solid rgba(255,46,99,0.3)' }}>
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-2xl font-impact text-white uppercase tracking-tighter italic mb-2">{t('reset_session')}</h3>
              <p className="text-sm text-white/40 leading-tight">{t('reset_session_confirm')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleReset} disabled={isResetting} className="w-full py-4 rounded-xl font-impact uppercase border-[3px] border-black text-white transition-all disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none" style={{ background: '#FF2E63', boxShadow: '4px 4px 0px black' }}>
                {isResetting ? t('loading') : t('reset_session_btn')}
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="w-full py-3 rounded-xl font-impact uppercase text-white/60 transition-all" style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SESSION CONFIRM */}
      {showNewSessionConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl p-8 relative" style={{ background: '#0D1F3C', border: '3px solid black', boxShadow: '10px 10px 0px #00FF9D' }}>
            <button onClick={() => setShowNewSessionConfirm(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors"><X size={22} strokeWidth={2.5} /></button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(0,255,157,0.12)', border: '2px solid rgba(0,255,157,0.3)' }}>
                <Sparkles size={24} className="text-[#00FF9D]" />
              </div>
              <h3 className="text-2xl font-impact text-white uppercase tracking-tighter italic mb-2">{t('create_new_session')}</h3>
              <p className="text-sm text-white/40 leading-tight">{t('create_new_session_confirm')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleCreateNew} disabled={isCreatingNew} className="w-full py-4 rounded-xl font-impact uppercase text-black border-[3px] border-black transition-all disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none" style={{ background: '#00FF9D', boxShadow: '4px 4px 0px black' }}>
                {isCreatingNew ? t('loading') : t('create_new_session_btn')}
              </button>
              <button onClick={() => setShowNewSessionConfirm(false)} className="w-full py-3 rounded-xl font-impact uppercase text-white/60 transition-all" style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHALLENGES LIST */}
      {showChallenges && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl p-6 relative flex flex-col" style={{ background: '#0D1F3C', border: '3px solid black', boxShadow: '10px 10px 0px black', maxHeight: '80vh' }}>
            <button onClick={() => setShowChallenges(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/60 z-10 transition-colors"><X size={22} strokeWidth={2.5} /></button>
            <h3 className="text-2xl font-impact text-white uppercase tracking-tighter italic mb-4">DÉFIS ({dbChallenges.length})</h3>
            <div className="overflow-y-auto flex-1 pr-1 space-y-2 no-scrollbar">
              {dbChallenges.map((c, i) => (
                <div key={i} className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center font-impact text-white/30 text-[10px] italic shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>{i + 1}</span>
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

      {/* PLAYER LIST */}
      {showPlayers && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl relative flex flex-col" style={{ maxHeight: '90vh', background: '#0D1F3C', border: '3px solid black', boxShadow: '10px 10px 0px black' }}>
            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-impact text-white uppercase tracking-tighter italic">JOUEURS</h3>
                <div className="rounded-lg px-2.5 py-0.5 flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)' }}>
                  {isLoadingPlayers && playersList.length === 0
                    ? <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                    : <span className="font-impact text-white text-sm">{playersList.length}</span>}
                </div>
                {doubleConnections.length > 0 && (
                  <div className="rounded-lg px-2 py-0.5 flex items-center gap-1" style={{ background: '#FF8C00', border: '2px solid black', boxShadow: '2px 2px 0px black' }}>
                    <span className="font-impact text-black text-[10px] uppercase tracking-widest">⚠ {doubleConnections.length}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setShowPlayers(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-2 no-scrollbar">

              {/* Double connexions */}
              {doubleConnections.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,140,0,0.08)', border: '2px solid rgba(255,140,0,0.35)' }}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#FF8C00]/20">
                    <span className="text-[#FF8C00] text-sm">⚠</span>
                    <span className="font-impact text-[#FF8C00] uppercase text-[11px] tracking-widest flex-1">Double{doubleConnections.length > 1 ? 's' : ''} connexion{doubleConnections.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    {doubleConnections.map((group, gi) => (
                      <div key={gi} className="rounded-xl p-2.5 flex flex-col gap-1.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <p className="font-impact text-white/40 uppercase text-[9px] tracking-widest">même appareil</p>
                        {group.map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span className="text-lg leading-none">{p.emoji}</span>
                            <span className="font-impact text-white text-[12px] uppercase flex-1 truncate">{p.pseudo}</span>
                            <button onClick={() => handleClearDeviceLock(p.id)} disabled={clearingDeviceId === p.id}
                              className="px-2.5 py-1.5 rounded-lg font-impact uppercase text-[9px] tracking-widest active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1"
                              style={{ background: 'rgba(0,245,160,0.15)', border: '1.5px solid rgba(0,245,160,0.3)', color: '#00F5A0' }}
                            >
                              {clearingDeviceId === p.id ? <span className="w-2.5 h-2.5 border border-[#00F5A0]/30 border-t-[#00F5A0] rounded-full animate-spin" /> : <>Libérer</>}
                            </button>
                            <button onClick={() => setKickConfirmId(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all" style={{ background: 'rgba(255,46,99,0.1)', border: '1.5px solid rgba(255,46,99,0.2)', color: 'rgba(255,46,99,0.6)' }}>
                              <UserX size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player rows */}
              {playersList.length === 0 && !isLoadingPlayers ? (
                <div className="text-center py-10">
                  <p className="font-impact text-[11px] uppercase tracking-widest text-white/20">Aucun joueur</p>
                </div>
              ) : (
                playersList.map((player, i) => {
                  const lines = Math.floor(player.score / 5);
                  const inConflict = doubleConnections.some(g => g.some(p => p.id === player.id));
                  return (
                    <div key={player.id} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: `2px solid ${inConflict ? 'rgba(255,140,0,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                      <div className="p-3 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md flex items-center justify-center font-impact text-white/25 text-[9px] italic shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>{i + 1}</span>
                        <span className="text-xl leading-none shrink-0">{player.emoji}</span>
                        {renamingPlayerId === player.id ? (
                          <div className="flex-1 flex gap-2 min-w-0">
                            <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(player.id); if (e.key === 'Escape') setRenamingPlayerId(null); }}
                              autoFocus className="flex-1 rounded-lg px-2 py-1.5 font-impact text-white text-[11px] uppercase focus:outline-none min-w-0"
                              style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }}
                            />
                            <button onClick={() => handleSaveRename(player.id)} disabled={isSavingRename} className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 shrink-0" style={{ background: '#00FF9D', border: '2px solid black' }}>
                              {isSavingRename ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" /> : <Check size={14} className="text-black" strokeWidth={3} />}
                            </button>
                            <button onClick={() => setRenamingPlayerId(null)} className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform shrink-0" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)' }}>
                              <X size={14} className="text-white/50" strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-impact text-white text-[13px] uppercase tracking-tight truncate">{player.pseudo}</span>
                                {inConflict && <span className="text-[#FF8C00] text-[10px] shrink-0">⚠</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-impact uppercase tracking-widest" style={{ color: player.status === 'ACTIVE' ? '#00FF9D' : 'rgba(255,255,255,0.2)' }}>
                                  {player.status === 'ACTIVE' ? '● EN JEU' : '○ EN ATTENTE'}
                                </span>
                                {player.status === 'ACTIVE' && lines > 0 && (
                                  <span className="text-[9px] font-impact uppercase" style={{ color: 'rgba(255,215,0,0.6)' }}>{lines} ligne{lines > 1 ? 's' : ''}</span>
                                )}
                              </div>
                            </div>
                            {player.status === 'ACTIVE' && (
                              <div className="flex flex-col items-end gap-0.5 shrink-0">
                                <div className="rounded-lg px-2 py-0.5 border-[2px] border-black" style={{ background: '#FFD700', boxShadow: '2px 2px 0px black' }}>
                                  <span className="font-impact text-black text-[12px]">{player.score}/25</span>
                                </div>
                                <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${(player.score / 25) * 100}%`, background: '#FFD700' }} />
                                </div>
                              </div>
                            )}
                            <button onClick={() => { setRenamingPlayerId(player.id); setRenameValue(player.pseudo); }} className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                              <Pencil size={12} className="text-white/30" strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={async () => {
                                setRecoveryQR({ playerId: player.id, token: null, loading: true });
                                try {
                                  const token = await gameService.generateRecoveryToken(player.id);
                                  setRecoveryQR({ playerId: player.id, token, loading: false });
                                } catch { setRecoveryQR(null); }
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all shrink-0"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                            >
                              <QrCode size={12} className="text-white/30" strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                      </div>
                      {renamingPlayerId !== player.id && (
                        kickConfirmId === player.id ? (
                          <div className="flex gap-2 px-3 pb-3 -mt-1">
                            <button onClick={() => handleKickPlayer(player.id)} disabled={kickingPlayerId === player.id}
                              className="flex-1 py-2 rounded-lg font-impact uppercase text-[10px] border-[2px] border-black text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                              style={{ background: '#FF2E63', boxShadow: '2px 2px 0px black' }}
                            >
                              {kickingPlayerId === player.id ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <><UserX size={12} strokeWidth={3} /> Kick</>}
                            </button>
                            <button onClick={() => setKickConfirmId(null)} className="px-3 py-2 rounded-lg font-impact uppercase text-[9px] text-white/50 active:scale-95 transition-all" style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="flex border-t border-white/5">
                            {player.deviceId && (
                              <button onClick={() => handleClearDeviceLock(player.id)} disabled={clearingDeviceId === player.id}
                                className="flex-1 py-1.5 flex items-center justify-center gap-1 transition-all border-r border-white/5 disabled:opacity-40"
                                style={{ color: 'rgba(0,245,160,0.5)' }}
                              >
                                {clearingDeviceId === player.id ? <span className="w-2.5 h-2.5 border border-[#00F5A0]/30 border-t-[#00F5A0] rounded-full animate-spin" /> : <KeyRound size={11} strokeWidth={2.5} />}
                                <span className="font-impact uppercase text-[8px] tracking-widest">Device</span>
                              </button>
                            )}
                            <button onClick={async () => { await gameService.resetPlayerGame(player.id); }} className="flex-1 py-1.5 flex items-center justify-center gap-1 transition-all border-r border-white/5" style={{ color: 'rgba(255,215,0,0.5)' }}>
                              <RefreshCw size={11} strokeWidth={2.5} />
                              <span className="font-impact uppercase text-[8px] tracking-widest">Reset</span>
                            </button>
                            <button onClick={() => setKickConfirmId(player.id)} className="flex-1 py-1.5 flex items-center justify-center gap-1 transition-all" style={{ color: 'rgba(255,46,99,0.5)' }}>
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

      {/* RECOVERY QR */}
      {recoveryQR && (
        <div className="fixed inset-0 z-[210] bg-black/85 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="rounded-3xl p-6 w-full max-w-xs flex flex-col items-center gap-5 relative" style={{ background: '#0D1F3C', border: '3px solid rgba(255,255,255,0.15)', boxShadow: '8px 8px 0px black' }}>
            <button onClick={() => setRecoveryQR(null)} className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform" style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
              <X size={18} strokeWidth={2.5} className="text-white/40" />
            </button>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl">🔗</span>
              <h3 className="font-impact uppercase text-[#FFD700] text-[15px] tracking-wide">QR de récupération</h3>
              <p className="text-white/40 text-[10px] font-impact uppercase tracking-widest">{playersList.find(p => p.id === recoveryQR.playerId)?.pseudo ?? '...'}</p>
            </div>
            {recoveryQR.loading ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center"><Loader2 size={32} className="text-white/30 animate-spin" /></div>
            ) : recoveryQR.token ? (
              <div className="bg-white p-4 rounded-2xl" style={{ border: '4px solid #FFD700', boxShadow: '4px 4px 0px black' }}>
                <QRCodeSVG value={`${window.location.origin}${window.location.pathname.replace('/master', '')}?s=${secureSessionId}&recover=${recoveryQR.token}`} size={180} level="H" fgColor="#000000" />
              </div>
            ) : null}
            <p className="text-white/30 text-[9px] font-impact uppercase tracking-widest text-center">Valable 24h · 1 scan suffit</p>
          </div>
        </div>
      )}

      {/* FULLSCREEN QR */}
      {showQRFullscreen && secureSessionId && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in duration-200" style={{ background: '#0A1629' }}>
          <button onClick={() => setShowQRFullscreen(false)} className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all active:scale-90" style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)' }}>
            <X size={22} strokeWidth={2.5} />
          </button>
          <p className="font-impact text-white/30 uppercase text-[10px] tracking-[0.4em] mb-6">
            {language === 'fr' ? 'Scanne pour rejoindre' : 'Scan to join'}
          </p>
          <div className="bg-white p-6 rounded-3xl mb-8" style={{ border: `6px solid ${qrColor}`, boxShadow: '10px 10px 0px black' }}>
            <QRCodeSVG value={`${window.location.origin}${window.location.pathname.replace('/master', '')}?s=${secureSessionId}`} size={260} level="H" fgColor="#000000" />
          </div>
          <h1 className="font-impact text-white uppercase italic tracking-tighter text-5xl leading-none mb-2">BINGO CRAWL</h1>
          {playerCount > 0 && (
            <div className="flex items-center gap-2 mt-6 px-5 py-2 rounded-2xl border-[3px] border-black" style={{ background: '#00F5A0', boxShadow: '4px 4px 0px black' }}>
              <Users size={18} className="text-black" strokeWidth={3} />
              <span className="font-impact text-black uppercase text-lg tracking-wide">{playerCount} joueur{playerCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MasterPage;
