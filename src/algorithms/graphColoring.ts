import { AlgorithmStep } from '../types/algorithm';
import { GraphNode, GraphEdge } from './floydWarshall';

export interface GraphColoringState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  numColors: number;
  colorAssignment: Record<string, number>; // node id -> color index (1-based, 0 = uncolored)
  currentVertex?: string;
  currentColor?: number;
  conflictVertex?: string;
  isGraphColoring: boolean; // flag for GraphVisualizer detection
  explanation?: string;
}

const COLOR_NAMES = ['—', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Cyan', 'Pink'];

export function* graphColoringSteps(inputs: {
  edgeList?: [string, string][];
  numColors?: number;
  numNodes?: number;
}): Generator<AlgorithmStep<GraphColoringState>> {
  const defaultEdges: [string, string][] = [
    ['0', '1'],
    ['0', '2'],
    ['0', '3'],
    ['1', '2'],
    ['2', '3'],
  ];

  const rawEdges = inputs.edgeList || defaultEdges;
  const k = inputs.numColors ?? 3;

  // Build node set and adjacency list
  const nodeSet = new Set<string>();
  if (inputs.numNodes && inputs.numNodes > 0) {
    for (let i = 0; i < inputs.numNodes; i++) {
      nodeSet.add(String(i));
    }
  }
  for (const [u, v] of rawEdges) {
    nodeSet.add(String(u));
    nodeSet.add(String(v));
  }

  const sortedIds = Array.from(nodeSet).sort((a, b) => parseInt(a) - parseInt(b));
  const nodes: GraphNode[] = sortedIds.map((id) => ({
    id,
    label: `V${parseInt(id) + 1}`,
  }));

  const allEdges: GraphEdge[] = rawEdges.map(([u, v]) => ({
    u,
    v,
    weight: 1,
  }));

  // Adjacency list
  const adj = new Map<string, Set<string>>();
  for (const id of sortedIds) adj.set(id, new Set());
  for (const [u, v] of rawEdges) {
    adj.get(u)!.add(v);
    adj.get(v)!.add(u);
  }

  let stepIndex = 0;
  let comparisons = 0;
  let backtracks = 0;
  let nodesExplored = 0;

  // Color assignment: 0 = uncolored
  const colorAssignment: Record<string, number> = {};
  for (const id of sortedIds) colorAssignment[id] = 0;

  const makeStep = (
    title: string,
    description: string,
    codeLine: number,
    explanation: string,
    currentVertex?: string,
    currentColor?: number,
    conflictVertex?: string,
    isFinal = false,
    result?: any
  ): AlgorithmStep<GraphColoringState> => {
    const highlightNodes: string[] = [];
    const highlightEdges: {
      u: string | number;
      v: string | number;
      status?: 'active' | 'flow' | 'residual' | 'visited' | 'cover' | 'conflict';
    }[] = [];

    if (currentVertex) highlightNodes.push(currentVertex);
    if (conflictVertex) {
      highlightNodes.push(conflictVertex);
      // Highlight conflict edge
      highlightEdges.push({ u: currentVertex!, v: conflictVertex, status: 'conflict' });
      highlightEdges.push({ u: conflictVertex, v: currentVertex!, status: 'conflict' });
    }

    return {
      stepIndex: stepIndex++,
      title,
      description,
      codeLine,
      state: {
        nodes: nodes.map((n) => ({ ...n })),
        edges: allEdges.map((e) => ({ ...e })),
        numColors: k,
        colorAssignment: { ...colorAssignment },
        currentVertex,
        currentColor,
        conflictVertex,
        isGraphColoring: true,
        explanation,
      },
      highlights: {
        nodes: highlightNodes,
        activeNode: currentVertex,
        edges: highlightEdges,
      },
      metrics: {
        comparisons,
        backtracks,
        nodesExplored,
      },
      isFinal,
      result,
    };
  };

  // Initialize
  yield makeStep(
    'Initialize Graph Coloring',
    `Graph has ${nodes.length} vertices and ${allEdges.length} edges. Attempting to color with k = ${k} colors: [${COLOR_NAMES.slice(1, k + 1).join(', ')}].`,
    1,
    `${nodes.length} vertices, ${allEdges.length} edges, k = ${k}`
  );

  // Check if color c is safe for vertex v
  function isSafe(vertexId: string, color: number): { safe: boolean; conflict?: string } {
    const neighbors = adj.get(vertexId)!;
    for (const neighborId of neighbors) {
      comparisons++;
      if (colorAssignment[neighborId] === color) {
        return { safe: false, conflict: neighborId };
      }
    }
    return { safe: true };
  }

  // Backtracking solver as a generator
  function* solve(vertexIndex: number): Generator<AlgorithmStep<GraphColoringState>, boolean> {
    if (vertexIndex >= sortedIds.length) {
      return true;
    }

    const vertexId = sortedIds[vertexIndex];
    const vertexLabel = `V${parseInt(vertexId) + 1}`;
    nodesExplored++;

    yield makeStep(
      `Considering Vertex ${vertexLabel}`,
      `Attempting to assign a valid color to vertex ${vertexLabel} (vertex ${vertexIndex + 1} of ${sortedIds.length}).`,
      2,
      `Trying colors 1..${k} for ${vertexLabel}`,
      vertexId
    );

    for (let c = 1; c <= k; c++) {
      const colorName = COLOR_NAMES[c] || `Color${c}`;
      const safeCheck = isSafe(vertexId, c);

      if (!safeCheck.safe) {
        const conflictLabel = `V${parseInt(safeCheck.conflict!) + 1}`;
        yield makeStep(
          `Conflict: ${vertexLabel} ← ${colorName}`,
          `Color ${colorName} (${c}) conflicts with adjacent vertex ${conflictLabel} which already has ${colorName}. Trying next color.`,
          3,
          `${vertexLabel} ← ${colorName} CONFLICTS with ${conflictLabel}`,
          vertexId,
          c,
          safeCheck.conflict
        );
        continue;
      }

      // Assign color
      colorAssignment[vertexId] = c;

      yield makeStep(
        `Assign: ${vertexLabel} ← ${colorName}`,
        `Color ${colorName} (${c}) is safe for vertex ${vertexLabel}. No adjacent vertex has this color. Proceeding to next vertex.`,
        4,
        `${vertexLabel} = ${colorName} ✓`,
        vertexId,
        c
      );

      const result = yield* solve(vertexIndex + 1);
      if (result) return true;

      // Backtrack: uncolor
      colorAssignment[vertexId] = 0;
      backtracks++;

      yield makeStep(
        `Backtrack: Uncolor ${vertexLabel}`,
        `Backtracking from vertex ${vertexLabel}. Removing color ${colorName} (${c}) and trying the next color.`,
        5,
        `Backtrack: ${vertexLabel} uncolored (was ${colorName})`,
        vertexId
      );
    }

    // No valid color found for this vertex
    return false;
  }

  const hasSolution = yield* solve(0);

  if (hasSolution) {
    const colorSummary = sortedIds
      .map((id) => `V${parseInt(id) + 1}=${COLOR_NAMES[colorAssignment[id]] || colorAssignment[id]}`)
      .join(', ');

    yield makeStep(
      `Valid ${k}-Coloring Found!`,
      `Successfully colored all ${nodes.length} vertices with ${k} colors. Assignment: ${colorSummary}.`,
      6,
      colorSummary,
      undefined,
      undefined,
      undefined,
      true,
      {
        solvable: true,
        numColors: k,
        assignment: { ...colorAssignment },
        colorSummary,
        nodesExplored,
        backtracks,
      }
    );
  } else {
    yield makeStep(
      `No Valid ${k}-Coloring Exists`,
      `Exhaustive backtracking search confirmed that the graph cannot be colored with ${k} colors without adjacent vertices sharing the same color.`,
      7,
      `Not ${k}-colorable`,
      undefined,
      undefined,
      undefined,
      true,
      {
        solvable: false,
        numColors: k,
        assignment: {},
        nodesExplored,
        backtracks,
      }
    );
  }
}
