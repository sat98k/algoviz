import { describe, it, expect } from 'vitest';
import { huffmanSteps } from '../algorithms/huffman';

describe('Huffman Coding (M1 Greedy)', () => {
  it('correctly constructs prefix codes for ABRACADABRA', () => {
    const text = 'ABRACADABRA';
    const steps = Array.from(huffmanSteps({ text }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    const { codeTable, encodedBits, originalBits, compressedBits } = finalStep.result;

    // Check every character has a code
    expect(codeTable['A']).toBeDefined();
    expect(codeTable['B']).toBeDefined();
    expect(codeTable['R']).toBeDefined();
    expect(codeTable['C']).toBeDefined();
    expect(codeTable['D']).toBeDefined();

    // Verify prefix-free property: No code is a prefix of another code
    const codes = Object.values(codeTable) as string[];
    for (let i = 0; i < codes.length; i++) {
      for (let j = 0; j < codes.length; j++) {
        if (i !== j) {
          expect(codes[j].startsWith(codes[i])).toBe(false);
        }
      }
    }

    // Most frequent character 'A' (freq 5) should have the shortest or equal shortest code length
    const aLen = codeTable['A'].length;
    const cLen = codeTable['C'].length;
    expect(aLen).toBeLessThanOrEqual(cLen);

    // Compressed size must be less than uncompressed 8-bit ASCII size
    expect(compressedBits).toBeLessThan(originalBits);
    expect(encodedBits.length).toBe(compressedBits);
  });

  it('correctly handles simple repeating string', () => {
    const text = 'BBAA';
    const steps = Array.from(huffmanSteps({ text }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.codeTable['A']).toBeDefined();
    expect(finalStep.result.codeTable['B']).toBeDefined();
  });
});
