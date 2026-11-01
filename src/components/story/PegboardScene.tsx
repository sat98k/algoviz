import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases, useHeldValue, useProgress, useTweened } from './useAnimPhases';
import { PALETTE, tint, useSvgIds } from './kit/materials';
import { useChapter } from './kit/chapter';

/**
 * 📌 Pegs on a cork board, shared by the convex hull algorithms.
 *
 * - Graham's Scan: a lighthouse beam numbers the pegs by angle, then a rubber band is
 *   hooked peg to peg; whenever it would turn right (a dent), it snaps off that peg.
 * - Jarvis' March: the ribbon is held at the last tied peg (which never moves during the
 *   search) and must keep every peg on its left. Whenever a peg turns up on its right side
 *   (shaded: outside), the ribbon swings to that peg. When no peg is on the right, it is tied
 *   there: the next corner, counter-clockwise.
 */

type P = { id: number; x: number; y: number; label?: string };

const W = 720;
const H = 420;
const M = 46;

const BAND = '#d9573f';
const RIBBON = '#d4688c';
const OK = '#0c8030';
const BAD = '#cc2e2e';

export const PegboardScene: React.FC<StorySceneProps> = ({ step, algorithmId, stepMs }) => {
  const ids = useSvgIds();
  const field = useChapter();
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
  const minX = (xs.length ? Math.min(...xs) : 0);
  const maxX = (xs.length ? Math.max(...xs) : 1);
  const minY = (ys.length ? Math.min(...ys) : 0);
  const maxY = (ys.length ? Math.max(...ys) : 1);
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
  // Jarvis: whether the checked peg takes over as the candidate (right of the ribbon, or on its line further away).
  const replaces: boolean = !!st.replaces;

  // Jarvis: the ribbon hand from the tied peg (fixed during the search) toward the candidate, swinging smoothly.
  const anchorId: number | undefined = st.wrapFrom?.id ?? step.highlights?.activePoint;
  const anchor = points.find((p) => p.id === anchorId);
  const handTarget = current ? at(current) : anchor ? at(anchor) : { x: 0, y: 0 };
  const [handX, handY] = useTweened([handTarget.x, handTarget.y], 600);
  const searching = isJarvis && !!anchor && !!current && (kind === 'candidate' || kind === 'check' || kind === 'update');
  // The ribbon's right side (outside): a half-plane through the tied peg, following the swinging hand.
  const outside = (() => {
    if (!searching || !anchor) return null;
    const a = at(anchor);
    const dx = handX - a.x;
    const dy = handY - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return null;
    const far = Math.hypot(W, H) * 2;
    const ux = (dx / len) * far;
    const uy = (dy / len) * far;
    // Screen y points down, so the right-hand side of the direction (dx, dy) is (-dy, dx).
    const nx = -uy;
    const ny = ux;
    return `M ${a.x - ux} ${a.y - uy} L ${a.x + ux} ${a.y + uy} L ${a.x + ux + nx} ${a.y + uy + ny} L ${a.x - ux + nx} ${a.y - uy + ny} Z`;
  })();

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
          ? `Start at the lowest peg, ${lbl(pivot)}. It is surely on the fence. We’ll wrap a ribbon around the pegs like a gift, counter-clockwise: heading right along the bottom first.`
          : `Start at the lowest peg, ${lbl(pivot)}. It is surely on the fence.`;
      case 'sort':
        return 'A lighthouse beam sweeps around from the start peg and numbers the pegs in the order it reaches them.';
      case 'seed':
        return 'Hook the rubber band on the first pegs in beam order.';
      case 'check': {
        if (!triplet) return step.title;
        const [a, b, c] = triplet;
        if (isJarvis) {
          if (phase === 'feel') return `Which side of the ribbon ${lbl(a)} → ${lbl(b)} is peg ${lbl(c)} on?`;
          if (turn === 'collinear')
            return replaces
              ? `${lbl(c)} is on the same straight line, just further along. Stretch the ribbon out to ${lbl(c)}.`
              : `${lbl(c)} is on the same straight line but closer: it lies along the ribbon, not at a corner. ${lbl(b)} stays.`;
          return replaces
            ? `${lbl(c)} is on the right side, outside the ribbon. Swing the ribbon over to ${lbl(c)}.`
            : `${lbl(c)} is on the left side, inside the ribbon. ${lbl(b)} stays.`;
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
        return `Hold the ribbon at ${lbl(anchor)} and point it at peg ${lbl(current)} for now. It must keep every peg on its left side; the shaded side is outside.`;
      case 'update':
        return `The ribbon swings from ${lbl(anchor)} to ${lbl(current)}. ${lbl(anchor)} stays tied where it is.`;
      case 'confirm':
        return current?.id === pivot?.id
          ? `No peg is on the right side: the ribbon is back at the start, ${lbl(pivot)}.`
          : `No peg is on the right side of the ribbon. Tie it to ${lbl(current)}: the next corner of the fence.`;
      case 'final':
        return isJarvis
          ? `The ribbon is back at the start. The gift is wrapped counter-clockwise with ${stack.length} pegs on the outside.`
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
      title={isJarvis ? 'Gift-Wrapping the Pegs' : 'Rubber Band on a Pegboard'}
      subtitle={isJarvis ? 'Keep every peg on the ribbon’s left; tie the next corner, repeat.' : 'Hook the band peg by peg; snap it off any peg that makes a dent.'}
      narration={narration}
      status={status}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label="Pegboard">
        <defs>
          <pattern id={`${ids}-cork`} width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="#e6c899" />
            <circle cx="3" cy="4" r="1.1" fill="#d1ad78" />
            <circle cx="11" cy="10" r="0.9" fill="#c79f68" />
            <circle cx="8" cy="1.5" r="0.7" fill="#dcbb88" />
            <circle cx="13" cy="3" r="0.5" fill="#f2dcb4" />
          </pattern>
          <radialGradient id={`${ids}-brass`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff6d6" />
            <stop offset="50%" stopColor={PALETTE.gold} />
            <stop offset="100%" stopColor="#8a5a0c" />
          </radialGradient>
          <linearGradient id={`${ids}-frame`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={tint(field.bg, 0.1)} />
            <stop offset="1" stopColor={tint(field.bg, -0.2)} />
          </linearGradient>
        </defs>
        <rect x="0" y="6" width={W} height={H} rx="22" fill="#3a2414" opacity="0.14" />
        <rect x="0" y="0" width={W} height={H} rx="22" fill={`url(#${ids}-frame)`} />
        <rect x="12" y="12" width={W - 24} height={H - 24} rx="14" fill={`url(#${ids}-cork)`} />
        <rect x="12" y="12" width={W - 24} height="6" rx="3" fill="#3a2414" opacity="0.12" />

        {/* Jarvis: the ribbon's right side, outside the fence */}
        {outside && (
          <>
            <clipPath id={`${ids}-clip`}>
              <rect x="12" y="12" width={W - 24} height={H - 24} rx="14" />
            </clipPath>
            <path d={outside} fill={BAD} fillOpacity="0.12" clipPath={`url(#${ids}-clip)`} />
          </>
        )}

        {/* Lighthouse beam */}
        {pv && kind === 'sort' && (
          <g>
            <path
              d={`M ${pv.x} ${pv.y} L ${pv.x + R * Math.cos(beamAngle - 0.05)} ${pv.y - R * Math.sin(beamAngle - 0.05)} L ${pv.x + R * Math.cos(beamAngle + 0.05)} ${pv.y - R * Math.sin(beamAngle + 0.05)} Z`}
              fill={PALETTE.goldLight}
              opacity="0.7"
            />
            <g transform={`translate(${pv.x}, ${pv.y + 30})`}>
              <path d="M-7 14 L-4 -10 H4 L7 14 Z" fill="#fbf9f4" stroke={PALETTE.ink} strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M-5 0 H5 M-6 7 H6" stroke="#cc2e2e" strokeWidth="3" />
              <rect x="-5" y="-16" width="10" height="7" rx="1.5" fill={PALETTE.gold} stroke={PALETTE.ink} strokeWidth="1.2" />
              <path d="M-6 -16 L0 -21 L6 -16 Z" fill="#cc2e2e" />
            </g>
          </g>
        )}

        {/* Graham: tentative feeler during the check */}
        {triplet && kind === 'check' && (
          <g>
            {isJarvis ? (
              <line x1={at(triplet[0]).x} y1={at(triplet[0]).y} x2={at(triplet[2]).x} y2={at(triplet[2]).y} stroke={phase === 'verdict' ? (replaces ? BAD : OK) : '#7a7266'} strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />
            ) : (
              <polyline
                points={triplet.map((p) => `${at(p).x},${at(p).y}`).join(' ')}
                fill="none"
                stroke={phase === 'verdict' ? (turn === 'ccw' ? OK : BAD) : '#7a7266'}
                strokeWidth="3"
                strokeDasharray="7 5"
              />
            )}
            {phase === 'verdict' && !isJarvis && (
              <g transform={`translate(${at(triplet[1]).x}, ${at(triplet[1]).y - 30})`}>
                <g className="animate-story-pop">
                  <rect x="-48" y="-14" width="96" height="26" rx="13" fill={turn === 'ccw' ? OK : BAD} />
                  <text textAnchor="middle" y="4.5" fontSize="13" fontWeight="900" fill="#ffffff" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                    {turn === 'ccw' ? '↺ bends left' : '↻ dent!'}
                  </text>
                </g>
              </g>
            )}
            {phase === 'verdict' && isJarvis && (
              <g transform={`translate(${at(triplet[2]).x}, ${at(triplet[2]).y - 32})`}>
                <g className="animate-story-pop">
                  <rect x="-64" y="-14" width="128" height="26" rx="13" fill={replaces ? BAD : OK} />
                  <text textAnchor="middle" y="4.5" fontSize="13" fontWeight="900" fill="#ffffff" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                    {turn === 'collinear' ? (replaces ? 'same line, further' : 'same line, closer') : replaces ? 'right side: swing!' : 'left side ✓'}
                  </text>
                </g>
              </g>
            )}
          </g>
        )}

        {/* Rubber band / ribbon */}
        {bandPoints.length > 1 && (
          <>
            <path d={bandD} fill={isFinal ? (isJarvis ? RIBBON : BAND) : 'none'} fillOpacity={isFinal ? 0.14 : 0} stroke="#3a2414" strokeOpacity="0.16" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" transform="translate(2,4)" />
            <path d={bandD} fill="none" stroke={isJarvis ? RIBBON : BAND} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
            <path d={bandD} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" transform="translate(-1,-1.5)" />
          </>
        )}

        {/* Jarvis: the swinging ribbon hand */}
        {searching && anchor && (
          <g>
            <line x1={at(anchor).x} y1={at(anchor).y} x2={handX} y2={handY} stroke={RIBBON} strokeWidth="4" strokeDasharray="10 6" strokeLinecap="round" />
            <circle cx={handX} cy={handY} r="15" fill="none" stroke={RIBBON} strokeWidth="2.5" />
          </g>
        )}

        {/* Snapping peg */}
        {popping && (
          <g transform={`translate(${at(popping).x + 30}, ${at(popping).y - 18})`}>
            <g className="animate-story-pop">
              <rect x="-26" y="-13" width="52" height="26" rx="13" fill={BAD} />
              <text textAnchor="middle" y="5" fontSize="14" fontWeight="900" fill="#ffffff" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                snap!
              </text>
            </g>
          </g>
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
              <ellipse cx={c.x + 4} cy={c.y + 5} rx="10" ry="6" fill="#3a2414" opacity="0.22" />
              <circle cx={c.x} cy={c.y} r={hooked ? 11 : 9} fill={`url(#${ids}-brass)`} stroke={hooked ? (isJarvis ? RIBBON : BAND) : '#8a5a0c'} strokeWidth={hooked ? 3.5 : 1.2} />
              <circle cx={c.x - 3} cy={c.y - 3} r="2.4" fill="#ffffff" opacity="0.75" />
              <text x={c.x} y={c.y + 27} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={PALETTE.ink} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                {lbl(p)}
              </text>
              {isPivot && (
                <g transform={`translate(${c.x}, ${c.y - 16})`}>
                  <path d="M0 6 C-8 -4 -8 -14 0 -14 C8 -14 8 -4 0 6 Z" fill="#cc2e2e" stroke={tint('#cc2e2e', -0.35)} strokeWidth="1.2" />
                  <circle cy="-8" r="2.8" fill="#ffffff" />
                </g>
              )}
              {ord !== undefined && ord > 0 && lit && (kind === 'sort' || kind === 'seed' || kind === 'check' || kind === 'push' || kind === 'pop') && (
                <g className={kind === 'sort' ? 'animate-story-pop' : undefined}>
                  <circle cx={c.x + 16} cy={c.y - 14} r="10" fill={PALETTE.ink} />
                  <text x={c.x + 16} y={c.y - 10} textAnchor="middle" fontSize="11" fontWeight="900" fill="#f3efe6" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                    {ord}
                  </text>
                </g>
              )}
              {isJarvis && kind === 'check' && triplet?.[2]?.id === p.id && (
                <circle cx={c.x} cy={c.y} r="17" fill="none" stroke="#7a7266" strokeWidth="2.5" strokeDasharray="4 3" />
              )}
              {current?.id === p.id && !isFinal && (kind === 'push' || kind === 'check' || kind === 'pop') && !isJarvis && (
                <circle cx={c.x} cy={c.y} r="17" fill="none" stroke={PALETTE.gold} strokeWidth="3" className="animate-story-ripple" />
              )}
            </g>
          );
        })}
      </svg>
    </StoryStage>
  );
};
