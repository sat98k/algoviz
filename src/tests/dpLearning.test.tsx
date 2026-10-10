import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { AlgorithmStep } from '../types/algorithm';
import { GridTableVisualizer } from '../components/visualizers/GridTableVisualizer';
import { GraphVisualizer } from '../components/visualizers/GraphVisualizer';
import { AssemblyLineVisualizer } from '../components/visualizers/AssemblyLineVisualizer';
import { AlgorithmPage } from '../pages/AlgorithmPage';

const DP_IDS = ['knapsack-dp', 'lcs', 'matrix-chain-multiplication', 'assembly-line-scheduling', 'tsp', 'floyd-warshall'];
const trace = (id: string, overrides: Record<string, any> = {}) =>
  [...getAlgorithmById(id)!.stepGenerator({ ...getDefaultInputs(getAlgorithmById(id)!), ...overrides })] as AlgorithmStep[];
const lines = (s: AlgorithmStep) => (Array.isArray(s.codeLine) ? s.codeLine : s.codeLine === undefined ? [] : [s.codeLine]);
const decode = (h: string) => h.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

describe('DP briefs', () => {
  it('exist exactly for the six DP algorithms and are complete', () => {
    for (const a of algorithmRegistry) {
      if (!DP_IDS.includes(a.id)) {
        expect(a.dpBrief, a.id).toBeUndefined();
        continue;
      }
      const b = a.dpBrief!;
      expect(b.cases.length).toBeGreaterThan(0);
      // Cell meaning, base case, fill order and answer are in the numbered core steps.
      const steps = a.coreSteps!.join(' ');
      expect(steps, a.id).toMatch(/`(dp|m|D|DP|f₁)\[/);
      expect(a.coreSteps!.length).toBeGreaterThanOrEqual(4);
      for (const c of b.cases) for (const f of [c.condition, c.formula, c.action]) expect(f.length).toBeGreaterThan(3);
      expect(JSON.stringify(b)).not.toMatch(/\\\\[a-z]|\^\{/); // no LaTeX
    }
  });

  it('worked examples match the real traces', () => {
    const kdp = trace('knapsack-dp');
    expect(kdp[kdp.length - 1].state.dpTable[2][5]).toBe(7);
    const lcs = trace('lcs');
    expect(lcs[lcs.length - 1].state.dpTable[2][1]).toBe(1);
    const mcm = trace('matrix-chain-multiplication');
    expect(mcm[mcm.length - 1].state.dpTable[1][2]).toBe(6000);
    expect(trace('assembly-line-scheduling')[0].description).toContain('= 9');
    expect(trace('tsp').find((s) => s.title.startsWith('DP({A, B}, B)'))!.title).toContain('= 10');
  });

  it('Matrix Chain intro numbers and TSP tour counts are correct', () => {
    expect(10 * 100 * 5 + 10 * 5 * 50).toBe(7500);
    expect(100 * 5 * 50 + 10 * 100 * 50).toBe(75000);
    expect(JSON.stringify(getAlgorithmById('matrix-chain-multiplication')!.dpBrief!.details)).toContain('7,500');
    const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
    expect(fact(3) / 2).toBe(3);
    expect(fact(9) / 2).toBe(181440);
    expect(fact(19) / 2 / 1e16).toBeCloseTo(6.08, 1);
    expect(JSON.stringify(getAlgorithmById('tsp')!.dpBrief!.details)).toMatch(/3 tours for 4 cities, 181,440 for 10, and about 6 × 10¹⁶ for 20/);
  });

  it('the recurrence cases sit inside "How it works" (no separate panel) and the live rule sits beside the table, only for DP', () => {
    for (const id of DP_IDS) {
      const html = renderToStaticMarkup(<AlgorithmPage algorithmId={id} onBack={() => {}} />);
      const panel = html.indexOf('aria-label="Problem and how it works"');
      const cases = html.indexOf('aria-label="Recurrence cases"');
      expect(cases, id).toBeGreaterThan(panel);
      expect(cases).toBeLessThan(html.indexOf('What happened and why?'));
      expect(html.split('aria-label="Recurrence cases"').length - 1).toBe(1);
      expect(html).not.toContain('Table rules');
      for (const c of getAlgorithmById(id)!.dpBrief!.cases) expect(decode(html)).toContain(c.formula);
      expect(html).toContain('Rule for this cell');
    }
    const kmp = renderToStaticMarkup(<AlgorithmPage algorithmId="kmp" onBack={() => {}} />);
    expect(kmp).not.toContain('Recurrence cases');
    expect(kmp).not.toContain('Rule for this cell');
  });
});

describe('Knapsack DP', () => {
  const steps = trace('knapsack-dp');
  const { weights, values } = getDefaultInputs(getAlgorithmById('knapsack-dp')!);

  it('explains why row 0 and column 0 are zero', () => {
    expect(steps[0].description).toMatch(/no items there is nothing to carry/);
    expect(steps[0].description).toMatch(/no capacity nothing fits/);
  });

  it('highlights exactly the cells the recurrence reads and the numbers agree', () => {
    const evals = steps.filter((x) => /Item \d+ (Exceeds|at Weight)|Evaluate Item/.test(x.title));
    expect(evals.length).toBeGreaterThan(10);
    for (const s of evals) {
      const active = s.highlights.cells!.find((c) => c.status === 'active')!;
      const sources = s.highlights.cells!.filter((c) => c.status === 'source').map((c) => `${c.r},${c.c}`).sort();
      const i = active.r;
      const w = active.c;
      const wi = weights[i - 1];
      const table = s.state.dpTable;
      if (wi > w) {
        expect(sources).toEqual([`${i - 1},${w}`]);
        expect(table[i][w]).toBe(table[i - 1][w]);
      } else {
        expect(sources).toEqual([`${i - 1},${w - wi}`, `${i - 1},${w}`].sort());
        expect(table[i][w]).toBe(Math.max(table[i - 1][w], values[i - 1] + table[i - 1][w - wi]));
        expect(s.state.dpRule.label).toBe('Item fits');
        expect(s.state.dpRule.substitution).toContain(`= ${table[i][w]}`);
      }
    }
  });
});

describe('LCS', () => {
  const steps = trace('lcs');
  const { str1, str2 } = getDefaultInputs(getAlgorithmById('lcs')!);
  const lcsLength = (a: string, b: string) => {
    const d = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1]);
    return d[a.length][b.length];
  };
  const isSubsequence = (sub: string, s: string) => {
    let k = 0;
    for (const ch of s) if (ch === sub[k]) k++;
    return k === sub.length;
  };

  it('fill steps mark match vs mismatch and read the right cells', () => {
    const fills = steps.filter((x) => x.state.comparison);
    expect(fills.length).toBe(str1.length * str2.length);
    for (const s of fills) {
      const { currentRow: i, currentCol: j } = s.state;
      const sources = s.highlights.cells!.filter((c) => c.status === 'source').map((c) => `${c.r},${c.c}`).sort();
      if (str1[i - 1] === str2[j - 1]) {
        expect(s.state.comparison).toBe('match');
        expect(sources).toEqual([`${i - 1},${j - 1}`]);
        expect(s.state.dpRule.substitution).toBe(`dp[${i}][${j}] = ${s.state.dpTable[i - 1][j - 1]} + 1 = ${s.state.dpTable[i][j]}`);
      } else {
        expect(s.state.comparison).toBe('mismatch');
        expect(sources).toEqual([`${i - 1},${j}`, `${i},${j - 1}`].sort());
        expect(s.state.dpRule.substitution).toBe(`dp[${i}][${j}] = max( ${s.state.dpTable[i - 1][j]}, ${s.state.dpTable[i][j - 1]} ) = ${s.state.dpTable[i][j]}`);
      }
    }
  });

  it('traceback is a sequence of arrow steps whose ↖ moves spell the answer', () => {
    const tb = steps.filter((s) => s.state.tracebackPhase && /^[↖↑←]/.test(s.title));
    expect(tb.length).toBeGreaterThan(3);
    const final = steps[steps.length - 1];
    const collected = tb.filter((s) => s.title.startsWith('↖')).map((s) => /'(.)'/.exec(s.title)![1]).reverse().join('');
    expect(collected).toBe(final.result.lcsString);
    expect(final.result.lcsString.length).toBe(lcsLength(str1, str2));
    expect(isSubsequence(final.result.lcsString, str1)).toBe(true);
    expect(isSubsequence(final.result.lcsString, str2)).toBe(true);
    for (const s of tb) expect(s.highlights.cells!.some((c) => c.arrow)).toBe(true);
  });

  it('every step points at a real pseudocode line (traceback lines 9–14)', () => {
    const n = getAlgorithmById('lcs')!.pseudocode.length;
    expect(n).toBe(14);
    for (const s of steps) for (const l of lines(s)) expect(l >= 1 && l <= n).toBe(true);
    expect(steps.filter((s) => s.title.startsWith('↖')).every((s) => s.codeLine === 11)).toBe(true);
  });

  it('renders compared characters in match/mismatch colours and traceback arrows', () => {
    const match = renderToStaticMarkup(<GridTableVisualizer step={steps.find((s) => s.state.comparison === 'match')!} />);
    expect(match).toContain('text-sem-match-ink');
    expect(match).toContain(' ✓');
    const mismatch = renderToStaticMarkup(<GridTableVisualizer step={steps.find((s) => s.state.comparison === 'mismatch')!} />);
    expect(mismatch).toContain(' ✗');
    const tbHtml = renderToStaticMarkup(<GridTableVisualizer step={steps.filter((s) => s.title.startsWith('↖'))[1]} />);
    expect(tbHtml).toContain('↖');
    expect(decode(tbHtml)).toContain('LCS so far (built from the end)');
  });
});

describe('Matrix Chain', () => {
  const steps = trace('matrix-chain-multiplication');
  const p: number[] = getDefaultInputs(getAlgorithmById('matrix-chain-multiplication')!).dimensions;

  it('each split test uses m[i,k] + m[k+1,j] + p[i−1]·p[k]·p[j]', () => {
    const splits = steps.filter((x) => x.title.startsWith('Evaluate Split Point'));
    expect(splits.length).toBeGreaterThan(5);
    for (const s of splits) {
      const { currentRow: i, currentCol: j, currentK: k, dpTable } = s.state;
      const total = dpTable[i][k] + dpTable[k + 1][j] + p[i - 1] * p[k] * p[j];
      expect(s.description).toContain(`Total = ${total}`);
      expect(s.state.dpRule.substitution).toMatch(new RegExp(`= ${total}$`));
    }
  });

  it('highlights p[i−1], p[k], p[j] and labels the diagonal being filled', () => {
    const s = steps.find((x) => x.title.startsWith('Evaluate Split Point'))!;
    const { currentRow: i, currentCol: j } = s.state;
    const html = decode(renderToStaticMarkup(<GridTableVisualizer step={s} />));
    expect(html).toContain(`Filling chain length L = ${j - i + 1}`);
    expect((html.match(/bg-sem-compare\/15 border-sem-compare text-sem-compare-ink font-bold/g) ?? []).length).toBe(3);
  });

  it('reconstruction matches the result', () => {
    const final = steps[steps.length - 1];
    expect(final.state.optimalParenthesization).toBe(final.result.optimalParenthesization);
  });
});

describe('Assembly Line', () => {
  it('shows the calculation once (no duplicate recurrence text)', () => {
    const s = trace('assembly-line-scheduling')[2];
    const html = renderToStaticMarkup(<AssemblyLineVisualizer step={s} />);
    expect(s.state.dpRule).toBeDefined(); // shown in the page's rule card instead
    expect(html).not.toContain('ƒ Calculation');
    expect(html).not.toMatch(/\[ DP STATE \]|Recurrence Evaluation/);
  });
});

describe('TSP Held-Karp', () => {
  const steps = trace('tsp');
  const cost: number[][] = getDefaultInputs(getAlgorithmById('tsp')!).costMatrix;

  it('lists candidate predecessors, and the minimum matches the DP value', () => {
    const multi = steps.filter((s) => (s.state.candidateEdges?.length ?? 0) > 1 && s.state.currentPhase === 'fill');
    expect(multi.length).toBeGreaterThan(0);
    for (const s of multi) {
      const cands = s.state.candidateEdges;
      for (const c of cands) expect(s.state.dpRule.substitution).toContain(`${c.subCost} + ${c.edgeCost} = ${c.totalCost}`);
      expect(s.title).toContain(`= ${Math.min(...cands.map((c: any) => c.totalCost))}`);
    }
  });

  it('reconstruction explains the parent chain and gives the optimal tour', () => {
    const rec = steps.find((s) => s.title === 'Backtrack Optimal Tour')!;
    expect(rec.description.split('came from').length - 1).toBe(cost.length - 1);
    const n = cost.length;
    const perms = (a: number[]): number[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));
    const best = Math.min(...perms([...Array(n).keys()].slice(1)).map((t) => [0, ...t, 0].reduce((acc, c, i, arr) => (i ? acc + cost[arr[i - 1]][c] : 0), 0)));
    expect(steps[steps.length - 1].result.optimalCost).toBe(best);
  });
});

describe('Floyd-Warshall', () => {
  const steps = trace('floyd-warshall');

  it('every check compares the best-so-far distance with the route through k', () => {
    const checks = steps.filter((s) => s.state.comparison);
    expect(checks.length).toBeGreaterThan(5);
    for (const s of checks) {
      const { direct, viaK, legIK, legKJ, improved } = s.state.comparison;
      if (legIK === null || legKJ === null) expect(viaK).toBeNull();
      else expect(viaK).toBe(legIK + legKJ);
      expect(improved).toBe(viaK !== null && (direct === null || viaK < direct));
    }
  });

  it('final distances match an independent computation', () => {
    const start = steps[0].state.distMatrix.map((r: any[]) => [...r]);
    const n = start.length;
    const d = start.map((r: any[]) => r.map((v: any) => (v === null ? Infinity : v)));
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
    const final = steps[steps.length - 1].state.distMatrix.map((r: any[]) => r.map((v: any) => (v === null ? Infinity : v)));
    expect(final).toEqual(d);
  });

  it('shows the round invariant and the direct-vs-via comparison', () => {
    const s = steps.find((x) => x.state.comparison?.improved) ?? steps.find((x) => x.state.comparison)!;
    const html = decode(renderToStaticMarkup(<GraphVisualizer step={s} />));
    expect(html).toMatch(/Round \d+: paths may stop only at/);
    expect(s.state.dpRule.formula).toBe('D[i][j] = min( D[i][j], D[i][k] + D[k][j] )');
  });
});
