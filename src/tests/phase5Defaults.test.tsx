import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { nQueensSteps } from '../algorithms/nQueens';
import { TreeVisualizer } from '../components/visualizers/TreeVisualizer';
import { NQueensSolutionsPanel, findSolutionSteps } from '../components/common/NQueensSolutionsPanel';
import { AlgorithmPage } from '../pages/AlgorithmPage';
import { AlgorithmStep } from '../types/algorithm';

const traceOf = (id: string, overrides: Record<string, any> = {}) =>
  [...getAlgorithmById(id)!.stepGenerator({ ...getDefaultInputs(getAlgorithmById(id)!), ...overrides })] as AlgorithmStep[];
const titles = (steps: AlgorithmStep[]) => steps.map((s) => s.title);

describe('Subset Sum default shows include/exclude, pruning and backtracking', () => {
  const inputs = getDefaultInputs(getAlgorithmById('subset-sum')!);
  const steps = traceOf('subset-sum');
  const t = titles(steps);

  it('uses a small beginner input', () => {
    expect(inputs.numbers).toEqual([2, 4, 5, 9]);
    expect(inputs.targetSum).toBe(16);
    expect(steps.length).toBeLessThanOrEqual(20);
  });

  it('hits both prune rules and backtracks at least twice', () => {
    expect(t.some((x) => /Exceeds Target/.test(x))).toBe(true);
    expect(t.some((x) => /Insufficient/.test(x))).toBe(true);
    expect(t.filter((x) => x.startsWith('Backtrack: Undo')).length).toBeGreaterThanOrEqual(2);
  });

  it('explains why each prune is safe', () => {
    const over = steps.find((s) => /Exceeds Target/.test(s.title))!;
    expect(over.description).toMatch(/positive.*only makes it bigger/);
    const insuf = steps.find((s) => /Insufficient/.test(s.title))!;
    expect(insuf.description).toMatch(/Even if every .* were added/);
  });

  it('finds a correct subset', () => {
    const result = steps[steps.length - 1].result;
    expect(result.found).toBe(true);
    expect(result.subset.reduce((a: number, b: number) => a + b, 0)).toBe(16);
    for (const x of result.subset) expect(inputs.numbers).toContain(x);
  });

  it('tree edges show real values like "+4" and "−4", never "+Elem"', () => {
    const html = renderToStaticMarkup(<TreeVisualizer step={steps[steps.length - 1]} />);
    expect(html).not.toContain('Elem');
    for (const label of ['+2', '+4', '+5', '−4', '−9']) expect(html).toContain(label);
  });
});

describe('Graph Coloring default shows rejected colours and backtracking', () => {
  const steps = traceOf('graph-coloring');
  const t = titles(steps);
  const edges = getDefaultInputs(getAlgorithmById('graph-coloring')!).edgeList as [string, string][];

  it('is short, with conflicts and backtracks before a valid answer', () => {
    expect(steps.length).toBeLessThanOrEqual(30);
    expect(t.filter((x) => x.startsWith('Conflict')).length).toBeGreaterThanOrEqual(3);
    expect(t.filter((x) => x.startsWith('Backtrack')).length).toBeGreaterThanOrEqual(1);
    const result = steps[steps.length - 1].result;
    expect(result.solvable).toBe(true);
    for (const [u, v] of edges) expect(result.assignment[u]).not.toBe(result.assignment[v]);
  });

  it('backtrack text says when a vertex has no colours left', () => {
    const exhausted = steps.find((s) => s.title === 'Backtrack: Uncolor V4')!;
    expect(exhausted.description).toContain('no colors left');
  });

  it('preset names state the right number of vertices', () => {
    for (const p of getAlgorithmById('graph-coloring')!.presets) {
      const m = /(\d+)-Vertex/.exec(p.name);
      if (m) expect(new Set((p.data.edgeList as string[][]).flat()).size, p.name).toBe(Number(m[1]));
      expect(p.name).not.toMatch(/5-Node/);
    }
  });
});

