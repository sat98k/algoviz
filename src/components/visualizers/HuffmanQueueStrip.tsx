import React from 'react';
import { SEM } from '../../styles/semantics';
import type { HuffmanQueueEntry } from '../../algorithms/huffman';

const show = (ch: string) => (ch === ' ' ? '␣' : ch);

/**
 * The Huffman priority queue in order (smallest frequency first). Marks the two entries
 * being taken out (① smallest, ② next) and the merged entry put back (+ new).
 */
export const HuffmanQueueStrip: React.FC<{ queue: HuffmanQueueEntry[]; removed?: [string, string]; inserted?: string }> = ({ queue, removed, inserted }) => (
  <section aria-label="Priority queue" className="w-full mb-2.5 px-3 py-2 bg-obsidian-950 border border-hairline flex flex-col gap-1.5">
    <h3 className="font-sans text-xs font-semibold text-chalk-400">
      Priority queue <span className="font-normal text-chalk-500">· smallest frequency first</span>
    </h3>
    <ol className="flex flex-wrap items-end gap-1.5">
      {queue.map((entry) => {
        const rank = removed ? removed.indexOf(entry.id) : -1;
        const isNew = entry.id === inserted;
        const cls = rank >= 0 ? SEM.compare.cell : isNew ? SEM.final.cell : 'bg-obsidian-900 border border-hairline text-chalk-200';
        return (
          <li key={entry.id} data-queue-entry={entry.label} className="flex flex-col items-center gap-0.5">
            <span className={`h-4 font-sans text-[11px] font-semibold ${rank >= 0 ? SEM.compare.text : isNew ? SEM.final.text : 'text-transparent'}`}>
              {rank === 0 ? '① smallest' : rank === 1 ? '② next' : isNew ? '+ new' : '·'}
            </span>
            <div className={`min-w-[2.75rem] px-2 py-1 flex flex-col items-center font-mono ${cls}`}>
              <span className="text-base font-bold leading-tight tabular-nums">{entry.freq}</span>
              <span className="text-xs leading-tight [overflow-wrap:anywhere] max-w-[8rem] text-center">
                {entry.isLeaf ? `'${show(entry.label)}'` : [...entry.label].map(show).join('')}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  </section>
);
