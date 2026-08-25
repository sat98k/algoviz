import React from 'react';
import { BookOpen, Terminal } from 'lucide-react';
import { AlgorithmStep } from '../../types/algorithm';

interface CodeExplanationProps {
  step: AlgorithmStep;
  pseudocode: string[];
}

export const CodeExplanation: React.FC<CodeExplanationProps> = ({ step, pseudocode }) => {
  const activeLine = step.codeLine;

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
      {/* Current Step Title & Explanation */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Step {step.stepIndex + 1}: {step.title}
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans mt-0.5">
          {step.description}
        </p>
      </div>

      {/* Pseudocode Box with active line highlighting */}
      {pseudocode && pseudocode.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Terminal className="w-3 h-3 text-slate-500" />
            <span>Algorithm Pseudocode</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto max-h-56 leading-5">
            {pseudocode.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = activeLine === lineNum;

              return (
                <div
                  key={lineNum}
                  className={`flex items-start px-2 py-0.5 rounded transition-colors ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span className="w-6 text-[10px] text-slate-600 select-none mr-2">
                    {lineNum}
                  </span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
