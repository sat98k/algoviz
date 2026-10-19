import React, { useRef } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases, useHeldValue, useProgress, useTweened } from './useAnimPhases';

/**
 * 🚰 Water pipes story for the three max-flow algorithms.
 *
 * - Pipes are real pipes: thickness = capacity, blue water inside = flow.
 * - Ford-Fulkerson / Edmonds-Karp: a scout droplet finds a route, the narrowest pipe
 *   glows, then a surge of water flows along the route and the pipes fill.
 *   Edmonds-Karp's search spreads out as ripples, nearest tanks first (BFS).
 * - Push-Relabel: tanks stand on stilts at their height; water only pours downhill,
 *   and a jack lifts an overflowing tank that has no downhill pipe with room.
 */

type Pt = { x: number; y: number };
type Pipe = { u: number; v: number; cap: number; p0: Pt; c: Pt; p2: Pt };

const W = 760;
const BASE_H = 380;
/** Push-Relabel needs vertical room: tanks climb on stilts as they are relabelled. */
const PR_H = 500;

const WATER = '#38bdf8';
const WATER_DEEP = '#0284c7';
const STEEL = '#d6d3d1';
const STEEL_DARK = '#78716c';
const GOLD = '#f59e0b';

const quad = (p0: Pt, c: Pt, p2: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p2.y,
});

/** Column of each node: its BFS distance from the source along pipes (sink always last). */
function columnsOf(cap: number[][], s: number, t: number): number[] {
  const n = cap.length;
  const col = Array(n).fill(-1);
  col[s] = 0;
  const queue = [s];
  while (queue.length) {
    const u = queue.shift()!;
    for (let v = 0; v < n; v++) {
      if (cap[u][v] > 0 && col[v] === -1) {
        col[v] = col[u] + 1;
        queue.push(v);
      }
    }
  }
  const deepest = Math.max(1, ...col);
  for (let i = 0; i < n; i++) if (col[i] === -1) col[i] = Math.max(1, deepest - 1);
  // The sink sits alone at the far right, like the city at the end of the water main.
  const last = Math.max(...col.filter((_, i) => i !== t), 0) + 1;
  col[t] = last;
  return col;
}

function buildPipes(cap: number[][], pos: Pt[], arch: (u: number, v: number) => number = () => 0): Pipe[] {
  const pipes: Pipe[] = [];
  const n = cap.length;
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      if (cap[u][v] <= 0) continue;
      const p0 = pos[u];
      const p2 = pos[v];
      const dx = p2.x - p0.x;
      const dy = p2.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      // Two pipes between the same tanks bow apart so both stay visible.
      const bend = cap[v][u] > 0 ? 26 : 0;
      // A pipe that skips over other tanks arches above them instead of running through them.
      const c = { x: (p0.x + p2.x) / 2 + (-dy / len) * bend, y: (p0.y + p2.y) / 2 + (dx / len) * bend - arch(u, v) };
      pipes.push({ u, v, cap: cap[u][v], p0, c, p2 });
    }
  }
  return pipes;
}

/** Point along a route of tanks, following the pipe used for each hop. */
function pointOnRoute(route: number[], pipes: Pipe[], pos: Pt[], p: number): Pt {
  const hops = route.length - 1;
  if (hops <= 0) return pos[route[0]];
  const f = Math.min(hops - 1e-6, Math.max(0, p) * hops);
  const h = Math.floor(f);
  const t = f - h;
  const a = route[h];
  const b = route[h + 1];
  const fwd = pipes.find((pp) => pp.u === a && pp.v === b);
  if (fwd) return quad(fwd.p0, fwd.c, fwd.p2, t);
  const back = pipes.find((pp) => pp.u === b && pp.v === a);
  if (back) return quad(back.p0, back.c, back.p2, 1 - t);
  return { x: pos[a].x + (pos[b].x - pos[a].x) * t, y: pos[a].y + (pos[b].y - pos[a].y) * t };
}

