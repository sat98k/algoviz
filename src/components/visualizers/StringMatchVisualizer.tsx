import React, { useEffect, useRef } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, Hash } from 'lucide-react';

interface StringMatchVisualizerProps {
  step: AlgorithmStep;
}

export const StringMatchVisualizer: React.FC<StringMatchVisualizerProps> = ({ step }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const state = step.state || {};
  const text: string = state.text || '';
  const pattern: string = state.pattern || '';
  const lpsTable: number[] = state.lpsTable || [];
  const textIndex: number = state.textIndex ?? -1;
  const patternIndex: number = state.patternIndex ?? -1;
  const matchIndices: number[] = state.matchIndices || [];
  const verifiedIndices: number[] = state.verifiedIndices || [];
  const phase = state.phase || 'lps';
  const comparison = state.currentComparison;
  const hasLps = lpsTable.length > 0;
  const hashInfo = state.hashInfo;
  const rollingInfo = state.rollingInfo;

  const n = text.length;
  const m = pattern.length;

  // Safe normalized shift
  const shift = state.shift !== undefined
    ? state.shift
    : textIndex >= 0 && patternIndex >= 0
    ? textIndex - patternIndex
    : 0;

  const safeShift = Math.max(0, Math.min(shift, Math.max(0, n - m)));
  const isSearchPhase = phase === 'search';

  // Smooth auto-scroll to keep active comparison/window centered as search advances right
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeIdx = textIndex >= 0 ? textIndex : safeShift;
      const cellWidthWithGap = 42; // w-9 (36px) + gap-1.5 (6px)
      const activeLeft = activeIdx * cellWidthWithGap;
      const containerWidth = scrollContainerRef.current.clientWidth;

      // Keep target comfortably centered in the visible viewport
      const targetScroll = Math.max(0, activeLeft - containerWidth / 2 + cellWidthWithGap / 2);

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  }, [textIndex, safeShift, step.stepIndex]);

  return (
    <div className="flex flex-col items-center w-full min-h-[420px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Banner Details */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-4xl mb-4 gap-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 bg-obsidian-950 border border-hairline text-chalk-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse"></span>
            PHASE:{' '}
            <strong className="text-amber-glow">
              {hashInfo
                ? 'RABIN-KARP: ROLLING HASH FILTER'
                : !hasLps
                ? 'NAIVE: SLIDING WINDOW'
                : phase === 'lps'
                ? '1. CONSTRUCT LPS (π) TABLE'
                : '2. KMP ZERO-BACKTRACK SEARCH'}
            </strong>
          </span>
          <span className="px-3 py-1 bg-obsidian-950 border border-acid-500/40 text-acid-500">
            MATCHES FOUND: <strong>{matchIndices.length}</strong>
          </span>
          {isSearchPhase && (
            <span className="px-2.5 py-1 bg-obsidian-950 border border-hairline text-chalk-400">
              SHIFT: <strong className="text-chalk-100">s = {safeShift}</strong>
            </span>
          )}
        </div>

        {comparison && (
          <div
            className={`px-3 py-1 text-xs font-mono border flex items-center gap-2 ${
              comparison.isMatch
                ? 'bg-obsidian-950 border-acid-500/60 text-acid-400 shadow-sm shadow-acid-500/10'
                : 'bg-obsidian-950 border-rose-500/60 text-rose-300 shadow-sm shadow-rose-500/10'
            }`}
          >
            {comparison.isMatch ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-acid-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>'{comparison.textChar}'</span>
            <span>{comparison.isMatch ? '==' : '!='}</span>
            <span>'{comparison.patternChar}'</span>
            <strong className="uppercase">
              ({comparison.isMatch ? 'Character Match' : 'Character Mismatch'})
            </strong>
          </div>
        )}
      </div>

      {/* Main String Alignments Container with Auto-Scroll */}
      <div
        ref={scrollContainerRef}
        className="w-full max-w-4xl flex flex-col gap-6 p-6 bg-obsidian-950 border border-hairline overflow-x-auto relative shadow-inner select-none"
      >
        {/* Active Window Indicator Bar (Visual Bracket across text window) */}
        {isSearchPhase && m > 0 && (
          <div
            className="flex items-center gap-1.5 transition-all duration-300 pointer-events-none"
            style={{ paddingLeft: `${safeShift * 42}px` }}
          >
            <div
              className={`h-6 border flex items-center justify-between px-2 text-[10px] font-mono uppercase tracking-wider transition-colors duration-200 ${
                hashInfo
                  ? hashInfo.hashMatch
                    ? hashInfo.spurious
                      ? 'border-rose-500/70 bg-rose-500/10 text-rose-300'
                      : 'border-acid-500/70 bg-acid-500/10 text-acid-400'
                    : 'border-amber/50 bg-amber/5 text-chalk-400'
                  : 'border-amber/60 bg-amber/10 text-amber-glow'
              }`}
              style={{ width: `${m * 42 - 6}px` }}
            >
              <span>Window W_{safeShift}</span>
              <span>
                {hashInfo
                  ? hashInfo.hashMatch
                    ? hashInfo.spurious
                      ? 'COLLISION'
                      : 'HASH HIT'
                    : 'HASH MISMATCH'
                  : 'ACTIVE SLICE'}
              </span>
            </div>
          </div>
        )}

        {/* TARGET TEXT Ribbon */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-chalk-400 font-semibold">
              Target Text T[i] <span className="text-[10px] text-chalk-600">(Length {n})</span>:
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {text.split('').map((char, idx) => {
              const isInActiveWindow = isSearchPhase && idx >= safeShift && idx < safeShift + m;
              const isCurrentChar = isSearchPhase && textIndex === idx;
              const isVerifiedInWindow =
                isInActiveWindow && verifiedIndices.includes(idx - safeShift);
              const isMatchedOccur = matchIndices.some(
                (matchStart) => idx >= matchStart && idx < matchStart + m
              );
              const isLeaving = rollingInfo && rollingInfo.removedIndex === idx;
              const isIncoming = rollingInfo && rollingInfo.addedIndex === idx;

              let cellStyle = 'bg-obsidian-850 border-hairline text-chalk-400';
              let badgeText = '';
              let badgeClass = '';

              if (isMatchedOccur) {
                cellStyle = 'bg-acid-500/20 border-acid-500/80 text-acid-400 font-bold';
              } else if (isCurrentChar && comparison) {
                cellStyle = comparison.isMatch
                  ? 'bg-acid-500/30 border-acid-500 text-acid-300 font-bold scale-105 shadow-md shadow-acid-500/20 ring-1 ring-acid-400'
                  : 'bg-rose-500/30 border-rose-500 text-rose-200 font-bold scale-105 shadow-md shadow-rose-500/20 ring-1 ring-rose-400';
              } else if (isVerifiedInWindow) {
                cellStyle = 'bg-acid-500/15 border-acid-500/60 text-acid-400 font-semibold';
              } else if (isLeaving) {
                cellStyle = 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold ring-1 ring-rose-400/50';
                badgeText = '-OUT';
                badgeClass = 'text-rose-400 bg-rose-950/80 border-rose-500/40';
              } else if (isIncoming) {
                cellStyle = 'bg-electric-500/20 border-electric-400 text-electric-300 font-bold ring-1 ring-electric-400/50';
                badgeText = '+IN';
                badgeClass = 'text-electric-400 bg-electric-950/80 border-electric-500/40';
              } else if (isCurrentChar && !comparison) {
                // Focus / cursor on window or character without false-red mismatch
                cellStyle = 'bg-amber/20 border-amber text-amber-glow font-bold scale-105 shadow-sm shadow-amber/20';
              } else if (isInActiveWindow) {
                cellStyle = hashInfo?.hashMatch
                  ? 'bg-amber/15 border-amber/40 text-chalk-200 font-medium'
                  : 'bg-obsidian-800 border-hairline/80 text-chalk-300';
              }

              return (
                <div key={idx} className="flex flex-col items-center relative">
                  {badgeText && (
                    <span
                      className={`absolute -top-4 text-[8px] font-mono font-bold px-1 py-0.2 border rounded-none whitespace-nowrap z-10 ${badgeClass}`}
                    >
                      {badgeText}
                    </span>
                  )}
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

        {/* PATTERN Ribbon (Directly aligned with current window alignment) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-chalk-400 font-semibold">
            Pattern P[j] <span className="text-[10px] text-chalk-600">(Length {m})</span>:
          </span>
          <div
            className="flex items-center gap-1.5 transition-all duration-300"
            style={{
              paddingLeft: isSearchPhase ? `${safeShift * 42}px` : '0px',
            }}
          >
            {pattern.split('').map((char, idx) => {
              const isCurrent = patternIndex === idx;
              const isVerified = verifiedIndices.includes(idx);
              const isFullPatternMatched = verifiedIndices.length === m;

              let cellStyle = 'bg-obsidian-850 border-hairline text-chalk-400';

              if (isFullPatternMatched) {
                cellStyle = 'bg-acid-500/25 border-acid-500 text-acid-400 font-bold';
              } else if (isCurrent && comparison) {
                cellStyle = comparison.isMatch
                  ? 'bg-acid-500/30 border-acid-500 text-acid-300 font-bold scale-105 shadow-md shadow-acid-500/20'
                  : 'bg-rose-500/30 border-rose-500 text-rose-200 font-bold scale-105 shadow-md shadow-rose-500/20';
              } else if (isVerified) {
                cellStyle = 'bg-acid-500/15 border-acid-500/60 text-acid-400 font-semibold';
              } else if (isCurrent && !comparison) {
                // Active focus without false-red mismatch
                cellStyle = 'bg-amber/20 border-amber text-amber-glow font-bold scale-105';
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

        {/* LPS Table Preview (KMP) */}
        {hasLps && (
          <div className="flex flex-col gap-2 pt-4 border-t border-hairline">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-glow font-bold">
                LPS π[j] Prefix-Suffix Array:
              </span>
              <span className="text-[11px] font-mono text-chalk-500">
                LPS[j] = length of longest proper prefix of P[0…j] which is also a suffix
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
        )}

        {/* Rolling Hash Telemetry & Calculation Breakdown (Rabin-Karp) */}
        {hashInfo && (
          <div className="flex flex-col gap-3 pt-4 border-t border-hairline bg-obsidian-900/60 p-3.5 border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-glow font-bold flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber" />
                Rabin-Karp Rolling Hash Filter
              </span>
              <span className="text-[11px] font-mono text-chalk-400">
                Radix d = <strong className="text-chalk-200">{hashInfo.base}</strong> • Modulus q ={' '}
                <strong className="text-chalk-200">{hashInfo.prime}</strong> • Weight h = d^(m-1) mod q ={' '}
                <strong className="text-chalk-200">{hashInfo.highOrder}</strong>
              </span>
            </div>

            {/* Hashes Comparison Line */}
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-obsidian-950 border border-hairline">
                <span className="text-chalk-500">Pattern Hash P:</span>
                <strong className="text-chalk-100 text-sm">{hashInfo.patternHash}</strong>
              </div>

              <span
                className={`font-bold text-sm ${
                  hashInfo.hashMatch ? 'text-acid-400' : 'text-chalk-500'
                }`}
              >
                {hashInfo.hashMatch ? '==' : '!='}
              </span>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 border ${
                  hashInfo.hashMatch
                    ? 'bg-acid-500/15 border-acid-500/60 text-acid-400 shadow-sm'
                    : 'bg-obsidian-950 border-hairline text-chalk-300'
                }`}
              >
                <span className="text-chalk-500">Window Hash T[{safeShift}…{safeShift + m - 1}]:</span>
                <strong className="text-sm font-bold">{hashInfo.windowHash}</strong>
              </div>

              {/* Status Indicator */}
              <div className="ml-auto">
                {hashInfo.hashMatch ? (
                  hashInfo.spurious ? (
                    <span className="px-3 py-1.5 border bg-rose-500/15 border-rose-500/60 text-rose-300 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      SPURIOUS HIT (Hash collision: hashes match, but characters differ)
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 border bg-acid-500/15 border-acid-500/60 text-acid-400 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-acid-400" />
                      HASH HIT (p == t: verifying characters)
                    </span>
                  )
                ) : (
                  <span className="px-3 py-1.5 border bg-obsidian-950 border-hairline text-chalk-400 text-xs flex items-center gap-1.5">
                    HASH MISMATCH (No match possible: skip verification)
                  </span>
                )}
              </div>
            </div>

            {/* Rolling Hash Arithmetic Breakdown Box */}
            {rollingInfo && (
              <div className="p-3 bg-obsidian-950 border border-hairline flex flex-col gap-2 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-chalk-400 border-b border-hairline/60 pb-1.5">
                  <span className="font-bold text-amber-glow uppercase tracking-wider flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-amber" />
                    O(1) Rolling Hash Step: Shift {safeShift - 1} → Shift {safeShift}
                  </span>
                  <span className="text-chalk-500">t_{safeShift} = (d × (t_{safeShift - 1} − T[leaving]·h) + T[entering]) mod q</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 bg-obsidian-900 border border-hairline">
                    <span className="text-chalk-500 block text-[10px]">Previous Window Hash:</span>
                    <strong className="text-chalk-200 text-sm">{rollingInfo.prevHash}</strong>
                  </div>

                  <div className="p-2 bg-rose-950/30 border border-rose-500/40 text-rose-300">
                    <span className="text-rose-400 block text-[10px]">Outgoing Char (drop):</span>
                    <strong>'{rollingInfo.removedChar}'</strong> (ASCII {rollingInfo.removedAscii}) × h ={' '}
                    <strong>{rollingInfo.removedTerm} mod q</strong>
                  </div>

                  <div className="p-2 bg-electric-950/30 border border-electric-500/40 text-electric-300">
                    <span className="text-electric-400 block text-[10px]">Incoming Char (append):</span>
                    <strong>'{rollingInfo.addedChar}'</strong> (ASCII {rollingInfo.addedAscii})
                  </div>

                  <div className="p-2 bg-acid-950/30 border border-acid-500/40 text-acid-300">
                    <span className="text-acid-400 block text-[10px]">New Rolled Hash:</span>
                    <strong className="text-sm">{rollingInfo.nextHash}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-chalk-400 pt-1 border-t border-hairline/40">
                  <span className="text-chalk-500">Formula Evaluation: </span>
                  <span className="text-chalk-200 font-semibold">{rollingInfo.calculationText}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visualizer Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-acid-500/30 border border-acid-500"></span>
          <span>Character Match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-rose-500/30 border border-rose-500"></span>
          <span>Character Mismatch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber/25 border border-amber"></span>
          <span>Active Window / Pointer</span>
        </div>
        {hashInfo && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500/30 border border-rose-400"></span>
              <span>Outgoing Char (-T[s]·h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-electric-500/30 border border-electric-400"></span>
              <span>Incoming Char (+T[s+m])</span>
            </div>
          </>
        )}
        {hasLps && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber border border-amber-glow"></span>
            <span>Active LPS Entry</span>
          </div>
        )}
      </div>
    </div>
  );
};
