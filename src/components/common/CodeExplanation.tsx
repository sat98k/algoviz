import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { AlgorithmStep } from '../../types/algorithm';

interface CodeExplanationProps {
  step: AlgorithmStep;
  pseudocode: string[];
  hideStepHeader?: boolean;
}

export const CodeExplanation: React.FC<CodeExplanationProps> = ({ step, pseudocode, hideStepHeader = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLines: number[] = Array.isArray(step.codeLine)
    ? step.codeLine
    : step.codeLine
    ? [step.codeLine]
    : [];

  // Auto-scroll active line into view smoothly if pseudocode overflows
  useEffect(() => {
    if (activeLines.length > 0 && containerRef.current) {
      const firstActiveLineEl = containerRef.current.querySelector<HTMLElement>(
        `[data-line-num="${activeLines[0]}"]`
      );
      if (firstActiveLineEl) {
        firstActiveLineEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [step.stepIndex, activeLines]);

  const activeLineText =
    activeLines.length > 0
      ? activeLines.length === 1
        ? `LINE ${activeLines[0]}`
        : `LINES ${activeLines[0]}–${activeLines[activeLines.length - 1]}`
      : null;

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 bg-obsidian-900 border border-hairline w-full">
      {/* Current Step Title & Explanation */}
      {!hideStepHeader && (
        <div className="flex flex-col gap-2 pb-3 border-b border-hairline">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber animate-pulse"></span>
              <span className="font-mono text-xs uppercase tracking-wider text-amber font-semibold">
                STEP {step.stepIndex + 1} • EXECUTION STATE
              </span>
            </div>
            {activeLineText && (
              <span className="font-mono text-[11px] px-2 py-0.5 bg-amber/10 border border-amber/30 text-amber-glow font-bold">
                {activeLineText}
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-base sm:text-lg text-chalk-100 mt-0.5">
            {step.title}
          </h3>

          <p className="text-xs text-chalk-300 font-sans leading-relaxed">
            {step.description}
          </p>
        </div>
      )}

      {/* Pseudocode Box with active line highlighting */}
      {pseudocode && pseudocode.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-chalk-500 pb-1">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber" />
              <span className="uppercase tracking-wider font-semibold text-chalk-300">
                ALGORITHM PSEUDOCODE
              </span>
            </div>
            {activeLineText && hideStepHeader && (
              <span className="font-mono text-[10px] px-2 py-0.5 bg-amber/15 border border-amber/40 text-amber font-bold">
                ACTIVE: {activeLineText}
              </span>
            )}
          </div>

          <div
            ref={containerRef}
            className="p-3 bg-obsidian-950 border border-hairline font-mono text-xs overflow-y-auto overflow-x-hidden max-h-72 sm:max-h-80 leading-relaxed rounded-none shadow-inner"
          >
            {pseudocode.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = activeLines.includes(lineNum);

              // Split code and comment if present for subtle syntax highlighting
              const commentIdx = line.indexOf('//');
              let codePart = line;
              let commentPart = '';
              if (commentIdx !== -1) {
                codePart = line.substring(0, commentIdx);
                commentPart = line.substring(commentIdx);
              }

              return (
                <div
                  key={lineNum}
                  id={`pseudocode-line-${lineNum}`}
                  data-line-num={lineNum}
                  className={`grid grid-cols-[auto_1fr] items-start px-2 py-1 transition-all duration-200 rounded-none group ${
                    isActive
                      ? 'bg-amber/20 text-amber-glow font-semibold border-l-4 border-amber pl-2.5 shadow-sm shadow-amber/10'
                      : 'text-chalk-300 hover:text-chalk-100 hover:bg-obsidian-900/50'
                  }`}
                >
                  <span
                    className={`w-7 shrink-0 text-[10px] select-none mr-2 font-mono tabular-nums text-right pr-1 pt-0.5 ${
                      isActive ? 'text-amber font-bold' : 'text-chalk-600 group-hover:text-chalk-400'
                    }`}
                  >
                    {String(lineNum).padStart(2, '0')}
                  </span>
                  <div className="whitespace-pre-wrap break-words min-w-0 pl-1">
                    <span className="font-mono text-[11px] sm:text-xs">{codePart}</span>
                    {commentPart && (
                      <span
                        className={`font-sans block sm:inline sm:ml-2 text-[10px] sm:text-[11px] font-medium leading-normal transition-colors ${
                          isActive ? 'text-chalk-100 italic drop-shadow-sm' : 'text-chalk-400 italic font-normal'
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
        </div>
      )}
    </div>
  );
};

