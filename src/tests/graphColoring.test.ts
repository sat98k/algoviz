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

  it('finds ALL valid colorings for K4 with k=4 colors (exactly 4! = 24 colorings)', () => {
    const k4Edges: [string, string][] = [
      ['0', '1'],
      ['0', '2'],
      ['0', '3'],
      ['1', '2'],
      ['1', '3'],
      ['2', '3'],
    ];

    const steps = Array.from(graphColoringSteps({ edgeList: k4Edges, numColors: 4, findMode: 'all' }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.solvable).toBe(true);
    expect(finalStep.result.findMode).toBe('all');
    expect(finalStep.result.numSolutions).toBe(24);
    expect(finalStep.result.allSolutions.length).toBe(24);

    // Verify every single discovered solution is a valid coloring
    for (const sol of finalStep.result.allSolutions) {
      for (const [u, v] of k4Edges) {
        expect(sol[u]).not.toBe(sol[v]);
      }
      expect(new Set(Object.values(sol)).size).toBe(4);
    }
  });

  it('correctly discovers all valid colorings for triangle K3 with k=3 (3! = 6)', () => {
    const k3Edges: [string, string][] = [
      ['0', '1'],
      ['1', '2'],
      ['2', '0'],
    ];

    const steps = Array.from(graphColoringSteps({ edgeList: k3Edges, numColors: 3, findMode: 'all' }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.solvable).toBe(true);
    expect(finalStep.result.numSolutions).toBe(6);
    expect(finalStep.result.allSolutions.length).toBe(6);
  });

  it('reports 0 solutions in find all mode when graph is unsolvable (K4 with k=3)', () => {
    const k4Edges: [string, string][] = [
      ['0', '1'],
      ['0', '2'],
      ['0', '3'],
      ['1', '2'],
      ['1', '3'],
      ['2', '3'],
    ];

    const steps = Array.from(graphColoringSteps({ edgeList: k4Edges, numColors: 3, findMode: 'all' }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.solvable).toBe(false);
    expect(finalStep.result.numSolutions).toBe(0);
    expect(finalStep.result.allSolutions.length).toBe(0);
  });

  it('exports distinct pseudocodes for first-solution vs all-solutions modes', async () => {
    const { GRAPH_COLORING_PSEUDOCODE_FIRST, GRAPH_COLORING_PSEUDOCODE_ALL } = await import(
      '../algorithms/graphColoring'
    );
    expect(GRAPH_COLORING_PSEUDOCODE_FIRST).toBeDefined();
    expect(GRAPH_COLORING_PSEUDOCODE_ALL).toBeDefined();
    expect(GRAPH_COLORING_PSEUDOCODE_FIRST[1]).toContain('return true');
    expect(GRAPH_COLORING_PSEUDOCODE_ALL[1]).toContain('recordSolution');
  });
});
