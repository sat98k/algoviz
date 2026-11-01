import React, { useMemo } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';
import { StateSpaceTree, SpaceTreeNode, SpaceNodeKind } from './StateSpaceTree';
import { buildNQueensStateSpaceTree } from '../../algorithms/nQueensTree';
import { PALETTE, useSvgIds } from './kit/materials';

/**
 * ♛ N-Queens on a real wooden chessboard.
 *
 * Queens are lowered into place row by row. Squares a placed queen can reach get a
 * faint red mark, so the safe squares are easy to spot. When a square is blocked, the
 * attacking queen fires an arrow along its column or diagonal. On a dead end, the last
 * queen is lifted off the board (backtracking) and the next column is tried.
 * Below the board, the search tree grows one choice at a time: each level is a row,
 * each branch a column, and attacked squares are snipped off as pruned branches.
 */

const S = 56;
const M = 34;
const LIGHT = '#f2dfbf';
const DARK = '#b98a5e';
const RED = '#cc2e2e';

/** A carved queen piece, drawn around (0, 0) = centre of its square. */
const Queen: React.FC<{ ghost?: boolean; gold?: boolean }> = ({ ghost, gold }) => {
  const body = gold ? PALETTE.gold : '#232020';
  const shade = gold ? '#9a6416' : '#0d0c0c';
  const shine = gold ? '#fff1b0' : '#6d6762';
  return (
    <g opacity={ghost ? 0.45 : 1}>
      <ellipse cx="0" cy="20" rx="17" ry="4.5" fill="#3a2414" opacity="0.28" />
      <path d="M -16 19 Q -16 13 -11 12 L -8 -2 Q -14 -6 -12 -11 L -6 -6 L -3 -15 L 0 -8 L 3 -15 L 6 -6 L 12 -11 Q 14 -6 8 -2 L 11 12 Q 16 13 16 19 Z" fill={body} />
      <path d="M 3 -15 L 6 -6 L 12 -11 Q 14 -6 8 -2 L 11 12 Q 16 13 16 19 L 6 19 L 5 -2 Z" fill={shade} opacity="0.55" />
      <path d="M -9 10 L -6.5 -2" stroke={shine} strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
      <rect x="-17" y="16" width="34" height="5" rx="2.5" fill={shade} />
      <circle cx="0" cy="-19" r="3.4" fill={gold ? '#fde68a' : PALETTE.gold} />
      <circle cx="-1" cy="-20" r="1.1" fill="#ffffff" opacity="0.8" />
    </g>
  );
};

