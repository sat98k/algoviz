import React from 'react';

/**
 * 🧮 The answer grid for LCS (optional view inside the Bead Necklaces scene).
 *
 * Row i is "the first i beads on top", column j is "the first j beads below", and each square
 * holds the length of the best shared chain for that pair of shorter necklaces. Squares are
 * filled one at a time, row by row: the square being worked out glows, the squares it reads
 * from are outlined in blue, and every filled square keeps a small arrow showing where its
 * answer came from. During the traceback the path back from the bottom-right corner turns
 * gold, and squares where two beads were tied together get a bead.
 */

type Dir = 'diag' | 'up' | 'left' | 'tie' | 'none';

interface Props {
  X: string;
  Y: string;
  phase: string;
  /** The beads' colours, so row and column headers match the necklaces. */
  colour: (ch: string) => string;
  table: number[][];
  directions: Dir[][];
  row: number;
  col: number;
  /** While false, the square being worked out still shows "?" (the beads are being compared). */
  revealed: boolean;
  isMatch: boolean;
  sources: { r: number; c: number }[];
  path: { r: number; c: number }[];
  pairs: [number, number][];
}

/** Square size: as big as fits about 560px across (short words get big squares), never tiny. */
const cellFor = (cols: number) => Math.max(36, Math.min(58, Math.floor(560 / cols)));

