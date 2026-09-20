import React, { useState } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { GraphNode, GraphEdge } from '../../algorithms/floydWarshall';

interface GraphVisualizerProps {
  step: AlgorithmStep;
}

type ViewTab = 'graph' | 'matrix' | 'both';

const COLOR_PALETTE: Record<number, { name: string; bg: string; border: string; text: string }> = {
  0: { name: 'Uncolored', bg: '#181a20', border: '#374151', text: '#94a3b8' },
  1: { name: 'Red', bg: '#ef4444', border: '#f87171', text: '#ffffff' },
  2: { name: 'Blue', bg: '#3b82f6', border: '#60a5fa', text: '#ffffff' },
  3: { name: 'Green', bg: '#10b981', border: '#34d399', text: '#ffffff' },
  4: { name: 'Yellow', bg: '#f59e0b', border: '#fbbf24', text: '#000000' },
  5: { name: 'Purple', bg: '#8b5cf6', border: '#a78bfa', text: '#ffffff' },
  6: { name: 'Cyan', bg: '#06b6d4', border: '#22d3ee', text: '#ffffff' },
  7: { name: 'Orange', bg: '#f97316', border: '#fb923c', text: '#ffffff' },
  8: { name: 'Pink', bg: '#ec4899', border: '#f472b6', text: '#ffffff' },
};

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const nodes: GraphNode[] = state.nodes || [];
  const edges: GraphEdge[] = state.edges || [];
  const highlights = step.highlights || {};

  const isFloyd = state.distMatrix !== undefined;
  const isPushRelabel = state.isPushRelabel === true || state.heights !== undefined;
  const isFordFulkerson = state.flowMatrix !== undefined && !isPushRelabel;
  const isVertexCover = state.coveredVertices !== undefined;
  const isGraphColoring = state.isGraphColoring === true || state.colorAssignment !== undefined;
  const isBellmanFord = state.hasNegativeCycle !== undefined || state.distances !== undefined;

  // Default to dual split view for Bellman-Ford, Floyd-Warshall, and Push-Relabel
  const [activeTab, setActiveTab] = useState<ViewTab>(
    isBellmanFord || isFloyd || isPushRelabel ? 'both' : 'graph'
  );

  const svgWidth = 600;
  const svgHeight = 380;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = Math.min(centerX, centerY) - 60;

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

  // Render SVG Graph
  const renderGraphSvg = (compact: boolean = false) => (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className={`w-full ${compact ? 'max-w-xl h-[330px] sm:h-[360px]' : 'max-w-2xl h-[360px]'} select-none transition-all`}
    >
      <defs>
        {/* Default Directed Edge Arrow - High Contrast Steel Slate */}
        <marker
          id="graph-arrow-default"
          viewBox="0 0 10 10"
          refX="22"
          refY="5"
          markerWidth="6.5"
          markerHeight="6.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
        </marker>

        {/* Active / Relaxing Edge Arrow - Vibrant Amber */}
        <marker
          id="graph-arrow-active"
          viewBox="0 0 10 10"
          refX="22"
          refY="5"
          markerWidth="7.5"
          markerHeight="7.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
        </marker>

        {/* Shortest Path Tree Edge Arrow - Vivid Emerald */}
        <marker
          id="graph-arrow-tree"
          viewBox="0 0 10 10"
          refX="22"
          refY="5"
          markerWidth="7.5"
          markerHeight="7.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
        </marker>

        {/* Negative Cycle Edge Arrow - Bold Crimson */}
        <marker
          id="graph-arrow-negcycle"
          viewBox="0 0 10 10"
          refX="22"
          refY="5"
          markerWidth="7.5"
          markerHeight="7.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((edge, idx) => {
        const p1 = nodePositions.get(`${edge.u}`);
        const p2 = nodePositions.get(`${edge.v}`);
        if (!p1 || !p2) return null;

        const edgeStatus = isEdgeHighlighted(`${edge.u}`, `${edge.v}`);
        const isDirected = isFloyd || isFordFulkerson || isBellmanFord || isPushRelabel;
        const isConflictEdge =
          edgeStatus === 'conflict' ||
          (isGraphColoring &&
            state.conflictVertex !== undefined &&
            state.currentVertex !== undefined &&
            ((`${edge.u}` === `${state.currentVertex}` && `${edge.v}` === `${state.conflictVertex}`) ||
              (`${edge.v}` === `${state.currentVertex}` && `${edge.u}` === `${state.conflictVertex}`)));

        // Tree edge check for Bellman-Ford
        const isTreeEdge = isBellmanFord && state.predecessors?.[edge.v] === `${edge.u}`;
        const isNegCycleEdge = isConflictEdge || edgeStatus === 'negcycle';
        const isEdgeActive = edgeStatus === 'active';

        let strokeColor = '#64748b'; // High-contrast slate-500 default (not faded!)
        let strokeWidth = 2;
        let strokeDasharray: string | undefined = undefined;
        let marker = isDirected ? 'url(#graph-arrow-default)' : undefined;

        if (isNegCycleEdge) {
          strokeColor = '#ef4444';
          strokeWidth = 3;
          strokeDasharray = '5 3';
          marker = isDirected ? 'url(#graph-arrow-negcycle)' : undefined;
        } else if (isEdgeActive) {
          strokeColor = '#fbbf24';
          strokeWidth = 3;
          marker = isDirected ? 'url(#graph-arrow-active)' : undefined;
        } else if (isTreeEdge) {
          strokeColor = '#10b981';
          strokeWidth = 2.8;
          marker = isDirected ? 'url(#graph-arrow-tree)' : undefined;
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
              strokeDasharray={strokeDasharray}
              markerEnd={marker}
              className="transition-all duration-300"
            />
            {(edge.weight !== undefined || edge.capacity !== undefined) && (
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x="-15"
                  y="-10"
                  width="30"
                  height="20"
                  rx="4"
                  fill={
                    isEdgeActive
                      ? '#2d1e08'
                      : isTreeEdge
                      ? '#062c1d'
                      : isNegCycleEdge
                      ? '#2f0808'
                      : '#181f2c'
                  }
                  stroke={
                    isEdgeActive
                      ? '#fbbf24'
                      : isTreeEdge
                      ? '#10b981'
                      : isNegCycleEdge
                      ? '#ef4444'
                      : '#475569'
                  }
                  strokeWidth={isEdgeActive || isTreeEdge || isNegCycleEdge ? 1.6 : 1}
                  className="shadow-sm transition-all"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[11px] font-mono font-bold"
                  fill={
                    isEdgeActive
                      ? '#fef08a'
                      : isTreeEdge
                      ? '#6ee7b7'
                      : isNegCycleEdge
                      ? '#fca5a5'
                      : '#f8fafc'
                  }
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

        if (isGraphColoring) {
          const assignedColor = state.colorAssignment?.[node.id] || 0;
          const isCurrent = `${node.id}` === `${state.currentVertex}`;
          const isConflict = `${node.id}` === `${state.conflictVertex}`;

          const colorInfo = COLOR_PALETTE[assignedColor] || COLOR_PALETTE[0];
          const attemptedColorInfo =
            state.currentColor && state.currentColor > 0 ? COLOR_PALETTE[state.currentColor] : null;

          return (
            <g
              key={node.id}
              id={`tree-node-${node.id}`}
              data-tree-node-id={node.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="cursor-pointer"
            >
              {isCurrent && (
                <circle
                  r={28}
                  fill="none"
                  stroke={isConflict ? '#ef4444' : attemptedColorInfo?.bg || '#f59e0b'}
                  strokeWidth={2.5}
                  strokeDasharray={isConflict ? '4 3' : undefined}
                  className="animate-pulse"
                />
              )}

              {isConflict && (
                <circle
                  r={29}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                />
              )}

              <circle
                r={21}
                fill={assignedColor > 0 ? colorInfo.bg : '#1e293b'}
                stroke={
                  isConflict
                    ? '#ef4444'
                    : assignedColor > 0
                    ? colorInfo.border
                    : isCurrent
                    ? '#f59e0b'
                    : '#64748b'
                }
                strokeWidth={isCurrent || isConflict || assignedColor > 0 ? 2.5 : 1.8}
                className="shadow-md transition-all"
              />

              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[12px] font-mono font-bold pointer-events-none"
                fill={assignedColor > 0 ? colorInfo.text : '#f8fafc'}
              >
                {node.label}
              </text>

              {assignedColor > 0 && (
                <text
                  y={34}
                  textAnchor="middle"
                  className="text-[9px] font-mono font-bold uppercase pointer-events-none"
                  fill={colorInfo.border}
                >
                  {colorInfo.name}
                </text>
              )}
            </g>
          );
        }

        const nodeStatus = isNodeHighlighted(`${node.id}`);
        const isSource = isBellmanFord && state.source === `${node.id}`;
        const isPivot = isFloyd && state.k !== undefined && state.k >= 0 && `${state.k}` === `${node.id}`;
        const isSourceI = isFloyd && state.i !== undefined && state.i >= 0 && `${state.i}` === `${node.id}`;
        const isDestJ = isFloyd && state.j !== undefined && state.j >= 0 && `${state.j}` === `${node.id}`;
        const isRelaxingNode =
          isBellmanFord &&
          (state.consideringEdge?.v === `${node.id}` || highlights.activeNode === `${node.id}`);

        let nodeFill = '#1e293b'; // High-contrast solid slate-800 default (not faded!)
        let nodeStroke = '#64748b'; // Crisp slate-500
        let nodeStrokeWidth = 2;

        if (isPivot) {
          nodeFill = '#451a03';
          nodeStroke = '#f59e0b';
          nodeStrokeWidth = 2.8;
        } else if (isSource) {
          nodeFill = '#1e1b4b';
          nodeStroke = '#f59e0b';
          nodeStrokeWidth = 2.8;
        } else if (isSourceI) {
          nodeFill = '#082f49';
          nodeStroke = '#38bdf8';
          nodeStrokeWidth = 2.5;
        } else if (isDestJ) {
          nodeFill = '#2e1065';
          nodeStroke = '#c084fc';
          nodeStrokeWidth = 2.5;
        } else if (isRelaxingNode || nodeStatus === 'active') {
          nodeFill = '#451a03';
          nodeStroke = '#fbbf24';
          nodeStrokeWidth = 2.5;
        } else if (nodeStatus === 'cover') {
          nodeFill = '#b45309';
          nodeStroke = '#f59e0b';
          nodeStrokeWidth = 2;
        } else if (nodeStatus === 'highlight') {
          nodeFill = '#065f46';
          nodeStroke = '#34d399';
          nodeStrokeWidth = 2;
        } else if (nodeStatus === 'special') {
          nodeFill = '#1e3a8a';
          nodeStroke = '#60a5fa';
          nodeStrokeWidth = 2;
        }

        const bfDist = isBellmanFord ? state.distances?.[node.id] : undefined;

        return (
          <g
            key={node.id}
            id={`tree-node-${node.id}`}
            data-tree-node-id={node.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            className="cursor-pointer"
          >
            {/* Outer highlighting ring for special node states */}
            {(isPivot || isSource || isSourceI || isDestJ || isRelaxingNode) && (
              <circle
                r={27}
                fill="none"
                stroke={
                  isPivot || isSource
                    ? '#fbbf24'
                    : isSourceI
                    ? '#38bdf8'
                    : isDestJ
                    ? '#c084fc'
                    : '#fbbf24'
                }
                strokeWidth={isRelaxingNode ? 2.5 : 1.8}
                strokeDasharray={isRelaxingNode ? '4 3' : undefined}
                className={isRelaxingNode ? 'animate-pulse' : undefined}
                opacity={0.85}
              />
            )}

            {/* Main Node Circle */}
            <circle
              r={21}
              fill={nodeFill}
              stroke={nodeStroke}
              strokeWidth={nodeStrokeWidth}
              className="shadow-md transition-all duration-200"
            />

            {/* Node Label Text */}
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[12px] font-mono font-bold pointer-events-none"
              fill="#ffffff"
            >
              {node.label}
            </text>

            {/* Bellman-Ford Distance Badge Below Node */}
            {isBellmanFord && (
              <g transform="translate(0, 32)">
                <rect
                  x="-25"
                  y="-9"
                  width="50"
                  height="18"
                  rx="4"
                  fill={
                    isSource
                      ? '#2d1e08'
                      : isRelaxingNode
                      ? '#2d1e08'
                      : bfDist !== null && bfDist !== undefined
                      ? '#0c2738'
                      : '#1e293b'
                  }
                  stroke={
                    isSource
                      ? '#f59e0b'
                      : isRelaxingNode
                      ? '#fbbf24'
                      : bfDist !== null && bfDist !== undefined
                      ? '#38bdf8'
                      : '#475569'
                  }
                  strokeWidth={isRelaxingNode ? 1.5 : 1}
                  className="shadow-sm transition-all"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[10px] font-mono font-bold"
                  fill={
                    isSource
                      ? '#fef08a'
                      : isRelaxingNode
                      ? '#fef08a'
                      : bfDist !== null && bfDist !== undefined
                      ? '#7dd3fc'
                      : '#cbd5e1'
                  }
                >
                  {bfDist === null || bfDist === undefined ? 'd = ∞' : `d = ${bfDist}`}
                </text>
              </g>
            )}

            {/* Floyd-Warshall Role Badge Below Node */}
            {isFloyd && (isPivot || isSourceI || isDestJ) && (
              <g transform="translate(0, 32)">
                <rect
                  x="-22"
                  y="-8"
                  width="44"
                  height="16"
                  rx="3"
                  fill={isPivot ? '#2d1e08' : isSourceI ? '#082f49' : '#2e1065'}
                  stroke={isPivot ? '#f59e0b' : isSourceI ? '#38bdf8' : '#c084fc'}
                  strokeWidth="1"
                  className="shadow-sm"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[9px] font-mono font-bold uppercase tracking-wider"
                  fill={isPivot ? '#fbbf24' : isSourceI ? '#7dd3fc' : '#e9d5ff'}
                >
                  {isPivot ? 'PIVOT' : isSourceI ? 'SRC' : 'DST'}
                </text>
              </g>
            )}

            {/* Push-Relabel Height and Excess Badge Below Node */}
            {isPushRelabel && (
              <g transform="translate(0, 32)">
                <rect
                  x="-32"
                  y="-9"
                  width="64"
                  height="18"
                  rx="4"
                  fill={
                    (state.excess?.[node.id] || 0) > 0 && `${node.id}` !== state.source && `${node.id}` !== state.sink
                      ? '#2d1e08'
                      : '#181f2c'
                  }
                  stroke={
                    (state.excess?.[node.id] || 0) > 0 && `${node.id}` !== state.source && `${node.id}` !== state.sink
                      ? '#fbbf24'
                      : '#475569'
                  }
                  strokeWidth={
                    (state.excess?.[node.id] || 0) > 0 && `${node.id}` !== state.source && `${node.id}` !== state.sink
                      ? 1.6
                      : 1
                  }
                  className="shadow-sm transition-all"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[9.5px] font-mono font-bold"
                  fill={
                    (state.excess?.[node.id] || 0) > 0 && `${node.id}` !== state.source && `${node.id}` !== state.sink
                      ? '#fef08a'
                      : '#cbd5e1'
                  }
                >
                  h:{state.heights?.[node.id] ?? 0} | e:{state.excess?.[node.id] ?? 0}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );

  // Render Bellman-Ford Distance & Predecessor Table
  const renderBellmanFordTable = () => (
    <div className="w-full overflow-x-auto max-h-[360px] p-4 bg-obsidian-950 border border-hairline">
      <table className="w-full border-collapse text-center text-xs font-mono">
        <thead>
          <tr className="bg-obsidian-900/90 border-b border-hairline">
            <th className="p-2.5 text-chalk-300 uppercase tracking-wider text-[11px] font-bold">
              Vertex
            </th>
            <th className="p-2.5 text-chalk-300 uppercase tracking-wider text-[11px] font-bold">
              Distance from {nodes.find((x) => x.id === state.source)?.label ?? state.source}
            </th>
            <th className="p-2.5 text-chalk-300 uppercase tracking-wider text-[11px] font-bold">
              Predecessor
            </th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((nd) => {
            const d = state.distances?.[nd.id];
            const p = state.predecessors?.[nd.id];
            const isTouched = state.consideringEdge?.v === nd.id;
            const isSourceNode = state.source === nd.id;

            return (
              <tr
                key={nd.id}
                className={`transition-colors ${
                  isTouched
                    ? 'bg-amber/20 border-l-4 border-l-amber'
                    : isSourceNode
                    ? 'bg-amber/5'
                    : 'hover:bg-obsidian-850/70'
                }`}
              >
                <th className="p-2.5 border border-hairline text-chalk-200 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    {nd.label}
                    {isSourceNode && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber/20 text-amber-glow border border-amber/40">
                        SRC
                      </span>
                    )}
                  </span>
                </th>
                <td
                  className={`p-2.5 border border-hairline tabular-nums text-sm ${
                    isTouched
                      ? 'text-amber-glow font-extrabold scale-105'
                      : d === null || d === undefined
                      ? 'text-chalk-500'
                      : 'text-chalk-100 font-semibold'
                  }`}
                >
                  {d === null || d === undefined ? '∞' : d}
                </td>
                <td className="p-2.5 border border-hairline text-chalk-300">
                  {p ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      {nodes.find((x) => x.id === p)?.label ?? p}
                      <span className="text-[10px] text-chalk-500">→</span>
                      {nd.label}
                    </span>
                  ) : (
                    <span className="text-chalk-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Render Push-Relabel Vertex Height & Excess Table
  const renderPushRelabelTable = () => (
    <div className="w-full overflow-x-auto max-h-[360px] p-4 bg-obsidian-950 border border-hairline">
      <table className="w-full border-collapse text-center text-xs font-mono">
        <thead>
          <tr className="bg-obsidian-900/90 border-b border-hairline">
            <th className="p-2.5 text-chalk-300 uppercase tracking-wider text-[11px] font-bold">
              Vertex
            </th>
            <th className="p-2.5 text-chalk-300 uppercase tracking-wider text-[11px] font-bold">
              Height h(u)
            </th>
            <th className="p-2.5 text-chalk-300 uppercase tracking-wider text-[11px] font-bold">
              Excess e(u)
            </th>
            <th className="p-2.5 text-chalk-300 uppercase tracking-wider text-[11px] font-bold">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((nd) => {
            const h = state.heights?.[nd.id] ?? 0;
            const e = state.excess?.[nd.id] ?? 0;
            const isSource = nd.id === state.source;
            const isSink = nd.id === state.sink;
            const isOverflowing = e > 0 && !isSource && !isSink;
            const isCurrent = nd.id === state.currentVertex;

            return (
              <tr
                key={nd.id}
                className={`transition-colors ${
                  isCurrent
                    ? 'bg-amber/20 border-l-4 border-l-amber'
                    : isOverflowing
                    ? 'bg-amber/10'
                    : 'hover:bg-obsidian-850/70'
                }`}
              >
                <th className="p-2.5 border border-hairline text-chalk-200 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    {nd.label}
                    {isSource && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-950/80 text-sky-300 border border-sky-600/40">
                        SRC
                      </span>
                    )}
                    {isSink && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                        SNK
                      </span>
                    )}
                  </span>
                </th>
                <td className="p-2.5 border border-hairline tabular-nums text-chalk-100 font-semibold">
                  {h}
                </td>
                <td
                  className={`p-2.5 border border-hairline tabular-nums font-bold ${
                    isOverflowing ? 'text-amber-glow text-sm scale-105' : 'text-chalk-300'
                  }`}
                >
                  {e}
                </td>
                <td className="p-2.5 border border-hairline">
                  {isSource ? (
                    <span className="text-sky-400 font-semibold">Source (|V|)</span>
                  ) : isSink ? (
                    <span className="text-emerald-400 font-semibold">Sink (Flow: {e})</span>
                  ) : isOverflowing ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber/20 text-amber font-bold uppercase">
                      Overflowing
                    </span>
                  ) : (
                    <span className="text-chalk-500">Balanced (0)</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Render Floyd-Warshall Distance Matrix or Ford-Fulkerson Capacity Matrix
  const renderMatrixTable = () => (
    <div className="w-full overflow-x-auto max-h-[360px] p-4 bg-obsidian-950 border border-hairline">
      <table className="w-full border-collapse text-center text-xs font-mono">
        <thead>
          <tr className="bg-obsidian-900/90">
            <th className="p-2.5 border-b border-r border-hairline text-chalk-400 uppercase tracking-wider text-[11px] font-bold">
              Src \ Dst
            </th>
            {nodes.map((n, colIdx) => {
              const isColDest = isFloyd && state.j === colIdx;
              const isColPivot = isFloyd && state.k === colIdx;

              return (
                <th
                  key={n.id}
                  className={`p-2.5 border-b border-hairline text-[11px] font-bold transition-colors ${
                    isColDest
                      ? 'bg-purple-950/60 text-purple-300 border-b-2 border-b-purple-400'
                      : isColPivot
                      ? 'bg-amber-950/50 text-amber-300 border-b-2 border-b-amber-400'
                      : 'text-chalk-300'
                  }`}
                >
                  {n.label}
                  {isColPivot && <span className="block text-[8px] text-amber-400 font-normal">PIVOT</span>}
                  {isColDest && <span className="block text-[8px] text-purple-300 font-normal">DST</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {(isFloyd ? state.distMatrix : state.capacityMatrix)?.map((row: any[], r: number) => {
            const isRowSrc = isFloyd && state.i === r;
            const isRowPivot = isFloyd && state.k === r;

            return (
              <tr key={r} className="hover:bg-obsidian-850/60 transition-colors">
                <th
                  className={`p-2.5 border-r border-b border-hairline text-[11px] font-bold transition-colors ${
                    isRowSrc
                      ? 'bg-sky-950/60 text-sky-300 border-r-2 border-r-sky-400'
                      : isRowPivot
                      ? 'bg-amber-950/50 text-amber-300 border-r-2 border-r-amber-400'
                      : 'text-chalk-300'
                  }`}
                >
                  {nodes[r]?.label}
                  {isRowSrc && <span className="block text-[8px] text-sky-300 font-normal">SRC</span>}
                  {isRowPivot && !isRowSrc && (
                    <span className="block text-[8px] text-amber-400 font-normal">PIVOT</span>
                  )}
                </th>
                {row.map((val: any, c: number) => {
                  const isUpdated = state.updatedCell?.i === r && state.updatedCell?.j === c;
                  const isSubpathIK = isFloyd && state.i === r && state.k === c;
                  const isSubpathKJ = isFloyd && state.k === r && state.j === c;

                  let cellStyle = 'text-chalk-300';
                  if (isUpdated) {
                    cellStyle =
                      'bg-amber/30 text-amber-glow font-extrabold border-2 border-amber shadow-sm scale-105';
                  } else if (isSubpathIK) {
                    cellStyle = 'bg-sky-950/50 text-sky-300 font-semibold border border-sky-600/40';
                  } else if (isSubpathKJ) {
                    cellStyle = 'bg-purple-950/50 text-purple-300 font-semibold border border-purple-600/40';
                  }

                  return (
                    <td
                      key={c}
                      className={`p-2.5 border border-hairline tabular-nums text-xs transition-all ${cellStyle}`}
                    >
                      {val === null ? '∞' : val}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full min-h-[420px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Controls / Tabs Banner */}
      <div className="flex flex-wrap items-center justify-between w-full mb-4 gap-3">
        {/* Telemetry Status Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          {isFloyd && state.k >= 0 && (
            <span className="px-3 py-1 bg-obsidian-950 border border-amber/40 text-amber-glow font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber animate-pulse"></span>
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
          {isPushRelabel && (
            <>
              <span className="px-3 py-1 bg-obsidian-950 border border-acid-500/40 text-acid-500 font-bold">
                SINK FLOW: <strong>{state.currentFlowToSink ?? 0}</strong>
              </span>
              <span className="px-3 py-1 bg-obsidian-950 border border-amber/30 text-amber-glow">
                OVERFLOWING: <strong>{state.overflowingNodes?.length ?? 0}</strong>
              </span>
              {state.activeOperation && (
                <span className="px-3 py-1 bg-obsidian-950 border border-electric-500/40 text-electric-400 font-bold uppercase">
                  {state.activeOperation}
                </span>
              )}
            </>
          )}
          {isBellmanFord && (
            <>
              <span className="px-3 py-1 bg-obsidian-950 border border-hairline text-chalk-200">
                SOURCE:{' '}
                <strong className="text-amber-glow font-bold">
                  {nodes.find((x) => x.id === state.source)?.label ?? state.source}
                </strong>
              </span>
              {state.pass > 0 && state.pass <= state.totalPasses && (
                <span className="px-3 py-1 bg-obsidian-950 border border-amber/30 text-amber-glow">
                  PASS: <strong>{state.pass} / {state.totalPasses}</strong>
                </span>
              )}
              {state.pass > state.totalPasses && !step.isFinal && (
                <span className="px-3 py-1 bg-obsidian-950 border border-amber/30 text-amber-glow">
                  VERIFICATION PASS
                </span>
              )}
              {step.isFinal && (
                <span
                  className={`px-3 py-1 font-bold border ${
                    state.hasNegativeCycle
                      ? 'bg-red-950/60 border-red-500 text-red-400'
                      : 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                  }`}
                >
                  {state.hasNegativeCycle ? '✕ NEGATIVE CYCLE DETECTED' : '✓ SHORTEST PATHS FOUND'}
                </span>
              )}
            </>
          )}
          {isGraphColoring && (
            <>
              <span className="px-3 py-1 bg-obsidian-950 border border-hairline text-chalk-300">
                COLORS: <strong>k = {state.numColors ?? 3}</strong>
              </span>
              {state.currentVertex !== undefined && (
                <span className="px-3 py-1 bg-obsidian-950 border border-amber/40 text-amber-glow flex items-center gap-1.5">
                  CURRENT: <strong>V{parseInt(state.currentVertex) + 1}</strong>
                  {state.currentColor !== undefined && state.currentColor > 0 && (
                    <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[10px] bg-obsidian-900 border border-hairline">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: COLOR_PALETTE[state.currentColor]?.bg || '#f59e0b' }}
                      />
                      {COLOR_PALETTE[state.currentColor]?.name}
                    </span>
                  )}
                </span>
              )}
              {state.conflictVertex !== undefined && (
                <span className="px-3 py-1 bg-red-950/80 border border-red-500/80 text-red-400 font-bold animate-pulse">
                  ⚠️ CONFLICT: V{parseInt(state.conflictVertex) + 1}
                </span>
              )}
              {step.isFinal && step.result && (
                <span
                  className={`px-3 py-1 font-bold border ${
                    step.result.solvable
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                      : 'bg-red-950/60 border-red-500 text-red-400'
                  }`}
                >
                  {step.result.solvable ? `✓ VALID ${state.numColors}-COLORING` : `✕ NOT ${state.numColors}-COLORABLE`}
                </span>
              )}
            </>
          )}
        </div>

        {/* 3-Way View Selector: GRAPH ONLY | TABLE/MATRIX ONLY | BOTH (SPLIT) */}
        {(isFloyd || isFordFulkerson || isBellmanFord || isPushRelabel) && (
          <div className="flex bg-obsidian-950 p-1 border border-hairline text-xs font-mono gap-1">
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1 transition-all ${
                activeTab === 'graph'
                  ? 'bg-amber text-obsidian-950 font-bold shadow-sm'
                  : 'text-chalk-400 hover:text-chalk-200'
              }`}
            >
              GRAPH ONLY
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 transition-all ${
                activeTab === 'matrix'
                  ? 'bg-amber text-obsidian-950 font-bold shadow-sm'
                  : 'text-chalk-400 hover:text-chalk-200'
              }`}
            >
              {isFloyd ? 'MATRIX ONLY' : isBellmanFord ? 'DISTANCES ONLY' : isPushRelabel ? 'HEIGHTS ONLY' : 'CAPACITY ONLY'}
            </button>
            <button
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1 transition-all flex items-center gap-1.5 ${
                activeTab === 'both'
                  ? 'bg-amber text-obsidian-950 font-bold shadow-sm'
                  : 'text-chalk-400 hover:text-chalk-200'
              }`}
            >
              <span>BOTH (SPLIT)</span>
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {activeTab === 'both' && (isFloyd || isFordFulkerson || isBellmanFord || isPushRelabel) ? (
        /* Dual Split Layout: Graph on Left, Table/Matrix on Right */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full items-stretch">
          {/* Graph Section */}
          <div className="flex flex-col bg-obsidian-950 border border-hairline p-3 sm:p-4 w-full">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline/60">
              <span className="text-[11px] font-mono uppercase tracking-wider text-chalk-300 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber inline-block"></span>
                GRAPH TOPOLOGY
              </span>
              <span className="text-[10px] font-mono text-chalk-500">
                {nodes.length} Vertices • {edges.length} Edges
              </span>
            </div>
            <div className="w-full flex-1 flex items-center justify-center min-h-[340px]">
              {renderGraphSvg(true)}
            </div>
          </div>

          {/* Table / Matrix Section */}
          <div className="flex flex-col bg-obsidian-950 border border-hairline p-3 sm:p-4 w-full">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline/60">
              <span className="text-[11px] font-mono uppercase tracking-wider text-chalk-300 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-acid-500 inline-block"></span>
                {isPushRelabel
                  ? 'VERTEX HEIGHTS & EXCESS FLOW'
                  : isBellmanFord
                  ? 'DISTANCE & PREDECESSOR TABLE'
                  : isFloyd
                  ? 'DISTANCE MATRIX D(k)'
                  : 'CAPACITY MATRIX'}
              </span>
              {isFloyd && state.k >= 0 && (
                <span className="text-[10px] font-mono text-amber-glow font-bold">
                  PIVOT: V{state.k + 1}
                </span>
              )}
              {isBellmanFord && (
                <span className="text-[10px] font-mono text-amber-glow font-bold">
                  SOURCE: {nodes.find((x) => x.id === state.source)?.label ?? state.source}
                </span>
              )}
            </div>
            <div className="w-full flex-1 overflow-x-auto flex items-start justify-center">
              {isPushRelabel
                ? renderPushRelabelTable()
                : isBellmanFord
                ? renderBellmanFordTable()
                : renderMatrixTable()}
            </div>
          </div>
        </div>
      ) : activeTab === 'matrix' ? (
        /* Standalone Table / Matrix View */
        <div className="w-full max-w-2xl flex justify-center">
          {isPushRelabel
            ? renderPushRelabelTable()
            : isBellmanFord
            ? renderBellmanFordTable()
            : renderMatrixTable()}
        </div>
      ) : (
        /* Standalone Graph View */
        <div className="w-full flex justify-center bg-obsidian-950 border border-hairline p-4">
          {renderGraphSvg(false)}
        </div>
      )}

      {/* High-Contrast Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-5 text-xs font-mono text-chalk-400">
        {!isGraphColoring && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber border border-amber-glow"></span>
            <span>Active Edge / Relaxation</span>
          </div>
        )}
        {isBellmanFord && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 border border-emerald-400"></span>
              <span>Shortest-Path Tree Edge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0 border-t-2 border-dashed border-red-500"></span>
              <span>Negative-Cycle Edge</span>
            </div>
          </>
        )}
        {isFloyd && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-sky-500 border border-sky-400"></span>
              <span>Source Node (Vi)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-purple-500 border border-purple-400"></span>
              <span>Dest Node (Vj)</span>
            </div>
          </>
        )}
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
        {isGraphColoring && (
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-chalk-400">
            <span className="text-chalk-500 uppercase">Available Colors:</span>
            {Array.from({ length: state.numColors || 3 }, (_, i) => i + 1).map((c) => (
              <div key={c} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border"
                  style={{
                    backgroundColor: COLOR_PALETTE[c]?.bg || '#475569',
                    borderColor: COLOR_PALETTE[c]?.border || '#94a3b8',
                  }}
                />
                <span>{COLOR_PALETTE[c]?.name || `Color ${c}`}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="w-3 h-3 rounded-full border-2 border-amber" />
              <span>Current Vertex</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-dashed border-red-500" />
              <span>Conflict</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
