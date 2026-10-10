import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import {
  initFormState,
  inputFormReducer,
  InputFormAction,
  InputFormState,
  isDirty,
  parseNumber,
  parseNumberList,
  parsePoints,
  parseText,
  validateForm,
  validateInputs,
} from '../utils/inputForm';
import { InputControlPanel } from '../components/common/InputControlPanel';

const cfg = (id: string) => getAlgorithmById(id)!;
const formFor = (id: string, overrides: Record<string, any> = {}) => initFormState(cfg(id), { ...getDefaultInputs(cfg(id)), ...overrides });
const apply = (state: InputFormState, ...actions: InputFormAction[]) => actions.reduce(inputFormReducer, state);
const finalOf = (id: string, inputs: Record<string, any>) => [...cfg(id).stepGenerator(inputs)].pop()!;

describe('parseNumberList', () => {
  it('accepts negatives, decimals, spaces and exponents', () => {
    expect(parseNumberList(' 3, -1 , 4.5,1e2 ', {})).toEqual({ ok: true, value: [3, -1, 4.5, 100] });
  });

  it('ignores one trailing comma (documented behaviour)', () => {
    expect(parseNumberList('3, 4,', {})).toEqual({ ok: true, value: [3, 4] });
    expect(parseNumberList('3, 4, ', {})).toEqual({ ok: true, value: [3, 4] });
  });

  it('reports empty values, leading commas and non-numbers instead of dropping them', () => {
    expect(parseNumberList('3,,4', {})).toMatchObject({ ok: false, error: expect.stringContaining('empty value after value 1') });
    expect(parseNumberList(',3', {})).toMatchObject({ ok: false, error: expect.stringContaining('start') });
    expect(parseNumberList('3, abc', {})).toMatchObject({ ok: false, error: 'Value 2 (“abc”) is not a number.' });
    expect(parseNumberList('-', {})).toMatchObject({ ok: false });
    expect(parseNumberList('0x10', {})).toMatchObject({ ok: false });
    expect(parseNumberList('', {})).toMatchObject({ ok: false, error: 'Enter at least one value.' });
  });

  it('enforces integer, positive, range and length constraints', () => {
    expect(parseNumberList('1, 2.5', { integer: true })).toMatchObject({ ok: false, error: 'Value 2 (2.5) must be a whole number.' });
    expect(parseNumberList('1, 0', { positive: true })).toMatchObject({ ok: false, error: 'Value 2 (0) must be greater than 0.' });
    expect(parseNumberList('1, -1', { itemMin: 0 })).toMatchObject({ ok: false, error: 'Value 2 (-1) must be at least 0.' });
    expect(parseNumberList('1, 99', { itemMax: 10 })).toMatchObject({ ok: false, error: 'Value 2 (99) must be at most 10.' });
    expect(parseNumberList('1, 2', { minLength: 3 })).toMatchObject({ ok: false, error: 'Enter at least 3 values (you have 2).' });
    expect(parseNumberList('1, 2, 3', { maxLength: 2 })).toMatchObject({ ok: false, error: 'Use at most 2 values (you have 3).' });
  });
});

describe('parseNumber (single numeric fields)', () => {
  it('rejects blank and partial input without producing NaN', () => {
    expect(parseNumber('', {})).toEqual({ ok: false, error: 'Enter a number.' });
    expect(parseNumber('-', {})).toMatchObject({ ok: false });
    expect(parseNumber('3.', {})).toEqual({ ok: true, value: 3 });
    expect(parseNumber('abc', {})).toMatchObject({ ok: false, error: '“abc” is not a number.' });
  });

  it('enforces integer and range constraints with helpful messages', () => {
    expect(parseNumber('2.5', { integer: true })).toEqual({ ok: false, error: 'Enter a whole number.' });
    expect(parseNumber('30', { min: 1, max: 20 })).toEqual({ ok: false, error: 'Enter a value from 1 to 20.' });
    expect(parseNumber('-1', { min: 0 })).toEqual({ ok: false, error: 'Enter a value of at least 0.' });
    expect(parseNumber(' 7 ', { min: 1, max: 20, integer: true })).toEqual({ ok: true, value: 7 });
  });
});

