import { describe, it, expect } from 'vitest';
import { fordFulkersonSteps } from '../algorithms/fordFulkerson';

describe('Ford-Fulkerson (M4 Network Flow / Edmonds-Karp)', () => {
  it('correctly calculates maximum flow = 23 for classic 6-node network', () => {
    const capacities = [
      [0, 16, 13, 0, 0, 0],
      [0, 0, 10, 12, 0, 0],
      [0, 4, 0, 0, 14, 0],
      [0, 0, 9, 0, 0, 20],
      [0, 0, 0, 7, 0, 4],
      [0, 0, 0, 0, 0, 0],
    ];

    const steps = Array.from(fordFulkersonSteps({ capacities, source: 0, sink: 5 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.maxFlow).toBe(23);
  });

  it('correctly calculates max flow for 4-node diamond network', () => {
    const capacities = [
      [0, 10, 10, 0],
      [0, 0, 2, 8],
      [0, 0, 0, 9],
      [0, 0, 0, 0],
    ];

    const steps = Array.from(fordFulkersonSteps({ capacities, source: 0, sink: 3 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.maxFlow).toBe(17);
  });
});
