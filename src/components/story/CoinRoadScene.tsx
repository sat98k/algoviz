import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';

/**
 * 🪙 Maximum Subarray as a road of coins and thieves.
 *
 * Positive numbers are coin tiles, negative numbers are thieves who take coins. We want
 * the stretch of road where a walker ends up richest. Divide & conquer: a ribbon cuts the
 * road in half; the best stretch is in the left half, the right half, or crosses the
 * cut. For the crossing case two lanterns walk outward from the cut filling a basket,
 * and a flag marks where each side was richest. The three candidates then stand on a
 * podium and the richest wins.
 */

const TILE = 64;
const GAP = 8;
const PAD = 24;
const ROAD_Y = 96;

export const CoinRoadScene: React.FC<StorySceneProps> = ({ step }) => {
  const st: any = step.state || {};
  const arr: number[] = st.array || [];
  const n = arr.length;
  const title: string = step.title || '';
  // While scanning across the cut, keep the whole stretch being scanned lit.
  const range: [number, number] | undefined = st.crossScan ? [st.crossScan.low, st.crossScan.high] : st.activeRange;
  const scan = st.crossScan as
    | {
        low: number;
        mid: number;
        high: number;
        side: string;
        index?: number;
        leftSums: { index: number; sum: number }[];
        rightSums: { index: number; sum: number }[];
        bestLeft?: { sum: number; index: number };
        bestRight?: { sum: number; index: number };
        improved?: boolean;
      }
    | undefined;
  const mid: number | undefined = scan?.mid ?? st.currentMid;
  const optimal: [number, number] | undefined = st.optimalRange;

  const kind = (() => {
    if (step.isFinal) return 'final';
    if (/^Base Case/.test(title)) return 'base';
    if (/^Split/.test(title)) return 'split';
    if (/^Crossing Case/.test(title)) return 'cross-start';
    if (/^Left Scan|^Right Scan/.test(title)) return 'scan';
    if (/^CrossSum/.test(title)) return 'cross-sum';
    if (/^Combine/.test(title)) return 'combine';
    return 'intro';
  })();

  const x = (i: number) => PAD + i * (TILE + GAP);
  const width = PAD * 2 + n * (TILE + GAP) - GAP;
  const height = ROAD_Y + TILE + 96;
  const inRange = (i: number) => !range || (i >= range[0] && i <= range[1]);
  const sumOf = (a: number, b: number) => arr.slice(a, b + 1).reduce((s, v) => s + v, 0);
  const rangeText = (r?: [number, number]) => (r ? (r[0] === r[1] ? `tile ${r[0] + 1}` : `tiles ${r[0] + 1}–${r[1] + 1}`) : '');

  const finalSum = optimal ? sumOf(optimal[0], optimal[1]) : 0;
  const lanternAt = kind === 'scan' && scan?.index !== undefined ? scan.index : undefined;
  const basket =
    kind === 'scan' && scan
      ? scan.side === 'left'
        ? scan.leftSums[scan.leftSums.length - 1]?.sum
        : scan.rightSums[scan.rightSums.length - 1]?.sum
      : undefined;

  const narration = (() => {
    switch (kind) {
      case 'intro':
        return 'Coins (+) and thieves (−) line the road. Which unbroken stretch of road leaves a walker richest? Divide and conquer: cut the road in half again and again.';
      case 'base':
        return `A road of just one tile: its best stretch is the tile itself (${arr[range?.[0] ?? 0]}).`;
      case 'split':
        return `Cut ${rangeText(range)} in the middle. The best stretch is either all on the left, all on the right, or it crosses the cut.`;
      case 'cross-start':
        return 'Now the crossing case: two lanterns start at the cut and walk outward, carrying a basket of coins.';
      case 'scan': {
        if (!scan) return step.title;
        const side = scan.side === 'left' ? 'left' : 'right';
        return scan.improved
          ? `The ${side} lantern reaches tile ${(scan.index ?? 0) + 1}: the basket holds ${basket}, the richest so far on this side. Plant a flag here!`
          : `The ${side} lantern reaches tile ${(scan.index ?? 0) + 1}: the basket holds ${basket}, not richer than the flag.`;
      }
      case 'cross-sum':
        return `Join the two flags: the best crossing stretch is worth ${st.crossSum}.`;
      case 'combine': {
        const w = st.winner === 'LSum' ? 'the left half' : st.winner === 'RSum' ? 'the right half' : 'the crossing stretch';
        return `Podium time: left ${st.lSum}, right ${st.rSum}, crossing ${st.crossSum}. The winner is ${w}.`;
      }
      case 'final':
        return `The richest stretch is ${rangeText(optimal)}, worth ${finalSum} coins. No other unbroken stretch earns more.`;
      default:
        return step.title;
    }
  })();

  const podium = kind === 'combine' && st.lSum !== undefined;

  return (
    <StoryStage
      emoji="🪙"
      title="The Coin Road"
      subtitle="Coin tiles add, thief tiles take away. Find the richest unbroken stretch."
      narration={narration}
      status={kind === 'final' ? `Richest stretch • ${finalSum}` : range ? `Looking at • ${rangeText(range)}` : 'Ready'}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.3 }} role="img" aria-label="Coin road">
        <rect x={PAD - 12} y={ROAD_Y - 12} width={width - 2 * PAD + 24} height={TILE + 24} rx="14" fill="#d6c3a5" />

        {/* final / combine highlights */}
        {optimal && (kind === 'final' || kind === 'combine') && (
          <rect x={x(optimal[0]) - 6} y={ROAD_Y - 8} width={x(optimal[1]) - x(optimal[0]) + TILE + 12} height={TILE + 16} rx="12" fill="#fde047" opacity="0.8" className="animate-story-pop" />
        )}
        {kind === 'cross-sum' && st.crossLeftRange && st.crossRightRange && (
          <rect
            x={x(st.crossLeftRange[0]) - 6}
            y={ROAD_Y - 8}
            width={x(st.crossRightRange[1]) - x(st.crossLeftRange[0]) + TILE + 12}
            height={TILE + 16}
            rx="12"
            fill="#bae6fd"
            className="animate-story-pop"
          />
        )}

        {arr.map((v, i) => {
          const active = inRange(i);
          const lit = lanternAt === i;
          return (
            <g key={i} opacity={active ? 1 : 0.3} style={{ transition: 'opacity 0.5s' }}>
              <rect x={x(i)} y={ROAD_Y} width={TILE} height={TILE} rx="10" fill={v >= 0 ? '#fef9c3' : '#fee2e2'} stroke={lit ? '#f59e0b' : v >= 0 ? '#ca8a04' : '#dc2626'} strokeWidth={lit ? 4 : 2} />
              <text x={x(i) + TILE / 2} y={ROAD_Y + 28} textAnchor="middle" fontSize="22">
                {v >= 0 ? '🪙' : '🦹'}
              </text>
              <text x={x(i) + TILE / 2} y={ROAD_Y + 54} textAnchor="middle" fontSize="15" fontWeight="900" fill={v >= 0 ? '#713f12' : '#991b1b'}>
                {v > 0 ? `+${v}` : v}
              </text>
              <text x={x(i) + TILE / 2} y={ROAD_Y + TILE + 18} textAnchor="middle" fontSize="10" fill="#78716c">
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* the cut ribbon */}
        {mid !== undefined && kind !== 'final' && kind !== 'base' && kind !== 'intro' && (
          <g>
            <line x1={x(mid) + TILE + GAP / 2} y1={ROAD_Y - 30} x2={x(mid) + TILE + GAP / 2} y2={ROAD_Y + TILE + 26} stroke="#dc2626" strokeWidth="4" strokeDasharray="8 5" />
            <text x={x(mid) + TILE + GAP / 2} y={ROAD_Y - 36} textAnchor="middle" fontSize="18">
              ✂️
            </text>
          </g>
        )}

        {/* flags at the best left / right reach */}
        {scan?.bestLeft && kind !== 'final' && (
          <text x={x(scan.bestLeft.index) + 6} y={ROAD_Y - 8} fontSize="20">
            🚩
          </text>
        )}
        {scan?.bestRight && kind !== 'final' && (
          <text x={x(scan.bestRight.index) + TILE - 26} y={ROAD_Y - 8} fontSize="20">
            🚩
          </text>
        )}

        {/* lantern + basket */}
        {lanternAt !== undefined && (
          <g style={{ transform: `translate(${x(lanternAt) + TILE / 2}px, ${ROAD_Y + TILE + 44}px)`, transition: 'transform 0.6s ease-in-out' }}>
            <text textAnchor="middle" fontSize="24" y="0">
              🏮
            </text>
            <rect x="-30" y="8" width="60" height="22" rx="8" fill="#fffbeb" stroke="#d97706" />
            <text textAnchor="middle" y="24" fontSize="12" fontWeight="800" fill="#78350f">
              🧺 {basket}
            </text>
          </g>
        )}
      </svg>

      {podium && (
        <div className="mt-2 flex items-end justify-center gap-3 font-sans">
          {(
            [
              ['LSum', 'Left half', st.lSum],
              ['CrossSum', 'Crossing', st.crossSum],
              ['RSum', 'Right half', st.rSum],
            ] as const
          ).map(([key, name, val]) => {
            const win = st.winner === key;
            return (
              <div key={key} className={`flex flex-col items-center ${win ? 'animate-story-pop' : ''}`}>
                <span className="text-xl">{win ? '🏆' : ' '}</span>
                <div
                  className={`w-24 flex flex-col items-center justify-end rounded-t-lg border-2 ${win ? 'h-24 bg-amber-200 border-amber-500' : 'h-16 bg-stone-100 border-stone-300'}`}
                >
                  <span className="text-lg font-black text-stone-900">{val}</span>
                  <span className="text-[11px] font-semibold text-stone-600 pb-1">{name}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StoryStage>
  );
};
