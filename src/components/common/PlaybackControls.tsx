import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
} from 'lucide-react';

interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number; // speed multiplier, e.g. 1x, 2x, 0.5x
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
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when focused on an input or textarea
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

  return (
    <div className="flex flex-col gap-3 w-full p-4 bg-slate-900/95 border border-slate-800 rounded-xl shadow-lg backdrop-blur">
      {/* Top Scrub Bar */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-xs font-mono text-slate-400 min-w-[50px]">
          {totalSteps > 0 ? `${currentStep + 1} / ${totalSteps}` : '0 / 0'}
        </span>
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStep}
            onChange={(e) => onSeek(parseInt(e.target.value, 10))}
            disabled={totalSteps <= 1}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-50"
          />
        </div>
        <span className="text-xs font-mono text-sky-400 min-w-[42px] text-right">
          {Math.round(progressPercent)}%
        </span>
      </div>

      {/* Action Buttons & Speed Slider */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Button Group */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Reset */}
          <button
            onClick={onReset}
            title="Reset to beginning (Key: R)"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Step Back */}
          <button
            onClick={onStepBackward}
            disabled={currentStep <= 0}
            title="Step backward (Key: ←)"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={totalSteps <= 1 || (currentStep >= totalSteps - 1 && !isPlaying)}
            title={isPlaying ? 'Pause (Key: Space)' : 'Play (Key: Space)'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                : 'bg-sky-500 hover:bg-sky-400 text-white font-semibold disabled:opacity-40 disabled:hover:bg-sky-500'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            disabled={currentStep >= totalSteps - 1}
            title="Step forward (Key: →)"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <FastForward className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-mono">Speed:</span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 rounded font-mono font-medium transition-all ${
                speed === s
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
