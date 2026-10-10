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
  renderToStaticMarkup(<AlgorithmPage algorithmId={id} onBack={() => {}} initialLayoutMode={mode} />);

describe.each(['split', 'stacked'] as const)('AlgorithmPage layout (%s)', (mode) => {
  it.each(algorithmRegistry.map((a) => [a.id, a] as const))('%s', (id, a) => {
    const html = renderPage(id, mode);
    const text = decode(html);
    const first = [...a.stepGenerator(getDefaultInputs(a))][0];

    // One explanation panel, showing the full first-step title and description exactly once.
    expect(count(html, 'What happened and why?')).toBe(1);
    expect(count(text, first.title)).toBeGreaterThanOrEqual(1);
    expect(count(text, first.description)).toBe(1);

    // One playback group, one pseudocode panel, one values panel.
    expect(count(html, 'aria-label="Playback speed slider"')).toBe(1);
    expect(count(html, 'title="Step forward (Key: →)"')).toBe(1);
    expect(count(html, 'id="pseudocode-line-1"')).toBe(1);
    expect(count(html, 'Current values')).toBe(1);

    // Learning order: explanation → final answer → inputs → complexity.
    const explanation = html.indexOf('What happened and why?');
    const answer = html.indexOf('Final answer');
    const inputs = html.indexOf('Input &amp; presets');
    const complexity = html.indexOf('Time and space complexity');
    expect(explanation).toBeGreaterThan(-1);
    expect(answer).toBeGreaterThan(explanation);
    expect(inputs).toBeGreaterThan(answer);
    expect(complexity).toBeGreaterThan(inputs);

    // Before the run finishes, only a placeholder sits in the answer slot.
    if (!(id === 'graph-coloring' && getDefaultInputs(a).findMode === 'all')) {
      expect(html).toContain('The answer appears here when the algorithm finishes');
    }

    // Plain language only.
    expect(html).not.toMatch(/LIVE OPERATION TELEMETRY|COMPUTED SOLUTION ARTIFACT|REALTIME DISPATCH|INITIALIZE &amp; RUN SIMULATION|EXECUTION STATUS/);
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
    expect(decode(html)).toContain('Pseudocode lines 3–5');
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
  it('values panel is called "Current values"', () => {
    expect(renderToStaticMarkup(<MetricsPanel metrics={{ comparisons: 3 }} />)).toContain('Current values');
    expect(renderToStaticMarkup(<MetricsPanel metrics={{}} />)).toContain('Current values');
  });
});
