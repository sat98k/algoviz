import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { fordFulkersonSteps } from '../algorithms/fordFulkerson';
import { edmondsKarpSteps } from '../algorithms/edmondsKarp';
import type { AugmentingPathState } from '../algorithms/flowSearch';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { GraphVisualizer } from '../components/visualizers/GraphVisualizer';
import { STORY_SCENES } from '../components/story/storyRegistry';
import { stepDurationMs } from '../components/story/useAnimPhases';
import { AlgorithmStep } from '../types/algorithm';

const CLRS = [
  [0, 16, 13, 0, 0, 0],
  [0, 0, 10, 12, 0, 0],
  [0, 4, 0, 0, 14, 0],
  [0, 0, 9, 0, 0, 20],
  [0, 0, 0, 7, 0, 4],
  [0, 0, 0, 0, 0, 0],
];
const CLRS_LABELS = ['S', 'A', 'B', 'C', 'D', 'T'];
const ZIGZAG = [
  [0, 10, 10, 0],
  [0, 0, 1, 10],
  [0, 0, 0, 10],
  [0, 0, 0, 0],
];
const ZIG_LABELS = ['S', 'A', 'B', 'T'];

type Step = AlgorithmStep<AugmentingPathState>;
const run = (gen: typeof fordFulkersonSteps | typeof edmondsKarpSteps, capacities: number[][], nodeLabels: string[], searchDetail?: 'every' | 'moves') =>
  [...gen({ capacities, nodeLabels, source: 0, sink: capacities.length - 1, searchDetail })] as Step[];
const pathsOf = (steps: Step[], labels: string[]) =>
  steps.at(-1)!.state.pathHistory.map((p) => `${p.path.map((v) => labels[Number(v)]).join('')}+${p.bottleneck}${p.usesReverse ? '↩' : ''}`);

describe('Ford-Fulkerson searches with DFS', () => {
  const steps = run(fordFulkersonSteps, CLRS, CLRS_LABELS);

  it('takes the first route DFS completes, including routes that send flow back', () => {
    expect(pathsOf(steps, CLRS_LABELS)).toEqual(['SABDCT+7', 'SABDT+3', 'SACBDT+1', 'SACT+5', 'SBACT+6↩', 'SBCT+1↩']);
    expect(steps.at(-1)!.result.maxFlow).toBe(23);
  });

  it('the stack is always a route of residual edges from S, and is the path when T is reached', () => {
    for (const [i, s] of steps.entries()) {
      const { search, residualMatrix, phase } = s.state;
      if (phase !== 'dfs_explore' || search.round === 0) continue;
      expect(search.frontier[0] ?? '0', s.title).toBe('0');
      // Each hop on the stack had room when it was walked; the hop just walked still has room now.
      const stack = search.frontier.map(Number);
      if (search.event === 'probe' && search.probe!.verdict === 'take') {
        const [a, b] = stack.slice(-2);
        expect(residualMatrix[a][b], s.title).toBeGreaterThan(0);
        expect(search.parent[`${b}`], s.title).toBe(`${a}`);
      }
      if (search.reachedSink) expect(steps[i + 1].state.currentAugmentingPath, s.title).toEqual(search.frontier);
    }
  });

  it('backs up from dead ends, and dead ends are never visited again in that search', () => {
    const deadEndSteps = steps.filter((s) => s.state.search.event === 'backtrack');
    expect(deadEndSteps.length).toBeGreaterThan(0);
    for (const s of deadEndSteps) {
      expect(s.state.search.deadEnds).toContain(s.state.search.backtrackFrom);
      expect(s.state.search.frontier).not.toContain(s.state.search.backtrackFrom);
    }
  });
});

describe('Edmonds-Karp searches with BFS', () => {
  const steps = run(edmondsKarpSteps, CLRS, CLRS_LABELS);

  it('always augments along a shortest path, so path lengths never shrink', () => {
    expect(pathsOf(steps, CLRS_LABELS)).toEqual(['SACT+12', 'SBDT+4', 'SBDCT+7']);
    const lengths = steps.at(-1)!.state.pathHistory.map((p) => p.path.length);
    expect([...lengths].sort((a, b) => a - b)).toEqual(lengths);
  });

  it('the queue is up to date on every step, and rings grow by one along parent links', () => {
    let lastDequeued = -1;
    for (const s of steps) {
      const { search } = s.state;
      if (s.state.phase !== 'bfs_explore' || search.round === 0) continue;
      for (const [v, u] of Object.entries(search.parent)) expect(search.depth[v], s.title).toBe(search.depth[u] + 1);
      if (search.event === 'start') lastDequeued = -1;
      if (search.event === 'dequeue') {
        // Vertices leave the queue in ring order, and the one taken is no longer waiting.
        const ring = search.depth[search.current!];
        expect(ring, s.title).toBeGreaterThanOrEqual(lastDequeued);
        lastDequeued = ring;
        expect(search.frontier, s.title).not.toContain(search.current);
      }
      if (search.event === 'probe' && search.probe!.verdict === 'take') expect(search.frontier.at(-1), s.title).toBe(search.probe!.v);
    }
  });

  it('traces the parent links back from T before using the path', () => {
    const traces = steps.filter((s) => s.state.search.event === 'trace' && s.state.phase === 'bfs_explore');
    expect(traces).toHaveLength(3);
    for (const s of traces) {
      const path = s.state.search.trace!;
      // Walked backwards: T first, then each vertex's parent, ending at S.
      expect(path[0]).toBe('5');
      expect(path.at(-1)).toBe('0');
      for (let i = 1; i < path.length; i++) expect(s.state.search.parent[path[i - 1]]).toBe(path[i]);
    }
  });
});

