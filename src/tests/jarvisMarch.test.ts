import { describe, it, expect } from 'vitest';
import { jarvisMarchSteps } from '../algorithms/jarvisMarch';
import { grahamScanSteps } from '../algorithms/grahamScan';
import { getAlgorithmById } from '../config/algorithmRegistry';

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
  describe('direction and candidate rule', () => {
    const benchmark = [
      { x: 100, y: 100 },
      { x: 150, y: 250 },
      { x: 250, y: 300 },
      { x: 350, y: 220 },
      { x: 400, y: 120 },
      { x: 280, y: 180 },
      { x: 200, y: 150 },
      { x: 220, y: 80 },
    ];
    const cross = (a: any, b: any, c: any) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

    it('wraps counter-clockwise from the lowest point, as labelled', () => {
      const final = Array.from(jarvisMarchSteps({ points: benchmark })).pop()!;
      expect(final.result.perimeterOrder).toBe('P7 → P4 → P3 → P2 → P1 → P0 → P7');
      // Positive signed area: counter-clockwise in y-up coordinates.
      const hull = final.result.hullVertices as { x: number; y: number }[];
      const area = hull.reduce((sum, p, i) => sum + p.x * hull[(i + 1) % hull.length].y - hull[(i + 1) % hull.length].x * p.y, 0);
      expect(area).toBeGreaterThan(0);
    });

    it('every hull edge has every other point on its left (or on the edge)', () => {
      const final = Array.from(jarvisMarchSteps({ points: benchmark })).pop()!;
      const hull = final.result.hullVertices as { x: number; y: number }[];
      hull.forEach((a, i) => {
        const b = hull[(i + 1) % hull.length];
        for (const p of benchmark) expect(cross(a, b, p)).toBeGreaterThanOrEqual(0);
      });
    });

    it('a point replaces the candidate only when it is right of the ribbon, or collinear and further', () => {
      const steps = Array.from(jarvisMarchSteps({ points: benchmark }));
      steps.forEach((s, i) => {
        if (!/^Orientation Check/.test(s.title)) return;
        const [from, cand, p] = s.state.checkTriplet!;
        const c = cross(from, cand, p);
        expect(s.state.cross).toBe(c);
        const d2 = (a: any, b: any) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        const expected = c < 0 || (c === 0 && d2(from, p) > d2(from, cand));
        expect(s.state.replaces).toBe(expected);
        expect(/^Update Candidate/.test(steps[i + 1].title)).toBe(expected);
        if (c > 0) expect(s.description).toMatch(/LEFT/);
        if (c < 0) expect(s.description).toMatch(/RIGHT/);
      });
    });

    it('the ribbon stays held at the current hull point while candidates change', () => {
      const steps = Array.from(jarvisMarchSteps({ points: benchmark }));
      let from: number | undefined;
      for (const s of steps) {
        if (/Initial Candidate/.test(s.title)) from = s.state.wrapFrom!.id;
        if (/^(Orientation Check|Update Candidate)/.test(s.title)) {
          expect(s.state.wrapFrom!.id).toBe(from);
          expect(s.state.hullStack.at(-1)!.id).toBe(from);
        }
      }
      // The first scan from P7 starts at P0 but ends at P4: P0 is only the initial candidate.
      const firstConfirm = steps.find((s) => /^Confirmed Hull Vertex/.test(s.title))!;
      expect(firstConfirm.title).toBe('Confirmed Hull Vertex: P4');
    });

    it('collinear points: the far end is the corner, the middle point is not', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 80 },
      ];
      const final = Array.from(jarvisMarchSteps({ points })).pop()!;
      expect(final.result.perimeterOrder).toBe('P0 → P2 → P3 → P0');
    });

    it('each step highlights the pseudocode line it performs', () => {
      const code = getAlgorithmById('jarvis-march')!.pseudocode;
      const linesOf = (s: any) => (Array.isArray(s.codeLine) ? s.codeLine : [s.codeLine]).map((l: number) => code[l - 1]).join('\n');
      for (const s of Array.from(jarvisMarchSteps({ points: benchmark }))) {
        if (/Initial Candidate/.test(s.title)) expect(linesOf(s)).toMatch(/nextPoint = any point/);
        if (/^Orientation Check/.test(s.title)) expect(linesOf(s)).toMatch(/c < 0/);
        if (/^Update Candidate/.test(s.title)) expect(linesOf(s)).toMatch(/nextPoint = point/);
        if (/^Confirmed Hull Vertex/.test(s.title)) expect(linesOf(s)).toMatch(/current = nextPoint/);
        if (s.isFinal) expect(linesOf(s)).toMatch(/return hull/);
      }
    });
  });
});
