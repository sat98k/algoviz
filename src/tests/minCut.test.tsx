import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { fordFulkersonSteps } from '../algorithms/fordFulkerson';
import { edmondsKarpSteps } from '../algorithms/edmondsKarp';
import type { AugmentingPathState } from '../algorithms/flowSearch';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { buildResultSummary } from '../utils/resultSummary';
import { MinCutPanel } from '../components/visualizers/MinCutPanel';
import { AlgorithmStep } from '../types/algorithm';

type Step = AlgorithmStep<AugmentingPathState>;
const GENS = [
  ['ford-fulkerson', fordFulkersonSteps],
  ['edmonds-karp', edmondsKarpSteps],
] as const;

/** Smallest s-t cut by trying every split (fine for up to ~10 vertices). */
function bruteForceMinCut(cap: number[][], s: number, t: number): number {
  const n = cap.length;
  const others = [...Array(n).keys()].filter((v) => v !== s && v !== t);
  let best = Infinity;
  for (let mask = 0; mask < 1 << others.length; mask++) {
    const inS = new Set([s, ...others.filter((_, i) => mask & (1 << i))]);
    let c = 0;
    for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) if (inS.has(u) && !inS.has(v)) c += cap[u][v];
    best = Math.min(best, c);
  }
  return best;
}

/** Deterministic pseudo-random numbers, so a failing graph can be reproduced. */
function rng(seed: number) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 2 ** 32;
  };
}

function randomNetwork(seed: number) {
  const r = rng(seed);
  const n = 3 + Math.floor(r() * 6); // 3..8 vertices
  const cap = Array.from({ length: n }, (_, u) => Array.from({ length: n }, (_, v) => (u !== v && r() < 0.45 ? 1 + Math.floor(r() * 20) : 0)));
  const s = Math.floor(r() * n);
  let t = Math.floor(r() * n);
  if (t === s) t = (s + 1) % n;
  return { capacities: cap, source: s, sink: t, nodeLabels: Array.from({ length: n }, (_, i) => `V${i}`) };
}

function checkCut(steps: Step[], cap: number[][], s: number, t: number, where: string) {
  const final = steps.at(-1)!;
  const cut = final.state.minCut!;
  const maxFlow = final.result.maxFlow;
  expect(cut, where).toBeDefined();
  expect(cut.capacity, where).toBe(maxFlow);
  expect(cut.edges.reduce((a, e) => a + e.capacity, 0), where).toBe(maxFlow);
  expect(maxFlow, where).toBe(bruteForceMinCut(cap, s, t));
  expect(cut.reachable, where).toContain(`${s}`);
  expect(cut.reachable, where).not.toContain(`${t}`);
  expect(cut.sinkSide, where).toContain(`${t}`);
  expect([...cut.reachable, ...cut.sinkSide].sort(), where).toEqual(cap.map((_, i) => `${i}`).sort());
  // S → T pipes are full; T → S pipes carry nothing.
  for (const e of cut.edges) expect(e.flow, where).toBe(e.capacity);
  for (const e of cut.backEdges) expect(e.flow, where).toBe(0);
  // The min-cut step comes right before the final step and states the theorem.
  const cutStep = steps.at(-2)!;
  expect(cutStep.title, where).toMatch(/^Min Cut: S = \{.*\} \| T = \{.*\}, Capacity \d+ = Max Flow$/);
  expect(cutStep.isFinal, where).toBeFalsy();
  expect(final.result.minCutCapacity, where).toBe(maxFlow);
}

describe('Max-flow min-cut', () => {
  it.each(GENS)('%s: cut capacity equals the max flow on every preset', (id, gen) => {
    const algo = getAlgorithmById(id)!;
    for (const p of algo.presets) {
      const inputs = { ...getDefaultInputs(algo), ...p.data } as any;
      const steps = [...gen(inputs)] as Step[];
      checkCut(steps, inputs.capacities, inputs.source ?? 0, inputs.sink ?? inputs.capacities.length - 1, `${id} / ${p.name}`);
    }
  });

  it.each(GENS)('%s: cut capacity equals the max flow on 150 random networks', (_id, gen) => {
    for (let seed = 1; seed <= 150; seed++) {
      const net = randomNetwork(seed);
      for (const searchDetail of ['every', 'moves'] as const) {
        const steps = [...gen({ ...net, searchDetail })] as Step[];
        checkCut(steps, net.capacities, net.source, net.sink, `seed ${seed} (${searchDetail})`);
      }
    }
  });

  it('a network where the sink cannot be reached at all has an empty cut of capacity 0', () => {
    const capacities = [
      [0, 5, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (const [, gen] of GENS) {
      const steps = [...gen({ capacities, source: 0, sink: 2, nodeLabels: ['S', 'A', 'T'] })] as Step[];
      checkCut(steps, capacities, 0, 2, 'unreachable sink');
      expect(steps.at(-1)!.state.minCut!.edges).toEqual([]);
    }
  });

  it('the CLRS network cuts between {S, A, B, D} and {C, T}', () => {
    for (const [id, gen] of GENS) {
      const algo = getAlgorithmById(id)!;
      const steps = [...gen(getDefaultInputs(algo))] as Step[];
      const cutStep = steps.at(-2)!;
      expect(cutStep.title).toBe('Min Cut: S = {S, A, B, D} | T = {C, T}, Capacity 23 = Max Flow');
      expect(cutStep.description).toMatch(/c\(S, T\) = 12 \+ 7 \+ 4 = 23/);
      expect(cutStep.description).toMatch(/Pipes from T back to S \(C → B\) do not count/);
      expect(algo.pseudocode[cutStep.codeLine as number - 1]).toMatch(/min cut/);
    }
  });

  it('the result summary lists the cut capacity and both sides', () => {
    for (const [id, gen] of GENS) {
      const algo = getAlgorithmById(id)!;
      const final = [...gen(getDefaultInputs(algo))].at(-1)!;
      const summary = buildResultSummary(final.result, algo.summarizeResult, {})!;
      const details = Object.fromEntries((summary.details ?? []).map((d) => [d.label, d.value]));
      expect(details['Min cut capacity c(S, T)']).toBe('23 (= max flow)');
      expect(details['Side S (reachable from source)']).toBe('{S, A, B, D}');
      expect(details['Side T (the rest)']).toBe('{C, T}');
      expect(details['Cut edges S → T']).toBe('A → C (12), D → C (7), D → T (4)');
    }
  });
});

describe('Min cut panel', () => {
  const steps = [...fordFulkersonSteps(getDefaultInputs(getAlgorithmById('ford-fulkerson')!))] as Step[];

  it('waits until the run has found the cut', () => {
    const html = renderToStaticMarkup(<MinCutPanel step={steps[3]} />);
    expect(html).toContain('data-min-cut-panel="pending"');
  });

  it('draws S and T, the cut edges with capacities, and c(S, T) = max flow', () => {
    for (const step of [steps.at(-2)!, steps.at(-1)!]) {
      const html = renderToStaticMarkup(<MinCutPanel step={step} />);
      expect(html).toContain('data-min-cut-panel="ready"');
      expect(html.match(/data-cut-side="S"/g)).toHaveLength(4);
      expect(html.match(/data-cut-side="T"/g)).toHaveLength(2);
      expect(html.match(/data-cut-edge=/g)).toHaveLength(3);
      expect(html).toContain('data-back-edge="3-2"');
      expect(html).toMatch(/c\(S, T\) = 12 \+ 7 \+ 4 = 23 = max flow ✓/);
      expect(html).toMatch(/C → B<!-- --> <!-- -->goes<!-- --> from T back|C → B.*from T back/);
    }
  });
});
