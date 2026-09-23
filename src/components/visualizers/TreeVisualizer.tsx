import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { computeTreeLayout, TreeNodeInput } from '../../utils/treeLayout';
import { getNodeTheme } from '../../utils/treeTheme';
import { TreeTraversalOverride } from '../../utils/huffmanCodec';
import { ZoomIn, ZoomOut, RotateCcw, Move, Target } from 'lucide-react';

interface TreeVisualizerProps {
  step: AlgorithmStep;
  traversalOverride?: TreeTraversalOverride | null;
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ step, traversalOverride }) => {
  const state = step.state || {};
  const highlights = step.highlights || {};

  // Zoom and Pan state
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Active traversal override (from prop or embedded codecStep)
  const activeTraversal: TreeTraversalOverride | null =
    traversalOverride ||
    (state.codecStep
      ? {
          activeNodeId: state.codecStep.activeNodeId,
          activeEdge: state.codecStep.activeEdge,
          visitedNodeIds: state.codecStep.visitedNodeIds,
          visitedEdgeIds: state.codecStep.visitedEdgeIds,
          treeRootOverride: state.treeRoot,
          explanationOverride: state.codecStep.explanation,
        }
      : null);

  // Check algorithm type
  const isHuffman =
    state.frequencyMap !== undefined ||
    activeTraversal?.treeRootOverride !== undefined ||
    state.mode === 'decode';
  const isKnapsackBB =
    state.items !== undefined && state.capacity !== undefined && state.frequencyMap === undefined;
  const isSubsetSum = state.targetSum !== undefined;
  const isJobSelection = state.jobs !== undefined;
  const isSuffixTree = state.suffixTree !== undefined;

  // Convert state trees into standardized TreeNodeInput format for two-pass layout
  const convertToTreeInputs = (): TreeNodeInput[] => {
    if (isSuffixTree && state.suffixTree) {
      const convertSuffixNode = (node: any): TreeNodeInput => ({
        id: node.id,
        label: node.id === 'root' ? 'root' : node.isLeaf ? String(node.suffixIndex) : '•',
        subLabel: node.isLeaf && node.suffixIndex >= 0 ? `start ${node.suffixIndex}` : undefined,
        status: (node.status || 'normal') as any,
        edgeLabel: node.edgeLabel || undefined,
        children: (node.children || []).map(convertSuffixNode),
        rawNode: node,
      });
      return [convertSuffixNode(state.suffixTree)];
    }

    if (isHuffman) {
      const forest =
        (activeTraversal?.treeRootOverride ? [activeTraversal.treeRootOverride] : null) ||
        state.forest ||
        (state.treeRoot ? [state.treeRoot] : []);
      const convertHuffmanNode = (node: any): TreeNodeInput | null => {
        if (!node) return null;
        const isHighlighted = highlights.nodes?.includes(node.id);
        const isActiveMerge = state.activeMergeNodes?.includes(node.id);

        let nodeStatus: 'active' | 'best' | 'explored' | 'normal' =
          isActiveMerge ? 'active' : isHighlighted ? 'best' : 'normal';

        if (activeTraversal) {
          if (activeTraversal.activeNodeId === node.id) {
            nodeStatus = 'active';
          } else if (activeTraversal.visitedNodeIds?.includes(node.id)) {
            nodeStatus = 'best';
          } else {
            nodeStatus = 'normal';
          }
        }

        const children: TreeNodeInput[] = [];
        if (node.left) {
          const leftConverted = convertHuffmanNode(node.left);
          if (leftConverted) {
            leftConverted.edgeLabel = '0';
            leftConverted.edgeStatus = 'left';
            children.push(leftConverted);
          }
        }
        if (node.right) {
          const rightConverted = convertHuffmanNode(node.right);
          if (rightConverted) {
            rightConverted.edgeLabel = '1';
            rightConverted.edgeStatus = 'right';
            children.push(rightConverted);
          }
        }

        return {
          id: node.id,
          label: node.char !== undefined ? `'${node.char}'` : `Σ ${node.freq}`,
          subLabel: node.char !== undefined ? `f: ${node.freq}` : node.code ? `code: ${node.code}` : undefined,
          status: nodeStatus,
          children,
          rawNode: node,
        };
      };

      return forest.map(convertHuffmanNode).filter(Boolean) as TreeNodeInput[];
    }

    if (state.treeRoot) {
      const convertDecisionNode = (node: any): TreeNodeInput | null => {
        if (!node) return null;

        const isActive = state.activeNodeId === node.id;
        let nodeStatus: 'active' | 'explored' | 'pruned' | 'best' | 'normal' = 'normal';

        if (isJobSelection) {
          if (isActive) {
            nodeStatus = 'active';
          } else if (node.status === 'optimal') {
            nodeStatus = 'best';
          } else if (node.status === 'incumbent') {
            nodeStatus = 'best';
          } else if (node.status === 'pruned') {
            nodeStatus = 'pruned';
          } else if (node.status === 'explored') {
            nodeStatus = 'explored';
          } else {
            nodeStatus = 'normal';
          }
        } else {
          const isPruned = state.prunedNodeIds?.includes(node.id) || node.status === 'pruned';
          const isBest =
            state.bestItems?.includes(node.id) ||
            node.status === 'best' ||
            node.status === 'solution';
          nodeStatus = isActive ? 'active' : isPruned ? 'pruned' : isBest ? 'best' : node.status || 'normal';
        }

        let label = `N:${node.level ?? 0}`;
        let subLabel: string | undefined = undefined;

        if (isKnapsackBB) {
          label = `W:${node.weight} V:${node.value}`;
          subLabel = `UB:${node.bound}`;
        } else if (isSubsetSum) {
          label = `Σ = ${node.currentSum ?? 0}`;
          subLabel =
            node.status === 'solution'
              ? '✓ TARGET'
              : node.remainingSum !== undefined
              ? `Rem: ${node.remainingSum}`
              : undefined;
        } else if (isJobSelection) {
          label = `P:${node.profit ?? 0}`;
          subLabel = `UB:${node.upperBound ?? node.bound ?? '—'}`;
        }

        const children: TreeNodeInput[] = (node.children || [])
          .map((child: any, idx: number) => {
            const converted = convertDecisionNode(child);
            if (!converted) return null;

            if (isSubsetSum) {
              converted.edgeLabel = idx === 0 ? '+Elem' : '-Elem';
              converted.edgeStatus = idx === 0 ? 'include' : 'exclude';
            } else if (isJobSelection) {
              const jId = child.jobId ?? child.level;
              converted.edgeLabel = child.jobIncluded ? `+J${jId}` : `-J${jId}`;
              converted.edgeStatus =
                child.onOptimalPath && node.onOptimalPath && step.isFinal
                  ? 'optimal'
                  : child.jobIncluded
                  ? 'include'
                  : 'exclude';
            } else {
              converted.edgeLabel = child.itemIncluded ? `+I${child.level}` : `-I${child.level}`;
              converted.edgeStatus = child.itemIncluded ? 'include' : 'exclude';
            }
            return converted;
          })
          .filter(Boolean) as TreeNodeInput[];

        return {
          id: node.id,
          label,
          subLabel,
          status: nodeStatus,
          pruneReason: node.pruneReason,
          children,
          rawNode: node,
        };
      };

      const convertedRoot = convertDecisionNode(state.treeRoot);
      return convertedRoot ? [convertedRoot] : [];
    }

    return [];
  };

  const treeInputs = convertToTreeInputs();
  const layout = computeTreeLayout(
    treeInputs,
    isSuffixTree
      ? {
          nodeWidth: 92,
          nodeHeight: 42,
          minSiblingGap: 46,
          levelHeight: 88,
          paddingX: 52,
          paddingY: 44,
        }
      : {
          nodeWidth: 88,
          nodeHeight: 42,
          minSiblingGap: 24,
          levelHeight: 82,
          paddingX: 44,
          paddingY: 44,
        }
  );

  // Active node ID from state or traversal override or highlights
  const activeNodeId =
    state.activeNodeId ||
    activeTraversal?.activeNodeId ||
    highlights.nodes?.[0];

  // Dynamic Auto-Focus state (tracks active branch automatically)
  const [autoFocus, setAutoFocus] = useState<boolean>(true);

  // Compute active branch ancestors (from root down to active node)
  const activeBranchNodeIds = useMemo(() => {
    const branchSet = new Set<string>();
    if (!activeNodeId) return branchSet;

    // Map each child to its parent
    const parentMap = new Map<string, string>();
    layout.edges.forEach((edge) => {
      parentMap.set(edge.v, edge.u);
    });

    let curr: string | undefined = activeNodeId;
    while (curr) {
      branchSet.add(curr);
      curr = parentMap.get(curr);
    }
    return branchSet;
  }, [activeNodeId, layout.edges]);

  // Auto-focus camera on active branch whenever step or activeNode changes
  useEffect(() => {
    if (!autoFocus) return;
    if (!activeNodeId) return;

    const activeNode = layout.nodes.find((n) => n.id === activeNodeId);
    if (!activeNode) return;

    const containerEl = containerRef.current;
    const cw = containerEl?.clientWidth || 800;
    const ch = containerEl?.clientHeight || 500;

    // Natural fit scale of the tree inside the SVG viewBox
    const s0 = Math.min(cw / Math.max(layout.width, 1), ch / Math.max(layout.height, 1));

    // Dynamic zoom: if tree is compressed (< 0.85), zoom in so branch nodes are ~80-100px wide
    const targetScale = s0 < 0.85 ? Math.min(3.2, Math.max(1.15, 0.92 / s0)) : 1.0;

    // Center viewport on the active node (with slight vertical offset to show ancestor branch above)
    const targetPanX = -(activeNode.x - layout.width / 2) * s0 * targetScale;
    const targetPanY = -(activeNode.y - layout.height / 2) * s0 * targetScale + 35;

    setScale(targetScale);
    setPan({ x: targetPanX, y: targetPanY });
  }, [step.stepIndex, activeNodeId, autoFocus, layout.width, layout.height]);

  // Reset zoom to full tree overview and disable auto-focus until re-enabled
  const handleResetZoom = () => {
    setAutoFocus(false);
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3.5, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.35, Number((prev - 0.15).toFixed(2))));
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
    setScale((prev) => Math.min(3.5, Math.max(0.35, Number((prev + zoomDelta).toFixed(2)))));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col w-full min-h-[460px] p-3 sm:p-4 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Banner Details for Huffman */}
      {isHuffman && state.codeTable && Object.keys(state.codeTable).length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5">
          {Object.entries(state.codeTable).map(([char, code]) => (
            <span
              key={char}
              className="px-2.5 py-1 bg-obsidian-950 border border-hairline text-xs font-mono text-chalk-200"
            >
              <strong className="text-amber-glow">{char}</strong>: {String(code)}
            </span>
          ))}
        </div>
      )}

      {/* Top Banner Details for Subset Sum */}
      {isSubsetSum && (
        <div className="w-full mb-2.5 p-2.5 sm:p-3 bg-obsidian-950 border border-hairline flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-chalk-500 uppercase">[ TARGET SUM ]:</span>
            <span className="text-amber-glow font-bold text-sm">{state.targetSum}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-chalk-500 uppercase">[ RUNNING SUM ]:</span>
            <span className="text-chalk-100 font-bold">{state.currentSum}</span>
          </div>
          {state.allSolutions && state.allSolutions.length > 0 ? (
            <div className="flex items-center gap-2 text-acid-400">
              <span className="text-chalk-500 uppercase">
                [ SOLUTIONS ({state.allSolutions.length}) ]:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {state.allSolutions.map((sol: number[], sIdx: number) => (
                  <strong key={sIdx} className="bg-acid-500/20 px-2 py-0.5 border border-acid-500">
                    [{sol.join(', ')}]
                  </strong>
                ))}
              </div>
            </div>
          ) : state.solutionSubset ? (
            <div className="flex items-center gap-2 text-acid-400">
              <span className="text-chalk-500 uppercase">[ SOLUTION ]:</span>
              <strong className="bg-acid-500/20 px-2 py-0.5 border border-acid-500">
                [{state.solutionSubset.join(', ')}] = {state.targetSum}
              </strong>
            </div>
          ) : null}
        </div>
      )}

      {/* Top Banner Details for Job Selection */}
      {isJobSelection && (
        <div className="w-full mb-2.5 p-2.5 sm:p-3 bg-obsidian-950 border border-hairline flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-chalk-500 uppercase">[ JOBS ]:</span>
            <div className="flex flex-wrap gap-1.5">
              {state.jobs?.map((j: any) => (
                <span
                  key={j.id}
                  className="px-1.5 py-0.5 bg-obsidian-900 border border-hairline text-chalk-300"
                >
                  J{j.id} (d={j.deadline}, p={j.profit})
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-chalk-500 uppercase">[ BEST PROFIT ]:</span>
              <span className="text-amber-glow font-bold text-sm">{state.bestProfit ?? 0}</span>
            </div>
            {state.bestJobs && state.bestJobs.length > 0 && (
              <div className="flex items-center gap-1.5 text-acid-400">
                <span className="text-chalk-500 uppercase">
                  {step.isFinal ? '[ OPTIMAL ]:' : '[ INCUMBENT ]: '}
                </span>
                <span className="bg-acid-500/20 px-2 py-0.5 border border-acid-500 font-bold">
                  [{state.bestJobs.map((id: any) => `J${id}`).join(', ')}]
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Banner Details for Suffix Tree */}
      {isSuffixTree && (
        <div className="w-full mb-2.5 p-2.5 sm:p-3 bg-obsidian-950 border border-hairline flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-chalk-500 uppercase">[ TEXT + $ ]:</span>
            <span className="text-amber-glow font-bold tracking-[0.35em]">{state.text}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-chalk-500 uppercase">[ PATTERN ]:</span>
            <span className="text-chalk-100 font-bold tracking-[0.35em]">{state.pattern || '—'}</span>
          </div>
          {state.phase === 'build' && state.activePointLabel && (
            <div className="flex items-center gap-2">
              <span className="text-chalk-500 uppercase">[ ACTIVE POINT ]:</span>
              <span className="text-chalk-300">{state.activePointLabel}</span>
              {typeof state.remainingSuffixCount === 'number' && (
                <span className="text-chalk-500">· remaining {state.remainingSuffixCount}</span>
              )}
            </div>
          )}
          {state.matchIndices && state.matchIndices.length > 0 && (
            <div className="flex items-center gap-2 text-acid-400">
              <span className="text-chalk-500 uppercase">[ OCCURRENCES ]:</span>
              <strong className="bg-acid-500/20 px-2 py-0.5 border border-acid-500">
                [{state.matchIndices.join(', ')}]
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Huffman Decoding Live Bitstream Traversal Banner */}
      {isHuffman && state.mode === 'decode' && state.encodedBits && (
        <div className="w-full mb-2.5 p-3 bg-obsidian-950 border border-amber/40 flex flex-col gap-2 font-mono text-xs shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-amber uppercase font-bold text-[11px] tracking-wider">[ BITSTREAM TRAVERSAL ]:</span>
              <span className="text-chalk-400 text-[11px]">
                Bit {state.bitIndex !== undefined ? state.bitIndex + 1 : 0} / {state.totalBits || state.encodedBits.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-chalk-500 uppercase text-[11px]">[ DECODED TEXT ]:</span>
              <span className="text-acid-400 font-bold px-2 py-0.5 bg-acid-500/10 border border-acid-500/30">
                "{state.accumulatedText || ''}"
              </span>
            </div>
          </div>

          {/* Interactive Bit Ribbon */}
          <div className="flex items-center gap-1 overflow-x-auto py-1.5 px-2 bg-obsidian-900 border border-hairline">
            {state.encodedBits.split('').map((bit: string, idx: number) => {
              const isCurrent = state.bitIndex === idx;
              const isPast = state.bitIndex !== undefined && idx < state.bitIndex;
              return (
                <span
                  key={idx}
                  className={`w-6 h-6 shrink-0 flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-amber text-obsidian-950 scale-110 shadow-sm shadow-amber/40 ring-1 ring-amber'
                      : isPast
                      ? 'bg-acid-500/20 text-acid-400 border border-acid-500/40'
                      : 'bg-obsidian-850 text-chalk-400 border border-hairline'
                  }`}
                >
                  {bit}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Narrative callout */}
      {(activeTraversal?.explanationOverride || state.explanation) && (
        <div className="w-full mb-2.5 px-3 py-1.5 bg-obsidian-950 border border-amber/30 text-xs font-mono text-amber-glow flex items-center gap-2">
          <span className="font-semibold text-chalk-500 uppercase">[ STATE ]:</span>
          <span>{activeTraversal?.explanationOverride || state.explanation}</span>
        </div>
      )}

      {/* SVG Canvas Container with Responsive Viewport & Zoom/Pan */}
      <div className="relative w-full bg-obsidian-950 border border-hairline overflow-hidden rounded-sm">
        {/* Floating Zoom / Pan Toolbar */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-obsidian-900/90 backdrop-blur-sm border border-hairline p-1 rounded font-mono text-xs text-chalk-300 shadow-lg">
          <button
            onClick={() => setAutoFocus((prev) => !prev)}
            className={`px-2 py-1 flex items-center gap-1.5 text-[11px] rounded transition-all ${
              autoFocus
                ? 'bg-amber/20 text-amber border border-amber/40 font-semibold shadow-sm shadow-amber/10'
                : 'text-chalk-400 hover:text-chalk-200 hover:bg-obsidian-800'
            }`}
            title={
              autoFocus
                ? 'Auto-Focus ON: Automatically zooms and pans to follow the active branch. Click to toggle manual view.'
                : 'Auto-Focus OFF: View is fixed. Click to track active branch.'
            }
            type="button"
          >
            <Target className={`w-3.5 h-3.5 ${autoFocus ? 'text-amber animate-pulse' : ''}`} />
            <span>{autoFocus ? 'FOCUS ON' : 'FOCUS OFF'}</span>
          </button>
          <div className="h-4 w-px bg-hairline mx-0.5" />
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-obsidian-800 hover:text-amber transition-colors rounded"
            title="Zoom In"
            type="button"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-obsidian-800 hover:text-amber transition-colors rounded"
            title="Zoom Out"
            type="button"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 hover:bg-obsidian-800 hover:text-amber transition-colors rounded"
            title="Fit / Reset Overview (turns off auto-focus)"
            type="button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[10px] text-chalk-500 select-none">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Viewport Instructions Badge */}
        <div className="absolute bottom-2 left-3 z-10 pointer-events-none text-[10px] font-mono text-chalk-500/80 flex items-center gap-1.5">
          <Move className="w-3 h-3" />
          <span>Click & Drag to Pan • Scroll to Zoom • {autoFocus ? '🎯 Auto-Tracking Branch' : 'Free Camera'}</span>
        </div>

        {/* Interactive SVG Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className={`w-full h-[480px] sm:h-[520px] flex items-center justify-center cursor-${
            isDragging ? 'grabbing' : 'grab'
          } select-none`}
        >
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className={`w-full h-full font-mono ${
              isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'
            }`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Edges */}
            {layout.edges.map((edge, idx) => {
              const isExclude = edge.status === 'exclude';
              const midX = (edge.x1 + edge.x2) / 2;
              const midY = (edge.y1 + edge.y2) / 2;

              const isEdgeOnActiveBranch =
                activeBranchNodeIds.has(edge.u) && activeBranchNodeIds.has(edge.v);

              const isEdgeActive =
                (activeTraversal?.activeEdge &&
                  activeTraversal.activeEdge.from === edge.u &&
                  activeTraversal.activeEdge.to === edge.v) ||
                isEdgeOnActiveBranch;

              const isEdgeVisited = activeTraversal?.visitedEdgeIds?.includes(
                `${edge.u}->${edge.v}`
              );

              // Dim edges not on active branch when auto-focus is active
              const isDimmed =
                autoFocus && activeBranchNodeIds.size > 0 && !isEdgeOnActiveBranch;

              return (
                <g
                  key={`edge-${edge.u}-${edge.v}-${idx}`}
                  className="transition-opacity duration-300"
                  style={{ opacity: isDimmed ? 0.2 : 1 }}
                >
                  {/* Edge connecting line */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={
                      edge.status === 'optimal'
                        ? '#10b981'
                        : isEdgeOnActiveBranch
                        ? '#f59e0b'
                        : isEdgeActive
                        ? '#f59e0b'
                        : isEdgeVisited
                        ? '#10b981'
                        : isExclude
                        ? '#475569'
                        : '#64748b'
                    }
                    strokeWidth={
                      edge.status === 'optimal'
                        ? 3.5
                        : isEdgeOnActiveBranch
                        ? 3.5
                        : isEdgeActive
                        ? 3.5
                        : isEdgeVisited
                        ? 2.5
                        : isExclude
                        ? 1.4
                        : 1.8
                    }
                    strokeDasharray={isExclude && !isEdgeOnActiveBranch && edge.status !== 'optimal' ? '4 3' : undefined}
                    className="transition-colors duration-200"
                  />

                  {/* Edge Label Badge with protective high-contrast background */}
                  {edge.label && (() => {
                    const labelW = Math.max(36, edge.label.length * 6.4 + 12);
                    return (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x={-labelW / 2}
                          y={-9}
                          width={labelW}
                          height={18}
                          rx={4}
                          fill={isEdgeOnActiveBranch ? '#f59e0b' : isEdgeActive ? '#f59e0b' : '#0b0d13'}
                          stroke={isEdgeOnActiveBranch ? '#fbbf24' : isEdgeActive ? '#fbbf24' : '#334155'}
                          strokeWidth={isEdgeOnActiveBranch || isEdgeActive ? 1.5 : 0.8}
                          className="shadow-sm"
                        />
                        <text
                          x={0}
                          y={3}
                          textAnchor="middle"
                          fill={isEdgeOnActiveBranch || isEdgeActive ? '#0a0a0c' : '#e2e8f0'}
                          fontSize="9"
                          fontWeight="bold"
                          className="font-mono pointer-events-none"
                        >
                          {edge.label}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              const theme = getNodeTheme(node.status);
              const isActive = node.status === 'active' || node.id === activeNodeId;
              const isPruned = isJobSelection
                ? node.rawNode?.status === 'pruned'
                : node.status === 'pruned';
              const isOptimal = isJobSelection
                ? node.rawNode?.status === 'optimal' ||
                  (Boolean(step.isFinal) &&
                    node.rawNode?.status === 'best' &&
                    !node.rawNode?.children?.some((c: any) => c.onOptimalPath))
                : node.status === 'best' || node.status === 'solution';
              const isIncumbent =
                isJobSelection &&
                !step.isFinal &&
                (node.rawNode?.status === 'incumbent' || node.rawNode?.id === state.incumbentNodeId);
              const isOnOptPath = isJobSelection && Boolean(node.rawNode?.onOptimalPath);
              const isBest =
                isOptimal || (!isJobSelection && (node.status === 'best' || node.status === 'solution'));
              const isOnActiveBranch = activeBranchNodeIds.has(node.id);

              // Dim nodes not on the active branch (keeping solution and optimal path nodes visible)
              const isDimmed =
                autoFocus &&
                activeBranchNodeIds.size > 0 &&
                !isOnActiveBranch &&
                !isBest &&
                !isOnOptPath;

              return (
                <g
                  key={node.id}
                  id={`tree-node-${node.id}`}
                  data-tree-node-id={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="transition-all duration-300"
                  style={{ opacity: isDimmed ? 0.24 : 1 }}
                >
                  {/* Pulsing Active Ring */}
                  {isActive && (
                    <rect
                      x={-48}
                      y={-25}
                      width={96}
                      height={50}
                      rx={8}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      className="animate-pulse"
                    />
                  )}

                  {/* Active Branch Path subtle highlight for ancestors */}
                  {isOnActiveBranch && !isActive && (
                    <rect
                      x={-46}
                      y={-23}
                      width={92}
                      height={46}
                      rx={7}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeOpacity={0.7}
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Node Box */}
                  <rect
                    x={-44}
                    y={-21}
                    width={88}
                    height={42}
                    rx={6}
                    fill={theme.bg}
                    stroke={
                      isOnOptPath && !isActive && !isOptimal
                        ? '#34d399'
                        : isOnActiveBranch && !isActive
                        ? '#f59e0b'
                        : theme.border
                    }
                    strokeWidth={isActive || isBest ? 2.5 : isOnOptPath ? 2 : isOnActiveBranch ? 2 : 1.5}
                    strokeDasharray={isOnOptPath && !isOptimal && !isActive ? '4 2' : undefined}
                    className="shadow-md transition-all"
                  />

                  {/* Primary Node Text (WCAG AA Compliant Contrast) */}
                  <text
                    x={0}
                    y={node.subLabel ? -4 : 5}
                    textAnchor="middle"
                    fill={theme.primaryText}
                    fontSize="12"
                    fontWeight="bold"
                    className="font-mono pointer-events-none tracking-tight"
                  >
                    {node.label}
                  </text>

                  {/* Subtitle / Metric Text (High Contrast) */}
                  {node.subLabel && (
                    <text
                      x={0}
                      y={12}
                      textAnchor="middle"
                      fill={theme.subText}
                      fontSize="9.5"
                      fontWeight="600"
                      className="font-mono pointer-events-none"
                    >
                      {node.subLabel}
                    </text>
                  )}

                  {/* Pruned Callout Pill */}
                  {isPruned && !isOptimal && (
                    <g transform="translate(0, 26)">
                      <rect
                        x={-34}
                        y={-7}
                        width={68}
                        height={14}
                        rx={3}
                        fill={theme.badgeBg || '#881337'}
                        stroke={theme.badgeBorder || '#f43f5e'}
                        strokeWidth={0.8}
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fill={theme.badgeText || '#ffe4e6'}
                        fontSize="8"
                        fontWeight="bold"
                        className="font-mono uppercase tracking-wider pointer-events-none"
                      >
                        {node.rawNode?.pruneType === 'infeasible' ? 'INFEASIBLE' : 'PRUNED'}
                      </text>
                    </g>
                  )}

                  {/* Incumbent Callout Pill (during active search) */}
                  {isIncumbent && !isActive && (
                    <g transform="translate(0, 26)">
                      <rect
                        x={-36}
                        y={-7}
                        width={72}
                        height={14}
                        rx={3}
                        fill="#064e3b"
                        stroke="#34d399"
                        strokeWidth={0.8}
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fill="#a7f3d0"
                        fontSize="8"
                        fontWeight="bold"
                        className="font-mono uppercase tracking-wider pointer-events-none"
                      >
                        INCUMBENT
                      </text>
                    </g>
                  )}

                  {/* Best / Optimal Callout Pill */}
                  {isOptimal && (
                    <g transform="translate(0, 26)">
                      <rect
                        x={-34}
                        y={-7}
                        width={68}
                        height={14}
                        rx={3}
                        fill={theme.badgeBg || '#064e3b'}
                        stroke={theme.badgeBorder || '#34d399'}
                        strokeWidth={0.8}
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fill={theme.badgeText || '#a7f3d0'}
                        fontSize="8"
                        fontWeight="bold"
                        className="font-mono uppercase tracking-wider pointer-events-none"
                      >
                        OPTIMAL
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber border border-amber-glow" />
          <span>Active Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-obsidian-900 border-2 border-dashed border-amber" />
          <span>Active Branch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-700 border border-emerald-400" />
          <span>Optimal / Solution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-950 border border-rose-500" />
          <span>Pruned Subtree</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-obsidian-850 border border-slate-700" />
          <span>Inactive Subtree</span>
        </div>
      </div>
    </div>
  );
};
