import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Shuffle } from 'lucide-react';

/**
 * Home-page illustrations: each story drawn as its own crisp SVG at any size, on a transparent
 * ground so it sits on the page itself, playing the algorithm's example on a loop. With
 * `controls` the visitor can pause, step, click the drawing to advance, and (kids, pegs)
 * shuffle the input to see the algorithm run on something new.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const move = (x: number, y: number, ms = 800): React.CSSProperties => ({
  transform: `translate(${x}px, ${y}px)`,
  transition: `transform ${ms}ms ${EASE}, opacity 400ms`,
});

/**
 * Steps through `frames` frames, `ms` apart, while on screen and playing. After the last frame
 * it holds, fades out, jumps back to frame 0 without transitions, and fades in again.
 * Stepping by hand pauses it. A new `runKey` (a shuffled input) starts again from frame 0.
 * With reduced motion it starts paused on the last frame.
 */
function useLoop(frames: number, ms: number, runKey: unknown = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'play' | 'out' | 'reset'>('play');
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (reduce) {
      setPlaying(false);
      setI(frames - 1);
    }
  }, [reduce, frames]);

  // A shuffled input starts again from frame 0 with transitions on, so the old kids and pegs
  // move to their new heights and places instead of snapping there.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setI(reduce ? frames - 1 : 0);
    setPhase('play');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (phase === 'reset') {
      const t = window.setTimeout(() => setPhase('play'), 60);
      return () => window.clearTimeout(t);
    }
    if (!playing || !visible) return;
    if (phase === 'out') {
      const t = window.setTimeout(() => {
        setI(0);
        setPhase('reset');
      }, 450);
      return () => window.clearTimeout(t);
    }
    const last = i >= frames - 1;
    const t = window.setTimeout(() => (last ? setPhase('out') : setI(i + 1)), last ? ms * 3 : ms);
    return () => window.clearTimeout(t);
  }, [i, phase, visible, playing, frames, ms]);

  const stepTo = (k: number) => {
    setPlaying(false);
    setPhase('play');
    setI(Math.max(0, Math.min(frames - 1, k)));
  };

  return {
    ref,
    i: Math.min(i, frames - 1),
    frames,
    playing,
    toggle: () => {
      if (!playing && i >= frames - 1) {
        setI(0);
        setPhase('reset');
      }
      setPlaying(!playing);
    },
    next: () => stepTo(i >= frames - 1 ? 0 : i + 1),
    prev: () => stepTo(i - 1),
    svgClass: phase === 'reset' ? 'sv-reset' : '',
    style: { opacity: phase === 'out' ? 0 : 1, transition: 'opacity 400ms' } as React.CSSProperties,
  };
}

interface VignetteProps {
  className?: string;
  /** Fill the box and crop the edges (for wide or narrow slots) instead of fitting inside it. */
  crop?: boolean;
  /** Show play / pause, step buttons and (where the story has one) Shuffle under the drawing. */
  controls?: boolean;
}

const Frame: React.FC<
  VignetteProps & {
    loop: ReturnType<typeof useLoop>;
    label: string;
    children: React.ReactNode;
    vb?: string;
    onShuffle?: () => void;
  }
> = ({ loop, label, crop, controls, className = '', vb = '0 0 640 400', onShuffle, children }) => (
  <div ref={loop.ref} className={`sv-wrap ${className}`}>
    <svg
      viewBox={vb}
      preserveAspectRatio={crop ? 'xMidYMid slice' : 'xMidYMid meet'}
      className={`sv ${loop.svgClass} ${controls ? 'sv-clickable' : ''}`}
      style={loop.style}
      role="img"
      aria-label={label}
      onClick={controls ? loop.next : undefined}
    >
      {children}
    </svg>
    {controls && (
      <div className="sv-controls">
        <button type="button" className="sv-btn" onClick={loop.toggle} aria-label={loop.playing ? 'Pause' : 'Play'}>
          {loop.playing ? <Pause className="w-5 h-5" aria-hidden /> : <Play className="w-5 h-5" aria-hidden />}
        </button>
        <button type="button" className="sv-btn" onClick={loop.prev} aria-label="Previous step" disabled={loop.i === 0}>
          <ChevronLeft className="w-5 h-5" aria-hidden />
        </button>
        <button type="button" className="sv-btn" onClick={loop.next} aria-label="Next step">
          <ChevronRight className="w-5 h-5" aria-hidden />
        </button>
        <span className="sv-count" aria-live="polite">
          Step {loop.i + 1} of {loop.frames}
        </span>
        {onShuffle && (
          <button type="button" className="sv-btn sv-btn-text" onClick={onShuffle}>
            <Shuffle className="w-4 h-4" aria-hidden /> Shuffle
          </button>
        )}
      </div>
    )}
  </div>
);

