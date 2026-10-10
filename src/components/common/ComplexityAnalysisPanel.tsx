import React from 'react';
import { Clock, Cpu, Info, Layers } from 'lucide-react';
import { BoundKind, ComplexityAnalysis, Paradigm, TimeBound } from '../../types/algorithm';
import { PARADIGM_TERMS } from '../../config/glossary';
import { Term } from './Term';

interface ComplexityAnalysisPanelProps {
  analysis: ComplexityAnalysis;
  paradigm: Paradigm;
}

const CASE_LABEL: Record<TimeBound['case'], string> = {
  best: 'Best case',
  expected: 'Expected',
  average: 'Average case',
  worst: 'Worst case',
  all: 'Every case',
};

const KIND_HELP: Record<BoundKind, string> = {
  'Worst-case': 'Holds for every input of this size.',
  Expected: 'An average over random choices or a stated random-input assumption, not a guarantee for every run.',
  Amortized: 'Some single steps can be slow, but the total over the whole run is bounded.',
  'Pseudo-polynomial': 'Polynomial in the numeric value of an input (like W), not in the number of digits used to write it.',
  'Output-sensitive': 'Depends on the size of the answer (like h hull vertices), not only on the input size.',
  Exponential: 'Grows exponentially in the worst case; practical only for small inputs.',
  'Randomized (Monte Carlo)': 'The running time is fixed, but a single run can return a wrong answer with bounded probability.',
  Approximation: 'Runs in polynomial time and returns a near-optimal answer with a proven guarantee.',
};

const formula = 'font-mono text-sem-formula-ink';

/** "Time and space complexity": bounds per case, space, what dominates, and how it is derived. */
export const ComplexityAnalysisPanel: React.FC<ComplexityAnalysisPanelProps> = ({ analysis, paradigm }) => {
  const paradigmTerm = PARADIGM_TERMS[paradigm];
  return (
    <section aria-labelledby="complexity-heading" className="flex flex-col gap-4 p-4 sm:p-5 bg-obsidian-900 border border-hairline">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
        <h2 id="complexity-heading" className="font-display font-bold text-lg text-chalk-100">
          Time and space complexity
        </h2>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 border border-hairline bg-obsidian-950 text-chalk-300">
            <Layers className="w-3 h-3 text-amber" />
            {paradigmTerm ? <Term termKey={paradigmTerm}>{paradigm}</Term> : paradigm}
          </span>
          {analysis.kinds.map((k) => (
            <span key={k} title={KIND_HELP[k]} className="px-2 py-0.5 border border-sem-formula/40 bg-sem-formula/10 text-sem-formula-ink">
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Time */}
        <div className="flex flex-col gap-2 p-3.5 bg-obsidian-950 border border-hairline">
          <h3 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-chalk-500">
            <Clock className="w-3 h-3 text-amber" /> Time
          </h3>
          <dl className="flex flex-col gap-2.5">
            {analysis.time.map((t) => (
              <div key={t.case} className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <dt className="font-mono text-[11px] text-chalk-400 min-w-[6.5rem]">{CASE_LABEL[t.case]}</dt>
                  <dd className={`${formula} text-base font-bold`}>{t.bound}</dd>
                </div>
                {t.note && <p className="font-sans text-xs leading-relaxed text-chalk-300">{t.note}</p>}
              </div>
            ))}
          </dl>
        </div>

        {/* Space */}
        <div className="flex flex-col gap-2 p-3.5 bg-obsidian-950 border border-hairline">
          <h3 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-chalk-500">
            <Cpu className="w-3 h-3 text-acid-500" /> Space
          </h3>
          <p className={`${formula} text-base font-bold`}>{analysis.space.bound}</p>
          <p className="font-sans text-xs leading-relaxed text-chalk-300">{analysis.space.explanation}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-chalk-200">
        <p>
          <strong className="text-chalk-100">What dominates: </strong>
          {analysis.dominant}
        </p>
        {analysis.recurrence && (
          <p>
            <strong className="text-chalk-100">Recurrence: </strong>
            <span className={`${formula} px-1.5 py-0.5 bg-sem-formula/10 border border-sem-formula/30`}>{analysis.recurrence}</span>
          </p>
        )}
        <div>
          <strong className="text-chalk-100">Why: </strong>
          {analysis.derivation}
        </div>
        <div>
          <strong className="text-chalk-100">Variables: </strong>
          <ul className="inline">
            {analysis.variables.map((v, i) => (
              <li key={v.symbol} className="inline">
                <span className={formula}>{v.symbol}</span> = {v.meaning}
                {i < analysis.variables.length - 1 ? '; ' : '.'}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {analysis.implementationNote && (
        <p className="flex gap-2 p-3 bg-obsidian-950 border border-dashed border-hairline font-sans text-xs leading-relaxed text-chalk-300">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-chalk-400" />
          <span>
            <strong className="text-chalk-200">About this implementation: </strong>
            {analysis.implementationNote}
          </span>
        </p>
      )}
    </section>
  );
};
