import { describe, it, expect } from 'vitest';
import { tspApproxSteps } from '../algorithms/tspApprox';
import { tspSteps } from '../algorithms/tsp';

describe('TSP 2-Approximation — MST-Doubling (M7 Approximation Algorithms)', () => {
  const textbookMatrix = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0],
  ];

  it('generates a valid Hamiltonian cycle visiting every city and returning to origin', () => {
    const steps = Array.from(tspApproxSteps({ costMatrix: textbookMatrix }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.isHamiltonian).toBe(true);

    const tour = finalStep.result.tourCityIndices as number[];
    expect(tour.length).toBe(5);
    expect(tour[0]).toBe(0);
    expect(tour[tour.length - 1]).toBe(0);

    // Unique cities visited before returning
    const uniqueCities = new Set(tour.slice(0, 4));
    expect(uniqueCities.size).toBe(4);
  });

  it('satisfies the 2-approximation bound against exact Held-Karp DP on shared 4-city instance', () => {
    const exactSteps = Array.from(tspSteps({ costMatrix: textbookMatrix }));
    const exactFinal = exactSteps[exactSteps.length - 1];
    const exactOptCost = exactFinal.result.optimalCost as number;

    expect(exactOptCost).toBe(80);

    const approxSteps = Array.from(tspApproxSteps({ costMatrix: textbookMatrix }));
    const approxFinal = approxSteps[approxSteps.length - 1];
    const approxCost = approxFinal.result.tourCost as number;

    // Must satisfy: approxCost <= 2 * exactOptCost
    expect(approxCost).toBeLessThanOrEqual(2 * exactOptCost);
    // On this matrix, approx cost is 95, well within 2 * 80 = 160
    expect(approxCost).toBe(95);
  });

  it('finds optimal tour on symmetric metric 3-city triangle instance', () => {
    const triangleMatrix = [
      [0, 7, 6],
      [7, 0, 8],
      [6, 8, 0],
    ];

    const exactSteps = Array.from(tspSteps({ costMatrix: triangleMatrix }));
    const exactOptCost = exactSteps[exactSteps.length - 1].result.optimalCost as number;
    expect(exactOptCost).toBe(21);

    const approxSteps = Array.from(tspApproxSteps({ costMatrix: triangleMatrix }));
    const approxCost = approxSteps[approxSteps.length - 1].result.tourCost as number;

    expect(approxCost).toBeLessThanOrEqual(2 * exactOptCost);
    expect(approxCost).toBe(21);
  });
});
