import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';

/**
 * 🪢 TSP 2-approximation as a rope network walked around like a hedge.
 *
 * 1. Tie the cheapest rope network that connects every town (a minimum spanning tree):
 *    always add the cheapest rope from the connected towns to a new one.
 * 2. Imagine walking all the way around the ropes, like tracing a hedge with your hand:
 *    every rope is walked twice, so that walk costs 2 × the ropes.
 * 3. Skip towns you have already visited by taking a shortcut straight to the next new
 *    one. Shortcuts never cost more (on normal maps), so the tour costs at most twice
 *    the ropes — and the best tour costs at least as much as the ropes.
 */

const W = 640;
const H = 420;
const M = 60;

export const RopeNetworkScene: React.FC<StorySceneProps> = ({ step }) => {
  const st: any = step.state || {};
  const cities: { id: number; label: string; x: number; y: number }[] = st.cities || [];
  const cost: number[][] = st.costMatrix || [];
  const phase: string = st.currentPhase || 'init';
  const mst: { u: number; v: number; weight: number }[] = st.mstEdges || [];
  const cands: { u: number; v: number; totalCost: number; isChosen: boolean }[] = st.candidateEdges || [];
  const tour: { u: number; v: number }[] = st.activeTourEdges || [];
  const order: number[] = st.dfsOrder || [];
  const mask: number = st.currentMask ?? 0;
  const title: string = step.title || '';

  const xs = cities.map((c) => c.x);
  const ys = cities.map((c) => c.y);
  const minX = (xs.length ? Math.min(...xs) : 0);
  const maxX = (xs.length ? Math.max(...xs) : 1);
  const minY = (ys.length ? Math.min(...ys) : 0);
  const maxY = (ys.length ? Math.max(...ys) : 1);
  const s = Math.min((W - 2 * M) / (maxX - minX || 1), (H - 2 * M) / (maxY - minY || 1));
  const pos = cities.map((c) => ({ x: M + (c.x - minX) * s + (W - 2 * M - (maxX - minX) * s) / 2, y: M + (c.y - minY) * s + (H - 2 * M - (maxY - minY) * s) / 2 }));
  const name = (i: number) => cities[i]?.label ?? `${i}`;
  const mstWeight: number = st.mstWeight ?? mst.reduce((a, e) => a + e.weight, 0);

  const kind = (() => {
    if (step.isFinal || phase === 'complete') return 'final';
    if (phase === 'init') return 'intro';
    if (/^MST Cut Evaluation/.test(title)) return 'mst-look';
    if (/^Add Edge/.test(title)) return 'mst-add';
    if (phase === 'double') return 'double';
    if (phase === 'shortcut') return 'shortcut';
    return 'idle';
  })();

  const narration = (() => {
    switch (kind) {
      case 'intro':
        return 'A salesperson must visit every town once and come home. Finding the very best trip is very slow, so here is a quick plan that is never worse than twice the best.';
      case 'mst-look':
        return 'Step 1: tie the cheapest rope network joining all towns. Look at every rope from the towns already tied to a town not tied yet…';
      case 'mst-add': {
        const last = mst[mst.length - 1];
        return last ? `…and tie the cheapest one: ${name(last.u)}–${name(last.v)} (${last.weight}). Ropes so far: ${mstWeight}.` : step.title;
      }
      case 'double':
        return `Step 2: walk all the way around the ropes, like tracing a hedge with your hand. Every rope is walked twice: 2 × ${mstWeight} = ${2 * mstWeight}.`;
      case 'shortcut':
        return `Step 3: follow that walk, but skip towns already visited by cutting straight across to the next new town. Order so far: ${order.map(name).join(' → ')}.`;
      case 'final':
        return `The tour costs ${st.optimalCost}. The ropes (${mstWeight}) are cheaper than any tour, and our tour is at most twice the ropes (${2 * mstWeight}), so it is at most twice the best possible.`;
      default:
        return step.title;
    }
  })();

  const line = (u: number, v: number, stroke: string, width: number, dash?: string, offset = 0, key?: string) => {
    const a = pos[u];
    const b = pos[v];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * offset;
    const oy = (dx / len) * offset;
    return <line key={key} x1={a.x + ox} y1={a.y + oy} x2={b.x + ox} y2={b.y + oy} stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" />;
  };

  const inNetwork = (i: number) => (mask & (1 << i)) !== 0;

  return (
    <StoryStage
      emoji="🪢"
      title="Ropes, Then a Walk Around"
      subtitle="Tie the cheapest rope network, walk around it, and take shortcuts past towns already visited."
      narration={narration}
      status={kind === 'final' ? `Tour • ${st.optimalCost} (≤ ${2 * mstWeight})` : `Ropes tied • ${mstWeight}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Towns and ropes">
        <rect x="0" y="0" width={W} height={H} rx="18" fill="#eef5e4" />

        {/* faint roads */}
        {cities.map((_, i) => cities.map((__, j) => (j > i ? line(i, j, '#d6cbb5', 1.5, undefined, 0, `r-${i}-${j}`) : null)))}

        {/* candidate ropes while choosing */}
        {kind === 'mst-look' && cands.map((c, k) => line(c.u, c.v, c.isChosen ? '#16a34a' : '#0284c7', 3, '6 6', 0, `c-${k}`))}

        {/* the rope network (doubled in step 2) */}
        {mst.map((e, k) =>
          kind === 'double' || kind === 'shortcut'
            ? [line(e.u, e.v, '#a16207', 4, undefined, 4, `m1-${k}`), line(e.u, e.v, '#a16207', 4, undefined, -4, `m2-${k}`)]
            : line(e.u, e.v, kind === 'final' ? '#d6b98c' : '#a16207', 6, undefined, 0, `m-${k}`)
        )}

        {/* the walk with shortcuts */}
        {tour.map((e, k) => line(e.u, e.v, '#f59e0b', 6, cost[e.u]?.[e.v] !== undefined && !mst.some((m) => (m.u === e.u && m.v === e.v) || (m.u === e.v && m.v === e.u)) ? '10 6' : undefined, 0, `t-${k}`))}

        {/* towns */}
        {cities.map((c, i) => {
          const p = pos[i];
          const visitIdx = order.indexOf(i);
          const tied = phase === 'mst' && inNetwork(i);
          return (
            <g key={c.id} transform={`translate(${p.x}, ${p.y})`}>
              <circle r="22" fill={tied ? '#fef3c7' : '#fffaf0'} stroke={i === st.currentCity && kind === 'shortcut' ? '#ea580c' : '#a16207'} strokeWidth={i === st.currentCity && kind === 'shortcut' ? 4 : 2.5} />
              <text textAnchor="middle" y="7" fontSize="18">
                🏠
              </text>
              <text textAnchor="middle" y="38" fontSize="13" fontWeight="900" fill="#1c1917">
                {c.label}
              </text>
              {visitIdx >= 0 && (kind === 'shortcut' || kind === 'final') && (
                <g transform="translate(18, -18)">
                  <circle r="9" fill="#f59e0b" stroke="#92400e" />
                  <text textAnchor="middle" y="4" fontSize="10" fontWeight="900" fill="#ffffff">
                    {visitIdx + 1}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-xs text-stone-500">Brown = ropes (cheapest network) · gold = the trip · gold dashes = shortcuts past visited towns</p>
    </StoryStage>
  );
};
