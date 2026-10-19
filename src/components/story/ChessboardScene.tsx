import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';

/**
 * ♛ N-Queens on a real wooden chessboard.
 *
 * Queens are lowered into place row by row. Squares a placed queen can reach get a
 * faint red mark, so the safe squares are easy to spot. When a square is blocked, the
 * attacking queen fires an arrow along its column or diagonal. On a dead end, the last
 * queen is lifted off the board (backtracking) and the next column is tried.
 */

const S = 56;
const M = 34;
const LIGHT = '#f0d9b5';
const DARK = '#b58863';
const RED = '#dc2626';

/** A carved queen piece, drawn around (0, 0) = centre of its square. */
const Queen: React.FC<{ ghost?: boolean; gold?: boolean }> = ({ ghost, gold }) => (
  <g opacity={ghost ? 0.5 : 1}>
    <ellipse cx="0" cy="19" rx="16" ry="4.5" fill="#00000030" />
    <path
      d="M -15 15 L -17 -6 L -9 3 L -6 -12 L 0 1 L 6 -12 L 9 3 L 17 -6 L 15 15 Z"
      fill={gold ? '#fbbf24' : '#fafaf9'}
      stroke={gold ? '#92400e' : '#44403c'}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="-16" y="13" width="32" height="6" rx="2" fill={gold ? '#d97706' : '#e7e5e4'} stroke={gold ? '#92400e' : '#44403c'} strokeWidth="1.6" />
    {[-17, -6, 6, 17].map((x, i) => (
      <circle key={i} cx={x} cy={i === 0 || i === 3 ? -8 : -14} r="2.6" fill={gold ? '#fde68a' : '#ffffff'} stroke={gold ? '#92400e' : '#44403c'} strokeWidth="1.3" />
    ))}
  </g>
);

