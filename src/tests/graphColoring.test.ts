import { describe, it, expect } from 'vitest';
import { graphColoringSteps } from '../algorithms/graphColoring';

describe('Graph Coloring (Backtracking)', () => {
  it('correctly colors a 5-node planar graph with k=3 colors', () => {
    const edgeList: [string, string][] = [
      ['0', '1'],
      ['0', '2'],
      ['0', '3'],
      ['1', '2'],
      ['2', '3'],
    ];

    const gen = graphColoringSteps({ edgeList, numColors: 3 });
    const steps = Array.from(gen);

    expect(steps.length).toBeGreaterThan(1);
    const finalStep = steps[steps.length - 1];
    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.solvable).toBe(true);

    const assignment = finalStep.result.assignment as Record<string, number>;
    // All vertices must have a valid color in 1..3
    for (const v of ['0', '1', '2', '3']) {
      expect(assignment[v]).toBeGreaterThanOrEqual(1);
      expect(assignment[v]).toBeLessThanOrEqual(3);
    }

    // No adjacent vertices should share the same color
    for (const [u, v] of edgeList) {
      expect(assignment[u]).not.toBe(assignment[v]);
    }
  });

  it('correctly detects that K4 cannot be colored with k=3 colors (insufficient colors)', () => {
    // Complete graph K4 requires 4 colors
    const edgeList: [string, string][] = [
      ['0', '1'],
      ['0', '2'],
      ['0', '3'],
      ['1', '2'],
      ['1', '3'],
      ['2', '3'],
    ];

    const gen = graphColoringSteps({ edgeList, numColors: 3 });
    const steps = Array.from(gen);

    const finalStep = steps[steps.length - 1];
    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.solvable).toBe(false);

    // Backtracks must have occurred
    expect(finalStep.result.backtracks).toBeGreaterThan(0);
  });

  it('correctly colors K4 when k=4 colors are provided', () => {
    const edgeList: [string, string][] = [
      ['0', '1'],
      ['0', '2'],
      ['0', '3'],
      ['1', '2'],
      ['1', '3'],
      ['2', '3'],
    ];

    const gen = graphColoringSteps({ edgeList, numColors: 4 });
    const steps = Array.from(gen);

    const finalStep = steps[steps.length - 1];
    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.solvable).toBe(true);

    const assignment = finalStep.result.assignment as Record<string, number>;
    // All 4 vertices must have distinct colors
    const usedColors = new Set(Object.values(assignment));
    expect(usedColors.size).toBe(4);

    for (const [u, v] of edgeList) {
      expect(assignment[u]).not.toBe(assignment[v]);
    }
  });

  it('correctly identifies C5 (odd cycle) as not 2-colorable and C6 as 2-colorable', () => {
    // C5 (5-cycle): not bipartite, impossible with 2 colors
    const c5Edges: [string, string][] = [
      ['0', '1'],
      ['1', '2'],
      ['2', '3'],
      ['3', '4'],
      ['4', '0'],
    ];
    const stepsC5 = Array.from(graphColoringSteps({ edgeList: c5Edges, numColors: 2 }));
    expect(stepsC5[stepsC5.length - 1].result.solvable).toBe(false);

    // C6 (6-cycle): bipartite, possible with 2 colors
    const c6Edges: [string, string][] = [
      ['0', '1'],
      ['1', '2'],
      ['2', '3'],
      ['3', '4'],
      ['4', '5'],
      ['5', '0'],
    ];
    const stepsC6 = Array.from(graphColoringSteps({ edgeList: c6Edges, numColors: 2 }));
    expect(stepsC6[stepsC6.length - 1].result.solvable).toBe(true);
  });
});
