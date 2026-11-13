import { describe, it, expect } from 'vitest';
import {
  lineSegmentIntersectionSteps,
  doIntersect,
  yAtX,
  AvlSnapshot,
  LineSegment,
  SweepLineState,
} from '../algorithms/lineSegmentIntersection';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { AlgorithmStep } from '../types/algorithm';

type Seg = { id: string; label: string; p1: { x: number; y: number }; p2: { x: number; y: number } };
const run = (segments: Seg[]) => Array.from(lineSegmentIntersectionSteps({ segments })) as AlgorithmStep<SweepLineState>[];
const last = (steps: AlgorithmStep<SweepLineState>[]) => steps[steps.length - 1];

const inOrder = (n: AvlSnapshot | null, out: string[] = []): string[] => {
  if (!n) return out;
  inOrder(n.left, out);
  out.push(n.id);
  inOrder(n.right, out);
  return out;
};
const heightOf = (n: AvlSnapshot | null): number => (n ? 1 + Math.max(heightOf(n.left), heightOf(n.right)) : 0);
const nodes = (n: AvlSnapshot | null): AvlSnapshot[] => (n ? [n, ...nodes(n.left), ...nodes(n.right)] : []);

/** Brute force: does any pair of segments intersect? */
const bruteForce = (segs: Seg[]) => {
  for (let i = 0; i < segs.length; i++)
    for (let j = i + 1; j < segs.length; j++) if (doIntersect(segs[i] as LineSegment, segs[j] as LineSegment).intersect) return true;
  return false;
};

/** A tiny seeded PRNG so the random cases are reproducible. */
const rng = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

