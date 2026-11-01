import React, { useRef } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';
import { COLOR_NAMES } from '../../algorithms/graphColoring';
import { PALETTE, SceneDefs, tint, useSvgIds } from './kit/materials';
import { useChapter } from './kit/chapter';

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
// Unpainted, then the paint colours in the order COLOR_NAMES lists them (red, blue, green, yellow…).
const PAINT = ['#f6f1e7', '#e04a3f', '#3f78b5', '#3e9b4f', '#efc12a', '#e8803a', '#8a5aa8', '#2fa3b5', '#d4688c'];
const F = { fontFamily: '"Red Hat Display", system-ui, sans-serif' };

export const PaintHousesScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const ids = useSvgIds();
  const field = useChapter();
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
        <SceneDefs ids={ids} floor={field.bg} />
        <rect x="0" y="0" width={W} height={H} rx="22" fill={tint(field.bg, 0.82)} />
        {[0.18, 0.55, 0.85].map((fx, j) => (
          <ellipse key={j} cx={W * fx} cy={H * (j === 1 ? 0.2 : 0.62)} rx={W * 0.15} ry={H * 0.1} fill={tint(field.bg, 0.68)} opacity="0.7" />
        ))}

        {/* fences */}
        {edges.map((e, i) => {
          const a = pos[idx(e.u)];
          const b = pos[idx(e.v)];
          if (!a || !b) return null;
          const clashing = kind === 'clash' && phase === 'clash' && ((e.u === cur && e.v === clashWith) || (e.v === cur && e.u === clashWith));
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const posts = Math.max(2, Math.floor(len / 34));
          const wood = clashing ? '#cc2e2e' : '#b07a4a';
          return (
            <g key={`fence-${i}`}>
              <line x1={a.x} y1={a.y + 10} x2={b.x} y2={b.y + 10} stroke="#3a2414" strokeOpacity="0.1" strokeWidth="8" strokeLinecap="round" />
              <line x1={a.x} y1={a.y - 9} x2={b.x} y2={b.y - 9} stroke={wood} strokeWidth={clashing ? 5 : 3.5} strokeLinecap="round" />
              <line x1={a.x} y1={a.y + 1} x2={b.x} y2={b.y + 1} stroke={tint(wood, -0.12)} strokeWidth={clashing ? 5 : 3.5} strokeLinecap="round" />
              {Array.from({ length: posts + 1 }, (_, p) => {
                const t = p / posts;
                const x = a.x + (b.x - a.x) * t;
                const y = a.y + (b.y - a.y) * t;
                return <path key={p} d={`M${x - 3} ${y + 8} V${y - 14} L${x} ${y - 18} L${x + 3} ${y - 14} V${y + 8} Z`} fill={tint(wood, 0.1)} stroke={tint(wood, -0.3)} strokeWidth="0.8" />;
              })}
              {clashing && (
                <g transform={`translate(${(a.x + b.x) / 2}, ${(a.y + b.y) / 2 - 16})`}>
                  <g className="animate-story-pop">
                    <circle r="15" fill="#fbe3e1" stroke="#cc2e2e" strokeWidth="2" />
                    <path d="M3 -10 L-5 1 H1 L-3 10 L6 -2 H0 Z" fill="#cc2e2e" />
                  </g>
                </g>
              )}
            </g>
          );
        })}

        {/* houses */}
        {nodes.map((n, i) => {
          const p = pos[i];
          const c = paintOf(n.id);
          const wall = PAINT[c] ?? PAINT[0];
          const isCur = n.id === cur && kind !== 'final' && kind !== 'solution';
          const wiping = n.id === cur && kind === 'clash' && phase === 'clash';
          return (
            <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
              {isCur && <circle r="46" fill={PALETTE.goldLight} opacity="0.6" />}
              <ellipse cx="0" cy="36" rx="34" ry="7" fill="#3a2414" opacity="0.15" />
              <g className={wiping ? 'animate-story-shake' : undefined}>
                <rect x="-26" y="-6" width="52" height="40" rx="3" fill={wall} style={{ transition: 'fill 0.6s var(--ease-move)' }} />
                <rect x="6" y="-6" width="20" height="40" fill="#3a2414" opacity="0.1" />
                <path d="M -33 -3 L 0 -36 L 33 -3 Z" fill="#a94a35" />
                <path d="M 0 -36 L 33 -3 L 14 -3 Z" fill="#863726" />
                <rect x="-6" y="14" width="12" height="20" rx="2" fill={PALETTE.walnut} />
                <circle cx="3" cy="25" r="1.2" fill={PALETTE.goldLight} />
                {[-20, 10].map((x) => (
                  <g key={x}>
                    <rect x={x} y="2" width="10" height="9" rx="1.5" fill="#dff1ff" />
                    <rect x={x} y="2" width="10" height="3" rx="1" fill="#ffffff" opacity="0.7" />
                  </g>
                ))}
              </g>
              <g transform="translate(0, 52)">
                <rect x="-14" y="-10" width="28" height="19" rx="9.5" fill={PALETTE.ink} />
                <text textAnchor="middle" y="4.5" fontSize="12.5" fontWeight="900" fill="#f3efe6" style={F}>
                  {n.label}
                </text>
              </g>
              {isCur && kind === 'scrape' && phase === 'scrape' && (
                <g transform="translate(36, -20)">
                  <g className="animate-story-bob">
                    <rect x="-10" y="-7" width="20" height="14" rx="4" fill="#efc12a" />
                    <rect x="-10" y="2" width="20" height="5" rx="2" fill="#3e9b4f" />
                    {[-5, 0, 5].map((x) => <circle key={x} cx={x} cy="-2" r="1.2" fill="#c49a1a" />)}
                  </g>
                </g>
              )}
              {isCur && (kind === 'paint' || (kind === 'clash' && phase === 'brush')) && (
                <g transform="translate(38, -22) rotate(30)">
                  <g className="animate-story-pop">
                    <rect x="-2.5" y="-4" width="5" height="22" rx="2.5" fill={PALETTE.walnut} />
                    <rect x="-5" y="-10" width="10" height="7" rx="1.5" fill="#9aa8b4" />
                    <path d="M-5 -10 Q0 -24 5 -10 Z" fill={wall} />
                  </g>
                </g>
              )}
            </g>
          );
        })}

        {/* paint cans */}
        {Array.from({ length: k }, (_, j) => {
          const c = j + 1;
          const x = W / 2 + (j - (k - 1) / 2) * 62;
          const active = bucketActive(c);
          return (
            <g key={`bucket-${c}`} transform={`translate(${x}, ${H - 34 - (active ? 10 : 0)})`} style={{ transition: 'transform 0.4s var(--ease-out)' }}>
              <ellipse cx="0" cy="19" rx="18" ry="4" fill="#3a2414" opacity="0.15" />
              <path d="M -17 -12 L 17 -12 L 14 16 Q 0 20 -14 16 Z" fill="#c8d2da" />
              <path d="M 4 -12 L 17 -12 L 14 16 Q 9 18 4 18 Z" fill="#9aa8b4" />
              <rect x="-15.5" y="-2" width="31" height="10" fill={PAINT[c]} opacity="0.9" />
              <ellipse cx="0" cy="-12" rx="17" ry="5" fill={PAINT[c]} stroke={tint(PAINT[c], -0.3)} strokeWidth="1.2" />
              <ellipse cx="-5" cy="-13" rx="6" ry="1.6" fill="#ffffff" opacity="0.45" />
              <path d="M -17 -12 Q 0 -36 17 -12" fill="none" stroke="#5c6670" strokeWidth="1.8" />
              {active && <circle r="27" cy="0" fill="none" stroke={PALETTE.gold} strokeWidth="3" />}
            </g>
          );
        })}
      </svg>

      {solutions.length > 1 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {solutions.slice(0, 18).map((s, j) => (
            <div key={j} className="flex gap-0.5 p-1.5 rounded-full bg-[#fbf9f4]">
              {nodes.map((n) => (
                <span key={n.id} className="w-3.5 h-3.5 rounded-full" style={{ background: PAINT[s[n.id]] }} />
              ))}
            </div>
          ))}
          {solutions.length > 18 && <span className="text-xs text-stone-500 self-center">+{solutions.length - 18} more</span>}
        </div>
      )}
    </StoryStage>
  );
};
