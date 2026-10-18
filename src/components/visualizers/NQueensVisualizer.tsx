import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import {
  Crown,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  GitBranch,
  Crosshair,
} from 'lucide-react';
import { buildNQueensStateSpaceTree, NQueensTreeNode } from '../../algorithms/nQueensTree';
import type { NQueensAttack } from '../../algorithms/nQueens';

interface NQueensVisualizerProps {
  step: AlgorithmStep;
  inputs?: Record<string, any>;
}

export const NQueensVisualizer: React.FC<NQueensVisualizerProps> = ({ step, inputs }) => {
  const state = step.state || {};
  const n: number = state.n || inputs?.n || 4;
  const findAll: boolean = inputs?.findAll ?? false;
  const board: number[] = state.board || Array(n).fill(-1);
  const conflicts: { r: number; c: number }[] = state.conflicts || [];
  const action = state.action || 'init';
  const solutionCount = state.solutionCount || 0;
  const attack: NQueensAttack | undefined = action === 'conflict' ? state.attack : undefined;

  // Autofocus mechanism state (enabled by default so tree automatically tracks the active node)
  const [autofocus, setAutofocus] = useState<boolean>(true);

  // User-selected node inspection in tree view (null = follow active node)
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);

  // SVG Pan and Zoom for the State Space Tree
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // Zoom scale: defaults to 1.85 for fully zoomed-in active node focus
  const [zoomScale, setZoomScale] = useState<number>(1.85);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const treeSvgRef = useRef<SVGSVGElement>(null);

  // Filter mode for tree: 'all' | 'solutions' | 'conflicts' | 'active-branch'
  const [treeFilter, setTreeFilter] = useState<'all' | 'solutions' | 'conflicts' | 'active-branch'>('all');

  // Precompute full state space tree for (n, findAll)
  const tree = useMemo(() => {
    return buildNQueensStateSpaceTree(n, findAll);
  }, [n, findAll]);

  // Determine active node and active branch path from current step
  const activeNodeId = useMemo(() => {
    return tree.stepToNodeId[step.stepIndex] || tree.rootId;
  }, [tree, step.stepIndex]);

  const activePath = useMemo(() => {
    return tree.stepToActivePath[step.stepIndex] || [tree.rootId];
  }, [tree, step.stepIndex]);

  // Center pan on a specific tree node with specified zoom
  const centerOnNode = (nodeId: string, currentZoom = zoomScale) => {
    const target = tree.nodes[nodeId];
    if (target && treeContainerRef.current) {
      const containerWidth = treeContainerRef.current.clientWidth || 700;
      const containerHeight = treeContainerRef.current.clientHeight || 380;
      setPan({
        x: containerWidth / 2 - target.x * currentZoom,
        y: containerHeight / 2 - target.y * currentZoom,
      });
    }
  };

  // AUTOFOCUS: Automatically zoom in fully (1.85x) and center on the active node being operated on
  useEffect(() => {
    if (autofocus && !inspectedNodeId) {
      // During active search: zoom in fully (1.85x). On final complete step: show overview (0.9x)
      const targetZoom = step.isFinal ? 0.9 : 1.85;
      setZoomScale(targetZoom);
      centerOnNode(activeNodeId, targetZoom);
    }
  }, [step.stepIndex, activeNodeId, autofocus, inspectedNodeId, step.isFinal]);

  // Reset inspected node on step change to allow autofocus to follow active operation
  useEffect(() => {
    setInspectedNodeId(null);
  }, [step.stepIndex]);

  // Initial centering on mount
  useEffect(() => {
    const initialZoom = step.isFinal ? 0.9 : 1.85;
    setZoomScale(initialZoom);
    centerOnNode(activeNodeId, initialZoom);
  }, [tree]);

  // Handle pan drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    const targetZoom = step.isFinal ? 0.9 : 1.85;
    setZoomScale(targetZoom);
    setInspectedNodeId(null);
    centerOnNode(activeNodeId, targetZoom);
  };

  // Helper to determine node visual status at current step
  const getNodeVisualStatus = (node: NQueensTreeNode) => {
    const isVisited = node.firstStepIndex <= step.stepIndex;
    const isCurrentlyActive = node.id === activeNodeId;
    const isFinal = !!step.isFinal;

    if (isFinal) {
      if (node.status === 'solution') return 'solution';
      if (node.status === 'conflict') return 'conflict';
      if (tree.solutionNodeIds.some((sId) => sId.startsWith(node.id))) {
        return 'solution-path';
      }
      return 'conflict'; // dead-end pruned non-solution
    }

    if (!isVisited) return 'unvisited';
    if (isCurrentlyActive) return 'active';
    if (node.status === 'solution') return 'solution';
    if (node.status === 'conflict') return 'conflict';
    if (activePath.includes(node.id)) return 'active-path';
    return 'explored';
  };

  // Status message for the current branch decision
  const getBranchMessage = () => {
    if (step.isFinal) {
      return {
        type: 'final',
        title: 'Search Complete — Full State Space Tree Explored',
        detail: `Found ${tree.solutionNodeIds.length} valid solution(s). All solutions marked in GREEN and pruned dead-ends in RED.`,
        badge: 'Search Complete',
        badgeColor: 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300',
      };
    }

    if (action === 'init') {
      return {
        type: 'init',
        title: 'State Space Exploration Initialized',
        detail: `Objective: Place ${n} queens on an ${n}×${n} board so that no two share a row, column or diagonal.`,
        badge: 'Start at Root',
        badgeColor: 'border-chalk-500/40 bg-obsidian-950 text-chalk-300',
      };
    }

    if (action === 'place') {
      return {
        type: 'continue',
        title: `Row ${state.currentRow + 1}, Col ${state.currentCol + 1} is SAFE — Branch Continues ▾`,
        detail: `Row ${state.currentRow + 1}, column ${state.currentCol + 1} is safe from existing queens. The branch continues deeper to Row ${state.currentRow + 2}.`,
        badge: 'Continue Deeper',
        badgeColor: 'border-sky-500/60 bg-sky-950/60 text-sky-300',
      };
    }

    if (action === 'conflict') {
      return {
        type: 'conflict',
        title: `Row ${state.currentRow + 1}, Col ${state.currentCol + 1} CONFLICTS — Branch Pruned ✗`,
        detail: attack
          ? `Attacked along the ${attack.line} by Queen at (${attack.attacker.r + 1}, ${attack.attacker.c + 1}). Non-solution branch pruned!`
          : 'Square is attacked by another queen. Branch pruned!',
        badge: 'Pruned Non-Solution',
        badgeColor: 'border-rose-500/60 bg-rose-950/60 text-rose-300',
      };
    }

    if (action === 'backtrack') {
      return {
        type: 'backtrack',
        title: `Row ${state.currentRow + 1}, Col ${state.currentCol + 1} Exhausted — Backtrack ◂`,
        detail: `No safe placements exist further down this branch. Backtracking to parent node to try next column.`,
        badge: 'Backtrack Branch',
        badgeColor: 'border-amber-500/60 bg-amber-950/60 text-amber-300',
      };
    }

    if (action === 'solution') {
      return {
        type: 'solution',
        title: `VALID SOLUTION FOUND! (Solution #${solutionCount || 1}) 👑`,
        detail: `Successfully placed all ${n} queens without conflicts! Marked as valid solution in GREEN.`,
        badge: 'Solution Found',
        badgeColor: 'border-emerald-500/80 bg-emerald-950/80 text-emerald-300',
      };
    }

    return {
      type: 'normal',
      title: step.title || 'Exploring State Space Tree',
      detail: step.description || '',
      badge: 'Exploring',
      badgeColor: 'border-chalk-500/40 bg-obsidian-950 text-chalk-300',
    };
  };

  const branchInfo = getBranchMessage();

  // Chessboard cell calculation helpers
  const isConflictCell = (r: number, c: number) => {
    return conflicts.some((conf) => conf.r === r && conf.c === c);
  };
  const same = (p: { r: number; c: number } | undefined, r: number, c: number) =>
    !!p && p.r === r && p.c === c;
  const onAttackLine = (r: number, c: number) =>
    !!attack && attack.between.some((p) => p.r === r && p.c === c);
  const arrow = attack
    ? attack.line === 'column'
      ? '↓'
      : attack.attempted.c > attack.attacker.c
      ? '↘'
      : '↙'
    : '';

  // SVG dimensions
  const treeNodesArray = Object.values(tree.nodes);
  const maxX = Math.max(...treeNodesArray.map((nd) => nd.x), 800);
  const maxY = Math.max(...treeNodesArray.map((nd) => nd.y), 450);
  const svgWidth = Math.max(maxX + 160, 800);
  const svgHeight = Math.max(maxY + 120, 480);

  // Render node in the SVG tree
  const renderTreeNode = (node: NQueensTreeNode) => {
    const visualStatus = getNodeVisualStatus(node);
    const isInspected = node.id === (inspectedNodeId || activeNodeId);
    const isSolution = visualStatus === 'solution';
    const isConflict = visualStatus === 'conflict';
    const isActive = visualStatus === 'active';
    const isPath = visualStatus === 'active-path' || visualStatus === 'solution-path';

    if (visualStatus === 'unvisited' && treeFilter !== 'all') return null;
    if (treeFilter === 'solutions' && !isSolution && visualStatus !== 'solution-path') return null;
    if (treeFilter === 'conflicts' && !isConflict) return null;
    if (treeFilter === 'active-branch' && !activePath.includes(node.id)) return null;

    let fill = '#111827';
    let stroke = '#374151';
    let textColor = '#9ca3af';

    if (isSolution) {
      fill = '#064e3b'; // vibrant emerald green
      stroke = '#10b981';
      textColor = '#a7f3d0';
    } else if (isConflict) {
      fill = '#4c0519'; // vibrant rose red
      stroke = '#f43f5e';
      textColor = '#fecdd3';
    } else if (isActive) {
      fill = '#451a03'; // amber pulsing
      stroke = '#f59e0b';
      textColor = '#fef3c7';
    } else if (isPath) {
      fill = '#0c4a6e'; // sky blue
      stroke = '#38bdf8';
      textColor = '#bae6fd';
    } else if (visualStatus === 'unvisited') {
      fill = '#0a0f1d';
      stroke = '#1f293d';
      textColor = '#4b5563';
    }

    const nodeWidth = 76;
    const nodeHeight = 36;
    const rx = 6;

    return (
      <g
        key={node.id}
        transform={`translate(${node.x - nodeWidth / 2}, ${node.y - nodeHeight / 2})`}
        onClick={() => {
          setInspectedNodeId(node.id);
          centerOnNode(node.id);
        }}
        className="cursor-pointer transition-all hover:brightness-125"
      >
        {/* Glow halo for active node or solution */}
        {(isActive || isSolution) && (
          <rect
            x={-4}
            y={-4}
            width={nodeWidth + 8}
            height={nodeHeight + 8}
            rx={rx + 2}
            fill="none"
            stroke={isSolution ? '#10b981' : '#f59e0b'}
            strokeWidth={3}
            opacity={0.7}
            className={isActive ? 'animate-pulse' : ''}
          />
        )}

        {/* Selected inspection ring */}
        {isInspected && (
          <rect
            x={-6}
            y={-6}
            width={nodeWidth + 12}
            height={nodeHeight + 12}
            rx={rx + 4}
            fill="none"
            stroke="#e0e7ff"
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        )}

        {/* Node Box */}
        <rect
          x={0}
          y={0}
          width={nodeWidth}
          height={nodeHeight}
          rx={rx}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSolution || isConflict || isActive ? 2 : 1}
        />

        {/* Node Label */}
        <text
          x={nodeWidth / 2}
          y={nodeHeight / 2 - 2}
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill={textColor}
          fontFamily="ui-monospace, monospace"
        >
          {node.depth === 0 ? 'Root ∅' : `(R${node.row + 1}, C${node.col + 1})`}
        </text>

        {/* Subtitle / Status */}
        <text
          x={nodeWidth / 2}
          y={nodeHeight / 2 + 10}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill={isSolution ? '#34d399' : isConflict ? '#fb7185' : isActive ? '#fbbf24' : '#6b7280'}
          fontFamily="sans-serif"
        >
          {isSolution
            ? `👑 Sol #${node.solutionIndex || 1}`
            : isConflict
            ? '✗ Pruned'
            : isActive
            ? '● Operating'
            : node.depth === 0
            ? 'Empty'
            : '✓ Safe'}
        </text>
      </g>
    );
  };

  // Render edges in the SVG tree
  const renderTreeEdges = () => {
    const edges: React.ReactNode[] = [];

    for (const parent of treeNodesArray) {
      for (const childId of parent.children) {
        const child = tree.nodes[childId];
        if (!child) continue;

        const parentStatus = getNodeVisualStatus(parent);
        const childStatus = getNodeVisualStatus(child);

        if (childStatus === 'unvisited' && treeFilter !== 'all') continue;
        if (treeFilter === 'solutions' && childStatus !== 'solution' && childStatus !== 'solution-path') continue;
        if (treeFilter === 'conflicts' && childStatus !== 'conflict') continue;
        if (treeFilter === 'active-branch' && (!activePath.includes(parent.id) || !activePath.includes(child.id))) continue;

        const isActiveEdge = activePath.includes(parent.id) && activePath.includes(child.id);
        const isSolutionEdge =
          (parentStatus === 'solution' || parentStatus === 'solution-path') &&
          (childStatus === 'solution' || childStatus === 'solution-path');
        const isConflictEdge = childStatus === 'conflict';

        let strokeColor = '#374151';
        let strokeWidth = 1.5;
        let strokeDash = 'none';

        if (isSolutionEdge) {
          strokeColor = '#10b981'; // Green for solutions
          strokeWidth = 3;
        } else if (isConflictEdge) {
          strokeColor = '#f43f5e'; // Red for pruned conflicts
          strokeWidth = 2;
          strokeDash = '4 2';
        } else if (isActiveEdge) {
          strokeColor = '#f59e0b'; // Amber for active path
          strokeWidth = 2.5;
        }

        const x1 = parent.x;
        const y1 = parent.y + 18;
        const x2 = child.x;
        const y2 = child.y - 18;
        const midY = (y1 + y2) / 2;
        const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

        edges.push(
          <g key={`${parent.id}->${child.id}`}>
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              className={isActiveEdge ? 'transition-all duration-300' : ''}
            />
            {/* Branch column label */}
            <rect
              x={(x1 + x2) / 2 - 16}
              y={midY - 7}
              width={32}
              height={14}
              rx={3}
              fill="#0b0f19"
              stroke={strokeColor}
              strokeWidth={0.7}
              opacity={0.95}
            />
            <text
              x={(x1 + x2) / 2}
              y={midY + 3.5}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fontFamily="ui-monospace, monospace"
              fill={strokeColor}
            >
              C{child.col + 1}
            </text>
          </g>
        );
      }
    }

    return edges;
  };

  return (
    <div className="flex flex-col w-full min-h-[400px] bg-obsidian-900 border border-hairline transition-all">
      {/* ─────────────────────────────────────────────────────────────
          TOP SECTION: THE MAIN CHESSBOARD (Wherever it was before)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center w-full p-6 bg-obsidian-900 border-b border-hairline">
        {/* Solution Status Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-5 text-sm font-sans">
          <span className="px-3 py-1 bg-obsidian-950 border border-hairline text-chalk-300">
            Board <strong className="font-mono">{n} × {n}</strong>
          </span>
          <span className="px-3 py-1 bg-obsidian-950 border border-sem-final/40 text-sem-final-ink">
            Solutions found <strong className="font-mono">{solutionCount}</strong>
          </span>
          {action === 'conflict' && (
            <span
              data-conflict-banner
              className="px-3 py-1 bg-sem-mismatch/15 border border-sem-mismatch/60 text-sem-mismatch-ink font-semibold flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {attack
                ? `✗ Attacked along the ${attack.line} ${arrow} by the queen at (${attack.attacker.r + 1}, ${attack.attacker.c + 1})`
                : '✗ This square is attacked'}
            </span>
          )}
        </div>

        {/* Chessboard Grid Container */}
        <div className="p-3 bg-obsidian-950 border border-hairline shadow-2xl">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: n }).map((_, r) =>
              Array.from({ length: n }).map((_, c) => {
                const hasQueen = board[r] === c;
                const isDarkTile = (r + c) % 2 === 1;
                const isAttempted = attack
                  ? same(attack.attempted, r, c)
                  : isConflictCell(r, c) && state.currentRow === r;
                const isAttacker = attack
                  ? same(attack.attacker, r, c)
                  : isConflictCell(r, c) && !isAttempted;
                const isCurrentCell = state.currentRow === r && state.currentCol === c;
                const onLine = onAttackLine(r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    id={`tree-node-${r}-${c}`}
                    data-tree-node-id={`${r}-${c}`}
                    className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all duration-200 select-none ${
                      isAttempted
                        ? 'bg-sem-mismatch/15 border-2 border-sem-mismatch'
                        : isAttacker
                        ? 'bg-sem-warning/15 border-2 border-sem-warning'
                        : onLine
                        ? 'bg-sem-mismatch/10 border-2 border-dashed border-sem-mismatch/60'
                        : isCurrentCell
                        ? 'bg-sem-current/20 border border-sem-current'
                        : hasQueen
                        ? 'bg-sem-decision/10 border border-sem-decision/70'
                        : isDarkTile
                        ? 'bg-obsidian-850 border border-hairline'
                        : 'bg-obsidian-800/60 border border-hairline'
                    }`}
                  >
                    {/* Coordinates indicator on corners */}
                    <span className="absolute top-0.5 left-1 text-[11px] font-mono text-chalk-600 pointer-events-none">
                      {r + 1},{c + 1}
                    </span>

                    {/* Conflict marks: readable without colour */}
                    {isAttempted && (
                      <span
                        data-attempted
                        className="absolute top-0.5 right-1 text-sm font-bold leading-none text-sem-mismatch-ink"
                        aria-label="attempted square, attacked"
                      >
                        ✗
                      </span>
                    )}
                    {isAttacker && (
                      <span
                        data-attacker
                        className="absolute bottom-0.5 inset-x-0 text-center font-sans text-[11px] font-bold leading-none text-sem-warning-ink"
                        aria-label="attacking queen"
                      >
                        attacker
                      </span>
                    )}
                    {onLine && (
                      <span
                        data-attack-line
                        className="text-lg font-bold leading-none text-sem-mismatch-ink"
                        aria-label={`line of attack (${attack!.line})`}
                      >
                        {arrow}
                      </span>
                    )}

                    {/* Queen Icon */}
                    {hasQueen && (
                      <div className="flex flex-col items-center justify-center">
                        <Crown
                          className={`w-6 h-6 md:w-7 md:h-7 ${
                            isAttempted
                              ? 'text-sem-mismatch-ink'
                              : isAttacker
                              ? 'text-sem-warning-ink'
                              : isCurrentCell
                              ? 'text-sem-current-ink'
                              : 'text-sem-decision-ink'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chessboard Legend */}
        <ul
          aria-label="Legend"
          className="flex flex-wrap items-center justify-center gap-5 mt-5 text-xs font-sans text-chalk-400"
        >
          <li className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-sem-decision-ink" />
            <span>Queen placed</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="px-1 text-[11px] font-bold bg-sem-current/30 border border-sem-current text-sem-current-ink">
              ▶
            </span>
            <span>Square being tried</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="px-1 text-[11px] font-bold bg-sem-mismatch/20 border-2 border-sem-mismatch text-sem-mismatch-ink">
              ✗
            </span>
            <span>Rejected square</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="px-1 text-[11px] font-bold bg-sem-warning/20 border-2 border-sem-warning text-sem-warning-ink">
              ♛
            </span>
            <span>Attacking queen</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="px-1 text-[11px] font-bold border-2 border-dashed border-sem-mismatch/60 text-sem-mismatch-ink">
              ↓↘
            </span>
            <span>Line of attack</span>
          </li>
        </ul>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM SECTION: STATE SPACE TREE WITH AUTOFOCUS MECHANISM
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col w-full p-4 bg-obsidian-950/80">
        {/* State Space Tree Header & Autofocus Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-hairline">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold font-mono text-chalk-100">
              State Space Tree Exploration
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${branchInfo.badgeColor}`}>
              {branchInfo.badge}
            </span>
          </div>

          {/* Action / Decision Status */}
          <div className="flex items-center gap-2">
            {/* Autofocus Toggle */}
            <button
              onClick={() => setAutofocus(!autofocus)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors flex items-center gap-1.5 ${
                autofocus
                  ? 'border-accent bg-accent/15 text-accent-ink font-semibold'
                  : 'border-hairline bg-obsidian-900 text-chalk-500'
              }`}
              title="Automatically centers the tree pane on the active operation node"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Autofocus: {autofocus ? 'ON' : 'OFF'}</span>
            </button>

            {/* Target Active Node Button */}
            <button
              onClick={() => centerOnNode(activeNodeId, zoomScale)}
              className="px-2.5 py-1 text-xs font-mono rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100 active:scale-95 transition-all"
              title="Center view on currently operating node"
            >
              Target Active 🎯
            </button>

            {/* Toggle Fully Zoomed In vs Overview */}
            <button
              onClick={() => {
                const nextZoom = zoomScale >= 1.5 ? 0.9 : 1.85;
                setZoomScale(nextZoom);
                centerOnNode(activeNodeId, nextZoom);
              }}
              className="px-2.5 py-1 text-xs font-mono rounded bg-obsidian-900 border border-hairline text-amber-300 hover:text-amber-200"
              title="Toggle between fully zoomed-in active node view and overview"
            >
              {zoomScale >= 1.5 ? '🔭 Overview (0.9x)' : '🔍 Focus Node (1.85x)'}
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const z = Math.min(zoomScale + 0.2, 2.5);
                  setZoomScale(z);
                  centerOnNode(activeNodeId, z);
                }}
                className="p-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const z = Math.max(zoomScale - 0.2, 0.4);
                  setZoomScale(z);
                  centerOnNode(activeNodeId, z);
                }}
                className="p-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetView}
                className="p-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                title="Reset view and autofocus"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Branch Decision Context Banner */}
        <div className="flex items-center justify-between px-3 py-2 mb-3 bg-obsidian-900 border border-hairline rounded text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-chalk-200">{branchInfo.title}:</span>
            <span className="text-chalk-400">{branchInfo.detail}</span>
          </div>
          <span className="text-chalk-500 font-mono text-[11px] hidden md:inline">
            Active: {activeNodeId === 'root' ? 'Root' : activeNodeId.split('/').pop()}
          </span>
        </div>

        {/* Filter bar for tree */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-mono">
          <div className="inline-flex rounded border border-hairline bg-obsidian-900 p-0.5">
            <button
              onClick={() => setTreeFilter('all')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                treeFilter === 'all'
                  ? 'bg-accent text-obsidian-950 font-bold'
                  : 'text-chalk-400 hover:text-chalk-100'
              }`}
            >
              All Nodes ({tree.totalNodes})
            </button>
            <button
              onClick={() => setTreeFilter('solutions')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                treeFilter === 'solutions'
                  ? 'bg-emerald-500 text-obsidian-950 font-bold'
                  : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              Solutions Only ({tree.solutionNodeIds.length})
            </button>
            <button
              onClick={() => setTreeFilter('conflicts')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                treeFilter === 'conflicts'
                  ? 'bg-rose-500 text-obsidian-950 font-bold'
                  : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              Pruned Non-Solutions ({tree.conflictNodeIds.length})
            </button>
            <button
              onClick={() => setTreeFilter('active-branch')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                treeFilter === 'active-branch'
                  ? 'bg-sky-500 text-obsidian-950 font-bold'
                  : 'text-sky-400 hover:text-sky-200'
              }`}
            >
              Active Branch
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-chalk-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Green: Solution</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Red: Pruned</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Amber: Active</span>
            </span>
          </div>
        </div>

        {/* Tree SVG Viewport Container (with Autofocus smooth gliding transition) */}
        <div
          ref={treeContainerRef}
          className="relative w-full h-[380px] overflow-hidden rounded-lg bg-obsidian-950 border border-hairline cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={treeSvgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full"
          >
            <g
              transform={`translate(${pan.x}, ${pan.y}) scale(${zoomScale})`}
              style={{
                transition: isPanning ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            >
              {renderTreeEdges()}
              {treeNodesArray.map((node) => renderTreeNode(node))}
            </g>
          </svg>

          {/* Floating Active Path Bar */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded bg-obsidian-950/90 border border-hairline text-[11px] font-mono text-chalk-400 backdrop-blur pointer-events-none">
            <span className="flex items-center gap-1.5">
              <span className="text-accent font-semibold">Active Branch:</span>
              <span>{activePath.map((id) => (id === 'root' ? '∅' : id.split('/').pop())).join(' → ')}</span>
            </span>
            <span className="text-chalk-500">Autofocus tracks current operation • Drag to pan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
