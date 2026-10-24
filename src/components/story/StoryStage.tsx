import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FastForward } from 'lucide-react';
import { FitToBox, FitToScreenContext } from '../common/FitToBox';
import { OwlSoundToggle, OwlSpeedControl } from '../common/OwlControls';
import { READING, endsSentence, fadeFor, playChirp, plainWords, prefersReducedMotion, tickMs, useOwlPrefs, wordDuration } from '../common/owlVoice';
import { useOwlFlying } from '../common/owlFlight';
import { NarrationGate, NarrationGateContext } from './narrationGate';

interface StoryStageProps {
  emoji: string;
  title: string;
  subtitle: string;
  /** One plain-English sentence describing what is happening right now. */
  narration: string;
  /** Short status shown on the right of the header (e.g. "Flow reached • 23 L/s"). */
  status?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Warm daylight frame shared by every story scene: a header, a narrator speech
 * bubble and an unclipped stage. Follows docs/animation-preferences.md.
 * In the player's fit-to-screen layout the frame fills its pane at a fixed size, and only the
 * drawing inside zooms to fit (FitToBox); the header and the owl keep their normal size.
 */
export const StoryStage: React.FC<StoryStageProps> = ({ emoji, title, subtitle, narration, status, children }) => {
  const { enabled: fit } = useContext(FitToScreenContext);
  return (
  <div
    data-story-stage
    className={`flex flex-col w-full bg-[#faf7f2] border border-amber-200/90 rounded-2xl p-4 sm:p-6 select-none relative shadow-md text-stone-800 gap-4 ${fit ? 'lg:flex-1 lg:min-h-0 lg:px-4 lg:py-2.5 lg:gap-2' : ''}`}
  >
    <div className={`flex flex-wrap items-center justify-between pb-3 border-b border-amber-200/80 gap-3 ${fit ? 'lg:pb-1.5' : ''}`}>
      <div className={`flex items-center gap-3 ${fit ? 'lg:gap-2' : ''}`}>
        <span className={`text-3xl drop-shadow ${fit ? 'lg:text-xl' : ''}`} aria-hidden>
          {emoji}
        </span>
        <div className={fit ? 'lg:flex lg:items-baseline lg:gap-3 lg:flex-wrap' : undefined}>
          <h2 className={`font-display font-bold text-lg sm:text-xl text-stone-900 ${fit ? 'lg:text-base' : ''}`}>{title}</h2>
          <p className="font-sans text-xs text-stone-600">{subtitle}</p>
        </div>
      </div>
      {status && (
        <div className="font-sans text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-full px-3 py-1.5">
          {status}
        </div>
      )}
    </div>

    <OwlBubble narration={narration} steady={fit} />

    {fit ? (
      <FitToBox>
        <div className="relative w-full overflow-visible">{children}</div>
      </FitToBox>
    ) : (
      <div className="relative w-full overflow-visible">{children}</div>
    )}
  </div>
  );
};

/**
 * The owl narrator's speech bubble. On wider screens it sticks just below the playback
 * dock (AlgorithmPage sets --dock-h), so the owl stays in view while the scene scrolls.
 * `steady` keeps it at three lines' height, so the drawing below does not move between steps.
 * In the player (inside a NarrationGateProvider) the owl reads its sentence aloud: see
 * NarratedOwlBubble.
 */
export const OwlBubble: React.FC<OwlBubbleProps> = (props) => {
  const gate = useContext(NarrationGateContext);
  return gate ? <NarratedOwlBubble {...props} gate={gate} /> : <PlainOwlBubble {...props} />;
};

interface OwlBubbleProps {
  narration: string;
  className?: string;
  steady?: boolean;
}

const bubbleClass = (steady: boolean) =>
  `relative font-sans text-sm sm:text-base text-stone-800 bg-white border border-amber-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm leading-relaxed ${steady ? 'lg:flex-1 lg:min-h-[4.25rem] lg:py-2 lg:text-[15px] lg:leading-snug' : ''}`;
const wrapClass = 'flex items-start gap-3 sm:sticky z-30 -mx-2 px-2 py-1 bg-[#faf7f2]/95 rounded-xl';
const wrapTop = 'var(--owl-top, calc(2.75rem + var(--dock-h, 0px) + 0.5rem))';

const PlainOwlBubble: React.FC<OwlBubbleProps> = ({ narration, className = '', steady = false }) => (
  <div data-story-owl className={`${wrapClass} ${className}`} style={{ top: wrapTop }} aria-live="polite">
    <span className="text-2xl shrink-0" aria-hidden data-owl-avatar>
      🦉
    </span>
    <p data-story-narration className={bubbleClass(steady)}>
      {narration}
    </p>
  </div>
);

const NOTES = ['♪', '♫', 'hoo!', '♪'];

/**
 * The player's owl: its sentence fades in word by word at reading speed (shared Slower /
 * Faster setting), it bobs and chirps while it talks, and ⏩ Skip shows the rest at once.
 * When the first sentence of a step is done, the step's animation may play. It waits while
 * the owl is still flying in from the explanation page.
 */
const NarratedOwlBubble: React.FC<OwlBubbleProps & { gate: NarrationGate }> = ({ narration, className = '', steady = false, gate }) => {
  const { speed } = useOwlPrefs();
  const flying = useOwlFlying();
  const words = useMemo(() => plainWords(narration), [narration]);
  const revealKey = `${gate.stepKey}|${narration}`;
  // Words shown, for the sentence they belong to: a new sentence starts hidden on its very first
  // frame, instead of showing in full and then fading out to be read again.
  const [reveal, setReveal] = useState({ key: revealKey, n: 0 });
  const shown = reveal.key === revealKey ? reveal.n : 0;
  const [skippedKey, setSkippedKey] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ id: number; ch: string; dx: number }[]>([]);
  const noteId = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const gateRef = useRef(gate);
  gateRef.current = gate;
  // Paused: the owl stops mid-sentence and carries on from the same word on Play.
  const frozenRef = useRef(gate.frozen);
  frozenRef.current = gate.frozen;

