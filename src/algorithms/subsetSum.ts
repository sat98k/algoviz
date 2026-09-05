import { AlgorithmStep } from '../types/algorithm';

export interface SubsetSumTreeNode {
  id: string;
  level: number;
  currentSum: number;
  remainingSum: number;
  includedElements: number[];
  itemIncluded?: boolean;
  status?: 'active' | 'explored' | 'pruned' | 'solution' | 'normal';
  pruneReason?: string;
  children?: SubsetSumTreeNode[];
}

export interface SubsetSumState {
  numbers: number[];
  targetSum: number;
  currentIndex: number;
  currentElement?: number;
  currentSum: number;
  includedElements: number[];
  treeRoot?: SubsetSumTreeNode;
  activeNodeId?: string;
  solutionSubset?: number[];
  found: boolean;
  explanation?: string;
  formulaExplanation?: string;
}

export function* subsetSumSteps(inputs: {
  numbers?: number[];
  targetSum?: number;
}): Generator<AlgorithmStep<SubsetSumState>> {
  const rawNumbers = inputs.numbers && inputs.numbers.length > 0 ? [...inputs.numbers] : [3, 34, 4, 12, 5, 2];
  const targetSum = inputs.targetSum ?? 9;

  // Filter and sort positive numbers for monotonic pruning
  const numbers = rawNumbers.filter((x) => x > 0).sort((a, b) => a - b);
  const n = numbers.length;
  const totalSum = numbers.reduce((a, b) => a + b, 0);

  let stepIndex = 0;
  let comparisons = 0;
  let backtracks = 0;
  let nodesExplored = 0;
  let prunedNodes = 0;
  let nodeCounter = 0;

  // Root node
  const treeRoot: SubsetSumTreeNode = {
    id: `node-${++nodeCounter}`,
    level: 0,
    currentSum: 0,
    remainingSum: totalSum,
    includedElements: [],
    status: 'active',
    children: [],
  };
  nodesExplored++;

  // Helper snapshot
  const makeSnapshot = (
    title: string,
    description: string,
    codeLine: number,
    activeNodeId: string,
    currentSum: number,
    includedElements: number[],
    explanation: string,
    formulaExplanation: string,
    currentIndex: number,
    currentElement?: number,
    isFinal = false,
    finalResult?: any
  ): AlgorithmStep<SubsetSumState> => {
    // Clone tree deeply
    const cloneTree = (node?: SubsetSumTreeNode): SubsetSumTreeNode | undefined => {
      if (!node) return undefined;
      return {
        ...node,
        includedElements: [...node.includedElements],
        children: node.children?.map((c) => cloneTree(c)!),
      };
    };

    return {
      stepIndex: stepIndex++,
      title,
      description,
      codeLine,
      state: {
        numbers: [...numbers],
        targetSum,
        currentIndex,
        currentElement,
        currentSum,
        includedElements: [...includedElements],
        treeRoot: cloneTree(treeRoot),
        activeNodeId,
        solutionSubset: finalResult?.subset,
        found: finalResult?.found ?? false,
        explanation,
        formulaExplanation,
      },
      highlights: {
        nodes: [activeNodeId],
      },
      metrics: {
        comparisons,
        backtracks,
        nodesExplored,
        prunedNodes,
      },
      isFinal,
      result: finalResult,
    };
  };

  yield makeSnapshot(
    'Initialize Subset Sum Decision Tree',
    `Initialized backtrack search for target sum ${targetSum} with elements [${numbers.join(', ')}]. Total available sum = ${totalSum}.`,
    1,
    treeRoot.id,
    0,
    [],
    'Start at root with empty subset (sum = 0).',
    `Target Sum: ${targetSum} | Sorted Elements: [${numbers.join(', ')}]`,
    -1
  );

  let solutionSubset: number[] | null = null;

  // Backtracking recursive generator
  function* backtrack(
    index: number,
    currentSum: number,
    remainingSum: number,
    included: number[],
    parentNode: SubsetSumTreeNode
  ): Generator<AlgorithmStep<SubsetSumState>, boolean> {
    if (solutionSubset !== null) return true; // Stop after finding first valid solution

    if (currentSum === targetSum) {
      solutionSubset = [...included];
      parentNode.status = 'solution';
      yield makeSnapshot(
        `Target Sum ${targetSum} Achieved!`,
        `Found valid subset: [${included.join(' + ')}] = ${targetSum}.`,
        2,
        parentNode.id,
        currentSum,
        included,
        `Solution found with sum ${currentSum} matching target ${targetSum}!`,
        `[${included.join(' + ')}] = ${targetSum} (MATCH)`,
        index - 1,
        numbers[index - 1]
      );
      return true;
    }

    if (index >= n) return false;

    const elem = numbers[index];
    const newRemaining = remainingSum - elem;

    // --- OPTION 1: INCLUDE numbers[index] ---
    comparisons++;
    const includeSum = currentSum + elem;
    const includeNode: SubsetSumTreeNode = {
      id: `node-${++nodeCounter}`,
      level: index + 1,
      currentSum: includeSum,
      remainingSum: newRemaining,
      includedElements: [...included, elem],
      itemIncluded: true,
      status: 'active',
      children: [],
    };
    parentNode.children = parentNode.children || [];
    parentNode.children.push(includeNode);
    nodesExplored++;

    if (includeSum > targetSum) {
      // Prune: sum exceeds target
      prunedNodes++;
      backtracks++;
      includeNode.status = 'pruned';
      includeNode.pruneReason = `Sum ${includeSum} > Target ${targetSum}`;

      yield makeSnapshot(
        `Prune: +${elem} Exceeds Target`,
        `Including element ${elem} makes current sum ${includeSum}, which exceeds target ${targetSum}. Pruning branch.`,
        3,
        includeNode.id,
        currentSum,
        included,
        `Sum (${currentSum} + ${elem} = ${includeSum}) > ${targetSum} ➔ PRUNED`,
        `Include ${elem}: ${includeSum} > ${targetSum} (OVERFLOW)`,
        index,
        elem
      );
    } else if (includeSum + newRemaining < targetSum) {
      // Prune: remaining elements insufficient
      prunedNodes++;
      backtracks++;
      includeNode.status = 'pruned';
      includeNode.pruneReason = `Max reachable sum ${includeSum + newRemaining} < Target ${targetSum}`;

      yield makeSnapshot(
        `Prune: +${elem} Insufficient Remaining`,
        `Including ${elem} gives sum ${includeSum}, but even taking all remaining elements yields max sum ${includeSum + newRemaining} < target ${targetSum}. Pruning.`,
        4,
        includeNode.id,
        currentSum,
        included,
        `Max achievable sum (${includeSum} + ${newRemaining} = ${includeSum + newRemaining}) < ${targetSum} ➔ PRUNED`,
        `Include ${elem}: Max ${includeSum + newRemaining} < ${targetSum}`,
        index,
        elem
      );
    } else {
      yield makeSnapshot(
        `Include Element ${elem}`,
        `Including element ${elem} gives current sum = ${includeSum}. Exploring deeper.`,
        5,
        includeNode.id,
        includeSum,
        includeNode.includedElements,
        `Include ${elem} ➔ New running sum: ${includeSum}/${targetSum}.`,
        `Running Sum: ${includeSum} / ${targetSum}`,
        index,
        elem
      );

      const found = yield* backtrack(index + 1, includeSum, newRemaining, includeNode.includedElements, includeNode);
      if (found) return true;
    }

    // --- OPTION 2: EXCLUDE numbers[index] ---
    if (solutionSubset !== null) return true;

    comparisons++;
    const excludeNode: SubsetSumTreeNode = {
      id: `node-${++nodeCounter}`,
      level: index + 1,
      currentSum: currentSum,
      remainingSum: newRemaining,
      includedElements: [...included],
      itemIncluded: false,
      status: 'active',
      children: [],
    };
    parentNode.children.push(excludeNode);
    nodesExplored++;

    if (currentSum + newRemaining < targetSum) {
      // Prune: remaining sum cannot reach target
      prunedNodes++;
      backtracks++;
      excludeNode.status = 'pruned';
      excludeNode.pruneReason = `Max reachable sum ${currentSum + newRemaining} < Target ${targetSum}`;

      yield makeSnapshot(
        `Prune: Exclude ${elem} (Remaining Insufficient)`,
        `Excluding ${elem} leaves sum ${currentSum}. Max achievable with remaining elements is ${currentSum + newRemaining} < target ${targetSum}. Pruning.`,
        6,
        excludeNode.id,
        currentSum,
        included,
        `Excluding ${elem}: Max reachable ${currentSum + newRemaining} < ${targetSum} ➔ PRUNED`,
        `Exclude ${elem}: ${currentSum} + ${newRemaining} = ${currentSum + newRemaining} < ${targetSum}`,
        index,
        elem
      );
    } else {
      yield makeSnapshot(
        `Exclude Element ${elem}`,
        `Excluding element ${elem}. Current sum remains ${currentSum}. Exploring alternative path.`,
        7,
        excludeNode.id,
        currentSum,
        included,
        `Exclude ${elem} ➔ Running sum remains ${currentSum}/${targetSum}.`,
        `Running Sum: ${currentSum} / ${targetSum}`,
        index,
        elem
      );

      const found = yield* backtrack(index + 1, currentSum, newRemaining, included, excludeNode);
      if (found) return true;
    }

    return false;
  }

  const hasSolution = yield* backtrack(0, 0, totalSum, [], treeRoot);

  // Mark all solution path nodes
  if (hasSolution && solutionSubset) {
    const markSolutionPath = (node: SubsetSumTreeNode, targetPath: number[]) => {
      if (node.includedElements.every((val, idx) => val === targetPath[idx])) {
        node.status = 'solution';
      }
      node.children?.forEach((c) => markSolutionPath(c, targetPath));
    };
    markSolutionPath(treeRoot, solutionSubset);
  }

  const finalSubset: number[] = solutionSubset || [];

  // Final Step
  yield makeSnapshot(
    hasSolution ? 'Subset Sum Solution Found' : 'No Valid Subset Sum Found',
    hasSolution
      ? `Search complete: Target sum ${targetSum} achieved by subset [${finalSubset.join(', ')}] (sum = ${targetSum}).`
      : `Search complete: No subset of [${numbers.join(', ')}] sums to target ${targetSum}.`,
    8,
    treeRoot.id,
    hasSolution ? targetSum : 0,
    finalSubset,
    hasSolution
      ? `Solution subset [${finalSubset.join(' + ')}] = ${targetSum}`
      : `Exhaustive search confirmed target ${targetSum} is unreachable.`,
    hasSolution
      ? `Subset [${finalSubset.join(' + ')}] = ${targetSum}`
      : `No Subset Sums to ${targetSum}`,
    n,
    undefined,
    true,
    {
      found: hasSolution,
      targetSum,
      subset: finalSubset,
      totalSum: hasSolution ? targetSum : 0,
      nodesExplored,
      backtracks,
    }
  );
}
