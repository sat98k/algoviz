import { describe, it, expect } from 'vitest';
import { maxSubarraySteps } from '../algorithms/maxSubarray';

describe('Maximum Subarray (M1 Divide & Conquer / Kadane)', () => {
  it('correctly solves textbook Kadane example [-2, 1, -3, 4, -1, 2, 1, -5, 4]', () => {
    const array = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
    const steps = Array.from(maxSubarraySteps({ array }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.maxSum).toBe(6);
    expect(finalStep.result.indices).toEqual([3, 6]);
    expect(finalStep.result.subarray).toEqual([4, -1, 2, 1]);
  });

  it('correctly handles all negative array [-8, -3, -6, -2, -5]', () => {
    const array = [-8, -3, -6, -2, -5];
    const steps = Array.from(maxSubarraySteps({ array }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.maxSum).toBe(-2);
    expect(finalStep.result.subarray).toEqual([-2]);
  });

  it('correctly handles all positive array [1, 2, 3, 4]', () => {
    const array = [1, 2, 3, 4];
    const steps = Array.from(maxSubarraySteps({ array }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.maxSum).toBe(10);
    expect(finalStep.result.indices).toEqual([0, 3]);
  });
});
