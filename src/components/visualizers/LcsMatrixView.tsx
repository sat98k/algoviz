import React from 'react';
import { LcsEngineResult, UnifiedLcsStep } from '../../algorithms/lcsEngine';

export interface LcsMatrixViewProps {
  engine: LcsEngineResult;
  currentStep: number;
  step?: UnifiedLcsStep;
  hoveredChar?: { string: 'X' | 'Y'; index: number } | null;
  onHoverCell?: (cell: { r: number; c: number } | null) => void;
}

export const LcsMatrixView: React.FC<LcsMatrixViewProps> = ({
  engine,
  currentStep,
  step: directStep,
  hoveredChar,
  onHoverCell,
}) => {
  const { X, Y, m, n, L, directions: finalDirections, steps } = engine;

  // Active step object
  const activeStep: UnifiedLcsStep = directStep ?? steps[currentStep] ?? steps[0];
  const state = activeStep.state;
  const phase = state.phase ?? 'traceback';
  const currI = state.currentRow;
  const currJ = state.currentCol;
  const comparison = state.comparison;
  const sourceCells = state.sourceCells ?? [];

  // Track path cells
  const pathCells = new Set<string>();
  if (state.backtrackPath) {
    for (const p of state.backtrackPath) {
      pathCells.add(`${p.r},${p.c}`);
    }
  }
  if (phase === 'traceback' || phase === 'final') {
    pathCells.add(`${currI},${currJ}`);
  }

  // Active comparison at pointer during fill or traceback
  const isComparing = (phase === 'fill' || phase === 'traceback') && currI > 0 && currJ > 0;

  // Helper to determine if a cell (r, c) has been computed at this step
  const isCellComputed = (r: number, c: number) => {
    if (r === 0 || c === 0) return true;
    if (phase === 'init') return false;
    if (phase === 'table_complete' || phase === 'traceback' || phase === 'final') return true;
    // During fill phase: row-major order up to (currI, currJ)
    if (r < currI) return true;
    if (r === currI && c <= currJ) return true;
    return false;
  };

  // Helper to get cell value
  const getCellValue = (r: number, c: number) => {
    if (r === 0 || c === 0) return 0;
    if (!isCellComputed(r, c)) return '—';
    return state.dpTable?.[r]?.[c] ?? L[r]?.[c] ?? 0;
  };

  // Helper to get arrow
  const getCellArrow = (r: number, c: number) => {
    if (r === 0 || c === 0) return '';
    if (!isCellComputed(r, c)) return '';
    const dir = state.directions?.[r]?.[c] ?? finalDirections[r]?.[c] ?? 'none';
    switch (dir) {
      case 'diag':
        return '↖';
      case 'up':
        return '↑';
      case 'left':
        return '←';
      case 'tie':
        return '↑←';
      default:
        return '';
    }
  };

  const getCellDir = (r: number, c: number) => {
    if (!isCellComputed(r, c)) return 'none';
    return state.directions?.[r]?.[c] ?? finalDirections[r]?.[c] ?? 'none';
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[380px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all gap-4">
      {/* Table status bar */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-obsidian-950 border border-hairline text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-chalk-500 uppercase text-[11px] tracking-wider">Matrix Pointer:</span>
          <span className="px-2 py-0.5 bg-amber/20 border border-amber text-amber-glow font-bold">
            L[{currI}][{currJ}] = {getCellValue(currI, currJ)}
          </span>
          <span className="px-2 py-0.5 bg-obsidian-900 border border-hairline text-chalk-400 text-[11px] uppercase tracking-wider">
            Phase: {phase.replace('_', ' ')}
          </span>
          {isComparing && (
            <span className="text-chalk-400 text-[11px] hidden sm:inline">
              (X[{currI}] = '{X[currI - 1]}' vs Y[{currJ}] = '{Y[currJ - 1]}')
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-chalk-500">Step:</span>
          <span className="text-acid-500 font-bold">{currentStep} / {steps.length - 1}</span>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="w-full max-w-4xl overflow-x-auto overflow-y-auto max-h-[460px] pb-2 border border-hairline bg-obsidian-950">
        <table className="w-full border-collapse text-center text-xs font-mono" role="grid" aria-label="LCS Dynamic Programming Matrix">
          {/* Column Headers (String Y) */}
          <thead>
            <tr className="bg-obsidian-950 sticky top-0 z-20">
              <th className="p-2 sm:p-3 border-b border-r border-hairline text-chalk-500 font-semibold sticky left-0 bg-obsidian-950 z-30 uppercase tracking-wider text-[11px]">
                X \ Y
              </th>
              {/* Column 0: ∅ */}
              <th
                className={`p-2 sm:p-3 border-b border-hairline font-semibold min-w-[58px] sm:min-w-[64px] text-[11px] ${
                  currJ === 0 ? 'bg-amber/15 text-amber-glow border-b-2 border-amber' : 'text-chalk-500'
                }`}
              >
                ∅ [0]
              </th>
              {/* String Y columns */}
              {Y.split('').map((char, idx) => {
                const colIdx = idx + 1;
                const isCurrentCol = isComparing && currJ === colIdx;
                const isHoveredCol = hoveredChar?.string === 'Y' && hoveredChar.index === colIdx;

                return (
                  <th
                    key={idx}
                    className={`p-2 sm:p-3 border-b border-hairline font-semibold min-w-[58px] sm:min-w-[64px] text-[11px] transition-colors ${
                      isCurrentCol
                        ? comparison === 'match'
                          ? 'bg-teal-500/20 text-teal-300 border-b-2 border-teal-400 font-bold'
                          : 'bg-amber/20 text-amber-glow border-b-2 border-amber font-bold'
                        : isHoveredCol
                        ? 'bg-teal-500/20 text-teal-300 border-b-2 border-teal-400 font-bold'
                        : 'text-chalk-400'
                    }`}
                  >
                    <div>{char}</div>
                    <div className="text-[10px] text-chalk-600">[{colIdx}]</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Rows for ∅ and String X */}
            {Array.from({ length: m + 1 }).map((_, rIdx) => {
              const isCurrentRow = isComparing && currI === rIdx;
              const isHoveredRow = hoveredChar?.string === 'X' && hoveredChar.index === rIdx;
              const rowChar = rIdx === 0 ? '∅' : X[rIdx - 1];

              return (
                <tr key={rIdx} className="hover:bg-obsidian-850/50 transition-colors">
                  {/* Row Header (String X) */}
                  <th
                    className={`p-2 sm:p-3 border-r border-b border-hairline font-semibold text-left sticky left-0 z-10 text-[11px] bg-obsidian-950 transition-colors ${
                      isCurrentRow
                        ? comparison === 'match'
                          ? 'bg-teal-500/20 text-teal-300 border-r-2 border-teal-400 font-bold'
                          : 'bg-amber/20 text-amber-glow border-r-2 border-amber font-bold'
                        : isHoveredRow
                        ? 'bg-teal-500/20 text-teal-300 border-r-2 border-teal-400 font-bold'
                        : 'text-chalk-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{rowChar}</span>
                      <span className="text-[10px] text-chalk-600">[{rIdx}]</span>
                    </div>
                  </th>

                  {/* Matrix Cells */}
                  {Array.from({ length: n + 1 }).map((__, cIdx) => {
                    const isPointer = rIdx === currI && cIdx === currJ;
                    const isPath = pathCells.has(`${rIdx},${cIdx}`);
                    const isSource = sourceCells.some((s) => s.r === rIdx && s.c === cIdx);
                    const arrow = getCellArrow(rIdx, cIdx);
                    const dir = getCellDir(rIdx, cIdx);
                    const val = getCellValue(rIdx, cIdx);
                    const computed = isCellComputed(rIdx, cIdx);

                    let cellStyle = 'bg-obsidian-950/60 border border-hairline text-chalk-300';

                    if (isPointer) {
                      cellStyle = 'bg-amber/25 border-2 border-amber text-amber-glow font-bold scale-105 z-10 shadow-md ring-1 ring-amber/50';
                    } else if (isSource) {
                      cellStyle = 'bg-electric-500/20 border-2 border-electric-400 text-electric-300 font-bold';
                    } else if (isPath) {
                      cellStyle = 'bg-teal-500/20 border-2 border-teal-500 text-teal-300 font-bold';
                    } else if (!computed) {
                      cellStyle = 'bg-obsidian-950/30 border border-hairline/40 text-chalk-600';
                    }

                    return (
                      <td
                        key={cIdx}
                        className={`p-2 sm:p-3 border border-hairline transition-all duration-150 relative tabular-nums cursor-pointer hover:bg-obsidian-800/60 ${cellStyle}`}
                        onMouseEnter={() => onHoverCell?.({ r: rIdx, c: cIdx })}
                        onMouseLeave={() => onHoverCell?.(null)}
                        tabIndex={0}
                        role="gridcell"
                        aria-label={`Cell L[${rIdx}][${cIdx}] = ${val}${arrow ? `, direction ${arrow}` : ''}`}
                      >
                        {arrow && (
                          <span
                            aria-hidden="true"
                            className={`absolute top-0.5 left-1 text-[10px] leading-none ${
                              dir === 'diag'
                                ? 'text-teal-400 font-bold'
                                : dir === 'tie'
                                ? 'text-amber-400'
                                : 'text-chalk-500'
                            }`}
                          >
                            {arrow}
                          </span>
                        )}
                        <span className={`block ${isPointer ? 'scale-110 font-bold' : ''}`}>
                          {val}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Matrix Legend */}
      <ul aria-label="Matrix Legend" className="flex flex-wrap items-center justify-center gap-5 mt-1 text-xs font-mono text-chalk-400">
        <li className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-amber/30 border border-amber text-amber-glow flex items-center justify-center text-[10px] font-bold">●</span>
          <span>Current active cell</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-electric-500/25 border-2 border-electric-400 flex items-center justify-center text-[10px] text-electric-300 font-bold">⇄</span>
          <span>Cells read from (source)</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-teal-500/25 border-2 border-teal-500 flex items-center justify-center text-[10px] text-teal-300 font-bold">★</span>
          <span>Traceback path</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[11px] font-bold border border-hairline text-teal-400">↖</span>
          <span>Match (diagonal)</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[11px] font-bold border border-hairline text-chalk-400">↑ ←</span>
          <span>Skip move (up / left)</span>
        </li>
      </ul>
    </div>
  );
};
