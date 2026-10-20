import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases, useHeldValue } from './useAnimPhases';

/**
 * 🔍 Stencil-on-a-sentence story shared by the string matching algorithms.
 *
 * The text is a line of wooden letter tiles; the pattern is a paper stencil that
 * glides along underneath. A magnifying glass checks one letter pair at a time.
 * - Naive: on a mismatch the stencil slides one step and the finger goes back.
 * - KMP: first the stencil studies itself and writes jump-back notes (LPS); then on a
 *   mismatch it jumps ahead using the notes, and the reading finger never goes back.
 * - Rabin-Karp: every window gets a fingerprint; only matching fingerprints call the
 *   detective to check letters (sometimes it is a false alarm).
 */

const CELL = 44;
const TILE = 38;
const PAD = 24;
const TEXT_Y = 64;
const STENCIL_Y = 128;

const INK = '#451a03';
const MATCH = '#16a34a';
const MISS = '#dc2626';
const MEMORY = '#7c3aed';
const GOLD = '#f59e0b';

const FP_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

/** A little barcode "fingerprint": the same hash always draws the same picture. */
const Fingerprint: React.FC<{ hash: number; tone?: 'neutral' | 'match' | 'miss' }> = ({ hash, tone = 'neutral' }) => {
  const bars = Array.from({ length: 6 }, (_, k) => ({
    h: 10 + ((hash * 37 + k * 53) % 5) * 5,
    c: FP_COLORS[(hash + k * 3) % FP_COLORS.length],
  }));
  const border = tone === 'match' ? MATCH : tone === 'miss' ? MISS : '#d6d3d1';
  return (
    <svg width="78" height="44" viewBox="0 0 78 44" aria-hidden>
      <rect x="1" y="1" width="76" height="42" rx="8" fill="#ffffff" stroke={border} strokeWidth="2" />
      {bars.map((b, k) => (
        <rect key={k} x={9 + k * 11} y={40 - b.h - 4} width="7" height={b.h} rx="2" fill={b.c} />
      ))}
    </svg>
  );
};

type Mark = 'none' | 'ok' | 'miss' | 'memory' | 'looking';

