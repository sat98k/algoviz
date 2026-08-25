import { describe, it, expect } from 'vitest';
import { floydWarshallSteps } from '../algorithms/floydWarshall';

describe('Floyd-Warshall (M4 Graph / All-Pairs Shortest Path)', () => {
  it('correctly computes all-pairs shortest paths on 4-node textbook graph', () => {
    const matrix: (number | null)[][] = [
      [0, 5, null, 10],
      [null, 0, 3, null],
      [null, null, 0, 1],
      [null, null, null, 0],
    ];

    const steps = Array.from(floydWarshallSteps({ matrix }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    const dist = finalStep.result.distanceMatrix;

    // Node 0 -> Node 3: directly 10, but through 0 -> 1 -> 2 -> 3 is 5 + 3 + 1 = 9
    expect(dist[0][3]).toBe(9);
    expect(dist[0][1]).toBe(5);
    expect(dist[0][2]).toBe(8);
    expect(dist[1][3]).toBe(4);
    expect(dist[3][0]).toBe(null);
  });

  it('correctly computes all-pairs shortest paths on 5-node graph with negative edge weights', () => {
    const matrix: (number | null)[][] = [
      [0, 3, 8, null, -4],
      [null, 0, null, 1, 7],
      [null, 4, 0, null, null],
      [2, null, -5, 0, null],
      [null, null, null, 6, 0],
    ];

    const steps = Array.from(floydWarshallSteps({ matrix }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    const dist = finalStep.result.distanceMatrix;

    expect(dist[0][0]).toBe(0);
    expect(dist[0][4]).toBe(-4);
    expect(dist[4][2]).toBe(1); // 4 -> 3 -> 2: 6 + (-5) = 1
  });
});
