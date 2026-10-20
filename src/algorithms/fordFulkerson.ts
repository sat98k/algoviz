import { AlgorithmStep } from '../types/algorithm';
import { GraphNode, GraphEdge } from './floydWarshall';

export interface FordFulkersonState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: string;
  sink: string;
  currentAugmentingPath?: string[];
  bottleneckCapacity?: number;
  totalMaxFlow: number;
  residualMatrix: number[][];
  flowMatrix: number[][];
  capacityMatrix: number[][];
  phase: 'bfs' | 'augment' | 'complete';
}

export function* fordFulkersonSteps(inputs: {
  capacities?: number[][];
  source?: number;
  sink?: number;
  nodeLabels?: string[];
}): Generator<AlgorithmStep<FordFulkersonState>> {
  // Default 6-node flow network
  const defaultCapacities = [
    [0, 16, 13, 0, 0, 0], // 0: Source (s)
    [0, 0, 10, 12, 0, 0], // 1: Node A
    [0, 4, 0, 0, 14, 0],  // 2: Node B
    [0, 0, 9, 0, 0, 20],  // 3: Node C
    [0, 0, 0, 7, 0, 4],   // 4: Node D
    [0, 0, 0, 0, 0, 0],   // 5: Sink (t)
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
    title: 'Initialize Flow Network',
    description: `Flow starts at the source ${nodes[s].label} and must reach the sink ${nodes[t].label}. Each pipe (edge) carries at most its capacity, and every flow starts at 0. Plan: keep finding a path from ${nodes[s].label} to ${nodes[t].label} that still has room, and push as much as it can carry.`,
    codeLine: 2,
    state: {
      nodes,
      edges: getEdges(),
      source: `${s}`,
      sink: `${t}`,
      totalMaxFlow: 0,
      residualMatrix: residual.map((row) => [...row]),
      flowMatrix: flow.map((row) => [...row]),
      capacityMatrix: cap.map((row) => [...row]),
      phase: 'bfs',
    },
    highlights: {
      activeNode: `${s}`,
    },
    metrics: { comparisons, iterations },
  };

  // Edmonds-Karp BFS subroutine
  function bfsFindAugmentingPath(): number[] | null {
    const visited = Array(n).fill(false);
    const parent = Array(n).fill(-1);
    const queue: number[] = [s];
    visited[s] = true;

    while (queue.length > 0) {
      const u = queue.shift()!;

      for (let v = 0; v < n; v++) {
        comparisons++;
        if (!visited[v] && residual[u][v] > 0) {
          visited[v] = true;
          parent[v] = u;
          queue.push(v);
          if (v === t) {
            // Reconstruct path
            const path: number[] = [];
            let curr = t;
            while (curr !== -1) {
              path.unshift(curr);
              curr = parent[curr];
            }
            return path;
          }
        }
      }
    }
    return null;
  }

  while (true) {
    iterations++;
    const path = bfsFindAugmentingPath();

    if (!path) {
      // No more augmenting paths
      break;
    }

    const pathNodesStr = path.map((idx) => `${idx}`);
    const pathLabelStr = path.map((idx) => nodes[idx].label).join(' → ');

    // Find bottleneck capacity
    let bottleneck = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      bottleneck = Math.min(bottleneck, residual[u][v]);
    }

    yield {
      stepIndex: stepIndex++,
      title: `Augmenting Path Found: ${pathLabelStr}`,
      description: `Found a path from ${nodes[s].label} to ${nodes[t].label} where every pipe still has room (an augmenting path). A path can only carry as much as its narrowest pipe, so its bottleneck is ${bottleneck}.`,
      codeLine: [3, 4],
      state: {
        nodes,
        edges: getEdges(),
        source: `${s}`,
        sink: `${t}`,
        currentAugmentingPath: pathNodesStr,
        bottleneckCapacity: bottleneck,
        totalMaxFlow: totalFlow,
        residualMatrix: residual.map((row) => [...row]),
        flowMatrix: flow.map((row) => [...row]),
        capacityMatrix: cap.map((row) => [...row]),
        phase: 'bfs',
      },
      highlights: {
        nodes: pathNodesStr,
        edges: path.slice(0, -1).map((u, i) => ({ u: `${u}`, v: `${path[i + 1]}`, status: 'active' as const })),
      },
      metrics: { comparisons, iterations },
    };

    // Augment flow
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
      title: `Augmented Flow by +${bottleneck} (Total Flow: ${totalFlow})`,
      description: `Push ${bottleneck} more along ${pathLabelStr}: each pipe on it now has ${bottleneck} less room. We also note that this flow could be sent back later (a backward edge), so a later path may undo it if that helps. Total flow: ${totalFlow}.`,
      codeLine: [5, 6, 7, 8],
      state: {
        nodes,
        edges: getEdges(),
        source: `${s}`,
        sink: `${t}`,
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
    title: 'Ford-Fulkerson Complete',
    description: `No path from ${nodes[s].label} to ${nodes[t].label} has room left: every route is blocked by at least one full pipe. The flow cannot grow any more, so the maximum flow is ${totalFlow}.`,
    codeLine: 9,
    state: {
      nodes,
      edges: getEdges(),
      source: `${s}`,
      sink: `${t}`,
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
