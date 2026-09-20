import { describe, it, expect } from 'vitest';
import { setCoverSteps } from '../algorithms/setCover';

describe('Set Cover — Greedy Approximation (M7 Approximation Algorithms)', () => {
  it('correctly covers a 10-element universe using greedy selection', () => {
    const universeSize = 10;
    const subsets = [
      { id: 'S1', label: 'Set S1', elements: [1, 2, 3, 4] },
      { id: 'S2', label: 'Set S2', elements: [3, 4, 5, 6, 7] },
      { id: 'S3', label: 'Set S3', elements: [6, 7, 8] },
      { id: 'S4', label: 'Set S4', elements: [1, 5, 9, 10] },
      { id: 'S5', label: 'Set S5', elements: [2, 8, 10] },
    ];

    const steps = Array.from(setCoverSteps({ universeSize, subsets }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.isFullyCovered).toBe(true);
    expect(finalStep.result.coveredCount).toBe(10);
    expect(finalStep.result.totalSubsetsSelected).toBe(3);
    expect(finalStep.result.selectedSubsets).toEqual(['S2', 'S4', 'S5']);
  });

  it('selects exactly 1 subset when one subset covers the entire universe', () => {
    const universeSize = 5;
    const subsets = [
      { id: 'S1', label: 'Set S1', elements: [1, 2] },
      { id: 'S2', label: 'Set S2', elements: [1, 2, 3, 4, 5] },
      { id: 'S3', label: 'Set S3', elements: [3, 4] },
    ];

    const steps = Array.from(setCoverSteps({ universeSize, subsets }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.isFullyCovered).toBe(true);
    expect(finalStep.result.totalSubsetsSelected).toBe(1);
    expect(finalStep.result.selectedSubsets).toEqual(['S2']);
  });

  it('correctly covers disjoint partitions', () => {
    const universeSize = 6;
    const subsets = [
      { id: 'S1', label: 'Set S1', elements: [1, 2] },
      { id: 'S2', label: 'Set S2', elements: [3, 4] },
      { id: 'S3', label: 'Set S3', elements: [5, 6] },
    ];

    const steps = Array.from(setCoverSteps({ universeSize, subsets }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.isFullyCovered).toBe(true);
    expect(finalStep.result.totalSubsetsSelected).toBe(3);
  });
});
