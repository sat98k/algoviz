import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWidth } from './StateSpaceTree';
import { useTweened } from './useAnimPhases';
import { pageZoom } from '../../utils/pageZoom';
import type { TreeNodeData } from '../visualizers/RecursionTreeVisualizer';

/**
 * 🌳 Recursion tree for Karatsuba (optional view inside the Helpers Workshop scene).
 *
 * Every box is one multiplication job "X × Y". A job that is not a single digit is cut in
 * half and handed to exactly three helpers (P1 = a·c, P2 = b·d, P3 = (a+b)·(c+d)), so every
 * split has three branches, not four. Jobs not reached yet are faint outlines, so the whole
 * plan is visible from the start. When a helper finishes, its answer rides back up its branch
 * to the parent, which combines the three answers. Click any job for a plain-English summary.
 */

const NODE_H = 46;
const ROW_H = 150;
const GAP = 40;
const PAD = 24;
const TOP = 30;
const PANEL_H = 400;
/** Screen pixels per tree unit. */
const ZOOMS = [0.5, 0.65, 0.8, 1, 1.25, 1.5];
const DEFAULT_ZOOM = 3;
const MAP_W = 132;
const MAP_H = 70;

type Role = 'P1' | 'P2' | 'P3';

/** One multiplication job the recursion will run, worked out ahead of time with the same rule as the algorithm. */
interface Job {
  key: string;
  x: string;
  y: string;
  depth: number;
  role?: Role;
  parent?: string;
  children: string[];
  base: boolean;
  m?: number;
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  product: string;
}

/** Every job Karatsuba will run, in the order it starts them (P1, then P2, then P3, depth first). */
function plan(num1: string, num2: string): Job[] {
  const out: Job[] = [];
  const go = (x: bigint, y: bigint, depth: number, parent?: string, role?: Role): bigint => {
    const job: Job = { key: `${out.length}`, x: x.toString(), y: y.toString(), depth, parent, role, children: [], base: x < 10n || y < 10n, product: '' };
    out.push(job);
    if (job.base) {
      job.product = (x * y).toString();
      return x * y;
    }
    const m = Math.floor(Math.max(job.x.length, job.y.length) / 2);
    const p = 10n ** BigInt(m);
    const [a, b, c, d] = [x / p, x % p, y / p, y % p];
    Object.assign(job, { m, a: a.toString(), b: b.toString(), c: c.toString(), d: d.toString() });
    const kids: [bigint, bigint, Role][] = [
      [a, c, 'P1'],
      [b, d, 'P2'],
      [a + b, c + d, 'P3'],
    ];
    const results = kids.map(([u, v, r]) => {
      job.children.push(`${out.length}`);
      return go(u, v, depth + 1, job.key, r);
    });
    const [p1, p2, p3] = results;
    const prod = p1 * p * p + (p3 - p1 - p2) * p + p2;
    job.product = prod.toString();
    return prod;
  };
  if (/^\d+$/.test(num1) && /^\d+$/.test(num2)) go(BigInt(num1), BigInt(num2), 0);
  return out;
}

const ROLE_STYLE: Record<Role, { fill: string; stroke: string; ink: string; text: string }> = {
  P1: { fill: '#fef3c7', stroke: '#d97706', ink: '#78350f', text: 'P1 a·c' },
  P2: { fill: '#e0f2fe', stroke: '#0284c7', ink: '#075985', text: 'P2 b·d' },
  P3: { fill: '#dcfce7', stroke: '#16a34a', ink: '#14532d', text: 'P3 (a+b)(c+d)' },
};

interface Props {
  num1: string;
  num2: string;
  nodes: TreeNodeData[];
  activeId?: string;
  /** The step's title, which says which helper is about to start (Step 2A / 2B / 2C) or that answers are being combined. */
  title: string;
  isFinal: boolean;
  stepKey: number;
}

