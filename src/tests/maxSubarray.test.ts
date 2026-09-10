import { describe, it, expect } from 'vitest';
import { maxSubarraySteps } from '../algorithms/maxSubarray';

describe('Maximum Subarray (M1 Divide & Conquer)', () => {
  it('correctly solves textbook D&C example [-2, 1, -3, 4, -1, 2, 1, -5, 4]', () => {
    const array = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
    const steps = Array.from(maxSubarraySteps({ array }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.maxSum).toBe(6);
    expect(finalStep.result.indices).toEqual([3, 6]);
    expect(finalStep.result.subarray).toEqual([4, -1, 2, 1]);

    // Verify tree node states are recorded
    expect(finalStep.state.treeNodes.length).toBeGreaterThan(0);
  });

  it('correctly handles all negative array [-8, -3, -6, -2, -5]', () => {
    const array = [-8, -3, -6, -2, -5];
    const steps = Array.from(maxSubarraySteps({ array }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.maxSum).toBe(-2);
    expect(finalStep.result.subarray).toEqual([-2]);
    expect(finalStep.result.indices).toEqual([3, 3]);
  });

  it('correctly handles all positive array [1, 2, 3, 4]', () => {
    const array = [1, 2, 3, 4];
    const steps = Array.from(maxSubarraySteps({ array }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.maxSum).toBe(10);
    expect(finalStep.result.indices).toEqual([0, 3]);
    expect(finalStep.result.subarray).toEqual([1, 2, 3, 4]);
  });

  it('correctly handles single-element array [42]', () => {
    const array = [42];
    const steps = Array.from(maxSubarraySteps({ array }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.maxSum).toBe(42);
    expect(finalStep.result.indices).toEqual([0, 0]);
    expect(finalStep.result.subarray).toEqual([42]);
  });

  it('verifies all steps yield valid pseudocode lines and callFlow references', () => {
    const steps = Array.from(maxSubarraySteps({ array: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }));
    expect(steps.length).toBeGreaterThan(0);

    let callCount = 0;
    let returnCount = 0;

    for (const step of steps) {
      expect(step.codeLine).toBeDefined();
      const lines = Array.isArray(step.codeLine) ? step.codeLine : [step.codeLine!];
      for (const line of lines) {
        expect(line).toBeGreaterThanOrEqual(1);
        expect(line).toBeLessThanOrEqual(7);
      }

      if (step.callFlow) {
        expect(['call', 'return']).toContain(step.callFlow.type);
        expect(step.callFlow.nodeId).toBeDefined();
        if (step.callFlow.type === 'call') callCount++;
        if (step.callFlow.type === 'return') returnCount++;
      }
    }

    expect(callCount).toBeGreaterThan(0);
    expect(returnCount).toBeGreaterThan(0);
  });
});
