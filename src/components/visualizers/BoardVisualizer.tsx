import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { Crown, AlertTriangle } from 'lucide-react';
import type { NQueensAttack } from '../../algorithms/nQueens';

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

  // A rejected placement: the attempted square, the attacking queen and the squares between them.
  const attack: NQueensAttack | undefined = action === 'conflict' ? state.attack : undefined;
  const same = (p: { r: number; c: number } | undefined, r: number, c: number) => !!p && p.r === r && p.c === c;
  const onAttackLine = (r: number, c: number) => !!attack && attack.between.some((p) => p.r === r && p.c === c);
  const arrow = attack ? (attack.line === 'column' ? '↓' : attack.attempted.c > attack.attacker.c ? '↘' : '↙') : '';

  return (
    <div className="flex flex-col items-center w-full min-h-[400px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Solution Status Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-5 text-sm font-sans">
        <span className="px-3 py-1 bg-obsidian-950 border border-hairline text-chalk-300">
          Board <strong className="font-mono">{n} × {n}</strong>
        </span>
        <span className="px-3 py-1 bg-obsidian-950 border border-sem-final/40 text-sem-final-ink">
          Solutions found <strong className="font-mono">{solutionCount}</strong>
        </span>
        {action === 'conflict' && (
          <span data-conflict-banner className="px-3 py-1 bg-sem-mismatch/15 border border-sem-mismatch/60 text-sem-mismatch-ink font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {attack
              ? `✗ Attacked along the ${attack.line} ${arrow} by the queen at (${attack.attacker.r + 1}, ${attack.attacker.c + 1})`
              : '✗ This square is attacked'}
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
              const isAttempted = attack ? same(attack.attempted, r, c) : isConflictCell(r, c) && state.currentRow === r;
              const isAttacker = attack ? same(attack.attacker, r, c) : isConflictCell(r, c) && !isAttempted;
              const isCurrentCell = state.currentRow === r && state.currentCol === c;
              const onLine = onAttackLine(r, c);

              return (
                <div
                  key={`${r}-${c}`}
                  id={`tree-node-${r}-${c}`}
                  data-tree-node-id={`${r}-${c}`}
                  className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all duration-200 select-none ${
                    isAttempted
                      ? 'bg-sem-mismatch/15 border-2 border-sem-mismatch'
                      : isAttacker
                      ? 'bg-sem-warning/15 border-2 border-sem-warning'
                      : onLine
                      ? 'bg-sem-mismatch/10 border-2 border-dashed border-sem-mismatch/60'
                      : isCurrentCell
                      ? 'bg-sem-current/20 border border-sem-current'
                      : hasQueen
                      ? 'bg-sem-decision/10 border border-sem-decision/70'
                      : isDarkTile
                      ? 'bg-obsidian-850 border border-hairline'
                      : 'bg-obsidian-800/60 border border-hairline'
                  }`}
                >
                  {/* Coordinates indicator on corners */}
                  <span className="absolute top-0.5 left-1 text-[11px] font-mono text-chalk-600 pointer-events-none">
                    {r + 1},{c + 1}
                  </span>

                  {/* Conflict marks: readable without colour */}
                  {isAttempted && (
                    <span data-attempted className="absolute top-0.5 right-1 text-sm font-bold leading-none text-sem-mismatch-ink" aria-label="attempted square, attacked">
                      ✗
                    </span>
                  )}
                  {isAttacker && (
                    <span data-attacker className="absolute bottom-0.5 inset-x-0 text-center font-sans text-[11px] font-bold leading-none text-sem-warning-ink" aria-label="attacking queen">
                      attacker
                    </span>
                  )}
                  {onLine && (
                    <span data-attack-line className="text-lg font-bold leading-none text-sem-mismatch-ink" aria-label={`line of attack (${attack!.line})`}>
                      {arrow}
                    </span>
                  )}

                  {/* Queen Icon */}
                  {hasQueen && (
                    <div className="flex flex-col items-center justify-center">
                      <Crown
                        className={`w-6 h-6 md:w-7 md:h-7 ${
                          isAttempted ? 'text-sem-mismatch-ink' : isAttacker ? 'text-sem-warning-ink' : isCurrentCell ? 'text-sem-current-ink' : 'text-sem-decision-ink'
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
      <ul aria-label="Legend" className="flex flex-wrap items-center justify-center gap-5 mt-6 text-xs font-sans text-chalk-400">
        <li className="flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-sem-decision-ink" />
          <span>Queen placed</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[11px] font-bold bg-sem-current/30 border border-sem-current text-sem-current-ink">▶</span>
          <span>Square being tried</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[11px] font-bold bg-sem-mismatch/20 border-2 border-sem-mismatch text-sem-mismatch-ink">✗</span>
          <span>Rejected square</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[11px] font-bold bg-sem-warning/20 border-2 border-sem-warning text-sem-warning-ink">♛</span>
          <span>Attacking queen</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="px-1 text-[11px] font-bold border-2 border-dashed border-sem-mismatch/60 text-sem-mismatch-ink">↓↘</span>
          <span>Line of attack</span>
        </li>
      </ul>
    </div>
  );
};
