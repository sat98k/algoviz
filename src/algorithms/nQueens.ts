import { AlgorithmStep } from '../types/algorithm';

export interface NQueensState {
  n: number;
  board: number[]; // board[row] = col, -1 means unplaced
  currentRow: number;
  currentCol: number;
  conflicts: { r: number; c: number }[];
  threatLines?: { r: number; c: number }[];
  solutionCount: number;
  solutions: number[][];
  action: 'place' | 'conflict' | 'backtrack' | 'solution' | 'init';
}

export function* nQueensSteps(inputs: { n: number; findAll?: boolean }): Generator<AlgorithmStep<NQueensState>> {
  const n = Math.min(10, Math.max(1, inputs.n || 4));
  const findAll = inputs.findAll ?? false;

  let stepIndex = 0;
  let comparisons = 0;
  let backtracks = 0;
  let recursiveCalls = 0;

  const board: number[] = Array(n).fill(-1);
  const solutions: number[][] = [];

  yield {
    stepIndex: stepIndex++,
    title: `Initialize ${n}-Queens Board`,
    description: `Initialized empty ${n}x${n} chessboard. Objective: Place ${n} non-attacking queens.`,
    codeLine: 1,
    state: {
      n,
      board: [...board],
      currentRow: 0,
      currentCol: -1,
      conflicts: [],
      solutionCount: 0,
      solutions: [],
      action: 'init',
    },
    highlights: {},
    metrics: { comparisons, backtracks, recursiveCalls },
  };

  function isSafe(row: number, col: number): { safe: boolean; conflictingRow?: number } {
    for (let r = 0; r < row; r++) {
      comparisons++;
      const c = board[r];
      // Check column and diagonals
      if (c === col || Math.abs(c - col) === Math.abs(r - row)) {
        return { safe: false, conflictingRow: r };
      }
    }
    return { safe: true };
  }

  function* solveRow(row: number): Generator<AlgorithmStep<NQueensState>> {
    recursiveCalls++;

    if (row === n) {
      // Found solution
      solutions.push([...board]);
      yield {
        stepIndex: stepIndex++,
        title: `Valid ${n}-Queens Solution #${solutions.length} Found!`,
        description: `Successfully placed all ${n} queens on the board without conflicts. Positions: [${board.map((c, r) => `(${r},${c})`).join(', ')}].`,
        codeLine: 5,
        state: {
          n,
          board: [...board],
          currentRow: row,
          currentCol: -1,
          conflicts: [],
          solutionCount: solutions.length,
          solutions: [...solutions],
          action: 'solution',
        },
        highlights: {
          cells: board.map((c, r) => ({ r, c, status: 'path' as const })),
        },
        metrics: { comparisons, backtracks, recursiveCalls },
      };
      return;
    }

    for (let col = 0; col < n; col++) {
      // Try placing at (row, col)
      board[row] = col;
      const check = isSafe(row, col);

      if (check.safe) {
        yield {
          stepIndex: stepIndex++,
          title: `Place Queen at (${row}, ${col})`,
          description: `Row ${row}, Col ${col} is safe from attacking lines of previously placed queens. Proceeding to row ${row + 1}.`,
          codeLine: 2,
          state: {
            n,
            board: [...board],
            currentRow: row,
            currentCol: col,
            conflicts: [],
            solutionCount: solutions.length,
            solutions: [...solutions],
            action: 'place',
          },
          highlights: {
            cells: [{ r: row, c: col, status: 'active' }],
          },
          metrics: { comparisons, backtracks, recursiveCalls },
        };

        yield* solveRow(row + 1);

        if (solutions.length > 0 && !findAll) {
          return;
        }

        // Backtrack
        backtracks++;
        board[row] = -1;
        yield {
          stepIndex: stepIndex++,
          title: `Backtrack from Row ${row}, Col ${col}`,
          description: `Backtracking: removed queen from (${row}, ${col}) to try subsequent column placements.`,
          codeLine: 4,
          state: {
            n,
            board: [...board],
            currentRow: row,
            currentCol: col,
            conflicts: [],
            solutionCount: solutions.length,
            solutions: [...solutions],
            action: 'backtrack',
          },
          highlights: {
            cells: [{ r: row, c: col, status: 'check' }],
          },
          metrics: { comparisons, backtracks, recursiveCalls },
        };
      } else {
        const confRow = check.conflictingRow!;
        yield {
          stepIndex: stepIndex++,
          title: `Conflict at (${row}, ${col})`,
          description: `Cannot place queen at (${row}, ${col}) — attacked by existing queen at (${confRow}, ${board[confRow]}).`,
          codeLine: 3,
          state: {
            n,
            board: [...board],
            currentRow: row,
            currentCol: col,
            conflicts: [
              { r: row, c: col },
              { r: confRow, c: board[confRow] },
            ],
            solutionCount: solutions.length,
            solutions: [...solutions],
            action: 'conflict',
          },
          highlights: {
            cells: [
              { r: row, c: col, status: 'check' },
              { r: confRow, c: board[confRow], status: 'source' },
            ],
          },
          metrics: { comparisons, backtracks, recursiveCalls },
        };
        board[row] = -1;
      }
    }
  }

  yield* solveRow(0);

  const finalBoard = solutions.length > 0 ? solutions[0] : Array(n).fill(-1);

  yield {
    stepIndex: stepIndex++,
    title: 'N-Queens Search Complete',
    description: `Search completed. Found ${solutions.length} valid solution(s) with ${backtracks} backtracks and ${recursiveCalls} recursive calls.`,
    codeLine: 6,
    state: {
      n,
      board: finalBoard,
      currentRow: -1,
      currentCol: -1,
      conflicts: [],
      solutionCount: solutions.length,
      solutions,
      action: solutions.length > 0 ? 'solution' : 'init',
    },
    highlights: {
      cells: finalBoard.map((c, r) => ({ r, c, status: 'path' as const })),
    },
    metrics: { comparisons, backtracks, recursiveCalls },
    isFinal: true,
    result: {
      n,
      totalSolutionsFound: solutions.length,
      solutions,
      firstSolution: solutions[0] || null,
    },
  };
}
