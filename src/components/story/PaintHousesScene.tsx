import React, { useRef } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';
import { COLOR_NAMES } from '../../algorithms/graphColoring';

/**
 * 🎨 Graph colouring as painting houses joined by fences.
 *
 * Neighbours (houses sharing a fence) must never get the same paint. The painter tries
 * the buckets in order: a safe colour is brushed on; a clashing one makes the shared
 * fence flash with a zigzag and the paint is wiped off. If a house runs out of buckets,
 * the previous house is scraped clean (backtracking) and repainted.
 */

const W = 680;
const H = 470;
const PAINT = ['#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#a855f7', '#06b6d4', '#ec4899'];

export const PaintHousesScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const st: any = step.state || {};
  const nodes: { id: string; label: string }[] = st.nodes || [];
  const edges: { u: string; v: string }[] = st.edges || [];
  const k: number = st.numColors ?? 3;
  const assign: Record<string, number> = st.colorAssignment || {};
  const cur: string | undefined = st.currentVertex;
  const tryColor: number | undefined = st.currentColor;
  const clashWith: string | undefined = st.conflictVertex;
  const title: string = step.title || '';
  const solutions: Record<string, number>[] = st.allSolutions || [];

  // Paint each house had on the previously shown step (to scrape it off on a backtrack).
  const prevRef = useRef({ idx: step.stepIndex, cur: assign, prev: assign });
  if (prevRef.current.idx !== step.stepIndex) prevRef.current = { idx: step.stepIndex, cur: assign, prev: prevRef.current.cur };
  const prevAssign = prevRef.current.prev;

  const kind = (() => {
    if (step.isFinal) return /No Valid/.test(title) ? 'impossible' : 'final';
    if (/^Valid Coloring #/.test(title)) return 'solution';
    if (/^Considering/.test(title)) return 'consider';
    if (/^Conflict/.test(title)) return 'clash';
    if (/^Assign/.test(title)) return 'paint';
    if (/^Backtrack/.test(title)) return 'scrape';
    return 'intro';
  })();

  const phases: readonly (readonly [string, number])[] =
    kind === 'clash' ? [['brush', 0], ['clash', 0.4]] : kind === 'scrape' ? [['scrape', 0], ['clean', 0.5]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  const idx = (id: string) => nodes.findIndex((n) => n.id === `${id}`);
  const pos = nodes.map((_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, nodes.length);
    return { x: W / 2 + 220 * Math.cos(a), y: 186 + 140 * Math.sin(a) };
  });
  const label = (id?: string) => (id === undefined ? '' : nodes[idx(id)]?.label ?? id);
  const name = (c?: number) => (c ? COLOR_NAMES[c] ?? `colour ${c}` : '');

  const paintOf = (id: string) => {
    if (id === cur && kind === 'clash' && phase === 'brush') return tryColor ?? 0;
    if (id === cur && kind === 'scrape' && phase === 'scrape') return prevAssign[id] ?? 0;
    return assign[id] ?? 0;
  };

  const narration = (() => {
    switch (kind) {
      case 'intro':
        return `Paint every house so that no two houses sharing a fence get the same colour. We have ${k} paint buckets and paint the houses in order.`;
      case 'consider':
        return `Next up: house ${label(cur)}. Which bucket can it use?`;
      case 'paint':
        return `${name(tryColor)} is safe: no neighbour of ${label(cur)} is ${name(tryColor)}. Brush it on and move to the next house.`;
      case 'clash':
        return phase === 'brush'
          ? `Try ${name(tryColor)} on house ${label(cur)}…`
          : `Clash! ${label(clashWith)} is right across the fence and already ${name(tryColor)}. Wipe it off and try the next bucket.`;
      case 'scrape':
        return `Stuck further on, so scrape the ${name(prevAssign[cur ?? ''])} paint off house ${label(cur)} and try a different colour.`;
      case 'solution':
        return `Every house is painted and no fence has the same colour on both sides: colouring #${st.solutionCount}!`;
      case 'final':
        return solutions.length > 1
          ? `Done! There are ${solutions.length} different ways to paint the houses with ${k} colours.`
          : `Done! Every house is painted and no neighbours share a colour.`;
      case 'impossible':
        return `Every combination was tried: ${k} colours are not enough, some neighbours would always clash.`;
      default:
        return step.title;
    }
  })();

  const painted = Object.values(assign).filter((c) => c > 0).length;
  const status = kind === 'final' || kind === 'solution' ? `Colourings found • ${Math.max(solutions.length, 1)}` : kind === 'impossible' ? 'Not enough colours' : `Houses painted • ${painted} of ${nodes.length}`;

  const bucketActive = (c: number) => (kind === 'paint' || kind === 'clash' || kind === 'consider') && tryColor === c;

  return (
    <StoryStage emoji="🎨" title="Paint the Houses" subtitle="Houses joined by a fence are neighbours: they must get different colours." narration={narration} status={status}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Houses and fences">
        <rect x="0" y="0" width={W} height={H} rx="18" fill="#eef5e4" />

        {/* fences */}
        {edges.map((e, i) => {
          const a = pos[idx(e.u)];
          const b = pos[idx(e.v)];
          if (!a || !b) return null;
          const clashing = kind === 'clash' && phase === 'clash' && ((e.u === cur && e.v === clashWith) || (e.v === cur && e.u === clashWith));
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const posts = Math.max(2, Math.floor(len / 34));
          return (
            <g key={`fence-${i}`}>
              <line x1={a.x} y1={a.y - 8} x2={b.x} y2={b.y - 8} stroke={clashing ? '#dc2626' : '#a16207'} strokeWidth={clashing ? 5 : 3} />
              <line x1={a.x} y1={a.y + 2} x2={b.x} y2={b.y + 2} stroke={clashing ? '#dc2626' : '#a16207'} strokeWidth={clashing ? 5 : 3} />
              {Array.from({ length: posts + 1 }, (_, p) => {
                const t = p / posts;
                return <rect key={p} x={a.x + (b.x - a.x) * t - 2.5} y={a.y + (b.y - a.y) * t - 16} width="5" height="24" rx="1.5" fill="#78350f" />;
              })}
              {clashing && (
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 12} textAnchor="middle" fontSize="26" className="animate-story-pop">
                  ⚡
                </text>
              )}
            </g>
          );
        })}

        {/* houses */}
        {nodes.map((n, i) => {
          const p = pos[i];
          const c = paintOf(n.id);
          const isCur = n.id === cur && kind !== 'final' && kind !== 'solution';
          const wiping = n.id === cur && kind === 'clash' && phase === 'clash';
          return (
            <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
              {isCur && <circle r="44" fill="#fde68a" opacity="0.6" />}
              <g className={wiping ? 'animate-story-shake' : undefined}>
                <path d="M -32 -4 L 0 -34 L 32 -4 Z" fill="#9a3412" stroke="#7c2d12" strokeWidth="2" strokeLinejoin="round" />
                <rect x="-26" y="-6" width="52" height="40" rx="3" fill={PAINT[c] ?? '#ffffff'} stroke="#57534e" strokeWidth="2" style={{ transition: 'fill 0.6s ease-in-out' }} />
                <rect x="-6" y="14" width="12" height="20" rx="2" fill="#78350f" />
                <rect x="-20" y="2" width="10" height="9" fill="#e0f2fe" stroke="#57534e" strokeWidth="1" />
                <rect x="10" y="2" width="10" height="9" fill="#e0f2fe" stroke="#57534e" strokeWidth="1" />
              </g>
              <text textAnchor="middle" y="50" fontSize="13" fontWeight="900" fill="#1c1917">
                {n.label}
              </text>
              {isCur && kind === 'scrape' && phase === 'scrape' && (
                <text x="34" y="-18" fontSize="20" className="animate-story-bob">
                  🧽
                </text>
              )}
              {isCur && (kind === 'paint' || (kind === 'clash' && phase === 'brush')) && (
                <text x="34" y="-18" fontSize="20" className="animate-story-pop">
                  🖌️
                </text>
              )}
            </g>
          );
        })}

        {/* paint buckets */}
        {Array.from({ length: k }, (_, j) => {
          const c = j + 1;
          const x = W / 2 + (j - (k - 1) / 2) * 62;
          const active = bucketActive(c);
          return (
            <g key={`bucket-${c}`} transform={`translate(${x}, ${H - 34 - (active ? 10 : 0)})`} style={{ transition: 'transform 0.4s' }}>
              <path d="M -18 -14 L 18 -14 L 14 16 L -14 16 Z" fill="#d6d3d1" stroke="#57534e" strokeWidth="2" />
              <ellipse cx="0" cy="-14" rx="18" ry="5" fill={PAINT[c]} stroke="#57534e" strokeWidth="1.5" />
              <path d="M -18 -14 Q 0 -36 18 -14" fill="none" stroke="#57534e" strokeWidth="1.5" />
              {active && <circle r="26" cy="0" fill="none" stroke="#f59e0b" strokeWidth="3" />}
            </g>
          );
        })}
      </svg>

      {solutions.length > 1 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {solutions.slice(0, 18).map((s, j) => (
            <div key={j} className="flex gap-0.5 p-1 rounded-md bg-white border border-stone-200 shadow-sm">
              {nodes.map((n) => (
                <span key={n.id} className="w-3 h-3 rounded-sm border border-stone-300" style={{ background: PAINT[s[n.id]] }} />
              ))}
            </div>
          ))}
          {solutions.length > 18 && <span className="text-xs text-stone-500 self-center">+{solutions.length - 18} more</span>}
        </div>
      )}
    </StoryStage>
  );
};
