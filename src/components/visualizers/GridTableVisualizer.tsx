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

  // LCS: semantic colours for the two characters being compared, and ★ for characters already in the answer.
  const lcsComparison: 'match' | 'mismatch' | undefined = isLCS ? state.comparison : undefined;
  const lcsInAnswerRows = new Set<number>(isLCS && state.tracebackPhase ? (state.matchedIndicesStr1 ?? []).map((x: number) => x + 1) : []);
  const lcsInAnswerCols = new Set<number>(isLCS && state.tracebackPhase ? (state.matchedIndicesStr2 ?? []).map((x: number) => x + 1) : []);
  const headerClass = (isActive: boolean, inAnswer: boolean, side: 'row' | 'col') => {
    if (isActive && lcsComparison === 'match') return 'bg-sem-match/15 text-sem-match-ink border-sem-match';
    if (isActive && lcsComparison === 'mismatch') return 'bg-sem-mismatch/15 text-sem-mismatch-ink border-sem-mismatch';
    if (inAnswer) return 'bg-sem-final/15 text-sem-final-ink';
    if (isActive) return `bg-sem-current/10 text-sem-current-ink ${side === 'row' ? 'border-r-2' : 'border-b-2'} border-sem-current`;
    return '';
  };
  const headerMark = (isActive: boolean, inAnswer: boolean) =>
    isActive && lcsComparison === 'match' ? ' ✓' : isActive && lcsComparison === 'mismatch' ? ' ✗' : inAnswer ? ' ★' : '';

  // MCM: the diagonal being filled and the dimensions used by the current split.
  const mcmFilling = isMCM && !isBacktrackPhase && typeof state.chainLength === 'number' && state.chainLength >= 2 && state.optimalParenthesization === undefined;
  const mcmDims: number[] = isMCM ? state.dimensions ?? [] : [];
  const mcmActiveDims =
    isMCM && typeof state.currentK === 'number' && !isBacktrackPhase
      ? new Map<number, string>([
          [state.currentRow - 1, `p[${state.currentRow - 1}]`],
          [state.currentK, `p[${state.currentK}]`],
          [state.currentCol, `p[${state.currentCol}]`],
        ])
      : new Map<number, string>();

  const getCellArrow = (r: number, c: number) => highlightedCells.find((cell) => cell.r === r && cell.c === c)?.arrow;

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
      return 'bg-sem-current/15 border border-sem-current text-sem-current-ink font-bold scale-105 z-10 shadow-sm';
    }
    if (status === 'source') {
      return 'bg-sem-compare/15 border border-sem-compare text-sem-compare-ink font-bold';
    }
    if (status === 'path') {
      return 'bg-sem-final/20 border-2 border-sem-final text-sem-final-ink font-bold';
    }
    if (status === 'check') {
      return 'bg-sem-compare/10 border border-dashed border-sem-compare text-sem-compare-ink';
    }
    if (mcmFilling && c - r + 1 === state.chainLength) {
      return 'bg-sem-current/5 border border-dashed border-sem-current/40 text-chalk-300';
    }
    if (val === Infinity) {
      return 'bg-obsidian-950/60 border border-hairline text-chalk-600';
    }
    return 'bg-obsidian-950/60 border border-hairline text-chalk-300';
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[380px] p-6 bg-obsidian-900 border border-hairline transition-all gap-4">
      {/* Formula / Explanation banner */}
      {/* The page's "Rule for this cell" card shows the calculation whenever a rule exists */}
      {state.formulaExplanation && !state.dpRule && (
        <div className="w-full max-w-5xl px-4 py-2 bg-sem-formula/10 border border-sem-formula/40 text-xs md:text-sm font-mono text-sem-formula-ink flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase text-[11px] tracking-wider">ƒ Calculation:</span>
          <span className="break-all">{state.formulaExplanation}</span>
        </div>
      )}

      {/* MCM: dimension list with the three dimensions used by the current split */}
      {isMCM && mcmDims.length > 0 && (
        <div className="w-full max-w-5xl flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span className="text-chalk-500 text-[11px] uppercase tracking-wider mr-1">Dimensions p:</span>
            {mcmDims.map((d, idx) => {
              const tag = mcmActiveDims.get(idx);
              return (
                <span
                  key={idx}
                  className={`flex flex-col items-center px-2 py-1 border ${tag ? 'bg-sem-compare/15 border-sem-compare text-sem-compare-ink font-bold' : 'border-hairline text-chalk-300'}`}
                >
                  <span>{d}</span>
                  <span className="text-[11px] text-chalk-500">p[{idx}]</span>
                </span>
              );
            })}
          </div>
          {mcmFilling && (
            <p className="font-mono text-[11px] text-sem-current-ink">
              ▶ Filling chain length L = {state.chainLength}: the dashed diagonal holds every subchain of {state.chainLength} matrices.
            </p>
          )}
        </div>
      )}

      {/* Selected Items / LCS Output / MCM Output banner */}
      {isKnapsack && state.selectedItems && state.selectedItems.length > 0 && (
        <div className="w-full max-w-5xl px-4 py-1.5 bg-obsidian-950 border border-acid-500/40 text-xs font-mono text-acid-500">
          Selected Items: [{state.selectedItems.join(', ')}] | Max Value: {state.maxValue}
        </div>
      )}

      {isLCS && state.lcsString !== undefined && (
        <div className="w-full max-w-5xl px-4 py-1.5 bg-sem-final/10 border border-sem-final/40 text-xs font-mono text-sem-final-ink">
          {state.tracebackPhase && !step.isFinal ? 'LCS so far (built from the end): ' : 'LCS: '}"{state.lcsString}" (length {state.lcsString.length})
        </div>
      )}

      {/* MCM Step-by-Step Backtrack Construction Stage */}
      {isMCM && (
        <div className="w-full max-w-5xl flex flex-col gap-3 p-4 bg-obsidian-950 border border-hairline font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-2">
            <div className="flex items-center gap-2 text-chalk-300">
              <Layers className="w-3.5 h-3.5 text-amber" />
              <span className="text-chalk-500 uppercase text-[11px] tracking-wider">
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
                      headerClass(cIdx === activeColIndex, lcsInAnswerCols.has(cIdx), 'col') || 'text-chalk-500'
                    }`}
                  >
                    {colText}
                    {headerMark(cIdx === activeColIndex, lcsInAnswerCols.has(cIdx))}
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
                    className={`p-3 border-r border-b border-hairline font-semibold text-left sticky left-0 z-10 text-[11px] bg-obsidian-950 ${
                      headerClass(rIdx === activeRowIndex, lcsInAnswerRows.has(rIdx), 'row') || 'text-chalk-400'
                    }`}
                  >
                    {rowLabels[rIdx] || `R${rIdx}`}
                    {headerMark(rIdx === activeRowIndex, lcsInAnswerRows.has(rIdx))}
                  </th>

                  {/* Cells */}
                  {row.map((val, cIdx) => {
                    const cellClasses = getCellClasses(rIdx, cIdx, val);
                    const isCurrent = rIdx === activeRowIndex && cIdx === (isMCM ? currentCol - 1 : currentCol);
                    const isLowerTriangular = isMCM && rIdx > cIdx;
                    const splitK = isMCM && splitTable[rIdx]?.[cIdx];
                    const arrow = getCellArrow(isMCM ? rIdx + 1 : rIdx, isMCM ? cIdx + 1 : cIdx);

                    return (
                      <td
                        key={cIdx}
                        className={`p-2.5 sm:p-3 border border-hairline transition-all duration-200 relative tabular-nums ${cellClasses}`}
                      >
                        {arrow && (
                          <span aria-label={arrow === '↖' ? 'came from the diagonal' : arrow === '↑' ? 'came from above' : 'came from the left'} className="absolute top-0.5 left-1 text-[11px] font-bold leading-none">
                            {arrow}
                          </span>
                        )}
                        <div className="flex flex-col items-center">
                          <span className={`${isCurrent ? 'scale-110 font-bold' : ''}`}>
                            {isLowerTriangular ? '—' : val === Infinity ? '∞' : val}
                          </span>
                          {isMCM && !isLowerTriangular && typeof splitK === 'number' && splitK > 0 && (
                            <span className="text-[11px] text-chalk-500 font-mono mt-0.5">
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

      {/* Legend: the answer path also uses a thicker border, so it is distinguishable without colour */}
      <ul aria-label="Legend" className="flex flex-wrap items-center justify-center gap-5 mt-2 text-xs font-mono text-chalk-400">
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[11px] font-bold bg-sem-current/30 border border-sem-current text-sem-current-ink">▶</span>
          <span>Cell being computed</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[11px] font-bold bg-sem-compare/30 border border-sem-compare text-sem-compare-ink">⇄</span>
          <span>Cells it reads from</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[11px] font-bold bg-sem-final/30 border-2 border-sem-final text-sem-final-ink">★</span>
          <span>Answer path (traceback)</span>
        </li>
        {isLCS && (
          <li className="flex items-center gap-1.5">
            <span className="px-1 text-[11px] font-bold border border-hairline">↖ ↑ ←</span>
            <span>Where a value came from</span>
          </li>
        )}
      </ul>
    </div>
  );
};