describe('parsePoints and parseText', () => {
  const rows = (pts: [string, string][]) => pts.map(([x, y]) => ({ x, y }));

  it('parses valid coordinate rows', () => {
    expect(parsePoints(rows([['0', '0'], ['10', '0'], ['5', '-7.5']]), { minLength: 3 })).toEqual({
      ok: true,
      value: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: -7.5 }],
    });
  });

  it('rejects too few points, bad coordinates, duplicates and a single line', () => {
    expect(parsePoints(rows([['0', '0'], ['1', '1']]), { minLength: 3 })).toMatchObject({ ok: false, error: 'Add at least 3 points (you have 2).' });
    expect(parsePoints(rows([['0', '0'], ['1', 'x'], ['2', '0']]), {})).toMatchObject({ ok: false, error: expect.stringContaining('Point 2, y') });
    expect(parsePoints(rows([['0', '0'], ['0', '0'], ['1', '1']]), {})).toMatchObject({ ok: false, error: expect.stringContaining('different positions') });
    expect(parsePoints(rows([['0', '0'], ['1', '1'], ['2', '2']]), {})).toMatchObject({ ok: false, error: expect.stringContaining('one straight line') });
  });

  it('text: required, with an optional pattern', () => {
    expect(parseText('   ', {})).toMatchObject({ ok: false });
    expect(parseText('BANANA', {})).toEqual({ ok: true, value: 'BANANA' });
    expect(parseText('12a', { pattern: '^\\d{1,12}$', patternMessage: 'Digits only.' })).toEqual({ ok: false, error: 'Digits only.' });
    expect(parseText(' 1234 ', { pattern: '^\\d{1,12}$' })).toEqual({ ok: true, value: '1234' });
  });
});

describe('Form state keeps raw text while typing', () => {
  it('temporary states like "-", "3,", "-2", "3.5" are kept exactly', () => {
    let s = formFor('max-subarray');
    for (const raw of ['-', '3,', '3, -', '3, -2', '3, -2, 3.5']) {
      s = apply(s, { type: 'edit', name: 'array', raw });
      expect(s.drafts.array).toBe(raw);
    }
  });

  it('editing marks the form dirty and does not touch the last valid input', () => {
    const inputs = getDefaultInputs(cfg('fractional-knapsack'));
    const s = apply(initFormState(cfg('fractional-knapsack'), inputs), { type: 'edit', name: 'weights', raw: '10, 2x' });
    expect(isDirty(s)).toBe(true);
    expect(inputs.weights).toEqual([10, 20, 30]);
    expect(validateForm(cfg('fractional-knapsack'), s)).toMatchObject({ valid: false, errors: { weights: 'Value 2 (“2x”) is not a number.' } });
  });

  it('errors become visible after blur or a Run attempt', () => {
    const s = apply(formFor('fractional-knapsack'), { type: 'edit', name: 'capacity', raw: '' });
    expect(s.touched.capacity).toBeFalsy();
    expect(apply(s, { type: 'blur', name: 'capacity' }).touched.capacity).toBe(true);
    expect(apply(s, { type: 'submitAttempt' }).submitted).toBe(true);
  });

  it('reset clears drafts back to the applied inputs', () => {
    const s = apply(formFor('max-subarray'), { type: 'edit', name: 'array', raw: '1,' });
    const r = apply(s, { type: 'reset', config: cfg('max-subarray'), inputs: getDefaultInputs(cfg('max-subarray')) });
    expect(r.drafts.array).toBe('-2, 1, -3, 4, -1, 2, 1, -5, 4');
    expect(isDirty(r)).toBe(false);
  });

  it('blank or NaN applied numbers show as empty text, never "NaN"', () => {
    expect(formFor('fractional-knapsack', { capacity: NaN }).drafts.capacity).toBe('');
  });

  it('TSP city count still resizes the cost matrix', () => {
    const s = apply(formFor('tsp'), { type: 'edit', name: 'numCities', raw: '5' });
    expect(s.other.costMatrix).toHaveLength(5);
    expect(s.other.costMatrix[4][4]).toBe(0);
  });
});

