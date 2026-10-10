import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { SEM, SEMANTIC_KINDS, SEMANTIC_TOKENS, semColor } from '../styles/semantics';
import { NODE_THEMES } from '../utils/treeTheme';
import { StringMatchVisualizer } from '../components/visualizers/StringMatchVisualizer';
import { GraphVisualizer } from '../components/visualizers/GraphVisualizer';
import { CodeExplanation } from '../components/common/CodeExplanation';
import { AlgorithmStep } from '../types/algorithm';

// ─── Colour maths (WCAG 2.x) ────────────────────────────────────────────────
type RGB = [number, number, number];
const parse = (s: string): RGB => s.trim().split(/\s+/).map(Number) as RGB;
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const lum = ([r, g, b]: RGB) => {
  const ch = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const blend = (bg: RGB, fg: RGB, alpha: number) => bg.map((v, i) => Math.round(v * (1 - alpha) + fg[i] * alpha)) as RGB;

// ─── Read the real theme file ───────────────────────────────────────────────
const css = readFileSync(join(__dirname, '../index.css'), 'utf8');
const block = (selector: string) => css.slice(css.indexOf(`${selector} {`), css.indexOf('}', css.indexOf(`${selector} {`)));
const vars = (selector: string) =>
  Object.fromEntries([...block(selector).matchAll(/--([\w-]+):\s*([\d\s.]+);/g)].map((m) => [m[1], m[2].trim()]));
const THEMES = { light: vars(':root'), dark: vars('.dark') };

describe('Semantic tokens', () => {
  it.each(['light', 'dark'] as const)('%s: CSS variables match the TypeScript mirror', (theme) => {
    for (const k of SEMANTIC_KINDS) {
      expect(THEMES[theme][`sem-${k}`], `${theme} --sem-${k}`).toBe(SEMANTIC_TOKENS[theme][k].accent);
      expect(THEMES[theme][`sem-${k}-ink`], `${theme} --sem-${k}-ink`).toBe(SEMANTIC_TOKENS[theme][k].ink);
    }
  });

  it('Tailwind exposes every semantic colour and its ink', () => {
    const tw = readFileSync(join(__dirname, '../../tailwind.config.js'), 'utf8');
    for (const k of SEMANTIC_KINDS) {
      expect(tw).toContain(`${k}: 'rgb(var(--sem-${k}) / <alpha-value>)'`);
      expect(tw).toContain(`'${k}-ink': 'rgb(var(--sem-${k}-ink) / <alpha-value>)'`);
    }
  });

  describe.each(['light', 'dark'] as const)('%s theme contrast', (theme) => {
    const surfaces = { surface: parse(THEMES[theme]['bg-surface']), canvas: parse(THEMES[theme]['bg-canvas']) };
    it.each(SEMANTIC_KINDS.map((k) => [k] as const))('%s: ink readable on its tint, accent visible on the page', (k) => {
      const accent = parse(SEMANTIC_TOKENS[theme][k].accent);
      const ink = parse(SEMANTIC_TOKENS[theme][k].ink);
      for (const [name, bg] of Object.entries(surfaces)) {
        expect(contrast(ink, blend(bg, accent, 0.15)), `${k} ink on tint over ${name}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(ink, bg), `${k} ink on ${name}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(accent, bg), `${k} accent on ${name}`).toBeGreaterThanOrEqual(3);
      }
    });
  });

  it('fixes the old light-mode mismatch (rose-200 text on a rose tint was unreadable)', () => {
    const white: RGB = [255, 255, 255];
    const oldText = hex('#fecdd3'); // rose-200
    const oldBg = blend(white, hex('#f43f5e'), 0.3); // rose-500 at 30%
    expect(contrast(oldText, oldBg)).toBeLessThan(2);
    const t = SEMANTIC_TOKENS.light.mismatch;
    expect(contrast(parse(t.ink), blend(white, parse(t.accent), 0.15))).toBeGreaterThan(7);
  });

  it('pruned search-tree nodes are neutral and readable', () => {
    const p = NODE_THEMES.pruned;
    expect(contrast(hex(p.primaryText), hex(p.bg))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(hex(p.subText), hex(p.bg))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(hex(p.badgeText!), hex(p.badgeBg!))).toBeGreaterThanOrEqual(4.5);
  });

  it('every semantic has a label, a non-colour symbol, and only uses its own colour', () => {
    for (const k of SEMANTIC_KINDS) {
      const s = SEM[k];
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.symbol.length).toBeGreaterThan(0);
      for (const cls of [s.cell, s.badge, s.text, s.border, s.swatch]) {
        const used = [...cls.matchAll(/sem-([a-z]+)/g)].map((m) => m[1]);
        expect(used.every((u) => u === k), `${k}: ${cls}`).toBe(true);
      }
    }
    expect(semColor('mismatch')).toBe('rgb(var(--sem-mismatch))');
    expect(semColor('match', 'ink', 0.5)).toBe('rgb(var(--sem-match-ink) / 0.5)');
  });
});

