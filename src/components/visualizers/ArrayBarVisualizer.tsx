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

  // Semantic tints (see docs/visual-semantics.md). Every coloured bar also carries a text badge.
  const getBarColor = (index: number) => {
    if (state.mode === 'hiring') {
      if (index === state.currentIndex && state.currentDecision === 'hire') return 'bg-sem-decision/35 border-sem-decision';
      if (index === state.currentIndex && state.currentDecision === 'skip') return 'bg-sem-pruned/15 border-dashed border-sem-pruned';
      if (index === state.currentIndex) return 'bg-sem-current/30 border-sem-current';
      if (state.hiredIndices?.includes(index)) return 'bg-sem-decision/20 border-sem-decision/70';
      if (index < state.currentIndex) return 'bg-obsidian-800 border-hairline opacity-60';
      return 'bg-obsidian-800 border-hairline';
    }

    if (index === pivotIndex) return 'bg-sem-decision/30 border-sem-decision';
    if (swapIndices.includes(index)) return 'bg-sem-current/35 border-sem-current';
    if (compareIndices.includes(index)) return 'bg-sem-compare/30 border-sem-compare';
    if (sortedIndices.includes(index)) return 'bg-sem-final/25 border-sem-final';
    if (activeIndices.includes(index)) return 'bg-sem-compare/10 border-sem-compare/50';
    if (windowRange && index >= windowRange[0] && index <= windowRange[1]) return 'bg-obsidian-850 border-chalk-500';
    return 'bg-obsidian-800 border-hairline';
  };

  const getBarBadge = (index: number) => {
    if (state.mode === 'hiring') {
      if (index === state.currentBestIndex) return 'BEST';
      if (index === state.currentIndex && state.currentDecision === 'hire') return 'HIRED';
      if (index === state.currentIndex && state.currentDecision === 'skip') return 'SKIP';
      if (index === state.currentIndex) return 'INTV';
      if (state.hiredIndices?.includes(index)) return 'HIRED';
      return null;
    }
    if (index === pivotIndex) return 'PIVOT';
    if (swapIndices.includes(index)) return 'SWAP';
    if (compareIndices.includes(index)) return 'CMP';
    if (sortedIndices.includes(index)) return 'DONE';
    if (state.mode === 'kadane' && state.bestStart <= index && index <= state.bestEnd) return 'MAX';
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[380px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Hiring Problem status banner */}
      {state.mode === 'hiring' && (
        <div className="mb-4 text-xs font-mono px-4 py-1.5 bg-obsidian-950 border border-amber/30 text-amber-glow flex flex-wrap items-center gap-3">
          <span>PROGRESS: <strong>{state.currentIndex >= 0 ? Math.min(state.currentIndex + 1, array.length) : 0} / {array.length}</strong></span>
          <span>|</span>
          <span>BEST SO FAR: <strong>{state.currentBestScore !== undefined ? `${state.currentBestScore} (C${state.currentBestIndex})` : 'None'}</strong></span>
          <span>|</span>
          <span>HIRED: <strong className="text-acid-500">{state.hiredIndices?.length || 0}</strong></span>
          <span>|</span>
          <span>TOTAL COST: <strong className="text-amber">${state.totalCost || 0}</strong></span>
        </div>
      )}

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
                <span className="text-xs font-bold font-mono text-chalk-100 select-none tabular-nums">
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

      {/* Legend: colours match the badges above each bar */}
      <ul aria-label="Legend" className="flex flex-wrap items-center justify-center gap-5 mt-6 text-xs font-mono text-chalk-400">
        {(state.mode === 'hiring'
          ? [
              ['bg-sem-current/30 border border-sem-current', 'INTV', 'Being interviewed'],
              ['bg-sem-decision/35 border border-sem-decision', 'HIRED', 'Hired (better than everyone so far)'],
              ['bg-sem-pruned/15 border border-dashed border-sem-pruned', 'SKIP', 'Not hired'],
            ]
          : [
              ['bg-sem-decision/30 border border-sem-decision', 'PIVOT', 'Pivot'],
              ['bg-sem-compare/30 border border-sem-compare', 'CMP', 'Being compared'],
              ['bg-sem-current/35 border border-sem-current', 'SWAP', 'Being swapped'],
              ['bg-sem-final/25 border border-sem-final', 'DONE', 'In final position'],
            ]
        ).map(([swatch, tag, label]) => (
          <li key={tag} className="flex items-center gap-1.5">
            <span className={`px-1 text-[9px] font-bold ${swatch}`}>{tag}</span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
