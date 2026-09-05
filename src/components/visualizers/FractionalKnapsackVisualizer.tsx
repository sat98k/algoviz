import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { FractionalKnapsackItem } from '../../algorithms/fractionalKnapsack';

interface FractionalKnapsackVisualizerProps {
  step: AlgorithmStep;
}

export const FractionalKnapsackVisualizer: React.FC<FractionalKnapsackVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const items: FractionalKnapsackItem[] = state.items || [];
  const capacity = state.capacity || 50;
  const currentWeight = state.currentWeight || 0;
  const currentValue = state.currentValue || 0;
  const currentItemIndex = state.currentItemIndex ?? -1;

  const fillPercentage = Math.min(100, Math.max(0, (currentWeight / capacity) * 100));

  const getItemCardClasses = (item: FractionalKnapsackItem, index: number) => {
    if (index === currentItemIndex) {
      return 'border-amber bg-amber/10 shadow-lg shadow-amber/10 scale-105 z-10 ring-1 ring-amber';
    }
    if (item.status === 'taken_full') {
      return 'border-acid-500/80 bg-acid-500/10 shadow-sm';
    }
    if (item.status === 'taken_fraction') {
      return 'border-electric-400/80 bg-electric-500/10 shadow-sm';
    }
    if (item.status === 'skipped') {
      return 'border-rose-500/40 bg-rose-500/5 opacity-60';
    }
    return 'border-hairline bg-obsidian-950/80 hover:border-chalk-500/40';
  };

  const getStatusBadge = (item: FractionalKnapsackItem) => {
    switch (item.status) {
      case 'taken_full':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-acid-500/20 text-acid-500 border border-acid-500/40 uppercase">
            TAKEN 100%
          </span>
        );
      case 'taken_fraction':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-electric-400/20 text-electric-400 border border-electric-400/40 uppercase">
            TAKEN {(item.fractionTaken * 100).toFixed(1)}%
          </span>
        );
      case 'skipped':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase">
            SKIPPED
          </span>
        );
      case 'examining':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber/20 text-amber-glow border border-amber uppercase animate-pulse">
            EVALUATING
          </span>
        );
      case 'sorting':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono text-chalk-400 bg-obsidian-800 border border-hairline uppercase">
            SORTED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono text-chalk-500 bg-obsidian-850 border border-hairline uppercase">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[380px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Header telemetry / Knapsack Capacity Gauge */}
      <div className="w-full max-w-4xl mb-6 p-4 bg-obsidian-950 border border-hairline flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-chalk-500 uppercase tracking-wider">[ KNAPSACK CAPACITY ]:</span>
            <span className="text-chalk-100 font-bold tabular-nums">
              {currentWeight} / {capacity} kg
            </span>
            <span className="text-chalk-500 text-[10px]">({fillPercentage.toFixed(1)}% full)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-chalk-500 uppercase tracking-wider">[ ACCUMULATED VALUE ]:</span>
            <span className="text-acid-500 font-bold text-sm tabular-nums">
              ${currentValue}
            </span>
          </div>
        </div>

        {/* Capacity Bar Visual */}
        <div className="w-full h-3 bg-obsidian-850 border border-hairline overflow-hidden relative">
          <div
            style={{ width: `${fillPercentage}%` }}
            className={`h-full transition-all duration-300 ${
              fillPercentage >= 100
                ? 'bg-gradient-to-r from-amber to-acid-500'
                : 'bg-electric-400'
            }`}
          />
        </div>
      </div>

      {/* Explanation Callout */}
      {state.explanation && (
        <div className="w-full max-w-4xl mb-6 px-4 py-2 bg-obsidian-950 border border-amber/30 font-mono text-xs text-amber-glow flex items-center gap-2">
          <span className="font-semibold text-chalk-500 uppercase">[ GREEDY RULE ]:</span>
          <span>{state.explanation}</span>
        </div>
      )}

      {/* Item Cards Grid / List */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, idx) => {
          const cardClasses = getItemCardClasses(item, idx);
          const percentTaken = Math.round(item.fractionTaken * 100);

          return (
            <div
              key={item.id}
              className={`p-4 border transition-all duration-200 flex flex-col justify-between gap-3 relative overflow-hidden ${cardClasses}`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-chalk-200">
                  Item #{item.id}
                </span>
                {getStatusBadge(item)}
              </div>

              {/* Attributes */}
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex justify-between text-chalk-400">
                  <span>Weight (w):</span>
                  <span className="text-chalk-100 font-semibold">{item.weight} kg</span>
                </div>
                <div className="flex justify-between text-chalk-400">
                  <span>Value (v):</span>
                  <span className="text-chalk-100 font-semibold">${item.value}</span>
                </div>
                <div className="flex justify-between text-chalk-400 border-t border-hairline pt-1">
                  <span>Ratio (v/w):</span>
                  <span className="text-amber-glow font-bold">{item.ratio}</span>
                </div>
              </div>

              {/* Portion Taken Bar */}
              <div className="flex flex-col gap-1 pt-1 border-t border-hairline">
                <div className="flex justify-between font-mono text-[10px] text-chalk-400">
                  <span>Portion Taken:</span>
                  <span className="font-bold text-chalk-200">{percentTaken}%</span>
                </div>
                <div className="w-full h-1.5 bg-obsidian-850 border border-hairline overflow-hidden">
                  <div
                    style={{ width: `${percentTaken}%` }}
                    className={`h-full transition-all duration-300 ${
                      item.status === 'taken_full'
                        ? 'bg-acid-500'
                        : item.status === 'taken_fraction'
                        ? 'bg-electric-400'
                        : 'bg-chalk-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-6 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber border border-amber"></span>
          <span>Evaluating Item</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-acid-500/60 border border-acid-500"></span>
          <span>Full Item Taken (100%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-electric-400/60 border border-electric-400"></span>
          <span>Fractional Slice Taken</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-rose-500/40 border border-rose-400"></span>
          <span>Skipped (Capacity Full)</span>
        </div>
      </div>
    </div>
  );
};
