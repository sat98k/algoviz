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
    <div className="flex flex-col items-center w-full min-h-[420px] p-6 bg-slate-900/90 rounded-xl border border-slate-800 backdrop-blur">
      {/* Top Controls / Tabs */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-4">
        {/* Status badges */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {isFloyd && state.k >= 0 && (
            <span className="px-3 py-1 bg-sky-950 border border-sky-500/40 rounded-full text-sky-300">
              Intermediate Pivot Vertex: <strong>V{state.k + 1}</strong>
            </span>
          )}
          {isFordFulkerson && (
            <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 rounded-full text-emerald-300">
              Total Max Flow: <strong>{state.totalMaxFlow}</strong>
            </span>
          )}
          {isVertexCover && (
            <span className="px-3 py-1 bg-purple-950 border border-purple-500/40 rounded-full text-purple-300">
              Cover Size |C|: <strong>{state.coveredVertices?.length || 0}</strong>
            </span>
          )}
        </div>

        {/* View toggle for Floyd-Warshall / Ford-Fulkerson */}
        {(isFloyd || isFordFulkerson) && (
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'graph' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Graph View
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'matrix' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isFloyd ? 'Distance Matrix' : 'Capacity Matrix'}
            </button>
          </div>
        )}
      </div>

      {/* Main Visual Content */}
      {activeTab === 'graph' ? (
        <div className="w-full flex justify-center bg-slate-950/70 rounded-lg border border-slate-800/80 p-2">
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
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
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
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge, idx) => {
              const p1 = nodePositions.get(`${edge.u}`);
              const p2 = nodePositions.get(`${edge.v}`);
              if (!p1 || !p2) return null;

              const edgeStatus = isEdgeHighlighted(`${edge.u}`, `${edge.v}`);
              const isDirected = isFloyd || isFordFulkerson;

              let strokeColor = '#334155';
              let strokeWidth = 1.8;
              let marker = isDirected ? 'url(#graph-arrow)' : undefined;

              if (edgeStatus === 'active') {
                strokeColor = '#38bdf8';
                strokeWidth = 3;
                marker = isDirected ? 'url(#graph-arrow-active)' : undefined;
              } else if (edgeStatus === 'flow' || edgeStatus === 'cover') {
                strokeColor = '#10b981';
                strokeWidth = 3;
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
                  />
                  {/* Edge Weight / Flow label */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-14"
                      y="-9"
                      width="28"
                      height="17"
                      rx="4"
                      className="fill-slate-900/90 stroke-slate-700"
                      strokeWidth="0.8"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[10px] font-mono font-bold fill-slate-300"
                    >
                      {isFordFulkerson
                        ? `${edge.flow || 0}/${edge.capacity}`
                        : `${edge.weight}`}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = nodePositions.get(node.id);
              if (!pos) return null;
              const nodeStatus = isNodeHighlighted(node.id);

              let fillClass = 'fill-slate-800 stroke-slate-600';
              if (nodeStatus === 'active') fillClass = 'fill-sky-500 stroke-sky-300 stroke-2';
              if (nodeStatus === 'cover') fillClass = 'fill-purple-600 stroke-purple-300 stroke-2';
              if (nodeStatus === 'highlight') fillClass = 'fill-emerald-600 stroke-emerald-300 stroke-2';
              if (nodeStatus === 'special') fillClass = 'fill-amber-600 stroke-amber-300 stroke-2';

              return (
                <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`} className="cursor-pointer">
                  <circle r={20} className={`${fillClass} shadow-lg transition-all`} />
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
        <div className="w-full overflow-x-auto max-h-[360px] p-4 bg-slate-950/80 rounded-lg border border-slate-800">
          <table className="w-full border-collapse text-center text-xs font-mono">
            <thead>
              <tr>
                <th className="p-2 border-b border-r border-slate-700 text-slate-400">Src \ Dst</th>
                {nodes.map((n) => (
                  <th key={n.id} className="p-2 border-b border-slate-700 text-slate-300">
                    {n.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(isFloyd ? state.distMatrix : state.capacityMatrix)?.map((row: any[], r: number) => (
                <tr key={r} className="hover:bg-slate-800/40">
                  <th className="p-2 border-r border-b border-slate-700 text-slate-400">{nodes[r]?.label}</th>
                  {row.map((val: any, c: number) => {
                    const isUpdated = state.updatedCell?.i === r && state.updatedCell?.j === c;
                    return (
                      <td
                        key={c}
                        className={`p-2 border border-slate-800 ${
                          isUpdated ? 'bg-sky-500/30 text-sky-200 font-bold border-sky-400' : 'text-slate-300'
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
      <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-sky-500 border border-sky-300"></span>
          <span>Active Vertex / Path</span>
        </div>
        {isVertexCover && (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-purple-600 border border-purple-300"></span>
            <span>Vertex Cover Set C</span>
          </div>
        )}
        {isFordFulkerson && (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-300"></span>
            <span>Augmented Flow</span>
          </div>
        )}
      </div>
    </div>
  );
};
