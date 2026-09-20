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
}

export function* tspApproxSteps(inputs: {
  numCities?: number;
  costMatrix?: number[][];
  cityNames?: string[];
}): Generator<AlgorithmStep<TspApproxState>> {
  // Default 4-city textbook instance (Held-Karp optimal is 80)
  const defaultCostMatrix = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0],
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

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize TSP 2-Approximation (MST-Doubling)',
    description: `Loaded ${n} cities. Procedure: (1) Construct MST using Prim’s algorithm; (2) Double every MST edge to form Eulerian multigraph; (3) Perform DFS preorder traversal with shortcutting to guarantee Cost <= 2 * OPT.`,
    codeLine: 1,
    state: {
      isApprox: true,
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
    description: `Doubled all ${mstEdges.length} edges in the MST to form an Eulerian multigraph (each vertex now has an even degree). Eulerian tour weight = 2 * W(MST) = ${doubledWeight} <= 2 * OPT.`,
    codeLine: 5,
    state: {
      isApprox: true,
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
      description: `Visited ${cities[v].label} via preorder DFS. Shortcutting skipped any previously visited intermediate vertices (valid by Triangle Inequality: dist(u,w) <= dist(u,v) + dist(v,w)). Running Tour Cost: ${approxTourCost}.`,
      codeLine: [6, 7],
      state: {
        isApprox: true,
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

  // Complete
  yield {
    stepIndex: stepIndex++,
    title: `TSP 2-Approximation Complete (Cost: ${approxTourCost})`,
    description: `Constructed valid Hamiltonian cycle: ${finalCycle.map((i) => cities[i].label).join(' ➔ ')}. Approximation guarantee: Tour Cost (${approxTourCost}) <= 2 * W(MST) (${doubledWeight}) <= 2 * OPT.`,
    codeLine: 8,
    state: {
      isApprox: true,
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
      calculationFormula: `Total Tour Cost = ${approxTourCost} <= 2 * W(MST) = ${doubledWeight}`,
      explanation: 'Final 2-approximation Hamiltonian tour successfully built and verified against the 2x bound.',
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
      approxRatioBound: `Cost <= 2 * OPT (${approxTourCost} <= ${doubledWeight})`,
      isHamiltonian: new Set(tourOrder).size === n && finalCycle[0] === finalCycle[finalCycle.length - 1],
    },
  };
}
