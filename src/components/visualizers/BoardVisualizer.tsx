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
    <div className="flex flex-col items-center w-full min-h-[400px] p-6 bg-slate-900/90 rounded-xl border border-slate-800 backdrop-blur">
      {/* Solution Status Bar */}
      <div className="flex items-center gap-4 mb-5 text-xs font-mono">
        <span className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-full text-slate-300">
          Board Size: <strong>{n} × {n}</strong>
        </span>
        <span className="px-3 py-1 bg-emerald-950/70 border border-emerald-500/40 rounded-full text-emerald-300">
          Solutions Found: <strong>{solutionCount}</strong>
        </span>
        {action === 'conflict' && (
          <span className="px-3 py-1 bg-rose-950/80 border border-rose-500/50 rounded-full text-rose-300 flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Conflict Detected!
          </span>
        )}
      </div>

      {/* Chessboard Grid Container */}
      <div className="p-3 bg-slate-950 rounded-xl border-4 border-slate-800 shadow-2xl">
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
                  className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-md transition-all duration-200 select-none ${
                    hasConflict
                      ? 'bg-rose-900/80 border-2 border-rose-500 shadow-inner'
                      : isCurrentCell
                      ? 'bg-sky-600/60 border-2 border-sky-400'
                      : hasQueen
                      ? 'bg-emerald-900/70 border border-emerald-500 shadow-md shadow-emerald-500/30'
                      : isThreatened && action === 'conflict'
                      ? 'bg-rose-950/30 border border-rose-900/40'
                      : isDarkTile
                      ? 'bg-slate-800/80 border border-slate-700/50'
                      : 'bg-slate-700/60 border border-slate-600/40'
                  }`}
                >
                  {/* Coordinates indicator on corners */}
                  <span className="absolute top-0.5 left-1 text-[8px] font-mono text-slate-500 pointer-events-none">
                    {r},{c}
                  </span>

                  {/* Queen Icon */}
                  {hasQueen && (
                    <div className="flex flex-col items-center justify-center animate-bounce duration-300">
                      <Crown
                        className={`w-6 h-6 md:w-7 md:h-7 ${
                          hasConflict
                            ? 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                            : 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
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
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-amber-300" />
          <span>Placed Queen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-rose-900 border border-rose-500"></span>
          <span>Attacking / Conflict</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-sky-600 border border-sky-400"></span>
          <span>Current Placement Attempt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-900 border border-emerald-500"></span>
          <span>Valid Position</span>
        </div>
      </div>
    </div>
  );
};
