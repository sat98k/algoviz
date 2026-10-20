import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';

/**
 * 🎁 Matrix Chain Multiplication as gluing wooden panels together.
 *
 * Every matrix is a wooden panel whose height and width show its rows and columns.
 * Gluing an (a×b) panel to a (b×c) panel costs a·b·c coins, so the ORDER of gluing
 * matters. For each stretch of panels a divider slides along: build the left group,
 * build the right group, then glue the two together — three coin piles. The cheapest
 * divider wins. At the end the best order appears as nested gift boxes.
 */

type Group = string | Group[];

/** Parses "(A1 (A2 A3))" into nested arrays. */
const parseGroups = (s: string): Group | null => {
  const tokens = s.match(/\(|\)|A\d+/g) || [];
  let pos = 0;
  const read = (): Group | null => {
    const t = tokens[pos++];
    if (t === undefined) return null;
    if (t !== '(') return t;
    const kids: Group[] = [];
    while (pos < tokens.length && tokens[pos] !== ')') {
      const g = read();
      if (g !== null) kids.push(g);
    }
    pos++;
    return kids;
  };
  return tokens.length ? read() : null;
};

const BOX_COLOURS = ['#fecaca', '#bfdbfe', '#bbf7d0', '#fde68a', '#ddd6fe', '#fbcfe8'];

