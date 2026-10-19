import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';
import { doIntersect } from '../../algorithms/lineSegmentIntersection';

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
      emoji="🎭"
      title="Sticks and a Sliding Curtain"
      subtitle="Only sticks next to each other on the clipboard are checked for crossing."
      narration={narration}
      status={found ? 'Crossing found!' : phaseName === 'no_intersection' ? 'No crossings' : `On the clipboard • ${active.length}`}
    >
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full lg:flex-1 h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Sticks on a table">
          <rect x="0" y="0" width={W} height={H} rx="18" fill="#efe3d3" stroke="#d5be9f" strokeWidth="2" />

          {/* the curtain: everything left of it has been swept */}
          <rect x="0" y="0" width={Math.max(0, curtainX)} height={H} rx="18" fill="#fde68a" opacity="0.18" style={{ transition: 'width 0.8s ease-in-out' }} />
          <g style={{ transform: `translateX(${curtainX}px)`, transition: 'transform 0.8s ease-in-out' }}>
            <rect x="-5" y="6" width="10" height={H - 12} rx="5" fill="#be123c" opacity="0.85" />
            {[40, 110, 180, 250, 320].map((y) => (
              <path key={y} d={`M -5 ${y} q -10 18 0 36`} fill="none" stroke="#9f1239" strokeWidth="2" />
            ))}
            <text x="0" y="0" textAnchor="middle" fontSize="18">
              🎭
            </text>
          </g>

          {/* sticks */}
          {segs.map((s) => {
            const on = active.includes(s.id);
            const inPair = pair?.includes(s.id) && checking;
            return (
              <g key={s.id}>
                {inPair && <line x1={sx(s.p1.x)} y1={sy(s.p1.y)} x2={sx(s.p2.x)} y2={sy(s.p2.y)} stroke="#fde047" strokeWidth="18" strokeLinecap="round" />}
                <line x1={sx(s.p1.x)} y1={sy(s.p1.y)} x2={sx(s.p2.x)} y2={sy(s.p2.y)} stroke={colour(s.id)} strokeWidth={on ? 9 : 7} strokeLinecap="round" opacity={on || phaseName === 'init' ? 1 : 0.55} />
                <text x={sx(s.p1.x) - 10} y={sy(s.p1.y) - 10} fontSize="13" fontWeight="900" fill={colour(s.id)}>
                  {s.label}
                </text>
              </g>
            );
          })}

          {hit && (found || (checking && phase === 'verdict')) && (
            <text x={sx(hit.x)} y={sy(hit.y) + 10} textAnchor="middle" fontSize="34" className="animate-story-pop">
              💥
            </text>
          )}
        </svg>

        {/* clipboard */}
        <div className="w-full lg:w-48 shrink-0 rounded-xl border-2 border-stone-400 bg-white shadow-sm">
          <div className="h-3 w-16 mx-auto -mt-1.5 rounded-b-md bg-stone-500" />
          <div className="px-3 pb-3 pt-2 font-sans">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">📋 Touching the curtain</p>
            {active.length === 0 && <p className="text-xs italic text-stone-400">nothing yet</p>}
            <ol className="flex flex-col gap-1.5">
              {active.map((id) => (
                <li
                  key={id}
                  className={`flex items-center gap-2 px-2 py-1 rounded-md border text-sm font-bold animate-story-pop ${pair?.includes(id) && checking ? 'bg-yellow-100 border-yellow-500' : 'bg-stone-50 border-stone-200'}`}
                >
                  <span className="w-6 h-1.5 rounded-full" style={{ background: colour(id) }} />
                  {label(id)}
                </li>
              ))}
            </ol>
            {active.length > 0 && <p className="mt-2 text-[11px] text-stone-500">top ↑ … bottom ↓</p>}
          </div>
        </div>
      </div>
    </StoryStage>
  );
};
