import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { tspSteps } from '../algorithms/tsp';
import { exactMinCut } from '../algorithms/kargerMinCut';
import { ResultPanel } from '../components/common/ResultPanel';
import { TspVisualizer } from '../components/visualizers/TspVisualizer';

/**
 * C29: preset labels and pre-run UI describe the problem instance, never its answer.
 * The answer may appear only in the final step and the final result.
 */

const run = (id: string, inputs: Record<string, any>) => [...getAlgorithmById(id)!.stepGenerator(inputs)];
const presetText = (id: string) => {
  const a = getAlgorithmById(id)!;
  return [
    ...a.presets.flatMap((p) => [p.name, p.description ?? '']),
    ...a.inputSchema.flatMap((f) => [...(f.options ?? []).map((o) => o.label), f.helperText ?? '']),
  ];
};

// Phrases that announce an outcome rather than describe an input.
const SPOILER = /\bOPT\s*=|optimal[\w ]{0,15}?\d|\bwith cost \d|min(imum)?[- ]cut\s*=|max(imum)? flow\s*=?\s*\d|profit \d|\d+ solutions?\b|→ *(subset|all|no)|->\s*min|min cost \d|\bunsolvable\b|\bsolvable\b|no solution|all fit|hire all|hire first|corners hull|approx\s*=|zero intersections|intersect only|highest profit wins|finds optimal/i;

