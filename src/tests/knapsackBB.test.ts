import { describe, it, expect } from 'vitest';
import { knapsackBBSteps } from '../algorithms/knapsackBB';
import { knapsackDPSteps } from '../algorithms/knapsackDP';

describe('0-1 Knapsack Branch & Bound (M2 Branch & Bound)', () => {
  it('finds the same optimal value as Knapsack DP on benchmark 4-item input', () => {
    const weights = [2, 3, 4, 5];
    const values = [3, 4, 5, 6];
    const capacity = 5;

    const bbSteps = Array.from(knapsackBBSteps({ weights, values, capacity }));
    const dpSteps = Array.from(knapsackDPSteps({ weights, values, capacity }));

    const bbFinal = bbSteps[bbSteps.length - 1];
    const dpFinal = dpSteps[dpSteps.length - 1];

    expect(bbFinal.isFinal).toBe(true);
    expect(bbFinal.result.maxValue).toBe(dpFinal.result.maxValue);
    expect(bbFinal.result.totalWeight).toBeLessThanOrEqual(capacity);
    expect(bbFinal.result.prunedNodes).toBeGreaterThanOrEqual(1);
  });

  it('correctly prunes branches for capacity 10 knapsack', () => {
    const weights = [4, 7, 5, 3];
    const values = [40, 42, 25, 12];
    const capacity = 10;

    const bbSteps = Array.from(knapsackBBSteps({ weights, values, capacity }));
    const finalStep = bbSteps[bbSteps.length - 1];

    expect(finalStep.result.maxValue).toBe(65); // items 1 & 3 (wt 4+5=9, val 40+25=65)
    expect(finalStep.result.prunedNodes).toBeGreaterThan(0);
  });
});
