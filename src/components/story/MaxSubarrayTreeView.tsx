import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWidth } from './StateSpaceTree';
import { useTweened } from './useAnimPhases';
import type { TreeNodeData } from '../visualizers/RecursionTreeVisualizer';
import type { CrossScan } from '../../algorithms/maxSubarray';

/**
 * 🌳 Split & merge tree for Maximum Subarray (optional view inside the Coin Road scene).
 *
 * The road physically falls apart into smaller pieces as we go down: every piece is a
 * mini coin road, sitting under the part of its parent it came from. Pieces not reached
 * yet are faint outlines, so the whole plan is visible from the start. When a piece is
 * solved its best stretch glows, and its answer rides back up the funnel to the parent,
 * where left, crossing and right compete. Click any piece for a plain-English summary.
 */

const T = 34; // one tile slot
const TILE = 30;
const GAP = 16; // extra room opened by each cut
const PAD = 22;
const ROW_H = 122;
const TOP = 34;
const PANEL_H = 400;
/** Screen pixels per tree unit. Tiles are drawn 30 units wide, so 1.25 shows them about 38px. */
const ZOOMS = [0.6, 0.8, 1, 1.25, 1.5, 1.8];
const DEFAULT_ZOOM = 3;
const MAP_W = 132;
const MAP_H = 70;

type Range = { low: number; high: number; mid?: number; depth: number; key: string };

const keyOf = (low: number, high: number) => `${low}-${high}`;

/** Every piece the recursion will ever visit, with its depth (mid = floor((low + high) / 2)). */
function skeleton(n: number): Range[] {
  const out: Range[] = [];
  const go = (low: number, high: number, depth: number) => {
    if (low > high) return;
    const mid = low === high ? undefined : Math.floor((low + high) / 2);
    out.push({ low, high, mid, depth, key: keyOf(low, high) });
    if (mid !== undefined) {
      go(low, mid, depth + 1);
      go(mid + 1, high, depth + 1);
    }
  };
  if (n > 0) go(0, n - 1, 0);
  return out;
}

interface Props {
  arr: number[];
  nodes: TreeNodeData[];
  activeId?: string;
  scan?: CrossScan;
  isFinal: boolean;
  stepKey: number;
  /** The owl's sentence for this step, repeated next to the tree. */
  narration?: string;
  /** e.g. "Step 12 of 88". */
  stepLabel?: string;
}