const Droplet: React.FC<{ at: Pt; scale?: number; color?: string }> = ({ at, scale = 1, color = WATER_DEEP }) => (
  <g transform={`translate(${at.x}, ${at.y}) scale(${scale})`} pointerEvents="none">
    <path d="M0,-11 C5,-4 8,0 8,4 A8,8 0 0 1 -8,4 C-8,0 -5,-4 0,-11 Z" fill={color} stroke="#ffffff" strokeWidth="1.5" />
    <ellipse cx="-2.5" cy="2" rx="2" ry="3" fill="#ffffff" opacity="0.55" />
  </g>
);

export const WaterPipesScene: React.FC<StorySceneProps> = ({ step, algorithmId, stepMs }) => {
  const st: any = step.state || {};
  const nodes: { id: string; label: string }[] = st.nodes || [];
  const cap: number[][] = st.capacityMatrix || [];
  const n = nodes.length;
  const s = Number(st.source ?? 0);
  const t = Number(st.sink ?? Math.max(0, n - 1));
  const isPR = algorithmId === 'push-relabel' || !!st.isPushRelabel;
  const phaseName: string = st.phase || '';
  const route: number[] = (st.currentAugmentingPath || []).map(Number);
  const label = (i: number) => nodes[i]?.label ?? `${i}`;
  const routeText = route.map(label).join(' → ');

  // ── Animation phases (strict cause → effect order) ──
  const phases: readonly (readonly [string, number])[] = isPR
    ? phaseName === 'push'
      ? [['pour', 0], ['settle', 0.5]]
      : phaseName === 'relabel'
      ? [['jack', 0], ['lift', 0.35]]
      : [['idle', 0]]
    : route.length && (phaseName === 'bfs' || phaseName === 'path_found')
    ? [['scout', 0], ['bottleneck', 0.5]]
    : phaseName === 'augment'
    ? [['surge', 0], ['filled', 0.5]]
    : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  const flow = useHeldValue<number[][]>(st.flowMatrix || [], phase !== 'surge' && phase !== 'pour');
  const excessRec = useHeldValue<Record<string, number>>(st.excess || {}, phase !== 'pour');
  const heightRec = useHeldValue<Record<string, number>>(st.heights || {}, phase !== 'jack');
  const travelling = phase === 'scout' || phase === 'surge' || phase === 'pour';
  const progress = useProgress(travelling, stepMs * 0.45, `${step.stepIndex}-${phase}`);

  // ── Layout ──
  const col = n ? columnsOf(cap, s, t) : [];
  const cols = Math.max(1, ...col);
  const colX = (c: number) => 80 + (c * (W - 160)) / cols;
  const members = (c: number) => col.map((cc, i) => (cc === c ? i : -1)).filter((i) => i >= 0);
  const H = isPR ? PR_H : BASE_H;
  const GROUND = H - 24;
  // Push-Relabel: the height scale only ever grows, so tanks never jump when another one climbs.
  const heightList = nodes.map((_, i) => heightRec[`${i}`] ?? 0);
  const topRef = useRef(0);
  topRef.current = Math.max(topRef.current, n + 1, ...heightList);
  const maxH = isPR ? topRef.current : Math.max(2 * n - 1, 1);
  const PR_FLOOR = GROUND - 72; // a tank at height 0 still stands on visible stilts
  const unit = Math.min(42, (PR_FLOOR - 76) / Math.max(1, maxH));
  const tweenedHeights = useTweened(heightList, 700);
  // Every tank gets its own slot, left to right in pipe order (source first, sink last).
  const rank = nodes.map((_, i) => i).sort((a, b) => col[a] - col[b] || a - b);
  const slotOf: number[] = [];
  rank.forEach((node, k) => (slotOf[node] = k));

  const pos: Pt[] = nodes.map((_, i) => {
    if (isPR) {
      return {
        x: 70 + (slotOf[i] * (W - 140)) / Math.max(1, n - 1),
        y: PR_FLOOR - tweenedHeights[i] * unit,
      };
    }
    const group = members(col[i]);
    const k = group.indexOf(i);
    const gap = Math.min(130, (H - 90) / Math.max(1, group.length));
    return { x: colX(col[i]), y: H / 2 + (k - (group.length - 1) / 2) * gap };
  });
  // Pipes skipping over tanks take turns arching above and dipping below them, so they never tangle.
  const skipArch = (u: number, v: number) => {
    const span = Math.abs(slotOf[u] - slotOf[v]);
    if (span <= 1) return 0;
    const depth = 64 + (span - 2) * 34;
    return Math.min(slotOf[u], slotOf[v]) % 2 === 0 ? depth : -depth;
  };
  const pipes = n ? buildPipes(cap, pos, isPR ? skipArch : undefined) : [];
  const maxCap = Math.max(1, ...pipes.map((p) => p.cap));

  // ── Highlights ──
  const onRoute = (u: number, v: number) =>
    route.some((a, i) => i < route.length - 1 && ((a === u && route[i + 1] === v) || (a === v && route[i + 1] === u)));
  const bottleneck = st.bottleneckCapacity as number | undefined;
  const residual: number[][] = st.residualMatrix || [];
  let bottleneckHop: [number, number] | null = null;
  if (route.length > 1 && bottleneck !== undefined && phaseName !== 'augment') {
    for (let i = 0; i < route.length - 1; i++) {
      if (residual[route[i]]?.[route[i + 1]] === bottleneck) {
        bottleneckHop = [route[i], route[i + 1]];
        break;
      }
    }
  }
  const isBottleneckPipe = (p: Pipe) =>
    !!bottleneckHop &&
    ((p.u === bottleneckHop[0] && p.v === bottleneckHop[1]) || (p.u === bottleneckHop[1] && p.v === bottleneckHop[0])) &&
    phase === 'bottleneck';

  /** How the current route uses a pipe: forwards (fill it) or backwards (undo water already in it). */
  const hopOf = (p: Pipe): { room: number; backward: boolean } | null => {
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i];
      const b = route[i + 1];
      if (a === p.u && b === p.v) return { room: residual[a]?.[b] ?? 0, backward: false };
      if (a === p.v && b === p.u && !(cap[a]?.[b] > 0)) return { room: residual[a]?.[b] ?? 0, backward: true };
    }
    return null;
  };
  // Spare room on each hop of the route, before the water is sent.
  const routeHops = route.slice(0, -1).map((a, i) => ({ a, b: route[i + 1], room: residual[a]?.[route[i + 1]] ?? 0 }));

  const visited: string[] = st.bfsVisited || [];
  const queue: string[] = st.bfsQueue || [];
  const bfsCurrent: string | undefined =
    phaseName === 'bfs_explore' && step.highlights?.activeNode !== undefined ? `${step.highlights.activeNode}` : undefined;
  const prFrom = st.currentVertex !== undefined ? Number(st.currentVertex) : -1;
  const prTo = st.targetVertex !== undefined ? Number(st.targetVertex) : -1;

  const intoSink = pipes.filter((p) => p.v === t).reduce((a, p) => a + p.cap, 0) || 1;
  const outOfSource = pipes.filter((p) => p.u === s).reduce((a, p) => a + p.cap, 0) || 1;
  const delivered = isPR ? excessRec[`${t}`] ?? 0 : (flow[s] || []).reduce((a, f) => a + Math.max(0, f), 0);

  // ── Narration ──
  const narration = (() => {
    if (step.isFinal || phaseName === 'complete') {
      return isPR
        ? `Every tank has drained its extra water. The city ${label(t)} now receives ${delivered} litres per second, which is the most these pipes can carry.`
        : `No route to the city has spare room left: every way through is blocked by at least one full pipe. The city ${label(t)} gets ${st.totalMaxFlow ?? delivered} litres per second, the most possible.`;
    }
    if (isPR) {
      if (phaseName === 'init' && step.stepIndex === 0)
        return `Each tank stands on stilts. Water can only roll downhill, one step at a time. The water tower ${label(s)} is lifted high so water can start flowing.`;
      if (phaseName === 'init')
        return `The tower ${label(s)} opens every valve at once and floods its neighbours. They now hold more water than they can pass on: they are overflowing.`;
      if (phaseName === 'push')
        return `${label(prFrom)} has extra water and ${label(prTo)} stands one step lower, so water pours down the pipe from ${label(prFrom)} into ${label(prTo)}.`;
      if (phaseName === 'relabel')
        return `${label(prFrom)} is overflowing, but no pipe with room goes downhill from it. A jack lifts ${label(prFrom)} higher so the water can roll down again.`;
      return step.title;
    }
    if (phaseName === 'bfs_explore') {
      return step.stepIndex === 0
        ? `Water waits in the tower ${label(s)}. Every pipe is empty. Let's push as much water as we can to the city ${label(t)}.`
        : `A scout spreads out like ripples on a pond, checking the closest tanks first. Now it looks around ${label(Number(bfsCurrent))} for pipes that still have room.`;
    }
    if (route.length && phaseName !== 'augment') {
      return phase === 'scout'
        ? `A scout droplet looks for a route with spare room: ${routeText}.`
        : `On the route ${routeText}, the narrowest pipe has room for only ${bottleneck} more litres, so that's all this route can add.`;
    }
    if (phaseName === 'augment') {
      return phase === 'surge'
        ? `Water rushes along ${routeText}…`
        : `The pipes on ${routeText} fill up. The city now receives ${st.totalMaxFlow} litres per second.`;
    }
    return `Water waits in the tower ${label(s)}. Every pipe is empty. Let's push as much water as we can to the city ${label(t)}.`;
  })();

  const status =
    step.isFinal || phaseName === 'complete'
      ? `Most water possible • ${delivered} L/s`
      : `Reaching the city • ${delivered} L/s`;

  // ── Drawing helpers ──
  const pipePath = (p: Pipe) => `M ${p.p0.x} ${p.p0.y} Q ${p.c.x} ${p.c.y} ${p.p2.x} ${p.p2.y}`;

  type TagTone = 'plain' | 'full' | 'room' | 'surge' | 'undo';
  const tagQueue: {
    id: string;
    at: Pt;
    out: Pt;
    w: number;
    tag: { text: string; tone: TagTone };
    style: { fill: string; stroke: string; ink: string };
  }[] = [];

  const renderPipe = (p: Pipe) => {
    const casing = 8 + (14 * p.cap) / maxCap;
    const f = Math.max(0, Math.min(p.cap, flow[p.u]?.[p.v] ?? 0));
    const water = f > 0 ? Math.max(2.5, (casing - 4) * (f / p.cap)) : 0;
    const full = f >= p.cap && p.cap > 0;
    const glow = isBottleneckPipe(p);
    const lit = onRoute(p.u, p.v) && (phase === 'scout' || phase === 'bottleneck' || phase === 'surge');
    const mid = quad(p.p0, p.c, p.p2, 0.5);
    const ahead = quad(p.p0, p.c, p.p2, 0.56);
    const ang = (Math.atan2(ahead.y - mid.y, ahead.x - mid.x) * 180) / Math.PI;

    // Tag beside the pipe: on the side it bows to, otherwise underneath.
    const dx = p.p2.x - p.p0.x;
    const dy = p.p2.y - p.p0.y;
    const len = Math.hypot(dx, dy) || 1;
    let out = { x: -dy / len, y: dx / len };
    if (cap[p.v]?.[p.u] <= 0 && out.y < 0) out = { x: -out.x, y: -out.y };
    const tagAt = { x: mid.x + out.x * (casing / 2 + 16), y: mid.y + out.y * (casing / 2 + 16) };
    const badgeAt = { x: mid.x - out.x * (casing / 2 + 24), y: mid.y - out.y * (casing / 2 + 24) };
    const hop = hopOf(p);
    const tag: { text: string; tone: 'plain' | 'full' | 'room' | 'surge' | 'undo' } | null = (() => {
      if (isPR) {
        // Only pipes holding water, or the one being poured into right now, get a tag: the rest stay quiet.
        const pouring = phaseName === 'push' && ((p.u === prFrom && p.v === prTo) || (p.u === prTo && p.v === prFrom));
        if (f <= 0 && !pouring) return null;
        return { text: full ? `full ${f}/${p.cap}` : `${f} / ${p.cap}`, tone: full ? 'full' : pouring ? 'surge' : 'plain' };
      }
      if (hop && phase === 'bottleneck') return { text: `room +${hop.room}`, tone: 'room' };
      if (hop && phase === 'surge' && bottleneck !== undefined)
        return hop.backward ? { text: `undo −${bottleneck}`, tone: 'undo' } : { text: `+${bottleneck}`, tone: 'surge' };
      return { text: full ? `full ${f}/${p.cap}` : `${f} / ${p.cap}`, tone: full ? 'full' : 'plain' };
    })();
    const tagStyle = {
      plain: { fill: '#ffffff', stroke: '#d6d3d1', ink: '#44403c' },
      full: { fill: '#fee2e2', stroke: '#f87171', ink: '#991b1b' },
      room: { fill: '#fffbeb', stroke: GOLD, ink: '#78350f' },
      surge: { fill: '#e0f2fe', stroke: WATER_DEEP, ink: '#075985' },
      undo: { fill: '#f5f3ff', stroke: '#8b5cf6', ink: '#5b21b6' },
    }[tag?.tone ?? 'plain'];
    const tagW = (tag?.text.length ?? 0) * 7.6 + 16;
    // The tag is drawn later, above the tanks, by renderTags.
    if (tag) tagQueue.push({ id: `${p.u}-${p.v}`, at: tagAt, out, w: tagW, tag, style: tagStyle });
    return (
      <g key={`pipe-${p.u}-${p.v}`} data-pipe={`${p.u}-${p.v}`}>
        {(glow || lit) && (
          <path d={pipePath(p)} fill="none" stroke={glow ? GOLD : '#fde68a'} strokeWidth={casing + (glow ? 12 : 7)} strokeLinecap="round" opacity={glow ? 0.9 : 0.7} />
        )}
        <path d={pipePath(p)} fill="none" stroke={STEEL_DARK} strokeWidth={casing + 3} strokeLinecap="round" />
        <path d={pipePath(p)} fill="none" stroke={STEEL} strokeWidth={casing} strokeLinecap="round" />
        <path
          d={pipePath(p)}
          fill="none"
          stroke={WATER}
          strokeWidth={water}
          strokeLinecap="round"
          style={{ transition: 'stroke-width 0.9s ease-in-out' }}
        />
        {water > 0 && (
          <path
            d={pipePath(p)}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.6"
            strokeWidth={Math.max(1, water * 0.3)}
            strokeDasharray="8 10"
            className="animate-flow-dash"
          />
        )}
        <g transform={`translate(${mid.x}, ${mid.y}) rotate(${ang})`}>
          <path d="M -5 -5 L 3 0 L -5 5" fill="none" stroke={STEEL_DARK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
        {/* flow / capacity tag (room or surge while a route is being used) */}
        {glow && (
          // Position on the outer group: the pop animation's CSS transform would override it.
          <g transform={`translate(${badgeAt.x}, ${badgeAt.y})`}>
            <g className="animate-story-pop">
              <rect x="-92" y="-14" width="184" height="28" rx="14" fill={GOLD} stroke="#b45309" strokeWidth="1.5" />
              <text textAnchor="middle" y="5" fontSize="14" fontWeight="800" fill="#451a03">
                bottleneck: only +{bottleneck} fits
              </text>
            </g>
          </g>
        )}
      </g>
    );
  };

  /** Draws the pipe tags on top of everything, nudging each one clear of tanks and earlier tags. */
  const renderTags = () => {
    const placed: { x0: number; x1: number; y0: number; y1: number }[] = pos.map((q) => ({ x0: q.x - 30, x1: q.x + 30, y0: q.y - 28, y1: q.y + 26 }));
    const hits = (b: { x0: number; x1: number; y0: number; y1: number }) => placed.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
    return tagQueue.map((q) => {
      let at = q.at;
      const box = (a: Pt) => ({ x0: a.x - q.w / 2 - 3, x1: a.x + q.w / 2 + 3, y0: a.y - 13, y1: a.y + 13 });
      for (let k = 0; k < 8 && hits(box(at)); k++) at = { x: at.x + q.out.x * 12, y: at.y + q.out.y * 12 };
      placed.push(box(at));
      const { tag, style } = q;
      return (
        <g key={`tag-${q.id}`} transform={`translate(${at.x}, ${at.y})`} data-pipe-tag={q.id}>
          <g key={`${tag.tone}-${phase}`} className={tag.tone === 'room' || tag.tone === 'surge' || tag.tone === 'undo' ? 'animate-story-pop' : undefined}>
            <rect x={-q.w / 2} y="-11" width={q.w} height="22" rx="11" fill={style.fill} stroke={style.stroke} strokeWidth="1.3" />
            <text textAnchor="middle" y="4.5" fontSize="13" fontWeight="800" fill={style.ink}>
              {tag.text}
            </text>
          </g>
        </g>
      );
    });
  };

  const renderJunction = (i: number) => {
    const p = pos[i];
    const id = `${i}`;
    const isVisited = visited.includes(id);
    const isCurrent = bfsCurrent === id;
    if (i === s) {
      // Water tower
      return (
        <g key={`node-${i}`} transform={`translate(${p.x}, ${p.y})`}>
          <line x1="-16" y1="22" x2="-22" y2="54" stroke="#92400e" strokeWidth="4" />
          <line x1="16" y1="22" x2="22" y2="54" stroke="#92400e" strokeWidth="4" />
          <rect x="-28" y="-26" width="56" height="50" rx="8" fill="#e0f2fe" stroke={STEEL_DARK} strokeWidth="2.5" />
          <rect x="-25" y="-16" width="50" height="37" rx="5" fill={WATER} />
          <path d="M -32 -26 L 0 -44 L 32 -26 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <text textAnchor="middle" y="7" fontSize="15" fontWeight="800" fill="#ffffff">
            {label(i)}
          </text>
          {isCurrent && <circle r="30" fill="none" stroke={WATER_DEEP} strokeWidth="3" className="animate-story-ripple" />}
        </g>
      );
    }
    if (i === t) {
      // City basin filling up
      const level = Math.min(1, delivered / intoSink);
      return (
        <g key={`node-${i}`} transform={`translate(${p.x}, ${p.y})`}>
          <text textAnchor="middle" y="-34" fontSize="30">
            🏙️
          </text>
          <rect x="-30" y="-20" width="60" height="44" rx="10" fill="#f5f5f4" stroke={STEEL_DARK} strokeWidth="2.5" />
          <rect
            x="-27"
            y={21 - 38 * level}
            width="54"
            height={38 * level}
            rx="6"
            fill={WATER}
            style={{ transition: 'all 0.9s ease-in-out' }}
          />
          <text textAnchor="middle" y="7" fontSize="15" fontWeight="800" fill="#1c1917">
            {label(i)}
          </text>
        </g>
      );
    }
    return (
      <g key={`node-${i}`} transform={`translate(${p.x}, ${p.y})`}>
        {isCurrent && <circle r="24" fill="none" stroke={WATER_DEEP} strokeWidth="3" className="animate-story-ripple" />}
        <circle r="23" fill="#f5f5f4" stroke={isVisited ? WATER_DEEP : STEEL_DARK} strokeWidth={isVisited ? 4 : 2.5} strokeDasharray={isVisited && !isCurrent ? '5 3' : undefined} />
        <circle r="15" fill={isVisited ? '#e0f2fe' : '#fafaf9'} stroke="#d6d3d1" />
        <text textAnchor="middle" y="5" fontSize="14" fontWeight="800" fill="#1c1917">
          {label(i)}
        </text>
      </g>
    );
  };

  const renderTank = (i: number) => {
    const p = pos[i];
    const id = `${i}`;
    const ex = excessRec[id] ?? 0;
    const overflowing = (st.overflowingNodes || []).includes(id) && i !== s && i !== t;
    const isActive = i === prFrom && phaseName !== 'complete';
    const level =
      i === s ? 1 : i === t ? Math.min(1, Math.max(0, ex) / intoSink) : Math.min(1, Math.max(0, ex) / outOfSource) ;
    const showJack = isActive && phaseName === 'relabel';
    const stiltTop = p.y + 22;
    return (
      <g key={`tank-${i}`}>
        {/* stilts down to the ground */}
        <line x1={p.x - 15} y1={stiltTop} x2={p.x - 19} y2={GROUND} stroke="#a16207" strokeWidth="3.5" />
        <line x1={p.x + 15} y1={stiltTop} x2={p.x + 19} y2={GROUND} stroke="#a16207" strokeWidth="3.5" />
        {showJack && (
          <g className="animate-story-pop">
            <polyline
              points={`${p.x - 12},${GROUND} ${p.x + 12},${(GROUND + stiltTop) / 2 + 8} ${p.x - 12},${(GROUND + stiltTop) / 2 - 8} ${p.x + 12},${stiltTop + 2}`}
              fill="none"
              stroke="#eab308"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <rect x={p.x - 16} y={GROUND - 6} width="32" height="6" rx="2" fill="#a16207" />
          </g>
        )}
        <g transform={`translate(${p.x}, ${p.y})`}>
          {i === t && (
            <text textAnchor="middle" y="-32" fontSize="26">
              🏙️
            </text>
          )}
          {i === s && <path d="M -30 -24 L 0 -42 L 30 -24 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />}
          <rect x="-26" y="-24" width="52" height="46" rx="8" fill="#f5f5f4" stroke={isActive ? GOLD : STEEL_DARK} strokeWidth={isActive ? 4 : 2.5} />
          <rect
            x="-23"
            y={19 - 40 * level}
            width="46"
            height={40 * level}
            rx="5"
            fill={WATER}
            style={{ transition: 'all 0.8s ease-in-out' }}
          />
          <text textAnchor="middle" y="5" fontSize="14" fontWeight="800" fill={level > 0.55 ? '#ffffff' : '#1c1917'}>
            {label(i)}
          </text>
          {overflowing && (
            <g className="animate-story-bob">
              <Droplet at={{ x: 30, y: -12 }} scale={0.6} />
              <text x="30" y="-28" textAnchor="middle" fontSize="9" fontWeight="700" fill={WATER_DEEP}>
                extra!
              </text>
            </g>
          )}
        </g>
      </g>
    );
  };

  // Scouts / water convoy travelling along a route
  const travellers: React.ReactNode[] = [];
  if (!isPR && route.length > 1 && (phase === 'scout' || phase === 'surge')) {
    const count = phase === 'surge' ? 4 : 1;
    for (let k = 0; k < count; k++) {
      const pk = Math.max(0, Math.min(1, progress * 1.3 - k * 0.1));
      if (pk >= 1) continue; // arrived: it has joined the tank
      travellers.push(<Droplet key={`d-${k}`} at={pointOnRoute(route, pipes, pos, pk)} scale={phase === 'scout' ? 1.15 : 0.85} color={phase === 'scout' ? '#0369a1' : WATER_DEEP} />);
    }
  }
  if (isPR && phase === 'pour' && prFrom >= 0 && prTo >= 0) {
    for (let k = 0; k < 3; k++) {
      const pk = Math.max(0, Math.min(1, progress * 1.25 - k * 0.12));
      if (pk >= 1) continue;
      travellers.push(<Droplet key={`d-${k}`} at={pointOnRoute([prFrom, prTo], pipes, pos, pk)} scale={0.8} />);
    }
  }

  return (
    <StoryStage
      emoji="🚰"
      title={isPR ? 'Water Tanks on Stilts' : algorithmId === 'edmonds-karp' ? 'Water Pipes & Ripple Scouts' : 'Water Pipes to the City'}
      subtitle={
        isPR
          ? 'Water only rolls downhill. Overflowing tanks get lifted higher.'
          : 'Thicker pipe = carries more water. Blue inside = water flowing now.'
      }
      narration={narration}
      status={status}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label="Water pipe network">
        <defs>
          <linearGradient id="storySky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdfaf5" />
            <stop offset="100%" stopColor="#f3eadc" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} rx="18" fill="url(#storySky)" />
        <rect x="0" y={GROUND} width={W} height={H - GROUND} rx="0" fill="#e4d2bc" />
        <line x1="0" y1={GROUND} x2={W} y2={GROUND} stroke="#c8b090" strokeWidth="2" />

        {isPR &&
          Array.from({ length: maxH + 1 }, (_, h) => (
            <g key={`tick-${h}`} opacity="0.55">
              <line x1="10" y1={PR_FLOOR - h * unit} x2={W - 10} y2={PR_FLOOR - h * unit} stroke="#e7dccb" strokeDasharray="2 8" />
            </g>
          ))}

        {pipes.map(renderPipe)}
        {nodes.map((_, i) => (isPR ? renderTank(i) : renderJunction(i)))}
        {renderTags()}
        {travellers}
      </svg>

      {!isPR && route.length > 1 && (phase === 'bottleneck' || phase === 'surge' || phase === 'filled') && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 font-sans text-xs text-stone-700" data-route-summary>
          <span className="font-semibold uppercase tracking-wider text-stone-500 mr-1">This route:</span>
          {phase === 'bottleneck' ? (
            <>
              {routeHops.map((h, i) => (
                <React.Fragment key={`hop-${i}`}>
                  <span className="font-bold text-stone-900">{label(h.a)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full border font-bold ${
                      h.room === bottleneck ? 'bg-amber-400 border-amber-600 text-amber-950' : 'bg-white border-stone-300 text-stone-600'
                    }`}
                  >
                    room {h.room} →
                  </span>
                </React.Fragment>
              ))}
              <span className="font-bold text-stone-900">{label(route[route.length - 1])}</span>
              <span className="ml-1">
                The smallest room is <b>{bottleneck}</b>, so only <b>+{bottleneck}</b> can flow.
              </span>
            </>
          ) : (
            <span>
              Sending <b>+{bottleneck}</b> litres/s along <b>{routeText}</b>.
            </span>
          )}
        </div>
      )}

      {algorithmId === 'edmonds-karp' && phaseName === 'bfs_explore' && (
        <div className="flex flex-wrap items-center gap-2 mt-3 font-sans text-xs text-stone-600">
          <span className="font-semibold uppercase tracking-wider text-stone-500">Scouts waiting in line:</span>
          {queue.length === 0 && <span className="italic">nobody</span>}
          {queue.map((q, i) => (
            <span
              key={`${q}-${i}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-300 text-sky-900 font-bold animate-story-pop"
            >
              💧 {label(Number(q))}
            </span>
          ))}
        </div>
      )}
    </StoryStage>
  );
};