/* ── Fractional Knapsack: cheese wheels on an oak board, packed into a leather backpack ─── */

const WHEELS = [
  { w: 10, v: 60, x: 92 },
  { w: 20, v: 100, x: 205 },
  { w: 30, v: 120, x: 335 },
];
const wheelR = (w: number) => 30 + w * 1.25;
const wheelH = (w: number) => 14 + w * 0.8;
const BOARD_Y = 292;
const BAG_X = 520;
const BAG_FLOOR = 352;

const Wheel: React.FC<{ w: number; part?: 'left' | 'right' | 'all'; cut?: number; id: string }> = ({ w, part = 'all', cut = 0, id }) => {
  const r = wheelR(w);
  const h = wheelH(w);
  const ry = r * 0.32;
  const cutX = -r + 2 * r * cut;
  return (
    <g>
      {part !== 'all' && (
        <clipPath id={id}>
          {part === 'left' ? <rect x={-r - 2} y={-h - ry - 4} width={cutX + r + 2} height={h + 2 * ry + 8} /> : <rect x={cutX} y={-h - ry - 4} width={r - cutX + 2} height={h + 2 * ry + 8} />}
        </clipPath>
      )}
      <g clipPath={part !== 'all' ? `url(#${id})` : undefined}>
        <ellipse cx={0} cy={0} rx={r} ry={ry} fill="#d98e04" />
        <rect x={-r} y={-h} width={2 * r} height={h} fill="#e9a514" />
        <ellipse cx={0} cy={-h} rx={r} ry={ry} fill="#fcd34d" />
        <ellipse cx={-r * 0.35} cy={-h - ry * 0.1} rx={r * 0.13} ry={ry * 0.32} fill="#e9a514" />
        <ellipse cx={r * 0.25} cy={-h + ry * 0.35} rx={r * 0.09} ry={ry * 0.24} fill="#e9a514" />
        <ellipse cx={r * 0.42} cy={-h - ry * 0.45} rx={r * 0.07} ry={ry * 0.2} fill="#e9a514" />
        {part === 'left' && <rect x={cutX - 3} y={-h - ry * 0.2} width={3} height={h + ry * 0.4} fill="#f5c542" />}
        {part === 'right' && <rect x={cutX} y={-h - ry * 0.2} width={3} height={h + ry * 0.4} fill="#f5c542" />}
      </g>
    </g>
  );
};

const Tag: React.FC<{ x: number; y: number; text: string; show?: boolean; dark?: boolean; size?: number }> = ({ x, y, text, show = true, dark, size = 22 }) => {
  const w = text.length * size * 0.56 + 22;
  return (
    <g style={{ opacity: show ? 1 : 0, transition: 'opacity 400ms' }} transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.55} rx={size * 0.78} fill={dark ? '#2b2116' : '#fff'} />
      <text x={0} y={size * 0.12} textAnchor="middle" fontSize={size} fontWeight={700} fill={dark ? '#fdf6e3' : '#2b2116'} fontFamily="'Public Sans','Red Hat Text',system-ui,sans-serif">
        {text}
      </text>
    </g>
  );
};

