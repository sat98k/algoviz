import React, { useEffect, useRef } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, Hash } from 'lucide-react';
import { SEM } from '../../styles/semantics';

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
            className={`px-3 py-1 text-xs font-mono flex items-center gap-2 ${comparison.isMatch ? SEM.match.badge : SEM.mismatch.badge}`}
          >
            {comparison.isMatch ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
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
              className={`h-6 flex items-center justify-between px-2 text-[10px] font-mono uppercase tracking-wider transition-colors duration-200 ${
                hashInfo
                  ? hashInfo.hashMatch
                    ? hashInfo.spurious
                      ? SEM.warning.badge
                      : SEM.compare.badge
                    : 'border border-hairline bg-obsidian-900 text-chalk-400'
                  : SEM.current.badge
              }`}
              style={{ width: `${m * 42 - 6}px` }}
            >
              <span>Window W_{safeShift}</span>
              <span>
                {hashInfo
                  ? hashInfo.hashMatch
                    ? hashInfo.spurious
                      ? '⚠ Collision'
                      : '⇄ Hash hit · checking'
                    : 'Hash differs · skip'
                  : '▶ Current window'}
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

              let cellStyle = 'bg-obsidian-850 border border-hairline text-chalk-400';
              let badgeText = '';
              let badgeClass = '';
              let verdict: 'match' | 'mismatch' | null = null;

              if (isMatchedOccur) {
                cellStyle = SEM.match.cell;
              } else if (isCurrentChar && comparison) {
                verdict = comparison.isMatch ? 'match' : 'mismatch';
                cellStyle = `${SEM[verdict].cell} scale-105 shadow-md`;
              } else if (isVerifiedInWindow) {
                cellStyle = 'bg-sem-match/10 border border-sem-match/50 text-sem-match-ink font-semibold';
              } else if (isLeaving) {
                // Leaving the window is routine, not an error: neutral, dashed, struck through.
                cellStyle = 'bg-obsidian-850 border border-dashed border-chalk-500 text-chalk-400 line-through';
                badgeText = 'OUT';
                badgeClass = 'text-chalk-300 bg-obsidian-950 border-chalk-500/60';
              } else if (isIncoming) {
                cellStyle = SEM.compare.cell;
                badgeText = 'IN';
                badgeClass = SEM.compare.badge;
              } else if (isCurrentChar && !comparison) {
                cellStyle = `${SEM.current.cell} scale-105`;
              } else if (isInActiveWindow) {
                cellStyle = 'bg-obsidian-800 border border-hairline text-chalk-300';
              }

              return (
                <div key={idx} className="flex flex-col items-center relative">
                  {badgeText && (
                    <span
                      className={`absolute -top-[18px] text-[10px] leading-none font-mono font-bold px-1 py-0.5 border whitespace-nowrap z-10 ${badgeClass}`}
                    >
                      {badgeText}
                    </span>
                  )}
                  <div
                    className={`relative w-9 h-10 flex items-center justify-center text-sm font-mono transition-all duration-200 ${cellStyle}`}
                  >
                    {char}
                    {verdict && <VerdictMark verdict={verdict} />}
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

              let cellStyle = 'bg-obsidian-850 border border-hairline text-chalk-400';
              let verdict: 'match' | 'mismatch' | null = null;

              if (isFullPatternMatched) {
                cellStyle = SEM.match.cell;
              } else if (isCurrent && comparison) {
                verdict = comparison.isMatch ? 'match' : 'mismatch';
                cellStyle = `${SEM[verdict].cell} scale-105 shadow-md`;
              } else if (isVerified) {
                cellStyle = 'bg-sem-match/10 border border-sem-match/50 text-sem-match-ink font-semibold';
              } else if (isCurrent && !comparison) {
                cellStyle = `${SEM.current.cell} scale-105`;
              }

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`relative w-9 h-10 flex items-center justify-center text-sm font-mono transition-all duration-200 ${cellStyle}`}
                  >
                    {char}
                    {verdict && <VerdictMark verdict={verdict} />}
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
                        isLpsActive ? SEM.current.cell : 'bg-obsidian-850 border-hairline text-chalk-400'
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

              <span className={`font-bold text-sm ${hashInfo.hashMatch ? SEM.compare.text : 'text-chalk-500'}`}>
                {hashInfo.hashMatch ? '=' : '≠'}
              </span>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 ${
                  hashInfo.hashMatch ? SEM.compare.cell : 'border bg-obsidian-950 border-hairline text-chalk-300'
                }`}
              >
                <span className="text-chalk-500">Window Hash T[{safeShift}…{safeShift + m - 1}]:</span>
                <strong className="text-sm font-bold">{hashInfo.windowHash}</strong>
              </div>

              {/* Status Indicator */}
              <div className="ml-auto">
                {hashInfo.hashMatch ? (
                  hashInfo.spurious ? (
                    <span className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${SEM.warning.badge}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Spurious hit: the hashes match, but the characters differ (a collision)
                    </span>
                  ) : (
                    <span className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${SEM.compare.badge}`}>
                      ⇄ Hash hit: hashes match, so the characters are checked one by one
                    </span>
                  )
                ) : (
                  <span className="px-3 py-1.5 border bg-obsidian-950 border-hairline text-chalk-400 text-xs flex items-center gap-1.5">
                    Hashes differ: no match is possible here, so no characters are checked
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

                  <div className="p-2 bg-obsidian-900 border border-dashed border-chalk-500 text-chalk-300">
                    <span className="text-chalk-400 block text-[10px]">OUT · leaving character (removed):</span>
                    <strong className="line-through">'{rollingInfo.removedChar}'</strong> (ASCII {rollingInfo.removedAscii}) × h ={' '}
                    <strong>{rollingInfo.removedTerm} mod q</strong>
                  </div>

                  <div className={`p-2 ${SEM.compare.cell} font-normal`}>
                    <span className="block text-[10px]">IN · entering character (added):</span>
                    <strong>'{rollingInfo.addedChar}'</strong> (ASCII {rollingInfo.addedAscii})
                  </div>

                  <div className="p-2 bg-obsidian-900 border border-hairline text-chalk-200">
                    <span className="text-chalk-400 block text-[10px]">New rolled hash:</span>
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

      {/* Legend: every colour is paired with a symbol or word */}
      <ul aria-label="Legend" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4 text-xs font-mono text-chalk-400">
        <LegendItem swatch={SEM.match.swatch} symbol="✓" label="Characters match" />
        <LegendItem swatch={SEM.mismatch.swatch} symbol="✗" label="Characters differ" />
        <LegendItem swatch={SEM.current.swatch} symbol="▶" label={hasLps && phase === 'lps' ? 'Current LPS entry' : 'Current position'} />
        {hashInfo && (
          <>
            <LegendItem swatch="bg-obsidian-850 border border-dashed border-chalk-500" symbol="OUT" label="Leaving the window" />
            <LegendItem swatch={SEM.compare.swatch} symbol="IN" label="Entering the window" />
            <LegendItem swatch={SEM.warning.swatch} symbol="⚠" label="Hash collision" />
          </>
        )}
      </ul>
    </div>
  );
};

/** Corner ✓/✗ so a match or mismatch is readable without relying on colour. */
const VerdictMark: React.FC<{ verdict: 'match' | 'mismatch' }> = ({ verdict }) => (
  <>
    <span
      aria-hidden="true"
      className={`absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold leading-none text-obsidian-950 ${
        verdict === 'match' ? 'bg-sem-match' : 'bg-sem-mismatch'
      }`}
    >
      {verdict === 'match' ? '✓' : '✗'}
    </span>
    <span className="sr-only">{verdict === 'match' ? '(match)' : '(mismatch)'}</span>
  </>
);

const LegendItem: React.FC<{ swatch: string; symbol: string; label: string }> = ({ swatch, symbol, label }) => (
  <li className="flex items-center gap-1.5">
    <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[10px] font-bold ${swatch}`}>{symbol}</span>
    <span>{label}</span>
  </li>
);
