import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { kmpSteps } from '../algorithms/kmp';
import { rabinKarpSteps } from '../algorithms/rabinKarp';
import { naiveStringMatchSteps } from '../algorithms/naiveStringMatch';
import { suffixTreeSteps, SuffixTreeNodeSnapshot } from '../algorithms/suffixTree';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { StringMatchVisualizer } from '../components/visualizers/StringMatchVisualizer';
import { SuffixListPanel, leafSuffixIndices } from '../components/visualizers/SuffixListPanel';

const kmp = (text: string, pattern: string) => [...kmpSteps({ text, pattern })] as any[];
const rk = (text: string, pattern: string) => [...rabinKarpSteps({ text, pattern })] as any[];
const render = (step: any) => renderToStaticMarkup(<StringMatchVisualizer step={step} />);

/** LPS straight from the definition: longest proper prefix of P[0…i] that is also its suffix. */
const bruteLps = (p: string) =>
  [...p].map((_, i) => {
    const w = p.slice(0, i + 1);
    for (let k = i; k > 0; k--) if (w.slice(0, k) === w.slice(w.length - k)) return k;
    return 0;
  });

const occurrences = (t: string, p: string) => [...Array(Math.max(0, t.length - p.length + 1)).keys()].filter((s) => t.startsWith(p, s));