const Boxes: React.FC<{ g: Group; depth?: number }> = ({ g, depth = 0 }) =>
  typeof g === 'string' ? (
    <span className="px-2 py-1 rounded-md bg-[#d6b98c] border border-[#8b6b4a] font-mono text-sm font-black text-stone-900">{g}</span>
  ) : (
    <span
      className="relative inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 animate-story-pop"
      style={{ background: BOX_COLOURS[depth % BOX_COLOURS.length], borderColor: '#9f1239' }}
    >
      {depth === 0 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base">🎀</span>}
      {g.map((c, k) => (
        <Boxes key={k} g={c} depth={depth + 1} />
      ))}
    </span>
  );

const Coins: React.FC<{ value: number; label: string; tone: string }> = ({ value, label, tone }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex flex-col-reverse items-center h-16 justify-start">
      {Array.from({ length: Math.min(8, Math.max(value > 0 ? 1 : 0, Math.ceil(Math.log2(value + 1)))) }, (_, k) => (
        <span key={k} className="w-8 h-2 -mt-0.5 rounded-full bg-yellow-400 border border-yellow-700" />
      ))}
    </div>
    <span className="font-mono text-base font-black text-stone-900">{value.toLocaleString()}</span>
    <span className={`text-[11px] font-semibold ${tone}`}>{label}</span>
  </div>
);

export const GiftWrapScene: React.FC<StorySceneProps> = ({ step }) => {
  const st: any = step.state || {};
  const mats: { id: number; name: string; rows: number; cols: number }[] = st.matrices || [];
  const p: number[] = st.dimensions || [];
  const m: number[][] = st.dpTable || [];
  const title: string = step.title || '';
  const bt = st.backtrackInfo as { i: number; j: number; k: number; action: string } | undefined;

  const kind = (() => {
    if (step.isFinal) return 'final';
    if (/^Initialize/.test(title)) return 'intro';
    if (/^Compute Cell/.test(title)) return 'cell';
    if (/^Evaluate Split/.test(title)) return 'split';
    if (/^DP Table Complete/.test(title)) return 'trace-start';
    if (/^Backtrack/.test(title)) return 'trace-split';
    if (/^Merge Group/.test(title)) return 'trace-merge';
    return 'idle';
  })();

  const i: number = bt?.i ?? st.currentRow ?? 0;
  const j: number = bt?.j ?? st.currentCol ?? 0;
  const k: number | undefined = bt?.k ?? st.currentK;
  const inStretch = (id: number) => (kind === 'intro' || kind === 'final' || kind === 'trace-start' ? true : id >= i && id <= j);

  const maxDim = Math.max(1, ...p);
  const scale = (v: number) => 22 + (v / maxDim) * 70;

  const left = k !== undefined ? m[i]?.[k] ?? 0 : 0;
  const right = k !== undefined ? m[k + 1]?.[j] ?? 0 : 0;
  const glue = k !== undefined ? (p[i - 1] ?? 0) * (p[k] ?? 0) * (p[j] ?? 0) : 0;
  const total = st.currentCost ?? left + right + glue;
  const isNewBest = kind === 'split' && st.bestK === k && st.minCost === total;
  const groups = parseGroups(st.optimalParenthesization || '');

  const narration = (() => {
    switch (kind) {
      case 'intro':
        return 'Each panel is a matrix: height = rows, width = columns. Gluing an a×b panel to a b×c panel costs a·b·c coins. Same panels, different gluing order, very different cost! A single panel costs nothing.';
      case 'cell':
        return `How cheaply can we glue panels A${i} to A${j} into one? Try every place to put the divider.`;
      case 'split':
        return `Divider after A${k}: build the left group (${left.toLocaleString()}), build the right group (${right.toLocaleString()}), then glue them (${p[i - 1]}·${p[k ?? 0]}·${p[j]} = ${glue.toLocaleString()}). Total ${total.toLocaleString()}${isNewBest ? ': the cheapest so far!' : `, not cheaper than ${st.minCost?.toLocaleString()}.`}`;
      case 'trace-start':
        return `The cheapest way to glue all panels costs ${m[1]?.[mats.length]?.toLocaleString()} coins. Now unwrap where each divider went.`;
      case 'trace-split':
        return `For A${i}…A${j}, the best divider was after A${k}: wrap A${i}…A${k} and A${(k ?? 0) + 1}…A${j} separately.`;
      case 'trace-merge':
        return 'Wrap the two groups together into one gift box.';
      case 'final':
        return `Best gluing order: the innermost boxes first. Total cost: ${m[1]?.[mats.length]?.toLocaleString()} coins.`;
      default:
        return step.title;
    }
  })();

  const showDivider = k !== undefined && (kind === 'split' || kind === 'trace-split');

  return (
    <StoryStage
      emoji="🎁"
      title="Gluing Panels"
      subtitle="Glue cost = rows × shared side × columns. Where you put the divider decides the cost."
      narration={narration}
      status={kind === 'final' ? `Cheapest total • ${m[1]?.[mats.length]?.toLocaleString()}` : kind === 'split' ? `Cheapest so far • ${st.minCost?.toLocaleString()}` : `Stretch • A${i}…A${j}`}
    >
      <div className="flex flex-col items-center gap-5 font-sans">
        {/* the workbench with panels */}
        <div className="flex flex-wrap items-end justify-center gap-2 px-4 pt-6 pb-3 rounded-2xl bg-[#efe3d3] border-2 border-[#d5be9f] min-h-[140px]">
          {mats.map((mat) => {
            const on = inStretch(mat.id);
            const leftSide = showDivider && mat.id <= (k ?? 0);
            return (
              <React.Fragment key={mat.id}>
                <div className="flex flex-col items-center gap-1 transition-all duration-500" style={{ opacity: on ? 1 : 0.3, transform: on && kind !== 'intro' && kind !== 'final' ? 'translateY(-8px)' : 'none' }}>
                  <div
                    className="rounded-md border-2 shadow-sm flex items-center justify-center"
                    style={{
                      width: scale(mat.cols),
                      height: scale(mat.rows),
                      background: showDivider && on ? (leftSide ? '#fecdd3' : '#bfdbfe') : 'repeating-linear-gradient(90deg, #d6b98c 0 6px, #cda877 6px 12px)',
                      borderColor: '#8b6b4a',
                    }}
                  >
                    <span className="font-mono text-sm font-black text-stone-900">{mat.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-stone-600">
                    {mat.rows}×{mat.cols}
                  </span>
                </div>
                {showDivider && mat.id === k && <div className="self-stretch w-1.5 rounded-full bg-red-500 mx-1 animate-story-pop" title="divider" />}
              </React.Fragment>
            );
          })}
        </div>

        {kind === 'split' && (
          <div className="flex flex-wrap items-end justify-center gap-6">
            <Coins value={left} label="build left group" tone="text-rose-700" />
            <span className="text-2xl text-stone-400 pb-6">+</span>
            <Coins value={right} label="build right group" tone="text-blue-700" />
            <span className="text-2xl text-stone-400 pb-6">+</span>
            <Coins value={glue} label="glue them" tone="text-amber-700" />
            <span className="text-2xl text-stone-400 pb-6">=</span>
            <div className={`flex flex-col items-center pb-5 ${isNewBest ? 'animate-story-pop' : ''}`}>
              <span className="font-mono text-xl font-black text-stone-900">{total.toLocaleString()}</span>
              {isNewBest ? <span className="text-xs font-bold text-green-700">⭐ cheapest so far</span> : <span className="text-xs text-stone-500">not cheaper</span>}
            </div>
          </div>
        )}

        {(kind === 'trace-merge' || kind === 'final') && groups && (
          <div className="flex flex-col items-center gap-2 pt-2">
            <Boxes g={groups} />
          </div>
        )}
      </div>
    </StoryStage>
  );
};
