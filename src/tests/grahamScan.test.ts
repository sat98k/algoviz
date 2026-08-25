import { describe, it, expect } from 'vitest';
import { grahamScanSteps } from '../algorithms/grahamScan';

describe('Graham’s Scan (M5 Computational Geometry / Convex Hull)', () => {
  it('correctly finds the 4 corner points of a square containing interior points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
      { x: 50, y: 50 },
      { x: 25, y: 75 },
      { x: 75, y: 25 },
    ];

    const steps = Array.from(grahamScanSteps({ points }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.hullVertexCount).toBe(4);

    const hullVertices = finalStep.result.hullVertices as { x: number; y: number }[];
    const has00 = hullVertices.some((p) => p.x === 0 && p.y === 0);
    const has0100 = hullVertices.some((p) => p.x === 0 && p.y === 100);
    const has100100 = hullVertices.some((p) => p.x === 100 && p.y === 100);
    const has1000 = hullVertices.some((p) => p.x === 100 && p.y === 0);

    expect(has00).toBe(true);
    expect(has0100).toBe(true);
    expect(has100100).toBe(true);
    expect(has1000).toBe(true);

    // Interior points (50,50), (25,75), (75,25) must NOT be in the hull
    expect(hullVertices.some((p) => p.x === 50 && p.y === 50)).toBe(false);
  });

  it('correctly handles triangle vertices', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
      { x: 50, y: 30 },
    ];

    const steps = Array.from(grahamScanSteps({ points }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.hullVertexCount).toBe(3);
  });
});
