import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { AlgorithmStep } from '../../types/algorithm';
import { GlossaryKey } from '../../config/glossary';
import { GlossaryText } from './GlossaryText';

interface StepExplanationProps {
  step: AlgorithmStep;
  stepNumber: number;
  totalSteps: number;
  glossaryTerms?: readonly GlossaryKey[];
}

const lineLabel = (codeLine: AlgorithmStep['codeLine']) => {
  if (codeLine === undefined) return null;
  const lines = Array.isArray(codeLine) ? codeLine : [codeLine];
  if (lines.length === 0) return null;
  return lines.length === 1 ? `Pseudocode line ${lines[0]}` : `Pseudocode lines ${lines[0]}–${lines[lines.length - 1]}`;
};

/**
 * "What happened and why?" — the current step's title and full explanation, shown
 * directly under the visualization in every layout and at every screen width.
 */
export const StepExplanation: React.FC<StepExplanationProps> = ({ step, stepNumber, totalSteps, glossaryTerms }) => {
  const line = lineLabel(step.codeLine);
  return (
    <section
      aria-labelledby="step-explanation-heading"
      className="flex flex-col gap-2 p-4 sm:p-5 bg-obsidian-950 border border-amber/40 border-l-4 border-l-amber"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="step-explanation-heading"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider font-bold text-amber"
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          What happened and why?
        </h2>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-chalk-400">
          <span>
            Step <strong className="text-chalk-100 tabular-nums">{stepNumber}</strong> of{' '}
            <span className="tabular-nums">{totalSteps}</span>
          </span>
          {line && (
            <span className="px-2 py-0.5 border border-hairline bg-obsidian-900 text-amber-glow">{line}</span>
          )}
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-1.5">
        <h3 className="font-display font-bold text-base sm:text-lg leading-snug text-chalk-100 break-words">{step.title}</h3>
        <p className="font-sans text-sm sm:text-[15px] leading-relaxed text-chalk-200 whitespace-pre-line break-words">
          <GlossaryText text={step.description} terms={glossaryTerms} />
        </p>
      </div>
    </section>
  );
};
