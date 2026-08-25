import React from 'react';
import { MetricData } from '../../types/algorithm';
import { Activity, GitCompare, RefreshCw, Undo, Network, Split } from 'lucide-react';

interface MetricsPanelProps {
  metrics: MetricData;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const metricItems = [
    { key: 'comparisons', label: 'COMPARISONS', value: metrics.comparisons, color: 'text-amber-glow', icon: GitCompare },
    { key: 'swaps', label: 'SWAPS', value: metrics.swaps, color: 'text-rose-400', icon: RefreshCw },
    { key: 'backtracks', label: 'BACKTRACKS', value: metrics.backtracks, color: 'text-purple-400', icon: Undo },
    { key: 'relaxations', label: 'RELAXATIONS', value: metrics.relaxations, color: 'text-acid-500', icon: Network },
    { key: 'recursiveCalls', label: 'RECURSIONS', value: metrics.recursiveCalls, color: 'text-electric-400', icon: Split },
    { key: 'nodesExplored', label: 'EXPLORED', value: metrics.nodesExplored, color: 'text-cyan-300', icon: Network },
    { key: 'prunedNodes', label: 'PRUNED BRANCHES', value: metrics.prunedNodes, color: 'text-rose-400', icon: Undo },
    { key: 'iterations', label: 'ITERATIONS', value: metrics.iterations, color: 'text-chalk-100', icon: RefreshCw },
  ].filter((item) => item.value !== undefined);

  if (metricItems.length === 0) {
    return (
      <div className="p-5 bg-obsidian-900 border border-hairline flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-chalk-500 pb-2 border-b border-hairline">
          <Activity className="w-3.5 h-3.5 text-amber" />
          <span>LIVE OPERATION TELEMETRY</span>
        </div>
        <p className="font-mono text-xs text-chalk-500 italic pt-2">No discrete operations recorded for this step.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5 bg-obsidian-900 border border-hairline">
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-chalk-200">
          <Activity className="w-3.5 h-3.5 text-amber" />
          <span>LIVE OPERATION TELEMETRY</span>
        </div>
        <span className="font-mono text-[10px] text-chalk-500">REALTIME DISPATCH</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metricItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex flex-col justify-between p-3 bg-obsidian-950 border border-hairline transition-colors hover:border-chalk-500/30"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-chalk-500 flex items-center gap-1.5 truncate">
                <Icon className="w-3 h-3 text-chalk-400 shrink-0" />
                {item.label}
              </span>
              <span className={`font-mono font-bold text-2xl mt-2 ${item.color} tabular-nums`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

