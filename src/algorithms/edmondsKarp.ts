import { AlgorithmStep } from '../types/algorithm';
import { AugmentingPathPhase, AugmentingPathState, FlowInputs, createFlowNetwork, describeAugment, minCutResult, minCutStepText } from './flowSearch';

export interface EdmondsKarpState extends AugmentingPathState {
  bfsQueue: string[];
  bfsVisited: string[];
  currentBfsNode?: string;
}

/**
 * Edmonds-Karp: Ford-Fulkerson where every augmenting path is found by breadth-first search.
 * The queue explores the residual graph in rings (1 edge from S, then 2, …), so the first time
 * T is discovered, following the parent links back gives a path with the fewest edges.
 */
export function* edmondsKarpSteps(inputs: FlowInputs): Generator<AlgorithmStep<EdmondsKarpState>> {
  const net = createFlowNetwork(
    { capacities: inputs.capacities, source: inputs.source, sink: inputs.sink, nodeLabels: inputs.nodeLabels },
    'bfs',
  );
  const { n, s, t, label, search } = net;

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;
  const metrics = () => ({ comparisons, iterations });
  // 'moves' hides the looks that lead nowhere (full pipes, vertices already found) and mentions them in the next step.
  const everyLook = inputs.searchDetail !== 'moves';
  const skipped: string[] = [];
  const skippedNote = () => {
    if (!skipped.length) return '';
    const note = ` (Skipped: ${skipped.join('; ')}.)`;
    skipped.length = 0;
    return note;
  };
  const snap = (phase: AugmentingPathPhase, extra: Partial<AugmentingPathState> = {}): EdmondsKarpState => ({
    ...net.snapshot(phase, extra),
    bfsQueue: [...search.frontier],
    bfsVisited: [...search.visited],
    currentBfsNode: search.current,
  });
  const queueText = () => `[${search.frontier.map(label).join(', ') || 'empty'}]`;

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Edmonds-Karp Network',
    description: `Same goal as Ford-Fulkerson: send as much flow as possible from ${label(s)} to ${label(t)}. Edmonds-Karp always uses the path with the fewest pipes, found by breadth-first search (BFS): explore the network in rings, closest vertices first. This choice guarantees it finishes quickly.`,
    codeLine: [1, 2],
    state: snap('bfs_explore'),
    highlights: { activeNode: `${s}` },
    metrics: metrics(),
  };

  while (true) {
    iterations++;
    net.resetSearch();
    const queue: number[] = [s];

    yield {
      stepIndex: stepIndex++,
      title: `BFS Search ${search.round}: Queue [${label(s)}]`,
      description:
        search.round === 1
          ? `Start a breadth-first search at ${label(s)}: the queue holds [${label(s)}], and ${label(s)} is ring 0. Vertices leave the queue from the front and newly found ones join at the back, so everything 1 pipe away is explored before anything 2 pipes away.`
          : `Start search ${search.round} from ${label(s)} with a fresh queue [${label(s)}]. The flow has changed: some pipes are now full, and pipes carrying flow now also offer a reverse edge (flow that could be sent back).`,
      codeLine: [3, 10],
      state: snap('bfs_explore'),
      highlights: { activeNode: `${s}` },
      metrics: metrics(),
    };

    let found = false;

    while (queue.length > 0 && !found) {
      const u = queue.shift()!;
      search.frontier.shift();
      search.current = `${u}`;
      search.probe = undefined;
      search.event = 'dequeue';

      yield {
        stepIndex: stepIndex++,
        title: `BFS Frontier: Dequeue ${label(u)}`,
        description: `${
          u === s
            ? `Take ${label(s)} from the queue.`
            : `Take ${label(u)} (ring ${search.depth[`${u}`]}) from the front of the queue: it was found earliest, so it is among the closest to ${label(s)}.`
        } Now look along every residual edge out of ${label(u)}. Still waiting in the queue: ${queueText()}.${skippedNote()}`,
        codeLine: [11, 12],
        state: snap('bfs_explore'),
        highlights: { activeNode: `${u}` },
        metrics: metrics(),
      };

      for (let v = 0; v < n; v++) {
        // Only vertices joined to u by a pipe in either direction can have a residual edge from u.
        if (!net.linked(u, v)) continue;
        comparisons++;
        const room = net.room(u, v);
        // No pipe u → v and nothing to send back: this edge is not in the residual graph.
        if (room === 0 && !(net.cap[u][v] > 0)) continue;

        if (room === 0) {
          if (!everyLook) {
            skipped.push(`${net.hopText(u, v)} is full`);
            continue;
          }
          search.probe = net.probeOf(u, v, 'full');
          yield {
            stepIndex: stepIndex++,
            title: `BFS: Pipe ${net.hopText(u, v)} Is Full`,
            description: `Look along ${net.hopText(u, v)}: it already carries its full capacity ${net.cap[u][v]}, and nothing flows the other way that could be sent back. No room, so ${label(v)} cannot be reached this way.`,
            codeLine: 13,
            state: snap('bfs_explore'),
            highlights: { activeNode: `${u}`, edges: [{ u: `${u}`, v: `${v}`, status: 'residual' }] },
            metrics: metrics(),
          };
          continue;
        }

        if (search.visited.includes(`${v}`)) {
          if (!everyLook) {
            skipped.push(`${label(v)} already found`);
            continue;
          }
          search.probe = net.probeOf(u, v, 'seen');
          yield {
            stepIndex: stepIndex++,
            title: `BFS: ${label(v)} Already Found`,
            description: `${net.hopText(u, v)} has room, but ${label(v)} was already found (ring ${search.depth[`${v}`]}) by a route at least as short. BFS keeps the first way it found each vertex, so skip it.`,
            codeLine: 13,
            state: snap('bfs_explore'),
            highlights: { activeNode: `${u}`, edges: [{ u: `${u}`, v: `${v}`, status: 'visited' }] },
            metrics: metrics(),
          };
          continue;
        }

        search.probe = net.probeOf(u, v, 'take');
        search.visited.push(`${v}`);
        search.parent[`${v}`] = `${u}`;
        search.depth[`${v}`] = search.depth[`${u}`] + 1;
        search.frontier.push(`${v}`);
        queue.push(v);
        const roomWords = net.roomText(search.probe);

        if (v === t) {
          found = true;
          yield {
            stepIndex: stepIndex++,
            title: `BFS: Found ${label(t)} via ${net.hopText(u, v)} (Ring ${search.depth[`${v}`]})`,
            description: `${net.hopText(u, v)}: ${roomWords}. The sink ${label(t)} is found in ring ${search.depth[`${v}`]}, so no route to it can use fewer pipes. Stop the search.${skippedNote()}`,
            codeLine: [14, 15],
            state: snap('bfs_explore'),
            highlights: { activeNode: `${t}`, edges: [{ u: `${u}`, v: `${v}`, status: 'active' }] },
            metrics: metrics(),
          };
          break;
        }

        yield {
          stepIndex: stepIndex++,
          title: `BFS: Discover ${label(v)} via ${net.hopText(u, v)} (Ring ${search.depth[`${v}`]})`,
          description: `${net.hopText(u, v)}: ${roomWords}. ${label(v)} is new: remember that it was reached from ${label(u)} (its parent), mark it as ring ${search.depth[`${v}`]}, and add it to the back of the queue: ${queueText()}.${skippedNote()}`,
          codeLine: 14,
          state: snap('bfs_explore'),
          highlights: { activeNode: `${u}`, edges: [{ u: `${u}`, v: `${v}`, status: 'active' }] },
          metrics: metrics(),
        };
      }
    }

    if (!found) {
      search.current = undefined;
      search.event = 'stuck';
      search.probe = undefined;
      const cut = net.minCut();
      yield {
        stepIndex: stepIndex++,
        title: `BFS Search ${search.round}: ${label(t)} Unreachable`,
        description: `The queue is empty and ${label(t)} was never found.${skippedNote()} From ${label(s)} only ${cut.reachable.map(label).join(', ')} can be reached; every pipe leading out of that group is full (${cut.edges.map((e) => `${net.hopText(Number(e.u), Number(e.v))} ${e.capacity}`).join(', ')}). No augmenting path is left. The vertices it did reach become side S of a cut.`,
        codeLine: 16,
        state: snap('bfs_explore', { minCut: cut }),
        highlights: { nodes: cut.reachable, edges: cut.edges.map((e) => ({ u: e.u, v: e.v, status: 'conflict' as const })) },
        metrics: metrics(),
      };
      break;
    }

    // Follow the parent links back from T to S.
    const path: number[] = [t];
    while (path[0] !== s) path.unshift(Number(search.parent[`${path[0]}`]));
    search.trace = [...path].reverse().map(String);
    search.event = 'trace';
    search.probe = undefined;
    search.current = `${t}`;
    const pathIds = path.map(String);
    const pathText = path.map(label).join(' → ');
    const pathEdges = path.slice(0, -1).map((u, i) => ({ u: `${u}`, v: `${path[i + 1]}` }));

    yield {
      stepIndex: stepIndex++,
      title: `BFS: Trace Parents Back from ${label(t)}`,
      description: `Follow the parent links back: ${[...path]
        .reverse()
        .map(label)
        .join(' ← ')}. Each vertex remembers which vertex found it, so walking back from ${label(t)} ends at ${label(s)}. Read forwards, the path is ${pathText}, with ${path.length - 1} pipes: the fewest possible.`,
      codeLine: 15,
      state: snap('bfs_explore'),
      highlights: { nodes: pathIds, edges: pathEdges.map((e) => ({ ...e, status: 'visited' as const })) },
      metrics: metrics(),
    };

    const { bottleneck, edge } = net.bottleneckOf(path);
    const reverse = net.reverseHops(path);

    yield {
      stepIndex: stepIndex++,
      title: `Shortest Augmenting Path Discovered: ${pathText}`,
      description: `BFS reached the sink ${label(t)}, so this is a path with the fewest pipes (${path.length - 1}). Its narrowest hop (${net.hopText(Number(edge.u), Number(edge.v))}) has room for ${bottleneck}: that is the bottleneck.${
        reverse.length
          ? ` Note: ${reverse.map(([a, b]) => net.hopText(a, b)).join(', ')} ${reverse.length > 1 ? 'are reverse edges' : 'is a reverse edge'}: it sends earlier flow back instead of using a free pipe.`
          : ''
      }`,
      codeLine: [3, 4],
      state: snap('path_found', { currentAugmentingPath: pathIds, bottleneckCapacity: bottleneck, bottleneckEdge: edge }),
      highlights: { nodes: pathIds, edges: pathEdges.map((e) => ({ ...e, status: 'active' as const })) },
      metrics: metrics(),
    };

    const log = net.augment(path, bottleneck);

    yield {
      stepIndex: stepIndex++,
      title: `Augment Residual Flow +${bottleneck} (Total Flow: ${net.totalFlow})`,
      description: `Push ${bottleneck} along ${pathText}, and add the same amount of reverse room on each hop so it can be undone later if needed.${describeAugment(net, log)} Total flow is now ${net.totalFlow}.`,
      codeLine: [5, 6],
      state: snap('augment', { currentAugmentingPath: pathIds, bottleneckCapacity: bottleneck, augmentLog: log }),
      highlights: { nodes: pathIds, edges: pathEdges.map((e) => ({ ...e, status: 'flow' as const })) },
      metrics: metrics(),
    };
  }

  const cut = net.minCut();
  const cutStep = minCutStepText(net, cut, 'BFS');
  yield {
    stepIndex: stepIndex++,
    title: cutStep.title,
    description: cutStep.description,
    codeLine: 7,
    state: snap('complete', { minCut: cut }),
    highlights: cutStep.highlights,
    metrics: metrics(),
  };

  yield {
    stepIndex: stepIndex++,
    title: 'Edmonds-Karp Complete: Maximum Flow Found',
    description: `BFS can no longer reach ${label(t)}: every route is blocked by a full pipe. The maximum flow is ${net.totalFlow}, found with ${net.pathHistory.length} shortest augmenting path${net.pathHistory.length === 1 ? '' : 's'}. It equals the capacity of the minimum cut, ${cut.capacity}.`,
    codeLine: 8,
    state: snap('complete', { minCut: cut }),
    highlights: {},
    metrics: metrics(),
    isFinal: true,
    result: {
      maxFlow: net.totalFlow,
      source: label(s),
      sink: label(t),
      augmentingPaths: net.pathHistory.length,
      edgesWithFlow: net.snapshot('complete').edges.filter((e) => (e.flow || 0) > 0),
      ...minCutResult(net, cut),
    },
  };
}
