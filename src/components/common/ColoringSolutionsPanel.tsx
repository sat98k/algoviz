import React, { useState } from 'react';
import { Palette, CheckCircle2, Copy, Check, Eye } from 'lucide-react';
import { COLOR_NAMES } from '../../algorithms/graphColoring';

const COLOR_PALETTE: Record<number, { name: string; bg: string; border: string; text: string }> = {
  0: { name: 'Uncolored', bg: '#181a20', border: '#374151', text: '#94a3b8' },
  1: { name: 'Red', bg: '#ef4444', border: '#f87171', text: '#ffffff' },
  2: { name: 'Blue', bg: '#3b82f6', border: '#60a5fa', text: '#ffffff' },
  3: { name: 'Green', bg: '#10b981', border: '#34d399', text: '#ffffff' },
  4: { name: 'Yellow', bg: '#f59e0b', border: '#fbbf24', text: '#000000' },
  5: { name: 'Purple', bg: '#8b5cf6', border: '#a78bfa', text: '#ffffff' },
  6: { name: 'Cyan', bg: '#06b6d4', border: '#22d3ee', text: '#ffffff' },
  7: { name: 'Orange', bg: '#f97316', border: '#fb923c', text: '#ffffff' },
  8: { name: 'Pink', bg: '#ec4899', border: '#f472b6', text: '#ffffff' },
};

interface ColoringSolutionsPanelProps {
  solutions?: Array<Record<string, number>>;
  numColors?: number;
  numVertices?: number;
  isFinal?: boolean;
  onPreviewSolution?: (assignment: Record<string, number>) => void;
}

export const ColoringSolutionsPanel: React.FC<ColoringSolutionsPanelProps> = ({
  solutions = [],
  numColors = 3,
  numVertices,
  isFinal = false,
  onPreviewSolution,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleCopy = () => {
    const data = {
      numColors,
      totalSolutions: solutions.length,
      solutions: solutions.map((s, idx) => {
        const sortedKeys = Object.keys(s).sort((a, b) => parseInt(a) - parseInt(b));
        const mapping: Record<string, string> = {};
        sortedKeys.forEach((k) => {
          mapping[`V${parseInt(k) + 1}`] = COLOR_NAMES[s[k]] || `Color${s[k]}`;
        });
        return { solutionNumber: idx + 1, coloring: mapping };
      }),
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelect = (idx: number, sol: Record<string, number>) => {
    setSelectedIdx(idx);
    if (onPreviewSolution) {
      onPreviewSolution(sol);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-obsidian-900 border border-hairline w-full">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
        <div className="flex items-center gap-2.5">
          <Palette className="w-4 h-4 text-amber" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-chalk-100 font-bold">
            ALL VALID COLORINGS OUTPUT PANE
          </h3>
          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-amber/15 border border-amber/30 text-amber">
            {solutions.length} {solutions.length === 1 ? 'COLORING' : 'COLORINGS'} FOUND
          </span>
        </div>

        <div className="flex items-center gap-2">
          {solutions.length > 0 && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 bg-obsidian-950 hover:bg-obsidian-850 text-chalk-300 border border-hairline text-xs font-mono transition-colors"
              title="Copy all valid colorings to clipboard as JSON"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-acid-500" /> COPIED JSON
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-chalk-400" /> COPY ALL JSON
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-chalk-400">
        <span className="px-2.5 py-1 bg-obsidian-950 border border-hairline">
          [ COLORS ]: <strong className="text-amber-glow">{numColors}</strong>
        </span>
        {numVertices !== undefined && (
          <span className="px-2.5 py-1 bg-obsidian-950 border border-hairline">
            [ VERTICES ]: <strong className="text-chalk-100">{numVertices}</strong>
          </span>
        )}
        <span className="px-2.5 py-1 bg-obsidian-950 border border-hairline">
          [ STATUS ]:{' '}
          <strong className={solutions.length > 0 ? 'text-acid-400' : 'text-chalk-400'}>
            {solutions.length > 0
              ? isFinal
                ? '✓ EXHAUSTIVE DISCOVERY COMPLETE'
                : 'DISCOVERING SOLUTIONS...'
              : isFinal
              ? '✕ NO VALID COLORING'
              : 'SEARCHING...'}
          </strong>
        </span>
      </div>

      {/* Solutions Gallery */}
      {solutions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto max-h-80 sm:max-h-96 pr-1">
          {solutions.map((sol, idx) => {
            const isSelected = selectedIdx === idx;
            const sortedIds = Object.keys(sol).sort((a, b) => parseInt(a) - parseInt(b));

            return (
              <div
                key={idx}
                onClick={() => handleSelect(idx, sol)}
                className={`p-3 bg-obsidian-950 border cursor-pointer transition-all flex flex-col gap-2.5 ${
                  isSelected
                    ? 'border-amber shadow-md shadow-amber/10 ring-1 ring-amber/50 bg-amber/5'
                    : 'border-hairline hover:border-chalk-500 hover:bg-obsidian-850'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-amber flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-acid-500" />
                    COLORING #{idx + 1}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] text-amber font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                </div>

                {/* Vertex Pill Badges with Color Dots */}
                <div className="flex flex-wrap gap-1.5">
                  {sortedIds.map((vId) => {
                    const c = sol[vId];
                    const colorInfo = COLOR_PALETTE[c] || COLOR_PALETTE[0];
                    return (
                      <span
                        key={vId}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-obsidian-900 border border-hairline text-chalk-200"
                        style={{ borderColor: colorInfo.border + '60' }}
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: colorInfo.bg }}
                        />
                        <span className="font-bold">V{parseInt(vId) + 1}:</span>
                        <span style={{ color: colorInfo.border }}>{colorInfo.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : isFinal ? (
        <div className="p-6 text-center font-mono text-xs text-chalk-400 bg-obsidian-950 border border-hairline flex flex-col items-center gap-2">
          <span className="text-red-400 font-bold text-sm">✕ No Valid {numColors}-Coloring Exists</span>
          <p className="text-chalk-500 max-w-md">
            The graph cannot be colored using {numColors} colors such that no adjacent vertices share a color (the chromatic number is strictly greater than {numColors}).
          </p>
        </div>
      ) : (
        <div className="p-6 text-center font-mono text-xs text-chalk-500 bg-obsidian-950 border border-hairline">
          Press Play or Step Forward to start discovering valid colorings...
        </div>
      )}
    </div>
  );
};