describe('Preset labels describe instances, not answers', () => {
  it.each(algorithmRegistry.map((a) => [a.id] as const))('%s: no outcome phrases in presets or input options', (id) => {
    for (const text of presetText(id)) expect(text, `${id}: "${text}"`).not.toMatch(SPOILER);
  });

  it('N-Queens presets do not reveal solution counts', () => {
    for (const p of getAlgorithmById('n-queens')!.presets) {
      expect(p.name).not.toMatch(/solution|\b(2|10|92)\b/i);
    }
  });

  it('Job Selection presets do not reveal the maximum profit or chosen jobs', () => {
    for (const p of getAlgorithmById('job-selection-bb')!.presets) {
      const final = run('job-selection-bb', p.data).pop()!;
      const text = `${p.name} ${p.description ?? ''}`;
      expect(text, p.name).not.toContain(String(final.result.maxProfit));
      expect(text, p.name).not.toMatch(/\[J\d/);
    }
  });

  it('TSP presets do not reveal optimal or approximate tour costs', () => {
    for (const id of ['tsp', 'tsp-approx']) {
      for (const p of getAlgorithmById(id)!.presets) {
        const opt = [...tspSteps({ costMatrix: p.data.costMatrix })].pop()!.result.optimalCost;
        const approx = run('tsp-approx', p.data).pop()!.result.tourCost;
        const text = `${p.name} ${p.description ?? ''}`;
        for (const v of [opt, approx]) expect(text, `${id}: ${p.name}`).not.toMatch(new RegExp(`\\b${v}\\b`));
      }
    }
  });

  it('Karger presets and options do not reveal the minimum cut', () => {
    const a = getAlgorithmById('karger-min-cut')!;
    for (const text of presetText('karger-min-cut')) expect(text).not.toMatch(/cut\s*=|min-cut/i);
    for (const p of a.presets) {
      const ids = [...new Set((p.data.edgeList as [string, string][]).flat())];
      const min = exactMinCut(ids, p.data.edgeList);
      expect(p.name, p.name).not.toMatch(new RegExp(`\\(.*\\b${min}\\b.*\\)`));
    }
  });
});

describe('Final answers are not revealed before the computation finishes', () => {
  it.each(algorithmRegistry.map((a) => [a.id, a] as const))('%s: only the final step carries a result', (_id, a) => {
    const steps = [...a.stepGenerator(getDefaultInputs(a))];
    steps.slice(0, -1).forEach((s) => expect(s.result, `step ${s.stepIndex}`).toBeUndefined());
    expect(steps[steps.length - 1].isFinal).toBe(true);
  });

  it('the result panel stays empty before the final step', () => {
    expect(renderToStaticMarkup(<ResultPanel result={undefined} isFinal={false} />)).toBe('');
  });

  it('Karger: the reference minimum appears only after the randomized run, as verification', () => {
    const steps = run('karger-min-cut', { ...getDefaultInputs(getAlgorithmById('karger-min-cut')!), seed: 4 });
    const final = steps[steps.length - 1];
    steps.slice(0, -1).forEach((s) => {
      expect(`${s.title} ${s.description}`).not.toMatch(/true minimum|every partition|best of|independent runs/i);
    });
    expect(final.description).toMatch(/This run ended with/);
    expect(final.description.indexOf('Checking every partition')).toBeGreaterThan(final.description.indexOf('This run ended with'));
  });

  it('TSP (Held-Karp): the minimum cost first appears on the step that computes it', () => {
    const steps = run('tsp', getDefaultInputs(getAlgorithmById('tsp')!));
    const first = steps.findIndex((s) => s.state?.optimalCost !== undefined);
    expect(first).toBeGreaterThan(0);
    expect(steps[first].title + steps[first].description).toMatch(/clos/i);
  });

  it('TSP 2-Approx: no tour cost before the shortcut phase', () => {
    const steps = run('tsp-approx', getDefaultInputs(getAlgorithmById('tsp-approx')!));
    for (const s of steps) {
      if (['init', 'mst', 'double'].includes(s.state.currentPhase)) expect(s.state.optimalCost).toBeUndefined();
    }
  });

  it('Job Selection: "optimal" is announced only in the final step', () => {
    const steps = run('job-selection-bb', getDefaultInputs(getAlgorithmById('job-selection-bb')!));
    steps.slice(0, -1).forEach((s) => expect(s.title).not.toMatch(/optimal/i));
    expect(steps[steps.length - 1].title).toMatch(/Complete/);
  });

  it('N-Queens: no solution totals during the run; completion notes other solutions may exist', () => {
    const steps = run('n-queens', getDefaultInputs(getAlgorithmById('n-queens')!));
    steps.slice(0, -1).forEach((s) => expect(s.description).not.toMatch(/solutions? exist|in total/i));
    expect(steps[steps.length - 1].description).toContain('does not look for the remaining solutions');
  });
});

describe('Educational intermediate values stay visible', () => {
  it('Job Selection shows the best profit improving during the run', () => {
    const steps = run('job-selection-bb', getDefaultInputs(getAlgorithmById('job-selection-bb')!));
    const finalProfit = steps[steps.length - 1].result.maxProfit;
    const seen = steps.map((s) => s.state.bestProfit as number);
    expect(seen[0]).toBe(0);
    expect(seen.some((v) => v > 0 && v < finalProfit)).toBe(true);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
  });

  it('TSP 2-Approx shows the running tour cost while shortcutting', () => {
    const steps = run('tsp-approx', getDefaultInputs(getAlgorithmById('tsp-approx')!));
    const costs = steps.filter((s) => s.state.currentPhase === 'shortcut').map((s) => s.state.optimalCost as number);
    expect(costs.length).toBeGreaterThan(1);
    for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1]);
  });

  it('Karger shows the super-node count shrinking as edges are contracted', () => {
    const steps = run('karger-min-cut', { ...getDefaultInputs(getAlgorithmById('karger-min-cut')!), seed: 2 });
    const counts = steps.map((s) => s.state.nodes.length);
    expect(counts[0]).toBe(6);
    expect(counts[counts.length - 1]).toBe(2);
  });

  it('Knapsack DP shows each cell value as it is computed', () => {
    const steps = run('knapsack-dp', getDefaultInputs(getAlgorithmById('knapsack-dp')!));
    expect(steps.filter((s) => s.state.dpRule && /= \d+$/.test(s.state.dpRule.substitution)).length).toBeGreaterThan(5);
  });

  it('TSP visualizer labels a partial approximate cost as "so far", not as the minimum', () => {
    const steps = run('tsp-approx', getDefaultInputs(getAlgorithmById('tsp-approx')!));
    const mid = steps.find((s) => s.state.currentPhase === 'shortcut')!;
    const done = steps[steps.length - 1];
    const a = getAlgorithmById('tsp-approx')!;
    const midHtml = renderToStaticMarkup(<TspVisualizer step={mid} inputs={getDefaultInputs(a)} presets={a.presets} />);
    const doneHtml = renderToStaticMarkup(<TspVisualizer step={done} inputs={getDefaultInputs(a)} presets={a.presets} />);
    expect(midHtml).toContain('Tour Cost So Far');
    expect(midHtml).not.toContain('Min Tour Cost');
    expect(doneHtml).toContain('Approx. Tour Cost');
  });
});
