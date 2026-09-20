import { AlgorithmStep } from '../types/algorithm';
import { GraphNode, GraphEdge } from './floydWarshall';

export interface PushRelabelState {
  isPushRelabel: true;
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: string;
  sink: string;
  heights: Record<string, number>;
  excess: Record<string, number>;
  flowMatrix: number[][];
  capacityMatrix: number[][];
  residualMatrix: number[][];
  overflowingNodes: string[];
  activeOperation?: string;
  currentVertex?: string;
  targetVertex?: string;
  currentFlowToSink: number;
  phase: 'init' | 'push' | 'relabel' | 'complete';
}

export function* pushRelabelSteps(inputs: {
  capacities?: number[][];
  source?: number;
  sink?: number;
  nodeLabels?: string[];
}): Generator<AlgorithmStep<PushRelabelState>> {
  // Classic 6-node network (same as Ford-Fulkerson & Edmonds-Karp, max flow = 23)
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

  const flow: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const heights: number[] = Array(n).fill(0);
  const excess: number[] = Array(n).fill(0);

  // Height of source is fixed at |V|
  heights[s] = n;

  function getResidualMatrix(): number[][] {
    const res: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        res[u][v] = cap[u][v] - flow[u][v];
      }
    }
    return res;
  }

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
            flow: Math.max(0, flow[u][v]),
          });
        }
      }
    }
    return edgeList;
  }

  const getHeightsRecord = (): Record<string, number> => {
    const rec: Record<string, number> = {};
    for (let i = 0; i < n; i++) rec[`${i}`] = heights[i];
    return rec;
  };

  const getExcessRecord = (): Record<string, number> => {
    const rec: Record<string, number> = {};
    for (let i = 0; i < n; i++) rec[`${i}`] = excess[i];
    return rec;
  };

  const getOverflowingNodes = (): string[] => {
    const res: string[] = [];
    for (let i = 0; i < n; i++) {
      if (i !== s && i !== t && excess[i] > 0) {
        res.push(`${i}`);
      }
    }
    return res;
  };

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  // Step 0: Initial state before preflow
  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Push-Relabel Algorithm',
    description: `Initialized flow network with Source ${nodes[s].label} (h = ${n}) and Sink ${nodes[t].label} (h = 0). All other vertex heights set to 0. All initial flows set to 0.`,
    codeLine: 1,
    state: {
      isPushRelabel: true,
      nodes,
      edges: getEdges(),
      source: `${s}`,
      sink: `${t}`,
      heights: getHeightsRecord(),
      excess: getExcessRecord(),
      flowMatrix: flow.map((r) => [...r]),
      capacityMatrix: cap.map((r) => [...r]),
      residualMatrix: getResidualMatrix(),
      overflowingNodes: [],
      currentFlowToSink: 0,
      phase: 'init',
    },
    highlights: {
      activeNode: `${s}`,
    },
    metrics: { comparisons, iterations },
  };

  // Step 1: Initialize preflow (saturate all outgoing edges from source s)
  for (let v = 0; v < n; v++) {
    if (cap[s][v] > 0) {
      const initPush = cap[s][v];
      flow[s][v] = initPush;
      flow[v][s] = -initPush;
      excess[v] += initPush;
      excess[s] -= initPush;
    }
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Preflow: Saturate All Outgoing Edges from Source',
    description: `Saturated all edges out of Source ${nodes[s].label}. Neighboring vertices received excess flow. Overflowing vertices: [${getOverflowingNodes().map((id) => nodes[parseInt(id)].label).join(', ')}].`,
    codeLine: [2, 3],
    state: {
      isPushRelabel: true,
      nodes,
      edges: getEdges(),
      source: `${s}`,
      sink: `${t}`,
      heights: getHeightsRecord(),
      excess: getExcessRecord(),
      flowMatrix: flow.map((r) => [...r]),
      capacityMatrix: cap.map((r) => [...r]),
      residualMatrix: getResidualMatrix(),
      overflowingNodes: getOverflowingNodes(),
      currentFlowToSink: excess[t],
      phase: 'init',
    },
    highlights: {
      activeNode: `${s}`,
      nodes: getOverflowingNodes(),
    },
    metrics: { comparisons, iterations },
  };

  // Main Push-Relabel Loop
  while (true) {
    iterations++;
    const overflowing = getOverflowingNodes();
    if (overflowing.length === 0) break;

    // Pick first overflowing vertex u
    const u = parseInt(overflowing[0]);
    const resMatrix = getResidualMatrix();

    // Look for an admissible push edge (u, v) such that resMatrix[u][v] > 0 and heights[u] === heights[v] + 1
    let pushTarget = -1;
    for (let v = 0; v < n; v++) {
      comparisons++;
      if (resMatrix[u][v] > 0 && heights[u] === heights[v] + 1) {
        pushTarget = v;
        break;
      }
    }

    if (pushTarget !== -1) {
      // PUSH operation
      const v = pushTarget;
      const delta = Math.min(excess[u], resMatrix[u][v]);

      flow[u][v] += delta;
      flow[v][u] -= delta;
      excess[u] -= delta;
      excess[v] += delta;

      yield {
        stepIndex: stepIndex++,
        title: `PUSH: ${nodes[u].label} ➔ ${nodes[v].label} (Amount Δ = ${delta})`,
        description: `Pushed Δ = min(e(${nodes[u].label})=${excess[u] + delta}, c_f(${nodes[u].label},${nodes[v].label})=${resMatrix[u][v]}) = ${delta} units from ${nodes[u].label} (h=${heights[u]}) down to ${nodes[v].label} (h=${heights[v]}).`,
        codeLine: [4, 5],
        state: {
          isPushRelabel: true,
          nodes,
          edges: getEdges(),
          source: `${s}`,
          sink: `${t}`,
          heights: getHeightsRecord(),
          excess: getExcessRecord(),
          flowMatrix: flow.map((r) => [...r]),
          capacityMatrix: cap.map((r) => [...r]),
          residualMatrix: getResidualMatrix(),
          overflowingNodes: getOverflowingNodes(),
          activeOperation: `PUSH (${nodes[u].label} ➔ ${nodes[v].label})`,
          currentVertex: `${u}`,
          targetVertex: `${v}`,
          currentFlowToSink: excess[t],
          phase: 'push',
        },
        highlights: {
          activeNode: `${u}`,
          nodes: [`${u}`, `${v}`],
          edges: [{ u: `${u}`, v: `${v}`, status: 'flow' }],
        },
        metrics: { comparisons, iterations },
      };
    } else {
      // RELABEL operation
      let minResidualNeighborHeight = Infinity;
      for (let v = 0; v < n; v++) {
        comparisons++;
        if (resMatrix[u][v] > 0) {
          minResidualNeighborHeight = Math.min(minResidualNeighborHeight, heights[v]);
        }
      }

      const oldH = heights[u];
      heights[u] = 1 + minResidualNeighborHeight;

      yield {
        stepIndex: stepIndex++,
        title: `RELABEL: Increase Height of ${nodes[u].label} from ${oldH} to ${heights[u]}`,
        description: `No downward residual edge exists from overflowing vertex ${nodes[u].label} (e = ${excess[u]}). Relabeled h(${nodes[u].label}) = 1 + min{h(v) | c_f(${nodes[u].label},v) > 0} = 1 + ${minResidualNeighborHeight} = ${heights[u]}.`,
        codeLine: [6, 7],
        state: {
          isPushRelabel: true,
          nodes,
          edges: getEdges(),
          source: `${s}`,
          sink: `${t}`,
          heights: getHeightsRecord(),
          excess: getExcessRecord(),
          flowMatrix: flow.map((r) => [...r]),
          capacityMatrix: cap.map((r) => [...r]),
          residualMatrix: getResidualMatrix(),
          overflowingNodes: getOverflowingNodes(),
          activeOperation: `RELABEL (${nodes[u].label})`,
          currentVertex: `${u}`,
          currentFlowToSink: excess[t],
          phase: 'relabel',
        },
        highlights: {
          activeNode: `${u}`,
        },
        metrics: { comparisons, iterations },
      };
    }
  }

  const finalMaxFlow = excess[t];

  yield {
    stepIndex: stepIndex++,
    title: `Push-Relabel Complete: Maximum Flow = ${finalMaxFlow}`,
    description: `No overflowing internal vertices remain (e(v) = 0 for all v not in {S, T}). Preflow has successfully converted to maximum feasible flow. Total flow arriving at Sink ${nodes[t].label} is ${finalMaxFlow}.`,
    codeLine: 8,
    state: {
      isPushRelabel: true,
      nodes,
      edges: getEdges(),
      source: `${s}`,
      sink: `${t}`,
      heights: getHeightsRecord(),
      excess: getExcessRecord(),
      flowMatrix: flow.map((r) => [...r]),
      capacityMatrix: cap.map((r) => [...r]),
      residualMatrix: getResidualMatrix(),
      overflowingNodes: [],
      currentFlowToSink: finalMaxFlow,
      phase: 'complete',
    },
    highlights: {
      activeNode: `${t}`,
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      maxFlow: finalMaxFlow,
      source: nodes[s].label,
      sink: nodes[t].label,
      edgesWithFlow: getEdges().filter((e) => (e.flow || 0) > 0),
      totalPushRelabelSteps: iterations,
    },
  };
}
