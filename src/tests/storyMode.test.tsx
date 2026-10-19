import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { VisualizerStage } from '../components/visualizers/VisualizerStage';
import { STORY_SCENES } from '../components/story/storyRegistry';
import { stepDurationMs } from '../components/story/useAnimPhases';

const stepsOf = (id: string) => {
  const a = getAlgorithmById(id)!;
  return { a, steps: [...a.stepGenerator(getDefaultInputs(a))] as any[] };
};

const renderScene = (id: string, step: any) => {
  const Scene = STORY_SCENES[id].component;
  return renderToStaticMarkup(<Scene step={step} algorithmId={id} stepMs={stepDurationMs(0.25)} />);
};

const narrationOf = (html: string) => {
  const m = html.match(/data-story-narration[^>]*>([^<]*)</);
  return m ? m[1] : '';
};

describe('Story (Animation) Mode', () => {
  const ids = Object.keys(STORY_SCENES);

  it('registers scenes only for real algorithms, leaving Fractional Knapsack’s own toggle alone', () => {
    for (const id of ids) expect(getAlgorithmById(id), id).toBeDefined();
    expect(STORY_SCENES['fractional-knapsack']).toBeUndefined();
  });

  it.each(ids)('%s opens on the existing technical view, with the toggle on top', (id) => {
    const { a, steps } = stepsOf(id);
    const html = renderToStaticMarkup(<VisualizerStage config={a} step={steps[1]} inputs={getDefaultInputs(a)} />);
    expect(html).toContain('data-story-toggle');
    expect(html).toContain('Animation Mode');
    expect(html).toMatch(/data-view-mode="technical" role="radio" aria-checked="true"/);
    expect(html).not.toContain('data-story-stage');
  });

  it('algorithms without a scene render exactly as before (no toggle)', () => {
    const { a, steps } = stepsOf('huffman');
    const html = renderToStaticMarkup(<VisualizerStage config={a} step={steps[0]} inputs={getDefaultInputs(a)} />);
    expect(html).not.toContain('data-story-toggle');
  });

  it.each(ids)('%s scene renders every step with a plain-English narration', (id) => {
    const { steps } = stepsOf(id);
    expect(steps.length).toBeGreaterThan(2);
    for (const step of steps) {
      const html = renderScene(id, step);
      expect(html, step.title).toContain('data-story-stage');
      const text = narrationOf(html);
      expect(text.length, step.title).toBeGreaterThan(15);
      expect(text, step.title).not.toMatch(/undefined|NaN/);
      expect(html, step.title).not.toMatch(/NaN/);
    }
  });

  it('KMP: on a fallback the stencil starts where it was, then glides (finger never moves back)', () => {
    const { steps } = stepsOf('kmp');
    const fallback = steps.find((s) => /^Mismatch: j Falls Back/.test(s.title));
    expect(fallback).toBeDefined();
    const html = renderScene('kmp', fallback);
    const before = fallback.state.shift - fallback.state.shiftAmount;
    expect(html).toContain(`data-stencil-shift="${before}"`);
    expect(narrationOf(html)).toMatch(/finger stays put/);
  });

  it('0-1 Knapsack DP: a new cubby stays empty until the balance scale has decided', () => {
    const { steps } = stepsOf('knapsack-dp');
    const choose = steps.find((s) => /^Evaluate/.test(s.title));
    const html = renderScene('knapsack-dp', choose);
    expect(html).toContain('Balance scale');
    expect(narrationOf(html)).toMatch(/Two choices/);
  });

  it('Push-Relabel narrates pushes downhill and jacks for relabels', () => {
    const { steps } = stepsOf('push-relabel');
    const push = steps.find((s) => s.state.phase === 'push');
    const relabel = steps.find((s) => s.state.phase === 'relabel');
    expect(narrationOf(renderScene('push-relabel', push))).toMatch(/pours down/);
    expect(narrationOf(renderScene('push-relabel', relabel))).toMatch(/jack lifts/);
  });
});
