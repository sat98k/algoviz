import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * In the player, every step is told by the owl first: its sentence fades in at reading speed,
 * and only then does the step's animation play. A scene whose sentence changes with the
 * animation (a question, then its answer) moves to its next phase only once the owl has finished
 * the current sentence. When playing, the next step comes once the animation has played and the
 * owl has finished reading.
 *
 * Play / Pause is the one control for both: while paused, the owl stops mid-sentence and the
 * animation's clock stops with it; Play carries both on. A step reached while paused (Step →, ←,
 * Reset) is shown at once: the whole sentence, and its animation plays.
 *
 * The owl's bubble (a "narrator") registers itself; with no narrator on screen (Technical View),
 * nothing waits and playback uses its normal timer.
 */
export interface NarrationGate {
  /** Identifies the step on screen (changes on every new step, view or input). */
  stepKey: string;
  /** The step whose animation may play (the owl has finished its first sentence for it). */
  openKey: string | null;
  open: (key: string) => void;
  /** True while the owl is still reading a sentence (re-renders when it changes). */
  busy: boolean;
  /**
   * The same, read right now. The owl marks itself busy as soon as it starts a sentence, before
   * React re-renders, so a scene never moves on in the same instant its new sentence begins.
   */
  isBusy: () => boolean;
  setBusy: (busy: boolean) => void;
  hasNarrator: boolean;
  register: () => () => void;
  /** A scene animation (a phase sequence, a progress run) is still playing, or has finished. */
  setAnimating: (id: number, animating: boolean) => void;
  /** The reader pressed the owl's ⏩ Skip. */
  skip: () => void;
  /** Paused mid-step: the owl and the animation's clock stand still. */
  frozen: boolean;
  /** This step was reached while paused: show the whole sentence at once. */
  instant: boolean;
}

export const NarrationGateContext = createContext<NarrationGate | null>(null);

/** Whether the current step's animation must still wait for the owl. */
export const useNarrationHold = () => {
  const gate = useContext(NarrationGateContext);
  return !!gate && gate.hasNarrator && gate.openKey !== gate.stepKey;
};

let nextAnimatorId = 0;

/**
 * Tells the player that an animation of this step is still playing, so playback does not move on
 * mid-animation (and does not sit idle once it is over). No effect outside the player.
 */
export const useAnimatingReport = (animating: boolean) => {
  const gate = useContext(NarrationGateContext);
  const id = useRef(0);
  if (!id.current) id.current = ++nextAnimatorId;
  const set = gate?.setAnimating;
  useEffect(() => {
    set?.(id.current, animating);
  }, [set, animating]);
  useEffect(() => () => set?.(id.current, false), [set]);
};

interface NarrationGateProviderProps {
  stepKey: string;
  stepIndex: number;
  /** How long a step's animation takes once it starts. */
  stepMs: number;
  /** The step's animation has played and the owl has finished reading. */
  onSettled?: (stepIndex: number) => void;
  /** Whether a narrator is on screen (Animation Mode) or not (Technical View). */
  onNarrated?: (narrated: boolean) => void;
  /** The reader pressed the owl's ⏩ Skip (the player then carries on playing). */
  onSkip?: () => void;
  /** Playback is paused (the player's Play / Pause). */
  paused?: boolean;
  children: React.ReactNode;
}

/** A short breath after the owl's last word, before playback moves on. */
export const SETTLE_PAUSE_MS = 900;
/** Time for the last phase's transitions (about 1s) to finish, once no animation reports running. */
export const ANIM_TAIL_MS = 1200;

export const NarrationGateProvider: React.FC<NarrationGateProviderProps> = ({ stepKey, stepIndex, stepMs, onSettled, onNarrated, onSkip, paused = false, children }) => {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [narrators, setNarrators] = useState(0);
  const [busy, setBusyState] = useState(false);
  const busyRef = useRef(false);
  const [animating, setAnimatingState] = useState(false);
  const animators = useRef(new Set<number>());
  const [animDoneKey, setAnimDoneKey] = useState<string | null>(null);
  const hasNarrator = narrators > 0;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const onNarratedRef = useRef(onNarrated);
  onNarratedRef.current = onNarrated;
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;
  const skip = useCallback(() => onSkipRef.current?.(), []);
  // Read when the tail starts, so changing playback speed mid-step never restarts the wait.
  const tailRef = useRef(ANIM_TAIL_MS);
  tailRef.current = Math.min(ANIM_TAIL_MS, stepMs);

  // A step reached while paused is shown at once (the first step on screen is not: it waits for Play).
  const seenKey = useRef(stepKey);
  const instantKey = useRef<string | null>(null);
  if (seenKey.current !== stepKey) {
    seenKey.current = stepKey;
    instantKey.current = paused ? stepKey : null;
  }
  const instant = instantKey.current === stepKey;
  const frozen = paused && !instant;

  const register = useCallback(() => {
    setNarrators((n) => n + 1);
    return () => setNarrators((n) => n - 1);
  }, []);
  const open = useCallback((key: string) => setOpenKey(key), []);
  const setBusy = useCallback((b: boolean) => {
    busyRef.current = b;
    setBusyState(b);
  }, []);
  const isBusy = useCallback(() => busyRef.current, []);
  const setAnimating = useCallback((id: number, on: boolean) => {
    if (on) animators.current.add(id);
    else animators.current.delete(id);
    setAnimatingState(animators.current.size > 0);
  }, []);

  useEffect(() => {
    onNarratedRef.current?.(hasNarrator);
  }, [hasNarrator]);

  // Once the owl opens the step, its animation plays; it is done a short tail after the last
  // running animation has finished (or after opening, for a scene with nothing to wait for).
  useEffect(() => {
    if (!hasNarrator || openKey !== stepKey || animating || frozen) return;
    const t = window.setTimeout(() => setAnimDoneKey(stepKey), tailRef.current);
    return () => window.clearTimeout(t);
  }, [hasNarrator, openKey, stepKey, animating, frozen]);

  // Settled: the animation has played and the owl is not reading; then a short breath.
  useEffect(() => {
    if (!hasNarrator || animDoneKey !== stepKey || busy || frozen) return;
    const t = window.setTimeout(() => onSettledRef.current?.(stepIndex), SETTLE_PAUSE_MS);
    return () => window.clearTimeout(t);
  }, [hasNarrator, animDoneKey, stepKey, busy, frozen, stepIndex]);

  const value = useMemo<NarrationGate>(
    () => ({ stepKey, openKey, open, busy, isBusy, setBusy, hasNarrator, register, setAnimating, skip, frozen, instant }),
    [stepKey, openKey, open, busy, isBusy, setBusy, hasNarrator, register, setAnimating, skip, frozen, instant]
  );
  return <NarrationGateContext.Provider value={value}>{children}</NarrationGateContext.Provider>;
};

/** Whether playback is paused mid-step in the player (the owl and the animation stand still). */
export const useNarrationFrozen = () => {
  const gate = useContext(NarrationGateContext);
  return !!gate && gate.hasNarrator && gate.frozen;
};
