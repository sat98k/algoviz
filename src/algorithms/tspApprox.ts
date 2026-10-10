import { AlgorithmStep } from '../types/algorithm';
import { TspCity, CandidateEdge } from './tsp';

export interface TspApproxState {
  isApprox: true;
  numCities: number;
  cities: TspCity[];
  costMatrix: number[][];
  currentPhase: 'init' | 'mst' | 'double' | 'shortcut' | 'complete';
  currentCity: number;
  currentMask: number; // bitmask of cities currently in MST or visited
  candidateEdges: CandidateEdge[];
  activeTourEdges: { u: number; v: number }[];
  mstEdges: { u: number; v: number; weight: number }[];
  mstWeight: number;
  doubledEdges: { u: number; v: number; weight: number }[];
  dfsOrder: number[];
  optimalTour?: number[];
  optimalCost?: number;
  calculationFormula?: string;
  explanation?: string;
  metricCheck: MetricCheck;
}

export interface MetricCheck {
  /** Symmetric and satisfies the triangle inequality, so the 2x guarantee applies. */
  isMetric: boolean;
  isSymmetric: boolean;
  /** The largest triangle-inequality violation: cost(i,j) > cost(i,k) + cost(k,j). */
  violation?: { i: number; j: number; k: number; direct: number; detour: number };
  /** First pair with cost(i,j) != cost(j,i). */
  asymmetry?: { i: number; j: number };
}

/** Checks the assumptions the 2-approximation guarantee depends on. */
export function checkMetric(cost: number[][]): MetricCheck {
  const n = cost.length;
  let asymmetry: MetricCheck['asymmetry'];
  let violation: MetricCheck['violation'];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!asymmetry && cost[i][j] !== cost[j][i]) asymmetry = { i, j };
      if (i === j) continue;
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        const detour = cost[i][k] + cost[k][j];
        if (cost[i][j] > detour && (!violation || cost[i][j] - detour > violation.direct - violation.detour)) {
          violation = { i, j, k, direct: cost[i][j], detour };
        }
      }
    }
  }
  return { isMetric: !asymmetry && !violation, isSymmetric: !asymmetry, violation, asymmetry };
}

/** The relation that actually holds between a and b, so no displayed inequality is ever false. */
const relation = (a: number, b: number) => (a <= b ? '≤' : '>');

