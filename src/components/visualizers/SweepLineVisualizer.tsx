import React, { useMemo } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { LineSegment, SweepEvent, SweepLineState, yAtX } from '../../algorithms/lineSegmentIntersection';
import { Sliders, CheckCircle2, AlertTriangle, GitBranch, RotateCw, RotateCcw } from 'lucide-react';
import { placeTree, useTweened } from './avlLayout';

interface SweepLineVisualizerProps {
  step: AlgorithmStep;
}

/** One stable colour per segment, shared by the plane, the tree and the strips. */
const SEG_COLOURS = ['#d97706', '#16a34a', '#2563eb', '#9333ea', '#e11d48', '#0d9488', '#a16207', '#4f46e5'];

const C = {
  ink: 'rgb(var(--text-primary))',
  muted: 'rgb(var(--text-muted))',
  dim: 'rgb(var(--text-dim))',
  surface: 'rgb(var(--bg-surface))',
  line: 'rgb(var(--border-color) / 0.18)',
  current: 'rgb(var(--sem-current))',
  compare: 'rgb(var(--sem-compare))',
  match: 'rgb(var(--sem-match))',
  mismatch: 'rgb(var(--sem-mismatch))',
};

const fmtBalance = (b: number) => (b > 0 ? `+${b}` : `${b}`);

