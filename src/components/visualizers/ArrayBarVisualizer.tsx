import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';

interface ArrayBarVisualizerProps {
  step: AlgorithmStep;
}

export const ArrayBarVisualizer: React.FC<ArrayBarVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const array: number[] = state.array || [];
  const highlights = step.highlights || {};

  const pivotIndex = state.pivotIndex ?? highlights.pivotIndex;
  const compareIndices = highlights.compareIndices || [];
  const swapIndices = highlights.swapIndices || [];
  const activeIndices = highlights.activeIndices || highlights.indices || [];
  const sortedIndices = state.sortedIndices || highlights.sortedIndices || [];
  const windowRange = state.window || highlights.window;

  // Compute min and max for scaling
  const maxVal = Math.max(...array, 1);
  const minVal = Math.min(...array, 0);
  const range = Math.max(maxVal - minVal, 1);

  const getBarColor = (index: number) => {
    if (index === pivotIndex) {
      return 'bg-purple-500 border-purple-300 shadow-purple-500/50';
    }
    if (swapIndices.includes(index)) {
      return 'bg-rose-500 border-rose-300 shadow-rose-500/50 animate-pulse';
    }
    if (compareIndices.includes(index)) {
      return 'bg-amber-400 border-amber-200 shadow-amber-400/50';
    }
    if (sortedIndices.includes(index)) {
      return 'bg-emerald-500 border-emerald-300 shadow-emerald-500/40';
    }
    if (activeIndices.includes(index)) {
      return 'bg-sky-500 border-sky-300 shadow-sky-500/40';
    }
    if (windowRange && index >= windowRange[0] && index <= windowRange[1]) {
      return 'bg-cyan-600 border-cyan-400 shadow-cyan-600/40';
    }
    return 'bg-slate-700 border-slate-600';
  };

  const getBarBadge = (index: number) => {
    if (index === pivotIndex) return 'PIVOT';
    if (swapIndices.includes(index)) return 'SWAP';
    if (compareIndices.includes(index)) return 'CMP';
    if (sortedIndices.includes(index)) return 'DONE';
    if (state.mode === 'kadane' && state.bestStart <= index && index <= state.bestEnd) return 'MAX';
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[380px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Subarray / Window status indicator */}
      {windowRange && (
        <div className="mb-4 text-xs font-mono px-4 py-1.5 bg-obsidian-950 border border-amber/30 text-amber-glow flex items-center gap-3">
          <span className="font-semibold uppercase tracking-wider">[ WINDOW: {windowRange[0]} .. {windowRange[1]} ]</span>
          {state.currentSum !== undefined && <span className="text-chalk-400">| Current Sum: <strong className="text-chalk-100">{state.currentSum}</strong></span>}
          {state.maxSum !== undefined && <span className="text-chalk-400">| Max Sum: <strong className="text-acid-500">{state.maxSum}</strong></span>}
        </div>
      )}

      {/* Array Bars Container */}
      <div className="flex items-end justify-center gap-2 md:gap-3 w-full max-w-4xl h-64 px-6 pb-4 pt-8 bg-obsidian-950 border border-hairline overflow-x-auto">
        {array.map((val, idx) => {
          // Normalize height to percentage (between 15% and 95%)
          const heightPercent = Math.max(15, Math.min(95, ((val - minVal) / range) * 80 + 15));
          const badge = getBarBadge(idx);

          return (
            <div key={idx} className="flex flex-col items-center flex-1 min-w-[28px] max-w-[56px] h-full justify-end group">
              {/* Badge tag */}
              <div className="h-5 flex items-center justify-center mb-1">
                {badge && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-obsidian-800 border border-hairline text-chalk-200 uppercase tracking-wider">
                    {badge}
                  </span>
                )}
              </div>

              {/* Animated Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full border-t-2 border-x transition-all duration-300 flex items-start justify-center pt-1 shadow-md ${getBarColor(
                  idx
                )}`}
              >
                <span className="text-xs font-bold font-mono text-white drop-shadow select-none tabular-nums">
                  {val}
                </span>
              </div>

              {/* Index marker */}
              <div className="mt-2 text-[10px] font-mono text-chalk-500 select-none tabular-nums">
                {idx}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-6 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-purple-500 border border-purple-300"></span>
          <span>Pivot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber-400 border border-amber-200"></span>
          <span>Comparing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-rose-500 border border-rose-300"></span>
          <span>Swapping</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-emerald-500 border border-emerald-300"></span>
          <span>Sorted / Final</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-cyan-600 border border-cyan-400"></span>
          <span>Window</span>
        </div>
      </div>
    </div>
  );
};
