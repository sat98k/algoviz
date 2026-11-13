import { GraphNode, GraphEdge } from './floydWarshall';

/**
 * Shared bookkeeping for the augmenting-path max-flow algorithms (Ford-Fulkerson with DFS,
 * Edmonds-Karp with BFS). Each algorithm file runs its own search loop and yields its own
 * steps; this module keeps the network, the residual graph and the step snapshots in one place
 * so both pages show the same picture.
 *
 * Flow is stored per real pipe and is never negative. The residual graph has, for every pipe
 * u → v, a forward edge (room = capacity − flow) and a reverse edge v → u (room = flow, i.e.
 * how much of the flow could be sent back). When both u → v and v → u are real pipes, the room
 * from u to v is the sum of both parts, and a push uses the "undo" part first.
 */

export type SearchKind = 'bfs' | 'dfs';
export type ProbeVerdict = 'take' | 'full' | 'seen';

/** One look along a residual edge during the search. */
export interface SearchProbe {
  u: string;
  v: string;
  /** Total residual room from u to v. */
  room: number;
  /** Room left in the real pipe u → v (0 when there is no such pipe). */
  forwardRoom: number;
  /** Flow on the pipe v → u that could be sent back (the reverse edge). */
  undoRoom: number;
  verdict: ProbeVerdict;
}

export interface FlowSearchState {
  kind: SearchKind;
  /** Which search this is (1 = the first augmenting-path search). */
  round: number;
  /** BFS: the queue, front first. DFS: the stack, bottom (S) first, which is the route walked so far. */
  frontier: string[];
  /** Every vertex found so far, in the order it was found. */
  visited: string[];
  /** How each found vertex was reached: parent[v] = u. */
  parent: Record<string, string>;
  /** BFS: number of edges from S (the ring). DFS: depth on the stack. */
  depth: Record<string, number>;
  /** The vertex being expanded (BFS: just dequeued; DFS: top of the stack). */
  current?: string;
  probe?: SearchProbe;
  /** DFS: vertices fully explored without reaching T (dead ends). */
  deadEnds: string[];
  /** BFS: the part of the path traced back from T so far (T first). */
  trace?: string[];
  reachedSink: boolean;
  /** What this step did in the search, so views can animate it. */
  event?: SearchEvent;
  /** DFS backtrack: the dead-end vertex just popped off the stack. */
  backtrackFrom?: string;
}

export type SearchEvent = 'start' | 'probe' | 'backtrack' | 'dequeue' | 'trace' | 'stuck';

export type ResidualKind = 'forward' | 'reverse';

/** An edge of the residual graph that has room. Reverse edges point against a pipe that carries flow. */
export interface ResidualEdge {
  u: string;
  v: string;
  room: number;
  kind: ResidualKind;
}

/** What one augmentation did to one hop of the path. */
export interface AugmentEntry {
  u: string;
  v: string;
  amount: number;
  /** Part sent back along the reverse edge (cancels flow on the pipe v → u). */
  undo: number;
  /** Part sent forward through the pipe u → v. */
  forward: number;
}

export interface PathRecord {
  path: string[];
  bottleneck: number;
  usesReverse: boolean;
}

export type AugmentingPathPhase = 'bfs_explore' | 'dfs_explore' | 'path_found' | 'augment' | 'complete';

export interface AugmentingPathState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: string;
  sink: string;
  currentAugmentingPath?: string[];
  bottleneckCapacity?: number;
  /** The hop whose room sets the bottleneck. */
  bottleneckEdge?: { u: string; v: string };
  totalMaxFlow: number;
  residualMatrix: number[][];
  flowMatrix: number[][];
  capacityMatrix: number[][];
  phase: AugmentingPathPhase;
  search: FlowSearchState;
  residualEdges: ResidualEdge[];
  augmentLog?: AugmentEntry[];
  pathHistory: PathRecord[];
  /** After the last search: the vertices S can still reach (one side of a minimum cut). */
  minCut?: MinCut;
}

/** A pipe crossing the cut. */
export interface CutEdge {
  u: string;
  v: string;
  capacity: number;
  /** Flow on the pipe at the end: equal to its capacity for every S → T pipe of a minimum cut. */
  flow: number;
}

/**
 * The minimum s-t cut read off the final residual graph: side S is every vertex the source can still
 * reach through edges with room, side T is the rest. Its capacity (the S → T pipes) equals the max flow.
 */
