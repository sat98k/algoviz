import React, { useRef } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useStepTimeline } from './kit/useStepTimeline';
import { ContactShadow, Lit, PALETTE, Room, SceneDefs, tint, useSvgIds } from './kit/materials';
import { HairStyle, Person, personTop } from './kit/Person';
import { useChapter } from './kit/chapter';

/**
 * Randomized Quicksort as kids lining up by height, in a room whose floor is the module's colour.
 *
 * Each number is a kid whose height shows the number. A prize wheel on a stand, with one slice
 * per kid in the group (in their shirt colours), spins and stops on a random kid: the pivot, who
 * gets a crown. The pivot goes to the end of the group, then a measuring tape is pulled across
 * at the pivot's height and every other kid is measured: shorter-or-equal kids walk left of a
 * little fence, taller kids stay right. The pivot steps into the gap, which is exactly its place
 * in the final line, and a gold star is set into the floor there. Then each side does the same.
 *
 * Every step is one GSAP timeline (useStepTimeline): React draws where everyone ends up, and the
 * timeline walks them there from where they were.
 */

const SLOT = 68;
const LEFT = 150;
const RIGHT = 30;
const FLOOR = 330;
const DEPTH = 58;
const WHEEL = { x: 72, y: FLOOR - 168, r: 46 };

