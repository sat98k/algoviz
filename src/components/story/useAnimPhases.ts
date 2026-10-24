import { useContext, useEffect, useRef, useState } from 'react';
import { NarrationGateContext, useAnimatingReport, useNarrationFrozen, useNarrationHold } from './narrationGate';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Plays a short, ordered sequence of animation phases every time `stepKey` changes.
 *
 * `phases` is a list of [phaseName, startFraction] pairs, where startFraction (0…1) is
 * when that phase begins as a share of the step's on-screen time. The first phase is
 * shown immediately; later ones follow in order, so dependent actions never overlap
 * (e.g. water must reach a pipe before the pipe fills).
 *
 * Users who prefer reduced motion jump straight to the last phase.
 *
 * In the player, the phases wait at the first one until the owl has read the step's sentence
 * (see narrationGate.tsx): cause first, then effect, with the story told before it happens.
 * A later phase also waits while the owl is still reading, since scenes change the owl's
 * sentence with the phase: a sentence is never cut off by the next one.
 * Changing `stepMs` mid-step keeps the phase on screen and the time already played, and while
 * the player is paused the clock stands still.
 */
export function useAnimPhases<P extends string>(
  stepKey: string | number,
  phases: readonly (readonly [P, number])[],
  stepMs: number
): P {
  const lastIndex = phases.length - 1;
  const gate = useContext(NarrationGateContext);
  const narrated = !!gate && gate.hasNarrator;
  const hold = useNarrationHold();
  const frozen = useNarrationFrozen();
  const reduced = prefersReducedMotion();

  // Serialise so callers can pass an inline array without re-triggering the effect.
  const signature = phases.map(([p, t]) => `${p}:${t}`).join('|');
  // The player's step key changes on every visit, even to a step index seen before.
  const runKey = `${gate?.stepKey ?? ''}|${stepKey}|${signature}`;

  // `index` is the phase on screen; `due` is how far the clock has got (index never passes it).
  const [run, setRun] = useState({ key: runKey, index: 0, due: 0 });
  // A new step always starts from its first phase, even before the effects below run.
  const current = run.key === runKey ? run : { key: runKey, index: 0, due: 0 };
  const index = reduced ? lastIndex : current.index;

  const phasesRef = useRef(phases);
  phasesRef.current = phases;
  // Time this step's animation has played so far (paused time does not count).
  const played = useRef<{ key: string; ms: number }>({ key: '', ms: 0 });

  // The clock: from when the owl opens the step, each phase falls due at its share of stepMs.
  useEffect(() => {
    if (reduced || hold || frozen || lastIndex === 0) return;
    if (played.current.key !== runKey) played.current = { key: runKey, ms: 0 };
    const playedMs = played.current.ms;
    const since = performance.now();
    const timers = phasesRef.current.slice(1).map(([, t], i) =>
      window.setTimeout(
        () => setRun((r) => (r.key === runKey ? { ...r, due: Math.max(r.due, i + 1) } : { key: runKey, index: 0, due: i + 1 })),
        Math.max(0, t * stepMs - playedMs)
      )
    );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      if (played.current.key === runKey) played.current.ms = playedMs + (performance.now() - since);
    };
  }, [runKey, stepMs, hold, frozen, reduced, lastIndex]);

  // Move on one phase at a time, and only while the owl is not reading.
  const gateRef = useRef(gate);
  gateRef.current = gate;
  const owlBusy = narrated && gate.busy;
  useEffect(() => {
    if (reduced || frozen || current.index >= current.due) return;
    const g = gateRef.current;
    if (g && g.hasNarrator && g.isBusy()) return;
    setRun((r) => (r.key === runKey && r.index < r.due ? { ...r, index: r.index + 1 } : r));
  }, [runKey, current.index, current.due, owlBusy, frozen, reduced]);

  useAnimatingReport(!reduced && index < lastIndex);

  return phases[Math.min(index, lastIndex)][0];
}

/** On-screen time for one step at a playback speed, matching the page's autoplay interval. */
export const stepDurationMs = (speed?: number) =>
  Math.min(4000, Math.max(900, 1000 / (speed && speed > 0 ? speed : 0.25)));

/**
 * Keeps showing the previously released value until `release` is true, so a change
 * (water level, letter colour…) only appears once the action causing it has played.
 */
export function useHeldValue<T>(value: T, release: boolean): T {
  const committed = useRef(value);
  useEffect(() => {
    if (release) committed.current = value;
  });
  return release ? value : committed.current;
}

/**
 * Progress 0 → 1 over `durationMs`, restarting whenever `runKey` changes while `active`.
 * Returns 1 when inactive or when animation frames are unavailable (tests).
 * In the player it waits at 0 until the owl has read the step's sentence, and playback waits
 * for it to finish. Changing `durationMs` mid-run, or pausing the player, keeps the progress
 * already made.
 */
export function useProgress(active: boolean, durationMs: number, stepRunKey: string | number): number {
  const hold = useNarrationHold();
  const frozen = useNarrationFrozen();
  // The player's step key changes on every visit, so a revisited step plays again from 0.
  const runKey = `${useContext(NarrationGateContext)?.stepKey ?? ''}|${stepRunKey}`;
  const canAnimate = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function' && !prefersReducedMotion();
  const running = active && !hold && !frozen && canAnimate;
  const [state, setState] = useState({ key: runKey, p: 0 });
  const durationRef = useRef(durationMs);
  durationRef.current = durationMs;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!running) return;
    // Carry on from where a pause left it.
    let p = stateRef.current.key === runKey ? stateRef.current.p : 0;
    setState({ key: runKey, p });
    let raf = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      p = Math.min(1, p + Math.max(0, now - previous) / Math.max(1, durationRef.current));
      previous = now;
      setState({ key: runKey, p });
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    // Without animation frames (a background tab) the run still ends on time, so playback goes on.
    const safety = window.setTimeout(() => {
      window.cancelAnimationFrame(raf);
      p = 1;
      setState({ key: runKey, p });
    }, (1 - p) * Math.max(1, durationRef.current) + 250);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(safety);
    };
  }, [running, runKey]);

  const value = !active || !canAnimate ? 1 : hold ? 0 : state.key === runKey ? state.p : 0;
  useAnimatingReport(running && value < 1);
  return value;
}

/** Smoothly animates a list of numbers toward `target` (ease-in-out) over `durationMs`. */
export function useTweened(target: number[], durationMs: number): number[] {
  const [shown, setShown] = useState(target);
  const fromRef = useRef(target);
  const shownRef = useRef(target);
  shownRef.current = shown;
  const signature = target.join(',');

  useEffect(() => {
    if (typeof window.requestAnimationFrame !== 'function' || prefersReducedMotion()) {
      setShown(target);
      return;
    }
    fromRef.current = shownRef.current.length === target.length ? shownRef.current : target;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setShown(target.map((v, i) => fromRef.current[i] + (v - fromRef.current[i]) * e));
      if (t < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, durationMs]);

  return shown.length === target.length ? shown : target;
}
