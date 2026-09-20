import { AlgorithmStep } from '../types/algorithm';
import { GraphNode, GraphEdge } from './floydWarshall';

export interface EdmondsKarpState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: string;
  sink: string;
  bfsQueue: string[];
  bfsVisited: string[];
  currentBfsNode?: string;
  currentAugmentingPath?: string[];
  bottleneckCapacity?: number;
  totalMaxFlow: number;
  residualMatrix: number[][];
  flowMatrix: number[][];
  capacityMatrix: number[][];
  phase: 'bfs_explore' | 'path_found' | 'augment' | 'complete';
}

export function* edmondsKarpSteps(inputs: {
  capacities?: number[][];
  source?: number;
  sink?: number;
  nodeLabels?: string[];
}): Generator<AlgorithmStep<EdmondsKarpState>> {
  // Classic 6-node network (max flow = 23)
  const defaultCapacities = [
    [0, 16, 13, 0, 0, 0], // 0: Source (S)
    [0, 0, 10, 12, 0, 0], // 1: Node A
    [0, 4, 0, 0, 14, 0],  // 2: Node B
    [0, 0, 9, 0, 0, 20],  // 3: Node C
    [0, 0, 0, 7, 0, 4],   // 4: Node D
    [0, 0, 0, 0, 0, 0],   // 5: Sink (T)
  ];

  const cap = inputs.capacities || defaultCapacities;
  const n = cap.length;
  const s = inputs.source !== undefined ? inputs.source : 0;
  const t = inputs.sink !== undefined ? inputs.sink : n - 1;

  const defaultLabels = ['S', 'A', 'B', 'C', 'D', 'T'];
  const labels = inputs.nodeLabels || defaultLabels.slice(0, n);

  const nodes: GraphNode[] = Array.from({ length: n }, (_, i) => ({
    id: `${i}`,
    label: labels[i] || `Node ${i}`,
  }));

  // Flow and residual capacity matrices
  const flow: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const residual: number[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => cap[r][c])
  );

  function getEdges(): GraphEdge[] {
    const edgeList: GraphEdge[] = [];
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        if (cap[u][v] > 0) {
          edgeList.push({
            u: `${u}`,
            v: `${v}`,
            weight: cap[u][v],
            capacity: cap[u][v],
            flow: flow[u][v],
          });
        }
      }
    }
    return edgeList;
  }

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;
  let totalFlow = 0;

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Edmonds-Karp Network',
    description: `Initialized flow network with Source ${nodes[s].label} and Sink ${nodes[t].label}. Edmonds-Karp uses explicit Breadth-First Search (BFS) to always choose the shortest augmenting path (fewest edges) in residual graph G_f.`,
    codeLine: 1,
    state: {
      nodes,
      edges: getEdges(),
      source: `${s}`,
      sink: `${t}`,
      bfsQueue: [`${s}`],
      bfsVisited: [`${s}`],
      totalMaxFlow: 0,
      residualMatrix: residual.map((row) => [...row]),
      flowMatrix: flow.map((row) => [...row]),
      capacityMatrix: cap.map((row) => [...row]),
      phase: 'bfs_explore',
    },
    highlights: {
      activeNode: `${s}`,
    },
    metrics: { comparisons, iterations },
  };

  while (true) {
    iterations++;

    // Explicit BFS to find shortest path
    const visited = Array(n).fill(false);
    const parent = Array(n).fill(-1);
    const queue: number[] = [s];
    visited[s] = true;
    let pathFound = false;

    while (queue.length > 0) {
      const u = queue.shift()!;

      yield {
        stepIndex: stepIndex++,
        title: `BFS Frontier: Dequeue ${nodes[u].label}`,
        description: `BFS searching residual edges from ${nodes[u].label}. Queue: [${queue.map((idx) => nodes[idx].label).join(', ') || 'empty'}].`,
        codeLine: [2, 3],
        state: {
          nodes,
          edges: getEdges(),
          source: `${s}`,
          sink: `${t}`,
          bfsQueue: queue.map((idx) => `${idx}`),
          bfsVisited: visited.map((v, i) => (v ? `${i}` : null)).filter(Boolean) as string[],
          currentBfsNode: `${u}`,
          totalMaxFlow: totalFlow,
          residualMatrix: residual.map((row) => [...row]),
          flowMatrix: flow.map((row) => [...row]),
          capacityMatrix: cap.map((row) => [...row]),
          phase: 'bfs_explore',
        },
        highlights: {
          activeNode: `${u}`,
        },
        metrics: { comparisons, iterations },
      };

      for (let v = 0; v < n; v++) {
        comparisons++;
        if (!visited[v] && residual[u][v] > 0) {
          visited[v] = true;
          parent[v] = u;
          queue.push(v);

          if (v === t) {
            pathFound = true;
            break;
          }
        }
      }

      if (pathFound) break;
    }

    if (!pathFound) {
      // No augmenting path reaches sink
      break;
    }

    // Reconstruct shortest augmenting path
    const path: number[] = [];
    let curr = t;
    while (curr !== -1) {
      path.unshift(curr);
      curr = parent[curr];
    }

    const pathNodesStr = path.map((idx) => `${idx}`);
    const pathLabelStr = path.map((idx) => nodes[idx].label).join(' → ');

    // Calculate bottleneck capacity
    let bottleneck = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      bottleneck = Math.min(bottleneck, residual[u][v]);
    }

    yield {
      stepIndex: stepIndex++,
      title: `Shortest Augmenting Path Discovered: ${pathLabelStr}`,
      description: `BFS reached Sink ${nodes[t].label}. Shortest path length = ${path.length - 1} edges. Bottleneck residual capacity Δf = ${bottleneck}.`,
      codeLine: [4, 5],
      state: {
        nodes,
        edges: getEdges(),
        source: `${s}`,
        sink: `${t}`,
        bfsQueue: [],
        bfsVisited: pathNodesStr,
        currentAugmentingPath: pathNodesStr,
        bottleneckCapacity: bottleneck,
        totalMaxFlow: totalFlow,
        residualMatrix: residual.map((row) => [...row]),
        flowMatrix: flow.map((row) => [...row]),
        capacityMatrix: cap.map((row) => [...row]),
        phase: 'path_found',
      },
      highlights: {
        nodes: pathNodesStr,
        edges: path.slice(0, -1).map((u, i) => ({ u: `${u}`, v: `${path[i + 1]}`, status: 'active' as const })),
      },
      metrics: { comparisons, iterations },
    };

    // Augment flow along shortest path
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      flow[u][v] += bottleneck;
      flow[v][u] -= bottleneck;
      residual[u][v] -= bottleneck;
      residual[v][u] += bottleneck;
    }

    totalFlow += bottleneck;

    yield {
      stepIndex: stepIndex++,
      title: `Augment Residual Flow +${bottleneck} (Total Flow: ${totalFlow})`,
      description: `Pushed flow along shortest path ${pathLabelStr}. Total flow is now ${totalFlow}.`,
      codeLine: [6, 7, 8],
      state: {
        nodes,
        edges: getEdges(),
        source: `${s}`,
        sink: `${t}`,
        bfsQueue: [],
        bfsVisited: [],
        currentAugmentingPath: pathNodesStr,
        bottleneckCapacity: bottleneck,
        totalMaxFlow: totalFlow,
        residualMatrix: residual.map((row) => [...row]),
        flowMatrix: flow.map((row) => [...row]),
        capacityMatrix: cap.map((row) => [...row]),
        phase: 'augment',
      },
      highlights: {
        nodes: pathNodesStr,
        edges: path.slice(0, -1).map((u, i) => ({ u: `${u}`, v: `${path[i + 1]}`, status: 'flow' as const })),
      },
      metrics: { comparisons, iterations },
    };
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Edmonds-Karp Complete: Maximum Flow Found',
    description: `BFS cannot reach Sink ${nodes[t].label} in residual network G_f. Maximum flow value is ${totalFlow}. Time complexity is bounded by O(V · E²).`,
    codeLine: 9,
    state: {
      nodes,
      edges: getEdges(),
      source: `${s}`,
      sink: `${t}`,
      bfsQueue: [],
      bfsVisited: [],
      totalMaxFlow: totalFlow,
      residualMatrix: residual.map((row) => [...row]),
      flowMatrix: flow.map((row) => [...row]),
      capacityMatrix: cap.map((row) => [...row]),
      phase: 'complete',
    },
    highlights: {},
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      maxFlow: totalFlow,
      source: nodes[s].label,
      sink: nodes[t].label,
      edgesWithFlow: getEdges().filter((e) => (e.flow || 0) > 0),
    },
  };
}
