import { describe, it, expect } from 'vitest';
import { lcsSteps } from '../algorithms/lcs';

describe('Longest Common Subsequence (M2 Dynamic Programming)', () => {
  it('correctly solves textbook LCS problem for "ABCBDAB" and "BDCAB"', () => {
    const str1 = 'ABCBDAB';
    const str2 = 'BDCAB';

    const steps = Array.from(lcsSteps({ str1, str2 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.lcsLength).toBe(4);
    // BCAB or BDAB are valid LCS of length 4
    expect(['BCAB', 'BDAB', 'BCBA']).toContain(finalStep.result.lcsString);
  });

  it('correctly solves LCS for "AGGTAB" and "GXTXAYB"', () => {
    const str1 = 'AGGTAB';
    const str2 = 'GXTXAYB';

    const steps = Array.from(lcsSteps({ str1, str2 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.lcsLength).toBe(4);
    expect(finalStep.result.lcsString).toBe('GTAB');
  });

  it('handles disjoint strings with 0 common subsequence', () => {
    const str1 = 'ABC';
    const str2 = 'XYZ';

    const steps = Array.from(lcsSteps({ str1, str2 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.lcsLength).toBe(0);
    expect(finalStep.result.lcsString).toBe('');
  });
});