export interface MinCut {
  /** Side S: the vertices reachable from the source in the final residual graph (the source first). */
  reachable: string[];
  /** Side T: every other vertex (the sink among them). */
  sinkSide: string[];
  /** Pipes from S to T. Their capacities add up to the cut capacity; every one is full. */
  edges: CutEdge[];
  /** Pipes from T back to S. They do not count toward the cut, and carry no flow at the end. */
  backEdges: CutEdge[];
  /** c(S, T): the sum of the capacities of the S → T pipes. */
  capacity: number;
}

export interface FlowInputs {
  capacities?: number[][];
  source?: number;
  sink?: number;
  nodeLabels?: string[];
  /** 'every' (default): one step for every edge the search looks at. 'moves': only the steps that move the search. */
  searchDetail?: 'every' | 'moves';
}

// Classic CLRS 6-node network (max flow = 23)
const DEFAULT_CAPACITIES = [
  [0, 16, 13, 0, 0, 0], // 0: Source (S)
  [0, 0, 10, 12, 0, 0], // 1: Node A
  [0, 4, 0, 0, 14, 0], // 2: Node B
  [0, 0, 9, 0, 0, 20], // 3: Node C
  [0, 0, 0, 7, 0, 4], // 4: Node D
  [0, 0, 0, 0, 0, 0], // 5: Sink (T)
];
const DEFAULT_LABELS = ['S', 'A', 'B', 'C', 'D', 'T'];

