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
  '  if vertexIndex == |V|: return true  // every vertex is coloured: done',
  '  for c = 1 to k:  // try each colour in turn',
  '    if isSafe(vertexIndex, c, colorAssignment):  // does any neighbour already have colour c?',
  '      colorAssignment[vertexIndex] = c  // no: colour the vertex',
  '      if GraphColoring(vertexIndex + 1, colorAssignment, k): return true  // go on to the next vertex',
  '      colorAssignment[vertexIndex] = 0  // backtrack: a dead end further on, so remove the colour',
  '  return false  // no colour worked: go back to the previous vertex',
];

export const GRAPH_COLORING_PSEUDOCODE_ALL = [
  'function GraphColoringAll(vertexIndex, colorAssignment, k):',
  '  if vertexIndex == |V|: recordSolution(colorAssignment); return  // every vertex is coloured: save it, keep looking',
  '  for c = 1 to k:  // try each colour in turn',
  '    if isSafe(vertexIndex, c, colorAssignment):  // does any neighbour already have colour c?',
  '      colorAssignment[vertexIndex] = c  // no: colour the vertex',
  '      GraphColoringAll(vertexIndex + 1, colorAssignment, k)  // go on to the next vertex',
  '      colorAssignment[vertexIndex] = 0  // backtrack: remove the colour to try the others',
  '  return allSolutions  // every valid colouring found',
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
    `The graph has ${nodes.length} vertices and ${allEdges.length} edges, and we have k = ${k} colours: ${COLOR_NAMES.slice(1, k + 1).join(', ')}. We colour the vertices one at a time in order, trying the colours in order, and back up whenever a vertex has no safe colour. ${
      findMode === 'all' ? 'We keep going after each answer to find every valid colouring.' : 'We stop at the first valid colouring.'
    }`,
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
      `Next: vertex ${vertexLabel} (vertex ${vertexIndex + 1} of ${sortedIds.length}). Which colour is safe for it?`,
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
          `${colorName} is not allowed: its neighbour ${conflictLabel} is already ${colorName}. Try the next colour.`,
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
        `${colorName} is safe: no neighbour of ${vertexLabel} is ${colorName}. Colour it and move on to the next vertex.`,
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
        findMode === 'all'
          ? `All colorings that continue from ${vertexLabel} = ${colorName} have been explored. Remove ${colorName} from ${vertexLabel}${c < k ? ' and try its next color.' : '; it has no colors left, so the search backs up to the previous vertex.'}`
          : `The vertices after ${vertexLabel} could not all be colored, so ${vertexLabel}'s color ${colorName} is removed${c < k ? ' and its next color is tried.' : '. It has no colors left to try, so the search backs up to the previous vertex.'}`,
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
        `Every branch has been explored: there ${allSolutions.length === 1 ? 'is 1 valid colouring' : `are ${allSolutions.length} different valid colourings`} with ${k} colours (listed below the player).`,
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
        `Every possible way has been tried: ${k} colours are not enough, because some neighbours would always end up with the same colour. Total valid colourings: 0.`,
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
        `Done: all ${nodes.length} vertices are coloured with ${k} colours and no two neighbours match: ${colorSummary}.`,
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
        `Every possible way has been tried: ${k} colours are not enough, because some neighbours would always end up with the same colour.`,
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
