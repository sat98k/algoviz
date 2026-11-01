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
    className="sp-card sp-card-now flex flex-col gap-2"
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="step-explanation-heading" className="sp-label">
        <MessageSquareText className="w-4 h-4" />
        What happened and why?
      </h2>
      <span className="sp-meta">
        Step <strong className="text-chalk-100 tabular-nums">{stepNumber}</strong> of <span className="tabular-nums">{totalSteps}</span>
      </span>
    </div>
    <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-1">
      <h3 className="sp-title break-words">
        <RichText text={step.title} />
      </h3>
      <p className="sp-body whitespace-pre-line break-words">
        <RichText text={step.description} terms={glossaryTerms} />
      </p>
    </div>
  </section>
);
