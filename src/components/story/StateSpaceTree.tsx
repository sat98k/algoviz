import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTweened } from './useAnimPhases';

/**
 * 🌳 A beginner-friendly state-space tree for backtracking story scenes.
 *
 * - Every branch is one choice; the path from the top to the glowing node is the
 *   set of choices made so far.
 * - Pruned branches are snipped with scissors and keep a short "why" tag.
 * - Finished branches fold up into a small bundle once the tree gets big, so the
 *   picture stays readable however many nodes the search visits.
 * - The camera follows the current node at a fixed, comfortable zoom (nodes keep
 *   their real size), and the whole-tree button zooms out to show everything.
 */

export interface SpaceTreeNode {
  id: string;
  parentId: string | null;
  children: string[];
  /** Short text on the edge into this node, e.g. "col 2" or "take 4". */
  edgeLabel?: string;
  status: 'open' | 'pruned' | 'solution';
  /** Why the branch was cut, in a couple of words ("same column", "too heavy"). */
  pruneNote?: string;
}

export type SpaceNodeKind = 'active' | 'trying' | 'path' | 'pruned' | 'solution' | 'explored';

interface StateSpaceTreeProps {
  /** Nodes discovered so far (undiscovered children must not be listed). */
  nodes: Record<string, SpaceTreeNode>;
  rootId: string;
  activeId: string;
  /** Node first visited on this step: it grows out of its parent. */
  newId?: string;
  /** While false, a pruned active node is still shown as "being tried". */
  revealPrune?: boolean;
  stepKey: string | number;
  nodeW: number;
  nodeH: number;
  /** Horizontal distance between neighbouring leaves (defaults to nodeW + 30). */
  leafGap?: number;
  /** Draws the inside of a node, centred on (0, 0). */
  renderNode: (id: string, kind: SpaceNodeKind) => React.ReactNode;
  /** Label for a depth, shown in the left margin (e.g. "Row 2"). */
  levelLabel?: (depth: number) => string | undefined;
  caption: string;
}

type Pt = { x: number; y: number };

