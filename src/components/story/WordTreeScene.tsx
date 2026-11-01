import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { PALETTE, SceneDefs, tint, useSvgIds } from './kit/materials';
import { useChapter } from './kit/chapter';

const BARK = '#7a4f2c';

/** A small ant facing right, centred on its middle. */
const Ant: React.FC = () => (
  <g>
    {[-5, 0, 5].map((x) => (
      <path key={x} d={`M${x} 0 L${x - 3} 6 M${x} 0 L${x + 3} 6`} stroke={PALETTE.ink} strokeWidth="1.2" strokeLinecap="round" />
    ))}
    <ellipse cx="-7" cy="-1" rx="5" ry="4" fill={PALETTE.ink} />
    <ellipse cx="0" cy="-1" rx="3" ry="3" fill={PALETTE.ink} />
    <circle cx="6" cy="-2" r="3.4" fill={PALETTE.ink} />
    <path d="M8 -4 Q11 -9 13 -8 M7 -5 Q8 -10 11 -11" stroke={PALETTE.ink} strokeWidth="1" fill="none" strokeLinecap="round" />
    <circle cx="-8" cy="-2.5" r="1.2" fill="#ffffff" opacity="0.5" />
  </g>
);

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
  const ids = useSvgIds();
  const field = useChapter();
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
      title="The Word Tree"
      subtitle="Every ending of the text is a path from the trunk to an apple. Branch ribbons spell the letters."
      narration={narration}
      status={searching ? `Pattern matched • ${matched} of ${pattern.length}` : `Apples • ${leaf}`}
    >
      {searching && (
        <div className="flex items-center justify-center gap-1 mb-3 font-mono">
          <span className="mr-2 font-sans text-sm font-bold text-stone-700">The ant follows:</span>
          {pattern.split('').map((ch, k) => (
            <span key={k} className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg font-black ${k < matched ? 'bg-[#18bc42] text-stone-900' : 'bg-[#fbf9f4] text-stone-500'}`}>
              {ch}
            </span>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.2 }} role="img" aria-label="Word tree">
        <SceneDefs ids={ids} floor={field.bg} />
        <defs>
          <radialGradient id={`${ids}-apple`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#f59a8e" />
            <stop offset="0.55" stopColor="#d9473b" />
            <stop offset="1" stopColor="#9c2a22" />
          </radialGradient>
          <radialGradient id={`${ids}-golden`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fff1b0" />
            <stop offset="0.55" stopColor={PALETTE.gold} />
            <stop offset="1" stopColor="#a8700f" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} rx="22" fill="#eef3e3" />
        <ellipse cx={width / 2} cy={height * 0.42} rx={width * 0.48} ry={height * 0.4} fill="#dfe9cf" />
        <path d={`M0 ${height - 26} H${width} V${height - 22} Q${width} ${height} ${width - 22} ${height} H22 Q0 ${height} 0 ${height - 22} Z`} fill={`url(#${ids}-floor)`} />

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
                <path d={`M${p.px} ${p.py! + 10} Q${p.px} ${(p.py! + p.y) / 2} ${p.x} ${p.y - 14}`} fill="none" stroke={lit && searching ? '#0c8030' : BARK} strokeWidth={lit && searching ? 9 : 7} strokeLinecap="round" />
                <path d={`M${p.px} ${p.py! + 10} Q${p.px} ${(p.py! + p.y) / 2} ${p.x} ${p.y - 14}`} fill="none" stroke={lit && searching ? '#5dd47e' : tint(BARK, 0.3)} strokeWidth="2" strokeLinecap="round" transform="translate(-1.5, -1)" />
                <g transform={`translate(${mx}, ${my})`}>
                  <rect x={-label.length * 5 - 8} y="-9" width={label.length * 10 + 16} height="21" rx="10.5" fill="#3a2414" opacity="0.1" />
                  <rect x={-label.length * 5 - 8} y="-11" width={label.length * 10 + 16} height="21" rx="10.5" fill="#fbf9f4" stroke={lit && searching ? '#0c8030' : PALETTE.gold} strokeWidth="1.5" />
                  <text textAnchor="middle" y="5" fontSize="13" fontWeight="700" fill={PALETTE.ink} fontFamily="'Red Hat Mono', ui-monospace, monospace">
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
                  <g>
                    <ellipse cx="0" cy="-18" rx="44" ry="26" fill="#6fa85a" />
                    <ellipse cx="-14" cy="-24" rx="22" ry="14" fill="#8cc272" opacity="0.8" />
                    <rect x="-12" y="-12" width="24" height="26" rx="6" fill={BARK} />
                    <rect x="-9" y="-12" width="5" height="26" rx="2.5" fill={tint(BARK, 0.25)} />
                  </g>
                ) : isApple ? (
                  <g>
                    <ellipse cx="0" cy="17" rx="11" ry="3" fill="#3a2414" opacity="0.14" />
                    <circle r="16" fill={`url(#${ids}-${golden ? 'golden' : 'apple'})`} />
                    <path d="M 0 -15 Q 2 -21 0 -24" fill="none" stroke={BARK} strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M 1 -20 Q 8 -26 13 -20 Q 7 -16 1 -20 Z" fill="#4f8a3c" />
                    <ellipse cx="-6" cy="-6" rx="4" ry="2.6" fill="#ffffff" opacity="0.5" transform="rotate(-30 -6 -6)" />
                    <text textAnchor="middle" y="5" fontSize="12.5" fontWeight="900" fill={golden ? PALETTE.ink : '#ffffff'} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                      {n.suffixIndex}
                    </text>
                  </g>
                ) : (
                  <g>
                    <circle r="10" fill={BARK} />
                    <circle r="5" cx="-2" cy="-2" fill={tint(BARK, 0.25)} />
                  </g>
                )}
              </g>
              {isAnt && (
                <g transform="translate(20, -14)">
                  <g className="animate-story-bob">
                    <Ant />
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-sm text-stone-600">The number on an apple is where that ending starts in “{text}” (counting from 0).</p>
    </StoryStage>
  );
};
