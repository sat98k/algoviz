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
type Curve = { p0: Pt; c: Pt; p2: Pt };
type Box = { x0: number; x1: number; y0: number; y1: number };
type Pipe = Curve & {
  u: number;
  v: number;
  cap: number;
  /** Push-Relabel: casing size (largest capacity of the pair), so a pipe never swells when its water turns round. */
  size?: number;
  /** Push-Relabel: water may run either way through this pipe. */
  twoWay?: boolean;
  /** Push-Relabel: where the pipe settles once the tanks stop moving (tags are placed against this). */
  rest?: Curve;
};

const W = 760;
const BASE_H = 380;
/** Push-Relabel needs vertical room: tanks climb on stilts as they are relabelled. */
const PR_H = 500;
/** ...and horizontal room for the level ruler on the left. */
const PR_W = 860;
const RULER_X = 34;
/** Room a tank takes below its centre: its body plus the level plaque hung under it. */
const TANK_BOTTOM = 58;

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

/** One pipe per direction. `bow` lifts (negative) or drops a single pipe's middle so it clears the tanks it passes. */
function buildPipes(cap: number[][], pos: Pt[], bow: (u: number, v: number) => number): Pipe[] {
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
      const c = { x: (p0.x + p2.x) / 2 + (-dy / len) * bend, y: (p0.y + p2.y) / 2 + (bend ? (dx / len) * bend : bow(u, v)) };
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
  const SW = isPR ? PR_W : W;
  const GROUND = H - 24;
  // Push-Relabel: the height scale only ever grows, so tanks never jump when another one climbs.
  const heightList = nodes.map((_, i) => heightRec[`${i}`] ?? 0);
  const topRef = useRef(0);
  topRef.current = Math.max(topRef.current, n + 1, ...heightList);
  const maxH = isPR ? topRef.current : Math.max(2 * n - 1, 1);
  const PR_FLOOR = GROUND - 80; // a tank at level 0 still stands on visible stilts, with its plaque above the ground
  const unit = Math.min(42, (PR_FLOOR - 80) / Math.max(1, maxH));
  const levelY = (h: number) => PR_FLOOR - h * unit;
  const tweenedHeights = useTweened(heightList, 700);
  // Every tank gets its own slot, left to right in pipe order (source first, sink last).
  const rank = nodes.map((_, i) => i).sort((a, b) => col[a] - col[b] || a - b);
  const slotOf: number[] = [];
  rank.forEach((node, k) => (slotOf[node] = k));
  // Push-Relabel tanks never move sideways: only up and down, so the eye can follow each one.
  const prX = (i: number) => 112 + (slotOf[i] * (SW - 172)) / Math.max(1, n - 1);

  const pos: Pt[] = nodes.map((_, i) => {
    if (isPR) return { x: prX(i), y: levelY(tweenedHeights[i]) };
    const group = members(col[i]);
    const k = group.indexOf(i);
    const gap = Math.min(130, (H - 90) / Math.max(1, group.length));
    return { x: colX(col[i]), y: H / 2 + (k - (group.length - 1) / 2) * gap };
  });
  const restPos: Pt[] = isPR ? nodes.map((_, i) => ({ x: prX(i), y: levelY(heightList[i]) })) : pos;

  /** Room a tank or junction takes above its centre: the source's roof and the city's skyline need more. */
  const tankTop = (i: number) => (isPR ? (i === s || i === t ? 64 : 54) : i === t ? 64 : i === s ? 52 : 38);
  /** ...and below it: Push-Relabel tanks carry a level plaque, the water tower stands on legs. */
  const tankBottom = (i: number) => (isPR ? TANK_BOTTOM : i === s ? 60 : 36);
  /**
   * How far a pipe's middle bows (negative = up) so it passes cleanly over or under the tanks
   * standing between its ends. Pipes with nothing in the way stay straight.
   */
  const bowFor = (a: number, b: number, at: Pt[], side?: -1 | 1): { bow: number; side: -1 | 1 } => {
    const p0 = at[a];
    const p2 = at[b];
    let up = 0;
    let down = 0;
    for (let k = 0; k < n; k++) {
      if (k === a || k === b) continue;
      const tk = (at[k].x - p0.x) / (p2.x - p0.x || 1);
      if (!(tk > 0.02 && tk < 0.98)) continue;
      const lineY = p0.y + tk * (p2.y - p0.y);
      const w = 2 * tk * (1 - tk);
      up = Math.max(up, (lineY - (at[k].y - tankTop(k))) / w);
      down = Math.max(down, (at[k].y + tankBottom(k) - lineY) / w);
    }
    const chosen = side ?? (up <= down + 20 ? -1 : 1);
    const midY = (p0.y + p2.y) / 2;
    const bow = chosen === -1 ? -up : down;
    return { bow: Math.max(2 * (24 - midY), Math.min(2 * (GROUND - 16 - midY), bow)), side: chosen };
  };
  /** Push-Relabel: one pipe per pair of tanks. Water only ever runs one way at a time, so it points the way water flows. */
  const buildTankPipes = (): Pipe[] => {
    const out: Pipe[] = [];
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        if (!(cap[a][b] > 0) && !(cap[b][a] > 0)) continue;
        const [u, v] = (flow[b]?.[a] ?? 0) > 0 || !(cap[a][b] > 0) ? [b, a] : [a, b];
        // The side (over or under) is chosen where the tanks are heading, so a pipe never flips mid-lift.
        const restBow = bowFor(a, b, restPos);
        const { bow } = bowFor(a, b, pos, restBow.side);
        const curve = (at: Pt[], bw: number): Curve => ({
          p0: at[u],
          c: { x: (at[u].x + at[v].x) / 2, y: (at[u].y + at[v].y) / 2 + bw },
          p2: at[v],
        });
        out.push({
          u,
          v,
          cap: cap[u][v],
          size: Math.max(cap[a][b], cap[b][a]),
          twoWay: cap[a][b] > 0 && cap[b][a] > 0,
          ...curve(pos, bow),
          rest: curve(restPos, restBow.bow),
        });
      }
    }
    return out;
  };
  const pipes = n ? (isPR ? buildTankPipes() : buildPipes(cap, pos, (u, v) => bowFor(u, v, pos).bow)) : [];
  const maxCap = Math.max(1, ...pipes.map((p) => p.size ?? p.cap));
  const casingOf = (p: Pipe) => 8 + (14 * (p.size ?? p.cap)) / maxCap;

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
      const levelOf = (i: number) => (st.heights || {})[`${i}`] ?? 0;
      if (phaseName === 'push')
        return `${label(prFrom)} (level ${levelOf(prFrom)}) has extra water and ${label(prTo)} stands one step lower (level ${levelOf(prTo)}), so water pours down the pipe from ${label(prFrom)} into ${label(prTo)}.`;
      if (phaseName === 'relabel')
        return `${label(prFrom)} is overflowing, but no pipe with room goes downhill from it. A jack lifts ${label(prFrom)} up to level ${levelOf(prFrom)} so the water can roll down again.`;
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
    pipe: Pipe;
    w: number;
    tag: { text: string; tone: TagTone };
    style: { fill: string; stroke: string; ink: string };
    /** The big gold "bottleneck" badge rather than a flow tag. */
    badge?: boolean;
  }[] = [];
  const isPouring = (p: Pipe) => isPR && phaseName === 'push' && ((p.u === prFrom && p.v === prTo) || (p.u === prTo && p.v === prFrom));
  const isLit = (p: Pipe) => onRoute(p.u, p.v) && (phase === 'scout' || phase === 'bottleneck' || phase === 'surge');
  /** Empty pipes are drawn first, then pipes with water, and the pipe in action on top. */
  const pipeLayer = (p: Pipe) => (isPouring(p) || isBottleneckPipe(p) || isLit(p) ? 2 : (flow[p.u]?.[p.v] ?? 0) > 0 ? 1 : 0);

  const renderPipe = (p: Pipe) => {
    const casing = casingOf(p);
    const f = Math.max(0, Math.min(p.cap, flow[p.u]?.[p.v] ?? 0));
    const water = f > 0 ? Math.max(2.5, (casing - 4) * (f / p.cap)) : 0;
    const full = f >= p.cap && p.cap > 0;
    const glow = isBottleneckPipe(p);
    const lit = isLit(p);
    // The bottleneck badge is placed before every tag, so it gets the clearest spot beside its pipe.
    if (glow)
      tagQueue.unshift({
        id: `badge-${p.u}-${p.v}`,
        pipe: p,
        w: 184,
        tag: { text: `bottleneck: only +${bottleneck} fits`, tone: 'room' },
        style: { fill: GOLD, stroke: '#b45309', ink: '#451a03' },
        badge: true,
      });
    const hop = hopOf(p);
    const tag: { text: string; tone: 'plain' | 'full' | 'room' | 'surge' | 'undo' } | null = (() => {
      if (isPR) {
        // Only pipes holding water, or the one being poured into right now, get a tag: the rest stay quiet.
        const pouring = isPouring(p);
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
    // Tags carry the pipe's direction arrow inside them, so they are a little wider than their text.
    const tagW = (tag?.text.length ?? 0) * 7.6 + 30;
    // The tag is drawn later, above the tanks, by renderTags.
    if (tag) tagQueue.push({ id: `${p.u}-${p.v}`, pipe: p, w: tagW, tag, style: tagStyle });
    const chevron = (tt: number, flip = false) => {
      const a = quad(p.p0, p.c, p.p2, tt);
      const b = quad(p.p0, p.c, p.p2, tt + 0.04);
      const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + (flip ? 180 : 0);
      return (
        <g transform={`translate(${a.x}, ${a.y}) rotate(${deg})`}>
          <path d="M -5 -5 L 3 0 L -5 5" fill="none" stroke={STEEL_DARK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    };
    return (
      <g key={`pipe-${p.u}-${p.v}`} data-pipe={`${p.u}-${p.v}`}>
        {(glow || lit) && (
          <path d={pipePath(p)} fill="none" stroke={glow ? GOLD : '#fde68a'} strokeWidth={casing + (glow ? 12 : 7)} strokeLinecap="round" opacity={glow ? 0.9 : 0.7} />
        )}
        {isPouring(p) && <path d={pipePath(p)} fill="none" stroke="#bae6fd" strokeWidth={casing + 10} strokeLinecap="round" opacity="0.9" />}
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
        {/* A tagged pipe shows its arrow inside the tag; an untagged two-way pipe shows both ways. */}
        {!tag && chevron(p.twoWay ? 0.4 : 0.48)}
        {!tag && p.twoWay && chevron(0.56, true)}
      </g>
    );
  };

  /** Draws the pipe tags on top of everything, each one just beside its own pipe and clear of everything else. */
  const renderTags = () => {
    const placed: Box[] = [
      // Keep clear of each tank or junction (with its roof / skyline / stilts, plaque and "extra!" drop)...
      ...restPos.map((q, i) =>
        isPR
          ? { x0: q.x - 32, x1: q.x + 44, y0: q.y - tankTop(i), y1: q.y + tankBottom(i) - 4 }
          : { x0: q.x - 32, x1: q.x + 32, y0: q.y - tankTop(i) + 6, y1: q.y + tankBottom(i) - 6 },
      ),
      // ...and of the level ruler.
      ...(isPR ? [{ x0: 0, x1: RULER_X + 22, y0: 0, y1: H }] : []),
    ];
    const overlaps = (b: Box, o: Box) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0;
    const hits = (b: Box) => placed.some((o) => overlaps(b, o));
    // Every pipe traced as a row of small boxes, so a tag can be kept off all of them.
    const pipeTrace: (Box & { pipe: Pipe })[] = pipes.flatMap((p) => {
      const r = p.rest ?? p;
      const half = casingOf(p) / 2 + 2;
      return Array.from({ length: 25 }, (_, k) => {
        const a = quad(r.p0, r.c, r.p2, 0.02 + k * 0.04);
        return { pipe: p, x0: a.x - half, x1: a.x + half, y0: a.y - half, y1: a.y + half };
      });
    });
    /** Where a tag sits beside its pipe: the point on the pipe, and the tag's centre just off to one side. */
    const besidePipe = (c: Curve, casing: number, w: number, hh: number, tt: number, side: number, extra: number) => {
      const on = quad(c.p0, c.c, c.p2, tt);
      const ahead = quad(c.p0, c.c, c.p2, tt + 0.02);
      const len = Math.hypot(ahead.x - on.x, ahead.y - on.y) || 1;
      const nx = -(ahead.y - on.y) / len;
      const ny = (ahead.x - on.x) / len;
      // Far enough that the pill's corner clears the pipe, whatever the pipe's slope.
      const d = casing / 2 + 5 + Math.abs(nx) * (w / 2) + Math.abs(ny) * hh + extra;
      return { on, at: { x: on.x + nx * side * d, y: on.y + ny * side * d }, ang: (Math.atan2(ahead.y - on.y, ahead.x - on.x) * 180) / Math.PI };
    };
    return tagQueue.map((q) => {
      const hh = q.badge ? 14 : 11;
      const box = (a: Pt) => ({ x0: a.x - q.w / 2 - 3, x1: a.x + q.w / 2 + 3, y0: a.y - hh - 2, y1: a.y + hh + 2 });
      // The tag sits just beside its own pipe, never on top of a pipe, a tank or another tag. In Push-Relabel
      // the spot is chosen where the tanks are heading, so it stays put while a tank is lifted.
      const r = q.pipe.rest ?? q.pipe;
      const casing = casingOf(q.pipe);
      const spot = (tt: number, side: number, extra: number, c: Curve = r) => besidePipe(c, casing, q.w, hh, tt, side, extra);
      const score = (b: Box) =>
        (hits(b) ? 100 : 0) +
        // Its own pipe is already kept at arm's length by besidePipe.
        pipeTrace.filter((o) => o.pipe !== q.pipe && overlaps(b, o)).length +
        (b.x0 < 0 || b.x1 > SW || b.y0 < 0 || b.y1 > GROUND ? 100 : 0);
      let best = { tt: 0.5, side: 1, extra: 0, score: Infinity };
      search: for (const extra of q.badge ? [0, 16, 32, 48] : [0, 16, 32]) {
        for (const tt of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
          for (const side of [1, -1]) {
            const sc = score(box(spot(tt, side, extra).at));
            if (sc < best.score) best = { tt, side, extra, score: sc };
            if (sc === 0) break search;
          }
        }
      }
      const now = spot(best.tt, best.side, best.extra, q.pipe);
      let at = now.at;
      const { ang } = now;
      // A badge with no clear spot beside its pipe floats in the open sky above (or below) the network instead,
      // tethered to the pipe's middle, rather than covering other pipes.
      let open: Pt | null = null;
      if (q.badge && best.score > 0) {
        const mid = quad(r.p0, r.c, r.p2, 0.5);
        const x = Math.max(q.w / 2 + 8, Math.min(SW - q.w / 2 - 8, mid.x));
        open = [24, 48, 72, GROUND - 24, GROUND - 48].map((y) => ({ x, y })).find((c) => score(box(c)) === 0) ?? null;
      }
      if (open) {
        placed.push(box(open));
        at = open;
      } else placed.push(box(spot(best.tt, best.side, best.extra).at));
      const on = open ? quad(q.pipe.p0, q.pipe.c, q.pipe.p2, 0.5) : now.on;
      const leader = { x: on.x - at.x, y: on.y - at.y };
      const { tag, style } = q;
      if (q.badge)
        return (
          // Position on the outer group: the pop animation's CSS transform would override it.
          <g key={`tag-${q.id}`} transform={`translate(${at.x}, ${at.y})`} data-bottleneck-badge>
            <line x1="0" y1="0" x2={leader.x} y2={leader.y} stroke={style.stroke} strokeWidth="2" strokeDasharray="3 2" />
            <g className="animate-story-pop">
              <rect x={-q.w / 2} y="-14" width={q.w} height="28" rx="14" fill={style.fill} stroke={style.stroke} strokeWidth="1.5" />
              <text textAnchor="middle" y="5" fontSize="14" fontWeight="800" fill={style.ink}>
                {tag.text}
              </text>
            </g>
          </g>
        );
      return (
        <g key={`tag-${q.id}`} transform={`translate(${at.x}, ${at.y})`} data-pipe-tag={q.id}>
          {/* a short tether from the tag to its pipe, so it is clear which pipe it describes */}
          <line x1="0" y1="0" x2={leader.x} y2={leader.y} stroke={style.stroke} strokeWidth="1.5" strokeDasharray="2 2" />
          <g key={`${tag.tone}-${phase}`} className={tag.tone === 'room' || tag.tone === 'surge' || tag.tone === 'undo' ? 'animate-story-pop' : undefined}>
            <rect x={-q.w / 2} y="-11" width={q.w} height="22" rx="11" fill={style.fill} stroke={style.stroke} strokeWidth="1.3" />
            {/* the pipe's direction (an "undo" runs against it, so its arrow turns round) */}
            <g transform={`translate(${-q.w / 2 + 12}, 0) rotate(${ang + (tag.tone === 'undo' ? 180 : 0)})`}>
              <path d="M -4 -4.5 L 3 0 L -4 4.5" fill="none" stroke={style.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text x={7} textAnchor="middle" y="4.5" fontSize="13" fontWeight="800" fill={style.ink}>
              {tag.text}
            </text>
          </g>
        </g>
      );
    });
  };

  /** Push-Relabel: a measuring post on the left with one dashed line per level, so every tank's level reads at a glance. */
  const renderRuler = () => {
    const top = levelY(maxH);
    // Levels that matter right now: the tank working (gold) and, when pouring, the one it pours into (blue).
    const hot = new Map<number, string>();
    if ((phaseName === 'push' || phaseName === 'relabel') && prFrom >= 0) {
      if (phaseName === 'push' && prTo >= 0) hot.set(heightRec[`${prTo}`] ?? 0, WATER_DEEP);
      hot.set(heightRec[`${prFrom}`] ?? 0, GOLD);
    }
    return (
      <g data-level-ruler>
        {Array.from({ length: maxH + 1 }, (_, h) => {
          const color = hot.get(h);
          return (
            <line
              key={`level-line-${h}`}
              x1={RULER_X + 12}
              y1={levelY(h)}
              x2={SW - 12}
              y2={levelY(h)}
              stroke={color ?? '#dccbb2'}
              strokeWidth={color ? 2 : 1.2}
              strokeDasharray={color ? '7 5' : '3 7'}
              opacity={color ? 0.75 : 1}
            />
          );
        })}
        <text x={RULER_X} y={top - 22} textAnchor="middle" fontSize="11" fontWeight="800" fill="#78350f" letterSpacing="1">
          LEVEL
        </text>
        <rect x={RULER_X - 12} y={top - 14} width="24" height={GROUND - top + 14} rx="5" fill="#f3e2c4" stroke="#a16207" strokeWidth="1.5" />
        {Array.from({ length: maxH + 1 }, (_, h) => {
          const color = hot.get(h);
          return (
            <g key={`level-mark-${h}`} transform={`translate(${RULER_X}, ${levelY(h)})`}>
              {color && <circle r="10" fill={color} />}
              <text textAnchor="middle" y="4" fontSize="11.5" fontWeight="800" fill={color ? '#ffffff' : '#78350f'}>
                {h}
              </text>
            </g>
          );
        })}
      </g>
    );
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

  /** Stilts (and the jack while lifting) are drawn behind the pipes, so they never cut across the water. */
  const renderStilts = (i: number) => {
    const p = pos[i];
    const showJack = i === prFrom && phaseName === 'relabel';
    const stiltTop = p.y + 22;
    return (
      <g key={`stilts-${i}`}>
        <line x1={p.x - 15} y1={stiltTop} x2={p.x - 18} y2={GROUND} stroke="#c49a6c" strokeWidth="3" />
        <line x1={p.x + 15} y1={stiltTop} x2={p.x + 18} y2={GROUND} stroke="#c49a6c" strokeWidth="3" />
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
      </g>
    );
  };

  const renderTank = (i: number) => {
    const p = pos[i];
    const id = `${i}`;
    const ex = excessRec[id] ?? 0;
    const overflowing = (st.overflowingNodes || []).includes(id) && i !== s && i !== t;
    const isActive = i === prFrom && phaseName !== 'complete';
    const isTarget = i === prTo && phaseName === 'push';
    const level =
      i === s ? 1 : i === t ? Math.min(1, Math.max(0, ex) / intoSink) : Math.min(1, Math.max(0, ex) / outOfSource) ;
    const h = heightRec[id] ?? 0;
    return (
      <g key={`tank-${i}`} data-tank={id}>
        <g transform={`translate(${p.x}, ${p.y})`}>
          {/* level plaque hung under the tank */}
          <g data-tank-level={h}>
            <rect
              x="-25"
              y="26"
              width="50"
              height="18"
              rx="5"
              fill={isActive ? '#fde68a' : isTarget ? '#e0f2fe' : '#f3e2c4'}
              stroke={isActive ? '#b45309' : isTarget ? WATER_DEEP : '#a16207'}
              strokeWidth="1.3"
            />
            <text textAnchor="middle" y="39" fontSize="11" fontWeight="800" fill={isTarget ? '#075985' : '#78350f'}>
              level {h}
            </text>
          </g>
          {i === t && (
            <text textAnchor="middle" y="-32" fontSize="26">
              🏙️
            </text>
          )}
          {i === s && <path d="M -30 -24 L 0 -42 L 30 -24 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />}
          <rect x="-26" y="-24" width="52" height="46" rx="8" fill="#f5f5f4" stroke={isActive ? GOLD : isTarget ? WATER_DEEP : STEEL_DARK} strokeWidth={isActive || isTarget ? 4 : 2.5} />
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
      <svg viewBox={`0 0 ${SW} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label="Water pipe network">
        <defs>
          <linearGradient id="storySky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdfaf5" />
            <stop offset="100%" stopColor="#f3eadc" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={SW} height={H} rx="18" fill="url(#storySky)" />
        <rect x="0" y={GROUND} width={SW} height={H - GROUND} rx="0" fill="#e4d2bc" />
        <line x1="0" y1={GROUND} x2={SW} y2={GROUND} stroke="#c8b090" strokeWidth="2" />

        {isPR && renderRuler()}
        {isPR && nodes.map((_, i) => renderStilts(i))}
        {/* Empty pipes first, then pipes with water, and the pipe in action on top. */}
        {[...pipes].sort((a, b) => pipeLayer(a) - pipeLayer(b)).map(renderPipe)}
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
