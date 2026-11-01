import { RefObject, useContext, useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from './gsapSetup';
import { NarrationGateContext, useAnimatingReport, useNarrationFrozen, useNarrationHold } from '../narrationGate';

type Q = (selector: string) => Element[];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One GSAP timeline per step: the scene's choreography for the step it is showing.
 *
 * React always renders the step's final picture. `build` adds tweens that start from where
 * things were (`from` / `fromTo`) and end there, on elements React does not position itself
 * (an inner `<g>` inside the positioned one), so the drawing is correct with no animation at all
 * (tests, reduced motion, a hidden tab).
 *
 * The timeline keeps the same rules as useAnimPhases: in the player it waits until the owl has
 * read the step's sentence, stands still while paused, and reports itself so playback does not
 * move on mid-animation. It is sped up (never slowed down) to fit the step's time at the
 * current playback speed. A new step reverts the old timeline and builds the next one.
 */
export function useStepTimeline(
  scope: RefObject<Element>,
  stepKey: string | number,
  stepMs: number,
  build: (tl: gsap.core.Timeline, q: Q) => void
) {
  const gate = useContext(NarrationGateContext);
  const hold = useNarrationHold();
  const frozen = useNarrationFrozen();
  const runKey = `${gate?.stepKey ?? ''}|${stepKey}`;
  const reduced = prefersReducedMotion();

  const buildRef = useRef(build);
  buildRef.current = build;
  const tlRef = useRef<{ key: string; tl: gsap.core.Timeline } | null>(null);
  const [doneKey, setDoneKey] = useState<string | null>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ paused: true, defaults: { duration: 0.6, ease: 'story.out' } });
      buildRef.current(tl, gsap.utils.selector(scope));
      tl.eventCallback('onComplete', () => setDoneKey(runKey));
      tlRef.current = { key: runKey, tl };
      if (reduced || tl.duration() === 0) {
        tl.progress(1);
        setDoneKey(runKey);
      }
    },
    { scope, dependencies: [runKey], revertOnUpdate: true }
  );

  // Fit the choreography into the step's time at the current speed.
  useEffect(() => {
    const cur = tlRef.current;
    if (!cur || cur.key !== runKey) return;
    const natural = cur.tl.duration() * 1000;
    cur.tl.timeScale(Math.max(1, natural / Math.max(1, stepMs * 0.85)));
  }, [runKey, stepMs]);

  // Play once the owl has opened the step; stand still while paused.
  useEffect(() => {
    const cur = tlRef.current;
    if (!cur || cur.key !== runKey || cur.tl.progress() === 1) return;
    if (hold || frozen) {
      cur.tl.pause();
      return;
    }
    cur.tl.play();
    // Without animation frames (a background tab) the step still ends on time.
    const left = ((1 - cur.tl.progress()) * cur.tl.duration() * 1000) / cur.tl.timeScale();
    const safety = window.setTimeout(() => {
      if (tlRef.current === cur && cur.tl.progress() < 1) cur.tl.progress(1);
    }, left + 300);
    return () => window.clearTimeout(safety);
  }, [runKey, hold, frozen]);

  useAnimatingReport(!reduced && doneKey !== runKey);
}
