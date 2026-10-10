import React from 'react';
import { Crosshair } from 'lucide-react';
import { DpRuleStep } from '../../types/algorithm';
import { DP_TONE, formulaClass } from './DpBriefPanel';

/**
 * "Rule for this cell": the case applied at the current step, with the step's own
 * numbers. Shows only data the step provides; never computes or predicts values.
 */
export const DpCurrentRule: React.FC<{ rule?: DpRuleStep }> = ({ rule }) => (
  <aside aria-label="Rule for this cell" aria-live="polite" className="flex flex-col gap-2 p-3.5 bg-obsidian-900 border border-hairline">
    <h3 className="flex items-center gap-1.5 font-sans text-[11px] font-semibold text-chalk-400">
      <Crosshair className="w-3 h-3 text-amber" /> Rule for this cell
    </h3>
    {!rule ? (
      <p className="font-sans text-xs text-chalk-500">No formula is applied in this step.</p>
    ) : (
      <>
        <span className={`self-start px-1.5 py-0.5 border font-sans text-xs font-bold ${DP_TONE[rule.tone].chip}`}>{rule.label}</span>
        <dl className="flex flex-col gap-1.5">
          {rule.check && (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <dt className="font-sans text-[11px] text-chalk-500 w-16 shrink-0">Check</dt>
              <dd className={`font-mono text-sm font-semibold [overflow-wrap:anywhere] ${rule.check.ok ? 'text-sem-match-ink' : 'text-sem-mismatch-ink'}`}>
                {rule.check.text} {rule.check.ok ? '✓' : '✗'}
              </dd>
            </div>
          )}
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="font-sans text-[11px] text-chalk-500 w-16 shrink-0">Formula</dt>
            <dd className={`${formulaClass} text-xs`}>{rule.formula}</dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="font-sans text-[11px] text-chalk-500 w-16 shrink-0">Values</dt>
            <dd className={`${formulaClass} text-sm font-bold`}>{rule.substitution}</dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="font-sans text-[11px] text-chalk-500 w-16 shrink-0">Action</dt>
            <dd className="font-sans text-xs text-chalk-200">{rule.action}</dd>
          </div>
        </dl>
      </>
    )}
  </aside>
);
