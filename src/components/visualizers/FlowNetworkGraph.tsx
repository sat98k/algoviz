import React from 'react';
import { semColor } from '../../styles/semantics';
import { AlgorithmStep } from '../../types/algorithm';
import type { AugmentingPathState, FlowSearchState } from '../../algorithms/flowSearch';

/**
 * Technical view of the residual graph for Ford-Fulkerson (DFS) and Edmonds-Karp (BFS).
 *
 * - Every real pipe is a solid arrow labelled flow / capacity.
 * - Every pipe that carries flow also gets a dashed violet reverse edge (↩), labelled with the
 *   flow that could be sent back. The search may walk along it.
 * - The search itself is drawn on top: found vertices, the search tree (parent links), the stack
 *   (DFS) or the traced path (BFS), the edge being looked at with its verdict, and dead ends.
 * - Below the drawing: the queue or stack, parent links / dead ends, and the augment or path log.
 */

type Pt = { x: number; y: number };
type Curve = { p0: Pt; c: Pt; p2: Pt };

const W = 480;
const H = 330;
const R = 17;

const INK = '#0f172a';
const MUTED = '#64748b';
const PIPE = '#94a3b8';

const quad = (k: Curve, t: number): Pt => ({
  x: (1 - t) * (1 - t) * k.p0.x + 2 * (1 - t) * t * k.c.x + t * t * k.p2.x,
  y: (1 - t) * (1 - t) * k.p0.y + 2 * (1 - t) * t * k.c.y + t * t * k.p2.y,
});

/** Column of each vertex: its distance from the source along pipes, with the sink alone at the far right. */
export function columnsOf(cap: number[][], s: number, t: number): number[] {
  const n = cap.length;
  const col = Array(n).fill(-1);
  col[s] = 0;
  const queue = [s];
  while (queue.length) {
    const u = queue.shift()!;
    for (let v = 0; v < n; v++)
      if (cap[u][v] > 0 && col[v] === -1) {
        col[v] = col[u] + 1;
        queue.push(v);
      }
  }
  const deepest = Math.max(1, ...col);
  for (let i = 0; i < n; i++) if (col[i] === -1) col[i] = Math.max(1, deepest - 1);
  col[t] = Math.max(...col.filter((_, i) => i !== t), 0) + 1;
  return col;
}

/** Distance from point p to the segment a–b. */
const segDist = (p: Pt, a: Pt, b: Pt) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + k * dx), p.y - (a.y + k * dy));
};

/** A curve from a to b whose middle sits `bend` px to the left of the direction a → b. */
const bent = (a: Pt, b: Pt, bend: number): Curve => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { p0: a, c: { x: (a.x + b.x) / 2 + (dy / len) * bend * 2, y: (a.y + b.y) / 2 - (dx / len) * bend * 2 }, p2: b };
};

/** The drawn path, trimmed so it starts and ends at the vertex circles. */
const trimmedPath = (k: Curve, startGap = R + 1, endGap = R + 3) => {
  const unit = (from: Pt, to: Pt) => {
    const l = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    return { x: (to.x - from.x) / l, y: (to.y - from.y) / l };
  };
  const a = unit(k.p0, k.c);
  const b = unit(k.p2, k.c);
  const p0 = { x: k.p0.x + a.x * startGap, y: k.p0.y + a.y * startGap };
  const p2 = { x: k.p2.x + b.x * endGap, y: k.p2.y + b.y * endGap };
  return `M ${p0.x} ${p0.y} Q ${k.c.x} ${k.c.y} ${p2.x} ${p2.y}`;
};