describe('Points editor state', () => {
  it('edits, adds and removes points', () => {
    let s = formFor('graham-scan');
    const n = s.points.points.length;
    s = apply(s, { type: 'editPoint', name: 'points', index: 0, axis: 'x', raw: '-' });
    expect(s.points.points[0].x).toBe('-');
    s = apply(s, { type: 'addPoint', name: 'points' });
    expect(s.points.points).toHaveLength(n + 1);
    s = apply(s, { type: 'removePoint', name: 'points', index: 0 }, { type: 'removePoint', name: 'points', index: 0 });
    expect(s.points.points).toHaveLength(n - 1);
  });

  it('a valid points edit changes the computed hull', () => {
    let s = formFor('graham-scan');
    const square: [number, number][] = [[0, 0], [100, 0], [100, 100], [0, 100], [50, 50]];
    s = { ...s, points: { points: square.map(([x, y]) => ({ x: String(x), y: String(y) })) } };
    const v = validateForm(cfg('graham-scan'), s);
    expect(v.valid).toBe(true);
    expect(finalOf('graham-scan', v.values).result.hullVertexCount).toBe(4);
    expect(finalOf('jarvis-march', v.values).result.hullVertexCount).toBe(4);
  });
});

describe('Valid edits regenerate steps; invalid ones are rejected with clear errors', () => {
  it('Maximum Subarray now accepts negative numbers', () => {
    const s = apply(formFor('max-subarray'), { type: 'edit', name: 'array', raw: '-3, -1, -2,' });
    const v = validateForm(cfg('max-subarray'), s);
    expect(v.valid).toBe(true);
    expect(v.values.array).toEqual([-3, -1, -2]);
    expect(finalOf('max-subarray', v.values).result.maxSum).toBe(-1);
  });

  it('Fractional Knapsack: edited lists drive the run', () => {
    const s = apply(formFor('fractional-knapsack'), { type: 'edit', name: 'weights', raw: '10, 20' }, { type: 'edit', name: 'values', raw: '60, 100' }, { type: 'edit', name: 'capacity', raw: '25' });
    const v = validateForm(cfg('fractional-knapsack'), s);
    expect(v.valid).toBe(true);
    expect(finalOf('fractional-knapsack', v.values).result.maxValue).toBe(135);
  });

  it('cross-field rules: mismatched lengths, transfer lists, source/sink, universe size', () => {
    const msg = (id: string, ...actions: InputFormAction[]) => validateForm(cfg(id), apply(formFor(id), ...actions)).formError;
    expect(msg('knapsack-dp', { type: 'edit', name: 'values', raw: '3, 4' })).toContain('same number of entries (4 weights, 2 values)');
    expect(msg('assembly-line-scheduling', { type: 'edit', name: 't1', raw: '2, 3' })).toContain('each transfer list needs 5 values');
    expect(msg('job-selection-bb', { type: 'edit', name: 'profits', raw: '1, 2' })).toContain('one deadline and one profit');
    expect(msg('ford-fulkerson', { type: 'edit', name: 'sink', raw: '0' })).toBe('Source and sink must be different vertices.');
    expect(msg('ford-fulkerson', { type: 'edit', name: 'sink', raw: '9' })).toContain('between 0 and 5');
    expect(msg('set-cover', { type: 'edit', name: 'universeSize', raw: '5' })).toContain('at least 10');
  });

  it('Bellman-Ford source is checked against the selected graph', () => {
    const neg = cfg('bellman-ford').presets.find((p) => /Negative Edge/.test(p.name))!;
    const s = apply(initFormState(cfg('bellman-ford'), { ...getDefaultInputs(cfg('bellman-ford')), ...neg.data }), { type: 'edit', name: 'source', raw: '4' });
    expect(validateForm(cfg('bellman-ford'), s).formError).toContain('between 0 and 3');
  });

  it('Karatsuba rejects non-digit input', () => {
    const v = validateForm(cfg('karatsuba'), apply(formFor('karatsuba'), { type: 'edit', name: 'num1', raw: '12.5' }));
    expect(v.errors.num1).toContain('digits only');
  });

  it('valid values never contain NaN', () => {
    for (const a of algorithmRegistry) {
      const v = validateInputs(a, getDefaultInputs(a));
      for (const f of a.inputSchema) {
        const val = v.values[f.name];
        if (typeof val === 'number') expect(Number.isNaN(val), `${a.id}.${f.name}`).toBe(false);
        if (Array.isArray(val)) for (const x of val) if (typeof x === 'number') expect(Number.isNaN(x)).toBe(false);
      }
    }
  });
});

