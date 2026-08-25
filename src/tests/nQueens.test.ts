import { describe, it, expect } from 'vitest';
import { nQueensSteps } from '../algorithms/nQueens';

describe('N-Queens Backtracking (M2 Backtracking)', () => {
  it('finds valid solutions for N=4', () => {
    const steps = Array.from(nQueensSteps({ n: 4, findAll: true }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.totalSolutionsFound).toBe(2);

    // Verify each solution is non-attacking
    finalStep.result.solutions.forEach((board: number[]) => {
      expect(board.length).toBe(4);
      for (let r1 = 0; r1 < 4; r1++) {
        for (let r2 = r1 + 1; r2 < 4; r2++) {
          const c1 = board[r1];
          const c2 = board[r2];
          // No same column
          expect(c1).not.toBe(c2);
          // No diagonal clash
          expect(Math.abs(r1 - r2)).not.toBe(Math.abs(c1 - c2));
        }
      }
    });
  });

  it('finds a valid solution for N=8', () => {
    const steps = Array.from(nQueensSteps({ n: 8, findAll: false }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.totalSolutionsFound).toBeGreaterThanOrEqual(1);

    const board = finalStep.result.firstSolution;
    expect(board).toBeDefined();
    expect(board.length).toBe(8);

    // Check all constraints programmatically
    for (let r1 = 0; r1 < 8; r1++) {
      for (let r2 = r1 + 1; r2 < 8; r2++) {
        const c1 = board[r1];
        const c2 = board[r2];
        expect(c1).not.toBe(c2);
        expect(Math.abs(r1 - r2)).not.toBe(Math.abs(c1 - c2));
      }
    }
  });
});
