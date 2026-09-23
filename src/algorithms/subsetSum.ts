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
  findMode: 'first' | 'all';
  currentIndex: number;
  currentElement?: number;
  currentSum: number;
  includedElements: number[];
  treeRoot?: SubsetSumTreeNode;
  activeNodeId?: string;
  solutionSubset?: number[];
  allSolutions?: number[][];
  found: boolean;
  explanation?: string;
  formulaExplanation?: string;
}

export interface SubsetSumInputs {
  numbers?: number[];
  targetSum?: number;
  findMode?: 'first' | 'all';
}

export const SUBSET_SUM_PSEUDOCODE_FIRST = [
  'function SubsetSum(index, currentSum, remaining, included):',
  '  if currentSum == target: return SOLUTION(included)  // Base case: first valid subset matched',
  '  if index >= n: return FAIL  // Base case: all elements evaluated without match',
  '  // Option 1: Try including numbers[index]',
  '  if currentSum + numbers[index] > target: PRUNE  // Overflow cutoff: exceeds target sum',
  '  else if currentSum + numbers[index] + remaining < target: PRUNE  // Insufficient remaining sum',
  '  else: if recurse(index+1, currentSum+numbers[index], remaining-numbers[index], included+[numbers[index]]) == true: return true',
  '  // Option 2: Try excluding numbers[index]',
  '  if currentSum + remaining - numbers[index] < target: PRUNE  // Insufficient remaining without element',
  '  else: if recurse(index+1, currentSum, remaining-numbers[index], included) == true: return true',
];

export const SUBSET_SUM_PSEUDOCODE_ALL = [
  'function SubsetSumAll(index, currentSum, remaining, included):',
  '  if currentSum == target: recordSolution(included); return  // Match found: record & backtrack',
  '  if index >= n: return  // Base case: element choices exhausted',
  '  // Option 1: Try including numbers[index]',
  '  if currentSum + numbers[index] > target: PRUNE  // Overflow cutoff: exceeds target sum',
  '  else if currentSum + numbers[index] + remaining < target: PRUNE  // Insufficient remaining sum',
  '  else: recurse(index+1, currentSum+numbers[index], remaining-numbers[index], included+[numbers[index]])',
  '  // Option 2: Try excluding numbers[index]',
  '  if currentSum + remaining - numbers[index] < target: PRUNE  // Insufficient remaining without element',
  '  else: recurse(index+1, currentSum, remaining-numbers[index], included)',
];