describe('Line Segment Intersection default needs the deletion-time check', () => {
  const steps = traceOf('line-segment-intersection');
  const a = getAlgorithmById('line-segment-intersection')!;
  const segs = getDefaultInputs(a).segments as { label: string; p1: { x: number; y: number }; p2: { x: number; y: number } }[];
  const cross = (s: typeof segs[0], u: typeof segs[0]) => {
    const o = (p: any, q: any, r: any) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    return o(s.p1, s.p2, u.p1) !== o(s.p1, s.p2, u.p2) && o(u.p1, u.p2, s.p1) !== o(u.p1, u.p2, s.p2);
  };

  it('the geometry really requires it: only S1 and S3 cross, and S2 separates them at first', () => {
    const [s1, s2, s3] = segs;
    expect(cross(s1, s3)).toBe(true);
    expect(cross(s1, s2)).toBe(false);
    expect(cross(s2, s3)).toBe(false);
  });

  it('the intersection is found right after a deletion, at the former-neighbours check', () => {
    const t = titles(steps);
    const removeIdx = t.findIndex((x) => x.startsWith('Right Endpoint Event: Remove S2'));
    const checkIdx = t.findIndex((x) => x.startsWith('Check Former Neighbors: S1 and S3'));
    const foundIdx = t.findIndex((x) => x.startsWith('INTERSECTION FOUND'));
    expect(removeIdx).toBeGreaterThan(0);
    expect(checkIdx).toBe(removeIdx + 1);
    expect(foundIdx).toBe(checkIdx + 1);
    expect(t.slice(0, removeIdx).some((x) => x.startsWith('INTERSECTION FOUND'))).toBe(false);
    expect(steps[foundIdx].codeLine).toBe(12);
  });

  it('code lines stay inside the pseudocode for every preset', () => {
    for (const p of a.presets) {
      for (const s of a.stepGenerator(p.data)) {
        const lines = Array.isArray(s.codeLine) ? s.codeLine : [s.codeLine!];
        for (const l of lines) expect(l).toBeGreaterThanOrEqual(1), expect(l).toBeLessThanOrEqual(a.pseudocode.length);
      }
    }
  });

  it('the explanation describes the deletion-time check', () => {
    expect(a.explanation).toContain('when a segment is deleted its former above and below neighbours become adjacent');
  });
});

describe('N-Queens First / All solutions', () => {
  const valid = (b: number[]) =>
    b.every((c, r) => b.every((c2, r2) => r === r2 || (c !== c2 && Math.abs(c - c2) !== Math.abs(r - r2))));

  it.each([
    [4, 2],
    [5, 10],
    [6, 4],
    [7, 40],
    [8, 92],
  ])('n = %i finds all %i distinct, valid solutions', (n, expected) => {
    const steps = [...nQueensSteps({ n, findAll: true })];
    const result = steps[steps.length - 1].result;
    expect(result.totalSolutionsFound).toBe(expected);
    expect(result.stoppedAtFirst).toBe(false);
    expect(new Set(result.solutions.map((s: number[]) => s.join(','))).size).toBe(expected);
    result.solutions.forEach((s: number[]) => expect(valid(s)).toBe(true));
  });

  it('first-solution mode stops after one valid solution', () => {
    const result = [...nQueensSteps({ n: 6 })].pop()!.result;
    expect(result.totalSolutionsFound).toBe(1);
    expect(result.stoppedAtFirst).toBe(true);
    expect(valid(result.solutions[0])).toBe(true);
  });

  it('8-Queens find-all stays within a safe size and generates quickly', () => {
    const start = Date.now();
    const steps = [...nQueensSteps({ n: 8, findAll: true })];
    expect(steps.length).toBeLessThan(20000);
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it('each gallery entry links to the step where that solution was found', () => {
    const steps = [...nQueensSteps({ n: 5, findAll: true })] as AlgorithmStep[];
    const found = findSolutionSteps(steps);
    expect(found).toHaveLength(10);
    found.forEach((idx, k) => expect(steps[idx].title).toBe(`Valid 5-Queens Solution #${k + 1} Found!`));
  });

  it('gallery shows boards with 1-based positions and jump buttons', () => {
    const steps = [...nQueensSteps({ n: 4, findAll: true })] as AlgorithmStep[];
    const final = steps[steps.length - 1];
    const html = renderToStaticMarkup(
      <NQueensSolutionsPanel n={4} solutions={final.state.solutions} foundAtStep={findSolutionSteps(steps)} isFinal onJump={() => {}} />
    );
    expect(html).toContain('Final answer: all solutions');
    expect(html).toContain('2 solutions on a 4×4 board');
    expect(html).toContain('(1, 2) (2, 4) (3, 1) (4, 3)');
    expect(html.match(/Jump to the step where it was found/g)).toHaveLength(2);
  });

  it('before the run ends the gallery says the search is still running', () => {
    const html = renderToStaticMarkup(<NQueensSolutionsPanel n={4} solutions={[[1, 3, 0, 2]]} foundAtStep={[10]} isFinal={false} onJump={() => {}} />);
    expect(html).toContain('Solutions found so far');
    expect(html).toContain('just found');
  });

  it('the page offers the First / All switch', () => {
    const html = renderToStaticMarkup(<AlgorithmPage algorithmId="n-queens" onBack={() => {}} />);
    expect(html).toContain('Find first solution');
    expect(html).toContain('Find all solutions');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Find first solution/);
  });

  it('preset names stay mode-neutral (no solution counts)', () => {
    for (const p of getAlgorithmById('n-queens')!.presets) expect(p.name).not.toMatch(/solution/i);
  });
});
