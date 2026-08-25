import React from 'react';
import { MetricData } from '../../types/algorithm';
import { Activity, GitCompare, RefreshCw, Undo, Network, Split } from 'lucide-react';

interface MetricsPanelProps {
  metrics: MetricData;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
        <Activity className="w-4 h-4 text-sky-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Live Operation Counters
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
        {metrics.comparisons !== undefined && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-amber-400" /> Comparisons
            </span>
            <span className="text-sm font-mono font-bold text-amber-300">
              {metrics.comparisons}
            </span>
          </div>
        )}

        {metrics.swaps !== undefined && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-rose-400" /> Swaps
            </span>
            <span className="text-sm font-mono font-bold text-rose-300">
              {metrics.swaps}
            </span>
          </div>
        )}

        {metrics.backtracks !== undefined && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Undo className="w-3.5 h-3.5 text-purple-400" /> Backtracks
            </span>
            <span className="text-sm font-mono font-bold text-purple-300">
              {metrics.backtracks}
            </span>
          </div>
        )}

        {metrics.relaxations !== undefined && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-emerald-400" /> Relaxations
            </span>
            <span className="text-sm font-mono font-bold text-emerald-300">
              {metrics.relaxations}
            </span>
          </div>
        )}

        {metrics.recursiveCalls !== undefined && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5 text-sky-400" /> Recursions
            </span>
            <span className="text-sm font-mono font-bold text-sky-300">
              {metrics.recursiveCalls}
            </span>
          </div>
        )}

        {metrics.nodesExplored !== undefined && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-cyan-400" /> Explored
            </span>
            <span className="text-sm font-mono font-bold text-cyan-300">
              {metrics.nodesExplored}
            </span>
          </div>
        )}

        {metrics.prunedNodes !== undefined && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Undo className="w-3.5 h-3.5 text-rose-400" /> Pruned Branches
            </span>
            <span className="text-sm font-mono font-bold text-rose-300">
              {metrics.prunedNodes}
            </span>
          </div>
        )}

        {metrics.iterations !== undefined && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Iterations
            </span>
            <span className="text-sm font-mono font-bold text-blue-300">
              {metrics.iterations}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