export const CheeseVignette: React.FC<VignetteProps> = (props) => {
  const loop = useLoop(9, 1100);
  // Clip ids must be unique when the same vignette is on the page twice.
  const uid = useId().replace(/:/g, '');
  const f = loop.i;
  // In the bag: wheel 1 on the floor, wheel 2 on it, the cut slice on top.
  const inBag = [
    { x: BAG_X, y: BAG_FLOOR },
    { x: BAG_X, y: BAG_FLOOR - wheelH(10) - 10 },
    { x: BAG_X - 18, y: BAG_FLOOR - wheelH(10) - wheelH(20) - 20 },
  ];
  const pos = (k: number) => {
    const home = { x: WHEELS[k].x, y: BOARD_Y };
    const lift = { x: home.x, y: home.y - 34 };
    if (k === 0) return f === 1 ? lift : f >= 2 ? inBag[0] : home;
    if (k === 1) return f === 3 ? lift : f >= 4 ? inBag[1] : home;
    return home;
  };
  const cutOpen = f >= 5;
  const sliceInBag = f >= 6;
  const closed = f >= 7;
  return (
    <Frame loop={loop} label="Fractional Knapsack: cheese wheels packed by value per kilo into a 50 kg backpack" {...props}>
      {/* oak board */}
      <rect x={20} y={BOARD_Y - 4} width={410} height={30} rx={8} fill="#c9a06b" />
      <rect x={20} y={BOARD_Y + 18} width={410} height={10} rx={5} fill="#a77d4a" />

      {/* backpack body, behind what goes into it */}
      <g>
        <rect x={BAG_X - 92} y={196} width={184} height={176} rx={26} fill="#7c4a22" />
        <rect x={BAG_X - 92} y={196} width={184} height={22} rx={10} fill="#5f3716" />
      </g>

      {WHEELS.slice(0, 2).map((wh, k) => {
        const p = pos(k);
        return (
          <g key={k} style={move(p.x, p.y, 900)}>
            <Wheel w={wh.w} id={`${uid}w${k}`} />
          </g>
        );
      })}

      {/* the big wheel: one piece until the knife, then a slice that travels and a piece that stays */}
      <g style={move(sliceInBag ? inBag[2].x : WHEELS[2].x, sliceInBag ? inBag[2].y : BOARD_Y, 900)}>
        <g style={move(cutOpen && !sliceInBag ? -6 : 0, 0, 400)}>
          <Wheel w={30} part="left" cut={2 / 3} id={`${uid}a`} />
        </g>
      </g>
      <g style={move(WHEELS[2].x + (cutOpen ? 8 : 0), BOARD_Y, 400)}>
        <Wheel w={30} part="right" cut={2 / 3} id={`${uid}b`} />
      </g>

      {/* knife */}
      <g style={{ ...move(WHEELS[2].x + 20, f === 5 ? 190 : 120, 450), opacity: f === 5 ? 1 : 0 }}>
        <rect x={-3} y={0} width={6} height={88} rx={2} fill="#cbd5e1" />
        <rect x={-6} y={-38} width={12} height={40} rx={5} fill="#3f2a17" />
      </g>

      {/* front pocket and lid, in front of the cheese */}
      <rect x={BAG_X - 70} y={300} width={140} height={58} rx={16} fill="#6b3d1a" />
      <rect x={BAG_X - 8} y={312} width={16} height={22} rx={4} fill="#d6a85c" />
      <g style={{ transformBox: 'view-box', transformOrigin: `${BAG_X}px 200px`, transform: `scaleY(${closed ? 1 : -0.32})`, transition: `transform 700ms ${EASE}` }}>
        <path d={`M${BAG_X - 96} 200 h192 v62 q0 26 -26 26 h-140 q-26 0 -26 -26 Z`} fill="#8f5a2c" />
        <rect x={BAG_X - 12} y={262} width={24} height={30} rx={5} fill="#d6a85c" />
      </g>

      {/* value per kilo on each wheel, and the haul once the lid is shut */}
      <Tag x={WHEELS[0].x} y={175} text="$6/kg" show={f === 0 || f === 1} />
      <Tag x={WHEELS[1].x} y={175} text="$5/kg" show={f <= 3} />
      <Tag x={WHEELS[2].x} y={175} text="$4/kg" show={f <= 5} />
      <Tag x={WHEELS[2].x + 30} y={175} text="⅓ stays" show={f >= 6} />
      <Tag x={BAG_X} y={150} text="50 kg" show={!closed} dark />
      <Tag x={BAG_X} y={150} text="$240" show={closed} dark size={30} />
    </Frame>
  );
};

/* ── Ford-Fulkerson: water pushed through pipes, one augmenting path at a time ─────────── */

