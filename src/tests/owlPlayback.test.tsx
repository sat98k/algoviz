// @vitest-environment happy-dom
import React, { act, useEffect, useLayoutEffect, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoryStage, StorySceneProps } from '../components/story/StoryStage';
import { ANIM_TAIL_MS, NarrationGateProvider, SETTLE_PAUSE_MS, useAnimatingReport, useNarrationHold } from '../components/story/narrationGate';
import { useAnimPhases, useProgress } from '../components/story/useAnimPhases';
import { MAX_TICK_MS, READING, setOwlSpeed, tickMs } from '../components/common/owlVoice';
import { STORY_SCENES } from '../components/story/storyRegistry';
import { VisualizerStage } from '../components/visualizers/VisualizerStage';

/**
 * The player's owl, driven frame by frame: the owl reads each sentence in full, a new sentence
 * starts hidden, a stalled page does not dump words, and playback neither cuts the animation
 * short nor sits idle after it.
 */
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let clock = 0;
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  clock = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  setOwlSpeed(1);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const render = (ui: React.ReactElement) => act(() => root.render(ui));

/** The owl's sentence on screen: its text and how many of its words are shown. */
const owl = () => {
  const words = [...container.querySelectorAll('[data-story-narration] .owl-reveal-word')];
  return {
    text: words.map((w) => w.textContent).join(''),
    on: words.filter((w) => w.getAttribute('data-on') === 'true').length,
    total: words.length,
  };
};
const phase = () => container.querySelector('[data-phase]')?.getAttribute('data-phase');

/** Moves time on in small frames, calling `each` after every frame. */
const play = (ms: number, each?: () => void) => {
  for (let t = 0; t < ms; t += 20) {
    act(() => {
      clock += 20;
      vi.advanceTimersByTime(20);
    });
    each?.();
  }
};
const playUntil = (done: () => boolean, maxMs = 60000) => {
  for (let t = 0; t < maxMs && !done(); t += 20) play(20);
  expect(done()).toBe(true);
};

const SENTENCES = {
  ask: 'What if this coin goes on the pan?',
  answer: 'Put both choices on the scale: skipping gives twelve coins, taking gives fifteen coins, so we compare them now.',
  done: 'Taking it wins, so its coins go into the new cubby.',
} as const;
const PHASES = [
  ['ask', 0],
  ['answer', 0.3],
  ['done', 0.62],
] as const;

/** Records the owl's sentence on every render of the scene, before the browser paints it. */
const frames: { text: string; on: number }[] = [];
const FrameLog: React.FC = () => {
  useLayoutEffect(() => {
    frames.push(owl());
  });
  return null;
};

/** A scene whose owl sentence changes with its phase, like the Cubby Wall's "choose" step. */
const PhasedScene: React.FC<{ stepMs: number }> = ({ stepMs }) => {
  const p = useAnimPhases(0, PHASES, stepMs);
  return (
    <StoryStage emoji="🧀" title="Probe" subtitle="" narration={SENTENCES[p]}>
      <span data-phase={p} />
      <FrameLog />
    </StoryStage>
  );
};

/** A one-phase scene, with an optional animation that keeps playing for `animMs` once opened. */
const LongAnimation: React.FC<{ ms: number }> = ({ ms }) => {
  const hold = useNarrationHold();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (hold) return;
    const t = window.setTimeout(() => setDone(true), ms);
    return () => window.clearTimeout(t);
  }, [hold, ms]);
  useAnimatingReport(!hold && !done);
  return null;
};
const PlainScene: React.FC<{ narration: string; animMs?: number }> = ({ narration, animMs }) => (
  <StoryStage emoji="🪙" title="Probe" subtitle="" narration={narration}>
    {animMs ? <LongAnimation ms={animMs} /> : null}
  </StoryStage>
);

const gate = (
  children: React.ReactNode,
  { stepMs = 4000, onSettled, paused = false }: { stepMs?: number; onSettled?: (i: number) => void; paused?: boolean } = {}
) => (
  <NarrationGateProvider stepKey="probe|0|0" stepIndex={0} stepMs={stepMs} onSettled={onSettled} paused={paused}>
    {children}
  </NarrationGateProvider>
);

