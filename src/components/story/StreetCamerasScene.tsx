import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';

/**
 * 📷 Vertex Cover (2-approximation) as security cameras at street corners.
 *
 * Corners are vertices, streets are edges. A camera on a corner watches every street
 * that touches it. The quick plan: pick any unwatched street and put a camera on BOTH
 * of its corners; every street they touch is now watched. Repeat. The best possible
 * plan needs at least one camera per street we picked, so we use at most twice as many.
 */

const W = 640;
const H = 420;

export const StreetCamerasScene: React.FC<StorySceneProps> = ({ step }) => {
  const st: any = step.state || {};
  const nodes: { id: string; label: string }[] = st.nodes || [];
  const edges: { u: string; v: string }[] = st.edges || [];
  const uncovered: { u: string; v: string }[] = st.uncoveredEdges || [];
  const cams: string[] = st.coveredVertices || [];
  const picked = st.currentPickedEdge as { u: string; v: string } | undefined;
  const matching: { u: string; v: string }[] = st.pickedMatchingEdges || [];
  const removed: { u: string; v: string }[] = st.removedIncidentEdges || [];
  const title: string = step.title || '';

  const pos = new Map(
    nodes.map((nd, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, nodes.length);
      return [nd.id, { x: W / 2 + 230 * Math.cos(a), y: H / 2 + 160 * Math.sin(a) }];
    })
  );
  const same = (a: { u: string; v: string }, b: { u: string; v: string }) => (a.u === b.u && a.v === b.v) || (a.u === b.v && a.v === b.u);
  const label = (id?: string) => nodes.find((n) => n.id === id)?.label ?? id ?? '';

  const kind = step.isFinal ? 'final' : /^Initialize/.test(title) ? 'intro' : /^Pick/.test(title) ? 'pick' : /^Add Endpoints/.test(title) ? 'cams' : /^Remove/.test(title) ? 'watch' : 'idle';

  const narration = (() => {
    switch (kind) {
      case 'intro':
        return 'Put cameras on street corners so every street is watched (a camera watches all streets touching its corner). Use as few cameras as we can, quickly.';
      case 'pick':
        return `Pick a street nobody watches yet: ${label(picked?.u)}–${label(picked?.v)}.`;
      case 'cams':
        return `Put a camera on both ends, ${label(picked?.u)} and ${label(picked?.v)}. We don’t know which end is better, so we take both.`;
      case 'watch':
        return `${removed.length} street${removed.length === 1 ? ' is' : 's are'} now watched by the new cameras.`;
      case 'final':
        return `Every street is watched with ${cams.length} cameras. We picked ${matching.length} streets that share no corner, and any plan needs a camera on each of them, so the best plan uses at least ${matching.length}: ours is at most twice that.`;
      default:
        return step.title;
    }
  })();

  return (
    <StoryStage
      emoji="📷"
      title="Street Cameras"
      subtitle="A camera on a corner watches every street touching it. Pick a street, camera both ends."
      narration={narration}
      status={`Cameras • ${cams.length} | Unwatched streets • ${uncovered.length}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Streets and corners">
        <rect x="0" y="0" width={W} height={H} rx="18" fill="#e7e5e4" />
        {edges.map((e, i) => {
          const a = pos.get(e.u)!;
          const b = pos.get(e.v)!;
          if (!a || !b) return null;
          const watched = !uncovered.some((u) => same(u, e));
          const isPicked = picked && same(picked, e) && kind !== 'final';
          const isMatching = matching.some((m) => same(m, e));
          return (
            <g key={`st-${i}`}>
              {isPicked && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fde047" strokeWidth="24" strokeLinecap="round" />}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={watched ? '#86efac' : '#57534e'} strokeWidth="13" strokeLinecap="round" style={{ transition: 'stroke 0.6s' }} />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isMatching ? '#f59e0b' : '#ffffff'} strokeWidth={isMatching ? 3 : 1.5} strokeDasharray="8 8" />
            </g>
          );
        })}
        {nodes.map((nd) => {
          const p = pos.get(nd.id)!;
          const hasCam = cams.includes(nd.id);
          const isNew = kind === 'cams' && picked && (picked.u === nd.id || picked.v === nd.id);
          return (
            <g key={nd.id} transform={`translate(${p.x}, ${p.y})`}>
              <circle r="22" fill={hasCam ? '#fef3c7' : '#ffffff'} stroke={hasCam ? '#d97706' : '#78716c'} strokeWidth={hasCam ? 4 : 2.5} />
              <text textAnchor="middle" y="5" fontSize="13" fontWeight="900" fill="#1c1917">
                {nd.label}
              </text>
              {hasCam && (
                <g transform="translate(16, -22)">
                  <g className={isNew ? 'animate-story-pop' : undefined}>
                    <text textAnchor="middle" fontSize="22">
                      📷
                    </text>
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-xs text-stone-500">Green = watched street · dark = not watched yet · orange dashes = streets we picked</p>
    </StoryStage>
  );
};
