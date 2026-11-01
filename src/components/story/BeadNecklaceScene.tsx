import React, { useState } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';
import { LcsGridView } from './LcsGridView';
import { PALETTE as KIT, tint, useSvgIds } from './kit/materials';

/**
 * 📿 Longest Common Subsequence as two bead necklaces.
 *
 * Each word is a necklace of lettered beads. We look for the longest chain of beads
 * that appears in both necklaces in the same order (beads may be skipped). The table is
 * filled one question at a time: "using only the first i beads on top and the first j
 * below, how long is the best shared chain?" — beads outside that range are dimmed.
 * Matching beads click together; at the end golden threads tie the shared chain.
 *
 * An optional 🧮 answer grid view (toggle above the necklaces) shows those questions as the DP
 * table itself. The necklaces then shrink to a small strip above it, still acting out each
 * comparison, while the grid takes the focus.
 */

const VIEW_KEY = 'algoviz.lcs.storyView';
const readView = (): 'beads' | 'grid' => {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'beads';
  } catch {
    return 'beads';
  }
};

const BEAD = 46;
const GAP = 10;
const PAD = 40;
const TOP_Y = 60;
const BOT_Y = 200;
const PALETTE = ['#e8776b', '#6f9fd8', '#5dbb85', '#f0c94a', '#a785cf', '#e08fb0', '#57b8c4', '#a9c24a', '#ef9a56'];

