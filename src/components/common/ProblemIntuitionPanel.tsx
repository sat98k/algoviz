import React, { useId, useMemo, useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { GlossaryKey } from '../../config/glossary';
import { DpBrief } from '../../types/algorithm';
import { RichToken, RichTokens, richTokens } from './RichText';
import { DpCases } from './DpBriefPanel';

interface ProblemIntuitionPanelProps {
  problemStatement: string;
  /** Fallback "core idea" paragraph, used only when there are no core steps. */
  explanation: string;
  /** "How it works" steps, in order. Lines after the first that start with "- " are sub-points. */
  coreSteps?: string[];
  /** DP recurrence cases, shown under the steps. */
  dpBrief?: DpBrief;
  /** Glossary terms to link (first occurrence across the whole panel). */
  terms?: readonly GlossaryKey[];
}

interface StepTokens {
  main: RichToken[];
  subs: RichToken[][];
}

/** Tokens for the problem and every step, linking each glossary term only once on the panel. */
export const panelTokens = (problemStatement: string, explanation: string, coreSteps: string[] | undefined, terms?: readonly GlossaryKey[]) => {
  const used = new Set<GlossaryKey>();
  const problem = richTokens(problemStatement, terms, used);
  if (!coreSteps || coreSteps.length === 0) return { problem, steps: null, explanation: richTokens(explanation, terms, used) };
  const steps: StepTokens[] = coreSteps.map((step) => {
    const [first, ...rest] = step.split('\n');
    return {
      main: richTokens(first, terms, used),
      subs: rest.filter((l) => l.startsWith('- ')).map((l) => richTokens(l.slice(2), terms, used)),
    };
  });
  return { problem, steps, explanation: null };
};

/**
 * Before the visualization: the problem in a few sentences and how the algorithm works
 * as short numbered steps (plus the recurrence cases on DP pages). Collapsible so it
 * stays available but out of the way while stepping.
 */
export const ProblemIntuitionPanel: React.FC<ProblemIntuitionPanelProps> = ({ problemStatement, explanation, coreSteps, dpBrief, terms }) => {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();
  const tokens = useMemo(() => panelTokens(problemStatement, explanation, coreSteps, terms), [problemStatement, explanation, coreSteps, terms]);

  return (
    <section className="bg-obsidian-950 border border-hairline" aria-label="Problem and how it works">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 sm:px-4 text-left hover:bg-obsidian-900 transition-colors"
      >
        <span className="flex items-center gap-2 font-sans text-sm font-semibold text-chalk-200">
          <BookOpen className="w-3.5 h-3.5 text-amber" />
          Problem &amp; how it works
        </span>
        <span className="flex items-center gap-1 font-sans text-xs text-chalk-500">
          <span>{isOpen ? 'Hide' : 'Show'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div
          id={contentId}
          className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] divide-y md:divide-y-0 md:divide-x divide-hairline border-t border-hairline"
        >
          <div className="px-4 py-3 flex flex-col gap-1.5">
            <h2 className="font-sans text-sm font-semibold text-chalk-400">The problem</h2>
            <p className="font-sans text-[15px] leading-relaxed text-chalk-100">
              <RichTokens tokens={tokens.problem} />
            </p>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2.5">
            <h2 className="font-sans text-sm font-semibold text-chalk-400">How it works</h2>
            {tokens.steps ? (
              <ol className="flex flex-col gap-1.5">
                {tokens.steps.map((step, i) => (
                  <li key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-1.5 font-sans text-[15px] leading-snug text-chalk-200">
                    <span aria-hidden="true" className="mt-px w-5 h-5 flex items-center justify-center bg-obsidian-850 border border-hairline text-xs font-semibold text-chalk-300 tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="sr-only">Step {i + 1}: </span>
                      <RichTokens tokens={step.main} />
                      {step.subs.length > 0 && (
                        <ul className="mt-1 flex flex-col gap-0.5 list-disc pl-5 marker:text-chalk-500">
                          {step.subs.map((sub, j) => (
                            <li key={j}>
                              <RichTokens tokens={sub} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="font-sans text-[15px] leading-relaxed text-chalk-200">
                <RichTokens tokens={tokens.explanation!} />
              </p>
            )}
            {dpBrief && <DpCases brief={dpBrief} />}
          </div>
        </div>
      )}
    </section>
  );
};
