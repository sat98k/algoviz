import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Turns the direct children of `root` that carry `data-glass` into liquid glass (liquidglass),
 * refracting whatever is drawn behind them. It starts after `delayMs`, once the lazy WebGL
 * background under it has drawn. Does nothing with reduced motion or without WebGL.
 */
export const useLiquidGlass = (root: React.RefObject<HTMLElement | null>, delayMs = 2500) => {
  const reduce = useReducedMotion();
  const instance = useRef<{ destroy: () => void } | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || reduce) return;
    let cancelled = false;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const idle = (cb: () => void) => (w.requestIdleCallback ? w.requestIdleCallback(cb, { timeout: 1500 }) : cb());
    const start = window.setTimeout(() => idle(() => {
      if (cancelled) return;
      const glass = Array.from(el.children).filter(
        (c): c is HTMLElement => c instanceof HTMLElement && c.dataset.glass !== undefined
      );
      if (!glass.length) return;
      glass.forEach((g) => {
        g.dataset.config = JSON.stringify({ blurAmount: 0.18 });
      });
      import('@ybouane/liquidglass')
        .then(({ LiquidGlass }) => LiquidGlass.init({ root: el, glassElements: glass }))
        .then((inst) => {
          if (cancelled) inst.destroy();
          else instance.current = inst;
        })
        .catch(() => {
          // No WebGL or the capture failed: the plain styling stays.
        });
    }), delayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
      instance.current?.destroy();
      instance.current = null;
    };
  }, [root, reduce, delayMs]);
};
