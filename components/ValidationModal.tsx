
import React, { useState, useRef, useLayoutEffect } from 'react';
import { X, Check, RefreshCw, ScanLine } from 'lucide-react';
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
                  <button 
                    onClick={() => cell.type === ChallengeType.WITNESS ? setStep('WITNESS_MODE') : onConfirm()} 
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
              <div className="p-8 border-b-[4px] border-black text-center">
                 <h3 className="font-impact text-black uppercase text-2xl italic tracking-tighter leading-none">{t('master_access_title')}</h3>
              </div>
              <div className="flex-1 p-6 flex flex-col">
                 <button onClick={onScanRequest} className="w-full py-4 bg-black text-white rounded-2xl font-impact uppercase text-xl flex items-center justify-center gap-3 mb-6 shadow-xl active:scale-95 transition-all">
                    <ScanLine size={24} strokeWidth={3} /> {t('scan_entry')}
                 </button>
                 <div className="flex-1 bg-black/10 rounded-2xl border-2 border-black/10 overflow-hidden">
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
