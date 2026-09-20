import { describe, it, expect } from 'vitest';
import { jarvisMarchSteps } from '../algorithms/jarvisMarch';
import { grahamScanSteps } from '../algorithms/grahamScan';

describe('Jarvis’ March — Gift Wrapping (M5 Computational Geometry / Convex Hull)', () => {
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

    const steps = Array.from(jarvisMarchSteps({ points }));
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

    // Interior points must not be in the hull
    expect(hullVertices.some((p) => p.x === 50 && p.y === 50)).toBe(false);
  });

  it('correctly handles triangle vertices', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
      { x: 50, y: 30 },
    ];

    const steps = Array.from(jarvisMarchSteps({ points }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.hullVertexCount).toBe(3);
  });

  it('produces identical convex hull vertex set as Graham’s Scan on shared benchmark', () => {
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

    const grahamFinal = Array.from(grahamScanSteps({ points })).pop()!;
    const jarvisFinal = Array.from(jarvisMarchSteps({ points })).pop()!;

    expect(jarvisFinal.result.hullVertexCount).toBe(grahamFinal.result.hullVertexCount);

    const grahamCoords = (grahamFinal.result.hullVertices as { x: number; y: number }[])
      .map((p) => `${p.x},${p.y}`)
      .sort();
    const jarvisCoords = (jarvisFinal.result.hullVertices as { x: number; y: number }[])
      .map((p) => `${p.x},${p.y}`)
      .sort();

    expect(jarvisCoords).toEqual(grahamCoords);
  });
});
