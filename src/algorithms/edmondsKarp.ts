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
    description: `Same goal as Ford-Fulkerson: send as much flow as possible from ${nodes[s].label} to ${nodes[t].label}. Edmonds-Karp always uses the path with the fewest pipes, found by breadth-first search (BFS): explore the network in rings, closest vertices first. This choice guarantees it finishes quickly.`,
    codeLine: [1, 2],
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
        description: `Take ${nodes[u].label} from the front of the queue and look along every pipe out of it that still has room. ${(() => {
          const found = residual[u].map((room, v) => (room > 0 && !visited[v] ? nodes[v].label : null)).filter(Boolean);
          return found.length ? `Newly found: ${found.join(', ')} (added to the back of the queue).` : 'No new vertices are found from here.';
        })()} Still waiting in the queue: [${queue.map((idx) => nodes[idx].label).join(', ') || 'empty'}].`,
        codeLine: 3,
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
      description: `BFS reached the sink ${nodes[t].label}, so this is a path with the fewest pipes (${path.length - 1}). Its narrowest pipe has room for ${bottleneck}: that is the bottleneck.`,
      codeLine: [3, 4],
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
      description: `Push ${bottleneck} along ${pathLabelStr}, and add the same amount of backward room so it can be undone later if needed. Total flow is now ${totalFlow}.`,
      codeLine: [5, 6],
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
    description: `BFS can no longer reach ${nodes[t].label}: every route is blocked by a full pipe. The maximum flow is ${totalFlow}.`,
    codeLine: 7,
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
