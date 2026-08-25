import React, { useState } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { GraphNode, GraphEdge } from '../../algorithms/floydWarshall';

interface GraphVisualizerProps {
  step: AlgorithmStep;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ step }) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'matrix'>('graph');
  const state = step.state || {};
  const nodes: GraphNode[] = state.nodes || [];
  const edges: GraphEdge[] = state.edges || [];
  const highlights = step.highlights || {};

  const isFloyd = state.distMatrix !== undefined;
  const isFordFulkerson = state.flowMatrix !== undefined;
  const isVertexCover = state.coveredVertices !== undefined;

  const svgWidth = 600;
  const svgHeight = 380;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = Math.min(centerX, centerY) - 55;

  // Calculate circular layout positions for nodes if x,y not provided
  const nodePositions = new Map<string, { x: number; y: number }>();
  const totalNodes = Math.max(1, nodes.length);

  nodes.forEach((node, idx) => {
    if (node.x !== undefined && node.y !== undefined) {
      nodePositions.set(node.id, { x: node.x, y: node.y });
    } else {
      const angle = (idx / totalNodes) * 2 * Math.PI - Math.PI / 2;
      nodePositions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
  });

  const isNodeHighlighted = (id: string) => {
    if (highlights.activeNode === id) return 'active';
    if (highlights.nodes?.includes(id)) return 'highlight';
    if (isVertexCover && state.coveredVertices?.includes(id)) return 'cover';
    if (isFordFulkerson && (id === state.source || id === state.sink)) return 'special';
    return null;
  };

  const isEdgeHighlighted = (u: string, v: string) => {
    const match = highlights.edges?.find((e) => `${e.u}` === `${u}` && `${e.v}` === `${v}`);
    if (match) return match.status || 'active';
    if (isVertexCover && state.pickedMatchingEdges?.some((e: any) => `${e.u}` === `${u}` && `${e.v}` === `${v}`)) {
      return 'cover';
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[420px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Controls / Tabs */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-2xl mb-4 gap-3">
        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {isFloyd && state.k >= 0 && (
            <span className="px-3 py-1 bg-obsidian-950 border border-amber/30 text-amber-glow">
              PIVOT VERTEX: <strong>V{state.k + 1}</strong>
            </span>
          )}
          {isFordFulkerson && (
            <span className="px-3 py-1 bg-obsidian-950 border border-acid-500/40 text-acid-500">
              TOTAL MAX FLOW: <strong>{state.totalMaxFlow}</strong>
            </span>
          )}
          {isVertexCover && (
            <span className="px-3 py-1 bg-obsidian-950 border border-amber/30 text-amber-glow">
              COVER SIZE |C|: <strong>{state.coveredVertices?.length || 0}</strong>
            </span>
          )}
        </div>

        {/* View toggle for Floyd-Warshall / Ford-Fulkerson */}
        {(isFloyd || isFordFulkerson) && (
          <div className="flex bg-obsidian-950 p-0.5 border border-hairline text-xs font-mono">
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1 transition-all ${
                activeTab === 'graph' ? 'bg-amber text-obsidian-950 font-bold' : 'text-chalk-400 hover:text-chalk-200'
              }`}
            >
              GRAPH VIEW
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 transition-all ${
                activeTab === 'matrix' ? 'bg-amber text-obsidian-950 font-bold' : 'text-chalk-400 hover:text-chalk-200'
              }`}
            >
              {isFloyd ? 'DISTANCE MATRIX' : 'CAPACITY MATRIX'}
            </button>
          </div>
        )}
      </div>

      {/* Main Visual Content */}
      {activeTab === 'graph' ? (
        <div className="w-full flex justify-center bg-obsidian-950 border border-hairline p-4">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-2xl h-[360px] select-none">
            <defs>
              <marker
                id="graph-arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#647087" />
              </marker>
              <marker
                id="graph-arrow-active"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge, idx) => {
              const p1 = nodePositions.get(`${edge.u}`);
              const p2 = nodePositions.get(`${edge.v}`);
              if (!p1 || !p2) return null;

              const edgeStatus = isEdgeHighlighted(`${edge.u}`, `${edge.v}`);
              const isDirected = isFloyd || isFordFulkerson;

              let strokeColor = '#2a2e39';
              let strokeWidth = 1.8;
              let marker = isDirected ? 'url(#graph-arrow)' : undefined;

              if (edgeStatus === 'active') {
                strokeColor = '#f59e0b';
                strokeWidth = 2.5;
                marker = isDirected ? 'url(#graph-arrow-active)' : undefined;
              } else if (edgeStatus === 'flow' || edgeStatus === 'cover') {
                strokeColor = '#10b981';
                strokeWidth = 2.5;
              }

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    markerEnd={marker}
                    className="transition-colors duration-300"
                  />
                  {(edge.weight !== undefined || edge.capacity !== undefined) && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-14"
                        y="-9"
                        width="28"
                        height="18"
                        className="fill-obsidian-950 stroke-hairline"
                        strokeWidth="0.8"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-[10px] font-mono font-bold fill-chalk-200"
                      >
                        {edge.flow !== undefined ? `${edge.flow}/${edge.capacity}` : edge.weight}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = nodePositions.get(`${node.id}`);
              if (!pos) return null;

              const nodeStatus = isNodeHighlighted(`${node.id}`);

              let fillClass = 'fill-obsidian-850 stroke-hairline';
              if (nodeStatus === 'active') fillClass = 'fill-amber stroke-amber-glow stroke-2';
              if (nodeStatus === 'cover') fillClass = 'fill-amber-glow/80 stroke-amber stroke-2';
              if (nodeStatus === 'highlight') fillClass = 'fill-acid-500/80 stroke-acid-400 stroke-2';
              if (nodeStatus === 'special') fillClass = 'fill-electric-500/80 stroke-electric-400 stroke-2';

              return (
                <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`} className="cursor-pointer">
                  <circle r={20} className={`${fillClass} shadow-md transition-all`} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[11px] font-mono font-bold fill-white pointer-events-none"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        /* Matrix View for Floyd-Warshall or Ford-Fulkerson */
        <div className="w-full overflow-x-auto max-h-[360px] p-4 bg-obsidian-950 border border-hairline">
          <table className="w-full border-collapse text-center text-xs font-mono">
            <thead>
              <tr>
                <th className="p-2.5 border-b border-r border-hairline text-chalk-500 uppercase tracking-wider text-[10px]">Src \ Dst</th>
                {nodes.map((n) => (
                  <th key={n.id} className="p-2.5 border-b border-hairline text-chalk-400 text-[11px]">
                    {n.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(isFloyd ? state.distMatrix : state.capacityMatrix)?.map((row: any[], r: number) => (
                <tr key={r} className="hover:bg-obsidian-850/60">
                  <th className="p-2.5 border-r border-b border-hairline text-chalk-400 text-[11px]">{nodes[r]?.label}</th>
                  {row.map((val: any, c: number) => {
                    const isUpdated = state.updatedCell?.i === r && state.updatedCell?.j === c;
                    return (
                      <td
                        key={c}
                        className={`p-2.5 border border-hairline tabular-nums ${
                          isUpdated ? 'bg-amber/20 text-amber-glow font-bold border-amber' : 'text-chalk-300'
                        }`}
                      >
                        {val === null ? '∞' : val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-5 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber border border-amber-glow"></span>
          <span>Active Vertex / Path</span>
        </div>
        {isVertexCover && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-glow border border-amber"></span>
            <span>Vertex Cover C</span>
          </div>
        )}
        {isFordFulkerson && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-acid-500 border border-acid-400"></span>
            <span>Augmented Flow</span>
          </div>
        )}
      </div>
    </div>
  );
};
