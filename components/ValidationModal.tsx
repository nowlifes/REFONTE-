
import React, { useState, useRef, useLayoutEffect } from 'react';
import { X, Check, RefreshCw, ScanLine, Camera, Trash2 } from 'lucide-react';
import { BingoCellData, ChallengeType } from '../types';
import MasterRunePad from './MasterRunePad';
import { useLanguage } from '../contexts/LanguageContext';
import Avatar from './Avatar';

interface ValidationModalProps {
  cell: BingoCellData;
  jokerCount: number;
  lastWitnessTime?: number;
  onClose: () => void;
  onConfirm: (data?: { witnessName: string, witnessSignature: string, proofImage?: string }) => void;
  onSubmitProof: (file: any) => void;
  onUseJoker: () => void;
  onScanRequest?: () => void;
  onRequestMasterValidation?: () => Promise<void>;
  /** 4.2 Player logo — displayed in modal header */
  playerNickname?: string;
  playerAvatarId?: string;
}

type ModalStep = 'INFO' | 'WITNESS_MODE' | 'MASTER_PAD' | 'MASTER_SENT' | 'SUCCESS';

const ValidationModal: React.FC<ValidationModalProps> = ({ cell, jokerCount, onClose, onConfirm, onUseJoker, onScanRequest, onRequestMasterValidation, playerNickname, playerAvatarId }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<ModalStep>(cell.type === ChallengeType.MASTER ? 'MASTER_PAD' : 'INFO');

  const [witnessName, setWitnessName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [isSendingToMaster, setIsSendingToMaster] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoData(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useLayoutEffect(() => {
    if (step === 'WITNESS_MODE' && canvasRef.current && containerRef.current) {
      const resizeCanvas = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (canvas && container) {
          canvas.width = container.offsetWidth;
          canvas.height = container.offsetHeight;
        }
      };
      resizeCanvas();
    }
  }, [step]);

  const handleWitnessConfirm = () => {
    if (!witnessName.trim() || !signatureData) return;
    setStep('SUCCESS');
    setTimeout(() => onConfirm({ witnessName, witnessSignature: signatureData }), 800);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.strokeStyle = '#FF2E63'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return; e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.lineTo(x, y); ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) { setIsDrawing(false); setSignatureData(canvasRef.current.toDataURL()); }
  };

  const isWitness = cell.type === ChallengeType.WITNESS;
  const accent = isWitness ? '#FF2E63' : '#00FF9D';
  const accentText = isWitness ? 'text-[#FF2E63]' : 'text-[#00FF9D]';
  const accentBg = isWitness ? 'bg-[#FF2E63]' : 'bg-[#00FF9D]';
  const accentBorder = isWitness ? 'border-[#FF2E63]' : 'border-[#00FF9D]';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center">
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
              <p className={`font-impact font-[900] text-[22px] ${accentText} uppercase leading-tight italic tracking-tight`}>
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
                onClick={() =>
                  isWitness
                    ? setStep('WITNESS_MODE')
                    : onConfirm({ witnessName: '', witnessSignature: '', proofImage: photoData || undefined })
                }
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
              <div
                ref={containerRef}
                className={`flex-1 border-[2px] rounded-2xl bg-black/50 relative touch-none overflow-hidden transition-all ${signatureData ? 'border-[#FF2E63]/60' : 'border-white/10'}`}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                  className="absolute inset-0 w-full h-full"
                />
                {!signatureData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
                    <span className="text-2xl opacity-20">✍️</span>
                    <span className="text-[9px] font-impact uppercase tracking-widest text-white/20">{t('signature_area')}</span>
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

        {/* ─── MASTER PAD ─── */}
        {step === 'MASTER_PAD' && (
          <div className="flex-1 flex flex-col bg-[#FFD700] overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b-[3px] border-black/15">
              <div className="inline-flex items-center gap-1.5 bg-black text-[#FFD700] px-2.5 py-1 rounded-lg mb-3">
                <ScanLine size={10} strokeWidth={3} />
                <span className="text-[8px] font-impact uppercase tracking-widest">DÉFI MASTER</span>
              </div>
              <p className="font-impact font-[900] text-black text-xl uppercase leading-tight italic tracking-tight">
                "{cell.text}"
              </p>
            </div>

            {/* Actions */}
            <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto">
              {/* QR Scan — primary (always available) */}
              <button
                onClick={onScanRequest}
                className="w-full py-4 bg-black text-[#FFD700] rounded-2xl font-impact uppercase text-base flex items-center justify-center gap-3 border-[3px] border-black shadow-[5px_5px_0px_rgba(0,0,0,0.35)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <ScanLine size={20} strokeWidth={2.5} />
                Scanner le QR du Master
              </button>

              {/* Remote — secondary (if session connected) */}
              {onRequestMasterValidation && (
                <button
                  onClick={async () => {
                    if (isSendingToMaster) return;
                    setIsSendingToMaster(true);
                    try {
                      await onRequestMasterValidation();
                      setStep('MASTER_SENT');
                    } finally {
                      setIsSendingToMaster(false);
                    }
                  }}
                  disabled={isSendingToMaster}
                  className="w-full py-4 bg-white text-black rounded-2xl font-impact uppercase text-base flex items-center justify-center gap-3 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,0.25)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_rgba(0,0,0,0.25)] transition-all"
                >
                  {isSendingToMaster ? (
                    <>
                      <span className="w-5 h-5 border-[3px] border-black/30 border-t-black rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>📱 Demander au Master</>
                  )}
                </button>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-black/15" />
                <span className="text-[8px] font-impact uppercase tracking-widest text-black/35">ou code secret</span>
                <div className="flex-1 h-px bg-black/15" />
              </div>

              {/* Rune pad */}
              <div className="flex-1 bg-black/10 rounded-2xl border-[2px] border-black/15 overflow-hidden flex items-center justify-center min-h-[140px]">
                <MasterRunePad onSuccess={() => onConfirm()} />
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

            <h2 className="font-impact font-[900] text-3xl text-black uppercase tracking-tighter italic leading-none mb-3">
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
            <h2 className="font-impact font-[900] text-4xl text-black uppercase mt-8 tracking-tighter italic leading-none animate-in slide-in-from-bottom-2 duration-300 delay-100">
              {t('validated')}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationModal;