describe('KMP: LPS construction is its own phase', () => {
  it.each(['ABABCABAB', 'AABAACAABAA', 'AAACAAAA', 'ABCDE', 'AAAA'])('LPS for %s matches the definition', (pattern) => {
    const steps = kmp('ABABDABACDABABCABAB', pattern);
    expect(steps.at(-1).result.lpsTable).toEqual(bruteLps(pattern));
  });

  it('every LPS step comes before every search step, with separate pseudocode lines', () => {
    const steps = kmp('ABABDABACDABABCABAB', 'ABABCABAB');
    const phases = steps.map((s) => s.state.phase);
    expect(phases.lastIndexOf('lps')).toBeLessThan(phases.indexOf('search'));
    const lines = (s: any) => (Array.isArray(s.codeLine) ? s.codeLine : [s.codeLine]);
    for (const s of steps.filter((s) => s.state.phase === 'lps')) for (const l of lines(s)) expect(l).toBeLessThanOrEqual(16);
    for (const s of steps.filter((s) => s.state.phase === 'search')) for (const l of lines(s)) expect(l).toBeGreaterThanOrEqual(18);
    const code = getAlgorithmById('kmp')!.pseudocode!;
    expect(code[0]).toMatch(/Phase 1 · PREPROCESSING/);
    expect(code[17]).toMatch(/Phase 2 · SEARCHING/);
    expect(code.slice(1, 16).join('\n')).not.toMatch(/text/);
  });

  it('LPS fallback: len drops to LPS[len − 1] while i stays, then the same i is compared again', () => {
    for (const pattern of ['AAACAAAA', 'ABABCABAB', 'AABAACAABAA']) {
      const steps = kmp('AAAA', pattern);
      const lps = bruteLps(pattern);
      const fallbacks = steps.map((s, idx) => [s, idx] as const).filter(([s]) => s.state.lpsAction === 'fallback');
      expect(fallbacks.length, pattern).toBeGreaterThan(0);
      for (const [s, idx] of fallbacks) {
        const { patternIndex: i, lpsLen: len, prevLen } = s.state;
        expect(len).toBe(lps[prevLen - 1]);
        expect(len).toBeLessThan(prevLen);
        const before = steps[idx - 1].state;
        expect(before.lpsAction).toBe('compare');
        expect(before.currentComparison.isMatch).toBe(false);
        expect([before.patternIndex, before.lpsLen]).toEqual([i, prevLen]);
        const after = steps[idx + 1].state;
        expect(after.lpsAction).toBe('compare');
        expect([after.patternIndex, after.lpsLen]).toEqual([i, len]);
      }
    }
  });

  it('LPS growth: after a match len grows by exactly one and LPS[i] = len', () => {
    const steps = kmp('AAAA', 'AABAACAABAA');
    const extends_ = steps.map((s, idx) => [s, idx] as const).filter(([s]) => s.state.lpsAction === 'extend');
    expect(extends_.length).toBeGreaterThan(3);
    for (const [s, idx] of extends_) {
      expect(s.state.lpsLen).toBe(steps[idx - 1].state.lpsLen + 1);
      expect(s.state.lpsTable[s.state.patternIndex]).toBe(s.state.lpsLen);
    }
    const iValues = steps.filter((s) => s.state.phase === 'lps' && s.state.patternIndex >= 1).map((s) => s.state.patternIndex);
    for (let k = 1; k < iValues.length; k++) expect(iValues[k]).toBeGreaterThanOrEqual(iValues[k - 1]);
  });

  it('search fallback: j = LPS[j − 1] and the text index never moves backwards', () => {
    const steps = kmp('ABABDABACDABABCABAB', 'ABABCABAB');
    const lps = steps.at(-1).result.lpsTable;
    const search = steps.filter((s) => s.state.phase === 'search' && !s.isFinal);
    for (let k = 1; k < search.length; k++) expect(search[k].state.textIndex).toBeGreaterThanOrEqual(search[k - 1].state.textIndex);
    const fallbacks = steps.map((s, idx) => [s, idx] as const).filter(([s]) => s.state.phase === 'search' && s.state.lpsUsedIndex !== undefined && s.state.currentComparison);
    expect(fallbacks.length).toBeGreaterThan(0);
    for (const [s, idx] of fallbacks) {
      const prev = steps[idx - 1].state;
      expect(s.state.patternIndex).toBe(lps[s.state.lpsUsedIndex]);
      expect(prev.patternIndex).toBe(s.state.lpsUsedIndex + 1);
      expect(s.state.textIndex).toBe(prev.textIndex);
    }
  });

  it('results still agree with a direct search', () => {
    let seed = 7;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    for (let t = 0; t < 40; t++) {
      const text = Array.from({ length: 6 + Math.floor(rand() * 14) }, () => 'AB'[Math.floor(rand() * 2)]).join('');
      const pattern = Array.from({ length: 1 + Math.floor(rand() * 4) }, () => 'AB'[Math.floor(rand() * 2)]).join('');
      expect(kmp(text, pattern).at(-1).result.matchIndices, `${text}/${pattern}`).toEqual(occurrences(text, pattern));
    }
  });

  it('the LPS view shows only the pattern, with i and len, and no text-search visuals', () => {
    const steps = kmp('ABABDABACDABABCABAB', 'AAACAAAA');
    const compare = steps.find((s) => s.state.lpsAction === 'compare' && s.state.lpsLen > 0)!;
    const html = render(compare);
    expect(html).toContain('Suffix side (pointer i)');
    expect(html).toContain('Prefix side (pointer len)');
    expect(html).toContain(`i = ${compare.state.patternIndex}`);
    expect(html).toContain(`len = ${compare.state.lpsLen}`);
    expect(html).toContain('longest <em>proper</em> prefix');
    for (const absent of ['Target Text', 'MATCHES FOUND', 'SHIFT:', 'Character Match', 'Window W_']) expect(html).not.toContain(absent);

    const fallback = render(steps.find((s) => s.state.lpsAction === 'fallback')!);
    expect(fallback).toContain('len falls back');
    expect(fallback).toContain('i stays at');
  });

  it('the search view explains why j moves back without moving i', () => {
    const steps = kmp('ABABDABACDABABCABAB', 'ABABCABAB');
    const fallback = steps.find((s) => s.state.phase === 'search' && s.state.lpsUsedIndex !== undefined && s.state.currentComparison)!;
    const html = render(fallback);
    expect(html).toContain('Target Text');
    expect(html).toContain('i (text) =');
    expect(html).toContain('Why j moves back but i does not');
    expect(html).not.toContain('Suffix side (pointer i)');
    expect(fallback.description).toMatch(/i stays at/);
  });
});

