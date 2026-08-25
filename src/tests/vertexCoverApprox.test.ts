import { describe, it, expect } from 'vitest';
import { vertexCoverApproxSteps } from '../algorithms/vertexCoverApprox';

describe('Vertex Cover 2-Approximation (M7 Complexity & Approximation)', () => {
  it('finds a valid vertex cover for 7-node benchmark graph', () => {
    const edgeList: [string, string][] = [
      ['0', '1'],
      ['1', '2'],
      ['1', '3'],
      ['2', '4'],
      ['3', '4'],
      ['3', '5'],
      ['4', '5'],
      ['5', '6'],
    ];

    const steps = Array.from(vertexCoverApproxSteps({ edgeList }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    const coverVertices = finalStep.state.coveredVertices as string[];

    // Verify every edge is covered (at least one endpoint in cover)
    edgeList.forEach(([u, v]) => {
      const isCovered = coverVertices.includes(u) || coverVertices.includes(v);
      expect(isCovered).toBe(true);
    });

    // Verification of 2-approximation property: |C| = 2 * |M| <= 2 * OPT
    const matchingSize = finalStep.result.matchingSize;
    expect(coverVertices.length).toBe(2 * matchingSize);
    expect(finalStep.result.isCoverValid).toBe(true);
  });

  it('finds a valid vertex cover for star graph', () => {
    const edgeList: [string, string][] = [
      ['0', '1'],
      ['0', '2'],
      ['0', '3'],
      ['0', '4'],
    ];

    const steps = Array.from(vertexCoverApproxSteps({ edgeList }));
    const finalStep = steps[steps.length - 1];

    const coverVertices = finalStep.state.coveredVertices as string[];
    edgeList.forEach(([u, v]) => {
      expect(coverVertices.includes(u) || coverVertices.includes(v)).toBe(true);
    });
  });
});
