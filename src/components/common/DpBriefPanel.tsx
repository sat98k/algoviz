import React, { useId, useState } from 'react';
import { ChevronDown, Table2 } from 'lucide-react';
import { DpBrief, DpTone } from '../../types/algorithm';

/** Tone → classes (written out in full so Tailwind keeps them). */
export const DP_TONE: Record<DpTone, { edge: string; label: string; chip: string }> = {
  match: { edge: 'border-t-sem-match', label: 'text-sem-match-ink', chip: 'bg-sem-match/10 border-sem-match/50 text-sem-match-ink' },
  mismatch: { edge: 'border-t-sem-mismatch', label: 'text-sem-mismatch-ink', chip: 'bg-sem-mismatch/10 border-sem-mismatch/50 text-sem-mismatch-ink' },
  current: { edge: 'border-t-sem-current', label: 'text-sem-current-ink', chip: 'bg-sem-current/10 border-sem-current/50 text-sem-current-ink' },
  compare: { edge: 'border-t-sem-compare', label: 'text-sem-compare-ink', chip: 'bg-sem-compare/10 border-sem-compare/50 text-sem-compare-ink' },
  decision: { edge: 'border-t-sem-decision', label: 'text-sem-decision-ink', chip: 'bg-sem-decision/10 border-sem-decision/50 text-sem-decision-ink' },
};

/** Formula text: prominent, wraps instead of overflowing. */
export const formulaClass = 'font-mono text-sem-formula-ink [overflow-wrap:anywhere] leading-snug';

const Fact: React.FC<{ q: string; children: React.ReactNode }> = ({ q, children }) => (
  <div className="flex flex-col gap-0.5 p-2.5 bg-obsidian-900 border border-hairline min-w-0">
    <dt className="font-sans text-[11px] font-semibold text-chalk-400">{q}</dt>
    <dd className="font-sans text-xs leading-snug text-chalk-200 [overflow-wrap:anywhere]">{children}</dd>
  </div>
);

/** Compact visual DP rules: cell meaning, condition → formula → action per case, and three short facts. */
export const DpBriefPanel: React.FC<{ brief: DpBrief }> = ({ brief }) => {
  const [open, setOpen] = useState(true);
  const contentId = useId();

  return (
    <section aria-label="Table rules" className="bg-obsidian-950 border border-hairline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 sm:px-4 text-left hover:bg-obsidian-900 transition-colors"
      >
        <span className="flex items-center gap-2 font-sans text-sm font-semibold text-chalk-200">
          <Table2 className="w-3.5 h-3.5 text-amber" /> Table rules
        </span>
        <span className="flex items-center gap-1 font-sans text-xs text-chalk-500">
          {open ? 'Hide' : 'Show'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div id={contentId} className="flex flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 border-t border-hairline">
          {/* What does a cell mean? */}
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-sans text-sm text-chalk-200">
            <span className="text-[11px] font-semibold text-chalk-400">What does a cell mean?</span>
            <span className={`${formulaClass} text-base font-bold`}>{brief.cell}</span>
            <span>= {brief.state.charAt(0).toLowerCase() + brief.state.slice(1)}</span>
          </p>

          {/* When do we use this formula? */}
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-[11px] font-semibold text-chalk-400">When do we use this formula?</span>
            <ol className={`grid grid-cols-1 gap-2 ${brief.cases.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {brief.cases.map((c, idx) => (
                <li key={c.label} className={`flex flex-col gap-1.5 p-3 bg-obsidian-900 border border-hairline border-t-2 ${DP_TONE[c.tone].edge} min-w-0`}>
                  <span className={`font-sans text-xs font-bold ${DP_TONE[c.tone].label}`}>
                    {brief.cases.length > 1 ? `Case ${idx + 1} · ` : ''}
                    {c.label}
                  </span>
                  <span className={`self-start px-1.5 py-0.5 border font-mono text-xs [overflow-wrap:anywhere] ${DP_TONE[c.tone].chip}`}>{c.condition}</span>
                  <span className={`${formulaClass} text-[15px] sm:text-base font-semibold`}>{c.formula}</span>
                  <span className="font-sans text-xs text-chalk-400">→ {c.action}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Base case · fill order · answer */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Fact q="Where does it start?">{brief.baseCase}</Fact>
            <Fact q="How do we fill the table?">{brief.fillOrder}</Fact>
            <Fact q="Where is the answer?">{brief.answer}</Fact>
          </dl>

          {brief.details && brief.details.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer select-none font-sans text-xs text-chalk-400 hover:text-chalk-200">
                Worked example and more
              </summary>
              <dl className="mt-2 flex flex-col gap-1.5">
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
      )}
    </section>
  );
};