export const ChessboardScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const ids = useSvgIds();
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

  // ── State-space tree: the full search is precomputed; show what has been visited so far ──
  // The find-all tree shares every step with find-first up to the first answer.
  const tree = useMemo(() => buildNQueensStateSpaceTree(n, true), [n]);
  const pathId = (cols: number[]) => (cols.length ? cols.map((c, r) => `${r}:${c}`).join('/') : 'root');
  const activeId = (() => {
    let id = 'root';
    if (action === 'place') id = pathId(board.slice(0, row + 1));
    else if ((action === 'conflict' || action === 'backtrack') && row >= 0) id = pathId([...board.slice(0, row), col]);
    else if (action === 'solution')
      id = board.every((c) => c >= 0) ? pathId(board) : solutions.length ? pathId(solutions[solutions.length - 1]) : 'root';
    return tree.nodes[id] ? id : tree.stepToNodeId[step.stepIndex] ?? 'root';
  })();
  const treeNodes = useMemo(() => {
    const out: Record<string, SpaceTreeNode> = {};
    for (const nd of Object.values(tree.nodes)) {
      if (nd.firstStepIndex > step.stepIndex) continue;
      out[nd.id] = {
        id: nd.id,
        parentId: nd.parentId,
        children: nd.children.filter((k) => tree.nodes[k].firstStepIndex <= step.stepIndex),
        edgeLabel: nd.col >= 0 ? `col ${nd.col + 1}` : undefined,
        status:
          nd.status === 'conflict'
            ? 'pruned'
            : nd.status === 'solution' && (nd.solutionStepIndex ?? Infinity) <= step.stepIndex
            ? 'solution'
            : 'open',
        pruneNote: nd.attack ? `same ${nd.attack.line}` : undefined,
      };
    }
    return out;
  }, [tree, step.stepIndex]);

  // Each tree node is a tiny copy of the board at that moment.
  const cell = Math.max(6, Math.min(12, Math.floor(52 / n)));
  const renderTreeNode = (id: string, kind: SpaceNodeKind) => {
    const nd = tree.nodes[id];
    const half = (n * cell) / 2;
    const tested = kind === 'pruned' || kind === 'trying';
    return (
      <g transform={`translate(${-half}, ${-half})`}>
        {Array.from({ length: n }, (_, r) =>
          Array.from({ length: n }, (_, c) => (
            <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill={(r + c) % 2 ? DARK : LIGHT} />
          ))
        )}
        {nd.board.map((c, r) =>
          c < 0 ? null : (
            <circle
              key={`q-${r}`}
              cx={c * cell + cell / 2}
              cy={r * cell + cell / 2}
              r={cell * 0.34}
              fill={r === nd.row && tested ? RED : kind === 'solution' ? PALETTE.gold : '#232020'}
            />
          )
        )}
      </g>
    );
  };

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
      title="Queens on a Chessboard"
      subtitle="Faint red marks = squares a queen can reach. Only unmarked squares are safe."
      narration={narration}
      status={status}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: Math.min(560, size * 1.15) }} role="img" aria-label="Chessboard">
        {/* wooden frame */}
        <defs>
          <linearGradient id={`${ids}-frame`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={solved ? '#fde68a' : '#9a6a40'} />
            <stop offset="1" stopColor={solved ? PALETTE.gold : '#5e3c20'} />
          </linearGradient>
          <linearGradient id={`${ids}-sheen`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="4" y="12" width={size - 8} height={size - 8} rx="18" fill="#3a2414" opacity="0.18" />
        <rect x="4" y="4" width={size - 8} height={size - 8} rx="18" fill={`url(#${ids}-frame)`} style={{ transition: 'fill 0.6s' }} />
        <rect x={M - 4} y={M - 4} width={n * S + 8} height={n * S + 8} rx="6" fill="#4a2e18" />

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

        <rect x={M} y={M} width={n * S} height={n * S} fill={`url(#${ids}-sheen)`} pointerEvents="none" />
        {/* row and column numbers */}
        {Array.from({ length: n }, (_, k) => (
          <g key={`lbl-${k}`} fontSize="12.5" fontWeight="900" fill={solved ? PALETTE.ink : '#f6e6c4'} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
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
          <g style={{ transform: `translate(${M + n * S + 16}px, ${cy(row)}px)`, transition: 'transform 0.5s var(--ease-move)' }}>
            <path d="M6 -8 L-6 0 L6 8 Z" fill={PALETTE.gold} stroke="#6b4a10" strokeWidth="1.2" strokeLinejoin="round" />
          </g>
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
            <g transform={`translate(${cx(col) + 20}, ${cy(row) - 20})`}>
              <g className="animate-story-pop">
                <circle r="10" fill={RED} />
                <path d="M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
              </g>
            </g>
          </g>
        )}

        {/* backtrack: the queen is lifted off its square */}
        {action === 'backtrack' && row >= 0 && col >= 0 && (
          <g transform={`translate(${cx(col)}, ${cy(row)})`}>
            <g key={`lift-${step.stepIndex}`} className="animate-story-lift">
              <Queen />
              <g transform="translate(0, -34)">
                <rect x="-22" y="-11" width="44" height="22" rx="11" fill="#8b3fb0" />
                <text textAnchor="middle" y="4.5" fontSize="12" fontWeight="900" fill="#ffffff" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                  undo
                </text>
              </g>
            </g>
          </g>
        )}
      </svg>

      <StateSpaceTree
        nodes={treeNodes}
        rootId="root"
        activeId={activeId}
        newId={action === 'place' || action === 'conflict' ? activeId : undefined}
        revealPrune={action !== 'conflict' || phase === 'attack'}
        stepKey={step.stepIndex}
        nodeW={n * cell}
        nodeH={n * cell}
        leafGap={Math.max(n * cell + 30, 80)}
        renderNode={renderTreeNode}
        levelLabel={(d) => (d === 0 ? 'start' : d <= n ? `row ${d}` : undefined)}
        caption="Each level decides where the queen in one row goes. A square under attack is cut off at once, so nothing below it is ever tried."
      />

      {/* trophy shelf of solutions (find-all mode) */}
      {solutions.length > 0 && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="font-display font-black text-base text-stone-900">Solutions shelf</span>
          <div className="flex flex-wrap justify-center gap-2">
            {solutions.slice(0, 16).map((sol, k) => (
              <svg key={k} width={n * 9 + 4} height={n * 9 + 4} viewBox={`0 0 ${n * 9 + 4} ${n * 9 + 4}`} className={k === solutions.length - 1 && solved ? 'animate-story-pop' : undefined}>
                <rect width={n * 9 + 4} height={n * 9 + 4} rx="4" fill="#5e3c20" />
                {sol.map((c, r) =>
                  Array.from({ length: n }, (_, cc) => (
                    <rect key={`${r}-${cc}`} x={2 + cc * 9} y={2 + r * 9} width="9" height="9" fill={cc === c ? '#232020' : (r + cc) % 2 ? DARK : LIGHT} />
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
