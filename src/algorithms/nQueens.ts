import { AlgorithmStep } from '../types/algorithm';

export interface NQueensState {
  n: number;
  board: number[]; // board[row] = col, -1 means unplaced
  currentRow: number;
  currentCol: number;
  conflicts: { r: number; c: number }[];
  threatLines?: { r: number; c: number }[];
  /** A rejected placement: who attacks it, along which line, and the squares in between. */
  attack?: NQueensAttack;
  solutionCount: number;
  solutions: number[][];
  action: 'place' | 'conflict' | 'backtrack' | 'solution' | 'init';
}

export interface NQueensAttack {
  attempted: { r: number; c: number };
  attacker: { r: number; c: number };
  /** Queens never share a row (one per row), so only these two lines are possible. */
  line: 'column' | 'diagonal';
  /** Squares strictly between the attacker and the attempted square. */
  between: { r: number; c: number }[];
}

/** The line of attack from an earlier queen (attacker.r < attempted.r) to the attempted square. */
export const attackBetween = (attacker: { r: number; c: number }, attempted: { r: number; c: number }): NQueensAttack => {
  const line = attacker.c === attempted.c ? 'column' : 'diagonal';
  const dc = Math.sign(attempted.c - attacker.c);
  const between: { r: number; c: number }[] = [];
  for (let k = 1; k < attempted.r - attacker.r; k++) between.push({ r: attacker.r + k, c: attacker.c + dc * k });
  return { attempted, attacker, line, between };
};

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
    description: `An empty ${n}×${n} board. Goal: place ${n} queens so that no two attack each other. Every row needs exactly one queen, so we fill the board one row at a time, trying columns from left to right. If a row has no safe square left, we go back and move an earlier queen (backtracking). Rows and columns are numbered from 1.`,
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
        description: `All ${n} queens are on the board and none attacks another. Positions (row, column): [${board.map((c, r) => `(${r + 1}, ${c + 1})`).join(', ')}].`,
        codeLine: 2,
        callFlow: row > 0 ? { type: 'return', nodeId: `${row - 1}-${board[row - 1]}` } : undefined,
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
          title: `Place Queen at Row ${row + 1}, Column ${col + 1}`,
          description: `Row ${row + 1}, column ${col + 1} is not attacked by any queen placed so far, so a queen goes here. ${row + 1 === n ? 'That was the last row.' : `Proceeding to row ${row + 2}.`}`,
          codeLine: [4, 5, 6],
          callFlow: { type: 'call', nodeId: `${row}-${col}` },
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
          title: `Backtrack from Row ${row + 1}, Column ${col + 1}`,
          description: `Dead end: with the queen at row ${row + 1}, column ${col + 1}, some row further down has no safe square. So this queen must be in the wrong place: lift it off (backtrack) and try the next column in row ${row + 1}.`,
          codeLine: 7,
          callFlow: { type: 'return', nodeId: `${row}-${col}` },
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
          title: `Conflict at Row ${row + 1}, Column ${col + 1}`,
          description: `Row ${row + 1}, column ${col + 1} is not safe: the queen at row ${confRow + 1}, column ${board[confRow] + 1} attacks it along the ${board[confRow] === col ? 'column' : 'diagonal'}. Try the next column.`,
          codeLine: 4,
          state: {
            n,
            board: [...board],
            currentRow: row,
            currentCol: col,
            conflicts: [
              { r: row, c: col },
              { r: confRow, c: board[confRow] },
            ],
            attack: attackBetween({ r: confRow, c: board[confRow] }, { r: row, c: col }),
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
    description: findAll
      ? `Search completed. Found all ${solutions.length} valid solution(s) with ${backtracks} backtracks and ${recursiveCalls} recursive calls.`
      : solutions.length > 0
      ? `Search stopped at the first valid solution (${backtracks} backtracks, ${recursiveCalls} recursive calls). This mode does not look for the remaining solutions.`
      : `Search completed: no valid placement exists (${backtracks} backtracks, ${recursiveCalls} recursive calls).`,
    codeLine: 8,
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
      stoppedAtFirst: !findAll,
      solutions,
      firstSolution: solutions[0] || null,
    },
  };
}
