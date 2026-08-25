import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';

interface TreeVisualizerProps {
  step: AlgorithmStep;
}

interface VisualNode {
  id: string;
  label: string;
  subLabel?: string;
  x: number;
  y: number;
  status?: 'active' | 'explored' | 'pruned' | 'best' | 'normal';
  pruneReason?: string;
  code?: string;
  isLeaf?: boolean;
}

interface VisualEdge {
  u: string;
  v: string;
  label?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  status?: string;
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const highlights = step.highlights || {};

  // Check if Huffman or Knapsack B&B
  const isHuffman = state.frequencyMap !== undefined;
  const isKnapsackBB = state.treeRoot !== undefined && state.items !== undefined;

  const visualNodes: VisualNode[] = [];
  const visualEdges: VisualEdge[] = [];

  const svgWidth = 850;
  const svgHeight = 460;

  if (isHuffman) {
    // Render either the forest of trees or the final tree
    const forest = state.forest || (state.treeRoot ? [state.treeRoot] : []);
    const numTrees = Math.max(1, forest.length);
    const treeSpacing = svgWidth / (numTrees + 1);

    forest.forEach((rootNode: any, treeIdx: number) => {
      const startX = treeSpacing * (treeIdx + 1);
      const startY = 60;

      function layoutHuffman(node: any, x: number, y: number, spread: number, depth: number) {
        if (!node) return;

        const isHighlighted = highlights.nodes?.includes(node.id);
        const isActiveMerge = state.activeMergeNodes?.includes(node.id);

        visualNodes.push({
          id: node.id,
          label: node.char !== undefined ? `'${node.char}'` : `Σ ${node.freq}`,
          subLabel: node.char !== undefined ? `f: ${node.freq}` : undefined,
          x,
          y,
          status: isActiveMerge ? 'active' : isHighlighted ? 'best' : 'normal',
          code: node.code || state.codeTable?.[node.char],
          isLeaf: node.char !== undefined,
        });

        const nextSpread = Math.max(25, spread / 2);
        const nextY = y + 75;

        if (node.left) {
          const leftX = x - spread;
          visualEdges.push({
            u: node.id,
            v: node.left.id,
            label: '0',
            x1: x,
            y1: y + 16,
            x2: leftX,
            y2: nextY - 16,
          });
          layoutHuffman(node.left, leftX, nextY, nextSpread, depth + 1);
        }

        if (node.right) {
          const rightX = x + spread;
          visualEdges.push({
            u: node.id,
            v: node.right.id,
            label: '1',
            x1: x,
            y1: y + 16,
            x2: rightX,
            y2: nextY - 16,
          });
          layoutHuffman(node.right, rightX, nextY, nextSpread, depth + 1);
        }
      }

      const initialSpread = Math.min(100, (treeSpacing / 2) * 0.9);
      layoutHuffman(rootNode, startX, startY, initialSpread, 0);
    });
  } else if (isKnapsackBB && state.treeRoot) {
    // Layout Branch and Bound tree
    const root = state.treeRoot;

    function layoutBB(node: any, x: number, y: number, spread: number) {
      if (!node) return;

      const isActive = state.activeNodeId === node.id;
      const isPruned = state.prunedNodeIds?.includes(node.id) || node.status === 'pruned';
      const isBest = state.bestItems?.includes(node.id) || node.status === 'best';

      visualNodes.push({
        id: node.id,
        label: `W:${node.weight} V:${node.value}`,
        subLabel: `B:${node.bound}`,
        x,
        y,
        status: isActive ? 'active' : isPruned ? 'pruned' : isBest ? 'best' : 'normal',
        pruneReason: node.pruneReason,
      });

      const children = node.children || [];
      const nextY = y + 75;

      if (children.length === 2) {
        const left = children[0];
        const right = children[1];
        const leftX = x - spread;
        const rightX = x + spread;

        visualEdges.push({
          u: node.id,
          v: left.id,
          label: `+I${left.level}`,
          x1: x,
          y1: y + 16,
          x2: leftX,
          y2: nextY - 16,
          status: 'include',
        });
        layoutBB(left, leftX, nextY, Math.max(35, spread / 2));

        visualEdges.push({
          u: node.id,
          v: right.id,
          label: `-I${right.level}`,
          x1: x,
          y1: y + 16,
          x2: rightX,
          y2: nextY - 16,
          status: 'exclude',
        });
        layoutBB(right, rightX, nextY, Math.max(35, spread / 2));
      } else if (children.length === 1) {
        const singleChild = children[0];
        visualEdges.push({
          u: node.id,
          v: singleChild.id,
          label: singleChild.itemIncluded ? `+I${singleChild.level}` : `-I${singleChild.level}`,
          x1: x,
          y1: y + 16,
          x2: x,
          y2: nextY - 16,
        });
        layoutBB(singleChild, x, nextY, spread);
      }
    }

    layoutBB(root, svgWidth / 2, 50, 180);
  }

