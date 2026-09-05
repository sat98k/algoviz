import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { Check, Split, Calculator } from 'lucide-react';

interface RecursionTreeVisualizerProps {
  step: AlgorithmStep;
}

export interface TreeNodeData {
  id: string;
  parentId?: string;
  label: string;
  subLabel?: string;
  result?: any;
  status: 'active' | 'dividing' | 'base_case' | 'combining' | 'resolved' | 'optimal' | 'normal';
  details?: string;
  edgeLabel?: string;
}

interface LayoutNode extends TreeNodeData {
  x: number;
  y: number;
  depth: number;
  subtreeWidth: number;
  children: LayoutNode[];
}

export const RecursionTreeVisualizer: React.FC<RecursionTreeVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const treeNodes: TreeNodeData[] = state.treeNodes || [];
  const activeNodeId = state.activeNodeId;
  const isMaxSubarray = state.mode === 'divideAndConquer' || state.array !== undefined;
  const isKaratsuba = state.karatsubaDetails !== undefined || state.currentX !== undefined;

  // Max Subarray specific properties
  const fullArray: number[] = state.array || [];
  const activeRange: [number, number] | undefined = state.activeRange;
  const splitMid: number | undefined = state.currentMid;
  const crossLeftRange: [number, number] | undefined = state.crossLeftRange;
  const crossRightRange: [number, number] | undefined = state.crossRightRange;
  const lSum: number | undefined = state.lSum;
  const rSum: number | undefined = state.rSum;
  const crossSum: number | undefined = state.crossSum;
  const winner: 'LSum' | 'RSum' | 'CrossSum' | undefined = state.winner;
  const optimalRange: [number, number] | undefined = state.optimalRange;

  // Karatsuba specific properties
  const karatsubaData = state.karatsubaDetails || {};

  // Build responsive, non-overlapping tree layout using two-pass subtree width calculation
  const buildLayout = (): {
    nodes: LayoutNode[];
    edges: { x1: number; y1: number; x2: number; y2: number; label?: string; status?: string }[];
    width: number;
    height: number;
  } => {
    if (!treeNodes || treeNodes.length === 0) {
      return { nodes: [], edges: [], width: 800, height: 260 };
    }

    const nodeWidth = 104;
    const minSiblingGap = 24;
    const levelHeight = 68;

    const nodeMap = new Map<string, LayoutNode>();
    const rootNodes: LayoutNode[] = [];

    treeNodes.forEach((n) => {
      nodeMap.set(n.id, { ...n, x: 0, y: 0, depth: 0, subtreeWidth: nodeWidth, children: [] });
    });

    treeNodes.forEach((n) => {
      const node = nodeMap.get(n.id)!;
      if (n.parentId && nodeMap.has(n.parentId)) {
        const parent = nodeMap.get(n.parentId)!;
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    let maxDepth = 0;

    // Pass 1: Compute required subtree width bottom-up
    const computeSubtreeWidth = (node: LayoutNode, depth: number): number => {
      if (depth > maxDepth) maxDepth = depth;
      if (node.children.length === 0) {
        node.subtreeWidth = nodeWidth;
        return nodeWidth;
      }
      let totalChildrenWidth = 0;
      node.children.forEach((child, idx) => {
        totalChildrenWidth += computeSubtreeWidth(child, depth + 1);
        if (idx > 0) totalChildrenWidth += minSiblingGap;
      });
      node.subtreeWidth = Math.max(nodeWidth, totalChildrenWidth);
      return node.subtreeWidth;
    };

    rootNodes.forEach((r) => computeSubtreeWidth(r, 0));

    // Pass 2: Assign x and y coordinates top-down with zero overlap
    let currentRootX = 30;

    const assignPositions = (node: LayoutNode, startX: number, depth: number) => {
      node.depth = depth;
      node.y = 35 + depth * levelHeight;

      if (node.children.length === 0) {
        node.x = startX + node.subtreeWidth / 2;
      } else {
        let currentChildX = startX;
        node.children.forEach((child) => {
          assignPositions(child, currentChildX, depth + 1);
          currentChildX += child.subtreeWidth + minSiblingGap;
        });
        const firstChild = node.children[0];
        const lastChild = node.children[node.children.length - 1];
        node.x = (firstChild.x + lastChild.x) / 2;
      }
    };

    rootNodes.forEach((r) => {
      assignPositions(r, currentRootX, 0);
      currentRootX += r.subtreeWidth + minSiblingGap;
    });

    const allNodes: LayoutNode[] = [];
    const edges: { x1: number; y1: number; x2: number; y2: number; label?: string; status?: string }[] = [];

    const collectNodesAndEdges = (node: LayoutNode) => {
      allNodes.push(node);
      node.children.forEach((child) => {
        edges.push({
          x1: node.x,
          y1: node.y + 18,
          x2: child.x,
          y2: child.y - 18,
          label: child.edgeLabel,
          status: child.id === activeNodeId ? 'active' : child.status,
        });
        collectNodesAndEdges(child);
      });
    };

    rootNodes.forEach((r) => collectNodesAndEdges(r));

    const totalWidth = Math.max(860, currentRootX + 20);
    const totalHeight = Math.max(260, (maxDepth + 1) * levelHeight + 60);

    return { nodes: allNodes, edges, width: totalWidth, height: totalHeight };
  };

  const { nodes: layoutNodes, edges, width: svgWidth, height: svgHeight } = buildLayout();

  const getNodeColor = (node: LayoutNode) => {
    const isActive = node.id === activeNodeId;
    if (isActive) {
      return {
        bg: 'fill-obsidian-950 stroke-amber',
        text: 'text-amber-glow font-bold',
        strokeWidth: 2.2,
      };
    }
    if (node.status === 'optimal') {
      return {
        bg: 'fill-acid-500/20 stroke-acid-500',
        text: 'text-acid-500 font-bold',
        strokeWidth: 2,
      };
    }
    if (node.status === 'resolved') {
      return {
        bg: 'fill-electric-500/15 stroke-electric-400',
        text: 'text-electric-400 font-semibold',
        strokeWidth: 1.5,
      };
    }
    if (node.status === 'combining') {
      return {
        bg: 'fill-purple-500/20 stroke-purple-400',
        text: 'text-purple-300 font-bold',
        strokeWidth: 1.8,
      };
    }
    if (node.status === 'base_case') {
      return {
        bg: 'fill-cyan-500/15 stroke-cyan-400',
        text: 'text-cyan-300 font-semibold',
        strokeWidth: 1.5,
      };
    }
    if (node.status === 'dividing') {
      return {
        bg: 'fill-amber/10 stroke-amber/60 stroke-dashed',
        text: 'text-amber-glow',
        strokeWidth: 1.5,
      };
    }
    return {
      bg: 'fill-obsidian-950 stroke-chalk-700',
      text: 'text-chalk-400',
      strokeWidth: 1,
    };
  };

  const renderCellBox = (val: number, idx: number, highlightType?: 'active' | 'cross' | 'optimal' | 'left' | 'right' | 'winner' | 'normal') => {
    let styleClasses = 'bg-obsidian-950 border-hairline text-chalk-200';
    if (highlightType === 'optimal') {
      styleClasses = 'bg-acid-500/25 border-acid-500 text-acid-500 font-bold shadow-sm shadow-acid-500/20 ring-1 ring-acid-500';
    } else if (highlightType === 'winner') {
      styleClasses = 'bg-acid-500/20 border-acid-500 text-acid-500 font-bold ring-1 ring-acid-500';
    } else if (highlightType === 'cross') {
      styleClasses = 'bg-purple-500/25 border-purple-400 text-purple-300 font-bold';
    } else if (highlightType === 'left') {
      styleClasses = 'bg-amber/20 border-amber text-amber-glow font-bold';
    } else if (highlightType === 'right') {
      styleClasses = 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold';
    } else if (highlightType === 'active') {
      styleClasses = 'bg-amber/20 border-amber text-amber-glow font-bold';
    }

    return (
      <div key={idx} className="flex flex-col items-center">
        <span className="text-[9px] font-mono text-chalk-500 mb-0.5 select-none">i={idx}</span>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border font-mono text-xs sm:text-sm font-semibold transition-all ${styleClasses}`}>
          {val}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[460px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all gap-5">
      {/* ========================================================================= */}
      {/* TOP DECK: DETAILED MATHEMATICAL BREAKDOWN & VISUAL STAGE                   */}
      {/* ========================================================================= */}

      {/* --- Max Subarray Visual Split & Combine Deck --- */}
      {isMaxSubarray && fullArray.length > 0 && (
        <div className="w-full max-w-5xl flex flex-col gap-3 p-4 bg-obsidian-950 border border-hairline">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2">
            <div className="flex items-center gap-2 font-mono text-xs text-amber-glow">
              <Split className="w-3.5 h-3.5 text-amber" />
              <span className="font-semibold uppercase tracking-wider">{step.title}</span>
            </div>
            {state.explanation && (
              <span className="text-chalk-400 font-mono text-[11px]">{state.explanation}</span>
            )}
          </div>

          {/* Literal Array Splitting Visual */}
          <div className="flex flex-col gap-2 py-2">
            {splitMid !== undefined && activeRange ? (
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-2">
                {/* Left Half Cluster */}
                <div className="flex flex-col items-center gap-1.5 p-2.5 bg-amber/5 border border-dashed border-amber/40">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-amber-glow font-semibold">
                    LEFT HALF [ {activeRange[0]} .. {splitMid} ]
                  </span>
                  <div className="flex items-center gap-1">
                    {fullArray.slice(activeRange[0], splitMid + 1).map((val, relIdx) => {
                      const actualIdx = activeRange[0] + relIdx;
                      return renderCellBox(val, actualIdx, 'left');
                    })}
                  </div>
                </div>

                {/* Split Boundary Marker */}
                <div className="flex flex-col items-center justify-center font-mono text-chalk-500 px-1">
                  <span className="text-[10px] uppercase tracking-widest text-amber font-bold">SPLIT MID</span>
                  <div className="w-px h-8 bg-amber/40 my-1"></div>
                  <span className="text-xs font-bold text-amber">k = {splitMid}</span>
                </div>

                {/* Right Half Cluster */}
                <div className="flex flex-col items-center gap-1.5 p-2.5 bg-cyan-500/5 border border-dashed border-cyan-400/40">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300 font-semibold">
                    RIGHT HALF [ {splitMid + 1} .. {activeRange[1]} ]
                  </span>
                  <div className="flex items-center gap-1">
                    {fullArray.slice(splitMid + 1, activeRange[1] + 1).map((val, relIdx) => {
                      const actualIdx = splitMid + 1 + relIdx;
                      return renderCellBox(val, actualIdx, 'right');
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Full Array Strip */
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 py-2 overflow-x-auto">
                {fullArray.map((val, idx) => {
                  let highlightType: 'active' | 'cross' | 'optimal' | 'normal' = 'normal';
                  if (optimalRange && idx >= optimalRange[0] && idx <= optimalRange[1]) {
                    highlightType = 'optimal';
                  } else if (
                    crossLeftRange && crossRightRange &&
                    idx >= crossLeftRange[0] && idx <= crossRightRange[1]
                  ) {
                    highlightType = 'cross';
                  } else if (activeRange && idx >= activeRange[0] && idx <= activeRange[1]) {
                    highlightType = 'active';
                  }
                  return renderCellBox(val, idx, highlightType);
                })}
              </div>
            )}
          </div>

          {/* Combine Phase Telemetry Ledger */}
          {(lSum !== undefined || rSum !== undefined || crossSum !== undefined) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-hairline font-mono text-xs">
              <div className={`p-2 border transition-all ${winner === 'LSum' ? 'bg-acid-500/15 border-acid-500 text-acid-500 ring-1 ring-acid-500' : 'bg-obsidian-900 border-hairline text-chalk-300'}`}>
                <div className="text-[10px] text-chalk-500 uppercase flex items-center justify-between">
                  <span>LSum (Left)</span>
                  {winner === 'LSum' && <Check className="w-3 h-3 text-acid-500" />}
                </div>
                <div className="text-sm font-bold mt-0.5">{lSum ?? '—'}</div>
              </div>

              <div className={`p-2 border transition-all ${winner === 'RSum' ? 'bg-acid-500/15 border-acid-500 text-acid-500 ring-1 ring-acid-500' : 'bg-obsidian-900 border-hairline text-chalk-300'}`}>
                <div className="text-[10px] text-chalk-500 uppercase flex items-center justify-between">
                  <span>RSum (Right)</span>
                  {winner === 'RSum' && <Check className="w-3 h-3 text-acid-500" />}
                </div>
                <div className="text-sm font-bold mt-0.5">{rSum ?? '—'}</div>
              </div>

              <div className={`p-2 border transition-all ${winner === 'CrossSum' ? 'bg-acid-500/15 border-acid-500 text-acid-500 ring-1 ring-acid-500' : 'bg-obsidian-900 border-hairline text-chalk-300'}`}>
                <div className="text-[10px] text-chalk-500 uppercase flex items-center justify-between">
                  <span>CrossSum</span>
                  {winner === 'CrossSum' && <Check className="w-3 h-3 text-acid-500" />}
                </div>
                <div className="text-sm font-bold mt-0.5">{crossSum ?? '—'}</div>
              </div>

              <div className="p-2 bg-obsidian-900 border border-amber/40 text-amber-glow">
                <div className="text-[10px] text-chalk-500 uppercase">Selected Max</div>
                <div className="text-sm font-bold mt-0.5 flex items-center gap-1">
                  <span>{winner ?? 'COMBINING'}</span>
                  {winner && <span className="text-[10px] text-chalk-400">({Math.max(lSum ?? -Infinity, rSum ?? -Infinity, crossSum ?? -Infinity)})</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Karatsuba Explicit 4-Step Mathematical Ledger --- */}
      {isKaratsuba && (
        <div className="w-full max-w-5xl flex flex-col gap-3 p-4 bg-obsidian-950 border border-hairline font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2">
            <div className="flex items-center gap-2 text-xs text-amber-glow">
              <Calculator className="w-3.5 h-3.5 text-amber" />
              <span className="font-semibold uppercase tracking-wider">{step.title}</span>
            </div>
            {state.formulaExplanation && (
              <span className="text-chalk-400 text-xs">{state.formulaExplanation}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-obsidian-900 border border-hairline flex flex-col gap-1.5">
              <span className="text-[10px] text-amber uppercase tracking-wider font-bold">1. Split (m={karatsubaData.m ?? '—'})</span>
              <div className="text-chalk-300">
                <div>X: a=<strong className="text-chalk-100">{karatsubaData.a ?? '—'}</strong>, b=<strong className="text-chalk-100">{karatsubaData.b ?? '—'}</strong></div>
                <div>Y: c=<strong className="text-chalk-100">{karatsubaData.c ?? '—'}</strong>, d=<strong className="text-chalk-100">{karatsubaData.d ?? '—'}</strong></div>
              </div>
            </div>

            <div className="p-3 bg-obsidian-900 border border-hairline flex flex-col gap-1.5">
              <span className="text-[10px] text-electric-400 uppercase tracking-wider font-bold">2. Products (P1, P2, P3)</span>
              <div className="text-chalk-300 space-y-0.5">
                <div>P1 (a·c) = <strong className="text-electric-400">{karatsubaData.p1 ?? '—'}</strong></div>
                <div>P2 (b·d) = <strong className="text-electric-400">{karatsubaData.p2 ?? '—'}</strong></div>
                <div>P3 (sum) = <strong className="text-electric-400">{karatsubaData.p3 ?? '—'}</strong></div>
              </div>
            </div>

            <div className="p-3 bg-obsidian-900 border border-hairline flex flex-col gap-1.5">
              <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">3. Cross-Term</span>
              <div className="text-chalk-300">
                <div className="text-[10px] text-chalk-500">P3 - P1 - P2</div>
                <div className="text-purple-300 font-bold text-sm mt-1">
                  {karatsubaData.crossTerm ?? '—'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-obsidian-900 border border-acid-500/40 flex flex-col gap-1.5">
              <span className="text-[10px] text-acid-500 uppercase tracking-wider font-bold">4. Combine</span>
              <div className="text-chalk-300">
                <div className="text-[10px] text-chalk-500">P1·10²ᵐ + Cross·10ᵐ + P2</div>
                <div className="text-acid-500 font-bold text-sm mt-1 truncate" title={karatsubaData.finalResult}>
                  = {karatsubaData.finalResult ?? (step.isFinal ? step.result?.product : '—')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM DECK: COMPACT RESPONSIVE RECURSION TREE SVG (ZERO HORIZONTAL SCROLL)*/}
      {/* ========================================================================= */}
      <div className="w-full max-w-5xl bg-obsidian-950 border border-hairline p-2 sm:p-4 relative flex items-center justify-center overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[380px] font-mono select-none"
        >
          {/* Connecting Branch Edges with Distinct Label Badges */}
          {edges.map((edge, idx) => {
            const isEdgeActive = edge.status === 'active';
            const midX = (edge.x1 + edge.x2) / 2;
            const midY = (edge.y1 + edge.y2) / 2;
            const pathD = `M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`;

            return (
              <g key={`edge-${idx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isEdgeActive ? '#F59E0B' : '#334155'}
                  strokeWidth={isEdgeActive ? 2.2 : 1.2}
                  strokeDasharray={edge.status === 'dividing' ? '3 2' : undefined}
                />
                {edge.label && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={-28}
                      y={-8}
                      width={56}
                      height={14}
                      rx={2}
                      className="fill-obsidian-950 stroke-hairline"
                      strokeWidth={0.8}
                    />
                    <text
                      x={0}
                      y={3}
                      fill="#94A3B8"
                      fontSize="8"
                      textAnchor="middle"
                      className="font-mono font-semibold"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Tree Nodes */}
          {layoutNodes.map((node) => {
            const styles = getNodeColor(node);
            const rectWidth = 104;
            const rectHeight = 36;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x - rectWidth / 2}, ${node.y - rectHeight / 2})`}
                className="transition-all duration-300"
              >
                {/* Node Box */}
                <rect
                  width={rectWidth}
                  height={rectHeight}
                  rx={4}
                  className={`${styles.bg}`}
                  strokeWidth={styles.strokeWidth}
                />

                {/* Primary Label */}
                <text
                  x={rectWidth / 2}
                  y={14}
                  textAnchor="middle"
                  className={`text-[10px] font-bold ${styles.text}`}
                  fill="currentColor"
                >
                  {node.label}
                </text>

                {/* Sub / Result Label */}
                <text
                  x={rectWidth / 2}
                  y={28}
                  textAnchor="middle"
                  className="text-[9px] font-mono"
                  fill={node.result !== undefined ? '#34D399' : '#94A3B8'}
                >
                  {node.result !== undefined
                    ? `ans: ${typeof node.result === 'object' ? node.result.maxSum ?? JSON.stringify(node.result) : node.result}`
                    : node.subLabel || node.status.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Compact Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber border border-amber"></span>
          <span>Active Call</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-cyan-500/40 border border-cyan-400"></span>
          <span>Base Case</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-purple-500/40 border border-purple-400"></span>
          <span>Combining</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-electric-500/40 border border-electric-400"></span>
          <span>Resolved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-acid-500/40 border border-acid-500"></span>
          <span>Optimal Root</span>
        </div>
      </div>
    </div>
  );
};
