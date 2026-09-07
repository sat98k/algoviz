import { describe, it, expect } from 'vitest';
import {
  tspSteps,
  DEFAULT_TSP_MATRIX_4,
  ensureSymmetricCostMatrix,
  createDefaultCostMatrix,
} from '../algorithms/tsp';

describe('Travelling Salesman Problem (Held-Karp Dynamic Programming)', () => {
  it('correctly solves the classic 4-city textbook problem -> optimal tour cost 80', () => {
    const steps = Array.from(tspSteps({ costMatrix: DEFAULT_TSP_MATRIX_4 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.optimalCost).toBe(80);
    expect(finalStep.result.numCities).toBe(4);

    // Tour should start and end at city 0 (A)
    const tour = finalStep.result.optimalTour;
    expect(tour[0]).toBe(0);
    expect(tour[tour.length - 1]).toBe(0);
    expect(tour.length).toBe(5); // 4 cities + return to start = 5 vertices

    // Verify all 4 cities are visited
    const uniqueVisited = new Set(tour);
    expect(uniqueVisited.size).toBe(4);
  });

  it('SINGLE SOURCE OF TRUTH: user-edited distances dynamically update graph, DP table, and optimal tour', () => {
    // Modify one distance: increase distance between A and B from 10 to 70
    // Original: A-B(10), A-C(15), A-D(20), B-C(35), B-D(25), C-D(30) -> Tour: A-B-D-C-A = 80
    // With A-B = 70:
    // Tour A-B-D-C-A becomes: 70 + 25 + 30 + 15 = 140
    // Tour A-D-B-C-A becomes: 20 + 25 + 35 + 15 = 95
    // Optimal tour should switch to cost 95!
    const modifiedMatrix = [
      [0, 70, 15, 20],
      [70, 0, 35, 25],
      [15, 35, 0, 30],
      [20, 25, 30, 0],
    ];

    const steps = Array.from(tspSteps({ costMatrix: modifiedMatrix, numCities: 4 }));
    const initialStep = steps[0];
    const finalStep = steps[steps.length - 1];

    // Verify graph state received the new distance matrix
    expect(initialStep.state.costMatrix[0][1]).toBe(70);
    expect(initialStep.state.costMatrix[1][0]).toBe(70);

    // Verify DP computation adapted
    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.optimalCost).toBe(95);

    // Verify tour route changed
    const tour = finalStep.result.optimalTour;
    expect(tour[0]).toBe(0);
    expect(tour[tour.length - 1]).toBe(0);
  });

  it('correctly ensures symmetric distances and locks diagonal to 0', () => {
    const rawUserMatrix = [
      [999, 14, 22],
      [14, 55, 18],
      [22, 18, 0],
    ];

    const normalized = ensureSymmetricCostMatrix(rawUserMatrix, 3);
    // Diagonal must be 0
    expect(normalized[0][0]).toBe(0);
    expect(normalized[1][1]).toBe(0);
    expect(normalized[2][2]).toBe(0);

    // Symmetric pairs
    expect(normalized[0][1]).toBe(14);
    expect(normalized[1][0]).toBe(14);
    expect(normalized[0][2]).toBe(22);
    expect(normalized[2][0]).toBe(22);
    expect(normalized[1][2]).toBe(18);
    expect(normalized[2][1]).toBe(18);
  });

  it('correctly resizes matrix when user changes city count', () => {
    const matrix3 = createDefaultCostMatrix(3);
    expect(matrix3).toHaveLength(3);
    expect(matrix3[0]).toHaveLength(3);

    const matrix6 = createDefaultCostMatrix(6);
    expect(matrix6).toHaveLength(6);
    expect(matrix6[0]).toHaveLength(6);

    const steps5 = Array.from(tspSteps({ numCities: 5 }));
    expect(steps5[0].state.numCities).toBe(5);
    expect(steps5[0].state.cities).toHaveLength(5);
    expect(steps5[0].state.costMatrix).toHaveLength(5);
  });

  it('correctly solves a 3-city triangle problem', () => {
    const costMatrix = [
      [0, 5, 10],
      [5, 0, 6],
      [10, 6, 0],
    ];

    const steps = Array.from(tspSteps({ costMatrix, numCities: 3 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    // Cycle: 0 -> 1 -> 2 -> 0 => 5 + 6 + 10 = 21
    expect(finalStep.result.optimalCost).toBe(21);
    expect(finalStep.result.optimalTour).toHaveLength(4);
  });

  it('generates well-structured steps across all phases', () => {
    const steps = Array.from(tspSteps({ costMatrix: DEFAULT_TSP_MATRIX_4 }));
    expect(steps.length).toBeGreaterThan(5);

    const phases = steps.map((s) => s.state.currentPhase);
    expect(phases).toContain('init');
    expect(phases).toContain('base');
    expect(phases).toContain('fill');
    expect(phases).toContain('close');
    expect(phases).toContain('reconstruct');
    expect(phases).toContain('complete');

    for (const step of steps) {
      expect(step.stepIndex).toBeGreaterThanOrEqual(0);
      expect(step.title).toBeDefined();
      expect(step.description).toBeDefined();
      expect(step.state.cities.length).toBe(4);
      expect(step.state.costMatrix.length).toBe(4);
      expect(step.state.dpTable).toBeDefined();
    }
  });

  it('supports custom city names and caps at maximum 8 cities', () => {
    const cityNames = ['Tokyo', 'Kyoto', 'Osaka', 'Nagoya'];
    const steps = Array.from(tspSteps({ costMatrix: DEFAULT_TSP_MATRIX_4, cityNames }));
    const initStep = steps[0];

    expect(initStep.state.cities[0].label).toBe('Tokyo');
    expect(initStep.state.cities[1].label).toBe('Kyoto');
    expect(initStep.state.cities[2].label).toBe('Osaka');
    expect(initStep.state.cities[3].label).toBe('Nagoya');
  });
});
