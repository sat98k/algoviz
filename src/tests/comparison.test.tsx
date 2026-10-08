import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { COMPARISON_GROUPS, DEFAULT_COMPARISON_GROUP } from '../config/comparisonGroups';
import { areComparable, getComparisonGroups, getDefaultInputs, getDefaultPair } from '../utils/comparison';
import { ComparisonPage } from '../pages/ComparisonPage';

const finalResult = (id: string, inputs: Record<string, any>) => {
  const steps = [...getAlgorithmById(id)!.stepGenerator(inputs)];
  return steps[steps.length - 1];
};

describe('Comparison groups (registry-driven)', () => {
  const groups = getComparisonGroups();
  const membersOf = (id: string) => groups.find((g) => g.id === id)!.members.map((m) => m.id);

  it('derives the expected groups and members from the registry', () => {
    expect(groups.map((g) => g.id).sort()).toEqual(Object.keys(COMPARISON_GROUPS).sort());
    expect(membersOf('knapsack-01')).toEqual(['knapsack-dp', 'knapsack-bb']);
    expect(membersOf('string-matching')).toEqual(['naive-string-match', 'kmp', 'rabin-karp', 'suffix-tree']);
    expect(membersOf('max-flow')).toEqual(['ford-fulkerson', 'edmonds-karp', 'push-relabel']);
    expect(membersOf('convex-hull')).toEqual(['graham-scan', 'jarvis-march']);
    expect(membersOf('tsp')).toEqual(['tsp', 'tsp-approx']);
  });

  it('defaults to the original Knapsack DP vs Branch & Bound comparison and inputs', () => {
    const group = groups.find((g) => g.id === DEFAULT_COMPARISON_GROUP)!;
    const [a, b] = getDefaultPair(group);
    expect([a.id, b.id]).toEqual(['knapsack-dp', 'knapsack-bb']);
    expect(getDefaultInputs(a)).toEqual({ weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 5 });
  });

  it('only allows comparisons within the same problem', () => {
    const get = (id: string) => getAlgorithmById(id)!;
    expect(areComparable(get('kmp'), get('naive-string-match'))).toBe(true);
    expect(areComparable(get('ford-fulkerson'), get('push-relabel'))).toBe(true);
    expect(areComparable(get('kmp'), get('graham-scan'))).toBe(false);
    expect(areComparable(get('kmp'), get('kmp'))).toBe(false);
    expect(areComparable(get('lcs'), get('knapsack-dp'))).toBe(false);
  });

  it('gives every comparable algorithm a complete profile', () => {
    for (const a of algorithmRegistry.filter((x) => x.comparison)) {
      const p = a.comparison!;
      expect(p.keyIdea.length, a.id).toBeGreaterThan(30);
      expect(p.strengths.length, a.id).toBeGreaterThanOrEqual(2);
      expect(p.limitations.length, a.id).toBeGreaterThanOrEqual(1);
      expect(p.chooseWhen.length, a.id).toBeGreaterThan(20);
      expect(p.answerQuality.length, a.id).toBeGreaterThan(0);
    }
  });

  describe.each(groups.map((g) => [g.id, g] as const))('%s: shared input format', (_id, group) => {
    it.each(group.members.flatMap((a) => group.members.filter((b) => b !== a).map((b) => [a.id, b.id])))(
      '%s runs on the default input of %s',
      (runner, owner) => {
        const last = finalResult(runner, getDefaultInputs(getAlgorithmById(owner)!));
        expect(last.isFinal).toBe(true);
        expect(last.result).toBeDefined();
      }
    );
  });
});

describe('Algorithms in a group solve the same problem', () => {
  it('exact algorithms agree on the default inputs', () => {
    const knap = getDefaultInputs(getAlgorithmById('knapsack-dp')!);
    expect(finalResult('knapsack-bb', knap).result.maxValue).toBe(finalResult('knapsack-dp', knap).result.maxValue);

    const text = getDefaultInputs(getAlgorithmById('kmp')!);
    const expected = finalResult('naive-string-match', text).result.matchIndices;
    for (const id of ['kmp', 'rabin-karp', 'suffix-tree']) {
      expect([...finalResult(id, text).result.matchIndices].sort((x: number, y: number) => x - y), id).toEqual(expected);
    }

    const flow = getDefaultInputs(getAlgorithmById('ford-fulkerson')!);
    for (const id of ['edmonds-karp', 'push-relabel']) {
      expect(finalResult(id, flow).result.maxFlow, id).toBe(finalResult('ford-fulkerson', flow).result.maxFlow);
    }

    const pts = getDefaultInputs(getAlgorithmById('graham-scan')!);
    const labels = (id: string) => finalResult(id, pts).result.hullVertices.map((p: any) => p.label).sort();
    expect(labels('jarvis-march')).toEqual(labels('graham-scan'));
  });

  it('TSP approximation is never better than the exact optimum', () => {
    const inputs = getDefaultInputs(getAlgorithmById('tsp')!);
    const opt = finalResult('tsp', inputs).result.optimalCost;
    expect(finalResult('tsp-approx', inputs).result.tourCost).toBeGreaterThanOrEqual(opt);
  });
});

describe('ComparisonPage rendering', () => {
  const html = renderToStaticMarkup(<ComparisonPage />).replace(/&amp;/g, '&').replace(/&#x27;/g, "'");

  it('shows the problem, both selectors and the default knapsack pair', () => {
    expect(html).toContain('0/1 Knapsack');
    expect(html).toContain('The problem: </span>');
    expect(html).toContain('Algorithm A');
    expect(html).toContain('Algorithm B');
    expect(html).toContain(getAlgorithmById('knapsack-dp')!.name);
    expect(html).toContain(getAlgorithmById('knapsack-bb')!.name);
  });

  it('offers every comparable problem with aria-pressed state', () => {
    for (const g of getComparisonGroups()) expect(html).toContain(g.title);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  });

  it('renders the at-a-glance rows and both profiles', () => {
    for (const label of ['Key idea', 'Paradigm', 'Time', 'Space', 'Answer', 'Strengths', 'Limitations', 'Choose it when']) {
      expect(html).toContain(label);
    }
    expect(html).toContain(getAlgorithmById('knapsack-dp')!.comparison!.chooseWhen);
    expect(html).toContain(getAlgorithmById('knapsack-bb')!.comparison!.chooseWhen);
  });
});
