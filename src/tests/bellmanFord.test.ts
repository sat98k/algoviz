import { describe, it, expect } from 'vitest';
import { bellmanFordSteps } from '../algorithms/bellmanFord';

const finalOf = (inputs: any) => {
  const steps = Array.from(bellmanFordSteps(inputs));
  return steps[steps.length - 1];
};

describe('Bellman-Ford Algorithm (M4 Graph — Single-Source Shortest Path)', () => {
  it('computes the CLRS textbook shortest distances from S', () => {
    const f = finalOf({});
    expect(f.isFinal).toBe(true);
    expect(f.result.hasNegativeCycle).toBe(false);
    expect(f.result.distances).toEqual({ S: 0, T: 2, X: 4, Y: 7, Z: -2 });
  });

  it('reconstructs shortest paths through negative edges', () => {
    const f = finalOf({});
    expect(f.result.paths['X'].path).toBe('S → Y → X'); // 7 + (-3) = 4
    expect(f.result.paths['Z'].path).toBe('S → Y → X → T → Z'); // 7 - 3 - 2 - 4 = -2
  });

  it('handles a negative edge with no cycle', () => {
    const matrix = [
      [0, 4, null],
      [null, 0, -3],
      [null, null, 0],
    ];
    const f = finalOf({ matrix, nodeLabels: ['A', 'B', 'C'], source: 0 });
    expect(f.result.distances).toEqual({ A: 0, B: 4, C: 1 });
  });

  it('detects a reachable negative-weight cycle', () => {
    const matrix = [
      [0, 1, null, null],
      [null, 0, 2, null],
      [null, null, 0, 3],
      [null, -6, null, 0],
    ];
    const f = finalOf({ matrix, nodeLabels: ['A', 'B', 'C', 'D'], source: 0 });
    expect(f.isFinal).toBe(true);
    expect(f.result.hasNegativeCycle).toBe(true);
    expect(typeof f.result.negativeCycleEdge).toBe('string');
  });

  it('marks unreachable vertices as ∞ / null', () => {
    const matrix = [
      [0, 5, null],
      [null, 0, null],
      [null, null, 0],
    ];
    const f = finalOf({ matrix, nodeLabels: ['A', 'B', 'C'], source: 0 });
    expect(f.result.distances.C).toBeNull();
    expect(f.result.paths['C'].path).toBe('(unreachable)');
  });

  it('early-terminates when a full pass relaxes nothing', () => {
    const steps = Array.from(
      bellmanFordSteps({
        matrix: [
          [0, 1, null],
          [null, 0, 1],
          [null, null, 0],
        ],
        nodeLabels: ['A', 'B', 'C'],
        source: 0,
      })
    );
    expect(steps.some((s) => s.title.includes('stop early'))).toBe(true);
    expect(steps[steps.length - 1].result.distances).toEqual({ A: 0, B: 1, C: 2 });
  });

  it('respects a non-zero source index', () => {
    const f = finalOf({});
    const fromZ = finalOf({ source: 4 });
    expect(f.result.source).toBe('S');
    expect(fromZ.result.source).toBe('Z');
    expect(fromZ.result.distances.Z).toBe(0);
  });
});
