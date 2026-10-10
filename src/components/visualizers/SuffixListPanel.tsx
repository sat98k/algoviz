import React from 'react';
import { SEM } from '../../styles/semantics';
import type { SuffixTreeNodeSnapshot, SuffixTreeState } from '../../algorithms/suffixTree';

/** Suffix start indices of every leaf in a tree snapshot. */
export const leafSuffixIndices = (node: SuffixTreeNodeSnapshot): number[] =>
  node.isLeaf ? (node.suffixIndex >= 0 ? [node.suffixIndex] : []) : node.children.flatMap(leafSuffixIndices);

/**
 * Every suffix of T$, listed beside the tree. Build phase: which suffixes already
 * end at their own leaf. Search phase: which suffixes begin with the part of the
 * pattern matched so far (exactly the leaves below the current position).
 */
export const SuffixListPanel: React.FC<{ state: SuffixTreeState }> = ({ state }) => {
  const text = state.text;
  const isSearch = state.phase === 'search';
  const matched = isSearch ? state.pattern.slice(0, state.matchedLength ?? 0) : '';
  const leaves = new Set(leafSuffixIndices(state.suffixTree));
  const occurrences = new Set(state.matchIndices ?? []);

  return (
    <section aria-label="Suffixes" className="w-full mb-2.5 p-3 bg-obsidian-950 border border-hairline flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-sans text-sm font-semibold text-chalk-200">
          Suffixes of <span className="font-mono">"{text}"</span>
        </h3>
        <p className="font-sans text-xs text-chalk-400 leading-relaxed">
          A <strong className="text-chalk-200">suffix</strong> is the text from one position to the end. <span className="font-mono">$</span> marks the end, so
          each suffix finishes at its own leaf: reading the edges from the root down to leaf <span className="font-mono">k</span> spells suffix{' '}
          <span className="font-mono">k</span>.
        </p>
        {isSearch && (
          <p className="font-sans text-xs text-chalk-400 leading-relaxed">
            <strong className="text-chalk-200">Searching:</strong> every substring is the beginning of some suffix. Walk the pattern down from the root; the
            suffixes that begin with it are the leaves below where the walk ends.
          </p>
        )}
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 max-h-56 overflow-y-auto font-mono text-xs">
        {Array.from({ length: text.length }, (_, k) => {
          const suffix = text.slice(k);
          const startsWithMatch = matched.length > 0 && suffix.startsWith(matched);
          const isOccurrence = occurrences.has(k);
          const mark = isOccurrence ? '★' : isSearch ? (startsWithMatch ? '✓' : '') : leaves.has(k) ? 'leaf' : '';
          return (
            <li
              key={k}
              className={`flex items-baseline gap-2 px-1.5 py-0.5 ${isOccurrence ? SEM.final.badge : startsWithMatch ? SEM.compare.badge : 'border border-transparent'}`}
            >
              <span className="w-5 shrink-0 text-right text-chalk-500 tabular-nums">{k}</span>
              <span className="min-w-0 [overflow-wrap:anywhere] tracking-wider">
                {startsWithMatch ? (
                  <>
                    <span className="underline decoration-2 underline-offset-2 font-bold">{matched}</span>
                    <span className="text-chalk-400">{suffix.slice(matched.length)}</span>
                  </>
                ) : (
                  <span className="text-chalk-300">{suffix}</span>
                )}
              </span>
              {mark && <span className="ml-auto shrink-0 text-[10px] text-chalk-400">{mark}</span>}
            </li>
          );
        })}
      </ol>
      <p className="font-sans text-[11px] text-chalk-500">
        {isSearch
          ? `✓ begins with the matched part "${matched || '—'}"   ★ occurrence of the pattern (suffix starts with the whole pattern)`
          : '"leaf" = this suffix already has its own leaf in the tree being built'}
      </p>
    </section>
  );
};
