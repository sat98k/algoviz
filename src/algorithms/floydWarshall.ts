import { AlgorithmStep } from '../types/algorithm';

export interface GraphNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  u: string;
  v: string;
  weight: number;
  capacity?: number;
  flow?: number;
}

export interface FloydWarshallState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  distMatrix: (number | null)[][];
  nextMatrix: (number | null)[][];
  k: number;
  i: number;
  j: number;
  updatedCell?: { i: number; j: number };
  explanation?: string;
}

export function* floydWarshallSteps(inputs: {
  numNodes?: number;
  matrix?: (number | null)[][];
}): Generator<AlgorithmStep<FloydWarshallState>> {

  const defaultMatrix: (number | null)[][] = [
    [0, 3, 8, null, -4],
    [null, 0, null, 1, 7],
    [null, 4, 0, null, null],
    [2, null, -5, 0, null],
    [null, null, null, 6, 0],
  ];

  const rawMatrix = inputs.matrix || defaultMatrix;
  const n = rawMatrix.length;

  const nodes: GraphNode[] = Array.from({ length: n }, (_, idx) => ({
    id: `${idx}`,
    label: `V${idx + 1}`,
  }));

  const edges: GraphEdge[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const w = rawMatrix[r][c];
      if (r !== c && w !== null && w !== undefined) {
        edges.push({ u: `${r}`, v: `${c}`, weight: w });
      }
    }
  }

  // Initialize distance and next matrices
  const dist: (number | null)[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => {
      if (r === c) return 0;
      return rawMatrix[r][c] !== undefined ? rawMatrix[r][c] : null;
    })
  );

  const next: (number | null)[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => {
      if (dist[r][c] !== null && r !== c) return c;
      return null;
    })
  );

  let stepIndex = 0;
  let comparisons = 0;
  let relaxations = 0;
  let iterations = 0;

  // 🔹 Initial Step
  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Distance Matrix',
    description: `Initialized ${n}×${n} matrix. Unreachable paths are treated as ∞ (shown as null).`,
    codeLine: 1,
    state: {
      nodes,
      edges,
      distMatrix: dist.map(row => [...row]),
      nextMatrix: next.map(row => [...row]),
      k: -1,
      i: -1,
      j: -1,
    },
    highlights: {},
    metrics: { comparisons, relaxations, iterations },
  };

  // 🔹 Main algorithm
  for (let k = 0; k < n; k++) {

    yield {
      stepIndex: stepIndex++,
      title: `Iteration k = ${k} (via V${k + 1})`,
      description: `Checking if going through V${k + 1} gives shorter paths.`,
      codeLine: 2,
      state: {
        nodes,
        edges,
        distMatrix: dist.map(row => [...row]),
        nextMatrix: next.map(row => [...row]),
        k,
        i: -1,
        j: -1,
      },
      highlights: { activeNode: `${k}` },
      metrics: { comparisons, relaxations, iterations },
    };

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {

        iterations++;
        comparisons++;

        const dik = dist[i][k];
        const dkj = dist[k][j];
        const dij = dist[i][j];

        if (dik !== null && dkj !== null) {
          const throughK = dik + dkj;

          if (dij === null || throughK < dij) {
            relaxations++;

            dist[i][j] = throughK;

            if (next[i][k] !== null) {
              next[i][j] = next[i][k];
            }

            yield {
              stepIndex: stepIndex++,
              title: `Update D[V${i + 1}][V${j + 1}]`,
              description: `Improved via V${k + 1}: ${dij ?? '∞'} → ${throughK}`,
              codeLine: 3,
              state: {
                nodes,
                edges,
                distMatrix: dist.map(row => [...row]),
                nextMatrix: next.map(row => [...row]),
                k,
                i,
                j,
                updatedCell: { i, j },
                explanation: `min(${dij ?? '∞'}, ${dik} + ${dkj}) = ${throughK}`,
              },
              highlights: {
                cells: [
                  { r: i, c: j, status: 'active' },
                  { r: i, c: k, status: 'source' },
                  { r: k, c: j, status: 'source' },
                ],
                edges: [
                  { u: `${i}`, v: `${k}`, status: 'active' },
                  { u: `${k}`, v: `${j}`, status: 'active' },
                ],
                activeNode: `${k}`,
              },
              metrics: { comparisons, relaxations, iterations },
            };
          }
        }
      }
    }
  }

  // 🔹 Negative cycle detection
  let hasNegativeCycle = false;
  for (let i = 0; i < n; i++) {
    if (dist[i][i] !== null && dist[i][i]! < 0) {
      hasNegativeCycle = true;
      break;
    }
  }

  // 🔹 Final Step
  yield {
    stepIndex: stepIndex++,
    title: hasNegativeCycle ? 'Negative Cycle Detected' : 'Floyd-Warshall Complete',
    description: hasNegativeCycle
      ? 'Graph contains a negative cycle.'
      : `All-pairs shortest paths computed successfully.`,
    codeLine: 4,
    state: {
      nodes,
      edges,
      distMatrix: dist.map(row => [...row]),
      nextMatrix: next.map(row => [...row]),
      k: n - 1,
      i: n - 1,
      j: n - 1,
    },
    highlights: {},
    metrics: { comparisons, relaxations, iterations },
    isFinal: true,
    result: {
      distanceMatrix: dist,
      hasNegativeCycle,
    },
  };
}