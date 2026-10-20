import { AlgorithmStep, DpRuleStep } from '../types/algorithm';

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
  /** The DP rule applied at this step, for the "Rule for this cell" card. */
  dpRule?: DpRuleStep;
  nodes: GraphNode[];
  edges: GraphEdge[];
  distMatrix: (number | null)[][];
  nextMatrix: (number | null)[][];
  k: number;
  i: number;
  j: number;
  updatedCell?: { i: number; j: number };
  explanation?: string;
  /** The comparison made at this step: the current best D[i][j] versus going through vertex k. */
  comparison?: { direct: number | null; legIK: number | null; legKJ: number | null; viaK: number | null; improved: boolean };
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
    description: `Start with what we know: D[i][j] is the length of the direct road from Vi to Vj (0 from a vertex to itself, ∞ where there is no direct road). Then each vertex in turn is allowed as a stop in the middle of trips, to see whether that makes any trip shorter.`,
    codeLine: 2,
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
      title: `Starting Round ${k + 1} of ${n}: V${k + 1} as Intermediate Stop`,
      description: `Round ${k + 1}: allow V${k + 1} as a stop. For every pair of vertices, check whether going via V${k + 1} beats the best trip known so far. ${k === 0 ? 'So far only direct roads count.' : `Earlier rounds already allowed V1 to V${k} as stops.`}`,
      codeLine: 3,
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
      if (i === k) continue; // Skip routing through self as intermediate

      for (let j = 0; j < n; j++) {
        if (j === k || i === j) continue; // Skip self-loop or duplicate endpoint

        iterations++;
        comparisons++;

        const dik = dist[i][k];
        const dkj = dist[k][j];
        const dij = dist[i][j];

        if (dik === null || dkj === null) {
          yield {
            stepIndex: stepIndex++,
            title: `Check D[V${i + 1}][V${j + 1}] via V${k + 1}: Unreachable Leg`,
            description: `V${k + 1} cannot help the trip V${i + 1} → V${j + 1}: there is no known way ${
              dik === null ? `from V${i + 1} to V${k + 1}` : `from V${k + 1} to V${j + 1}`
            } yet. The best trip stays ${dij === null ? '∞' : dij}.`,
            codeLine: 7,
            state: {
              nodes,
              edges,
              distMatrix: dist.map((row) => [...row]),
              nextMatrix: next.map((row) => [...row]),
              k,
              i,
              j,
              comparison: { direct: dij, legIK: dik, legKJ: dkj, viaK: null, improved: false },
              dpRule: {
                label: 'Not shorter (no route via k)',
                tone: 'mismatch',
                check: { text: `D[V${i + 1}][V${k + 1}] + D[V${k + 1}][V${j + 1}] < D[V${i + 1}][V${j + 1}]`, ok: false },
                formula: 'D[i][j] = min( D[i][j], D[i][k] + D[k][j] )',
                substitution: `D[V${i + 1}][V${j + 1}] = min( ${dij ?? '∞'}, ${dik ?? '∞'} + ${dkj ?? '∞'} ) = ${dij ?? '∞'}`,
                action: `A leg through V${k + 1} does not exist: keep ${dij ?? '∞'}.`,
              },
              explanation: `D[V${i + 1}][V${k + 1}] + D[V${k + 1}][V${j + 1}] = ${
                dik === null ? '∞' : dik
              } + ${dkj === null ? '∞' : dkj} = ∞`,
            },
            highlights: {
              cells: [
                { r: i, c: j, status: 'active' as const },
                ...(dik !== null ? [{ r: i, c: k, status: 'source' as const }] : []),
                ...(dkj !== null ? [{ r: k, c: j, status: 'source' as const }] : []),
              ],
              edges: [
                ...(dik !== null ? [{ u: `${i}`, v: `${k}`, status: 'active' as const }] : []),
                ...(dkj !== null ? [{ u: `${k}`, v: `${j}`, status: 'active' as const }] : []),
              ],
              activeNode: `${k}`,
              nodes: [`${i}`, `${j}`, `${k}`],
            },
            metrics: { comparisons, relaxations, iterations },
          };
        } else {
          const throughK = dik + dkj;
          const isShorter = dij === null || throughK < dij;

          if (isShorter) {
            relaxations++;
            const oldDij = dij;
            dist[i][j] = throughK;
            next[i][j] = next[i][k];

            yield {
              stepIndex: stepIndex++,
              title: `Shorter Path: Update D[V${i + 1}][V${j + 1}] via V${k + 1}`,
              description: `Going via V${k + 1}: ${dik} + ${dkj} = ${throughK}, shorter than the best known trip (${
                oldDij === null ? '∞' : oldDij
              }). Update D[V${i + 1}][V${j + 1}] = ${throughK}.`,
              codeLine: [7, 8],
              state: {
                nodes,
                edges,
                distMatrix: dist.map((row) => [...row]),
                nextMatrix: next.map((row) => [...row]),
                k,
                i,
                j,
                updatedCell: { i, j },
                comparison: { direct: oldDij, legIK: dik, legKJ: dkj, viaK: throughK, improved: true },
                dpRule: {
                  label: 'Shorter through k',
                  tone: 'match',
                  check: { text: `${dik} + ${dkj} < ${oldDij ?? '∞'}`, ok: true },
                  formula: 'D[i][j] = min( D[i][j], D[i][k] + D[k][j] )',
                  substitution: `D[V${i + 1}][V${j + 1}] = min( ${oldDij ?? '∞'}, ${dik} + ${dkj} ) = ${throughK}`,
                  action: `Update: route V${i + 1} → V${k + 1} → V${j + 1}.`,
                },
                explanation: `D[V${i + 1}][V${j + 1}] = min(${oldDij ?? '∞'}, ${dik} + ${dkj}) = ${throughK}`,
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
                nodes: [`${i}`, `${j}`, `${k}`],
              },
              metrics: { comparisons, relaxations, iterations },
            };
          } else {
            yield {
              stepIndex: stepIndex++,
              title: `Check D[V${i + 1}][V${j + 1}] via V${k + 1}: No Improvement`,
              description: `Going via V${k + 1}: ${dik} + ${dkj} = ${throughK}, not shorter than the best known trip (${dij}). Keep ${dij}.`,
              codeLine: 7,
              state: {
                nodes,
                edges,
                distMatrix: dist.map((row) => [...row]),
                nextMatrix: next.map((row) => [...row]),
                k,
                i,
                j,
                comparison: { direct: dij, legIK: dik, legKJ: dkj, viaK: throughK, improved: false },
                dpRule: {
                  label: 'Not shorter',
                  tone: 'mismatch',
                  check: { text: `${dik} + ${dkj} < ${dij}`, ok: false },
                  formula: 'D[i][j] = min( D[i][j], D[i][k] + D[k][j] )',
                  substitution: `D[V${i + 1}][V${j + 1}] = min( ${dij}, ${dik} + ${dkj} ) = ${dij}`,
                  action: `Keep ${dij}.`,
                },
                explanation: `min(${dij}, ${dik} + ${dkj}) = ${dij} (no change)`,
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
                nodes: [`${i}`, `${j}`, `${k}`],
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
    description: `Done: every vertex has been allowed as a stop, so D now holds the shortest trip between every pair. ${relaxations} trip${relaxations === 1 ? '' : 's'} got shorter by passing through another vertex.`,
    codeLine: 9,
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
