import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';
import { doIntersect } from '../../algorithms/lineSegmentIntersection';
import { PALETTE, tint, useSvgIds } from './kit/materials';
import { useChapter } from './kit/chapter';

/**
 * 🎭 Line Segment Intersection as sticks on a table and a sliding curtain.
 *
 * A curtain slides from left to right, stopping only at stick ends. The sticks it is
 * currently touching are written on a clipboard, top to bottom. The clever part: only
 * sticks that are NEXT to each other on the clipboard can be the first to cross, so
 * only neighbours are ever checked. A crossing makes a spark.
 */

const W = 680;
const H = 400;
const M = 50;
const WOODS = ['#b45309', '#15803d', '#1d4ed8', '#9333ea', '#be123c', '#0f766e', '#a16207', '#4338ca'];

export const SweepCurtainScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const ids = useSvgIds();
  const field = useChapter();
  const st: any = step.state || {};
  const segs: { id: string; label: string; p1: { x: number; y: number }; p2: { x: number; y: number } }[] = st.segments || [];
  const active: string[] = st.activeSegmentIds || [];
  const pair: [string, string] | undefined = st.checkedPair;
  const hit = st.intersectionPoint as { x: number; y: number; s1: string; s2: string } | undefined;
  const phaseName: string = st.phase || 'init';
  const title: string = step.title || '';

  const checking = phaseName === 'check_adj' || /^Check/.test(title);
  const phases: readonly (readonly [string, number])[] = checking ? [['look', 0], ['verdict', 0.45]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  const xs = segs.flatMap((s) => [s.p1.x, s.p2.x]);
  const ys = segs.flatMap((s) => [s.p1.y, s.p2.y]);
  const minX = (xs.length ? Math.min(...xs) : 0);
  const maxX = (xs.length ? Math.max(...xs) : 1);
  const minY = (ys.length ? Math.min(...ys) : 0);
  const maxY = (ys.length ? Math.max(...ys) : 1);
  const sx = (x: number) => M + ((x - minX) / (maxX - minX || 1)) * (W - 2 * M);
  const sy = (y: number) => H - M - ((y - minY) / (maxY - minY || 1)) * (H - 2 * M);
  const colour = (id: string) => WOODS[Math.max(0, segs.findIndex((s) => s.id === id)) % WOODS.length];
  const label = (id?: string) => segs.find((s) => s.id === id)?.label ?? id ?? '';

  const curtainX = st.currentSweepX !== undefined && phaseName !== 'init' ? sx(st.currentSweepX) : M - 20;
  const found = phaseName === 'found' || !!st.intersectionFound;
  // The verdict for a neighbour check, using the algorithm's own test.
  const pairCrosses = (() => {
    const a = segs.find((s) => s.id === pair?.[0]);
    const b = segs.find((s) => s.id === pair?.[1]);
    return a && b ? doIntersect(a, b).intersect : false;
  })();

  const narration = (() => {
    if (/^Initialize/.test(title))
      return 'Sticks lie on the table. Do any two cross? Instead of checking every pair, a curtain slides from left to right and stops only at stick ends. A clipboard lists the sticks the curtain touches, from top to bottom.';
    if (phaseName === 'event_left') return `The curtain reaches the left end of ${label(st.currentEvent?.segmentId)}. Write it on the clipboard in its place from top to bottom.`;
    if (phaseName === 'event_right') return `The curtain passes the right end of ${label(st.currentEvent?.segmentId)}. Cross it off the clipboard; its two neighbours now sit next to each other.`;
    if (checking && pair)
      return phase === 'look'
        ? `${label(pair[0])} and ${label(pair[1])} are neighbours on the clipboard. Do they cross?`
        : pairCrosses
        ? `Yes, they cross. Spark!`
        : `No, they don’t touch. Keep sliding.`;
    if (phaseName === 'found' && hit) return `Spark! ${label(hit.s1)} and ${label(hit.s2)} cross. We found a crossing, so we can stop.`;
    if (phaseName === 'no_intersection') return 'The curtain reached the end without a single spark: no two sticks cross.';
    return step.title;
  })();

  return (
    <StoryStage
      title="Sticks and a Sliding Curtain"
      subtitle="Only sticks next to each other on the clipboard are checked for crossing."
      narration={narration}
      status={found ? 'Crossing found!' : phaseName === 'no_intersection' ? 'No crossings' : `On the clipboard • ${active.length}`}
    >
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full lg:flex-1 h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Sticks on a table">
          <defs>
            <linearGradient id={`${ids}-table`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f3e6cf" />
              <stop offset="1" stopColor="#e3cfac" />
            </linearGradient>
            <linearGradient id={`${ids}-velvet`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={tint(field.bg, -0.35)} />
              <stop offset="0.5" stopColor={field.bg} />
              <stop offset="1" stopColor={tint(field.bg, -0.35)} />
            </linearGradient>
          </defs>
          <rect x="0" y="6" width={W} height={H} rx="22" fill="#3a2414" opacity="0.12" />
          <rect x="0" y="0" width={W} height={H} rx="22" fill={`url(#${ids}-table)`} />
          {[0.2, 0.45, 0.7].map((fy) => (
            <path key={fy} d={`M14 ${H * fy} Q${W / 2} ${H * fy + 10} ${W - 14} ${H * fy - 4}`} fill="none" stroke="#d2bb94" strokeWidth="1.2" opacity="0.6" />
          ))}

          {/* the curtain: everything left of it has been swept */}
          <rect x="0" y="0" width={Math.max(0, curtainX)} height={H} rx="22" fill={PALETTE.goldLight} opacity="0.3" style={{ transition: 'width 0.8s var(--ease-move)' }} />
          <g style={{ transform: `translateX(${curtainX}px)`, transition: 'transform 0.8s var(--ease-move)' }}>
            <rect x="-9" y="-4" width="18" height={H + 8} rx="6" fill="#3a2414" opacity="0.15" transform="translate(4, 0)" />
            <path d={`M-9 -2 H9 V${H + 2} Q4 ${H - 6} 0 ${H + 2} Q-4 ${H - 6} -9 ${H + 2} Z`} fill={`url(#${ids}-velvet)`} />
            {[-5, 0, 5].map((x) => (
              <line key={x} x1={x} y1="4" x2={x} y2={H - 6} stroke={tint(field.bg, -0.45)} strokeOpacity="0.4" strokeWidth="1.2" />
            ))}
            <rect x="-14" y="-8" width="28" height="9" rx="4.5" fill={PALETTE.gold} stroke={tint(PALETTE.gold, -0.3)} strokeWidth="1" />
          </g>

          {/* sticks */}
          {segs.map((s) => {
            const on = active.includes(s.id);
            const inPair = pair?.includes(s.id) && checking;
            return (
              <g key={s.id}>
                {inPair && <line x1={sx(s.p1.x)} y1={sy(s.p1.y)} x2={sx(s.p2.x)} y2={sy(s.p2.y)} stroke={PALETTE.goldLight} strokeWidth="22" strokeLinecap="round" />}
                <g opacity={on || phaseName === 'init' ? 1 : 0.5}>
                  <line x1={sx(s.p1.x)} y1={sy(s.p1.y) + 4} x2={sx(s.p2.x)} y2={sy(s.p2.y) + 4} stroke="#3a2414" strokeOpacity="0.16" strokeWidth="9" strokeLinecap="round" />
                  <line x1={sx(s.p1.x)} y1={sy(s.p1.y)} x2={sx(s.p2.x)} y2={sy(s.p2.y)} stroke={colour(s.id)} strokeWidth={on ? 10 : 8} strokeLinecap="round" />
                  <line x1={sx(s.p1.x)} y1={sy(s.p1.y) - 2} x2={sx(s.p2.x)} y2={sy(s.p2.y) - 2} stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
                </g>
                <text x={sx(s.p1.x) - 10} y={sy(s.p1.y) - 12} fontSize="14" fontWeight="900" fill={tint(colour(s.id), -0.35)} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                  {s.label}
                </text>
              </g>
            );
          })}

          {hit && (found || (checking && phase === 'verdict')) && (
            <g transform={`translate(${sx(hit.x)}, ${sy(hit.y)})`}>
              <g className="animate-story-pop">
                <path d="M0 -22 L5 -7 L20 -12 L9 0 L20 12 L5 7 L0 22 L-5 7 L-20 12 L-9 0 L-20 -12 L-5 -7 Z" fill={PALETTE.gold} stroke="#cc2e2e" strokeWidth="2" strokeLinejoin="round" />
                <circle r="5" fill="#ffffff" />
              </g>
            </g>
          )}
        </svg>

        {/* clipboard */}
        <div className="w-full lg:w-52 shrink-0 rounded-[22px] bg-[#fbf9f4]">
          <div className="h-3.5 w-16 mx-auto -mt-1.5 rounded-full bg-stone-700" />
          <div className="px-3 pb-3 pt-2 font-sans">
            <p className="font-display font-black text-base text-stone-900 mb-2">Touching the curtain</p>
            {active.length === 0 && <p className="text-sm italic text-stone-500">nothing yet</p>}
            <ol className="flex flex-col gap-1.5">
              {active.map((id) => (
                <li
                  key={id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold animate-story-pop ${pair?.includes(id) && checking ? 'bg-[#fde68a]' : 'bg-[#f3efe6]'}`}
                >
                  <span className="w-7 h-2 rounded-full" style={{ background: colour(id) }} />
                  {label(id)}
                </li>
              ))}
            </ol>
            {active.length > 0 && <p className="mt-2 text-xs text-stone-500">top ↑ … bottom ↓</p>}
          </div>
        </div>
      </div>
    </StoryStage>
  );
};
