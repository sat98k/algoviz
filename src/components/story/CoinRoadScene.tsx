import React, { useState } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { MaxSubarrayTreeView } from './MaxSubarrayTreeView';

/**
 * 🪙 Maximum Subarray as a road of coins and thieves.
 *
 * Positive numbers are coin tiles, negative numbers are thieves who take coins. We want
 * the stretch of road where a walker ends up richest. Divide & conquer: a ribbon cuts the
 * road in half; the best stretch is in the left half, the right half, or crosses the
 * cut. For the crossing case two lanterns walk outward from the cut filling a basket,
 * and a flag marks where each side was richest. The three candidates then stand on a
 * podium and the richest wins.
 *
 * An optional 🌳 split & merge tree view (toggle above the road) shows the same steps as the
 * recursion tree: pieces splitting on the way down and answers merging on the way up.
 */

const VIEW_KEY = 'algoviz.maxSubarray.storyView';
const readView = (): 'road' | 'tree' => {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'tree' ? 'tree' : 'road';
  } catch {
    return 'road';
  }
};

const TILE = 64;
const GAP = 8;
const PAD = 24;
const ROAD_Y = 96;

export const CoinRoadScene: React.FC<StorySceneProps> = ({ step }) => {
  const [view, setView] = useState<'road' | 'tree'>(() => (typeof window === 'undefined' ? 'road' : readView()));
  const choose = (v: 'road' | 'tree') => {
    setView(v);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {
      // Remembering the view is only a convenience.
    }
  };
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
    if (/^Recursive Call/.test(title)) return 'call';
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
      case 'call': {
        const half = /Left Half/.test(title) ? 'left' : 'right';
        return `Now solve the ${half} piece, ${rangeText(range)}, on its own first, as if it were the whole road.`;
      }
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
      title="The Coin Road"
      subtitle="Coin tiles add, thief tiles take away. Find the richest unbroken stretch."
      narration={narration}
      status={kind === 'final' ? `Richest stretch • ${finalSum}` : range ? `Looking at • ${rangeText(range)}` : 'Ready'}
    >
      <div className="flex justify-center mb-3">
        <div className="c-group" role="radiogroup" aria-label="Picture">
          {(
            [
              ['road', 'Coin road'],
              ['tree', 'Split & merge tree'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              data-road-view={v}
              onClick={() => choose(v)}
              className="c-pill"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'tree' ? (
        <MaxSubarrayTreeView arr={arr} nodes={st.treeNodes || []} activeId={st.activeNodeId} scan={scan as any} isFinal={!!step.isFinal} stepKey={step.stepIndex} />
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.3 }} role="img" aria-label="Coin road">
          <defs>
            <radialGradient id="coinRoadGold" cx="0.36" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#fff6d6" />
              <stop offset="0.5" stopColor="#f0c94a" />
              <stop offset="1" stopColor="#c48a12" />
            </radialGradient>
          </defs>
          <rect x={PAD - 12} y={ROAD_Y - 6} width={width - 2 * PAD + 24} height={TILE + 24} rx="18" fill="#3a2414" opacity="0.1" />
          <rect x={PAD - 12} y={ROAD_Y - 12} width={width - 2 * PAD + 24} height={TILE + 24} rx="18" fill="#57514a" />
          <line x1={PAD - 4} y1={ROAD_Y - 6} x2={width - PAD + 4} y2={ROAD_Y - 6} stroke="#f4ead2" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="8 8" />

          {/* final / combine highlights */}
          {optimal && (kind === 'final' || kind === 'combine') && (
            <rect x={x(optimal[0]) - 6} y={ROAD_Y - 8} width={x(optimal[1]) - x(optimal[0]) + TILE + 12} height={TILE + 16} rx="12" fill="#f2c21a" opacity="0.95" className="animate-story-pop" />
          )}
          {kind === 'cross-sum' && st.crossLeftRange && st.crossRightRange && (
            <rect
              x={x(st.crossLeftRange[0]) - 6}
              y={ROAD_Y - 8}
              width={x(st.crossRightRange[1]) - x(st.crossLeftRange[0]) + TILE + 12}
              height={TILE + 16}
              rx="12"
              fill="#9cc2f0"
              className="animate-story-pop"
            />
          )}

          {arr.map((v, i) => {
            const active = inRange(i);
            const lit = lanternAt === i;
            return (
              <g key={i} opacity={active ? 1 : 0.3} style={{ transition: 'opacity 0.5s' }}>
                <rect x={x(i)} y={ROAD_Y + 4} width={TILE} height={TILE} rx="12" fill={v >= 0 ? '#c9a77a' : '#9c3a32'} />
                <rect x={x(i)} y={ROAD_Y} width={TILE} height={TILE} rx="12" fill={v >= 0 ? '#fbf3e3' : '#f7d6d1'} stroke={lit ? '#e8a817' : 'none'} strokeWidth={lit ? 4 : 0} />
                {v >= 0 ? (
                  <g transform={`translate(${x(i) + TILE / 2}, ${ROAD_Y + 20})`}>
                    <ellipse cy="10" rx="11" ry="2.5" fill="#3a2414" opacity="0.15" />
                    <circle r="11" fill="#9a6416" />
                    <circle r="9.5" cy="-0.6" fill="url(#coinRoadGold)" />
                    <circle r="6.5" cy="-0.6" fill="none" stroke="#b07a12" strokeOpacity="0.5" strokeWidth="1" />
                  </g>
                ) : (
                  <g transform={`translate(${x(i) + TILE / 2}, ${ROAD_Y + 20})`}>
                    <circle r="11" fill="#2b2420" />
                    <rect x="-11" y="-5" width="22" height="7" rx="3.5" fill="#cc2e2e" />
                    <circle cx="-4.5" cy="-1.5" r="1.8" fill="#ffffff" />
                    <circle cx="4.5" cy="-1.5" r="1.8" fill="#ffffff" />
                  </g>
                )}
                <text x={x(i) + TILE / 2} y={ROAD_Y + 52} textAnchor="middle" fontSize="16" fontWeight="900" fill={v >= 0 ? '#4a2e00' : '#801818'} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                  {v > 0 ? `+${v}` : v}
                </text>
                <text x={x(i) + TILE / 2} y={ROAD_Y + TILE + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#6b645a">
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* the cut ribbon */}
          {mid !== undefined && kind !== 'final' && kind !== 'base' && kind !== 'intro' && (
            <g>
              <line x1={x(mid) + TILE + GAP / 2} y1={ROAD_Y - 30} x2={x(mid) + TILE + GAP / 2} y2={ROAD_Y + TILE + 26} stroke="#cc2e2e" strokeWidth="4" strokeDasharray="8 5" strokeLinecap="round" />
              <g transform={`translate(${x(mid) + TILE + GAP / 2}, ${ROAD_Y - 42})`}>
                <circle r="11" fill="#cc2e2e" />
                <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="-4.5" cy="4.5" r="2" fill="none" stroke="#ffffff" strokeWidth="1.4" />
                <circle cx="4.5" cy="4.5" r="2" fill="none" stroke="#ffffff" strokeWidth="1.4" />
              </g>
            </g>
          )}

          {/* flags at the best left / right reach */}
          {scan?.bestLeft && kind !== 'final' && (
            <g transform={`translate(${x(scan.bestLeft.index) + 10}, ${ROAD_Y - 8})`}>
              <line x1="0" y1="0" x2="0" y2="-22" stroke="#6e4426" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M0 -22 L15 -17.5 L0 -13 Z" fill="#0c8030" />
            </g>
          )}
          {scan?.bestRight && kind !== 'final' && (
            <g transform={`translate(${x(scan.bestRight.index) + TILE - 10}, ${ROAD_Y - 8})`}>
              <line x1="0" y1="0" x2="0" y2="-22" stroke="#6e4426" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M0 -22 L-15 -17.5 L0 -13 Z" fill="#0c8030" />
            </g>
          )}

          {/* lantern + basket */}
          {lanternAt !== undefined && (
            <g style={{ transform: `translate(${x(lanternAt) + TILE / 2}px, ${ROAD_Y + TILE + 44}px)`, transition: 'transform 0.6s var(--ease-move)' }}>
              <g transform="translate(0, -8)">
                <circle r="13" fill="#fde68a" opacity="0.6" />
                <path d="M-4 -12 H4 M0 -12 V-9" stroke="#6e4426" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="-7" y="-9" width="14" height="16" rx="6" fill="#d9473b" />
                <rect x="-4" y="-6" width="8" height="10" rx="3" fill="#fde68a" />
              </g>
              <rect x="-34" y="10" width="68" height="24" rx="12" fill="#1a1a1a" />
              <text textAnchor="middle" y="26.5" fontSize="12.5" fontWeight="900" fill="#f3efe6" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                basket {basket}
              </text>
            </g>
          )}
        </svg>
      )}

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
                <span className="h-6 text-sm font-black text-stone-900">{win ? 'winner' : ' '}</span>
                <div
                  className={`w-24 flex flex-col items-center justify-end rounded-t-2xl ${win ? 'h-24 bg-[#f2c21a]' : 'h-16 bg-[#e3dccd]'}`}
                >
                  <span className="font-display text-2xl font-black text-stone-900">{val}</span>
                  <span className="text-xs font-bold text-stone-700 pb-1.5">{name}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StoryStage>
  );
};
