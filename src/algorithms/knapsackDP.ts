import { AlgorithmStep } from '../types/algorithm';

export interface KnapsackItem {
  id: number;
  weight: number;
  value: number;
  name?: string;
}

export interface KnapsackDPState {
  items: KnapsackItem[];
  capacity: number;
  dpTable: number[][];
  currentRow: number;
  currentCol: number;
  selectedItems: number[];
  formulaExplanation?: string;
  backtrackPath?: { r: number; c: number }[];
  maxValue?: number;
}

export function* knapsackDPSteps(inputs: {
  weights: number[];
  values: number[];
  capacity: number;
}): Generator<AlgorithmStep<KnapsackDPState>> {
  const weights = inputs.weights || [2, 3, 4, 5];
  const values = inputs.values || [3, 4, 5, 6];
  const capacity = Math.max(1, inputs.capacity || 5);
  const n = Math.min(weights.length, values.length);

  const items: KnapsackItem[] = [];
  for (let i = 0; i < n; i++) {
    items.push({ id: i + 1, weight: weights[i], value: values[i], name: `Item ${i + 1}` });
  }

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  // Initialize DP table with (n+1) rows and (capacity+1) cols with zeros
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize DP Table',
    description: `Created ${(n + 1)} x ${(capacity + 1)} DP table initialized with 0 for base cases (0 items or 0 capacity).`,
    codeLine: 1,
    state: {
      items,
      capacity,
      dpTable: dp.map((row) => [...row]),
      currentRow: 0,
      currentCol: 0,
      selectedItems: [],
    },
    highlights: {
      cells: [
        ...Array.from({ length: capacity + 1 }, (_, c) => ({ r: 0, c, status: 'visited' as const })),
        ...Array.from({ length: n + 1 }, (_, r) => ({ r, c: 0, status: 'visited' as const })),
      ],
    },
    metrics: { comparisons, iterations },
  };

  // Bottom-up computation
  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    for (let w = 1; w <= capacity; w++) {
      iterations++;
      comparisons++;

      if (item.weight > w) {
        // Cannot include item
        dp[i][w] = dp[i - 1][w];
        yield {
          stepIndex: stepIndex++,
          title: `Item ${i} Exceeds Weight ${w}`,
          description: `Item ${i} (wt: ${item.weight}, val: ${item.value}) is heavier than current capacity ${w}. dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}.`,
          codeLine: 2,
          state: {
            items,
            capacity,
            dpTable: dp.map((row) => [...row]),
            currentRow: i,
            currentCol: w,
            selectedItems: [],
            formulaExplanation: `dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`,
          },
          highlights: {
            cells: [
              { r: i, c: w, status: 'active' },
              { r: i - 1, c: w, status: 'source' },
            ],
          },
          metrics: { comparisons, iterations },
        };
      } else {
        // Can include or exclude
        const excludeVal = dp[i - 1][w];
        const includeVal = item.value + dp[i - 1][w - item.weight];
        dp[i][w] = Math.max(excludeVal, includeVal);

        yield {
          stepIndex: stepIndex++,
          title: `Compute dp[${i}][${w}]`,
          description: `Item ${i} fits (wt: ${item.weight}, val: ${item.value}). Exclude: dp[${i - 1}][${w}] = ${excludeVal}. Include: ${item.value} + dp[${i - 1}][${w - item.weight}] = ${includeVal}. Max = ${dp[i][w]}.`,
          codeLine: 3,
          state: {
            items,
            capacity,
            dpTable: dp.map((row) => [...row]),
            currentRow: i,
            currentCol: w,
            selectedItems: [],
            formulaExplanation: `max(exclude=${excludeVal}, include=${includeVal}) = ${dp[i][w]}`,
          },
          highlights: {
            cells: [
              { r: i, c: w, status: 'active' },
              { r: i - 1, c: w, status: 'source' },
              { r: i - 1, c: w - item.weight, status: 'source' },
            ],
          },
          metrics: { comparisons, iterations },
        };
      }
    }
  }

  // Backtracking phase to find selected items
  const selectedItems: number[] = [];
  const backtrackPath: { r: number; c: number }[] = [];
  let currW = capacity;

  for (let i = n; i > 0; i--) {
    backtrackPath.push({ r: i, c: currW });
    if (dp[i][currW] !== dp[i - 1][currW]) {
      selectedItems.push(i);
      currW -= items[i - 1].weight;
      yield {
        stepIndex: stepIndex++,
        title: `Backtrack: Item ${i} Included`,
        description: `dp[${i}][${currW + items[i - 1].weight}] != dp[${i - 1}][${currW + items[i - 1].weight}], so Item ${i} was included! Remaining capacity: ${currW}.`,
        codeLine: 4,
        state: {
          items,
          capacity,
          dpTable: dp.map((row) => [...row]),
          currentRow: i,
          currentCol: currW,
          selectedItems: [...selectedItems],
          backtrackPath: [...backtrackPath],
          maxValue: dp[n][capacity],
        },
        highlights: {
          cells: backtrackPath.map((p) => ({ ...p, status: 'path' as const })),
        },
        metrics: { comparisons, iterations },
      };
    } else {
      yield {
        stepIndex: stepIndex++,
        title: `Backtrack: Item ${i} Excluded`,
        description: `dp[${i}][${currW}] == dp[${i - 1}][${currW}], so Item ${i} was not included.`,
        codeLine: 5,
        state: {
          items,
          capacity,
          dpTable: dp.map((row) => [...row]),
          currentRow: i,
          currentCol: currW,
          selectedItems: [...selectedItems],
          backtrackPath: [...backtrackPath],
          maxValue: dp[n][capacity],
        },
        highlights: {
          cells: backtrackPath.map((p) => ({ ...p, status: 'path' as const })),
        },
        metrics: { comparisons, iterations },
      };
    }
  }
  backtrackPath.push({ r: 0, c: currW });
  selectedItems.reverse();

  const chosenItemDetails = selectedItems.map((id) => items[id - 1]);
  const totalWeight = chosenItemDetails.reduce((sum, it) => sum + it.weight, 0);
  const totalVal = dp[n][capacity];

  yield {
    stepIndex: stepIndex++,
    title: '0-1 Knapsack Complete',
    description: `Optimal solution found: Maximum Value = ${totalVal}, Total Weight = ${totalWeight}/${capacity}. Selected Items: [${selectedItems.join(', ')}].`,
    codeLine: 6,
    state: {
      items,
      capacity,
      dpTable: dp.map((row) => [...row]),
      currentRow: 0,
      currentCol: 0,
      selectedItems,
      backtrackPath,
      maxValue: totalVal,
    },
    highlights: {
      cells: backtrackPath.map((p) => ({ ...p, status: 'path' as const })),
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      maxValue: totalVal,
      totalWeight,
      capacity,
      selectedItemIndices: selectedItems,
      selectedItems: chosenItemDetails,
    },
  };
}
