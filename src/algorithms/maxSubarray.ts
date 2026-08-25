import { AlgorithmStep } from '../types/algorithm';

export interface MaxSubarrayState {
  array: number[];
  currentIndex: number;
  currentSum: number;
  maxSum: number;
  bestStart: number;
  bestEnd: number;
  currentStart: number;
  mode: 'kadane' | 'divideAndConquer';
  mid?: number;
  low?: number;
  high?: number;
}

export function* maxSubarraySteps(inputs: { array: number[] }): Generator<AlgorithmStep<MaxSubarrayState>> {
  const arr = [...inputs.array];
  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  if (arr.length === 0) {
    yield {
      stepIndex: stepIndex++,
      title: 'Empty Array',
      description: 'The input array is empty.',
      codeLine: 1,
      state: { array: [], currentIndex: -1, currentSum: 0, maxSum: 0, bestStart: -1, bestEnd: -1, currentStart: 0, mode: 'kadane' },
      highlights: {},
      metrics: { comparisons: 0, iterations: 0 },
      isFinal: true,
      result: { maxSum: 0, subarray: [], indices: [-1, -1] },
    };
    return;
  }

  let currentSum = arr[0];
  let maxSum = arr[0];
  let bestStart = 0;
  let bestEnd = 0;
  let currentStart = 0;

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Maximum Subarray Search',
    description: `Initialized with first element arr[0] = ${arr[0]}. Current sum = ${currentSum}, Max sum = ${maxSum}.`,
    codeLine: 1,
    state: { array: [...arr], currentIndex: 0, currentSum, maxSum, bestStart, bestEnd, currentStart, mode: 'kadane' },
    highlights: { window: [0, 0], activeIndices: [0] },
    metrics: { comparisons, iterations },
  };

  for (let i = 1; i < arr.length; i++) {
    iterations++;
    comparisons++;
    const element = arr[i];

    // Decision: extend existing subarray or start fresh from index i
    const extendSum = currentSum + element;
    const startFresh = element;

    yield {
      stepIndex: stepIndex++,
      title: `Evaluating Element at Index ${i}`,
      description: `Examining arr[${i}] = ${element}. Option 1: Extend previous subarray sum (${currentSum} + ${element} = ${extendSum}). Option 2: Start new subarray at index ${i} (${startFresh}).`,
      codeLine: 2,
      state: { array: [...arr], currentIndex: i, currentSum, maxSum, bestStart, bestEnd, currentStart, mode: 'kadane' },
      highlights: { compareIndices: [i], window: [currentStart, i - 1] },
      metrics: { comparisons, iterations },
    };

    if (element > extendSum) {
      currentSum = element;
      currentStart = i;
      yield {
        stepIndex: stepIndex++,
        title: `Start Fresh at Index ${i}`,
        description: `Starting fresh at index ${i} because single element ${element} > extended sum ${extendSum}. Current sum is now ${currentSum}.`,
        codeLine: 3,
        state: { array: [...arr], currentIndex: i, currentSum, maxSum, bestStart, bestEnd, currentStart, mode: 'kadane' },
        highlights: { activeIndices: [i], window: [currentStart, i] },
        metrics: { comparisons, iterations },
      };
    } else {
      currentSum = extendSum;
      yield {
        stepIndex: stepIndex++,
        title: `Extend Subarray to Index ${i}`,
        description: `Extended running window to include arr[${i}]. Current sum is now ${currentSum}.`,
        codeLine: 4,
        state: { array: [...arr], currentIndex: i, currentSum, maxSum, bestStart, bestEnd, currentStart, mode: 'kadane' },
        highlights: { activeIndices: [i], window: [currentStart, i] },
        metrics: { comparisons, iterations },
      };
    }

    comparisons++;
    if (currentSum > maxSum) {
      maxSum = currentSum;
      bestStart = currentStart;
      bestEnd = i;

      yield {
        stepIndex: stepIndex++,
        title: `New Maximum Subarray Found!`,
        description: `Updated global maximum sum to ${maxSum} spanning indices [${bestStart}..${bestEnd}].`,
        codeLine: 5,
        state: { array: [...arr], currentIndex: i, currentSum, maxSum, bestStart, bestEnd, currentStart, mode: 'kadane' },
        highlights: { activeIndices: [bestStart, bestEnd], window: [bestStart, bestEnd] },
        metrics: { comparisons, iterations },
      };
    }
  }

  const bestSubarray = arr.slice(bestStart, bestEnd + 1);

  yield {
    stepIndex: stepIndex++,
    title: 'Maximum Subarray Complete',
    description: `Search complete. Maximum contiguous subarray sum is ${maxSum} for subarray [${bestSubarray.join(', ')}] from index ${bestStart} to ${bestEnd}.`,
    codeLine: 6,
    state: { array: [...arr], currentIndex: arr.length - 1, currentSum, maxSum, bestStart, bestEnd, currentStart, mode: 'kadane' },
    highlights: { window: [bestStart, bestEnd] },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      maxSum,
      indices: [bestStart, bestEnd],
      subarray: bestSubarray,
    },
  };
}
