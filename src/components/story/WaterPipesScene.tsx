import React from 'react';
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
const H = 380;
const GROUND = H - 24;

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

function buildPipes(cap: number[][], pos: Pt[]): Pipe[] {
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
      const c = { x: (p0.x + p2.x) / 2 + (-dy / len) * bend, y: (p0.y + p2.y) / 2 + (dx / len) * bend };
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
  const maxH = Math.max(2 * n - 1, 1);
  const unit = Math.min(24, (GROUND - 90) / maxH);
  const tweenedHeights = useTweened(
    nodes.map((_, i) => heightRec[`${i}`] ?? 0),
    700
  );

  const pos: Pt[] = nodes.map((_, i) => {
    const group = members(col[i]);
    const k = group.indexOf(i);
    if (isPR) {
      return {
        x: colX(col[i]) + (k - (group.length - 1) / 2) * 84,
        y: GROUND - 46 - tweenedHeights[i] * unit,
      };
    }
    const gap = Math.min(130, (H - 90) / Math.max(1, group.length));
    return { x: colX(col[i]), y: H / 2 + (k - (group.length - 1) / 2) * gap };
  });
  const pipes = n ? buildPipes(cap, pos) : [];
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
        {glow && (
          // Position on the outer group: the pop animation's CSS transform would override it.
          <g transform={`translate(${mid.x}, ${mid.y - casing / 2 - 16})`}>
            <g className="animate-story-pop">
              <rect x="-62" y="-11" width="124" height="22" rx="11" fill="#fffbeb" stroke={GOLD} strokeWidth="1.5" />
              <text textAnchor="middle" y="4" fontSize="11" fontWeight="700" fill="#78350f">
                narrowest: +{bottleneck} only
              </text>
            </g>
          </g>
        )}
        {full && !glow && (
          <g transform={`translate(${mid.x}, ${mid.y + casing / 2 + 13})`}>
            <rect x="-17" y="-9" width="34" height="17" rx="8" fill="#fee2e2" stroke="#f87171" />
            <text textAnchor="middle" y="4" fontSize="10" fontWeight="700" fill="#991b1b">
              full
            </text>
          </g>
        )}
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
              <line x1="10" y1={GROUND - 46 - h * unit} x2={W - 10} y2={GROUND - 46 - h * unit} stroke="#e7dccb" strokeDasharray="2 8" />
            </g>
          ))}

        {pipes.map(renderPipe)}
        {nodes.map((_, i) => (isPR ? renderTank(i) : renderJunction(i)))}
        {travellers}
      </svg>

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
