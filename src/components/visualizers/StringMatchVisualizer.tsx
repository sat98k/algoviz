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
    <div className="flex flex-col items-center w-full min-h-[420px] p-6 bg-slate-900/90 rounded-xl border border-slate-800 backdrop-blur">
      {/* Top Banner Details */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-3xl mb-5">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-full text-slate-300">
            Phase: <strong className="text-sky-300">{phase === 'lps' ? '1. Construct LPS Table' : '2. String Search'}</strong>
          </span>
          <span className="px-3 py-1 bg-emerald-950/70 border border-emerald-500/40 rounded-full text-emerald-300">
            Matches Found: <strong>{matchIndices.length}</strong>
          </span>
        </div>

        {comparison && (
          <div
            className={`px-3 py-1 rounded-md text-xs font-mono border flex items-center gap-2 ${
              comparison.isMatch
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500 text-rose-300'
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
      <div className="w-full max-w-3xl flex flex-col gap-6 p-5 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
        {/* TEXT Ribbon */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono font-semibold text-slate-400">Target Text (T):</span>
          <div className="flex items-center gap-1.5">
            {text.split('').map((char, idx) => {
              const isCurrent = phase === 'search' && textIndex === idx;
              const isMatchedOccur = matchIndices.some((m) => idx >= m && idx < m + pattern.length);

              let cellStyle = 'bg-slate-900 border-slate-700 text-slate-300';
              if (isCurrent) {
                cellStyle = comparison?.isMatch
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold scale-110 shadow-lg shadow-emerald-500/20'
                  : 'bg-rose-500/30 border-rose-400 text-rose-200 font-bold scale-110 shadow-lg shadow-rose-500/20';
              } else if (isMatchedOccur) {
                cellStyle = 'bg-emerald-900/40 border-emerald-500/60 text-emerald-300';
              }

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-10 flex items-center justify-center rounded-md border text-sm font-mono transition-all duration-200 ${cellStyle}`}
                  >
                    {char}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-1">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PATTERN Ribbon (Aligned with current search offset) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono font-semibold text-slate-400">Pattern (P):</span>
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

              let cellStyle = 'bg-slate-900 border-slate-700 text-slate-300';
              if (isCurrent) {
                cellStyle = comparison?.isMatch
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold scale-110 shadow-lg shadow-emerald-500/20'
                  : 'bg-rose-500/30 border-rose-400 text-rose-200 font-bold scale-110 shadow-lg shadow-rose-500/20';
              }

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-10 flex items-center justify-center rounded-md border text-sm font-mono transition-all duration-200 ${cellStyle}`}
                  >
                    {char}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-1">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* LPS Table Preview */}
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
          <span className="text-xs font-mono font-semibold text-sky-400">LPS (π) Array:</span>
          <div className="flex items-center gap-1.5">
            {pattern.split('').map((char, idx) => {
              const lpsVal = lpsTable[idx] !== undefined ? lpsTable[idx] : '-';
              const isLpsActive = phase === 'lps' && patternIndex === idx;

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-8 flex items-center justify-center rounded-md border text-xs font-mono font-bold transition-all ${
                      isLpsActive
                        ? 'bg-sky-500/30 border-sky-400 text-sky-200 shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {lpsVal}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5">'{char}'</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500/40 border border-emerald-400"></span>
          <span>Character Match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-rose-500/40 border border-rose-400"></span>
          <span>Character Mismatch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-sky-500/40 border border-sky-400"></span>
          <span>Active LPS Element</span>
        </div>
      </div>
    </div>
  );
};
