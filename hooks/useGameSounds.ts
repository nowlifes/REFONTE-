import { useCallback, useRef } from 'react';

type OscType = OscillatorType;
interface Note { freq: number; dur: number; delay: number; type?: OscType; gain?: number; }

function playNotes(ctx: AudioContext, notes: Note[]) {
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);
  notes.forEach(({ freq, dur, delay, type = 'square', gain = 1 }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(master);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  });
}

export function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (!ctxRef.current) {
      try { ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); }
      catch { return null; }
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // Cell validated — short punchy ascending blip
  const playValidate = useCallback(() => {
    const c = getCtx(); if (!c) return;
    playNotes(c, [
      { freq: 523, dur: 0.07, delay: 0,    type: 'square', gain: 0.5 },
      { freq: 784, dur: 0.12, delay: 0.08, type: 'square', gain: 0.4 },
    ]);
  }, [getCtx]);

  // Line complete — triumphant 4-note C4→E4→G4→C5
  const playLineComplete = useCallback(() => {
    const c = getCtx(); if (!c) return;
    playNotes(c, [
      { freq: 262, dur: 0.09, delay: 0,    type: 'square', gain: 0.5 },
      { freq: 330, dur: 0.09, delay: 0.10, type: 'square', gain: 0.5 },
      { freq: 392, dur: 0.09, delay: 0.20, type: 'square', gain: 0.5 },
      { freq: 523, dur: 0.22, delay: 0.30, type: 'square', gain: 0.65 },
    ]);
  }, [getCtx]);

  // BINGO — full ascending fanfare
  const playBingo = useCallback(() => {
    const c = getCtx(); if (!c) return;
    playNotes(c, [
      { freq: 262,  dur: 0.08, delay: 0,    type: 'square', gain: 0.6 },
      { freq: 330,  dur: 0.08, delay: 0.09, type: 'square', gain: 0.6 },
      { freq: 392,  dur: 0.08, delay: 0.18, type: 'square', gain: 0.6 },
      { freq: 523,  dur: 0.08, delay: 0.27, type: 'square', gain: 0.6 },
      { freq: 659,  dur: 0.08, delay: 0.36, type: 'square', gain: 0.6 },
      { freq: 784,  dur: 0.25, delay: 0.45, type: 'square', gain: 0.7 },
      { freq: 1047, dur: 0.45, delay: 0.58, type: 'square', gain: 0.55 },
    ]);
  }, [getCtx]);

  // Taunt received — descending sawtooth alarm
  const playTauntReceived = useCallback(() => {
    const c = getCtx(); if (!c) return;
    playNotes(c, [
      { freq: 880, dur: 0.10, delay: 0,    type: 'sawtooth', gain: 0.45 },
      { freq: 698, dur: 0.10, delay: 0.12, type: 'sawtooth', gain: 0.45 },
      { freq: 587, dur: 0.10, delay: 0.24, type: 'sawtooth', gain: 0.45 },
      { freq: 440, dur: 0.18, delay: 0.36, type: 'sawtooth', gain: 0.35 },
    ]);
  }, [getCtx]);

  // Row unlocked — whoosh + rising chime
  const playRowUnlock = useCallback(() => {
    const c = getCtx(); if (!c) return;
    playNotes(c, [
      { freq: 220,  dur: 0.18, delay: 0,    type: 'triangle', gain: 0.3 },
      { freq: 880,  dur: 0.12, delay: 0.16, type: 'sine',     gain: 0.45 },
      { freq: 1100, dur: 0.22, delay: 0.27, type: 'sine',     gain: 0.35 },
    ]);
  }, [getCtx]);

  // Mystery cell unlock — magic sparkle ascending
  const playMysteryUnlock = useCallback(() => {
    const c = getCtx(); if (!c) return;
    playNotes(c, [
      { freq: 784,  dur: 0.07, delay: 0,    type: 'sine', gain: 0.4 },
      { freq: 988,  dur: 0.07, delay: 0.08, type: 'sine', gain: 0.4 },
      { freq: 1175, dur: 0.07, delay: 0.16, type: 'sine', gain: 0.4 },
      { freq: 1568, dur: 0.22, delay: 0.24, type: 'sine', gain: 0.5 },
    ]);
  }, [getCtx]);

  // Witness request incoming — two-tone ping
  const playWitnessRequest = useCallback(() => {
    const c = getCtx(); if (!c) return;
    playNotes(c, [
      { freq: 660, dur: 0.10, delay: 0,    type: 'sine', gain: 0.5 },
      { freq: 880, dur: 0.18, delay: 0.12, type: 'sine', gain: 0.5 },
    ]);
  }, [getCtx]);

  return {
    playValidate,
    playLineComplete,
    playBingo,
    playTauntReceived,
    playRowUnlock,
    playMysteryUnlock,
    playWitnessRequest,
  };
}
