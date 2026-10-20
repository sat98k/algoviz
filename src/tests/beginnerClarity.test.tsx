import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import { getDefaultInputs } from '../utils/comparison';
import { ROADMAPS, roadmapPhases } from '../config/roadmaps';
import { OWL_BRIEFINGS, OwlBriefing } from '../config/owlBriefings';
import { AlgorithmPage } from '../pages/AlgorithmPage';
import { RoadmapStrip } from '../components/common/RoadmapStrip';
import { STORY_SCENES } from '../components/story/storyRegistry';
import { stepDurationMs } from '../components/story/useAnimPhases';
import { FractionalKnapsackAnimatedView, cheeseNarration } from '../components/visualizers/FractionalKnapsackAnimatedView';

/** Every preset (plus the defaults), and the find-all modes, so every kind of step appears. */
const allRuns = (id: string) => {
  const a = getAlgorithmById(id)!;
  const base = getDefaultInputs(a);
  const inputs: Record<string, any>[] = [base, ...a.presets.map((p) => ({ ...base, ...p.data }))];
  if (id === 'n-queens') inputs.push({ ...base, findAll: true });
  if (id === 'subset-sum' || id === 'graph-coloring') inputs.push(...a.presets.map((p) => ({ ...base, ...p.data, findMode: 'all' })));
  return inputs.map((inp) => [...a.stepGenerator(inp)] as any[]);
};

const stepsOf = (id: string) => {
  const a = getAlgorithmById(id)!;
  return [...a.stepGenerator(getDefaultInputs(a))] as any[];
};

const textOf = (steps: any[]) => steps.map((s) => `${s.title} :: ${s.description}`).join('\n');

describe('Roadmap strip ("How it works" — you are here)', () => {
  // Line Segment Intersection (sweep line) is deliberately left out for now.
  const inScope = algorithmRegistry.filter((a) => a.id !== 'line-segment-intersection').map((a) => a.id);

  it('covers every in-scope algorithm, with one chip per "How it works" step', () => {
    for (const id of inScope) {
      const map = ROADMAPS[id];
      expect(map, id).toBeDefined();
      expect(map.labels.length, id).toBe(getAlgorithmById(id)!.coreSteps!.length);
      for (const [, chip] of map.rules) {
        const [lo, hi] = typeof chip === 'number' ? [chip, chip] : chip;
        expect(lo, id).toBeLessThanOrEqual(hi);
        expect(hi, id).toBeLessThan(map.labels.length);
      }
    }
  });

  it('lights both chips when one step does two "How it works" steps (table + zero row)', () => {
    expect(roadmapPhases('knapsack-dp', stepsOf('knapsack-dp'))[0]).toEqual([0, 1]);
  });

  it.each(inScope)('%s: every step of every preset lands on a chip', (id) => {
    for (const steps of allRuns(id)) {
      const phases = roadmapPhases(id, steps);
      phases.forEach((p, i) => expect(p, `${id} step ${i}: ${steps[i].title}`).not.toBeNull());
    }
  });

  it('lights the current chip and only lets reached chips be clicked', () => {
    const html = renderToStaticMarkup(<RoadmapStrip labels={['A', 'B', 'C']} active={[1, 1]} reached={new Set([0, 1])} onJump={() => {}} />);
    expect(html).toMatch(/aria-current="step"[^>]*data-roadmap-chip="1"/);
    expect(html).not.toMatch(/aria-current="step"[^>]*data-roadmap-chip="0"/);
    expect(html).toMatch(/disabled=""[^>]*data-roadmap-chip="2"/);
  });

  it('sits inside the playback dock on the algorithm page', () => {
    const html = renderToStaticMarkup(<AlgorithmPage algorithmId="knapsack-dp" onBack={() => {}} initialView="play" />);
    const dock = html.indexOf('data-playback-dock');
    expect(dock).toBeGreaterThan(-1);
    expect(html.indexOf('role="toolbar"')).toBeGreaterThan(dock);
    expect(html.indexOf('data-roadmap')).toBeGreaterThan(html.indexOf('role="toolbar"'));
    expect(html).toContain('Fill every cell');
  });

  it('is not shown for the sweep line page', () => {
    const html = renderToStaticMarkup(<AlgorithmPage algorithmId="line-segment-intersection" onBack={() => {}} initialView="play" />);
    expect(html).not.toContain('data-roadmap');
  });
});

