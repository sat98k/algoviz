import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { VisualizerStage } from '../components/visualizers/VisualizerStage';
import { bbNodeName } from '../algorithms/knapsackBB';
import { jobNodeName } from '../algorithms/jobSelectionBB';

const inputSets = (id: string) => {
  const a = getAlgorithmById(id)!;
  return [getDefaultInputs(a), ...(a.presets ?? []).map((p) => ({ ...getDefaultInputs(a), ...p.data }))];
};
const stepsFor = (id: string, inputs: Record<string, any>) => [...getAlgorithmById(id)!.stepGenerator(inputs)] as any[];
const lines = (s: any): number[] => (s.codeLine === undefined ? [] : Array.isArray(s.codeLine) ? s.codeLine : [s.codeLine]);
const codeOf = (id: string, s: any) => lines(s).map((l) => getAlgorithmById(id)!.pseudocode![l - 1]).join('\n');

describe('Every step points at a real pseudocode line', () => {
  it.each(algorithmRegistry.map((a) => [a.id] as const))('%s (default input and every preset)', (id) => {
    const code = getAlgorithmById(id)!.pseudocode!;
    for (const inputs of inputSets(id))
      for (const s of stepsFor(id, inputs))
        for (const l of lines(s)) {
          expect(l, `${s.title}: line ${l} of ${code.length}`).toBeGreaterThanOrEqual(1);
          expect(l, `${s.title}: line ${l} of ${code.length}`).toBeLessThanOrEqual(code.length);
          expect(code[l - 1].trim(), `${s.title}: line ${l} is blank`).not.toBe('');
        }
  });
});

describe('Edmonds-Karp pseudocode lines', () => {
  const steps = stepsFor('edmonds-karp', getDefaultInputs(getAlgorithmById('edmonds-karp')!));

  it('each step highlights the operation it performs', () => {
    const byTitle = (re: RegExp) => steps.filter((s) => re.test(s.title));
    expect(codeOf('edmonds-karp', steps[0])).toMatch(/initialize flow = 0/);
    for (const s of byTitle(/^BFS Frontier/)) expect(codeOf('edmonds-karp', s)).toMatch(/BFS_ShortestPath/);
    const found = byTitle(/^Shortest Augmenting Path Discovered/);
    expect(found.length).toBeGreaterThan(0);
    for (const s of found) expect(codeOf('edmonds-karp', s)).toMatch(/bottleneck = min_capacity_along/);
    const augment = byTitle(/^Augment Residual Flow/);
    expect(augment.length).toBeGreaterThan(0);
    for (const s of augment) {
      expect(codeOf('edmonds-karp', s)).toMatch(/flow\[u\]\[v\] \+= bottleneck/);
      expect(codeOf('edmonds-karp', s)).not.toMatch(/return totalFlow/);
    }
    expect(codeOf('edmonds-karp', steps.at(-1))).toMatch(/return totalFlow/);
  });
});

describe('TSP 2-approximation pseudocode lines', () => {
  const steps = stepsFor('tsp-approx', getDefaultInputs(getAlgorithmById('tsp-approx')!));

  it('each step highlights the operation it performs', () => {
    for (const s of steps.filter((x) => /^(MST Cut Evaluation|Add Edge)/.test(x.title))) expect(codeOf('tsp-approx', s)).toMatch(/PrimMST/);
    expect(codeOf('tsp-approx', steps.find((s) => /Double Every MST Edge/.test(s.title))!)).toMatch(/doubleEdges/);
    const shortcuts = steps.filter((s) => /^DFS Preorder Shortcut/.test(s.title));
    expect(shortcuts.length).toBeGreaterThan(0);
    for (const s of shortcuts) {
      expect(codeOf('tsp-approx', s)).toMatch(/shortcut\(preorderWalk\)/);
      expect(codeOf('tsp-approx', s)).not.toMatch(/return tour/);
    }
    expect(codeOf('tsp-approx', steps.at(-1))).toMatch(/return tour/);
  });
});

describe('Branch & Bound steps never show internal node ids', () => {
  it.each(['knapsack-bb', 'job-selection-bb'])('%s: titles, explanations and the rendered tree use readable names', (id) => {
    const a = getAlgorithmById(id)!;
    for (const inputs of inputSets(id)) {
      const steps = stepsFor(id, inputs);
      for (const s of steps) {
        expect(`${s.title} ${s.description} ${s.state.explanation ?? ''}`, s.title).not.toMatch(/node-\d/);
        const visible = renderToStaticMarkup(<VisualizerStage config={a} step={s} inputs={inputs} />).replace(/<[^>]+>/g, ' ');
        expect(visible).not.toMatch(/node-\d/);
      }
      // Internal ids are still used for state.
      expect(steps.some((s) => /^node-\d+$/.test(s.state.activeNodeId ?? ''))).toBe(true);
    }
  });

  it('readable names describe the node by what the tree shows', () => {
    expect(bbNodeName({ level: 0, weight: 0, value: 0 })).toBe('the root');
    expect(bbNodeName({ level: 2, weight: 5, value: 7 })).toBe('the level-2 node (weight 5, value 7)');
    expect(jobNodeName({ level: 0, selectedJobs: [] })).toBe('the root');
    expect(jobNodeName({ level: 2, selectedJobs: [3, 1] })).toBe('the node with {J1, J3}');
    expect(jobNodeName({ level: 1, selectedJobs: [] })).toBe('the node with no jobs chosen (level 1)');
    const steps = stepsFor('job-selection-bb', getDefaultInputs(getAlgorithmById('job-selection-bb')!));
    expect(steps.some((s) => /Took the (root|node with)/.test(s.description))).toBe(true);
  });
});
