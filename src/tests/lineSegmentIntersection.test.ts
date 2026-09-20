import { describe, it, expect } from 'vitest';
import { lineSegmentIntersectionSteps, doIntersect } from '../algorithms/lineSegmentIntersection';

describe('Line Segment Intersection — Sweep-Line (M5 Computational Geometry)', () => {
  it('correctly detects intersection between crossing segments', () => {
    const segments = [
      { id: 'S1', label: 'S1', p1: { x: 50, y: 120 }, p2: { x: 280, y: 260 } },
      { id: 'S2', label: 'S2', p1: { x: 80, y: 300 }, p2: { x: 320, y: 80 } },
      { id: 'S3', label: 'S3', p1: { x: 200, y: 350 }, p2: { x: 420, y: 330 } },
    ];

    const steps = Array.from(lineSegmentIntersectionSteps({ segments }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.hasIntersection).toBe(true);
    expect(finalStep.result.intersectingPair).toEqual(['S2', 'S1']);
    expect(finalStep.result.point).toBeDefined();
  });

  it('correctly reports no intersection for non-crossing parallel segments', () => {
    const segments = [
      { id: 'S1', label: 'S1', p1: { x: 50, y: 100 }, p2: { x: 300, y: 100 } },
      { id: 'S2', label: 'S2', p1: { x: 50, y: 200 }, p2: { x: 300, y: 200 } },
      { id: 'S3', label: 'S3', p1: { x: 50, y: 300 }, p2: { x: 300, y: 300 } },
    ];

    const steps = Array.from(lineSegmentIntersectionSteps({ segments }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.hasIntersection).toBe(false);
  });

  it('detects intersection when segments become adjacent after an intervening segment ends', () => {
    // S1 and S3 converge to intersect at (400, 200), but S2 is between them up to x=250
    const segments = [
      { id: 'S1', label: 'S1', p1: { x: 50, y: 250 }, p2: { x: 450, y: 190 } },
      { id: 'S2', label: 'S2', p1: { x: 80, y: 200 }, p2: { x: 240, y: 200 } },
      { id: 'S3', label: 'S3', p1: { x: 50, y: 150 }, p2: { x: 450, y: 210 } },
    ];

    const steps = Array.from(lineSegmentIntersectionSteps({ segments }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.hasIntersection).toBe(true);
  });

  it('correctly evaluates direct pairwise intersection geometry', () => {
    const s1 = { id: '1', label: '1', p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } };
    const s2 = { id: '2', label: '2', p1: { x: 0, y: 10 }, p2: { x: 10, y: 0 } };
    const s3 = { id: '3', label: '3', p1: { x: 20, y: 20 }, p2: { x: 30, y: 30 } };

    expect(doIntersect(s1, s2).intersect).toBe(true);
    expect(doIntersect(s1, s3).intersect).toBe(false);
  });
});
