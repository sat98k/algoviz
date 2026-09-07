import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { AssemblyLineState } from '../../algorithms/assemblyLineScheduling';
import { Layers, X, HelpCircle } from 'lucide-react';

interface AssemblyLineDpMatrixProps {
  step: AlgorithmStep;
  onClose?: () => void;
}

export const AssemblyLineDpMatrix: React.FC<AssemblyLineDpMatrixProps> = ({ step, onClose }) => {
  const state = (step.state || {}) as AssemblyLineState;
  const n = state.numStations || 6;
  const f1 = state.f1 || [];
  const f2 = state.f2 || [];
  const l1 = state.l1 || [];
  const l2 = state.l2 || [];
  const highlights = step.highlights || {};
  const highlightedCells = highlights.cells || [];

  const currentRow = state.currentLine !== undefined ? state.currentLine - 1 : undefined;
  const currentCol = state.currentStation;

  const getCellStatus = (r: number, c: number) => {
    const match = highlightedCells.find((cell) => cell.r === r && cell.c === c);
    if (match) return match.status;

    // Fallback based on state if highlights.cells is not directly provided
    if (state.phase === 'forward' && currentRow === r && currentCol === c) {
      return 'active';
    }
    if (state.phase === 'init' && c === 0) {
      return 'active';
    }
    if (state.optimalPath?.some((p) => p.line === r + 1 && p.station === c + 1)) {
      return 'path';
    }
    return null;
  };

  const getCellClasses = (r: number, c: number, val: number | null | undefined) => {
    const status = getCellStatus(r, c);
    if (status === 'active') {
      return 'bg-amber/25 border-2 border-amber text-amber-glow font-bold scale-105 z-10 shadow-sm animate-pulse';
    }
    if (status === 'source') {
      return 'bg-electric-500/20 border-2 border-electric-400 text-electric-400 font-bold';
    }
    if (status === 'path') {
      return 'bg-acid-500/25 border-2 border-acid-500 text-acid-500 font-bold';
    }
    if (val === null || val === undefined) {
      return 'bg-obsidian-950/60 border border-hairline text-chalk-600 opacity-60';
    }
    return 'bg-obsidian-950/60 border border-hairline text-chalk-200';
  };

  const colLabels = Array.from({ length: n }, (_, idx) => `T${idx + 1}`);
  const rowHeaders = [
    { label: 'Line 1 (f1)', rowIdx: 0, values: f1, predecessors: l1 },
    { label: 'Line 2 (f2)', rowIdx: 1, values: f2, predecessors: l2 },
  ];

  return (
    <div className="flex flex-col w-full bg-obsidian-950 border border-hairline font-mono text-xs shadow-lg">
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-obsidian-900 border-b border-hairline">
        <div className="flex items-center gap-2 text-chalk-200">
          <Layers className="w-4 h-4 text-amber" />
          <span className="font-bold tracking-wider uppercase text-[11px]">DP State Matrix (f[i, j])</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-obsidian-950 border border-hairline text-chalk-400">
            2 × {n}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850 rounded transition-colors"
            title="Close DP Matrix Pane"
            aria-label="Close DP Matrix"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recurrence & Active Calculation Box */}
      {state.formulaExplanation && (
        <div className="p-2.5 bg-obsidian-950 border-b border-hairline flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-1 text-chalk-500 uppercase text-[10px] font-semibold">
            <HelpCircle className="w-3 h-3 text-amber" />
            <span>Recurrence Evaluation</span>
          </div>
          <p className="text-amber-glow font-mono leading-tight break-all">
            {state.formulaExplanation}
          </p>
        </div>
      )}

      {/* DP Matrix Table */}
      <div className="w-full overflow-x-auto p-3">
        <table className="w-full border-collapse text-center text-xs font-mono">
          <thead>
            <tr className="bg-obsidian-950">
              <th className="p-2 border-b border-r border-hairline text-chalk-500 font-semibold sticky left-0 bg-obsidian-950 z-20 text-[10px] uppercase tracking-wider">
                Line \ Task
              </th>
              {colLabels.map((colText, cIdx) => {
                const isCurrentCol = state.phase === 'forward' && cIdx === currentCol;
                return (
                  <th
                    key={cIdx}
                    className={`p-2 border-b border-hairline font-semibold min-w-[52px] text-[11px] ${
                      isCurrentCol
                        ? 'text-amber-glow bg-amber/10 border-b-2 border-amber'
                        : 'text-chalk-400'
                    }`}
                  >
                    {colText}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowHeaders.map(({ label, rowIdx, values, predecessors }) => {
              const isCurrentRow = state.phase === 'forward' && rowIdx === currentRow;
              return (
                <tr key={rowIdx} className="hover:bg-obsidian-850/40 transition-colors">
                  {/* Row Header */}
                  <th
                    className={`p-2 border-r border-b border-hairline font-semibold text-left sticky left-0 z-10 text-[11px] whitespace-nowrap ${
                      isCurrentRow
                        ? 'text-amber-glow bg-amber/10 border-r-2 border-amber'
                        : 'text-chalk-400 bg-obsidian-950'
                    }`}
                  >
                    {label}
                  </th>

                  {/* Cell Values */}
                  {Array.from({ length: n }, (_, cIdx) => {
                    const val = values[cIdx];
                    const pred = predecessors[cIdx];
                    const cellClasses = getCellClasses(rowIdx, cIdx, val);
                    const status = getCellStatus(rowIdx, cIdx);

                    return (
                      <td
                        key={cIdx}
                        className={`p-2 border border-hairline transition-all duration-200 relative tabular-nums ${cellClasses}`}
                      >
                        <div className="flex flex-col items-center justify-center min-h-[32px]">
                          <span
                            className={`text-xs ${
                              status === 'active' ? 'font-bold scale-110' : ''
                            }`}
                          >
                            {val === null || val === undefined ? '—' : val}
                          </span>
                          {/* Predecessor Line Indicator (l[j]) */}
                          {cIdx > 0 && typeof pred === 'number' && pred > 0 && (
                            <span
                              className={`text-[9px] font-mono mt-0.5 ${
                                status === 'path'
                                  ? 'text-acid-500 font-bold'
                                  : status === 'active'
                                  ? 'text-amber-glow font-bold'
                                  : 'text-chalk-500'
                              }`}
                              title={`Predecessor: Line ${pred}`}
                            >
                              l={pred}
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

      {/* Predecessor Legend & Meaning */}
      <div className="px-3 pb-3 pt-1 flex flex-col gap-2 border-t border-hairline/60">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-chalk-500">
          <span>f[i, j]: Min cost to reach station j on Line i</span>
          <span>l[i, j]: Predecessor line</span>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-chalk-400 pt-1 border-t border-hairline/40">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber/40 border border-amber"></span>
            <span>Active Cell</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-electric-500/40 border border-electric-400"></span>
            <span>Source Dependencies</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-acid-500/40 border border-acid-500"></span>
            <span>Optimal Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};