export const LcsGridView: React.FC<Props> = ({ X, Y, phase, colour, table, directions, row, col, revealed, isMatch, sources, path, pairs }) => {
  const m = X.length;
  const n = Y.length;
  const CELL = cellFor(n + 2);
  const filling = phase === 'fill';
  /** Has this square been worked out yet? Row 0 and column 0 are the empty-necklace answers (0). */
  const filled = (r: number, c: number) => {
    if (r === 0 || c === 0) return true;
    if (phase === 'init') return false;
    if (filling) return r < row || (r === row && (c < col || (c === col && revealed)));
    return true;
  };
  const isCurrent = (r: number, c: number) => filling && r === row && c === col;
  const isSource = (r: number, c: number) => filling && sources.some((s) => s.r === r && s.c === c);
  const onPath = (r: number, c: number) => path.some((p) => p.r === r && p.c === c);
  const tied = (r: number, c: number) => pairs.some(([a, b]) => a === r && b === c);
  const arrow = (d?: Dir) => (d === 'diag' ? '↖' : d === 'up' || d === 'tie' ? '↑' : d === 'left' ? '←' : '');

  const header = (ch: string | undefined, k: number, kind: 'row' | 'col') => {
    const active = filling && (kind === 'row' ? k === row : k === col);
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: CELL, height: CELL }}
        data-grid-header={`${kind}-${k}`}
      >
        {ch === undefined ? (
          <span className="text-xs font-bold text-stone-400" title="no beads">
            ∅
          </span>
        ) : (
          <span
            className={`flex items-center justify-center rounded-full font-black text-stone-900 border ${active ? 'border-amber-500 ring-2 ring-amber-400' : 'border-stone-500'}`}
            style={{ width: CELL * 0.7, height: CELL * 0.7, background: colour(ch), transition: 'all 0.3s' }}
          >
            {ch}
          </span>
        )}
      </div>
    );
  };

  const value = table[row]?.[col] ?? 0;
  const rule =
    filling && row > 0 && col > 0
      ? isMatch
        ? `‘${X[row - 1]}’ = ‘${Y[col - 1]}’: one shorter on both sides (${table[row - 1]?.[col - 1] ?? 0}) + 1`
        : `‘${X[row - 1]}’ ≠ ‘${Y[col - 1]}’: the better of above (${table[row - 1]?.[col] ?? 0}) and left (${table[row]?.[col - 1] ?? 0})`
      : null;

  return (
    <div className="flex flex-col items-center gap-3 font-sans" data-lcs-grid>
      <div className="overflow-x-auto max-w-full">
        <div className="inline-grid rounded-xl bg-[#efe3d3] p-2 border border-amber-200 shadow-sm" style={{ gridTemplateColumns: `repeat(${n + 2}, ${CELL}px)` }}>
          {/* top-left corner, then one header per column: the first j beads below */}
          <div className="flex items-end justify-end pr-1 pb-0.5 text-[9px] font-bold leading-tight text-stone-500 text-right" style={{ width: CELL, height: CELL }}>
            top ↓<br />
            below →
          </div>
          {header(undefined, 0, 'col')}
          {Y.split('').map((ch, k) => (
            <React.Fragment key={`c-${k}`}>{header(ch, k + 1, 'col')}</React.Fragment>
          ))}
          {Array.from({ length: m + 1 }, (_, r) => (
            <React.Fragment key={`r-${r}`}>
              {header(r === 0 ? undefined : X[r - 1], r, 'row')}
              {Array.from({ length: n + 1 }, (_, c) => {
                const done = filled(r, c);
                const cur = isCurrent(r, c);
                const src = isSource(r, c);
                const gold = onPath(r, c);
                const bead = tied(r, c);
                const v = table[r]?.[c] ?? 0;
                return (
                  <div
                    key={`${r}-${c}`}
                    data-cell={`${r}-${c}`}
                    data-cell-state={cur ? 'current' : src ? 'source' : gold ? 'path' : done ? 'filled' : 'empty'}
                    className={`relative flex items-center justify-center m-[2px] rounded-md border font-black tabular-nums ${CELL >= 48 ? 'text-xl' : 'text-base'}`}
                    style={{
                      width: CELL - 4,
                      height: CELL - 4,
                      transition: 'background 0.35s, border-color 0.35s',
                      background: cur ? '#fde68a' : gold ? '#fcd34d' : src ? '#e0f2fe' : done ? '#fffbeb' : '#f5efe6',
                      borderColor: cur ? '#d97706' : gold ? '#b45309' : src ? '#0284c7' : done ? '#d6c3a5' : '#e7dccb',
                      borderWidth: cur || src || gold ? 2.5 : 1,
                      borderStyle: done || cur ? 'solid' : 'dashed',
                      color: done ? (r === 0 || c === 0 ? '#a8a29e' : '#451a03') : '#c4b5a0',
                    }}
                  >
                    {cur && !revealed ? (
                      <span className="text-amber-700">?</span>
                    ) : done ? (
                      <span key={cur ? `v-${r}-${c}` : 'v'} className={cur ? 'animate-story-pop' : undefined}>
                        {v}
                      </span>
                    ) : null}
                    {/* where this square's answer came from */}
                    {done && r > 0 && c > 0 && (!cur || revealed) && (
                      <span className="absolute top-0 left-0.5 text-[10px] font-bold leading-none text-stone-500">{arrow(directions[r]?.[c])}</span>
                    )}
                    {bead && (
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-amber-800 animate-story-pop"
                        style={{ background: colour(X[r - 1]) }}
                        title={`‘${X[r - 1]}’ tied`}
                      />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {rule && (
        <p className="text-sm text-stone-700" data-grid-rule>
          Square row {row}, column {col}: {rule}
          {revealed && (
            <>
              {' '}
              = <b className="text-amber-900">{value}</b>
            </>
          )}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-stone-600">
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded mr-1 border-2" style={{ background: '#fde68a', borderColor: '#d97706' }} />
          square being worked out
        </span>
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded mr-1 border-2" style={{ background: '#e0f2fe', borderColor: '#0284c7' }} />
          squares it reads from
        </span>
        <span>↖ beads matched · ↑ ← kept the better neighbour</span>
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded mr-1 border-2" style={{ background: '#fcd34d', borderColor: '#b45309' }} />
          path back from the corner
        </span>
        <span>
          <span className="inline-block w-3 h-3 align-[-2px] rounded-full mr-1 border border-amber-800 bg-amber-300" />
          beads tied together
        </span>
      </div>
    </div>
  );
};
