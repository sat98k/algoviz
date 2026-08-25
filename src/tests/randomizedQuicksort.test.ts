import { describe, it, expect } from 'vitest';
import { randomizedQuicksortSteps } from '../algorithms/randomizedQuicksort';

describe('Randomized Quicksort (M6 Randomized)', () => {
  it('correctly sorts input array and preserves multiset permutation across 10 random runs', () => {
    const originalArray = [38, 27, 43, 3, 9, 82, 10, 19, 50, 27, 3];

    for (let run = 0; run < 10; run++) {
      const steps = Array.from(randomizedQuicksortSteps({ array: [...originalArray] }));
      const finalStep = steps[steps.length - 1];

      expect(finalStep.isFinal).toBe(true);
      const sorted = finalStep.result as number[];

      // 1. Same length
      expect(sorted.length).toBe(originalArray.length);

      // 2. Monotonically non-decreasing (sorted)
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i]).toBeLessThanOrEqual(sorted[i + 1]);
      }

      // 3. Exact multiset equality
      const sortedOriginal = [...originalArray].sort((a, b) => a - b);
      expect(sorted).toEqual(sortedOriginal);
    }
  });

  it('handles reverse-sorted adversarial input', () => {
    const array = [90, 80, 70, 60, 50, 40, 30, 20, 10];
    const steps = Array.from(randomizedQuicksortSteps({ array }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90]);
  });

  it('handles single element array', () => {
    const steps = Array.from(randomizedQuicksortSteps({ array: [42] }));
    const finalStep = steps[steps.length - 1];
    expect(finalStep.result).toEqual([42]);
  });
});
