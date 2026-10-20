import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * In the player, every step is told by the owl first: its sentence fades in at reading speed,
 * and only then does the step's animation play. When playing, the next step comes once the
 * animation has played and the owl has finished reading.
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
  /** True while the owl is still reading a sentence. */
  setBusy: (busy: boolean) => void;
  hasNarrator: boolean;
  register: () => () => void;
}

export const NarrationGateContext = createContext<NarrationGate | null>(null);

/** Whether the current step's animation must still wait for the owl. */
export const useNarrationHold = () => {
  const gate = useContext(NarrationGateContext);
  return !!gate && gate.hasNarrator && gate.openKey !== gate.stepKey;
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
  children: React.ReactNode;
}

/** A short breath after the owl's last word, before playback moves on. */
const SETTLE_PAUSE_MS = 900;

export const NarrationGateProvider: React.FC<NarrationGateProviderProps> = ({ stepKey, stepIndex, stepMs, onSettled, onNarrated, children }) => {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [narrators, setNarrators] = useState(0);
  const [busy, setBusyState] = useState(false);
  const [animDoneKey, setAnimDoneKey] = useState<string | null>(null);
  const hasNarrator = narrators > 0;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const onNarratedRef = useRef(onNarrated);
  onNarratedRef.current = onNarrated;

  const register = useCallback(() => {
    setNarrators((n) => n + 1);
    return () => setNarrators((n) => n - 1);
  }, []);
  const open = useCallback((key: string) => setOpenKey(key), []);
  const setBusy = useCallback((b: boolean) => setBusyState(b), []);

  useEffect(() => {
    onNarratedRef.current?.(hasNarrator);
  }, [hasNarrator]);

  // Once the owl opens the step, its animation plays for one step's time.
  useEffect(() => {
    if (!hasNarrator || openKey !== stepKey) return;
    const t = window.setTimeout(() => setAnimDoneKey(stepKey), stepMs);
    return () => window.clearTimeout(t);
  }, [hasNarrator, openKey, stepKey, stepMs]);

  // Settled: the animation has played and the owl is not reading; then a short breath.
  useEffect(() => {
    if (!hasNarrator || animDoneKey !== stepKey || busy) return;
    const t = window.setTimeout(() => onSettledRef.current?.(stepIndex), SETTLE_PAUSE_MS);
    return () => window.clearTimeout(t);
  }, [hasNarrator, animDoneKey, stepKey, busy, stepIndex]);

  const value = useMemo<NarrationGate>(
    () => ({ stepKey, openKey, open, setBusy, hasNarrator, register }),
    [stepKey, openKey, open, setBusy, hasNarrator, register]
  );
  return <NarrationGateContext.Provider value={value}>{children}</NarrationGateContext.Provider>;
};
