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
    <section aria-label="Operation counts" className="sp-card flex flex-col gap-2">
      <h2 className="sp-label">Operation counts</h2>
      {items.length === 0 ? (
        <p className="sp-meta">This algorithm records no counts for this step.</p>
      ) : (
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {items.map(([key, label]) => (
            <div key={key} className="flex flex-col">
              <dt className="sp-meta">{label}</dt>
              <dd className="sp-stat">{metrics[key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};
