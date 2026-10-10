import { describe, it, expect } from 'vitest';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { buildResultSummary, genericResultSummary } from '../utils/resultSummary';
import { AlgorithmConfig } from '../types/algorithm';

const defaultInputs = (config: AlgorithmConfig) => {
  const init: Record<string, any> = {};
  config.inputSchema.forEach((field) => (init[field.name] = field.defaultValue));
  return { ...init, ...(config.presets[0]?.data ?? {}) };
};

const run = (id: string, overrides: Record<string, any> = {}) => {
  const config = getAlgorithmById(id)!;
  const inputs = { ...defaultInputs(config), ...overrides };
  let last: any;
  for (const step of config.stepGenerator(inputs)) last = step;
  const summary = buildResultSummary(last.result, config.summarizeResult, inputs);
  return { result: last.result, summary };
};

describe('Result summaries', () => {
  it('Fractional Knapsack: states total value and whole/fractional items', () => {
    const { result, summary } = run('fractional-knapsack');
    expect(summary.headline).toContain(`Maximum value: ${result.maxValue}`);
    expect(summary.table!.columns).toEqual(['Item', 'Portion taken', 'Weight taken', 'Value gained']);
    expect(summary.table!.rows).toEqual([
      ['Item 1', 'Whole item', '10', '60'],
      ['Item 2', 'Whole item', '20', '100'],
      ['Item 3', '66.7%', '20', '80'],
    ]);
    expect(summary.details).toContainEqual({ label: 'Items taken partially', value: 1 });
  });

  it('Huffman: character → frequency → code table built from the input text', () => {
    const { result, summary } = run('huffman');
    expect(summary.headline).toContain('"ABRACADABRA"');
    expect(summary.headline).toContain(`${result.compressedBits} bits instead of ${result.originalBits} bits`);
    expect(summary.table!.columns).toEqual(['Character', 'Frequency', 'Code', 'Code length']);
    expect(summary.table!.rows[0]).toEqual(['A', 5, result.codeTable.A, result.codeTable.A.length]);
    expect(summary.table!.rows).toHaveLength(Object.keys(result.codeTable).length);
    expect(summary.table!.rows.find((r) => r[0] === 'R')![1]).toBe(2);
  });

  it('Huffman: omits frequency column when the input text is unavailable', () => {
    const { result } = run('huffman');
    const summary = buildResultSummary(result, getAlgorithmById('huffman')!.summarizeResult, {});
    expect(summary.table!.columns).toEqual(['Character', 'Code', 'Code length']);
  });

  it('Maximum Subarray: states the max sum and the subarray', () => {
    const { summary } = run('max-subarray');
    expect(summary.headline).toBe('The maximum subarray sum is 6, from index 3 to index 6: [4, -1, 2, 1].');
  });

  it('Karatsuba: states the multiplication result', () => {
    const { summary } = run('karatsuba');
    expect(summary.headline).toBe('1234 × 5678 = 7006652');
  });

  it('N-Queens: first-solution mode says the search stopped, and lists queen positions', () => {
    const { summary } = run('n-queens');
    expect(summary.headline).toContain('Found a way to place 4 queens on a 4×4 board');
    expect(summary.headline).toContain('stopped at this first solution');
    expect(summary.table!.rows).toEqual([[1, 2], [2, 4], [3, 1], [4, 3]]);
  });

  it('N-Queens: find-all mode states the total count', () => {
    const { summary } = run('n-queens', { findAll: true });
    expect(summary.headline).toContain('Found 2 ways to place 4 queens on a 4×4 board');
  });

  it('KMP: states where the pattern occurs and keeps the LPS table', () => {
    const { result, summary } = run('kmp');
    expect(summary.headline).toContain('occurs 1 time in the text, starting at index 10');
    expect(summary.details).toContainEqual({ label: 'LPS (failure function) table', value: result.lpsTable.join(', ') });
  });

  it('KMP: reports when the pattern is absent', () => {
    const { summary } = run('kmp', { text: 'AAAA', pattern: 'B' });
    expect(summary.headline).toBe('"B" does not occur in the text.');
  });

  it.each(algorithmRegistry.map((a) => [a.id, a] as const))(
    '%s produces a specific (non-generic) summary for its default input',
    (_id, config) => {
      expect(config.summarizeResult).toBeTypeOf('function');
      const inputs = defaultInputs(config);
      let last: any;
      for (const step of config.stepGenerator(inputs)) last = step;
      const summary = buildResultSummary(last.result, config.summarizeResult, inputs);
      expect(summary.headline.length).toBeGreaterThan(0);
      expect(summary.headline).not.toMatch(/^The algorithm has finished/);
    }
  );
});

describe('Generic fallback', () => {
  it('handles missing results', () => {
    expect(genericResultSummary(undefined).headline).toBe('The algorithm has finished running.');
  });

  it('lists scalar fields when no summarizer is provided', () => {
    const summary = buildResultSummary({ maxValue: 7, selectedItemIndices: [1, 2], nested: { a: 1 } }, undefined);
    expect(summary.headline).toBe('The algorithm has finished. Key results:');
    expect(summary.details).toEqual([
      { label: 'Max value', value: '7' },
      { label: 'Selected item indices', value: '[1, 2]' },
    ]);
  });

  it('falls back when a summarizer returns null or throws', () => {
    expect(buildResultSummary({ x: 1 }, () => null).details).toEqual([{ label: 'X', value: '1' }]);
    expect(buildResultSummary({ x: 1 }, () => { throw new Error('boom'); }).headline).toBe(
      'The algorithm has finished. Key results:'
    );
  });
});
