import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { VisualizerStage } from '../components/visualizers/VisualizerStage';
import { STORY_SCENES } from '../components/story/storyRegistry';
import { stepDurationMs } from '../components/story/useAnimPhases';
import { createHuffmanDecodingAlgorithmSteps } from '../utils/huffmanCodec';
import { nQueensSteps } from '../algorithms/nQueens';
import { subsetSumSteps } from '../algorithms/subsetSum';
import { graphColoringSteps } from '../algorithms/graphColoring';
import { buildNQueensStateSpaceTree } from '../algorithms/nQueensTree';
import { MaxSubarrayTreeView } from '../components/story/MaxSubarrayTreeView';

const stepsOf = (id: string) => {
  const a = getAlgorithmById(id)!;
  return { a, steps: [...a.stepGenerator(getDefaultInputs(a))] as any[] };
};

const renderScene = (id: string, step: any) => {
  const Scene = STORY_SCENES[id].component;
  return renderToStaticMarkup(<Scene step={step} algorithmId={id} stepMs={stepDurationMs(0.25)} />);
};

const narrationOf = (html: string) => {
  const m = html.match(/data-story-narration[^>]*>([^<]*)</);
  return m ? m[1] : '';
};

describe('Story (Animation) Mode', () => {
  const ids = Object.keys(STORY_SCENES);

  it('registers scenes only for real algorithms, leaving Fractional Knapsack’s own toggle alone', () => {
    for (const id of ids) expect(getAlgorithmById(id), id).toBeDefined();
    expect(STORY_SCENES['fractional-knapsack']).toBeUndefined();
  });

  it.each(ids)('%s opens on the existing technical view, with the toggle on top', (id) => {
    const { a, steps } = stepsOf(id);
    const html = renderToStaticMarkup(<VisualizerStage config={a} step={steps[1]} inputs={getDefaultInputs(a)} />);
    expect(html).toContain('data-story-toggle');
    expect(html).toContain('Animation Mode');
    expect(html).toMatch(/data-view-mode="technical" role="radio" aria-checked="true"/);
    expect(html).not.toContain('data-story-stage');
  });

  it('Fractional Knapsack keeps its own built-in toggle (no second one is added)', () => {
    const { a, steps } = stepsOf('fractional-knapsack');
    const html = renderToStaticMarkup(<VisualizerStage config={a} step={steps[0]} inputs={getDefaultInputs(a)} />);
    expect(html).not.toContain('data-story-toggle');
  });

  it.each(ids)('%s scene renders every step with a plain-English narration', (id) => {
    const { steps } = stepsOf(id);
    expect(steps.length).toBeGreaterThan(2);
    for (const step of steps) {
      const html = renderScene(id, step);
      expect(html, step.title).toContain('data-story-stage');
      const text = narrationOf(html);
      expect(text.length, step.title).toBeGreaterThan(15);
      expect(text, step.title).not.toMatch(/undefined|NaN/);
      expect(html, step.title).not.toMatch(/NaN/);
    }
  });

  it('KMP: on a fallback the stencil starts where it was, then glides (finger never moves back)', () => {
    const { steps } = stepsOf('kmp');
    const fallback = steps.find((s) => /^Mismatch: j Falls Back/.test(s.title));
    expect(fallback).toBeDefined();
    const html = renderScene('kmp', fallback);
    const before = fallback.state.shift - fallback.state.shiftAmount;
    expect(html).toContain(`data-stencil-shift="${before}"`);
    expect(narrationOf(html)).toMatch(/finger stays put/);
  });

  it('0-1 Knapsack DP: a new cubby stays empty until the balance scale has decided', () => {
    const { steps } = stepsOf('knapsack-dp');
    const choose = steps.find((s) => /^Evaluate/.test(s.title));
    const html = renderScene('knapsack-dp', choose);
    expect(html).toContain('Balance scale');
    expect(narrationOf(html)).toMatch(/Two choices/);
  });

  it('Push-Relabel narrates pushes downhill and jacks for relabels', () => {
    const { steps } = stepsOf('push-relabel');
    const push = steps.find((s) => s.state.phase === 'push');
    const relabel = steps.find((s) => s.state.phase === 'relabel');
    expect(narrationOf(renderScene('push-relabel', push))).toMatch(/pours down/);
    expect(narrationOf(renderScene('push-relabel', relabel))).toMatch(/jack lifts/);
  });

  it('Huffman: decoding steps roll a marble down the mobile and spell the message', () => {
    const { steps } = stepsOf('huffman');
    const last = steps[steps.length - 1];
    const decode = createHuffmanDecodingAlgorithmSteps(last.state.treeRoot, last.state.encodedBits, last.state.inputText);
    for (const s of decode) {
      const text = narrationOf(renderScene('huffman', s));
      expect(text, s.title).not.toMatch(/undefined|NaN/);
      expect(text.length, s.title).toBeGreaterThan(15);
    }
    const end = renderScene('huffman', decode[decode.length - 1]);
    expect(narrationOf(end)).toContain(last.state.inputText);
  });

  it('N-Queens find-all mode fills the solutions shelf', () => {
    const steps = [...nQueensSteps({ n: 4, findAll: true })];
    for (const s of steps) expect(narrationOf(renderScene('n-queens', s)), s.title).not.toMatch(/undefined|NaN/);
    const html = renderScene('n-queens', steps[steps.length - 1]);
    expect(html).toContain('Solutions shelf');
    expect(narrationOf(html)).toMatch(/2 different ways/);
  });

  it('N-Queens: a conflict names the attacking queen once the arrow has fired', () => {
    const { steps } = stepsOf('n-queens');
    const conflict = steps.find((s) => s.state.action === 'conflict');
    expect(narrationOf(renderScene('n-queens', conflict))).toMatch(/^Row \d+: what about column \d+\?$/);
  });

  it('Bellman-Ford: the van narrates the price it carries', () => {
    const { steps } = stepsOf('bellman-ford');
    const relax = steps.find((s) => /^Relax/.test(s.title));
    expect(narrationOf(renderScene('bellman-ford', relax))).toMatch(/A van drives .* coins\./);
  });

  it('Floyd-Warshall: the final step offers an interactive trip planner', () => {
    const { steps } = stepsOf('floyd-warshall');
    const html = renderScene('floyd-warshall', steps[steps.length - 1]);
    expect(html).toContain('Trip planner');
    expect(html).toContain('aria-label="From town"');
  });

  it('Subset Sum (find all) lists every balanced group', () => {
    const steps = [...subsetSumSteps({ numbers: [1, 2, 3, 4], targetSum: 5, findMode: 'all' })];
    for (const s of steps) expect(narrationOf(renderScene('subset-sum', s)), s.title).not.toMatch(/undefined|NaN/);
    const html = renderScene('subset-sum', steps[steps.length - 1]);
    expect(html).toContain('1 + 4');
    expect(html).toContain('2 + 3');
  });

  it('Graph Coloring says when there are not enough colours', () => {
    const steps = [...graphColoringSteps({ numColors: 2 })];
    for (const s of steps) expect(narrationOf(renderScene('graph-coloring', s)), s.title).not.toMatch(/undefined|NaN/);
    expect(narrationOf(renderScene('graph-coloring', steps[steps.length - 1]))).toMatch(/not enough/);
  });

  it.each(['knapsack-bb', 'job-selection-bb'])('%s ropes off caves that cannot beat the trophy chest', (id) => {
    const { steps } = stepsOf(id);
    const final = renderScene(id, steps[steps.length - 1]);
    expect(narrationOf(final)).toMatch(/best treasure is/);
    const kinds = [...final.matchAll(/data-tree-node="([^"]+)" data-kind="([a-z]+)"/g)].map((m) => m[2]);
    expect(kinds).toContain('pruned');
    expect(final).toMatch(/can’t beat 🏆|too heavy|misses a deadline/);
    // The camera ends on the trophy cave.
    expect(kinds.filter((k) => k === 'solution').length).toBe(1);
  });

  it('Maximum Subarray keeps the coin road by default and offers the split & merge tree', () => {
    const { steps } = stepsOf('max-subarray');
    const html = renderScene('max-subarray', steps[1]);
    expect(html).toContain('aria-label="Coin road"');
    expect(html).toMatch(/data-road-view="tree"[^>]*>🌳 Split &amp; merge tree/);
    expect(html).not.toContain('data-max-subarray-tree');
  });

  it('Maximum Subarray tree: pieces split on the way down and report their best on the way up', () => {
    const { steps } = stepsOf('max-subarray');
    const n = steps[0].state.array.length;
    const piecesOf = (html: string) => [...html.matchAll(/data-piece="([^"]+)" data-state="([a-z_]+)"/g)].map((m) => ({ key: m[1], state: m[2] }));
    for (const s of steps) {
      const html = renderToStaticMarkup(
        <MaxSubarrayTreeView arr={s.state.array} nodes={s.state.treeNodes} activeId={s.state.activeNodeId} scan={s.state.crossScan} isFinal={!!s.isFinal} stepKey={s.stepIndex} />
      );
      const pieces = piecesOf(html);
      // The whole plan is drawn from the start: 2n - 1 pieces, unvisited ones marked "later".
      expect(pieces.length, s.title).toBe(2 * n - 1);
      expect(pieces.filter((p) => p.state !== 'later').length, s.title).toBe(s.state.treeNodes.length);
      expect(html, s.title).not.toMatch(/undefined|NaN/);
    }
    const last = steps[steps.length - 1];
    const end = renderToStaticMarkup(
      <MaxSubarrayTreeView arr={last.state.array} nodes={last.state.treeNodes} activeId={last.state.activeNodeId} isFinal stepKey={last.stepIndex} narration="The richest stretch is found." stepLabel="Step 88" />
    );
    // The owl's sentence sits right above the tree, with zoom and follow controls.
    expect(end).toMatch(/data-tree-narration[^>]*>.*The richest stretch is found\./s);
    expect(end).toContain('aria-label="Zoom in"');
    expect(end).toContain('🎯 Follow');
    expect(piecesOf(end).every((p) => p.state !== 'later')).toBe(true);
    expect(end).toMatch(/↑-?\d+/);
    expect(end).toContain(`answer for the whole road: ${last.result.maxSum} coins`);
  });

  it.each(['knapsack-bb', 'job-selection-bb'])('%s: the cave tree follows best-first search and shows caves waiting in line', (id) => {
    const { steps } = stepsOf(id);
    let sawWaiting = false;
    for (const s of steps) {
      const html = renderScene(id, s);
      expect(html, s.title).toContain('data-state-space-tree');
      if (s.state.activeNodeId && !s.isFinal) expect(html, s.title).toContain(`data-tree-node="${s.state.activeNodeId}"`);
      if (/data-kind="waiting"/.test(html)) sawWaiting = true;
      expect(html, s.title).not.toMatch(/undefined|NaN/);
    }
    expect(sawWaiting).toBe(true);
  });

  it('Karatsuba: the final step shows the product and the empty fourth chair appears while splitting', () => {
    const { steps } = stepsOf('karatsuba');
    const final = steps[steps.length - 1];
    expect(narrationOf(renderScene('karatsuba', final))).toContain(`= ${final.result.product}`);
    const split = steps.find((s) => /^Step 2A/.test(s.title));
    expect(renderScene('karatsuba', split)).toContain('not needed!');
  });

  it('LCS: the final step ties the shared chain with golden threads', () => {
    const { steps } = stepsOf('lcs');
    const final = steps[steps.length - 1];
    expect(narrationOf(renderScene('lcs', final))).toContain(final.state.lcsString);
  });

  it('Matrix Chain: the best order is shown as nested gift boxes', () => {
    const { steps } = stepsOf('matrix-chain-multiplication');
    expect(renderScene('matrix-chain-multiplication', steps[steps.length - 1])).toContain('🎀');
  });

  it('Assembly Line and TSP finish with the fastest / cheapest route', () => {
    const al = stepsOf('assembly-line-scheduling').steps;
    expect(narrationOf(renderScene('assembly-line-scheduling', al[al.length - 1]))).toMatch(/fastest route through the factory takes \d+ minutes/);
    const tsp = stepsOf('tsp').steps;
    expect(narrationOf(renderScene('tsp', tsp[tsp.length - 1]))).toMatch(/cheapest round trip costs \d+/);
  });

  it('every algorithm now has an Animation Mode', () => {
    for (const a of algorithmRegistry) {
      expect(!!STORY_SCENES[a.id] || a.id === 'fractional-knapsack', a.id).toBe(true);
    }
  });

  it('Randomized Quicksort crowns the pivot and hands out medals', () => {
    const { steps } = stepsOf('randomized-quicksort');
    const placed = steps.find((s) => /^Pivot in Final/.test(s.title));
    const html = renderScene('randomized-quicksort', placed);
    expect(html).toContain('👑');
    expect(html).toContain('🏅');
  });

  it('Hiring Problem fills the hiring jar once per hire', () => {
    const { steps } = stepsOf('hiring-problem');
    const final = steps[steps.length - 1];
    expect(narrationOf(renderScene('hiring-problem', final))).toContain(`${final.state.hiredIndices.length} hired`);
  });

  it('Karger ends with two balls and counts the ropes between them', () => {
    const { steps } = stepsOf('karger-min-cut');
    const final = steps[steps.length - 1];
    expect(final.state.nodes).toHaveLength(2);
    expect(narrationOf(renderScene('karger-min-cut', final))).toMatch(/cut of size \d+/);
  });

  it('Suffix Tree search marks the apples where the pattern starts', () => {
    const { steps } = stepsOf('suffix-tree');
    const final = steps[steps.length - 1];
    expect(narrationOf(renderScene('suffix-tree', final))).toContain(final.state.matchIndices.join(', '));
  });

  it('Vertex Cover, Set Cover and TSP Approx explain their guarantee at the end', () => {
    const vc = stepsOf('vertex-cover-approx').steps;
    expect(narrationOf(renderScene('vertex-cover-approx', vc[vc.length - 1]))).toMatch(/at most twice/);
    const sc = stepsOf('set-cover').steps;
    expect(narrationOf(renderScene('set-cover', sc[sc.length - 1]))).toMatch(/Every house has signal/);
    const tsp = stepsOf('tsp-approx').steps;
    expect(narrationOf(renderScene('tsp-approx', tsp[tsp.length - 1]))).toMatch(/at most twice the best/);
  });

  const kindsOf =(html: string) => [...html.matchAll(/data-tree-node="([^"]+)" data-kind="([a-z]+)"/g)].map((m) => ({ id: m[1], kind: m[2] }));

  it.each([
    [4, false],
    [4, true],
    [5, false],
  ] as const)('N-Queens (n=%i, findAll=%s): the search tree grows in step with the board', (n, findAll) => {
    const steps = [...nQueensSteps({ n, findAll })];
    const tree = buildNQueensStateSpaceTree(n, true);
    for (const s of steps) {
      const html = renderScene('n-queens', s);
      expect(html, s.title).toContain('data-state-space-tree');
      const nodes = kindsOf(html);
      // Exactly one node is "current" (now / being tried / just cut / an answer).
      const current = nodes.filter((x) => x.kind === 'active' || x.kind === 'trying');
      expect(current.length, s.title).toBeLessThanOrEqual(1);
      if (s.state.action === 'place') expect(current[0]?.kind, s.title).toBe('active');
      if (s.state.action === 'conflict') expect(current[0]?.kind, s.title).toBe('trying'); // cut only after the arrow fires
      // Only nodes visited so far are drawn.
      for (const x of nodes) expect(tree.nodes[x.id].firstStepIndex, `${s.title} ${x.id}`).toBeLessThanOrEqual(s.stepIndex);
    }
    const end = kindsOf(renderScene('n-queens', steps[steps.length - 1]));
    expect(end.some((x) => x.kind === 'solution')).toBe(true);
    expect(end.some((x) => x.kind === 'pruned')).toBe(true);
  });

  it('N-Queens: big searches fold finished branches so the tree stays small', () => {
    const steps = [...nQueensSteps({ n: 6, findAll: true })];
    const total = Object.keys(buildNQueensStateSpaceTree(6, true).nodes).length;
    const html = renderScene('n-queens', steps[steps.length - 1]);
    const shown = kindsOf(html);
    expect(shown.length).toBeLessThan(total / 2);
    expect(html).toContain('finished branch, folded up');
    // The few answers stay reachable: all 4 solutions of 6-queens are drawn.
    expect(shown.filter((x) => x.kind === 'solution').length).toBe(4);
  });

  it('Subset Sum: the tree shows take / skip choices and cuts pruned branches', () => {
    const steps = [...subsetSumSteps({ numbers: [1, 2, 3, 4, 6], targetSum: 7, findMode: 'all' })];
    for (const s of steps) {
      const html = renderScene('subset-sum', s);
      expect(html, s.title).toContain('data-state-space-tree');
      expect(html, s.title).toContain(`data-tree-node="${s.state.activeNodeId}"`);
    }
    const prune = steps.find((s) => /^Prune: \+/.test(s.title))!;
    const html = renderScene('subset-sum', prune);
    expect(kindsOf(html).find((x) => x.id === prune.state.activeNodeId)?.kind).toBe('trying');
    const end = renderScene('subset-sum', steps[steps.length - 1]);
    expect(end).toMatch(/take \d+/);
    expect(end).toMatch(/skip \d+/);
    expect(kindsOf(end).some((x) => x.kind === 'solution')).toBe(true);
    // Cut branches stay visible, either as snipped nodes or counted on a folded bundle.
    expect(kindsOf(end).some((x) => x.kind === 'pruned') || /done · ✂\d+/.test(end)).toBe(true);
  });

  it.each(['ford-fulkerson', 'edmonds-karp'])('%s: every pipe carries a flow / capacity tag, and routes show room and the bottleneck', (id) => {
    const { steps } = stepsOf(id);
    for (const s of steps) {
      const html = renderScene(id, s);
      const tags = [...html.matchAll(/data-pipe-tag="[^"]+"/g)].length;
      const pipes = [...html.matchAll(/data-pipe="[^"]+"/g)].length;
      expect(tags, s.title).toBe(pipes);
      expect(html, s.title).toMatch(/\d+ \/ \d+|full \d+\/\d+/);
      expect(html, s.title).not.toMatch(/undefined|NaN/);
    }
  });
});