describe('Line Segment Intersection — sweep line with an AVL tree', () => {
  it('detects an intersection between crossing segments', () => {
    const steps = run([
      { id: 'S1', label: 'S1', p1: { x: 50, y: 120 }, p2: { x: 280, y: 260 } },
      { id: 'S2', label: 'S2', p1: { x: 80, y: 300 }, p2: { x: 320, y: 80 } },
      { id: 'S3', label: 'S3', p1: { x: 200, y: 350 }, p2: { x: 420, y: 330 } },
    ]);
    const f = last(steps);
    expect(f.isFinal).toBe(true);
    expect(f.result.hasIntersection).toBe(true);
    expect([...f.result.intersectingPair].sort()).toEqual(['S1', 'S2']);
    expect(f.result.point).toBeDefined();
  });

  it('reports no intersection for parallel segments', () => {
    const f = last(
      run([
        { id: 'S1', label: 'S1', p1: { x: 50, y: 100 }, p2: { x: 300, y: 100 } },
        { id: 'S2', label: 'S2', p1: { x: 50, y: 200 }, p2: { x: 300, y: 200 } },
        { id: 'S3', label: 'S3', p1: { x: 50, y: 300 }, p2: { x: 300, y: 300 } },
      ])
    );
    expect(f.isFinal).toBe(true);
    expect(f.result.hasIntersection).toBe(false);
  });

  it('evaluates pairwise intersection geometry directly', () => {
    const s1 = { id: '1', label: '1', p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } };
    const s2 = { id: '2', label: '2', p1: { x: 0, y: 10 }, p2: { x: 10, y: 0 } };
    const s3 = { id: '3', label: '3', p1: { x: 20, y: 20 }, p2: { x: 30, y: 30 } };
    expect(doIntersect(s1, s2).intersect).toBe(true);
    expect(doIntersect(s1, s3).intersect).toBe(false);
  });

  it('agrees with brute force on 300 random inputs', () => {
    const rand = rng(42);
    const r = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo));
    let yes = 0;
    for (let t = 0; t < 300; t++) {
      const n = 2 + Math.floor(rand() * 7);
      const segs: Seg[] = Array.from({ length: n }, (_, i) => {
        const x1 = r(0, 400);
        return { id: `S${i + 1}`, label: `S${i + 1}`, p1: { x: x1, y: r(0, 400) }, p2: { x: r(x1 + 1, 500), y: r(0, 400) } };
      });
      const expected = bruteForce(segs);
      if (expected) yes++;
      expect(last(run(segs)).result.hasIntersection, JSON.stringify(segs)).toBe(expected);
    }
    // Both answers are exercised.
    expect(yes).toBeGreaterThan(30);
    expect(yes).toBeLessThan(290);
  });

  describe('AVL invariants hold at every step', () => {
    const a = getAlgorithmById('line-segment-intersection')!;
    for (const p of a.presets) {
      it(`preset "${p.name}"`, () => {
        for (const s of run(p.data.segments)) {
          const st = s.state;
          const tree = st.tree;
          // Stored heights are true heights.
          for (const node of nodes(tree)) {
            expect(node.height).toBe(heightOf(node));
            expect(node.balance).toBe(heightOf(node.left) - heightOf(node.right));
          }
          // After rotations / completed operations the tree is balanced.
          if (['neighbours', 'check_adj', 'found', 'event_left', 'event_right'].includes(st.phase)) {
            for (const node of nodes(tree)) expect(Math.abs(node.balance)).toBeLessThanOrEqual(1);
          }
          // In-order traversal is the bottom-to-top order of the segments at the sweep line.
          const order = inOrder(tree);
          expect([...order].reverse()).toEqual(st.activeSegmentIds);
          if (st.phase !== 'found') {
            const segs = new Map(st.segments.map((x) => [x.id, x]));
            const ys = order.map((id) => yAtX(segs.get(id)!, st.currentSweepX));
            for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1] - 1e-9);
          }
        }
      });
    }
  });

  it('the rising-shelves preset needs RR rotations and keeps the tree height logarithmic', () => {
    const p = getAlgorithmById('line-segment-intersection')!.presets.find((x) => x.name.startsWith('Rising Shelves'))!;
    const steps = run(p.data.segments);
    const rot = steps.filter((s) => s.state.phase === 'avl_rotate');
    expect(rot.length).toBeGreaterThanOrEqual(2);
    expect(rot.every((s) => s.state.rotation!.case === 'RR')).toBe(true);
    // 6 segments: once rebalanced, an AVL tree is never taller than 3 levels (a plain BST here would reach 6).
    const settled = steps.filter((s) => !['avl_insert', 'avl_delete'].includes(s.state.phase));
    expect(Math.max(...settled.map((s) => s.state.tree?.height ?? 0))).toBeLessThanOrEqual(3);
    expect(last(steps).result.hasIntersection).toBe(false);
    expect(last(steps).result.rotations).toBe(rot.length);
  });

  it('the zig-zag preset needs an LR double rotation (two single rotations in a row)', () => {
    const p = getAlgorithmById('line-segment-intersection')!.presets.find((x) => x.name.startsWith('Zig-Zag'))!;
    const steps = run(p.data.segments);
    const rot = steps.filter((s) => s.state.phase === 'avl_rotate').map((s) => s.state.rotation!);
    expect(rot.slice(0, 2).map((r) => [r.case, r.direction, r.part])).toEqual([
      ['LR', 'left', 1],
      ['LR', 'right', 2],
    ]);
    // After the double rotation the middle segment S3 is the root.
    const after = steps.find((s) => s.state.rotation?.part === 2)!;
    expect(after.state.tree!.id).toBe('S3');
  });

  it('deleting a node with two children copies in its in-order successor', () => {
    // S2 (middle) becomes the root with S1 below and S3 above; S2 ends first.
    const steps = run([
      { id: 'S1', label: 'S1', p1: { x: 0, y: 0 }, p2: { x: 400, y: 0 } },
      { id: 'S2', label: 'S2', p1: { x: 10, y: 100 }, p2: { x: 100, y: 100 } },
      { id: 'S3', label: 'S3', p1: { x: 20, y: 200 }, p2: { x: 400, y: 200 } },
    ]);
    const del = steps.find((s) => s.state.phase === 'avl_delete' && s.state.removedId === 'S2')!;
    expect(del.state.replacedBy).toBe('S3');
    expect(del.state.tree!.id).toBe('S3');
    expect(inOrder(del.state.tree)).toEqual(['S1', 'S3']);
    // The former neighbours of S2 are then tested.
    const i = steps.indexOf(del);
    expect(steps[i + 1].title).toBe('Check Former Neighbors: S3 and S1');
  });

  it('only ever tests pairs that are neighbours in T', () => {
    const p = getAlgorithmById('line-segment-intersection')!.presets.find((x) => x.name.startsWith('Classic'))!;
    for (const s of run(p.data.segments)) {
      if (s.state.phase !== 'check_adj') continue;
      const [a, b] = s.state.checkedPair!;
      const order = s.state.activeSegmentIds;
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      expect(ia).toBeGreaterThanOrEqual(0);
      expect(Math.abs(ia - ib)).toBe(1);
    }
  });
});
