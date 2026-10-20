import { useEffect, useRef, useState } from 'react';
import { useNarrationHold } from './narrationGate';

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
 */
export function useAnimPhases<P extends string>(
  stepKey: string | number,
  phases: readonly (readonly [P, number])[],
  stepMs: number
): P {
  const first = phases[0][0];
  const last = phases[phases.length - 1][0];
  const [current, setCurrent] = useState<{ key: string | number; phase: P }>({ key: stepKey, phase: first });

  // Serialise so callers can pass an inline array without re-triggering the effect.
  const signature = phases.map(([p, t]) => `${p}:${t}`).join('|');
  const hold = useNarrationHold();

  useEffect(() => {
    if (prefersReducedMotion()) {
      setCurrent({ key: stepKey, phase: last });
      return;
    }
    setCurrent({ key: stepKey, phase: first });
    if (hold) return;
    const timers = phases
      .slice(1)
      .map(([p, t]) => window.setTimeout(() => setCurrent({ key: stepKey, phase: p }), t * stepMs));
    return () => timers.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, signature, stepMs, hold]);

  // A new step always starts from its first phase, even before the effect above runs.
  return current.key === stepKey ? current.phase : prefersReducedMotion() ? last : first;
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
 */
export function useProgress(active: boolean, durationMs: number, runKey: string | number): number {
  const [p, setP] = useState(active ? 0 : 1);
  useEffect(() => {
    if (!active || typeof window.requestAnimationFrame !== 'function' || prefersReducedMotion()) {
      setP(1);
      return;
    }
    setP(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setP(t);
      if (t < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [active, durationMs, runKey]);
  return active ? p : 1;
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
