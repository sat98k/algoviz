import { AlgorithmStep } from '../types/algorithm';

export interface QuickSortState {
  array: number[];
  low: number;
  high: number;
  pivotIndex?: number;
  pivotValue?: number;
  i?: number;
  j?: number;
  sortedIndices: number[];
}

export function* randomizedQuicksortSteps(inputs: { array: number[] }): Generator<AlgorithmStep<QuickSortState>> {
  const arr = [...inputs.array];
  let stepIndex = 0;
  let comparisons = 0;
  let swaps = 0;
  let recursiveCalls = 0;
  const sortedIndices: number[] = [];

  yield {
    stepIndex: stepIndex++,
    title: 'Initial Array',
    description: `Sort these ${arr.length} numbers. Pick a pivot at random, put smaller-or-equal numbers to its left and larger ones to its right, then sort each side the same way.`,
    codeLine: 1,
    state: { array: [...arr], low: 0, high: arr.length - 1, sortedIndices: [...sortedIndices] },
    highlights: { type: 'active', indices: arr.map((_, idx) => idx) },
    metrics: { comparisons, swaps, recursiveCalls },
  };

  if (arr.length <= 1) {
    if (arr.length === 1) sortedIndices.push(0);
    yield {
      stepIndex: stepIndex++,
      title: 'Already Sorted',
      description: 'Array has 1 or 0 elements and is trivially sorted.',
      codeLine: 2,
      state: { array: [...arr], low: 0, high: arr.length - 1, sortedIndices: [...sortedIndices] },
      highlights: { sortedIndices: [...sortedIndices] },
      metrics: { comparisons, swaps, recursiveCalls },
      isFinal: true,
      result: arr,
    };
    return;
  }

  function* quickSort(low: number, high: number): Generator<AlgorithmStep<QuickSortState>> {
    recursiveCalls++;
    if (low >= high) {
      if (low === high && !sortedIndices.includes(low)) {
        sortedIndices.push(low);
        yield {
          stepIndex: stepIndex++,
          title: `Single Element Subarray [${low}]`,
          description: `A part with just one number (${arr[low]} at index ${low}) is already sorted: it stays where it is.`,
          codeLine: 3,
          state: { array: [...arr], low, high, sortedIndices: [...sortedIndices] },
          highlights: { sortedIndices: [...sortedIndices] },
          metrics: { comparisons, swaps, recursiveCalls },
        };
      }
      return;
    }

    // Step 1: Pick random pivot in range [low, high]
    const randomPivotIdx = low + Math.floor(Math.random() * (high - low + 1));
    const randomPivotVal = arr[randomPivotIdx];

    yield {
      stepIndex: stepIndex++,
      title: `Random Pivot Selection`,
      description: `Pick a pivot at random from positions ${low} to ${high}: ${randomPivotVal} (at index ${randomPivotIdx}). Choosing at random means no input order can make this slow every time.`,
      codeLine: 3,
      state: { array: [...arr], low, high, pivotIndex: randomPivotIdx, pivotValue: randomPivotVal, sortedIndices: [...sortedIndices] },
      highlights: { type: 'pivot', pivotIndex: randomPivotIdx, window: [low, high] },
      metrics: { comparisons, swaps, recursiveCalls },
    };

    // Swap random pivot to the end (high)
    if (randomPivotIdx !== high) {
      swaps++;
      const temp = arr[randomPivotIdx];
      arr[randomPivotIdx] = arr[high];
      arr[high] = temp;

      yield {
        stepIndex: stepIndex++,
        title: `Move Pivot to End`,
        description: `Move the pivot ${temp} to the end (index ${high}) so it is out of the way while the others are compared with it.`,
        codeLine: 4,
        state: { array: [...arr], low, high, pivotIndex: high, pivotValue: arr[high], sortedIndices: [...sortedIndices] },
        highlights: { type: 'swap', swapIndices: [randomPivotIdx, high], pivotIndex: high, window: [low, high] },
        metrics: { comparisons, swaps, recursiveCalls },
      };
    }

    // Step 2: Lomuto Partitioning
    const pivot = arr[high];
    let i = low - 1;

    yield {
      stepIndex: stepIndex++,
      title: `Begin Lomuto Partition`,
      description: `Now split positions ${low} to ${high} around ${pivot}: numbers ≤ ${pivot} go to a "small" zone on the left, larger numbers stay on the right. The small zone starts empty.`,
      codeLine: 5,
      state: { array: [...arr], low, high, pivotIndex: high, pivotValue: pivot, i, j: low, sortedIndices: [...sortedIndices] },
      highlights: { type: 'active', pivotIndex: high, window: [low, high], indices: [low] },
      metrics: { comparisons, swaps, recursiveCalls },
    };

    for (let j = low; j < high; j++) {
      comparisons++;
      const isSmallerOrEqual = arr[j] <= pivot;

      yield {
        stepIndex: stepIndex++,
        title: `Compare arr[${j}] with Pivot`,
        description: `Compare ${arr[j]} (index ${j}) with the pivot ${pivot}: ${isSmallerOrEqual ? `${arr[j]} ≤ ${pivot}, so it belongs in the small zone on the left.` : `${arr[j]} > ${pivot}, so it stays on the right.`}`,
        codeLine: [6, 7],
        state: { array: [...arr], low, high, pivotIndex: high, pivotValue: pivot, i, j, sortedIndices: [...sortedIndices] },
        highlights: { type: 'compare', compareIndices: [j, high], pivotIndex: high, window: [low, high] },
        metrics: { comparisons, swaps, recursiveCalls },
      };

      if (isSmallerOrEqual) {
        i++;
        if (i !== j) {
          swaps++;
          const t = arr[i];
          arr[i] = arr[j];
          arr[j] = t;

          yield {
            stepIndex: stepIndex++,
            title: `Swap arr[${i}] and arr[${j}]`,
            description: `Grow the small zone by one place (to index ${i}) and swap ${arr[i]} into it.`,
            codeLine: 8,
            state: { array: [...arr], low, high, pivotIndex: high, pivotValue: pivot, i, j, sortedIndices: [...sortedIndices] },
            highlights: { type: 'swap', swapIndices: [i, j], pivotIndex: high, window: [low, high] },
            metrics: { comparisons, swaps, recursiveCalls },
          };
        }
      }
    }

    // Place pivot into correct position i + 1
    const finalPivotPos = i + 1;
    if (finalPivotPos !== high) {
      swaps++;
      const t = arr[finalPivotPos];
      arr[finalPivotPos] = arr[high];
      arr[high] = t;
    }

    if (!sortedIndices.includes(finalPivotPos)) {
      sortedIndices.push(finalPivotPos);
    }

    yield {
      stepIndex: stepIndex++,
      title: `Pivot in Final Position`,
      description: `Put the pivot ${pivot} right after the small zone, at index ${finalPivotPos}. Everything left of it is smaller or equal and everything right is larger, so this is its final place.`,
      codeLine: [9, 10],
      state: { array: [...arr], low, high, pivotIndex: finalPivotPos, pivotValue: pivot, sortedIndices: [...sortedIndices] },
      highlights: { type: 'active', pivotIndex: finalPivotPos, sortedIndices: [...sortedIndices], window: [low, high] },
      metrics: { comparisons, swaps, recursiveCalls },
    };

    // Recursive calls
    yield* quickSort(low, finalPivotPos - 1);
    yield* quickSort(finalPivotPos + 1, high);
  }

  yield* quickSort(0, arr.length - 1);

  // Final check: all elements sorted
  for (let idx = 0; idx < arr.length; idx++) {
    if (!sortedIndices.includes(idx)) sortedIndices.push(idx);
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Quicksort Complete',
    description: `Done: the numbers are sorted from smallest to largest, using ${comparisons} comparisons and ${swaps} swaps.`,
    codeLine: 1,
    state: { array: [...arr], low: 0, high: arr.length - 1, sortedIndices: [...sortedIndices] },
    highlights: { sortedIndices: [...sortedIndices] },
    metrics: { comparisons, swaps, recursiveCalls },
    isFinal: true,
    result: arr,
  };
}
