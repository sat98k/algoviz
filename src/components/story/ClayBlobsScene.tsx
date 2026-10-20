import React, { useRef } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';

/**
 * 🧱 Karger's Min-Cut as balls of clay tied with ropes.
 *
 * Each vertex is a ball of clay; each edge is a rope. A spinning pointer picks a random
 * rope, and the two balls it joins get squished into one bigger ball (ropes between them
 * vanish, ropes to everything else stay — sometimes several ropes between the same two
 * balls). When only two balls are left, the ropes between them are a cut: counting them
 * gives this run's answer. One run might be unlucky, so Karger repeats many times.
 */

const W = 640;
const H = 420;
const CLAYS = ['#fca5a5', '#93c5fd', '#86efac', '#fde68a', '#c4b5fd', '#f9a8d4', '#67e8f9', '#fdba74'];

export const ClayBlobsScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const st: any = step.state || {};
  const nodes: { id: string; label: string; x?: number; y?: number }[] = st.nodes || [];
  const edges: { u: string; v: string; weight: number }[] = st.edges || [];
  const members: Record<string, string[]> = st.superNodeMembers || {};
  const picked = st.currentContractedEdge as { u: string; v: string; uLabel: string; vLabel: string } | undefined;
  const phaseName: string = st.phase || 'init';

  const phases: readonly (readonly [string, number])[] = phaseName === 'pick_edge' ? [['spin', 0], ['pick', 0.4]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  const xs = nodes.map((nd) => nd.x ?? 0);
  const ys = nodes.map((nd) => nd.y ?? 0);
  const originalCount = Object.values(members).reduce((a, m) => a + m.length, 0) || nodes.length;
  const pos = new Map(nodes.map((nd) => [nd.id, { x: nd.x ?? 0, y: nd.y ?? 0 }]));
  // Keep the frame of the starting layout so the view doesn't zoom as balls merge.
  const frame = useRef({ count: 0, minX: 0, maxX: 1, minY: 0, maxY: 1 });
  if (nodes.length >= frame.current.count) {
    frame.current = { count: nodes.length, minX: (xs.length ? Math.min(...xs) : 0), maxX: (xs.length ? Math.max(...xs) : 1), minY: (ys.length ? Math.min(...ys) : 0), maxY: (ys.length ? Math.max(...ys) : 1) };
  }
  const { minX, maxX, minY, maxY } = frame.current;
  const s = Math.min((W - 160) / (maxX - minX || 1), (H - 140) / (maxY - minY || 1));
  const P = (id: string) => {
    const p = pos.get(id) ?? { x: 0, y: 0 };
    return { x: 80 + (p.x - minX) * s + (W - 160 - (maxX - minX) * s) / 2, y: 70 + (p.y - minY) * s + (H - 140 - (maxY - minY) * s) / 2 };
  };
  const membersOf = (id: string, label: string) => members[id] || [label];
  const colourOf = (label: string) => CLAYS[(parseInt(label.replace(/\D/g, ''), 10) - 1 + CLAYS.length) % CLAYS.length];

  const isPicked = (e: { u: string; v: string }) => picked && ((e.u === picked.u && e.v === picked.v) || (e.u === picked.v && e.v === picked.u)) && (phaseName === 'pick_edge' ? phase === 'pick' : false);
  const cutSize = st.cutSize ?? edges.reduce((a, e) => a + (e.weight || 1), 0);

  const narration = (() => {
    switch (phaseName) {
      case 'init':
        return `${nodes.length} balls of clay are tied together with ropes. Goal: cut the fewest ropes to split them into two groups. Karger’s trick: squish random neighbours together until only two balls remain.`;
      case 'pick_edge':
        return phase === 'spin' ? 'Spin the pointer to pick a random rope…' : `It picks the rope between ${picked?.uLabel} and ${picked?.vLabel}.`;
      case 'contract':
        return `Squish them into one ball! Ropes between them disappear; ropes to other balls stay (sometimes doubling up). ${nodes.length} ball${nodes.length === 1 ? '' : 's'} left.`;
      case 'complete':
        return `Only two balls are left. The ropes between them form a cut of size ${cutSize}. A single run can be unlucky, so Karger repeats it many times and keeps the smallest cut.`;
      default:
        return step.title;
    }
  })();

  // Group parallel ropes so they fan out instead of overlapping.
  const ropes: React.ReactNode[] = [];
  edges.forEach((e, idx) => {
    const a = P(e.u);
    const b = P(e.v);
    const count = Math.max(1, e.weight || 1);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    for (let k = 0; k < count; k++) {
      const bend = (k - (count - 1) / 2) * 18;
      const c = { x: (a.x + b.x) / 2 - (dy / len) * bend, y: (a.y + b.y) / 2 + (dx / len) * bend };
      const glow = isPicked(e);
      const cut = phaseName === 'complete';
      ropes.push(
        <path
          key={`rope-${idx}-${k}`}
          d={`M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`}
          fill="none"
          stroke={glow ? '#f59e0b' : cut ? '#dc2626' : '#a16207'}
          strokeWidth={glow ? 6 : 3.5}
          strokeDasharray={cut ? '9 5' : undefined}
          strokeLinecap="round"
        />
      );
    }
  });

  return (
    <StoryStage
      emoji="🧱"
      title="Squishing Clay Balls"
      subtitle="Pick a random rope, squish its two balls together, repeat until two balls are left."
      narration={narration}
      status={phaseName === 'complete' ? `This run’s cut • ${cutSize} rope${cutSize === 1 ? '' : 's'}` : `Balls left • ${nodes.length} of ${originalCount}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Clay balls and ropes">
        <rect x="0" y="0" width={W} height={H} rx="18" fill="#efe3d3" />
        {ropes}
        {nodes.map((nd) => {
          const p = P(nd.id);
          const mem = membersOf(nd.id, nd.label);
          const r = 22 + Math.sqrt(mem.length) * 12;
          const involved = picked && (nd.id === picked.u || nd.id === picked.v) && phaseName === 'pick_edge' && phase === 'pick';
          const fresh = phaseName === 'contract' && mem.length > 1 && picked && (nd.id === picked.u || nd.id.includes(picked.u));
          return (
            <g key={nd.id} style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: 'transform 0.8s ease-in-out' }}>
              <g className={fresh ? 'animate-story-pop' : undefined}>
                <ellipse cx="3" cy="5" rx={r} ry={r * 0.88} fill="#00000022" />
                <ellipse rx={r} ry={r * 0.88} fill={colourOf(mem[0])} stroke={involved ? '#f59e0b' : '#78716c'} strokeWidth={involved ? 4 : 2} />
                {/* a fingerprint swirl for texture */}
                <path d={`M ${-r * 0.4} ${-r * 0.2} q ${r * 0.3} ${-r * 0.35} ${r * 0.6} 0`} fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />
                <text textAnchor="middle" y="5" fontSize={mem.length > 3 ? 10 : 12} fontWeight="900" fill="#1c1917">
                  {mem.length > 4 ? `${mem.slice(0, 3).join(' ')} +${mem.length - 3}` : mem.join(' ')}
                </text>
              </g>
            </g>
          );
        })}
        {phaseName === 'pick_edge' && phase === 'spin' && (
          <g transform={`translate(${W - 50}, 50)`}>
            <g className="animate-spin" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
              <text textAnchor="middle" y="10" fontSize="30">
                🎯
              </text>
            </g>
          </g>
        )}
      </svg>
    </StoryStage>
  );
};
