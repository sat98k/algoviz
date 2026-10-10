import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { AlgorithmStep } from '../../types/algorithm';
import { GlossaryKey } from '../../config/glossary';
import { RichText } from './RichText';

interface StepExplanationProps {
  step: AlgorithmStep;
  stepNumber: number;
  totalSteps: number;
  glossaryTerms?: readonly GlossaryKey[];
}

/**
 * "What happened and why?": the current step's title and full explanation, shown
 * directly under the visualization in every layout and at every screen width. The
 * active pseudocode line is shown on the pseudocode panel, not repeated here.
 */
export const StepExplanation: React.FC<StepExplanationProps> = ({ step, stepNumber, totalSteps, glossaryTerms }) => (
  <section
    aria-labelledby="step-explanation-heading"
    className="flex flex-col gap-1.5 px-4 py-3 sm:px-5 sm:py-4 bg-obsidian-950 border border-hairline border-l-4 border-l-sem-current"
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="step-explanation-heading" className="flex items-center gap-1.5 font-sans text-sm font-semibold text-chalk-300">
        <MessageSquareText className="w-3.5 h-3.5 text-amber" />
        What happened and why?
      </h2>
      <span className="font-sans text-xs text-chalk-400">
        Step <strong className="text-chalk-100 tabular-nums">{stepNumber}</strong> of <span className="tabular-nums">{totalSteps}</span>
      </span>
    </div>
    <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-1">
      <h3 className="font-display font-bold text-base sm:text-lg leading-snug text-chalk-100 break-words">
        <RichText text={step.title} />
      </h3>
      <p className="font-sans text-[15px] sm:text-base leading-relaxed text-chalk-200 whitespace-pre-line break-words">
        <RichText text={step.description} terms={glossaryTerms} />
      </p>
    </div>
  </section>
);
