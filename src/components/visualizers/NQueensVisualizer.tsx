import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import {
  Crown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  GitBranch,
  Camera,
} from 'lucide-react';
import { BoardVisualizer } from './BoardVisualizer';
import { buildNQueensStateSpaceTree, NQueensTreeNode } from '../../algorithms/nQueensTree';
import type { NQueensAttack } from '../../algorithms/nQueens';

interface NQueensVisualizerProps {
  step: AlgorithmStep;
  inputs?: Record<string, any>;
}

export type NQueensViewMode = 'cinematic' | 'tree' | 'board';

export const NQueensVisualizer: React.FC<NQueensVisualizerProps> = ({ step, inputs }) => {
  const state = step.state || {};
  const n: number = state.n || inputs?.n || 4;
  const findAll: boolean = inputs?.findAll ?? false;

  // View mode switcher: Cinematic Tree & Zoom (default), Full State Space Tree, Classic Chessboard
  const [viewMode, setViewMode] = useState<NQueensViewMode>('cinematic');

  // Camera Zoom state for cinematic view: 'in' = focused on node chessboard, 'out' = overview on tree
  const [cameraZoom, setCameraZoom] = useState<'in' | 'out'>('in');
  const [autoZoom, setAutoZoom] = useState<boolean>(true);

  // User-selected node inspection in tree view (defaults to active node)
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);

  // SVG Pan and Zoom for the State Space Tree
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const treeSvgRef = useRef<SVGSVGElement>(null);

  // Filter mode for tree: 'all' | 'solutions' | 'conflicts' | 'active-branch'
  const [treeFilter, setTreeFilter] = useState<'all' | 'solutions' | 'conflicts' | 'active-branch'>('all');

  // Generate or memoize the full state space tree for (n, findAll)
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

  // Node currently shown in the focused chessboard inspector
  const currentNode = useMemo(() => {
    const idToUse = inspectedNodeId && tree.nodes[inspectedNodeId] ? inspectedNodeId : activeNodeId;
    return tree.nodes[idToUse] || tree.nodes[tree.rootId];
  }, [inspectedNodeId, activeNodeId, tree]);

  // Auto-zoom effect on step changes
  useEffect(() => {
    if (autoZoom) {
      if (step.isFinal) {
        setCameraZoom('out');
      } else {
        setCameraZoom('in');
      }
    }
  }, [step.stepIndex, step.isFinal, autoZoom]);

  // Reset inspected node on step index change so it follows active path unless manually clicked
  useEffect(() => {
    setInspectedNodeId(null);
  }, [step.stepIndex]);

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
    setPan({ x: 0, y: 0 });
    setZoomScale(1);
    setInspectedNodeId(null);
  };

  // Center pan on active node
  const centerOnNode = (nodeId: string) => {
    const target = tree.nodes[nodeId];
    if (target && treeSvgRef.current) {
      const rect = treeSvgRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - target.x * zoomScale,
        y: 80 - target.y * zoomScale,
      });
    }
  };

  // Helper to determine node visual status at current step
  const getNodeVisualStatus = (node: NQueensTreeNode) => {
    const isVisited = node.firstStepIndex <= step.stepIndex;
    const isCurrentlyActive = node.id === activeNodeId;
    const isFinal = !!step.isFinal;

    if (isFinal) {
      if (node.status === 'solution') return 'solution';
      if (node.status === 'conflict') return 'conflict';
      // If node led to a solution:
      if (tree.solutionNodeIds.some((sId) => sId.startsWith(node.id))) {
        return 'solution-path';
      }
      return 'conflict'; // dead-end non-solution
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
        title: 'Search Complete — State Space Tree Analyzed',
        detail: `Found ${tree.solutionNodeIds.length} valid solution(s). Marked all solutions in GREEN and all pruned dead-ends in RED.`,
        badge: 'Tree Complete',
        badgeColor: 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300',
      };
    }

    const action = state.action || 'init';
    if (action === 'init') {
      return {
        type: 'init',
        title: 'State Space Exploration Initialized',
        detail: `Objective: Place ${n} queens on an ${n}×${n} board so that no two share row, column or diagonal. Exploring decisions level by level.`,
        badge: 'Start at Root',
        badgeColor: 'border-chalk-500/40 bg-obsidian-950 text-chalk-300',
      };
    }

    if (action === 'place') {
      return {
        type: 'continue',
        title: `Row ${state.currentRow + 1}, Col ${state.currentCol + 1} is SAFE — Branch Continues ▾`,
        detail: `Queen placed safely with zero attacks. The search branches deeper into Row ${state.currentRow + 2}.`,
        badge: 'Continue Deeper',
        badgeColor: 'border-sky-500/60 bg-sky-950/60 text-sky-300',
      };
    }

    if (action === 'conflict') {
      const attack: NQueensAttack | undefined = state.attack;
      return {
        type: 'conflict',
        title: `Row ${state.currentRow + 1}, Col ${state.currentCol + 1} CONFLICTS — Branch Pruned ✗`,
        detail: attack
          ? `Attacked along ${attack.line} by Queen at (${attack.attacker.r + 1}, ${attack.attacker.c + 1}). This branch is a non-solution and is pruned!`
          : 'Square is attacked by another queen. Branch pruned!',
        badge: 'Pruned Non-Solution',
        badgeColor: 'border-rose-500/60 bg-rose-950/60 text-rose-300',
      };
    }

    if (action === 'backtrack') {
      return {
        type: 'backtrack',
        title: `Row ${state.currentRow + 1}, Col ${state.currentCol + 1} Exhausted — Backtrack ◂`,
        detail: `All child subtrees under this placement failed or finished. Removing queen and trying next divergent column.`,
        badge: 'Backtrack Branch',
        badgeColor: 'border-amber-500/60 bg-amber-950/60 text-amber-300',
      };
    }

    if (action === 'solution') {
      return {
        type: 'solution',
        title: `VALID SOLUTION FOUND! (Solution #${state.solutionCount || 1}) 👑`,
        detail: `All ${n} queens placed safely with 0 conflicts! Reached leaf depth ${n}.`,
        badge: 'Solution Reached',
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

  // If in classic board mode, render standard BoardVisualizer
  if (viewMode === 'board') {
    return (
      <div className="flex flex-col w-full">
        {/* View Mode Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-obsidian-950 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-chalk-400">View Mode:</span>
            <div className="inline-flex rounded border border-hairline bg-obsidian-900 p-0.5">
              <button
                onClick={() => setViewMode('cinematic')}
                className="px-3 py-1 text-xs font-mono rounded text-chalk-400 hover:text-chalk-100 transition-colors"
              >
                🎬 Cinematic Tree & Zoom
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className="px-3 py-1 text-xs font-mono rounded text-chalk-400 hover:text-chalk-100 transition-colors"
              >
                🌳 State Space Tree
              </button>
              <button
                onClick={() => setViewMode('board')}
                className="px-3 py-1 text-xs font-mono rounded bg-accent text-obsidian-950 font-semibold shadow"
              >
                ♟ Classic Board
              </button>
            </div>
          </div>
        </div>
        <BoardVisualizer step={step} />
      </div>
    );
  }

  // Calculate SVG dimensions
  const treeNodesArray = Object.values(tree.nodes);
  const maxX = Math.max(...treeNodesArray.map((nd) => nd.x), 800);
  const maxY = Math.max(...treeNodesArray.map((nd) => nd.y), 450);
  const svgWidth = Math.max(maxX + 120, 800);
  const svgHeight = Math.max(maxY + 100, 480);

  // Render node in the SVG tree
  const renderTreeNode = (node: NQueensTreeNode) => {
    const visualStatus = getNodeVisualStatus(node);
    const isInspected = node.id === currentNode.id;
    const isSolution = visualStatus === 'solution';
    const isConflict = visualStatus === 'conflict';
    const isActive = visualStatus === 'active';
    const isPath = visualStatus === 'active-path' || visualStatus === 'solution-path';

    if (visualStatus === 'unvisited' && treeFilter !== 'all') {
      return null;
    }
    if (treeFilter === 'solutions' && !isSolution && visualStatus !== 'solution-path') {
      return null;
    }
    if (treeFilter === 'conflicts' && !isConflict) {
      return null;
    }
    if (treeFilter === 'active-branch' && !activePath.includes(node.id)) {
      return null;
    }

    // Node colors: Green for solutions, Red for non-solutions / conflicts
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
          setCameraZoom('in');
        }}
        className="cursor-pointer transition-all hover:brightness-125"
      >
        {/* Glow for active or solution */}
        {(isActive || isSolution) && (
          <rect
            x={-3}
            y={-3}
            width={nodeWidth + 6}
            height={nodeHeight + 6}
            rx={rx + 2}
            fill="none"
            stroke={isSolution ? '#10b981' : '#f59e0b'}
            strokeWidth={3}
            opacity={0.6}
            className={isActive ? 'animate-pulse' : ''}
          />
        )}

        {/* Selected inspection ring */}
        {isInspected && (
          <rect
            x={-5}
            y={-5}
            width={nodeWidth + 10}
            height={nodeHeight + 10}
            rx={rx + 3}
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

        {/* Badge / Subtitle */}
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
            ? '● Testing'
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

        // Curved bezier path from bottom of parent to top of child
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
            {/* Edge branch choice label */}
            <rect
              x={(x1 + x2) / 2 - 16}
              y={midY - 7}
              width={32}
              height={14}
              rx={3}
              fill="#0b0f19"
              stroke={strokeColor}
              strokeWidth={0.7}
              opacity={0.9}
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

  // Render the Focused Node Chessboard
  const renderFocusedChessboard = () => {
    const inspectedBoard = currentNode.board || Array(n).fill(-1);
    const inspectedRow = currentNode.row;
    const inspectedCol = currentNode.col;
    const isConflictNode = currentNode.status === 'conflict';
    const isSolutionNode = currentNode.status === 'solution';
    const isRoot = currentNode.depth === 0;
    const attack = isConflictNode ? currentNode.attack : undefined;

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

    return (
      <div className="flex flex-col items-center w-full">
        {/* Node Header & Action pill */}
        <div className="flex flex-wrap items-center justify-between w-full max-w-md px-3 py-1.5 mb-2 rounded bg-obsidian-950 border border-hairline text-xs font-mono">
          <span className="flex items-center gap-1.5 text-chalk-200">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>
              {isRoot
                ? 'Root (Empty Board)'
                : `Focus: Row ${inspectedRow + 1}, Col ${inspectedCol + 1}`}
            </span>
          </span>

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isSolutionNode
                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                : isConflictNode
                ? 'bg-rose-950/80 border border-rose-500 text-rose-300'
                : isRoot
                ? 'bg-obsidian-900 border border-hairline text-chalk-400'
                : 'bg-sky-950/80 border border-sky-500 text-sky-300'
            }`}
          >
            {isSolutionNode
              ? `👑 Solution #${currentNode.solutionIndex || 1}`
              : isConflictNode
              ? '✗ Conflict Pruned'
              : isRoot
              ? 'Start'
              : '✓ Safe Placement'}
          </span>
        </div>

        {/* Interactive Chessboard Container */}
        <div
          className={`relative p-3 bg-obsidian-950 border-2 rounded-lg shadow-2xl transition-all duration-300 ${
            cameraZoom === 'in'
              ? 'scale-100 ring-2 ring-accent/30'
              : 'scale-95 opacity-90'
          } ${
            isSolutionNode
              ? 'border-emerald-500'
              : isConflictNode
              ? 'border-rose-500'
              : 'border-hairline'
          }`}
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: n }).map((_, r) =>
              Array.from({ length: n }).map((_, c) => {
                const hasQueen = inspectedBoard[r] === c;
                const isDarkTile = (r + c) % 2 === 1;
                const isAttempted = attack
                  ? same(attack.attempted, r, c)
                  : r === inspectedRow && c === inspectedCol;
                const isAttacker = attack ? same(attack.attacker, r, c) : false;
                const onLine = onAttackLine(r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    id={`tree-node-${r}-${c}`}
                    data-tree-node-id={`${r}-${c}`}
                    className={`relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 transition-all duration-200 select-none rounded-sm ${
                      isAttempted && isConflictNode
                        ? 'bg-rose-950/40 border-2 border-rose-500 shadow-inner'
                        : isAttacker
                        ? 'bg-amber-950/40 border-2 border-amber-400'
                        : onLine
                        ? 'bg-rose-950/20 border-2 border-dashed border-rose-500/60'
                        : hasQueen
                        ? isSolutionNode
                          ? 'bg-emerald-950/30 border-2 border-emerald-500/80'
                          : 'bg-sky-950/30 border border-sky-400/70'
                        : isDarkTile
                        ? 'bg-obsidian-850 border border-hairline/60'
                        : 'bg-obsidian-800/60 border border-hairline/60'
                    }`}
                  >
                    {/* Row, Col label */}
                    <span className="absolute top-0.5 left-1 text-[9px] font-mono text-chalk-600 pointer-events-none">
                      {r + 1},{c + 1}
                    </span>

                    {/* Conflict indicators */}
                    {isAttempted && isConflictNode && (
                      <span
                        data-attempted
                        className="absolute top-0.5 right-1 text-sm font-bold leading-none text-rose-400"
                        aria-label="attempted square, attacked"
                      >
                        ✗
                      </span>
                    )}

                    {isAttacker && (
                      <span
                        data-attacker
                        className="absolute bottom-0.5 inset-x-0 text-center font-sans text-[10px] font-bold leading-none text-amber-300"
                        aria-label="attacking queen"
                      >
                        attacker
                      </span>
                    )}

                    {onLine && (
                      <span
                        data-attack-line
                        className="text-base font-bold leading-none text-rose-400"
                        aria-label={`line of attack (${attack!.line})`}
                      >
                        {arrow}
                      </span>
                    )}

                    {/* Queen Icon */}
                    {hasQueen && (
                      <Crown
                        className={`w-6 h-6 transition-all ${
                          isSolutionNode
                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : isAttempted && isConflictNode
                            ? 'text-rose-400'
                            : isAttacker
                            ? 'text-amber-400'
                            : 'text-sky-300'
                        }`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Constraint Evaluation Explanation Box */}
        <div className="w-full max-w-md mt-3 p-3 bg-obsidian-950 border border-hairline rounded text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono font-semibold text-chalk-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-accent" />
              <span>Node Board Constraint Check</span>
            </span>
            <span className="text-[10px] font-mono text-chalk-500">
              Depth {currentNode.depth} / {n}
            </span>
          </div>

          <p className="text-chalk-400 leading-relaxed">
            {isSolutionNode ? (
              <span className="text-emerald-300 font-medium">
                👑 All {n} queens are placed with zero row, column or diagonal attacks. Complete valid solution!
              </span>
            ) : isConflictNode ? (
              <span className="text-rose-300 font-medium">
                ✗ Conflict detected: Candidate at ({inspectedRow + 1}, {inspectedCol + 1}) is attacked along the{' '}
                {attack?.line} by Queen at ({attack ? attack.attacker.r + 1 : '?'}, {attack ? attack.attacker.c + 1 : '?'}).
                Pruning this branch immediately!
              </span>
            ) : isRoot ? (
              <span>Initial empty board state. Search will try columns 1 to {n} for Row 1.</span>
            ) : (
              <span className="text-sky-300">
                ✓ Safe placement! Position ({inspectedRow + 1}, {inspectedCol + 1}) has no conflicts with existing queens.
                Branch continues to row {inspectedRow + 2}.
              </span>
            )}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full bg-obsidian-900 border border-hairline transition-all">
      {/* Top Bar: View Mode Switcher + Branch Diverge / Continue Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-obsidian-950 border-b border-hairline">
        {/* View Mode segmented control */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-mono text-chalk-400">View:</span>
          <div className="inline-flex rounded border border-hairline bg-obsidian-900 p-0.5">
            <button
              onClick={() => setViewMode('cinematic')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                viewMode === 'cinematic'
                  ? 'bg-accent text-obsidian-950 font-bold shadow'
                  : 'text-chalk-400 hover:text-chalk-100'
              }`}
            >
              🎬 Cinematic Tree & Zoom
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                viewMode === 'tree'
                  ? 'bg-accent text-obsidian-950 font-bold shadow'
                  : 'text-chalk-400 hover:text-chalk-100'
              }`}
            >
              🌳 State Space Tree
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                (viewMode as string) === 'board'
                  ? 'bg-accent text-obsidian-950 font-bold shadow'
                  : 'text-chalk-400 hover:text-chalk-100'
              }`}
            >
              ♟ Classic Board
            </button>
          </div>
        </div>

        {/* Tree exploration status chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
          <span className="px-2.5 py-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 font-mono">
            Board <strong className="text-chalk-100">{n}×{n}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 font-mono">
            Solutions Found: <strong>{tree.solutionNodeIds.length}</strong> (Green)
          </span>
          <span className="px-2.5 py-1 rounded bg-rose-950/50 border border-rose-500/50 text-rose-300 font-mono">
            Pruned Dead-Ends: <strong>{tree.conflictNodeIds.length}</strong> (Red)
          </span>
        </div>
      </div>

      {/* Decision Focus Banner: Diverge / Continue / Prune / Solution */}
      <div className="px-4 py-2.5 bg-obsidian-950/70 border-b border-hairline flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${branchInfo.badgeColor}`}>
            {branchInfo.badge}
          </span>
          <span className="text-sm font-semibold text-chalk-100">{branchInfo.title}</span>
        </div>
        <p className="text-xs text-chalk-400 max-w-xl truncate">{branchInfo.detail}</p>
      </div>

      {/* Main Content Area based on View Mode */}
      {viewMode === 'cinematic' ? (
        /* Cinematic Mode: Split View with Zoomed Board Camera on Left, Tree Branch Focus on Right */
        <div className="flex flex-col lg:flex-row gap-4 p-4">
          {/* Left Column: Focused Node Chessboard with Camera Controls */}
          <div className="w-full lg:w-[42%] flex flex-col items-center bg-obsidian-950/60 border border-hairline rounded-lg p-4">
            {/* Camera Control Bar */}
            <div className="flex items-center justify-between w-full mb-3 pb-2 border-b border-hairline">
              <div className="flex items-center gap-1.5 text-xs font-mono text-chalk-300">
                <Camera className="w-3.5 h-3.5 text-accent" />
                <span className="font-semibold">Camera Focus</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCameraZoom('in')}
                  className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                    cameraZoom === 'in'
                      ? 'bg-accent text-obsidian-950 font-bold'
                      : 'bg-obsidian-900 border border-hairline text-chalk-400 hover:text-chalk-200'
                  }`}
                  title="Zoom in to inspect chessboard and solve constraints"
                >
                  🔍 Zoom In (Solve)
                </button>
                <button
                  onClick={() => setCameraZoom('out')}
                  className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                    cameraZoom === 'out'
                      ? 'bg-accent text-obsidian-950 font-bold'
                      : 'bg-obsidian-900 border border-hairline text-chalk-400 hover:text-chalk-200'
                  }`}
                  title="Zoom out to view wider tree"
                >
                  🔭 Zoom Out
                </button>
                <button
                  onClick={() => setAutoZoom(!autoZoom)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                    autoZoom
                      ? 'border-accent/60 bg-accent/15 text-accent-ink font-semibold'
                      : 'border-hairline text-chalk-500'
                  }`}
                  title="Automatically zoom in to each node chessboard on each step"
                >
                  ⚡ Auto-Zoom: {autoZoom ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* The Chessboard */}
            {renderFocusedChessboard()}
          </div>

          {/* Right Column: State Space Tree Canvas with Branch Navigation */}
          <div className="w-full lg:w-[58%] flex flex-col bg-obsidian-950/60 border border-hairline rounded-lg p-4">
            {/* Tree Navigation Toolbar */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono font-semibold text-chalk-200">
                  State Space Tree (Click any node to zoom into its board)
                </span>
              </div>

              {/* Pan & Zoom Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomScale((z) => Math.min(z + 0.15, 2.0))}
                  className="p-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomScale((z) => Math.max(z - 0.15, 0.4))}
                  className="p-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetView}
                  className="p-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                  title="Reset Pan & Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => centerOnNode(activeNodeId)}
                  className="px-2 py-0.5 text-xs font-mono rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                  title="Center on active node"
                >
                  Target Active
                </button>
              </div>
            </div>

            {/* Interactive SVG Tree Area */}
            <div
              className="relative w-full h-[430px] overflow-hidden rounded bg-obsidian-950 border border-hairline/60 cursor-grab active:cursor-grabbing select-none"
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
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoomScale})`}>
                  {/* Edges */}
                  {renderTreeEdges()}
                  {/* Nodes */}
                  {treeNodesArray.map((node) => renderTreeNode(node))}
                </g>
              </svg>

              {/* Floating Active Path Strip */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded bg-obsidian-950/90 border border-hairline text-[11px] font-mono text-chalk-400 backdrop-blur">
                <span className="flex items-center gap-1.5">
                  <span className="text-accent font-semibold">Active Path:</span>
                  <span>{activePath.map((id) => (id === 'root' ? '∅' : id.split('/').pop())).join(' → ')}</span>
                </span>
                <span className="text-chalk-500">Drag to pan • Click node to inspect</span>
              </div>
            </div>

            {/* Tree Legend Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-2 border-t border-hairline text-[11px] font-sans text-chalk-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Green: Solution</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Red: Pruned Non-Solution</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Amber: Current Active Node</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>Cyan: Safe (Continue)</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Full State Space Tree Mode */
        <div className="flex flex-col p-4 w-full">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2 bg-obsidian-950 rounded border border-hairline">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-chalk-400">Filter Tree:</span>
              <div className="inline-flex rounded border border-hairline bg-obsidian-900 p-0.5 text-xs font-mono">
                <button
                  onClick={() => setTreeFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    treeFilter === 'all' ? 'bg-accent text-obsidian-950 font-bold' : 'text-chalk-400 hover:text-chalk-100'
                  }`}
                >
                  All Nodes ({tree.totalNodes})
                </button>
                <button
                  onClick={() => setTreeFilter('solutions')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    treeFilter === 'solutions'
                      ? 'bg-emerald-500 text-obsidian-950 font-bold'
                      : 'text-emerald-400 hover:text-emerald-200'
                  }`}
                >
                  Solutions Only ({tree.solutionNodeIds.length})
                </button>
                <button
                  onClick={() => setTreeFilter('conflicts')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    treeFilter === 'conflicts'
                      ? 'bg-rose-500 text-obsidian-950 font-bold'
                      : 'text-rose-400 hover:text-rose-200'
                  }`}
                >
                  Pruned Non-Solutions ({tree.conflictNodeIds.length})
                </button>
                <button
                  onClick={() => setTreeFilter('active-branch')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    treeFilter === 'active-branch'
                      ? 'bg-sky-500 text-obsidian-950 font-bold'
                      : 'text-sky-400 hover:text-sky-200'
                  }`}
                >
                  Active Branch
                </button>
              </div>
            </div>

            {/* Tree zoom buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomScale((z) => Math.min(z + 0.2, 2.5))}
                className="p-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomScale((z) => Math.max(z - 0.2, 0.3))}
                className="p-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="p-1 rounded bg-obsidian-900 border border-hairline text-chalk-300 hover:text-chalk-100"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Full Screen Tree Canvas */}
          <div
            className="relative w-full h-[540px] overflow-hidden rounded-lg bg-obsidian-950 border border-hairline cursor-grab active:cursor-grabbing select-none"
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
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoomScale})`}>
                {renderTreeEdges()}
                {treeNodesArray.map((node) => renderTreeNode(node))}
              </g>
            </svg>

            {/* Pop-up Inspector for Selected Node */}
            {inspectedNodeId && (
              <div className="absolute top-4 right-4 w-72 p-3 bg-obsidian-950/95 border border-hairline rounded-lg shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-hairline">
                  <span className="text-xs font-mono font-bold text-chalk-200">
                    Inspecting: {currentNode.label}
                  </span>
                  <button
                    onClick={() => setInspectedNodeId(null)}
                    className="text-chalk-500 hover:text-chalk-200 text-xs font-mono"
                  >
                    ✕
                  </button>
                </div>
                {renderFocusedChessboard()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