export const SweepLineVisualizer: React.FC<SweepLineVisualizerProps> = ({ step }) => {
  const state = (step.state || {}) as SweepLineState;
  const segments: LineSegment[] = state.segments || [];
  const events: SweepEvent[] = state.events || [];
  const eventIndex = state.eventIndex ?? -1;
  const sweepX = state.currentSweepX ?? 0;
  const activeIds = state.activeSegmentIds || [];
  const checkedPair = state.checkedPair;
  const intPt = state.intersectionPoint;
  const phase = state.phase || 'init';
  const rotation = state.rotation;
  const path = state.searchPath || [];
  const turns = state.searchTurns || [];
  const focusId = state.insertedId ?? state.removedId ?? state.currentEvent?.segmentId;

  const segById = useMemo(() => new Map(segments.map((s) => [s.id, s])), [segments]);
  const colour = (id: string) => SEG_COLOURS[Math.max(0, segments.findIndex((s) => s.id === id)) % SEG_COLOURS.length];
  const label = (id?: string | null) => (id ? segById.get(id)?.label ?? id : '—');

  // ── The plane ────────────────────────────────────────────────────────────
  const PW = 560;
  const PH = 380;
  const PAD = 40;
  const allX = segments.flatMap((s) => [s.p1.x, s.p2.x]);
  const allY = segments.flatMap((s) => [s.p1.y, s.p2.y]);
  const minX = Math.min(...allX, 0);
  const maxX = Math.max(...allX, 500);
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 400);
  const sx = (x: number) => PAD + ((x - minX) / (maxX - minX || 1)) * (PW - 2 * PAD);
  const sy = (y: number) => PH - PAD - ((y - minY) / (maxY - minY || 1)) * (PH - 2 * PAD);
  const sweepSvgX = sx(Math.max(minX - 15, Math.min(maxX + 15, sweepX)));
  const showSweep = phase !== 'init';

  const doneIds = new Set<string>();
  const startedIds = new Set<string>();
  events.forEach((e, i) => {
    if (i <= eventIndex) {
      if (e.type === 'left') startedIds.add(e.segmentId);
      else doneIds.add(e.segmentId);
    }
  });

  // ── The tree ─────────────────────────────────────────────────────────────
  const placed = placeTree(state.tree ?? null);
  const n = placed.length;
  const TW = 440;
  const LEVEL = 70;
  const maxDepth = placed.reduce((m, p) => Math.max(m, p.depth), 0);
  const TH = Math.max(200, 60 + (maxDepth + 1) * LEVEL);
  const target: Record<string, { x: number; y: number }> = {};
  for (const p of placed) target[p.node.id] = { x: 34 + ((p.order + 0.5) * (TW - 68)) / Math.max(1, n), y: 40 + p.depth * LEVEL };
  const pos = useTweened(target);
  const at = (id: string) => pos[id] ?? target[id];

  const pathEdges = new Set<string>();
  for (let i = 0; i + 1 < path.length; i++) pathEdges.add(`${path[i]}>${path[i + 1]}`);

  const nodeRole = (id: string): { ring: string; tag?: string; tagColour?: string } => {
    if (phase === 'found' && checkedPair?.includes(id)) return { ring: C.mismatch, tag: 'crosses', tagColour: C.mismatch };
    if (phase === 'check_adj' && checkedPair?.includes(id)) return { ring: C.current, tag: 'testing', tagColour: C.current };
    if (rotation && id === rotation.pivot) return { ring: C.mismatch, tag: `rotate ${rotation.direction}`, tagColour: C.mismatch };
    if (rotation && id === rotation.riser) return { ring: C.match, tag: 'moves up', tagColour: C.match };
    if (state.aboveId === id) return { ring: C.compare, tag: '▲ above', tagColour: C.compare };
    if (state.belowId === id) return { ring: C.compare, tag: '▼ below', tagColour: C.compare };
    if (id === state.insertedId) return { ring: C.current, tag: phase === 'avl_insert' ? 'new leaf' : undefined, tagColour: C.current };
    if (phase === 'event_right' && id === state.currentEvent?.segmentId) return { ring: C.current, tag: 'leaving', tagColour: C.current };
    if (path.includes(id)) return { ring: C.current };
    return { ring: C.line };
  };

  // ── Captions ─────────────────────────────────────────────────────────────
  const caption = (() => {
    switch (phase) {
      case 'init':
        return 'The event queue holds every endpoint sorted by x. The AVL tree T is empty: no segment crosses the sweep line yet.';
      case 'event_left':
        return `${label(focusId)} starts here. It must be inserted into T at its place in the bottom-to-top order.`;
      case 'avl_insert':
        return `Walk down from the root. At each node, one cross product tells whether ${label(state.insertedId)} is above (go right) or below (go left) that node's segment at the sweep line. Heights on the way back up are updated; a balance of ±2 (red) needs a rotation.`;
      case 'avl_rotate':
        return rotation
          ? `${rotation.case} case at ${label(rotation.unbalanced)} (balance ${fmtBalance(rotation.balance)}): rotate ${rotation.direction} around ${label(rotation.pivot)}, so ${label(rotation.riser)} moves up.${rotation.part ? ` Double rotation, part ${rotation.part} of 2.` : ''} The in-order sequence (bottom → top) is unchanged.`
          : '';
      case 'neighbours':
        return `Above = in-order successor, Below = in-order predecessor of ${label(state.insertedId)}. Only these neighbours are tested.`;
      case 'event_right':
        return `${label(focusId)} ends here. Its neighbours are read before deleting it: above ${label(state.aboveId)}, below ${label(state.belowId)}.`;
      case 'avl_delete':
        return state.replacedBy
          ? `${label(state.removedId)} had two children: its in-order successor ${label(state.replacedBy)} took over its node, and the successor's old leaf was unlinked.`
          : `${label(state.removedId)} had at most one child, so it was unlinked directly. Heights are updated on the way back up.`;
      case 'check_adj':
        return checkedPair ? `Neighbours ${label(checkedPair[0])} and ${label(checkedPair[1])} are tested with four cross products.` : '';
      case 'found':
        return intPt ? `${intPt.s1} and ${intPt.s2} cross at (${intPt.x}, ${intPt.y}). The answer is yes; the sweep stops.` : '';
      case 'no_intersection':
        return 'Every pair that was ever adjacent in T was tested and none crossed, so no two segments intersect.';
      default:
        return '';
    }
  })();

  const rotationsSoFar = (step.metrics?.custom?.avlRotations as number | undefined) ?? 0;
  const treeHeight = state.tree?.height ?? 0;

  return (
    <div className="flex flex-col items-center w-full min-h-[420px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Status bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3.5 mb-4 bg-obsidian-950 border border-hairline font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4 text-chalk-200">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber" />
            <span>
              SWEEP LINE: <strong>{phase === 'init' ? 'not started' : `x = ${Math.round(sweepX)}`}</strong>
            </span>
          </div>
          <span className="text-chalk-600">|</span>
          <span>
            |T| = <strong className="text-electric-400">{activeIds.length}</strong>
          </span>
          <span className="text-chalk-600">|</span>
          <span>
            AVL height <strong className="text-electric-400">{treeHeight}</strong>
          </span>
          <span className="text-chalk-600">|</span>
          <span>
            rotations <strong className="text-electric-400">{rotationsSoFar}</strong>
          </span>
        </div>

        {phase === 'found' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-sem-mismatch/15 border border-sem-mismatch text-sem-mismatch-ink font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              INTERSECTION AT ({intPt?.x}, {intPt?.y})
            </span>
          </div>
        ) : phase === 'no_intersection' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-sem-match/15 border border-sem-match text-sem-match-ink font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>NO INTERSECTIONS</span>
          </div>
        ) : checkedPair ? (
          <div className="px-3 py-1 bg-sem-current/15 border border-sem-current text-sem-current-ink font-semibold">
            TESTING: {label(checkedPair[0])} × {label(checkedPair[1])}
          </div>
        ) : rotation ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-sem-mismatch/15 border border-sem-mismatch text-sem-mismatch-ink font-semibold">
            {rotation.direction === 'right' ? <RotateCw className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>
              {rotation.case} ROTATION{rotation.part ? ` ${rotation.part}/2` : ''}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 w-full">
        {/* ── The plane ── */}
        <div className="xl:col-span-6 flex flex-col bg-obsidian-950 border border-hairline p-3">
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-chalk-400 mb-1">
            <span className="font-bold text-chalk-200">The plane</span>
            <span>y grows upwards</span>
          </div>
          <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full h-auto select-none" role="img" aria-label="Segments and the sweep line">
            <line x1={PAD} y1={PH - PAD} x2={PW - PAD} y2={PH - PAD} stroke={C.line} strokeWidth="1.5" />
            <line x1={PAD} y1={PAD} x2={PAD} y2={PH - PAD} stroke={C.line} strokeWidth="1.5" />

            {/* swept region */}
            {showSweep && <rect x={PAD} y={PAD - 10} width={Math.max(0, sweepSvgX - PAD)} height={PH - 2 * PAD + 20} fill={C.current} opacity="0.06" />}

            {segments.map((seg) => {
              const x1 = sx(seg.p1.x);
              const y1 = sy(seg.p1.y);
              const x2 = sx(seg.p2.x);
              const y2 = sy(seg.p2.y);
              const isActive = activeIds.includes(seg.id);
              const tested = checkedPair?.includes(seg.id) && (phase === 'check_adj' || phase === 'found');
              const crossing = phase === 'found' && tested;
              const faded = phase !== 'init' && phase !== 'no_intersection' && !isActive && !(seg.id === focusId);
              const stroke = crossing ? C.mismatch : colour(seg.id);
              return (
                <g key={seg.id} opacity={faded ? (doneIds.has(seg.id) ? 0.3 : 0.45) : 1} style={{ transition: 'opacity 0.4s' }}>
                  {tested && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={crossing ? C.mismatch : C.current} strokeOpacity="0.25" strokeWidth="12" strokeLinecap="round" />}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={stroke}
                    strokeWidth={isActive ? 3.5 : 2.5}
                    strokeDasharray={!isActive && !startedIds.has(seg.id) && phase !== 'init' && phase !== 'no_intersection' ? '6 5' : undefined}
                    strokeLinecap="round"
                  />
                  <circle cx={x1} cy={y1} r={4.5} fill={stroke} />
                  <circle cx={x2} cy={y2} r={4.5} fill={C.surface} stroke={stroke} strokeWidth="2" />
                  <text x={x1 - 6} y={y1 - 10} fontSize="12" fontWeight="800" fontFamily="ui-monospace, monospace" fill={stroke}>
                    {seg.label}
                  </text>
                </g>
              );
            })}

            {/* sweep line + where it cuts each active segment */}
            {showSweep && (
              <g>
                <line x1={sweepSvgX} y1={PAD - 16} x2={sweepSvgX} y2={PH - PAD + 12} stroke={C.current} strokeWidth="2" strokeDasharray="5 4" style={{ transition: 'all 0.5s var(--ease-move)' }} />
                <text x={sweepSvgX + 6} y={PAD - 6} fontSize="11" fontWeight="800" fontFamily="ui-monospace, monospace" fill={C.current}>
                  x = {Math.round(sweepX)}
                </text>
                {phase !== 'no_intersection' &&
                  activeIds.map((id) => {
                    const seg = segById.get(id);
                    if (!seg) return null;
                    const cy = sy(yAtX(seg, Math.min(Math.max(sweepX, seg.p1.x), seg.p2.x)));
                    const tag = state.aboveId === id ? 'above' : state.belowId === id ? 'below' : null;
                    return (
                      <g key={id}>
                        <circle cx={sweepSvgX} cy={cy} r={5.5} fill={colour(id)} stroke={C.surface} strokeWidth="2" />
                        {tag && (
                          <text x={sweepSvgX - 8} y={cy + 4} textAnchor="end" fontSize="10" fontWeight="800" fontFamily="ui-monospace, monospace" fill={C.compare}>
                            {tag}
                          </text>
                        )}
                      </g>
                    );
                  })}
              </g>
            )}

            {intPt && (phase === 'found' || phase === 'check_adj') && (
              <g transform={`translate(${sx(intPt.x)}, ${sy(intPt.y)})`}>
                <circle r={13} fill="none" stroke={C.mismatch} strokeWidth="2" className="animate-ping" />
                <circle r={6.5} fill={C.mismatch} stroke={C.surface} strokeWidth="2" />
                <text x={11} y={-9} fontSize="11" fontWeight="800" fontFamily="ui-monospace, monospace" fill={C.mismatch}>
                  ({intPt.x}, {intPt.y})
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* ── The AVL tree ── */}
        <div className="xl:col-span-6 flex flex-col bg-obsidian-950 border border-hairline p-3">
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-chalk-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold text-chalk-200">
              <GitBranch className="w-3.5 h-3.5 text-amber" /> Sweep status T: AVL tree
            </span>
            <span>left = below · right = above</span>
          </div>
          {n === 0 ? (
            <div className="flex-1 min-h-[200px] flex items-center justify-center text-chalk-500 italic font-mono text-xs text-center px-6">
              {phase === 'avl_delete' ? `T is empty again (${label(state.removedId)} was the last segment).` : 'T is empty.'}
            </div>
          ) : (
            <svg viewBox={`0 0 ${TW} ${TH}`} className="w-full h-auto select-none" role="img" aria-label="AVL tree of the active segments">
              {/* edges */}
              {placed.map((p) => {
                if (!p.parent) return null;
                const a = at(p.parent);
                const b = at(p.node.id);
                if (!a || !b) return null;
                const onPath = pathEdges.has(`${p.parent}>${p.node.id}`);
                return (
                  <g key={`e-${p.node.id}`}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={onPath ? C.current : C.line} strokeWidth={onPath ? 3 : 1.75} />
                    <text
                      x={(a.x + b.x) / 2 + (p.side === 'left' ? -9 : 9)}
                      y={(a.y + b.y) / 2 - 2}
                      textAnchor={p.side === 'left' ? 'end' : 'start'}
                      fontSize="9.5"
                      fontFamily="ui-monospace, monospace"
                      fill={onPath ? C.current : C.dim}
                      fontWeight={onPath ? 800 : 500}
                    >
                      {p.side === 'left' ? 'below' : 'above'}
                    </text>
                  </g>
                );
              })}

              {/* rotation arc around the pivot */}
              {rotation && at(rotation.pivot) && (
                <g transform={`translate(${at(rotation.pivot).x}, ${at(rotation.pivot).y})`}>
                  <path
                    d={rotation.direction === 'right' ? 'M -30 -14 A 32 32 0 0 1 30 -14' : 'M 30 -14 A 32 32 0 0 0 -30 -14'}
                    fill="none"
                    stroke={C.mismatch}
                    strokeWidth="2.5"
                    markerEnd="url(#avl-arrow)"
                  />
                </g>
              )}
              <defs>
                <marker id="avl-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={C.mismatch} />
                </marker>
              </defs>

              {/* nodes */}
              {placed.map((p) => {
                const q = at(p.node.id);
                if (!q) return null;
                const role = nodeRole(p.node.id);
                const unbalanced = Math.abs(p.node.balance) >= 2;
                const ring = unbalanced ? C.mismatch : role.ring;
                const pathIdx = path.indexOf(p.node.id);
                return (
                  <g key={p.node.id} transform={`translate(${q.x}, ${q.y})`}>
                    {(role.ring !== C.line || unbalanced) && <circle r={27} fill={ring} opacity="0.16" />}
                    <circle r={21} fill={C.surface} stroke={ring} strokeWidth={role.ring !== C.line || unbalanced ? 3 : 1.5} />
                    <circle r={15} fill={colour(p.node.id)} />
                    <text y={4.5} textAnchor="middle" fontSize="12.5" fontWeight="900" fontFamily="ui-monospace, monospace" fill="#ffffff">
                      {label(p.node.id)}
                    </text>
                    {/* height and balance */}
                    <text y={36} textAnchor="middle" fontSize="9.5" fontFamily="ui-monospace, monospace" fill={unbalanced ? C.mismatch : C.muted} fontWeight={unbalanced ? 900 : 600}>
                      h{p.node.height} · bf {fmtBalance(p.node.balance)}
                    </text>
                    {role.tag && (
                      <text y={rotation && p.node.id === rotation.pivot ? -54 : -29} textAnchor="middle" fontSize="10" fontWeight="900" fontFamily="ui-monospace, monospace" fill={role.tagColour}>
                        {role.tag}
                      </text>
                    )}
                    {pathIdx >= 0 && path.length > 1 && !role.tag && (
                      <text x={24} y={-16} fontSize="9.5" fontWeight="800" fontFamily="ui-monospace, monospace" fill={C.current}>
                        {pathIdx + 1}
                        {turns[pathIdx] === 'right' ? '→R' : turns[pathIdx] === 'left' ? '→L' : ''}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* in-order = bottom-to-top */}
          <div className="mt-2 font-mono text-[11px]">
            <div className="text-chalk-400 mb-1">In-order traversal of T = segments from bottom to top at the sweep line</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-chalk-500">bottom</span>
              {[...activeIds].reverse().map((id) => (
                <span
                  key={id}
                  className={`px-2 py-0.5 rounded-full border font-bold ${checkedPair?.includes(id) && (phase === 'check_adj' || phase === 'found') ? 'border-sem-current bg-sem-current/15 text-sem-current-ink' : 'border-hairline text-chalk-100'}`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: colour(id) }} />
                  {label(id)}
                </span>
              ))}
              {activeIds.length === 0 && <span className="text-chalk-500 italic">(empty)</span>}
              <span className="text-chalk-500">top</span>
            </div>
          </div>
        </div>
      </div>

      {/* What is happening */}
      {caption && (
        <div className="w-full mt-4 p-3 bg-obsidian-950 border border-hairline text-chalk-200 text-xs leading-relaxed">
          <span className="font-mono text-[11px] uppercase font-bold text-amber tracking-wider mr-2">Now:</span>
          {caption}
        </div>
      )}

      {/* Event queue */}
      <div className="w-full mt-3 p-3 bg-obsidian-950 border border-hairline font-mono text-[11px]">
        <div className="text-chalk-400 mb-1.5">Event queue Q (endpoints sorted by x; left ends first on ties)</div>
        <div className="flex flex-wrap gap-1.5">
          {events.map((e, i) => {
            const isNow = i === eventIndex;
            const isDone = i < eventIndex;
            return (
              <span
                key={`${e.segmentId}-${e.type}`}
                className={`px-2 py-1 rounded border transition-all ${
                  isNow ? 'border-sem-current bg-sem-current/15 text-sem-current-ink font-bold' : isDone ? 'border-hairline text-chalk-600 line-through' : 'border-hairline text-chalk-300'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: colour(e.segmentId) }} />
                {label(e.segmentId)} {e.type === 'left' ? 'start' : 'end'} · x={e.x}
              </span>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-4 text-xs font-mono text-chalk-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sem-current" /> search path / pair under test
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sem-compare" /> above / below neighbours
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sem-mismatch" /> unbalanced node / rotation / crossing
        </span>
        <span>bf = height(left) − height(right)</span>
      </div>
    </div>
  );
};