const CAP = [
  [0, 16, 13, 0, 0, 0],
  [0, 0, 10, 12, 0, 0],
  [0, 4, 0, 0, 14, 0],
  [0, 0, 9, 0, 0, 20],
  [0, 0, 0, 7, 0, 4],
  [0, 0, 0, 0, 0, 0],
];
const NODE = [
  { x: 92, y: 200, l: 'S' },
  { x: 236, y: 92 },
  { x: 236, y: 308 },
  { x: 404, y: 92 },
  { x: 404, y: 308 },
  { x: 548, y: 200, l: 'T' },
];

/** Depth-first augmenting paths on the residual network, as Ford-Fulkerson finds them. */
const FLOW_FRAMES = (() => {
  const n = CAP.length;
  const flow = CAP.map((row) => row.map(() => 0));
  const frames: { flow: number[][]; path: number[]; total: number }[] = [{ flow: flow.map((r) => [...r]), path: [], total: 0 }];
  let total = 0;
  for (;;) {
    const seen = new Array(n).fill(false);
    const dfs = (u: number, path: number[]): number[] | null => {
      if (u === n - 1) return path;
      seen[u] = true;
      for (let v = 0; v < n; v++) {
        if (!seen[v] && CAP[u][v] - flow[u][v] + flow[v][u] > 0) {
          const p = dfs(v, [...path, v]);
          if (p) return p;
        }
      }
      return null;
    };
    const path = dfs(0, [0]);
    if (!path) break;
    let push = Infinity;
    for (let k = 0; k < path.length - 1; k++) {
      const [u, v] = [path[k], path[k + 1]];
      push = Math.min(push, CAP[u][v] - flow[u][v] + flow[v][u]);
    }
    for (let k = 0; k < path.length - 1; k++) {
      const [u, v] = [path[k], path[k + 1]];
      const back = Math.min(push, flow[v][u]);
      flow[v][u] -= back;
      flow[u][v] += push - back;
    }
    total += push;
    frames.push({ flow: flow.map((r) => [...r]), path, total });
  }
  return frames;
})();
const MAX_FLOW = FLOW_FRAMES[FLOW_FRAMES.length - 1].total;

