import React, { useId, useMemo, useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { GlossaryKey } from '../../config/glossary';
import { OwlBriefing } from '../../config/owlBriefings';
import { DpBrief } from '../../types/algorithm';
import { RichToken, RichTokens, richTokens } from './RichText';
import { DpCases } from './DpBriefPanel';
import { OwlBriefingReveal } from './OwlBriefingReveal';

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
  /** The owl's plain-language briefing. When present, the owl explains the problem and the procedure first. */
  briefing?: OwlBriefing;
}

interface StepTokens {
  main: RichToken[];
  subs: RichToken[][];
}

/** Tokens for the problem and every step, linking each glossary term only once on the panel. */
export const panelTokens = (
  problemStatement: string,
  explanation: string,
  coreSteps: string[] | undefined,
  terms?: readonly GlossaryKey[],
  used: Set<GlossaryKey> = new Set()
) => {
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

/** Tokens for the owl's briefing, sharing `used` so a term is linked where it first appears. */
const briefingTokens = (b: OwlBriefing, terms: readonly GlossaryKey[] | undefined, used: Set<GlossaryKey>) => ({
  story: richTokens(b.story, terms, used),
  goal: richTokens(b.goal, terms, used),
  example: b.example ? richTokens(b.example, terms, used) : null,
  overview: b.overview.map((s) => ({ title: s.title, text: richTokens(s.text, terms, used) })),
  insight: richTokens(b.insight, terms, used),
  watch: b.watch.map((w) => richTokens(w, terms, used)),
});

/** The numbered short steps (also the numbering of the roadmap chips in the playback dock). */
const StepList: React.FC<{ steps: StepTokens[] }> = ({ steps }) => (
  <ol className="flex flex-col gap-1.5">
    {steps.map((step, i) => (
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
);

/**
 * Before the visualization: the problem and how the algorithm works. With a briefing, the
 * 🦉 owl tells the problem as a story while it flows in, then the whole procedure appears stage
 * by stage (OwlBriefingReveal). Without one, the classic problem + numbered steps layout.
 */
export const ProblemIntuitionPanel: React.FC<ProblemIntuitionPanelProps> = ({ problemStatement, explanation, coreSteps, dpBrief, terms, briefing }) => {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();
  const { tokens, owl } = useMemo(() => {
    const used = new Set<GlossaryKey>();
    const owl = briefing ? briefingTokens(briefing, terms, used) : null;
    return { owl, tokens: panelTokens(problemStatement, explanation, coreSteps, terms, used) };
  }, [problemStatement, explanation, coreSteps, terms, briefing]);

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
          {owl ? (
            <span aria-hidden className="text-base leading-none">
              🦉
            </span>
          ) : (
            <BookOpen className="w-3.5 h-3.5 text-amber" />
          )}
          {owl ? 'The owl explains: Problem & how it works' : 'Problem & how it works'}
        </span>
        <span className="flex items-center gap-1 font-sans text-xs text-chalk-500">
          <span>{isOpen ? 'Hide' : 'Show'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && owl && (
        <div id={contentId}>
          <OwlBriefingReveal owl={owl} problem={tokens.problem} dpBrief={dpBrief} />
        </div>
      )}

      {isOpen && !owl && (
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
              <StepList steps={tokens.steps} />
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
