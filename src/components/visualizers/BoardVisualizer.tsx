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
          <span className="px-3 py-1 bg-obsidian-950 border border-rose-500/50 text-rose-300 flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> CONFLICT DETECTED
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
                  className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all duration-200 select-none ${
                    hasConflict
                      ? 'bg-rose-950/80 border border-rose-500'
                      : isCurrentCell
                      ? 'bg-amber/30 border border-amber'
                      : hasQueen
                      ? 'bg-obsidian-850 border border-amber/60'
                      : isThreatened && action === 'conflict'
                      ? 'bg-rose-950/20 border border-rose-900/30'
                      : isDarkTile
                      ? 'bg-obsidian-850 border border-hairline'
                      : 'bg-obsidian-800/60 border border-hairline'
                  }`}
                >
                  {/* Coordinates indicator on corners */}
                  <span className="absolute top-0.5 left-1 text-[8px] font-mono text-chalk-600 pointer-events-none">
                    {r},{c}
                  </span>

                  {/* Queen Icon */}
                  {hasQueen && (
                    <div className="flex flex-col items-center justify-center">
                      <Crown
                        className={`w-6 h-6 md:w-7 md:h-7 ${
                          hasConflict
                            ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                            : 'text-amber-glow drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
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
      <div className="flex flex-wrap items-center justify-center gap-5 mt-6 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-amber-glow" />
          <span>Placed Queen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-rose-950 border border-rose-500"></span>
          <span>Conflict / Attack</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber/40 border border-amber"></span>
          <span>Probe Cell</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-obsidian-850 border border-amber/60"></span>
          <span>Valid Placement</span>
        </div>
      </div>
    </div>
  );
};
