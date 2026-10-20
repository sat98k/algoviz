import React from 'react';
import { ChipSpan, spanHas } from '../../config/roadmaps';

interface RoadmapStripProps {
  /** One short label per "How it works" step, in the same order. */
  labels: string[];
  /** The chips the current step belongs to (0-based span), or null before the first stage. */
  active: ChipSpan | null;
  /** Chips already reached at least once in this run (clickable). */
  reached: Set<number>;
  /** Jump to the first step of a chip's stage. */
  onJump: (chip: number) => void;
}

/**
 * "You are here": the algorithm's "How it works" steps as numbered chips, with the
 * current one lit. Numbers match the list in "Problem & how it works".
 */
export const RoadmapStrip: React.FC<RoadmapStripProps> = ({ labels, active, reached, onJump }) => (
  <nav
    aria-label="Where we are in the algorithm"
    data-roadmap
    className="flex items-center gap-2 w-full px-3 py-1.5 bg-obsidian-950 border border-hairline overflow-x-auto"
  >
    <span className="shrink-0 font-sans text-xs font-semibold text-chalk-400">How it works:</span>
    <ol className="flex items-center gap-1">
      {labels.map((label, i) => {
        const isActive = spanHas(active, i);
        const isReached = reached.has(i);
        return (
          <li key={i} className="flex items-center gap-1 shrink-0">
            {i > 0 && (
              <span aria-hidden className="text-chalk-500 text-xs">
                ›
              </span>
            )}
            <button
              type="button"
              disabled={!isReached}
              onClick={() => onJump(i)}
              aria-current={isActive ? 'step' : undefined}
              data-roadmap-chip={i}
              title={isReached ? `Jump to the start of step ${i + 1}` : `Step ${i + 1} is not reached in this run yet`}
              className={`flex items-center gap-1.5 px-2 py-0.5 font-sans text-xs whitespace-nowrap border transition-colors ${
                isActive
                  ? 'bg-amber text-obsidian-950 border-amber font-bold'
                  : isReached
                  ? 'text-chalk-200 border-hairline hover:bg-obsidian-850'
                  : 'text-chalk-500 border-transparent cursor-default'
              }`}
            >
              <span className="tabular-nums">{i + 1}</span>
              {label}
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);
