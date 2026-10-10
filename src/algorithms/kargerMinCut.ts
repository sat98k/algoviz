import { AlgorithmStep } from '../types/algorithm';
import { GraphNode, GraphEdge } from './floydWarshall';

export interface KargerState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentContractedEdge?: { u: string; v: string; uLabel: string; vLabel: string };
  superNodeMembers: Record<string, string[]>;
  cutSetA?: string[];
  cutSetB?: string[];
  cutEdges?: GraphEdge[];
  cutSize?: number;
  phase: 'init' | 'pick_edge' | 'contract' | 'complete';
}

/** Small deterministic PRNG (mulberry32) so a given seed always replays the same run. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Exact global minimum cut by checking every partition (vertex 0 fixed on side A).
 * Only used for small teaching graphs; returns null when the graph is too large.
 */
export function exactMinCut(nodeIds: string[], edges: [string, string][]): number | null {
  const n = nodeIds.length;
  if (n < 2 || n > 16) return null;
  const index = new Map(nodeIds.map((id, i) => [id, i]));
  let best = Infinity;
  for (let mask = 1; mask < 1 << (n - 1); mask++) {
    const sideB = mask << 1; // vertex 0 always on side A
    let crossing = 0;
    for (const [u, v] of edges) {
      const inB = (x: string) => ((sideB >> index.get(x)!) & 1) === 1;
      if (inB(u) !== inB(v)) crossing++;
    }
    best = Math.min(best, crossing);
  }
  return best;
}

/** One complete contraction run without animation (union-find): returns the cut it ends with. */
export function contractOnce(nodeIds: string[], edges: [string, string][], rand: () => number) {
  const parent = new Map(nodeIds.map((id) => [id, id]));
  const find = (x: string): string => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  };
  let components = nodeIds.length;
  while (components > 2) {
    const live = edges.filter(([u, v]) => find(u) !== find(v));
    if (live.length === 0) break;
    const [u, v] = live[Math.floor(rand() * live.length)];
    parent.set(find(u), find(v));
    components--;
  }
  const rootA = find(nodeIds[0]);
  const sideA = nodeIds.filter((id) => find(id) === rootA);
  const sideB = nodeIds.filter((id) => find(id) !== rootA);
  const cutSize = edges.filter(([u, v]) => find(u) !== find(v)).length;
  return { cutSize, sideA, sideB };
}

