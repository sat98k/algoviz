import { describe, it, expect } from 'vitest';
import { grahamScanSteps } from '../algorithms/grahamScan';
import { jarvisMarchSteps } from '../algorithms/jarvisMarch';
import { fordFulkersonSteps } from '../algorithms/fordFulkerson';
import { edmondsKarpSteps } from '../algorithms/edmondsKarp';
import { pushRelabelSteps } from '../algorithms/pushRelabel';
import { tspSteps } from '../algorithms/tsp';
import { tspApproxSteps } from '../algorithms/tspApprox';

describe('EXPLICIT CROSS-VALIDATION VERIFICATION', () => {
  it('1. Jarvis’ March Hull == Graham’s Scan Hull', () => {
    const points = [
      { x: 100, y: 100 },
      { x: 150, y: 250 },
      { x: 250, y: 300 },
      { x: 350, y: 220 },
      { x: 400, y: 120 },
      { x: 280, y: 180 },
      { x: 200, y: 150 },
      { x: 220, y: 80 },
    ];

    const gFinal = Array.from(grahamScanSteps({ points })).pop()!;
    const jFinal = Array.from(jarvisMarchSteps({ points })).pop()!;

    console.log('--- CHECK 1: CONVEX HULL CROSS-VALIDATION ---');
    console.log('Graham Scan Hull Vertices:', JSON.stringify(gFinal.result.hullVertices));
    console.log('Jarvis March Hull Vertices:', JSON.stringify(jFinal.result.hullVertices));
    console.log('Graham Hull Count:', gFinal.result.hullVertexCount, '| Jarvis Hull Count:', jFinal.result.hullVertexCount);

    expect(jFinal.result.hullVertexCount).toBe(gFinal.result.hullVertexCount);
    expect(jFinal.result.hullVertexCount).toBe(6);
  });

  it('2. Max Flow Agreement: Ford-Fulkerson == Edmonds-Karp == Push-Relabel', () => {
    const capacities = [
      [0, 16, 13, 0, 0, 0],
      [0, 0, 10, 12, 0, 0],
      [0, 4, 0, 0, 14, 0],
      [0, 0, 9, 0, 0, 20],
      [0, 0, 0, 7, 0, 4],
      [0, 0, 0, 0, 0, 0],
    ];

    const ffFinal = Array.from(fordFulkersonSteps({ capacities, source: 0, sink: 5 })).pop()!;
    const ekFinal = Array.from(edmondsKarpSteps({ capacities, source: 0, sink: 5 })).pop()!;
    const prFinal = Array.from(pushRelabelSteps({ capacities, source: 0, sink: 5 })).pop()!;

    console.log('--- CHECK 2: MAXIMUM FLOW 3-WAY CROSS-VALIDATION ---');
    console.log('Ford-Fulkerson Max Flow:', ffFinal.result.maxFlow);
    console.log('Edmonds-Karp Max Flow:  ', ekFinal.result.maxFlow);
    console.log('Push-Relabel Max Flow:  ', prFinal.result.maxFlow);

    expect(ffFinal.result.maxFlow).toBe(23);
    expect(ekFinal.result.maxFlow).toBe(23);
    expect(prFinal.result.maxFlow).toBe(23);
  });

  it('3. TSP Approximation Bound: Approx Cost <= 2 * Held-Karp Optimal', () => {
    const costMatrix = [
      [0, 10, 15, 20],
      [10, 0, 35, 25],
      [15, 35, 0, 30],
      [20, 25, 30, 0],
    ];

    const exactFinal = Array.from(tspSteps({ costMatrix })).pop()!;
    const approxFinal = Array.from(tspApproxSteps({ costMatrix })).pop()!;

    const optCost = exactFinal.result.optimalCost as number;
    const approxCost = approxFinal.result.tourCost as number;
    const mstWeight = approxFinal.result.mstWeight as number;
    const doubledWeight = approxFinal.result.doubledWeight as number;

    console.log('--- CHECK 3: TSP 2-APPROXIMATION BOUND CROSS-VALIDATION ---');
    console.log('Held-Karp Exact Optimal Cost (OPT):', optCost);
    console.log('MST Weight W(T):                   ', mstWeight);
    console.log('Doubled Eulerian Weight 2*W(T):    ', doubledWeight);
    console.log('MST-Doubling Approx Tour Cost:     ', approxCost);
    console.log(`Approximation Ratio (Cost / OPT):   ${(approxCost / optCost).toFixed(2)}x <= 2.0x`);

    expect(optCost).toBe(80);
    expect(approxCost).toBe(95);
    expect(approxCost).toBeLessThanOrEqual(2 * optCost);
  });
});
