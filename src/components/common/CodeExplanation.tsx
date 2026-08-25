import React from 'react';
import { Terminal } from 'lucide-react';
import { AlgorithmStep } from '../../types/algorithm';

interface CodeExplanationProps {
  step: AlgorithmStep;
  pseudocode: string[];
}

export const CodeExplanation: React.FC<CodeExplanationProps> = ({ step, pseudocode }) => {
  const activeLine = step.codeLine;

  return (
    <div className="flex flex-col gap-4 p-5 bg-obsidian-900 border border-hairline">
      {/* Current Step Title & Explanation */}
      <div className="flex flex-col gap-2 pb-4 border-b border-hairline">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-amber">
              STEP {String(step.stepIndex + 1).padStart(2, '0')} // EXECUTION STATE
            </span>
          </div>
        </div>

        <h3 className="font-display font-bold text-lg text-chalk-100 mt-1">
          {step.title}
        </h3>

        <p className="text-xs text-chalk-400 font-sans leading-relaxed">
          {step.description}
        </p>
      </div>

      {/* Pseudocode Box with active line highlighting */}
      {pseudocode && pseudocode.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-chalk-500 pb-1">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-chalk-400" />
              <span className="uppercase tracking-wider">FORMAL PSEUDOCODE</span>
            </div>
            {activeLine && (
              <span className="text-amber-glow font-bold">
                ACTIVE LINE: {activeLine}
              </span>
            )}
          </div>

          <div className="p-3.5 bg-obsidian-950 border border-hairline font-mono text-xs overflow-x-auto max-h-64 leading-relaxed">
            {pseudocode.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = activeLine === lineNum;

              return (
                <div
                  key={lineNum}
                  className={`flex items-start px-2 py-0.5 transition-colors ${
                    isActive
                      ? 'bg-amber/15 text-amber-glow font-semibold border-l-2 border-amber'
                      : 'text-chalk-400 hover:text-chalk-200'
                  }`}
                >
                  <span className="w-6 text-[10px] text-chalk-600 select-none mr-2 font-mono tabular-nums">
                    {String(lineNum).padStart(2, '0')}
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

