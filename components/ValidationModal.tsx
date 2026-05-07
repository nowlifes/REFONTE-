
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RefreshCw, ScanLine, Camera, Trash2, ChevronRight } from 'lucide-react';
import { gameService } from '../services/gameService';
import { BingoCellData, ChallengeType } from '../types';
import MasterRunePad from './MasterRunePad';
import { useLanguage } from '../contexts/LanguageContext';
import Avatar from './Avatar';

interface ValidationModalProps {
  cell: BingoCellData;
  jokerCount: number;
  lastWitnessTime?: number;
  onClose: () => void;
  onConfirm: (data?: { witnessName: string, witnessSignature: string, proofImage?: string, pvpWon?: boolean }) => void;
  onSubmitProof: (file: any) => void;
  onUseJoker: () => void;
  onScanRequest?: () => void;
  onRequestMasterValidation?: () => Promise<void>;
  /** 4.2 Player logo — displayed in modal header */
  playerNickname?: string;
  playerAvatarId?: string;
  /** Digital witness flow — player selects who witnessed them */
  sessionId?: string | null;
  currentPlayerId?: string;
  onRequestPlayerWitness?: (witnessPlayerId: string) => Promise<void>;
  /** Fortune reveal after validation — called when player wins a bonus taunt */
  onFortuneWon?: () => void;
}

type ModalStep = 'INFO' | 'WITNESS_MODE' | 'PLAYER_WITNESS_SELECT' | 'WITNESS_SENT' | 'MASTER_PAD' | 'MASTER_SENT' | 'SUCCESS' | 'PVP_OUTCOME' | 'FORTUNE';