describe('Every look the search makes agrees with the residual graph', () => {
  it.each([
    ['ford-fulkerson', fordFulkersonSteps],
    ['edmonds-karp', edmondsKarpSteps],
  ] as const)('%s', (_id, gen) => {
    for (const [caps, labels] of [
      [CLRS, CLRS_LABELS],
      [ZIGZAG, ZIG_LABELS],
    ] as const) {
      const steps = run(gen, caps, labels);
      let foundBefore: string[] = [];
      for (const s of steps) {
        const { search, residualMatrix } = s.state;
        const p = search.event === 'probe' ? search.probe : undefined;
        if (p && (s.state.phase === 'bfs_explore' || s.state.phase === 'dfs_explore')) {
          const room = residualMatrix[Number(p.u)][Number(p.v)];
          expect(p.room, s.title).toBe(room);
          expect(p.forwardRoom + p.undoRoom, s.title).toBe(room);
          if (p.verdict === 'full') expect(room, s.title).toBe(0);
          else expect(room, s.title).toBeGreaterThan(0);
          if (p.verdict === 'seen') expect(foundBefore, s.title).toContain(p.v);
          if (p.verdict === 'take') expect(foundBefore, s.title).not.toContain(p.v);
        }
        foundBefore = search.event === 'start' ? [...search.visited] : [...(search.visited ?? [])];
      }
    }
  });
});

describe('Flow stays valid, and reverse edges mirror it', () => {
  it.each([
    ['ford-fulkerson', fordFulkersonSteps],
    ['edmonds-karp', edmondsKarpSteps],
  ] as const)('%s', (_id, gen) => {
    for (const s of run(gen, CLRS, CLRS_LABELS)) {
      const { flowMatrix: f, capacityMatrix: c, residualEdges } = s.state;
      const n = c.length;
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
          expect(f[u][v]).toBeGreaterThanOrEqual(0);
          expect(f[u][v]).toBeLessThanOrEqual(c[u][v]);
          const reverse = residualEdges.find((e) => e.kind === 'reverse' && e.u === `${v}` && e.v === `${u}`);
          expect(reverse?.room ?? 0).toBe(f[u][v]);
        }
        if (u === 0 || u === n - 1) continue;
        const into = f.reduce((a, row) => a + row[u], 0);
        const out = f[u].reduce((a, x) => a + x, 0);
        expect(into, `${s.title}: vertex ${u}`).toBe(out);
      }
    }
  });

  it('the vertices reachable at the end form a minimum cut equal to the maximum flow', () => {
    for (const gen of [fordFulkersonSteps, edmondsKarpSteps]) {
      const last = run(gen, CLRS, CLRS_LABELS).at(-1)!;
      expect(last.state.minCut!.edges.reduce((a, e) => a + e.capacity, 0)).toBe(last.result.maxFlow);
    }
  });
});

describe('The zig-zag preset tells DFS and BFS apart', () => {
  const ff = run(fordFulkersonSteps, ZIGZAG, ZIG_LABELS);
  const ek = run(edmondsKarpSteps, ZIGZAG, ZIG_LABELS);

  it('DFS wanders across the thin pipe and later sends that flow back; BFS never needs to', () => {
    expect(pathsOf(ff, ZIG_LABELS)).toEqual(['SABT+1', 'SAT+9', 'SBAT+1↩', 'SBT+9']);
    expect(pathsOf(ek, ZIG_LABELS)).toEqual(['SAT+10', 'SBT+10']);
    expect(ff.at(-1)!.result.maxFlow).toBe(20);
    expect(ek.at(-1)!.result.maxFlow).toBe(20);
    const undo = ff.find((s) => s.state.augmentLog?.some((e) => e.undo > 0))!;
    expect(undo.state.augmentLog!.find((e) => e.undo > 0)).toMatchObject({ u: '2', v: '1', undo: 1, forward: 0 });
    expect(undo.description).toMatch(/Reverse edge used: B → A sends 1 back, so the pipe A → B now carries 1 less/);
  });

  it('is offered on both pages', () => {
    for (const id of ['ford-fulkerson', 'edmonds-karp'])
      expect(getAlgorithmById(id)!.presets.map((p) => p.name)).toContain('Zig-Zag Cross Pipe (4 nodes)');
  });
});

