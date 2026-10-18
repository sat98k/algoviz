import React, { useState } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { FractionalKnapsackItem } from '../../algorithms/fractionalKnapsack';
import { SEM } from '../../styles/semantics';
import { FractionalKnapsackAnimatedView } from './FractionalKnapsackAnimatedView';

export interface FractionalKnapsackVisualizerProps {
  step: AlgorithmStep;
  defaultViewMode?: 'story' | 'technical';
}

const fmt = (n: number) => String(parseFloat(n.toFixed(2)));

/** The decision made for an item, as a short label (undecided items get none). */
export const decisionLabel = (item: FractionalKnapsackItem) =>
  item.status === 'taken_full'
    ? 'Take whole item'
    : item.status === 'taken_fraction'
    ? `Take ${fmt(item.fractionTaken * 100)}%`
    : item.status === 'skipped'
    ? 'Left out (full)'
    : null;

export const FractionalKnapsackVisualizer: React.FC<FractionalKnapsackVisualizerProps> = ({
  step,
  defaultViewMode = 'story',
}) => {
  const [viewMode, setViewMode] = useState<'story' | 'technical'>(defaultViewMode);

  const state = step.state || {};
  const items: FractionalKnapsackItem[] = state.items || [];
  const capacity: number = state.capacity || 50;
  const currentWeight: number = state.currentWeight || 0;
  const currentValue: number = state.currentValue || 0;
  const currentItemIndex: number = state.currentItemIndex ?? -1;
  const isSorted: boolean = !!state.isSorted;
  const originalOrder: number[] = state.originalOrder || items.map((it) => it.id);
  const fitCheck: { weight: number; remaining: number; fits: boolean } | undefined = state.fitCheck;

  const fillPercentage = Math.min(100, Math.max(0, (currentWeight / capacity) * 100));
  const segments = items.filter((it) => it.weightTaken > 0);

  const cardClasses = (item: FractionalKnapsackItem, index: number) => {
    if (index === currentItemIndex && item.status === 'examining') return `${SEM.current.cell} font-normal shadow-md`;
    if (index === currentItemIndex) return `${item.status === 'taken_fraction' ? 'bg-sem-compare/10 border-2 border-sem-compare' : item.status === 'skipped' ? 'bg-sem-pruned/5 border-2 border-dashed border-sem-pruned' : 'bg-sem-match/10 border-2 border-sem-match'} shadow-md`;
    if (item.status === 'taken_full') return 'bg-sem-match/10 border border-sem-match/60';
    if (item.status === 'taken_fraction') return 'bg-sem-compare/10 border border-sem-compare/60';
    if (item.status === 'skipped') return 'bg-sem-pruned/5 border border-dashed border-sem-pruned opacity-75';
    return 'border border-hairline bg-obsidian-950/80';
  };

  const statusBadge = (item: FractionalKnapsackItem) => {
    const base = 'px-2 py-0.5 text-xs font-sans font-semibold';
    switch (item.status) {
      case 'taken_full':
        return <span className={`${base} ${SEM.match.badge}`}>✓ Take whole item</span>;
      case 'taken_fraction':
        return <span className={`${base} ${SEM.compare.badge}`}>½ Take {fmt(item.fractionTaken * 100)}%</span>;
      case 'skipped':
        return <span className={`${base} ${SEM.pruned.badge}`}>✂ Left out</span>;
      case 'examining':
        return <span className={`${base} ${SEM.current.badge}`}>▶ Deciding</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[380px] p-3 sm:p-6 bg-obsidian-900 border border-hairline gap-5">
      {/* ─── Mode Switcher Header ─── */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-5xl px-1 pb-3 border-b border-hairline gap-3">
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs text-chalk-400 font-semibold uppercase tracking-wider">
            View Mode:
          </span>
          <div className="inline-flex p-1 bg-obsidian-950 border border-hairline rounded-lg shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('story')}
              data-view-mode="story"
              className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'story'
                  ? 'bg-amber text-obsidian-950 shadow-sm font-bold'
                  : 'text-chalk-400 hover:text-chalk-200'
              }`}
            >
              <span>🎬</span> Animation Mode
            </button>
            <button
              type="button"
              onClick={() => setViewMode('technical')}
              data-view-mode="technical"
              className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'technical'
                  ? 'bg-obsidian-800 text-chalk-100 border border-hairline font-bold'
                  : 'text-chalk-400 hover:text-chalk-200'
              }`}
            >
              <span>📊</span> Technical View
            </button>
          </div>
        </div>
        <span className="text-xs font-sans text-chalk-400">
          {viewMode === 'story' ? 'Interactive physical knapsack, block piles & laser slicing' : 'Formulas, detailed cards & segmented capacity bar'}
        </span>
      </div>

      {/* ─── Story / Animation Mode ─── */}
      {viewMode === 'story' ? (
        <FractionalKnapsackAnimatedView step={step} />
      ) : (
        /* ─── Technical View ─── */
        <>
          {/* Capacity: one segment per item taken */}
          <section aria-label="Knapsack capacity" className="w-full max-w-4xl p-4 bg-obsidian-950 border border-hairline flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-sm">
          <span className="text-chalk-400">
            Capacity used <strong className="text-chalk-100 tabular-nums">{fmt(currentWeight)} / {capacity}</strong>
          </span>
          <span className="text-chalk-400">
            Value <strong className={`${SEM.match.text} tabular-nums`}>{fmt(currentValue)}</strong>
          </span>
        </div>
        <div className="w-full h-8 flex bg-obsidian-850 border border-hairline overflow-hidden" role="img" aria-label={`Knapsack ${fillPercentage.toFixed(0)}% full`}>
          {segments.map((it) => (
            <div
              key={it.id}
              data-segment={it.id}
              style={{ width: `${(it.weightTaken / capacity) * 100}%` }}
              title={`Item ${it.id}: ${fmt(it.weightTaken)}`}
              className={`h-full flex items-center justify-center overflow-hidden whitespace-nowrap border-r-2 border-obsidian-950 font-mono text-xs font-bold transition-all duration-300 ${
                it.status === 'taken_fraction' ? 'bg-sem-compare/30 text-sem-compare-ink' : 'bg-sem-match/30 text-sem-match-ink'
              }`}
            >
              {it.weightTaken / capacity >= 0.08 ? `#${it.id} · ${fmt(it.weightTaken)}` : `#${it.id}`}
            </div>
          ))}
          {fillPercentage < 100 && (
            <div className="h-full flex-1 flex items-center justify-center font-mono text-xs text-chalk-500 whitespace-nowrap overflow-hidden">
              free {fmt(capacity - currentWeight)}
            </div>
          )}
        </div>
      </section>

      {/* Order: as entered vs sorted by value ÷ weight */}
      <section aria-label="Item order" className="w-full max-w-4xl flex flex-col gap-1.5 font-mono text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-sans text-xs text-chalk-400 w-28 shrink-0">Entered</span>
          {originalOrder.map((id) => (
            <span key={id} className="px-1.5 py-0.5 bg-obsidian-950 border border-hairline text-chalk-300">
              #{id}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-sans text-xs text-chalk-400 w-28 shrink-0">Sorted by v ÷ w</span>
          {isSorted ? (
            items.map((it, idx) => (
              <React.Fragment key={it.id}>
                {idx > 0 && <span className="text-chalk-500">›</span>}
                <span className={`px-1.5 py-0.5 border ${idx === currentItemIndex ? SEM.current.badge : 'bg-obsidian-950 border-hairline text-chalk-200'}`}>
                  #{it.id} <span className="text-chalk-400">({fmt(it.ratio)})</span>
                </span>
              </React.Fragment>
            ))
          ) : (
            <span className="font-sans text-xs text-chalk-500">not sorted yet</span>
          )}
        </div>
      </section>

      {/* Item cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((item, idx) => {
          const percentTaken = Math.round(item.fractionTaken * 100);
          const isCurrent = idx === currentItemIndex;
          return (
            <div key={item.id} data-item={item.id} className={`p-4 transition-all duration-200 flex flex-col gap-3 ${cardClasses(item, idx)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-sm font-bold text-chalk-100">
                  Item #{item.id}
                  {isSorted && item.rank && <span className="ml-1.5 font-normal text-chalk-400">rank {item.rank}</span>}
                </span>
                {statusBadge(item)}
              </div>

              <div className="flex flex-col gap-1 font-mono text-sm">
                <div className="flex justify-between text-chalk-400">
                  <span className="font-sans text-xs">weight</span>
                  <span className="text-chalk-100 font-semibold">{item.weight}</span>
                </div>
                <div className="flex justify-between text-chalk-400">
                  <span className="font-sans text-xs">value</span>
                  <span className="text-chalk-100 font-semibold">{item.value}</span>
                </div>
                <div className="flex justify-between items-baseline text-chalk-400 border-t border-hairline pt-1">
                  <span className="font-sans text-xs">value ÷ weight</span>
                  <span className="text-sem-formula-ink font-bold">
                    {item.value} ÷ {item.weight} = {fmt(item.ratio)}
                  </span>
                </div>
              </div>

              {/* The fit test and decision on the item being processed */}
              {isCurrent && fitCheck && (
                <div className="flex flex-col gap-1 pt-2 border-t border-hairline">
                  <span
                    data-fit-check
                    className={`self-start px-2 py-0.5 font-mono text-sm font-semibold border ${fitCheck.fits ? SEM.match.badge : SEM.mismatch.badge}`}
                  >
                    weight {fitCheck.weight} {fitCheck.fits ? '≤' : '>'} remaining {fmt(fitCheck.remaining)} {fitCheck.fits ? '✓' : '✗'}
                  </span>
                  {decisionLabel(item) && (
                    <span data-decision className="font-sans text-sm font-bold text-chalk-100">
                      → {decisionLabel(item)}
                      {item.status === 'taken_fraction' && (
                        <span className="font-mono font-normal text-chalk-300">
                          {' '}
                          ({fmt(item.weightTaken)} ÷ {item.weight} × {item.value} = {fmt(item.valueTaken)})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-sans text-xs text-chalk-400">
                  <span>portion taken</span>
                  <span className="font-mono font-bold text-chalk-200">{percentTaken}%</span>
                </div>
                <div className="w-full h-1.5 bg-obsidian-850 border border-hairline overflow-hidden">
                  <div
                    style={{ width: `${percentTaken}%` }}
                    className={`h-full transition-all duration-300 ${item.status === 'taken_full' ? 'bg-sem-match' : item.status === 'taken_fraction' ? 'bg-sem-compare' : 'bg-chalk-600'}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ul aria-label="Legend" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-sans text-chalk-400">
        <LegendItem swatch={SEM.current.swatch} symbol="▶" label="Deciding" />
        <LegendItem swatch={SEM.match.swatch} symbol="✓" label="Taken whole" />
        <LegendItem swatch={SEM.compare.swatch} symbol="½" label="Taken in part" />
        <LegendItem swatch={SEM.pruned.swatch} symbol="✂" label="Left out (knapsack full)" />
      </ul>
    </>
  )}
</div>
);
};

const LegendItem: React.FC<{ swatch: string; symbol: string; label: string }> = ({ swatch, symbol, label }) => (
  <li className="flex items-center gap-1.5">
    <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[11px] font-bold ${swatch}`}>{symbol}</span>
    <span>{label}</span>
  </li>
);