describe('Owl narrator', () => {
  it('Fractional Knapsack has an owl, with a plain sentence for every step', () => {
    for (const steps of allRuns('fractional-knapsack')) {
      for (const step of steps) {
        const text = cheeseNarration(step);
        expect(text.length, step.title).toBeGreaterThan(15);
        expect(text, step.title).not.toMatch(/undefined|NaN|null/);
      }
    }
    const steps = stepsOf('fractional-knapsack');
    expect(renderToStaticMarkup(<FractionalKnapsackAnimatedView step={steps[3]} />)).toContain('data-story-narration');
  });

  it('the cut cheese is described as a slice, with the rest left on the board', () => {
    const cut = stepsOf('fractional-knapsack').find((s) => /Fraction of Item/.test(s.title))!;
    expect(cheeseNarration(cut)).toMatch(/only the slice goes in: \+\$80\. The rest stays on the board/);
    const whole = stepsOf('fractional-knapsack').find((s) => /^Take 100% of Item 1/.test(s.title))!;
    expect(cheeseNarration(whole)).toContain('goes into the backpack: +$60. Room left: 40 kg.');
  });

  it('every story owl can stick below the playback dock', () => {
    const steps = stepsOf('knapsack-dp');
    const Scene = STORY_SCENES['knapsack-dp'].component;
    const html = renderToStaticMarkup(<Scene step={steps[2]} algorithmId="knapsack-dp" stepMs={stepDurationMs(0.25)} />);
    expect(html).toMatch(/data-story-owl[^>]*sm:sticky/);
    expect(html).toContain('--dock-h');
  });

  it("Jarvis' March owl starts at the lowest peg, like the algorithm", () => {
    const steps = stepsOf('jarvis-march');
    const pivot = steps.find((s) => /^Anchor Pivot Found/.test(s.title))!;
    const Scene = STORY_SCENES['jarvis-march'].component;
    const html = renderToStaticMarkup(<Scene step={pivot} algorithmId="jarvis-march" stepMs={stepDurationMs(0.25)} />);
    expect(html).toContain('Start at the lowest peg');
    expect(html).not.toContain('leftmost');
  });
});

describe('Wording fixes', () => {
  it("Graham's Scan does not call the anchor P0 (points are already labelled P0, P1, …)", () => {
    const a = getAlgorithmById('graham-scan')!;
    expect(a.coreSteps!.join(' ')).not.toMatch(/\bP0\b/);
    expect(a.pseudocode.join(' ')).not.toMatch(/\bP0\b/);
  });

  it('N-Queens never sends the queen to a row past the board', () => {
    for (const steps of allRuns('n-queens')) {
      const n = steps[0].state.n;
      expect(textOf(steps)).not.toContain(`row ${n + 1}`);
    }
  });

  it('the Hiring Problem counts candidates from 1, like the owl', () => {
    const steps = stepsOf('hiring-problem');
    expect(textOf(steps)).not.toMatch(/Candidate 0\b/i);
    expect(steps[1].title).toMatch(/Interview Candidate 1 /);
    const summary = getAlgorithmById('hiring-problem')!.summarizeResult!(steps[steps.length - 1].result, {});
    expect(summary!.table!.rows[0][0]).toBe(1);
  });

  it('Floyd-Warshall numbers its rounds like its vertices', () => {
    const text = textOf(stepsOf('floyd-warshall'));
    expect(text).not.toMatch(/k = 0/);
    expect(text).toContain('Starting Round 1 of 4: V1 as Intermediate Stop');
  });

  it('Bellman-Ford writes negative weights in brackets', () => {
    const text = textOf(stepsOf('bellman-ford'));
    expect(text).not.toMatch(/\+ -\d/);
    expect(text).toContain('6 + (−4) = 2');
  });

  it('Assembly Line says which time is staying and which is switching', () => {
    expect(textOf(stepsOf('assembly-line-scheduling'))).toMatch(/is faster \(stay \d+ vs switch \d+\)/);
  });

  it('Karatsuba does not call a two-digit number single-digit', () => {
    expect(textOf(stepsOf('karatsuba'))).not.toMatch(/A single-digit number/);
  });

  it('Ford-Fulkerson is not named after Edmonds-Karp, and says how the two pages differ', () => {
    const a = getAlgorithmById('ford-fulkerson')!;
    expect(a.name).not.toMatch(/Edmonds/);
    expect(a.coreSteps!.join(' ')).toMatch(/Edmonds-Karp page/);
    expect(a.pseudocode[0]).toMatch(/FordFulkerson/);
  });

  it('Module 4 uses one name per topic', () => {
    const names = new Set(algorithmRegistry.filter((a) => a.module === 4).map((a) => a.moduleName));
    expect([...names].sort()).toEqual(['Module 4: Network Flow', 'Module 4: Shortest Paths']);
  });

  it('step text uses meaning, not code-speak', () => {
    for (const id of ['naive-string-match', 'max-subarray']) {
      expect(textOf(stepsOf(id)), id).not.toMatch(/matchFound|break out of loop|physical gap|Spawning/);
    }
  });
});