export const PipesVignette: React.FC<VignetteProps> = (props) => {
  const loop = useLoop(FLOW_FRAMES.length, 1500);
  const { flow, path, total } = FLOW_FRAMES[loop.i];
  const onPath = (u: number, v: number) => path.some((p, k) => k < path.length - 1 && ((p === u && path[k + 1] === v) || (p === v && path[k + 1] === u)));
  const edges: [number, number][] = [];
  CAP.forEach((row, u) => row.forEach((c, v) => c > 0 && !(CAP[v][u] > 0 && v < u) && edges.push([u, v])));
  const level = total / MAX_FLOW;
  return (
    <Frame loop={loop} label={`Ford-Fulkerson: water through a pipe network, ${MAX_FLOW} units reach the tank`} {...props}>
      {/* source and sink tanks */}
      <rect x={18} y={120} width={66} height={160} rx={14} fill="#dbe7ee" />
      <rect x={18} y={128} width={66} height={152} rx={12} fill="#3b9fe0" />
      <rect x={556} y={120} width={66} height={160} rx={14} fill="#dbe7ee" />
      <rect x={556} y={280 - 152 * level} width={66} height={152 * level} rx={level > 0 ? 12 : 0} fill="#3b9fe0" style={{ transition: `y 900ms ${EASE}, height 900ms ${EASE}` }} />

      {edges.map(([u, v]) => {
        const cap = Math.max(CAP[u][v], CAP[v][u]);
        const net = flow[u][v] - flow[v][u];
        const w = 6 + cap * 0.9;
        const a = NODE[u];
        const b = NODE[v];
        const live = onPath(u, v);
        return (
          <g key={`${u}-${v}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#b8ad9b" strokeWidth={w + 6} strokeLinecap="round" />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#efe8dc" strokeWidth={w} strokeLinecap="round" />
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={live ? '#1d7fc4' : '#3b9fe0'}
              strokeWidth={Math.abs(net) > 0 ? Math.max(4, (w * Math.abs(net)) / cap) : 0}
              strokeLinecap="round"
              strokeDasharray={live ? '14 10' : undefined}
              className={live ? 'sv-flow' : undefined}
              style={{ transition: `stroke-width 700ms ${EASE}` }}
            />
          </g>
        );
      })}

      {NODE.map((nd, k) => (
        <g key={k}>
          <circle cx={nd.x} cy={nd.y} r={k === 0 || k === 5 ? 0 : 17} fill="#6b6255" />
          <circle cx={nd.x} cy={nd.y} r={k === 0 || k === 5 ? 0 : 9} fill={path.includes(k) ? '#fcd34d' : '#efe8dc'} style={{ transition: 'fill 300ms' }} />
        </g>
      ))}
      <Tag x={588} y={92} text={`${total}`} dark size={26} />
    </Frame>
  );
};

/* ── N-Queens: four queens on a wooden board, placed row by row with backtracking ─────── */

const QUEEN_FRAMES = (() => {
  const n = 4;
  const cols: number[] = [];
  const frames: { cols: number[]; dead?: number; done?: boolean }[] = [{ cols: [] }];
  const safe = (r: number, c: number) => cols.every((cc, rr) => cc !== c && Math.abs(cc - c) !== r - rr);
  const solve = (r: number): boolean => {
    if (r === n) return true;
    let placed = false;
    for (let c = 0; c < n; c++) {
      if (!safe(r, c)) continue;
      placed = true;
      cols.push(c);
      frames.push({ cols: [...cols] });
      if (solve(r + 1)) return true;
      cols.pop();
      frames.push({ cols: [...cols] });
    }
    if (!placed) frames.push({ cols: [...cols], dead: r });
    return false;
  };
  solve(0);
  frames.push({ cols: [...cols], done: true });
  return frames;
})();

const Crown: React.FC = () => (
  <g>
    <path d="M-22 14 L-26 -12 L-12 0 L0 -20 L12 0 L26 -12 L22 14 Z" fill="#2b2116" />
    <rect x={-24} y={14} width={48} height={9} rx={4} fill="#2b2116" />
    <circle cx={0} cy={-22} r={5} fill="#fcd34d" />
  </g>
);

export const QueensVignette: React.FC<VignetteProps> = (props) => {
  const loop = useLoop(QUEEN_FRAMES.length, 750);
  const { cols, dead, done } = QUEEN_FRAMES[loop.i];
  const S = 78;
  const ox = 320 - 2 * S;
  const oy = 200 - 2 * S;
  const attacked = (r: number, c: number) => cols.some((cc, rr) => rr !== r && (cc === c || Math.abs(cc - c) === Math.abs(rr - r)) && !(rr === r && cc === c));
  return (
    <Frame loop={loop} label="N-Queens: four queens placed on a wooden board so that none can attack another" {...props}>
      <rect x={ox - 18} y={oy - 18} width={4 * S + 36} height={4 * S + 36} rx={16} fill={done ? '#3f6212' : '#7c4a22'} style={{ transition: 'fill 500ms' }} />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => {
          const occupied = cols[r] === c;
          const hit = !occupied && attacked(r, c);
          return (
            <g key={`${r}${c}`}>
              <rect x={ox + c * S} y={oy + r * S} width={S} height={S} fill={(r + c) % 2 ? '#c99a63' : '#f1dcb5'} />
              {/* A row with no safe square flashes red; squares a queen attacks get a red dot. */}
              <rect x={ox + c * S} y={oy + r * S} width={S} height={S} fill="#e0453a" opacity={dead === r ? 0.5 : 0} style={{ transition: 'opacity 300ms' }} />
              <circle cx={ox + c * S + S / 2} cy={oy + r * S + S / 2} r={8} fill="#d6453d" opacity={hit && dead !== r ? 0.85 : 0} style={{ transition: 'opacity 300ms' }} />
            </g>
          );
        })
      )}
      {[0, 1, 2, 3].map((r) => (
        <g
          key={r}
          style={{
            ...move(ox + (cols[r] ?? 0) * S + S / 2, oy + r * S + S / 2 + (cols[r] === undefined ? -30 : 0), 450),
            opacity: cols[r] === undefined ? 0 : 1,
          }}
        >
          <Crown />
        </g>
      ))}
    </Frame>
  );
};

/* ── Graham's Scan: a rubber band walked around the pegs, dents dropped ───────────────── */

const RAW_PEGS = [
  { x: 100, y: 100 },
  { x: 150, y: 250 },
  { x: 250, y: 300 },
  { x: 350, y: 220 },
  { x: 400, y: 120 },
  { x: 280, y: 180 },
  { x: 200, y: 150 },
  { x: 220, y: 80 },
];
type Peg = { x: number; y: number };
const DEFAULT_PEGS: Peg[] = RAW_PEGS.map((p) => ({ x: 110 + (p.x - 100) * 1.4, y: 50 + (p.y - 80) * 1.36 }));

/** Eight to eleven pegs scattered over the drawing, never closer than 64 units to each other. */
const scatterPegs = (): Peg[] => {
  const n = 8 + Math.floor(Math.random() * 4);
  const pegs: Peg[] = [];
  while (pegs.length < n) {
    const p = { x: 70 + Math.random() * 500, y: 40 + Math.random() * 320 };
    if (pegs.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 64)) pegs.push(p);
  }
  return pegs;
};

/** Graham's Scan frames: the band after every push, and after every pop of a dent. */
const hullFrames = (pegs: Peg[]) => {
  const pts = pegs.map((p, i) => ({ ...p, i }));
  const anchor = pts.reduce((a, b) => (b.y > a.y || (b.y === a.y && b.x < a.x) ? b : a));
  const rest = pts
    .filter((p) => p !== anchor)
    .sort((a, b) => Math.atan2(anchor.y - a.y, a.x - anchor.x) - Math.atan2(anchor.y - b.y, b.x - anchor.x));
  // Screen y points down, so a left turn has a negative cross product here.
  const cross = (o: typeof anchor, a: typeof anchor, b: typeof anchor) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const stack = [anchor];
  const frames: { stack: number[]; dropped?: number; closed?: boolean }[] = [{ stack: [anchor.i] }];
  for (const p of rest) {
    while (stack.length > 1 && cross(stack[stack.length - 2], stack[stack.length - 1], p) >= 0) {
      const gone = stack.pop()!;
      frames.push({ stack: [...stack.map((s) => s.i), p.i], dropped: gone.i });
    }
    stack.push(p);
    frames.push({ stack: stack.map((s) => s.i) });
  }
  frames.push({ stack: stack.map((s) => s.i), closed: true });
  return frames;
};

export const PegsVignette: React.FC<VignetteProps> = (props) => {
  const [PEGS, setPegs] = useState(DEFAULT_PEGS);
  const frames = useMemo(() => hullFrames(PEGS), [PEGS]);
  const loop = useLoop(frames.length, 900, PEGS);
  const { stack, dropped, closed } = frames[loop.i];
  const pts = stack.map((k) => `${PEGS[k].x},${PEGS[k].y}`).join(' ');
  return (
    <Frame
      loop={loop}
      label="Graham's Scan: a rubber band stretched around pegs, skipping every peg that makes a dent"
      onShuffle={() => setPegs(scatterPegs())}
      {...props}
    >
      {closed && <polygon points={pts} fill="#f2c21a" opacity={0.35} />}
      <polyline
        points={closed ? `${pts} ${PEGS[stack[0]].x},${PEGS[stack[0]].y}` : pts}
        fill="none"
        stroke="#d6453d"
        strokeWidth={9}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {PEGS.map((p, k) => {
        const on = stack.includes(k);
        return (
          <g key={k}>
            <circle cx={p.x} cy={p.y + 5} r={14} fill="#a77d4a" />
            <circle cx={p.x} cy={p.y} r={14} fill={k === dropped ? '#9ca3af' : on ? '#2b2116' : '#6b5844'} style={{ transition: 'fill 300ms' }} />
            <circle cx={p.x - 4} cy={p.y - 4} r={4} fill="#fff" opacity={0.5} />
          </g>
        );
      })}
    </Frame>
  );
};

/* ── Randomized Quicksort: kids lining up by height around a pivot kid ────────────────── */

const DEFAULT_HEIGHTS = [38, 27, 43, 3, 9, 82, 10, 19, 50];
const KID_COLOURS = ['#e0453a', '#2f7fd0', '#f2b90f', '#3f8f3a', '#8b5cf6', '#f97316', '#0f9b8e', '#db2777', '#64748b'];

/** Nine different heights between 3 and 90. */
const shuffleHeights = () => {
  const pool = Array.from({ length: 88 }, (_, k) => k + 3).sort(() => Math.random() - 0.5);
  return pool.slice(0, 9);
};

/** Partition rounds: the pivot is drawn, then shorter kids move left of it and taller kids right. */
const sortFrames = (HEIGHTS: number[]) => {
  let order = HEIGHTS.map((_, i) => i);
  const done = new Set<number>();
  const frames: { order: number[]; pivot?: number; done: number[] }[] = [{ order: [...order], done: [] }];
  // A fixed sequence of "random" picks, so the loop is the same every time.
  let seed = 7;
  const rand = (n: number) => {
    seed = (seed * 9301 + 49297) % 233280;
    return Math.floor((seed / 233280) * n);
  };
  const ranges: [number, number][] = [[0, order.length - 1]];
  while (ranges.length) {
    const [lo, hi] = ranges.shift()!;
    if (lo > hi) continue;
    if (lo === hi) {
      done.add(order[lo]);
      continue;
    }
    const slice = order.slice(lo, hi + 1);
    const pivot = slice[rand(slice.length)];
    frames.push({ order: [...order], pivot, done: [...done] });
    const less = slice.filter((k) => HEIGHTS[k] < HEIGHTS[pivot]);
    const more = slice.filter((k) => HEIGHTS[k] > HEIGHTS[pivot]);
    order = [...order.slice(0, lo), ...less, pivot, ...more, ...order.slice(hi + 1)];
    done.add(pivot);
    frames.push({ order: [...order], pivot, done: [...done] });
    ranges.push([lo, lo + less.length - 1], [lo + less.length + 1, hi]);
  }
  frames.push({ order: [...order], done: order });
  return frames;
};

export const KidsVignette: React.FC<VignetteProps> = (props) => {
  const [HEIGHTS, setHeights] = useState(DEFAULT_HEIGHTS);
  const frames = useMemo(() => sortFrames(HEIGHTS), [HEIGHTS]);
  const loop = useLoop(frames.length, 1000, HEIGHTS);
  const { order, pivot, done } = frames[loop.i];
  const gap = 66;
  const x0 = 320 - (gap * (HEIGHTS.length - 1)) / 2;
  return (
    <Frame
      loop={loop}
      label="Randomized Quicksort: kids line up by height around a randomly picked kid"
      onShuffle={() => setHeights(shuffleHeights())}
      {...props}
    >
      <rect x={20} y={352} width={600} height={14} rx={7} fill="#c9a06b" />
      {HEIGHTS.map((h, k) => {
        const slot = order.indexOf(k);
        const height = 64 + h * 2.4;
        const isPivot = k === pivot;
        const settled = done.includes(k);
        return (
          <g key={k} style={move(x0 + slot * gap, 352 - (isPivot ? 16 : 0), 750)}>
            <rect x={-22} y={-height + 36} width={44} height={height - 36} rx={18} fill={KID_COLOURS[k]} opacity={settled || isPivot || pivot === undefined ? 1 : 0.85} />
            <circle cx={0} cy={-height + 18} r={20} fill="#f2c79b" />
            <circle cx={-7} cy={-height + 16} r={2.6} fill="#2b2116" />
            <circle cx={7} cy={-height + 16} r={2.6} fill="#2b2116" />
            {isPivot && <path d={`M-8 ${-height - 14} l8 -12 l8 12 Z`} fill="currentColor" />}
            {settled && <circle cx={0} cy={30} r={6} fill="currentColor" />}
          </g>
        );
      })}
    </Frame>
  );
};

export const VIGNETTES: Record<string, React.FC<VignetteProps>> = {
  'fractional-knapsack': CheeseVignette,
  'ford-fulkerson': PipesVignette,
  'n-queens': QueensVignette,
  'graham-scan': PegsVignette,
  'randomized-quicksort': KidsVignette,
};
