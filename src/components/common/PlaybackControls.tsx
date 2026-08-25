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
  const formattedCurrent = String(totalSteps > 0 ? currentStep + 1 : 0).padStart(2, '0');
  const formattedTotal = String(totalSteps).padStart(2, '0');

  return (
    <div className="flex flex-col gap-4 w-full p-5 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Scrubber & Large Typographic Index */}
      <div className="flex items-center justify-between gap-6 pb-3 border-b border-hairline">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-chalk-500">
            STEP
          </span>
          <span className="font-display font-bold text-2xl text-chalk-100 tabular-nums">
            {formattedCurrent}
          </span>
          <span className="font-mono text-xs text-chalk-500">
            / {formattedTotal}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-amber-glow tabular-nums">
          <span>PROGRESS</span>
          <span className="font-bold text-sm bg-obsidian-850 px-2 py-0.5 border border-hairline">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Scrub Line Range */}
      <div className="relative flex items-center w-full py-1">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          disabled={totalSteps <= 1}
          className="w-full h-1 bg-obsidian-700 appearance-none cursor-pointer accent-amber disabled:opacity-40"
        />
      </div>

      {/* Action Controls & Speed Multipliers */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Buttons Group */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            title="Reset to beginning (Key: R)"
            className="p-2.5 text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-800 border border-hairline transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onStepBackward}
            disabled={currentStep <= 0}
            title="Step backward (Key: ←)"
            className="p-2.5 text-chalk-300 hover:text-chalk-100 hover:bg-obsidian-800 disabled:opacity-30 disabled:hover:bg-transparent border border-hairline transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={totalSteps <= 1 || (currentStep >= totalSteps - 1 && !isPlaying)}
            title={isPlaying ? 'Pause (Key: Space)' : 'Play (Key: Space)'}
            className={`flex items-center gap-2 px-6 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all ${
              isPlaying
                ? 'bg-amber text-obsidian-950 shadow-md shadow-amber/20'
                : 'bg-chalk-100 text-obsidian-950 hover:bg-chalk-300 disabled:opacity-40'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            disabled={currentStep >= totalSteps - 1}
            title="Step forward (Key: →)"
            className="p-2.5 text-chalk-300 hover:text-chalk-100 hover:bg-obsidian-800 disabled:opacity-30 disabled:hover:bg-transparent border border-hairline transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-chalk-500 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-chalk-400" /> SPEED:
          </span>
          <div className="flex items-center border border-hairline bg-obsidian-850">
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-3 py-1 font-mono text-xs font-medium transition-all ${
                  speed === s
                    ? 'bg-amber text-obsidian-950 font-bold'
                    : 'text-chalk-400 hover:text-chalk-100'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard navigation hints */}
        <div className="hidden xl:flex items-center gap-3 font-mono text-[10px] text-chalk-500">
          <span><kbd className="px-1.5 py-0.5 bg-obsidian-850 border border-hairline text-chalk-400">Space</kbd> Play/Pause</span>
          <span><kbd className="px-1.5 py-0.5 bg-obsidian-850 border border-hairline text-chalk-400">←/→</kbd> Step</span>
          <span><kbd className="px-1.5 py-0.5 bg-obsidian-850 border border-hairline text-chalk-400">R</kbd> Reset</span>
        </div>
      </div>
    </div>
  );
};