export function* subsetSumSteps(inputs: SubsetSumInputs): Generator<AlgorithmStep<SubsetSumState>> {
  const rawNumbers = inputs.numbers && inputs.numbers.length > 0 ? [...inputs.numbers] : [3, 34, 4, 12, 5, 2];
  const targetSum = inputs.targetSum ?? 9;
  const findMode: 'first' | 'all' = inputs.findMode === 'all' ? 'all' : 'first';

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

  let solutionSubset: number[] | null = null;
  const allSolutions: number[][] = [];

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
    codeLine: number | number[],
    activeNodeId: string,
    currentSum: number,
    includedElements: number[],
    explanation: string,
    formulaExplanation: string,
    currentIndex: number,
    currentElement?: number,
    isFinal = false,
    finalResult?: any,
    callFlow?: { type: 'call' | 'return'; nodeId: string | number }
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
      callFlow,
      state: {
        numbers: [...numbers],
        targetSum,
        findMode,
        currentIndex,
        currentElement,
        currentSum,
        includedElements: [...includedElements],
        treeRoot: cloneTree(treeRoot),
        activeNodeId,
        solutionSubset:
          finalResult?.subset ||
          (findMode === 'all'
            ? allSolutions.length > 0
              ? allSolutions[allSolutions.length - 1]
              : undefined
            : solutionSubset || undefined),
        allSolutions: allSolutions.map((s) => [...s]),
        found: finalResult?.found ?? (findMode === 'all' ? allSolutions.length > 0 : solutionSubset !== null),
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

  // Backtracking recursive generator
  function* backtrack(
    index: number,
    currentSum: number,
    remainingSum: number,
    included: number[],
    parentNode: SubsetSumTreeNode
  ): Generator<AlgorithmStep<SubsetSumState>, boolean> {
    if (findMode === 'first' && solutionSubset !== null) return true; // Stop after finding first valid solution

    if (currentSum === targetSum) {
      if (findMode === 'first') {
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
          numbers[index - 1],
          false,
          undefined,
          { type: 'return', nodeId: parentNode.id }
        );
        return true;
      } else {
        const foundSubset = [...included];
        allSolutions.push(foundSubset);
        parentNode.status = 'solution';
        yield makeSnapshot(
          `Solution #${allSolutions.length} Found!`,
          `Found valid subset #${allSolutions.length}: [${included.join(' + ')}] = ${targetSum}. Continuing backtrack search for other subsets.`,
          2,
          parentNode.id,
          currentSum,
          included,
          `Solution #${allSolutions.length}: [${included.join(' + ')}] = ${targetSum}. Continuing exploration.`,
          `[${included.join(' + ')}] = ${targetSum} (SOLUTION #${allSolutions.length})`,
          index - 1,
          numbers[index - 1],
          false,
          undefined,
          { type: 'return', nodeId: parentNode.id }
        );
        // Positive integers only: deeper elements will strictly exceed targetSum.
        // Return without stopping global search so DFS explores remaining branches.
        return false;
      }
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
        5,
        includeNode.id,
        currentSum,
        included,
        `Sum (${currentSum} + ${elem} = ${includeSum}) > ${targetSum} ➔ PRUNED`,
        `Include ${elem}: ${includeSum} > ${targetSum} (OVERFLOW)`,
        index,
        elem,
        false,
        undefined,
        { type: 'return', nodeId: includeNode.id }
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
        6,
        includeNode.id,
        currentSum,
        included,
        `Max achievable sum (${includeSum} + ${newRemaining} = ${includeSum + newRemaining}) < ${targetSum} ➔ PRUNED`,
        `Include ${elem}: Max ${includeSum + newRemaining} < ${targetSum}`,
        index,
        elem,
        false,
        undefined,
        { type: 'return', nodeId: includeNode.id }
      );
    } else {
      yield makeSnapshot(
        `Include Element ${elem}`,
        `Including element ${elem} gives current sum = ${includeSum}. Exploring deeper.`,
        7,
        includeNode.id,
        includeSum,
        includeNode.includedElements,
        `Include ${elem} ➔ New running sum: ${includeSum}/${targetSum}.`,
        `Running Sum: ${includeSum} / ${targetSum}`,
        index,
        elem,
        false,
        undefined,
        { type: 'call', nodeId: includeNode.id }
      );

      const found = yield* backtrack(index + 1, includeSum, newRemaining, includeNode.includedElements, includeNode);
      if (findMode === 'first' && found) return true;
    }

    // --- OPTION 2: EXCLUDE numbers[index] ---
    if (findMode === 'first' && solutionSubset !== null) return true;

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
    parentNode.children = parentNode.children || [];
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
        9,
        excludeNode.id,
        currentSum,
        included,
        `Excluding ${elem}: Max reachable ${currentSum + newRemaining} < ${targetSum} ➔ PRUNED`,
        `Exclude ${elem}: ${currentSum} + ${newRemaining} = ${currentSum + newRemaining} < ${targetSum}`,
        index,
        elem,
        false,
        undefined,
        { type: 'return', nodeId: excludeNode.id }
      );
    } else {
      yield makeSnapshot(
        `Exclude Element ${elem}`,
        `Excluding element ${elem}. Current sum remains ${currentSum}. Exploring alternative path.`,
        10,
        excludeNode.id,
        currentSum,
        included,
        `Exclude ${elem} ➔ Running sum remains ${currentSum}/${targetSum}.`,
        `Running Sum: ${currentSum} / ${targetSum}`,
        index,
        elem,
        false,
        undefined,
        { type: 'call', nodeId: excludeNode.id }
      );

      const found = yield* backtrack(index + 1, currentSum, newRemaining, included, excludeNode);
      if (findMode === 'first' && found) return true;
    }

    return false;
  }

  const hasSolution = yield* backtrack(0, 0, totalSum, [], treeRoot);
  const isSuccess = findMode === 'all' ? allSolutions.length > 0 : hasSolution;

  // Mark all solution path nodes
  const markSolutionPath = (node: SubsetSumTreeNode, targetPath: number[]) => {
    const isPrefix =
      node.includedElements.length <= targetPath.length &&
      node.includedElements.every((val, idx) => val === targetPath[idx]);
    if (isPrefix) {
      node.status = 'solution';
    }
    node.children?.forEach((c) => markSolutionPath(c, targetPath));
  };

  if (findMode === 'all') {
    allSolutions.forEach((sol) => markSolutionPath(treeRoot, sol));
  } else if (hasSolution && solutionSubset) {
    markSolutionPath(treeRoot, solutionSubset);
  }

  const finalSubset: number[] =
    findMode === 'all' ? (allSolutions[0] || []) : (solutionSubset || []);

  const solutionsSummary =
    allSolutions.length > 0
      ? `Found ${allSolutions.length} valid subset(s): ${allSolutions.map((s) => `[${s.join(', ')}]`).join(', ')}.`
      : `No subset of [${numbers.join(', ')}] sums to target ${targetSum}.`;

  // Final Step
  yield makeSnapshot(
    findMode === 'all'
      ? isSuccess
        ? `All Solutions Found (${allSolutions.length})`
        : 'No Valid Subset Sum Found'
      : hasSolution
      ? 'Subset Sum Solution Found'
      : 'No Valid Subset Sum Found',
    findMode === 'all'
      ? isSuccess
        ? `Exhaustive search complete: ${solutionsSummary}`
        : `Search complete: No subset of [${numbers.join(', ')}] sums to target ${targetSum}.`
      : hasSolution
      ? `Search complete: Target sum ${targetSum} achieved by subset [${finalSubset.join(', ')}] (sum = ${targetSum}).`
      : `Search complete: No subset of [${numbers.join(', ')}] sums to target ${targetSum}.`,
    isSuccess ? 2 : 3,
    treeRoot.id,
    isSuccess ? targetSum : 0,
    finalSubset,
    findMode === 'all'
      ? isSuccess
        ? `Found ${allSolutions.length} subset(s) matching target ${targetSum}.`
        : `Exhaustive search confirmed target ${targetSum} is unreachable.`
      : hasSolution
      ? `Solution subset [${finalSubset.join(' + ')}] = ${targetSum}`
      : `Exhaustive search confirmed target ${targetSum} is unreachable.`,
    findMode === 'all'
      ? isSuccess
        ? `${allSolutions.length} Solution(s): ${allSolutions.map((s) => `[${s.join(', ')}]`).join(' ')}`
        : `No Subset Sums to ${targetSum}`
      : hasSolution
      ? `Subset [${finalSubset.join(' + ')}] = ${targetSum}`
      : `No Subset Sums to ${targetSum}`,
    n,
    undefined,
    true,
    {
      found: isSuccess,
      targetSum,
      subset: finalSubset,
      allSolutions: findMode === 'all' ? allSolutions : (hasSolution ? [finalSubset] : []),
      solutionsCount: findMode === 'all' ? allSolutions.length : (hasSolution ? 1 : 0),
      totalSum: isSuccess ? targetSum : 0,
      nodesExplored,
      backtracks,
    },
    isSuccess ? { type: 'return', nodeId: treeRoot.id } : undefined
  );
}
