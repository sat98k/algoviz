import { describe, it, expect } from 'vitest';
import { fractionalKnapsackSteps } from '../algorithms/fractionalKnapsack';

describe('Fractional Knapsack (M1 Greedy)', () => {
  it('correctly solves textbook 3-item fractional knapsack problem with capacity 50', () => {
    // Items:
    // Item 1: wt = 10, val = 60, ratio = 6.0
    // Item 2: wt = 20, val = 100, ratio = 5.0
    // Item 3: wt = 30, val = 120, ratio = 4.0
    // Capacity = 50
    // Optimal: 100% of Item 1 (60), 100% of Item 2 (100), 20/30 (2/3) of Item 3 (80) -> Max Value = 240
    const weights = [10, 20, 30];
    const values = [60, 100, 120];
    const capacity = 50;

    const steps = Array.from(fractionalKnapsackSteps({ weights, values, capacity }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.maxValue).toBe(240);
    expect(finalStep.result.totalWeight).toBe(50);
    expect(finalStep.result.capacity).toBe(50);

    const itemsTaken = finalStep.result.itemsTaken;
    expect(itemsTaken).toHaveLength(3);

    // Item 1 (ratio 6) taken 100%
    const item1 = itemsTaken.find((it: any) => it.id === 1);
    expect(item1?.fraction).toBe(1);
    expect(item1?.weightTaken).toBe(10);
    expect(item1?.valueTaken).toBe(60);

    // Item 2 (ratio 5) taken 100%
    const item2 = itemsTaken.find((it: any) => it.id === 2);
    expect(item2?.fraction).toBe(1);
    expect(item2?.weightTaken).toBe(20);
    expect(item2?.valueTaken).toBe(100);

    // Item 3 (ratio 4) taken 2/3 (~0.667)
    const item3 = itemsTaken.find((it: any) => it.id === 3);
    expect(item3?.fraction).toBeCloseTo(0.667, 2);
    expect(item3?.weightTaken).toBe(20);
    expect(item3?.valueTaken).toBe(80);
  });

  it('correctly handles case where capacity exceeds total weight of all items', () => {
    const weights = [5, 10, 15];
    const values = [10, 30, 45];
    const capacity = 50;

    const steps = Array.from(fractionalKnapsackSteps({ weights, values, capacity }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.maxValue).toBe(85);
    expect(finalStep.result.totalWeight).toBe(30);
    expect(finalStep.result.itemsTaken.every((it: any) => it.fraction === 1)).toBe(true);
  });

  it('correctly handles unsorted input items and sorts by value-to-weight ratio descending', () => {
    // Unsorted order: ratio 4, ratio 6, ratio 5
    const weights = [30, 10, 20];
    const values = [120, 60, 100];
    const capacity = 50;

    const steps = Array.from(fractionalKnapsackSteps({ weights, values, capacity }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.maxValue).toBe(240);
    expect(finalStep.result.totalWeight).toBe(50);
  });
});