describe('Rabin-Karp: rolling hash updates', () => {
  const D = 256;
  const Q = 101;
  const hash = (w: string) => [...w].reduce((h, c) => (D * h + c.charCodeAt(0)) % Q, 0);

  it.each([
    ['ABABDABACDABABCABAB', 'ABABCABAB'],
    ['3141592653589793', '26'],
    ['AABAACAADAABAABA', 'AABA'],
  ])('every rolled hash for %s / %s equals the direct hash, with consistent stages', (text, pattern) => {
    const m = pattern.length;
    const rolls = rk(text, pattern).filter((s) => s.state.rollingInfo);
    expect(rolls.length).toBe(text.length - m);
    for (const s of rolls) {
      const r = s.state.rollingInfo;
      const shift = s.state.shift;
      const h = s.state.hashInfo.highOrder;
      expect(r.removedChar).toBe(text[shift - 1]);
      expect(r.addedChar).toBe(text[shift + m - 1]);
      expect(r.prevHash).toBe(hash(text.slice(shift - 1, shift - 1 + m)));
      expect(r.nextHash).toBe(hash(text.slice(shift, shift + m)));
      const [out, mul, add, mod] = r.stages;
      expect(out.value).toBe(r.prevHash - r.removedAscii * h);
      expect(out.expr).toBe(`${r.prevHash} − ${r.removedAscii} × ${h}`);
      expect(mul.value).toBe(out.value * D);
      expect(add.value).toBe(mul.value + r.addedAscii);
      expect(mod.value).toBe(((add.value % Q) + Q) % Q);
      expect(mod.value).toBe(r.nextHash);
    }
  });

  it('a hash collision is verified character by character and not reported', () => {
    // Find a 3-letter window with the same hash as the pattern but different letters.
    const pattern = 'ABC';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let twin = '';
    for (const a of letters) for (const b of letters) for (const c of letters) if (!twin && a + b + c !== pattern && hash(a + b + c) === hash(pattern)) twin = a + b + c;
    expect(twin).not.toBe('');
    const steps = rk(`X${twin}YABC`, pattern);
    expect(steps.some((s) => s.state.hashInfo?.spurious)).toBe(true);
    expect(steps.at(-1).result.matchIndices).toEqual([5]);
    const hit = steps.find((s) => s.state.hashInfo?.hashMatch && !s.state.currentComparison && !s.state.rollingInfo)!;
    expect(hit.description).toMatch(/do not prove equal strings/);
  });

  it('the roll view shows outgoing and incoming characters and the substituted update', () => {
    const roll = rk('ABABDABACDABABCABAB', 'ABABCABAB').find((s) => s.state.rollingInfo)!;
    const html = render(roll);
    const r = roll.state.rollingInfo;
    expect(html).toContain('− OUT (leaves on the left)');
    expect(html).toContain('+ IN (enters on the right)');
    for (const st of r.stages) expect(html).toContain(`${st.expr} = <strong`);
    expect(html).toContain(`>${r.nextHash}</strong>`);
    // outgoing styling is neutral
    const outCard = html.slice(html.indexOf('− OUT (leaves'), html.indexOf('+ IN (enters'));
    expect(outCard).not.toContain('sem-mismatch');
  });
});

