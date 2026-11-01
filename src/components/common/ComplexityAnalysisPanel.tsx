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

/** Inline formula text (variables, short expressions) in the code face. */
const formula = 'font-mono text-sem-formula-ink';

/**
 * "Time and space complexity": bounds per case, space, what dominates, and how it is derived.
 * Laid out like the home page: the bounds are the big display type, the tags are pills, the
 * recurrence sits on an ink field.
 */
export const ComplexityAnalysisPanel: React.FC<ComplexityAnalysisPanelProps> = ({ analysis, paradigm }) => {
  const paradigmTerm = PARADIGM_TERMS[paradigm];
  return (
    <section aria-labelledby="complexity-heading" className="cx-panel">
      <div className="cx-head">
        <h2 id="complexity-heading" className="cx-title">
          Time and space complexity
        </h2>
        <div className="cx-tags">
          <span className="cx-tag">
            <Layers className="w-4 h-4" aria-hidden />
            {paradigmTerm ? <Term termKey={paradigmTerm}>{paradigm}</Term> : paradigm}
          </span>
          {analysis.kinds.map((k) => (
            <span key={k} title={KIND_HELP[k]} className="cx-tag cx-tag-ink">
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="cx-grid">
        <div className="cx-card">
          <h3 className="cx-card-title">
            <Clock className="w-4 h-4" aria-hidden /> Time
          </h3>
          <dl className="cx-cases">
            {analysis.time.map((t) => (
              <div key={t.case} className="cx-case">
                <dt className="cx-case-label">{CASE_LABEL[t.case]}</dt>
                <dd className="cx-bound">{t.bound}</dd>
                {t.note && <p className="cx-note">{t.note}</p>}
              </div>
            ))}
          </dl>
        </div>

        <div className="cx-card">
          <h3 className="cx-card-title">
            <Cpu className="w-4 h-4" aria-hidden /> Space
          </h3>
          <p className="cx-bound">{analysis.space.bound}</p>
          <p className="cx-note">{analysis.space.explanation}</p>
        </div>
      </div>

      {analysis.recurrence && (
        <div className="cx-recurrence">
          <span className="cx-recurrence-label">Recurrence</span>
          <code className="cx-recurrence-text">{analysis.recurrence}</code>
        </div>
      )}

      <div className="cx-prose">
        <p>
          <strong>What dominates: </strong>
          {analysis.dominant}
        </p>
        <div>
          <strong>Why: </strong>
          {analysis.derivation}
        </div>
        <div>
          <strong>Variables: </strong>
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
        <p className="cx-impl">
          <Info className="w-4 h-4 mt-1 shrink-0" aria-hidden />
          <span>
            <strong>About this implementation: </strong>
            {analysis.implementationNote}
          </span>
        </p>
      )}
    </section>
  );
};