describe('The owl reads every sentence in full', () => {
  it('a later phase waits until the owl has finished the current sentence', () => {
    render(gate(<PhasedScene stepMs={4000} />));
    const seen: { text: string; on: number; total: number; phase: string | null | undefined }[] = [];
    play(40000, () => seen.push({ ...owl(), phase: phase() }));

    // Every phase is told, in order.
    const order = seen.map((s) => s.phase).filter((p, i, a) => p !== a[i - 1]);
    expect(order).toEqual(['ask', 'answer', 'done']);
    // Whenever the sentence changes, the one before it was fully shown.
    for (let i = 1; i < seen.length; i++) {
      if (seen[i].text !== seen[i - 1].text) expect(seen[i - 1].on, `before "${seen[i].text}"`).toBe(seen[i - 1].total);
    }
    // And the last one is read to the end.
    expect(seen[seen.length - 1].on).toBe(seen[seen.length - 1].total);
  });

  it('a new sentence starts hidden: it never shows in full and then fades out to be read again', () => {
    frames.length = 0;
    render(gate(<PhasedScene stepMs={4000} />));
    play(40000);
    const changes = frames.filter((f, i) => i > 0 && f.text !== frames[i - 1].text);
    expect(changes.length).toBe(2);
    for (const f of changes) expect(f.on, f.text).toBe(0);
  });

  it('a stalled page or a background tab does not dump a burst of words', () => {
    render(gate(<PlainScene narration={SENTENCES.answer} />));
    play(1500);
    const before = owl().on;
    expect(before).toBeGreaterThan(0);
    expect(before).toBeLessThan(owl().total);
    // Five seconds pass without a single timer tick (a heavy redraw, or a hidden tab).
    clock += 5000;
    play(40);
    expect(owl().on - before).toBeLessThanOrEqual(1);
    expect(tickMs(0, 5000)).toBe(MAX_TICK_MS);
    expect(tickMs(100, 140)).toBe(40);
  });
});

