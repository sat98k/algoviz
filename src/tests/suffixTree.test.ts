import { describe, it, expect } from 'vitest';
import { suffixTreeSteps } from '../algorithms/suffixTree';
import { naiveStringMatchSteps } from '../algorithms/naiveStringMatch';

const finalOf = (text: string, pattern: string) => {
  const steps = Array.from(suffixTreeSteps({ text, pattern }));
  return steps[steps.length - 1];
};

const naiveMatches = (text: string, pattern: string) => {
  const steps = Array.from(naiveStringMatchSteps({ text, pattern }));
  return steps[steps.length - 1].result.matchIndices as number[];
};

describe('Suffix Tree String Matching — Ukkonen (M3 String Matching)', () => {
  it('classic BANANA / ANA finds overlapping occurrences [1, 3]', () => {
    const f = finalOf('BANANA', 'ANA');
    expect(f.isFinal).toBe(true);
    expect(f.result.matchCount).toBe(2);
    expect(f.result.matchIndices).toEqual([1, 3]);
  });

  it('textbook string parity with KMP: single match at [10]', () => {
    const f = finalOf('ABABDABACDABABCABAB', 'ABABCABAB');
    expect(f.result.matchCount).toBe(1);
    expect(f.result.matchIndices).toEqual([10]);
  });

  it('finds multiple overlapping occurrences', () => {
    const f = finalOf('AABAACAADAABAABA', 'AABA');
    expect(f.result.matchIndices).toEqual([0, 9, 12]);
  });

  it('reports zero matches when the pattern is absent', () => {
    const f = finalOf('HELLO WORLD', 'XYZ');
    expect(f.result.matchCount).toBe(0);
    expect(f.result.matchIndices).toEqual([]);
  });

  it('single-character pattern hits every position', () => {
    expect(finalOf('AAAA', 'A').result.matchIndices).toEqual([0, 1, 2, 3]);
  });

  it('matches the full text exactly once at index 0', () => {
    expect(finalOf('MISSISSIPPI', 'MISSISSIPPI').result.matchIndices).toEqual([0]);
  });

  it('agrees with the naive matcher for every substring of several texts', () => {
    const texts = [
      'MISSISSIPPI',
      'ABABABAB',
      'AABAACAADAABAABA',
      'BANANA',
      'ABRACADABRA',
      'AAAAAAA',
      'THE QUICK BROWN FOX',
    ];
    for (const text of texts) {
      for (let i = 0; i < text.length; i++) {
        for (let len = 1; len <= text.length - i; len++) {
          const pattern = text.slice(i, i + len);
          expect(
            finalOf(text, pattern).result.matchIndices,
            `text="${text}" pattern="${pattern}"`
          ).toEqual(naiveMatches(text, pattern));
        }
      }
    }
  });
});
