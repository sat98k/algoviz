import React from 'react';
import { Hourglass } from 'lucide-react';
import { ResultSummarizer } from '../../types/algorithm';
import { ResultPanel } from './ResultPanel';

interface FinalAnswerCardProps {
  /** True only on the algorithm's final step. */
  isFinal: boolean;
  /** The final step's result; ignored until `isFinal`. */
  result: unknown;
  summarizer?: ResultSummarizer;
  inputs?: Record<string, any>;
  stepNumber: number;
  totalSteps: number;
}

/**
 * The answer slot right after the visual stage. Derived purely from the current step,
 * so restarting or changing inputs returns it to the placeholder automatically.
 */
export const FinalAnswerCard: React.FC<FinalAnswerCardProps> = ({ isFinal, result, summarizer, inputs, stepNumber, totalSteps }) => {
  if (isFinal) {
    return <ResultPanel result={result} title="Final answer" isFinal summarizer={summarizer} inputs={inputs} />;
  }
  return (
    <section
      aria-label="Final answer"
      className="sp-card flex items-start gap-3 text-chalk-300"
    >
      <Hourglass className="w-4 h-4 mt-1 shrink-0" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <span className="sp-label">Final answer</span>
        <span className="font-sans text-sm">
          The answer appears here when the algorithm finishes. You are on step {stepNumber} of {totalSteps}.
        </span>
      </div>
    </section>
  );
};
