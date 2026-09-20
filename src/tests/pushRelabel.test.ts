import { describe, it, expect } from 'vitest';
import { pushRelabelSteps } from '../algorithms/pushRelabel';
import { fordFulkersonSteps } from '../algorithms/fordFulkerson';
import { edmondsKarpSteps } from '../algorithms/edmondsKarp';

describe('Push-Relabel (Preflow-Push) Algorithm (M4 Network Flow)', () => {
  const classicCapacities = [
    [0, 16, 13, 0, 0, 0],
    [0, 0, 10, 12, 0, 0],
    [0, 4, 0, 0, 14, 0],
    [0, 0, 9, 0, 0, 20],
    [0, 0, 0, 7, 0, 4],
    [0, 0, 0, 0, 0, 0],
  ];

  it('correctly calculates maximum flow = 23 for classic 6-node network', () => {
    const steps = Array.from(pushRelabelSteps({ capacities: classicCapacities, source: 0, sink: 5 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.maxFlow).toBe(23);
  });

  it('correctly calculates max flow = 17 for 4-node network', () => {
    const capacities = [
      [0, 10, 10, 0],
      [0, 0, 2, 8],
      [0, 0, 0, 9],
      [0, 0, 0, 0],
    ];

    const steps = Array.from(pushRelabelSteps({ capacities, source: 0, sink: 3 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.maxFlow).toBe(17);
  });

  it('three-way cross-validation: Push-Relabel == Edmonds-Karp == Ford-Fulkerson (all equal 23)', () => {
    const ffFinal = Array.from(fordFulkersonSteps({ capacities: classicCapacities, source: 0, sink: 5 })).pop()!;
    const ekFinal = Array.from(edmondsKarpSteps({ capacities: classicCapacities, source: 0, sink: 5 })).pop()!;
    const prFinal = Array.from(pushRelabelSteps({ capacities: classicCapacities, source: 0, sink: 5 })).pop()!;

    expect(prFinal.result.maxFlow).toBe(23);
    expect(ekFinal.result.maxFlow).toBe(23);
    expect(ffFinal.result.maxFlow).toBe(23);
    expect(prFinal.result.maxFlow).toBe(ekFinal.result.maxFlow);
    expect(prFinal.result.maxFlow).toBe(ffFinal.result.maxFlow);
  });
});