  const { register } = gate;
  useEffect(() => register(), [register]);

  const chirp = () => {
    const id = ++noteId.current;
    setNotes((ns) => [...ns.slice(-3), { id, ch: NOTES[id % NOTES.length], dx: Math.round(Math.random() * 30 - 5) }]);
    window.setTimeout(() => setNotes((ns) => ns.filter((n) => n.id !== id)), 2300);
    playChirp();
  };

  useEffect(() => {
    const setShown = (n: number) => setReveal({ key: revealKey, n });
    const finish = () => {
      const g = gateRef.current;
      g.setBusy(false);
      if (g.openKey !== g.stepKey) g.open(g.stepKey);
    };
    if (flying) {
      setShown(0);
      return;
    }
    // Skipped, or a step reached by hand while paused: the whole sentence at once.
    if (skippedKey === revealKey || gateRef.current.instant || prefersReducedMotion() || words.length === 0) {
      setShown(words.length);
      finish();
      return;
    }
    setShown(0);
    gateRef.current.setBusy(true);
    // When each word appears (at 1×); the owl chirps at the start of every sentence.
    const times: number[] = [];
    const chirpAt: number[] = [];
    let t = 250;
    words.forEach((w, i) => {
      times.push(t);
      if (i === 0 || endsSentence(words[i - 1])) chirpAt.push(t);
      t += wordDuration(w);
    });
    // The last word stays on its own for a moment before the owl is done (and the scene moves on).
    const end = times[times.length - 1] + READING.wordMs;
    // The owl's own clock (real time × speed), so changing speed never restarts or jumps.
    let previous = performance.now();
    let elapsed = 0;
    let last = 0;
    let chirpIndex = 0;
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (!frozenRef.current) elapsed += tickMs(previous, now) * speedRef.current;
      previous = now;
      let n = last;
      while (n < words.length && times[n] <= elapsed) n++;
      if (n !== last) {
        last = n;
        setShown(n);
      }
      while (chirpIndex < chirpAt.length && chirpAt[chirpIndex] <= elapsed) {
        chirp();
        chirpIndex++;
      }
      if (n >= words.length && elapsed >= end) {
        window.clearInterval(timer);
        finish();
      }
    }, 40);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey, flying, skippedKey]);

  const reading = shown < words.length && !flying;
  const talking = reading && !gate.frozen;
  return (
    <div
      data-story-owl
      data-owl-narrated
      className={`${wrapClass} ${className}`}
      style={{ top: wrapTop, '--owl-fade': fadeFor(speed) } as React.CSSProperties}
      aria-live="polite"
    >
      <span className="relative shrink-0">
        <span
          aria-hidden
          data-owl-avatar
          data-owl-state={flying ? 'away' : talking ? 'talking' : reading ? 'paused' : 'idle'}
          className={`inline-block text-2xl ${talking ? 'owl-talking' : 'owl-idle'}`}
          style={flying ? { opacity: 0 } : undefined}
        >
          🦉
        </span>
        {notes.map((n) => (
          <span key={n.id} aria-hidden className="owl-note font-sans text-xs font-bold text-amber-600" style={{ '--note-dx': `${n.dx}px` } as React.CSSProperties}>
            {n.ch}
          </span>
        ))}
      </span>
      <p data-story-narration className={`${bubbleClass(steady)} flex-1 min-w-0`}>
        {words.map((w, i) => (
          <span key={`${revealKey}:${i}`} className="owl-reveal owl-reveal-word" data-on={i < shown}>
            {w}
          </span>
        ))}
      </p>
      <div className="shrink-0 flex flex-col items-end gap-1" data-owl-narration-controls>
        <div className="flex items-center gap-1">
          <OwlSpeedControl compact />
          <OwlSoundToggle compact />
        </div>
        <button
          type="button"
          data-owl-skip
          onClick={() => {
            setSkippedKey(revealKey);
            gate.skip();
          }}
          disabled={!reading}
          title="Show the owl's whole sentence now, play the animation and carry on"
          className="flex items-center gap-1 px-2.5 py-1 font-sans text-xs font-semibold border border-amber bg-amber text-obsidian-950 hover:bg-amber-glow disabled:opacity-40 disabled:bg-transparent disabled:text-chalk-400 disabled:border-hairline"
        >
          <FastForward className="w-3.5 h-3.5" aria-hidden />
          Skip
        </button>
      </div>
    </div>
  );
};

/** Shared props every story scene receives. */
export interface StorySceneProps {
  step: import('../../types/algorithm').AlgorithmStep;
  /** Registry id, for scenes shared by several algorithms (e.g. 'kmp'). */
  algorithmId: string;
  /** How long this step stays on screen, in ms (drives animation pacing). */
  stepMs: number;
}