export const MaxSubarrayTreeView: React.FC<Props> = ({ arr, nodes, activeId, scan, isFinal, stepKey, narration, stepLabel }) => {
  const n = arr.length;
  const plan = useMemo(() => skeleton(n), [n]);
  const maxDepth = Math.max(0, ...plan.map((r) => r.depth));
  // A cut at boundary b (between tiles b-1 and b) made at depth k pushes pieces deeper than k apart.
  const cuts = plan.filter((r) => r.mid !== undefined).map((r) => ({ b: r.mid! + 1, depth: r.depth }));
  const gapsBefore = (low: number, depth: number) => cuts.filter((c) => c.depth < depth && c.b <= low).length;
  const px = (r: { low: number; depth: number }) => PAD + r.low * T + gapsBefore(r.low, r.depth) * GAP;
  const pw = (r: { low: number; high: number }) => (r.high - r.low + 1) * T - (T - TILE);
  const py = (depth: number) => TOP + depth * ROW_H;
  const width = PAD * 2 + n * T + cuts.length * GAP - (T - TILE);
  const height = py(maxDepth) + TILE + 62;

  const byRange = new Map<string, TreeNodeData>();
  for (const nd of nodes) if (nd.range) byRange.set(keyOf(nd.range[0], nd.range[1]), nd);
  const active = nodes.find((nd) => nd.id === activeId);
  const activeKey = active?.range ? keyOf(active.range[0], active.range[1]) : undefined;

  const [picked, setPickedRaw] = useState<string | undefined>(undefined);
  const shownKey = picked ?? activeKey ?? plan[0]?.key;

  // ── Camera: follows the current (or clicked) piece at a readable zoom; drag to look around ──
  const [wrapRef, widthPx] = useWidth(640);
  const [mode, setMode] = useState<'follow' | 'whole' | 'free'>('follow');
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);
  const [freeCenter, setFreeCenter] = useState<{ x: number; y: number } | null>(null);
  const zi = zoomIdx ?? (widthPx < 480 ? DEFAULT_ZOOM - 1 : DEFAULT_ZOOM);
  const scale = ZOOMS[zi];
  const viewW = widthPx / scale;
  const viewH = PANEL_H / scale;
  // A new step brings the camera back to the piece being worked on.
  useEffect(() => {
    setPickedRaw(undefined);
    setMode((m) => (m === 'whole' ? m : 'follow'));
  }, [stepKey]);
  const setPicked = (k: string | undefined) => {
    setPickedRaw(k);
    setMode('follow');
  };

  const focusRange = plan.find((p) => p.key === (picked ?? (isFinal ? plan[0]?.key : activeKey ?? plan[0]?.key)));
  const along = (lo: number, hi: number, size: number, want: number) => (hi - lo <= size ? (lo + hi) / 2 : Math.min(hi - size / 2, Math.max(lo + size / 2, want)));
  let cam: [number, number, number, number];
  if (mode === 'whole') {
    const s = Math.max(width / viewW, height / viewH, 1e-6);
    const w = viewW * Math.max(1, s);
    const h = viewH * Math.max(1, s);
    cam = [width / 2 - w / 2, height / 2 - h / 2, w, h];
  } else {
    const want =
      mode === 'free' && freeCenter
        ? freeCenter
        : focusRange
        ? // Aim a little below the piece so the pieces it splits into are in view too.
          { x: px(focusRange) + pw(focusRange) / 2, y: py(focusRange.depth) + TILE / 2 + (focusRange.mid !== undefined ? ROW_H * 0.4 : -ROW_H * 0.3) }
        : { x: width / 2, y: height / 2 };
    const cx = along(0, width, viewW, want.x);
    const cy = along(0, height, viewH, want.y);
    cam = [cx - viewW / 2, cy - viewH / 2, viewW, viewH];
  }
  const [camX, camY, camW, camH] = useTweened(cam, 600);

  // Drag to pan (a drag never counts as a click on a piece).
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
    const k = camW / Math.max(1, widthPx);
    setMode('free');
    setFreeCenter({ x: d.cx - dx * k, y: d.cy - dy * k });
  };
  const endDrag = () => {
    window.setTimeout(() => (drag.current = null), 0);
  };
  const clickPiece = (key: string) => {
    if (drag.current?.moved) return;
    setPicked(key === picked ? undefined : key);
  };

  const parentOf = (r: Range) => plan.find((p) => p.mid !== undefined && p.low <= r.low && p.high >= r.high && p.depth === r.depth - 1);

  const tilesText = (a: number, b: number) => (a === b ? `tile ${a + 1}` : `tiles ${a + 1}–${b + 1}`);
  const isDone = (nd?: TreeNodeData) => !!nd && ['base_case', 'resolved', 'optimal'].includes(nd.status) && !!nd.result;

  // Small enough to fit between neighbouring single-tile pieces.
  const chipW = (v: number) => `${v}`.length * 7 + 20;

  // ── Funnels: each child piece hangs under the slice of its parent it came from ──
  const funnels = plan
    .filter((r) => r.depth > 0)
    .map((r) => {
      const p = parentOf(r)!;
      const nd = byRange.get(r.key);
      const parent = byRange.get(p.key);
      const isLeft = r.low === p.low;
      const sx0 = px(p) + (r.low - p.low) * T;
      const sx1 = sx0 + pw(r);
      const cx0 = px(r);
      const cx1 = cx0 + pw(r);
      const y0 = py(p.depth) + TILE + 4;
      const y1 = py(r.depth) - 4;
      const done = isDone(nd);
      const won = parent?.winner === (isLeft ? 'LSum' : 'RSum') && isDone(parent);
      const fresh = nd?.id === activeId;
      return (
        <g key={`f-${r.key}`} opacity={nd ? 1 : 0.35}>
          <path
            d={`M ${sx0} ${y0} L ${sx1} ${y0} L ${cx1} ${y1} L ${cx0} ${y1} Z`}
            fill={won ? '#fde68a' : done ? '#fef3c7' : nd ? '#efe3d3' : 'none'}
            opacity={nd ? 0.75 : 1}
            stroke={won ? '#d97706' : nd ? '#d6c3a5' : '#d6d3d1'}
            strokeDasharray={nd ? undefined : '4 4'}
          />
          {/* the answer travelling back up to the parent */}
          {done && nd?.result && (
            <g transform={`translate(${(sx0 + sx1 + cx0 + cx1) / 4}, ${(y0 + y1) / 2})`}>
              <g key={fresh ? `up-${stepKey}` : 'up'} className={fresh ? 'animate-story-pop' : undefined}>
                <rect x={-chipW(nd.result.maxSum) / 2} y="-10" width={chipW(nd.result.maxSum)} height="20" rx="10" fill={won ? '#f59e0b' : '#ffffff'} stroke={won ? '#b45309' : '#d6c3a5'} />
                <text textAnchor="middle" y="4" fontSize="11" fontWeight="800" fill={won ? '#451a03' : '#57534e'}>
                  ↑{nd.result.maxSum}
                </text>
              </g>
            </g>
          )}
        </g>
      );
    });

  // ── Pieces ──
  const pieces = plan.map((r) => {
    const nd = byRange.get(r.key);
    const x0 = px(r);
    const y0 = py(r.depth);
    const isActive = r.key === activeKey && !isFinal;
    const isShown = r.key === shownKey;
    const done = isDone(nd);
    const res = nd?.result as { maxSum: number; low: number; high: number } | undefined;
    const scanning = isActive && scan && scan.low === r.low && scan.high === r.high ? scan : undefined;
    const outline = !nd
      ? '#d6d3d1'
      : nd.status === 'optimal'
      ? '#b45309'
      : isActive
      ? '#ea580c'
      : done
      ? '#ca8a04'
      : nd.status === 'combining'
      ? '#0284c7'
      : '#a8896a';
    return (
      <g
        key={`p-${r.key}`}
        data-piece={r.key}
        data-state={nd ? nd.status : 'later'}
        onClick={() => clickPiece(r.key)}
        style={{ cursor: 'pointer' }}
      >
        {isActive && <rect x={x0 - 7} y={y0 - 7} width={pw(r) + 14} height={TILE + 14} rx="12" fill="none" stroke="#f59e0b" strokeWidth="3" className="animate-story-halo" />}
        <rect
          x={x0 - 4}
          y={y0 - 4}
          width={pw(r) + 8}
          height={TILE + 8}
          rx="9"
          fill={nd ? '#d6c3a5' : 'transparent'}
          stroke={isShown ? '#7c3aed' : outline}
          strokeWidth={isShown || isActive ? 2.5 : 1.5}
          strokeDasharray={nd ? undefined : '4 4'}
        />
        {/* best stretch of this piece */}
        {done && res && (
          <rect x={px(r) + (res.low - r.low) * T - 3} y={y0 - 3} width={(res.high - res.low + 1) * T - (T - TILE) + 6} height={TILE + 6} rx="8" fill="#fde047" />
        )}
        {/* crossing stretch candidate while combining */}
        {nd?.crossRange && nd.status === 'combining' && (
          <rect x={px(r) + (nd.crossRange[0] - r.low) * T - 3} y={y0 - 3} width={(nd.crossRange[1] - nd.crossRange[0] + 1) * T - (T - TILE) + 6} height={TILE + 6} rx="8" fill="#bae6fd" />
        )}
        {arr.slice(r.low, r.high + 1).map((v, k) => {
          const i = r.low + k;
          const tx = x0 + k * T;
          const lit = scanning && scanning.index === i;
          const scanned =
            scanning && ((scanning.leftSums.some((s) => s.index === i) && i <= scanning.mid) || scanning.rightSums.some((s) => s.index === i));
          return (
            <g key={i} opacity={nd ? 1 : 0.28}>
              <rect
                x={tx}
                y={y0}
                width={TILE}
                height={TILE}
                rx="6"
                fill={scanned ? '#e0f2fe' : v >= 0 ? '#fef9c3' : '#fee2e2'}
                stroke={lit ? '#f59e0b' : v >= 0 ? '#ca8a04' : '#dc2626'}
                strokeWidth={lit ? 3 : 1.2}
              />
              <text x={tx + TILE / 2} y={y0 + 20} textAnchor="middle" fontSize="12" fontWeight="900" fill={v >= 0 ? '#713f12' : '#991b1b'}>
                {v > 0 ? `+${v}` : v}
              </text>
              {scanning?.bestLeft?.index === i && (
                <text x={tx + 2} y={y0 - 6} fontSize="13">
                  🚩
                </text>
              )}
              {scanning?.bestRight?.index === i && (
                <text x={tx + TILE - 14} y={y0 - 6} fontSize="13">
                  🚩
                </text>
              )}
            </g>
          );
        })}
        {/* the cut, once this piece has been split */}
        {r.mid !== undefined && nd && (
          <g>
            <line
              x1={x0 + (r.mid - r.low + 1) * T - (T - TILE) / 2}
              y1={y0 - 8}
              x2={x0 + (r.mid - r.low + 1) * T - (T - TILE) / 2}
              y2={y0 + TILE + 8}
              stroke="#dc2626"
              strokeWidth={nd.status === 'dividing' && isActive ? 3.5 : 2.5}
              strokeDasharray="5 3"
              className={nd.status === 'dividing' && isActive ? 'animate-story-pop' : undefined}
            />
          </g>
        )}
        {/* result line under the piece */}
        {nd && (
          <text x={x0 + pw(r) / 2} y={y0 + TILE + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill={done ? '#78350f' : nd.status === 'combining' ? '#0369a1' : '#78716c'}>
            {done && res
              ? r.low === r.high
                ? `best ${res.maxSum}`
                : `best ${res.maxSum} ${nd.winner === 'CrossSum' ? '✂' : nd.winner === 'LSum' ? '◀' : '▶'}`
              : nd.status === 'combining'
              ? '⇄ …'
              : '⏳'}
          </text>
        )}
        {isActive && (
          <g transform={`translate(${x0 - 4}, ${y0 - 16})`}>
            <rect x="0" y="-9" width="32" height="16" rx="8" fill="#ea580c" />
            <text x="16" y="3" textAnchor="middle" fontSize="10" fontWeight="800" fill="#ffffff">
              now
            </text>
          </g>
        )}
      </g>
    );
  });

  // ── Plain-English card for the picked (or current) piece ──
  const card = (() => {
    const r = plan.find((p) => p.key === shownKey);
    if (!r) return null;
    const nd = byRange.get(r.key);
    const vals = arr.slice(r.low, r.high + 1).map((v) => (v > 0 ? `+${v}` : `${v}`)).join(', ');
    const head = `${tilesText(r.low, r.high)} [${vals}]`;
    let body: React.ReactNode;
    if (!nd) body = <>Not reached yet. {r.mid !== undefined ? 'It will be cut in half like its parent.' : 'It is a single tile, so it will be its own answer.'}</>;
    else if (r.low === r.high) body = <>A single tile: the best stretch is the tile itself, worth <b>{arr[r.low]}</b>.</>;
    else if (!isDone(nd) && nd.status !== 'combining')
      body = (
        <>
          Cut between tile {r.mid! + 1} and tile {r.mid! + 2}. Waiting for the left piece ({tilesText(r.low, r.mid!)}) and the right piece ({tilesText(r.mid! + 1, r.high)}) to report their best stretch.
        </>
      );
    else if (nd.status === 'combining')
      body = (
        <>
          Both halves have reported{nd.lSum !== undefined ? <> (left <b>{nd.lSum}</b>, right <b>{nd.rSum}</b>)</> : null}. A stretch could also cross the cut, so two lanterns walk outward from it to find the best crossing stretch.
        </>
      );
    else {
      const res = nd.result as { maxSum: number; low: number; high: number };
      body = (
        <>
          Three candidates: best in the left half <b>{nd.lSum}</b>, best crossing the cut <b>{nd.crossSum}</b>
          {nd.crossRange ? ` (${tilesText(nd.crossRange[0], nd.crossRange[1])})` : ''}, best in the right half <b>{nd.rSum}</b>. The winner is{' '}
          <b>{res.maxSum}</b> at {tilesText(res.low, res.high)}, so this piece reports {res.maxSum} back up.
        </>
      );
    }
    return (
      <div className="mt-3 rounded-xl border border-violet-200 bg-white px-4 py-3 font-sans text-sm text-stone-700" data-piece-card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <span className="font-bold text-stone-900">🔍 {head}</span>
          {picked && (
            <button type="button" onClick={() => setPicked(undefined)} className="text-xs font-semibold text-violet-700 hover:underline">
              Follow the current piece
            </button>
          )}
        </div>
        <p className="leading-relaxed">{body}</p>
        {isFinal && r.depth === 0 && <p className="mt-1 text-amber-800 font-semibold">That is the answer for the whole road: {nd?.result?.maxSum} coins.</p>}
      </div>
    );
  })();

  return (
    <div data-max-subarray-tree>
      <p className="font-sans text-xs text-stone-600 mb-2">
        Going <b>down</b>, each piece of road is cut in half. Going <b>up</b>, each half reports its best stretch, and the parent picks the richest of left, right and crossing the cut. Click any piece to read about it, or drag to look around.
      </p>

      {/* What is happening right now, right next to the tree (no scrolling up to the owl) */}
      {narration && (
        <div className="flex items-start gap-2.5 mb-2 rounded-xl border border-amber-200 bg-white px-3 py-2 shadow-sm" aria-live="polite" data-tree-narration>
          <span className="text-xl leading-none" aria-hidden>
            🦉
          </span>
          <p className="flex-1 font-sans text-sm sm:text-[15px] leading-snug text-stone-800">{narration}</p>
          {stepLabel && <span className="shrink-0 self-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 font-sans text-[11px] font-semibold text-amber-900">{stepLabel}</span>}
        </div>
      )}

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
        <svg
          viewBox={`${camX} ${camY} ${camW} ${camH}`}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full h-full"
          role="img"
          aria-label="Split and merge tree"
        >
          {funnels}
          {pieces}
        </svg>
        {mode !== 'whole' && (camW < width || camH < height) && (
          <svg width={MAP_W} height={MAP_H} className="absolute top-2 right-2 rounded-lg border border-amber-200 bg-white/90 shadow-sm pointer-events-none" aria-hidden>
            {plan.map((r) => {
              const ms = Math.min(MAP_W / width, MAP_H / height);
              const ox = (MAP_W - width * ms) / 2;
              const oy = (MAP_H - height * ms) / 2;
              const nd = byRange.get(r.key);
              return (
                <rect
                  key={`m-${r.key}`}
                  x={ox + px(r) * ms}
                  y={oy + py(r.depth) * ms}
                  width={Math.max(2, pw(r) * ms)}
                  height={Math.max(2, TILE * ms)}
                  rx="1"
                  fill={r.key === activeKey ? '#ea580c' : isDone(nd) ? '#facc15' : nd ? '#d6c3a5' : '#e7e5e4'}
                />
              );
            })}
            {(() => {
              const ms = Math.min(MAP_W / width, MAP_H / height);
              const ox = (MAP_W - width * ms) / 2;
              const oy = (MAP_H - height * ms) / 2;
              return <rect x={ox + camX * ms} y={oy + camY * ms} width={camW * ms} height={camH * ms} fill="none" stroke="#d97706" strokeWidth="1.5" rx="2" />;
            })()}
          </svg>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 font-sans text-[11px] text-stone-600">
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded bg-yellow-300 mr-1" />
          best stretch of a piece
        </span>
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded bg-sky-200 mr-1" />
          crossing the cut
        </span>
        <span>↑ answer sent up to the parent (gold = it won)</span>
        <span>◀ ▶ ✂ the winner came from the left, the right, or across the cut</span>
        <span>⏳ waiting for both halves</span>
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded border border-dashed border-stone-400 mr-1" />
          not reached yet
        </span>
      </div>
      {card}
    </div>
  );
};
