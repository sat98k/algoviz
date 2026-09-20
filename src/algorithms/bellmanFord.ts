import { AlgorithmStep } from '../types/algorithm';

interface GraphNode {
  id: string;
  label: string;
}

interface GraphEdge {
  u: string;
  v: string;
  weight: number;
}

export interface BellmanFordState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  distMatrix: (number | null)[][];
  nextMatrix: (number | null)[][];
  k: number;
  i: number;
  j: number;
}

export function* bellmanFordSteps(inputs: {
  numNodes?: number;
  edges?: GraphEdge[];
  source?: number;
}): Generator<AlgorithmStep<BellmanFordState>> {

  const n = inputs.numNodes || 5;

  const nodes: GraphNode[] = Array.from({ length: n }, (_, i) => ({
    id: `${i}`,
    label: `V${i + 1}`,
  }));

  const edges: GraphEdge[] = inputs.edges || [
    { u: "0", v: "1", weight: 6 },
    { u: "0", v: "2", weight: 7 },
    { u: "1", v: "3", weight: 5 },
    { u: "2", v: "3", weight: -3 },
  ];

  const source = inputs.source ?? 0;

  const dist: (number | null)[] = Array(n).fill(null);
  dist[source] = 0;

  const getMatrix = () =>
    nodes.map((_, i) =>
      nodes.map((_, j) =>
        i === j ? 0 : dist[j] !== null ? dist[j] : null
      )
    );

  let stepIndex = 0;

  yield {
    stepIndex: stepIndex++,
    title: "Initialize distances",
    description: "Source = 0, others = ∞",
    codeLine: 1,
    state: {
      nodes,
      edges,
      distMatrix: getMatrix(),
      nextMatrix: [], // ✅ REQUIRED
      k: -1,
      i: -1,
      j: -1,
    },
    highlights: {},
    metrics: {},
  };

  for (let k = 0; k < n - 1; k++) {
    for (const { u, v, weight } of edges) {
      const ui = Number(u);
      const vi = Number(v);

      if (dist[ui] !== null) {
        const newDist = dist[ui]! + weight;

        if (dist[vi] === null || newDist < dist[vi]!) {
          dist[vi] = newDist;

          yield {
            stepIndex: stepIndex++,
            title: `Relax V${ui + 1} → V${vi + 1}`,
            description: `Updated distance to ${newDist}`,
            codeLine: 2,
            state: {
              nodes,
              edges,
              distMatrix: getMatrix(),
              nextMatrix: [], // ✅ REQUIRED
              k,
              i: ui,
              j: vi,
            },
            highlights: {
              edges: [{ u, v, status: "active" }],
            },
            metrics: {},
          };
        }
      }
    }
  }

  yield {
    stepIndex: stepIndex++,
    title: "Complete",
    description: "Shortest paths computed",
    codeLine: 3,
    state: {
      nodes,
      edges,
      distMatrix: getMatrix(),
      nextMatrix: [], // ✅ REQUIRED
      k: n,
      i: -1,
      j: -1,
    },
    highlights: {},
    metrics: {},
    isFinal: true,
    result: dist,
  };
}