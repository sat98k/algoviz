import { AlgorithmStep } from '../types/algorithm';
import { TreeNodeData } from '../components/visualizers/RecursionTreeVisualizer';

export interface SubarrayResult {
  maxSum: number;
  low: number;
  high: number;
}

export interface MaxSubarrayState {
  array: number[];
  mode: 'divideAndConquer';
  treeNodes: TreeNodeData[];
  activeNodeId?: string;
  activeRange?: [number, number];
  currentLow?: number;
  currentHigh?: number;
  currentMid?: number;
  leftHalfRange?: [number, number];
  rightHalfRange?: [number, number];
  crossLeftRange?: [number, number];
  crossRightRange?: [number, number];
  lSum?: number;
  rSum?: number;
  crossSum?: number;
  winner?: 'LSum' | 'RSum' | 'CrossSum';
  optimalRange?: [number, number];
  explanation?: string;
}

export function* maxSubarraySteps(inputs: {
  array?: number[];
}): Generator<AlgorithmStep<MaxSubarrayState>> {
  const arr = inputs.array && inputs.array.length > 0 ? [...inputs.array] : [-2, 1, -3, 4, -1, 2, 1, -5, 4];
  const n = arr.length;

  let stepIndex = 0;
  let comparisons = 0;
  let recursiveCalls = 0;
  let callCounter = 0;

  const treeNodes: TreeNodeData[] = [];

  const makeSnapshot = (
    title: string,
    description: string,
    codeLine: number,
    activeNodeId: string,
    activeRange: [number, number],
    explanation: string,
    extra: Partial<MaxSubarrayState> = {},
    isFinal = false,
    finalResult?: any
  ): AlgorithmStep<MaxSubarrayState> => {
    return {
      stepIndex: stepIndex++,
      title,
      description,
      codeLine,
      state: {
        array: [...arr],
        mode: 'divideAndConquer',
        treeNodes: treeNodes.map((node) => ({
          ...node,
          result: node.result ? { ...node.result } : undefined,
        })),
        activeNodeId,
        activeRange,
        explanation,
        ...extra,
      },
      highlights: {
        activeIndices: activeRange ? Array.from({ length: activeRange[1] - activeRange[0] + 1 }, (_, i) => activeRange[0] + i) : [],
        window: activeRange,
      },
      metrics: {
        comparisons,
        recursiveCalls,
        nodesExplored: treeNodes.length,
      },
      isFinal,
      result: finalResult,
    };
  };

  function* solveDC(
    low: number,
    high: number,
    parentId?: string,
    edgeLabel?: string
  ): Generator<AlgorithmStep<MaxSubarrayState>, SubarrayResult> {
    recursiveCalls++;
    const nodeId = `call-${++callCounter}-[${low}..${high}]`;
    const label = `arr[${low}..${high}]`;

    // 1. Spawning node in tree
    const node: TreeNodeData = {
      id: nodeId,
      parentId,
      label,
      subLabel: low === high ? `val: ${arr[low]}` : `len: ${high - low + 1}`,
      status: low === high ? 'base_case' : 'dividing',
      edgeLabel,
    };
    treeNodes.push(node);

    // Initial subproblem frame
    yield makeSnapshot(
      `Divide: Subarray [${low}..${high}]`,
      `Examining subarray range from index ${low} to ${high}: [${arr.slice(low, high + 1).join(', ')}].`,
      1,
      nodeId,
      [low, high],
      `Divide Step: Range [${low}..${high}] (length ${high - low + 1}).`,
      { currentLow: low, currentHigh: high }
    );

    // Base Case: 1 element
    if (low === high) {
      const baseResult: SubarrayResult = {
        maxSum: arr[low],
        low,
        high,
      };

      node.status = 'base_case';
      node.result = { ...baseResult };
      node.subLabel = `max = ${arr[low]}`;

      yield makeSnapshot(
        `Base Case: arr[${low}] = ${arr[low]}`,
        `Base case reached (length 1). Maximum subarray sum is the single element itself: ${arr[low]}.`,
        2,
        nodeId,
        [low, high],
        `Base Case at index ${low}: Sum = ${arr[low]}.`,
        { currentLow: low, currentHigh: high }
      );

      return baseResult;
    }

    // Midpoint split & visual physical separation
    const mid = Math.floor((low + high) / 2);
    node.subLabel = `mid = ${mid}`;

    yield makeSnapshot(
      `Split at Midpoint: mid = ${mid}`,
      `Splitting array [${low}..${high}] into Left Half [${low}..${mid}] and Right Half [${mid + 1}..${high}] with physical gap.`,
      3,
      nodeId,
      [low, high],
      `Physical Split at index ${mid}: Left [${low}..${mid}], Right [${mid + 1}..${high}].`,
      {
        currentLow: low,
        currentHigh: high,
        currentMid: mid,
        leftHalfRange: [low, mid],
        rightHalfRange: [mid + 1, high],
      }
    );

    // 2. Recursively solve Left Half
    const leftRes = yield* solveDC(low, mid, nodeId, `L [${low}..${mid}]`);

    // 3. Recursively solve Right Half
    const rightRes = yield* solveDC(mid + 1, high, nodeId, `R [${mid + 1}..${high}]`);

    // 4. Compute Cross-Midpoint Subarray
    node.status = 'combining';

    // Outward scan Left: from mid down to low
    let leftSum = 0;
    let maxLeftSum = -Infinity;
    let maxLeftIdx = mid;
    for (let i = mid; i >= low; i--) {
      leftSum += arr[i];
      comparisons++;
      if (leftSum > maxLeftSum) {
        maxLeftSum = leftSum;
        maxLeftIdx = i;
      }
    }

    // Outward scan Right: from mid + 1 up to high
    let rightSum = 0;
    let maxRightSum = -Infinity;
    let maxRightIdx = mid + 1;
    for (let j = mid + 1; j <= high; j++) {
      rightSum += arr[j];
      comparisons++;
      if (rightSum > maxRightSum) {
        maxRightSum = rightSum;
        maxRightIdx = j;
      }
    }

    const crossSumVal = maxLeftSum + maxRightSum;
    const crossRes: SubarrayResult = {
      maxSum: crossSumVal,
      low: maxLeftIdx,
      high: maxRightIdx,
    };

    yield makeSnapshot(
      `Cross-Midpoint Scan: CrossSum = ${crossSumVal}`,
      `Scanned outward across midpoint ${mid}: Max Left Wing [${maxLeftIdx}..${mid}] (sum ${maxLeftSum}) + Max Right Wing [${mid + 1}..${maxRightIdx}] (sum ${maxRightSum}) = CrossSum ${crossSumVal}.`,
      4,
      nodeId,
      [maxLeftIdx, maxRightIdx],
      `Cross-Sum: Left Wing (${maxLeftSum}) + Right Wing (${maxRightSum}) = ${crossSumVal} across [${maxLeftIdx}..${maxRightIdx}].`,
      {
        currentLow: low,
        currentHigh: high,
        currentMid: mid,
        crossLeftRange: [maxLeftIdx, mid],
        crossRightRange: [mid + 1, maxRightIdx],
        lSum: leftRes.maxSum,
        rSum: rightRes.maxSum,
        crossSum: crossSumVal,
      }
    );

    // 5. Determine Winner: max(LSum, RSum, CrossSum)
    comparisons += 2;
    let bestRes: SubarrayResult = leftRes;
    let winnerName: 'LSum' | 'RSum' | 'CrossSum' = 'LSum';

    if (rightRes.maxSum > bestRes.maxSum) {
      bestRes = rightRes;
      winnerName = 'RSum';
    }
    if (crossRes.maxSum > bestRes.maxSum) {
      bestRes = crossRes;
      winnerName = 'CrossSum';
    }

    node.status = 'resolved';
    node.result = { maxSum: bestRes.maxSum, low: bestRes.low, high: bestRes.high };
    node.subLabel = `max = ${bestRes.maxSum}`;

    yield makeSnapshot(
      `Combine: Winner is ${winnerName} -> Max Sum ${bestRes.maxSum}`,
      `Comparing LSum (${leftRes.maxSum}), RSum (${rightRes.maxSum}), and CrossSum (${crossRes.maxSum}). Selected ${winnerName} (${bestRes.maxSum}) spanning [${bestRes.low}..${bestRes.high}].`,
      5,
      nodeId,
      [bestRes.low, bestRes.high],
      `Winner: ${winnerName} with max sum ${bestRes.maxSum} across indices [${bestRes.low}..${bestRes.high}].`,
      {
        currentLow: low,
        currentHigh: high,
        lSum: leftRes.maxSum,
        rSum: rightRes.maxSum,
        crossSum: crossSumVal,
        winner: winnerName,
      }
    );

    return bestRes;
  }

  const rootResult = yield* solveDC(0, n - 1);

  if (treeNodes.length > 0) {
    treeNodes[0].status = 'optimal';
  }

  const optimalSubarray = arr.slice(rootResult.low, rootResult.high + 1);

  yield makeSnapshot(
    'Maximum Subarray Complete: Global Optimal Highlighted',
    `Global maximum contiguous subarray is [${optimalSubarray.join(', ')}] with sum ${rootResult.maxSum} spanning indices [${rootResult.low}..${rootResult.high}].`,
    6,
    treeNodes[0]?.id || '',
    [rootResult.low, rootResult.high],
    `Optimal answer highlighted directly on full array: Sum = ${rootResult.maxSum} at [${rootResult.low}..${rootResult.high}].`,
    {
      optimalRange: [rootResult.low, rootResult.high],
      lSum: undefined,
      rSum: undefined,
      crossSum: undefined,
      winner: undefined,
    },
    true,
    {
      maxSum: rootResult.maxSum,
      indices: [rootResult.low, rootResult.high],
      subarray: optimalSubarray,
      totalCalls: recursiveCalls,
    }
  );
}