export const ChessboardScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const st: any = step.state || {};
  const n: number = st.n || 4;
  const board: number[] = st.board || Array(n).fill(-1);
  const action: string = st.action || 'init';
  const row: number = st.currentRow ?? -1;
  const col: number = st.currentCol ?? -1;
  const attack = st.attack as
    | { attempted: { r: number; c: number }; attacker: { r: number; c: number }; line: 'column' | 'diagonal'; between: { r: number; c: number }[] }
    | undefined;
  const solved = action === 'solution';
  const solutions: number[][] = st.solutions || [];

  const phases: readonly (readonly [string, number])[] = action === 'conflict' ? [['hover', 0], ['attack', 0.35]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  // Queens standing on the board (the attempted square of a conflict is only a ghost).
  const queens = board
    .map((c, r) => ({ r, c }))
    .filter((q) => q.c >= 0 && !(action === 'conflict' && q.r === row));

  // Squares reachable by a standing queen (faint red marks) — the rest are safe.
  const attacked = (r: number, c: number) =>
    queens.some((q) => !(q.r === r && q.c === c) && (q.c === c || q.r === r || Math.abs(q.r - r) === Math.abs(q.c - c)));

  const cx = (c: number) => M + c * S + S / 2;
  const cy = (r: number) => M + r * S + S / 2;
  const size = M * 2 + n * S;

  const narration = (() => {
    switch (action) {
      case 'init':
        return step.isFinal
          ? 'Every possibility has been tried: no way to place the queens without an attack.'
          : `An empty ${n}×${n} board. Place ${n} queens so none can attack another. A queen attacks along its row, its column and both diagonals, so we fill one row at a time.`;
      case 'place':
        return `Row ${row + 1}: column ${col + 1} has no red marks, so it’s safe. Down goes the queen! On to row ${row + 2}.`;
      case 'conflict':
        if (phase === 'hover' || !attack) return `Row ${row + 1}: what about column ${col + 1}?`;
        return `Blocked! The queen in row ${attack.attacker.r + 1}, column ${attack.attacker.c + 1} attacks this square along its ${attack.line}.`;
      case 'backtrack':
        return `Dead end: no safe square is left further down. Lift the queen off row ${row + 1}, column ${col + 1} and try the next column.`;
      case 'solution':
        return step.isFinal
          ? solutions.length > 1
            ? `Search complete: ${solutions.length} different ways to place all ${n} queens safely (on the shelf below).`
            : `Done! All ${n} queens stand safely: no two share a row, column or diagonal.`
          : `All ${n} queens are safe: solution #${st.solutionCount}!`;
      default:
        return step.title;
    }
  })();

  const status = solved ? `Solutions found • ${st.solutionCount}` : `Queens on the board • ${queens.length} of ${n}`;

  return (
    <StoryStage
      emoji="♛"
      title="Queens on a Chessboard"
      subtitle="Faint red marks = squares a queen can reach. Only unmarked squares are safe."
      narration={narration}
      status={status}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: Math.min(560, size * 1.15) }} role="img" aria-label="Chessboard">
        {/* wooden frame */}
        <rect x="4" y="4" width={size - 8} height={size - 8} rx="14" fill={solved ? '#fbbf24' : '#7c4a24'} style={{ transition: 'fill 0.6s' }} />
        <rect x={M - 4} y={M - 4} width={n * S + 8} height={n * S + 8} rx="4" fill="#5c3418" />

        {Array.from({ length: n }, (_, r) =>
          Array.from({ length: n }, (_, c) => {
            const between = phase === 'attack' && attack?.between.some((b) => b.r === r && b.c === c);
            const tried = action === 'conflict' && r === row && c === col;
            return (
              <g key={`sq-${r}-${c}`}>
                <rect x={M + c * S} y={M + r * S} width={S} height={S} fill={(r + c) % 2 ? DARK : LIGHT} />
                {(between || (tried && phase === 'attack')) && <rect x={M + c * S} y={M + r * S} width={S} height={S} fill={RED} opacity="0.35" />}
                {!solved && attacked(r, c) && board[r] !== c && (
                  <g opacity="0.55">
                    <line x1={cx(c) - 6} y1={cy(r) - 6} x2={cx(c) + 6} y2={cy(r) + 6} stroke={RED} strokeWidth="2" strokeLinecap="round" />
                    <line x1={cx(c) + 6} y1={cy(r) - 6} x2={cx(c) - 6} y2={cy(r) + 6} stroke={RED} strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })
        )}

        {/* row and column numbers */}
        {Array.from({ length: n }, (_, k) => (
          <g key={`lbl-${k}`} fontSize="12" fontWeight="700" fill="#fde68a">
            <text x={M - 18} y={cy(k) + 4} textAnchor="middle">
              {k + 1}
            </text>
            <text x={cx(k)} y={M - 12} textAnchor="middle">
              {k + 1}
            </text>
          </g>
        ))}

        {/* current row pointer */}
        {row >= 0 && row < n && !solved && (
          <text x={M + n * S + 16} y={cy(row) + 6} textAnchor="middle" fontSize="18" fill="#fde68a" style={{ transition: 'y 0.5s' }}>
            ◀
          </text>
        )}

        {/* standing queens */}
        {queens.map((q) => (
          <g key={`q-${q.r}-${q.c}`} transform={`translate(${cx(q.c)}, ${cy(q.r)})`}>
            <g className={action === 'place' && q.r === row ? 'animate-story-drop' : undefined}>
              <Queen gold={solved} />
            </g>
          </g>
        ))}

        {/* conflict: ghost queen + attack arrow */}
        {action === 'conflict' && row >= 0 && col >= 0 && (
          <g transform={`translate(${cx(col)}, ${cy(row)})`}>
            <g className={phase === 'attack' ? 'animate-story-shake' : 'animate-story-bob'}>
              <Queen ghost />
            </g>
          </g>
        )}
        {action === 'conflict' && attack && phase === 'attack' && (
          <g>
            <defs>
              <marker id="storyArrowRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={RED} />
              </marker>
            </defs>
            <line
              x1={cx(attack.attacker.c)}
              y1={cy(attack.attacker.r) + 14}
              x2={cx(attack.attempted.c)}
              y2={cy(attack.attempted.r) - 18}
              stroke={RED}
              strokeWidth="4"
              strokeLinecap="round"
              markerEnd="url(#storyArrowRed)"
              className="animate-story-pop"
            />
            <text x={cx(col) + 18} y={cy(row) - 16} fontSize="18" fontWeight="900" fill={RED}>
              ✗
            </text>
          </g>
        )}

        {/* backtrack: the queen is lifted off its square */}
        {action === 'backtrack' && row >= 0 && col >= 0 && (
          <g transform={`translate(${cx(col)}, ${cy(row)})`}>
            <g key={`lift-${step.stepIndex}`} className="animate-story-lift">
              <Queen />
              <text x="0" y="-26" textAnchor="middle" fontSize="20">
                ✋
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* trophy shelf of solutions (find-all mode) */}
      {solutions.length > 0 && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">🏆 Solutions shelf</span>
          <div className="flex flex-wrap justify-center gap-2">
            {solutions.slice(0, 16).map((sol, k) => (
              <svg key={k} width={n * 9 + 4} height={n * 9 + 4} viewBox={`0 0 ${n * 9 + 4} ${n * 9 + 4}`} className={k === solutions.length - 1 && solved ? 'animate-story-pop' : undefined}>
                <rect width={n * 9 + 4} height={n * 9 + 4} rx="3" fill="#7c4a24" />
                {sol.map((c, r) =>
                  Array.from({ length: n }, (_, cc) => (
                    <rect key={`${r}-${cc}`} x={2 + cc * 9} y={2 + r * 9} width="9" height="9" fill={cc === c ? '#f59e0b' : (r + cc) % 2 ? DARK : LIGHT} />
                  ))
                )}
              </svg>
            ))}
            {solutions.length > 16 && <span className="self-center text-xs text-stone-500">+{solutions.length - 16} more</span>}
          </div>
        </div>
      )}
    </StoryStage>
  );
};