  const getNodeFill = (status?: string) => {
    switch (status) {
      case 'active':
        return 'fill-amber stroke-amber-glow stroke-2';
      case 'pruned':
        return 'fill-rose-950/80 stroke-rose-500 stroke-2';
      case 'best':
        return 'fill-acid-500/80 stroke-acid-400 stroke-2 text-obsidian-950';
      case 'explored':
        return 'fill-obsidian-800 stroke-obsidian-600';
      default:
        return 'fill-obsidian-850 stroke-hairline';
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[420px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Banner Details */}
      {isHuffman && state.codeTable && Object.keys(state.codeTable).length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {Object.entries(state.codeTable).map(([char, code]) => (
            <span
              key={char}
              className="px-3 py-1 text-xs font-mono bg-obsidian-950 border border-amber/30 text-chalk-200"
            >
              <strong>'{char}'</strong>: <code className="text-acid-500 font-bold">{code as string}</code>
            </span>
          ))}
        </div>
      )}

      {isKnapsackBB && (
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-mono">
          <span className="px-3 py-1 bg-obsidian-950 border border-acid-500/40 text-acid-500">
            Current Best Value: <strong>{state.bestValue}</strong> (Weight: {state.bestWeight}/{state.capacity})
          </span>
          <span className="px-3 py-1 bg-obsidian-950 border border-hairline text-chalk-400">
            Queue Size: {state.queueSize} | Pruned: {state.prunedNodeIds?.length || 0}
          </span>
        </div>
      )}

      {/* SVG Canvas Container */}
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[500px] flex justify-center bg-obsidian-950 border border-hairline p-4">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-4xl min-w-[700px] h-[440px] select-none"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#647087" />
            </marker>
          </defs>

          {/* Render Edges */}
          {visualEdges.map((edge, idx) => (
            <g key={`edge-${idx}`}>
              <line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="#2a2e39"
                strokeWidth="1.8"
                strokeDasharray={edge.status === 'exclude' ? '4 3' : undefined}
              />
              {edge.label && (
                <g transform={`translate(${(edge.x1 + edge.x2) / 2}, ${(edge.y1 + edge.y2) / 2})`}>
                  <rect
                    x="-12"
                    y="-9"
                    width="24"
                    height="16"
                    className="fill-obsidian-950 stroke-hairline"
                    strokeWidth="0.8"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[10px] font-mono font-bold fill-amber-glow"
                  >
                    {edge.label}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Render Nodes */}
          {visualNodes.map((node) => {
            const isRect = isKnapsackBB;
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer transition-all">
                {isRect ? (
                  <rect
                    x="-34"
                    y="-18"
                    width="68"
                    height="36"
                    className={`${getNodeFill(node.status)} shadow-md`}
                  />
                ) : (
                  <circle
                    r={node.isLeaf ? 22 : 18}
                    className={`${getNodeFill(node.status)} shadow-md`}
                  />
                )}

                {/* Primary label */}
                <text
                  y={node.subLabel ? -3 : 3}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[11px] font-mono font-bold fill-white pointer-events-none"
                >
                  {node.label}
                </text>

                {/* Sub label */}
                {node.subLabel && (
                  <text
                    y={10}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[9px] font-mono fill-chalk-400 pointer-events-none"
                  >
                    {node.subLabel}
                  </text>
                )}

                {/* Code badge for Huffman leaves */}
                {node.code && (
                  <g transform="translate(0, 28)">
                    <rect
                      x="-18"
                      y="-7"
                      width="36"
                      height="14"
                      className="fill-obsidian-950 stroke-acid-500"
                      strokeWidth="0.8"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[9px] font-mono font-bold fill-acid-500 pointer-events-none"
                    >
                      {node.code}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-5 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber border border-amber-glow"></span>
          <span>Active Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-acid-500 border border-acid-400"></span>
          <span>Optimal Solution</span>
        </div>
        {isKnapsackBB && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-900 border border-rose-500"></span>
            <span>Pruned Branch</span>
          </div>
        )}
      </div>
    </div>
  );
};
