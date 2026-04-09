
import React, { useState, useEffect } from 'react';
import { Power, DoorOpen, DoorClosed, Gamepad2, Crown, Trash2, AlertTriangle, X, Users, List, Sparkles, PartyPopper, MapPin, Clock, XCircle, Expand } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppView } from '../types';
import { APP_VERSION, MASTER_VALID_CODE, CHALLENGES_EN, CHALLENGES_FR } from '../constants';
import { gameService } from '../services/gameService';
import { supabase } from '../lib/supabaseClient';
import BackgroundParticles from './BackgroundParticles';

// Derive a consistent accent color from the session UUID so the master can
// visually confirm a new QR code was generated (color changes each session).
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
  /** UUID of the current secure session — drives the QR code URL */
  secureSessionId: string | null;
  state: any;
  actions: any;
}

const MasterPage: React.FC<MasterPageProps> = ({ isSessionActive, setSessionActive, resetSession, createNewSession, onWrapped, triggerBarTransition, clearBarTransition, transitionEndsAt, nextBarName, secureSessionId, state: s, actions: a }) => {
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

  // Fix 3: realtime player count for the current secure session
  const [playerCount, setPlayerCount] = useState(0);
  useEffect(() => {
    if (!secureSessionId) { setPlayerCount(0); return; }
    // Initial count
    supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', secureSessionId)
      .then(({ count }) => setPlayerCount(count ?? 0));
    // Realtime: increment on each new player JOIN
    const ch = supabase
      .channel(`player_count_${secureSessionId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'players',
        filter: `session_id=eq.${secureSessionId}`,
      }, () => setPlayerCount(prev => prev + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [secureSessionId]);

  // Bar transition state
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
    const fetchChallenges = async () => {
      const challenges = await gameService.getChallenges();
      setDbChallenges(challenges);
    };
    fetchChallenges();
  }, []);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetSession();
      setShowResetConfirm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateNew = async () => {
    setIsCreatingNew(true);
    try {
      await createNewSession();
      setShowNewSessionConfirm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleWrapped = async () => {
    setIsWrapping(true);
    try {
      await onWrapped();
    } catch (e) {
      console.error(e);
    } finally {
      setIsWrapping(false);
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const challenges = language === 'fr' ? CHALLENGES_FR : CHALLENGES_EN;
      await gameService.simulatePlayers(challenges);
      alert("✅ 5 Mock Agents deployed to the field!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1629] flex flex-col items-center justify-center p-6">
      <BackgroundParticles />
      <div className="w-full max-w-sm relative z-10 animate-in zoom-in duration-300">
         <div className="bg-white border-[4px] border-black rounded-2xl p-6 shadow-[10px_10px_0px_black] text-center overflow-hidden">
            <div className="mb-6 pb-6 border-b-2 border-black/10">
               <h2 className="text-3xl font-impact font-[900] text-black uppercase tracking-tighter italic mb-1">{t('master_control')}</h2>
               <div className="flex items-center justify-center gap-3 mb-4">
                 <p className="text-[10px] font-impact text-black/40 uppercase tracking-widest">
                   Session: {isSessionActive ? 'ACTIVE' : 'CLOSED'}
                 </p>
                 {isSessionActive && secureSessionId && (
                   <div className="flex items-center gap-1 bg-[#00FF9D] border-[2px] border-black rounded-lg px-2 py-0.5 shadow-[2px_2px_0px_black]">
                     <Users className="w-3 h-3 text-black" strokeWidth={3} />
                     <span className="font-impact text-[10px] text-black uppercase tracking-wide">
                       {playerCount}
                     </span>
                   </div>
                 )}
               </div>
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => setSessionActive(true)} className={`p-4 rounded-xl border-[3px] border-black flex flex-col items-center justify-center gap-1 transition-all ${isSessionActive ? 'bg-[#00FF9D] shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[3px_3px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none'}`}>
                     <DoorOpen className="w-8 h-8 text-black" strokeWidth={3} />
                     <span className="font-impact text-[9px] uppercase tracking-widest">{t('open')}</span>
                  </button>
                  <button onClick={() => setSessionActive(false)} className={`p-4 rounded-xl border-[3px] border-black flex flex-col items-center justify-center gap-1 transition-all ${!isSessionActive ? 'bg-[#FF2E63] shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[3px_3px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none'}`}>
                     <DoorClosed className="w-8 h-8 text-black" strokeWidth={3} />
                     <span className="font-impact text-[9px] uppercase tracking-widest">{t('closed')}</span>
                  </button>
               </div>
               
               <div className="flex flex-col gap-2">
                 <button onClick={() => a.setView(s.cells.length > 0 ? AppView.GAME : AppView.NICKNAME)} className="w-full py-3 bg-black text-white rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Gamepad2 className="w-4 h-4" /> {t('back_to_game')}
                 </button>

                 <button 
                   onClick={handleSimulate} 
                   disabled={isSimulating}
                   className="w-full py-3 bg-gold-500 text-black rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[4px_4px_0px_black] border-[3px] border-black disabled:opacity-50"
                 >
                    <Users className={`w-4 h-4 ${isSimulating ? 'animate-bounce' : ''}`} /> 
                    {isSimulating ? 'DEPLOYING AGENTS...' : 'SIMULATE 5 PLAYERS'}
                 </button>
                 
                 <button
                   onClick={handleWrapped}
                   disabled={isWrapping}
                   className="w-full py-3 bg-[#FFD700] text-black rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[4px_4px_0px_black] border-[3px] border-black disabled:opacity-50"
                 >
                   <PartyPopper className={`w-4 h-4 ${isWrapping ? 'animate-bounce' : ''}`} />
                   {isWrapping ? 'CLOSING...' : 'FIN DE SOIRÉE (WRAPPED)'}
                 </button>

                 <button
                   onClick={() => setShowResetConfirm(true)}
                   className="w-full py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-impact uppercase text-[8px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                 >
                    <Trash2 className="w-3 h-3" /> {t('reset_session')}
                 </button>

                 <button 
                   onClick={() => setShowNewSessionConfirm(true)} 
                   className="w-full py-3 bg-[#00FF9D] text-black rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[4px_4px_0px_black] border-[3px] border-black mt-2"
                 >
                    <Sparkles className="w-4 h-4" /> {t('create_new_session')}
                 </button>

                 <button 
                    onClick={() => setShowChallenges(true)} 
                    className="w-full py-3 bg-blue-500 text-white rounded-xl font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[4px_4px_0px_black] border-[3px] border-black"
                  >
                     <List className="w-4 h-4" /> {dbChallenges.length} CHALLENGES LOADED
                  </button>
               </div>
            </div>

            {/* BAR TRANSITION SECTION */}
            <div className="mb-6 pb-6 border-b-2 border-black/10">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-[#FF2D6A]" strokeWidth={3} fill="currentColor" />
                <span className="font-impact text-[11px] uppercase tracking-widest text-black">
                  {language === 'fr' ? 'Changement de bar' : 'Bar Change'}
                </span>
              </div>

              {transitionEndsAt ? (
                /* Active transition — show countdown + cancel */
                <div className="bg-[#FF2D6A] border-[3px] border-black rounded-xl p-3 shadow-[4px_4px_0px_black] flex items-center justify-between">
                  <div className="flex flex-col leading-none">
                    <span className="font-impact text-white uppercase text-[9px] tracking-widest opacity-70">
                      {language === 'fr' ? 'Countdown actif' : 'Countdown active'}
                      {nextBarName ? ` — ${nextBarName}` : ''}
                    </span>
                    <span className="font-impact text-white text-2xl italic">
                      {Math.floor(transitionSecondsLeft / 60)}:{String(transitionSecondsLeft % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    onClick={clearBarTransition}
                    className="w-10 h-10 bg-white border-[2px] border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <XCircle className="w-5 h-5 text-[#FF2D6A]" strokeWidth={3} />
                  </button>
                </div>
              ) : (
                /* Setup form */
                <div className="flex flex-col gap-2">
                  {/* Duration pills */}
                  <div className="flex gap-1.5">
                    {[2, 5, 10, 15].map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDuration(d)}
                        className={`flex-1 py-2 rounded-xl font-impact text-[11px] uppercase border-[2px] border-black transition-all ${
                          selectedDuration === d
                            ? 'bg-black text-white shadow-none translate-x-[1px] translate-y-[1px]'
                            : 'bg-white text-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                        }`}
                      >
                        {d}{language === 'fr' ? 'min' : 'm'}
                      </button>
                    ))}
                  </div>

                  {/* Bar name input */}
                  <input
                    type="text"
                    value={barNameInput}
                    onChange={e => setBarNameInput(e.target.value)}
                    placeholder={language === 'fr' ? 'Nom du prochain bar (optionnel)' : 'Next bar name (optional)'}
                    className="w-full bg-white border-[2px] border-black/20 rounded-xl px-3 py-2.5 font-impact text-black text-[11px] uppercase focus:border-black focus:outline-none transition-all placeholder:text-black/20"
                  />

                  {/* Trigger button */}
                  <button
                    onClick={handleTriggerTransition}
                    disabled={isTriggeringTransition}
                    className="w-full py-3 bg-[#FF2D6A] text-white rounded-xl font-impact uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 border-[2px] border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" strokeWidth={3} />
                    {isTriggeringTransition
                      ? (language === 'fr' ? 'Envoi...' : 'Sending...')
                      : (language === 'fr' ? `Lancer le countdown (${selectedDuration} min)` : `Start countdown (${selectedDuration} min)`)}
                  </button>
                </div>
              )}
            </div>

            {/* Session QR code — points to ?s=UUID, invalidated on each new session */}
            {secureSessionId ? (() => {
              const qrColor = sessionColor(secureSessionId);
              return (
              <>
                {/* Color badge — changes visually with each new session */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full border-[2px] border-black animate-pulse" style={{ backgroundColor: qrColor }} />
                  <span className="font-impact text-[9px] uppercase tracking-[0.2em] text-black/40">
                    Session active
                  </span>
                  <div className="w-3 h-3 rounded-full border-[2px] border-black animate-pulse" style={{ backgroundColor: qrColor }} />
                </div>

                {/* Preview + fullscreen button */}
                <button
                  onClick={() => setShowQRFullscreen(true)}
                  className="relative mx-auto block group"
                >
                  <div className="bg-white p-3 rounded-xl mx-auto w-fit border-[4px] transition-all group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-none"
                    style={{ borderColor: qrColor, boxShadow: `4px 4px 0px black` }}>
                    <QRCodeSVG
                      value={`${window.location.origin}${window.location.pathname}?s=${secureSessionId}`}
                      size={140}
                      level="H"
                      fgColor="#000000"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all bg-black text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                      <Expand className="w-3.5 h-3.5" />
                      <span className="font-impact text-[10px] uppercase tracking-widest">Afficher</span>
                    </div>
                  </div>
                </button>
                <p className="text-[8px] font-impact text-black/40 uppercase tracking-widest italic mt-2 mb-0.5">
                  Tap pour afficher en grand
                </p>
              </>
              );
            })() : (
              <div className="bg-black/5 border-[2px] border-dashed border-black/20 rounded-xl p-6 mx-auto text-center mb-2">
                <p className="font-impact text-[10px] uppercase tracking-widest text-black/40">
                  Crée une nouvelle session<br />pour générer le QR code
                </p>
              </div>
            )}
         </div>
         <div className="text-center mt-4">
           <span className="text-[9px] font-impact text-white/20 uppercase tracking-widest">V{APP_VERSION}</span>
         </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border-[4px] border-black rounded-2xl p-8 relative shadow-[10px_10px_0px_#FF2E63] animate-in zoom-in duration-300">
            <button onClick={() => setShowResetConfirm(false)} className="absolute top-4 right-4 text-black/20 hover:text-black"><X className="w-6 h-6" /></button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-impact font-bold text-black uppercase tracking-tighter italic mb-2">
                {t('reset_session')}
              </h3>
              <p className="text-sm font-medium text-black/60 leading-tight">
                {t('reset_session_confirm')}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleReset}
                disabled={isResetting}
                className="w-full bg-[#FF2E63] text-white font-impact uppercase py-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
              >
                {isResetting ? t('loading') : t('reset_session_btn')}
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="w-full bg-white text-black font-impact uppercase py-3 rounded-xl border-[3px] border-black hover:bg-slate-50 transition-all"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SESSION CONFIRMATION MODAL */}
      {showNewSessionConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border-[4px] border-black rounded-2xl p-8 relative shadow-[10px_10px_0px_#00FF9D] animate-in zoom-in duration-300">
            <button onClick={() => setShowNewSessionConfirm(false)} className="absolute top-4 right-4 text-black/20 hover:text-black"><X className="w-6 h-6" /></button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-impact font-bold text-black uppercase tracking-tighter italic mb-2">
                {t('create_new_session')}
              </h3>
              <p className="text-sm font-medium text-black/60 leading-tight">
                {t('create_new_session_confirm')}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCreateNew}
                disabled={isCreatingNew}
                className="w-full bg-[#00FF9D] text-black font-impact uppercase py-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
              >
                {isCreatingNew ? t('loading') : t('create_new_session_btn')}
              </button>
              <button 
                onClick={() => setShowNewSessionConfirm(false)}
                className="w-full bg-white text-black font-impact uppercase py-3 rounded-xl border-[3px] border-black hover:bg-slate-50 transition-all"
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
          <div className="w-full max-w-lg bg-white border-[4px] border-black rounded-2xl p-6 relative shadow-[10px_10px_0px_#3B82F6] flex flex-col max-h-[80vh]">
            <button onClick={() => setShowChallenges(false)} className="absolute top-4 right-4 text-black/20 hover:text-black z-10"><X className="w-6 h-6" /></button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-impact font-bold text-black uppercase tracking-tighter italic">
                SUPABASE CHALLENGES ({dbChallenges.length})
              </h3>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-2 no-scrollbar">
               {dbChallenges.map((c, i) => (
                 <div key={i} className="p-3 bg-slate-50 border-2 border-black/10 rounded-xl flex items-center gap-3">
                    <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-impact text-xs italic">{i + 1}</span>
                    <div className="flex-1">
                       <div className="text-[10px] font-impact uppercase text-black/40">{c.type}</div>
                       <div className="text-xs font-bold text-black leading-tight">
                          {language === 'fr' ? (c.text_fr || c.text) : (c.text_en || c.text)}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN QR DISPLAY — for players to scan */}
      {showQRFullscreen && secureSessionId && (
        <div className="fixed inset-0 z-[200] bg-[#0A1629] flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
          {/* Close button */}
          <button
            onClick={() => setShowQRFullscreen(false)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 border-[2px] border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
          >
            <X className="w-6 h-6" strokeWidth={3} />
          </button>

          {/* Instruction */}
          <p className="font-impact text-white/40 uppercase text-[11px] tracking-[0.4em] mb-6">
            {language === 'fr' ? 'Scanne pour rejoindre' : 'Scan to join'}
          </p>

          {/* Giant QR — bordered in session color so master sees it changed */}
          <div className="bg-white p-6 rounded-3xl border-[6px] shadow-[10px_10px_0px_black] mb-8"
            style={{ borderColor: sessionColor(secureSessionId) }}>
            <QRCodeSVG
              value={`${window.location.origin}${window.location.pathname}?s=${secureSessionId}`}
              size={260}
              level="H"
              fgColor="#000000"
            />
          </div>

          {/* Title */}
          <h1 className="font-impact text-white uppercase italic tracking-tighter text-5xl leading-none mb-2">
            BINGO CRAWL
          </h1>
          <p className="font-impact text-[#FFD700] uppercase text-xl tracking-widest mb-8">
            🍺 LISBONNE
          </p>

          {/* Player count pill */}
          {playerCount > 0 && (
            <div className="flex items-center gap-2 bg-[#00F5A0] border-[3px] border-black rounded-2xl px-5 py-2 shadow-[4px_4px_0px_black]">
              <Users className="w-5 h-5 text-black" strokeWidth={3} />
              <span className="font-impact text-black uppercase text-lg tracking-wide">
                {playerCount} {language === 'fr' ? 'joueur' : 'player'}{playerCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MasterPage;
