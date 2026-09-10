import { describe, it, expect } from 'vitest';
import { rabinKarpSteps } from '../algorithms/rabinKarp';

describe('Rabin-Karp Algorithm (M3 String Matching)', () => {
  it('correctly matches textbook string "ABABDABACDABABCABAB" with pattern "ABABCABAB"', () => {
    const text = 'ABABDABACDABABCABAB';
    const pattern = 'ABABCABAB';

    const steps = Array.from(rabinKarpSteps({ text, pattern }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.matchCount).toBe(1);
    expect(finalStep.result.matchIndices).toEqual([10]);
    // this input collides once under (d=256, q=101): a hash hit that fails verification
    expect(finalStep.result.spuriousHits).toBe(1);
  });

  it('correctly finds multiple overlapping pattern occurrences', () => {
    const text = 'AABAACAADAABAABA';
    const pattern = 'AABA';

    const steps = Array.from(rabinKarpSteps({ text, pattern }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.matchCount).toBe(3);
    expect(finalStep.result.matchIndices).toEqual([0, 9, 12]);
  });

  it('correctly handles pattern not present in text', () => {
    const text = 'HELLO WORLD';
    const pattern = 'XYZ';

    const steps = Array.from(rabinKarpSteps({ text, pattern }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.matchCount).toBe(0);
    expect(finalStep.result.matchIndices).toEqual([]);
  });

  it('matches a numeric pattern "26" in "3141592653589793"', () => {
    const text = '3141592653589793';
    const pattern = '26';

    const steps = Array.from(rabinKarpSteps({ text, pattern }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.matchCount).toBe(1);
    expect(finalStep.result.matchIndices).toEqual([6]);
  });
});
