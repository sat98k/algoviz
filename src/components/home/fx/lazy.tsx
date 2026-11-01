import React, { Suspense } from 'react';

/**
 * Lazy entry points for the WebGL extras: three.js and the shaders load in their own chunks,
 * after the page, and only in a browser. Until then (and on the server, or if one of them
 * fails) nothing is drawn, so the flat colour underneath shows.
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

const Safe: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  inBrowser ? (
    <Quiet>
      <Suspense fallback={null}>{children}</Suspense>
    </Quiet>
  ) : null;

export const CheeseWheel3D: React.FC<React.ComponentProps<typeof LazyCheese>> = (props) => (
  <Safe>
    <LazyCheese {...props} />
  </Safe>
);

export const FloatingStory3D: React.FC<React.ComponentProps<typeof LazyFloating>> = (props) => (
  <Safe>
    <LazyFloating {...props} />
  </Safe>
);

export const GradientField: React.FC<React.ComponentProps<typeof LazyGradient>> = (props) => (
  <Safe>
    <LazyGradient {...props} />
  </Safe>
);

export const LiquidOwl: React.FC<React.ComponentProps<typeof LazyOwl>> = (props) => (
  <Safe>
    <LazyOwl {...props} />
  </Safe>
);
