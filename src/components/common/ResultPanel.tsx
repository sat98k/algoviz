import React, { useMemo, useState } from 'react';
import { CheckCircle2, Copy, Check, ChevronRight } from 'lucide-react';
import { ResultSummarizer } from '../../types/algorithm';
import { buildResultSummary } from '../../utils/resultSummary';

interface ResultPanelProps {
  result: any;
  title?: string;
  isFinal?: boolean;
  /** Algorithm-specific formatter (AlgorithmConfig.summarizeResult); falls back to a generic summary. */
  summarizer?: ResultSummarizer;
  /** Inputs that produced the result, available to the summarizer. */
  inputs?: Record<string, any>;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  title = 'Final answer',
  isFinal = false,
  summarizer,
  inputs,
}) => {
  const [copied, setCopied] = useState(false);
  const summary = useMemo(() => buildResultSummary(result, summarizer, inputs), [result, summarizer, inputs]);

  if (!result && !isFinal) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section aria-label={title} className="flex flex-col gap-4 p-5 bg-obsidian-900 border border-sem-final/50 border-l-4 border-l-sem-final">
      <div className="flex items-center gap-2 pb-3 border-b border-hairline">
        <CheckCircle2 className="w-3.5 h-3.5 text-sem-final-ink" />
        <h3 className="font-mono text-xs uppercase tracking-widest text-sem-final-ink font-semibold">
          {title}
        </h3>
      </div>

      {/* Learner-facing summary */}
      <p className="font-sans text-sm sm:text-base leading-relaxed text-chalk-100 font-medium break-words">
        {summary.headline}
      </p>

      {summary.details && summary.details.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {summary.details.map((d) => (
            <div key={d.label} className="flex flex-col py-1 border-b border-hairline/50 min-w-0">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-chalk-500">{d.label}</dt>
              <dd className="font-mono text-chalk-200 break-all">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {summary.table && summary.table.rows.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {summary.table.caption && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-chalk-500">
              {summary.table.caption}
            </span>
          )}
          <div className="overflow-x-auto max-h-64 overflow-y-auto border border-hairline bg-obsidian-950">
            <table className="w-full text-left font-mono text-xs">
              <thead className="sticky top-0 bg-obsidian-850">
                <tr>
                  {summary.table.columns.map((col) => (
                    <th key={col} className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-chalk-400 font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.table.rows.map((row, i) => (
                  <tr key={i} className="border-t border-hairline/50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-chalk-200 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw result kept available but collapsed */}
      {result !== undefined && result !== null && (
        <details className="group border border-hairline bg-obsidian-950">
          <summary className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer select-none font-mono text-[11px] uppercase tracking-wider text-chalk-400 hover:text-chalk-200 list-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
              View technical result (raw data)
            </span>
          </summary>
          <div className="flex flex-col gap-2 px-3 pb-3 border-t border-hairline pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="self-end flex items-center gap-1.5 px-3 py-1 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 border border-hairline text-xs font-mono transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-acid-500" /> COPIED
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-chalk-400" /> COPY JSON
                </>
              )}
            </button>
            <div className="font-mono text-xs text-chalk-200 overflow-x-auto max-h-56 leading-relaxed">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        </details>
      )}
    </section>
  );
};
