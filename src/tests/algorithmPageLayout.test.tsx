import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { AlgorithmPage } from '../pages/AlgorithmPage';
import { StepExplanation } from '../components/common/StepExplanation';
import { FinalAnswerCard } from '../components/common/FinalAnswerCard';
import { MetricsPanel } from '../components/common/MetricsPanel';

const decode = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
const count = (hay: string, needle: string) => hay.split(needle).length - 1;
const renderPage = (id: string, mode: 'split' | 'stacked') =>
  renderToStaticMarkup(<AlgorithmPage algorithmId={id} onBack={() => {}} initialLayoutMode={mode} initialView="play" />);
const renderLearn = (id: string) => renderToStaticMarkup(<AlgorithmPage algorithmId={id} onBack={() => {}} />);

describe.each(['split', 'stacked'] as const)('AlgorithmPage layout (%s)', (mode) => {
  it.each(algorithmRegistry.map((a) => [a.id, a] as const))('%s', (id, a) => {
    const html = renderPage(id, mode);
    const text = decode(html);
    const first = [...a.stepGenerator(getDefaultInputs(a))][0];

    // One explanation panel, showing the full first-step title and description exactly once.
    expect(count(html, 'What happened and why?')).toBe(1);
    expect(count(text, first.title)).toBeGreaterThanOrEqual(1);
    expect(count(text, first.description)).toBe(1);

    // One playback toolbar, one pseudocode panel, one operation-counts panel.
    expect(count(html, 'aria-label="Playback speed slider"')).toBe(1);
    expect(count(html, 'title="Step forward (Key: →)"')).toBe(1);
    expect(count(html, 'role="toolbar"')).toBe(1);
    expect(count(html, 'id="pseudocode-line-1"')).toBe(1);
    expect(count(html, 'aria-label="Operation counts"')).toBe(1);

    // Player order: explanation → final answer. The input form lives in the "Edit input" popup
    // (closed until opened) and the complexity analysis on the learn view.
    const explanation = html.indexOf('What happened and why?');
    const answer = html.indexOf('Final answer');
    expect(explanation).toBeGreaterThan(-1);
    expect(answer).toBeGreaterThan(explanation);
    expect(html).toContain('data-edit-input');
    expect(html).toContain('data-back-to-learn');
    expect(html).not.toContain('Input &amp; presets');
    expect(html).not.toContain('Time and space complexity');
    expect(html).not.toContain('aria-label="Problem and how it works"');

    // Before the run finishes, only a placeholder sits in the answer slot.
    if (!(id === 'graph-coloring' && getDefaultInputs(a).findMode === 'all')) {
      expect(html).toContain('The answer appears here when the algorithm finishes');
    }

    // Plain language only.
    expect(html).not.toMatch(/LIVE OPERATION TELEMETRY|COMPUTED SOLUTION ARTIFACT|REALTIME DISPATCH|INITIALIZE &amp; RUN SIMULATION|EXECUTION STATUS/);
  });
});

describe.each(algorithmRegistry.map((a) => [a.id] as const))('Learn view (%s)', (id) => {
  it('shows the problem & how it works and the complexity, with a start button, but no player', () => {
    const html = renderLearn(id);
    expect(html).toContain('data-view="learn"');
    expect(html).toContain('aria-label="Problem and how it works"');
    expect(html).toContain('Time and space complexity');
    expect(count(html, 'data-start-animation')).toBe(2);
    expect(html).not.toContain('role="toolbar"');
    expect(html).not.toContain('What happened and why?');
  });
});

describe('Player view fits the screen', () => {
  it('split layout fills the screen height on wide screens and scrolls its two columns, not the page', () => {
    const html = renderPage('knapsack-dp', 'split');
    expect(html).toContain('data-view="play"');
    expect(html).toContain('lg:h-[calc(100dvh/var(--app-zoom,1)-2.75rem-1px)]');
    expect(count(html, 'lg:overflow-y-auto')).toBe(2);
    // Narrow side padding.
    expect(html).toMatch(/data-view="play" class="[^"]*\bpx-2\b/);
  });

  it('full-width layout keeps normal page scrolling', () => {
    expect(renderPage('knapsack-dp', 'stacked')).not.toContain('lg:h-[calc(100dvh/var(--app-zoom,1)-2.75rem-1px)]');
  });

  it('the input popup holds the full input form', async () => {
    const { InputDialog } = await import('../components/common/InputDialog');
    const cfg = getAlgorithmById('knapsack-dp')!;
    const html = renderToStaticMarkup(<InputDialog config={cfg} currentInputs={getDefaultInputs(cfg)} onApply={() => {}} onClose={() => {}} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Edit input: ' + cfg.name);
    expect(html).toContain('Input &amp; presets');
  });
});

describe('Step explanation is never hidden or truncated', () => {
  it('has no breakpoint-hiding or truncation classes', () => {
    const html = renderPage('kmp', 'split');
    const start = html.indexOf('aria-labelledby="step-explanation-heading"');
    const section = html.slice(html.lastIndexOf('<section', start), html.indexOf('</section>', start));
    expect(section).not.toMatch(/\btruncate\b|\bhidden\b|line-clamp/);
  });

  it('renders long, multi-line descriptions in full with step position and code line', () => {
    const long = 'First line of reasoning.\nSecond line: dp[i][w] = max(dp[i-1][w], v + dp[i-1][w-wi]).\n' + 'x'.repeat(600);
    const html = renderToStaticMarkup(
      <StepExplanation
        step={{ stepIndex: 4, title: 'Evaluate cell', description: long, codeLine: [3, 5], state: {}, highlights: {}, metrics: {} }}
        stepNumber={5}
        totalSteps={20}
      />
    );
    expect(decode(html)).toContain(long);
    expect(html).toContain('whitespace-pre-line');
    expect(decode(html)).toContain('Step 5 of 20');
    // The active line is shown once, on the pseudocode panel, not repeated here.
    expect(decode(html)).not.toMatch(/Pseudocode lines?/);
    expect(html).toContain('aria-live="polite"');
  });
});

describe('Final answer card', () => {
  const ks = getAlgorithmById('fractional-knapsack')!;
  const final = [...ks.stepGenerator(getDefaultInputs(ks))].pop()!;

  it('shows only a placeholder before the final step, even if a result exists', () => {
    const html = renderToStaticMarkup(<FinalAnswerCard isFinal={false} result={final.result} summarizer={ks.summarizeResult} stepNumber={3} totalSteps={9} />);
    expect(decode(html)).toContain('The answer appears here when the algorithm finishes. You are on step 3 of 9.');
    expect(html).not.toContain('Maximum value');
  });

  it('shows the readable summary on completion, with raw data collapsed', () => {
    const html = renderToStaticMarkup(<FinalAnswerCard isFinal result={final.result} summarizer={ks.summarizeResult} stepNumber={9} totalSteps={9} />);
    expect(decode(html)).toContain('Final answer');
    expect(decode(html)).toContain('Maximum value: 240');
    expect(html).toMatch(/<details(?![^>]*\bopen\b)[^>]*>/);
    expect(html).toContain('View technical result');
  });
});

describe('Plain-language labels', () => {
  it('counters are called "Operation counts", not values', () => {
    const html = renderToStaticMarkup(<MetricsPanel metrics={{ comparisons: 3, recursiveCalls: 2 }} />);
    expect(html).toContain('Operation counts');
    expect(html).not.toContain('Current values');
    expect(decode(html)).toContain('Comparisons3');
    expect(decode(html)).toContain('Recursive calls2');
    expect(renderToStaticMarkup(<MetricsPanel metrics={{}} />)).toContain('Operation counts');
  });
});
