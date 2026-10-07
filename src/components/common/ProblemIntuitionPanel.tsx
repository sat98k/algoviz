import React, { useId, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Lightbulb, Target } from 'lucide-react';
import { GlossaryKey, linkGlossaryTerms } from '../../config/glossary';
import { GlossaryText } from './GlossaryText';

interface ProblemIntuitionPanelProps {
  problemStatement: string;
  explanation: string;
  /** Glossary terms to link (first occurrence across both paragraphs). */
  terms?: readonly GlossaryKey[];
}

/**
 * Pre-visualization learning panel: shows the registry's problem statement and
 * core idea so learners know what is being solved before watching execution.
 * Collapsible so it stays available (but out of the way) while stepping.
 */
export const ProblemIntuitionPanel: React.FC<ProblemIntuitionPanelProps> = ({
  problemStatement,
  explanation,
  terms,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();
  // Terms already linked in the problem statement aren't linked again in the core idea.
  const linkedInProblem = useMemo(
    () =>
      new Set(
        linkGlossaryTerms(problemStatement, terms)
          .map((seg) => seg.termKey)
          .filter((k): k is GlossaryKey => !!k)
      ),
    [problemStatement, terms]
  );

  return (
    <section className="bg-obsidian-950 border border-hairline shadow-sm" aria-label="Problem and intuition">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 sm:px-4 text-left hover:bg-obsidian-900 transition-colors"
      >
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider font-bold text-chalk-200">
          <BookOpen className="w-3.5 h-3.5 text-amber" />
          Problem &amp; Intuition
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-chalk-500">
          <span>{isOpen ? 'Hide' : 'Show'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div
          id={contentId}
          className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-hairline border-t border-hairline"
        >
          <div className="p-3 sm:p-4 flex flex-col gap-1.5">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-chalk-500 flex items-center gap-1.5">
              <Target className="w-3 h-3 text-amber" /> 1. The Problem
            </h2>
            <p className="font-sans text-sm leading-relaxed text-chalk-200">
              <GlossaryText text={problemStatement} terms={terms} />
            </p>
          </div>
          <div className="p-3 sm:p-4 flex flex-col gap-1.5">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-chalk-500 flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3 text-amber-glow" /> 2. Core Idea
            </h2>
            <p className="font-sans text-sm leading-relaxed text-chalk-300">
              <GlossaryText text={explanation} terms={terms} exclude={linkedInProblem} />
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
