import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { fractionalKnapsackSteps } from '../algorithms/fractionalKnapsack';
import { huffmanSteps } from '../algorithms/huffman';
import { maxSubarraySteps } from '../algorithms/maxSubarray';
import { karatsubaSteps } from '../algorithms/karatsuba';
import { nQueensSteps, attackBetween } from '../algorithms/nQueens';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { FractionalKnapsackVisualizer } from '../components/visualizers/FractionalKnapsackVisualizer';
import { HuffmanQueueStrip } from '../components/visualizers/HuffmanQueueStrip';
import { TreeVisualizer } from '../components/visualizers/TreeVisualizer';
import { CrossScanView } from '../components/visualizers/CrossScanView';
import { KaratsubaPanel } from '../components/visualizers/KaratsubaPanel';
import { BoardVisualizer } from '../components/visualizers/BoardVisualizer';

const lines = (s: any): number[] => (Array.isArray(s.codeLine) ? s.codeLine : [s.codeLine]);
const codeOf = (id: string, s: any) => lines(s).map((l) => getAlgorithmById(id)!.pseudocode![l - 1]).join('\n');
const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');

// ─── Fractional knapsack ───────────────────────────────────────────────────
describe('Fractional knapsack', () => {
  const inputs = { weights: [10, 40, 20, 30], values: [60, 280, 120, 150], capacity: 60 };
  const steps = [...fractionalKnapsackSteps(inputs)] as any[];
  const render = (s: any) => renderToStaticMarkup(<FractionalKnapsackVisualizer step={s} />);

  it('keeps the entered order and ranks items by value ÷ weight', () => {
    expect(steps[0].state.originalOrder).toEqual([1, 2, 3, 4]);
    const sorted = steps[1].state.items;
    expect(sorted.map((it: any) => it.id)).toEqual([2, 1, 3, 4]);
    expect(sorted.map((it: any) => it.rank)).toEqual([1, 2, 3, 4]);
    expect(text(render(steps[0]))).toContain('not sorted yet');
    expect(text(render(steps[1]))).toMatch(/#2 \(7\)›#1 \(6\)›#3 \(6\)›#4 \(5\)/);
  });

  it('shows each ratio as a calculation', () => {
    const t = text(render(steps[0]));
    for (let i = 0; i < 4; i++) expect(t).toContain(`${inputs.values[i]} ÷ ${inputs.weights[i]} = ${+(inputs.values[i] / inputs.weights[i]).toFixed(2)}`);
  });

  it('every fit check compares the real weight and remaining capacity, and the decision follows it', () => {
    let used = 0;
    const checked = steps.filter((s) => s.state.fitCheck);
    expect(checked.length).toBeGreaterThan(4);
    for (const s of steps) {
      const fc = s.state.fitCheck;
      if (!fc) continue;
      const it = s.state.items[s.state.currentItemIndex];
      expect(fc.weight).toBe(it.weight);
      expect(fc.remaining).toBeCloseTo(inputs.capacity - (s.state.currentWeight - it.weightTaken), 6);
      expect(fc.fits).toBe(it.weight <= fc.remaining);
      if (it.status === 'taken_full') expect(fc.fits).toBe(true);
      if (it.status === 'taken_fraction') {
        expect(fc.fits).toBe(false);
        expect(it.weightTaken).toBe(fc.remaining);
        expect(it.valueTaken).toBeCloseTo((fc.remaining / it.weight) * it.value, 2);
      }
      used = s.state.currentWeight;
    }
    expect(used).toBeLessThanOrEqual(inputs.capacity);
  });

  it('renders the condition and the decision on the current card', () => {
    const examine = steps.find((s) => /^Examining/.test(s.title) && s.state.fitCheck)!;
    const t = text(render(examine));
    expect(t).toContain(`weight ${examine.state.fitCheck.weight} ≤ remaining ${examine.state.fitCheck.remaining} ✓`);
    expect(render(examine)).not.toContain('data-decision'); // not decided yet
    const frac = steps.find((s) => /Fraction of Item/.test(s.title))!;
    const ft = text(render(frac));
    expect(ft).toMatch(/weight 20 > remaining 10 ✗/);
    expect(ft).toContain('→ Take 50% (10 ÷ 20 × 120 = 60)');
    const full = steps.find((s) => /^Take 100%/.test(s.title))!;
    expect(text(render(full))).toContain('→ Take whole item');
  });

  it('segments the capacity bar by item and styles skipped items neutrally', () => {
    const final = steps.at(-1);
    const html = render(final);
    expect((html.match(/data-segment="/g) ?? []).length).toBe(final.result.itemsTaken.length);
    const skipped = html.slice(html.indexOf('data-item="4"'), html.indexOf('data-item="4"') + 400);
    expect(skipped).toContain('sem-pruned');
    expect(skipped).not.toMatch(/rose|sem-mismatch/);
    expect(text(html)).toContain('✂ Left out');
    expect(html).not.toMatch(/<table/);
  });

  it('pseudocode lines follow the steps', () => {
    for (const s of steps) {
      if (/^Examining/.test(s.title)) expect(codeOf('fractional-knapsack', s)).toMatch(/for each item/i);
      if (/^Take 100%/.test(s.title)) expect(codeOf('fractional-knapsack', s)).toMatch(/fits completely|Take 100%/);
      if (/Fraction of Item/.test(s.title)) expect(codeOf('fractional-knapsack', s)).toMatch(/fraction/);
    }
  });
});

// ─── Huffman ───────────────────────────────────────────────────────────────
describe('Huffman priority queue', () => {
  const steps = [...huffmanSteps({ text: 'ABRACADABRA' })] as any[];

  it('the queue is always sorted by frequency, and each merge takes the two smallest and inserts their sum', () => {
    for (const s of steps.filter((s) => s.state.queue)) {
      const f = s.state.queue.map((e: any) => e.freq);
      expect(f).toEqual([...f].sort((a: number, b: number) => a - b));
    }
    const selects = steps.filter((s) => s.state.queueRemoved);
    expect(selects.length).toBe(4); // 5 distinct characters
    for (const s of selects) {
      const q = s.state.queue;
      expect(q.slice(0, 2).map((e: any) => e.id)).toEqual(s.state.queueRemoved);
      const merge = steps[steps.indexOf(s) + 1];
      const added = merge.state.queue.find((e: any) => e.id === merge.state.queueInserted);
      expect(added.freq).toBe(q[0].freq + q[1].freq);
      expect([...added.label].sort().join('')).toBe([...q[0].label, ...q[1].label].sort().join(''));
      expect(merge.state.queue.length).toBe(q.length - 1);
      expect(codeOf('huffman', s)).toMatch(/extractMin/);
      expect(codeOf('huffman', merge)).toMatch(/insert/);
    }
  });

  it('labels use characters, never internal node ids', () => {
    for (const s of steps) {
      expect(`${s.title} ${s.description}`).not.toMatch(/node-\d+/);
      for (const e of s.state.queue ?? []) expect(e.label).not.toMatch(/node-/);
    }
  });

  it('the strip marks ① smallest, ② next and + new, inside the tree visualization', () => {
    const sel = steps.find((s) => s.state.queueRemoved)!;
    const html = renderToStaticMarkup(<HuffmanQueueStrip queue={sel.state.queue} removed={sel.state.queueRemoved} />);
    expect(html).toContain('① smallest');
    expect(html).toContain('② next');
    const merge = steps[steps.indexOf(sel) + 1];
    expect(renderToStaticMarkup(<HuffmanQueueStrip queue={merge.state.queue} inserted={merge.state.queueInserted} />)).toContain('+ new');
    const inTree = renderToStaticMarkup(<TreeVisualizer step={sel} />);
    expect(inTree).toContain('aria-label="Priority queue"');
    expect(inTree).not.toMatch(/node-\d+</);
  });
});

// ─── Maximum subarray ──────────────────────────────────────────────────────
describe('Maximum subarray crossing scan', () => {
  const arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
  const steps = [...maxSubarraySteps({ array: arr })] as any[];
  const sum = (a: number, b: number) => arr.slice(a, b + 1).reduce((x, y) => x + y, 0);

  it('has the crossing-scan pseudocode', () => {
    const code = getAlgorithmById('max-subarray')!.pseudocode!;
    expect(code[8]).toBe('function MaxCrossingSubarray(arr, low, mid, high):');
    expect(code[17]).toMatch(/return \(bestLeft \+ bestRight/);
  });

  it('every scan step shows correct running sums, best values and the matching pseudocode line', () => {
    const scans = steps.filter((s) => s.state.crossScan && ['left', 'right'].includes(s.state.crossScan.side));
    expect(scans.length).toBeGreaterThan(15);
    for (const s of scans) {
      const c = s.state.crossScan;
      for (const e of c.leftSums) expect(e.sum).toBe(sum(e.index, c.mid));
      for (const e of c.rightSums) expect(e.sum).toBe(sum(c.mid + 1, e.index));
      expect(c.bestLeft.sum).toBe(Math.max(...c.leftSums.map((e: any) => e.sum)));
      if (c.side === 'right') expect(c.bestRight.sum).toBe(Math.max(...c.rightSums.map((e: any) => e.sum)));
      // The left scan moves away from mid, the right scan away from mid + 1.
      if (c.side === 'left') expect(c.index).toBe(c.mid - (c.leftSums.length - 1));
      else expect(c.index).toBe(c.mid + c.rightSums.length);
      expect(codeOf('max-subarray', s)).toMatch(c.side === 'left' ? /for i = mid down to low/ : /for j = mid \+ 1 to high/);
    }
  });

  it('CrossSum = bestLeft + bestRight, equal to brute force, and the final answer is the true maximum', () => {
    const done = steps.filter((s) => s.state.crossScan?.side === 'done');
    expect(done.length).toBe(8); // one per internal node of the recursion on 9 elements
    for (const s of done) {
      const { low, mid, high, bestLeft, bestRight } = s.state.crossScan;
      let brute = -Infinity;
      for (let i = low; i <= mid; i++) for (let j = mid + 1; j <= high; j++) brute = Math.max(brute, sum(i, j));
      expect(s.state.crossSum).toBe(bestLeft.sum + bestRight.sum);
      expect(s.state.crossSum).toBe(brute);
      expect(codeOf('max-subarray', s)).toMatch(/return \(bestLeft/);
    }
    let best = -Infinity;
    for (let i = 0; i < arr.length; i++) for (let j = i; j < arr.length; j++) best = Math.max(best, sum(i, j));
    expect(steps.at(-1).result.maxSum).toBe(best);
  });

  it('the view shows only sums computed so far, stars the best ends and states the CrossSum', () => {
    const first = steps.find((s) => s.state.crossScan?.side === 'left' && s.state.crossScan.leftSums.length === 1 && s.state.crossScan.high - s.state.crossScan.low >= 3)!;
    const html = renderToStaticMarkup(<CrossScanView array={arr} scan={first.state.crossScan} />);
    expect((html.match(/data-running-sum="/g) ?? []).length).toBe(1);
    expect(html).toContain('★');
    const done = steps.find((s) => s.state.crossScan?.side === 'done')!;
    const { bestLeft, bestRight } = done.state.crossScan;
    expect(text(renderToStaticMarkup(<CrossScanView array={arr} scan={done.state.crossScan} crossSum={done.state.crossSum} />))).toContain(
      `CrossSum = bestLeft + bestRight = ${bestLeft.sum} + ${bestRight.sum} = ${done.state.crossSum}`
    );
  });
});

// ─── Karatsuba ─────────────────────────────────────────────────────────────
describe('Karatsuba', () => {
  const steps = [...karatsubaSteps({ num1: '1234', num2: '5678' })] as any[];
  const panel = (s: any) => renderToStaticMarkup(<KaratsubaPanel details={s.state.karatsubaDetails} finalProduct={s.isFinal ? s.result.product : undefined} />);

  it('uses P1, P2, P3 everywhere', () => {
    const cfg = getAlgorithmById('karatsuba')!;
    const all = [cfg.explanation, cfg.pseudocode!.join('\n'), cfg.analysis!.derivation, ...cfg.coreSteps!, ...steps.map((s) => `${s.title} ${s.description}`)].join('\n');
    expect(all).toMatch(/P3 − P1 − P2|P3 - P1 - P2/);
    expect(all).not.toMatch(/\bp[123]\b/);
  });

  it('base cases are shown as direct products, never as P1', () => {
    const base = steps.filter((s) => /^Base Case/.test(s.title));
    expect(base.length).toBeGreaterThan(3);
    for (const s of base) {
      expect(s.state.karatsubaDetails.p1).toBeUndefined();
      const html = panel(s);
      expect(html).toContain('data-base-case');
      expect(html).not.toContain('P1');
      expect(codeOf('karatsuba', s)).toMatch(/multiply directly/);
    }
  });

  it('cross terms and combinations are exact at every call', () => {
    const crosses = steps.filter((s) => /^Step 3: Cross Term/.test(s.title));
    expect(crosses.length).toBeGreaterThan(2);
    for (const s of crosses) {
      const k = s.state.karatsubaDetails;
      const [a, b, c, d] = [k.a, k.b, k.c, k.d].map(BigInt);
      expect(BigInt(k.p1)).toBe(a * c);
      expect(BigInt(k.p2)).toBe(b * d);
      expect(BigInt(k.p3)).toBe((a + b) * (c + d));
      expect(BigInt(k.crossTerm)).toBe(BigInt(k.p3) - BigInt(k.p1) - BigInt(k.p2));
      expect(BigInt(k.crossTerm)).toBe(BigInt(k.adCheck) + BigInt(k.bcCheck));
      expect(codeOf('karatsuba', s)).toMatch(/cross = P3 - P1 - P2/);
    }
    for (const s of steps.filter((s) => /^Step 4: Combine/.test(s.title))) {
      const k = s.state.karatsubaDetails;
      const m = BigInt(k.m);
      const [a, b, c, d] = [k.a, k.b, k.c, k.d].map(BigInt);
      expect(BigInt(k.finalResult)).toBe(BigInt(k.p1) * 10n ** (2n * m) + BigInt(k.crossTerm) * 10n ** m + BigInt(k.p2));
      expect(BigInt(k.finalResult)).toBe((a * 10n ** m + b) * (c * 10n ** m + d));
      expect(codeOf('karatsuba', s)).toMatch(/return P1 \* 10\^\(2m\)/);
    }
    expect(steps.at(-1).result.product).toBe('7006652');
  });

  it('compares 4 products with 3, fills in numbers only once known, and shows the full combination untruncated', () => {
    const split = steps.find((s) => /^Step 1: Split/.test(s.title))!;
    const t = text(panel(split));
    expect(t).toContain('Direct: 4 products');
    expect(t).toContain('Karatsuba: 3 products');
    expect(t).toContain('P1 = a·c = 12×56 = …');
    expect(t).toContain('P3 = (a+b)(c+d) = 46×134 = …');
    const cross = steps.find((s) => /^Step 3: Cross Term/.test(s.title) && s.state.karatsubaDetails.a === '12')!;
    const ct = text(panel(cross));
    expect(ct).toContain('ad + bc = P3 − P1 − P2 = 6164 − 672 − 2652 = 2840');
    expect(ct).toContain('12×78 + 34×56 = 936 + 1904 = 2840 ✓');
    const combine = steps.find((s) => /^Step 4: Combine/.test(s.title) && s.state.karatsubaDetails.a === '12')!;
    const html = panel(combine);
    expect(text(html)).toContain('= 672·10^4 + 2840·10^2 + 2652= 6720000 + 284000 + 2652= 7006652');
    expect(html).not.toMatch(/\btruncate\b/);
  });
});

// ─── N-Queens ──────────────────────────────────────────────────────────────
describe('N-Queens conflicts', () => {
  const steps = [...nQueensSteps({ n: 4 })] as any[];
  const conflicts = steps.filter((s) => s.state.action === 'conflict');

  it('every rejection records the real attacker, the line and the squares in between', () => {
    expect(conflicts.length).toBeGreaterThan(5);
    for (const s of conflicts) {
      const { attempted, attacker, line, between } = s.state.attack;
      expect(attempted).toEqual({ r: s.state.currentRow, c: s.state.currentCol });
      expect(s.state.board[attacker.r]).toBe(attacker.c);
      expect(attacker.r).toBeLessThan(attempted.r);
      const dr = attempted.r - attacker.r;
      const dc = attempted.c - attacker.c;
      expect(line === 'column' ? dc === 0 : Math.abs(dc) === dr).toBe(true);
      expect(between).toHaveLength(dr - 1);
      expect(codeOf('n-queens', s)).toBeTruthy();
    }
    expect(steps.some((s) => s.state.attack?.line === 'column')).toBe(true);
    expect(steps.some((s) => s.state.attack?.line === 'diagonal')).toBe(true);
  });

  it('attackBetween walks the diagonal one square per row', () => {
    expect(attackBetween({ r: 0, c: 0 }, { r: 3, c: 3 }).between).toEqual([{ r: 1, c: 1 }, { r: 2, c: 2 }]);
    expect(attackBetween({ r: 0, c: 3 }, { r: 2, c: 1 }).between).toEqual([{ r: 1, c: 2 }]);
    expect(attackBetween({ r: 0, c: 2 }, { r: 3, c: 2 })).toMatchObject({ line: 'column', between: [{ r: 1, c: 2 }, { r: 2, c: 2 }] });
  });

  it('the board marks the attempted square, the attacking queen and the line of attack', () => {
    const s = conflicts.find((x) => x.state.attack.between.length > 0)!;
    const html = renderToStaticMarkup(<BoardVisualizer step={s} />);
    const { attempted, attacker, between, line } = s.state.attack;
    const cell = (r: number, c: number) => html.slice(html.indexOf(`data-tree-node-id="${r}-${c}"`), html.indexOf('</div>', html.indexOf(`data-tree-node-id="${r}-${c}"`) + 400) + 200);
    expect(cell(attempted.r, attempted.c)).toContain('data-attempted');
    expect(cell(attacker.r, attacker.c)).toContain('data-attacker');
    for (const p of between) expect(cell(p.r, p.c)).toContain('data-attack-line');
    expect((html.match(/data-attack-line/g) ?? []).length).toBe(between.length);
    expect(text(html)).toContain(`✗ Attacked along the ${line}`);
    expect(text(html)).toContain(`by the queen at (${attacker.r + 1}, ${attacker.c + 1})`);
  });

  it('placements and solutions are unchanged: 4×4 has 2 solutions in "find all"', () => {
    const all = [...nQueensSteps({ n: 4, findAll: true })] as any[];
    expect(all.at(-1).state.solutionCount).toBe(2);
    const ok = steps.find((s) => s.state.action === 'place')!;
    expect(renderToStaticMarkup(<BoardVisualizer step={ok} />)).not.toContain('data-attack-line');
  });
});
