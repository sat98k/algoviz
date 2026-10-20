import { useSyncExternalStore } from 'react';

/**
 * The owl's voice, shared by the explanation page and the player: reading pace, the speed
 * setting (Slower / Faster), the chirp sound and its on/off setting. Settings are remembered
 * per browser and stay in sync between every owl on the page.
 */

/**
 * Reading pace: about 250 words a minute, longer words a little longer, a breath at commas
 * and a pause at the end of every sentence. A card stays alone long enough to read it.
 */
export const READING = {
  startMs: 700,
  wordMs: 230,
  perExtraLetterMs: 14,
  commaMs: 220,
  sentenceMs: 700,
  segmentPauseMs: 800,
  cardWordMs: 210,
  cardMinMs: 2400,
};

export const endsSentence = (text: string) => /[.!?]["”')]?\s*$/.test(text);

/** How long a word stays the newest one before the next appears (at 1×). */
export const wordDuration = (text: string) => {
  const word = text.trim();
  let ms = READING.wordMs + Math.max(0, word.length - 6) * READING.perExtraLetterMs;
  if (endsSentence(text)) ms += READING.sentenceMs;
  else if (/[,;:—–]["”')]?\s*$/.test(text)) ms += READING.commaMs;
  return ms;
};

/** How long a card (a stage, the insight) stays alone before the next one appears (at 1×). */
export const cardDuration = (words: number) => Math.max(READING.cardMinMs, words * READING.cardWordMs);

/** Splits plain text into word units, each keeping its trailing space. */
export const plainWords = (text: string) => text.match(/\S+\s*/g) ?? [];

/** Reading speed: 1× is reading pace; Slower / Faster move it in 0.25 steps. */
export const OWL_SPEED = { min: 0.25, max: 3, step: 0.25, initial: 1 };
export const nextSpeed = (speed: number, dir: 1 | -1) =>
  Math.min(OWL_SPEED.max, Math.max(OWL_SPEED.min, Math.round((speed + dir * OWL_SPEED.step) * 100) / 100));
export const formatSpeed = (speed: number) => `${speed % 1 === 0 ? speed.toFixed(0) : String(speed)}×`;
/** Fade length that follows the speed (between 0.4s and 2.2s). */
export const fadeFor = (speed: number) => `${Math.min(2.2, Math.max(0.4, 1.1 / speed)).toFixed(2)}s`;

// ── Settings store ──────────────────────────────────────────────────────────
const SPEED_KEY = 'algoviz_owl_speed';
const SOUND_KEY = 'algoviz_owl_sound';

export interface OwlPrefs {
  speed: number;
  /** Chirp sounds (on unless the reader switched them off). */
  sound: boolean;
}
const DEFAULT_PREFS: OwlPrefs = { speed: OWL_SPEED.initial, sound: true };

const load = (): OwlPrefs => {
  try {
    const saved = Number(localStorage.getItem(SPEED_KEY));
    return {
      speed: saved >= OWL_SPEED.min && saved <= OWL_SPEED.max ? saved : OWL_SPEED.initial,
      sound: localStorage.getItem(SOUND_KEY) !== 'off',
    };
  } catch {
    return DEFAULT_PREFS;
  }
};

let prefs: OwlPrefs = typeof window === 'undefined' ? DEFAULT_PREFS : load();
const listeners = new Set<() => void>();
const save = (next: OwlPrefs) => {
  prefs = next;
  try {
    localStorage.setItem(SPEED_KEY, String(next.speed));
    localStorage.setItem(SOUND_KEY, next.sound ? 'on' : 'off');
  } catch {
    /* not remembered, still works for this visit */
  }
  listeners.forEach((l) => l());
};

export const setOwlSpeed = (speed: number) => save({ ...prefs, speed });
export const setOwlSound = (sound: boolean) => save({ ...prefs, sound });
export const getOwlPrefs = () => prefs;

/** The owl's settings, re-rendering when any owl on the page changes them. */
export const useOwlPrefs = (): OwlPrefs =>
  useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => prefs,
    () => DEFAULT_PREFS
  );

// ── Chirp ───────────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

/** A tiny two-note bird chirp, synthesized (no audio files). `force` ignores the sound setting. */
export const playChirp = (force = false) => {
  if (!force && !prefs.sound) return;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx ?? new AC();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    const t0 = audioCtx.currentTime;
    [0, 0.09].forEach((delay, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 + i * 350, t0 + delay);
      osc.frequency.exponentialRampToValueAtTime(2500 + i * 250, t0 + delay + 0.07);
      gain.gain.setValueAtTime(0.0001, t0 + delay);
      gain.gain.exponentialRampToValueAtTime(0.07, t0 + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 0.085);
      osc.connect(gain).connect(audioCtx!.destination);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + 0.1);
    });
  } catch {
    /* sound is a bonus; never break the page */
  }
};

export const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
