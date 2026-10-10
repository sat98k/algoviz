import { describe, it, expect } from 'vitest';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { checkMetric, tspApproxSteps } from '../algorithms/tspApprox';
import { tspSteps } from '../algorithms/tsp';
import { contractOnce, exactMinCut, kargerMinCutSteps, seededRandom } from '../algorithms/kargerMinCut';
import { nQueensSteps } from '../algorithms/nQueens';
import { buildResultSummary } from '../utils/resultSummary';
import { getDefaultInputs } from '../utils/comparison';

const runAll = (id: string, inputs: Record<string, any>) => [...getAlgorithmById(id)!.stepGenerator(inputs)];
const presetsOf = (id: string) => getAlgorithmById(id)!.presets;
const allText = (steps: any[]) =>
  steps.map((s) => `${s.title} ${s.description} ${s.state?.calculationFormula ?? ''} ${s.state?.explanation ?? ''}`).join('\n');

const NON_METRIC = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];

/** Every "a ≤ 2 × W(MST) = b" style statement shown to the learner must actually hold. */
const assertNoFalseMstBound = (text: string) => {
  const normalized = text.replace(/2 [×*] W\(MST\)/g, 'TWOMST');
  const re = /(\d+(?:\.\d+)?)\)?\s*(?:≤|<=)\s*TWOMST\s*(?:=\s*|\()(\d+(?:\.\d+)?)/g;
  for (const m of normalized.matchAll(re)) {
    expect(Number(m[1]), `false bound in: ${m[0]}`).toBeLessThanOrEqual(Number(m[2]));
  }
};

describe('TSP 2-Approximation: guarantee only when its assumptions hold', () => {
  it('checkMetric detects triangle-inequality violations and asymmetry', () => {
    expect(checkMetric([[0, 30, 50, 40], [30, 0, 40, 50], [50, 40, 0, 30], [40, 50, 30, 0]]).isMetric).toBe(true);

    const bad = checkMetric(NON_METRIC);
    expect(bad.isMetric).toBe(false);
    expect(bad.isSymmetric).toBe(true);
    expect(bad.violation).toMatchObject({ direct: 35, detour: 25 });

    const asym = checkMetric([[0, 1, 2], [3, 0, 1], [2, 1, 0]]);
    expect(asym.isSymmetric).toBe(false);
    expect(asym.isMetric).toBe(false);
  });

  it('the default teaching input is metric and the bound genuinely holds', () => {
    const inputs = getDefaultInputs(getAlgorithmById('tsp-approx')!);
    expect(checkMetric(inputs.costMatrix).isMetric).toBe(true);

    const final = runAll('tsp-approx', inputs).pop()!;
    const opt = [...tspSteps({ costMatrix: inputs.costMatrix })].pop()!.result.optimalCost;
    expect(final.result.guaranteeHolds).toBe(true);
    expect(final.result.tourCost).toBeLessThanOrEqual(final.result.doubledWeight);
    expect(final.result.doubledWeight).toBeLessThanOrEqual(2 * opt);
    expect(opt).toBe(140);
    expect(final.result.tourCost).toBe(160);
  });

  it('presets are labelled truthfully: "Metric" presets are metric, the non-metric one says so', () => {
    for (const p of presetsOf('tsp-approx')) {
      const metric = checkMetric(p.data.costMatrix).isMetric;
      if (/non-metric/i.test(p.name)) expect(metric, p.name).toBe(false);
      else expect(metric, p.name).toBe(true);
    }
  });

  it('a non-metric input shows a warning, never an unsupported guarantee or a false inequality', () => {
    const steps = [...tspApproxSteps({ costMatrix: NON_METRIC })];
    const final = steps[steps.length - 1];
    expect(final.result.isMetric).toBe(false);
    expect(final.result.guaranteeHolds).toBe(false);
    expect(final.result.tourCost).toBe(95);
    expect(final.result.doubledWeight).toBe(90);
    expect(final.description).toContain('No approximation guarantee applies');
    expect(final.description).toContain('95 > 2 × W(MST) = 90');
    expect(final.result.approxRatioBound).toMatch(/^No guarantee/);
    expect(steps[0].description).toContain('Warning');
    expect(allText(steps)).not.toContain('≤ 2 × OPT.');
    assertNoFalseMstBound(allText(steps) + final.result.approxRatioBound);
  });

  it('no preset ever displays a false MST bound', () => {
    for (const p of presetsOf('tsp-approx')) {
      const steps = runAll('tsp-approx', p.data);
      assertNoFalseMstBound(allText(steps) + steps[steps.length - 1].result.approxRatioBound);
    }
  });

  it('explains MST ≤ OPT, doubling, and why metric shortcuts cannot add cost', () => {
    const steps = runAll('tsp-approx', getDefaultInputs(getAlgorithmById('tsp-approx')!));
    const text = allText(steps);
    expect(text).toContain('deleting one edge from an optimal tour leaves a spanning tree, so W(MST) ≤ OPT');
    expect(text).toContain('2 × W(MST)');
    expect(text).toContain('shortcutting cannot increase the cost');
  });

  it('every step carries the metric check for the visualizer', () => {
    for (const s of [...tspApproxSteps({ costMatrix: NON_METRIC })]) expect(s.state.metricCheck.isMetric).toBe(false);
  });

  it('random inputs are always metric', () => {
    const gen = getAlgorithmById('tsp-approx')!.generateRandomInput;
    for (let i = 0; i < 50; i++) expect(checkMetric(gen().costMatrix).isMetric).toBe(true);
  });

  it('result summary warns for non-metric inputs', () => {
    const final = [...tspApproxSteps({ costMatrix: NON_METRIC })].pop()!;
    const summary = buildResultSummary(final.result, getAlgorithmById('tsp-approx')!.summarizeResult, {});
    expect(summary.headline).toContain('not metric');
    expect(summary.details).toContainEqual(expect.objectContaining({ label: 'Guarantee' }));
  });
});

