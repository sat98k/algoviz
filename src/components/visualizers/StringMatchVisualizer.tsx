import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';

interface StringMatchVisualizerProps {
  step: AlgorithmStep;
}

export const StringMatchVisualizer: React.FC<StringMatchVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const text: string = state.text || '';
  const pattern: string = state.pattern || '';
  const lpsTable: number[] = state.lpsTable || [];
  const textIndex: number = state.textIndex ?? -1;
  const patternIndex: number = state.patternIndex ?? -1;
  const matchIndices: number[] = state.matchIndices || [];
  const phase = state.phase || 'lps';
  const comparison = state.currentComparison;

  return (
    <div className="flex flex-col items-center w-full min-h-[420px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Banner Details */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-3xl mb-5 gap-3">
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 bg-obsidian-950 border border-hairline text-chalk-300">
            PHASE: <strong className="text-amber-glow">{phase === 'lps' ? '1. CONSTRUCT LPS (π) TABLE' : '2. KMP SEARCH SCAN'}</strong>
          </span>
          <span className="px-3 py-1 bg-obsidian-950 border border-acid-500/40 text-acid-500">
            MATCHES: <strong>{matchIndices.length}</strong>
          </span>
        </div>

        {comparison && (
          <div
            className={`px-3 py-1 text-xs font-mono border flex items-center gap-2 ${
              comparison.isMatch
                ? 'bg-obsidian-950 border-acid-500/50 text-acid-500'
                : 'bg-obsidian-950 border-rose-500/50 text-rose-300'
            }`}
          >
            <span>'{comparison.textChar}'</span>
            <span>{comparison.isMatch ? '==' : '!='}</span>
            <span>'{comparison.patternChar}'</span>
            <strong>({comparison.isMatch ? 'MATCH' : 'MISMATCH'})</strong>
          </div>
        )}
      </div>

      {/* Main String Alignments Container */}
      <div className="w-full max-w-3xl flex flex-col gap-6 p-6 bg-obsidian-950 border border-hairline overflow-x-auto">
        {/* TEXT Ribbon */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-chalk-500">Target Text T[i]:</span>
          <div className="flex items-center gap-1.5">
            {text.split('').map((char, idx) => {
              const isCurrent = phase === 'search' && textIndex === idx;
              const isMatchedOccur = matchIndices.some((m) => idx >= m && idx < m + pattern.length);

              let cellStyle = 'bg-obsidian-850 border-hairline text-chalk-300';
              if (isCurrent) {
                cellStyle = comparison?.isMatch
                  ? 'bg-acid-500/25 border-acid-500 text-acid-500 font-bold scale-105'
                  : 'bg-rose-500/25 border-rose-500 text-rose-300 font-bold scale-105';
              } else if (isMatchedOccur) {
                cellStyle = 'bg-acid-500/15 border-acid-500/60 text-acid-500 font-semibold';
              }

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-10 flex items-center justify-center border text-sm font-mono transition-all duration-200 ${cellStyle}`}
                  >
                    {char}
                  </div>
                  <span className="text-[9px] font-mono text-chalk-600 mt-1 tabular-nums">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PATTERN Ribbon (Aligned with current search offset) */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-chalk-500">Pattern P[j]:</span>
          <div
            className="flex items-center gap-1.5 transition-all duration-300"
            style={{
              paddingLeft:
                phase === 'search' && textIndex >= 0 && patternIndex >= 0
                  ? `${(textIndex - patternIndex) * 42}px`
                  : '0px',
            }}
          >
            {pattern.split('').map((char, idx) => {
              const isCurrent = patternIndex === idx;

              let cellStyle = 'bg-obsidian-850 border-hairline text-chalk-300';
              if (isCurrent) {
                cellStyle = comparison?.isMatch
                  ? 'bg-acid-500/25 border-acid-500 text-acid-500 font-bold scale-105'
                  : 'bg-rose-500/25 border-rose-500 text-rose-300 font-bold scale-105';
              }

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-10 flex items-center justify-center border text-sm font-mono transition-all duration-200 ${cellStyle}`}
                  >
                    {char}
                  </div>
                  <span className="text-[9px] font-mono text-chalk-600 mt-1 tabular-nums">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* LPS Table Preview */}
        <div className="flex flex-col gap-2 pt-4 border-t border-hairline">
          <span className="text-xs font-mono uppercase tracking-wider text-amber-glow">LPS π[j] Prefix-Suffix Array:</span>
          <div className="flex items-center gap-1.5">
            {pattern.split('').map((char, idx) => {
              const lpsVal = lpsTable[idx] !== undefined ? lpsTable[idx] : '-';
              const isLpsActive = phase === 'lps' && patternIndex === idx;

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-8 flex items-center justify-center border text-xs font-mono font-bold transition-all ${
                      isLpsActive
                        ? 'bg-amber/25 border-amber text-amber-glow shadow-sm'
                        : 'bg-obsidian-850 border-hairline text-chalk-400'
                    }`}
                  >
                    {lpsVal}
                  </div>
                  <span className="text-[9px] font-mono text-chalk-500 mt-0.5">'{char}'</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-5 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-acid-500 border border-acid-400"></span>
          <span>Character Match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-rose-500 border border-rose-400"></span>
          <span>Character Mismatch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber border border-amber-glow"></span>
          <span>Active LPS Element</span>
        </div>
      </div>
    </div>
  );
};
