import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';

interface GridTableVisualizerProps {
  step: AlgorithmStep;
}

export const GridTableVisualizer: React.FC<GridTableVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const dpTable: number[][] = state.dpTable || [];
  const highlights = step.highlights || {};
  const highlightedCells = highlights.cells || [];

  const currentRow = state.currentRow;
  const currentCol = state.currentCol;

  // Determine context: Knapsack DP or LCS
  const isKnapsack = state.items !== undefined;
  const isLCS = state.str1 !== undefined;

  const rowLabels: string[] = isKnapsack
    ? ['∅ (0)', ...state.items.map((it: any) => `I${it.id} (w:${it.weight}, v:${it.value})`)]
    : isLCS
    ? ['∅', ...state.str1.split('').map((ch: string, idx: number) => `${ch} [${idx}]`)]
    : dpTable.map((_, idx) => `${idx}`);

  const colLabels: string[] = isKnapsack
    ? Array.from({ length: (state.capacity ?? 0) + 1 }, (_, c) => `W=${c}`)
    : isLCS
    ? ['∅', ...state.str2.split('').map((ch: string, idx: number) => `${ch} [${idx}]`)]
    : (dpTable[0] || []).map((_, idx) => `${idx}`);

  const getCellStatus = (r: number, c: number) => {
    const match = highlightedCells.find((cell) => cell.r === r && cell.c === c);
    if (match) return match.status;
    if (r === currentRow && c === currentCol) return 'active';
    return null;
  };

  const getCellClasses = (r: number, c: number) => {
    const status = getCellStatus(r, c);
    if (status === 'active') {
      return 'bg-sky-500/30 border-2 border-sky-400 text-sky-200 font-bold shadow-lg shadow-sky-500/30 scale-105 z-10';
    }
    if (status === 'source') {
      return 'bg-amber-500/25 border-2 border-amber-400 text-amber-200 font-bold';
    }
    if (status === 'path') {
      return 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-200 font-bold shadow-md shadow-emerald-500/20';
    }
    if (status === 'check') {
      return 'bg-rose-500/20 border border-rose-400 text-rose-300';
    }
    return 'bg-slate-900/80 border border-slate-800 text-slate-300';
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[380px] p-6 bg-slate-900/90 rounded-xl border border-slate-800 backdrop-blur">
      {/* Formula / Explanation banner */}
      {state.formulaExplanation && (
        <div className="mb-4 px-4 py-2 bg-slate-950/80 border border-sky-500/40 rounded-lg text-xs md:text-sm font-mono text-sky-300 shadow-inner flex items-center gap-2">
          <span className="font-semibold text-slate-400">Recurrence:</span>
          <span>{state.formulaExplanation}</span>
        </div>
      )}

      {/* Selected Items / LCS Output banner */}
      {isKnapsack && state.selectedItems && state.selectedItems.length > 0 && (
        <div className="mb-3 px-3 py-1 bg-emerald-950/60 border border-emerald-600/50 rounded-full text-xs font-mono text-emerald-300">
          Selected Items: [{state.selectedItems.join(', ')}] | Max Value: {state.maxValue}
        </div>
      )}

      {isLCS && state.lcsString !== undefined && (
        <div className="mb-3 px-3 py-1 bg-emerald-950/60 border border-emerald-600/50 rounded-full text-xs font-mono text-emerald-300">
          Current LCS: "{state.lcsString}" (Length: {state.lcsString.length})
        </div>
      )}

      {/* Grid Table Container */}
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[480px] pb-2 rounded-lg border border-slate-800">
        <table className="w-full border-collapse text-center text-xs font-mono">
          {/* Column Headers */}
          <thead>
            <tr className="bg-slate-950/90 sticky top-0 z-20">
              <th className="p-2.5 border-b border-r border-slate-700/80 text-slate-400 font-semibold sticky left-0 bg-slate-950 z-30">
                {isKnapsack ? 'Items \\ Cap' : isLCS ? 'Str1 \\ Str2' : 'Row \\ Col'}
              </th>
              {colLabels.map((colText, cIdx) => (
                <th
                  key={cIdx}
                  className={`p-2.5 border-b border-slate-700/80 font-semibold min-w-[52px] ${
                    cIdx === currentCol ? 'text-sky-300 bg-sky-950/40 border-b-2 border-sky-400' : 'text-slate-400'
                  }`}
                >
                  {colText}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dpTable.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                {/* Row Header */}
                <th
                  className={`p-2.5 border-r border-b border-slate-700/80 font-semibold text-left sticky left-0 z-10 ${
                    rIdx === currentRow ? 'text-sky-300 bg-sky-950/70 border-r-2 border-sky-400' : 'text-slate-400 bg-slate-950/95'
                  }`}
                >
                  {rowLabels[rIdx] || `R${rIdx}`}
                </th>

                {/* Cells */}
                {row.map((val, cIdx) => {
                  const cellClasses = getCellClasses(rIdx, cIdx);
                  const isCurrent = rIdx === currentRow && cIdx === currentCol;
                  return (
                    <td
                      key={cIdx}
                      className={`p-2.5 border border-slate-800/80 transition-all duration-200 relative ${cellClasses}`}
                    >
                      <span className={`${isCurrent ? 'scale-110 font-bold' : ''}`}>
                        {val}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-sky-500/40 border border-sky-400"></span>
          <span>Active Cell (Current)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-500/40 border border-amber-400"></span>
          <span>Source Dependency Cells</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500/40 border border-emerald-400"></span>
          <span>Backtracked Solution Path</span>
        </div>
      </div>
    </div>
  );
};
