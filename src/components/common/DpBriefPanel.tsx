import React from 'react';
import { DpBrief, DpTone } from '../../types/algorithm';

/** Tone → classes (written out in full so Tailwind keeps them). */
export const DP_TONE: Record<DpTone, { edge: string; label: string; chip: string }> = {
  match: { edge: 'border-l-sem-match', label: 'text-sem-match-ink', chip: 'bg-sem-match/10 border-sem-match/50 text-sem-match-ink' },
  mismatch: { edge: 'border-l-sem-mismatch', label: 'text-sem-mismatch-ink', chip: 'bg-sem-mismatch/10 border-sem-mismatch/50 text-sem-mismatch-ink' },
  current: { edge: 'border-l-sem-current', label: 'text-sem-current-ink', chip: 'bg-sem-current/10 border-sem-current/50 text-sem-current-ink' },
  compare: { edge: 'border-l-sem-compare', label: 'text-sem-compare-ink', chip: 'bg-sem-compare/10 border-sem-compare/50 text-sem-compare-ink' },
  decision: { edge: 'border-l-sem-decision', label: 'text-sem-decision-ink', chip: 'bg-sem-decision/10 border-sem-decision/50 text-sem-decision-ink' },
};

/** Formula text: prominent, wraps instead of overflowing. */
export const formulaClass = 'font-mono text-sem-formula-ink [overflow-wrap:anywhere] leading-snug';

/**
 * The DP recurrence as condition → formula → action, one compact row per case.
 * Rendered inside "How it works", so there is no separate DP panel before the demo.
 */
export const DpCases: React.FC<{ brief: DpBrief }> = ({ brief }) => (
  <div className="flex flex-col gap-1.5" aria-label="Recurrence cases">
    <h3 className="font-sans text-xs font-semibold text-chalk-400">{brief.cases.length > 1 ? 'Which formula fills a cell?' : 'The formula for each cell'}</h3>
    <ul className="flex flex-col gap-1.5">
      {brief.cases.map((c) => (
        <li key={c.label} className={`flex flex-col gap-1 pl-3 py-1.5 border-l-[3px] ${DP_TONE[c.tone].edge} bg-obsidian-900/60`}>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={`font-sans text-xs font-bold ${DP_TONE[c.tone].label}`}>{c.label}</span>
            <span className={`px-1.5 py-px border font-mono text-xs [overflow-wrap:anywhere] ${DP_TONE[c.tone].chip}`}>{c.condition}</span>
          </div>
          <span className={`${formulaClass} text-sm font-semibold`}>{c.formula}</span>
          <span className="font-sans text-xs text-chalk-400">→ {c.action}</span>
        </li>
      ))}
    </ul>
    {brief.details && brief.details.length > 0 && (
      <details>
        <summary className="cursor-pointer select-none font-sans text-xs text-chalk-400 hover:text-chalk-200">Worked example and more</summary>
        <dl className="mt-1.5 flex flex-col gap-1">
          {brief.details.map((d) => (
            <div key={d.label} className="font-sans text-xs leading-relaxed text-chalk-300">
              <dt className="inline font-semibold text-chalk-200">{d.label}: </dt>
              <dd className="inline">{d.text}</dd>
            </div>
          ))}
        </dl>
      </details>
    )}
  </div>
);
