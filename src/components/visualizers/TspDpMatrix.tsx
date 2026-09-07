import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { TspState, formatSubsetMask, popcount } from '../../algorithms/tsp';
import { Layers, X, HelpCircle, ArrowRight } from 'lucide-react';

interface TspDpMatrixProps {
  step: AlgorithmStep;
  onClose?: () => void;
}

export const TspDpMatrix: React.FC<TspDpMatrixProps> = ({ step, onClose }) => {
  const state = (step.state || {}) as TspState;
  const numCities = state.numCities || 4;
  const cities = state.cities || [];
  const subsets = state.subsets || [];
  const dpTable = state.dpTable || {};
  const parentTable = state.parentTable || {};
  const currentMask = state.currentMask;
  const currentCity = state.currentCity;
  const currentPhase = state.currentPhase;
  const candidateEdges = state.candidateEdges || [];
  const optimalTour = state.optimalTour || [];

  // Determine which cells are part of the optimal tour during reconstruct / complete
  const isOptimalCell = (mask: number, city: number): boolean => {
    if (currentPhase !== 'reconstruct' && currentPhase !== 'complete') return false;
    if (!optimalTour || optimalTour.length === 0) return false;

    // Check if this (mask, city) is along the backtrack chain
    let currM = (1 << numCities) - 1;
    let currC = optimalTour[optimalTour.length - 2]; // best last city before return to 0

    while (currC !== 0 && currM > 0) {
      if (currM === mask && currC === city) return true;
      const p = parentTable[`${currM},${currC}`];
      if (p === null || p === undefined) break;
      currM = currM ^ (1 << currC);
      currC = p;
    }
    if (mask === 1 && city === 0) return true;
    return false;
  };

  // Determine if a cell is one of the candidate sources for the active step
  const isCandidateSource = (mask: number, city: number): boolean => {
    if (currentPhase !== 'fill' && currentPhase !== 'close') return false;
    const prevMask = currentPhase === 'fill' ? currentMask ^ (1 << currentCity) : currentMask;
    if (mask !== prevMask) return false;
    return candidateEdges.some((c) => c.u === city);
  };

  const getCellStatus = (mask: number, city: number) => {
    const isCurrent =
      (currentPhase === 'fill' && mask === currentMask && city === currentCity) ||
      (currentPhase === 'base' && mask === 1 && city === 0) ||
      (currentPhase === 'close' && mask === currentMask && city === currentCity);

    if (isCurrent) return 'active';
    if (isOptimalCell(mask, city)) return 'optimal';
    if (isCandidateSource(mask, city)) return 'candidate';
    return null;
  };

  const getCellClasses = (mask: number, city: number, val: number | null | undefined) => {
    const status = getCellStatus(mask, city);
    if (status === 'active') {
      return 'bg-amber/25 border-2 border-amber text-amber-glow font-bold scale-[1.03] z-10 shadow-sm animate-pulse';
    }
    if (status === 'optimal') {
      return 'bg-acid-500/25 border-2 border-acid-500 text-acid-500 font-bold';
    }
    if (status === 'candidate') {
      return 'bg-electric-500/20 border-2 border-electric-400 text-electric-400 font-semibold';
    }
    if (val === null || val === undefined) {
      return 'bg-obsidian-950/40 border border-hairline text-chalk-600 opacity-40';
    }
    return 'bg-obsidian-950/70 border border-hairline text-chalk-200';
  };

  return (
    <div className="flex flex-col w-full bg-obsidian-950 border border-hairline font-mono text-xs shadow-xl rounded-sm overflow-hidden">
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-obsidian-900 border-b border-hairline">
        <div className="flex items-center gap-2 text-chalk-200">
          <Layers className="w-4 h-4 text-amber" />
          <span className="font-bold tracking-wider uppercase text-[11px]">
            Held-Karp DP Table [S, j]
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-obsidian-950 border border-hairline text-chalk-400">
            {subsets.length} Subsets × {numCities} Cities
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850 rounded transition-colors"
            title="Close DP Table Pane"
            aria-label="Close DP Table"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recurrence & Active Calculation Formula Box */}
      {state.calculationFormula && (
        <div className="p-3 bg-obsidian-900/60 border-b border-hairline flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-chalk-500 uppercase text-[10px] font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-amber" />
            <span>Recurrence & State Transition</span>
          </div>
          <pre className="text-amber-glow font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all bg-obsidian-950/80 p-2 rounded border border-hairline">
            {state.calculationFormula}
          </pre>
        </div>
      )}

      {/* DP Matrix Table with Sticky Column and Row Headers */}
      <div className="overflow-x-auto overflow-y-auto max-h-[420px] p-2">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="border-b border-hairline bg-obsidian-900 sticky top-0 z-20">
              <th className="px-2 py-2 text-left text-chalk-400 font-semibold uppercase text-[10px] tracking-wider border-r border-hairline min-w-[130px] bg-obsidian-900">
                Subset S ⊆ V
              </th>
              <th className="px-1.5 py-2 text-chalk-400 font-semibold uppercase text-[10px] tracking-wider border-r border-hairline w-12 bg-obsidian-900">
                |S|
              </th>
              {cities.map((city) => (
                <th
                  key={city.id}
                  className={`px-2 py-2 font-semibold uppercase text-[10px] tracking-wider border-r border-hairline min-w-[60px] ${
                    city.id === currentCity && currentPhase === 'fill'
                      ? 'text-amber-glow bg-amber/15 font-bold'
                      : 'text-chalk-300 bg-obsidian-900'
                  }`}
                >
                  {city.label}
                  <span className="block text-[9px] text-chalk-500 font-normal">
                    {city.id === 0 ? '(Start)' : `j=${city.id}`}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subsets.map((mask) => {
              const size = popcount(mask);
              const subsetLabel = formatSubsetMask(mask, cities);
              const isRowActive = mask === currentMask;

              return (
                <tr
                  key={mask}
                  className={`border-b border-hairline/60 transition-colors ${
                    isRowActive ? 'bg-amber/10' : 'hover:bg-obsidian-900/40'
                  }`}
                >
                  {/* Subset Name */}
                  <td className="px-2 py-1.5 text-left border-r border-hairline font-semibold text-chalk-300 whitespace-nowrap bg-obsidian-950/80">
                    <span className={isRowActive ? 'text-amber-glow font-bold' : ''}>
                      {subsetLabel}
                    </span>
                  </td>

                  {/* Subset Size Badge */}
                  <td className="px-1.5 py-1.5 border-r border-hairline text-chalk-500 text-[10px] bg-obsidian-950/60">
                    {size}
                  </td>

                  {/* DP Cells for Each City */}
                  {cities.map((city) => {
                    const inSubset = (mask & (1 << city.id)) !== 0;
                    if (!inSubset) {
                      // City not in subset -> invalid DP state
                      return (
                        <td
                          key={city.id}
                          className="px-2 py-1.5 border-r border-hairline/40 bg-obsidian-950/20 text-chalk-700 select-none text-[11px]"
                          title={`${city.label} ∉ ${subsetLabel}`}
                        >
                          ·
                        </td>
                      );
                    }

                    // Special case: size > 1 but city == 0 -> start city can only be start, not interior end
                    if (city.id === 0 && size > 1) {
                      return (
                        <td
                          key={city.id}
                          className="px-2 py-1.5 border-r border-hairline/40 bg-obsidian-950/30 text-chalk-700 select-none text-[10px]"
                          title="Start city 0 only valid as base case for S={0}"
                        >
                          —
                        </td>
                      );
                    }

                    const key = `${mask},${city.id}`;
                    const val = dpTable[key];
                    const pred = parentTable[key];
                    const predLabel = pred !== null && pred !== undefined ? cities[pred]?.label : null;
                    const cellClasses = getCellClasses(mask, city.id, val);

                    return (
                      <td
                        key={city.id}
                        className={`px-2 py-1.5 border-r border-hairline transition-all duration-150 relative ${cellClasses}`}
                        title={
                          val !== null && val !== undefined
                            ? `DP(${subsetLabel}, ${city.label}) = ${val}${predLabel ? ` (via ${predLabel})` : ''}`
                            : `DP(${subsetLabel}, ${city.label}) = Unvisited`
                        }
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[11px] font-bold">
                            {val !== null && val !== undefined ? val : '∞'}
                          </span>
                          {predLabel && (
                            <span className="text-[9px] opacity-75 font-normal flex items-center gap-0.5">
                              <ArrowRight className="w-2 h-2 inline" />
                              {predLabel}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pane Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-obsidian-900 border-t border-hairline text-[10px] text-chalk-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber/30 border border-amber inline-block" />
            <span>Active Computing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-electric-500/25 border border-electric-400 inline-block" />
            <span>Predecessor Subproblem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-acid-500/30 border border-acid-500 inline-block" />
            <span>Optimal Tour Edge</span>
          </div>
        </div>
        <span className="text-chalk-500">Held-Karp O(n² · 2ⁿ)</span>
      </div>
    </div>
  );
};
