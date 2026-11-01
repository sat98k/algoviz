import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { PALETTE, SceneDefs, tint, useSvgIds } from './kit/materials';
import { useChapter } from './kit/chapter';

/** A security camera on a short bracket, looking down-left; its foot is at (0, 0). */
const Camera: React.FC<{ beam?: boolean }> = ({ beam }) => (
  <g>
    {beam && <path d="M-14 -22 L-58 18 L-24 30 Z" fill={PALETTE.goldLight} opacity="0.55" />}
    <path d="M0 0 V-14 H-6" stroke={PALETTE.ink} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <g transform="translate(-10, -20) rotate(24)">
      <rect x="-12" y="-6" width="22" height="12" rx="4" fill="#f3efe6" stroke={PALETTE.ink} strokeWidth="1.6" />
      <rect x="-12" y="-6" width="22" height="4" rx="2" fill="#ffffff" opacity="0.8" />
      <circle cx="-12" cy="0" r="4.2" fill={PALETTE.ink} />
      <circle cx="-12.6" cy="-0.8" r="1.4" fill={PALETTE.sky} />
      <circle cx="6" cy="-1" r="1.6" fill="#cc2e2e" />
    </g>
  </g>
);

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
  const ids = useSvgIds();
  const field = useChapter();
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
        <SceneDefs ids={ids} floor={field.bg} />
        <rect x="0" y="0" width={W} height={H} rx="22" fill={tint(field.bg, 0.84)} />
        {edges.map((e, i) => {
          const a = pos.get(e.u)!;
          const b = pos.get(e.v)!;
          if (!a || !b) return null;
          const watched = !uncovered.some((u) => same(u, e));
          const isPicked = picked && same(picked, e) && kind !== 'final';
          const isMatching = matching.some((m) => same(m, e));
          return (
            <g key={`st-${i}`}>
              <line x1={a.x} y1={a.y + 5} x2={b.x} y2={b.y + 5} stroke="#3a2414" strokeOpacity="0.12" strokeWidth="22" strokeLinecap="round" />
              {isPicked && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={PALETTE.goldLight} strokeWidth="32" strokeLinecap="round" />}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={watched ? '#3fbf62' : '#d8ccb6'} strokeWidth="22" strokeLinecap="round" style={{ transition: 'stroke 0.6s' }} />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#57514a" strokeWidth="15" strokeLinecap="round" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isMatching ? PALETTE.gold : '#f4ead2'} strokeWidth={isMatching ? 3.5 : 1.8} strokeDasharray="9 9" />
            </g>
          );
        })}
        {nodes.map((nd) => {
          const p = pos.get(nd.id)!;
          const hasCam = cams.includes(nd.id);
          const isNew = kind === 'cams' && picked && (picked.u === nd.id || picked.v === nd.id);
          return (
            <g key={nd.id} transform={`translate(${p.x}, ${p.y})`}>
              <ellipse cx="0" cy="20" rx="24" ry="6" fill="#3a2414" opacity="0.14" />
              <circle r="23" fill={hasCam ? PALETTE.goldLight : '#fbf9f4'} stroke={hasCam ? PALETTE.gold : '#a39b8c'} strokeWidth={hasCam ? 4 : 2.5} />
              <circle r="16" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.5" />
              <text textAnchor="middle" y="5" fontSize="14" fontWeight="900" fill={PALETTE.ink} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                {nd.label}
              </text>
              {hasCam && (
                <g transform="translate(18, -16)">
                  <g className={isNew ? 'animate-story-drop' : undefined}>
                    <Camera beam={!!isNew} />
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-sm text-stone-600">Green edges = watched street · grey = not watched yet · gold dashes = streets we picked</p>
    </StoryStage>
  );
};
