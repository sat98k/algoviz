import { describe, it, expect } from 'vitest';
import { algorithmRegistry } from '../config/algorithmRegistry';

describe('Problem & Intuition panel content', () => {
  it('registers all 32 algorithms', () => {
    expect(algorithmRegistry.length).toBe(32);
  });

  it.each(algorithmRegistry.map((algo) => [algo.id, algo] as const))(
    '%s has a non-empty problem statement and core idea',
    (_id, algo) => {
      expect(algo.problemStatement.trim().length).toBeGreaterThan(0);
      expect(algo.explanation.trim().length).toBeGreaterThan(0);
    }
  );
});