export const KaratsubaTreeView: React.FC<Props> = ({ num1, num2, nodes, activeId, title, isFinal, stepKey }) => {
  const jobs = useMemo(() => plan(num1, num2), [num1, num2]);
  const byKey = useMemo(() => new Map(jobs.map((j) => [j.key, j])), [jobs]);

  // The algorithm records jobs in the order it starts them, which is the order of the plan.
  const stateOf = (j: Job): TreeNodeData | undefined => {
    const nd = nodes[Number(j.key)];
    return nd && nd.label === `${j.x} × ${j.y}` ? nd : undefined;
  };
  const activeKey = jobs.find((j) => stateOf(j)?.id === activeId)?.key;
  const isDone = (nd?: TreeNodeData) => !!nd && ['base_case', 'resolved', 'optimal'].includes(nd.status) && nd.result !== undefined;

  // ── Layout: children side by side under their parent, every parent centred over its children ──
  const boxW = (j: Job) => Math.max(92, `${j.x} × ${j.y}`.length * 8.4 + 26);
  const layout = useMemo(() => {
    const pos = new Map<string, { x: number; y: number; w: number }>();
    const span = new Map<string, number>();
    const spanOf = (j: Job): number => {
      const kids = j.children.map((k) => byKey.get(k)!);
      const s = Math.max(boxW(j), kids.length ? kids.reduce((a, k) => a + spanOf(k), 0) + GAP * (kids.length - 1) : 0);
      span.set(j.key, s);
      return s;
    };
    const place = (j: Job, left: number) => {
      const s = span.get(j.key)!;
      const kids = j.children.map((k) => byKey.get(k)!);
      const kidsW = kids.reduce((a, k) => a + span.get(k.key)!, 0) + GAP * Math.max(0, kids.length - 1);
      let cur = left + (s - kidsW) / 2;
      for (const k of kids) {
        place(k, cur);
        cur += span.get(k.key)! + GAP;
      }
      pos.set(j.key, { x: left + s / 2, y: TOP + j.depth * ROW_H, w: boxW(j) });
    };
    if (jobs[0]) {
      spanOf(jobs[0]);
      place(jobs[0], PAD);
    }
    const width = (jobs[0] ? span.get(jobs[0].key)! : 0) + PAD * 2;
    const height = TOP + Math.max(0, ...jobs.map((j) => j.depth)) * ROW_H + NODE_H + 44;
    return { pos, width, height };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, byKey]);
  const { pos, width, height } = layout;

  // Which helper the active job is about to call, and whether it is combining its helpers' answers.
  const pendingRole: Role | undefined = /^Step 2A/.test(title) ? 'P1' : /^Step 2B/.test(title) ? 'P2' : /^Step 2C/.test(title) ? 'P3' : undefined;
  const combining = /^Step [34]/.test(title);

  const [picked, setPickedRaw] = useState<string | undefined>(undefined);
  const shownKey = picked ?? (isFinal ? jobs[0]?.key : activeKey) ?? jobs[0]?.key;

  // ── Camera: follows the current (or clicked) job at a readable zoom; drag to look around ──
  const [wrapRef, widthPx] = useWidth(640);
  const [mode, setMode] = useState<'follow' | 'whole' | 'free'>('follow');
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);
  const [freeCenter, setFreeCenter] = useState<{ x: number; y: number } | null>(null);
  const zi = zoomIdx ?? (widthPx < 480 ? DEFAULT_ZOOM - 1 : DEFAULT_ZOOM);
  const scale = ZOOMS[zi];
  const viewW = widthPx / scale;
  const viewH = PANEL_H / scale;
  // A new step brings the camera back to the job being worked on.
  useEffect(() => {
    setPickedRaw(undefined);
    setMode((m) => (m === 'whole' ? m : 'follow'));
  }, [stepKey]);
  const setPicked = (k: string | undefined) => {
    setPickedRaw(k);
    setMode('follow');
  };

  const focus = shownKey !== undefined ? byKey.get(shownKey) : undefined;
  const along = (lo: number, hi: number, size: number, want: number) => (hi - lo <= size ? (lo + hi) / 2 : Math.min(hi - size / 2, Math.max(lo + size / 2, want)));
  let cam: [number, number, number, number];
  if (mode === 'whole') {
    const s = Math.max(width / viewW, height / viewH, 1e-6);
    const w = viewW * Math.max(1, s);
    const h = viewH * Math.max(1, s);
    cam = [width / 2 - w / 2, height / 2 - h / 2, w, h];
  } else {
    const fp = focus ? pos.get(focus.key) : undefined;
    const want =
      mode === 'free' && freeCenter
        ? freeCenter
        : fp && focus
        ? // Aim a little below a split job so its three helpers are in view too.
          { x: fp.x, y: fp.y + NODE_H / 2 + (focus.children.length ? ROW_H * 0.22 : -ROW_H * 0.35) }
        : { x: width / 2, y: height / 2 };
    cam = [along(0, width, viewW, want.x) - viewW / 2, along(0, height, viewH, want.y) - viewH / 2, viewW, viewH];
  }
  const [camX, camY, camW, camH] = useTweened(cam, 600);

  // Drag to pan (a drag never counts as a click on a job).
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, cx: camX + camW / 2, cy: camY + camH / 2, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    // Pointer moves are in screen pixels; widthPx is in the page's (zoomed) CSS pixels.
    const k = camW / Math.max(1, widthPx) / pageZoom();
    setMode('free');
    setFreeCenter({ x: d.cx - dx * k, y: d.cy - dy * k });
  };
  const endDrag = () => {
    window.setTimeout(() => (drag.current = null), 0);
  };
  const clickJob = (key: string) => {
    if (drag.current?.moved) return;
    setPicked(key === picked ? undefined : key);
  };

  const chipW = (text: string) => text.length * 6.6 + 16;

  // ── Branches: parent to each of its three helpers ──
  const branches = jobs
    .filter((j) => j.parent !== undefined)
    .map((j) => {
      const parent = byKey.get(j.parent!)!;
      const pp = pos.get(parent.key)!;
      const cp = pos.get(j.key)!;
      const nd = stateOf(j);
      const parentNd = stateOf(parent);
      const done = isDone(nd);
      const style = ROLE_STYLE[j.role!];
      const calling = parent.key === activeKey && pendingRole === j.role && !nd;
      const merging = parent.key === activeKey && combining && done;
      const fresh = nd?.id === activeId && done;
      const x0 = pp.x;
      const y0 = pp.y + NODE_H;
      const x1 = cp.x;
      const y1 = cp.y;
      const at = (t: number) => ({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
      const roleAt = at(0.6);
      const ansAt = at(0.87);
      const answer = done ? `↑${nd!.result}` : '';
      return (
        <g key={`b-${j.key}`} data-branch={j.role} opacity={nd || calling ? 1 : 0.4}>
          {merging && <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#fde047" strokeWidth="9" strokeLinecap="round" />}
          <line
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            stroke={calling ? '#ea580c' : nd ? style.stroke : '#d6d3d1'}
            strokeWidth={calling ? 3 : nd ? 2 : 1.5}
            strokeDasharray={nd ? undefined : '5 4'}
            className={calling ? 'animate-flow-dash' : undefined}
          />
          {(parentNd || calling) && (
            <g transform={`translate(${roleAt.x}, ${roleAt.y})`}>
              <rect x={-chipW(style.text) / 2} y="-9" width={chipW(style.text)} height="18" rx="9" fill={style.fill} stroke={style.stroke} strokeWidth={calling ? 2 : 1} />
              <text textAnchor="middle" y="4" fontSize="10.5" fontWeight="800" fill={style.ink}>
                {style.text}
              </text>
            </g>
          )}
          {/* the helper's answer travelling back up to its parent */}
          {done && (
            <g transform={`translate(${ansAt.x}, ${ansAt.y})`}>
              <g key={fresh ? `up-${stepKey}` : 'up'} className={fresh ? 'animate-story-pop' : undefined}>
                <rect x={-chipW(answer) / 2} y="-10" width={chipW(answer)} height="20" rx="10" fill={merging ? '#f59e0b' : '#ffffff'} stroke={merging ? '#b45309' : '#d6c3a5'} />
                <text textAnchor="middle" y="4" fontSize="11" fontWeight="800" fill={merging ? '#451a03' : '#57534e'} fontFamily="ui-monospace, monospace">
                  {answer}
                </text>
              </g>
            </g>
          )}
        </g>
      );
    });

  // ── Jobs ──
  const boxes = jobs.map((j) => {
    const p = pos.get(j.key)!;
    const nd = stateOf(j);
    const done = isDone(nd);
    const isActive = j.key === activeKey && !isFinal;
    const isShown = j.key === shownKey;
    const kidsDone = j.children.filter((k) => isDone(stateOf(byKey.get(k)!))).length;
    const x0 = p.x - p.w / 2;
    const line2 = !nd
      ? j.base
        ? 'later · one digit'
        : 'later'
      : done
      ? `= ${nd.result}`
      : j.base
      ? '🧮 multiply'
      : nd.status === 'dividing' && title.startsWith('Recursive Call') && isActive
      ? 'new job'
      : `cut m=${j.m} · ⏳ ${kidsDone}/3 helpers`;
    const fill = !nd ? 'transparent' : nd.status === 'optimal' ? '#fde68a' : done ? (j.base ? '#f0fdf4' : '#fef9c3') : '#ffffff';
    const outline = !nd ? '#d6d3d1' : nd.status === 'optimal' ? '#b45309' : isActive ? '#ea580c' : done ? (j.base ? '#16a34a' : '#ca8a04') : '#a8896a';
    return (
      <g key={`j-${j.key}`} data-job={`${j.x}x${j.y}`} data-state={nd ? nd.status : 'later'} onClick={() => clickJob(j.key)} style={{ cursor: 'pointer' }}>
        {isActive && <rect x={x0 - 7} y={p.y - 7} width={p.w + 14} height={NODE_H + 14} rx="14" fill="none" stroke="#f59e0b" strokeWidth="3" className="animate-story-halo" />}
        <rect
          x={x0}
          y={p.y}
          width={p.w}
          height={NODE_H}
          rx="10"
          fill={fill}
          stroke={isShown ? '#7c3aed' : outline}
          strokeWidth={isShown || isActive ? 2.5 : 1.5}
          strokeDasharray={nd ? undefined : '4 4'}
        />
        <text x={p.x} y={p.y + 19} textAnchor="middle" fontSize="13.5" fontWeight="900" fill={nd ? '#1c1917' : '#a8a29e'} fontFamily="ui-monospace, monospace">
          {j.x} × {j.y}
        </text>
        <text x={p.x} y={p.y + 36} textAnchor="middle" fontSize="11" fontWeight="700" fill={done ? (j.base ? '#166534' : '#78350f') : nd ? '#78716c' : '#c4bfba'}>
          {line2}
        </text>
        {nd?.status === 'optimal' && (
          <text x={x0 + p.w - 4} y={p.y - 2} fontSize="15">
            ★
          </text>
        )}
        {isActive && (
          <g transform={`translate(${x0 - 4}, ${p.y - 16})`}>
            <rect x="0" y="-9" width="32" height="16" rx="8" fill="#ea580c" />
            <text x="16" y="3" textAnchor="middle" fontSize="10" fontWeight="800" fill="#ffffff">
              now
            </text>
          </g>
        )}
      </g>
    );
  });

  // ── Plain-English card for the picked (or current) job ──
  const card = (() => {
    const j = shownKey !== undefined ? byKey.get(shownKey) : undefined;
    if (!j) return null;
    const nd = stateOf(j);
    const parent = j.parent !== undefined ? byKey.get(j.parent) : undefined;
    const kids = j.children.map((k) => byKey.get(k)!);
    const kidResult = (k: Job) => {
      const s = stateOf(k);
      return isDone(s) ? String(s!.result) : undefined;
    };
    const whose = parent && j.role ? (
      <>
        {' '}
        — helper {j.role} of {parent.x} × {parent.y}
      </>
    ) : null;
    let body: React.ReactNode;
    if (!nd) body = <>Not reached yet. {j.base ? 'One number is a single digit, so it will be multiplied directly.' : 'It will be cut in half and handed to three helpers, like its parent.'}</>;
    else if (j.base)
      body = isDone(nd) ? (
        <>
          One number is a single digit, so no more cutting: multiply directly, <b>{j.x} × {j.y} = {String(nd.result)}</b>, and hand the answer back.
        </>
      ) : (
        <>One number is a single digit, so it is multiplied directly.</>
      );
    else {
      const [p1, p2, p3] = kids.map(kidResult);
      const helper = (k: Job, r?: string) => (
        <li key={k.key}>
          <b>{k.role}</b> = {k.role === 'P1' ? 'a × c' : k.role === 'P2' ? 'b × d' : '(a+b) × (c+d)'} = {k.x} × {k.y}
          {r !== undefined ? (
            <>
              {' '}
              = <b>{r}</b> ✓
            </>
          ) : (
            ' ⏳'
          )}
        </li>
      );
      body = (
        <>
          Cut {j.m} digit{j.m === 1 ? '' : 's'} from the right: a = {j.a}, b = {j.b} (from {j.x}) and c = {j.c}, d = {j.d} (from {j.y}). Three helpers instead of four:
          <ul className="list-disc ml-5 my-1">{kids.map((k, i) => helper(k, [p1, p2, p3][i]))}</ul>
          {isDone(nd) && p1 !== undefined && p2 !== undefined && p3 !== undefined && (
            <>
              Middle part = P3 − P1 − P2 = {p3} − {p1} − {p2} = <b>{(BigInt(p3) - BigInt(p1) - BigInt(p2)).toString()}</b>. Put back together by place value: <b>{String(nd.result)}</b>.
            </>
          )}
        </>
      );
    }
    return (
      <div className="mt-3 rounded-xl border border-violet-200 bg-white px-4 py-3 font-sans text-sm text-stone-700" data-job-card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <span className="font-bold text-stone-900">
            🔍 {j.x} × {j.y}
            <span className="font-normal text-stone-500">{whose}</span>
          </span>
          {picked && (
            <button type="button" onClick={() => setPicked(undefined)} className="text-xs font-semibold text-violet-700 hover:underline">
              Follow the current job
            </button>
          )}
        </div>
        <div className="leading-relaxed">{body}</div>
        {isFinal && j.depth === 0 && (
          <p className="mt-1 text-amber-800 font-semibold">
            That is the final answer: {num1} × {num2} = {String(nd?.result ?? j.product)}, using {jobs.length} multiplication jobs.
          </p>
        )}
      </div>
    );
  })();

  return (
    <div data-karatsuba-tree>
      <p className="font-sans text-xs text-stone-600 mb-2">
        Going <b>down</b>, each job is cut in half and handed to <b>three</b> helpers (never four). Going <b>up</b>, each helper hands its answer back, and the parent combines the three. Click any job to read about it, or drag to look around.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 font-sans text-xs font-semibold">
        <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => {
              setPickedRaw(undefined);
              setMode('follow');
            }}
            aria-pressed={mode === 'follow' && !picked}
            className={`px-3 py-1 rounded-full transition-colors ${mode === 'follow' && !picked ? 'bg-amber-500 text-white' : 'text-stone-600 hover:bg-amber-50'}`}
          >
            🎯 Follow
          </button>
          <button
            type="button"
            onClick={() => setMode('whole')}
            aria-pressed={mode === 'whole'}
            className={`px-3 py-1 rounded-full transition-colors ${mode === 'whole' ? 'bg-amber-500 text-white' : 'text-stone-600 hover:bg-amber-50'}`}
          >
            🗺️ Whole tree
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-white p-0.5" aria-label="Zoom">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zi === 0}
            onClick={() => setZoomIdx(Math.max(0, zi - 1))}
            className="w-7 h-7 rounded-full text-base text-stone-700 hover:bg-amber-50 disabled:opacity-30"
          >
            −
          </button>
          <span className="w-11 text-center text-stone-600 tabular-nums">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zi === ZOOMS.length - 1}
            onClick={() => setZoomIdx(Math.min(ZOOMS.length - 1, zi + 1))}
            className="w-7 h-7 rounded-full text-base text-stone-700 hover:bg-amber-50 disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full rounded-xl border border-amber-200 bg-[#fdfaf5] touch-none select-none"
        style={{ height: PANEL_H, cursor: drag.current?.moved ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <svg viewBox={`${camX} ${camY} ${camW} ${camH}`} preserveAspectRatio="xMidYMid meet" className="block w-full h-full" role="img" aria-label="Recursion tree">
          {branches}
          {boxes}
        </svg>
        {mode !== 'whole' && (camW < width || camH < height) && (
          <svg width={MAP_W} height={MAP_H} className="absolute top-2 right-2 rounded-lg border border-amber-200 bg-white/90 shadow-sm pointer-events-none" aria-hidden>
            {(() => {
              const ms = Math.min(MAP_W / width, MAP_H / height);
              const ox = (MAP_W - width * ms) / 2;
              const oy = (MAP_H - height * ms) / 2;
              return (
                <>
                  {jobs.map((j) => {
                    const p = pos.get(j.key)!;
                    const nd = stateOf(j);
                    return (
                      <rect
                        key={`m-${j.key}`}
                        x={ox + (p.x - p.w / 2) * ms}
                        y={oy + p.y * ms}
                        width={Math.max(2, p.w * ms)}
                        height={Math.max(2, NODE_H * ms)}
                        rx="1"
                        fill={j.key === activeKey ? '#ea580c' : isDone(nd) ? '#facc15' : nd ? '#d6c3a5' : '#e7e5e4'}
                      />
                    );
                  })}
                  <rect x={ox + camX * ms} y={oy + camY * ms} width={camW * ms} height={camH * ms} fill="none" stroke="#d97706" strokeWidth="1.5" rx="2" />
                </>
              );
            })()}
          </svg>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 font-sans text-[11px] text-stone-600">
        {(['P1', 'P2', 'P3'] as Role[]).map((r) => (
          <span key={r}>
            <span className="inline-block w-3 h-3 align-[-2px] rounded mr-1 border" style={{ background: ROLE_STYLE[r].fill, borderColor: ROLE_STYLE[r].stroke }} />
            {ROLE_STYLE[r].text}
          </span>
        ))}
        <span>↑ answer handed back to the parent (gold = being combined now)</span>
        <span>⏳ waiting for its helpers</span>
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded border border-green-600 bg-green-50 mr-1" />
          single digit: multiplied directly
        </span>
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded border border-dashed border-stone-400 mr-1" />
          not reached yet
        </span>
      </div>
      {card}
    </div>
  );
};
