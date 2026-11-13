import React, { useRef } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases, useHeldValue, useProgress, useTweened } from './useAnimPhases';
import { PALETTE, SceneDefs, tint, useSvgIds } from './kit/materials';
import { CityBasin, Coupling, Drop, METAL, Pipe as PipeShape, PillTag, PlumbingDefs, Tank, WATER as WATER_KIT, WaterTower } from './kit/plumbing';
import { useChapter } from './kit/chapter';
import type { AugmentEntry, FlowSearchState } from '../../algorithms/flowSearch';

/**
 * 🚰 Water pipes story for the three max-flow algorithms.
 *
 * - Pipes are real pipes: thickness = capacity, blue water inside = flow.
 * - Ford-Fulkerson / Edmonds-Karp: the search itself is acted out, one look at a time.
 *   Ford-Fulkerson (DFS): a scout unrolls a string as it walks deeper, peeks into full pipes and
 *   turns back, and winds the string in at dead ends. The string is the route.
 *   Edmonds-Karp (BFS): scouts spread out like ripples; each tank gets a ring flag and a trail
 *   back to the tank that found it. When the city is reached, the trail is pulled tight back to the tower.
 *   Then the narrowest pipe glows, a surge of water flows along the route and the pipes fill.
 * - Pipes carrying water have a violet return valve (the reverse edge): a route may open it and
 *   send water back, shown with "undo" tags and a spinning valve.
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

const WATER_DEEP = WATER_KIT.deep;
const GOLD = PALETTE.gold;
const PLUM = '#8b3fb0';

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

/**
 * Point along a route of tanks, following the pipe used for each hop. Hops listed in `viaBack`
 * ("a-b") travel through the pipe b → a against its direction (water sent back through it).
 */
function pointOnRoute(route: number[], pipes: Pipe[], pos: Pt[], p: number, viaBack?: Set<string>): Pt {
  const hops = route.length - 1;
  if (hops <= 0) return pos[route[0]];
  const f = Math.min(hops - 1e-6, Math.max(0, p) * hops);
  const h = Math.floor(f);
  const t = f - h;
  const a = route[h];
  const b = route[h + 1];
  const fwd = viaBack?.has(`${a}-${b}`) ? undefined : pipes.find((pp) => pp.u === a && pp.v === b);
  if (fwd) return quad(fwd.p0, fwd.c, fwd.p2, t);
  const back = pipes.find((pp) => pp.u === b && pp.v === a);
  if (back) return quad(back.p0, back.c, back.p2, 1 - t);
  return { x: pos[a].x + (pos[b].x - pos[a].x) * t, y: pos[a].y + (pos[b].y - pos[a].y) * t };
}

const Droplet: React.FC<{ at: Pt; scale?: number; color?: string; ids?: string }> = ({ at, scale = 1, color = WATER_DEEP, ids = '' }) => (
  <g transform={`translate(${at.x}, ${at.y})`}>
    <Drop ids={ids} scale={scale} deep={color === '#0369a1'} />
  </g>
);