const PANEL_H = 340;
const FOLD_LIMIT = 36;
const MAX_OPEN_ANSWERS = 4;
const AMBER = '#d97706';
const RED = '#dc2626';
const GOLD = '#f59e0b';
const STONE = '#a8a29e';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Glides every node from where it was to its new spot; new nodes grow out of their parent. */
function useTweenedLayout(target: Record<string, Pt>, parentOf: (id: string) => string | null, durationMs: number) {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  shownRef.current = shown;
  const signature = Object.keys(target)
    .map((k) => `${k}:${Math.round(target[k].x)},${Math.round(target[k].y)}`)
    .join('|');

  useEffect(() => {
    if (typeof window.requestAnimationFrame !== 'function' || prefersReducedMotion()) {
      setShown(target);
      return;
    }
    const prev = shownRef.current;
    const from: Record<string, Pt> = {};
    for (const id of Object.keys(target)) {
      let cur: string | null = id;
      while (cur && !prev[cur]) cur = parentOf(cur);
      from[id] = cur ? prev[cur] : target[id];
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const next: Record<string, Pt> = {};
      for (const id of Object.keys(target)) {
        next[id] = { x: from[id].x + (target[id].x - from[id].x) * e, y: from[id].y + (target[id].y - from[id].y) * e };
      }
      setShown(next);
      if (t < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, durationMs]);

  // Nodes not yet in the animated copy are drawn at their target spot.
  return (id: string): Pt => shown[id] ?? target[id];
}

/** Width of the element in CSS pixels, kept up to date on resize. */
function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.clientWidth) setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => el.clientWidth && setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export const StateSpaceTree: React.FC<StateSpaceTreeProps> = ({
  nodes,
  rootId,
  activeId,
  newId,
  revealPrune = true,
  stepKey,
  nodeW,
  nodeH,
  leafGap = nodeW + 30,
  renderNode,
  levelLabel,
  caption,
}) => {
  const [mode, setMode] = useState<'follow' | 'whole'>('follow');
  const [wrapRef, widthPx] = useWidth(640);

  // ── Which nodes are on the current path, and which finished branches fold up ──
  const path = useMemo(() => {
    const set = new Set<string>();
    let cur: string | null = nodes[activeId] ? activeId : rootId;
    while (cur && nodes[cur]) {
      set.add(cur);
      cur = nodes[cur].parentId;
    }
    return set;
  }, [nodes, activeId, rootId]);

  const fold = Object.keys(nodes).length > FOLD_LIMIT;

  // With only a few answers, the branches leading to them stay open so the route to each one stays visible.
  const leadsToAnswer = useMemo(() => {
    const set = new Set<string>();
    const answers = Object.values(nodes).filter((nd) => nd.status === 'solution');
    if (answers.length > MAX_OPEN_ANSWERS) return set;
    for (const a of answers) {
      let cur: string | null = a.id;
      while (cur && nodes[cur] && !set.has(cur)) {
        set.add(cur);
        cur = nodes[cur].parentId;
      }
    }
    return set;
  }, [nodes]);

  const { visible, folded, pos, depthOf } = useMemo(() => {
    const visibleIds: string[] = [];
    const foldedCounts: Record<string, { pruned: number; solutions: number; total: number }> = {};
    const depth: Record<string, number> = {};
    const p: Record<string, Pt> = {};
    const levelGap = nodeH + 66;
    let nextLeaf = 0;

    const countBelow = (id: string) => {
      const c = { pruned: 0, solutions: 0, total: 0 };
      const stack = [...nodes[id].children];
      while (stack.length) {
        const k = stack.pop()!;
        const nd = nodes[k];
        if (!nd) continue;
        c.total++;
        if (nd.status === 'pruned') c.pruned++;
        if (nd.status === 'solution') c.solutions++;
        stack.push(...nd.children);
      }
      return c;
    };

    const place = (id: string, d: number) => {
      const nd = nodes[id];
      depth[id] = d;
      visibleIds.push(id);
      const kids = nd.children.filter((k) => nodes[k]);
      const isFolded = fold && kids.length > 0 && !path.has(id) && !leadsToAnswer.has(id);
      if (isFolded) foldedCounts[id] = countBelow(id);
      if (kids.length === 0 || isFolded) {
        p[id] = { x: nextLeaf * leafGap, y: d * levelGap };
        nextLeaf++;
        return;
      }
      kids.forEach((k) => place(k, d + 1));
      p[id] = { x: (p[kids[0]].x + p[kids[kids.length - 1]].x) / 2, y: d * levelGap };
    };
    if (nodes[rootId]) place(rootId, 0);
    return { visible: visibleIds, folded: foldedCounts, pos: p, depthOf: depth };
  }, [nodes, rootId, path, fold, leadsToAnswer, leafGap, nodeH]);

  const shownPos = useTweenedLayout(pos, (id) => nodes[id]?.parentId ?? null, 650);

  // ── Kinds ──
  const kindOf = (id: string): SpaceNodeKind => {
    const nd = nodes[id];
    if (id === activeId) {
      if (nd.status === 'pruned') return revealPrune ? 'pruned' : 'trying';
      if (nd.status === 'solution') return 'solution';
      return 'active';
    }
    if (nd.status === 'pruned') return 'pruned';
    if (nd.status === 'solution') return 'solution';
    if (path.has(id)) return 'path';
    return 'explored';
  };

  // ── Camera: fixed zoom that follows the current node; never zooms in past real size ──
  const pxPerUnit = widthPx < 480 ? 0.8 : 1;
  const viewW = widthPx / pxPerUnit;
  const viewH = PANEL_H / pxPerUnit;
  const xs = visible.map((id) => pos[id].x);
  const ys = visible.map((id) => pos[id].y);
  const LEFT_GUTTER = levelLabel ? 64 : 0;
  const bounds = {
    x0: Math.min(...xs) - nodeW / 2 - 28 - LEFT_GUTTER,
    x1: Math.max(...xs) + nodeW / 2 + 28,
    y0: Math.min(...ys) - nodeH / 2 - 26,
    y1: Math.max(...ys) + nodeH / 2 + 46,
  };
  const bw = bounds.x1 - bounds.x0;
  const bh = bounds.y1 - bounds.y0;
  const fitsWhole = bw <= viewW && bh <= viewH;
  const focus = pos[activeId] ?? pos[rootId] ?? { x: 0, y: 0 };
  const along = (lo: number, hi: number, size: number, want: number) =>
    hi - lo <= size ? (lo + hi) / 2 : Math.min(hi - size / 2, Math.max(lo + size / 2, want));

  let cam: [number, number, number, number];
  if (mode === 'whole' || fitsWhole) {
    const s = Math.max(1, bw / viewW, bh / viewH);
    const w = viewW * s;
    const h = viewH * s;
    cam = [(bounds.x0 + bounds.x1) / 2 - w / 2, (bounds.y0 + bounds.y1) / 2 - h / 2, w, h];
  } else {
    // Keep the node's children in view too: aim a little below it.
    const cx = along(bounds.x0, bounds.x1, viewW, focus.x - LEFT_GUTTER / 2);
    const cy = along(bounds.y0, bounds.y1, viewH, focus.y + (nodeH + 66) * 0.45);
    cam = [cx - viewW / 2, cy - viewH / 2, viewW, viewH];
  }
  const [camX, camY, camW, camH] = useTweened(cam, 650);

  // ── Drawing ──
  const edgePoint = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

  const edges = visible
    .filter((id) => id !== rootId && nodes[id].parentId && pos[nodes[id].parentId!])
    .map((id) => {
      const nd = nodes[id];
      const kind = kindOf(id);
      const a0 = shownPos(nd.parentId!);
      const b0 = shownPos(id);
      const a = { x: a0.x, y: a0.y + nodeH / 2 };
      const b = { x: b0.x, y: b0.y - nodeH / 2 - 4 };
      const onPath = path.has(id) && kind !== 'pruned';
      const stroke =
        kind === 'pruned' ? RED : kind === 'trying' ? AMBER : kind === 'solution' ? GOLD : onPath ? AMBER : STONE;
      const label = nd.edgeLabel;
      // Sibling edges fan out from the parent, so labels sit near the child where there is room.
      const lp = edgePoint(a, b, 0.76);
      const snip = edgePoint(a, b, 0.48);
      const freshPrune = kind === 'pruned' && id === activeId;
      return (
        <g key={`e-${id}`}>
          <line
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={stroke}
            strokeWidth={onPath || kind === 'solution' ? 3.5 : 2}
            strokeDasharray={kind === 'pruned' || kind === 'trying' ? '6 5' : undefined}
            strokeLinecap="round"
            opacity={kind === 'explored' ? 0.5 : kind === 'pruned' && !freshPrune ? 0.6 : 1}
          />
          {kind === 'pruned' && (
            <g transform={`translate(${snip.x}, ${snip.y})`}>
              <g key={freshPrune ? `snip-${stepKey}` : 'snip'} className={freshPrune ? 'animate-story-pop' : undefined}>
                <circle r="10" fill="#fef2f2" stroke={RED} strokeWidth="1.5" />
                <text textAnchor="middle" y="4.5" fontSize="12" fill={RED}>
                  ✂
                </text>
              </g>
            </g>
          )}
          {label && (
            <g transform={`translate(${lp.x}, ${lp.y})`} opacity={kind === 'explored' ? 0.6 : 1}>
              <rect
                x={-(label.length * 3.3 + 7)}
                y="-8.5"
                width={label.length * 6.6 + 14}
                height="17"
                rx="8.5"
                fill="#ffffff"
                stroke={onPath ? AMBER : '#e7e5e4'}
              />
              <text textAnchor="middle" y="4" fontSize="10.5" fontWeight="700" fill={onPath ? '#92400e' : '#57534e'}>
                {label}
              </text>
            </g>
          )}
        </g>
      );
    });

  const frame = (kind: SpaceNodeKind, isFolded: boolean) => {
    const w = nodeW + 8;
    const h = nodeH + 8;
    const common = { x: -w / 2, y: -h / 2, width: w, height: h, rx: 10 };
    const fill = kind === 'solution' ? '#fef3c7' : kind === 'pruned' ? '#fef2f2' : '#ffffff';
    const stroke =
      kind === 'active' ? AMBER : kind === 'trying' ? AMBER : kind === 'path' ? '#f59e0b' : kind === 'solution' ? '#b45309' : kind === 'pruned' ? '#fca5a5' : '#d6d3d1';
    return (
      <>
        {isFolded && (
          <>
            <rect {...common} x={-w / 2 + 8} y={-h / 2 + 8} fill="#f5f5f4" stroke="#d6d3d1" />
            <rect {...common} x={-w / 2 + 4} y={-h / 2 + 4} fill="#fafaf9" stroke="#d6d3d1" />
          </>
        )}
        {kind === 'solution' && <rect {...common} x={-w / 2 - 5} y={-h / 2 - 5} width={w + 10} height={h + 10} rx="14" fill={GOLD} opacity="0.35" />}
        <rect
          {...common}
          fill={fill}
          stroke={stroke}
          strokeWidth={kind === 'active' || kind === 'trying' ? 3 : kind === 'solution' || kind === 'path' ? 2.5 : 1.5}
          strokeDasharray={kind === 'trying' ? '5 4' : undefined}
        />
      </>
    );
  };

  const renderVisibleNode = (id: string) => {
    const p = shownPos(id);
    const kind = kindOf(id);
    const fc = folded[id];
    const grow = id === newId;
    const dim = kind === 'explored' || (kind === 'pruned' && id !== activeId);
    return (
      <g key={`n-${id}`} transform={`translate(${p.x}, ${p.y})`} data-tree-node={id} data-kind={kind}>
        <g key={grow ? `grow-${stepKey}` : 'still'} className={grow ? 'animate-story-pop' : kind === 'trying' ? 'animate-story-bob' : undefined}>
          {kind === 'active' && (
            <rect x={-nodeW / 2 - 4} y={-nodeH / 2 - 4} width={nodeW + 8} height={nodeH + 8} rx="10" fill="none" stroke={AMBER} strokeWidth="3" className="animate-story-halo" />
          )}
          <g opacity={dim ? 0.55 : 1}>
            {frame(kind, !!fc)}
            {renderNode(id, kind)}
          </g>
          {kind === 'pruned' && (
            <g transform={`translate(${nodeW / 2 + 2}, ${-nodeH / 2 - 2})`}>
              <circle r="9" fill={RED} />
              <text textAnchor="middle" y="4" fontSize="11" fontWeight="900" fill="#ffffff">
                ✗
              </text>
            </g>
          )}
          {kind === 'solution' && (
            <text x={nodeW / 2 + 2} y={-nodeH / 2 + 4} textAnchor="middle" fontSize="16">
              🏆
            </text>
          )}
          {kind === 'trying' && (
            <g transform={`translate(${nodeW / 2 + 2}, ${-nodeH / 2 - 2})`}>
              <circle r="9" fill={AMBER} />
              <text textAnchor="middle" y="4" fontSize="11" fontWeight="900" fill="#ffffff">
                ?
              </text>
            </g>
          )}
          {/* note under the node: why it was cut, or what a folded bundle holds */}
          {kind === 'pruned' && nodes[id].pruneNote && (
            <text y={nodeH / 2 + (id === activeId ? 38 : 18)} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={RED} opacity={id === activeId ? 1 : 0.75}>
              {nodes[id].pruneNote}
            </text>
          )}
          {fc && (
            <text y={nodeH / 2 + 22} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#78716c">
              {`done${fc.pruned ? ` · ✂${fc.pruned}` : ''}${fc.solutions ? ` · 🏆${fc.solutions}` : ''}`}
            </text>
          )}
          {id === activeId && kind !== 'solution' && (
            <g transform={`translate(0, ${nodeH / 2 + 17})`}>
              <rect x="-18" y="-9" width="36" height="17" rx="8.5" fill={AMBER} />
              <text y="4" textAnchor="middle" fontSize="10" fontWeight="800" fill="#ffffff">
                now
              </text>
            </g>
          )}
        </g>
      </g>
    );
  };

  // Level labels stick to the left edge of the camera.
  const depths = Array.from(new Set(visible.map((id) => depthOf[id]))).sort((a, b) => a - b);

  // Minimap only when part of the tree is off-screen.
  const showMap = mode === 'follow' && !fitsWhole;
  const mapW = 132;
  const mapH = 78;
  const ms = Math.min(mapW / bw, mapH / bh);
  const mx = (x: number) => (x - bounds.x0) * ms + (mapW - bw * ms) / 2;
  const my = (y: number) => (y - bounds.y0) * ms + (mapH - bh * ms) / 2;

  const dotColor = (kind: SpaceNodeKind) =>
    kind === 'active' || kind === 'trying' ? AMBER : kind === 'pruned' ? RED : kind === 'solution' ? GOLD : kind === 'path' ? '#fbbf24' : STONE;

  return (
    <div className="flex flex-col gap-2 mt-4" data-state-space-tree>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display font-bold text-sm sm:text-base text-stone-900">🌳 The search tree</h3>
          <p className="font-sans text-xs text-stone-600">{caption}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-white p-0.5 font-sans text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('follow')}
            aria-pressed={mode === 'follow'}
            className={`px-3 py-1 rounded-full transition-colors ${mode === 'follow' ? 'bg-amber-500 text-white' : 'text-stone-600 hover:bg-amber-50'}`}
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
      </div>

      <div ref={wrapRef} className="relative w-full rounded-xl border border-amber-200 bg-[#fdfaf5]" style={{ height: PANEL_H }}>
        <svg
          viewBox={`${camX} ${camY} ${camW} ${camH}`}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full h-full"
          role="img"
          aria-label="State-space tree of the search"
        >
          {levelLabel &&
            depths.map((d) => {
              const text = levelLabel(d);
              if (!text) return null;
              return (
                <text key={`lvl-${d}`} x={camX + 10 * (camW / viewW)} y={d * (nodeH + 66) + 4} fontSize={10.5 * (camW / viewW)} fontWeight="700" fill="#a8a29e">
                  {text}
                </text>
              );
            })}
          {edges}
          {visible.map(renderVisibleNode)}
        </svg>

        {showMap && (
          <svg
            width={mapW}
            height={mapH}
            className="absolute top-2 right-2 rounded-lg border border-amber-200 bg-white/90 shadow-sm"
            aria-hidden
          >
            {visible
              .filter((id) => nodes[id].parentId && pos[nodes[id].parentId!])
              .map((id) => {
                const a = pos[nodes[id].parentId!];
                const b = pos[id];
                return <line key={`m-${id}`} x1={mx(a.x)} y1={my(a.y)} x2={mx(b.x)} y2={my(b.y)} stroke="#e7e5e4" strokeWidth="1" />;
              })}
            {visible.map((id) => (
              <circle key={`md-${id}`} cx={mx(pos[id].x)} cy={my(pos[id].y)} r={id === activeId ? 3.5 : 2} fill={dotColor(kindOf(id))} />
            ))}
            <rect
              x={mx(camX)}
              y={my(camY)}
              width={camW * ms}
              height={camH * ms}
              fill="none"
              stroke={AMBER}
              strokeWidth="1.5"
              rx="2"
            />
          </svg>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-[11px] text-stone-600">
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded border-2 border-amber-600 mr-1" />
          now
        </span>
        <span>
          <span className="inline-block w-3 h-0.5 align-middle bg-amber-500 mr-1" />
          choices so far
        </span>
        <span>✂ cut off: can never work</span>
        <span>🏆 answer</span>
        {fold && <span>▤ finished branch, folded up</span>}
      </div>
    </div>
  );
};
