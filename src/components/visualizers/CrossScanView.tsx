import React from 'react';
import { SEM } from '../../styles/semantics';
import type { CrossScan } from '../../algorithms/maxSubarray';

/**
 * Crossing case of maximum subarray: running sums grown outwards from the midpoint.
 * Under each scanned index is the sum of the piece from it to the midpoint; the best
 * end on each side is starred. Only sums computed so far are shown.
 */
export const CrossScanView: React.FC<{ array: number[]; scan: CrossScan; crossSum?: number }> = ({ array, scan, crossSum }) => {
  const { low, mid, high, side, index, leftSums, rightSums, bestLeft, bestRight } = scan;
  const sumAt = new Map<number, number>([...leftSums, ...rightSums].map((e) => [e.index, e.sum]));
  const done = side === 'done';
  const inBestLeft = (i: number) => !!bestLeft && (side === 'right' || done) && i >= bestLeft.index && i <= mid;
  const inBestRight = (i: number) => !!bestRight && done && i > mid && i <= bestRight.index;

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="overflow-x-auto pb-1">
        <div className="flex items-end gap-1 min-w-max mx-auto w-max">
          {Array.from({ length: high - low + 1 }, (_, k) => low + k).map((i) => {
            const scanned = sumAt.has(i);
            const isBestEnd = (bestLeft && i === bestLeft.index && i <= mid) || (bestRight && i === bestRight.index && i > mid);
            const cell =
              i === index
                ? SEM.current.cell
                : inBestLeft(i) || inBestRight(i)
                ? SEM.final.cell
                : scanned
                ? 'bg-sem-compare/10 border border-sem-compare/50 text-chalk-100'
                : 'bg-obsidian-900 border border-hairline text-chalk-400';
            return (
              <React.Fragment key={i}>
                {i === mid + 1 && (
                  <div className="self-stretch flex flex-col items-center justify-center px-1" aria-hidden="true">
                    <span className="font-mono text-[11px] font-bold text-chalk-400">mid</span>
                    <div className="w-0.5 flex-1 bg-sem-current/60" />
                  </div>
                )}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-mono text-[11px] text-chalk-500">i={i}</span>
                  <div className={`w-10 h-10 flex items-center justify-center font-mono text-sm font-semibold ${cell}`}>{array[i]}</div>
                  <span
                    data-running-sum={scanned ? sumAt.get(i) : undefined}
                    aria-label={scanned ? `running sum ${sumAt.get(i)}` : 'not scanned yet'}
                    className={`h-5 min-w-[2.5rem] text-center font-mono text-sm ${scanned ? 'text-sem-formula-ink font-bold' : 'text-chalk-600'}`}
                  >
                    {scanned ? `${sumAt.get(i)}${isBestEnd ? '★' : ''}` : '·'}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 font-mono text-sm text-chalk-300">
        <span>
          ← bestLeft = <strong className="text-chalk-100">{bestLeft ? bestLeft.sum : '…'}</strong>
          {bestLeft && <span className="text-chalk-500"> [{bestLeft.index}..{mid}]</span>}
        </span>
        <span>
          bestRight = <strong className="text-chalk-100">{bestRight ? bestRight.sum : '…'}</strong>
          {bestRight && <span className="text-chalk-500"> [{mid + 1}..{bestRight.index}]</span>} →
        </span>
      </div>
      {done && bestLeft && bestRight && (
        <p className={`self-center px-3 py-1 font-mono text-sm font-bold ${SEM.final.badge}`}>
          CrossSum = bestLeft + bestRight = {bestLeft.sum} + {bestRight.sum} = {crossSum ?? bestLeft.sum + bestRight.sum}
        </p>
      )}
      <p className="text-center font-sans text-xs text-chalk-500">Under each cell: sum from that index to the midpoint · ★ best end</p>
    </div>
  );
};
