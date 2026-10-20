import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, FastForward, Lightbulb, RotateCcw } from 'lucide-react';
import { cardDuration, endsSentence, fadeFor, playChirp, prefersReducedMotion, useOwlPrefs, wordDuration } from './owlVoice';
import { OwlSoundToggle, OwlSpeedControl } from './OwlControls';

// The shared voice settings, re-exported for existing callers.
export { READING, cardDuration, wordDuration, nextSpeed, OWL_SPEED } from './owlVoice';
import { DpBrief } from '../../types/algorithm';
import { RichToken, RichTokens } from './RichText';
import { DpCases } from './DpBriefPanel';

/** The owl's briefing, already split into rich tokens (glossary links resolved). */
export interface OwlTokens {
  story: RichToken[];
  goal: RichToken[];
  example: RichToken[] | null;
  overview: { title: string; text: RichToken[] }[];
  insight: RichToken[];
  watch: RichToken[][];
}

interface OwlBriefingRevealProps {
  owl: OwlTokens;
  /** The formal problem statement ("In textbook words"). */
  problem: RichToken[];
  dpBrief?: DpBrief;
}

/** One reveal unit: a word with its trailing space, or one inline token (chip, bold, term). */
type Unit = RichToken[];

/** Splits tokens into word-sized units. Code chips, bold text, ✓/✗ and glossary terms stay whole. */
export const wordUnits = (tokens: RichToken[]): Unit[] => {
  const units: Unit[] = [];
  for (const t of tokens) {
    if (t.kind === 'text' && !t.termKey) {
      for (const part of t.text.match(/\S+\s*|\s+/g) ?? []) {
        if (/^\s+$/.test(part) && units.length) units[units.length - 1] = [...units[units.length - 1], { kind: 'text', text: part }];
        else units.push([{ kind: 'text', text: part }]);
      }
    } else units.push([t]);
  }
  return units;
};

const unitText = (u: Unit) => u.map((t) => t.text).join('');

type SegKey = 'story' | 'goal' | 'example' | 'problem' | 'stages' | 'insight' | 'watch';

/** Words in some rich tokens, for timing whole cards. */
const wordCount = (tokens: RichToken[]) => tokens.map((t) => t.text).join(' ').split(/\s+/).filter(Boolean).length;

const START_MS = 700;
const SEGMENT_PAUSE_MS = 800;

export interface RevealSegment {
  key: SegKey;
  /** For each unit: how long until the next unit appears. */
  durations: number[];
  /** For each unit: whether the owl chirps as it appears. */
  chirps: boolean[];
}

/** The owl's reveal schedule: the time each unit appears, and when the owl chirps. */
export const revealSchedule = (segments: RevealSegment[]) => {
  const offsets = {} as Record<SegKey, number>;
  const times: number[] = [];
  const chirps: number[] = [];
  let t = START_MS;
  for (const seg of segments) {
    offsets[seg.key] = times.length;
    seg.durations.forEach((d, i) => {
      times.push(t);
      if (seg.chirps[i]) chirps.push(t);
      t += d;
    });
    if (seg.durations.length) t += SEGMENT_PAUSE_MS;
  }
  return { offsets, times, chirps, total: times.length, end: t };
};

const NOTES = ['♪', '♫', 'hoo!', '♪', 'hoo', '♬'];
const QUIPS = [
  'Hoo! Take your time, or press ⏩ to see it all at once.',
  'Hoo hoo! Read the big picture first, then press Start.',
  'Psst: the animation follows exactly these stages.',
  'Hoo! Click the glossary words to see what they mean.',
];
/**
 * The learn view's owl: it tells the problem while the words flow in (fading out of a blur),
 * bobbing and chirping as it talks, then the big-picture stages pop in one by one. "Show
 * everything" reveals it all at once; "Replay" tells it again; click the owl for a hoot.
 */
