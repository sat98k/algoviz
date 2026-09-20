import { describe, it, expect } from 'vitest';
import { kargerMinCutSteps } from '../algorithms/kargerMinCut';

describe('Karger’s Min-Cut — Randomized Contraction (M6 Randomized Algorithms)', () => {
  it('correctly finds the known minimum cut of 2 on a 2-bridge barbell graph across multiple trials', () => {
    // Barbell graph: 2 triangles connected by 2 bridge edges (1-3, 2-4)
    const edgeList: [string, string][] = [
      ['0', '1'],
      ['1', '2'],
      ['2', '0'],
      ['3', '4'],
      ['4', '5'],
      ['5', '3'],
      ['1', '3'],
      ['2', '4'],
    ];

    let minCutFound = Infinity;
    const trials = 35; // Standard repetition: probability of finding min-cut approaches 1

    for (let t = 0; t < trials; t++) {
      const steps = Array.from(kargerMinCutSteps({ edgeList }));
      const finalStep = steps[steps.length - 1];
      expect(finalStep.isFinal).toBe(true);

      const cutSize = finalStep.result.cutSize as number;
      if (cutSize < minCutFound) {
        minCutFound = cutSize;
      }
    }

    // Global min-cut of this graph is 2
    expect(minCutFound).toBe(2);
  });

  it('correctly finds bridge of size 1 connecting two disjoint clusters', () => {
    // 2 triangles connected by a single bridge edge (2-3)
    const edgeList: [string, string][] = [
      ['0', '1'],
      ['1', '2'],
      ['2', '0'],
      ['3', '4'],
      ['4', '5'],
      ['5', '3'],
      ['2', '3'], // single bridge
    ];

    let minCutFound = Infinity;
    const trials = 30;

    for (let t = 0; t < trials; t++) {
      const steps = Array.from(kargerMinCutSteps({ edgeList }));
      const finalStep = steps[steps.length - 1];
      const cutSize = finalStep.result.cutSize as number;
      if (cutSize < minCutFound) {
        minCutFound = cutSize;
      }
    }

    expect(minCutFound).toBe(1);
  });

  it('contracts until exactly 2 super-nodes remain and generates valid partitions', () => {
    const steps = Array.from(kargerMinCutSteps({}));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.state.nodes.length).toBe(2);
    expect(finalStep.result.cutSetA.length + finalStep.result.cutSetB.length).toBe(6);
    expect(finalStep.result.cutSize).toBeGreaterThanOrEqual(2);
  });
});
