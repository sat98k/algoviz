import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
} from 'lucide-react';

interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSeek: (stepIndex: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onSeek,
  onSpeedChange,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) onPause();
        else onPlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onStepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onStepBackward();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onPlay, onPause, onStepForward, onStepBackward, onReset]);

  const progressPercent = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;
  const shownStep = totalSteps > 0 ? currentStep + 1 : 0;
  const iconButton =
    'p-2 text-chalk-300 hover:text-chalk-100 hover:bg-obsidian-800 disabled:opacity-30 disabled:hover:bg-transparent border border-hairline transition-colors';

  return (
    <div
      role="toolbar"
      aria-label="Playback"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full px-3 py-2 bg-obsidian-900 border border-hairline"
    >
      {/* Buttons */}
      <div className="flex items-center gap-1.5">
        <button onClick={onReset} title="Reset to beginning (Key: R)" aria-label="Reset" className={iconButton}>
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={onStepBackward} disabled={currentStep <= 0} title="Step backward (Key: ←)" aria-label="Previous step" className={iconButton}>
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={totalSteps <= 1 || (currentStep >= totalSteps - 1 && !isPlaying)}
          title={isPlaying ? 'Pause (Key: Space)' : 'Play (Key: Space)'}
          className={`flex items-center gap-1.5 px-4 py-2 font-sans text-sm font-semibold transition-colors ${
            isPlaying ? 'bg-amber text-obsidian-950' : 'bg-chalk-100 text-obsidian-950 hover:bg-chalk-300 disabled:opacity-40'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <button onClick={onStepForward} disabled={currentStep >= totalSteps - 1} title="Step forward (Key: →)" aria-label="Next step" className={iconButton}>
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Step position and scrubber */}
      <div className="flex items-center gap-3 flex-1 min-w-[12rem]">
        <span className="font-sans text-sm text-chalk-400 whitespace-nowrap tabular-nums">
          Step <strong className="text-chalk-100">{shownStep}</strong> / {totalSteps}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          disabled={totalSteps <= 1}
          aria-label="Step position"
          aria-valuetext={`Step ${shownStep} of ${totalSteps}`}
          className="flex-1 h-1 bg-obsidian-700 appearance-none cursor-pointer accent-amber disabled:opacity-40"
        />
        <span className="font-mono text-xs text-chalk-500 tabular-nums w-10 text-right">{Math.round(progressPercent)}%</span>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-2">
        <Gauge className="w-3.5 h-3.5 text-amber shrink-0" aria-hidden="true" />
        <span className="font-sans text-xs text-chalk-400">Speed</span>
        <input
          type="range"
          min="0.25"
          max="4.0"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          aria-label="Playback speed slider"
          className="w-20 sm:w-24 h-1.5 bg-obsidian-800 rounded-lg appearance-none cursor-pointer accent-amber focus:outline-none"
        />
        <span className="font-mono text-xs font-semibold text-amber-glow min-w-[3rem] text-center tabular-nums">
          {speed.toFixed(speed % 1 === 0 ? 1 : 2)}x
        </span>
        <div className="hidden md:flex items-center gap-0.5">
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-1.5 py-0.5 font-mono text-xs transition-colors ${speed === s ? 'text-amber font-bold' : 'text-chalk-500 hover:text-chalk-200'}`}
              title={`Set speed to ${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <p className="hidden 2xl:block font-sans text-xs text-chalk-500">
        <kbd className="px-1 border border-hairline">Space</kbd> play · <kbd className="px-1 border border-hairline">← →</kbd> step · <kbd className="px-1 border border-hairline">R</kbd> reset
      </p>
    </div>
  );
};

