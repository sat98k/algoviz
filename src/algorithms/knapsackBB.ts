import { AlgorithmStep } from '../types/algorithm';

export interface BBNode {
  id: string;
  level: number; // 0 is root, 1 is item 1 decision, etc.
  weight: number;
  value: number;
  bound: number;
  itemIncluded?: boolean;
  parentId?: string;
  status: 'active' | 'explored' | 'pruned' | 'best';
  pruneReason?: string;
  children?: BBNode[];
}

export interface KnapsackBBState {
  items: { id: number; weight: number; value: number; ratio: number }[];
  capacity: number;
  treeRoot?: BBNode;
  activeNodeId?: string;
  prunedNodeIds: string[];
  bestValue: number;
  bestWeight: number;
  bestItems: number[];
  queueSize: number;
  currentNode?: BBNode;
}

export function* knapsackBBSteps(inputs: {
  weights: number[];
  values: number[];
  capacity: number;
}): Generator<AlgorithmStep<KnapsackBBState>> {
  const rawWeights = inputs.weights || [2, 3, 4, 5];
  const rawValues = inputs.values || [3, 4, 5, 6];
  const capacity = Math.max(1, inputs.capacity || 5);
  const n = Math.min(rawWeights.length, rawValues.length);

  // Sort items descending by value/weight ratio for tight bounding
  const items = Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    weight: rawWeights[i],
    value: rawValues[i],
    ratio: rawValues[i] / rawWeights[i],
  })).sort((a, b) => b.ratio - a.ratio);

  let stepIndex = 0;
  let comparisons = 0;
  let nodesExplored = 0;
  let prunedNodes = 0;

  // Calculate Upper Bound using Fractional Knapsack on remaining capacity
  function calculateBound(level: number, currentWeight: number, currentValue: number): number {
    if (currentWeight > capacity) return 0;
    let bound = currentValue;
    let totalWeight = currentWeight;
    let i = level;

    while (i < n && totalWeight + items[i].weight <= capacity) {
      comparisons++;
      totalWeight += items[i].weight;
      bound += items[i].value;
      i++;
    }

    if (i < n) {
      comparisons++;
      bound += (capacity - totalWeight) * items[i].ratio;
    }

    return parseFloat(bound.toFixed(2));
  }

  let nodeCounter = 1;
  const rootNode: BBNode = {
    id: `node-${nodeCounter++}`,
    level: 0,
    weight: 0,
    value: 0,
    bound: calculateBound(0, 0, 0),
    status: 'active',
  };

  let bestValue = 0;
  let bestWeight = 0;
  let bestItems: number[] = [];
  const prunedNodeIds: string[] = [];

  // Map of node id to node for fast lookup
  const nodeMap = new Map<string, BBNode>();
  nodeMap.set(rootNode.id, rootNode);

  // Queue of active nodes (Max-Heap / Best-First by bound)
  const queue: { node: BBNode; path: number[] }[] = [{ node: rootNode, path: [] }];

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Branch & Bound Tree',
    description: `Sorted items by value/weight ratio. Root node bound calculated as ${rootNode.bound} (theoretical upper bound).`,
    codeLine: 1,
    state: {
      items,
      capacity,
      treeRoot: JSON.parse(JSON.stringify(rootNode)),
      activeNodeId: rootNode.id,
      prunedNodeIds: [...prunedNodeIds],
      bestValue,
      bestWeight,
      bestItems: [...bestItems],
      queueSize: queue.length,
      currentNode: { ...rootNode },
    },
    highlights: {
      activeNode: rootNode.id,
      nodes: [rootNode.id],
    },
    metrics: { comparisons, nodesExplored, prunedNodes },
  };

  while (queue.length > 0) {
    // Best-first: sort queue by bound descending
    queue.sort((a, b) => b.node.bound - a.node.bound);
    const { node: curr, path } = queue.shift()!;
    nodesExplored++;

    yield {
      stepIndex: stepIndex++,
      title: `Explore Node (${curr.id}) at Level ${curr.level}`,
      description: `Exploring node at level ${curr.level} (Weight: ${curr.weight}, Value: ${curr.value}, Bound: ${curr.bound}). Current best value = ${bestValue}.`,
      codeLine: 2,
      state: {
        items,
        capacity,
        treeRoot: JSON.parse(JSON.stringify(rootNode)),
        activeNodeId: curr.id,
        prunedNodeIds: [...prunedNodeIds],
        bestValue,
        bestWeight,
        bestItems: [...bestItems],
        queueSize: queue.length,
        currentNode: { ...curr },
      },
      highlights: {
        activeNode: curr.id,
      },
      metrics: { comparisons, nodesExplored, prunedNodes },
    };

    if (curr.bound <= bestValue) {
      // Prune by bound
      prunedNodes++;
      curr.status = 'pruned';
      curr.pruneReason = `Bound (${curr.bound}) <= Best Value (${bestValue})`;
      prunedNodeIds.push(curr.id);

      yield {
        stepIndex: stepIndex++,
        title: `Prune Node ${curr.id} by Bound`,
        description: `Pruning branch at node ${curr.id} because bound ${curr.bound} cannot beat best known value ${bestValue}.`,
        codeLine: 3,
        state: {
          items,
          capacity,
          treeRoot: JSON.parse(JSON.stringify(rootNode)),
          activeNodeId: curr.id,
          prunedNodeIds: [...prunedNodeIds],
          bestValue,
          bestWeight,
          bestItems: [...bestItems],
          queueSize: queue.length,
          currentNode: { ...curr },
        },
        highlights: {
          prunedNodes: [curr.id],
        },
        metrics: { comparisons, nodesExplored, prunedNodes },
      };
      continue;
    }

    if (curr.level === n) {
      // Leaf node reached
      curr.status = 'explored';
      continue;
    }

    const nextItem = items[curr.level];
    curr.children = [];

    // Branch 1: INCLUDE nextItem
    const inclWeight = curr.weight + nextItem.weight;
    const inclValue = curr.value + nextItem.value;

    const leftNode: BBNode = {
      id: `node-${nodeCounter++}`,
      level: curr.level + 1,
      weight: inclWeight,
      value: inclValue,
      bound: calculateBound(curr.level + 1, inclWeight, inclValue),
      itemIncluded: true,
      parentId: curr.id,
      status: 'active',
    };
    curr.children.push(leftNode);
    nodeMap.set(leftNode.id, leftNode);

    if (inclWeight <= capacity) {
      if (inclValue > bestValue) {
        bestValue = inclValue;
        bestWeight = inclWeight;
        bestItems = [...path, nextItem.id];

        yield {
          stepIndex: stepIndex++,
          title: `New Best Solution Found!`,
          description: `Including Item ${nextItem.id} yields a feasible solution with value ${bestValue} (weight ${bestWeight}/${capacity}). Updated best value!`,
          codeLine: 4,
          state: {
            items,
            capacity,
            treeRoot: JSON.parse(JSON.stringify(rootNode)),
            activeNodeId: leftNode.id,
            prunedNodeIds: [...prunedNodeIds],
            bestValue,
            bestWeight,
            bestItems: [...bestItems],
            queueSize: queue.length,
            currentNode: { ...leftNode },
          },
          highlights: {
            activeNode: leftNode.id,
          },
          metrics: { comparisons, nodesExplored, prunedNodes },
        };
      }

      if (leftNode.bound > bestValue) {
        queue.push({ node: leftNode, path: [...path, nextItem.id] });
      } else {
        prunedNodes++;
        leftNode.status = 'pruned';
        leftNode.pruneReason = `Bound (${leftNode.bound}) <= Best (${bestValue})`;
        prunedNodeIds.push(leftNode.id);
      }
    } else {
      // Over capacity -> prune
      prunedNodes++;
      leftNode.status = 'pruned';
      leftNode.pruneReason = `Weight (${inclWeight}) exceeds capacity (${capacity})`;
      prunedNodeIds.push(leftNode.id);

      yield {
        stepIndex: stepIndex++,
        title: `Prune Infeasible Left Branch`,
        description: `Including Item ${nextItem.id} causes weight (${inclWeight}) to exceed capacity (${capacity}). Node pruned.`,
        codeLine: 5,
        state: {
          items,
          capacity,
          treeRoot: JSON.parse(JSON.stringify(rootNode)),
          activeNodeId: leftNode.id,
          prunedNodeIds: [...prunedNodeIds],
          bestValue,
          bestWeight,
          bestItems: [...bestItems],
          queueSize: queue.length,
          currentNode: { ...leftNode },
        },
        highlights: {
          prunedNodes: [leftNode.id],
        },
        metrics: { comparisons, nodesExplored, prunedNodes },
      };
    }

    // Branch 2: EXCLUDE nextItem
    const exclWeight = curr.weight;
    const exclValue = curr.value;
    const exclBound = calculateBound(curr.level + 1, exclWeight, exclValue);

    const rightNode: BBNode = {
      id: `node-${nodeCounter++}`,
      level: curr.level + 1,
      weight: exclWeight,
      value: exclValue,
      bound: exclBound,
      itemIncluded: false,
      parentId: curr.id,
      status: 'active',
    };
    curr.children.push(rightNode);
    nodeMap.set(rightNode.id, rightNode);

    if (exclBound > bestValue) {
      queue.push({ node: rightNode, path: [...path] });
    } else {
      prunedNodes++;
      rightNode.status = 'pruned';
      rightNode.pruneReason = `Bound (${exclBound}) <= Best (${bestValue})`;
      prunedNodeIds.push(rightNode.id);

      yield {
        stepIndex: stepIndex++,
        title: `Prune Right Branch by Bound`,
        description: `Excluding Item ${nextItem.id} gives bound ${exclBound} <= best value ${bestValue}. Node pruned.`,
        codeLine: 6,
        state: {
          items,
          capacity,
          treeRoot: JSON.parse(JSON.stringify(rootNode)),
          activeNodeId: rightNode.id,
          prunedNodeIds: [...prunedNodeIds],
          bestValue,
          bestWeight,
          bestItems: [...bestItems],
          queueSize: queue.length,
          currentNode: { ...rightNode },
        },
        highlights: {
          prunedNodes: [rightNode.id],
        },
        metrics: { comparisons, nodesExplored, prunedNodes },
      };
    }
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Branch & Bound Complete',
    description: `Optimal solution verified! Max Value = ${bestValue}, Total Weight = ${bestWeight}/${capacity}. Selected Items: [${bestItems.sort().join(', ')}]. Explored ${nodesExplored} nodes and pruned ${prunedNodes} branches.`,
    codeLine: 7,
    state: {
      items,
      capacity,
      treeRoot: JSON.parse(JSON.stringify(rootNode)),
      prunedNodeIds: [...prunedNodeIds],
      bestValue,
      bestWeight,
      bestItems: bestItems.sort(),
      queueSize: 0,
    },
    highlights: {},
    metrics: { comparisons, nodesExplored, prunedNodes },
    isFinal: true,
    result: {
      maxValue: bestValue,
      totalWeight: bestWeight,
      capacity,
      selectedItemIndices: bestItems.sort(),
      nodesExplored,
      prunedNodes,
    },
  };
}
