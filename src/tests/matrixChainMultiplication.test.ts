import { describe, it, expect } from 'vitest';
import { matrixChainMultiplicationSteps } from '../algorithms/matrixChainMultiplication';

describe('Matrix Chain Multiplication (M2 Dynamic Programming)', () => {
  it('correctly solves classic textbook MCM problem [10, 20, 30, 40, 30] -> cost 30,000', () => {
    // 4 matrices:
    // A1 (10x20), A2 (20x30), A3 (30x40), A4 (40x30)
    // Known optimal cost = 30000
    // Optimal split: ((A1 (A2 A3)) A4)
    const dimensions = [10, 20, 30, 40, 30];
    const steps = Array.from(matrixChainMultiplicationSteps({ dimensions }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.minCost).toBe(30000);
    expect(finalStep.result.matrixCount).toBe(4);
    expect(finalStep.result.optimalParenthesization).toBe('(((A1 A2) A3) A4)');
  });

  it('correctly solves 3-matrix chain [10, 100, 5, 50] -> cost 7,500 with ((A1 A2) A3)', () => {
    // A1 (10x100), A2 (100x5), A3 (5x50)
    // (A1 A2) A3: 10*100*5 + 10*5*50 = 5000 + 2500 = 7500
    // A1 (A2 A3): 100*5*50 + 10*100*50 = 25000 + 50000 = 75000
    const dimensions = [10, 100, 5, 50];
    const steps = Array.from(matrixChainMultiplicationSteps({ dimensions }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.minCost).toBe(7500);
    expect(finalStep.result.optimalParenthesization).toBe('((A1 A2) A3)');
  });

  it('correctly solves single multiplication 2-matrix base chain [40, 20, 30]', () => {
    const dimensions = [40, 20, 30];
    const steps = Array.from(matrixChainMultiplicationSteps({ dimensions }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.minCost).toBe(24000);
    expect(finalStep.result.optimalParenthesization).toBe('(A1 A2)');
  });
});
