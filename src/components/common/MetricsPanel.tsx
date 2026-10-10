import React from 'react';
import { MetricData } from '../../types/algorithm';

interface MetricsPanelProps {
  metrics: MetricData;
}

const LABELS: [Exclude<keyof MetricData, 'custom'>, string][] = [
  ['comparisons', 'Comparisons'],
  ['swaps', 'Swaps'],
  ['backtracks', 'Backtracks'],
  ['relaxations', 'Relaxations'],
  ['recursiveCalls', 'Recursive calls'],
  ['nodesExplored', 'Nodes explored'],
  ['prunedNodes', 'Pruned branches'],
  ['iterations', 'Iterations'],
];

/**
 * Running operation counts for the current step. Deliberately low-emphasis: the
 * visualization and pseudocode carry the teaching; these are supporting numbers.
 */
export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const items = LABELS.filter(([key]) => metrics[key] !== undefined);

  return (
    <section aria-label="Operation counts" className="flex flex-col gap-1.5 px-3 py-2.5 border border-hairline bg-obsidian-900/60">
      <h2 className="font-sans text-xs font-semibold text-chalk-400">Operation counts</h2>
      {items.length === 0 ? (
        <p className="font-sans text-xs text-chalk-500">This algorithm records no counts for this step.</p>
      ) : (
        <dl className="flex flex-wrap gap-x-5 gap-y-1">
          {items.map(([key, label]) => (
            <div key={key} className="flex items-baseline gap-1.5">
              <dt className="font-sans text-xs text-chalk-400">{label}</dt>
              <dd className="font-mono text-sm font-semibold text-chalk-200 tabular-nums">{metrics[key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};