describe('Search detail: only the moves', () => {
  it.each([
    ['ford-fulkerson', fordFulkersonSteps],
    ['edmonds-karp', edmondsKarpSteps],
  ] as const)('%s: hides dead-end looks but finds the same paths', (_id, gen) => {
    const every = run(gen, CLRS, CLRS_LABELS, 'every');
    const moves = run(gen, CLRS, CLRS_LABELS, 'moves');
    expect(moves.length).toBeLessThan(every.length);
    expect(moves.some((s) => /Is Full|Already (Visited|Found)/.test(s.title))).toBe(false);
    expect(moves.some((s) => /Skipped/.test(s.description))).toBe(true);
    expect(pathsOf(moves, CLRS_LABELS)).toEqual(pathsOf(every, CLRS_LABELS));
  });
});

describe('Technical view shows the residual graph and the search', () => {
  const render = (step: Step) => renderToStaticMarkup(<GraphVisualizer step={step} />);

  it('Ford-Fulkerson: a stack, verdict badges, dead ends and reverse edges', () => {
    const steps = run(fordFulkersonSteps, CLRS, CLRS_LABELS);
    const deeper = render(steps.find((s) => /^DFS: Go Deeper/.test(s.title))!);
    expect(deeper).toContain('data-flow-network-graph');
    expect(deeper).toContain('data-frontier="stack"');
    expect(deeper).toContain('data-probe-verdict="take"');
    expect(render(steps.find((s) => /Is Full/.test(s.title))!)).toContain('data-probe-verdict="full"');
    // After the first push, every pipe carrying flow has a reverse edge.
    const second = render(steps.find((s) => /^DFS Search 2/.test(s.title))!);
    expect((second.match(/data-reverse-edge=/g) ?? []).length).toBe(5);
    const reverseUse = render(steps.find((s) => /^DFS: Go Deeper B → C/.test(s.title))!);
    expect(reverseUse).toMatch(/data-reverse-edge="2-3" data-in-use="true"/);
    expect(render(steps.find((s) => s.state.search.deadEnds.length > 0 && s.state.phase === 'dfs_explore')!)).toContain('data-dead-end="true"');
  });

  it('Edmonds-Karp: a queue with rings and parent links', () => {
    const steps = run(edmondsKarpSteps, CLRS, CLRS_LABELS);
    const html = render(steps.find((s) => /^BFS: Discover C/.test(s.title))!);
    expect(html).toContain('data-frontier="queue"');
    expect(html).toContain('ring 2');
    expect(html).toContain('Parent links:');
  });

  it('the augment step lists what each hop did', () => {
    const steps = run(fordFulkersonSteps, ZIGZAG, ZIG_LABELS);
    const html = render(steps.find((s) => s.state.augmentLog?.some((e) => e.undo > 0))!);
    expect(html).toContain('data-augment-log');
    expect(html).toContain('sent back');
  });
});

describe('Animation mode acts out the search', () => {
  const scene = (id: string, step: Step) => {
    const Scene = STORY_SCENES[id].component;
    return renderToStaticMarkup(<Scene step={step} algorithmId={id} stepMs={stepDurationMs(0.25)} />);
  };

  it('Ford-Fulkerson: the scout lays a string, marks dead ends, and opens return valves', () => {
    const steps = run(fordFulkersonSteps, CLRS, CLRS_LABELS);
    expect(scene('ford-fulkerson', steps.find((s) => /^DFS: Go Deeper A → B/.test(s.title))!)).toContain('data-scout-string="SAB"');
    const afterDeadEnd = steps.find((s) => s.state.search.deadEnds.includes('4') && s.state.search.event === 'probe')!;
    expect(scene('ford-fulkerson', afterDeadEnd)).toContain('data-dead-end="4"');
    const valve = scene('ford-fulkerson', steps.find((s) => /^DFS: Go Deeper B → C/.test(s.title))!);
    expect(valve).toMatch(/data-valve="3-2" data-valve-open="true"/);
    expect(valve).toContain('send back 1');
  });

  it('Edmonds-Karp: ring flags, trails, and the thread pulled back from the city', () => {
    const steps = run(edmondsKarpSteps, CLRS, CLRS_LABELS);
    const discover = scene('edmonds-karp', steps.find((s) => /^BFS: Discover C/.test(s.title))!);
    expect(discover).toContain('data-ring-flag="1"');
    expect(discover).toContain('data-trail="0-1"');
    expect(discover).toContain('data-scout-queue');
    expect(scene('edmonds-karp', steps.find((s) => /^BFS: Trace Parents/.test(s.title))!)).toContain('data-trace-thread="TCAS"');
  });
});
