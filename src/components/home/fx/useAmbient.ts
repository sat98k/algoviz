import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Decorative motion that runs for `ms` and then settles, so nothing moves on its own for long
 * (WCAG 2.2.2). `wake` starts it again, for a pointer passing over it. With reduced motion it
 * never runs.
 */
export const useAmbient = (ms = 6000) => {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(!reduce);
  const timer = useRef<number | undefined>(undefined);

  const wake = useCallback(() => {
    if (reduce) return;
    setActive(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(false), ms);
  }, [reduce, ms]);

  useEffect(() => {
    if (reduce) {
      setActive(false);
      return;
    }
    wake();
    return () => window.clearTimeout(timer.current);
  }, [reduce, wake]);

  return { active, wake };
};