export const BeadNecklaceScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const ids = useSvgIds();
  const [view, setView] = useState<'beads' | 'grid'>(() => (typeof window === 'undefined' ? 'beads' : readView()));
  const choose = (v: 'beads' | 'grid') => {
    setView(v);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {
      // Remembering the view is only a convenience.
    }
  };
  const grid = view === 'grid';
  const st: any = step.state || {};
  const X: string = st.str1 || '';
  const Y: string = st.str2 || '';
  const phaseName: string = st.phase || 'init';
  const i: number = st.currentRow ?? 0;
  const j: number = st.currentCol ?? 0;
  const L: number[][] = st.dpTable || [];
  const pairs: [number, number][] = st.matchedPairs || [];
  const filling = phaseName === 'fill';

  const phases: readonly (readonly [string, number])[] = filling ? [['lift', 0], ['judge', 0.4]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  const letters = [...new Set((X + Y).split(''))].sort();
  const colour = (ch: string) => PALETTE[letters.indexOf(ch) % PALETTE.length];
  const width = PAD * 2 + Math.max(X.length, Y.length) * (BEAD + GAP);
  const height = BOT_Y + BEAD + 40;
  const cx = (k: number) => PAD + k * (BEAD + GAP) + BEAD / 2;

  const isMatch = st.comparison === 'match';
  const cell = L[i]?.[j] ?? 0;
  const finalChain: string = st.lcsString || '';

  const narration = (() => {
    switch (phaseName) {
      case 'init':
        return `Two necklaces: “${X}” on top and “${Y}” below. Find the longest chain of beads found in both, in the same order (you may skip beads). We answer small questions first: what if each necklace were shorter?`;
      case 'fill':
        if (phase === 'lift') return `Using the first ${i} bead${i === 1 ? '' : 's'} on top and the first ${j} below: compare the last ones, ‘${X[i - 1]}’ and ‘${Y[j - 1]}’.`;
        return isMatch
          ? `They match! Click them together: the best chain here is the one without both beads, plus this pair = ${cell}.`
          : `No match. Drop the last bead of one necklace or the other, whichever keeps the longer chain: ${cell}.`;
      case 'table_complete':
        return `All small questions answered. With both full necklaces, the longest shared chain has ${L[X.length]?.[Y.length] ?? 0} beads. Now let’s find which beads they are.`;
      case 'traceback':
        return st.caption || 'Walk back through the answers to find which beads were tied together.';
      case 'final':
        return finalChain ? `The longest shared chain is “${finalChain}” (${finalChain.length} beads), tied with golden threads.` : 'These necklaces share no beads at all.';
      default:
        return step.title;
    }
  })();

  const lifted = (row: 'top' | 'bot', k: number) => filling && ((row === 'top' && k === i - 1) || (row === 'bot' && k === j - 1));
  const dim = (row: 'top' | 'bot', k: number) => filling && (row === 'top' ? k >= i : k >= j);

  const bead = (ch: string, k: number, row: 'top' | 'bot') => {
    const y = row === 'top' ? TOP_Y : BOT_Y;
    const up = lifted(row, k) ? (row === 'top' ? 24 : -24) : 0;
    const tied = pairs.some(([a, b]) => (row === 'top' ? a - 1 === k : b - 1 === k));
    return (
      <g key={`${row}-${k}`} style={{ transform: `translateY(${up}px)`, transition: 'transform 0.5s var(--ease-out)', opacity: dim(row, k) ? 0.25 : 1 }}>
        <ellipse cx={cx(k) + 2} cy={y + BEAD / 2 + 4} rx={BEAD * 0.36} ry="4" fill="#3a2414" opacity="0.14" />
        {(tied || lifted(row, k)) && <circle cx={cx(k)} cy={y} r={BEAD / 2 + 5} fill="none" stroke={tied ? tint(KIT.gold, -0.2) : KIT.gold} strokeWidth="4" />}
        <circle cx={cx(k)} cy={y} r={BEAD / 2} fill={`url(#${ids}-bead-${Math.max(0, PALETTE.indexOf(colour(ch)))})`} />
        <ellipse cx={cx(k) - 8} cy={y - 9} rx="7" ry="4.5" fill="#ffffff" opacity="0.6" transform={`rotate(-30 ${cx(k) - 8} ${y - 9})`} />
        <text x={cx(k)} y={y + 7} textAnchor="middle" fontSize="20" fontWeight="900" fill={KIT.ink} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
          {ch}
        </text>
      </g>
    );
  };

  return (
    <StoryStage
      title="Two Bead Necklaces"
      subtitle="Find the longest chain of beads that appears in both necklaces, in order."
      narration={narration}
      status={phaseName === 'final' ? `Shared chain • ${finalChain.length} beads` : filling ? `Best chain here • ${phase === 'judge' ? cell : '?'}` : 'Ready'}
    >
      <div className="flex justify-center mb-3">
        <div className="c-group" role="radiogroup" aria-label="Picture">
          {(
            [
              ['beads', 'Necklaces'],
              ['grid', 'Answer grid'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              data-lcs-view={v}
              onClick={() => choose(v)}
              className="c-pill"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* With the grid on, the necklaces shrink into a small side panel (above it on narrow screens) but keep acting out each comparison. */}
      <div className={grid ? 'flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4' : undefined}>
      <div className={grid ? 'w-full max-w-[240px] shrink-0 rounded-2xl bg-[#fbf9f4] p-2' : undefined} data-necklace-panel>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block mx-auto w-full h-auto overflow-visible"
        style={{ maxWidth: grid ? 224 : width * 1.25 }}
        role="img"
        aria-label="Two necklaces"
        data-necklaces-size={grid ? 'small' : 'full'}
      >
        <defs>
          {PALETTE.map((c, k) => (
            <radialGradient key={k} id={`${ids}-bead-${k}`} cx="0.36" cy="0.32" r="0.75">
              <stop offset="0" stopColor={tint(c, 0.45)} />
              <stop offset="0.55" stopColor={c} />
              <stop offset="1" stopColor={tint(c, -0.3)} />
            </radialGradient>
          ))}
        </defs>
        {/* cords */}
        {[
          [TOP_Y, X.length],
          [BOT_Y, Y.length],
        ].map(([y, len]) => (
          <g key={y}>
            <path d={`M${PAD - 18} ${y - 6} Q${PAD - 30} ${y} ${PAD - 18} ${y + 6}`} fill="none" stroke="#8a6a44" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={PAD - 16} y1={y} x2={PAD + len * (BEAD + GAP)} y2={y} stroke="#8a6a44" strokeWidth="3" strokeLinecap="round" />
            <line x1={PAD - 16} y1={y} x2={PAD + len * (BEAD + GAP)} y2={y} stroke="#c9a77a" strokeWidth="1.2" strokeDasharray="2 3" />
          </g>
        ))}

        {/* golden threads between tied beads */}
        {pairs.map(([a, b]) => (
          <line key={`t-${a}-${b}`} x1={cx(a - 1)} y1={TOP_Y + BEAD / 2} x2={cx(b - 1)} y2={BOT_Y - BEAD / 2} stroke={KIT.gold} strokeWidth="4.5" strokeLinecap="round" className="animate-story-pop" />
        ))}

        {/* the comparison: a link when they match, a cross when they don't */}
        {filling && phase === 'judge' && i > 0 && j > 0 && (
          <g>
            <line x1={cx(i - 1)} y1={TOP_Y + 24 + BEAD / 2} x2={cx(j - 1)} y2={BOT_Y - 24 - BEAD / 2} stroke={isMatch ? '#0c8030' : '#cc2e2e'} strokeWidth="4" strokeDasharray={isMatch ? undefined : '6 6'} strokeLinecap="round" />
            <g transform={`translate(${(cx(i - 1) + cx(j - 1)) / 2 + 30}, ${(TOP_Y + BOT_Y) / 2})`}>
              <g className="animate-story-pop">
                <rect x="-28" y="-13" width="56" height="26" rx="13" fill={isMatch ? '#0c8030' : '#cc2e2e'} />
                <text textAnchor="middle" y="5" fontSize="14" fontWeight="900" fill="#ffffff" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                  {isMatch ? 'click!' : 'no'}
                </text>
              </g>
            </g>
          </g>
        )}

        {X.split('').map((ch, k) => bead(ch, k, 'top'))}
        {Y.split('').map((ch, k) => bead(ch, k, 'bot'))}
      </svg>

      {/* the answer so far, shown as a little chain of beads */}
      <div className={`mt-3 flex flex-wrap items-center justify-center gap-2 font-sans text-stone-600 ${grid ? 'text-xs' : 'text-sm'}`}>
        {filling && phase === 'judge' && (
          <>
            <span className="font-semibold">Best shared chain for these beads:</span>
            {Array.from({ length: cell }, (_, k) => (
              <span key={k} className="w-4 h-4 rounded-full bg-[#e8a817] animate-story-pop" style={{ boxShadow: 'inset -2px -2px 0 rgb(0 0 0 / 0.15), inset 2px 2px 0 rgb(255 255 255 / 0.4)' }} />
            ))}
            <span className="font-black text-stone-900">{cell}</span>
          </>
        )}
        {(phaseName === 'traceback' || phaseName === 'final') && (
          <>
            <span className="font-semibold">Shared chain so far:</span>
            {(st.lcsString || '').split('').map((ch: string, k: number) => (
              <span key={k} className="w-8 h-8 flex items-center justify-center rounded-full font-black text-stone-900" style={{ background: colour(ch), boxShadow: 'inset -3px -3px 0 rgb(0 0 0 / 0.15), inset 3px 3px 0 rgb(255 255 255 / 0.35)' }}>
                {ch}
              </span>
            ))}
          </>
        )}
      </div>
      </div>

      {grid && (
        <div className="min-w-0 flex-1">
          <LcsGridView
            X={X}
            Y={Y}
            phase={phaseName}
            colour={colour}
            table={L}
            directions={st.directions || []}
            row={i}
            col={j}
            revealed={phase === 'judge'}
            isMatch={isMatch}
            sources={st.sourceCells || []}
            path={phaseName === 'traceback' || phaseName === 'final' ? st.backtrackPath || [] : []}
            pairs={pairs}
          />
        </div>
      )}
      </div>
    </StoryStage>
  );
};
