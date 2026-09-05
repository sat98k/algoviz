import React, { useState, useRef } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { computeTreeLayout, TreeNodeInput } from '../../utils/treeLayout';
import { getNodeTheme } from '../../utils/treeTheme';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface TreeVisualizerProps {
  step: AlgorithmStep;
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const highlights = step.highlights || {};

  // Zoom and Pan state
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Check algorithm type
  const isHuffman = state.frequencyMap !== undefined;
  const isKnapsackBB =
    state.items !== undefined && state.capacity !== undefined && state.frequencyMap === undefined;
  const isSubsetSum = state.targetSum !== undefined;
  const isJobSelection = state.jobs !== undefined;

  // Convert state trees into standardized TreeNodeInput format for two-pass layout
  const convertToTreeInputs = (): TreeNodeInput[] => {
    if (isHuffman) {
      const forest = state.forest || (state.treeRoot ? [state.treeRoot] : []);
      const convertHuffmanNode = (node: any): TreeNodeInput | null => {
        if (!node) return null;
        const isHighlighted = highlights.nodes?.includes(node.id);
        const isActiveMerge = state.activeMergeNodes?.includes(node.id);

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
          status: isActiveMerge ? 'active' : isHighlighted ? 'best' : 'normal',
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
        const isPruned = state.prunedNodeIds?.includes(node.id) || node.status === 'pruned';
        const isBest =
          state.bestItems?.includes(node.id) ||
          node.status === 'best' ||
          node.status === 'solution';

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
              converted.edgeStatus = child.jobIncluded ? 'include' : 'exclude';
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
          status: isActive ? 'active' : isPruned ? 'pruned' : isBest ? 'best' : node.status || 'normal',
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
  const layout = computeTreeLayout(treeInputs, {
    nodeWidth: 84,
    nodeHeight: 38,
    minSiblingGap: 24,
    levelHeight: 76,
    paddingX: 40,
    paddingY: 36,
  });

  // Reset zoom on step / algo change if desired, or fit on reset
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, prev + 0.15));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.4, prev - 0.15));
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
    <div className="flex flex-col items-center w-full min-h-[460px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Banner Details for Huffman */}
      {isHuffman && state.codeTable && Object.keys(state.codeTable).length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
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
        <div className="w-full max-w-4xl mb-4 p-3 bg-obsidian-950 border border-hairline flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-chalk-500 uppercase">[ TARGET SUM ]:</span>
            <span className="text-amber-glow font-bold text-sm">{state.targetSum}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-chalk-500 uppercase">[ RUNNING SUM ]:</span>
            <span className="text-chalk-100 font-bold">{state.currentSum}</span>
          </div>
          {state.solutionSubset && (
            <div className="flex items-center gap-2 text-acid-400">
              <span className="text-chalk-500 uppercase">[ SOLUTION ]:</span>
              <strong className="bg-acid-500/20 px-2 py-0.5 border border-acid-500">
                [{state.solutionSubset.join(', ')}] = {state.targetSum}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Top Banner Details for Job Selection */}
      {isJobSelection && (
        <div className="w-full max-w-4xl mb-4 p-3 bg-obsidian-950 border border-hairline flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
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
                <span className="text-chalk-500 uppercase">[ OPTIMAL ]:</span>
                <span className="bg-acid-500/20 px-2 py-0.5 border border-acid-500 font-bold">
                  [{state.bestJobs.map((id: any) => `J${id}`).join(', ')}]
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Narrative callout */}
      {state.explanation && (
        <div className="w-full max-w-4xl mb-4 px-4 py-1.5 bg-obsidian-950 border border-amber/30 text-xs font-mono text-amber-glow flex items-center gap-2">
          <span className="font-semibold text-chalk-500 uppercase">[ STATE ]:</span>
          <span>{state.explanation}</span>
        </div>
      )}

      {/* SVG Canvas Container with Responsive Viewport & Zoom/Pan */}
      <div className="relative w-full max-w-4xl bg-obsidian-950 border border-hairline overflow-hidden rounded-sm">
        {/* Floating Zoom / Pan Toolbar */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-obsidian-900/90 backdrop-blur-sm border border-hairline p-1 rounded font-mono text-xs text-chalk-300 shadow-lg">
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
            title="Reset Zoom & Pan"
            type="button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[10px] text-chalk-500 select-none">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Viewport Instructions Badge */}
        <div className="absolute bottom-2 left-3 z-10 pointer-events-none text-[10px] font-mono text-chalk-500/80 flex items-center gap-1">
          <Move className="w-3 h-3" />
          <span>Click & Drag to Pan • Scroll to Zoom</span>
        </div>

        {/* Interactive SVG Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-[420px] flex items-center justify-center cursor-${
            isDragging ? 'grabbing' : 'grab'
          } select-none`}
        >
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="w-full h-full font-mono transition-transform duration-75"
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

              return (
                <g key={`edge-${edge.u}-${edge.v}-${idx}`}>
                  {/* Edge connecting line */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={isExclude ? '#475569' : '#64748b'}
                    strokeWidth={isExclude ? 1.4 : 1.8}
                    strokeDasharray={isExclude ? '4 3' : undefined}
                    className="transition-colors duration-200"
                  />

                  {/* Edge Label Badge with protective high-contrast background */}
                  {edge.label && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x={-18}
                        y={-9}
                        width={36}
                        height={18}
                        rx={4}
                        fill="#0b0d13"
                        stroke="#334155"
                        strokeWidth={0.8}
                        className="shadow-sm"
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="9"
                        fontWeight="bold"
                        className="font-mono pointer-events-none"
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              const theme = getNodeTheme(node.status);
              const isActive = node.status === 'active';
              const isBest = node.status === 'best' || node.status === 'solution';
              const isPruned = node.status === 'pruned';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="transition-all duration-300"
                >
                  {/* Pulsing Active Ring */}
                  {isActive && (
                    <rect
                      x={-46}
                      y={-23}
                      width={92}
                      height={46}
                      rx={8}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  )}

                  {/* Node Box */}
                  <rect
                    x={-42}
                    y={-19}
                    width={84}
                    height={38}
                    rx={6}
                    fill={theme.bg}
                    stroke={theme.border}
                    strokeWidth={isActive || isBest ? 2.5 : 1.5}
                    className="shadow-md transition-all"
                  />

                  {/* Primary Node Text (WCAG AA Compliant Contrast) */}
                  <text
                    x={0}
                    y={node.subLabel ? -4 : 4}
                    textAnchor="middle"
                    fill={theme.primaryText}
                    fontSize="11"
                    fontWeight="bold"
                    className="font-mono pointer-events-none tracking-tight"
                  >
                    {node.label}
                  </text>

                  {/* Subtitle / Metric Text (High Contrast) */}
                  {node.subLabel && (
                    <text
                      x={0}
                      y={10}
                      textAnchor="middle"
                      fill={theme.subText}
                      fontSize="9"
                      fontWeight="600"
                      className="font-mono pointer-events-none"
                    >
                      {node.subLabel}
                    </text>
                  )}

                  {/* Pruned Callout Pill */}
                  {isPruned && (
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
                        PRUNED
                      </text>
                    </g>
                  )}

                  {/* Best / Optimal Callout Pill */}
                  {isBest && (
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
          <span>Active / Exploring</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-700 border border-emerald-400" />
          <span>Optimal / Solution Path</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-950 border border-rose-500" />
          <span>Pruned Subtree</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-obsidian-850 border border-slate-700" />
          <span>Explored / Normal</span>
        </div>
      </div>
    </div>
  );
};
