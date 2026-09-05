import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { Layers, CheckCircle } from 'lucide-react';

interface GridTableVisualizerProps {
  step: AlgorithmStep;
}

export const GridTableVisualizer: React.FC<GridTableVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const rawDpTable: number[][] = state.dpTable || [];
  const rawSplitTable: number[][] = state.splitTable || [];
  const highlights = step.highlights || {};
  const highlightedCells = highlights.cells || [];

  const currentRow = state.currentRow;
  const currentCol = state.currentCol;

  // Determine context: Knapsack DP, LCS, or MCM
  const isKnapsack = state.items !== undefined;
  const isLCS = state.str1 !== undefined;
  const isMCM = state.matrices !== undefined || state.dimensions !== undefined;
  const isBacktrackPhase = state.backtrackPhase === true;
  const backtrackInfo = state.backtrackInfo;

  // For MCM, slice off the dummy 0-index row and col for cleaner table display
  const dpTable = isMCM && rawDpTable.length > 1
    ? rawDpTable.slice(1).map((r) => r.slice(1))
    : rawDpTable;

  const splitTable = isMCM && rawSplitTable.length > 1
    ? rawSplitTable.slice(1).map((r) => r.slice(1))
    : rawSplitTable;

  const rowLabels: string[] = isKnapsack
    ? ['∅ (0)', ...state.items.map((it: any) => `I${it.id} (w:${it.weight}, v:${it.value})`)]
    : isLCS
    ? ['∅', ...state.str1.split('').map((ch: string, idx: number) => `${ch} [${idx}]`)]
    : isMCM && state.matrices
    ? state.matrices.map((m: any) => `${m.name} (${m.rows}×${m.cols})`)
    : dpTable.map((_, idx) => `${idx}`);

  const colLabels: string[] = isKnapsack
    ? Array.from({ length: (state.capacity ?? 0) + 1 }, (_, c) => `W=${c}`)
    : isLCS
    ? ['∅', ...state.str2.split('').map((ch: string, idx: number) => `${ch} [${idx}]`)]
    : isMCM && state.matrices
    ? state.matrices.map((m: any) => `${m.name}`)
    : (dpTable[0] || []).map((_, idx) => `${idx}`);

  const getCellStatus = (r: number, c: number) => {
    const internalR = isMCM ? r + 1 : r;
    const internalC = isMCM ? c + 1 : c;

    const match = highlightedCells.find((cell) => cell.r === internalR && cell.c === internalC);
    if (match) return match.status;
    if (internalR === currentRow && internalC === currentCol) return 'active';
    return null;
  };

  const getCellClasses = (r: number, c: number, val: number) => {
    if (isMCM && r > c) {
      return 'bg-obsidian-950/20 border border-hairline/40 text-chalk-700 opacity-40';
    }

    const status = getCellStatus(r, c);
    if (status === 'active') {
      return 'bg-amber/25 border border-amber text-amber-glow font-bold scale-105 z-10 shadow-sm';
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
    if (val === Infinity) {
      return 'bg-obsidian-950/60 border border-hairline text-chalk-600';
    }
    return 'bg-obsidian-950/60 border border-hairline text-chalk-300';
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[380px] p-6 bg-obsidian-900 border border-hairline transition-all gap-4">
      {/* Formula / Explanation banner */}
      {state.formulaExplanation && (
        <div className="w-full max-w-5xl px-4 py-2 bg-obsidian-950 border border-amber/30 text-xs md:text-sm font-mono text-amber-glow flex items-center gap-2">
          <span className="font-semibold text-chalk-500 uppercase">[ STATUS ]:</span>
          <span>{state.formulaExplanation}</span>
        </div>
      )}

      {/* Selected Items / LCS Output / MCM Output banner */}
      {isKnapsack && state.selectedItems && state.selectedItems.length > 0 && (
        <div className="w-full max-w-5xl px-4 py-1.5 bg-obsidian-950 border border-acid-500/40 text-xs font-mono text-acid-500">
          Selected Items: [{state.selectedItems.join(', ')}] | Max Value: {state.maxValue}
        </div>
      )}

      {isLCS && state.lcsString !== undefined && (
        <div className="w-full max-w-5xl px-4 py-1.5 bg-obsidian-950 border border-acid-500/40 text-xs font-mono text-acid-500">
          Current LCS: "{state.lcsString}" (Length: {state.lcsString.length})
        </div>
      )}

      {/* MCM Step-by-Step Backtrack Construction Stage */}
      {isMCM && (
        <div className="w-full max-w-5xl flex flex-col gap-3 p-4 bg-obsidian-950 border border-hairline font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-2">
            <div className="flex items-center gap-2 text-chalk-300">
              <Layers className="w-3.5 h-3.5 text-amber" />
              <span className="text-chalk-500 uppercase text-[10px] tracking-wider">
                {isBacktrackPhase ? 'OPTIMAL PARENTHESIZATION RECONSTRUCTION (BACKTRACKING)' : 'DP TABLE COMPUTATION STAGE'}
              </span>
            </div>
            {state.minCost !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-chalk-500">Min Multiplications:</span>
                <span className="text-acid-500 font-bold text-sm">{state.minCost}</span>
              </div>
            )}
          </div>

          {/* If during backtrack phase, render the active step-by-step combine diagram */}
          {isBacktrackPhase && backtrackInfo && (
            <div className="flex flex-wrap items-center justify-center gap-4 py-2 bg-obsidian-900 border border-amber/30 p-3">
              <div className="flex items-center gap-2">
                <span className="text-chalk-500">From Table s[{backtrackInfo.i}, {backtrackInfo.j}]:</span>
                <span className="px-2 py-0.5 bg-amber/20 border border-amber text-amber-glow font-bold">
                  Split Point k = {backtrackInfo.k}
                </span>
              </div>

              <div className="flex items-center gap-2 font-bold text-chalk-100">
                <span className="px-2.5 py-1 bg-obsidian-950 border border-electric-400 text-electric-400">
                  {backtrackInfo.leftSubchain}
                </span>
                <span className="text-amber">×</span>
                <span className="px-2.5 py-1 bg-obsidian-950 border border-electric-400 text-electric-400">
                  {backtrackInfo.rightSubchain}
                </span>
                <span className="text-chalk-500">➔</span>
                <span className="px-3 py-1 bg-acid-500/20 border border-acid-500 text-acid-500">
                  {backtrackInfo.combinedSubchain}
                </span>
              </div>
            </div>
          )}

          {/* Reconstructed Parenthesization Display */}
          {state.optimalParenthesization && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-acid-500/10 border border-acid-500/40">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-acid-500 shrink-0" />
                <span className="text-chalk-400">Reconstructed Parenthesization:</span>
                <span className="text-acid-500 font-bold text-sm tracking-wide">
                  {state.optimalParenthesization}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid Table Container */}
      <div className="w-full max-w-5xl overflow-x-auto overflow-y-auto max-h-[440px] pb-2 border border-hairline bg-obsidian-950">
        <table className="w-full border-collapse text-center text-xs font-mono">
          {/* Column Headers */}
          <thead>
            <tr className="bg-obsidian-950 sticky top-0 z-20">
              <th className="p-3 border-b border-r border-hairline text-chalk-500 font-semibold sticky left-0 bg-obsidian-950 z-30 uppercase tracking-wider text-[11px]">
                {isKnapsack ? 'Items \\ Cap' : isLCS ? 'Str1 \\ Str2' : isMCM ? 'Matrix i \\ j' : 'Row \\ Col'}
              </th>
              {colLabels.map((colText, cIdx) => {
                const activeColIndex = isMCM ? currentCol - 1 : currentCol;
                return (
                  <th
                    key={cIdx}
                    className={`p-3 border-b border-hairline font-semibold min-w-[64px] text-[11px] ${
                      cIdx === activeColIndex ? 'text-amber-glow bg-amber/10 border-b-2 border-amber' : 'text-chalk-500'
                    }`}
                  >
                    {colText}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {dpTable.map((row, rIdx) => {
              const activeRowIndex = isMCM ? currentRow - 1 : currentRow;
              return (
                <tr key={rIdx} className="hover:bg-obsidian-850/60 transition-colors">
                  {/* Row Header */}
                  <th
                    className={`p-3 border-r border-b border-hairline font-semibold text-left sticky left-0 z-10 text-[11px] ${
                      rIdx === activeRowIndex ? 'text-amber-glow bg-amber/10 border-r-2 border-amber' : 'text-chalk-400 bg-obsidian-950'
                    }`}
                  >
                    {rowLabels[rIdx] || `R${rIdx}`}
                  </th>

                  {/* Cells */}
                  {row.map((val, cIdx) => {
                    const cellClasses = getCellClasses(rIdx, cIdx, val);
                    const isCurrent = rIdx === activeRowIndex && cIdx === (isMCM ? currentCol - 1 : currentCol);
                    const isLowerTriangular = isMCM && rIdx > cIdx;
                    const splitK = isMCM && splitTable[rIdx]?.[cIdx];

                    return (
                      <td
                        key={cIdx}
                        className={`p-2.5 sm:p-3 border border-hairline transition-all duration-200 relative tabular-nums ${cellClasses}`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`${isCurrent ? 'scale-110 font-bold' : ''}`}>
                            {isLowerTriangular ? '—' : val === Infinity ? '∞' : val}
                          </span>
                          {isMCM && !isLowerTriangular && typeof splitK === 'number' && splitK > 0 && (
                            <span className="text-[9px] text-chalk-500 font-mono mt-0.5">
                              s={splitK}
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

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-2 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber/40 border border-amber"></span>
          <span>Active Cell (i, j)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-electric-500/40 border border-electric-400"></span>
          <span>Split Source Cells (i..k, k+1..j)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-acid-500/40 border border-acid-500"></span>
          <span>Backtrack / Solution Path</span>
        </div>
      </div>
    </div>
  );
};
