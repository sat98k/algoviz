import React, { useRef, useState, useEffect } from 'react';
import { LcsEngineResult, UnifiedLcsStep } from '../../algorithms/lcsEngine';

export interface LcsAlignmentViewProps {
  engine: LcsEngineResult;
  currentStep: number;
  step?: UnifiedLcsStep;
  hoveredCell?: { r: number; c: number } | null;
  onHoverChar?: (char: { string: 'X' | 'Y'; index: number } | null) => void;
}

export type BoxState = 'comparing' | 'matched' | 'skipped' | 'neutral';

export const LcsAlignmentView: React.FC<LcsAlignmentViewProps> = ({
  engine,
  currentStep,
  step: directStep,
  hoveredCell,
  onHoverChar,
}) => {
  const { X, Y, m, n, lcsLength, steps } = engine;
  const containerRef = useRef<HTMLDivElement>(null);

  // Active step object
  const activeStep: UnifiedLcsStep = directStep ?? steps[currentStep] ?? steps[0];
  const state = activeStep.state;
  const phase = state.phase ?? 'traceback';
  const currI = state.currentRow;
  const currJ = state.currentCol;

  // Track matched and skipped indices
  const matchedX = new Set<number>(state.matchedIndicesStr1 ? state.matchedIndicesStr1.map((idx) => idx + 1) : []);
  const matchedY = new Set<number>(state.matchedIndicesStr2 ? state.matchedIndicesStr2.map((idx) => idx + 1) : []);

  // Compute skipped indices from backtrackPath
  const skippedX = new Set<number>();
  const skippedY = new Set<number>();
  if (state.backtrackPath) {
    for (const p of state.backtrackPath) {
      if (p.arrow === '↑' && p.r > 0) skippedX.add(p.r);
      if (p.arrow === '←' && p.c > 0) skippedY.add(p.c);
    }
  }

  // Active pair comparing now
  const isComparing = (phase === 'fill' || phase === 'traceback') && currI > 0 && currJ > 0;
  const comparingX = isComparing ? currI : null;
  const comparingY = isComparing ? currJ : null;

  // Matched pairs for straight SVG lines
  const matchedPairs = state.matchedPairs ?? [];

  // SVG Line coordinates state
  const [lineCoords, setLineCoords] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);

  const updateLineCoordinates = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const coords = matchedPairs.map((pair) => {
      const boxX = containerRef.current?.querySelector(`[data-box="X-${pair[0]}"]`);
      const boxY = containerRef.current?.querySelector(`[data-box="Y-${pair[1]}"]`);

      if (!boxX || !boxY) return { x1: 0, y1: 0, x2: 0, y2: 0 };

      const rectX = boxX.getBoundingClientRect();
      const rectY = boxY.getBoundingClientRect();

      return {
        x1: rectX.left + rectX.width / 2 - containerRect.left,
        y1: rectX.bottom - containerRect.top,
        x2: rectY.left + rectY.width / 2 - containerRect.left,
        y2: rectY.top - containerRect.top,
      };
    });

    setLineCoords(coords);
  };

  useEffect(() => {
    updateLineCoordinates();
  }, [currentStep, matchedPairs.length, X, Y, phase]);

  useEffect(() => {
    const handleResize = () => updateLineCoordinates();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [matchedPairs.length]);

  // Determine state of an X box (1-indexed)
  const getBoxStateX = (idx: number): BoxState => {
    if (matchedX.has(idx)) return 'matched';
    if (skippedX.has(idx)) return 'skipped';
    if (comparingX === idx) return 'comparing';
    return 'neutral';
  };

  // Determine state of a Y box (1-indexed)
  const getBoxStateY = (idx: number): BoxState => {
    if (matchedY.has(idx)) return 'matched';
    if (skippedY.has(idx)) return 'skipped';
    if (comparingY === idx) return 'comparing';
    return 'neutral';
  };

  const getBoxClasses = (boxState: BoxState, isHovered: boolean) => {
    let base = 'relative flex flex-col items-center justify-center w-11 h-14 sm:w-13 sm:h-16 rounded transition-all duration-150 ';

    if (isHovered) {
      base += 'ring-2 ring-electric-400 scale-105 z-20 ';
    }

    switch (boxState) {
      case 'comparing':
        return base + 'bg-amber/15 border-2 border-amber text-amber-glow font-bold shadow-md animate-pulse ring-1 ring-amber/50';
      case 'matched':
        return base + 'bg-teal-500/25 border-2 border-teal-500 text-teal-300 font-bold shadow-sm';
      case 'skipped':
        return base + 'bg-obsidian-950/40 border border-dashed border-chalk-600 text-chalk-500 opacity-60';
      case 'neutral':
      default:
        return base + 'bg-obsidian-950/80 border border-hairline text-chalk-300';
    }
  };

  // Header strip content based on phase
  const renderStrip = () => {
    if (phase === 'init') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-chalk-500 uppercase text-[11px] tracking-wider">Phase:</span>
          <span className="px-2 py-0.5 bg-obsidian-900 border border-hairline text-chalk-300 font-bold">
            1. Table Initialization
          </span>
          <span className="text-chalk-500 text-[11px]">
            (Base row 0 & col 0 initialized with 0)
          </span>
        </div>
      );
    }

    if (phase === 'fill') {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-chalk-500 uppercase text-[11px] tracking-wider">Phase:</span>
          <span className="px-2 py-0.5 bg-amber/20 border border-amber text-amber-glow font-bold">
            2. Table Calculation
          </span>
          <span className="text-chalk-300 text-[11px]">
            Evaluating cell L[{currI}][{currJ}]: X[{currI}] ('{X[currI - 1]}') vs Y[{currJ}] ('{Y[currJ - 1]}')
          </span>
        </div>
      );
    }

    if (phase === 'table_complete') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-chalk-500 uppercase text-[11px] tracking-wider">Phase:</span>
          <span className="px-2 py-0.5 bg-acid-500/20 border border-acid-500 text-acid-500 font-bold">
            3. Table Complete
          </span>
          <span className="text-chalk-300 text-[11px]">
            Total LCS Length = {lcsLength} (ready for traceback)
          </span>
        </div>
      );
    }

    // Traceback or final
    const currentLcs = state.lcsString ?? '';
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-chalk-500 uppercase text-[11px] tracking-wider">LCS so far:</span>
        <span className="px-2.5 py-0.5 bg-teal-500/20 border border-teal-500 text-teal-300 font-bold tracking-widest text-sm">
          "{currentLcs}"
        </span>
        <span className="text-chalk-400 text-[11px]">
          ({currentLcs.length} of total length {lcsLength})
        </span>
      </div>
    );
  };

  const captionText = state.caption || activeStep.description || '';

  return (
    <div className="flex flex-col items-center w-full min-h-[380px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all gap-5">
      {/* LCS So Far Strip */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-obsidian-950 border border-hairline text-xs font-mono">
        {renderStrip()}
        <div className="flex items-center gap-2">
          <span className="text-chalk-500">Step:</span>
          <span className="text-acid-500 font-bold">{currentStep} / {steps.length - 1}</span>
        </div>
      </div>

      {/* Alignment Arena Container */}
      <div
        ref={containerRef}
        className="w-full max-w-4xl relative min-h-[220px] sm:min-h-[240px] flex flex-col justify-between py-4 px-2 sm:px-6 bg-obsidian-950 border border-hairline overflow-x-auto overflow-y-hidden"
      >
        {/* SVG Canvas for straight connection lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          aria-hidden="true"
        >
          {lineCoords.map((line, idx) => (
            <g key={idx}>
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#14b8a6"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              <circle cx={line.x1} cy={line.y1} r="3" fill="#14b8a6" />
              <circle cx={line.x2} cy={line.y2} r="3" fill="#14b8a6" />
            </g>
          ))}
        </svg>

        {/* Row 1: String X on top, centered separately */}
        <div className="flex flex-col items-center gap-1 z-20">
          <div className="text-[11px] font-mono uppercase tracking-wider text-chalk-500 self-start pl-2">
            String X (Length {m})
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {X.split('').map((char, idx) => {
              const oneBasedIdx = idx + 1;
              const boxState = getBoxStateX(oneBasedIdx);
              const isHovered = hoveredCell?.r === oneBasedIdx;

              return (
                <div
                  key={idx}
                  data-box={`X-${oneBasedIdx}`}
                  className={getBoxClasses(boxState, isHovered)}
                  onMouseEnter={() => onHoverChar?.({ string: 'X', index: oneBasedIdx })}
                  onMouseLeave={() => onHoverChar?.(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`String X, index ${oneBasedIdx}, character ${char}, status ${boxState}`}
                >
                  <span className="text-[10px] font-mono text-chalk-500 leading-none mb-1">
                    {oneBasedIdx}
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold leading-none">
                    {char}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Space in middle for SVG connection lines */}
        <div className="h-10 sm:h-12 w-full" />

        {/* Row 2: String Y below, centered separately */}
        <div className="flex flex-col items-center gap-1 z-20">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {Y.split('').map((char, idx) => {
              const oneBasedIdx = idx + 1;
              const boxState = getBoxStateY(oneBasedIdx);
              const isHovered = hoveredCell?.c === oneBasedIdx;

              return (
                <div
                  key={idx}
                  data-box={`Y-${oneBasedIdx}`}
                  className={getBoxClasses(boxState, isHovered)}
                  onMouseEnter={() => onHoverChar?.({ string: 'Y', index: oneBasedIdx })}
                  onMouseLeave={() => onHoverChar?.(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`String Y, index ${oneBasedIdx}, character ${char}, status ${boxState}`}
                >
                  <span className="text-base sm:text-lg font-mono font-bold leading-none mt-1">
                    {char}
                  </span>
                  <span className="text-[10px] font-mono text-chalk-500 leading-none mt-1">
                    {oneBasedIdx}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-chalk-500 self-start pl-2">
            String Y (Length {n})
          </div>
        </div>
      </div>

      {/* Live Caption Area (aria-live region) */}
      <div
        aria-live="polite"
        className="w-full max-w-4xl px-4 py-2.5 bg-obsidian-950 border border-electric-400/30 text-xs sm:text-sm font-mono text-chalk-200 flex items-center gap-2 min-h-[46px]"
      >
        <span className="text-electric-400 font-bold shrink-0">▶</span>
        <span className="break-words">{captionText}</span>
      </div>

      {/* Legend for 4 box states */}
      <ul
        aria-label="Alignment Box States Legend"
        className="flex flex-wrap items-center justify-center gap-5 mt-1 text-xs font-mono text-chalk-400"
      >
        <li className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-amber/20 border-2 border-amber" />
          <span>Comparing now</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-teal-500/25 border-2 border-teal-500" />
          <span>Matched</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-obsidian-950/40 border border-dashed border-chalk-600" />
          <span>Skipped</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-obsidian-950/80 border border-hairline" />
          <span>Not visited</span>
        </li>
      </ul>
    </div>
  );
};