describe('Playback timing', () => {
  it('moves on soon after the owl finishes, instead of sitting idle for a whole step', () => {
    const onSettled = vi.fn();
    render(gate(<PlainScene narration="A short sentence." />, { onSettled }));
    playUntil(() => owl().on === owl().total);
    const owlDone = clock;
    playUntil(() => onSettled.mock.calls.length > 0);
    expect(clock - owlDone).toBeLessThanOrEqual(READING.wordMs + ANIM_TAIL_MS + SETTLE_PAUSE_MS + 100);
    expect(clock - owlDone).toBeLessThan(4000);
  });

  it('waits for an animation that is still playing', () => {
    const onSettled = vi.fn();
    render(gate(<PlainScene narration="A short sentence." animMs={5000} />, { onSettled }));
    playUntil(() => owl().on === owl().total);
    const owlDone = clock;
    playUntil(() => onSettled.mock.calls.length > 0);
    expect(clock - owlDone).toBeGreaterThanOrEqual(5000 + ANIM_TAIL_MS);
  });

  it('waits for every phase of a phased scene before moving on', () => {
    const onSettled = vi.fn();
    render(gate(<PhasedScene stepMs={900} />, { onSettled }));
    play(30000, () => {
      if (onSettled.mock.calls.length === 0) return;
      expect(phase()).toBe('done');
      expect(owl().on).toBe(owl().total);
    });
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('changing playback speed mid-step keeps the phase and the words already read', () => {
    render(gate(<PhasedScene stepMs={4000} />));
    playUntil(() => phase() === 'answer' && owl().on >= 3);
    const before = owl().on;
    render(gate(<PhasedScene stepMs={900} />, { stepMs: 900 }));
    expect(phase()).toBe('answer');
    expect(owl().on).toBeGreaterThanOrEqual(before);
    play(200);
    expect(phase()).toBe('answer');
    expect(owl().on).toBeGreaterThanOrEqual(before);
  });
});

describe('A new run at the same step number', () => {
  const HoldScene: React.FC<StorySceneProps> = ({ step }) => (
    <StoryStage emoji="🦉" title="Probe" subtitle="" narration={step.description}>
      <span data-hold={String(useNarrationHold())} />
    </StoryStage>
  );

  it('makes the animation wait for the owl again (new inputs, or Huffman decode)', () => {
    STORY_SCENES['owl-probe'] = { component: HoldScene, hint: 'Probe' } as any;
    const config = { id: 'owl-probe', visualizer: 'None', presets: [] } as any;
    const stepOf = (description: string) => ({ stepIndex: 0, title: 'Probe', description, state: {}, highlights: {}, metrics: {} });
    const hold = () => container.querySelector('[data-hold]')?.getAttribute('data-hold');
    try {
      render(<VisualizerStage config={config} step={stepOf('The first run starts here.')} inputs={{}} speed={0.25} narrate defaultMode="story" />);
      expect(hold()).toBe('true');
      playUntil(() => hold() === 'false');

      render(<VisualizerStage config={config} step={stepOf('A second run with new inputs starts here.')} inputs={{}} speed={0.25} narrate defaultMode="story" />);
      expect(hold()).toBe('true');
      expect(owl().on).toBe(0);
      playUntil(() => hold() === 'false');
      expect(owl().on).toBe(owl().total);
    } finally {
      delete STORY_SCENES['owl-probe'];
    }
  });
});

describe('Play / Pause is the one control for the owl and the animation', () => {
  it('before the first Play the owl waits; on Play it reads', () => {
    render(gate(<PlainScene narration={SENTENCES.answer} />, { paused: true }));
    play(3000);
    expect(owl().on).toBe(0);
    render(gate(<PlainScene narration={SENTENCES.answer} />));
    playUntil(() => owl().on === owl().total);
  });

  it('pausing mid-sentence freezes the owl and the phases; Play carries on from the same word', () => {
    const onSettled = vi.fn();
    render(gate(<PhasedScene stepMs={4000} />, { onSettled }));
    playUntil(() => phase() === 'answer' && owl().on >= 3);
    const at = owl().on;
    render(gate(<PhasedScene stepMs={4000} />, { onSettled, paused: true }));
    play(8000);
    expect(owl().on).toBe(at);
    expect(phase()).toBe('answer');
    expect(onSettled).not.toHaveBeenCalled();

    render(gate(<PhasedScene stepMs={4000} />, { onSettled }));
    play(800);
    expect(owl().on).toBeGreaterThan(at);
    playUntil(() => onSettled.mock.calls.length > 0);
    expect(phase()).toBe('done');
  });

  it('a step reached while paused (Step →, ←, Reset) shows its whole sentence and plays its animation', () => {
    const PausedScene: React.FC<StorySceneProps> = ({ step }) => (
      <StoryStage emoji="🦉" title="Probe" subtitle="" narration={step.description}>
        <span data-hold={String(useNarrationHold())} />
      </StoryStage>
    );
    STORY_SCENES['owl-paused'] = { component: PausedScene, hint: 'Probe' } as any;
    const config = { id: 'owl-paused', visualizer: 'None', presets: [] } as any;
    const stepOf = (stepIndex: number, description: string) => ({ stepIndex, title: 'Probe', description, state: {}, highlights: {}, metrics: {} });
    const hold = () => container.querySelector('[data-hold]')?.getAttribute('data-hold');
    try {
      render(<VisualizerStage config={config} step={stepOf(0, 'The first step is read slowly here.')} inputs={{}} narrate defaultMode="story" />);
      playUntil(() => owl().on === owl().total);
      render(<VisualizerStage config={config} step={stepOf(1, 'Stepped to by hand while the player is paused.')} inputs={{}} narrate paused defaultMode="story" />);
      expect(owl().on).toBe(owl().total);
      expect(hold()).toBe('false');
    } finally {
      delete STORY_SCENES['owl-paused'];
    }
  });
});

describe('Animations without animation frames', () => {
  it('a progress run still ends on time in a background tab, so playback goes on', () => {
    // A hidden tab: animation frames never fire.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const Travel: React.FC = () => {
      const p = useProgress(true, 3000, 'travel');
      return <span data-progress={p} />;
    };
    const onSettled = vi.fn();
    render(
      gate(
        <StoryStage emoji="🚚" title="Probe" subtitle="" narration="Off we go.">
          <Travel />
        </StoryStage>,
        { onSettled }
      )
    );
    playUntil(() => onSettled.mock.calls.length > 0, 20000);
    expect(container.querySelector('[data-progress]')?.getAttribute('data-progress')).toBe('1');
  });
});
