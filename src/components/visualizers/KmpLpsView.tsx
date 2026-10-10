import React from 'react';
import { SEM } from '../../styles/semantics';

/** Width of one character cell plus its gap (w-9 + gap-1.5), used to align the two pattern rows. */
const CELL = 42;

type LpsAction = 'start' | 'compare' | 'extend' | 'fallback' | 'zero' | 'done';

export interface KmpLpsViewProps {
  pattern: string;
  lpsTable: number[];
  /** Pointer i: the position whose LPS value is being worked out. */
  i: number;
  /** Pointer len: length of the prefix currently known to equal the suffix ending just before i. */
  len: number;
  action: LpsAction;
  prevLen?: number;
  /** Entries 0 … lpsFilled−1 are final; later entries are not computed yet. */
  lpsFilled: number;
  isMatch?: boolean;
}

/**
 * Phase 1 of KMP: the pattern compared against itself. The top row is the pattern
 * with pointer i; the bottom row is the same pattern slid right so that its prefix
 * sits under the suffix being tested, with pointer len. Only the pattern is shown.
 */
export const KmpLpsView: React.FC<KmpLpsViewProps> = ({ pattern, lpsTable, i, len, action, prevLen, lpsFilled, isMatch }) => {
  const m = pattern.length;
  const comparing = action === 'compare';
  // After "extend" the matched prefix ends at i; otherwise P[len] is lined up under P[i].
  const offset = action === 'extend' ? i - len + 1 : action === 'done' || action === 'start' ? -1 : i - len;
  const showAlignment = offset >= 0 && action !== 'zero';
  const matchedTopStart = action === 'extend' ? i - len + 1 : i - len;
  const matchedTopEnd = action === 'extend' ? i : i - 1;

  const topCell = (idx: number) => {
    if (comparing && idx === i) return `${SEM[isMatch ? 'match' : 'mismatch'].cell} scale-105`;
    if (showAlignment && len > 0 && idx >= matchedTopStart && idx <= matchedTopEnd) return 'bg-sem-match/10 border border-sem-match/50 text-sem-match-ink font-semibold';
    if (idx === i && action !== 'done') return SEM.current.cell;
    return 'bg-obsidian-850 border border-hairline text-chalk-400';
  };
  const bottomCell = (idx: number) => {
    if (comparing && idx === len) return `${SEM[isMatch ? 'match' : 'mismatch'].cell} scale-105`;
    if (idx < len) return 'bg-sem-match/10 border border-sem-match/50 text-sem-match-ink font-semibold';
    if (idx === len && action !== 'extend') return SEM.current.cell;
    return 'bg-obsidian-850 border border-hairline text-chalk-500 opacity-60';
  };

  const status = (() => {
    switch (action) {
      case 'start':
        return { tone: 'text-chalk-300', text: `LPS[0] = 0 (one character has no proper prefix). Start with i = 1, len = 0.` };
      case 'compare':
        return isMatch
          ? { tone: SEM.match.text, text: `P[${i}] = P[${len}] = '${pattern[i]}' ✓ → the prefix-suffix can grow` }
          : { tone: SEM.mismatch.text, text: `P[${i}] = '${pattern[i]}' ≠ P[${len}] = '${pattern[len]}' ✗ → ${len > 0 ? 'fall back' : 'LPS[i] = 0'}` };
      case 'extend':
        return { tone: SEM.match.text, text: `len grows: ${len - 1} → ${len}. Prefix "${pattern.slice(0, len)}" = suffix "${pattern.slice(i - len + 1, i + 1)}", so LPS[${i}] = ${len}.` };
      case 'fallback':
        return {
          tone: SEM.backtrack.text,
          text: `len falls back: ${prevLen} → LPS[${(prevLen ?? 1) - 1}] = ${len}. i stays at ${i}.`,
        };
      case 'zero':
        return { tone: 'text-chalk-300', text: `len = 0 and P[${i}] ≠ P[0], so LPS[${i}] = 0.` };
      case 'done':
        return { tone: SEM.final.text, text: `LPS table complete: [${lpsTable.join(', ')}]` };
    }
  })();

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4 p-4 sm:p-6 bg-obsidian-950 border border-hairline">
      {/* Definition */}
      <p className="font-sans text-xs sm:text-sm text-chalk-300 leading-relaxed">
        <strong className="text-chalk-100">LPS[i]</strong> = length of the longest <em>proper</em> prefix of P[0…i] that is also a suffix of P[0…i]
        <span className="text-chalk-500"> (proper: not the whole string). The text is not used in this phase.</span>
      </p>

      {/* Pointers */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        {action !== 'done' && (
          <>
            <span className={`px-2 py-0.5 ${SEM.current.badge}`}>i = {i}</span>
            <span className={`px-2 py-0.5 ${action === 'fallback' ? SEM.backtrack.badge : SEM.compare.badge}`}>len = {len}</span>
          </>
        )}
        <span role="status" className={`font-sans text-xs sm:text-sm font-semibold ${status.tone}`}>
          {status.text}
        </span>
      </div>

      {/* Two aligned copies of the pattern */}
      <div className="overflow-x-auto pb-1">
        <div className="flex flex-col gap-3 min-w-max">
          <PatternRow
            label="Suffix side (pointer i)"
            pattern={pattern}
            offset={0}
            cellClass={topCell}
            pointer={action !== 'done' && i >= 0 && i < m ? { idx: i, name: 'i' } : undefined}
          />
          {showAlignment && (
            <PatternRow
              label="Prefix side (pointer len)"
              pattern={pattern.slice(0, Math.min(m - offset, m))}
              offset={offset}
              cellClass={bottomCell}
              pointer={action !== 'extend' && len < m - offset ? { idx: len, name: 'len' } : undefined}
            />
          )}
        </div>
      </div>

      {/* LPS table being filled */}
      <div className="flex flex-col gap-1.5 pt-3 border-t border-hairline">
        <span className="font-sans text-xs font-semibold text-chalk-300">LPS table</span>
        <div className="overflow-x-auto pb-1">
          <div className="flex items-end gap-1.5 min-w-max">
            {pattern.split('').map((ch, idx) => {
              const filled = idx < lpsFilled;
              const justSet = (action === 'extend' || action === 'zero') && idx === i;
              const usedForFallback = action === 'fallback' && prevLen !== undefined && idx === prevLen - 1;
              const cls = justSet
                ? SEM.final.cell
                : usedForFallback
                ? SEM.backtrack.cell
                : action !== 'done' && idx === i
                ? SEM.current.cell
                : filled
                ? 'bg-obsidian-850 border border-hairline text-chalk-200'
                : 'bg-obsidian-900 border border-dashed border-hairline text-chalk-600';
              return (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-chalk-500">'{ch}'</span>
                  <div className={`w-9 h-8 flex items-center justify-center text-xs font-mono font-bold ${cls}`}>{filled ? lpsTable[idx] : '·'}</div>
                  <span className="text-[9px] font-mono text-chalk-600 mt-0.5 tabular-nums">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>
        {action === 'fallback' && prevLen !== undefined && (
          <p className="font-sans text-xs text-chalk-400">
            ↩ The fallback reads LPS[{prevLen - 1}]: the longest prefix-suffix of "{pattern.slice(0, prevLen)}" is the next-best candidate, so no shorter length needs to be tried first.
          </p>
        )}
      </div>
    </div>
  );
};

const PatternRow: React.FC<{
  label: string;
  pattern: string;
  offset: number;
  cellClass: (idx: number) => string;
  pointer?: { idx: number; name: string };
}> = ({ label, pattern, offset, cellClass, pointer }) => (
  <div className="flex flex-col gap-1">
    <span className="font-sans text-[11px] font-semibold text-chalk-400">{label}</span>
    <div className="flex items-start gap-1.5" style={{ paddingLeft: `${offset * CELL}px` }}>
      {pattern.split('').map((ch, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className={`w-9 h-10 flex items-center justify-center text-sm font-mono transition-all duration-200 ${cellClass(idx)}`}>{ch}</div>
          <span className="text-[9px] font-mono text-chalk-600 mt-1 tabular-nums">{idx}</span>
          {pointer?.idx === idx && <span className="text-[10px] font-mono font-bold text-chalk-200 leading-none">▲ {pointer.name}</span>}
        </div>
      ))}
    </div>
  </div>
);
