import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import {
  computeLcsEngine,
  validateLcsInput,
  LcsEngineResult,
  UnifiedLcsStep,
} from '../../algorithms/lcsEngine';
import { LcsMatrixView } from './LcsMatrixView';
import { LcsAlignmentView } from './LcsAlignmentView';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  Grid,
  AlignHorizontalDistributeCenter,
  SplitSquareVertical,
  Shuffle,
  AlertCircle,
} from 'lucide-react';

export interface LCSVisualizerProps {
  initialX?: string;
  initialY?: string;
  step?: AlgorithmStep;
  inputs?: Record<string, any>;
  onApplyInputs?: (newInputs: Record<string, any>) => void;
  defaultViewMode?: 'matrix' | 'alignment' | 'split';
}

export const LCSVisualizer: React.FC<LCSVisualizerProps> = ({
  initialX,
  initialY,
  step,
  inputs,
  onApplyInputs,
  defaultViewMode = 'alignment',
}) => {
  // Input fields state
  const rawInitialX = initialX ?? inputs?.str1 ?? 'ABCBDAB';
  const rawInitialY = initialY ?? inputs?.str2 ?? 'BDCAB';

  const [inputX, setInputX] = useState<string>(rawInitialX);
  const [inputY, setInputY] = useState<string>(rawInitialY);
  const [activeX, setActiveX] = useState<string>(rawInitialX);
  const [activeY, setActiveY] = useState<string>(rawInitialY);
  const [inputError, setInputError] = useState<string | null>(null);

  // View mode: 'matrix' | 'alignment' | 'split'
  const [viewMode, setViewMode] = useState<'matrix' | 'alignment' | 'split'>(defaultViewMode);

  // Alternative paths state
  const [selectedPathIndex, setSelectedPathIndex] = useState<number>(0);

  // Two-way hover state
  const [hoveredChar, setHoveredChar] = useState<{ string: 'X' | 'Y'; index: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  // Compute engine result containing ALL unified execution steps
  const engine: LcsEngineResult = useMemo(() => {
    return computeLcsEngine(activeX, activeY);
  }, [activeX, activeY]);

  const totalSteps = engine.steps.length;

  // Playback state
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof step?.stepIndex === 'number' && step.stepIndex >= 0 && step.stepIndex < totalSteps) {
      return step.stepIndex;
    }
    return 0;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5x to 3x

  // Sync with external step if passed from AlgorithmPage
  useEffect(() => {
    if (typeof step?.stepIndex === 'number') {
      setCurrentStep(Math.min(totalSteps - 1, Math.max(0, step.stepIndex)));
    }
  }, [step?.stepIndex, totalSteps]);

  // Handle inputs application
  const applyNewStrings = useCallback((newX: string, newY: string) => {
    const validation = validateLcsInput(newX, newY);
    if (!validation.isValid) {
      setInputError(validation.error);
      return;
    }
    setInputError(null);
    setActiveX(validation.X);
    setActiveY(validation.Y);
    setCurrentStep(0);
    setIsPlaying(false);
    setSelectedPathIndex(0);
    onApplyInputs?.({ str1: validation.X, str2: validation.Y });
  }, [onApplyInputs]);

  // Reset step when strings change externally
  useEffect(() => {
    if (inputs?.str1 && inputs?.str2) {
      if (inputs.str1 !== activeX || inputs.str2 !== activeY) {
        setInputX(inputs.str1);
        setInputY(inputs.str2);
        applyNewStrings(inputs.str1, inputs.str2);
      }
    }
  }, [inputs?.str1, inputs?.str2, activeX, activeY, applyNewStrings]);

  // Playback timer & cleanup on unmount
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(150, Math.round(800 / speed));
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < totalSteps - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, speed, totalSteps]);

  // Pause playback on unmount
  useEffect(() => {
    return () => {
      setIsPlaying(false);
    };
  }, []);

  // Controls actions
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  const handleStepBackward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  const handleTogglePlay = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentStep, totalSteps]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepBackward();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'matrix' ? 'alignment' : 'matrix'));
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleStepForward, handleStepBackward, handleReset]);

  // Active step object
  const activeStep: UnifiedLcsStep = engine.steps[currentStep] ?? engine.steps[0];

  return (
    <div className="flex flex-col w-full gap-4 font-sans text-chalk-200">
      {/* Top Bar: View Mode Switcher + Inputs + Tie Paths */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-obsidian-950 border border-hairline">
        {/* Segmented Control View Toggle */}
        <div
          role="radiogroup"
          aria-label="Visualization View Switcher"
          className="flex items-center p-1 bg-obsidian-900 border border-hairline rounded-sm"
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'matrix'}
            aria-label="Matrix DP View (Key: M)"
            title="Matrix DP View (Key: M)"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-electric-400 ${
              viewMode === 'matrix'
                ? 'bg-electric-500/20 text-electric-400 border border-electric-400/50 shadow-sm'
                : 'text-chalk-400 hover:text-chalk-200 border border-transparent'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Matrix</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'alignment'}
            aria-label="Alignment View (Key: M)"
            title="Alignment View (Key: M)"
            onClick={() => setViewMode('alignment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-teal-400 ${
              viewMode === 'alignment'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-400/50 shadow-sm'
                : 'text-chalk-400 hover:text-chalk-200 border border-transparent'
            }`}
          >
            <AlignHorizontalDistributeCenter className="w-3.5 h-3.5" />
            <span>Alignment</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'split'}
            aria-label="Split View (Side-by-side)"
            title="Side-by-side View"
            onClick={() => setViewMode('split')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-amber ${
              viewMode === 'split'
                ? 'bg-amber/20 text-amber-glow border border-amber/50 shadow-sm'
                : 'text-chalk-400 hover:text-chalk-200 border border-transparent'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>
        </div>

        {/* Alternative Paths Toggle (Nice to Have) */}
        {engine.alternativePaths.length > 1 && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <Shuffle className="w-3.5 h-3.5 text-amber" />
            <span className="text-chalk-400 hidden sm:inline">Tie Paths:</span>
            <select
              aria-label="Select alternative optimal traceback path"
              value={selectedPathIndex}
              onChange={(e) => {
                setSelectedPathIndex(Number(e.target.value));
              }}
              className="bg-obsidian-900 border border-hairline text-chalk-200 text-xs px-2.5 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-amber"
            >
              {engine.alternativePaths.map((_, pIdx) => (
                <option key={pIdx} value={pIdx}>
                  Path {pIdx + 1} of {engine.alternativePaths.length}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Inputs X and Y */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyNewStrings(inputX, inputY);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="flex items-center gap-1.5">
            <label htmlFor="lcs-input-x" className="font-mono text-xs text-chalk-500">
              X:
            </label>
            <input
              id="lcs-input-x"
              type="text"
              maxLength={9}
              value={inputX}
              onChange={(e) => {
                setInputX(e.target.value);
                if (inputError) setInputError(null);
              }}
              className="w-24 sm:w-28 px-2 py-1 bg-obsidian-900 border border-hairline font-mono text-xs uppercase tracking-wider text-chalk-100 focus:outline-none focus:ring-1 focus:ring-electric-400"
              placeholder="e.g. ABCBDAB"
              aria-label="String X (max 9 chars, alphanumeric)"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="lcs-input-y" className="font-mono text-xs text-chalk-500">
              Y:
            </label>
            <input
              id="lcs-input-y"
              type="text"
              maxLength={9}
              value={inputY}
              onChange={(e) => {
                setInputY(e.target.value);
                if (inputError) setInputError(null);
              }}
              className="w-24 sm:w-28 px-2 py-1 bg-obsidian-900 border border-hairline font-mono text-xs uppercase tracking-wider text-chalk-100 focus:outline-none focus:ring-1 focus:ring-electric-400"
              placeholder="e.g. BDCAB"
              aria-label="String Y (max 9 chars, alphanumeric)"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1 bg-electric-500/20 hover:bg-electric-500/30 text-electric-400 border border-electric-400/40 text-xs font-mono font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-electric-400"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Inline Input Error Message */}
      {inputError && (
        <div
          role="alert"
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/15 border border-rose-500/50 text-rose-300 text-xs font-mono"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{inputError}</span>
        </div>
      )}

      {/* Playback Controls Toolbar */}
      <div
        role="group"
        aria-label="LCS Step Controller"
        className="flex flex-wrap items-center justify-between gap-3 p-3 bg-obsidian-950 border border-hairline font-mono text-xs"
      >
        {/* Step Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleReset}
            title="Traceback reset (Key: R)"
            aria-label="Reset to beginning"
            className="p-1.5 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 border border-hairline hover:text-chalk-100 transition-colors focus:outline-none focus:ring-1 focus:ring-electric-400"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleStepBackward}
            disabled={currentStep === 0}
            title="Step backward (Key: ←)"
            aria-label="Step backward"
            className="p-1.5 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 border border-hairline disabled:opacity-30 disabled:cursor-not-allowed hover:text-chalk-100 transition-colors focus:outline-none focus:ring-1 focus:ring-electric-400"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            title={isPlaying ? 'Pause (Key: Space)' : 'Play (Key: Space)'}
            aria-label={isPlaying ? 'Pause playback' : 'Play traceback animation'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-electric-500/20 hover:bg-electric-500/30 text-electric-400 border border-electric-400/50 font-bold transition-all focus:outline-none focus:ring-1 focus:ring-electric-400"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={handleStepForward}
            disabled={currentStep >= totalSteps - 1}
            title="Next step (Key: →)"
            aria-label="Step forward"
            className="p-1.5 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 border border-hairline disabled:opacity-30 disabled:cursor-not-allowed hover:text-chalk-100 transition-colors focus:outline-none focus:ring-1 focus:ring-electric-400"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Step Scrubber / Progress */}
        <div className="flex items-center gap-3">
          <span className="text-chalk-400">
            Step <strong className="text-chalk-100">{currentStep}</strong> / {totalSteps - 1}
          </span>
          <input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={currentStep}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStep(Number(e.target.value));
            }}
            aria-label="Step scrubber slider"
            className="w-28 sm:w-44 accent-electric-400 cursor-pointer"
          />
        </div>

        {/* Playback Speed Slider */}
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-chalk-500" />
          <span className="text-chalk-400 text-[11px] hidden sm:inline">Speed:</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.25}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            aria-label="LCS speed slider"
            className="w-16 sm:w-24 accent-teal-400 cursor-pointer"
          />
          <span className="text-teal-300 text-[11px] w-8">{speed}x</span>
        </div>
      </div>

      {/* Main Visualization Viewport with smooth crossfade */}
      <div className="w-full relative transition-opacity duration-200">
        {viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LcsMatrixView
              engine={engine}
              currentStep={currentStep}
              step={activeStep}
              hoveredChar={hoveredChar}
              onHoverCell={setHoveredCell}
            />
            <LcsAlignmentView
              engine={engine}
              currentStep={currentStep}
              step={activeStep}
              hoveredCell={hoveredCell}
              onHoverChar={setHoveredChar}
            />
          </div>
        ) : viewMode === 'matrix' ? (
          <LcsMatrixView
            engine={engine}
            currentStep={currentStep}
            step={activeStep}
            hoveredChar={hoveredChar}
            onHoverCell={setHoveredCell}
          />
        ) : (
          <LcsAlignmentView
            engine={engine}
            currentStep={currentStep}
            step={activeStep}
            hoveredCell={hoveredCell}
            onHoverChar={setHoveredChar}
          />
        )}
      </div>
    </div>
  );
};