// ─── String matching ────────────────────────────────────────────────────────
const stepsOf = (id: string, overrides: Record<string, any> = {}) =>
  [...getAlgorithmById(id)!.stepGenerator({ ...getDefaultInputs(getAlgorithmById(id)!), ...overrides })] as AlgorithmStep[];
const render = (step: AlgorithmStep) => renderToStaticMarkup(<StringMatchVisualizer step={step} />);
const firstWith = (steps: AlgorithmStep[], pred: (s: AlgorithmStep) => boolean) => steps.find(pred)!;

describe('String matching uses one match/mismatch language', () => {
  const naive = stepsOf('naive-string-match');
  const kmp = stepsOf('kmp');
  const rk = stepsOf('rabin-karp');
  const mismatchStep = (steps: AlgorithmStep[]) => firstWith(steps, (s) => s.state.currentComparison && !s.state.currentComparison.isMatch && s.state.phase !== 'lps');
  const matchStep = (steps: AlgorithmStep[]) => firstWith(steps, (s) => s.state.currentComparison?.isMatch && s.state.phase !== 'lps');

  it('a mismatch shows ✗, screen-reader text and the readable mismatch ink, with no raw rose classes', () => {
    const html = render(mismatchStep(naive));
    expect(html).toContain('✗');
    expect(html).toContain('(mismatch)');
    expect(html).toContain('text-sem-mismatch-ink');
    expect(html).not.toMatch(/\brose-\d/);
  });

  it('a match shows ✓ and the match ink', () => {
    const html = render(matchStep(naive));
    expect(html).toContain('✓');
    expect(html).toContain('(match)');
    expect(html).toContain('text-sem-match-ink');
  });

  it('Naive, KMP and Rabin-Karp style a mismatched character identically', () => {
    const cellClass = (html: string) => {
      const i = html.indexOf('(mismatch)');
      const start = html.lastIndexOf('class="relative w-9', i);
      return html.slice(start, html.indexOf('"', start + 7));
    };
    const rkMismatch = firstWith(rk, (s) => s.state.currentComparison && !s.state.currentComparison.isMatch);
    const ref = cellClass(render(mismatchStep(naive)));
    expect(ref).toContain('sem-mismatch');
    expect(cellClass(render(mismatchStep(kmp)))).toBe(ref);
    if (rkMismatch) expect(cellClass(render(rkMismatch))).toBe(ref);
  });

  it('only the current comparison carries a verdict mark (restraint)', () => {
    for (const s of [...naive, ...kmp, ...rk]) {
      expect(render(s).split('sr-only">(m').length - 1).toBeLessThanOrEqual(2);
    }
  });

  it('Rabin-Karp: the leaving character is neutral and labelled OUT, never styled as an error', () => {
    const roll = firstWith(rk, (s) => !!s.state.rollingInfo);
    const html = render(roll);
    const out = html.indexOf('>− OUT<');
    expect(out).toBeGreaterThan(-1);
    const cell = html.slice(out, html.indexOf('</div>', html.indexOf('class="relative w-9', out)));
    expect(cell).toContain('line-through');
    expect(cell).not.toContain('sem-mismatch');
    expect(html).toContain('>+ IN<');
    expect(html).toContain('− OUT (leaves on the left)');
  });

  it('Rabin-Karp: a hash collision is a warning, not a mismatch', () => {
    const spurious = firstWith(rk, (s) => !!s.state.hashInfo?.spurious);
    const html = render(spurious);
    expect(html).toContain('sem-warning');
    expect(html).toContain('Spurious hit');
  });

  it('legend pairs every colour with a symbol or word', () => {
    const html = render(rk[3]);
    expect(html).toContain('aria-label="Legend"');
    for (const sym of ['✓', '✗', '▶', 'OUT', 'IN', '⚠']) expect(html).toContain(sym);
  });
});

describe('Other surfaces share the semantics', () => {
  it('the active pseudocode line uses the "current" style', () => {
    const html = renderToStaticMarkup(
      <CodeExplanation
        step={{ stepIndex: 0, title: '', description: '', codeLine: 2, state: {}, highlights: {}, metrics: {} }}
        pseudocode={['a', 'b', 'c']}
      />
    );
    expect(html).toContain('bg-sem-current/15');
  });

  it('Bellman-Ford negative-cycle edges use the theme-aware mismatch colour, dashed', () => {
    const neg = getAlgorithmById('bellman-ford')!.presets.find((p) => /Negative Edge/.test(p.name))!;
    const steps = stepsOf('bellman-ford', neg.data);
    const cycle = steps.find((s) => s.highlights.edges?.some((e) => e.status === 'negcycle'))!;
    const html = renderToStaticMarkup(<GraphVisualizer step={cycle} />);
    expect(html).toContain('stroke:rgb(var(--sem-mismatch))');
    expect(html).toContain('stroke-dasharray="5 3"');
  });
});
