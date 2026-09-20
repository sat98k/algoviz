import { AlgorithmStep } from '../types/algorithm';

interface GraphNode {
  id: string;
  label: string;
}

interface GraphEdge {
  u: string;
  v: string;
  capacity: number;
  flow?: number;
}

export interface EdmondsKarpState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  distMatrix: (number | null)[][];
  nextMatrix: (number | null)[][];
  k: number;
  i: number;
  j: number;
}

export function* edmondsKarpSteps(inputs: {
  capacities?: number[][];
  source?: number;
  sink?: number;
}): Generator<AlgorithmStep<EdmondsKarpState>> {

  const cap = inputs.capacities || [
    [0, 10, 10, 0],
    [0, 0, 2, 8],
    [0, 0, 0, 9],
    [0, 0, 0, 0],
  ];

  const n = cap.length;
  const source = inputs.source ?? 0;
  const sink = inputs.sink ?? n - 1;

  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `${i}`,
    label: `V${i + 1}`,
  }));

  const edges: GraphEdge[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (cap[i][j] > 0) {
        edges.push({ u: `${i}`, v: `${j}`, capacity: cap[i][j], flow: 0 });
      }
    }
  }

  const residual = cap.map(row => [...row]);
  let maxFlow = 0;
  let stepIndex = 0;

  const getMatrix = () =>
    residual.map(row => row.map(v => (v === 0 ? null : v)));

  yield {
    stepIndex: stepIndex++,
    title: "Initialize",
    description: "Residual graph setup",
    codeLine: 1,
    state: {
      nodes,
      edges,
      distMatrix: getMatrix(),
      nextMatrix: [],
      k: -1,
      i: -1,
      j: -1,
    },
    highlights: {},
    metrics: {},
  };

  while (true) {
    const parent = Array(n).fill(-1);
    const visited = Array(n).fill(false);

    const queue = [source];
    visited[source] = true;

    while (queue.length) {
      const u = queue.shift()!;
      for (let v = 0; v < n; v++) {
        if (!visited[v] && residual[u][v] > 0) {
          queue.push(v);
          parent[v] = u;
          visited[v] = true;
        }
      }
    }

    if (!visited[sink]) break;

    let flow = Infinity;
    for (let v = sink; v !== source; v = parent[v]) {
      const u = parent[v];
      flow = Math.min(flow, residual[u][v]);
    }

    for (let v = sink; v !== source; v = parent[v]) {
      const u = parent[v];
      residual[u][v] -= flow;
      residual[v][u] += flow;
    }

    maxFlow += flow;

    yield {
      stepIndex: stepIndex++,
      title: "Augment Flow",
      description: `Added flow = ${flow}`,
      codeLine: 2,
      state: {
        nodes,
        edges,
        distMatrix: getMatrix(),
        nextMatrix: [],
        k: -1,
        i: source,
        j: sink,
      },
      highlights: {},
      metrics: {},
    };
  }

  yield {
    stepIndex: stepIndex++,
    title: "Max Flow Complete",
    description: `Max Flow = ${maxFlow}`,
    codeLine: 3,
    state: {
      nodes,
      edges,
      distMatrix: getMatrix(),
      nextMatrix: [],
      k: -1,
      i: source,
      j: sink,
    },
    highlights: {},
    metrics: {},
    isFinal: true,
    result: maxFlow,
  };
}