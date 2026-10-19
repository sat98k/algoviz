import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases, useHeldValue, useProgress, useTweened } from './useAnimPhases';

/**
 * 📌 Pegs on a cork board, shared by the convex hull algorithms.
 *
 * - Graham's Scan: a lighthouse beam numbers the pegs by angle, then a rubber band is
 *   hooked peg to peg; whenever it would turn right (a dent), it snaps off that peg.
 * - Jarvis' March: a ribbon swings like a clock hand from the last tied peg until it
 *   points at the outermost peg, then gets tied there, wrapping the pegs like a gift.
 */

type P = { id: number; x: number; y: number; label?: string };

const W = 720;
const H = 420;
const M = 46;

const BAND = '#c2410c';
const RIBBON = '#db2777';
const OK = '#16a34a';
const BAD = '#dc2626';

export const PegboardScene: React.FC<StorySceneProps> = ({ step, algorithmId, stepMs }) => {
  const st: any = step.state || {};
  const points: P[] = st.points || [];
  const isJarvis = algorithmId === 'jarvis-march';
  const pivot: P | undefined = st.pivot;
  const phaseName: string = st.phase || '';
  const title: string = step.title || '';
  const lbl = (p?: P) => p?.label ?? (p ? `P${p.id}` : '');

  // ── Board coordinates (y flipped so "up" is up) ──
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 1);
  const scale = Math.min((W - 2 * M) / (maxX - minX || 1), (H - 2 * M) / (maxY - minY || 1));
  const offX = (W - (maxX - minX) * scale) / 2;
  const offY = (H - (maxY - minY) * scale) / 2;
  const sx = (x: number) => offX + (x - minX) * scale;
  const sy = (y: number) => H - offY - (y - minY) * scale;
  const at = (p: P) => ({ x: sx(p.x), y: sy(p.y) });

  // ── Step kind ──
  const kind = (() => {
    if (step.isFinal || phaseName === 'complete') return 'final';
    if (/^Initialize/.test(title) && !st.hullStack?.length) return 'intro';
    if (/^Pivot Selected|^Anchor Pivot/.test(title)) return 'pivot';
    if (phaseName === 'sort_polar') return 'sort';
    if (/^Initialize Hull Stack/.test(title)) return 'seed';
    if (/^Check Orientation|^Orientation Check/.test(title)) return 'check';
    if (/^Pop/.test(title)) return 'pop';
    if (/^Push/.test(title)) return 'push';
    if (/Initial Candidate/.test(title)) return 'candidate';
    if (/^Update Candidate/.test(title)) return 'update';
    if (/^Confirmed Hull Vertex/.test(title)) return 'confirm';
    return 'idle';
  })();

  const phases: readonly (readonly [string, number])[] =
    kind === 'pop'
      ? [['snap', 0], ['tight', 0.45]]
      : kind === 'check'
      ? [['feel', 0], ['verdict', 0.4]]
      : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  const stack: P[] = st.hullStack || [];
  const shownStack = useHeldValue(stack, phase !== 'snap');
  const sweeping = kind === 'sort';
  const stretching = kind === 'push' || kind === 'seed' || kind === 'confirm';
  const sweep = useProgress(sweeping, stepMs * 0.85, `sweep-${step.stepIndex}`);
  const stretch = useProgress(stretching, stepMs * 0.45, `stretch-${step.stepIndex}`);

  const triplet: P[] | undefined = st.checkTriplet;
  const turn: string | undefined = st.turnOrientation;
  const current: P | undefined = st.currentPoint;

  // Jarvis: the ribbon hand from the last tied peg toward the candidate, swinging smoothly.
  const anchorId: number | undefined = step.highlights?.activePoint;
  const anchor = points.find((p) => p.id === anchorId);
  const handTarget = current ? at(current) : anchor ? at(anchor) : { x: 0, y: 0 };
  const [handX, handY] = useTweened([handTarget.x, handTarget.y], 600);

  // Graham: angle order for the lighthouse sweep.
  const angleOf = (p: P) => (pivot ? Math.atan2(p.y - pivot.y, p.x - pivot.x) : 0);
  const sorted: P[] = st.sortedPoints || [];
  const beamAngle = Math.PI * sweep;
  const orderIndex = new Map<number, number>();
  if (!isJarvis && sorted.length && phaseName !== 'find_pivot') sorted.forEach((p, i) => orderIndex.set(p.id, i));

  // ── Band / ribbon path ──
  const isFinal = kind === 'final';
  const chain = shownStack.map(at);
  const lastPeg = chain[chain.length - 1];
  const growing = (kind === 'push' || kind === 'confirm') && chain.length >= 2;
  const fixedChain = growing ? chain.slice(0, -1) : chain;
  const tip = growing && lastPeg
    ? {
        x: chain[chain.length - 2].x + (lastPeg.x - chain[chain.length - 2].x) * stretch,
        y: chain[chain.length - 2].y + (lastPeg.y - chain[chain.length - 2].y) * stretch,
      }
    : null;
  const bandPoints = [...fixedChain, ...(tip ? [tip] : [])];
  if (isFinal && chain.length > 2) bandPoints.push(chain[0]);
  const bandD = bandPoints.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');

  const onBand = new Set(shownStack.map((p) => p.id));
  const popping = kind === 'pop' && phase === 'snap' ? shownStack[shownStack.length - 1] : undefined;

  // ── Narration ──
  const narration = (() => {
    switch (kind) {
      case 'intro':
        return 'Pegs are stuck in a cork board. We want the tightest fence around all of them, as if we stretched a rubber band around the outside.';
      case 'pivot':
        return isJarvis
          ? `Start at the leftmost peg, ${lbl(pivot)}. It is surely on the fence. We’ll wrap a ribbon around the pegs like wrapping a gift.`
          : `Start at the lowest peg, ${lbl(pivot)}. It is surely on the fence.`;
      case 'sort':
        return 'A lighthouse beam sweeps around from the start peg and numbers the pegs in the order it reaches them.';
      case 'seed':
        return 'Hook the rubber band on the first pegs in beam order.';
      case 'check': {
        if (!triplet) return step.title;
        const [a, b, c] = triplet;
        if (isJarvis) {
          return phase === 'feel'
            ? `Is peg ${lbl(c)} further out than ${lbl(b)}?`
            : turn === 'ccw'
            ? `Yes, ${lbl(c)} is further out, so the ribbon must swing to it.`
            : `No, ${lbl(b)} is still the outermost so far.`;
        }
        return phase === 'feel'
          ? `Going ${lbl(a)} → ${lbl(b)} → ${lbl(c)}: which way does the band bend at ${lbl(b)}?`
          : turn === 'ccw'
          ? `It bends left, so the fence keeps bulging outward. ${lbl(b)} stays.`
          : `It bends right at ${lbl(b)}, which would make a dent. A tight band can’t have dents!`;
      }
      case 'pop':
        return phase === 'snap'
          ? `Snap! The band slips off peg ${lbl(popping)}…`
          : `${lbl(stack[stack.length - 1])} is now the last hooked peg; the dented peg ends up inside the fence.`;
      case 'push':
        return `Stretch the band out to peg ${lbl(current)}.`;
      case 'candidate':
        return `From ${lbl(anchor)}, point the ribbon at peg ${lbl(current)} for now.`;
      case 'update':
        return `The ribbon swings out to ${lbl(current)}.`;
      case 'confirm':
        return `No peg is further out than ${lbl(current)}. Tie the ribbon there: it’s on the fence.`;
      case 'final':
        return isJarvis
          ? `The ribbon is back at the start. The gift is wrapped with ${stack.length} pegs on the outside.`
          : `The band is tight all the way around. ${stack.length} pegs hold the fence; every other peg is inside.`;
      default:
        return step.title;
    }
  })();

  const status = isFinal ? `Fence done • ${stack.length} pegs on it` : `Pegs on the fence • ${stack.length}`;

  const pv = pivot ? at(pivot) : null;
  const R = Math.hypot(W, H);

  return (
    <StoryStage
      emoji={isJarvis ? '🎁' : '📌'}
      title={isJarvis ? 'Gift-Wrapping the Pegs' : 'Rubber Band on a Pegboard'}
      subtitle={isJarvis ? 'Swing the ribbon to the outermost peg, tie it, repeat.' : 'Hook the band peg by peg; snap it off any peg that makes a dent.'}
      narration={narration}
      status={status}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label="Pegboard">
        <defs>
          <pattern id="storyCork" width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill="#e3c08f" />
            <circle cx="3" cy="4" r="1.1" fill="#c99a62" />
            <circle cx="10" cy="9" r="0.9" fill="#b9874f" />
            <circle cx="7" cy="1" r="0.6" fill="#d4a76f" />
          </pattern>
          <radialGradient id="storyBrass" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="55%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} rx="18" fill="#a16207" />
        <rect x="10" y="10" width={W - 20} height={H - 20} rx="12" fill="url(#storyCork)" />

        {/* Lighthouse beam */}
        {pv && kind === 'sort' && (
          <g>
            <path
              d={`M ${pv.x} ${pv.y} L ${pv.x + R * Math.cos(beamAngle - 0.05)} ${pv.y - R * Math.sin(beamAngle - 0.05)} L ${pv.x + R * Math.cos(beamAngle + 0.05)} ${pv.y - R * Math.sin(beamAngle + 0.05)} Z`}
              fill="#fef08a"
              opacity="0.55"
            />
            <text x={pv.x} y={pv.y + 34} textAnchor="middle" fontSize="24">
              🗼
            </text>
          </g>
        )}

        {/* Graham: tentative feeler during the check */}
        {triplet && kind === 'check' && (
          <g>
            {isJarvis ? (
              <line x1={at(triplet[0]).x} y1={at(triplet[0]).y} x2={at(triplet[2]).x} y2={at(triplet[2]).y} stroke="#78716c" strokeWidth="2" strokeDasharray="5 5" />
            ) : (
              <polyline
                points={triplet.map((p) => `${at(p).x},${at(p).y}`).join(' ')}
                fill="none"
                stroke={phase === 'verdict' ? (turn === 'ccw' ? OK : BAD) : '#78716c'}
                strokeWidth="3"
                strokeDasharray="7 5"
              />
            )}
            {phase === 'verdict' && (
              <g transform={`translate(${at(triplet[1]).x}, ${at(triplet[1]).y - 30})`}>
                <g className="animate-story-pop">
                  <rect x="-46" y="-13" width="92" height="24" rx="12" fill="#ffffff" stroke={turn === 'ccw' ? OK : BAD} strokeWidth="2" />
                  <text textAnchor="middle" y="4" fontSize="12" fontWeight="800" fill={turn === 'ccw' ? OK : BAD}>
                    {isJarvis ? (turn === 'ccw' ? 'further out!' : 'not further') : turn === 'ccw' ? '↺ bends left' : '↻ dent!'}
                  </text>
                </g>
              </g>
            )}
          </g>
        )}

        {/* Rubber band / ribbon */}
        {bandPoints.length > 1 && (
          <>
            <path d={bandD} fill={isFinal ? (isJarvis ? '#fbcfe8' : '#fed7aa') : 'none'} fillOpacity={isFinal ? 0.35 : 0} stroke="#00000022" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" transform="translate(2,3)" />
            <path d={bandD} fill="none" stroke={isJarvis ? RIBBON : BAND} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}

        {/* Jarvis: the swinging ribbon hand */}
        {isJarvis && anchor && current && !isFinal && kind !== 'confirm' && (
          <g>
            <line x1={at(anchor).x} y1={at(anchor).y} x2={handX} y2={handY} stroke={RIBBON} strokeWidth="4" strokeDasharray="10 6" strokeLinecap="round" />
            <circle cx={handX} cy={handY} r="15" fill="none" stroke={RIBBON} strokeWidth="2.5" />
          </g>
        )}

        {/* Snapping peg */}
        {popping && (
          <text x={at(popping).x + 16} y={at(popping).y - 14} fontSize="18" fontWeight="900" fill={BAD} className="animate-story-pop">
            snap!
          </text>
        )}

        {/* Pegs */}
        {points.map((p) => {
          const c = at(p);
          const isPivot = pivot?.id === p.id && kind !== 'intro';
          const hooked = onBand.has(p.id);
          const lit = kind !== 'sort' || angleOf(p) <= beamAngle + 1e-9 || isPivot;
          const ord = orderIndex.get(p.id);
          const inside = isFinal && !hooked;
          return (
            <g key={`peg-${p.id}`} opacity={inside ? 0.55 : 1}>
              <ellipse cx={c.x + 3} cy={c.y + 4} rx="9" ry="6" fill="#00000030" />
              <circle cx={c.x} cy={c.y} r={hooked ? 10 : 8.5} fill="url(#storyBrass)" stroke={hooked ? (isJarvis ? RIBBON : BAND) : '#78350f'} strokeWidth={hooked ? 3 : 1.5} />
              <text x={c.x} y={c.y + 26} textAnchor="middle" fontSize="12" fontWeight="700" fill="#451a03">
                {lbl(p)}
              </text>
              {isPivot && (
                <text x={c.x} y={c.y - 14} textAnchor="middle" fontSize="20">
                  📍
                </text>
              )}
              {ord !== undefined && ord > 0 && lit && (kind === 'sort' || kind === 'seed' || kind === 'check' || kind === 'push' || kind === 'pop') && (
                <g className={kind === 'sort' ? 'animate-story-pop' : undefined}>
                  <circle cx={c.x + 15} cy={c.y - 13} r="9" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
                  <text x={c.x + 15} y={c.y - 9} textAnchor="middle" fontSize="10" fontWeight="800" fill="#713f12">
                    {ord}
                  </text>
                </g>
              )}
              {current?.id === p.id && !isFinal && (kind === 'push' || kind === 'check' || kind === 'pop') && !isJarvis && (
                <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="#f59e0b" strokeWidth="3" className="animate-story-ripple" />
              )}
            </g>
          );
        })}
      </svg>
    </StoryStage>
  );
};