export const FlowNetworkGraph: React.FC<{ step: AlgorithmStep; compact?: boolean }> = ({ step, compact }) => {
  const st = (step.state || {}) as AugmentingPathState;
  const search: FlowSearchState = st.search;
  const nodes = st.nodes || [];
  const cap = st.capacityMatrix || [];
  const flow = st.flowMatrix || [];
  const n = nodes.length;
  const s = Number(st.source ?? 0);
  const t = Number(st.sink ?? n - 1);
  const label = (i: number | string) => nodes[Number(i)]?.label ?? `${i}`;
  const phase = st.phase;
  const exploring = phase === 'bfs_explore' || phase === 'dfs_explore';
  const isDfs = search?.kind === 'dfs';
  const probe = exploring ? search?.probe : undefined;
  const log = phase === 'augment' ? st.augmentLog ?? [] : [];

  // ── Layout ──
  const col = n ? columnsOf(cap, s, t) : [];
  const cols = Math.max(1, ...col);
  const pos: Pt[] = nodes.map((_, i) => {
    const group = col.map((c, k) => (c === col[i] ? k : -1)).filter((k) => k >= 0);
    const gap = Math.min(150, (H - 80) / Math.max(1, group.length));
    return { x: 40 + (col[i] * (W - 80)) / cols, y: H / 2 - 4 + (group.indexOf(i) - (group.length - 1) / 2) * gap };
  });

  // ── Curves: one per real pipe, and one per reverse edge (drawn beside its pipe, farther out) ──
  const pipeBend = new Map<string, number>();
  for (let u = 0; u < n; u++)
    for (let v = 0; v < n; v++) {
      if (!(cap[u][v] > 0)) continue;
      let bend = cap[v][u] > 0 ? 22 : 0;
      // Bow around any vertex the straight line would cross.
      const blocker = pos.findIndex((p, k) => k !== u && k !== v && segDist(p, pos[u], pos[v]) < R + 10);
      if (blocker >= 0 && !bend) {
        const side = (pos[v].x - pos[u].x) * (pos[blocker].y - pos[u].y) - (pos[v].y - pos[u].y) * (pos[blocker].x - pos[u].x);
        bend = side > 0 ? -30 : 30;
      }
      pipeBend.set(`${u}-${v}`, bend);
    }
  const pipeCurve = (u: number, v: number) => bent(pos[u], pos[v], pipeBend.get(`${u}-${v}`) ?? 0);
  /** Reverse edge of the pipe u → v: it runs v → u, on the same side as its pipe but farther out. */
  const reverseCurve = (u: number, v: number) => {
    const b = pipeBend.get(`${u}-${v}`) ?? 0;
    const k = bent(pos[u], pos[v], b + (b < 0 ? -26 : 26));
    return { p0: k.p2, c: k.c, p2: k.p0 };
  };

  /** Which drawn curves a residual hop a → b uses: the pipe a → b, the reverse edge of b → a, or both. */
  const hopParts = (a: number, b: number): { pipe: boolean; reverse: boolean } => {
    const forwardRoom = cap[a]?.[b] > 0 ? cap[a][b] - (flow[a]?.[b] ?? 0) : 0;
    const undo = flow[b]?.[a] ?? 0;
    return { pipe: cap[a]?.[b] > 0 && (forwardRoom > 0 || undo === 0), reverse: undo > 0 };
  };

  // Reverse edges shown: every pipe carrying flow, plus any the augment step just used up.
  const reverseKeys = new Set<string>();
  for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) if ((flow[u]?.[v] ?? 0) > 0) reverseKeys.add(`${u}-${v}`);
  for (const e of log) if (e.undo > 0) reverseKeys.add(`${e.v}-${e.u}`);

  // ── Overlays ──
  type Hop = [number, number];
  const hopsOf = (path: string[] | undefined): Hop[] =>
    (path ?? []).slice(0, -1).map((a, i) => [Number(a), Number(path![i + 1])] as Hop);
  const treeHops: Hop[] = exploring && search ? Object.entries(search.parent).map(([v, u]) => [Number(u), Number(v)] as Hop) : [];
  const routeHops: Hop[] = exploring
    ? isDfs
      ? hopsOf(search?.frontier)
      : hopsOf(search?.trace ? [...search.trace].reverse() : undefined)
    : phase === 'path_found' || phase === 'augment'
    ? hopsOf(st.currentAugmentingPath)
    : [];
  const augmentHops: Hop[] = log.map((e) => [Number(e.u), Number(e.v)] as Hop);

  const underlay = (hops: Hop[], color: string, width: number, key: string, partsFrom?: (a: number, b: number) => { pipe: boolean; reverse: boolean }) =>
    hops.flatMap(([a, b], i) => {
      const parts = (partsFrom ?? hopParts)(a, b);
      const out: React.ReactNode[] = [];
      if (parts.pipe && cap[a]?.[b] > 0)
        out.push(<path key={`${key}-p-${i}`} d={trimmedPath(pipeCurve(a, b), 0, 0)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />);
      if (parts.reverse)
        out.push(<path key={`${key}-r-${i}`} d={trimmedPath(reverseCurve(b, a), 0, 0)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />);
      return out;
    });
  const logParts = (a: number, b: number) => {
    const e = log.find((x) => Number(x.u) === a && Number(x.v) === b);
    return { pipe: !!e && e.forward > 0, reverse: !!e && e.undo > 0 };
  };

  const isCut = (u: number, v: number) => !!st.minCut?.edges.some((e) => Number(e.u) === u && Number(e.v) === v);
  const cutShown = phase === 'complete' || (exploring && !!st.minCut);

  const pill = (at: Pt, text: string, fill: string, stroke: string, ink: string, key: string) => {
    const w = text.length * 6.4 + 12;
    return (
      <g key={key} transform={`translate(${at.x}, ${at.y})`}>
        <rect x={-w / 2} y={-9} width={w} height={18} rx={9} fill={fill} stroke={stroke} strokeWidth={1.2} />
        <text textAnchor="middle" y={4} fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace" fill={ink}>
          {text}
        </text>
      </g>
    );
  };

  const pipes: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  for (let u = 0; u < n; u++)
    for (let v = 0; v < n; v++) {
      if (!(cap[u][v] > 0)) continue;
      const k = pipeCurve(u, v);
      const f = flow[u]?.[v] ?? 0;
      const full = f >= cap[u][v];
      const cut = cutShown && isCut(u, v);
      const color = cut ? semColor('final') : f > 0 ? semColor('decision') : PIPE;
      pipes.push(
        <path
          key={`pipe-${u}-${v}`}
          data-flow-pipe={`${u}-${v}`}
          d={trimmedPath(k)}
          fill="none"
          stroke={color}
          strokeWidth={f > 0 ? 2.2 + (3 * f) / cap[u][v] : 1.8}
          strokeDasharray={cut ? '6 4' : undefined}
          markerEnd={`url(#flow-arrow-${cut ? 'cut' : f > 0 ? 'flow' : 'pipe'})`}
        />,
      );
      labels.push(
        pill(
          quad(k, 0.5),
          `${cut ? '✂ ' : ''}${f}/${cap[u][v]}`,
          '#ffffff',
          cut ? semColor('final') : full ? semColor('decision') : '#cbd5e1',
          cut ? semColor('final', 'ink') : full ? semColor('decision', 'ink') : INK,
          `pl-${u}-${v}`,
        ),
      );
    }
  // Reverse edges the search or the push is using right now are drawn in full, with their room;
  // the others stay faint so the picture is not crowded (the pipe's f/c label already says how much could go back).
  const inUse = new Set<string>();
  const markUsed = (hops: Hop[]) => hops.forEach(([a, b]) => hopParts(a, b).reverse && inUse.add(`${b}-${a}`));
  markUsed(treeHops);
  markUsed(routeHops);
  if (probe) markUsed([[Number(probe.u), Number(probe.v)]]);
  for (const e of log) if (e.undo > 0) inUse.add(`${e.v}-${e.u}`);
  for (const key of reverseKeys) {
    const [u, v] = key.split('-').map(Number);
    const k = reverseCurve(u, v);
    const f = flow[u]?.[v] ?? 0;
    const used = inUse.has(key);
    pipes.push(
      <path
        key={`rev-${key}`}
        data-reverse-edge={`${v}-${u}`}
        data-in-use={used || undefined}
        d={trimmedPath(k)}
        fill="none"
        stroke={semColor('backtrack')}
        strokeWidth={used ? 2 : 1.2}
        strokeDasharray="5 4"
        markerEnd="url(#flow-arrow-reverse)"
        opacity={used ? 1 : 0.4}
      />,
    );
    if (used) labels.push(pill(quad(k, 0.5), `↩ ${f}`, '#f5f3ff', semColor('backtrack'), semColor('backtrack', 'ink'), `rl-${key}`));
  }

  // The edge being looked at, with its verdict.
  const badges: React.ReactNode[] = [];
  let probeLine: React.ReactNode = null;
  if (probe) {
    const a = Number(probe.u);
    const b = Number(probe.v);
    const parts = hopParts(a, b);
    const k = parts.pipe ? pipeCurve(a, b) : reverseCurve(b, a);
    const mid = quad(k, 0.5);
    const tone = probe.verdict === 'take' ? 'match' : probe.verdict === 'full' ? 'mismatch' : 'pruned';
    const text =
      probe.verdict === 'take'
        ? `✓ room ${probe.room}${probe.undoRoom > 0 ? ' ↩' : ''}`
        : probe.verdict === 'full'
        ? '✗ full'
        : isDfs
        ? '• visited'
        : '• found';
    probeLine = <path d={trimmedPath(k)} fill="none" stroke={semColor('current')} strokeWidth={3.5} strokeDasharray="7 5" className="animate-flow-dash" />;
    badges.push(
      <g key="probe-badge" data-probe-verdict={probe.verdict}>
        {pill({ x: mid.x, y: mid.y - 21 }, text, semColor(tone, 'accent', 0.15), semColor(tone), semColor(tone, 'ink'), 'probe-pill')}
      </g>,
    );
  }
  for (const e of log) {
    const a = Number(e.u);
    const b = Number(e.v);
    if (e.forward > 0) badges.push(pill({ ...quad(pipeCurve(a, b), 0.5), y: quad(pipeCurve(a, b), 0.5).y - 21 }, `+${e.forward}`, semColor('decision', 'accent', 0.15), semColor('decision'), semColor('decision', 'ink'), `aug-f-${a}-${b}`));
    if (e.undo > 0) {
      const m = quad(reverseCurve(b, a), 0.5);
      badges.push(pill({ x: m.x, y: m.y - 21 }, `↩ sent back ${e.undo}`, '#f5f3ff', semColor('backtrack'), semColor('backtrack', 'ink'), `aug-r-${a}-${b}`));
    }
  }

  const visited = new Set(exploring ? search?.visited ?? [] : []);
  const deadEnds = new Set(exploring ? search?.deadEnds ?? [] : []);
  const onRoute = new Set(routeHops.flatMap(([a, b]) => [`${a}`, `${b}`]));
  const reachable = new Set(cutShown ? st.minCut?.reachable ?? [] : []);
  const current = exploring ? search?.current : undefined;

  const renderNode = (i: number) => {
    const id = `${i}`;
    const p = pos[i];
    const isCurrent = current === id;
    const isDead = deadEnds.has(id);
    const isFound = visited.has(id) || reachable.has(id);
    const stroke = isCurrent
      ? semColor('current')
      : isDead
      ? semColor('pruned')
      : onRoute.has(id)
      ? semColor('current')
      : isFound
      ? semColor('compare')
      : i === s || i === t
      ? '#2563eb'
      : MUTED;
    const fill = isDead ? '#f1f5f9' : isFound ? semColor('compare', 'accent', 0.14) : i === s || i === t ? '#eff6ff' : '#ffffff';
    const depth = exploring ? search?.depth?.[id] : undefined;
    const badge =
      depth === undefined
        ? null
        : isDfs
        ? search.frontier.includes(id)
          ? `depth ${depth}`
          : null
        : `ring ${depth}`;
    return (
      <g key={`node-${i}`} transform={`translate(${p.x}, ${p.y})`} data-flow-node={id} data-found={isFound || undefined} data-dead-end={isDead || undefined}>
        {isCurrent && <circle r={R + 6} fill="none" stroke={semColor('current')} strokeWidth={2} strokeDasharray="4 3" className="animate-pulse" />}
        <circle r={R} fill={fill} stroke={stroke} strokeWidth={isCurrent || onRoute.has(id) ? 3 : 2} strokeDasharray={isDead ? '4 3' : undefined} />
        <text textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill={INK}>
          {label(i)}
        </text>
        {isDead && (
          <text x={R - 2} y={-R + 4} fontSize="12" fill={semColor('pruned', 'ink')}>
            ✂
          </text>
        )}
        {(i === s || i === t) && (
          <text textAnchor="middle" y={-R - 7} fontSize="10" fontWeight="700" fill="#2563eb" letterSpacing="0.5">
            {i === s ? 'SOURCE' : 'SINK'}
          </text>
        )}
        {badge && (
          // Above a vertex in the upper half (clear of the pipes between stacked vertices), below otherwise.
          <g transform={`translate(0, ${p.y < H / 2 - 10 && i !== s && i !== t ? -R - 12 : R + 12})`}>
            <rect x={-26} y={-8} width={52} height={16} rx={8} fill="#ffffff" stroke={semColor('compare')} strokeWidth={1} />
            <text textAnchor="middle" y={4} fontSize="10" fontWeight="700" fill={semColor('compare', 'ink')}>
              {badge}
            </text>
          </g>
        )}
      </g>
    );
  };

  const marker = (id: string, color: string) => (
    <marker id={`flow-arrow-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" style={{ fill: color }} />
    </marker>
  );

  // ── Panel under the drawing ──
  const chip = (text: string, tone: 'compare' | 'current' | 'pruned' | 'decision', key: string) => (
    <span
      key={key}
      className="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-mono font-bold"
      style={{ background: semColor(tone, 'accent', 0.12), borderColor: semColor(tone), color: semColor(tone, 'ink') }}
    >
      {text}
    </span>
  );
  const frontier = search?.frontier ?? [];

  return (
    <div className={`w-full flex flex-col gap-2 ${compact ? 'max-w-xl' : 'max-w-2xl'}`} data-flow-network-graph data-search-kind={search?.kind}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Residual graph with the augmenting-path search">
        <defs>
          {marker('pipe', PIPE)}
          {marker('flow', semColor('decision'))}
          {marker('cut', semColor('final'))}
          {marker('reverse', semColor('backtrack'))}
        </defs>
        {/* Search tree (parent links) under everything, then the current route on top of it */}
        <g opacity={0.35}>{underlay(treeHops, semColor('compare'), 9, 'tree')}</g>
        <g opacity={0.45}>{underlay(routeHops, semColor('current'), 9, 'route')}</g>
        {log.length > 0 && <g opacity={0.35}>{underlay(augmentHops, semColor('decision'), 9, 'aug', logParts)}</g>}
        {pipes}
        {probeLine}
        {labels}
        {nodes.map((_, i) => renderNode(i))}
        {badges}
      </svg>

      {search && (
        <div className="flex flex-col gap-1.5 px-1 text-[11px] font-mono text-slate-700" data-search-panel>
          {exploring && (
            <div className="flex flex-wrap items-center gap-1.5" data-frontier={isDfs ? 'stack' : 'queue'}>
              <span className="font-bold uppercase tracking-wider text-slate-500 w-[120px] shrink-0">
                {isDfs ? 'Stack (route):' : 'Queue (front →):'}
              </span>
              {frontier.length === 0 && <span className="italic text-slate-400">empty</span>}
              {frontier.map((v, i) =>
                chip(
                  isDfs ? label(v) : `${label(v)} · ring ${search.depth[v]}`,
                  isDfs && i === frontier.length - 1 ? 'current' : 'compare',
                  `f-${v}-${i}`,
                ),
              )}
              {isDfs && frontier.length > 0 && <span className="text-slate-400">← top</span>}
            </div>
          )}
          {exploring && !isDfs && Object.keys(search.parent).length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold uppercase tracking-wider text-slate-500 w-[120px] shrink-0">Parent links:</span>
              {Object.entries(search.parent).map(([v, u]) => (
                <span key={`par-${v}`} className="text-slate-600">
                  {label(v)}←{label(u)}
                </span>
              ))}
            </div>
          )}
          {exploring && isDfs && search.deadEnds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold uppercase tracking-wider text-slate-500 w-[120px] shrink-0">Dead ends:</span>
              {search.deadEnds.map((v) => chip(`✂ ${label(v)}`, 'pruned', `d-${v}`))}
            </div>
          )}
          {log.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" data-augment-log>
              <span className="font-bold uppercase tracking-wider text-slate-500 w-[120px] shrink-0">This push:</span>
              {log.map((e) => (
                <span key={`log-${e.u}-${e.v}`} className="text-slate-700">
                  {label(e.u)}→{label(e.v)}{' '}
                  {e.undo > 0 ? (
                    <b style={{ color: semColor('backtrack', 'ink') }}>
                      ↩{e.undo} sent back{e.forward > 0 ? ` +${e.forward}` : ''}
                    </b>
                  ) : (
                    <b style={{ color: semColor('decision', 'ink') }}>+{e.forward}</b>
                  )}
                  ;
                </span>
              ))}
            </div>
          )}
          {(st.pathHistory?.length ?? 0) > 0 && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1" data-path-history>
              <span className="font-bold uppercase tracking-wider text-slate-500 w-[120px] shrink-0">Paths so far:</span>
              {st.pathHistory.map((p, i) => (
                <span key={`h-${i}`} className="text-slate-600">
                  {i + 1}) {p.path.map(label).join('')} <b className="text-slate-800">+{p.bottleneck}</b>
                  {p.usesReverse && <b style={{ color: semColor('backtrack', 'ink') }}> ↩</b>}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10.5px] text-slate-500 border-t border-slate-200">
            <span className="flex items-center gap-1">
              <span className="w-4 h-0 border-t-2" style={{ borderColor: semColor('decision') }} /> pipe f/c
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: semColor('backtrack') }} /> ↩ reverse edge (flow that can be sent back)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: semColor('compare', 'accent', 0.35) }} /> {isDfs ? 'visited' : 'found + parent link'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: semColor('current', 'accent', 0.45) }} /> {isDfs ? 'stack / path' : 'traced path'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
