import React from 'react';

interface Props {
  /** Changing this (e.g. the step) clears the error and tries to draw again. */
  resetKey: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  key: string;
}

/**
 * Keeps a crash inside one visualization from blanking the whole page: the rest of the
 * player stays usable, and stepping (a new resetKey) draws again.
 */
export class VisualizerErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Visualizer crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="w-full p-6 border border-amber-300 bg-amber-50 text-stone-800 font-sans text-sm rounded-xl flex flex-col gap-2">
        <strong className="text-base">This drawing hit a problem.</strong>
        <span>Step forward or back to draw it again. The rest of the player still works.</span>
        <code className="text-xs text-stone-500 break-all">{this.state.error.message}</code>
      </div>
    );
  }
}
