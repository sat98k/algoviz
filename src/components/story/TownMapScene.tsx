import React, { useRef, useState } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases, useHeldValue, useProgress } from './useAnimPhases';

/**
 * 🗺️ Towns and one-way roads, shared by the shortest-path algorithms.
 * Road numbers are travel costs in coins; a green number is a cash-back road (negative).
 *
 * - Bellman-Ford: every town wears a price tag (cheapest known cost from the start).
 *   Round after round a delivery van drives every road; if it arrives cheaper, the old
 *   tag is swapped. Green roads = the cheapest way found so far.
 * - Floyd-Warshall: towns open as hubs one by one. For each trip, the known best is
 *   compared with going through the new hub. At the end a trip planner lets you pick
 *   any two towns and see their cheapest route.
 */

type Pt = { x: number; y: number };
type Road = { u: number; v: number; w: number; p0: Pt; c: Pt; p2: Pt; mid: Pt; tag: Pt };

const W = 680;
const H = 440;
const TOWN_R = 26;
const GREEN = '#16a34a';
const GOLD = '#f59e0b';
const BLUE = '#0284c7';

const quad = (p0: Pt, c: Pt, p2: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p2.y,
});

const fmtCost = (v: number | null | undefined) => (v === null || v === undefined ? '?' : `${v}`);

