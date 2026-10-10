import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { containerScrollFor, revealActiveLines } from '../utils/codeScroll';
import { AlgorithmPage } from '../pages/AlgorithmPage';
import { CodeExplanation } from '../components/common/CodeExplanation';
import { PlaybackControls } from '../components/common/PlaybackControls';
import { richTokens, plainText } from '../components/common/RichText';
import { VisualizerStage } from '../components/visualizers/VisualizerStage';

const SRC = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'tests' ? [] : sourceFiles(p);
    return /\.(tsx?|jsx?)$/.test(f) ? [p] : [];
  });
const renderPage = (id: string, mode: 'split' | 'stacked' = 'split') =>
  renderToStaticMarkup(<AlgorithmPage algorithmId={id} onBack={() => {}} initialLayoutMode={mode} />);

// ─── Pseudocode scrolling: container only, never the page ──────────────────
describe('Pseudocode auto-scroll (pure calculation)', () => {
  const box = { scrollTop: 100, clientHeight: 200, scrollHeight: 1000 };

  it('does nothing when the active lines are already visible', () => {
    expect(containerScrollFor({ top: 150, height: 24 }, box)).toBeNull();
    expect(containerScrollFor({ top: 110, height: 24 }, box)).toBeNull();
  });

  it('scrolls the container to centre a line below or above the visible area', () => {
    expect(containerScrollFor({ top: 500, height: 20 }, box)).toBe(410);
    expect(containerScrollFor({ top: 20, height: 20 }, box)).toBe(0);
  });

  it('aligns a block taller than the panel to its top and clamps to the scroll range', () => {
    expect(containerScrollFor({ top: 600, height: 300 }, box)).toBe(592);
    expect(containerScrollFor({ top: 990, height: 20 }, box)).toBe(800);
  });
});