describe('DP steps show their arithmetic', () => {
  it('0-1 Knapsack: both choices with their values', () => {
    const fit = stepsOf('knapsack-dp').find((s) => /^Evaluate Item 1 at Weight 2/.test(s.title))!;
    expect(fit.description).toContain('Leave it out: dp[0][2] = 0. Take it: its value 3 + dp[0][0] = 3 + 0 = 3.');
  });

  it('LCS: the diagonal + 1, or the max of above and left', () => {
    const text = textOf(stepsOf('lcs'));
    expect(text).toMatch(/dp\[\d+\]\[\d+\] = dp\[\d+\]\[\d+\] \+ 1 = \d+ \+ 1 = \d+/);
    expect(text).toMatch(/max\(above \d+, left \d+\) = \d+/);
  });

  it('TSP: every way in, with its cost', () => {
    const text = textOf(stepsOf('tsp'));
    expect(text).toContain('can only reach B from C: 15 + 35 = 50.');
    expect(text).toContain('Options: from C, 50 + 35 = 85; from D, 45 + 25 = 70. The cheapest way in is from D (70).');
  });
});

describe('Owl briefing ("The owl explains: Problem & how it works")', () => {
  const inScope = algorithmRegistry.filter((a) => a.id !== 'line-segment-intersection').map((a) => a.id);
  const textOfBriefing = (b: OwlBriefing) =>
    [b.story, b.goal, b.example ?? '', ...b.overview.flatMap((s) => [s.title, s.text]), b.insight, ...b.watch].join(' ');

  it('every in-scope algorithm has a complete briefing; the sweep line keeps the classic pane', () => {
    for (const id of inScope) {
      const b = OWL_BRIEFINGS[id];
      expect(b, id).toBeDefined();
      expect(b.story.length, id).toBeGreaterThan(60);
      expect(b.goal.length, id).toBeGreaterThan(20);
      expect(b.insight.length, id).toBeGreaterThan(40);
      expect(b.overview.length, id).toBeGreaterThanOrEqual(3);
      expect(b.overview.length, id).toBeLessThanOrEqual(6);
      for (const s of b.overview) {
        expect(s.title.length, id).toBeGreaterThan(2);
        expect(s.text.length, `${id}: ${s.title}`).toBeGreaterThan(20);
      }
      expect(b.watch.length, id).toBeGreaterThanOrEqual(2);
      expect(b.watch.length, id).toBeLessThanOrEqual(4);
      const text = textOfBriefing(b);
      expect((text.match(/`/g) ?? []).length % 2, id).toBe(0);
      expect((text.match(/\*\*/g) ?? []).length % 2, id).toBe(0);
      expect(text, id).not.toMatch(/undefined|NaN/);
    }
    expect(Object.keys(OWL_BRIEFINGS).sort()).toEqual([...inScope].sort());
  });

  it('never states the default answer before playback', () => {
    const answers: [string, (r: any) => string][] = [
      ['fractional-knapsack', (r) => String(r.maxValue)],
      ['lcs', (r) => String(r.lcsString ?? r.lcs ?? '')],
      ['karatsuba', (r) => String(r.product)],
    ];
    for (const [id, pick] of answers) {
      const a = getAlgorithmById(id)!;
      const answer = pick([...a.stepGenerator(getDefaultInputs(a))].pop()!.result);
      expect(answer.length, id).toBeGreaterThan(1);
      expect(textOfBriefing(OWL_BRIEFINGS[id]), id).not.toContain(answer);
    }
  });

  it('the owl explains the problem and the whole procedure first, then the short steps', () => {
    const html = renderToStaticMarkup(<AlgorithmPage algorithmId="knapsack-dp" onBack={() => {}} />);
    const b = OWL_BRIEFINGS['knapsack-dp'];
    const pane = html.indexOf('aria-label="Problem and how it works"');
    expect(pane).toBeGreaterThan(-1);
    expect(html).toContain('data-owl-briefing');
    expect(html).toContain('The owl explains: Problem &amp; how it works');
    const bigPicture = html.indexOf('How it works: the big picture');
    const shortSteps = html.indexOf('The steps in short');
    expect(bigPicture).toBeGreaterThan(pane);
    expect(shortSteps).toBeGreaterThan(bigPicture);
    expect(html.split('data-owl-stage').length - 1).toBe(b.overview.length);
    for (const s of b.overview) expect(html).toContain(s.title);
    expect(html).toContain('While you watch');
    expect(html).toContain('Why it works');
    expect(html.indexOf('aria-label="Recurrence cases"')).toBeGreaterThan(shortSteps);
  });

  it('the sweep line page keeps the classic pane', () => {
    const html = renderToStaticMarkup(<AlgorithmPage algorithmId="line-segment-intersection" onBack={() => {}} />);
    expect(html).toContain('aria-label="Problem and how it works"');
    expect(html).not.toContain('data-owl-briefing');
  });
});
