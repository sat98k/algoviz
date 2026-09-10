import { AlgorithmStep } from '../types/algorithm';
import { GraphNode, GraphEdge } from './floydWarshall';

export interface BellmanFordState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: string;
  distances: Record<string, number | null>; // null = ∞
  predecessors: Record<string, string | null>;
  pass: number; // 0 = init, 1..V-1 relaxation passes, > V-1 = verification / done
  totalPasses: number; // V - 1
  consideringEdge?: { u: string; v: string };
  hasNegativeCycle?: boolean;
  negativeCycleEdge?: { u: string; v: string };
  treeEdges?: { u: string; v: string }[];
  explanation?: string;
}

// CLRS "Introduction to Algorithms" Bellman-Ford example (no negative cycle).
//        S     T     X     Y     Z
const DEFAULT_MATRIX: (number | null)[][] = [
  [0, 6, null, 7, null], // S
  [null, 0, 5, 8, -4], // T
  [null, -2, 0, null, null], // X
  [null, null, -3, 0, 9], // Y
  [2, null, 7, null, 0], // Z
];
const DEFAULT_LABELS = ['S', 'T', 'X', 'Y', 'Z'];

export function* bellmanFordSteps(inputs: {
  matrix?: (number | null)[][];
  nodeLabels?: string[];
  source?: number;
}): Generator<AlgorithmStep<BellmanFordState>> {
  const matrix = inputs.matrix && inputs.matrix.length > 0 ? inputs.matrix : DEFAULT_MATRIX;
  const n = matrix.length;
  const labels =
    inputs.nodeLabels && inputs.nodeLabels.length === n
      ? inputs.nodeLabels
      : inputs.matrix
      ? Array.from({ length: n }, (_, i) => `V${i + 1}`)
      : DEFAULT_LABELS;
  const srcIdx = Math.min(Math.max(inputs.source ?? 0, 0), Math.max(n - 1, 0));

  const nodes: GraphNode[] = Array.from({ length: n }, (_, i) => ({ id: `${i}`, label: labels[i] }));
  const edges: GraphEdge[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const w = matrix[r][c];
      if (r !== c && w !== null && w !== undefined) {
        edges.push({ u: `${r}`, v: `${c}`, weight: w });
      }
    }
  }

  const source = `${srcIdx}`;
  const totalPasses = Math.max(n - 1, 0);
  const lbl = (id: string) => labels[+id];
  const fmt = (v: number | null | undefined) => (v === null || v === undefined ? '∞' : `${v}`);

  let stepIndex = 0;
  let comparisons = 0;
  let relaxations = 0;
  let iterations = 0;

  const dist: Record<string, number | null> = {};
  const pred: Record<string, string | null> = {};
  nodes.forEach((nd) => {
    dist[nd.id] = null;
    pred[nd.id] = null;
  });
  dist[source] = 0;

  const snapshot = (
    title: string,
    description: string,
    codeLine: number,
    opts: {
      pass: number;
      consideringEdge?: { u: string; v: string };
      highlights?: AlgorithmStep['highlights'];
      hasNegativeCycle?: boolean;
      negativeCycleEdge?: { u: string; v: string };
      treeEdges?: { u: string; v: string }[];
      isFinal?: boolean;
      result?: any;
    }
  ): AlgorithmStep<BellmanFordState> => ({
    stepIndex: stepIndex++,
    title,
    description,
    codeLine,
    state: {
      nodes,
      edges,
      source,
      distances: { ...dist },
      predecessors: { ...pred },
      pass: opts.pass,
      totalPasses,
      consideringEdge: opts.consideringEdge,
      hasNegativeCycle: opts.hasNegativeCycle,
      negativeCycleEdge: opts.negativeCycleEdge,
      treeEdges: opts.treeEdges,
      explanation: description,
    },
    highlights: opts.highlights ?? {},
    metrics: { comparisons, relaxations, iterations },
    isFinal: opts.isFinal,
    result: opts.result,
  });

  yield snapshot(
    'Initialize single-source distances',
    `Set dist[${lbl(source)}] = 0 and every other vertex to ∞. Then relax all ${edges.length} edges up to ${totalPasses} time${totalPasses === 1 ? '' : 's'}.`,
    1,
    { pass: 0, highlights: { activeNode: source } }
  );

  let earlyStop = false;
  for (let pass = 1; pass <= totalPasses && !earlyStop; pass++) {
    yield snapshot(
      `Pass ${pass} of ${totalPasses}`,
      `Relax every edge once. A shortest path has at most ${totalPasses} edges, so ${totalPasses} passes are enough.`,
      2,
      { pass, highlights: { activeNode: source } }
    );

    let updatedThisPass = false;

    for (const e of edges) {
      iterations++;
      comparisons++;
      const du = dist[e.u];
      const dv = dist[e.v];
      const canRelax = du !== null && (dv === null || du + e.weight < dv);

      if (canRelax) {
        const oldDv = dv;
        const newDv = (du as number) + e.weight;
        dist[e.v] = newDv;
        pred[e.v] = e.u;
        relaxations++;
        updatedThisPass = true;
        yield snapshot(
          `Relax ${lbl(e.u)} → ${lbl(e.v)}  (w = ${e.weight})`,
          `dist[${lbl(e.u)}] + ${e.weight} = ${newDv} < ${fmt(oldDv)} → update dist[${lbl(e.v)}] = ${newDv}, pred[${lbl(e.v)}] = ${lbl(e.u)}.`,
          3,
          {
            pass,
            consideringEdge: { u: e.u, v: e.v },
            highlights: {
              activeNode: e.v,
              nodes: [e.v],
              edges: [{ u: e.u, v: e.v, status: 'active' }],
            },
          }
        );
      } else {
        yield snapshot(
          `Check ${lbl(e.u)} → ${lbl(e.v)}  (w = ${e.weight})`,
          du === null
            ? `${lbl(e.u)} is still unreachable (∞), so this edge cannot relax ${lbl(e.v)} yet.`
            : `dist[${lbl(e.u)}] + ${e.weight} = ${(du as number) + e.weight} ≥ dist[${lbl(e.v)}] = ${fmt(dv)} → no improvement.`,
          3,
          {
            pass,
            consideringEdge: { u: e.u, v: e.v },
            highlights: { edges: [{ u: e.u, v: e.v, status: 'active' }] },
          }
        );
      }
    }

    if (!updatedThisPass) {
      earlyStop = true;
      yield snapshot(
        `No changes in pass ${pass} — stop early`,
        `Pass ${pass} relaxed no edge, so every distance is already final. The remaining passes are skipped.`,
        2,
        { pass, highlights: {} }
      );
    }
  }

  // ---- verification pass: a negative-weight cycle reachable from the source ----
  yield snapshot(
    'Verification pass — scan for negative cycles',
    `Relax every edge one more time. If any edge still improves, a negative-weight cycle is reachable from ${lbl(source)}.`,
    4,
    { pass: totalPasses + 1, highlights: { activeNode: source } }
  );

  let negEdge: { u: string; v: string } | undefined;
  for (const e of edges) {
    iterations++;
    comparisons++;
    const du = dist[e.u];
    const dv = dist[e.v];
    if (du !== null && (dv === null || du + e.weight < dv)) {
      negEdge = { u: e.u, v: e.v };
      yield snapshot(
        `Negative cycle via ${lbl(e.u)} → ${lbl(e.v)}`,
        `Edge ${lbl(e.u)} → ${lbl(e.v)} still relaxes (${du} + ${e.weight} < ${fmt(dv)}). A negative-weight cycle is reachable — no shortest path exists.`,
        4,
        {
          pass: totalPasses + 1,
          hasNegativeCycle: true,
          negativeCycleEdge: negEdge,
          highlights: {
            edges: [{ u: e.u, v: e.v, status: 'negcycle' }],
            nodes: [e.u, e.v],
          },
        }
      );
      break;
    }
  }

  if (negEdge) {
    yield snapshot(
      'Bellman-Ford Halted — Negative Cycle',
      `A negative-weight cycle reachable from ${lbl(source)} was detected at edge ${lbl(negEdge.u)} → ${lbl(negEdge.v)}. Shortest paths are undefined.`,
      5,
      {
        pass: totalPasses + 1,
        hasNegativeCycle: true,
        negativeCycleEdge: negEdge,
        highlights: { edges: [{ u: negEdge.u, v: negEdge.v, status: 'negcycle' }] },
        isFinal: true,
        result: {
          hasNegativeCycle: true,
          negativeCycleEdge: `${lbl(negEdge.u)} → ${lbl(negEdge.v)}`,
          source: lbl(source),
        },
      }
    );
    return;
  }

  // ---- shortest-path tree + per-vertex path reconstruction ----
  const treeEdges: { u: string; v: string }[] = [];
  nodes.forEach((nd) => {
    const p = pred[nd.id];
    if (p !== null) treeEdges.push({ u: p, v: nd.id });
  });

  const buildPath = (target: string): string[] => {
    if (dist[target] === null) return [];
    const path: string[] = [];
    let cur: string | null = target;
    const guard = new Set<string>();
    while (cur !== null && !guard.has(cur)) {
      guard.add(cur);
      path.unshift(lbl(cur));
      if (cur === source) break;
      cur = pred[cur];
    }
    return path;
  };

  const paths: Record<string, { distance: number | null; path: string }> = {};
  nodes.forEach((nd) => {
    paths[lbl(nd.id)] = {
      distance: dist[nd.id],
      path: dist[nd.id] === null ? '(unreachable)' : buildPath(nd.id).join(' → '),
    };
  });

  yield snapshot(
    'Bellman-Ford Complete',
    `Shortest paths from ${lbl(source)} computed with ${relaxations} relaxation${relaxations === 1 ? '' : 's'}. No negative cycle is reachable.`,
    5,
    {
      pass: totalPasses + 1,
      treeEdges,
      highlights: {
        activeNode: source,
        edges: treeEdges.map((t) => ({ u: t.u, v: t.v, status: 'flow' })),
      },
      isFinal: true,
      result: {
        source: lbl(source),
        distances: Object.fromEntries(nodes.map((nd) => [lbl(nd.id), dist[nd.id]])),
        predecessors: Object.fromEntries(
          nodes.map((nd) => [lbl(nd.id), pred[nd.id] === null ? null : lbl(pred[nd.id]!)])
        ),
        paths,
        hasNegativeCycle: false,
      },
    }
  );
}