describe('Karger: a run produces a candidate cut, not a guaranteed minimum', () => {
  const barbell = presetsOf('karger-min-cut')[0].data.edgeList as [string, string][];
  const ids = (edges: [string, string][]) => [...new Set(edges.flat())].sort((a, b) => +a - +b);

  it('exact minimum cut is correct for each preset graph', () => {
    const expected = [2, 1, 3]; // barbell (two bridges), one bridge, K4
    presetsOf('karger-min-cut').forEach((p, i) => {
      expect(exactMinCut(ids(p.data.edgeList), p.data.edgeList), p.name).toBe(expected[i]);
    });
  });

  it('a seed replays the same run', () => {
    const a = [...kargerMinCutSteps({ edgeList: barbell, seed: 7 })].pop()!.result;
    const b = [...kargerMinCutSteps({ edgeList: barbell, seed: 7 })].pop()!.result;
    expect(a).toEqual(b);
  });

  it('never calls a single run’s cut the minimum, and says so when it is not', () => {
    let sawNonMinimum = false;
    for (let seed = 1; seed <= 60; seed++) {
      const final = [...kargerMinCutSteps({ edgeList: barbell, seed })].pop()!;
      expect(final.title).not.toMatch(/Min-Cut Complete/);
      expect(final.title).toContain('This Run');
      expect(final.result.trueMinCutSize).toBe(2);
      if (final.result.cutSize > 2) {
        sawNonMinimum = true;
        expect(final.result.thisRunIsMinimum).toBe(false);
        expect(final.description).toContain('this run did not find it');
      } else {
        expect(final.description).toContain('this run found a minimum cut');
      }
      expect(final.description).toContain('only a candidate');
    }
    expect(sawNonMinimum).toBe(true); // the default barbell graph really does produce non-minimum runs
  });

  it('distinguishes this run, the best of all runs, and the true minimum', () => {
    const final = [...kargerMinCutSteps({ edgeList: barbell, seed: 3, trials: 150 })].pop()!;
    expect(final.result.trials).toBe(150);
    expect(final.result.bestCutSize).toBeLessThanOrEqual(final.result.cutSize);
    expect(final.result.bestCutSize).toBe(2);
    expect(final.result.bestIsMinimum).toBe(true);
    expect(final.description).toContain('Across 150 independent runs');

    const summary = buildResultSummary(final.result, getAlgorithmById('karger-min-cut')!.summarizeResult, {});
    expect(summary.headline).toContain('best of 150 runs');
    expect(summary.headline).toContain('true minimum cut');
  });

  it('single-run summary states the minimum is not guaranteed', () => {
    const final = [...kargerMinCutSteps({ edgeList: barbell, seed: 1, trials: 1 })].pop()!;
    const summary = buildResultSummary(final.result, getAlgorithmById('karger-min-cut')!.summarizeResult, {});
    expect(summary.headline).toContain('not guaranteed to find the minimum');
  });

  it('silent contraction always yields a valid two-sided cut', () => {
    const rand = seededRandom(11);
    for (let i = 0; i < 20; i++) {
      const run = contractOnce(ids(barbell), barbell, rand);
      expect(run.sideA.length + run.sideB.length).toBe(6);
      expect(run.sideA.length).toBeGreaterThan(0);
      expect(run.sideB.length).toBeGreaterThan(0);
      expect(run.cutSize).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('N-Queens: truthful labels and 1-based coordinates', () => {
  it('preset names describe the board, not how many solutions exist', () => {
    for (const p of presetsOf('n-queens')) expect(p.name).not.toMatch(/solution/i);
  });

  it('first-solution mode says the search stopped early', () => {
    const steps = [...nQueensSteps({ n: 4 })];
    expect(steps[steps.length - 1].description).toContain('stopped at the first valid solution');
    expect(steps[steps.length - 1].result.stoppedAtFirst).toBe(true);
  });

  it('step text uses 1-based rows and columns', () => {
    const steps = [...nQueensSteps({ n: 4 })];
    expect(steps.find((s) => s.title.startsWith('Place Queen'))!.title).toBe('Place Queen at Row 1, Column 1');
    expect(allText(steps)).not.toMatch(/\(0, ?\d\)|Row 0|Col 0/);
  });
});

describe('C26 wording fixes', () => {
  it('Karatsuba complexity is readable text, not LaTeX', () => {
    const c = getAlgorithmById('karatsuba')!.complexity;
    for (const v of [c.timeBest, c.timeAverage, c.timeWorst]) expect(v).toBe('O(n^log2(3)) ≈ O(n^1.585)');
    expect(getAlgorithmById('karatsuba')!.explanation).not.toMatch(/z[012]/);
  });

  it('no complexity string anywhere contains LaTeX', () => {
    for (const a of algorithmRegistry) {
      const c = a.complexity;
      for (const v of [c.timeBest, c.timeAverage, c.timeWorst, c.spaceWorst, c.description]) {
        if (v) expect(v, a.id).not.toMatch(/\\[a-z]+|\^\{/);
      }
    }
  });

  it('Fractional Knapsack no longer calls the greedy choice a heuristic', () => {
    for (const p of presetsOf('fractional-knapsack')) expect(allText(runAll('fractional-knapsack', p.data))).not.toMatch(/heuristic/i);
  });

  it('Floyd-Warshall does not describe its updates as edge relaxations', () => {
    expect(allText(runAll('floyd-warshall', getDefaultInputs(getAlgorithmById('floyd-warshall')!)))).not.toMatch(/edge relaxation/i);
  });

  it('Job Selection has no "Jempty" or unexplained jargon', () => {
    for (const p of presetsOf('job-selection-bb')) {
      const text = allText(runAll('job-selection-bb', p.data));
      expect(text, p.name).not.toMatch(/Jempty|Jnull|Jundefined|Incumbent|De-queued|fathom/i);
    }
  });

  it('Hiring Problem distinguishes H_n from ln n', () => {
    const final = runAll('hiring-problem', getDefaultInputs(getAlgorithmById('hiring-problem')!)).pop()!;
    expect(final.description).toContain('H_8');
    expect(final.description).toContain('ln 8 ≈ 2.08');
    expect(final.description).not.toContain('ln(8) + O(1)');
    expect(final.result.theoreticalExpectedHires).toBeCloseTo(2.72, 2);
  });

  it('Line Segment Intersection best case accounts for sorting', () => {
    expect(getAlgorithmById('line-segment-intersection')!.complexity.timeBest).toBe('O(n log n)');
  });

  it('Vertex Cover separates the NP-hard optimization and NP-complete decision versions', () => {
    const d = getAlgorithmById('vertex-cover-approx')!.complexity.description!;
    expect(d).toContain('NP-hard as an optimization problem');
    expect(d).toContain('decision version');
    expect(d).toContain('NP-complete');
  });
});
