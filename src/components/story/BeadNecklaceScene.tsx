import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';

/**
 * 📿 Longest Common Subsequence as two bead necklaces.
 *
 * Each word is a necklace of lettered beads. We look for the longest chain of beads
 * that appears in both necklaces in the same order (beads may be skipped). The table is
 * filled one question at a time: "using only the first i beads on top and the first j
 * below, how long is the best shared chain?" — beads outside that range are dimmed.
 * Matching beads click together; at the end golden threads tie the shared chain.
 */

const BEAD = 46;
const GAP = 10;
const PAD = 40;
const TOP_Y = 60;
const BOT_Y = 200;
const PALETTE = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee', '#a3e635', '#fb923c'];

export const BeadNecklaceScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
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
      <g key={`${row}-${k}`} style={{ transform: `translateY(${up}px)`, transition: 'transform 0.5s ease-out', opacity: dim(row, k) ? 0.25 : 1 }}>
        <circle cx={cx(k)} cy={y} r={BEAD / 2} fill={colour(ch)} stroke={tied ? '#b45309' : lifted(row, k) ? '#f59e0b' : '#57534e'} strokeWidth={tied || lifted(row, k) ? 4 : 1.5} />
        <circle cx={cx(k) - 7} cy={y - 8} r="5" fill="#ffffff" opacity="0.6" />
        <text x={cx(k)} y={y + 7} textAnchor="middle" fontSize="20" fontWeight="900" fill="#1c1917">
          {ch}
        </text>
      </g>
    );
  };

  return (
    <StoryStage
      emoji="📿"
      title="Two Bead Necklaces"
      subtitle="Find the longest chain of beads that appears in both necklaces, in order."
      narration={narration}
      status={phaseName === 'final' ? `Shared chain • ${finalChain.length} beads` : filling ? `Best chain here • ${phase === 'judge' ? cell : '?'}` : 'Ready'}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.25 }} role="img" aria-label="Two necklaces">
        {/* strings */}
        <line x1={PAD - 16} y1={TOP_Y} x2={PAD + X.length * (BEAD + GAP)} y2={TOP_Y} stroke="#a8a29e" strokeWidth="2" />
        <line x1={PAD - 16} y1={BOT_Y} x2={PAD + Y.length * (BEAD + GAP)} y2={BOT_Y} stroke="#a8a29e" strokeWidth="2" />

        {/* golden threads between tied beads */}
        {pairs.map(([a, b]) => (
          <line key={`t-${a}-${b}`} x1={cx(a - 1)} y1={TOP_Y + BEAD / 2} x2={cx(b - 1)} y2={BOT_Y - BEAD / 2} stroke="#d97706" strokeWidth="4" strokeLinecap="round" className="animate-story-pop" />
        ))}

        {/* the comparison: a link when they match, a cross when they don't */}
        {filling && phase === 'judge' && i > 0 && j > 0 && (
          <g>
            <line x1={cx(i - 1)} y1={TOP_Y + 24 + BEAD / 2} x2={cx(j - 1)} y2={BOT_Y - 24 - BEAD / 2} stroke={isMatch ? '#16a34a' : '#dc2626'} strokeWidth="4" strokeDasharray={isMatch ? undefined : '6 6'} />
            <text x={(cx(i - 1) + cx(j - 1)) / 2 + 14} y={(TOP_Y + BOT_Y) / 2 + 6} fontSize="20" fontWeight="900" fill={isMatch ? '#16a34a' : '#dc2626'} className="animate-story-pop">
              {isMatch ? 'click!' : '✗'}
            </text>
          </g>
        )}

        {X.split('').map((ch, k) => bead(ch, k, 'top'))}
        {Y.split('').map((ch, k) => bead(ch, k, 'bot'))}
      </svg>

      {/* the answer so far, shown as a little chain of beads */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 font-sans text-sm text-stone-600">
        {filling && phase === 'judge' && (
          <>
            <span className="font-semibold">Best shared chain for these beads:</span>
            {Array.from({ length: cell }, (_, k) => (
              <span key={k} className="w-4 h-4 rounded-full bg-amber-400 border border-amber-700 animate-story-pop" />
            ))}
            <span className="font-black text-stone-900">{cell}</span>
          </>
        )}
        {(phaseName === 'traceback' || phaseName === 'final') && (
          <>
            <span className="font-semibold">Shared chain so far:</span>
            {(st.lcsString || '').split('').map((ch: string, k: number) => (
              <span key={k} className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-amber-700 font-black text-stone-900" style={{ background: colour(ch) }}>
                {ch}
              </span>
            ))}
          </>
        )}
      </div>
    </StoryStage>
  );
};