describe('Naive matching', () => {
  it('offers a worst-case repeated-character preset that costs (n − m + 1)·m comparisons', () => {
    const preset = getAlgorithmById('naive-string-match')!.presets!.find((p) => /Worst Case/.test(p.name))!;
    const { text, pattern } = preset.data as { text: string; pattern: string };
    const steps = [...naiveStringMatchSteps({ text, pattern })];
    expect(steps.at(-1)!.metrics!.comparisons).toBe((text.length - pattern.length + 1) * pattern.length);
  });

  it('a mismatch is shown with ✗ and readable colours in both themes', () => {
    const step = [...naiveStringMatchSteps({ text: 'ABABDABACDABABCABAB', pattern: 'ABABCABAB' })].find((s) => s.state.currentComparison && !s.state.currentComparison.isMatch)!;
    const html = render(step);
    expect(html).toContain('sem-mismatch');
    expect(html).toContain('✗');
    expect(html).toContain('(mismatch)');

    // The ✗ badge is surface-coloured text on the mismatch accent.
    const css = readFileSync(join(__dirname, '../index.css'), 'utf8');
    const rgb = (block: string, name: string) => block.match(new RegExp(`--${name}:\\s*([\\d ]+);`))![1].trim().split(/\s+/).map(Number);
    const lum = (c: number[]) => {
      const ch = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
    };
    const contrast = (a: number[], b: number[]) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const light = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
    const dark = css.slice(css.indexOf('.dark {'), css.indexOf('}', css.indexOf('.dark {')));
    for (const block of [light, dark]) expect(contrast(rgb(block, 'bg-surface'), rgb(block, 'sem-mismatch'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Suffix tree teaching', () => {
  const st = (text: string, pattern: string) => [...suffixTreeSteps({ text, pattern })] as any[];

  /** Strings spelled by every root-to-leaf path, keyed by the leaf's suffix index. */
  const paths = (node: SuffixTreeNodeSnapshot, prefix = ''): Record<number, string> =>
    node.isLeaf ? { [node.suffixIndex]: prefix + node.edgeLabel } : Object.assign({}, ...node.children.map((c) => paths(c, prefix + node.edgeLabel)));

  it.each(['BANANA', 'MISSISSIPPI', 'AABAACAADAABAABA'])('every suffix of %s$ ends at its own leaf and its path spells it', (text) => {
    const done = st(text, 'A').find((s) => s.title === 'Suffix tree complete')!;
    const t = done.state.text;
    expect(leafSuffixIndices(done.state.suffixTree).sort((a, b) => a - b)).toEqual([...Array(t.length).keys()]);
    const spelled = paths(done.state.suffixTree);
    for (let k = 0; k < t.length; k++) expect(spelled[k]).toBe(t.slice(k));
  });

  it('the suffix list shows every suffix including the terminal marker', () => {
    const first = st('BANANA', 'ANA')[0];
    const html = renderToStaticMarkup(<SuffixListPanel state={first.state} />);
    for (const suffix of ['BANANA$', 'ANANA$', 'NANA$', 'ANA$', 'NA$', 'A$']) expect(html).toContain(`>${suffix}<`);
    expect(html).toMatch(/>\$<\/span>/);
    expect(html).toContain('is the text from one position to the end');
  });

  it('during search, the highlighted suffixes are exactly those beginning with the matched part', () => {
    const steps = st('BANANA', 'ANA');
    const partial = steps.find((s) => s.state.phase === 'search' && s.state.matchedLength === 2)!;
    const html = renderToStaticMarkup(<SuffixListPanel state={partial.state} />);
    const marked = (html.match(/font-bold">AN<\/span>/g) ?? []).length;
    expect(marked).toBe(2); // ANANA$ and ANA$
    const expected = [...Array(7).keys()].filter((k) => 'BANANA$'.slice(k).startsWith('AN')).length;
    expect(marked).toBe(expected);
    const final = steps.at(-1);
    expect(final.result.matchIndices).toEqual(occurrences('BANANA', 'ANA'));
    const finalHtml = renderToStaticMarkup(<SuffixListPanel state={final.state} />);
    expect((finalHtml.match(/>★</g) ?? []).length).toBe(final.result.matchIndices.length);
  });

  it('search steps highlight the search lines of the pseudocode', () => {
    const steps = st('BANANA', 'ANA');
    const code = getAlgorithmById('suffix-tree')!.pseudocode!;
    const matches = steps.filter((s) => /^Match P\[/.test(s.title));
    expect(matches.length).toBe(3);
    for (const s of matches) expect(code[s.codeLine - 1]).toMatch(/match next character/);
    expect(code[steps.find((s) => /collect leaves/.test(s.title))!.codeLine - 1]).toMatch(/collect suffix indices/);
    expect(code[steps.at(-1).codeLine - 1]).toMatch(/return/);
  });
});
