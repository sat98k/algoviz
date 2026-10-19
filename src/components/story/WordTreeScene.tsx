import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';

/**
 * 🌳 Suffix Tree as a word tree.
 *
 * Every ending of the text ("suffix") is a path from the trunk to an apple. Branches carry
 * letter ribbons. While building, each new letter makes every apple branch grow at once,
 * a new twig sprouts when a letter isn't there yet, and a branch splits when two endings
 * share only part of it. To search, an ant climbs down from the trunk following the
 * pattern's letters; every apple below where it stops is a place the pattern occurs.
 */

type TNode = { id: string; edgeLabel: string; suffixIndex: number; isLeaf: boolean; status: string; children: TNode[] };

const LEVEL = 92;
const LEAF_W = 74;

export const WordTreeScene: React.FC<StorySceneProps> = ({ step }) => {
  const st: any = step.state || {};
  const text: string = st.text || '';
  const pattern: string = st.pattern || '';
  const root: TNode | undefined = st.suffixTree;
  const title: string = step.title || '';
  const searching = st.phase === 'search';
  const matched: number = st.matchedLength ?? 0;
  const matchIdx: number[] = st.matchIndices || [];
  const matchLeafIds: string[] = st.matchLeafIds || [];

  // ── Layout: apples side by side, branches centred over their apples ──
  const placed: { n: TNode; x: number; y: number; px?: number; py?: number }[] = [];
  let leaf = 0;
  const lay = (n: TNode, depth: number, px?: number, py?: number): number => {
    let x: number;
    const y = 50 + depth * LEVEL;
    if (!n.children.length) {
      x = 50 + leaf * LEAF_W;
      leaf++;
      placed.push({ n, x, y, px, py });
      return x;
    }
    // Reserve the slot first so children know where their parent will be: lay out children, then centre.
    const start = placed.length;
    const xs = n.children.map((c) => lay(c, depth + 1, undefined, y));
    x = (xs[0] + xs[xs.length - 1]) / 2;
    for (let k = start; k < placed.length; k++) if (placed[k].py === y && placed[k].px === undefined) placed[k].px = x;
    placed.push({ n, x, y, px, py });
    return x;
  };
  if (root) lay(root, 0);
  const width = Math.max(420, 100 + leaf * LEAF_W);
  const depth = Math.max(0, ...placed.map((p) => (p.y - 50) / LEVEL));
  const height = 50 + depth * LEVEL + 80;

  const kind = (() => {
    if (step.isFinal) return 'final';
    if (/^Initialize/.test(title)) return 'intro';
    if (/^Phase \d+/.test(title)) return 'grow';
    if (/new leaf/.test(title)) return 'twig';
    if (/already present/.test(title)) return 'present';
    if (/split edge/.test(title)) return 'split';
    if (/^Suffix tree complete/.test(title)) return 'built';
    if (/^Match P/.test(title)) return 'ant-step';
    if (/^Mismatch/.test(title)) return 'ant-stuck';
    if (/^Pattern consumed/.test(title)) return 'apples';
    return 'idle';
  })();

  const phaseLetter = /extend with '(.)'/.exec(title)?.[1];
  const narration = (() => {
    switch (kind) {
      case 'intro':
        return `The text “${text}” has ${text.length} endings (suffixes), like “${text.slice(-3)}” or “${text.slice(1)}”. We’ll grow a tree where every ending is a path from the trunk to its own apple. The $ marks the very end.`;
      case 'grow':
        return `Next letter: ‘${phaseLetter}’. Every apple branch grows by this letter at the same time, for free.`;
      case 'twig':
        return 'This ending starts a way no branch goes yet, so a new twig with a new apple sprouts.';
      case 'present':
        return `‘${phaseLetter ?? 'This letter'}’ is already on a branch here, so nothing new is needed yet. The tree remembers to come back later.`;
      case 'split':
        return 'Two endings share only the start of this branch, so the branch splits into a fork and a new apple twig grows.';
      case 'built':
        return `The tree is grown! Now let’s find “${pattern}”. An ant starts at the trunk and climbs down, following the pattern’s letters.`;
      case 'ant-step':
        return `The ant finds ‘${pattern[matched - 1]}’ on the branch and keeps going. Matched so far: “${pattern.slice(0, matched)}”.`;
      case 'ant-stuck':
        return `No branch continues with ‘${pattern[matched]}’: the ant is stuck, so “${pattern}” does not appear in the text.`;
      case 'apples':
        return `The whole pattern fits! Every apple below the ant marks a place where “${pattern}” starts: ${matchIdx.join(', ')}.`;
      case 'final':
        return matchIdx.length ? `Done: “${pattern}” appears ${matchIdx.length} time${matchIdx.length > 1 ? 's' : ''}, starting at position${matchIdx.length > 1 ? 's' : ''} ${matchIdx.join(', ')}.` : `Done: “${pattern}” does not appear in “${text}”.`;
      default:
        return step.title;
    }
  })();

  return (
    <StoryStage
      emoji="🌳"
      title="The Word Tree"
      subtitle="Every ending of the text is a path from the trunk to an apple. Branch ribbons spell the letters."
      narration={narration}
      status={searching ? `Pattern matched • ${matched} of ${pattern.length}` : `Apples • ${leaf}`}
    >
      {searching && (
        <div className="flex items-center justify-center gap-1 mb-3 font-mono">
          <span className="mr-2 font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">🐜 follows:</span>
          {pattern.split('').map((ch, k) => (
            <span key={k} className={`w-8 h-9 flex items-center justify-center rounded-md border-2 text-lg font-black ${k < matched ? 'bg-green-100 border-green-500 text-green-900' : 'bg-white border-stone-300 text-stone-500'}`}>
              {ch}
            </span>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.2 }} role="img" aria-label="Word tree">
        <rect x="0" y="0" width={width} height={height} rx="18" fill="#eef5e4" />

        {/* branches with letter ribbons */}
        {placed
          .filter((p) => p.px !== undefined)
          .map((p) => {
            const lit = p.n.status === 'active' || p.n.status === 'explored' || p.n.status === 'best';
            const mx = p.px! + (p.x - p.px!) * 0.62;
            const my = p.py! + (p.y - p.py!) * 0.62;
            const label = p.n.edgeLabel.length > 7 ? `${p.n.edgeLabel.slice(0, 6)}…` : p.n.edgeLabel;
            return (
              <g key={`b-${p.n.id}`}>
                <line x1={p.px} y1={p.py! + 10} x2={p.x} y2={p.y - 14} stroke={lit && searching ? '#16a34a' : '#8b5a2b'} strokeWidth={lit && searching ? 8 : 6} strokeLinecap="round" />
                <g transform={`translate(${mx}, ${my})`}>
                  <rect x={-label.length * 5 - 8} y="-11" width={label.length * 10 + 16} height="21" rx="6" fill="#fffbeb" stroke="#d97706" />
                  <text textAnchor="middle" y="5" fontSize="13" fontWeight="900" fill="#78350f" fontFamily="ui-monospace, monospace">
                    {label}
                  </text>
                </g>
              </g>
            );
          })}

        {/* knots, apples and the ant */}
        {placed.map((p) => {
          const n = p.n;
          const isApple = n.isLeaf;
          const golden = matchLeafIds.includes(n.id) || n.status === 'best';
          const isAnt = searching && n.id === st.activeNodeId && kind !== 'final';
          const isNew = !searching && n.status === 'active';
          return (
            <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
              <g className={isNew ? 'animate-story-pop' : undefined}>
                {n.id === 'root' ? (
                  <rect x="-22" y="-14" width="44" height="26" rx="8" fill="#78350f" />
                ) : isApple ? (
                  <g>
                    <circle r="15" fill={golden ? '#facc15' : '#ef4444'} stroke={golden ? '#a16207' : '#991b1b'} strokeWidth="2" />
                    <path d="M 0 -15 Q 3 -22 8 -22" fill="none" stroke="#166534" strokeWidth="2.5" />
                    <text textAnchor="middle" y="5" fontSize="12" fontWeight="900" fill="#ffffff">
                      {n.suffixIndex}
                    </text>
                  </g>
                ) : (
                  <circle r="9" fill="#a16207" stroke="#78350f" strokeWidth="2" />
                )}
              </g>
              {isAnt && (
                <text x="14" y="-12" fontSize="20" className="animate-story-bob">
                  🐜
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-xs text-stone-500">The number on an apple is where that ending starts in “{text}” (counting from 0).</p>
    </StoryStage>
  );
};
