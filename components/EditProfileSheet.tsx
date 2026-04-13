
import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import Avatar from './Avatar';
import { AVATAR_SEEDS } from '../constants';

interface EditProfileSheetProps {
  currentNickname: string;
  currentAvatarId: string; // key or emoji char — Avatar handles both
  onSave: (nickname: string, avatarKey: string) => Promise<void>;
  onClose: () => void;
}

const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  currentNickname,
  currentAvatarId,
  onSave,
  onClose,
}) => {
  // Find the seed key matching the current avatarId (handles both key and emoji char)
  const initialKey = AVATAR_SEEDS.includes(currentAvatarId)
    ? currentAvatarId
    : (AVATAR_SEEDS.find(k => {
        // lazy import workaround: check via Avatar
        return false; // fallback to first seed if emoji char given
      }) ?? AVATAR_SEEDS[0]);

  const [nickname, setNickname] = useState(currentNickname);
  const [selectedSeed, setSelectedSeed] = useState(initialKey);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) return;
    setIsSaving(true);
    try {
      await onSave(nickname.trim(), selectedSeed);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/85 flex items-end justify-center animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-[#0A1629] border-[3px] border-white/10 rounded-t-[2rem] shadow-[0_-8px_40px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-250"
        style={{ maxHeight: '88vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 text-white/30 hover:text-white/70 active:scale-90 transition-all rounded-xl hover:bg-white/5"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div className="px-6 pt-3 pb-5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-4">
            <Avatar seed={selectedSeed} size={56} className="ring-2 ring-[#FFD700] ring-offset-2 ring-offset-[#0A1629] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-impact uppercase text-[10px] text-white/40 tracking-widest mb-1.5">Mon pseudo</p>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
                className="w-full bg-white/5 border-[2px] border-white/15 rounded-xl px-3 py-2 font-impact uppercase text-[#FFD700] text-[15px] tracking-wide focus:border-[#FFD700]/60 focus:outline-none transition-colors"
                placeholder="PSEUDO"
              />
            </div>
          </div>
        </div>

        {/* Avatar picker */}
        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
          <p className="font-impact uppercase text-[10px] text-white/40 tracking-widest mb-3">Choisir un avatar</p>
          <div className="grid grid-cols-5 gap-2.5">
            {AVATAR_SEEDS.map(seed => (
              <button
                key={seed}
                onClick={() => setSelectedSeed(seed)}
                className="flex flex-col items-center gap-1 group"
              >
                <Avatar
                  seed={seed}
                  size={48}
                  selected={selectedSeed === seed}
                  className={`transition-all duration-150 ${
                    selectedSeed === seed
                      ? 'ring-[2.5px] ring-[#FFD700] ring-offset-[2px] ring-offset-[#0A1629] scale-110'
                      : 'opacity-60 group-active:opacity-100 group-active:scale-105'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-8 pt-4 border-t border-white/8 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 border-[2px] border-white/10 rounded-2xl font-impact uppercase text-[12px] text-white/50 tracking-widest active:bg-white/10 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!nickname.trim() || isSaving}
            className="flex-[2] py-3 bg-[#FFD700] border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] font-impact uppercase text-[13px] text-black tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isSaving
              ? <Loader2 size={16} className="animate-spin" />
              : <><Check size={16} strokeWidth={3} /> Enregistrer</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileSheet;