export const StencilScene: React.FC<StorySceneProps> = ({ step, algorithmId, stepMs }) => {
  const st: any = step.state || {};
  const text: string = st.text || '';
  const pattern: string = st.pattern || '';
  const m = pattern.length;
  const isKMP = algorithmId === 'kmp';
  const isRK = algorithmId === 'rabin-karp';
  const inLps = isKMP && st.phase === 'lps';
  const title: string = step.title || '';
  const lpsTable: number[] = st.lpsTable || [];

  // In KMP's first phase the "sentence" is the pattern itself.
  const line = inLps ? pattern : text;
  const n = line.length;

  // ── Step kind ──
  const kind = (() => {
    if (step.isFinal) return 'final';
    if (inLps) return `lps-${st.lpsAction || 'start'}`;
    if (/^Initialize|^Phase 2/.test(title)) return 'intro';
    if (/^Compute Initial/.test(title)) return 'rk-first';
    if (/Window Hash/.test(title)) return 'rk-hash';
    if (/^Roll Hash/.test(title)) return 'rk-roll';
    if (/^Spurious/.test(title)) return 'rk-spurious';
    if (/Match Confirmed/.test(title)) return 'match';
    if (/^Align/.test(title)) return 'align';
    if (/^Mismatch Detected/.test(title)) return 'naive-slide';
    if (/^Mismatch: j Falls Back/.test(title)) return 'kmp-fallback';
    if (/^Mismatch at j = 0/.test(title)) return 'kmp-advance';
    if (st.currentComparison) return 'compare';
    return 'idle';
  })();

  // ── Stencil position (in tiles) and which stencil letters are marked ──
  let shift: number = st.shift ?? 0;
  let fromShift = shift;
  let lookAt = -1; // stencil index under the magnifying glass
  let lookOk = false;
  const marks: Mark[] = Array(m).fill('none');

  if (inLps) {
    const i: number = st.patternIndex ?? 1;
    const len: number = st.lpsLen ?? 0;
    const action = st.lpsAction;
    if (action === 'compare' || action === 'start') {
      shift = i - len;
      for (let k = 0; k < len; k++) marks[k] = 'ok';
      if (action === 'compare') {
        lookAt = len;
        lookOk = pattern[i] === pattern[len];
      }
    } else if (action === 'extend') {
      shift = i - (len - 1);
      for (let k = 0; k < len; k++) marks[k] = 'ok';
    } else if (action === 'fallback') {
      shift = i - len;
      fromShift = i - (st.prevLen ?? len);
      for (let k = 0; k < len; k++) marks[k] = 'memory';
    } else if (action === 'zero') {
      shift = i;
      marks[0] = 'miss';
    }
  } else if (isKMP) {
    const j: number = st.patternIndex ?? 0;
    if (kind === 'compare') {
      for (let k = 0; k < j; k++) marks[k] = 'ok';
      lookAt = j;
      lookOk = !!st.currentComparison?.isMatch;
    } else if (kind === 'match') {
      marks.fill('ok');
    } else if (kind === 'kmp-fallback') {
      fromShift = shift - (st.shiftAmount ?? 0);
      for (let k = 0; k < j; k++) marks[k] = 'memory';
    }
  } else {
    const verified: number[] = st.verifiedIndices || [];
    verified.forEach((k) => (marks[k] = 'ok'));
    if (st.currentComparison && kind !== 'match') {
      lookAt = st.patternIndex ?? 0;
      lookOk = !!st.currentComparison.isMatch;
      if (kind === 'naive-slide' || kind === 'rk-spurious') marks[lookAt] = 'miss';
    }
  }
  if (isRK && kind === 'rk-roll') fromShift = shift - 1;

  // ── Phases: look first, then judge; slides happen after the reason is shown ──
  const phases: readonly (readonly [string, number])[] =
    kind === 'compare' || kind === 'lps-compare'
      ? [['look', 0], ['judge', 0.35]]
      : kind === 'kmp-fallback' || kind === 'lps-fallback'
      ? [['flash', 0], ['glide', 0.4]]
      : kind === 'rk-roll'
      ? [['drop', 0], ['glide', 0.45]]
      : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);
  const holding = phase === 'flash' || phase === 'drop';
  const shownShift = useHeldValue(holding ? fromShift : shift, !holding);
  if (lookAt >= 0 && phase === 'judge') marks[lookAt] = lookOk ? 'ok' : 'miss';
  if (lookAt >= 0 && phase === 'look') marks[lookAt] = 'looking';

  // ── Reading finger (shows naive re-reading vs KMP never going back) ──
  const showFinger = !inLps && !isRK && kind !== 'intro' && kind !== 'final' && st.textIndex >= 0;
  const fingerAt: number = st.textIndex ?? 0;

  const matchIndices: number[] = inLps ? [] : st.matchIndices || [];
  const textCompareIdx = lookAt >= 0 ? shownShift + lookAt : -1;

  // ── Narration ──
  const q = (c: string | undefined) => `‘${c ?? ''}’`;
  const tc = inLps ? pattern[st.patternIndex] : st.currentComparison?.textChar;
  const pc = inLps ? pattern[st.lpsLen ?? 0] : st.currentComparison?.patternChar;
  const narration = (() => {
    switch (kind) {
      case 'final':
        return matchIndices.length
          ? `Done! The word “${pattern}” appears ${matchIndices.length} time${matchIndices.length > 1 ? 's' : ''} in the sentence (highlighted in yellow).${isKMP ? ' The reading finger never had to go back.' : ''}`
          : `Done! The word “${pattern}” never appears in this sentence.`;
      case 'intro':
        return isKMP
          ? 'Notes ready! Now the stencil slides along the sentence. The reading finger only ever moves forward.'
          : isRK
          ? 'Instead of checking every letter, we give each chunk of the sentence a fingerprint. Only matching fingerprints are worth a closer look.'
          : `Our stencil spells “${pattern}”. We slide it along the sentence and check, letter by letter, whether it fits.`;
      case 'lps-start':
        return 'Before reading the sentence, the stencil studies itself: where does the start of the word repeat inside the word? It writes jump-back notes for later.';
      case 'lps-compare':
        return phase === 'look'
          ? `Does the start of the word continue here? Compare ${q(pc)} with ${q(tc)}.`
          : lookOk
          ? `Yes, ${q(pc)} matches! The repeating part grows.`
          : `No, ${q(pc)} isn't ${q(tc)}.`;
      case 'lps-extend':
        return `The first ${st.lpsLen} letter${st.lpsLen > 1 ? 's' : ''} of the word repeat${st.lpsLen > 1 ? '' : 's'} right here. Note it down: ${st.lpsLen}.`;
      case 'lps-fallback':
        return 'That repeat can’t grow. Use an earlier note to try a shorter repeat instead, so the copy slides right.';
      case 'lps-zero':
        return 'Nothing repeats here, so the note says 0: if we get stuck here later, start over from the first letter.';
      case 'lps-done':
        return 'All the jump-back notes are written. Time to read the sentence!';
      case 'align':
        return 'Place the stencil here and check its letters from left to right.';
      case 'compare':
        return phase === 'look'
          ? `Does ${q(tc)} in the sentence match ${q(pc)} on the stencil?`
          : lookOk
          ? `Yes, ${q(tc)} matches! Check the next letter.`
          : `No, ${q(tc)} isn’t ${q(pc)}.`;
      case 'naive-slide':
        return 'It doesn’t fit, so the stencil slides one step right, and the finger goes back to re-check letters from scratch.';
      case 'kmp-fallback': {
        const kept = st.patternIndex ?? 0;
        return kept > 0
          ? `Mismatch! But the notes say the last ${kept} letter${kept > 1 ? 's' : ''} we read already match the start of the word, so the stencil jumps ahead and the finger stays put. Nothing is read twice.`
          : 'Mismatch! Nothing can be reused, so the stencil jumps ahead and starts fresh at the finger. The finger stays put.';
      }
      case 'kmp-advance':
        return 'Mismatch on the very first letter: nothing to reuse, so the finger and the stencil move on by one.';
      case 'match':
        return isKMP
          ? `Found “${pattern}”! The notes say how much of it can start the next match, so we keep going without going back.`
          : `Every letter fits! We found “${pattern}” here and highlight it.`;
      case 'rk-first':
        return 'We take the fingerprint of the word and of the first window of the sentence.';
      case 'rk-hash':
        return st.hashInfo?.hashMatch
          ? 'The fingerprints match! A detective checks the letters one by one to be sure.'
          : 'The fingerprints are different, so this can’t be the word. Skip it without reading a single letter!';
      case 'rk-spurious':
        return 'False alarm! Same fingerprint but different letters. It’s rare, but this is why the detective always checks.';
      case 'rk-roll': {
        const r = st.rollingInfo;
        return r
          ? `The window slides on: ${q(r.removedChar)} falls off the left and ${q(r.addedChar)} joins on the right. The fingerprint updates without re-reading the whole window.`
          : 'The window slides on by one letter.';
      }
      default:
        return step.title;
    }
  })();

  const statusText = inLps
    ? `Notes written • ${st.lpsFilled ?? 0} of ${m}`
    : `Found • ${matchIndices.length}`;

  // Room for the stencil at its furthest position (in KMP’s first phase a copy slides past the end).
  const tiles = Math.max(n, inLps ? 2 * m - 1 : n, shift + m, 1);
  const width = PAD * 2 + tiles * CELL;
  const height = STENCIL_Y + TILE + 60;
  const tileX = (i: number) => PAD + i * CELL + (CELL - TILE) / 2;

  const markStyle = (mk: Mark) =>
    mk === 'ok'
      ? { fill: '#dcfce7', stroke: MATCH }
      : mk === 'miss'
      ? { fill: '#fee2e2', stroke: MISS }
      : mk === 'memory'
      ? { fill: '#ede9fe', stroke: MEMORY }
      : mk === 'looking'
      ? { fill: '#fffbeb', stroke: GOLD }
      : { fill: '#fffaf0', stroke: '#d6c3a5' };

  const rk = st.hashInfo;
  const rolling = st.rollingInfo;

  return (
    <StoryStage
      emoji={isRK ? '🕵️' : '🔍'}
      title={isKMP ? (inLps ? 'The Stencil Studies Itself' : 'Smart Stencil with Jump-Back Notes') : isRK ? 'Fingerprint Detective' : 'Sliding Stencil'}
      subtitle={
        isRK
          ? 'Each window of the sentence gets a fingerprint. Only lookalikes get checked.'
          : inLps
          ? 'Slide a copy of the word under itself to find where its start repeats.'
          : 'Slide the word stencil along the sentence and check letter by letter.'
      }
      narration={narration}
      status={statusText}
    >
      {isRK && rk && (
        <div className="flex flex-wrap items-center justify-center gap-4 mb-3 font-sans text-xs text-stone-600">
          <div className="flex flex-col items-center gap-1">
            <Fingerprint hash={rk.windowHash} tone={kind === 'rk-hash' ? (rk.hashMatch ? 'match' : 'miss') : 'neutral'} />
            <span className="font-semibold">Window’s fingerprint</span>
          </div>
          <span className={`text-2xl font-bold ${kind === 'rk-hash' ? (rk.hashMatch ? 'text-green-600' : 'text-red-600') : 'text-stone-400'}`}>
            {kind === 'rk-hash' ? (rk.hashMatch ? '=' : '≠') : '?'}
          </span>
          <div className="flex flex-col items-center gap-1">
            <Fingerprint hash={rk.patternHash} />
            <span className="font-semibold">Word’s fingerprint</span>
          </div>
          {(st.verifiedIndices?.length > 0 || kind === 'rk-spurious' || (kind === 'compare' && isRK)) && (
            <span className="text-3xl animate-story-pop" title="Detective checking letters">
              {kind === 'rk-spurious' ? '🤷' : '🕵️'}
            </span>
          )}
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.3 }} role="img" aria-label="Sentence and sliding stencil">
        {/* Wooden shelf the letters sit on */}
        <rect x={PAD - 10} y={TEXT_Y - 8} width={n * CELL + 20} height={TILE + 16} rx="10" fill="#efe3d3" stroke="#d5be9f" strokeWidth="2" />

        {/* Highlighter swipes over found matches */}
        {matchIndices.map((mi) => (
          <rect
            key={`hl-${mi}`}
            x={PAD + mi * CELL + 2}
            y={TEXT_Y - 4}
            width={m * CELL - 4}
            height={TILE + 8}
            rx="8"
            fill="#fde047"
            opacity="0.75"
            className="animate-story-pop"
          />
        ))}

        {/* Rabin-Karp window frame */}
        {isRK && !step.isFinal && (
          <g style={{ transform: `translateX(${shownShift * CELL}px)`, transition: 'transform 0.8s ease-in-out' }}>
            <rect
              x={PAD - 3}
              y={TEXT_Y - 12}
              width={m * CELL + 6}
              height={TILE + 24}
              rx="12"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="3"
              strokeDasharray="7 5"
            />
          </g>
        )}

        {/* Letter tiles of the sentence */}
        {Array.from(line).map((ch, i) => {
          const dropping = isRK && phase === 'drop' && rolling && i === rolling.removedIndex;
          const joining = isRK && kind === 'rk-roll' && rolling && i === rolling.addedIndex;
          const compared = i === textCompareIdx;
          return (
            <g
              key={`t-${i}`}
              style={{
                transform: dropping ? 'translateY(26px)' : 'translateY(0)',
                opacity: dropping ? 0.35 : 1,
                transition: 'transform 0.6s ease-in, opacity 0.6s ease-in',
              }}
            >
              <rect
                x={tileX(i)}
                y={TEXT_Y}
                width={TILE}
                height={TILE}
                rx="7"
                fill="#fdf6e3"
                stroke={compared ? GOLD : joining ? '#0ea5e9' : '#b08968'}
                strokeWidth={compared || joining ? 3 : 1.5}
              />
              <text x={tileX(i) + TILE / 2} y={TEXT_Y + TILE / 2 + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill={INK} fontFamily="ui-sans-serif, system-ui">
                {ch}
              </text>
            </g>
          );
        })}

        {/* Reading finger */}
        {showFinger && (
          <g style={{ transform: `translateX(${PAD + fingerAt * CELL + CELL / 2}px)`, transition: 'transform 0.6s ease-in-out' }}>
            <text x="0" y={TEXT_Y - 16} textAnchor="middle" fontSize="22">
              👇
            </text>
          </g>
        )}

        {/* The stencil: a paper strip gliding horizontally */}
        {!step.isFinal && kind !== 'lps-done' && m > 0 && (
          <g style={{ transform: `translateX(${shownShift * CELL}px)`, transition: 'transform 0.8s ease-in-out' }} data-stencil-shift={shownShift}>
            <rect x={PAD - 4} y={STENCIL_Y - 6} width={m * CELL + 8} height={TILE + 12} rx="8" fill="#fff7ed" stroke="#c2410c" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.95" />
            {Array.from(pattern).map((ch, k) => {
              const mk = marks[k];
              const sty = markStyle(mk);
              return (
                <g key={`p-${k}`} className={mk === 'miss' && phase !== 'glide' ? 'animate-story-shake' : undefined}>
                  <rect x={tileX(k)} y={STENCIL_Y} width={TILE} height={TILE} rx="7" fill={sty.fill} stroke={sty.stroke} strokeWidth={mk === 'none' ? 1.5 : 2.5} />
                  <text x={tileX(k) + TILE / 2} y={STENCIL_Y + TILE / 2 + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill="#7c2d12" fontFamily="ui-sans-serif, system-ui">
                    {ch}
                  </text>
                  {(mk === 'ok' || mk === 'miss') && (
                    <text x={tileX(k) + TILE - 2} y={STENCIL_Y + TILE + 16} textAnchor="middle" fontSize="14" fontWeight="900" fill={mk === 'ok' ? MATCH : MISS}>
                      {mk === 'ok' ? '✓' : '✗'}
                    </text>
                  )}
                  {mk === 'looking' && (
                    <text x={tileX(k) + TILE / 2} y={(TEXT_Y + TILE + STENCIL_Y) / 2 + 8} textAnchor="middle" fontSize="22" className="animate-story-bob">
                      🔍
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* KMP jump-back notebook */}
      {isKMP && (
        <div className="mt-3 flex flex-col items-center gap-1.5 font-sans">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">📒 Jump-back notes</span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {Array.from(pattern).map((ch, k) => {
              const written = k < (st.lpsFilled ?? (inLps ? 0 : m));
              const used = !inLps && st.lpsUsedIndex === k;
              const fresh = inLps && (st.lpsAction === 'extend' || st.lpsAction === 'zero') && k === st.patternIndex;
              return (
                <div
                  key={`note-${k}`}
                  className={`flex flex-col items-center w-9 rounded-md border shadow-sm ${
                    used ? 'bg-violet-100 border-violet-500 ring-2 ring-violet-300' : written ? 'bg-yellow-50 border-yellow-300' : 'bg-stone-50 border-stone-200'
                  } ${fresh ? 'animate-story-pop' : ''}`}
                >
                  <span className="text-xs font-bold text-amber-950">{ch}</span>
                  <span className={`text-sm font-black ${written ? 'text-violet-800' : 'text-stone-300'}`}>{written ? lpsTable[k] : '·'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </StoryStage>
  );
};
