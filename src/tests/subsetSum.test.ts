import { describe, it, expect } from 'vitest';
import { subsetSumSteps, SUBSET_SUM_PSEUDOCODE_FIRST, SUBSET_SUM_PSEUDOCODE_ALL } from '../algorithms/subsetSum';
import { getAlgorithmById } from '../config/algorithmRegistry';

describe('Subset Sum (M2 Backtracking)', () => {
  it('correctly finds achievable subset [4, 5] for target sum 9', () => {
    const numbers = [3, 34, 4, 12, 5, 2];
    const targetSum = 9;

    const steps = Array.from(subsetSumSteps({ numbers, targetSum }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.found).toBe(true);
    expect(finalStep.result.targetSum).toBe(9);
    expect(finalStep.result.totalSum).toBe(9);

    const subsetSum = finalStep.result.subset.reduce((a: number, b: number) => a + b, 0);
    expect(subsetSum).toBe(9);
  });

  it('correctly reports target unreachable when no valid subset exists', () => {
    const numbers = [3, 5, 7];
    const targetSum = 13; // 3+5=8, 3+7=10, 5+7=12, 3+5+7=15 -> 13 is unreachable

    const steps = Array.from(subsetSumSteps({ numbers, targetSum }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.found).toBe(false);
    expect(finalStep.result.subset).toEqual([]);
  });

  it('correctly finds exact match when target equals sum of all elements', () => {
    const numbers = [2, 4, 6];
    const targetSum = 12;

    const steps = Array.from(subsetSumSteps({ numbers, targetSum }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.found).toBe(true);
    expect(finalStep.result.subset).toEqual([2, 4, 6]);
  });

  it('stops at first solution [5, 10, 15] when findMode is first', () => {
    const numbers = [5, 10, 12, 13, 15, 18];
    const targetSum = 30;

    const steps = Array.from(subsetSumSteps({ numbers, targetSum, findMode: 'first' }));
    const finalStep = steps[steps.length - 1];

    expect(steps.length).toBe(20);
    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.found).toBe(true);
    expect(finalStep.result.subset).toEqual([5, 10, 15]);
    expect(finalStep.result.solutionsCount).toBe(1);
    expect(finalStep.result.allSolutions).toEqual([[5, 10, 15]]);
  });

  it('exhaustively finds all 3 solutions (91 steps) when findMode is all', () => {
    const numbers = [5, 10, 12, 13, 15, 18];
    const targetSum = 30;

    const config = getAlgorithmById('subset-sum');
    const steps = Array.from(config!.stepGenerator({ numbers, targetSum, findMode: 'all' }));
    const finalStep = steps[steps.length - 1];

    expect(steps.length).toBe(91);
    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.found).toBe(true);
    expect(finalStep.result.solutionsCount).toBe(3);
    expect(finalStep.result.allSolutions).toEqual([
      [5, 10, 15],
      [5, 12, 13],
      [12, 18],
    ]);
  });

  it('findMode all correctly reports 0 solutions when unreachable', () => {
    const numbers = [3, 5, 7];
    const targetSum = 13;

    const steps = Array.from(subsetSumSteps({ numbers, targetSum, findMode: 'all' }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.found).toBe(false);
    expect(finalStep.result.solutionsCount).toBe(0);
    expect(finalStep.result.allSolutions).toEqual([]);
  });

  it('exports distinct pseudocode for first solution vs all solutions', () => {
    expect(SUBSET_SUM_PSEUDOCODE_FIRST[1]).toContain('return SOLUTION(included)');
    expect(SUBSET_SUM_PSEUDOCODE_ALL[1]).toContain('recordSolution(included); return');
    expect(SUBSET_SUM_PSEUDOCODE_ALL[0]).toContain('SubsetSumAll');
  });
});
