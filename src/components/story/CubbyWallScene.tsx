import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases, useProgress } from './useAnimPhases';
import { PALETTE } from './kit/materials';

/** A small leather backpack for the column headers; `s` scales it. */
const Pack: React.FC<{ x: number; y: number; s: number; on?: boolean }> = ({ x, y, s, on }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M-5 -9 Q0 -14 5 -9" fill="none" stroke="#6e4426" strokeWidth="2" />
    <rect x="-9" y="-9" width="18" height="18" rx="5" fill={on ? '#c98a52' : '#b07a4a'} />
    <rect x="-9" y="-9" width="18" height="7" rx="4" fill="#8e5a33" />
    <rect x="-5.5" y="1.5" width="11" height="6" rx="2" fill="#9a6538" />
    <circle cx="0" cy="-2" r="1.3" fill={PALETTE.goldLight} />
  </g>
);

/**
 * 🧀 0-1 Knapsack as a wall of cubbies, reusing the cheese-and-backpack world of
 * Fractional Knapsack (but here cheeses can never be cut).
 *
 * Each cubby (row = first i cheeses, column = backpack size w) holds a pile of coins:
 * the best value for that small problem. To fill a cubby, two earlier cubbies are lifted
 * onto a balance scale (skip the cheese vs take it), the heavier side wins, and its
 * coins fly into the new cubby. At the end a flashlight walks back to find the cheeses.
 */

type Item = { id: number; weight: number; value: number };

const COIN = PALETTE.gold;
const COIN_EDGE = '#9a6416';
const WOOD = '#f1e4cc';
const WOOD_EDGE = '#d8c4a0';
const SKIP = '#2457c5';
const TAKE = '#c4501a';

/** A small yellow cheese wheel; diameter grows with weight. */
const Cheese: React.FC<{ size: number; x?: number; y?: number }> = ({ size, x = 0, y = 0 }) => {
  const rx = size / 2;
  const ry = size * 0.3;
  const h = size * 0.32;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy={h / 2 + ry * 0.5} rx={rx} ry={ry * 0.6} fill="#3a2414" opacity="0.16" />
      <ellipse cx="0" cy={h / 2} rx={rx} ry={ry} fill="#c27a12" />
      <rect x={-rx} y={-h / 2} width={size} height={h} fill="#e8a817" />
      <rect x={rx * 0.3} y={-h / 2} width={rx * 0.7} height={h} fill="#c98a12" opacity="0.6" />
      <ellipse cx="0" cy={-h / 2} rx={rx} ry={ry} fill="#fde68a" stroke="#d99a1e" strokeWidth="1" />
      <ellipse cx={-rx * 0.35} cy={-h / 2} rx={rx * 0.16} ry={ry * 0.3} fill="#f0c94a" />
      <ellipse cx={rx * 0.3} cy={-h / 2 + ry * 0.2} rx={rx * 0.2} ry={ry * 0.32} fill="#f0c94a" />
      <ellipse cx={-rx * 0.45} cy={-h / 2 - ry * 0.35} rx={rx * 0.25} ry={ry * 0.18} fill="#ffffff" opacity="0.5" />
    </g>
  );
};