describe('Pseudocode auto-scroll never moves the document', () => {
  afterEach(() => vi.unstubAllGlobals());

  /** A fake code container: lines of 24px, 10 visible at a time. */
  const fakeContainer = (scrollTop = 0) => {
    const lineEls = new Map<number, any>();
    const intoView = vi.fn();
    const container: any = {
      scrollTop,
      clientHeight: 240,
      scrollHeight: 24 * 40,
      getBoundingClientRect: () => ({ top: 300, bottom: 540 }),
      querySelector: (sel: string) => {
        const n = Number(sel.match(/data-line-num="(\d+)"/)![1]);
        if (!lineEls.has(n))
          lineEls.set(n, {
            scrollIntoView: intoView,
            getBoundingClientRect: () => ({ top: 300 + (n - 1) * 24 - container.scrollTop, bottom: 300 + n * 24 - container.scrollTop }),
          });
        return lineEls.get(n);
      },
      scrollTo: vi.fn(({ top }: { top: number }) => {
        container.scrollTop = top;
      }),
    };
    return { container, intoView };
  };

  it('moves only the container scrollTop; window.scrollY is unchanged and nothing calls scrollIntoView', () => {
    const windowScrollTo = vi.fn();
    vi.stubGlobal('window', { scrollY: 1234, scrollTo: windowScrollTo, matchMedia: () => ({ matches: false }) });
    const { container, intoView } = fakeContainer();

    revealActiveLines(container, [5]); // visible: no scroll
    expect(container.scrollTo).not.toHaveBeenCalled();

    revealActiveLines(container, [30]); // below: scroll the container only
    expect(container.scrollTo).toHaveBeenCalledTimes(1);
    expect(container.scrollTop).toBeGreaterThan(0);
    const after = container.scrollTop;

    revealActiveLines(container, [2, 3]); // above, e.g. after Reset or Previous
    expect(container.scrollTop).toBeLessThan(after);

    expect(intoView).not.toHaveBeenCalled();
    expect(windowScrollTo).not.toHaveBeenCalled();
    expect((globalThis as any).window.scrollY).toBe(1234);
  });

  it('uses an instant jump when the user prefers reduced motion', () => {
    vi.stubGlobal('window', { scrollY: 0, scrollTo: vi.fn(), matchMedia: () => ({ matches: true }) });
    const { container } = fakeContainer();
    revealActiveLines(container, [30]);
    expect(container.scrollTo.mock.calls[0][0].behavior).toBe('auto');
  });

  it('no source file calls scrollIntoView, and window.scrollTo is used only for user navigation', () => {
    for (const file of sourceFiles(SRC)) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(/\.scrollIntoView\(/);
      if (/window\.scrollTo\(/.test(text)) expect(file).toMatch(/App\.tsx$|HuffmanCodecVisualizer\.tsx$/);
    }
    // Huffman's is the "back to tree" button handler, not an effect.
    expect(read('components/visualizers/HuffmanCodecVisualizer.tsx')).toMatch(/onClick=\{scrollToTree\}/);
  });

  it('the code panel scrolls only on step or line changes, inside a bounded container', () => {
    const src = read('components/common/CodeExplanation.tsx');
    expect(src).toMatch(/revealActiveLines\(containerRef\.current/);
    expect(src).toMatch(/\[step\.stepIndex, activeKey, pseudocode\]/);
    const html = renderToStaticMarkup(
      <CodeExplanation step={{ stepIndex: 0, title: '', description: '', codeLine: 3, state: {}, highlights: {}, metrics: {} }} pseudocode={['a', 'b', 'c']} maxHeightClass="max-h-80" />
    );
    expect(html).toMatch(/data-testid="pseudocode-scroll" class="[^"]*overflow-y-auto[^"]*overscroll-contain[^"]*max-h-80/);
  });
});

// ─── Learning-stage layout ─────────────────────────────────────────────────
describe('Learning stage layout', () => {
  it.each(['fractional-knapsack', 'lcs', 'matrix-chain-multiplication', 'kmp', 'edmonds-karp', 'n-queens', 'karatsuba'])(
    '%s (split): one toolbar above two columns; pseudocode starts the right column, beside the visualization',
    (id) => {
      const html = renderPage(id, 'split');
      const toolbar = html.indexOf('role="toolbar"');
      const left = html.indexOf('lg:col-span-7');
      const right = html.indexOf('lg:col-span-5');
      expect(toolbar).toBeGreaterThan(-1);
      expect(toolbar).toBeLessThan(left);
      expect(left).toBeLessThan(right);
      // The left column holds the visualization and then the explanation.
      expect(html.indexOf('What happened and why?')).toBeGreaterThan(left);
      expect(html.indexOf('What happened and why?')).toBeLessThan(right);
      // The right column starts with the pseudocode (tops aligned with the visualization).
      expect(html.slice(right).match(/<section [^>]*aria-label="([^"]+)"/)![1]).toBe('Pseudocode');
      expect(html.indexOf('aria-label="Operation counts"')).toBeGreaterThan(html.indexOf('aria-label="Pseudocode"'));
      if (getAlgorithmById(id)!.dpBrief) {
        const rule = html.indexOf('aria-label="Rule for this cell"');
        expect(rule).toBeGreaterThan(html.indexOf('aria-label="Pseudocode"'));
        expect(html.slice(html.lastIndexOf('<div', rule), rule)).toContain('order-first lg:order-none');
      }
    }
  );

  it.each(['kmp', 'lcs'])('%s (full width): toolbar, visualization, explanation, then pseudocode', (id) => {
    const html = renderPage(id, 'stacked');
    const order = ['role="toolbar"', 'What happened and why?', 'aria-label="Pseudocode"', 'aria-label="Operation counts"'].map((m) => html.indexOf(m));
    expect(order.every((v) => v > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('the playback toolbar keeps every control and keyboard shortcut', () => {
    const html = renderToStaticMarkup(
      <PlaybackControls currentStep={2} totalSteps={10} isPlaying={false} speed={1} onPlay={() => {}} onPause={() => {}} onStepForward={() => {}} onStepBackward={() => {}} onReset={() => {}} onSeek={() => {}} onSpeedChange={() => {}} />
    );
    for (const t of ['Reset to beginning (Key: R)', 'Step backward (Key: ←)', 'Play (Key: Space)', 'Step forward (Key: →)']) expect(html).toContain(`title="${t}"`);
    expect(html).toContain('aria-label="Step position"');
    expect(html).toContain('aria-label="Playback speed slider"');
    expect(html.replace(/<[^>]+>/g, '')).toContain('Step 3 / 10');
    const src = read('components/common/PlaybackControls.tsx');
    for (const key of ["'Space'", "'ArrowRight'", "'ArrowLeft'", "'KeyR'"]) expect(src).toContain(key);
  });
});

// ─── Readability ───────────────────────────────────────────────────────────
describe('Readable text', () => {
  it('shared headings use sentence case, not uppercase monospace', () => {
    for (const f of ['ProblemIntuitionPanel', 'StepExplanation', 'CodeExplanation', 'MetricsPanel', 'PlaybackControls', 'DpCurrentRule', 'DpBriefPanel', 'FinalAnswerCard']) {
      expect(read(`components/common/${f}.tsx`), f).not.toMatch(/\buppercase\b/);
    }
  });

  it('pseudocode code is at least 13px and nothing on it is below 12px', () => {
    const src = read('components/common/CodeExplanation.tsx');
    expect(src).toContain('text-[13px] sm:text-sm');
    expect(src).not.toMatch(/text-\[(9|10|11)px\]/);
  });

  it('the step explanation body is 15–16px', () => {
    expect(read('components/common/StepExplanation.tsx')).toContain('text-[15px] sm:text-base');
  });
});

// ─── Problem & how it works content ────────────────────────────────────────
describe('Problem & how it works', () => {
  it.each(algorithmRegistry.map((a) => [a.id, a] as const))('%s has a short problem and 3–6 specific steps', (_id, a) => {
    const sentences = a.problemStatement.split(/(?<=[.!?])\s+/).filter(Boolean);
    expect(sentences.length).toBeLessThanOrEqual(3);
    expect(a.problemStatement).not.toMatch(/O\(|paradigm|linear time/i);
    const steps = a.coreSteps!;
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.length).toBeLessThanOrEqual(6);
    for (const step of steps) {
      expect((step.match(/`/g) ?? []).length % 2, step).toBe(0);
      expect((step.match(/\*\*/g) ?? []).length % 2, step).toBe(0);
      expect(plainText(step.split('\n')[0]).length, step).toBeLessThanOrEqual(160);
    }
  });

  it('every algorithm has its own steps', () => {
    const seen = new Set(algorithmRegistry.map((a) => a.coreSteps!.join('|')));
    expect(seen.size).toBe(algorithmRegistry.length);
  });

  it('Edmonds-Karp follows BFS → augmenting path → bottleneck → increase flow → repeat', () => {
    const text = getAlgorithmById('edmonds-karp')!.coreSteps!.join(' ');
    const order = ['BFS', 'augmenting path', 'bottleneck', 'Increase the flow', 'Repeat'].map((w) => text.indexOf(w));
    expect(order.every((v) => v > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('KMP separates LPS preparation from searching', () => {
    const [first, second] = getAlgorithmById('kmp')!.coreSteps!;
    expect(first).toMatch(/Phase 1, pattern only/);
    expect(first).toMatch(/LPS/);
    expect(second).toMatch(/Phase 2/);
  });

  it('Fractional Knapsack gives the take-whole / take-fraction choice as sub-points', () => {
    const step = getAlgorithmById('fractional-knapsack')!.coreSteps![2];
    expect(step.split('\n').filter((l) => l.startsWith('- '))).toHaveLength(2);
  });

  it('the panel renders numbered steps with condition chips and bold actions', () => {
    const html = renderPage('fractional-knapsack');
    expect(html).toContain('Problem &amp; how it works');
    expect(html).toContain('How it works');
    expect(html).toMatch(/<code class="[^"]*sem-formula[^"]*">value ÷ weight<\/code>/);
    expect(html).toContain('<strong class="font-semibold text-chalk-100">take the whole item</strong>');
    expect(html).not.toContain('Core Idea');
  });

  it('never states the default answer before playback', () => {
    const answers: [string, (r: any) => string][] = [
      ['fractional-knapsack', (r) => String(r.maxValue)],
      ['knapsack-dp', (r) => `${r.maxValue}`],
      ['lcs', (r) => String(r.lcsString ?? r.lcs ?? '')],
      ['karatsuba', (r) => String(r.product)],
    ];
    for (const [id, pick] of answers) {
      const a = getAlgorithmById(id)!;
      const result = [...a.stepGenerator(getDefaultInputs(a))].pop()!.result;
      const answer = pick(result);
      if (answer.length < 2) continue;
      const text = [a.problemStatement, ...a.coreSteps!].join(' ');
      expect(text, id).not.toContain(answer);
    }
  });
});

describe('Inline markup', () => {
  it('turns `code` into chips, **text** into bold and colours ✓ / ✗', () => {
    const t = richTokens('If `w ≤ W` ✓, **take it**; otherwise ✗.');
    expect(t.map((x) => x.kind)).toEqual(['text', 'code', 'text', 'mark', 'text', 'bold', 'text', 'mark', 'text']);
    expect(plainText('If `w ≤ W`, **take it**')).toBe('If w ≤ W, take it');
  });
});

// ─── Repeated text removed ─────────────────────────────────────────────────
describe('Visualizers do not repeat "What happened and why?"', () => {
  const stepsOf = (id: string) => {
    const a = getAlgorithmById(id)!;
    return { a, steps: [...a.stepGenerator(getDefaultInputs(a))] as any[] };
  };

  it.each(['max-subarray', 'karatsuba', 'assembly-line-scheduling', 'fractional-knapsack'])('%s visualizer omits the step title and restated explanation', (id) => {
    const { a, steps } = stepsOf(id);
    const s = steps[Math.min(3, steps.length - 1)];
    const html = renderToStaticMarkup(<VisualizerStage config={a} step={s} inputs={getDefaultInputs(a)} />).replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
    expect(html).not.toContain(`>${s.title}<`);
    if (s.state.explanation) expect(html).not.toContain(s.state.explanation);
    expect(html).not.toContain('[ GREEDY RULE ]');
  });

  it('Karatsuba still shows its calculation with real numbers', () => {
    const { a, steps } = stepsOf('karatsuba');
    const s = steps.find((x) => /Cross-Term/.test(x.title))!;
    const html = renderToStaticMarkup(<VisualizerStage config={a} step={s} inputs={getDefaultInputs(a)} />);
    expect(html).toContain(s.state.formulaExplanation);
  });
});
