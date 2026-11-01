import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { AlgorithmStep } from '../../types/algorithm';
import { revealActiveLines } from '../../utils/codeScroll';

interface CodeExplanationProps {
  step: AlgorithmStep;
  pseudocode: string[];
  /** Tailwind max-height class for the scrolling code area. */
  maxHeightClass?: string;
}

export const activeLinesOf = (codeLine: AlgorithmStep['codeLine']): number[] =>
  Array.isArray(codeLine) ? codeLine : codeLine ? [codeLine] : [];

/**
 * Pseudocode with the current step's lines highlighted. The step title and description
 * live in "What happened and why?", so this panel shows only the code.
 *
 * Auto-scroll is container-only: when the step changes and its lines are outside the
 * visible code area, only this panel's scrollTop moves. The page never scrolls, and
 * manual scrolling of the code is left alone until the next step change.
 */
export const CodeExplanation: React.FC<CodeExplanationProps> = ({ step, pseudocode, maxHeightClass = 'max-h-80' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLines = activeLinesOf(step.codeLine);
  const activeKey = activeLines.join(',');

  useEffect(() => {
    if (containerRef.current && activeLines.length > 0) revealActiveLines(containerRef.current, activeLines);
    // Re-run only when the step or its lines change, never on unrelated renders.
  }, [step.stepIndex, activeKey, pseudocode]);

  if (!pseudocode || pseudocode.length === 0) return null;

  const activeLineText =
    activeLines.length === 0
      ? null
      : activeLines.length === 1
      ? `Line ${activeLines[0]}`
      : `Lines ${activeLines[0]}–${activeLines[activeLines.length - 1]}`;

  return (
    <section aria-label="Pseudocode" className="sp-card flex flex-col gap-3 w-full min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="sp-label">
          <Terminal className="w-4 h-4" aria-hidden />
          Pseudocode
        </h2>
        {activeLineText && (
          <span className="font-mono text-xs px-3 py-1 rounded-full bg-sem-current/15 text-sem-current-ink font-bold">
            {activeLineText}
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        data-testid="pseudocode-scroll"
        className={`relative p-1.5 rounded-2xl bg-obsidian-950 font-mono overflow-y-auto overflow-x-hidden overscroll-contain leading-relaxed ${maxHeightClass}`}
      >
        {pseudocode.map((line, idx) => {
          const lineNum = idx + 1;
          const isActive = activeLines.includes(lineNum);

          // Code and comment are styled separately; comments are supporting text.
          const commentIdx = line.indexOf('//');
          const codePart = commentIdx === -1 ? line : line.substring(0, commentIdx);
          const commentPart = commentIdx === -1 ? '' : line.substring(commentIdx);

          return (
            <div
              key={lineNum}
              id={`pseudocode-line-${lineNum}`}
              data-line-num={lineNum}
              className={`grid grid-cols-[auto_1fr] items-start px-2 py-1 rounded-xl transition-colors duration-200 ${
                isActive ? 'bg-sem-current/15 text-sem-current-ink font-semibold' : 'text-chalk-200'
              }`}
            >
              <span
                className={`w-7 shrink-0 text-xs select-none mr-2 tabular-nums text-right pt-px ${
                  isActive ? 'text-sem-current-ink font-bold' : 'text-chalk-500'
                }`}
              >
                {lineNum}
              </span>
              <div className="whitespace-pre-wrap break-words min-w-0">
                <span className="text-sm">{codePart}</span>
                {commentPart && (
                  <span
                    className={`font-sans block sm:inline sm:ml-2 text-sm italic ${
                      isActive ? 'text-chalk-100 font-medium' : 'text-chalk-400 font-normal'
                    }`}
                  >
                    {commentPart}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