export const OwlBriefingReveal: React.FC<OwlBriefingRevealProps> = ({ owl, problem, dpBrief }) => {
  const units = useMemo(
    () => ({ story: wordUnits(owl.story), goal: wordUnits(owl.goal), example: owl.example ? wordUnits(owl.example) : [] }),
    [owl]
  );

  const { offsets, times, chirps, total, end } = useMemo(() => {
    // Words at reading speed; the owl chirps at the start of every sentence.
    const wordSegment = (key: SegKey, list: Unit[]): RevealSegment => ({
      key,
      durations: list.map((u) => wordDuration(unitText(u))),
      chirps: list.map((_, i) => i === 0 || endsSentence(unitText(list[i - 1]))),
    });
    return revealSchedule([
      wordSegment('story', units.story),
      wordSegment('goal', units.goal),
      wordSegment('example', units.example),
      { key: 'problem', durations: [Math.max(2600, wordCount(problem) * 110)], chirps: [false] },
      {
        key: 'stages',
        durations: owl.overview.map((s) => cardDuration(wordCount(s.text) + s.title.split(/\s+/).length)),
        chirps: owl.overview.map(() => true),
      },
      { key: 'insight', durations: [cardDuration(wordCount(owl.insight))], chirps: [true] },
      { key: 'watch', durations: [0], chirps: [false] },
    ]);
  }, [units, owl, problem]);

  const [shown, setShown] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [runId, setRunId] = useState(0);
  const [notes, setNotes] = useState<{ id: number; dx: number; ch: string }[]>([]);
  const [hopping, setHopping] = useState(false);
  const [quip, setQuip] = useState<string | null>(null);
  const { speed } = useOwlPrefs();
  const noteId = useRef(0);
  // Read every frame by the reveal clock, so changing speed never restarts or jumps.
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const emitNote = useCallback(() => {
    const id = ++noteId.current;
    setNotes((ns) => [...ns.slice(-5), { id, dx: Math.round(Math.random() * 50 - 15), ch: NOTES[id % NOTES.length] }]);
    window.setTimeout(() => setNotes((ns) => ns.filter((n) => n.id !== id)), 1400);
    playChirp();
  }, []);

  // The reveal itself: one animation frame loop, updating only when a new unit appears.
  useEffect(() => {
    if (skipped || prefersReducedMotion()) {
      setShown(total);
      return;
    }
    setShown(0);
    // The reveal's own clock: real time multiplied by the current speed.
    let previous = performance.now();
    let elapsed = 0;
    let raf = 0;
    let last = 0;
    let chirpIndex = 0;
    const tick = (now: number) => {
      elapsed += (now - previous) * speedRef.current;
      previous = now;
      let n = last;
      while (n < total && times[n] <= elapsed) n++;
      if (n !== last) {
        last = n;
        setShown(n);
      }
      while (chirpIndex < chirps.length && chirps[chirpIndex] <= elapsed) {
        emitNote();
        chirpIndex++;
      }
      if (n < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [runId, skipped, total, times, chirps, emitNote]);

  const done = shown >= total;
  const talking = !done;
  const on = (index: number) => shown > index;

  const hoot = () => {
    setHopping(true);
    window.setTimeout(() => setHopping(false), 700);
    emitNote();
    setQuip(QUIPS[noteId.current % QUIPS.length]);
    window.setTimeout(() => setQuip(null), 2600);
  };

  const words = (seg: 'story' | 'goal' | 'example') =>
    units[seg].map((u, i) => (
      <span key={i} className="owl-reveal owl-reveal-word" data-on={on(offsets[seg] + i)}>
        <RichTokens tokens={u} />
      </span>
    ));

  const pillButton =
    'flex items-center gap-1.5 px-2.5 py-1 font-sans text-xs font-semibold border transition-colors';

  return (
    <div
      data-owl-briefing
      className="flex flex-col gap-4 px-3 py-4 sm:px-4 border-t border-hairline"
      // Fades follow the speed too (between 0.4s and 2.2s).
      style={{ '--owl-fade': fadeFor(speed) } as React.CSSProperties}
    >
      {/* The owl tells the problem */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0 w-14 flex flex-col items-center pt-1">
          <button
            type="button"
            onClick={hoot}
            data-owl-button
            title="Click the owl!"
            aria-label="Hoot! Click the owl"
            className="relative text-5xl leading-none select-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber"
          >
            <span aria-hidden className={`inline-block ${hopping ? 'owl-hop' : talking ? 'owl-talking' : 'owl-idle'}`} data-owl-state={hopping ? 'hop' : talking ? 'talking' : 'idle'}>
              🦉
            </span>
          </button>
          {notes.map((n) => (
            <span key={n.id} aria-hidden className="owl-note font-sans text-sm font-bold text-amber" style={{ '--note-dx': `${n.dx}px` } as React.CSSProperties}>
              {n.ch}
            </span>
          ))}
          {quip && (
            <span role="status" className="absolute top-full mt-2 left-0 z-20 w-44 px-2.5 py-1.5 font-sans text-xs leading-snug bg-amber text-obsidian-950 rounded-xl rounded-tl-sm shadow-lg animate-story-pop">
              {quip}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2 px-4 py-3 bg-obsidian-900 border border-amber/40 rounded-2xl rounded-tl-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-sans text-sm font-semibold text-amber">The problem</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <OwlSpeedControl />
              <OwlSoundToggle />
              {done ? (
                <button
                  type="button"
                  data-owl-replay
                  onClick={() => {
                    setSkipped(false);
                    setRunId((r) => r + 1);
                  }}
                  className={`${pillButton} border-hairline text-chalk-300 hover:text-chalk-100 hover:bg-obsidian-850`}
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                  Replay
                </button>
              ) : (
                <button
                  type="button"
                  data-owl-skip
                  onClick={() => setSkipped(true)}
                  className={`${pillButton} border-amber bg-amber text-obsidian-950 hover:bg-amber-glow`}
                >
                  <FastForward className="w-3.5 h-3.5" aria-hidden />
                  Show everything
                </button>
              )}
            </div>
          </div>

          <p className="font-sans text-[15px] sm:text-base leading-relaxed text-chalk-100">{words('story')}</p>
          <p className="font-sans text-[15px] leading-relaxed text-chalk-100">
            <strong className="owl-reveal font-semibold text-amber" data-on={on(offsets.goal)}>
              Our goal:{' '}
            </strong>
            {words('goal')}
          </p>
          {units.example.length > 0 && (
            <p className="font-sans text-sm leading-relaxed text-chalk-300">
              <span className="owl-reveal font-semibold text-chalk-200" data-on={on(offsets.example)}>
                A tiny example:{' '}
              </span>
              {words('example')}
            </p>
          )}
          <p className="owl-reveal font-sans text-xs leading-relaxed text-chalk-400" data-on={on(offsets.problem)} data-owl-textbook>
            <span className="font-semibold">In textbook words: </span>
            <RichTokens tokens={problem} />
          </p>
          {!done && (
            <div className="h-1 w-full bg-obsidian-800 rounded-full overflow-hidden" aria-hidden>
              <div className="h-full bg-amber transition-[width] duration-700 ease-out" style={{ width: `${Math.round(((shown > 0 ? times[shown - 1] : 0) / end) * 100)}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* The whole procedure, start to finish */}
      <div className="flex flex-col gap-2" aria-label="How it works, the big picture">
        <h2 className="owl-reveal font-sans text-sm font-semibold text-chalk-200" data-on={on(offsets.stages)}>
          How it works: the big picture
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {owl.overview.map((stage, i) => (
            <li
              key={i}
              data-owl-stage
              data-on={on(offsets.stages + i)}
              className="owl-reveal-card flex gap-2.5 px-3 py-2.5 bg-obsidian-900 border border-hairline"
            >
              <span aria-hidden className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-amber text-obsidian-950 text-xs font-bold tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex flex-col gap-0.5">
                <h3 className="font-sans text-sm font-semibold text-chalk-100">{stage.title}</h3>
                <p className="font-sans text-sm leading-relaxed text-chalk-300">
                  <RichTokens tokens={stage.text} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p
        data-on={on(offsets.insight)}
        className="owl-reveal-card flex items-start gap-2 px-3 py-2.5 bg-amber/10 border border-amber/30 font-sans text-sm leading-relaxed text-chalk-200"
      >
        <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-amber" aria-hidden />
        <span>
          <strong className="font-semibold text-chalk-100">Why it works: </strong>
          <RichTokens tokens={owl.insight} />
        </span>
      </p>

      <div data-on={on(offsets.watch)} className={`owl-reveal-card grid grid-cols-1 gap-3 ${dpBrief ? 'md:grid-cols-2' : ''}`}>
        <div className="flex flex-col gap-2 px-3 py-3 border border-hairline">
          <h2 className="flex items-center gap-1.5 font-sans text-sm font-semibold text-chalk-200">
            <Eye className="w-3.5 h-3.5 text-amber" aria-hidden />
            While you watch
          </h2>
          <ul className="flex flex-col gap-1.5 list-disc pl-5 marker:text-amber font-sans text-sm leading-relaxed text-chalk-300">
            {owl.watch.map((w, i) => (
              <li key={i}>
                <RichTokens tokens={w} />
              </li>
            ))}
          </ul>
          <p className="font-sans text-xs text-chalk-400">Tip: switch on 🎬 Animation Mode to see the owl's story, then press Step (→) at your own pace.</p>
        </div>
        {dpBrief && (
          <div className="px-3 py-3 border border-hairline">
            <DpCases brief={dpBrief} />
          </div>
        )}
      </div>
    </div>
  );
};
