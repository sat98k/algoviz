import { describe, it, expect } from 'vitest';
import { knapsackDPSteps } from '../algorithms/knapsackDP';

describe('0-1 Knapsack DP (M2 Dynamic Programming)', () => {
  it('correctly solves 4-item knapsack problem with capacity 5', () => {
    const weights = [2, 3, 4, 5];
    const values = [3, 4, 5, 6];
    const capacity = 5;

    const steps = Array.from(knapsackDPSteps({ weights, values, capacity }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.maxValue).toBe(7); // Items 1 & 2 (w: 2+3=5, v: 3+4=7)
    expect(finalStep.result.selectedItemIndices).toEqual([1, 2]);
    expect(finalStep.result.totalWeight).toBe(5);
  });

  it('correctly solves capacity 10 knapsack example', () => {
    const weights = [2, 3, 5, 7];
    const values = [1, 4, 7, 10];
    const capacity = 10;

    const steps = Array.from(knapsackDPSteps({ weights, values, capacity }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.maxValue).toBe(14); // Items 2 & 4 (wt 3+7=10, val 4+10=14)
    expect(finalStep.result.totalWeight).toBeLessThanOrEqual(capacity);
  });

  it('verifies all steps yield valid pseudocode lines in sync with algorithm registry', () => {
    const weights = [2, 3, 4, 5];
    const values = [3, 4, 5, 6];
    const capacity = 5;

    const steps = Array.from(knapsackDPSteps({ weights, values, capacity }));
    expect(steps.length).toBeGreaterThan(0);

    for (const step of steps) {
      expect(step.codeLine).toBeDefined();
      const lines = Array.isArray(step.codeLine) ? step.codeLine : [step.codeLine!];
      for (const line of lines) {
        expect(line).toBeGreaterThanOrEqual(1);
        expect(line).toBeLessThanOrEqual(13);
      }
    }
  });
});
