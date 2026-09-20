import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { SetCoverState } from '../../algorithms/setCover';
import { Check, Layers, Sparkles } from 'lucide-react';

interface SetCoverVisualizerProps {
  step: AlgorithmStep;
}

export const SetCoverVisualizer: React.FC<SetCoverVisualizerProps> = ({ step }) => {
  const state = (step.state || {}) as SetCoverState;
  const universe = state.universe || [];
  const subsets = state.subsets || [];
  const coveredElements = new Set(state.coveredElements || []);
  const newlyCovered = new Set(state.newlyCoveredElements || []);
  const selectedSubsets = state.selectedSubsets || [];
  const currentPicked = state.currentPickedSubset;

  const coveragePercent = universe.length > 0 ? Math.round((coveredElements.size / universe.length) * 100) : 0;

  return (
    <div className="flex flex-col items-center w-full min-h-[420px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Telemetry & Progress Banner */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 p-4 mb-5 bg-obsidian-950 border border-hairline">
        <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-chalk-200">
            <Layers className="w-4 h-4 text-amber" />
            <span>UNIVERSE: <strong>|U| = {universe.length}</strong></span>
          </div>
          <span className="text-chalk-600">|</span>
          <div>
            COVERED:{' '}
            <strong className="text-acid-500">
              {coveredElements.size} / {universe.length} ({coveragePercent}%)
            </strong>
          </div>
          <span className="text-chalk-600">|</span>
          <div>
            SELECTED SUBSETS:{' '}
            <strong className="text-amber-glow">
              {selectedSubsets.length} {selectedSubsets.length > 0 ? `[${selectedSubsets.join(', ')}]` : 'None'}
            </strong>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="w-full sm:w-48 h-2.5 bg-obsidian-850 rounded-full border border-hairline overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber to-acid-500 transition-all duration-300"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
      </div>

      {/* Universe Elements Grid */}
      <div className="w-full p-4 mb-5 bg-obsidian-950 border border-hairline">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs uppercase font-bold text-chalk-300 tracking-wider">
            Universe Elements U
          </span>
          <span className="font-mono text-[11px] text-chalk-400">
            {universe.length - coveredElements.size} elements remaining
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {universe.map((elem) => {
            const isCovered = coveredElements.has(elem);
            const isJustCovered = newlyCovered.has(elem);

            return (
              <div
                key={elem}
                className={`flex items-center justify-center gap-1.5 min-w-[44px] h-10 px-3 rounded font-mono text-xs font-bold border transition-all duration-300 ${
                  isJustCovered
                    ? 'bg-acid-500/20 text-acid-400 border-acid-500 shadow-md scale-105 animate-pulse'
                    : isCovered
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                    : 'bg-obsidian-900 text-chalk-500 border-hairline'
                }`}
              >
                {isCovered && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{elem}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Subsets Cards */}
      <div className="w-full p-4 bg-obsidian-950 border border-hairline">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs uppercase font-bold text-chalk-300 tracking-wider">
            Candidate Subsets S
          </span>
          <span className="font-mono text-[11px] text-chalk-400">
            Greedy choice: subset maximizing |S ∩ Uncovered|
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subsets.map((sub) => {
            const isSelected = selectedSubsets.includes(sub.id);
            const isCurrent = currentPicked?.id === sub.id;

            return (
              <div
                key={sub.id}
                className={`p-3.5 rounded border transition-all duration-200 ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/60'
                    : isCurrent
                    ? 'bg-amber/10 border-amber shadow-md ring-1 ring-amber/50'
                    : 'bg-obsidian-900/80 border-hairline hover:border-chalk-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-chalk-200">
                    {sub.label}
                  </span>
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500 text-obsidian-950 uppercase">
                      ✓ IN COVER
                    </span>
                  ) : isCurrent ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber text-obsidian-950 uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> BEST PICK
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-obsidian-800 border border-hairline text-chalk-400">
                      +{sub.uncoveredCount} new
                    </span>
                  )}
                </div>

                {/* Elements Chip List */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sub.elements.map((elem) => {
                    const isElemCovered = coveredElements.has(elem);
                    const isElemNew = newlyCovered.has(elem) && isCurrent;

                    return (
                      <span
                        key={elem}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                          isElemNew
                            ? 'bg-acid-500 text-obsidian-950 font-bold'
                            : isElemCovered
                            ? 'bg-emerald-900/40 text-emerald-300 line-through opacity-75'
                            : 'bg-obsidian-800 text-chalk-300 border border-hairline'
                        }`}
                      >
                        {elem}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-5 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-[9px] text-emerald-400">✓</span>
          <span>Covered Element</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-acid-500/30 border border-acid-500"></span>
          <span>Newly Covered in Current Step</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-obsidian-900 border border-hairline"></span>
          <span>Uncovered Element</span>
        </div>
      </div>
    </div>
  );
};
