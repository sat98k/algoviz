import React, { Suspense, useEffect, useState } from 'react';

/**
 * Lazy entry points for the WebGL extras: three.js and the shaders load in their own chunks,
 * after the page, and only in a browser. Until then (and on the server, or if one of them
 * fails) nothing is drawn, so the flat colour underneath shows.
 *
 * Each effect also waits for the page's first paint and an idle moment, then a few hundred ms
 * more by rank, so the text and layout land first and the GPU-heavy layers come in one by one
 * instead of all compiling shaders in the same frames.
 */

/** Swallows a failed effect so it can never take the page down with it. */
class Quiet extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const Story3D = () => import('./Story3D');
const Effects = () => import('./Effects');

const LazyCheese = React.lazy(() => Story3D().then((m) => ({ default: m.CheeseWheel3D })));
const LazyFloating = React.lazy(() => Story3D().then((m) => ({ default: m.FloatingStory3D })));
const LazyGradient = React.lazy(() => Effects().then((m) => ({ default: m.GradientField })));
const LazyOwl = React.lazy(() => Effects().then((m) => ({ default: m.LiquidOwl })));

const inBrowser = typeof window !== 'undefined';

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };

/** True once the page has painted, the browser is idle and `delay` ms have passed. */
const useAfterPaint = (delay: number) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as IdleWindow;
    let idle = 0;
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => {
        if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setReady(true), { timeout: 1200 });
        else setReady(true);
      }, delay);
    });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      if (idle && w.cancelIdleCallback) w.cancelIdleCallback(idle);
    };
  }, [delay]);
  return ready;
};

const Gate: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) =>
  useAfterPaint(delay) ? <>{children}</> : null;

const Safe: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) =>
  inBrowser ? (
    <Quiet>
      <Gate delay={delay}>
        <Suspense fallback={null}>{children}</Suspense>
      </Gate>
    </Quiet>
  ) : null;

export const CheeseWheel3D: React.FC<React.ComponentProps<typeof LazyCheese>> = (props) => (
  <Safe delay={300}>
    <LazyCheese {...props} />
  </Safe>
);

export const FloatingStory3D: React.FC<React.ComponentProps<typeof LazyFloating>> = (props) => (
  <Safe delay={500}>
    <LazyFloating {...props} />
  </Safe>
);

export const GradientField: React.FC<React.ComponentProps<typeof LazyGradient>> = (props) => (
  <Safe>
    <LazyGradient {...props} />
  </Safe>
);

export const LiquidOwl: React.FC<React.ComponentProps<typeof LazyOwl>> = (props) => (
  <Safe delay={700}>
    <LazyOwl {...props} />
  </Safe>
);
