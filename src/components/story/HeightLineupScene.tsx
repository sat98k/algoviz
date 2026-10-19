import React, { useRef } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';

/**
 * 🎡 Randomized Quicksort as kids lining up by height.
 *
 * Each number is a kid whose height shows the number. A spinning prize wheel picks a
 * random kid as the "pivot" (gets a crown). The pivot goes to the end of the group, then
 * every other kid measures up against it: shorter-or-equal kids walk to the left side of
 * a little fence, taller kids stay right. Finally the pivot steps into the gap — that's
 * exactly its place in the final line — and gets a medal. Then each side does the same.
 * Kids glide smoothly sideways when they swap places.
 */

const SLOT = 64;
const PAD = 30;
const FLOOR = 250;
const SHIRTS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export const HeightLineupScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const st: any = step.state || {};
  const arr: number[] = st.array || [];
  const n = arr.length;
  const low: number = st.low ?? 0;
  const high: number = st.high ?? n - 1;
  const pivot: number | undefined = st.pivotIndex;
  const pivotValue: number | undefined = st.pivotValue;
  const j: number | undefined = st.j;
  const iWall: number | undefined = st.i;
  const sorted: number[] = st.sortedIndices || [];
  const title: string = step.title || '';

  // Give every kid a stable identity so swaps glide instead of popping.
  const idsRef = useRef<{ arr: number[]; ids: string[] }>({ arr: [], ids: [] });
  const ids = (() => {
    const prev = idsRef.current;
    const pool = prev.arr.map((v, k) => ({ v, id: prev.ids[k] }));
    let fresh = 0;
    const next = arr.map((v) => {
      const k = pool.findIndex((p) => p.v === v);
      if (k >= 0) return pool.splice(k, 1)[0].id;
      return `kid-${v}-${fresh++}-${Math.random().toString(36).slice(2, 6)}`;
    });
    idsRef.current = { arr: [...arr], ids: next };
    return next;
  })();
  const shirt = (id: string) => SHIRTS[Math.abs([...id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) % SHIRTS.length];

  const kind = (() => {
    if (step.isFinal) return 'final';
    if (/^Initial Array/.test(title)) return 'intro';
    if (/^Random Pivot/.test(title)) return 'spin';
    if (/^Move Pivot/.test(title)) return 'move-pivot';
    if (/^Begin Lomuto/.test(title)) return 'begin';
    if (/^Compare/.test(title)) return 'compare';
    if (/^Swap/.test(title)) return 'swap';
    if (/^Pivot in Final/.test(title)) return 'placed';
    if (/^Single Element/.test(title)) return 'single';
    return 'idle';
  })();
  const phases: readonly (readonly [string, number])[] = kind === 'spin' ? [['spin', 0], ['stop', 0.55]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  const maxV = Math.max(1, ...arr.map(Math.abs));
  const kidH = (v: number) => 60 + (Math.abs(v) / maxV) * 120;
  const width = PAD * 2 + n * SLOT;
  const height = FLOOR + 70;
  const inWindow = (k: number) => kind === 'intro' || kind === 'final' || (k >= low && k <= high);

  const narration = (() => {
    switch (kind) {
      case 'intro':
        return 'These kids need to line up from shortest to tallest. Quicksort: pick one kid at random as the measuring stick, split everyone into shorter and taller, and repeat for each side.';
      case 'spin':
        return phase === 'spin' ? 'Spin the prize wheel to pick a random kid as the pivot…' : `The wheel picks the kid of height ${pivotValue}! They get the crown.`;
      case 'move-pivot':
        return 'The crowned kid steps to the end of the group so everyone else can be measured against them.';
      case 'begin':
        return `Measure every kid against the pivot (${pivotValue}). Kids shorter or equal go left of the little fence; taller kids stay right.`;
      case 'compare':
        return j !== undefined ? `Is the kid of height ${arr[j]} ${arr[j] <= (pivotValue ?? 0) ? 'shorter or equal? Yes: they belong left of the fence.' : 'shorter? No, taller: they stay on the right.'}` : step.title;
      case 'swap':
        return 'Swap places: the shorter kid glides left of the fence, and the fence moves one step right.';
      case 'placed':
        return `The pivot steps into the gap at the fence. Everyone left is shorter, everyone right is taller, so this is exactly their final spot. 🏅`;
      case 'single':
        return 'A group of one kid is already in order. 🏅';
      case 'final':
        return 'Everyone is lined up from shortest to tallest! Because the pivot is picked at random, no particular starting order can make this slow every time.';
      default:
        return step.title;
    }
  })();

  const x = (k: number) => PAD + k * SLOT + SLOT / 2;
  const fenceAt = iWall !== undefined && (kind === 'compare' || kind === 'swap' || kind === 'begin') ? iWall + 1 : undefined;

  return (
    <StoryStage
      emoji="🎡"
      title="Line Up by Height"
      subtitle="A random kid is the measuring stick: shorter ones go left, taller ones go right."
      narration={narration}
      status={kind === 'final' ? 'All lined up' : `Kids in place • ${sorted.length} of ${n}`}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.3 }} role="img" aria-label="Kids lined up">
        <rect x="0" y={FLOOR} width={width} height="14" rx="5" fill="#d9c2a3" />

        {/* the group being worked on */}
        {kind !== 'intro' && kind !== 'final' && (
          <rect x={PAD + low * SLOT + 2} y={FLOOR + 18} width={Math.max(0, (high - low + 1) * SLOT - 4)} height="8" rx="4" fill="#fbbf24" opacity="0.7" style={{ transition: 'all 0.6s' }} />
        )}

        {/* the fence between "shorter" and "taller" */}
        {fenceAt !== undefined && (
          <g style={{ transform: `translateX(${PAD + fenceAt * SLOT}px)`, transition: 'transform 0.6s ease-in-out' }}>
            <rect x="-3" y={FLOOR - 70} width="6" height="70" fill="#78350f" />
            <rect x="-14" y={FLOOR - 64} width="28" height="5" fill="#a16207" />
            <rect x="-14" y={FLOOR - 30} width="28" height="5" fill="#a16207" />
          </g>
        )}

        {/* the measuring line from the pivot's head */}
        {pivot !== undefined && pivotValue !== undefined && (kind === 'compare' || kind === 'begin') && (
          <line x1={PAD} y1={FLOOR - kidH(pivotValue)} x2={width - PAD} y2={FLOOR - kidH(pivotValue)} stroke="#dc2626" strokeWidth="2" strokeDasharray="6 5" />
        )}

        {arr.map((v, k) => {
          const id = ids[k];
          const h = kidH(v);
          const isPivot = pivot === k && kind !== 'final' && kind !== 'single' && !(kind === 'spin' && phase === 'spin');
          const measuring = kind === 'compare' && j === k;
          const medal = sorted.includes(k);
          return (
            <g key={id} style={{ transform: `translateX(${x(k)}px)`, transition: 'transform 0.9s ease-in-out', opacity: inWindow(k) ? 1 : 0.35 }}>
              <g className={measuring ? 'animate-story-bob' : undefined}>
                {/* legs, body, head */}
                <rect x="-9" y={FLOOR - h * 0.38} width="7" height={h * 0.38} rx="3" fill="#1e3a8a" />
                <rect x="2" y={FLOOR - h * 0.38} width="7" height={h * 0.38} rx="3" fill="#1e3a8a" />
                <rect x="-14" y={FLOOR - h * 0.78} width="28" height={h * 0.42} rx="8" fill={shirt(id)} stroke={measuring ? '#f59e0b' : 'none'} strokeWidth="3" />
                <circle cx="0" cy={FLOOR - h * 0.78 - 13} r="13" fill="#fcd9b6" stroke="#b45309" strokeWidth="1.2" />
                <circle cx="-4" cy={FLOOR - h * 0.78 - 15} r="1.6" fill="#1c1917" />
                <circle cx="4" cy={FLOOR - h * 0.78 - 15} r="1.6" fill="#1c1917" />
                <text x="0" y={FLOOR - h * 0.55} textAnchor="middle" fontSize="13" fontWeight="900" fill="#ffffff">
                  {v}
                </text>
                {isPivot && (
                  <text x="0" y={FLOOR - h * 0.78 - 28} textAnchor="middle" fontSize="20" className={kind === 'spin' ? 'animate-story-pop' : undefined}>
                    👑
                  </text>
                )}
                {medal && (
                  <text x="0" y={FLOOR + 48} textAnchor="middle" fontSize="16">
                    🏅
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {kind === 'spin' && phase === 'spin' && (
          <g transform={`translate(${width / 2}, 40)`}>
            <g className="animate-spin" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
              <text textAnchor="middle" y="12" fontSize="34">
                🎡
              </text>
            </g>
          </g>
        )}
      </svg>
    </StoryStage>
  );
};