const ValidationModal: React.FC<ValidationModalProps> = ({
  cell, jokerCount, onClose, onConfirm, onUseJoker, onScanRequest,
  playerNickname, playerAvatarId,
  sessionId, currentPlayerId, onRequestPlayerWitness, onFortuneWon,
}) => {
  const { t } = useLanguage();
  const initialStep: ModalStep = cell.type === ChallengeType.MASTER ? 'MASTER_PAD'
    : cell.type === ChallengeType.PVP ? 'PVP_OUTCOME'
    : 'INFO';
  const [step, setStep] = useState<ModalStep>(initialStep);

  const [witnessName, setWitnessName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isPvpVictory, setIsPvpVictory] = useState(false);

  const fortuneRolled = useRef(false);

  // Call this AFTER onConfirm has been called.
  // Rolls the fortune silently. Only shows the FORTUNE screen if the player wins (rare).
  const triggerFortune = () => {
    if (fortuneRolled.current) return;
    fortuneRolled.current = true;
    const won = Math.random() < 0.1;
    if (won) {
      setStep('FORTUNE');
      onFortuneWon?.();
      setTimeout(onClose, 2400);
    } else {
      setTimeout(onClose, 1200);
    }
  };

  // Digital witness state
  const [witnessPlayers, setWitnessPlayers] = useState<Array<{ id: string; pseudo: string; emoji: string }>>([]);
  const [isLoadingWitnesses, setIsLoadingWitnesses] = useState(false);
  const [sendingWitnessTo, setSendingWitnessTo] = useState<string | null>(null);
  const [selectedWitnessName, setSelectedWitnessName] = useState('');
  const [witnessRequestError, setWitnessRequestError] = useState<string | null>(null);

  // Fetch player list when entering player witness select step
  useEffect(() => {
    if (step !== 'PLAYER_WITNESS_SELECT' || !sessionId) return;
    setIsLoadingWitnesses(true);
    gameService.getPlayersWithScores(sessionId).then(list => {
      const others = list.filter(p => p.id !== currentPlayerId);
      if (others.length === 0) {
        setStep('WITNESS_MODE');
      } else {
        setWitnessPlayers(others.map(p => ({ id: p.id, pseudo: p.pseudo, emoji: p.emoji })));
      }
      setIsLoadingWitnesses(false);
    }).catch(() => {
      setIsLoadingWitnesses(false);
      setStep('WITNESS_MODE');
    });
  }, [step, sessionId, currentPlayerId]);

  const handleSelectWitness = async (witnessId: string, witnessName: string) => {
    if (!onRequestPlayerWitness || sendingWitnessTo) return;
    setSendingWitnessTo(witnessId);
    setSelectedWitnessName(witnessName);
    setWitnessRequestError(null);
    try {
      await onRequestPlayerWitness(witnessId);
      setStep('WITNESS_SENT');
    } catch (e) {
      console.error(e);
      setWitnessRequestError('Erreur réseau. Réessaie ou utilise la signature.');
    } finally {
      setSendingWitnessTo(null);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoData(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);

  // Canvas sizing — after DOM paint
  useEffect(() => {
    if (step !== 'WITNESS_MODE') return;
    const syncSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(syncSize); });
    const observer = new ResizeObserver(syncSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); observer.disconnect(); };
  }, [step]);

  // Native touch/mouse listeners — required for {passive: false} to work on mobile
  useEffect(() => {
    if (step !== 'WITNESS_MODE') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getXY = (e: TouchEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ('touches' in e && e.touches.length > 0) {
        return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
      }
      return { x: ((e as MouseEvent).clientX - rect.left) * scaleX, y: ((e as MouseEvent).clientY - rect.top) * scaleY };
    };

    const onStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      isDrawingRef.current = true;
      const { x, y } = getXY(e);
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.strokeStyle = '#FF2E63'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    };

    const onMove = (e: TouchEvent | MouseEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const { x, y } = getXY(e);
      ctx.lineTo(x, y); ctx.stroke();
      setSignatureData(canvas.toDataURL());
    };

    const onEnd = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      setSignatureData(canvas.toDataURL());
    };

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd);

    return () => {
      canvas.removeEventListener('mousedown', onStart);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onEnd);
      canvas.removeEventListener('mouseleave', onEnd);
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onEnd);
    };
  }, [step]);

  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleWitnessConfirm = () => {
    if (!witnessName.trim() || !signatureData) return;
    setConfirmError(null);
    setStep('SUCCESS');
    try {
      onConfirm({ witnessName, witnessSignature: signatureData });
    } catch {
      setStep('INFO');
      setConfirmError('Erreur lors de la validation. Réessaie.');
      return;
    }
    setTimeout(triggerFortune, 900);
  };

  const isWitness = cell.type === ChallengeType.WITNESS;
  const accent = isWitness ? '#FF2E63' : '#00FF9D';
  const accentText = isWitness ? 'text-[#FF2E63]' : 'text-[#00FF9D]';
  const accentBg = isWitness ? 'bg-[#FF2E63]' : 'bg-[#00FF9D]';
  const accentBorder = isWitness ? 'border-[#FF2E63]' : 'border-[#00FF9D]';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-sm sm:max-w-sm bg-[#0A1629] border-[3px] border-white/10 rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_-8px_40px_rgba(0,0,0,0.6)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250"
        style={{ maxHeight: '88vh' }}>

        {step !== 'SUCCESS' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 z-20 text-white/30 hover:text-white/70 active:scale-90 transition-all rounded-xl hover:bg-white/5"
            aria-label="Fermer"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        )}

        {/* ─── INFO STEP ─── */}
        {step === 'INFO' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header — type badge + player logo + challenge text */}
            <div className={`shrink-0 px-6 pt-6 pb-5 border-b border-white/8`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex items-center gap-1.5 ${accentBg} ${isWitness ? 'text-white' : 'text-black'} px-2.5 py-1 rounded-lg`}>
                  <span className="text-[9px] font-impact uppercase tracking-widest">
                    {isWitness ? t('social_feat') : t('solo_feat')}
                  </span>
                </div>
                {/* 4.2 Player logo */}
                {playerAvatarId && (
                  <div className="flex items-center gap-2">
                    <span className="font-impact uppercase text-[9px] text-white/40 tracking-widest">{playerNickname}</span>
                    <Avatar seed={playerAvatarId} size={28} className="ring-1 ring-white/20" />
                  </div>
                )}
              </div>
              <p className={`font-impact text-[22px] ${accentText} uppercase leading-tight italic tracking-tight`}>
                "{cell.text}"
              </p>
            </div>

            {/* Body — actions */}
            <div className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto">
              {/* Photo proof (SOLO only) */}
              {cell.type === ChallengeType.AUTO && (
                <div>
                  <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
                  {photoData ? (
                    <div className="relative w-full h-28 rounded-2xl overflow-hidden border-[3px] border-[#00FF9D] shadow-[3px_3px_0px_black] mb-1">
                      <img src={photoData} alt="proof" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotoData(null)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/70 border border-white/20 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Trash2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full py-3.5 rounded-2xl border-[2px] border-[#00FF9D]/30 bg-[#00FF9D]/5 text-[#00FF9D]/60 font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:border-[#00FF9D]/60 hover:text-[#00FF9D]/80 active:scale-98 transition-all mb-1"
                    >
                      <Camera className="w-4 h-4" strokeWidth={2.5} />
                      Photo preuve (optionnel)
                    </button>
                  )}
                </div>
              )}

              {/* Primary CTA */}
              <button
                onClick={() => {
                  if (isWitness) {
                    if (onRequestPlayerWitness && sessionId) {
                      setStep('PLAYER_WITNESS_SELECT');
                    } else {
                      setStep('WITNESS_MODE');
                    }
                  } else {
                    setStep('SUCCESS');
                    onConfirm({ witnessName: '', witnessSignature: '', proofImage: photoData || undefined }); // validate (modal stays open)
                    setTimeout(triggerFortune, 900);
                  }
                }}
                className={`w-full py-5 rounded-2xl font-impact uppercase text-xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${isWitness ? 'bg-[#FF2E63] text-white' : 'bg-[#00FF9D] text-black'}`}
              >
                {t('i_did_it')}
              </button>

              {/* Joker swap */}
              {jokerCount > 0 && (
                <button
                  onClick={onUseJoker}
                  className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/8 font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <RefreshCw size={13} strokeWidth={2.5} />
                  {t('swap_challenge')} ({jokerCount})
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── WITNESS MODE ─── */}
        {step === 'WITNESS_MODE' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-white/8">
              <div className="inline-flex items-center gap-1.5 bg-[#FF2E63] text-white px-2.5 py-1 rounded-lg mb-3">
                <span className="text-[9px] font-impact uppercase tracking-widest">{t('social_proof')}</span>
              </div>
              <p className="font-impact text-white/50 uppercase text-[10px] tracking-widest leading-relaxed">
                {t('get_friend')}
              </p>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
              <input
                type="text"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                placeholder={t('witness_placeholder')}
                className="w-full shrink-0 bg-white/5 border-[2px] border-white/10 rounded-2xl px-4 py-3.5 font-impact text-white uppercase focus:border-[#FF2E63] focus:outline-none focus:bg-white/8 transition-all placeholder:text-white/20"
              />

              {/* Signature canvas */}
              <div className="flex items-center justify-between px-1 shrink-0">
                <span className="text-[9px] font-impact uppercase tracking-[0.2em] text-[#FF2E63]/70">✍️ SIGNATURE OBLIGATOIRE</span>
                {signatureData && <span className="text-[9px] font-impact uppercase tracking-widest text-[#00F5A0]">✓ SIGNÉ</span>}
              </div>
              <div
                ref={containerRef}
                className={`flex-1 border-[3px] rounded-2xl relative touch-none overflow-hidden transition-all min-h-[200px] ${signatureData ? 'border-[#FF2E63] bg-black/70' : 'border-[#FF2E63]/40 bg-[#110812]'}`}
                style={signatureData ? { boxShadow: '0 0 24px rgba(255,46,99,0.25), inset 0 0 30px rgba(255,46,99,0.05)' } : { boxShadow: 'inset 0 0 24px rgba(255,46,99,0.04)' }}
              >
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full cursor-crosshair"
                />
                {!signatureData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#FF2E63]/10 border-[2px] border-[#FF2E63]/25 flex items-center justify-center">
                      <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px rgba(255,46,99,0.5))' }}>✍️</span>
                    </div>
                    <span className="text-[10px] font-impact uppercase tracking-[0.2em] text-[#FF2E63]/45">DESSINE TA SIGNATURE ICI</span>
                  </div>
                )}
                {/* Clear signature */}
                {signatureData && (
                  <button
                    onClick={() => {
                      setSignatureData(null);
                      if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                      }
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 border border-white/20 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white/60" strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {confirmError && (
                <p className="text-[#FF2D6A] font-impact text-[11px] uppercase tracking-widest text-center -mt-1">{confirmError}</p>
              )}
              <button
                onClick={handleWitnessConfirm}
                disabled={!witnessName.trim() || !signatureData}
                className="w-full shrink-0 py-5 bg-[#FF2E63] text-white font-impact uppercase text-xl rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-30 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[5px_5px_0px_black] disabled:cursor-not-allowed transition-all"
              >
                {t('confirm')} !
              </button>
            </div>
          </div>
        )}

        {/* ─── PLAYER WITNESS SELECT ─── */}
        {step === 'PLAYER_WITNESS_SELECT' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-white/8">
              <div className="inline-flex items-center gap-1.5 bg-[#FF8C00] text-black px-2.5 py-1 rounded-lg mb-3">
                <span className="text-[9px] font-impact uppercase tracking-widest">👁 Témoin</span>
              </div>
              <p className="font-impact text-white text-xl uppercase leading-tight italic tracking-tight mb-1">
                Qui était là ?
              </p>
              <p className="font-impact text-white/40 uppercase text-[10px] tracking-widest leading-relaxed">
                Sélectionne le joueur qui va confirmer sur son téléphone
              </p>
            </div>

            {/* Player list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 no-scrollbar">
              {isLoadingWitnesses ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-[#FF8C00] rounded-full animate-spin" />
                </div>
              ) : witnessPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-impact text-white/30 uppercase text-[11px] tracking-widest">
                    Aucun autre joueur disponible
                  </p>
                  <p className="font-impact text-white/20 uppercase text-[9px] tracking-widest mt-2">
                    Utilise la validation manuelle
                  </p>
                </div>
              ) : (
                witnessPlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectWitness(p.id, p.pseudo)}
                    disabled={sendingWitnessTo !== null}
                    className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/10 rounded-2xl active:bg-white/10 hover:border-[#FF8C00]/50 hover:bg-[#FF8C00]/5 transition-all disabled:opacity-50 group"
                  >
                    <span className="text-2xl leading-none shrink-0">{p.emoji}</span>
                    <span className="font-impact text-white uppercase text-[14px] tracking-tight flex-1 text-left truncate">
                      {p.pseudo}
                    </span>
                    {sendingWitnessTo === p.id ? (
                      <span className="w-5 h-5 border-2 border-[#FF8C00]/30 border-t-[#FF8C00] rounded-full animate-spin shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-white/20 group-hover:text-[#FF8C00]/60 transition-colors shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Fallback to physical signature */}
            <div className="shrink-0 px-4 pt-2 pb-6 flex flex-col gap-2 border-t border-white/5">
              {witnessRequestError && (
                <p className="text-[#FF2E63] font-impact text-[10px] uppercase tracking-widest text-center py-1">{witnessRequestError}</p>
              )}
              <button
                onClick={() => setStep('WITNESS_MODE')}
                className="w-full py-2.5 bg-white/5 border border-white/10 text-white/30 rounded-xl font-impact uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 active:bg-white/10 transition-all"
              >
                Signature manuelle à la place
              </button>
              <button
                onClick={() => setStep('INFO')}
                className="w-full py-2.5 text-white/20 font-impact uppercase text-[9px] tracking-widest flex items-center justify-center gap-1 active:text-white/40 transition-all"
              >
                ← Retour
              </button>
            </div>
          </div>
        )}

        {/* ─── WITNESS SENT ─── */}
        {step === 'WITNESS_SENT' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            style={{ background: 'linear-gradient(180deg, #FF8C00 0%, #FF6A00 60%, #0A1629 100%)' }}>
            {/* Pulsing eye */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-black/20 animate-ping scale-125" />
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center shadow-[6px_6px_0px_rgba(0,0,0,0.35)] relative">
                <span className="text-4xl">👁️</span>
              </div>
            </div>

            <h2 className="font-impact text-3xl text-black uppercase tracking-tighter italic leading-none mb-2">
              Demande envoyée !
            </h2>
            <p className="font-impact text-black/60 uppercase text-[11px] tracking-widest mb-2">
              {selectedWitnessName}
            </p>
            <p className="font-impact text-black/50 uppercase text-[10px] tracking-widest mb-10 leading-loose max-w-[220px]">
              doit confirmer sur son téléphone. Ta case se valide automatiquement !
            </p>

            <div className="flex gap-2 mb-10">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-black/30 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-black text-[#FF8C00] rounded-2xl font-impact uppercase text-lg border-[3px] border-black shadow-[5px_5px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Fermer
            </button>
          </div>
        )}

        {/* ─── MASTER PAD ─── */}
        {step === 'MASTER_PAD' && (
          <div className="flex-1 flex flex-col bg-[#FFD700] overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b-[3px] border-black/15">
              <div className="inline-flex items-center gap-1.5 bg-black text-[#FFD700] px-2.5 py-1 rounded-lg mb-3">
                <ScanLine size={10} strokeWidth={3} />
                <span className="text-[8px] font-impact uppercase tracking-widest">DÉFI MASTER</span>
              </div>
              <p className="font-impact text-black text-xl uppercase leading-tight italic tracking-tight">
                "{cell.text}"
              </p>
            </div>

            {/* Actions */}
            <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto">
              {/* QR Scan — seule option pour valider un défi Master */}
              <button
                onClick={onScanRequest}
                className="w-full py-5 bg-black text-[#FFD700] rounded-2xl font-impact uppercase text-lg flex items-center justify-center gap-3 border-[3px] border-black shadow-[5px_5px_0px_rgba(0,0,0,0.35)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <ScanLine size={22} strokeWidth={2.5} />
                {t('master_scan_btn')}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-black/15" />
                <span className="text-[8px] font-impact uppercase tracking-widest text-black/35">ou code secret</span>
                <div className="flex-1 h-px bg-black/15" />
              </div>

              {/* Rune pad */}
              <div className="flex-1 bg-black/10 rounded-2xl border-[2px] border-black/15 overflow-hidden flex items-center justify-center min-h-[140px]">
                <MasterRunePad onSuccess={() => { onConfirm(); onClose(); }} />
              </div>
            </div>
          </div>
        )}

        {/* ─── MASTER SENT ─── */}
        {step === 'MASTER_SENT' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#FFD700] p-8 text-center">
            {/* Pulsing ring */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-black/15 animate-ping scale-110" />
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center shadow-[6px_6px_0px_rgba(0,0,0,0.3)] relative">
                <span className="text-4xl">📱</span>
              </div>
            </div>

            <h2 className="font-impact text-3xl text-black uppercase tracking-tighter italic leading-none mb-3">
              Demande envoyée!
            </h2>
            <p className="font-impact text-black/55 uppercase text-[10px] tracking-widest mb-10 leading-loose max-w-[220px]">
              Le Master verra ta demande.{'\n'}Ta case se valide automatiquement!
            </p>

            {/* Progress dots — visual waiting indicator */}
            <div className="flex gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-black/25 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-black text-[#FFD700] rounded-2xl font-impact uppercase text-lg border-[3px] border-black shadow-[5px_5px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Fermer
            </button>
          </div>
        )}

        {/* ─── SUCCESS ─── */}
        {step === 'SUCCESS' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#00FF9D] p-10 text-center">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center shadow-[8px_8px_0px_rgba(0,0,0,0.25)] animate-in zoom-in-75 duration-300">
              <Check size={48} className="text-[#00FF9D]" strokeWidth={5} />
            </div>
            <h2 className="font-impact text-4xl text-black uppercase mt-8 tracking-tighter italic leading-none animate-in slide-in-from-bottom-2 duration-300 delay-100">
              {t('validated')}
            </h2>
          </div>
        )}

        {/* ─── PVP OUTCOME ─── */}
        {step === 'PVP_OUTCOME' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 px-6 pt-6 pb-5 border-b border-white/8">
              <div className="inline-flex items-center gap-1.5 bg-[#FF8C00] text-black px-2.5 py-1 rounded-lg mb-4">
                <span className="text-[9px] font-impact uppercase tracking-widest">⚔️ {t('pvp_feat')}</span>
              </div>
              <p className="font-impact text-[20px] text-white uppercase leading-tight italic tracking-tight">
                "{cell.text}"
              </p>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-4 justify-center">
              <p className="font-impact text-white/50 uppercase text-[11px] tracking-widest text-center">
                {t('pvp_result_question')}
              </p>
              {/* WON — validate + taunt garanti */}
              <button
                onClick={() => {
                  setIsPvpVictory(true);
                  onConfirm({ witnessName: '', witnessSignature: '', pvpWon: true });
                  setStep('FORTUNE');
                  onFortuneWon?.();
                  setTimeout(onClose, 2400);
                }}
                className="w-full py-5 rounded-2xl font-impact uppercase text-2xl bg-[#00F5A0] text-black border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                {t('pvp_won_btn')}
              </button>
              {/* LOST — validate + brief SUCCESS flash + close (no fortune) */}
              <button
                onClick={() => {
                  setStep('SUCCESS');
                  onConfirm({ witnessName: '', witnessSignature: '', pvpWon: false });
                  setTimeout(onClose, 1200);
                }}
                className="w-full py-4 rounded-2xl font-impact uppercase text-lg bg-white/8 text-white/50 border-[2px] border-white/15 active:bg-white/12 transition-all"
              >
                {t('pvp_lost_btn')}
              </button>
            </div>
          </div>
        )}

        {/* ─── FORTUNE REVEAL — taunt bonus (fortune aléatoire ou victoire PvP garantie) ─── */}
        {step === 'FORTUNE' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#FFD700] p-10 text-center">
            <div className="w-28 h-28 bg-black rounded-full flex items-center justify-center shadow-[8px_8px_0px_rgba(0,0,0,0.3)] animate-in zoom-in-75 duration-300 mb-6">
              <span className="text-5xl">{isPvpVictory ? '⚔️' : '⚡'}</span>
            </div>
            <h2 className="font-impact text-4xl text-black uppercase tracking-tighter italic leading-none animate-in slide-in-from-bottom-2 duration-300">
              {isPvpVictory ? 'TU AS GAGNÉ !' : t('fortune_won_title')}
            </h2>
            <p className="font-impact text-black/60 uppercase text-[11px] tracking-widest mt-3 animate-in slide-in-from-bottom-2 duration-300 delay-100">
              {isPvpVictory ? 'TAUNT GAGNÉ — ÉCRASE-LES !' : t('fortune_won_sub')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationModal;