const hash = (s: string) => Math.abs([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
const look = (id: string) => {
  const h = hash(id);
  return {
    shirt: PALETTE.fabrics[h % PALETTE.fabrics.length],
    skin: PALETTE.skins[(h >> 3) % PALETTE.skins.length],
    hair: PALETTE.hair[(h >> 6) % PALETTE.hair.length],
    hairStyle: ((h >> 9) % 5) as HairStyle,
  };
};

type Kind = 'intro' | 'spin' | 'move-pivot' | 'begin' | 'compare' | 'swap' | 'placed' | 'single' | 'final' | 'idle';

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
  const field = useChapter();
  const ids = useSvgIds();
  const svgRef = useRef<SVGSVGElement>(null);

  // Give every kid a stable identity so swaps glide instead of popping.
  const idsRef = useRef<{ arr: number[]; ids: string[] }>({ arr: [], ids: [] });
  const kidIds = (() => {
    const prev = idsRef.current;
    const pool = prev.arr.map((v, k) => ({ v, id: prev.ids[k] }));
    let fresh = 0;
    const next = arr.map((v) => {
      const k = pool.findIndex((p) => p.v === v);
      if (k >= 0) return pool.splice(k, 1)[0].id;
      return `kid-${v}-${fresh++}`;
    });
    idsRef.current = { arr: [...arr], ids: next };
    return next;
  })();

  const kind: Kind = (() => {
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

  const maxV = Math.max(1, ...arr.map(Math.abs));
  const kidH = (v: number) => 112 + (Math.abs(v) / maxV) * 142;
  const width = LEFT + n * SLOT + RIGHT;
  const height = FLOOR + DEPTH + 6;
  const x = (k: number) => LEFT + k * SLOT + SLOT / 2;
  const inWindow = (k: number) => kind === 'intro' || kind === 'final' || (k >= low && k <= high);
  const fenceAt = iWall !== undefined && (kind === 'compare' || kind === 'swap' || kind === 'begin') ? iWall + 1 : undefined;
  const fenceX = fenceAt !== undefined ? LEFT + fenceAt * SLOT : undefined;
  const measuring = kind === 'compare' || kind === 'begin';
  const shorter = j !== undefined && arr[j] <= (pivotValue ?? 0);

  // The wheel keeps the slices and the stopping angle of its last spin, like a real one would.
  const wheelRef = useRef<{ colors: string[]; rot: number }>({ colors: [], rot: 0 });
  if (kind === 'spin' && pivot !== undefined) {
    const group = kidIds.slice(low, high + 1);
    const slice = 360 / Math.max(1, group.length);
    wheelRef.current = { colors: group.map((id) => look(id).shirt), rot: -((pivot - low) + 0.5) * slice };
  } else if (!wheelRef.current.colors.length) {
    wheelRef.current = { colors: kidIds.map((id) => look(id).shirt), rot: -180 / Math.max(1, n) };
  }
  const wheel = wheelRef.current;

  // Where everyone stood before this step, so the timeline can walk them from there.
  const placesRef = useRef<{ key: number; prev: Map<string, number>; cur: Map<string, number>; prevFence?: number; curFence?: number; prevSorted: number[]; curSorted: number[] }>({
    key: -1,
    prev: new Map(),
    cur: new Map(),
    prevSorted: [],
    curSorted: [],
  });
  if (placesRef.current.key !== step.stepIndex) {
    const p = placesRef.current;
    placesRef.current = {
      key: step.stepIndex,
      prev: p.cur,
      cur: new Map(kidIds.map((id, k) => [id, x(k)])),
      prevFence: p.curFence,
      curFence: fenceX,
      prevSorted: p.curSorted,
      curSorted: sorted,
    };
  }

  useStepTimeline(svgRef, step.stepIndex, stepMs, (tl, q) => {
    const places = placesRef.current;
    const kid = (id: string, part: string) => q(`[data-kid="${id}"] ${part}`);

    // Anyone whose place changed walks there, bobbing as they go.
    kidIds.forEach((id, k) => {
      const from = places.prev.get(id);
      if (from === undefined || Math.abs(from - x(k)) < 0.5) return;
      tl.fromTo(kid(id, '.lu-move'), { x: from - x(k) }, { x: 0, duration: 0.95, ease: 'story.move' }, 0);
      tl.fromTo(kid(id, '.lu-hop'), { y: 0 }, { y: -7, duration: 0.16, ease: 'sine.inOut', yoyo: true, repeat: 5 }, 0);
    });
    if (fenceX !== undefined && places.prevFence !== undefined && places.prevFence !== fenceX) {
      tl.fromTo(q('.lu-fence-move'), { x: places.prevFence - fenceX }, { x: 0, duration: 0.8, ease: 'story.move' }, 0.1);
    }

    switch (kind) {
      case 'intro':
        // Everyone is already standing there; they say hello with a ripple of little hops.
        tl.to(q('.lu-hop'), { y: -12, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.out', stagger: 0.06 }, 0);
        break;
      case 'spin': {
        tl.fromTo(q('.lu-wheel-spin'), { rotation: -1440 }, { rotation: 0, duration: 2.2, ease: 'power4.out', transformOrigin: '50% 50%' }, 0);
        tl.fromTo(q('.lu-pointer'), { rotation: -16 }, { rotation: 0, duration: 0.14, repeat: 9, ease: 'power1.out', transformOrigin: '50% 0%' }, 0);
        tl.addLabel('stop', 2.1);
        tl.fromTo(q('.lu-crown'), { y: -70, opacity: 0, rotation: -18 }, { y: 0, opacity: 1, rotation: 0, duration: 0.55, ease: 'story.land', transformOrigin: '50% 100%' }, 'stop');
        if (pivot !== undefined) {
          const arm = kid(kidIds[pivot], '.sk-arm-r');
          tl.to(arm, { rotation: -150, duration: 0.3, transformOrigin: '50% 0%' }, 'stop+=0.3').to(arm, { rotation: 0, duration: 0.45 });
        }
        break;
      }
      case 'begin':
        tl.fromTo(q('.lu-fence-grow'), { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'story.land', transformOrigin: '50% 100%' }, 0);
        tl.fromTo(q('.lu-tape'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.9, ease: 'story.out' }, 0.35);
        break;
      case 'compare':
        if (j !== undefined) {
          tl.fromTo(kid(kidIds[j], '.lu-hop'), { y: 0 }, { y: -12, duration: 0.22, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0);
          tl.fromTo(q('.lu-verdict'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'story.land', transformOrigin: '50% 50%' }, 0.4);
          tl.fromTo(q('.lu-verdict-arrow'), { x: 0 }, { x: shorter ? -4 : 4, duration: 0.2, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.8);
        }
        break;
      case 'placed':
      case 'single': {
        const fresh = sorted.filter((k) => !places.prevSorted.includes(k));
        fresh.forEach((k) => {
          tl.fromTo(q(`[data-final-spot="${k}"]`), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'story.land', transformOrigin: '50% 50%' }, 0.75);
        });
        break;
      }
      case 'final':
        tl.to(q('.lu-hop'), { y: -16, duration: 0.22, yoyo: true, repeat: 1, ease: 'sine.out', stagger: 0.07 }, 0.1);
        break;
    }
  });

  const narration = (() => {
    switch (kind) {
      case 'intro':
        return 'These kids need to line up from shortest to tallest. Quicksort: pick one kid at random as the measuring stick, split everyone into shorter and taller, and repeat for each side.';
      case 'spin':
        return `The prize wheel has one slice for each kid in the group. It spins and stops on the kid of height ${pivotValue}: they get the crown and become the pivot.`;
      case 'move-pivot':
        return 'The crowned kid steps to the end of the group so everyone else can be measured against them.';
      case 'begin':
        return `A measuring tape goes across at the pivot's height (${pivotValue}). Kids shorter or equal go left of the little fence; taller kids stay right.`;
      case 'compare':
        return j !== undefined ? `Is the kid of height ${arr[j]} ${shorter ? 'shorter or equal? Yes: they belong left of the fence.' : 'shorter? No, taller: they stay on the right.'}` : step.title;
      case 'swap':
        return 'Swap places: the shorter kid walks left of the fence, and the fence moves one step right.';
      case 'placed':
        return 'The pivot steps into the gap at the fence. Everyone left is shorter, everyone right is taller, so this is exactly their final spot: a gold star goes into the floor there.';
      case 'single':
        return 'A group of one kid is already in order, so their spot gets a gold star.';
      case 'final':
        return 'Everyone is lined up from shortest to tallest! Because the pivot is picked at random, no particular starting order can make this slow every time.';
      default:
        return step.title;
    }
  })();

  const slice = 360 / Math.max(1, wheel.colors.length);
  const wedge = (k: number) => {
    const a0 = ((k * slice - 90) * Math.PI) / 180;
    const a1 = (((k + 1) * slice - 90) * Math.PI) / 180;
    const r = WHEEL.r;
    return `M0 0 L${Math.cos(a0) * r} ${Math.sin(a0) * r} A${r} ${r} 0 ${slice > 180 ? 1 : 0} 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r} Z`;
  };

  const pivotTop = pivotValue !== undefined ? FLOOR + 22 + personTop(kidH(pivotValue)) : 0;

  return (
    <StoryStage
      emoji="🎡"
      title="Line Up by Height"
      subtitle="A random kid is the measuring stick: shorter ones go left, taller ones go right."
      narration={narration}
      status={kind === 'final' ? 'All lined up' : `Kids in place • ${sorted.length} of ${n}`}
    >
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.35 }} role="img" aria-label="Kids lining up by height">
        <SceneDefs ids={ids} floor={field.bg} />
        <defs>
          <Lit id={`${ids}-rug`} color={tint(field.bg, 0.45)} light={0.15} dark={-0.05} />
          <Lit id={`${ids}-wood`} color={PALETTE.walnut} />
        </defs>
        <Room ids={ids} width={width} floorY={FLOOR} depth={DEPTH} floor={field.bg} />

        {/* the rug under the group being sorted */}
        {kind !== 'intro' && kind !== 'final' && (
          <rect
            x={LEFT + low * SLOT + 4}
            y={FLOOR + 8}
            width={Math.max(0, (high - low + 1) * SLOT - 8)}
            height={DEPTH - 22}
            rx={(DEPTH - 22) / 2}
            fill={`url(#${ids}-rug)`}
            style={{ transition: 'x 0.7s var(--ease-move), width 0.7s var(--ease-move)' }}
          />
        )}

        {/* gold stars set into the floor at every final spot */}
        {sorted.map((k) => (
          <g key={`spot-${k}`} transform={`translate(${x(k)}, ${FLOOR + DEPTH / 2 + 2})`}>
            <g data-final-spot={k}>
              <ellipse rx="22" ry="8" fill={`url(#${ids}-gold)`} stroke="#b7791f" strokeWidth="1.2" />
              <path d="M0 -5.5 L1.8 -1.6 L6.4 -1.4 L2.8 1.1 L4 5.2 L0 2.9 L-4 5.2 L-2.8 1.1 L-6.4 -1.4 L-1.8 -1.6 Z" transform="scale(1.4 0.62)" fill="#fff8dc" />
            </g>
          </g>
        ))}

        {/* the prize wheel on its stand */}
        <g aria-hidden>
          <path d={`M${WHEEL.x - 30} ${FLOOR + 4} L${WHEEL.x} ${WHEEL.y} L${WHEEL.x + 30} ${FLOOR + 4}`} stroke={`url(#${ids}-wood)`} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <ContactShadow ids={ids} cx={WHEEL.x} cy={FLOOR + 6} rx={44} />
          <g transform={`translate(${WHEEL.x}, ${WHEEL.y})`}>
            <circle r={WHEEL.r + 6} fill={PALETTE.ink} filter={`url(#${ids}-soft)`} />
            <g transform={`rotate(${wheel.rot})`}>
              <g className="lu-wheel-spin">
                {wheel.colors.length <= 1 ? (
                  <circle r={WHEEL.r} fill={wheel.colors[0] ?? PALETTE.gold} />
                ) : (
                  wheel.colors.map((c, k) => <path key={k} d={wedge(k)} fill={c} stroke={PALETTE.ink} strokeWidth="1.5" />)
                )}
                <circle r={WHEEL.r} fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="6" />
              </g>
            </g>
            <circle r="9" fill={`url(#${ids}-gold)`} stroke={PALETTE.ink} strokeWidth="2" />
            <g transform={`translate(0, ${-WHEEL.r - 10})`}>
              <path className="lu-pointer" d="M-9 -4 H9 L0 14 Z" fill={PALETTE.ink} stroke={PALETTE.ink} strokeWidth="2" strokeLinejoin="round" />
            </g>
          </g>
        </g>

        {/* the fence between "shorter" and "taller" */}
        {fenceX !== undefined && (
          <g transform={`translate(${fenceX}, ${FLOOR + 18})`}>
            <g className="lu-fence-move">
              <g className="lu-fence-grow" filter={`url(#${ids}-soft)`}>
                <rect x="-16" y="-58" width="32" height="7" rx="3.5" fill={tint(PALETTE.walnut, 0.25)} />
                <rect x="-16" y="-30" width="32" height="7" rx="3.5" fill={tint(PALETTE.walnut, 0.25)} />
                {[-10, 10].map((dx) => (
                  <path key={dx} d={`M${dx - 4} 0 V-64 L${dx} -70 L${dx + 4} -64 V0 Z`} fill={`url(#${ids}-wood)`} />
                ))}
              </g>
            </g>
          </g>
        )}

        {/* the measuring tape pulled across at the pivot's height */}
        {pivotValue !== undefined && measuring && (
          <g aria-hidden>
            <path className="lu-tape" d={`M${x(high) + 20} ${pivotTop} H${x(low) - SLOT / 2 + 6}`} stroke={PALETTE.gold} strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d={`M${x(high) + 20} ${pivotTop} H${x(low) - SLOT / 2 + 6}`} stroke={PALETTE.ink} strokeWidth="1.2" strokeDasharray="1.2 7" fill="none" opacity="0.55" />
          </g>
        )}

        {arr.map((v, k) => {
          const id = kidIds[k];
          const h = kidH(v);
          const kidLook = look(id);
          const isPivot = pivot === k && kind !== 'final' && kind !== 'single';
          const measured = kind === 'compare' && j === k;
          return (
            <g key={id} data-kid={id} transform={`translate(${x(k)}, ${FLOOR + 22})`} style={{ opacity: inWindow(k) ? 1 : 0.4, transition: 'opacity 0.4s var(--ease-out)' }}>
              <g className="lu-move">
                <ContactShadow ids={ids} cy={0} rx={24} />
                <g className="lu-hop">
                  <Person height={h} {...kidLook} number={v} outline={measured ? PALETTE.ink : undefined} />
                  {isPivot && (
                    <g transform={`translate(0, ${personTop(h) + 5 - (kidLook.hairStyle === 3 ? 9 : kidLook.hairStyle === 2 ? 4 : 0)})`} data-crown>
                      <path className="lu-crown" d="M-14 0 L-15 -16 L-7 -8 L0 -21 L7 -8 L15 -16 L14 0 Z" fill={`url(#${ids}-gold)`} stroke="#9a6416" strokeWidth="1.4" strokeLinejoin="round" />
                    </g>
                  )}
                </g>
              </g>
            </g>
          );
        })}

        {/* the measuring verdict over the kid being measured */}
        {kind === 'compare' && j !== undefined && (
          <g transform={`translate(${x(j)}, ${FLOOR + 22 + personTop(kidH(arr[j])) - 34})`} aria-hidden>
            <g className="lu-verdict" filter={`url(#${ids}-soft)`}>
              <circle r="15" fill={shorter ? '#18bc42' : PALETTE.sky} stroke={PALETTE.ink} strokeWidth="2" />
              <path className="lu-verdict-arrow" d={shorter ? 'M6 0 H-6 M-1 -5 L-6 0 L-1 5' : 'M-6 0 H6 M1 -5 L6 0 L1 5'} stroke={PALETTE.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          </g>
        )}
      </svg>
    </StoryStage>
  );
};