export const WaterPipesScene: React.FC<StorySceneProps> = ({ step, algorithmId, stepMs }) => {
  const ids = useSvgIds();
  const field = useChapter();
  const st: any = step.state || {};
  const nodes: { id: string; label: string }[] = st.nodes || [];
  const cap: number[][] = st.capacityMatrix || [];
  const n = nodes.length;
  const s = Number(st.source ?? 0);
  const t = Number(st.sink ?? Math.max(0, n - 1));
  const isPR = algorithmId === 'push-relabel' || !!st.isPushRelabel;
  const phaseName: string = st.phase || '';
  const route: number[] = (st.currentAugmentingPath || []).map(Number);
  const label = (i: number | string) => nodes[Number(i)]?.label ?? `${i}`;
  const routeText = route.map(label).join(' → ');

  // ── The search (Ford-Fulkerson: DFS with a string; Edmonds-Karp: BFS ripples) ──
  const search: FlowSearchState | undefined = isPR ? undefined : st.search;
  const exploring = phaseName === 'bfs_explore' || phaseName === 'dfs_explore';
  const isDfs = search?.kind === 'dfs';
  const event = exploring ? search?.event : undefined;
  const probe = event === 'probe' ? search?.probe : undefined;
  const pu = probe ? Number(probe.u) : -1;
  const pv = probe ? Number(probe.v) : -1;
  const augmentLog: AugmentEntry[] = phaseName === 'augment' ? st.augmentLog || [] : [];
  /** Hops of the current route that only send water back (they travel through the opposite pipe). */
  const undoHops = new Set(augmentLog.filter((e) => e.forward === 0).map((e) => `${e.u}-${e.v}`));

  // ── Animation phases (strict cause → effect order) ──
  const phases: readonly (readonly [string, number])[] = isPR
    ? phaseName === 'push'
      ? [['pour', 0], ['settle', 0.5]]
      : phaseName === 'relabel'
      ? [['jack', 0], ['lift', 0.35]]
      : [['idle', 0]]
    : probe
    ? probe.verdict === 'take'
      ? [['walk', 0], ['arrive', 0.55]]
      : [['peek', 0], ['blocked', 0.45]]
    : event === 'backtrack'
    ? [['rewind', 0], ['back', 0.6]]
    : event === 'trace'
    ? [['pull', 0], ['taut', 0.65]]
    : route.length && phaseName === 'path_found'
    ? [['scout', 0], ['bottleneck', 0.5]]
    : phaseName === 'augment'
    ? [['surge', 0], ['filled', 0.5]]
    : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  const flow = useHeldValue<number[][]>(st.flowMatrix || [], phase !== 'surge' && phase !== 'pour');
  const excessRec = useHeldValue<Record<string, number>>(st.excess || {}, phase !== 'pour');
  const heightRec = useHeldValue<Record<string, number>>(st.heights || {}, phase !== 'jack');
  const travelling = ['scout', 'surge', 'pour', 'walk', 'peek', 'rewind', 'pull'].includes(phase);
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
    // While water is sent, the augment log says exactly which pipes fill and which send water back.
    if (augmentLog.length) {
      if (augmentLog.some((e) => Number(e.u) === p.v && Number(e.v) === p.u && e.undo > 0)) return { room: 0, backward: true };
      if (augmentLog.some((e) => Number(e.u) === p.u && Number(e.v) === p.v && e.forward > 0)) return { room: 0, backward: false };
      return null;
    }
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

  const visited: string[] = exploring ? search?.visited ?? [] : [];
  const queue: string[] = search?.frontier ?? [];
  const deadEnds: string[] = exploring ? search?.deadEnds ?? [] : [];
  /** Where the scout stands (DFS: top of the stack; BFS: the tank taking its turn). */
  const bfsCurrent: string | undefined = exploring ? search?.current : undefined;
  /** DFS: the string laid from the tower, as a route of tanks (the stack). */
  const stringRoute = exploring && isDfs ? queue.map(Number) : [];
  const ringOf = (i: number) => search?.depth?.[`${i}`];
  const prFrom = st.currentVertex !== undefined ? Number(st.currentVertex) : -1;
  const prTo = st.targetVertex !== undefined ? Number(st.targetVertex) : -1;

  const intoSink = pipes.filter((p) => p.v === t).reduce((a, p) => a + p.cap, 0) || 1;
  const outOfSource = pipes.filter((p) => p.u === s).reduce((a, p) => a + p.cap, 0) || 1;
  const delivered = isPR ? excessRec[`${t}`] ?? 0 : (flow[s] || []).reduce((a, f) => a + Math.max(0, f), 0);

  // ── Narration ──
  /** What the scout is doing on a search step, in plain words. */
  const searchNarration = (): string => {
    const round = search?.round ?? 0;
    if (!search || round === 0)
      return `Water waits in the tower ${label(s)}. Every pipe is empty. Let's push as much water as we can to the city ${label(t)}.`;
    if (event === 'start') {
      if (isDfs)
        return round === 1
          ? `A scout ties a ball of string to the tower ${label(s)} and sets off. At every tank it takes the first pipe with room and keeps going deeper.`
          : `The scout starts again from the tower ${label(s)} with a fresh ball of string. Some pipes are full now, but pipes with water have return valves it may use.`;
      return round === 1
        ? `Scouts start at the tower ${label(s)}. They spread out like ripples: first every tank one pipe away, then two pipes away, and so on.`
        : `New ripples start from the tower ${label(s)}. Some pipes are full now, but pipes with water have return valves the scouts may use.`;
    }
    if (event === 'dequeue') {
      const u = Number(bfsCurrent);
      return u === s
        ? `The tower ${label(s)} sends scouts down every pipe that still has room.`
        : `${label(u)} (ring ${ringOf(u)}) was reached earliest, so it takes its turn: scouts look down every pipe out of ${label(u)}.`;
    }
    if (event === 'backtrack') {
      const from = label(search.backtrackFrom ?? '');
      return `Every way out of ${from} is blocked: a dead end! The scout winds its string back to ${label(Number(bfsCurrent))} and tries the next pipe there.`;
    }
    if (event === 'trace') {
      const path = search.trace ?? [];
      return `A scout reached the city. Follow its trail back: ${path.map(label).join(' ← ')}. Pull the thread tight: that is a route with the fewest pipes.`;
    }
    if (event === 'stuck')
      return isDfs
        ? `The scout has wound its string all the way back to the tower. No route to the city has room left.`
        : `The ripples die out before reaching the city. No route to it has room left.`;
    if (probe) {
      const hop = `${label(pu)} to ${label(pv)}`;
      const valve =
        probe.undoRoom > 0 && probe.forwardRoom === 0
          ? `There is no free pipe from ${hop}, but the pipe from ${label(pv)} to ${label(pu)} carries water, so its return valve can send ${probe.undoRoom} back. That counts as room!`
          : '';
      if (probe.verdict === 'full')
        return phase === 'peek'
          ? `The scout peeks into the pipe from ${hop}…`
          : `The pipe from ${hop} is full, so nothing more fits that way. ${isDfs ? 'The scout tries the next pipe.' : 'That way is closed.'}`;
      if (probe.verdict === 'seen')
        return isDfs
          ? `The pipe from ${hop} has room, but the scout has already been at ${label(pv)} on this search, so it does not go there again.`
          : `The pipe from ${hop} has room, but ${label(pv)} already has a scout from a closer ring, so this one turns back.`;
      if (pv === t)
        return isDfs
          ? `${valve ? valve + ' ' : ''}The scout walks on from ${label(pu)} and reaches the city ${label(t)}! The string now marks the whole route.`
          : `${valve ? valve + ' ' : ''}A scout runs from ${label(pu)} and reaches the city ${label(t)} in ring ${ringOf(pv)}. No route can use fewer pipes.`;
      return isDfs
        ? `${valve || `The pipe from ${hop} has room.`} The scout walks on to ${label(pv)}, unrolling its string, and keeps going deeper from there.`
        : `${valve || `The pipe from ${hop} has room.`} A new scout runs to ${label(pv)} and plants a flag: ring ${ringOf(pv)}. It remembers that it came from ${label(pu)}.`;
    }
    return step.title;
  };

  const narration = (() => {
    if (!isPR && !step.isFinal && phaseName === 'complete' && st.minCut?.sinkSide) {
      const full = (st.minCut.edges as { u: string; v: string }[]).map((e) => `${label(e.u)} → ${label(e.v)}`).join(', ');
      return `Draw a chalk line around the tanks the tower ${label(s)} can still reach. Every pipe crossing that line toward the city is full to the brim (${full}), so together they carry exactly what reaches ${label(t)}: the narrowest gap in the whole network.`;
    }
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
    if (exploring) return searchNarration();
    if (route.length && phaseName !== 'augment') {
      return phase === 'scout'
        ? `A scout droplet looks for a route with spare room: ${routeText}.`
        : `On the route ${routeText}, the narrowest pipe has room for only ${bottleneck} more litres, so that's all this route can add.`;
    }
    if (phaseName === 'augment') {
      const undone = augmentLog.filter((e) => e.undo > 0);
      const valves = undone.length
        ? ` At ${undone.map((e) => `${label(e.u)} → ${label(e.v)}`).join(' and ')} a return valve opens: ${undone
            .map((e) => `${e.undo} litres go back through the pipe ${label(e.v)} → ${label(e.u)}`)
            .join(', and ')}, so that water takes a new way instead.`
        : '';
      return phase === 'surge'
        ? `Water rushes along ${routeText}…${valves}`
        : `The pipes on ${routeText} fill up. The city now receives ${st.totalMaxFlow} litres per second.${undone.length ? ' Pipes with water get return valves too.' : ''}`;
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
  const isLit = (p: Pipe) =>
    (onRoute(p.u, p.v) && (phase === 'scout' || phase === 'bottleneck' || phase === 'surge')) ||
    (!!probe && probe.verdict === 'take' && ((p.u === pu && p.v === pv && probe.forwardRoom > 0) || (p.u === pv && p.v === pu && probe.undoRoom > 0)));
  /** Empty pipes are drawn first, then pipes with water, and the pipe in action on top. */
  const pipeLayer = (p: Pipe) => (isPouring(p) || isBottleneckPipe(p) || isLit(p) ? 2 : (flow[p.u]?.[p.v] ?? 0) > 0 ? 1 : 0);

  /** The pipe's return valve is in use: the search is using its reverse edge, or water is being sent back through it. */
  const valveOpen = (p: Pipe) =>
    (!!probe && probe.verdict === 'take' && probe.undoRoom > 0 && p.u === pv && p.v === pu) ||
    (phase === 'surge' && augmentLog.some((e) => Number(e.u) === p.v && Number(e.v) === p.u && e.undo > 0));

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
      if (probe) {
        const fwdPipe = p.u === pu && p.v === pv;
        const backPipe = p.u === pv && p.v === pu;
        if (probe.verdict === 'take') {
          if (fwdPipe && probe.forwardRoom > 0) return { text: `room +${probe.forwardRoom}`, tone: 'room' };
          if (backPipe && probe.undoRoom > 0) return { text: `send back ${probe.undoRoom}`, tone: 'undo' };
        } else if (phase === 'blocked' && (fwdPipe || (backPipe && !(cap[pu]?.[pv] > 0)))) {
          if (probe.verdict === 'full') return { text: `full ${f}/${p.cap}`, tone: 'full' };
          return { text: isDfs ? 'been there' : 'has a scout', tone: 'plain' };
        }
      }
      if (hop && phase === 'bottleneck') return { text: `room +${hop.room}`, tone: 'room' };
      if (hop && phase === 'surge' && bottleneck !== undefined) {
        const sentBack = augmentLog.find((e) => Number(e.u) === p.v && Number(e.v) === p.u)?.undo;
        const sentOn = augmentLog.find((e) => Number(e.u) === p.u && Number(e.v) === p.v)?.forward;
        return hop.backward ? { text: `undo −${sentBack ?? bottleneck}`, tone: 'undo' } : { text: `+${sentOn ?? bottleneck}`, tone: 'surge' };
      }
      return { text: full ? `full ${f}/${p.cap}` : `${f} / ${p.cap}`, tone: full ? 'full' : 'plain' };
    })();
    const tagStyle = {
      plain: { fill: '#fbf9f4', stroke: '#cfc6b4', ink: '#3a3732' },
      full: { fill: '#fbe3e1', stroke: '#cc2e2e', ink: '#801818' },
      room: { fill: '#fdf1c7', stroke: GOLD, ink: '#5c3a00' },
      surge: { fill: '#e3f0fd', stroke: WATER_DEEP, ink: '#173a85' },
      undo: { fill: '#f3e8f8', stroke: PLUM, ink: '#5a2378' },
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
          <path d="M -5 -5 L 3 0 L -5 5" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    };
    return (
      <g key={`pipe-${p.u}-${p.v}`} data-pipe={`${p.u}-${p.v}`}>
        <PipeShape d={pipePath(p)} casing={casing} water={water} glow={glow ? 'strong' : lit ? 'soft' : undefined} pouring={isPouring(p)} />
        {[0.16, 0.84].map((tt) => {
          const a = quad(p.p0, p.c, p.p2, tt);
          const b = quad(p.p0, p.c, p.p2, tt + 0.02);
          return <Coupling key={tt} x={a.x} y={a.y} angle={(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI} casing={casing} />;
        })}
        {/* Return valve: a pipe carrying water can send it back (the reverse edge). It spins while that happens. */}
        {!isPR && f > 0 && (
          <g transform={`translate(${quad(p.p0, p.c, p.p2, 0.8).x}, ${quad(p.p0, p.c, p.p2, 0.8).y})`} data-valve={`${p.u}-${p.v}`} data-valve-open={valveOpen(p) || undefined}>
            {valveOpen(p) && <circle r="14" fill={tint(PLUM, 0.8)} stroke={PLUM} strokeWidth="1.5" opacity="0.95" />}
            <g className={valveOpen(p) ? 'animate-spin' : undefined} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
              <circle r="8" fill={PLUM} stroke={tint(PLUM, -0.35)} strokeWidth="1.5" />
              <path d="M -7 0 H 7 M 0 -7 V 7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <circle r="2.6" fill={tint(PLUM, 0.6)} />
            </g>
          </g>
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
              <PillTag w={q.w} h={28} fill={style.fill} stroke={style.stroke}>
                <text textAnchor="middle" y="5" fontSize="14" fontWeight="900" fill={style.ink} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                  {tag.text}
                </text>
              </PillTag>
            </g>
          </g>
        );
      return (
        <g key={`tag-${q.id}`} transform={`translate(${at.x}, ${at.y})`} data-pipe-tag={q.id}>
          {/* a short tether from the tag to its pipe, so it is clear which pipe it describes */}
          <line x1="0" y1="0" x2={leader.x} y2={leader.y} stroke={style.stroke} strokeWidth="1.5" strokeDasharray="2 2" />
          <g key={`${tag.tone}-${phase}`} className={tag.tone === 'room' || tag.tone === 'surge' || tag.tone === 'undo' ? 'animate-story-pop' : undefined}>
            <PillTag w={q.w} fill={style.fill} stroke={style.stroke}>{null}</PillTag>
            {/* the pipe's direction (an "undo" runs against it, so its arrow turns round) */}
            <g transform={`translate(${-q.w / 2 + 12}, 0) rotate(${ang + (tag.tone === 'undo' ? 180 : 0)})`}>
              <path d="M -4 -4.5 L 3 0 L -4 4.5" fill="none" stroke={style.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text x={7} textAnchor="middle" y="4.5" fontSize="13" fontWeight="800" fill={style.ink} style={{ fontFamily: '"Red Hat Text", system-ui, sans-serif' }}>
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
              stroke={color ?? '#d9cdb8'}
              strokeWidth={color ? 2 : 1.2}
              strokeDasharray={color ? '7 5' : '3 7'}
              opacity={color ? 0.75 : 1}
            />
          );
        })}
        <text x={RULER_X} y={top - 22} textAnchor="middle" fontSize="12" fontWeight="900" fill={PALETTE.ink} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
          LEVEL
        </text>
        <rect x={RULER_X - 13} y={top - 14} width="26" height={GROUND - top + 14} rx="13" fill={`url(#${ids}-post)`} />
        {Array.from({ length: maxH + 1 }, (_, h) => {
          const color = hot.get(h);
          return (
            <g key={`level-mark-${h}`} transform={`translate(${RULER_X}, ${levelY(h)})`}>
              {color && <circle r="11" fill={color} />}
              <text textAnchor="middle" y="4" fontSize="12" fontWeight="900" fill={color ? '#ffffff' : PALETTE.ink}>
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
          <WaterTower ids={ids} label={label(i)} />
          {isCurrent && <circle r="34" fill="none" stroke={WATER_DEEP} strokeWidth="3" className="animate-story-ripple" />}
        </g>
      );
    }
    if (i === t) {
      // City basin filling up
      const level = Math.min(1, delivered / intoSink);
      return (
        <g key={`node-${i}`} transform={`translate(${p.x}, ${p.y})`}>
          <CityBasin ids={ids} level={level} label={label(i)} />
        </g>
      );
    }
    return (
      <g key={`node-${i}`} transform={`translate(${p.x}, ${p.y})`}>
        {isCurrent && <circle r="30" fill="none" stroke={WATER_DEEP} strokeWidth="3" className="animate-story-ripple" />}
        <Tank ids={ids} w={44} h={30} level={isVisited ? 0.35 : 0} label={label(i)} ring={isVisited && !isCurrent ? tint(WATER_DEEP, 0.4) : undefined} />
      </g>
    );
  };

  /**
   * Search marks on a tank: Edmonds-Karp plants a ring flag on every tank a scout has reached;
   * Ford-Fulkerson chalks a cross on dead ends.
   */
  const renderSearchMarks = (i: number) => {
    const p = pos[i];
    const id = `${i}`;
    if (!exploring || i === s) return null;
    if (isDfs) {
      if (!deadEnds.includes(id)) return null;
      // The cross appears once the scout has turned back from this tank.
      if (event === 'backtrack' && search?.backtrackFrom === id && phase === 'rewind') return null;
      return (
        <g key={`mark-${i}`} transform={`translate(${p.x}, ${p.y})`} data-dead-end={id}>
          <g className="animate-story-pop">
            <path d="M -14 -14 L 14 14 M 14 -14 L -14 14" stroke="#cc2e2e" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
            <g transform="translate(0, 36)">
              <PillTag w={68} h={20} fill="#fbe3e1" stroke="#cc2e2e">
                <text textAnchor="middle" y="4" fontSize="11" fontWeight="800" fill="#801818">dead end</text>
              </PillTag>
            </g>
          </g>
        </g>
      );
    }
    if (!visited.includes(id)) return null;
    // A new flag goes up only when its scout arrives.
    if (probe?.verdict === 'take' && pv === i && phase === 'walk') return null;
    const ring = ringOf(i);
    const fresh = probe?.verdict === 'take' && pv === i;
    return (
      <g key={`mark-${i}`} transform={`translate(${p.x + (i === t ? 36 : 18)}, ${p.y + (i === t ? 8 : -16)})`} data-ring-flag={id} data-ring={ring}>
        <g className={fresh ? 'animate-story-pop' : undefined}>
          <line x1="0" y1="2" x2="0" y2="-32" stroke={PALETTE.walnut} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 0 -32 L 46 -32 Q 40 -24 46 -16 L 0 -16 Z" fill={fresh ? WATER_DEEP : '#e3f0fd'} stroke={WATER_DEEP} strokeWidth="1.2" strokeLinejoin="round" />
          <text x="20" y="-20.5" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={fresh ? '#ffffff' : '#173a85'}>
            ring {ring}
          </text>
        </g>
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
        <ellipse cx={p.x} cy={GROUND + 2} rx="24" ry="4" fill="#3a2414" opacity="0.14" />
        <line x1={p.x - 15} y1={stiltTop} x2={p.x - 18} y2={GROUND} stroke={PALETTE.walnut} strokeWidth="5" strokeLinecap="round" />
        <line x1={p.x + 15} y1={stiltTop} x2={p.x + 18} y2={GROUND} stroke={PALETTE.walnut} strokeWidth="5" strokeLinecap="round" />
        <line x1={p.x - 16} y1={(stiltTop + GROUND) / 2} x2={p.x + 16} y2={(stiltTop + GROUND) / 2} stroke={tint(PALETTE.walnut, 0.2)} strokeWidth="3" strokeLinecap="round" />
        {showJack && (
          <g className="animate-story-pop">
            <polyline
              points={`${p.x - 12},${GROUND} ${p.x + 12},${(GROUND + stiltTop) / 2 + 8} ${p.x - 12},${(GROUND + stiltTop) / 2 - 8} ${p.x + 12},${stiltTop + 2}`}
              fill="none"
              stroke={PALETTE.gold}
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <rect x={p.x - 18} y={GROUND - 7} width="36" height="8" rx="4" fill={METAL.rim} />
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
            <rect x="-27" y="30" width="54" height="19" rx="9.5" fill={isActive ? '#fdf1c7' : isTarget ? '#e3f0fd' : '#fbf9f4'} stroke={isActive ? GOLD : isTarget ? WATER_DEEP : '#cfc6b4'} strokeWidth="1.4" />
            <text textAnchor="middle" y="43.5" fontSize="11.5" fontWeight="800" fill={isTarget ? '#173a85' : PALETTE.ink}>
              level {h}
            </text>
          </g>
          {i === s && <path d="M -30 -28 Q 0 -52 30 -28 Z" fill={PALETTE.berry} stroke={tint(PALETTE.berry, -0.35)} strokeWidth="2" />}
          {i === t && (
            <g transform="translate(0, -30)">
              <rect x="-24" y="-24" width="13" height="24" rx="2" fill={`url(#${ids}-brick)`} />
              <rect x="-9" y="-34" width="16" height="34" rx="2" fill={tint(PALETTE.sky, 0.15)} />
              <rect x="9" y="-18" width="15" height="18" rx="2" fill={tint(PALETTE.leaf, 0.2)} />
            </g>
          )}
          <Tank ids={ids} w={52} h={42} level={level} label={label(i)} ring={isActive ? GOLD : isTarget ? WATER_DEEP : undefined} />
          {overflowing && (
            <g className="animate-story-bob">
              <Droplet ids={ids} at={{ x: 34, y: -14 }} scale={0.65} />
              <text x="34" y="-30" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={WATER_DEEP}>
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
      travellers.push(
        <Droplet
          ids={ids}
          key={`d-${k}`}
          at={pointOnRoute(route, pipes, pos, pk, phase === 'surge' ? undoHops : undefined)}
          scale={phase === 'scout' ? 1.15 : 0.85}
          color={phase === 'scout' ? '#0369a1' : WATER_DEEP}
        />,
      );
    }
  }

  // ── The search, acted out ──
  /** Hop a → b of a search walks through the opposite pipe when it only uses that pipe's return valve. */
  const searchBack = new Set<string>();
  if (probe && probe.forwardRoom === 0 && probe.undoRoom > 0) searchBack.add(`${pu}-${pv}`);
  /** A line along a route of tanks, from its start to fraction `upTo` of the way. */
  const lineAlong = (r: number[], upTo = 1) => {
    if (r.length < 2 || upTo <= 0) return '';
    const samples = Math.max(2, Math.ceil(24 * (r.length - 1) * upTo));
    return Array.from({ length: samples + 1 }, (_, k) => {
      const q = pointOnRoute(r, pipes, pos, (k / samples) * Math.min(1, upTo), searchBack);
      return `${k === 0 ? 'M' : 'L'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    }).join(' ');
  };
  const TWINE = '#c4501a';
  const searchLayer: React.ReactNode[] = [];
  let scoutAt: Pt | null = null;
  if (exploring && search) {
    const peekBack = (p0: number) => (p0 < 0.5 ? p0 * 0.7 : (1 - p0) * 0.7);
    if (isDfs) {
      // The string runs along the stack. While walking, its last stretch unrolls behind the scout;
      // while rewinding, the stretch to the dead end winds back in.
      let r = stringRoute;
      let upTo = 1;
      if (probe?.verdict === 'take' && phase === 'walk') upTo = (r.length - 2 + progress) / Math.max(1, r.length - 1);
      if (event === 'backtrack' && search.backtrackFrom !== undefined && phase === 'rewind') {
        r = [...stringRoute, Number(search.backtrackFrom)];
        upTo = (r.length - 2 + (1 - progress)) / Math.max(1, r.length - 1);
      }
      if (r.length > 1) {
        const d = lineAlong(r, upTo);
        searchLayer.push(
          <g key="string" data-scout-string={r.map(label).join('')}>
            <path d={d} fill="none" stroke="#fffbeb" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
            <path d={d} fill="none" stroke={TWINE} strokeWidth="4.5" strokeDasharray="7 2" strokeLinecap="round" strokeLinejoin="round" />
          </g>,
        );
        scoutAt = pointOnRoute(r, pipes, pos, upTo, searchBack);
      } else scoutAt = pos[r[0] ?? s];
      if (probe && probe.verdict !== 'take') scoutAt = pointOnRoute([pu, pv], pipes, pos, peekBack(progress), searchBack);
    } else {
      // Every tank reached keeps a trail back to the tank that found it.
      Object.entries(search.parent).forEach(([v, u]) => {
        const fresh = probe?.verdict === 'take' && Number(v) === pv;
        const d = lineAlong([Number(u), Number(v)], fresh && phase === 'walk' ? progress : 1);
        if (d)
          searchLayer.push(
            <path key={`trail-${v}`} d={d} fill="none" stroke={WATER_DEEP} strokeWidth="3.5" strokeDasharray="2 6" strokeLinecap="round" opacity="0.85" data-trail={`${u}-${v}`} />,
          );
      });
      if (probe) scoutAt = pointOnRoute([pu, pv], pipes, pos, probe.verdict === 'take' ? progress : peekBack(progress), searchBack);
      if (event === 'trace' && search.trace) {
        // The thread is pulled tight from the city back to the tower.
        // The trace runs from the city back to the tower.
        const back = search.trace.map(Number);
        const d = lineAlong(back, phase === 'pull' ? progress : 1);
        if (d)
          searchLayer.push(
            <g key="thread" data-trace-thread={back.map(label).join('')}>
              <path d={d} fill="none" stroke="#fffbeb" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} fill="none" stroke={TWINE} strokeWidth="4.5" strokeDasharray="7 2" strokeLinecap="round" strokeLinejoin="round" />
            </g>,
          );
        scoutAt = pointOnRoute(back, pipes, pos, phase === 'pull' ? progress : 1);
      }
    }
  }
  if (scoutAt && search && search.round > 0) {
    // A scout standing at a tank waits just above it, so the tank's name stays readable.
    const resting = !['walk', 'peek', 'rewind', 'pull'].includes(phase);
    const at = resting ? { x: scoutAt.x, y: scoutAt.y - 34 } : scoutAt;
    travellers.push(<Droplet ids={ids} key="scout" at={at} scale={1.15} color="#0369a1" />);
  }
  if (isPR && phase === 'pour' && prFrom >= 0 && prTo >= 0) {
    for (let k = 0; k < 3; k++) {
      const pk = Math.max(0, Math.min(1, progress * 1.25 - k * 0.12));
      if (pk >= 1) continue;
      travellers.push(<Droplet ids={ids} key={`d-${k}`} at={pointOnRoute([prFrom, prTo], pipes, pos, pk)} scale={0.8} />);
    }
  }

  return (
    <StoryStage
      emoji="🚰"
      title={isPR ? 'Water Tanks on Stilts' : algorithmId === 'edmonds-karp' ? 'Water Pipes & Ripple Scouts' : 'Water Pipes & the String Scout'}
      subtitle={
        isPR
          ? 'Water only rolls downhill. Overflowing tanks get lifted higher.'
          : 'Thicker pipe = carries more water. Blue inside = water flowing now.'
      }
      narration={narration}
      status={status}
    >
      <svg viewBox={`0 0 ${SW} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label="Water pipe network">
        <SceneDefs ids={ids} floor={field.bg} />
        <PlumbingDefs ids={ids} />
        <defs>
          <linearGradient id={`${ids}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7f2e8" />
            <stop offset="100%" stopColor="#ece3d2" />
          </linearGradient>
          <linearGradient id={`${ids}-post`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={tint(PALETTE.oak, 0.2)} />
            <stop offset="1" stopColor={PALETTE.oakDeep} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={SW} height={H} rx="18" fill={`url(#${ids}-sky)`} />
        <path d={`M0 ${GROUND} C${SW * 0.18} ${GROUND - 46} ${SW * 0.32} ${GROUND - 40} ${SW * 0.5} ${GROUND - 12} S${SW * 0.82} ${GROUND - 52} ${SW} ${GROUND - 18} V${GROUND} Z`} fill={tint(field.bg, 0.55)} opacity="0.6" />
        <path d={`M0 ${GROUND} H${SW} V${H - 18} Q${SW} ${H} ${SW - 18} ${H} H18 Q0 ${H} 0 ${H - 18} Z`} fill={`url(#${ids}-floor)`} />
        <line x1="0" y1={GROUND} x2={SW} y2={GROUND} stroke={tint(field.bg, -0.25)} strokeWidth="3" />

        {isPR && renderRuler()}
        {isPR && nodes.map((_, i) => renderStilts(i))}
        {/* Empty pipes first, then pipes with water, and the pipe in action on top. */}
        {[...pipes].sort((a, b) => pipeLayer(a) - pipeLayer(b)).map(renderPipe)}
        {searchLayer}
        {nodes.map((_, i) => (isPR ? renderTank(i) : renderJunction(i)))}
        {!isPR && nodes.map((_, i) => renderSearchMarks(i))}
        {renderTags()}
        {travellers}
      </svg>

      {!isPR && route.length > 1 && (phase === 'bottleneck' || phase === 'surge' || phase === 'filled') && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 font-sans text-xs text-stone-700" data-route-summary>
          <span className="font-bold text-stone-700 mr-1">This route:</span>
          {phase === 'bottleneck' ? (
            <>
              {routeHops.map((h, i) => (
                <React.Fragment key={`hop-${i}`}>
                  <span className="font-bold text-stone-900">{label(h.a)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full border font-bold ${
                      h.room === bottleneck ? 'bg-[#f2c21a] border-transparent text-stone-900' : 'bg-[#fbf9f4] border-stone-300 text-stone-700'
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

      {exploring && search && !isDfs && search.round > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 font-sans text-xs text-stone-600" data-scout-queue>
          <span className="font-bold text-stone-700">Scouts waiting in line:</span>
          {queue.length === 0 && <span className="italic">nobody</span>}
          {queue.map((q, i) => (
            <span
              key={`${q}-${i}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-900 font-bold animate-story-pop"
            >
              <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-sky-600" /> {label(Number(q))}
              <span className="font-semibold text-sky-700">· ring {ringOf(Number(q))}</span>
            </span>
          ))}
          {queue.length > 1 && <span className="text-stone-400">(first in line goes next)</span>}
        </div>
      )}
      {exploring && search && isDfs && search.round > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 font-sans text-xs text-stone-600" data-scout-string-summary>
          <span className="font-bold text-stone-700 mr-1">String laid:</span>
          {stringRoute.length === 0 && <span className="italic">wound back in</span>}
          {stringRoute.map((v, i) => (
            <React.Fragment key={`str-${v}-${i}`}>
              {i > 0 && <span className="text-orange-800 font-bold">→</span>}
              <span className="px-3 py-0.5 rounded-full bg-orange-50 text-orange-900 font-bold">{label(v)}</span>
            </React.Fragment>
          ))}
          {deadEnds.length > 0 && (
            <span className="ml-3">
              Dead ends: <b className="text-red-800">{deadEnds.map((d) => label(Number(d))).join(', ')}</b>
            </span>
          )}
        </div>
      )}
    </StoryStage>
  );
};
