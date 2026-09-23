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
  findMode?: 'first' | 'all';
  allSolutions?: Array<Record<string, number>>;
  solutionCount?: number;
}

export const COLOR_NAMES = ['—', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Cyan', 'Pink'];

export const GRAPH_COLORING_PSEUDOCODE_FIRST = [
  'function GraphColoring(vertexIndex, colorAssignment, k):',
  '  if vertexIndex == |V|: return true  // Base case: all vertices validly colored',
  '  for c = 1 to k:  // Try each of the k available colors on vertex',
  '    if isSafe(vertexIndex, c, colorAssignment):  // Check neighbor conflict',
  '      colorAssignment[vertexIndex] = c  // Tentatively assign color c',
  '      if GraphColoring(vertexIndex + 1, colorAssignment, k): return true  // Recurse',
  '      colorAssignment[vertexIndex] = 0  // Backtrack: uncolor vertex on dead end',
  '  return false  // Exhausted all k colors without a valid configuration',
];

export const GRAPH_COLORING_PSEUDOCODE_ALL = [
  'function GraphColoringAll(vertexIndex, colorAssignment, k):',
  '  if vertexIndex == |V|: recordSolution(colorAssignment); return  // Valid coloring found',
  '  for c = 1 to k:  // Try each of the k available colors on vertex',
  '    if isSafe(vertexIndex, c, colorAssignment):  // Check neighbor conflict',
  '      colorAssignment[vertexIndex] = c  // Tentatively assign color c',
  '      GraphColoringAll(vertexIndex + 1, colorAssignment, k)  // Continue searching remaining colorings',
  '      colorAssignment[vertexIndex] = 0  // Backtrack: explore alternative colors for vertex',
  '  return allSolutions  // Return exhaustive set of all valid colorings',
];

export function* graphColoringSteps(inputs: {
  edgeList?: [string, string][];
  numColors?: number;
  numNodes?: number;
  findMode?: 'first' | 'all';
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
  const findMode = inputs.findMode || 'first';

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

  const allSolutions: Array<Record<string, number>> = [];

  const makeStep = (
    title: string,
    description: string,
    codeLine: number | number[],
    explanation: string,
    currentVertex?: string,
    currentColor?: number,
    conflictVertex?: string,
    isFinal = false,
    result?: any,
    callFlow?: { type: 'call' | 'return'; nodeId: string | number }
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
      callFlow,
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
        findMode,
        allSolutions: allSolutions.map((s) => ({ ...s })),
        solutionCount: allSolutions.length,
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
    `Graph has ${nodes.length} vertices and ${allEdges.length} edges. Search mode: ${
      findMode === 'all' ? 'FIND ALL VALID COLORINGS (exhaustive)' : 'FIND FIRST SOLUTION'
    }. Available colors k = ${k}: [${COLOR_NAMES.slice(1, k + 1).join(', ')}].`,
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
      if (findMode === 'all') {
        const solutionCopy = { ...colorAssignment };
        allSolutions.push(solutionCopy);
        const colorSummary = sortedIds
          .map((id) => `V${parseInt(id) + 1}=${COLOR_NAMES[solutionCopy[id]] || solutionCopy[id]}`)
          .join(', ');

        yield makeStep(
          `Valid Coloring #${allSolutions.length} Found!`,
          `Discovered valid coloring #${allSolutions.length}: ${colorSummary}. Recording solution and continuing search for all remaining valid colorings.`,
          2,
          `Solution #${allSolutions.length}: ${colorSummary}`,
          undefined,
          undefined,
          undefined,
          false,
          {
            currentSolution: solutionCopy,
            totalFoundSoFar: allSolutions.length,
          }
        );
        return false; // Force backtrack to find remaining solutions
      } else {
        return true;
      }
    }

    const vertexId = sortedIds[vertexIndex];
    const vertexLabel = `V${parseInt(vertexId) + 1}`;
    nodesExplored++;

    yield makeStep(
      `Considering Vertex ${vertexLabel}`,
      `Attempting to assign a valid color to vertex ${vertexLabel} (vertex ${vertexIndex + 1} of ${sortedIds.length}).`,
      3,
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
          4,
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
        findMode === 'all' ? [4, 5] : [4, 5, 6],
        `${vertexLabel} = ${colorName} ✓`,
        vertexId,
        c,
        undefined,
        false,
        undefined,
        { type: 'call', nodeId: vertexId }
      );

      const result = yield* solve(vertexIndex + 1);
      if (findMode === 'first' && result) return true;

      // Backtrack: uncolor
      colorAssignment[vertexId] = 0;
      backtracks++;

      yield makeStep(
        `Backtrack: Uncolor ${vertexLabel}`,
        `Backtracking from vertex ${vertexLabel}. Removing color ${colorName} (${c}) and trying the next color.`,
        7,
        `Backtrack: ${vertexLabel} uncolored (was ${colorName})`,
        vertexId,
        undefined,
        undefined,
        false,
        undefined,
        { type: 'return', nodeId: vertexId }
      );
    }

    // No valid color found for this vertex
    return false;
  }

  const hasSolution = yield* solve(0);

  if (findMode === 'all') {
    if (allSolutions.length > 0) {
      const solutionsSummary = allSolutions.map((sol, idx) => ({
        id: idx + 1,
        assignment: sol,
        summary: sortedIds
          .map((id) => `V${parseInt(id) + 1}=${COLOR_NAMES[sol[id]] || sol[id]}`)
          .join(', '),
      }));

      // Display first solution on graph for clean final state
      Object.assign(colorAssignment, allSolutions[0]);

      yield makeStep(
        `Exhaustive Search Complete: ${allSolutions.length} Valid Coloring(s) Found!`,
        `Successfully explored all branches and discovered ${allSolutions.length} distinct valid ${k}-coloring(s). View all assignments in the output pane below.`,
        8,
        `Total Valid Colorings: ${allSolutions.length}`,
        undefined,
        undefined,
        undefined,
        true,
        {
          solvable: true,
          numColors: k,
          findMode: 'all',
          numSolutions: allSolutions.length,
          allSolutions: allSolutions.map((s) => ({ ...s })),
          solutionsSummary,
          nodesExplored,
          backtracks,
        }
      );
    } else {
      yield makeStep(
        `No Valid ${k}-Coloring Exists`,
        `Exhaustive backtracking search confirmed that the graph cannot be colored with ${k} colors without adjacent vertices sharing the same color. Total valid colorings: 0.`,
        8,
        `Not ${k}-colorable (0 solutions)`,
        undefined,
        undefined,
        undefined,
        true,
        {
          solvable: false,
          numColors: k,
          findMode: 'all',
          numSolutions: 0,
          allSolutions: [],
          solutionsSummary: [],
          nodesExplored,
          backtracks,
        }
      );
    }
  } else {
    // findMode === 'first'
    if (hasSolution) {
      const colorSummary = sortedIds
        .map((id) => `V${parseInt(id) + 1}=${COLOR_NAMES[colorAssignment[id]] || colorAssignment[id]}`)
        .join(', ');

      yield makeStep(
        `Valid ${k}-Coloring Found!`,
        `Successfully colored all ${nodes.length} vertices with ${k} colors. Assignment: ${colorSummary}.`,
        2,
        colorSummary,
        undefined,
        undefined,
        undefined,
        true,
        {
          solvable: true,
          numColors: k,
          findMode: 'first',
          numSolutions: 1,
          assignment: { ...colorAssignment },
          allSolutions: [{ ...colorAssignment }],
          colorSummary,
          nodesExplored,
          backtracks,
        },
        sortedIds.length > 0 ? { type: 'return', nodeId: sortedIds[sortedIds.length - 1] } : undefined
      );
    } else {
      yield makeStep(
        `No Valid ${k}-Coloring Exists`,
        `Exhaustive backtracking search confirmed that the graph cannot be colored with ${k} colors without adjacent vertices sharing the same color.`,
        8,
        `Not ${k}-colorable`,
        undefined,
        undefined,
        undefined,
        true,
        {
          solvable: false,
          numColors: k,
          findMode: 'first',
          numSolutions: 0,
          assignment: {},
          allSolutions: [],
          nodesExplored,
          backtracks,
        }
      );
    }
  }
}
