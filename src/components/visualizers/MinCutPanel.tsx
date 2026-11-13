import React from 'react';
import { Scissors } from 'lucide-react';
import { semColor } from '../../styles/semantics';
import { AlgorithmStep } from '../../types/algorithm';
import type { AugmentingPathState, CutEdge } from '../../algorithms/flowSearch';
import { columnsOf } from './FlowNetworkGraph';

/**
 * The max-flow min-cut theorem, in its own card beside the final answer (Ford-Fulkerson and
 * Edmonds-Karp). Once no augmenting path is left, it redraws the network split in two: side S
 * (what the source can still reach in the residual graph) on the left, side T on the right, a dashed
 * cut line between them, and the full S → T pipes with their capacities. Below: c(S, T) as a sum
 * that equals the max flow. Until then it says what it will show.
 */

type Pt = { x: number; y: number };

const W = 340;
const H = 200;
const R = 13;
const MID = W / 2;

const S_TONE = 'compare' as const;
const T_TONE = 'warning' as const;
const CUT_TONE = 'final' as const;

export const MinCutPanel: React.FC<{ step: AlgorithmStep }> = ({ step }) => {
  const st = (step.state || {}) as AugmentingPathState;
  const cut = st.phase === 'complete' ? st.minCut : undefined;

  if (!cut || !cut.sinkSide) {
    return (
      <section aria-label="Minimum cut" data-min-cut-panel="pending" className="sp-card flex items-start gap-3 text-chalk-300">
        <Scissors className="w-4 h-4 mt-1 shrink-0" aria-hidden />
        <div className="flex flex-col gap-0.5">
          <span className="sp-label">Min cut</span>
          <span className="font-sans text-sm">
            When no augmenting path is left, this card splits the vertices into side S (what the source can still reach) and side T, and shows that
            the full pipes between them add up to the max flow.
          </span>
        </div>
      </section>
    );
  }

  const nodes = st.nodes || [];
  const cap = st.capacityMatrix || [];
  const n = nodes.length;
  const s = Number(st.source ?? 0);
  const t = Number(st.sink ?? n - 1);
  const label = (i: number | string) => nodes[Number(i)]?.label ?? `${i}`;
  const inS = new Set(cut.reachable);

  // ── Layout: the source alone at the far left, the sink alone at the far right, and every other
  //    vertex stacked in columns of up to four next to the cut, so the crossing pipes spread out ──
  const col = n ? columnsOf(cap, s, t) : [];
  const CY = H / 2 + 8;
  const place = (ids: string[], end: number, endX: number, nearX: number, farX: number) => {
    const out = new Map<string, Pt>();
    if (ids.includes(`${end}`)) out.set(`${end}`, { x: endX, y: CY });
    const inner = ids.filter((id) => id !== `${end}`).sort((a, b) => col[Number(a)] - col[Number(b)] || Number(a) - Number(b));
    const columns = Math.ceil(inner.length / 4);
    const perCol = Math.ceil(inner.length / Math.max(1, columns));
    inner.forEach((id, i) => {
      const c = Math.floor(i / perCol);
      const group = inner.slice(c * perCol, (c + 1) * perCol);
      // Column 0 sits nearest the cut on side T, farthest from it on side S (by distance from s).
      const k = columns === 1 ? 0 : end === s ? columns - 1 - c : c;
      const x = columns === 1 ? nearX : nearX + (k * (farX - nearX)) / columns;
      const gap = Math.min(52, (H - 60) / Math.max(1, group.length - 1));
      // Odd-sized groups shift a little so no vertex sits level with the source and sink.
      const shift = group.length % 2 === 1 ? 14 : 0;
      out.set(id, { x, y: CY + shift + (group.indexOf(id) - (group.length - 1) / 2) * gap });
    });
    return out;
  };
  const pos = new Map<string, Pt>([
    ...place(cut.reachable, s, 30, MID - 46, 70),
    ...place(cut.sinkSide, t, W - 30, MID + 46, W - 70),
  ]);
  const at = (id: string) => pos.get(id) ?? { x: MID, y: H / 2 };

  /** A pipe a → b as a quadratic curve, bowed when the opposite pipe also exists or a vertex is in the way. */
  const curve = (a: string, b: string) => {
    const p = at(a);
    const q = at(b);
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    let bend = cap[Number(b)]?.[Number(a)] > 0 ? 12 : 0;
    const blocked = [...pos.entries()].some(([k, c]) => {
      if (k === a || k === b) return false;
      const u = Math.max(0, Math.min(1, ((c.x - p.x) * dx + (c.y - p.y) * dy) / (len * len)));
      return Math.hypot(c.x - (p.x + u * dx), c.y - (p.y + u * dy)) < R + 6;
    });
    if (blocked && !bend) bend = 26;
    const c = { x: (p.x + q.x) / 2 + (dy / len) * bend * 2, y: (p.y + q.y) / 2 - (dx / len) * bend * 2 };
    const trim = (from: Pt, gap: number) => {
      const l = Math.hypot(c.x - from.x, c.y - from.y) || 1;
      return { x: from.x + ((c.x - from.x) / l) * gap, y: from.y + ((c.y - from.y) / l) * gap };
    };
    const p0 = trim(p, R + 1);
    const p2 = trim(q, R + 4);
    const point = (k: number) => ({
      x: (1 - k) * (1 - k) * p.x + 2 * (1 - k) * k * c.x + k * k * q.x,
      y: (1 - k) * (1 - k) * p.y + 2 * (1 - k) * k * c.y + k * k * q.y,
    });
    // Where the pipe crosses the dashed cut line (closest sample to x = MID).
    let crossing = point(0.5);
    for (let k = 0; k <= 1; k += 0.02) if (Math.abs(point(k).x - MID) < Math.abs(crossing.x - MID)) crossing = point(k);
    return { d: `M ${p0.x} ${p0.y} Q ${c.x} ${c.y} ${p2.x} ${p2.y}`, crossing };
  };

  const isCut = (u: string, v: string) => cut.edges.some((e) => e.u === u && e.v === v);
  const isBack = (u: string, v: string) => cut.backEdges.some((e) => e.u === u && e.v === v);

  const inside: React.ReactNode[] = [];
  const back: React.ReactNode[] = [];
  const cutLines: React.ReactNode[] = [];
  /** Capacity tags sit on the cut line where each S → T pipe crosses it. */
  const tags: { key: string; y: number; text: string }[] = [];
  for (let u = 0; u < n; u++)
    for (let v = 0; v < n; v++) {
      if (!(cap[u][v] > 0)) continue;
      const a = `${u}`;
      const b = `${v}`;
      const k = curve(a, b);
      if (isCut(a, b)) {
        cutLines.push(
          <path key={`c-${a}-${b}`} data-cut-edge={`${a}-${b}`} d={k.d} fill="none" stroke={semColor(CUT_TONE)} strokeWidth={3} markerEnd="url(#mincut-arrow-cut)" />,
        );
        tags.push({ key: `${a}-${b}`, y: k.crossing.y, text: `${cap[u][v]}` });
      } else if (isBack(a, b)) {
        back.push(
          <path
            key={`b-${a}-${b}`}
            data-back-edge={`${a}-${b}`}
            d={k.d}
            fill="none"
            stroke={semColor('pruned')}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            markerEnd="url(#mincut-arrow-back)"
            opacity={0.8}
          />,
        );
      } else {
        inside.push(
          <path key={`i-${a}-${b}`} d={k.d} fill="none" stroke="rgb(var(--text-dim))" strokeWidth={1.3} opacity={0.45} markerEnd="url(#mincut-arrow-in)" />,
        );
      }
    }

  // Keep the tags apart: top to bottom, at least 20px between neighbours, inside the drawing.
  tags.sort((x, y) => x.y - y.y);
  for (let i = 0; i < tags.length; i++) tags[i].y = Math.max(tags[i].y, i ? tags[i - 1].y + 20 : 32);
  const overflow = (tags.at(-1)?.y ?? 0) - (H - 14);
  if (overflow > 0) for (const tag of tags) tag.y = Math.max(32, tag.y - overflow);
  const cutPills = tags.map((tag) => {
    const w = tag.text.length * 7 + 14;
    return (
      <g key={`cp-${tag.key}`} data-cut-capacity={tag.key} transform={`translate(${MID}, ${tag.y})`}>
        <rect x={-w / 2} y={-9} width={w} height={18} rx={9} style={{ fill: 'rgb(var(--bg-surface))' }} stroke={semColor(CUT_TONE)} strokeWidth={1.5} />
        <text textAnchor="middle" y={4} fontSize="11" fontWeight="800" fontFamily="ui-monospace, monospace" style={{ fill: semColor(CUT_TONE, 'ink') }}>
          {tag.text}
        </text>
      </g>
    );
  });

  const marker = (id: string, color: string) => (
    <marker id={`mincut-arrow-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" style={{ fill: color }} />
    </marker>
  );

  const hop = (e: CutEdge) => `${label(e.u)} → ${label(e.v)}`;
  const sum = cut.edges.map((e) => e.capacity).join(' + ') || '0';
  const matches = cut.capacity === st.totalMaxFlow;
  const sideChips = (ids: string[], tone: typeof S_TONE | typeof T_TONE) =>
    ids.map((id) => (
      <span
        key={id}
        className="inline-flex items-center px-1.5 py-0.5 rounded-md border text-[11px] font-mono font-bold"
        style={{ background: semColor(tone, 'accent', 0.14), borderColor: semColor(tone), color: semColor(tone, 'ink') }}
      >
        {label(id)}
      </span>
    ));

  return (
    <section aria-label="Minimum cut" data-min-cut-panel="ready" className="sp-card flex flex-col gap-2">
      <h2 className="sp-label">
        <Scissors className="w-4 h-4" aria-hidden /> Min cut = max flow
      </h2>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label={`Side S ${cut.reachable.map(label).join(', ')}, side T ${cut.sinkSide.map(label).join(', ')}, cut capacity ${cut.capacity}`}>
        <defs>
          {marker('cut', semColor(CUT_TONE))}
          {marker('back', semColor('pruned'))}
          {marker('in', 'rgb(var(--text-dim))')}
        </defs>
        {/* The two sides */}
        <rect x={6} y={22} width={MID - 14} height={H - 30} rx={14} style={{ fill: semColor(S_TONE, 'accent', 0.08), stroke: semColor(S_TONE, 'accent', 0.45) }} strokeWidth={1} />
        <rect x={MID + 8} y={22} width={MID - 14} height={H - 30} rx={14} style={{ fill: semColor(T_TONE, 'accent', 0.08), stroke: semColor(T_TONE, 'accent', 0.45) }} strokeWidth={1} />
        <text x={14} y={15} fontSize="11" fontWeight="800" style={{ fill: semColor(S_TONE, 'ink') }}>
          S · reachable from {label(s)}
        </text>
        <text x={W - 14} y={15} textAnchor="end" fontSize="11" fontWeight="800" style={{ fill: semColor(T_TONE, 'ink') }}>
          T · the rest
        </text>
        {/* The cut */}
        <line x1={MID} y1={18} x2={MID} y2={H - 4} stroke={semColor(CUT_TONE)} strokeWidth={2} strokeDasharray="6 5" />
        {inside}
        {back}
        {cutLines}
        {[...pos.entries()].map(([id, p]) => {
          const tone = inS.has(id) ? S_TONE : T_TONE;
          return (
            <g key={id} transform={`translate(${p.x}, ${p.y})`} data-cut-side={inS.has(id) ? 'S' : 'T'} data-node={id}>
              <circle r={R} style={{ fill: 'rgb(var(--bg-surface))' }} />
              <circle r={R} style={{ fill: semColor(tone, 'accent', 0.2), stroke: semColor(tone) }} strokeWidth={2} />
              <text textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="800" style={{ fill: semColor(tone, 'ink') }}>
                {label(id)}
              </text>
            </g>
          );
        })}
        {cutPills}
      </svg>

      <div className="flex flex-col gap-1.5 text-[12px] text-chalk-300">
        <div className="flex flex-wrap items-center gap-1">
          <span className="font-bold w-5" style={{ color: semColor(S_TONE, 'ink') }}>S</span>
          {sideChips(cut.reachable, S_TONE)}
          <span className="font-bold w-5 ml-2" style={{ color: semColor(T_TONE, 'ink') }}>T</span>
          {sideChips(cut.sinkSide, T_TONE)}
        </div>
        <div data-cut-edges className="flex flex-wrap gap-x-2.5 gap-y-0.5 font-mono">
          {cut.edges.map((e) => (
            <span key={`${e.u}-${e.v}`}>
              {hop(e)} <b style={{ color: semColor(CUT_TONE, 'ink') }}>{e.flow}/{e.capacity}</b> full
            </span>
          ))}
        </div>
        <p
          data-cut-sum
          className="font-mono text-[13px] font-bold rounded-lg px-2 py-1"
          style={{ background: semColor(CUT_TONE, 'accent', 0.12), color: semColor(CUT_TONE, 'ink') }}
        >
          c(S, T) = {sum}
          {cut.edges.length > 1 ? ` = ${cut.capacity}` : ''} {matches ? '=' : '≠'} max flow {matches ? '✓' : ''}
        </p>
        {cut.backEdges.length > 0 && (
          <p className="text-[11.5px]" data-cut-back>
            <span style={{ color: semColor('pruned', 'ink') }}>Dotted:</span> {cut.backEdges.map(hop).join(', ')} {cut.backEdges.length > 1 ? 'go' : 'goes'} from T back
            to S, so {cut.backEdges.length > 1 ? 'they do' : 'it does'} not count toward the cut (and carr{cut.backEdges.length > 1 ? 'y' : 'ies'} 0 flow now).
          </p>
        )}
        <p className="text-[11.5px] text-chalk-400">
          Every unit of flow from {label(s)} to {label(t)} must cross the dashed line, so no flow can beat c(S, T). This flow reaches it, so both are
          optimal.
        </p>
      </div>
    </section>
  );
};
