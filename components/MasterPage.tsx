
import React, { useState, useEffect } from 'react';
import {
  DoorOpen, DoorClosed, Crown, Trash2, AlertTriangle, X,
  Users, List, Sparkles, PartyPopper, MapPin, Clock, XCircle, Expand,
  Play, ChevronRight, UserX, RefreshCw, Check, Zap, Pencil,
  Eye, ChevronDown, ChevronUp, QrCode, Loader2, KeyRound, Power,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_VERSION, CHALLENGES_EN, CHALLENGES_FR } from '../constants';
import { gameService } from '../services/gameService';
import { supabase } from '../lib/supabaseClient';
import BackgroundParticles from './BackgroundParticles';

const SESSION_COLORS = ['#FF2E63','#00F5A0','#FFD700','#93C5FD','#FF8C00','#A78BFA','#F472B6','#34D399'];
function sessionColor(uuid: string): string {
  const idx = parseInt(uuid.replace(/-/g, '').slice(0, 4), 16) % SESSION_COLORS.length;
  return SESSION_COLORS[idx];
}

// Isolated countdown — only this tiny component re-renders every second, not MasterPage
const CountdownTimer: React.FC<{ endsAt: number | null; className?: string }> = ({ endsAt, className }) => {
  const [secs, setSecs] = useState(() => endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0);
  useEffect(() => {
    if (!endsAt) { setSecs(0); return; }
    const update = () => setSecs(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [endsAt]);
  return <span className={className}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>;
};

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
  boostAuctionEndsAt?: number | null;
  startBoostAuction?: (durationSecs?: number) => Promise<void>;
  closeBoostAuction?: () => Promise<void>;
}

// ─── Collapsible section inside the white card ────────────────────────────────
const Section: React.FC<{
  title: string;
  accent?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}> = ({ title, accent = '#000', defaultOpen = true, children, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t-2 border-black/8 pt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 rounded-full" style={{ background: accent }} />
          <span className="font-impact text-[11px] uppercase tracking-widest text-black/60">{title}</span>
          {badge}
        </div>
        <span className="text-black/30">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      {open && children}
    </div>
  );
};

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
  boostAuctionEndsAt, startBoostAuction, closeBoostAuction,
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
  const [isLaunchingPhase, setIsLaunchingPhase] = useState(false);
  const [gameLaunched, setGameLaunched] = useState(false);

  // Player management
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

  // Master validations
  const [pendingValidations, setPendingValidations] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [witnessMode, setWitnessMode] = useState<Record<string, boolean>>({});
  const [witnessSelectedPlayer, setWitnessSelectedPlayer] = useState<Record<string, string>>({});
  const [sendingWitnessId, setSendingWitnessId] = useState<string | null>(null);

  // Player count
  const [playerCount, setPlayerCount] = useState(0);
  useEffect(() => {
    if (!secureSessionId) { setPlayerCount(0); return; }
    supabase.from('players').select('id', { count: 'exact', head: true })
      .eq('session_id', secureSessionId)
      .then(({ count }) => setPlayerCount(count ?? 0));
    const ch = supabase.channel(`player_count_${secureSessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players', filter: `session_id=eq.${secureSessionId}` },
        () => setPlayerCount(prev => prev + 1))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'players' },
        () => setPlayerCount(prev => Math.max(0, prev - 1)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [secureSessionId]);

  // Bar transition
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [barNameInput, setBarNameInput] = useState('');
  const [isTriggeringTransition, setIsTriggeringTransition] = useState(false);

  useEffect(() => { gameService.getChallenges().then(setDbChallenges); }, []);

  useEffect(() => {
    if (!secureSessionId || !isSessionActive) { setPendingValidations([]); return; }
    const unsub = gameService.subscribeMasterValidations(secureSessionId, setPendingValidations);
    return unsub;
  }, [secureSessionId, isSessionActive]);

  useEffect(() => {
    if (!secureSessionId) { setPlayersList([]); return; }
    const unsub = gameService.subscribePlayersWithScores(secureSessionId, (list) => {
      setPlayersList(list.sort((a, b) => b.score - a.score));
      setIsLoadingPlayers(false);
    });
    setIsLoadingPlayers(true);
    return unsub;
  }, [secureSessionId]);

  const doubleConnections = React.useMemo(() => {
    const map = new Map<string, typeof playersList>();
    for (const p of playersList) {
      if (!p.deviceId) continue;
      if (!map.has(p.deviceId)) map.set(p.deviceId, []);
      map.get(p.deviceId)!.push(p);
    }
    return [...map.values()].filter(g => g.length > 1);
  }, [playersList]);

  // Handlers
  const handleLaunchGame = async () => {
    if (!triggerCountdown) return;
    setIsLaunchingPhase(true);
    try {
      await triggerCountdown(10);
      setPregamePhase?.(null);
      setGameLaunched(true);
      setTimeout(() => setGameLaunched(false), 4000);
    } catch (e) {
      console.error('[Master] triggerCountdown failed:', e);
      alert('Erreur lors du lancement. Vérifiez votre connexion.');
    } finally {
      setIsLaunchingPhase(false);
    }
  };
  const handleTriggerTransition = async () => {
    setIsTriggeringTransition(true);
    try {
      await triggerBarTransition(selectedDuration, barNameInput.trim() || undefined);
      setBarNameInput('');
    }
    catch (e) {
      console.error(e);
      alert('Erreur lors du changement de bar. Vérifiez votre connexion.');
    }
    finally { setIsTriggeringTransition(false); }
  };

  const handleAdvanceBarWithTransition = async () => {
    setIsTriggeringTransition(true);
    try {
      // Advance bar (unlock rows) + start countdown in one atomic UX action
      await triggerBarTransition(selectedDuration, barNameInput.trim() || undefined);
      if (advanceBar) await advanceBar();
      setBarNameInput('');
    }
    catch (e) {
      console.error(e);
      alert('Erreur lors du changement de bar. Vérifiez votre connexion.');
    }
    finally { setIsTriggeringTransition(false); }
  };
  const handleApproveValidation = async (v: any) => {
    setApprovingId(v.id);
    try { await gameService.approveMasterValidation(v); }
    catch (e) { console.error(e); }
    finally { setApprovingId(null); }
  };
  const handleRejectValidation = async (id: string) => { await gameService.rejectMasterValidation(id); };
  const handleSendWitness = async (v: any) => {
    const wId = witnessSelectedPlayer[v.id];
    if (!wId) return;
    setSendingWitnessId(v.id);
    try { await gameService.requestWitnessConfirmation(v.id, wId); setWitnessMode(prev => ({ ...prev, [v.id]: false })); }
    catch (e) { console.error(e); }
    finally { setSendingWitnessId(null); }
  };
  const handleKickPlayer = async (pid: string) => {
    setKickingPlayerId(pid);
    try { await gameService.kickPlayer(pid); setPlayersList(prev => prev.filter(p => p.id !== pid)); setPlayerCount(prev => Math.max(0, prev - 1)); }
    catch (e) { console.error(e); }
    finally { setKickingPlayerId(null); setKickConfirmId(null); }
  };
  const handleSaveRename = async (pid: string) => {
    if (!renameValue.trim()) return;
    setIsSavingRename(true);
    try { await gameService.renamePlayer(pid, renameValue.trim()); setPlayersList(prev => prev.map(p => p.id === pid ? { ...p, pseudo: renameValue.trim() } : p)); setRenamingPlayerId(null); }
    catch (e) { console.error(e); }
    finally { setIsSavingRename(false); }
  };
  const handleClearDeviceLock = async (pid: string) => {
    setClearingDeviceId(pid);
    try { await gameService.clearDeviceLock(pid); setPlayersList(prev => prev.map(p => p.id === pid ? { ...p, deviceId: null } : p)); }
    catch (e) { console.error(e); }
    finally { setClearingDeviceId(null); }
  };
  const handleReset = async () => {
    setIsResetting(true);
    try { await resetSession(); setShowResetConfirm(false); }
    catch (e) {
      console.error(e);
      alert('Erreur lors du reset. Vérifiez votre connexion.');
    }
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
    try { const ch = language === 'fr' ? CHALLENGES_FR : CHALLENGES_EN; await gameService.simulatePlayers(ch); }
    catch (e) { console.error(e); }
    finally { setIsSimulating(false); }
  };

  const qrColor = secureSessionId ? sessionColor(secureSessionId) : '#FFD700';

  return (
    <>
    <div className="fixed inset-0 bg-[#0A1629] overflow-y-auto">
      <BackgroundParticles />

      {/* ── Carte principale blanche ───────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-sm mx-auto px-4 animate-in zoom-in duration-300"
        style={{ paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 'max(48px, env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        <div className="bg-white border-[4px] border-black rounded-2xl shadow-[10px_10px_0px_black] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b-2 border-black/10">
            <div className="flex items-center gap-2.5">
              <Crown size={18} className="text-[#FFD700]" fill="currentColor" />
              <h2 className="text-2xl font-impact text-black uppercase tracking-tighter italic leading-none">MASTER</h2>
            </div>
            <div className="flex items-center gap-2">
              {isSessionActive && secureSessionId && (
                <button onClick={() => setShowPlayers(true)}
                  className="flex items-center gap-1 bg-black/5 border-[2px] border-black/10 rounded-lg px-2 py-1 active:bg-black/10 transition-all">
                  <Users size={12} className="text-black/50" />
                  <span className="font-impact text-black text-[11px] uppercase">{playerCount}</span>
                </button>
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_black] ${isSessionActive ? 'bg-[#00FF9D]' : 'bg-[#FF2E63]'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                <span className="font-impact text-black uppercase text-[10px] tracking-widest">{isSessionActive ? 'LIVE' : 'OFF'}</span>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 flex flex-col gap-4">

            {/* ── OPEN / CLOSE ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSessionActive(true)}
                className={`p-4 rounded-xl border-[3px] border-black flex flex-col items-center justify-center gap-1.5 transition-all font-impact uppercase text-[11px] tracking-widest ${
                  isSessionActive ? 'bg-[#00FF9D] text-black shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                }`}>
                <DoorOpen size={22} strokeWidth={2.5} />
                {t('open')}
              </button>
              <button onClick={() => setSessionActive(false)}
                className={`p-4 rounded-xl border-[3px] border-black flex flex-col items-center justify-center gap-1.5 transition-all font-impact uppercase text-[11px] tracking-widest ${
                  !isSessionActive ? 'bg-[#FF2E63] text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                }`}>
                <DoorClosed size={22} strokeWidth={2.5} />
                <span style={{ opacity: !isSessionActive ? 1 : 0.6 }}>{t('closed')}</span>
              </button>
            </div>

            {/* Pause */}
            {isSessionActive && setGamePaused && (
              <button onClick={() => setGamePaused(!isGamePaused)}
                className={`w-full py-3 rounded-xl border-[3px] border-black font-impact uppercase text-[12px] tracking-widest flex items-center justify-center gap-2 transition-all ${
                  isGamePaused ? 'bg-[#FFD700] text-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none' : 'bg-white text-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                }`}>
                {isGamePaused ? <><Play size={15} strokeWidth={3} fill="currentColor" /> Reprendre</> : <><span className="text-base leading-none">⏸</span> Pause</>}
              </button>
            )}

            {/* QR code */}
            {secureSessionId ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full border-[2px] border-black animate-pulse" style={{ background: qrColor }} />
                  <span className="font-impact text-[9px] uppercase tracking-[0.2em] text-black/40">Session active</span>
                  <div className="w-2.5 h-2.5 rounded-full border-[2px] border-black animate-pulse" style={{ background: qrColor }} />
                </div>
                <button onClick={() => setShowQRFullscreen(true)} className="group relative">
                  <div className="bg-white p-3 rounded-xl border-[4px] shadow-[4px_4px_0px_black] group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-none transition-all"
                    style={{ borderColor: qrColor }}>
                    <QRCodeSVG
                      value={`${window.location.origin}${window.location.pathname.replace('/master', '')}?s=${secureSessionId}`}
                      size={140} level="H" fgColor="#000000"
                    />
                  </div>
                </button>
                <p className="font-impact text-[8px] text-black/30 uppercase tracking-widest">Tap pour agrandir · {playerCount} joueur{playerCount !== 1 ? 's' : ''}</p>
              </div>
            ) : (
              <div className="bg-black/5 border-[2px] border-dashed border-black/20 rounded-xl p-6 text-center">
                <p className="font-impact text-[10px] uppercase tracking-widest text-black/40">Crée une session pour générer le QR</p>
              </div>
            )}

            {/* Launch */}
            {isSessionActive && triggerCountdown && (
              <button onClick={handleLaunchGame} disabled={isLaunchingPhase || gameLaunched}
                className={`w-full py-4 text-black rounded-xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-70 ${gameLaunched ? 'bg-[#FFD700]' : 'bg-[#00FF9D]'}`}>
                {gameLaunched ? <><Check size={17} strokeWidth={3} /> Lancé ! Countdown 5s...</> : isLaunchingPhase ? <><span className="w-4 h-4 border-[2px] border-black/30 border-t-black rounded-full animate-spin" /> Envoi...</> : <><Play size={17} strokeWidth={3} fill="currentColor" /> 🚀 Lancer le Jeu !</>}
              </button>
            )}

            {/* New session */}
            <button onClick={() => setShowNewSessionConfirm(true)}
              className="w-full py-3.5 bg-[#00FF9D] text-black rounded-xl font-impact uppercase text-[12px] tracking-widest flex items-center justify-center gap-2 border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
              <Sparkles size={15} strokeWidth={3} /> {t('create_new_session')}
            </button>

            {/* ── PROGRESSION DES BARS ──────────────────────────────────────── */}
            {isSessionActive && advanceBar && (
              <Section title="Progression des bars" accent="#FF8C00" defaultOpen={true}>
                <div className="flex flex-col gap-3">
                  {/* Bar tracker */}
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(b => {
                      const labels = ['1 ligne', '3 lignes', '⚡ Chaos'];
                      const colors = ['#00F5A0', '#FF8C00', '#FF2D6A'];
                      return (
                        <div key={b} className={`rounded-xl border-[2px] border-black px-2 py-3 text-center transition-all ${
                          b === currentBar ? 'bg-black text-white shadow-[2px_2px_0px_black]' : b < currentBar ? 'bg-black/5 opacity-40' : 'bg-white'
                        }`}>
                          <div className="font-impact text-[8px] uppercase tracking-widest mb-0.5" style={{ color: b === currentBar ? colors[b-1] : 'rgba(0,0,0,0.3)' }}>Bar {b}</div>
                          <div className="font-impact text-[11px] leading-tight" style={{ color: b === currentBar ? colors[b-1] : 'rgba(0,0,0,0.25)' }}>{labels[b-1]}</div>
                        </div>
                      );
                    })}
                  </div>

                  {currentBar < 3 ? (
                    transitionEndsAt ? (
                      /* Transition active — show countdown + cancel */
                      <div className="bg-[#FF8C00] border-[3px] border-black rounded-xl p-3 shadow-[4px_4px_0px_black] flex items-center justify-between">
                        <div>
                          {nextBarName && <p className="font-impact text-black/60 uppercase text-[9px]">{nextBarName}</p>}
                          <p className="font-impact text-black text-2xl italic">
                            <CountdownTimer endsAt={transitionEndsAt} />
                          </p>
                          <p className="font-impact text-black/50 uppercase text-[8px] tracking-widest">Bar {currentBar} → {currentBar + 1} · Lignes débloquées ✓</p>
                        </div>
                        <button onClick={clearBarTransition} className="w-10 h-10 bg-white border-[2px] border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                          <XCircle size={20} className="text-[#FF8C00]" strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      /* No active transition — show combined action */
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1.5">
                          {[2, 5, 10, 15].map(d => (
                            <button key={d} onClick={() => setSelectedDuration(d)}
                              className={`flex-1 py-2 rounded-xl font-impact text-[11px] uppercase border-[2px] border-black transition-all ${
                                selectedDuration === d ? 'bg-black text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                              }`}>
                              {d}min
                            </button>
                          ))}
                        </div>
                        <input type="text" value={barNameInput} onChange={e => setBarNameInput(e.target.value)}
                          placeholder="Nom du prochain bar (optionnel)"
                          className="w-full bg-white border-[2px] border-black/20 rounded-xl px-3 py-2.5 font-impact text-black text-[11px] uppercase focus:border-black focus:outline-none placeholder:text-black/20 transition-all" />
                        <button onClick={handleAdvanceBarWithTransition} disabled={isTriggeringTransition}
                          className="w-full py-4 bg-[#FF8C00] text-black rounded-xl font-impact uppercase text-[12px] tracking-widest flex items-center justify-center gap-2 border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50">
                          {isTriggeringTransition
                            ? <><span className="w-4 h-4 border-[2px] border-black/30 border-t-black rounded-full animate-spin" /> Envoi...</>
                            : <><ChevronRight size={17} strokeWidth={3} /> Passer au bar {currentBar + 1} · timer {selectedDuration}min{currentBar + 1 === 3 && ' · ⚡ Chaos'}</>
                          }
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="w-full py-3 bg-[#FF2D6A]/10 border-[2px] border-[#FF2D6A] rounded-xl text-center">
                      <span className="font-impact uppercase text-[#FF2D6A] text-[12px] tracking-widest">⚡ Mode Chaos actif</span>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ── RÉGLAGES ──────────────────────────────────────────────────── */}
            {isSessionActive && (
              <Section title="Réglages" accent="#FFD700" defaultOpen={false}>
                <div className="flex flex-col gap-3">

                  {/* Spotlight */}
                  {setSpotlightDisabled && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-impact text-black uppercase text-[12px] tracking-wide">Spotlight ⚡</p>
                        <p className="font-impact text-black/40 uppercase text-[9px] tracking-widest">{spotlightDisabled ? 'Désactivé' : 'Actif'}</p>
                      </div>
                      <button onClick={() => setSpotlightDisabled(!spotlightDisabled)}
                        className={`relative w-12 h-6 rounded-full border-[2px] border-black transition-all shadow-[2px_2px_0px_black] ${spotlightDisabled ? 'bg-black/10' : 'bg-[#FFD700]'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white border-[2px] border-black rounded-full transition-all shadow-[1px_1px_0px_black] ${spotlightDisabled ? 'left-0.5' : 'left-[22px]'}`} />
                      </button>
                    </div>
                  )}

                  {/* Cooldown */}
                  {setChallengeCooldown && (
                    <div>
                      <p className="font-impact text-black uppercase text-[11px] tracking-widest mb-2">
                        Cadence {(challengeCooldownSecs ?? 0) > 0 && <span className="text-[#FF8C00]">· {challengeCooldownSecs}s</span>}
                      </p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[0, 30, 60, 120, 300].map(secs => (
                          <button key={secs} onClick={() => setChallengeCooldown(secs)}
                            className={`py-2 rounded-xl font-impact text-[10px] uppercase border-[2px] border-black transition-all ${
                              (challengeCooldownSecs ?? 0) === secs
                                ? 'bg-black text-white shadow-none translate-x-[1px] translate-y-[1px]'
                                : 'bg-white text-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                            }`}>
                            {secs === 0 ? 'OFF' : secs < 60 ? `${secs}s` : `${secs / 60}m`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boost auction */}
                  {startBoostAuction && (
                    boostAuctionEndsAt && boostAuctionEndsAt > Date.now() ? (
                      <div className="bg-[#FF8C00] border-[3px] border-black rounded-xl p-3 shadow-[4px_4px_0px_black] flex items-center justify-between">
                        <div>
                          <p className="font-impact text-black uppercase text-[9px] tracking-widest">Enchère en cours</p>
                          <p className="font-impact text-black text-lg italic">
                            <CountdownTimer endsAt={boostAuctionEndsAt} />
                          </p>
                        </div>
                        <button
                          onClick={async () => { if (secureSessionId) { await gameService.closeBoostAuction(secureSessionId); } }}
                          className="px-3 py-2 bg-black text-[#FF8C00] rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                        >
                          ✓ Confirmer
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startBoostAuction(30)}
                        className="w-full py-2.5 bg-[#FF8C00] text-black rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2"
                      >
                        🏆 Lancer enchère boost (30s)
                      </button>
                    )
                  )}

                  {/* Kill switch */}
                  {secureSessionId && (
                    <button onClick={async () => { await Promise.all([setSpotlightDisabled?.(true), gameService.clearAllTaunts(secureSessionId)]); }}
                      className="w-full py-2.5 bg-[#FF2D6A] text-white rounded-xl font-impact uppercase text-[10px] tracking-widest border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2">
                      🔥 Reset effets (spotlight + taunts)
                    </button>
                  )}
                </div>
              </Section>
            )}

            {/* ── BAR CHANGE (fallback — only shown if Progression section isn't available) */}
            {isSessionActive && !advanceBar && (
              <Section
                title={language === 'fr' ? 'Changement de bar' : 'Bar Change'}
                accent="#FF2D6A"
                defaultOpen={!!transitionEndsAt}
                badge={transitionEndsAt ? (
                  <span className="ml-2 bg-[#FF2D6A] border-[2px] border-black rounded-lg px-2 py-0.5 font-impact text-[9px] text-white uppercase shadow-[2px_2px_0px_black]">ACTIF</span>
                ) : undefined}
              >
                {transitionEndsAt ? (
                  <div className="bg-[#FF2D6A] border-[3px] border-black rounded-xl p-3 shadow-[4px_4px_0px_black] flex items-center justify-between">
                    <div>
                      {nextBarName && <p className="font-impact text-white/70 uppercase text-[9px]">{nextBarName}</p>}
                      <p className="font-impact text-white text-2xl italic">
                        <CountdownTimer endsAt={transitionEndsAt} />
                      </p>
                    </div>
                    <button onClick={clearBarTransition} className="w-10 h-10 bg-white border-[2px] border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                      <XCircle size={20} className="text-[#FF2D6A]" strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1.5">
                      {[2, 5, 10, 15].map(d => (
                        <button key={d} onClick={() => setSelectedDuration(d)}
                          className={`flex-1 py-2 rounded-xl font-impact text-[11px] uppercase border-[2px] border-black transition-all ${
                            selectedDuration === d ? 'bg-black text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                          }`}>
                          {d}min
                        </button>
                      ))}
                    </div>
                    <input type="text" value={barNameInput} onChange={e => setBarNameInput(e.target.value)}
                      placeholder="Nom du bar (optionnel)"
                      className="w-full bg-white border-[2px] border-black/20 rounded-xl px-3 py-2.5 font-impact text-black text-[11px] uppercase focus:border-black focus:outline-none placeholder:text-black/20 transition-all" />
                    <button onClick={handleTriggerTransition} disabled={isTriggeringTransition}
                      className="w-full py-3 bg-[#FF2D6A] text-white rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50">
                      <Clock size={14} strokeWidth={3} />
                      {isTriggeringTransition ? 'Envoi...' : `Countdown (${selectedDuration} min)`}
                    </button>
                  </div>
                )}
              </Section>
            )}

            {/* ── ACTIONS ───────────────────────────────────────────────────── */}
            <Section title="Actions" accent="#93C5FD" defaultOpen={false}>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowChallenges(true)}
                    className="py-3 bg-white text-black rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                    <List size={13} strokeWidth={2.5} /> {dbChallenges.length} Défis
                  </button>
                  <button onClick={() => setShowPlayers(true)}
                    className="py-3 bg-white text-black rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                    <Users size={13} strokeWidth={2.5} /> {playerCount} Joueurs
                  </button>
                </div>
                <button onClick={handleWrapped} disabled={isWrapping}
                  className="w-full py-3.5 bg-[#FFD700] text-black rounded-xl font-impact uppercase text-[12px] tracking-widest flex items-center justify-center gap-2 border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50">
                  <PartyPopper size={15} className={isWrapping ? 'animate-bounce' : ''} strokeWidth={2.5} />
                  {isWrapping ? 'Fermeture...' : 'Fin de soirée (Wrapped)'}
                </button>
                <button onClick={handleSimulate} disabled={isSimulating}
                  className="w-full py-2.5 bg-white text-black/50 rounded-xl font-impact uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black/15 active:bg-black/5 transition-all disabled:opacity-50">
                  <Users size={12} className={isSimulating ? 'animate-bounce' : ''} />
                  {isSimulating ? 'Déploiement...' : 'Simuler 5 joueurs'}
                </button>
                <button onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2 bg-[#FF2D6A]/10 text-[#FF2D6A] border-2 border-[#FF2D6A]/30 rounded-xl font-impact uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 active:bg-[#FF2D6A]/20 transition-all">
                  <Trash2 size={12} strokeWidth={2.5} /> {t('reset_session')}
                </button>
              </div>
            </Section>

          </div>

          <div className="text-center py-3 border-t-2 border-black/5">
            <span className="font-impact text-black/15 uppercase text-[9px] tracking-widest">V{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </div>

    {/* ── Validations badge flottant — outside scroll container ─────────────── */}
    {isSessionActive && pendingValidations.length > 0 && (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[50] w-[calc(100%-2rem)] max-w-sm">
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
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl leading-none shrink-0">{v.player_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-impact text-white uppercase text-[12px] tracking-tight">{v.player_nickname}</span>
                    <p className="font-impact text-white/60 text-[9px] uppercase tracking-wide truncate">{v.challenge_text}</p>
                  </div>
                </div>
                {!witnessMode[v.id] ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveValidation(v)} disabled={approvingId === v.id}
                      className="flex-1 py-2 bg-white text-black rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                      {approvingId === v.id ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" /> : <><Check size={12} strokeWidth={3} /> OK</>}
                    </button>
                    <button onClick={() => setWitnessMode(prev => ({ ...prev, [v.id]: true }))}
                      className="flex-1 py-2 bg-[#FF8C00] text-black rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1">
                      <Eye size={12} strokeWidth={3} /> Témoin
                    </button>
                    <button onClick={() => handleRejectValidation(v.id)}
                      className="w-9 h-9 bg-black/30 border border-white/20 rounded-lg flex items-center justify-center active:scale-90 transition-transform shrink-0">
                      <X size={14} className="text-white/60" strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="font-impact text-white/70 uppercase text-[9px] tracking-widest">Qui était le témoin ?</p>
                    <select value={witnessSelectedPlayer[v.id] ?? ''} onChange={e => setWitnessSelectedPlayer(prev => ({ ...prev, [v.id]: e.target.value }))}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 font-impact text-white text-[11px] uppercase focus:outline-none">
                      <option value="">— choisir —</option>
                      {playersList.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.pseudo}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => handleSendWitness(v)} disabled={!witnessSelectedPlayer[v.id] || sendingWitnessId === v.id}
                        className="flex-1 py-2 bg-[#FF8C00] text-black rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-1">
                        {sendingWitnessId === v.id ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" /> : <><Eye size={11} strokeWidth={3} /> Envoyer</>}
                      </button>
                      <button onClick={() => setWitnessMode(prev => ({ ...prev, [v.id]: false }))}
                        className="px-3 py-2 bg-black/30 border border-white/20 rounded-lg font-impact uppercase text-[9px] text-white/60 active:scale-90 transition-transform">
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

    {/* ══ MODALS — outside scroll container, true fixed to viewport ══════════ */}

      {/* RESET */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border-[4px] border-black rounded-2xl p-8 relative shadow-[10px_10px_0px_#FF2E63] animate-in zoom-in duration-300">
            <button onClick={() => setShowResetConfirm(false)} className="absolute top-4 right-4 text-black/20 hover:text-black"><X size={22} strokeWidth={2.5} /></button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#FF2D6A]/10 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} className="text-[#FF2D6A]" /></div>
              <h3 className="text-2xl font-impact text-black uppercase tracking-tighter italic mb-2">{t('reset_session')}</h3>
              <p className="text-sm text-black/50 leading-tight">{t('reset_session_confirm')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleReset} disabled={isResetting}
                className="w-full bg-[#FF2E63] text-white font-impact uppercase py-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50">
                {isResetting ? t('loading') : t('reset_session_btn')}
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="w-full bg-white text-black font-impact uppercase py-3 rounded-xl border-[3px] border-black hover:bg-black/5 transition-all">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SESSION */}
      {showNewSessionConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border-[4px] border-black rounded-2xl p-8 relative shadow-[10px_10px_0px_#00FF9D] animate-in zoom-in duration-300">
            <button onClick={() => setShowNewSessionConfirm(false)} className="absolute top-4 right-4 text-black/20 hover:text-black"><X size={22} strokeWidth={2.5} /></button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles size={24} className="text-emerald-600" /></div>
              <h3 className="text-2xl font-impact text-black uppercase tracking-tighter italic mb-2">{t('create_new_session')}</h3>
              <p className="text-sm text-black/50 leading-tight">{t('create_new_session_confirm')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleCreateNew} disabled={isCreatingNew}
                className="w-full bg-[#00FF9D] text-black font-impact uppercase py-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50">
                {isCreatingNew ? t('loading') : t('create_new_session_btn')}
              </button>
              <button onClick={() => setShowNewSessionConfirm(false)} className="w-full bg-white text-black font-impact uppercase py-3 rounded-xl border-[3px] border-black hover:bg-black/5 transition-all">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* CHALLENGES */}
      {showChallenges && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border-[4px] border-black rounded-2xl p-6 relative shadow-[10px_10px_0px_black] flex flex-col" style={{ maxHeight: '80vh' }}>
            <button onClick={() => setShowChallenges(false)} className="absolute top-4 right-4 text-black/20 hover:text-black z-10"><X size={22} strokeWidth={2.5} /></button>
            <h3 className="text-2xl font-impact text-black uppercase tracking-tighter italic mb-4">DÉFIS ({dbChallenges.length})</h3>
            <div className="overflow-y-auto flex-1 space-y-2 no-scrollbar">
              {dbChallenges.map((c, i) => (
                <div key={i} className="p-3 bg-black/5 border-2 border-black/10 rounded-xl flex items-center gap-3">
                  <span className="w-7 h-7 bg-black text-white rounded-lg flex items-center justify-center font-impact text-[10px] italic shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-impact uppercase text-black/30 mb-0.5">{c.type}</div>
                    <div className="text-[11px] font-medium text-black/70 leading-tight">
                      {language === 'fr' ? (c.text_fr || c.text) : (c.text_en || c.text)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PLAYERS */}
      {showPlayers && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border-[4px] border-black rounded-2xl relative shadow-[10px_10px_0px_black] flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b-2 border-black/10">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-impact text-black uppercase tracking-tighter italic">JOUEURS</h3>
                <div className="bg-black/8 border-[2px] border-black/10 rounded-lg px-2 py-0.5">
                  {isLoadingPlayers && playersList.length === 0 ? <span className="w-3 h-3 border border-black/20 border-t-black rounded-full animate-spin inline-block" /> : <span className="font-impact text-black text-sm">{playersList.length}</span>}
                </div>
                {doubleConnections.length > 0 && (
                  <div className="bg-[#FF8C00] border-[2px] border-black rounded-lg px-2 py-0.5 shadow-[2px_2px_0px_black]">
                    <span className="font-impact text-black text-[10px] uppercase">⚠ {doubleConnections.length}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setShowPlayers(false)} className="w-9 h-9 bg-black/5 border-[2px] border-black/10 rounded-xl flex items-center justify-center text-black/30 hover:text-black transition-colors"><X size={18} strokeWidth={2.5} /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-2 no-scrollbar">
              {playersList.length === 0 && !isLoadingPlayers ? (
                <p className="font-impact text-[11px] uppercase tracking-widest text-black/20 text-center py-10">Aucun joueur</p>
              ) : (
                playersList.map((player, i) => {
                  const lines = Math.floor(player.score / 5);
                  const inConflict = doubleConnections.some(g => g.some(p => p.id === player.id));
                  return (
                    <div key={player.id} className={`bg-white border-[2px] rounded-xl overflow-hidden ${inConflict ? 'border-[#FF8C00]' : 'border-black/10'}`}>
                      <div className="p-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-black/5 rounded-md flex items-center justify-center font-impact text-black/25 text-[9px] shrink-0">{i + 1}</span>
                        <span className="text-xl leading-none shrink-0">{player.emoji}</span>
                        {renamingPlayerId === player.id ? (
                          <div className="flex-1 flex gap-2 min-w-0">
                            <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(player.id); if (e.key === 'Escape') setRenamingPlayerId(null); }}
                              autoFocus className="flex-1 bg-black/5 border-[2px] border-black/20 rounded-lg px-2 py-1.5 font-impact text-black text-[11px] uppercase focus:outline-none min-w-0" />
                            <button onClick={() => handleSaveRename(player.id)} disabled={isSavingRename} className="w-10 h-10 bg-[#00FF9D] border-[2px] border-black rounded-lg flex items-center justify-center active:scale-90 shrink-0 disabled:opacity-50">
                              {isSavingRename ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" /> : <Check size={14} className="text-black" strokeWidth={3} />}
                            </button>
                            <button onClick={() => setRenamingPlayerId(null)} className="w-10 h-10 bg-black/5 border-[2px] border-black/10 rounded-lg flex items-center justify-center active:scale-90 shrink-0">
                              <X size={14} className="text-black/40" strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-impact text-black text-[13px] uppercase tracking-tight truncate">{player.pseudo}</span>
                                {inConflict && <span className="text-[#FF8C00] text-[10px]">⚠</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[9px] font-impact uppercase tracking-widest ${player.status === 'ACTIVE' ? 'text-[#00CC7A]' : 'text-black/20'}`}>
                                  {player.status === 'ACTIVE' ? '● EN JEU' : '○ LOBBY'}
                                </span>
                                {player.status === 'ACTIVE' && lines > 0 && (
                                  <span className="text-[9px] font-impact uppercase text-[#FF8C00]/70">{lines} ligne{lines > 1 ? 's' : ''}</span>
                                )}
                              </div>
                            </div>
                            {player.status === 'ACTIVE' && (
                              <div className="flex flex-col items-end gap-0.5 shrink-0">
                                <div className="bg-[#FFD700] border-[2px] border-black rounded-lg px-2 py-0.5 shadow-[2px_2px_0px_black]">
                                  <span className="font-impact text-black text-[11px]">{player.score}/25</span>
                                </div>
                                <div className="w-10 h-1 bg-black/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#FFD700] rounded-full" style={{ width: `${(player.score / 25) * 100}%` }} />
                                </div>
                              </div>
                            )}
                            <button onClick={() => { setRenamingPlayerId(player.id); setRenameValue(player.pseudo); }} className="w-9 h-9 bg-black/5 border-[2px] border-black/10 rounded-lg flex items-center justify-center active:scale-90 shrink-0">
                              <Pencil size={11} className="text-black/30" strokeWidth={2.5} />
                            </button>
                            <button onClick={async () => {
                              setRecoveryQR({ playerId: player.id, token: null, loading: true });
                              try { const token = await gameService.generateRecoveryToken(player.id); setRecoveryQR({ playerId: player.id, token, loading: false }); }
                              catch { setRecoveryQR(null); }
                            }} className="w-9 h-9 bg-black/5 border-[2px] border-black/10 rounded-lg flex items-center justify-center active:scale-90 shrink-0">
                              <QrCode size={11} className="text-black/30" strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                      </div>
                      {renamingPlayerId !== player.id && (
                        kickConfirmId === player.id ? (
                          <div className="flex gap-2 px-3 pb-3 -mt-1">
                            <button onClick={() => handleKickPlayer(player.id)} disabled={kickingPlayerId === player.id}
                              className="flex-1 py-2 bg-[#FF2E63] text-white rounded-lg font-impact uppercase text-[10px] border-[2px] border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                              {kickingPlayerId === player.id ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <><UserX size={12} strokeWidth={3} /> Kick</>}
                            </button>
                            <button onClick={() => setKickConfirmId(null)} className="px-3 py-2 bg-black/5 border-[2px] border-black/10 text-black/50 rounded-lg font-impact uppercase text-[9px] active:scale-95 transition-all">Annuler</button>
                          </div>
                        ) : (
                          <div className="flex border-t-2 border-black/5">
                            {player.deviceId && (
                              <button onClick={() => handleClearDeviceLock(player.id)} disabled={clearingDeviceId === player.id}
                                className="flex-1 py-1.5 flex items-center justify-center gap-1 text-[#00CC7A]/60 hover:text-[#00CC7A] hover:bg-[#00CC7A]/5 transition-all border-r-2 border-black/5 disabled:opacity-40">
                                {clearingDeviceId === player.id ? <span className="w-2.5 h-2.5 border border-[#00CC7A]/30 border-t-[#00CC7A] rounded-full animate-spin" /> : <KeyRound size={11} strokeWidth={2.5} />}
                                <span className="font-impact uppercase text-[8px]">Device</span>
                              </button>
                            )}
                            <button onClick={async () => { await gameService.resetPlayerGame(player.id); }}
                              className="flex-1 py-1.5 flex items-center justify-center gap-1 text-[#FF8C00]/60 hover:text-[#FF8C00] hover:bg-[#FF8C00]/5 transition-all border-r-2 border-black/5">
                              <RefreshCw size={11} strokeWidth={2.5} />
                              <span className="font-impact uppercase text-[8px]">Reset</span>
                            </button>
                            <button onClick={() => setKickConfirmId(player.id)} className="flex-1 py-1.5 flex items-center justify-center gap-1 text-[#FF2D6A]/60 hover:text-[#FF2D6A] hover:bg-[#FF2D6A]/5 transition-all">
                              <UserX size={11} strokeWidth={2.5} />
                              <span className="font-impact uppercase text-[8px]">Kick</span>
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
          <div className="bg-white border-[4px] border-black rounded-3xl p-6 w-full max-w-xs shadow-[8px_8px_0px_black] flex flex-col items-center gap-5 relative">
            <button onClick={() => setRecoveryQR(null)} className="absolute top-4 right-4 w-9 h-9 bg-black/5 border-[2px] border-black/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
              <X size={18} strokeWidth={2.5} className="text-black/40" />
            </button>
            <div className="text-center">
              <h3 className="font-impact uppercase text-[#FFD700] text-[15px] tracking-wide" style={{ WebkitTextStroke: '1px black' }}>QR de récupération</h3>
              <p className="text-black/40 text-[10px] font-impact uppercase tracking-widest">{playersList.find(p => p.id === recoveryQR.playerId)?.pseudo ?? '...'}</p>
            </div>
            {recoveryQR.loading ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center"><Loader2 size={32} className="text-black/20 animate-spin" /></div>
            ) : recoveryQR.token ? (
              <div className="bg-white p-4 rounded-2xl border-[4px] border-black shadow-[4px_4px_0px_black]">
                <QRCodeSVG value={`${window.location.origin}${window.location.pathname.replace('/master', '')}?s=${secureSessionId}&recover=${recoveryQR.token}`} size={180} level="H" fgColor="#000000" />
              </div>
            ) : null}
            <p className="text-black/30 text-[9px] font-impact uppercase tracking-widest">Valable 24h · 1 scan suffit</p>
          </div>
        </div>
      )}

      {/* FULLSCREEN QR */}
      {showQRFullscreen && secureSessionId && (
        <div className="fixed inset-0 z-[200] bg-[#0A1629] flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
          <button onClick={() => setShowQRFullscreen(false)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 border-[2px] border-white/20 rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
            <X size={22} strokeWidth={2.5} />
          </button>
          <p className="font-impact text-white/30 uppercase text-[10px] tracking-[0.4em] mb-6">
            {language === 'fr' ? 'Scanne pour rejoindre' : 'Scan to join'}
          </p>
          <div className="bg-white p-6 rounded-3xl border-[6px] mb-8" style={{ borderColor: qrColor, boxShadow: '10px 10px 0px black' }}>
            <QRCodeSVG value={`${window.location.origin}${window.location.pathname.replace('/master', '')}?s=${secureSessionId}`} size={260} level="H" fgColor="#000000" />
          </div>
          <h1 className="font-impact text-white uppercase italic tracking-tighter text-5xl leading-none mb-2">BINGO CRAWL</h1>
          {playerCount > 0 && (
            <div className="flex items-center gap-2 mt-6 px-5 py-2 rounded-2xl border-[3px] border-black bg-[#00F5A0]" style={{ boxShadow: '4px 4px 0px black' }}>
              <Users size={18} className="text-black" strokeWidth={3} />
              <span className="font-impact text-black uppercase text-lg tracking-wide">{playerCount} joueur{playerCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MasterPage;
