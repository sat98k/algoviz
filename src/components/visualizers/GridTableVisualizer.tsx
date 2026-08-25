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
      return 'bg-amber/25 border border-amber text-amber-glow font-bold scale-105 z-10';
    }
    if (status === 'source') {
      return 'bg-electric-500/20 border border-electric-400 text-electric-400 font-bold';
    }
    if (status === 'path') {
      return 'bg-acid-500/25 border border-acid-500 text-acid-500 font-bold';
    }
    if (status === 'check') {
      return 'bg-rose-500/20 border border-rose-400 text-rose-300';
    }
    return 'bg-obsidian-950/60 border border-hairline text-chalk-300';
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[380px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Formula / Explanation banner */}
      {state.formulaExplanation && (
        <div className="mb-4 px-4 py-2 bg-obsidian-950 border border-amber/30 text-xs md:text-sm font-mono text-amber-glow flex items-center gap-2">
          <span className="font-semibold text-chalk-500 uppercase">[ RECURRENCE ]:</span>
          <span>{state.formulaExplanation}</span>
        </div>
      )}

      {/* Selected Items / LCS Output banner */}
      {isKnapsack && state.selectedItems && state.selectedItems.length > 0 && (
        <div className="mb-3 px-4 py-1.5 bg-obsidian-950 border border-acid-500/40 text-xs font-mono text-acid-500">
          Selected Items: [{state.selectedItems.join(', ')}] | Max Value: {state.maxValue}
        </div>
      )}

      {isLCS && state.lcsString !== undefined && (
        <div className="mb-3 px-4 py-1.5 bg-obsidian-950 border border-acid-500/40 text-xs font-mono text-acid-500">
          Current LCS: "{state.lcsString}" (Length: {state.lcsString.length})
        </div>
      )}

      {/* Grid Table Container */}
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[480px] pb-2 border border-hairline bg-obsidian-950">
        <table className="w-full border-collapse text-center text-xs font-mono">
          {/* Column Headers */}
          <thead>
            <tr className="bg-obsidian-950 sticky top-0 z-20">
              <th className="p-3 border-b border-r border-hairline text-chalk-500 font-semibold sticky left-0 bg-obsidian-950 z-30 uppercase tracking-wider text-[11px]">
                {isKnapsack ? 'Items \\ Cap' : isLCS ? 'Str1 \\ Str2' : 'Row \\ Col'}
              </th>
              {colLabels.map((colText, cIdx) => (
                <th
                  key={cIdx}
                  className={`p-3 border-b border-hairline font-semibold min-w-[54px] text-[11px] ${
                    cIdx === currentCol ? 'text-amber-glow bg-amber/10 border-b-2 border-amber' : 'text-chalk-500'
                  }`}
                >
                  {colText}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dpTable.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-obsidian-850/60 transition-colors">
                {/* Row Header */}
                <th
                  className={`p-3 border-r border-b border-hairline font-semibold text-left sticky left-0 z-10 text-[11px] ${
                    rIdx === currentRow ? 'text-amber-glow bg-amber/10 border-r-2 border-amber' : 'text-chalk-400 bg-obsidian-950'
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
                      className={`p-3 border border-hairline transition-all duration-200 relative tabular-nums ${cellClasses}`}
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
      <div className="flex flex-wrap items-center justify-center gap-5 mt-5 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber/40 border border-amber"></span>
          <span>Active Cell</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-electric-500/40 border border-electric-400"></span>
          <span>Dependency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-acid-500/40 border border-acid-500"></span>
          <span>Solution Path</span>
        </div>
      </div>
    </div>
  );
};
