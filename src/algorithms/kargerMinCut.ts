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

export function* kargerMinCutSteps(inputs: {
  numNodes?: number;
  edgeList?: [string, string][];
  seed?: number;
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
    const randomIdx = Math.floor(Math.random() * flatEdges.length);
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

  yield {
    stepIndex: stepIndex++,
    title: `Karger’s Min-Cut Complete: Cut Size = ${cutSize}`,
    description: `Contraction halted at 2 super-nodes. Partition: Cut Set A = {${cutSetA.join(', ')}}, Cut Set B = {${cutSetB.join(', ')}}. Total cut edges bridging the partition: ${cutSize}. (Multiple randomized runs amplify probability of finding the global minimum cut to >= 1 - 1/n).`,
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
    metrics: { comparisons, iterations, custom: { superNodes: 2, cutSize } },
    isFinal: true,
    result: {
      cutSize,
      cutSetA,
      cutSetB,
      partition: `A = {${cutSetA.join(', ')}} | B = {${cutSetB.join(', ')}}`,
      multiEdgesBetween: cutSize,
      successProbabilityBound: `Single run success ≥ 2 / (n · (n - 1)) = ${(2 / (n * (n - 1))).toFixed(3)}`,
    },
  };
}
