import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** useLayoutEffect in the browser (measure before paint), useEffect on the server. */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Set by the player view: whether visualizations should fit the screen (split layout), and a
 * key that changes when the run changes (algorithm, input, view mode). Panes fill the space
 * they are given; only the drawing inside a FitToBox zooms.
 */
export const FitToScreenContext = createContext<{ enabled: boolean; resetKey: string }>({ enabled: false, resetKey: '' });

/** Re-provides the context with extra parts in the reset key (e.g. the view mode). */
export const FitResetKey: React.FC<{ part: string; children: React.ReactNode }> = ({ part, children }) => {
  const ctx = useContext(FitToScreenContext);
  return <FitToScreenContext.Provider value={{ ...ctx, resetKey: `${ctx.resetKey}|${part}` }}>{children}</FitToScreenContext.Provider>;
};

interface FitToBoxProps {
  /** Never zoom below this; the box scrolls instead (keeps text readable). */
  minScale?: number;
  /**
   * Zoom in up to this much when there is spare room. Above 1 only together with `widen`
   * (the layout then narrows to match, so the zoomed drawing still spans the width exactly).
   */
  maxScale?: number;
  /**
   * Lay the drawing out wider before zooming out, so after the zoom it still spans the full
   * width. Only for drawings whose height does not grow with their width (not aspect-ratio SVGs).
   */
  widen?: boolean;
  children: React.ReactNode;
}

const WIDE = '(min-width: 1024px)';

/**
 * Fills the rest of its flex column (the pane around it keeps its size) and zooms its content
 * so the whole drawing fits, but never below `minScale` (then the box scrolls), so text stays
 * readable. During one run the zoom only ever goes further out and the scrollbar, once shown,
 * stays, so nothing pulses or feeds back from step to step (a scrollbar appearing narrows the
 * drawing, which can make it taller, which could hide the scrollbar again, forever). It starts
 * over when the run changes or the space changes. The zoom is a transform, so animations keep
 * their layout. Wide screens only.
 */
export const FitToBox: React.FC<FitToBoxProps> = ({ minScale = 0.85, maxScale = 1, widen = false, children }) => {
  const { enabled, resetKey } = useContext(FitToScreenContext);
  const areaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(WIDE).matches);
  const [fit, setFit] = useState<{ scale: number; height: number; available: number; key: string; scroll: boolean } | null>(null);
  const zoomIn = widen ? maxScale : 1;
  const active = enabled && wide;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(WIDE);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const measure = () => {
    const area = areaRef.current;
    const content = contentRef.current;
    if (!active || !area || !content) return;
    const available = area.clientHeight;
    // The drawing's layout height (unaffected by the transform). Pieces that fly outside it
    // for a moment (a wheel on its way into the bag) do not count: they would shrink it for good.
    const natural = content.offsetHeight;
    if (!available || !natural) return;
    setFit((prev) => {
      let scale = Math.max(minScale, Math.min(zoomIn, available / natural));
      // Same run, same space: only zoom further out, never back in (no pulsing).
      const sameRun = !!prev && prev.key === resetKey && Math.abs(prev.available - available) < 2;
      if (sameRun) scale = Math.min(scale, prev!.scale);
      const scroll = (sameRun && prev!.scroll) || natural * scale > available + 1;
      // A few pixels of jitter is not a change: re-measuring must settle, never loop.
      if (sameRun && Math.abs(prev!.scale - scale) < 0.004 && Math.abs(prev!.height - natural) < 4 && prev!.scroll === scroll) return prev;
      return { scale, height: natural, available, key: resetKey, scroll };
    });
  };
  const measureRef = useRef(measure);
  measureRef.current = measure;

  // Every time the drawing renders (each step and animation phase): measure before paint, so it
  // never overflows for a frame. Returns early when nothing changed, so this cannot loop.
  useIsoLayoutEffect(() => {
    measureRef.current();
  });

  // Window and pane resizes (and late layout such as fonts or images).
  useEffect(() => {
    if (!active) {
      setFit(null);
      return;
    }
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measureRef.current());
    if (areaRef.current) observer.observe(areaRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [active]);

  const scale = active && fit ? fit.scale : 1;
  const zoomed = active && !!fit && scale !== 1;
  const overflows = active && !!fit && fit.scroll;
  return (
    <div
      ref={areaRef}
      data-fit-box={active ? 'on' : 'off'}
      data-fit-scale={zoomed ? scale.toFixed(3) : undefined}
      className={enabled ? 'lg:flex-1 lg:min-h-0' : undefined}
      style={overflows ? { overflowY: 'auto', overflowX: 'hidden' } : undefined}
    >
      <div
        className="relative w-full"
        style={zoomed ? { height: fit!.height * scale, transition: 'height 0.45s ease-out' } : undefined}
      >
        <div
          ref={contentRef}
          // flow-root keeps the children's margins inside, so they are measured and zoomed too.
          className="flow-root"
          style={
            zoomed
              ? {
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.45s ease-out',
                  ...(widen ? { position: 'relative' as const, width: `${100 / scale}%`, left: `${-(100 / scale - 100) / 2}%` } : {}),
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
};