export function createFlowNetwork(inputs: FlowInputs, kind: SearchKind) {
  const cap = inputs.capacities || DEFAULT_CAPACITIES;
  const n = cap.length;
  const s = inputs.source !== undefined ? inputs.source : 0;
  const t = inputs.sink !== undefined ? inputs.sink : n - 1;
  const labels = inputs.nodeLabels || DEFAULT_LABELS.slice(0, n);
  const nodes: GraphNode[] = Array.from({ length: n }, (_, i) => ({ id: `${i}`, label: labels[i] || `Node ${i}` }));
  const label = (i: number | string) => nodes[Number(i)]?.label ?? `${i}`;

  /** Flow on each real pipe (0 where there is no pipe). */
  const flow: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  const forwardRoom = (u: number, v: number) => Math.max(0, cap[u][v] - flow[u][v]);
  const undoRoom = (u: number, v: number) => flow[v][u];
  const room = (u: number, v: number) => forwardRoom(u, v) + undoRoom(u, v);
  /** u and v are joined by a pipe in either direction, so the residual graph may have an edge u → v. */
  const linked = (u: number, v: number) => u !== v && (cap[u][v] > 0 || cap[v][u] > 0);

  const search: FlowSearchState = {
    kind,
    round: 0,
    frontier: [],
    visited: [],
    parent: {},
    depth: {},
    deadEnds: [],
    reachedSink: false,
  };
  const pathHistory: PathRecord[] = [];
  let totalFlow = 0;

  /** Start a fresh search from S. */
  const resetSearch = () => {
    search.round++;
    search.frontier = [`${s}`];
    search.visited = [`${s}`];
    search.parent = {};
    search.depth = { [`${s}`]: 0 };
    search.current = undefined;
    search.probe = undefined;
    search.deadEnds = [];
    search.trace = undefined;
    search.reachedSink = false;
    search.event = 'start';
    search.backtrackFrom = undefined;
  };

  const probeOf = (u: number, v: number, verdict: ProbeVerdict): SearchProbe => {
    search.event = 'probe';
    search.backtrackFrom = undefined;
    return {
    u: `${u}`,
    v: `${v}`,
    room: room(u, v),
    forwardRoom: forwardRoom(u, v),
    undoRoom: undoRoom(u, v),
    verdict,
    };
  };

  const edges = (): GraphEdge[] => {
    const list: GraphEdge[] = [];
    for (let u = 0; u < n; u++)
      for (let v = 0; v < n; v++)
        if (cap[u][v] > 0) list.push({ u: `${u}`, v: `${v}`, weight: cap[u][v], capacity: cap[u][v], flow: flow[u][v] });
    return list;
  };

  const residualEdges = (): ResidualEdge[] => {
    const list: ResidualEdge[] = [];
    for (let u = 0; u < n; u++)
      for (let v = 0; v < n; v++) {
        if (cap[u][v] > 0 && forwardRoom(u, v) > 0) list.push({ u: `${u}`, v: `${v}`, room: forwardRoom(u, v), kind: 'forward' });
        if (flow[v][u] > 0) list.push({ u: `${u}`, v: `${v}`, room: flow[v][u], kind: 'reverse' });
      }
    return list;
  };

  const bottleneckOf = (path: number[]) => {
    let b = Infinity;
    let at = { u: `${path[0]}`, v: `${path[1]}` };
    for (let i = 0; i < path.length - 1; i++) {
      const r = room(path[i], path[i + 1]);
      if (r < b) {
        b = r;
        at = { u: `${path[i]}`, v: `${path[i + 1]}` };
      }
    }
    return { bottleneck: b, edge: at };
  };

  /** Hops of the path that send flow back along a reverse edge. */
  const reverseHops = (path: number[]) =>
    path.slice(0, -1).flatMap((u, i) => (undoRoom(u, path[i + 1]) > 0 ? [[u, path[i + 1]] as [number, number]] : []));

  /** Push `amount` along the path: undo flow on reverse edges first, then fill the pipes. */
  const augment = (path: number[], amount: number): AugmentEntry[] => {
    const usesReverse = path.slice(0, -1).some((u, i) => undoRoom(u, path[i + 1]) > 0);
    const log = path.slice(0, -1).map((u, i) => {
      const v = path[i + 1];
      const undo = Math.min(amount, flow[v][u]);
      flow[v][u] -= undo;
      const forward = amount - undo;
      flow[u][v] += forward;
      return { u: `${u}`, v: `${v}`, amount, undo, forward };
    });
    totalFlow += amount;
    pathHistory.push({ path: path.map(String), bottleneck: amount, usesReverse });
    return log;
  };

  /**
   * Side S = the vertices reachable from s through edges with room (its own residual search, so it
   * does not depend on how far the last search got); side T = the rest. Meant for after the last search.
   */
  const minCut = (): MinCut => {
    const reachable = [`${s}`];
    const inS = new Set(reachable);
    for (let i = 0; i < reachable.length; i++) {
      const u = Number(reachable[i]);
      for (let v = 0; v < n; v++)
        if (!inS.has(`${v}`) && linked(u, v) && room(u, v) > 0) {
          inS.add(`${v}`);
          reachable.push(`${v}`);
        }
    }
    // List each side in vertex order (the source first), so the sides read like the input.
    reachable.sort((a, b) => (a === `${s}` ? -1 : b === `${s}` ? 1 : Number(a) - Number(b)));
    const sinkSide = nodes.map((x) => x.id).filter((id) => !inS.has(id));
    const edges: CutEdge[] = [];
    const backEdges: CutEdge[] = [];
    for (let u = 0; u < n; u++)
      for (let v = 0; v < n; v++) {
        if (!(cap[u][v] > 0)) continue;
        const e = { u: `${u}`, v: `${v}`, capacity: cap[u][v], flow: flow[u][v] };
        if (inS.has(e.u) && !inS.has(e.v)) edges.push(e);
        else if (!inS.has(e.u) && inS.has(e.v)) backEdges.push(e);
      }
    return { reachable, sinkSide, edges, backEdges, capacity: edges.reduce((a, e) => a + e.capacity, 0) };
  };

  const snapshot = (phase: AugmentingPathPhase, extra: Partial<AugmentingPathState> = {}): AugmentingPathState => ({
    nodes,
    edges: edges(),
    source: `${s}`,
    sink: `${t}`,
    totalMaxFlow: totalFlow,
    residualMatrix: Array.from({ length: n }, (_, u) => Array.from({ length: n }, (_, v) => (u === v ? 0 : room(u, v)))),
    flowMatrix: flow.map((row) => [...row]),
    capacityMatrix: cap.map((row) => [...row]),
    phase,
    search: {
      ...search,
      frontier: [...search.frontier],
      visited: [...search.visited],
      parent: { ...search.parent },
      depth: { ...search.depth },
      deadEnds: [...search.deadEnds],
      trace: search.trace ? [...search.trace] : undefined,
      probe: search.probe ? { ...search.probe } : undefined,
    },
    residualEdges: residualEdges(),
    pathHistory: pathHistory.map((p) => ({ ...p, path: [...p.path] })),
    ...extra,
  });

  /** "A → C" for a hop, or "A → C (sending back B → A's flow)" for a reverse edge. */
  const hopText = (u: number, v: number) => `${label(u)} → ${label(v)}`;

  /** Plain words for the room on a residual edge, naming the reverse edge when it is used. */
  const roomText = (p: SearchProbe) => {
    const u = Number(p.u);
    const v = Number(p.v);
    if (p.undoRoom > 0 && p.forwardRoom > 0)
      return `room ${p.room}: ${p.forwardRoom} still free in the pipe ${hopText(u, v)}, plus ${p.undoRoom} of the flow in ${hopText(v, u)} that could be sent back (reverse edge)`;
    if (p.undoRoom > 0)
      return `there is no free pipe ${hopText(u, v)}, but ${hopText(v, u)} carries ${p.undoRoom}, so the reverse edge ${hopText(u, v)} has room ${p.undoRoom}: using it sends that flow back`;
    return `room ${p.room}`;
  };

  return {
    n,
    s,
    t,
    cap,
    nodes,
    label,
    flow,
    room,
    linked,
    search,
    pathHistory,
    get totalFlow() {
      return totalFlow;
    },
    resetSearch,
    probeOf,
    bottleneckOf,
    reverseHops,
    augment,
    minCut,
    snapshot,
    hopText,
    roomText,
  };
}

