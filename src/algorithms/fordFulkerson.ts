import { AlgorithmStep } from '../types/algorithm';
import { AugmentingPathState, FlowInputs, createFlowNetwork, describeAugment } from './flowSearch';

export type FordFulkersonState = AugmentingPathState;

/**
 * Ford-Fulkerson with depth-first search: each search walks one route as deep as it can,
 * backs up from dead ends, and uses the first route that reaches the sink. The stack of
 * vertices walked is the augmenting path itself.
 */
export function* fordFulkersonSteps(inputs: FlowInputs): Generator<AlgorithmStep<FordFulkersonState>> {
  const net = createFlowNetwork(
    { capacities: inputs.capacities, source: inputs.source, sink: inputs.sink, nodeLabels: inputs.nodeLabels },
    'dfs',
  );
  const { n, s, t, label, search } = net;

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;
  const metrics = () => ({ comparisons, iterations });
  // 'moves' hides the looks that lead nowhere (full pipes, visited vertices) and mentions them in the next move.
  const everyLook = inputs.searchDetail !== 'moves';
  const skipped: string[] = [];
  const skippedNote = () => {
    if (!skipped.length) return '';
    const note = ` (Skipped on the way: ${skipped.join('; ')}.)`;
    skipped.length = 0;
    return note;
  };

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Flow Network',
    description: `Flow starts at the source ${label(s)} and must reach the sink ${label(t)}. Each pipe (edge) carries at most its capacity, and every flow starts at 0. Plan: search for a route from ${label(s)} to ${label(t)} that still has room, push as much as it can carry, and repeat. Ford-Fulkerson lets any search find the route; this page uses depth-first search (DFS): follow one route as far as it goes, and back up only at a dead end.`,
    codeLine: 2,
    state: net.snapshot('dfs_explore'),
    highlights: { activeNode: `${s}` },
    metrics: metrics(),
  };

  // DFS(u) frames: the vertex and the next neighbour to look at.
  type Frame = { u: number; next: number };

  while (true) {
    iterations++;
    net.resetSearch();
    search.current = `${s}`;
    const frames: Frame[] = [{ u: s, next: 0 }];

    yield {
      stepIndex: stepIndex++,
      title: `DFS Search ${search.round}: Start at ${label(s)}`,
      description:
        search.round === 1
          ? `Start a depth-first search at ${label(s)}. The stack holds the route walked so far: just [${label(s)}]. At each vertex, try its pipes in order and go deeper along the first one that still has room.`
          : `Start search ${search.round} from ${label(s)} with a fresh stack [${label(s)}]. The flow has changed, so pipes that were free may now be full, and pipes carrying flow now also offer a reverse edge (flow that could be sent back).`,
      codeLine: [3, 10],
      state: net.snapshot('dfs_explore'),
      highlights: { activeNode: `${s}` },
      metrics: metrics(),
    };

    let path: number[] | null = null;

    while (frames.length > 0) {
      const top = frames[frames.length - 1];
      const u = top.u;

      // Next vertex joined to u by a pipe in either direction (a possible residual edge).
      let v = top.next;
      while (v < n && !net.linked(u, v)) v++;

      if (v >= n) {
        // Every way out of u has been tried: u is a dead end, back up.
        frames.pop();
        search.frontier.pop();
        search.probe = undefined;
        if (u === s) break;
        search.deadEnds.push(`${u}`);
        search.event = 'backtrack';
        search.backtrackFrom = `${u}`;
        const back = frames[frames.length - 1].u;
        search.current = `${back}`;
        yield {
          stepIndex: stepIndex++,
          title: `DFS: Dead End at ${label(u)}, Back Up to ${label(back)}`,
          description: `Every pipe out of ${label(u)} is full or leads somewhere already tried, so no route to ${label(t)} continues from here. Pop ${label(u)} off the stack and go back to ${label(back)} to try its next pipe. Stack: [${search.frontier.map(label).join(', ')}].${skippedNote()}`,
          codeLine: 16,
          state: net.snapshot('dfs_explore'),
          highlights: {
            activeNode: `${back}`,
            prunedNodes: [...search.deadEnds],
            edges: [{ u: `${back}`, v: `${u}`, status: 'visited' }],
          },
          metrics: metrics(),
        };
        continue;
      }

      top.next = v + 1;
      comparisons++;
      const room = net.room(u, v);
      // A pair with no pipe u → v and nothing to send back is not in the residual graph at all.
      if (room === 0 && !(net.cap[u][v] > 0)) continue;

      if (room === 0 && !everyLook) {
        skipped.push(`${net.hopText(u, v)} is full`);
        continue;
      }
      if (room === 0) {
        search.probe = net.probeOf(u, v, 'full');
        yield {
          stepIndex: stepIndex++,
          title: `DFS: Pipe ${net.hopText(u, v)} Is Full`,
          description: `Look along ${net.hopText(u, v)}: it already carries its full capacity ${net.cap[u][v]}, and nothing flows the other way that could be sent back. No room, so skip it and try the next pipe out of ${label(u)}.`,
          codeLine: 14,
          state: net.snapshot('dfs_explore'),
          highlights: { activeNode: `${u}`, edges: [{ u: `${u}`, v: `${v}`, status: 'residual' }] },
          metrics: metrics(),
        };
        continue;
      }

      if (search.visited.includes(`${v}`) && !everyLook) {
        skipped.push(`${label(v)} already visited`);
        continue;
      }
      if (search.visited.includes(`${v}`)) {
        search.probe = net.probeOf(u, v, 'seen');
        const why = search.frontier.includes(`${v}`)
          ? `${label(v)} is already on the stack (going there would walk in a circle)`
          : `${label(v)} was already explored in this search and was a dead end`;
        yield {
          stepIndex: stepIndex++,
          title: `DFS: ${label(v)} Already Visited`,
          description: `${net.hopText(u, v)} has room, but ${why}. Skip it.`,
          codeLine: 14,
          state: net.snapshot('dfs_explore'),
          highlights: { activeNode: `${u}`, edges: [{ u: `${u}`, v: `${v}`, status: 'visited' }] },
          metrics: metrics(),
        };
        continue;
      }

      // Room and not visited: go deeper.
      search.probe = net.probeOf(u, v, 'take');
      search.visited.push(`${v}`);
      search.parent[`${v}`] = `${u}`;
      search.depth[`${v}`] = search.depth[`${u}`] + 1;
      search.frontier.push(`${v}`);
      search.current = `${v}`;
      frames.push({ u: v, next: 0 });
      const roomWords = net.roomText(search.probe);

      if (v === t) {
        search.reachedSink = true;
        path = search.frontier.map(Number);
        yield {
          stepIndex: stepIndex++,
          title: `DFS: Reached ${label(t)} via ${net.hopText(u, v)}`,
          description: `${net.hopText(u, v)}: ${roomWords}. That reaches the sink ${label(t)}, so the search stops here. The stack is the route: ${path.map(label).join(' → ')}. DFS took the first route it could finish, not necessarily the shortest one.${skippedNote()}`,
          codeLine: [11, 15],
          state: net.snapshot('dfs_explore'),
          highlights: { activeNode: `${t}`, nodes: search.frontier, edges: [{ u: `${u}`, v: `${v}`, status: 'active' }] },
          metrics: metrics(),
        };
        break;
      }

      yield {
        stepIndex: stepIndex++,
        title: `DFS: Go Deeper ${net.hopText(u, v)}`,
        description: `${net.hopText(u, v)}: ${roomWords}. ${label(v)} is new, so push it on the stack and carry on from ${label(v)} before trying any other pipe out of ${label(u)}. Stack: [${search.frontier.map(label).join(', ')}].${skippedNote()}`,
        codeLine: [14, 15],
        state: net.snapshot('dfs_explore'),
        highlights: { activeNode: `${v}`, nodes: search.frontier, edges: [{ u: `${u}`, v: `${v}`, status: 'active' }] },
        metrics: metrics(),
      };
    }

    if (!path) {
      search.current = undefined;
      search.event = 'stuck';
      const cut = net.minCut();
      yield {
        stepIndex: stepIndex++,
        title: `DFS Search ${search.round}: ${label(t)} Unreachable`,
        description: `The search backed all the way up to ${label(s)} without reaching ${label(t)}. From ${label(s)} only ${cut.reachable.map(label).join(', ')} can still be reached; every pipe leading out of that group is full (${cut.edges.map((e) => `${net.hopText(Number(e.u), Number(e.v))} ${e.capacity}`).join(', ')}). No augmenting path is left.`,
        codeLine: 17,
        state: net.snapshot('dfs_explore', { minCut: cut }),
        highlights: { nodes: cut.reachable, edges: cut.edges.map((e) => ({ u: e.u, v: e.v, status: 'conflict' as const })) },
        metrics: metrics(),
      };
      break;
    }

    const pathIds = path.map(String);
    const pathText = path.map(label).join(' → ');
    const { bottleneck, edge } = net.bottleneckOf(path);
    const reverse = net.reverseHops(path);
    const pathEdges = path.slice(0, -1).map((u, i) => ({ u: `${u}`, v: `${path![i + 1]}` }));

    yield {
      stepIndex: stepIndex++,
      title: `Augmenting Path Found: ${pathText}`,
      description: `DFS found a path from ${label(s)} to ${label(t)} where every hop still has room (an augmenting path). A path can only carry as much as its narrowest hop, so its bottleneck is ${bottleneck} (on ${net.hopText(Number(edge.u), Number(edge.v))}).${
        reverse.length
          ? ` Note: ${reverse.map(([a, b]) => net.hopText(a, b)).join(', ')} ${reverse.length > 1 ? 'are reverse edges' : 'is a reverse edge'}: it sends earlier flow back instead of using a free pipe.`
          : ''
      }`,
      codeLine: [3, 4],
      state: net.snapshot('path_found', { currentAugmentingPath: pathIds, bottleneckCapacity: bottleneck, bottleneckEdge: edge }),
      highlights: { nodes: pathIds, edges: pathEdges.map((e) => ({ ...e, status: 'active' as const })) },
      metrics: metrics(),
    };

    const log = net.augment(path, bottleneck);

    yield {
      stepIndex: stepIndex++,
      title: `Augmented Flow by +${bottleneck} (Total Flow: ${net.totalFlow})`,
      description: `Push ${bottleneck} more along ${pathText}: each hop now has ${bottleneck} less room going forward, and the same amount more room on its reverse edge, so a later search may send it back if that helps.${describeAugment(net, log)} Total flow: ${net.totalFlow}.`,
      codeLine: [5, 6, 7, 8],
      state: net.snapshot('augment', { currentAugmentingPath: pathIds, bottleneckCapacity: bottleneck, augmentLog: log }),
      highlights: { nodes: pathIds, edges: pathEdges.map((e) => ({ ...e, status: 'flow' as const })) },
      metrics: metrics(),
    };
  }

  const cut = net.minCut();
  yield {
    stepIndex: stepIndex++,
    title: 'Ford-Fulkerson Complete',
    description: `No path from ${label(s)} to ${label(t)} has room left: every route is blocked by at least one full pipe. The flow cannot grow any more, so the maximum flow is ${net.totalFlow}, found with ${net.pathHistory.length} augmenting path${net.pathHistory.length === 1 ? '' : 's'}.`,
    codeLine: 9,
    state: net.snapshot('complete', { minCut: cut }),
    highlights: {},
    metrics: metrics(),
    isFinal: true,
    result: {
      maxFlow: net.totalFlow,
      source: label(s),
      sink: label(t),
      augmentingPaths: net.pathHistory.length,
      edgesWithFlow: net.snapshot('complete').edges.filter((e) => (e.flow || 0) > 0),
    },
  };
}
