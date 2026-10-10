import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { ComplexityAnalysisPanel } from '../components/common/ComplexityAnalysisPanel';
import { ComplexityAnalysis } from '../types/algorithm';

const A = (id: string) => getAlgorithmById(id)!.analysis;
const bound = (a: ComplexityAnalysis, c: string) => a.time.find((t) => t.case === c)?.bound;
const allText = (a: ComplexityAnalysis) =>
  [
    a.dominant,
    a.derivation,
    a.recurrence ?? '',
    a.space.bound,
    a.space.explanation,
    a.implementationNote ?? '',
    ...a.time.flatMap((t) => [t.bound, t.note ?? '']),
    ...a.variables.flatMap((v) => [v.symbol, v.meaning]),
  ].join('\n');
const sentences = (s: string) => s.split(/(?<=[.!?])\s+(?=[A-Z“"(])/).filter((x) => x.trim().length > 0);
const src = (file: string) => readFileSync(join(__dirname, '../algorithms', file), 'utf8');

describe.each(algorithmRegistry.map((a) => [a.id, a] as const))('%s analysis', (_id, algo) => {
  const a = algo.analysis;

  it('is complete', () => {
    expect(a.variables.length).toBeGreaterThan(0);
    expect(a.time.length).toBeGreaterThan(0);
    expect(a.kinds.length).toBeGreaterThan(0);
    expect(a.dominant.length).toBeGreaterThan(15);
    expect(a.space.bound).toMatch(/^O\(/);
    expect(a.space.explanation.length).toBeGreaterThan(15);
  });

  it('has a 2–4 sentence derivation', () => {
    const n = sentences(a.derivation).length;
    expect(n, a.derivation).toBeGreaterThanOrEqual(2);
    expect(n, a.derivation).toBeLessThanOrEqual(4);
  });

  it('explains every variable used in its bounds', () => {
    const symbols = a.variables.map((v) => v.symbol).join(' ');
    for (const b of [...a.time.map((t) => t.bound), a.space.bound]) {
      const letters = b.replace(/log2|log₂|log|min|ln|O/g, '').match(/[A-Za-z]/g) ?? [];
      for (const l of letters) expect(symbols, `"${l}" in ${b}`).toContain(l);
    }
  });

  it('renders formulas as plain text, never LaTeX', () => {
    expect(allText(a)).not.toMatch(/\\[a-zA-Z]+|\^\{|\$/);
  });

  it('follows the case rules and states the assumption behind every non-worst case', () => {
    const cases = a.time.map((t) => t.case);
    expect(new Set(cases).size).toBe(cases.length);
    if (cases.includes('all')) expect(cases).toEqual(['all']);
    else expect(cases).toContain('worst');
    for (const t of a.time) if (t.case !== 'worst') expect(t.note, t.case).toBeTruthy();
  });

  it('uses bound kinds that match its bounds', () => {
    if (bound(a, 'expected')) expect(a.kinds).toContain('Expected');
    if (/ⁿ|N!/.test(a.time.map((t) => t.bound).join(' '))) expect(a.kinds).toContain('Exponential');
    if (algo.paradigm === 'Approximation') expect(a.kinds).toContain('Approximation');
  });

  it('keeps the short summary derived from the analysis', () => {
    expect(algo.complexity.timeWorst).toBe(bound(a, 'worst') ?? bound(a, 'all'));
    expect(algo.complexity.spaceWorst).toBe(a.space.bound);
    if (!bound(a, 'best') && !bound(a, 'all')) expect(algo.complexity.timeBest).toBeUndefined();
    if (!bound(a, 'expected') && !bound(a, 'average') && !bound(a, 'all')) expect(algo.complexity.timeAverage).toBeUndefined();
  });
});

describe('Specific analyses', () => {
  it('Fractional Knapsack: sorting dominates', () => {
    expect(A('fractional-knapsack').dominant).toMatch(/Sorting/);
    expect(bound(A('fractional-knapsack'), 'all')).toBe('O(n log n)');
  });

  it('Karatsuba and Maximum Subarray: recurrences', () => {
    expect(A('karatsuba').recurrence).toBe('T(n) = 3T(n/2) + O(n)');
    expect(bound(A('karatsuba'), 'all')).toBe('O(n^log2(3)) ≈ O(n^1.585)');
    expect(A('max-subarray').recurrence).toBe('T(n) = 2T(n/2) + O(n)');
  });

  it('Knapsack DP: O(n·W), explained as pseudo-polynomial', () => {
    expect(bound(A('knapsack-dp'), 'all')).toBe('O(n·W)');
    expect(A('knapsack-dp').kinds).toContain('Pseudo-polynomial');
    expect(A('knapsack-dp').derivation).toMatch(/pseudo-polynomial/);
  });

  it('Matrix Chain: O(n²) subchains × O(n) splits; LCS O(m·n); Held-Karp O(n²·2ⁿ)', () => {
    expect(A('matrix-chain-multiplication').dominant).toMatch(/O\(n²\) subchains.*O\(n\) split/);
    expect(bound(A('lcs'), 'all')).toBe('O(m·n)');
    expect(bound(A('tsp'), 'all')).toBe('O(n²·2ⁿ)');
  });

  it('String matching: meaningful case distinctions', () => {
    expect(A('naive-string-match').time.map((t) => t.case)).toEqual(['best', 'expected', 'worst']);
    expect(bound(A('kmp'), 'all')).toBe('O(n + m)');
    expect(A('rabin-karp').time.map((t) => t.case)).toEqual(['best', 'expected', 'worst']);
    expect(bound(A('rabin-karp'), 'worst')).toBe('O((n − m + 1)·m)');
  });

  it('Randomized Quicksort: expected vs worst, including the duplicates caveat', () => {
    const a = A('randomized-quicksort');
    expect(bound(a, 'expected')).toBe('O(n log n)');
    expect(bound(a, 'worst')).toBe('O(n²)');
    expect(a.time.find((t) => t.case === 'worst')!.note).toMatch(/identical values/);
    expect(src('randomizedQuicksort.ts')).toContain('arr[j] <= pivot'); // the partition that causes it
  });

  it('Hiring Problem: expected hires Hₙ ≈ ln n and the cost formula', () => {
    expect(A('hiring-problem').derivation).toMatch(/Hₙ = 1 \+ 1\/2 \+ … \+ 1\/n ≈ ln n/);
    expect(A('hiring-problem').derivation).toMatch(/n·cᵢ \+ m·cₕ/);
  });

  it('Bellman-Ford: the O(V + E) best case is backed by an early exit in the code', () => {
    expect(bound(A('bellman-ford'), 'best')).toBe('O(V + E)');
    const bf = getAlgorithmById('bellman-ford')!;
    const simple = bf.presets.find((p) => /DAG/.test(p.name))!;
    const steps = [...bf.stepGenerator({ ...getDefaultInputs(bf), ...simple.data })];
    expect(steps.some((s) => /stop early/.test(s.title))).toBe(true);
  });

  it('Line Segment Intersection: best case accounts for sorting', () => {
    expect(bound(A('line-segment-intersection'), 'all')).toBe('O(n log n)');
    for (const t of A('line-segment-intersection').time) expect(t.bound).not.toBe('O(1)');
    expect(getAlgorithmById('line-segment-intersection')!.complexity.timeBest).toBe('O(n log n)');
  });

  it('Karger: probability stated as a bound, not a guarantee', () => {
    const a = A('karger-min-cut');
    expect(a.kinds).toEqual(['Randomized (Monte Carlo)']);
    expect(a.derivation).toMatch(/at least 2\/\(V\(V − 1\)\)/);
    expect(a.derivation).toMatch(/at most/);
  });

  it('Approximation algorithms keep quality separate from time; TSP-approx needs metric costs', () => {
    for (const id of ['vertex-cover-approx', 'set-cover', 'tsp-approx']) expect(A(id).derivation).toMatch(/guarantee/);
    expect(A('tsp-approx').derivation).toMatch(/metric/);
  });
});

describe('Implementation notes match the code', () => {
  it('Huffman re-sorts the forest inside the merge loop', () => {
    expect(A('huffman').implementationNote).toMatch(/re-sorts/);
    expect(src('huffman.ts')).toMatch(/while \(forest\.length > 1\) \{[\s\S]{0,200}forest\.sort/);
  });

  it('flow algorithms store capacities in a V × V matrix scanned row by row', () => {
    for (const [id, file] of [['ford-fulkerson', 'fordFulkerson.ts'], ['edmonds-karp', 'edmondsKarp.ts'], ['push-relabel', 'pushRelabel.ts']]) {
      expect(A(id).space.bound).toBe('O(V²)');
      expect(src(file)).toContain('for (let v = 0; v < n; v++)');
    }
  });

  it('Line Segment re-sorts its status array; B&B re-sorts its queue; TSP-approx Prim scans the tree', () => {
    expect(src('lineSegmentIntersection.ts')).toContain('activeSegmentIds.sort(');
    expect(src('knapsackBB.ts')).toContain('queue.sort(');
    expect(src('jobSelectionBB.ts')).toContain('queue.sort(');
    expect(src('tspApprox.ts')).toContain('for (const u of inMst)');
    expect(src('vertexCoverApprox.ts')).toMatch(/while \(uncoveredEdges\.length > 0\)[\s\S]*uncoveredEdges\.filter/);
  });
});

describe('ComplexityAnalysisPanel', () => {
  const render = (id: string) =>
    renderToStaticMarkup(<ComplexityAnalysisPanel analysis={A(id)} paradigm={getAlgorithmById(id)!.paradigm} />)
      .replace(/&amp;/g, '&')
      .replace(/&#x27;/g, "'");

  it('shows every case, space, what dominates, derivation and variables without truncation', () => {
    const html = render('rabin-karp');
    for (const s of ['Time and space complexity', 'Best case', 'Expected', 'Worst case', 'O(n + m + z·m)', 'What dominates', 'Why:', 'Variables:']) {
      expect(html).toContain(s);
    }
    expect(html).toContain(A('rabin-karp').derivation);
    expect(html).not.toMatch(/\btruncate\b|line-clamp/);
  });

  it('shows "Every case" for a single bound, the recurrence, and implementation notes', () => {
    const html = render('max-subarray');
    expect(html).toContain('Every case');
    expect(html).toContain('T(n) = 2T(n/2) + O(n)');
    expect(render('huffman')).toContain('About this implementation');
  });
});