export const TownMapScene: React.FC<StorySceneProps> = ({ step, algorithmId, stepMs }) => {
  const st: any = step.state || {};
  const isFW = algorithmId === 'floyd-warshall';
  const nodes: { id: string; label: string }[] = st.nodes || [];
  const n = nodes.length;
  const idx = (id: string) => nodes.findIndex((nd) => nd.id === `${id}`);
  const label = (i: number) => nodes[i]?.label ?? `${i}`;
  const title: string = step.title || '';

  // ── Layout: towns around a circle (start town on the left for Bellman-Ford) ──
  const src = isFW ? -1 : idx(st.source ?? '0');
  const start = isFW ? -Math.PI / 2 : Math.PI;
  const pos: Pt[] = nodes.map((_, i) => {
    const k = isFW ? i : (i - Math.max(0, src) + n) % n;
    const a = start + (2 * Math.PI * k) / Math.max(1, n);
    return { x: W / 2 + 205 * Math.cos(a), y: H / 2 + 158 * Math.sin(a) };
  });

  const edgeList: { u: string; v: string; weight: number }[] = st.edges || [];
  const has = (u: number, v: number) => edgeList.some((e) => idx(e.u) === u && idx(e.v) === v);
  const roads: Road[] = edgeList.map((e) => {
    const u = idx(e.u);
    const v = idx(e.v);
    const a = pos[u];
    const b = pos[v];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const bend = has(v, u) ? 30 : 14;
    const p0 = { x: a.x + ux * (TOWN_R + 4), y: a.y + uy * (TOWN_R + 4) };
    const p2 = { x: b.x - ux * (TOWN_R + 8), y: b.y - uy * (TOWN_R + 8) };
    const c = { x: (p0.x + p2.x) / 2 - uy * bend, y: (p0.y + p2.y) / 2 + ux * bend };
    const mid = quad(p0, c, p2, 0.5);
    return { u, v, w: e.weight, p0, c, p2, mid, tag: { x: mid.x - uy * 14, y: mid.y + ux * 14 } };
  });
  const roadOf = (u: number, v: number) => roads.find((r) => r.u === u && r.v === v);
  const roadD = (r: Road) => `M ${r.p0.x} ${r.p0.y} Q ${r.c.x} ${r.c.y} ${r.p2.x} ${r.p2.y}`;

  // ── Bellman-Ford specifics ──
  const kind = (() => {
    if (step.isFinal) return st.hasNegativeCycle ? 'bf-cycle-final' : 'final';
    if (isFW) {
      if (/Unreachable Leg/.test(title)) return 'fw-noleg';
      if (/^Shorter Path/.test(title)) return 'fw-better';
      if (/No Improvement/.test(title)) return 'fw-same';
      if (/^Starting Iteration/.test(title)) return 'fw-hub';
      return 'intro';
    }
    if (/^Relax/.test(title)) return 'bf-relax';
    if (/^Check/.test(title)) return 'bf-check';
    if (/^Pass/.test(title)) return 'bf-pass';
    if (/stop early/.test(title)) return 'bf-stop';
    if (/^Verification/.test(title)) return 'bf-verify';
    if (/^Negative cycle/.test(title)) return 'bf-cycle';
    return 'intro';
  })();
  const driving = kind === 'bf-relax' || kind === 'bf-check';
  const comparing = kind === 'fw-better' || kind === 'fw-same' || kind === 'fw-noleg';

  const phases: readonly (readonly [string, number])[] = driving
    ? [['drive', 0], ['arrive', 0.5]]
    : comparing
    ? [['compare', 0], ['verdict', 0.45]]
    : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);
  const van = useProgress(phase === 'drive', stepMs * 0.45, `van-${step.stepIndex}`);

  // Prices as they were on the previously shown step: a relaxed tag shows them crossed out.
  const trueDist: Record<string, number | null> = st.distances || {};
  const prevRef = useRef({ idx: step.stepIndex, cur: trueDist, prev: trueDist });
  if (prevRef.current.idx !== step.stepIndex) {
    prevRef.current = { idx: step.stepIndex, cur: trueDist, prev: prevRef.current.cur };
  }
  const prevDist = prevRef.current.prev;
  const distRec: Record<string, number | null> = phase === 'drive' ? prevDist : trueDist;
  const predRec: Record<string, string | null> = useHeldValue(st.predecessors || {}, phase !== 'drive');
  const priceOf = (i: number) => distRec[nodes[i]?.id];

  const edgeNow = st.consideringEdge ? { u: idx(st.consideringEdge.u), v: idx(st.consideringEdge.v) } : null;
  const cycleEdge = st.negativeCycleEdge ? { u: idx(st.negativeCycleEdge.u), v: idx(st.negativeCycleEdge.v) } : null;
  const bestRoads = new Set(
    isFW
      ? []
      : Object.entries(predRec)
          .filter(([, p]) => p !== null && p !== undefined)
          .map(([v, p]) => `${idx(p as string)}-${idx(v)}`)
  );

  // ── Floyd-Warshall specifics ──
  const k: number = st.k ?? -1;
  const fi: number = st.i ?? -1;
  const fj: number = st.j ?? -1;
  const cmp = st.comparison as { direct: number | null; legIK: number | null; legKJ: number | null; viaK: number | null; improved: boolean } | undefined;
  const dist: (number | null)[][] = st.distMatrix || [];
  const next: (number | null)[][] = st.nextMatrix || [];
  const [trip, setTrip] = useState<{ from: number; to: number }>({ from: 0, to: Math.min(1, n - 1) });

  const routeOf = (from: number, to: number): number[] => {
    if (from === to || next[from]?.[to] === null || next[from]?.[to] === undefined) return [];
    const path = [from];
    let cur = from;
    for (let guard = 0; cur !== to && guard < n + 1; guard++) {
      const nx = next[cur]?.[to];
      if (nx === null || nx === undefined) return [];
      cur = nx;
      path.push(cur);
    }
    return cur === to ? path : [];
  };
  const plannerRoute = isFW && kind === 'final' ? routeOf(trip.from, trip.to) : [];
  const plannerRoads = new Set(plannerRoute.slice(0, -1).map((a, i) => `${a}-${plannerRoute[i + 1]}`));

  // ── Narration ──
  const q = (i: number) => label(i);
  const narration = (() => {
    switch (kind) {
      case 'intro':
        return isFW
          ? 'Each number on a road is its travel cost in coins (green = cash back). We want the cheapest trip between every pair of towns. Idea: let towns become hubs one at a time and check if passing through a hub saves money.'
          : `How cheap is it to get from ${q(src)} to every town? ${q(src)} costs 0; the other towns don’t have a price yet (?). Green road numbers are cash-back roads.`;
      case 'bf-pass':
        return `Round ${st.pass} of ${st.totalPasses}: a van drives every road once, checking whether any town can be reached more cheaply.`;
      case 'bf-relax':
      case 'bf-check': {
        if (!edgeNow) return step.title;
        const r = roadOf(edgeNow.u, edgeNow.v);
        const pu = priceOf(edgeNow.u);
        if (phase === 'drive') {
          return pu === null || pu === undefined
            ? `A van wants to drive ${q(edgeNow.u)} → ${q(edgeNow.v)}, but ${q(edgeNow.u)} has no price yet…`
            : `A van drives ${q(edgeNow.u)} → ${q(edgeNow.v)}: ${q(edgeNow.u)}’s price ${pu} plus the road ${r?.w} = ${pu + (r?.w ?? 0)} coins.`;
        }
        if (kind === 'bf-relax') {
          const old = prevDist[nodes[edgeNow.v].id];
          return `${old === null || old === undefined ? `${q(edgeNow.v)} had no price yet` : `Cheaper than ${old}!`} ${q(edgeNow.v)}’s price tag becomes ${fmtCost(trueDist[nodes[edgeNow.v].id])}, and we remember the road from ${q(edgeNow.u)}.`;
        }
        return pu === null || pu === undefined
          ? `Nothing to deliver from ${q(edgeNow.u)} yet, so ${q(edgeNow.v)} stays as it is.`
          : `${pu + (r?.w ?? 0)} coins is not cheaper than ${q(edgeNow.v)}’s price (${fmtCost(priceOf(edgeNow.v))}). No change.`;
      }
      case 'bf-stop':
        return 'A whole round went by with no cheaper price anywhere, so the prices are final. We can stop early!';
      case 'bf-verify':
        return 'One extra round as a safety check: if any price still drops now, something is wrong.';
      case 'bf-cycle':
      case 'bf-cycle-final':
        return `Uh-oh: ${cycleEdge ? q(cycleEdge.v) : 'a town'} still gets cheaper! A loop of cash-back roads lets the price fall forever, so there is no cheapest route.`;
      case 'fw-hub':
        return `${q(k)} opens as a hub! Now every trip checks: is it cheaper to pass through ${q(k)}?`;
      case 'fw-better':
      case 'fw-same':
      case 'fw-noleg': {
        if (!cmp) return step.title;
        const known = cmp.direct === null ? 'no known way yet' : `${cmp.direct} coins`;
        if (phase === 'compare') return `Trip ${q(fi)} → ${q(fj)}: best known is ${known}. What about through hub ${q(k)}?`;
        if (kind === 'fw-noleg') return `There is no way ${cmp.legIK === null ? `from ${q(fi)} to ${q(k)}` : `from ${q(k)} to ${q(fj)}`} yet, so the hub can’t help this trip.`;
        if (kind === 'fw-better') return `Through ${q(k)}: ${cmp.legIK} + ${cmp.legKJ} = ${cmp.viaK} coins. Cheaper! This becomes the new best trip.`;
        return `Through ${q(k)}: ${cmp.legIK} + ${cmp.legKJ} = ${cmp.viaK} coins, not cheaper than ${known}. Keep the old trip.`;
      }
      case 'final':
        return isFW
          ? 'Every town now knows its cheapest trip to every other town. Pick two towns below to see the route!'
          : `Final prices! The green roads show the cheapest way to reach every town from ${q(src)}.`;
      default:
        return step.title;
    }
  })();

  const status = isFW
    ? kind === 'final'
      ? 'All hubs opened'
      : `Hubs opened • ${k + 1} of ${n}`
    : kind === 'bf-cycle' || kind === 'bf-cycle-final'
    ? 'Prices fall forever!'
    : st.pass > (st.totalPasses ?? 0)
    ? 'Safety-check round'
    : `Round • ${st.pass ?? 0} of ${st.totalPasses ?? 0}`;

  // ── Drawing ──
  const renderRoad = (r: Road) => {
    const key = `${r.u}-${r.v}`;
    const isNow = edgeNow && edgeNow.u === r.u && edgeNow.v === r.v;
    const isCycle = cycleEdge && cycleEdge.u === r.u && cycleEdge.v === r.v;
    const isBest = bestRoads.has(key) || plannerRoads.has(key);
    const base = isCycle ? '#fca5a5' : isBest ? '#86efac' : '#e8d5b0';
    const edge = isCycle ? '#dc2626' : isBest ? GREEN : isNow ? GOLD : '#b9965f';
    return (
      <g key={`road-${key}`}>
        {isNow && <path d={roadD(r)} fill="none" stroke="#fde68a" strokeWidth="16" strokeLinecap="round" />}
        <path d={roadD(r)} fill="none" stroke={edge} strokeWidth="9" strokeLinecap="round" markerEnd={`url(#storyRoadArrow-${isCycle ? 'red' : isBest ? 'green' : 'brown'})`} />
        <path d={roadD(r)} fill="none" stroke={base} strokeWidth="5" strokeLinecap="round" />
        <path d={roadD(r)} fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="5 6" opacity="0.8" />
        <g transform={`translate(${r.tag.x}, ${r.tag.y})`}>
          <rect x="-15" y="-10" width="30" height="19" rx="9" fill={r.w < 0 ? '#dcfce7' : '#fffbeb'} stroke={r.w < 0 ? GREEN : '#d6b98c'} />
          <text textAnchor="middle" y="4" fontSize="11" fontWeight="800" fill={r.w < 0 ? '#166534' : '#78350f'}>
            {r.w}
          </text>
        </g>
        {isCycle && (
          <text x={r.mid.x} y={r.mid.y + 8} textAnchor="middle" fontSize="26" className="animate-story-bob">
            🌀
          </text>
        )}
      </g>
    );
  };

  const renderTown = (i: number) => {
    const p = pos[i];
    const isHub = isFW && i === k && kind !== 'final';
    const wasHub = isFW && (i < k || kind === 'final');
    const isStartTown = (isFW && comparing && i === fi) || (!isFW && i === src);
    const isGoal = isFW && comparing && i === fj;
    const plannerEnd = isFW && kind === 'final' && (i === trip.from || i === trip.to);
    const relaxedHere = !isFW && kind === 'bf-relax' && phase === 'arrive' && edgeNow?.v === i;
    const shake = !isFW && kind === 'bf-check' && phase === 'arrive' && edgeNow?.v === i;
    const price = priceOf(i);
    return (
      <g key={`town-${i}`} transform={`translate(${p.x}, ${p.y})`}>
        {isHub && <circle r={TOWN_R + 8} fill="none" stroke={GOLD} strokeWidth="4" className="animate-story-ripple" />}
        <circle r={TOWN_R} fill={isHub ? '#fef3c7' : plannerEnd ? '#dcfce7' : '#fffaf0'} stroke={isHub ? GOLD : plannerEnd ? GREEN : '#a16207'} strokeWidth={isHub || plannerEnd ? 4 : 2.5} />
        {/* little house */}
        <path d="M -11 2 L 0 -9 L 11 2 Z" fill="#b45309" />
        <rect x="-8" y="2" width="16" height="10" fill="#fde68a" stroke="#92400e" strokeWidth="1" />
        <text textAnchor="middle" y={TOWN_R + 15} fontSize="13" fontWeight="900" fill="#1c1917">
          {label(i)}
        </text>
        {isHub && (
          <text x={TOWN_R - 2} y={-TOWN_R + 2} fontSize="18">
            🏛️
          </text>
        )}
        {wasHub && !isHub && (
          <text x={TOWN_R - 6} y={-TOWN_R + 6} fontSize="12">
            🚩
          </text>
        )}
        {isStartTown && isFW && (
          <text x={-TOWN_R - 14} y={-TOWN_R + 8} fontSize="18">
            🧍
          </text>
        )}
        {isGoal && (
          <text x={-TOWN_R - 14} y={-TOWN_R + 8} fontSize="18">
            🏁
          </text>
        )}
        {!isFW && (
          <g transform={`translate(${TOWN_R + 4}, ${-TOWN_R - 4})`}>
            <g className={shake ? 'animate-story-shake' : undefined}>
              <path d="M 0 0 L 8 -10 L 44 -10 L 44 10 L 8 10 Z" fill={price === null || price === undefined ? '#f5f5f4' : '#fef9c3'} stroke="#a16207" strokeWidth="1.5" />
              <circle cx="9" cy="0" r="2.5" fill="#a16207" />
              <text x="27" y="4" textAnchor="middle" fontSize="12" fontWeight="900" fill="#451a03">
                {fmtCost(price)}
              </text>
            </g>
            {relaxedHere && (
              <g className="animate-story-pop">
                <text x="27" y="-14" textAnchor="middle" fontSize="11" fontWeight="800" fill="#dc2626" textDecoration="line-through">
                  {fmtCost(prevDist[nodes[i].id])}
                </text>
              </g>
            )}
          </g>
        )}
      </g>
    );
  };

  // Floyd-Warshall comparison overlay
  const fwOverlay =
    isFW && comparing && cmp && fi >= 0 && fj >= 0 && k >= 0 ? (
      <g>
        {cmp.direct !== null && (
          <path
            d={`M ${pos[fi].x} ${pos[fi].y} Q ${(pos[fi].x + pos[fj].x) / 2 + (pos[fj].y - pos[fi].y) * 0.25} ${(pos[fi].y + pos[fj].y) / 2 - (pos[fj].x - pos[fi].x) * 0.25} ${pos[fj].x} ${pos[fj].y}`}
            fill="none"
            stroke={phase === 'verdict' && kind !== 'fw-better' ? GREEN : BLUE}
            strokeWidth="4"
            strokeDasharray="10 7"
            opacity={phase === 'verdict' && kind === 'fw-better' ? 0.25 : 0.9}
          />
        )}
        {[
          [fi, k, cmp.legIK],
          [k, fj, cmp.legKJ],
        ].map(([a, b, cost], li) => (
          <g key={`leg-${li}`}>
            <line
              x1={pos[a as number].x}
              y1={pos[a as number].y}
              x2={pos[b as number].x}
              y2={pos[b as number].y}
              stroke={cost === null ? '#a8a29e' : phase === 'verdict' && kind === 'fw-better' ? GREEN : GOLD}
              strokeWidth={cost === null ? 3 : 6}
              strokeDasharray={cost === null ? '3 7' : undefined}
              strokeLinecap="round"
              opacity="0.9"
            />
            <g transform={`translate(${pos[a as number].x * 0.62 + pos[b as number].x * 0.38}, ${pos[a as number].y * 0.62 + pos[b as number].y * 0.38})`}>
              <rect x="-22" y="-11" width="44" height="21" rx="10" fill="#ffffff" stroke={GOLD} strokeWidth="1.5" />
              <text textAnchor="middle" y="4" fontSize="11" fontWeight="800" fill="#78350f">
                {cost === null ? 'no way' : `${cost}`}
              </text>
            </g>
          </g>
        ))}
      </g>
    ) : null;

  // Bellman-Ford van
  let vanAt: Pt | null = null;
  if (!isFW && edgeNow && phase === 'drive') {
    const r = roadOf(edgeNow.u, edgeNow.v);
    if (r && (priceOf(edgeNow.u) ?? null) !== null) vanAt = quad(r.p0, r.c, r.p2, van);
  }

  return (
    <StoryStage
      emoji={isFW ? '🏛️' : '🚚'}
      title={isFW ? 'Hub Towns' : 'Delivery Prices'}
      subtitle={isFW ? 'Open one hub at a time and check if trips get cheaper through it.' : 'Round after round, every road is driven once; cheaper prices replace old ones.'}
      narration={narration}
      status={status}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Town map">
        <defs>
          {(
            [
              ['brown', '#b9965f'],
              ['green', GREEN],
              ['red', '#dc2626'],
            ] as const
          ).map(([name, colour]) => (
            <marker key={name} id={`storyRoadArrow-${name}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={colour} />
            </marker>
          ))}
        </defs>
        <rect x="0" y="0" width={W} height={H} rx="18" fill="#eef5e4" />
        <rect x="8" y="8" width={W - 16} height={H - 16} rx="14" fill="none" stroke="#cfe0bd" strokeWidth="2" strokeDasharray="6 6" />
        {roads.map(renderRoad)}
        {fwOverlay}
        {nodes.map((_, i) => renderTown(i))}
        {vanAt && (
          <text x={vanAt.x} y={vanAt.y + 7} textAnchor="middle" fontSize="24">
            🚚
          </text>
        )}
      </svg>

      {isFW && kind === 'final' && n > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 font-sans text-sm text-stone-700">
          <span className="font-semibold">🧭 Trip planner:</span>
          <select
            aria-label="From town"
            value={trip.from}
            onChange={(e) => setTrip((t) => ({ ...t, from: Number(e.target.value) }))}
            className="px-2 py-1 rounded-md border border-amber-300 bg-white"
          >
            {nodes.map((_, i) => (
              <option key={i} value={i}>
                {label(i)}
              </option>
            ))}
          </select>
          <span>→</span>
          <select
            aria-label="To town"
            value={trip.to}
            onChange={(e) => setTrip((t) => ({ ...t, to: Number(e.target.value) }))}
            className="px-2 py-1 rounded-md border border-amber-300 bg-white"
          >
            {nodes.map((_, i) => (
              <option key={i} value={i}>
                {label(i)}
              </option>
            ))}
          </select>
          <span className="font-semibold text-green-800">
            {trip.from === trip.to
              ? 'Already there!'
              : plannerRoute.length
              ? `${plannerRoute.map(label).join(' → ')} • ${dist[trip.from]?.[trip.to]} coins`
              : 'No way to get there'}
          </span>
        </div>
      )}
    </StoryStage>
  );
};
