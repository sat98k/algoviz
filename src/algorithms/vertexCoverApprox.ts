import { AlgorithmStep } from '../types/algorithm';
import { GraphNode, GraphEdge } from './floydWarshall';

export interface VertexCoverState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  uncoveredEdges: GraphEdge[];
  coveredVertices: string[];
  pickedMatchingEdges: GraphEdge[];
  currentPickedEdge?: GraphEdge;
  removedIncidentEdges?: GraphEdge[];
}

export function* vertexCoverApproxSteps(inputs: {
  numNodes?: number;
  edgeList?: [string, string][];
}): Generator<AlgorithmStep<VertexCoverState>> {
  const defaultEdges: [string, string][] = [
    ['0', '1'],
    ['1', '2'],
    ['1', '3'],
    ['2', '4'],
    ['3', '4'],
    ['3', '5'],
    ['4', '5'],
    ['5', '6'],
  ];

  const rawEdges = inputs.edgeList || defaultEdges;
  const nodeSet = new Set<string>();
  for (const [u, v] of rawEdges) {
    nodeSet.add(u);
    nodeSet.add(v);
  }

  const nodes: GraphNode[] = Array.from(nodeSet).map((id) => ({
    id,
    label: `V${parseInt(id) + 1}`,
  }));

  const allEdges: GraphEdge[] = rawEdges.map(([u, v]) => ({
    u,
    v,
    weight: 1,
  }));

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  const coveredVertices = new Set<string>();
  const pickedMatchingEdges: GraphEdge[] = [];
  let uncoveredEdges = [...allEdges];

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize 2-Approximation for Vertex Cover',
    description: `${nodes.length} vertices and ${allEdges.length} edges. Goal: choose vertices so that every edge touches a chosen one. No vertex is chosen yet.`,
    codeLine: 2,
    state: {
      nodes,
      edges: allEdges,
      uncoveredEdges: [...uncoveredEdges],
      coveredVertices: [],
      pickedMatchingEdges: [],
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  while (uncoveredEdges.length > 0) {
    iterations++;
    // Step 1: Pick an arbitrary uncovered edge (u, v)
    const pickedEdge = uncoveredEdges[0];
    pickedMatchingEdges.push(pickedEdge);

    const uLabel = nodes.find((n) => n.id === pickedEdge.u)?.label || pickedEdge.u;
    const vLabel = nodes.find((n) => n.id === pickedEdge.v)?.label || pickedEdge.v;

    yield {
      stepIndex: stepIndex++,
      title: `Pick Arbitrary Uncovered Edge (${uLabel}, ${vLabel})`,
      description: `Pick an edge that nothing covers yet: (${uLabel}, ${vLabel}).`,
      codeLine: [3, 4],
      state: {
        nodes,
        edges: allEdges,
        uncoveredEdges: [...uncoveredEdges],
        coveredVertices: Array.from(coveredVertices),
        pickedMatchingEdges: [...pickedMatchingEdges],
        currentPickedEdge: pickedEdge,
      },
      highlights: {
        edges: [{ u: pickedEdge.u, v: pickedEdge.v, status: 'active' }],
      },
      metrics: { comparisons, iterations },
    };

    // Step 2: Add both u and v to cover C
    coveredVertices.add(pickedEdge.u);
    coveredVertices.add(pickedEdge.v);

    yield {
      stepIndex: stepIndex++,
      title: `Add Endpoints {${uLabel}, ${vLabel}} to Cover C`,
      description: `Choose both ends, ${uLabel} and ${vLabel}. We do not know which one the best answer uses, but it must use at least one, so taking both at most doubles the count. Chosen so far: ${coveredVertices.size}.`,
      codeLine: 5,
      state: {
        nodes,
        edges: allEdges,
        uncoveredEdges: [...uncoveredEdges],
        coveredVertices: Array.from(coveredVertices),
        pickedMatchingEdges: [...pickedMatchingEdges],
        currentPickedEdge: pickedEdge,
      },
      highlights: {
        nodes: [pickedEdge.u, pickedEdge.v],
        edges: [{ u: pickedEdge.u, v: pickedEdge.v, status: 'cover' }],
      },
      metrics: { comparisons, iterations },
    };

    // Step 3: Remove all edges incident to u or v
    const removed: GraphEdge[] = [];
    uncoveredEdges = uncoveredEdges.filter((edge) => {
      comparisons++;
      const isIncident =
        edge.u === pickedEdge.u ||
        edge.u === pickedEdge.v ||
        edge.v === pickedEdge.u ||
        edge.v === pickedEdge.v;
      if (isIncident) {
        removed.push(edge);
        return false;
      }
      return true;
    });

    yield {
      stepIndex: stepIndex++,
      title: `Remove ${removed.length} Incident Edges from E'`,
      description: `Every edge touching ${uLabel} or ${vLabel} is now covered. ${uncoveredEdges.length} edge${uncoveredEdges.length === 1 ? '' : 's'} still uncovered.`,
      codeLine: 6,
      state: {
        nodes,
        edges: allEdges,
        uncoveredEdges: [...uncoveredEdges],
        coveredVertices: Array.from(coveredVertices),
        pickedMatchingEdges: [...pickedMatchingEdges],
        removedIncidentEdges: removed,
      },
      highlights: {
        nodes: Array.from(coveredVertices),
      },
      metrics: { comparisons, iterations },
    };
  }

  const finalCoverList = Array.from(coveredVertices);
  const finalCoverLabels = finalCoverList
    .map((id) => nodes.find((n) => n.id === id)?.label || id)
    .sort();

  yield {
    stepIndex: stepIndex++,
    title: 'Vertex Cover 2-Approximation Complete',
    description: `Done: {${finalCoverLabels.join(', ')}} covers every edge (${finalCoverList.length} vertices). We picked ${pickedMatchingEdges.length} edges that share no ends, and any answer needs a vertex for each of them, so the best possible uses at least ${pickedMatchingEdges.length}. Ours uses at most twice that: |C| ≤ 2 × OPT.`,
    codeLine: 7,
    state: {
      nodes,
      edges: allEdges,
      uncoveredEdges: [],
      coveredVertices: finalCoverList,
      pickedMatchingEdges,
    },
    highlights: {
      nodes: finalCoverList,
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      coverSize: finalCoverList.length,
      coverVertices: finalCoverLabels,
      matchingSize: pickedMatchingEdges.length,
      approxRatioGuarantee: '≤ 2.0 × OPT',
      isCoverValid: true,
    },
  };
}
