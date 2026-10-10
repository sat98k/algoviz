import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { Crown, AlertTriangle } from 'lucide-react';

interface BoardVisualizerProps {
  step: AlgorithmStep;
}

export const BoardVisualizer: React.FC<BoardVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const n: number = state.n || 4;
  const board: number[] = state.board || Array(n).fill(-1);
  const conflicts: { r: number; c: number }[] = state.conflicts || [];
  const action = state.action || 'init';
  const solutionCount = state.solutionCount || 0;

  const isConflictCell = (r: number, c: number) => {
    return conflicts.some((conf) => conf.r === r && conf.c === c);
  };

  const isUnderAttackByCurrent = (r: number, c: number) => {
    if (state.currentRow < 0 || state.currentCol < 0) return false;
    const qR = state.currentRow;
    const qC = state.currentCol;
    return r === qR || c === qC || Math.abs(r - qR) === Math.abs(c - qC);
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[400px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Solution Status Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-5 text-xs font-mono">
        <span className="px-3 py-1 bg-obsidian-950 border border-hairline text-chalk-300">
          BOARD: <strong>{n} × {n}</strong>
        </span>
        <span className="px-3 py-1 bg-obsidian-950 border border-acid-500/40 text-acid-500">
          SOLUTIONS FOUND: <strong>{solutionCount}</strong>
        </span>
        {action === 'conflict' && (
          <span className="px-3 py-1 bg-sem-mismatch/15 border border-sem-mismatch/60 text-sem-mismatch-ink flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> ✗ Conflict: this square is attacked
          </span>
        )}
      </div>

      {/* Chessboard Grid Container */}
      <div className="p-3 bg-obsidian-950 border border-hairline shadow-2xl">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: n }).map((_, r) =>
            Array.from({ length: n }).map((_, c) => {
              const hasQueen = board[r] === c;
              const isDarkTile = (r + c) % 2 === 1;
              const hasConflict = isConflictCell(r, c);
              const isCurrentCell = state.currentRow === r && state.currentCol === c;
              const isThreatened = isUnderAttackByCurrent(r, c) && !hasQueen;

              return (
                <div
                  key={`${r}-${c}`}
                  id={`tree-node-${r}-${c}`}
                  data-tree-node-id={`${r}-${c}`}
                  className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all duration-200 select-none ${
                    hasConflict
                      ? 'bg-sem-mismatch/15 border-2 border-sem-mismatch'
                      : isCurrentCell
                      ? 'bg-sem-current/20 border border-sem-current'
                      : hasQueen
                      ? 'bg-sem-decision/10 border border-sem-decision/70'
                      : isThreatened && action === 'conflict'
                      ? 'bg-sem-mismatch/5 border border-dashed border-sem-mismatch/40'
                      : isDarkTile
                      ? 'bg-obsidian-850 border border-hairline'
                      : 'bg-obsidian-800/60 border border-hairline'
                  }`}
                >
                  {/* Coordinates indicator on corners */}
                  <span className="absolute top-0.5 left-1 text-[8px] font-mono text-chalk-600 pointer-events-none">
                    {r + 1},{c + 1}
                  </span>

                  {/* Conflict mark: readable without colour */}
                  {hasConflict && (
                    <span className="absolute top-0.5 right-1 text-[11px] font-bold leading-none text-sem-mismatch-ink" aria-label="attacked">
                      ✗
                    </span>
                  )}

                  {/* Queen Icon */}
                  {hasQueen && (
                    <div className="flex flex-col items-center justify-center">
                      <Crown
                        className={`w-6 h-6 md:w-7 md:h-7 ${
                          hasConflict ? 'text-sem-mismatch-ink' : isCurrentCell ? 'text-sem-current-ink' : 'text-sem-decision-ink'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <ul aria-label="Legend" className="flex flex-wrap items-center justify-center gap-5 mt-6 text-xs font-mono text-chalk-400">
        <li className="flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-sem-decision-ink" />
          <span>Queen placed</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[10px] font-bold bg-sem-current/30 border border-sem-current text-sem-current-ink">▶</span>
          <span>Square being tried</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[10px] font-bold bg-sem-mismatch/20 border-2 border-sem-mismatch text-sem-mismatch-ink">✗</span>
          <span>Attacked (conflict)</span>
        </li>
      </ul>
    </div>
  );
};