export function* kargerMinCutSteps(inputs: {
  numNodes?: number;
  edgeList?: [string, string][];
  seed?: number;
  /** Independent contraction runs; the first is animated, the rest are summarized. */
  trials?: number;
}): Generator<AlgorithmStep<KargerState>> {
  // Default benchmark graph: 6-node dumbbell / bridge graph with known min-cut = 2 (or 1 depending on bridge)
  // Two triangles connected by 2 bridge edges
  // Triangle 1: 0-1, 1-2, 2-0
  // Triangle 2: 3-4, 4-5, 5-3
  // Bridges: 1-3, 2-4 (min-cut = 2)
  const defaultEdges: [string, string][] = [
    ['0', '1'],
    ['1', '2'],
    ['2', '0'],
    ['3', '4'],
    ['4', '5'],
    ['5', '3'],
    ['1', '3'],
    ['2', '4'],
  ];

  const rawEdges = inputs.edgeList && inputs.edgeList.length > 0 ? inputs.edgeList : defaultEdges;

  // Collect unique node IDs
  const nodeSet = new Set<string>();
  for (const [u, v] of rawEdges) {
    nodeSet.add(u);
    nodeSet.add(v);
  }

  const origNodeIds = Array.from(nodeSet).sort((a, b) => parseInt(a) - parseInt(b));
  const n = origNodeIds.length;
  const rand = typeof inputs.seed === 'number' && Number.isFinite(inputs.seed) ? seededRandom(inputs.seed) : Math.random;
  const trials = Math.max(1, Math.min(500, Math.floor(Number(inputs.trials) || 1)));

  // Circular layout coordinates for initial nodes
  const svgWidth = 600;
  const svgHeight = 380;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = Math.min(centerX, centerY) - 55;

  let currentNodes: GraphNode[] = origNodeIds.map((id, idx) => {
    const angle = (idx / n) * 2 * Math.PI - Math.PI / 2;
    return {
      id,
      label: `V${parseInt(id) + 1}`,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  // Track original members inside each super-node
  const superNodeMembers: Record<string, string[]> = {};
  for (const nd of currentNodes) {
    superNodeMembers[nd.id] = [nd.label];
  }

  // Edge multiset: list of { u, v, weight } where weight represents multi-edge count
  let currentEdges: GraphEdge[] = rawEdges.map(([u, v]) => ({
    u: u < v ? u : v,
    v: u < v ? v : u,
    weight: 1,
  }));

  // Consolidate parallel edges initially
  const consolidateEdges = (edges: GraphEdge[]): GraphEdge[] => {
    const map = new Map<string, number>();
    for (const e of edges) {
      const u = e.u < e.v ? e.u : e.v;
      const v = e.u < e.v ? e.v : e.u;
      if (u === v) continue; // remove self-loops
      const key = `${u}---${v}`;
      map.set(key, (map.get(key) || 0) + (e.weight || 1));
    }
    const res: GraphEdge[] = [];
    for (const [key, w] of map.entries()) {
      const [u, v] = key.split('---');
      res.push({ u, v, weight: w });
    }
    return res;
  };

  currentEdges = consolidateEdges(currentEdges);

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Karger’s Min-Cut Algorithm',
    description: `Loaded graph with ${currentNodes.length} vertices and ${currentEdges.reduce((s, e) => s + e.weight, 0)} edges. Contraction loop will repeatedly pick a random edge and contract its endpoints until exactly 2 super-nodes remain.`,
    codeLine: 1,
    state: {
      nodes: [...currentNodes],
      edges: [...currentEdges],
      superNodeMembers: { ...superNodeMembers },
      phase: 'init',
    },
    highlights: {},
    metrics: { comparisons, iterations, custom: { superNodes: currentNodes.length } },
  };

  // Contract until exactly 2 nodes remain
  while (currentNodes.length > 2) {
    iterations++;

    // Expand edges into flat array weighted by multiplicity for uniform random selection
    const flatEdges: { u: string; v: string }[] = [];
    for (const e of currentEdges) {
      for (let w = 0; w < e.weight; w++) {
        flatEdges.push({ u: e.u, v: e.v });
      }
    }

    if (flatEdges.length === 0) break;

    // Pick edge uniformly at random
    const randomIdx = Math.floor(rand() * flatEdges.length);
    const pickedEdge = flatEdges[randomIdx];

    const uNode = currentNodes.find((n) => n.id === pickedEdge.u)!;
    const vNode = currentNodes.find((n) => n.id === pickedEdge.v)!;

    yield {
      stepIndex: stepIndex++,
      title: `Random Edge Selected for Contraction: (${uNode.label}, ${vNode.label})`,
      description: `Randomly chose edge connecting super-nodes ${uNode.label} and ${vNode.label} from ${flatEdges.length} multigraph edges.`,
      codeLine: [2, 3],
      state: {
        nodes: [...currentNodes],
        edges: [...currentEdges],
        currentContractedEdge: {
          u: pickedEdge.u,
          v: pickedEdge.v,
          uLabel: uNode.label,
          vLabel: vNode.label,
        },
        superNodeMembers: { ...superNodeMembers },
        phase: 'pick_edge',
      },
      highlights: {
        nodes: [pickedEdge.u, pickedEdge.v],
        edges: [{ u: pickedEdge.u, v: pickedEdge.v, status: 'active' }],
      },
      metrics: { comparisons, iterations, custom: { superNodes: currentNodes.length } },
    };

    // Contract: merge vNode into uNode
    const mergedId = uNode.id;
    const mergedLabel = `${uNode.label}+${vNode.label}`;
    const mergedX = ((uNode.x || centerX) + (vNode.x || centerX)) / 2;
    const mergedY = ((uNode.y || centerY) + (vNode.y || centerY)) / 2;

    superNodeMembers[mergedId] = [
      ...(superNodeMembers[uNode.id] || [uNode.label]),
      ...(superNodeMembers[vNode.id] || [vNode.label]),
    ];
    delete superNodeMembers[vNode.id];

    // Rewire nodes list
    currentNodes = currentNodes
      .filter((n) => n.id !== vNode.id)
      .map((n) => {
        if (n.id === mergedId) {
          return { id: mergedId, label: mergedLabel, x: mergedX, y: mergedY };
        }
        return n;
      });

    // Rewire edges: any edge with vNode.id becomes mergedId
    const rewiredEdges: GraphEdge[] = [];
    for (const e of currentEdges) {
      let u = e.u === vNode.id ? mergedId : e.u;
      let v = e.v === vNode.id ? mergedId : e.v;
      if (u !== v) {
        rewiredEdges.push({ u, v, weight: e.weight });
      }
    }

    currentEdges = consolidateEdges(rewiredEdges);

    yield {
      stepIndex: stepIndex++,
      title: `Contract Edge: Merge into Super-Node {${mergedLabel}}`,
      description: `Contracted edge (${uNode.label}, ${vNode.label}). Removed self-loops between them. Multi-edges to remaining nodes preserved. Remaining super-nodes: ${currentNodes.length}.`,
      codeLine: [4, 5, 6],
      state: {
        nodes: [...currentNodes],
        edges: [...currentEdges],
        currentContractedEdge: {
          u: mergedId,
          v: mergedId,
          uLabel: mergedLabel,
          vLabel: mergedLabel,
        },
        superNodeMembers: { ...superNodeMembers },
        phase: 'contract',
      },
      highlights: {
        activeNode: mergedId,
      },
      metrics: { comparisons, iterations, custom: { superNodes: currentNodes.length } },
    };
  }

  // Exactly 2 super-nodes remain!
  const nodeA = currentNodes[0];
  const nodeB = currentNodes[1];
  const cutSetA = superNodeMembers[nodeA.id] || [nodeA.label];
  const cutSetB = superNodeMembers[nodeB.id] || [nodeB.label];

  const cutEdges = currentEdges.filter(
    (e) => (e.u === nodeA.id && e.v === nodeB.id) || (e.u === nodeB.id && e.v === nodeA.id)
  );
  const cutSize = cutEdges.reduce((s, e) => s + (e.weight || 1), 0);

  // Repeat the contraction (trials - 1) more times without animation and keep the smallest cut.
  const labelOf = (id: string) => `V${parseInt(id) + 1}`;
  let bestCutSize = cutSize;
  let bestSides = { sideA: cutSetA, sideB: cutSetB };
  for (let t = 1; t < trials; t++) {
    const run = contractOnce(origNodeIds, rawEdges, rand);
    if (run.cutSize < bestCutSize) {
      bestCutSize = run.cutSize;
      bestSides = { sideA: run.sideA.map(labelOf), sideB: run.sideB.map(labelOf) };
    }
  }

  const trueMinCut = exactMinCut(origNodeIds, rawEdges);
  const pSingle = n >= 2 ? 2 / (n * (n - 1)) : 1;
  const pAll = 1 - Math.pow(1 - pSingle, trials);
  const thisRunIsMinimum = trueMinCut === null ? null : cutSize === trueMinCut;
  const bestIsMinimum = trueMinCut === null ? null : bestCutSize === trueMinCut;

  const runSentence = `This run ended with super-nodes A = {${cutSetA.join(', ')}} and B = {${cutSetB.join(', ')}}, a cut crossed by ${cutSize} edge(s). One run is only a candidate: it finds a minimum cut with probability at least 2 / (n(n − 1)) = ${pSingle.toFixed(3)}.`;
  const repeatSentence =
    trials > 1
      ? ` Across ${trials} independent runs (including this one), the smallest cut found has size ${bestCutSize}; the chance that ${trials} runs all miss a minimum cut is at most ${(1 - pAll).toFixed(3)}.`
      : ' Repeating the run and keeping the smallest cut makes finding the minimum increasingly likely.';
  const truthSentence =
    trueMinCut === null
      ? ''
      : ` Checking every partition shows the true minimum cut has size ${trueMinCut}: ${
          thisRunIsMinimum ? 'this run found a minimum cut' : 'this run did not find it'
        }${trials > 1 ? (bestIsMinimum ? ', and the best of all runs did.' : ', and neither did the best of all runs.') : '.'}`;

  yield {
    stepIndex: stepIndex++,
    title: `Contraction Finished: This Run’s Cut Has Size ${cutSize}`,
    description: runSentence + repeatSentence + truthSentence,
    codeLine: 7,
    state: {
      nodes: [...currentNodes],
      edges: [...currentEdges],
      superNodeMembers: { ...superNodeMembers },
      cutSetA,
      cutSetB,
      cutEdges,
      cutSize,
      phase: 'complete',
    },
    highlights: {
      nodes: [nodeA.id, nodeB.id],
      edges: cutEdges.map((e) => ({ u: e.u, v: e.v, status: 'cover' })),
    },
    metrics: { comparisons, iterations, custom: { superNodes: 2, cutSize, bestCutSize, trials } },
    isFinal: true,
    result: {
      cutSize,
      cutSetA,
      cutSetB,
      partition: `A = {${cutSetA.join(', ')}} | B = {${cutSetB.join(', ')}}`,
      multiEdgesBetween: cutSize,
      trials,
      bestCutSize,
      bestPartition: `A = {${bestSides.sideA.join(', ')}} | B = {${bestSides.sideB.join(', ')}}`,
      trueMinCutSize: trueMinCut,
      thisRunIsMinimum,
      bestIsMinimum,
      successProbabilityBound: `One run ≥ 2 / (n(n − 1)) = ${pSingle.toFixed(3)}; ${trials} run(s) ≥ ${pAll.toFixed(3)}`,
    },
  };
}
