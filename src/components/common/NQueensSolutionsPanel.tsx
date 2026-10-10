import React from 'react';
import { Crown, Grid3x3 } from 'lucide-react';

/** Index of the step at which each solution first appears (solution k → step index). */
export function findSolutionSteps(steps: { state?: { solutions?: number[][] } }[]): number[] {
  const found: number[] = [];
  let seen = 0;
  steps.forEach((s, i) => {
    const count = s.state?.solutions?.length ?? seen;
    while (seen < count) {
      found.push(i);
      seen++;
    }
  });
  return found;
}

interface NQueensSolutionsPanelProps {
  n: number;
  /** Solutions discovered up to the current step (board[row] = column, 0-based). */
  solutions: number[][];
  /** Step index at which each solution was found, same order as `solutions`. */
  foundAtStep: number[];
  isFinal: boolean;
  onJump: (stepIndex: number) => void;
}

/**
 * Gallery for "Find all solutions": every solution found so far, newest highlighted.
 * Each thumbnail jumps playback to the step where that solution was discovered.
 */
export const NQueensSolutionsPanel: React.FC<NQueensSolutionsPanelProps> = ({ n, solutions, foundAtStep, isFinal, onJump }) => {
  const latest = solutions.length - 1;
  return (
    <section aria-label="Solutions found" className="flex flex-col gap-3 p-5 bg-obsidian-900 border border-sem-final/50 border-l-4 border-l-sem-final">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-hairline">
        <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-sem-final-ink">
          <Grid3x3 className="w-3.5 h-3.5" />
          {isFinal ? 'Final answer: all solutions' : 'Solutions found so far'}
        </h3>
        <span className="font-mono text-xs text-chalk-300">
          {isFinal
            ? `The search is complete: ${solutions.length} solution${solutions.length === 1 ? '' : 's'} on a ${n}×${n} board.`
            : `${solutions.length} found so far. The search is still running.`}
        </span>
      </div>

      {solutions.length === 0 ? (
        <p className="font-sans text-sm text-chalk-400">
          {isFinal ? `No way to place ${n} non-attacking queens exists.` : 'No complete placement yet. Solutions appear here as soon as they are found.'}
        </p>
      ) : (
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3 max-h-[26rem] overflow-y-auto pr-1">
          {solutions.map((board, k) => {
            const positions = board.map((c, r) => `(${r + 1}, ${c + 1})`).join(' ');
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => onJump(foundAtStep[k])}
                  title={`Show the step where solution ${k + 1} was found`}
                  aria-label={`Solution ${k + 1}: queens at (row, column) ${positions}. Jump to the step where it was found.`}
                  className={`w-full flex flex-col items-center gap-1.5 p-2 border transition-colors ${
                    k === latest && !isFinal ? 'border-sem-current bg-sem-current/10' : 'border-hairline bg-obsidian-950 hover:border-sem-final/60'
                  }`}
                >
                  <span className="font-mono text-[11px] text-chalk-200">
                    Solution {k + 1}
                    {k === latest && !isFinal && <span className="text-sem-current-ink"> · just found</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className="grid w-full aspect-square border border-hairline"
                    style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: n * n }, (_, i) => {
                      const r = Math.floor(i / n);
                      const c = i % n;
                      return (
                        <span key={i} className={`flex items-center justify-center ${(r + c) % 2 ? 'bg-obsidian-850' : 'bg-obsidian-800/60'}`}>
                          {board[r] === c && <Crown className="w-[70%] h-[70%] text-sem-decision-ink" />}
                        </span>
                      );
                    })}
                  </span>
                  <span className="font-mono text-[11px] leading-tight text-chalk-500 break-all">{positions}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <p className="font-mono text-[11px] text-chalk-500">Positions are (row, column), counted from 1. Select a board to jump to the step where it was found.</p>
    </section>
  );
};