export function* tspApproxSteps(inputs: {
  numCities?: number;
  costMatrix?: number[][];
  cityNames?: string[];
}): Generator<AlgorithmStep<TspApproxState>> {
  // Default: corners of a 30 x 40 rectangle (Euclidean, so metric). OPT = 140.
  const defaultCostMatrix = [
    [0, 30, 50, 40],
    [30, 0, 40, 50],
    [50, 40, 0, 30],
    [40, 50, 30, 0],
  ];

  const cost = inputs.costMatrix && inputs.costMatrix.length >= 3 ? inputs.costMatrix : defaultCostMatrix;
  const n = cost.length;

  const defaultCityNames = ['A', 'B', 'C', 'D', 'E', 'F'];
  const names = inputs.cityNames || defaultCityNames.slice(0, n);

  // Compute circular layout coordinates for cities
  const svgWidth = 560;
  const svgHeight = 360;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = Math.min(centerX, centerY) - 50;

  const cities: TspCity[] = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      id: i,
      label: names[i] || `C${i + 1}`,
      name: `City ${names[i] || i + 1}`,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  const metricCheck = checkMetric(cost);
  const label = (i: number) => cities[i].label;
  const v = metricCheck.violation;
  const nonMetricReason = !metricCheck.isSymmetric && metricCheck.asymmetry
    ? `cost(${label(metricCheck.asymmetry.i)}, ${label(metricCheck.asymmetry.j)}) ≠ cost(${label(metricCheck.asymmetry.j)}, ${label(metricCheck.asymmetry.i)}), so the costs are not symmetric`
    : v
    ? `cost(${label(v.i)}, ${label(v.j)}) = ${v.direct} > cost(${label(v.i)}, ${label(v.k)}) + cost(${label(v.k)}, ${label(v.j)}) = ${v.detour}, which violates the triangle inequality`
    : '';
  const assumptionText = metricCheck.isMetric
    ? 'These costs are metric (symmetric and satisfy the triangle inequality), so the tour is guaranteed to cost at most 2 × OPT.'
    : `Warning: ${nonMetricReason}. The 2 × OPT guarantee only holds for metric costs, so this run builds a tour but promises nothing about its quality.`;

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize TSP 2-Approximation (MST-Doubling)',
    description: `Loaded ${n} cities. Procedure: (1) build a minimum spanning tree with Prim’s algorithm; (2) double every MST edge to form an Eulerian multigraph; (3) walk the tree in DFS preorder, skipping cities already visited. ${assumptionText}`,
    codeLine: 1,
    state: {
      isApprox: true,
      metricCheck,
      numCities: n,
      cities,
      costMatrix: cost,
      currentPhase: 'init',
      currentCity: 0,
      currentMask: 1,
      candidateEdges: [],
      activeTourEdges: [],
      mstEdges: [],
      mstWeight: 0,
      doubledEdges: [],
      dfsOrder: [],
      explanation: 'Starting with empty Minimum Spanning Tree rooted at City ' + cities[0].label,
    },
    highlights: {
      activeNode: 0,
    },
    metrics: { comparisons, iterations },
  };

  // ==========================================
  // PHASE 1: Build Minimum Spanning Tree (Prim's)
  // ==========================================
  const inMst = new Set<number>([0]);
  let mask = 1;
  const mstEdges: { u: number; v: number; weight: number }[] = [];
  let totalMstWeight = 0;

  while (inMst.size < n) {
    iterations++;
    let bestU = -1;
    let bestV = -1;
    let minWeight = Infinity;
    const candidates: CandidateEdge[] = [];

    // Find lightest cut edge between inMst and outside
    for (const u of inMst) {
      for (let v = 0; v < n; v++) {
        if (!inMst.has(v)) {
          comparisons++;
          const edgeWeight = cost[u][v];
          candidates.push({
            u,
            v,
            subCost: 0,
            edgeCost: edgeWeight,
            totalCost: edgeWeight,
            isChosen: false,
          });

          if (edgeWeight < minWeight) {
            minWeight = edgeWeight;
            bestU = u;
            bestV = v;
          }
        }
      }
    }

    if (bestU === -1) break;

    // Mark best candidate as chosen
    for (const c of candidates) {
      if ((c.u === bestU && c.v === bestV) || (c.u === bestV && c.v === bestU)) {
        c.isChosen = true;
      }
    }

    yield {
      stepIndex: stepIndex++,
      title: `MST Cut Evaluation: Evaluate Edges from {${Array.from(inMst).map((i) => cities[i].label).join(', ')}}`,
      description: `Searching cut edges to unvisited cities. Lightest edge found is (${cities[bestU].label}, ${cities[bestV].label}) with weight ${minWeight}.`,
      codeLine: [2, 3],
      state: {
        isApprox: true,
        metricCheck,
        numCities: n,
        cities,
        costMatrix: cost,
        currentPhase: 'mst',
        currentCity: bestV,
        currentMask: mask,
        candidateEdges: candidates,
        activeTourEdges: mstEdges.map((e) => ({ u: e.u, v: e.v })),
        mstEdges: [...mstEdges],
        mstWeight: totalMstWeight,
        doubledEdges: [],
        dfsOrder: [],
        calculationFormula: `min_{(u in MST, v not in MST)} cost(u, v) = cost(${cities[bestU].label}, ${cities[bestV].label}) = ${minWeight}`,
        explanation: `Picked min cut edge (${cities[bestU].label}, ${cities[bestV].label}) of weight ${minWeight}`,
      },
      highlights: {
        activeNode: bestV,
        edges: [{ u: `${bestU}`, v: `${bestV}`, status: 'active' }],
      },
      metrics: { comparisons, iterations },
    };

    // Add best cut edge to MST
    inMst.add(bestV);
    mask |= 1 << bestV;
    mstEdges.push({ u: bestU, v: bestV, weight: minWeight });
    totalMstWeight += minWeight;

    yield {
      stepIndex: stepIndex++,
      title: `Add Edge (${cities[bestU].label}, ${cities[bestV].label}) to MST (Weight +${minWeight})`,
      description: `Added edge (${cities[bestU].label}, ${cities[bestV].label}) to Minimum Spanning Tree. Current MST weight = ${totalMstWeight}.`,
      codeLine: 4,
      state: {
        isApprox: true,
        metricCheck,
        numCities: n,
        cities,
        costMatrix: cost,
        currentPhase: 'mst',
        currentCity: bestV,
        currentMask: mask,
        candidateEdges: [],
        activeTourEdges: mstEdges.map((e) => ({ u: e.u, v: e.v })),
        mstEdges: [...mstEdges],
        mstWeight: totalMstWeight,
        doubledEdges: [],
        dfsOrder: [],
        explanation: `MST now contains ${mstEdges.length} edges connecting ${inMst.size} cities`,
      },
      highlights: {
        activeNode: bestV,
        edges: mstEdges.map((e) => ({ u: `${e.u}`, v: `${e.v}`, status: 'cover' })),
      },
      metrics: { comparisons, iterations },
    };
  }

  // ==========================================
  // PHASE 2: Double MST Edges -> Eulerian Multigraph
  // ==========================================
  const doubledEdges: { u: number; v: number; weight: number }[] = [];
  for (const e of mstEdges) {
    doubledEdges.push({ u: e.u, v: e.v, weight: e.weight });
    doubledEdges.push({ u: e.v, v: e.u, weight: e.weight });
  }

  const doubledWeight = totalMstWeight * 2;

  yield {
    stepIndex: stepIndex++,
    title: `Phase 2: Double Every MST Edge (Weight: 2 * ${totalMstWeight} = ${doubledWeight})`,
    description: `Doubled all ${mstEdges.length} MST edges to form an Eulerian multigraph (every vertex now has even degree), so a closed walk using each doubled edge once costs 2 × W(MST) = ${doubledWeight}. This is at most 2 × OPT for any non-negative costs: deleting one edge from an optimal tour leaves a spanning tree, so W(MST) ≤ OPT.`,
    codeLine: 5,
    state: {
      isApprox: true,
      metricCheck,
      numCities: n,
      cities,
      costMatrix: cost,
      currentPhase: 'double',
      currentCity: 0,
      currentMask: mask,
      candidateEdges: [],
      activeTourEdges: doubledEdges.map((e) => ({ u: e.u, v: e.v })),
      mstEdges: [...mstEdges],
      mstWeight: totalMstWeight,
      doubledEdges: [...doubledEdges],
      dfsOrder: [],
      calculationFormula: `W(Eulerian) = 2 * W(MST) = 2 * ${totalMstWeight} = ${doubledWeight}`,
      explanation: 'Every vertex now has even degree, guaranteeing an Eulerian closed circuit exists.',
    },
    highlights: {
      edges: mstEdges.map((e) => ({ u: `${e.u}`, v: `${e.v}`, status: 'active' })),
    },
    metrics: { comparisons, iterations },
  };

  // ==========================================
  // PHASE 3: DFS Preorder Traversal & Shortcutting
  // ==========================================
  // Build adjacency list for MST
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const e of mstEdges) {
    adj[e.u].push(e.v);
    adj[e.v].push(e.u);
  }
  // Sort neighbors for deterministic preorder traversal
  for (let i = 0; i < n; i++) adj[i].sort((a, b) => a - b);

  const visitedInDfs = new Set<number>();
  const tourOrder: number[] = [];

  function dfsWalk(u: number) {
    visitedInDfs.add(u);
    tourOrder.push(u);

    for (const v of adj[u]) {
      if (!visitedInDfs.has(v)) {
        dfsWalk(v);
      }
    }
  }

  dfsWalk(0);

  // Reconstruct shortcut Hamiltonian cycle: 0 -> ... -> 0
  const finalCycle = [...tourOrder, 0];
  const finalTourEdges: { u: number; v: number }[] = [];
  let approxTourCost = 0;

  for (let i = 0; i < finalCycle.length - 1; i++) {
    const u = finalCycle[i];
    const v = finalCycle[i + 1];
    finalTourEdges.push({ u, v });
    approxTourCost += cost[u][v];

    yield {
      stepIndex: stepIndex++,
      title: `DFS Preorder Shortcut: ${cities[u].label} ➔ ${cities[v].label} (Cost: ${cost[u][v]})`,
      description: `Next unvisited city in DFS preorder is ${cities[v].label}, so the tour goes ${cities[u].label} ➔ ${cities[v].label} directly, skipping cities already visited. ${
        metricCheck.isMetric
          ? 'With metric costs a direct hop is never longer than the walk it skips (triangle inequality), so shortcutting cannot increase the cost.'
          : 'These costs break the triangle inequality, so this direct hop may cost more than the walk it skips.'
      } Running tour cost: ${approxTourCost}.`,
      codeLine: [6, 7],
      state: {
        isApprox: true,
        metricCheck,
        numCities: n,
        cities,
        costMatrix: cost,
        currentPhase: 'shortcut',
        currentCity: v,
        currentMask: mask,
        candidateEdges: [],
        activeTourEdges: [...finalTourEdges],
        mstEdges: [...mstEdges],
        mstWeight: totalMstWeight,
        doubledEdges: [...doubledEdges],
        dfsOrder: [...tourOrder.slice(0, i + 1)],
        optimalTour: [...finalCycle.slice(0, i + 2)],
        optimalCost: approxTourCost,
        calculationFormula: `Tour so far: ${finalCycle.slice(0, i + 2).map((x) => cities[x].label).join(' ➔ ')} (Cost = ${approxTourCost})`,
        explanation: `Added shortcut edge (${cities[u].label}, ${cities[v].label}) to final Hamiltonian tour`,
      },
      highlights: {
        activeNode: v,
        edges: finalTourEdges.map((e) => ({ u: `${e.u}`, v: `${e.v}`, status: 'flow' })),
      },
      metrics: { comparisons, iterations },
    };
  }

  // The guarantee is claimed only when its assumption holds and the numbers agree.
  const guaranteeHolds = metricCheck.isMetric && approxTourCost <= doubledWeight;
  const tourText = finalCycle.map((i) => cities[i].label).join(' ➔ ');
  const boundText = guaranteeHolds
    ? `Tour cost ${approxTourCost} ≤ 2 × W(MST) = ${doubledWeight} ≤ 2 × OPT`
    : `No guarantee: ${metricCheck.isMetric ? 'unexpected bound failure' : 'costs are not metric'} (tour cost ${approxTourCost} ${relation(approxTourCost, doubledWeight)} 2 × W(MST) = ${doubledWeight})`;

  // Complete
  yield {
    stepIndex: stepIndex++,
    title: `TSP 2-Approximation Complete (Cost: ${approxTourCost})`,
    description: guaranteeHolds
      ? `Built the Hamiltonian cycle ${tourText}. Guarantee: tour cost ${approxTourCost} ≤ 2 × W(MST) = ${doubledWeight} (shortcuts never add cost on metric inputs), and W(MST) ≤ OPT, so the tour costs at most 2 × OPT.`
      : `Built the Hamiltonian cycle ${tourText} with cost ${approxTourCost}. No approximation guarantee applies: ${nonMetricReason || 'the costs are not metric'}. Here the tour cost is ${approxTourCost} ${relation(approxTourCost, doubledWeight)} 2 × W(MST) = ${doubledWeight}.`,
    codeLine: 8,
    state: {
      isApprox: true,
      metricCheck,
      numCities: n,
      cities,
      costMatrix: cost,
      currentPhase: 'complete',
      currentCity: 0,
      currentMask: (1 << n) - 1,
      candidateEdges: [],
      activeTourEdges: [...finalTourEdges],
      mstEdges: [...mstEdges],
      mstWeight: totalMstWeight,
      doubledEdges: [...doubledEdges],
      dfsOrder: [...tourOrder],
      optimalTour: finalCycle,
      optimalCost: approxTourCost,
      calculationFormula: `Total tour cost = ${approxTourCost} ${relation(approxTourCost, doubledWeight)} 2 × W(MST) = ${doubledWeight}`,
      explanation: guaranteeHolds
        ? 'Final tour built; on metric costs it is guaranteed to be at most 2 × OPT.'
        : 'Final tour built, but the costs are not metric, so the 2 × OPT guarantee does not apply.',
    },
    highlights: {
      nodes: finalCycle.map((c) => `${c}`),
      edges: finalTourEdges.map((e) => ({ u: `${e.u}`, v: `${e.v}`, status: 'flow' })),
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      tour: finalCycle.map((i) => cities[i].label),
      tourCityIndices: finalCycle,
      tourCost: approxTourCost,
      mstWeight: totalMstWeight,
      doubledWeight,
      approxRatioBound: boundText,
      isMetric: metricCheck.isMetric,
      metricViolation: nonMetricReason || undefined,
      guaranteeHolds,
      isHamiltonian: new Set(tourOrder).size === n && finalCycle[0] === finalCycle[finalCycle.length - 1],
    },
  };
}