describe('Every preset, default and random input passes the new validation', () => {
  it.each(algorithmRegistry.map((a) => [a.id, a] as const))('%s', (_id, a) => {
    const base = getDefaultInputs(a);
    const cases = [base, ...a.presets.map((p) => ({ ...base, ...p.data }))];
    for (let i = 0; i < 25; i++) cases.push({ ...base, ...a.generateRandomInput() });
    for (const inputs of cases) {
      const v = validateInputs(a, inputs);
      expect({ errors: v.errors, formError: v.formError }, JSON.stringify(inputs).slice(0, 120)).toEqual({ errors: {}, formError: null });
    }
  });
});

describe('No dead or broken controls', () => {
  const sources = readdirSync(join(__dirname, '../algorithms'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => readFileSync(join(__dirname, '../algorithms', f), 'utf8'));
  // numCities has no generator read for tsp-approx: the form uses it to resize the cost matrix the generator reads.
  const ALLOWED = new Set(['tsp-approx.numCities']);

  it.each(algorithmRegistry.map((a) => [a.id, a] as const))('%s: every input field is read by its generator', (id, a) => {
    const src = sources.find((s) => s.includes(`function* ${a.stepGenerator.name}(`))!;
    expect(src, `generator source for ${id}`).toBeDefined();
    for (const f of a.inputSchema) {
      if (ALLOWED.has(`${id}.${f.name}`)) continue;
      expect(src.includes(`inputs.${f.name}`), `${id}.${f.name} is never read`).toBe(true);
    }
  });

  it('select fields only offer values the generator understands (presets agree with options)', () => {
    for (const a of algorithmRegistry) {
      for (const f of a.inputSchema.filter((x) => x.type === 'select')) {
        const allowed = f.options!.map((o) => o.value);
        for (const p of a.presets) if (f.name in p.data) expect(allowed, `${a.id}.${f.name} in "${p.name}"`).toContain(p.data[f.name]);
      }
    }
  });

  it('removed controls are gone', () => {
    expect(cfg('floyd-warshall').inputSchema).toEqual([]);
    expect(cfg('vertex-cover-approx').inputSchema).toEqual([]);
    expect(cfg('edmonds-karp').inputSchema).toEqual([]);
    expect(cfg('push-relabel').inputSchema).toEqual([]);
    expect(cfg('line-segment-intersection').inputSchema).toEqual([]);
    expect(cfg('karger-min-cut').inputSchema.map((f) => f.name)).toEqual(['trials']);
  });
});

describe('InputControlPanel rendering', () => {
  const render = (id: string) =>
    renderToStaticMarkup(<InputControlPanel config={cfg(id)} currentInputs={getDefaultInputs(cfg(id))} onApplyInputs={() => {}} />);

  it('points render as editable x/y rows, never [object Object]', () => {
    const html = render('graham-scan');
    expect(html).not.toContain('[object Object]');
    expect(html).toContain('aria-label="Point P0 x coordinate"');
    expect(html).toContain('Add point');
  });

  it('list fields show the raw comma-separated text and a format hint', () => {
    const html = render('max-subarray');
    expect(html).toContain('value="-2, 1, -3, 4, -1, 2, 1, -5, 4"');
    expect(html).toContain('Separate values with commas');
  });

  it('algorithms without editable fields say so instead of showing an empty form', () => {
    const html = render('floyd-warshall');
    expect(html).toContain('can’t be edited here yet');
    expect(html).not.toContain('<form');
  });

  it('labels are linked to their inputs', () => {
    expect(render('knapsack-dp')).toContain('for="knapsack-dp-capacity"');
  });
});
