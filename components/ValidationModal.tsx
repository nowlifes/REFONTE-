
import React, { useState, useRef, useLayoutEffect } from 'react';
import { X, Check, RefreshCw, ScanLine, Camera, Trash2 } from 'lucide-react';
import { BingoCellData, ChallengeType } from '../types';
import MasterRunePad from './MasterRunePad';
import { useLanguage } from '../contexts/LanguageContext';

interface ValidationModalProps {
  cell: BingoCellData;
  jokerCount: number;
  lastWitnessTime?: number;
  onClose: () => void;
  onConfirm: (data?: { witnessName: string, witnessSignature: string, proofImage?: string }) => void;
  onSubmitProof: (file: any) => void;
  onUseJoker: () => void;
  onScanRequest?: () => void;
}

type ModalStep = 'INFO' | 'WITNESS_MODE' | 'MASTER_PAD' | 'SUCCESS';

const ValidationModal: React.FC<ValidationModalProps> = ({ cell, jokerCount, onClose, onConfirm, onUseJoker, onScanRequest }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<ModalStep>(cell.type === ChallengeType.MASTER ? 'MASTER_PAD' : 'INFO');
  
  const [witnessName, setWitnessName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
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
    ctx.beginPath(); ctx.moveTo(x, y); ctx.strokeStyle = '#00FF9D'; ctx.lineWidth = 4; ctx.lineCap = 'round';
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

  const stopDrawing = () => { if (isDrawing && canvasRef.current) { setIsDrawing(false); setSignatureData(canvasRef.current.toDataURL()); } };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm h-[75vh] bg-[#0A1629] border-[3px] border-white/20 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {step !== 'SUCCESS' && (
           <button onClick={onClose} className="absolute top-4 right-4 p-2 z-20 text-white/50 hover:text-white active:scale-90 transition-all">
             <X size={28} />
           </button>
        )}

        {step === 'INFO' && (
          <div className="flex-1 flex flex-col">
            <div className={`shrink-0 p-8 text-center border-b border-white/10 ${cell.type === ChallengeType.WITNESS ? 'bg-[#FF2E63]/10' : 'bg-[#00FF9D]/10'}`}>
                <h3 className={`font-impact font-[900] uppercase text-2xl tracking-tighter italic ${cell.type === ChallengeType.WITNESS ? 'text-[#FF2E63]' : 'text-[#00FF9D]'}`}>
                    {cell.type === ChallengeType.WITNESS ? t('social_feat') : t('solo_feat')}
                </h3>
                <span className="text-[10px] font-impact text-white/40 uppercase tracking-widest mt-1 block">
                    {cell.type === ChallengeType.WITNESS ? t('mode_social_desc') : t('mode_solo_desc')}
                </span>
            </div>
            
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
               <div className="bg-white/5 p-6 rounded-2xl border border-white/10 w-full mb-10">
                  <p className="font-impact font-[900] text-xl text-white uppercase leading-tight italic">"{cell.text}"</p>
               </div>
               
               <div className="w-full space-y-4">
                  {/* Photo proof for SOLO */}
                  {cell.type === ChallengeType.AUTO && (
                    <div className="w-full">
                      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
                      {photoData ? (
                        <div className="relative w-full h-28 rounded-2xl overflow-hidden border-[3px] border-[#00FF9D] mb-2">
                          <img src={photoData} alt="proof" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setPhotoData(null)}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-lg flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-white/40 font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:border-white/40 hover:text-white/60 transition-all mb-2"
                        >
                          <Camera className="w-4 h-4" strokeWidth={2.5} />
                          Photo preuve (optionnel)
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => cell.type === ChallengeType.WITNESS ? setStep('WITNESS_MODE') : onConfirm({ witnessName: '', witnessSignature: '', proofImage: photoData || undefined })}
                    className={`w-full py-5 rounded-2xl font-impact uppercase text-xl transition-all active:scale-95 shadow-lg ${cell.type === ChallengeType.WITNESS ? 'bg-[#FF2E63] text-white shadow-[#FF2E63]/20' : 'bg-[#00FF9D] text-black shadow-[#00FF9D]/20'}`}
                  >
                     {t('i_did_it')}
                  </button>
                  
                  {jokerCount > 0 && (
                    <button onClick={onUseJoker} className="w-full py-3 text-white/30 hover:text-white/60 font-impact uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-colors">
                       <RefreshCw size={14} /> {t('swap_challenge')} ({jokerCount})
                    </button>
                  )}
               </div>
            </div>
          </div>
        )}

        {step === 'WITNESS_MODE' && (
          <div className="flex-1 flex flex-col">
             <div className="p-8 text-center border-b border-white/10 bg-[#FF2E63]/10">
                <h3 className="font-impact text-[#FF2E63] uppercase text-2xl tracking-tighter italic leading-none">{t('social_proof')}</h3>
                <p className="text-[9px] text-white/40 font-impact uppercase tracking-widest mt-2">{t('get_friend')}</p>
             </div>
             
             <div className="flex-1 p-6 flex flex-col gap-5">
                <input 
                  type="text" 
                  value={witnessName} 
                  onChange={(e) => setWitnessName(e.target.value)} 
                  placeholder={t('witness_placeholder')}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl p-4 font-impact text-white uppercase focus:border-[#FF2E63] focus:outline-none transition-all placeholder:text-white/10" 
                />
                
                <div ref={containerRef} className="flex-1 border-2 border-white/10 rounded-2xl bg-black/40 relative touch-none overflow-hidden">
                   <canvas 
                    ref={canvasRef} 
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} 
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} 
                    className="absolute inset-0 w-full h-full" 
                   />
                   {!signatureData && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 text-[10px] font-impact uppercase tracking-widest text-white">{t('signature_area')}</div>}
                </div>
                
                <button 
                  onClick={handleWitnessConfirm} 
                  disabled={!witnessName || !signatureData} 
                  className="w-full py-5 bg-white text-black font-impact uppercase text-xl rounded-2xl shadow-xl active:scale-95 disabled:opacity-10 transition-all"
                >
                   {t('confirm')} !
                </button>
             </div>
          </div>
        )}

        {step === 'MASTER_PAD' && (
           <div className="flex-1 flex flex-col bg-[#FFD700]">
              {/* Header */}
              <div className="shrink-0 px-6 pt-6 pb-4 border-b-[3px] border-black/20">
                <div className="inline-flex items-center gap-1.5 bg-black text-[#FFD700] px-2 py-1 rounded-lg mb-3">
                  <ScanLine size={10} strokeWidth={3} />
                  <span className="text-[8px] font-impact uppercase tracking-widest">DÉFI MASTER</span>
                </div>
                <p className="font-impact font-[900] text-black text-lg uppercase leading-tight italic">
                  "{cell.text}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
                 {/* QR Scan — primary */}
                 <button
                   onClick={onScanRequest}
                   className="w-full py-4 bg-black text-[#FFD700] rounded-2xl font-impact uppercase text-base flex items-center justify-center gap-3 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                 >
                    <ScanLine size={20} strokeWidth={3} /> Scanner le QR du Master
                 </button>

                 {/* Divider */}
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-px bg-black/20" />
                   <span className="text-[8px] font-impact uppercase tracking-widest text-black/40">ou code secret</span>
                   <div className="flex-1 h-px bg-black/20" />
                 </div>

                 {/* Rune pad */}
                 <div className="flex-1 bg-black/10 rounded-2xl border-2 border-black/20 overflow-hidden flex items-center justify-center">
                    <MasterRunePad onSuccess={() => onConfirm()} />
                 </div>
              </div>
           </div>
        )}

        {step === 'SUCCESS' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#00FF9D] p-10 text-center">
             <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <Check size={50} className="text-[#00FF9D]" strokeWidth={6} />
             </div>
             <h2 className="font-impact font-[900] text-4xl text-black uppercase mt-8 tracking-tighter italic leading-none">{t('validated')}</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationModal;
