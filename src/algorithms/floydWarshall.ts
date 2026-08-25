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

  // Initialize dist and next matrices
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

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Floyd-Warshall Distance Matrix',
    description: `Initialized ${n}x${n} distance matrix D(0) from direct edge weights. Unconnected pairs set to ∞.`,
    codeLine: 1,
    state: {
      nodes,
      edges,
      distMatrix: dist.map((row) => [...row]),
      nextMatrix: next.map((row) => [...row]),
      k: -1,
      i: -1,
      j: -1,
    },
    highlights: {},
    metrics: { comparisons, relaxations, iterations },
  };

  // 3 nested loops: k from 0 to n-1, i from 0 to n-1, j from 0 to n-1
  for (let k = 0; k < n; k++) {
    yield {
      stepIndex: stepIndex++,
      title: `Starting Iteration k = ${k} (Intermediate Node V${k + 1})`,
      description: `Testing if paths between all vertex pairs (i, j) can be shortened by routing through intermediate vertex V${k + 1}.`,
      codeLine: 2,
      state: {
        nodes,
        edges,
        distMatrix: dist.map((row) => [...row]),
        nextMatrix: next.map((row) => [...row]),
        k,
        i: -1,
        j: -1,
      },
      highlights: {
        activeNode: `${k}`,
      },
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
          const isShorter = dij === null || throughK < dij;

          if (isShorter) {
            relaxations++;
            dist[i][j] = throughK;
            next[i][j] = next[i][k];

            yield {
              stepIndex: stepIndex++,
              title: `Relax Distance D[V${i + 1}][V${j + 1}] via V${k + 1}`,
              description: `Shortened path: D[${i + 1}][${j + 1}] updated from ${dij === null ? '∞' : dij} to ${throughK} (D[${i + 1}][${k + 1}] = ${dik} + D[${k + 1}][${j + 1}] = ${dkj}).`,
              codeLine: 3,
              state: {
                nodes,
                edges,
                distMatrix: dist.map((row) => [...row]),
                nextMatrix: next.map((row) => [...row]),
                k,
                i,
                j,
                updatedCell: { i, j },
                explanation: `D[${i + 1}][${j + 1}] = min(${dij ?? '∞'}, ${dik} + ${dkj}) = ${throughK}`,
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

  // Format path reconstruction helper
  function reconstructPath(u: number, v: number): number[] {
    if (dist[u][v] === null) return [];
    const path: number[] = [u];
    let curr = u;
    while (curr !== v) {
      const nxt = next[curr][v];
      if (nxt === null) return [];
      curr = nxt;
      path.push(curr);
    }
    return path;
  }

  const allPairsPaths: Record<string, { distance: number | null; path: string }> = {};
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const p = reconstructPath(r, c);
      allPairsPaths[`V${r + 1} -> V${c + 1}`] = {
        distance: dist[r][c],
        path: p.map((idx) => `V${idx + 1}`).join(' → '),
      };
    }
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Floyd-Warshall Complete',
    description: `All-Pairs Shortest Path computation finished in O(V³) time with ${relaxations} edge relaxations.`,
    codeLine: 4,
    state: {
      nodes,
      edges,
      distMatrix: dist.map((row) => [...row]),
      nextMatrix: next.map((row) => [...row]),
      k: n - 1,
      i: n - 1,
      j: n - 1,
    },
    highlights: {},
    metrics: { comparisons, relaxations, iterations },
    isFinal: true,
    result: {
      distanceMatrix: dist,
      paths: allPairsPaths,
    },
  };
}