export type FlowNetwork = ReturnType<typeof createFlowNetwork>;

/**
 * The min-cut step both pages show after the last search: the S / T split, the S → T pipes and
 * their capacities, and the max-flow min-cut theorem (cut capacity = max flow).
 */
export function minCutStepText(net: FlowNetwork, cut: MinCut, search: 'DFS' | 'BFS') {
  const { label } = net;
  const side = (ids: string[]) => `{${ids.map(label).join(', ')}}`;
  const hop = (e: CutEdge) => net.hopText(Number(e.u), Number(e.v));
  const sum = cut.edges.length ? `${cut.edges.map((e) => e.capacity).join(' + ')} = ${cut.capacity}` : '0';
  const back = cut.backEdges.length
    ? ` Pipes from T back to S (${cut.backEdges.map(hop).join(', ')}) do not count toward the cut: they point the wrong way, and they carry 0 flow at the end.`
    : '';
  return {
    title: `Min Cut: S = ${side(cut.reachable)} | T = ${side(cut.sinkSide)}, Capacity ${cut.capacity} = Max Flow`,
    description: `Split the vertices in two. Side S is every vertex ${label(net.s)} can still reach through edges with room (exactly what the last ${search} found): ${side(cut.reachable)}. Side T is everything else, the sink ${label(net.t)} included: ${side(cut.sinkSide)}. This is an s-t cut. The pipes from S to T are ${cut.edges.map((e) => `${hop(e)} (${e.flow}/${e.capacity})`).join(', ')}, and every one is full; otherwise the search could have crossed it. Their capacities add up to c(S, T) = ${sum}.${back} All flow from ${label(net.s)} to ${label(net.t)} has to cross these pipes, so no flow can exceed ${cut.capacity}. Our flow is ${net.totalFlow}, so it is a maximum flow and this is a minimum cut (the max-flow min-cut theorem).`,
    highlights: {
      nodes: cut.reachable,
      edges: cut.edges.map((e) => ({ u: e.u, v: e.v, status: 'conflict' as const })),
    },
  };
}

/** Result fields describing the minimum cut, shared by both pages' final step. */
export function minCutResult(net: FlowNetwork, cut: MinCut) {
  return {
    minCutCapacity: cut.capacity,
    cutSourceSide: cut.reachable.map(net.label),
    cutSinkSide: cut.sinkSide.map(net.label),
    cutEdges: cut.edges.map((e) => ({ edge: net.hopText(Number(e.u), Number(e.v)), capacity: e.capacity })),
  };
}

/** The augment step's sentence: what happened on each hop, naming every reverse edge used. */
export function describeAugment(net: FlowNetwork, log: AugmentEntry[]): string {
  const undone = log.filter((e) => e.undo > 0);
  if (!undone.length) return '';
  return ` Reverse edge${undone.length > 1 ? 's' : ''} used: ${undone
    .map((e) => `${net.hopText(Number(e.u), Number(e.v))} sends ${e.undo} back, so the pipe ${net.hopText(Number(e.v), Number(e.u))} now carries ${e.undo} less`)
    .join('; ')}. That flow is rerouted instead of lost.`;
}
