import { describe, it, expect } from 'vitest';
import { subsetSumSteps } from '../algorithms/subsetSum';

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
});