/** A pile of gold coins whose height grows with the value; the number sits on top. */
const Coins: React.FC<{ value: number; maxValue: number; x: number; y: number; w: number; showZero?: boolean }> = ({
  value,
  maxValue,
  x,
  y,
  w,
  showZero,
}) => {
  if (value <= 0) {
    return showZero ? (
      <text x={x} y={y - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#8a8273">
        empty
      </text>
    ) : null;
  }
  const count = Math.max(1, Math.round((value / Math.max(1, maxValue)) * 6));
  const cw = Math.min(26, w * 0.6);
  return (
    <g>
      {Array.from({ length: count }, (_, k) => (
        <g key={k}>
          <ellipse cx={x} cy={y - 2.6 - k * 4.2} rx={cw / 2} ry="3.6" fill={COIN_EDGE} />
          <ellipse cx={x} cy={y - 4 - k * 4.2} rx={cw / 2} ry="3.6" fill={COIN} />
          <ellipse cx={x - cw * 0.15} cy={y - 5 - k * 4.2} rx={cw * 0.18} ry="1" fill="#fff6d6" opacity="0.8" />
        </g>
      ))}
      <text x={x} y={y - 10 - count * 4.2} textAnchor="middle" fontSize="12" fontWeight="900" fill={PALETTE.ink} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
        ${value}
      </text>
    </g>
  );
};

export const CubbyWallScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const st: any = step.state || {};
  const items: Item[] = st.items || [];
  const W: number = st.capacity || 1;
  const n = items.length;
  const dp: number[][] = st.dpTable || [];
  const r: number = st.currentRow ?? 0;
  const c: number = st.currentCol ?? 0;
  const back = !!st.backtrackPhase;
  const title: string = step.title || '';
  const item = items[r - 1];
  const selected: number[] = st.selectedItems || [];

  const kind = step.isFinal
    ? 'final'
    : back
    ? /INCLUDED/.test(title) && !/NOT/.test(title)
      ? 'took'
      : /NOT Included/.test(title)
      ? 'skipped'
      : 'trace-start'
    : /Exceeds/.test(title)
    ? 'too-heavy'
    : /^Evaluate/.test(title)
    ? 'choose'
    : 'intro';

  const phases: readonly (readonly [string, number])[] =
    kind === 'choose'
      ? [['lookup', 0], ['weigh', 0.3], ['fill', 0.62]]
      : kind === 'too-heavy'
      ? [['lookup', 0], ['fill', 0.5]]
      : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);
  const fly = useProgress(phase === 'fill', stepMs * 0.28, `fly-${step.stepIndex}`);

  const skipVal = r > 0 ? dp[r - 1]?.[c] ?? 0 : 0;
  const leftover = item ? c - item.weight : -1;
  const takeVal = item && leftover >= 0 ? item.value + (dp[r - 1]?.[leftover] ?? 0) : -1;
  const takeWins = kind === 'choose' && takeVal > skipVal;

  // ── Which cubbies already hold coins ──
  const filled = (rr: number, cc: number) => {
    if (rr === 0 || cc === 0) return true;
    if (back || step.isFinal) return true;
    if (rr < r) return true;
    if (rr === r && cc < c) return true;
    if (rr === r && cc === c) return phase === 'fill' && fly >= 1;
    return false;
  };
  const maxValue = Math.max(1, ...dp.flat());

  // ── Geometry ──
  const S = Math.max(34, Math.min(60, Math.floor(600 / (W + 1))));
  const X0 = 92;
  const Y0 = 70;
  const gridW = X0 + (W + 1) * S + 10;
  const gridH = Y0 + (n + 1) * S + 12;
  const cellCx = (cc: number) => X0 + cc * S + S / 2;
  const cellBottom = (rr: number) => Y0 + rr * S + S - 6;
  const maxWeight = Math.max(1, ...items.map((it) => it.weight));
  const cheeseSize = (it: Item) => 18 + (it.weight / maxWeight) * 26;

  const pathCells: { r: number; c: number }[] = st.backtrackPath || [];
  const onPath = (rr: number, cc: number) => back && pathCells.some((p) => p.r === rr && p.c === cc);

  const winnerSource = kind === 'too-heavy' || !takeWins ? { r: r - 1, c } : { r: r - 1, c: leftover };
  const flyFrom = { x: cellCx(winnerSource.c), y: cellBottom(winnerSource.r) - 10 };
  const flyTo = { x: cellCx(c), y: cellBottom(r) - 10 };
  const coinAt = { x: flyFrom.x + (flyTo.x - flyFrom.x) * fly, y: flyFrom.y + (flyTo.y - flyFrom.y) * fly - Math.sin(Math.PI * fly) * 40 };

  // ── Narration ──
  const narration = (() => {
    switch (kind) {
      case 'intro':
        return 'Each cubby answers one small question: “Using only the first few cheeses and a backpack this big, what’s the most I can carry?” The top row and left column stay empty: no cheese or no room means nothing to carry.';
      case 'too-heavy':
        return phase === 'lookup'
          ? `Cheese ${r} is too heavy for a size-${c} backpack, and in 0-1 knapsack we’re not allowed to cut it.`
          : 'So this cubby just copies the cubby above it: the best we could do without that cheese.';
      case 'choose':
        if (phase === 'lookup')
          return `Cheese ${r} fits in a size-${c} backpack. Two choices: skip it (the cubby above), or take it (the cheese plus the best for the ${leftover} kg of room left over).`;
        if (phase === 'weigh') return `Put both choices on the scale: skipping gives $${skipVal}, taking gives $${takeVal}.`;
        return takeWins ? `Taking cheese ${r} wins! Its coins go into the new cubby.` : `Skipping cheese ${r} is at least as good, so we keep the coins from above.`;
      case 'trace-start':
        return `The wall is full! The bottom-right cubby holds the best answer: $${dp[n]?.[W] ?? 0}. Now a flashlight walks back up to find out which cheeses made it.`;
      case 'took':
        return `This cubby has more coins than the one above it, so cheese ${r} must be in the backpack! Pop it in and move left by its weight.`;
      case 'skipped':
        return `Same coins as the cubby above, so cheese ${r} wasn’t needed. Move straight up.`;
      case 'final': {
        const chosen = selected.map((id) => items[id - 1]).filter(Boolean);
        const weight = chosen.reduce((a, it) => a + it.weight, 0);
        return `The backpack holds cheese${chosen.length === 1 ? '' : 's'} ${selected.join(', ')}: ${weight} of ${W} kg used, worth $${st.maxValue ?? dp[n]?.[W] ?? 0}. No cheese had to be cut.`;
      }
      default:
        return step.title;
    }
  })();

  const packed = items.filter((it) => selected.includes(it.id));
  const status = step.isFinal ? `Backpack packed • Total Value: $${st.maxValue ?? 0}` : back ? 'Tracing back the choices' : `Cubbies filled • row ${r} of ${n}`;

  const beamTilt = phase === 'weigh' || phase === 'fill' ? (takeVal > skipVal ? 12 : takeVal < skipVal ? -12 : 0) : 0;

  return (
    <StoryStage
      title="The Cubby Wall"
      subtitle="0-1 Knapsack: cheeses can’t be cut. Take the whole wheel or leave it."
      narration={narration}
      status={status}
    >
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* ── Cubby wall ── */}
        <svg viewBox={`0 0 ${gridW} ${gridH}`} className="block mx-auto w-full lg:flex-1 h-auto overflow-visible" style={{ maxWidth: gridW * 1.15 }} role="img" aria-label="Cubby wall">
          {/* Column headers: backpacks growing in size */}
          {Array.from({ length: W + 1 }, (_, cc) => (
            <g key={`col-${cc}`}>
              <Pack x={cellCx(cc)} y={Y0 - 30} s={0.6 + (cc / Math.max(1, W)) * 0.55} on={cc === c && !back} />
              <text x={cellCx(cc)} y={Y0 - 6} textAnchor="middle" fontSize="11" fontWeight="800" fill={cc === c && !back ? TAKE : '#6b645a'}>
                {cc} kg
              </text>
            </g>
          ))}

          {/* Row headers: the cheese added in that row */}
          {Array.from({ length: n + 1 }, (_, rr) => (
            <g key={`row-${rr}`}>
              {rr === 0 ? (
                <text x={X0 - 46} y={Y0 + S / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#6b645a">
                  no cheese
                </text>
              ) : (
                <g>
                  <Cheese size={cheeseSize(items[rr - 1]) * 0.8} x={X0 - 60} y={Y0 + rr * S + S / 2 - 2} />
                  <text x={X0 - 22} y={Y0 + rr * S + S / 2 - 3} textAnchor="middle" fontSize="11" fontWeight="900" fill={rr === r ? TAKE : '#3a3732'}>
                    #{rr}
                  </text>
                  <text x={X0 - 22} y={Y0 + rr * S + S / 2 + 11} textAnchor="middle" fontSize="10" fontWeight="600" fill="#6b645a">
                    {items[rr - 1].weight}kg ${items[rr - 1].value}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Cubbies */}
          {Array.from({ length: n + 1 }, (_, rr) =>
            Array.from({ length: W + 1 }, (_, cc) => {
              const isCurrent = rr === r && cc === c && kind !== 'intro' && kind !== 'final';
              const isSkipSrc = !back && (phase === 'lookup' || phase === 'weigh') && r > 0 && rr === r - 1 && cc === c;
              const isTakeSrc = kind === 'choose' && (phase === 'lookup' || phase === 'weigh') && rr === r - 1 && cc === leftover;
              const stroke = isCurrent ? PALETTE.gold : isTakeSrc ? TAKE : isSkipSrc ? SKIP : onPath(rr, cc) ? '#8b3fb0' : WOOD_EDGE;
              return (
                <g key={`cell-${rr}-${cc}`}>
                  <rect x={X0 + cc * S + 2} y={Y0 + rr * S + 2} width={S - 4} height={S - 4} rx="9" fill="#c9ab7c" />
                  <rect
                    x={X0 + cc * S + 2}
                    y={Y0 + rr * S + 2}
                    width={S - 4}
                    height={S - 7}
                    rx="9"
                    fill={onPath(rr, cc) ? '#efe2f5' : rr === 0 || cc === 0 ? '#f6efe2' : WOOD}
                    stroke={stroke}
                    strokeWidth={stroke === WOOD_EDGE ? 1 : 3.5}
                  />
                  <rect x={X0 + cc * S + 6} y={Y0 + rr * S + 5} width={S - 12} height="3" rx="1.5" fill="#3a2414" opacity="0.08" />
                  {filled(rr, cc) && <Coins value={dp[rr]?.[cc] ?? 0} maxValue={maxValue} x={cellCx(cc)} y={cellBottom(rr)} w={S} />}
                  {isSkipSrc && (
                    <text x={X0 + cc * S + 8} y={Y0 + rr * S + 16} fontSize="11" fontWeight="900" fill={SKIP}>
                      skip
                    </text>
                  )}
                  {isTakeSrc && (
                    <text x={X0 + cc * S + 8} y={Y0 + rr * S + 16} fontSize="11" fontWeight="900" fill={TAKE}>
                      take
                    </text>
                  )}
                  {isCurrent && back && (
                    <g transform={`translate(${X0 + cc * S + S - 6}, ${Y0 + rr * S - 4}) rotate(35)`}>
                      <g className="animate-story-bob">
                        <path d="M5 -3 L22 -12 L22 12 L5 3 Z" fill={PALETTE.goldLight} opacity="0.7" />
                        <rect x="-10" y="-4" width="16" height="8" rx="3" fill="#3f78b5" />
                        <rect x="4" y="-5" width="4" height="10" rx="1.5" fill="#9aa8b4" />
                      </g>
                    </g>
                  )}
                  {isCurrent && kind === 'too-heavy' && phase === 'lookup' && (
                    <g className="animate-story-shake">
                      <Cheese size={Math.min(S * 0.75, cheeseSize(item!))} x={cellCx(cc)} y={Y0 + rr * S + S / 2} />
                      <g transform={`translate(${cellCx(cc) + S * 0.3}, ${Y0 + rr * S + 13})`}>
                        <circle r="8" fill="#cc2e2e" />
                        <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                      </g>
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* Coins flying from the winning cubby into the new one */}
          {phase === 'fill' && fly < 1 && (
            <g>
              {[0, 1, 2].map((k) => (
                <ellipse key={k} cx={coinAt.x} cy={coinAt.y - k * 4} rx="10" ry="3.6" fill={COIN} stroke={COIN_EDGE} strokeWidth="1.2" />
              ))}
              {takeWins && <Cheese size={20} x={coinAt.x + 16} y={coinAt.y - 8} />}
            </g>
          )}
        </svg>

        {/* ── Side panel: balance scale and the backpack ── */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-64 shrink-0 items-center justify-center">
          {kind === 'choose' && (
            <svg viewBox="0 0 220 150" className="w-56 h-auto overflow-visible" aria-label="Balance scale">
              <ellipse cx="110" cy="144" rx="46" ry="5" fill="#3a2414" opacity="0.15" />
              <rect x="104" y="40" width="12" height="96" rx="4" fill="#8a5a35" />
              <rect x="106" y="40" width="3" height="96" fill="#b07a4a" />
              <rect x="70" y="132" width="80" height="11" rx="5.5" fill="#6e4426" />
              <circle cx="110" cy="40" r="7" fill={PALETTE.gold} stroke="#9a6416" strokeWidth="1.5" />
              <g style={{ transform: `rotate(${-beamTilt}deg)`, transformOrigin: '110px 40px', transition: 'transform 0.8s var(--ease-move)' }}>
                <rect x="20" y="36" width="180" height="8" rx="4" fill="#c98a12" />
                <rect x="20" y="36" width="180" height="3" rx="1.5" fill="#fde68a" opacity="0.7" />
                {/* skip pan (left) */}
                <path d="M40 40 L16 78 M40 40 L64 78" stroke="#6e4426" strokeWidth="1.3" />
                <path d="M 12 78 Q 40 98 68 78 Z" fill={PALETTE.gold} stroke="#9a6416" strokeWidth="1.2" />
                {phase !== 'lookup' && <Coins value={skipVal} maxValue={maxValue} x={40} y={80} w={46} showZero />}
                <text x="40" y="112" textAnchor="middle" fontSize="12" fontWeight="900" fill={SKIP} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                  skip it
                </text>
                {/* take pan (right) */}
                <path d="M180 40 L156 78 M180 40 L204 78" stroke="#6e4426" strokeWidth="1.3" />
                <path d="M 152 78 Q 180 98 208 78 Z" fill={PALETTE.gold} stroke="#9a6416" strokeWidth="1.2" />
                {phase !== 'lookup' && <Coins value={takeVal} maxValue={maxValue} x={180} y={80} w={46} />}
                <text x="180" y="112" textAnchor="middle" fontSize="12" fontWeight="900" fill={TAKE} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                  take it
                </text>
              </g>
            </svg>
          )}

          {/* Backpack (fixed size) that collects cheeses during the trace-back */}
          <div className="relative w-56 h-44 shrink-0" aria-label="Backpack">
            <svg viewBox="0 0 220 176" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="cubbyLeather" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#d49a64" />
                  <stop offset="1" stopColor="#a96b3c" />
                </linearGradient>
              </defs>
              <ellipse cx="110" cy="172" rx="78" ry="6" fill="#3a2414" opacity="0.15" />
              <path d="M 80 34 Q 110 4 140 34" fill="none" stroke="#6e4426" strokeWidth="7" strokeLinecap="round" />
              <rect x="30" y="34" width="160" height="134" rx="28" fill="url(#cubbyLeather)" />
              <rect x="38" y="42" width="144" height="118" rx="22" fill="none" stroke="#f1d2ad" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="4 4" />
              <rect x="56" y="104" width="108" height="50" rx="14" fill="#a96b3c" />
              <rect x="56" y="104" width="108" height="50" rx="14" fill="none" stroke="#f1d2ad" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="3 4" />
              {packed.map((it, k) => (
                <g key={`packed-${it.id}`} className="animate-bag-settle">
                  <Cheese size={cheeseSize(it)} x={70 + (k % 3) * 40} y={86 - Math.floor(k / 3) * 22} />
                </g>
              ))}
            </svg>
            {step.isFinal && (
              <div className="absolute left-[30px] right-[30px] top-[34px] h-14 rounded-t-[28px] bg-[#8e5a33] animate-lid-close flex items-end justify-center gap-10 pb-1" style={{ boxShadow: 'inset 0 -4px 0 rgb(0 0 0 / 0.15)' }}>
                <span className="w-3.5 h-4 rounded bg-[#e8a817]" />
                <span className="w-3.5 h-4 rounded bg-[#e8a817]" />
              </div>
            )}
            <p className="text-center text-sm font-bold text-stone-700 -mt-1">
              {packed.length ? `${packed.reduce((a, it) => a + it.weight, 0)} of ${W} kg packed` : `Holds up to ${W} kg`}
            </p>
          </div>
        </div>
      </div>
    </StoryStage>
  );
};
