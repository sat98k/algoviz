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
    className="rm-strip"
  >
    <span className="rm-label">How it works</span>
    <ol className="rm-list">
      {labels.map((label, i) => {
        const isActive = spanHas(active, i);
        const isReached = reached.has(i);
        return (
          <li key={i} className="shrink-0">
            <button
              type="button"
              disabled={!isReached}
              onClick={() => onJump(i)}
              aria-current={isActive ? 'step' : undefined}
              data-roadmap-chip={i}
              title={isReached ? `Jump to the start of step ${i + 1}` : `Step ${i + 1} is not reached in this run yet`}
              className="rm-chip"
            >
              <span className="rm-num">{i + 1}</span>
              {label}
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);
