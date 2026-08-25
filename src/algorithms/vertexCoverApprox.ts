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
    description: `Loaded graph with ${nodes.length} vertices and ${allEdges.length} edges. Initialized empty cover C = {}.`,
    codeLine: 1,
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
      description: `Selected edge (${uLabel}, ${vLabel}) from remaining uncovered set E'.`,
      codeLine: 2,
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
      description: `Added both endpoints of edge (${uLabel}, ${vLabel}) into the vertex cover set C. Cover size is now ${coveredVertices.size}.`,
      codeLine: 3,
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
      description: `Removed all edges touching ${uLabel} or ${vLabel} since they are now covered. Remaining uncovered edges: ${uncoveredEdges.length}.`,
      codeLine: 4,
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
    description: `Found valid vertex cover of size ${finalCoverList.length}: {${finalCoverLabels.join(', ')}}. Lower bound OPT >= ${pickedMatchingEdges.length} (size of maximal matching), proving |C| <= 2 * OPT.`,
    codeLine: 5,
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
