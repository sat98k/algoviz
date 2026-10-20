import { AlgorithmStep, DpRuleStep } from '../types/algorithm';

export interface KnapsackItem {
  id: number;
  weight: number;
  value: number;
  name?: string;
}

export interface KnapsackDPState {
  /** The DP rule applied at this step, for the "Rule for this cell" card. */
  dpRule?: DpRuleStep;
  items: KnapsackItem[];
  capacity: number;
  dpTable: number[][];
  currentRow: number;
  currentCol: number;
  selectedItems: number[];
  formulaExplanation?: string;
  backtrackPath?: { r: number; c: number }[];
  maxValue?: number;
  backtrackPhase?: boolean;
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
    description: `Created a ${n + 1} × ${capacity + 1} table. dp[i][w] will hold the best value using only the first i items with capacity w. Row 0 is all zeros because with no items there is nothing to carry, and column 0 is all zeros because with no capacity nothing fits.`,
    codeLine: 2,
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
          description: `Item ${i} (weight ${item.weight}) does not fit in capacity ${w}, so the best value is the same as without it: copy the cell above, dp[${i - 1}][${w}] = ${dp[i][w]}.`,
          codeLine: [6, 7],
          state: {
            items,
            capacity,
            dpTable: dp.map((row) => [...row]),
            currentRow: i,
            currentCol: w,
            selectedItems: [],
            formulaExplanation: `dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`,
            dpRule: {
              label: 'Item does not fit',
              tone: 'mismatch',
              check: { text: `weight ${item.weight} ≤ capacity ${w}`, ok: false },
              formula: 'dp[i][w] = dp[i−1][w]',
              substitution: `dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`,
              action: 'Copy the cell above.',
            },
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
          title: `Evaluate Item ${i} at Weight ${w}`,
          description: `Item ${i} fits in capacity ${w}, so compare leaving it out with taking it. Leave it out: dp[${i - 1}][${w}] = ${excludeVal}. Take it: its value ${item.value} + dp[${i - 1}][${w - item.weight}] = ${item.value} + ${dp[i - 1][w - item.weight]} = ${includeVal}. ${includeVal > excludeVal ? 'Taking it gives more value.' : includeVal === excludeVal ? 'Both give the same value, so it is left out.' : 'Leaving it out gives more value.'}`,
          codeLine: [8, 9, 10, 11],
          state: {
            items,
            capacity,
            dpTable: dp.map((row) => [...row]),
            currentRow: i,
            currentCol: w,
            selectedItems: [],
            formulaExplanation: `dp[${i}][${w}] = max(dp[${i - 1}][${w}] = ${excludeVal}, ${item.value} + dp[${i - 1}][${w - item.weight}] = ${includeVal}) = ${dp[i][w]}`,
            dpRule: {
              label: 'Item fits',
              tone: 'match',
              check: { text: `weight ${item.weight} ≤ capacity ${w}`, ok: true },
              formula: 'dp[i][w] = max( dp[i−1][w], vᵢ + dp[i−1][w−wᵢ] )',
              substitution: `dp[${i}][${w}] = max( ${excludeVal}, ${item.value} + ${dp[i - 1][w - item.weight]} ) = ${dp[i][w]}`,
              action: includeVal > excludeVal ? `Take item ${i} (${includeVal} > ${excludeVal}).` : `Leave item ${i} out (${excludeVal} ≥ ${includeVal}).`,
            },
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

  // --- PHASE 2: Step-by-Step Backtrack Reconstruction ---
  const selectedItems: number[] = [];
  const backtrackPath: { r: number; c: number }[] = [];
  let currW = capacity;

  yield {
    stepIndex: stepIndex++,
    title: 'DP Table Complete: Begin Item Backtracking',
    description: `DP table fill completed with optimal value dp[${n}][${capacity}] = ${dp[n][capacity]}. Starting backtrack from cell (${n}, ${capacity}) to identify which items were selected.`,
    codeLine: 12,
    state: {
      items,
      capacity,
      dpTable: dp.map((row) => [...row]),
      currentRow: n,
      currentCol: capacity,
      selectedItems: [],
      backtrackPath: [{ r: n, c: capacity }],
      maxValue: dp[n][capacity],
      backtrackPhase: true,
      formulaExplanation: `Start backtracking at cell (${n}, ${capacity}) with max value = ${dp[n][capacity]}.`,
    },
    highlights: {
      cells: [{ r: n, c: capacity, status: 'path' }],
    },
    metrics: { comparisons, iterations },
  };

  for (let i = n; i > 0; i--) {
    const item = items[i - 1];
    const valCurr = dp[i][currW];
    const valPrev = dp[i - 1][currW];
    backtrackPath.push({ r: i, c: currW });

    if (valCurr !== valPrev) {
      // Item was included
      selectedItems.push(i);
      const nextW = currW - item.weight;

      yield {
        stepIndex: stepIndex++,
        title: `Backtrack: Item ${i} INCLUDED`,
        description: `At cell (i=${i}, w=${currW}): dp[${i}][${currW}] = ${valCurr} vs dp[${i - 1}][${currW}] = ${valPrev} (NOT EQUAL). Item ${i} (weight: ${item.weight}, value: ${item.value}) was INCLUDED! Moving cursor to (i=${i - 1}, w=${nextW}).`,
        codeLine: 12,
        state: {
          items,
          capacity,
          dpTable: dp.map((row) => [...row]),
          currentRow: i,
          currentCol: currW,
          selectedItems: [...selectedItems],
          backtrackPath: [...backtrackPath],
          maxValue: dp[n][capacity],
          backtrackPhase: true,
          formulaExplanation: `dp[${i}][${currW}] (${valCurr}) != dp[${i - 1}][${currW}] (${valPrev}) ➔ Item ${i} INCLUDED (+${item.value})`,
          dpRule: {
            label: 'Traceback: was item taken?',
            tone: 'decision',
            check: { text: `dp[${i}][${currW}] = ${valCurr} ≠ dp[${i - 1}][${currW}] = ${valPrev}`, ok: true },
            formula: 'taken ⇔ dp[i][w] ≠ dp[i−1][w]',
            substitution: `w = ${currW} − ${item.weight} = ${nextW}`,
            action: `Item ${i} was taken: move to dp[${i - 1}][${nextW}].`,
          },
        },
        highlights: {
          cells: [
            ...backtrackPath.map((p) => ({ ...p, status: 'path' as const })),
            { r: i, c: currW, status: 'active' as const },
            { r: i - 1, c: currW, status: 'source' as const },
            { r: i - 1, c: nextW, status: 'path' as const },
          ],
        },
        metrics: { comparisons, iterations },
      };

      currW = nextW;
    } else {
      // Item was excluded
      yield {
        stepIndex: stepIndex++,
        title: `Backtrack: Item ${i} NOT Included`,
        description: `At cell (i=${i}, w=${currW}): dp[${i}][${currW}] = ${valCurr} vs dp[${i - 1}][${currW}] = ${valPrev} (EQUAL). Item ${i} was NOT included. Moving cursor directly up to (i=${i - 1}, w=${currW}).`,
        codeLine: 12,
        state: {
          items,
          capacity,
          dpTable: dp.map((row) => [...row]),
          currentRow: i,
          currentCol: currW,
          selectedItems: [...selectedItems],
          backtrackPath: [...backtrackPath],
          maxValue: dp[n][capacity],
          backtrackPhase: true,
          formulaExplanation: `dp[${i}][${currW}] (${valCurr}) == dp[${i - 1}][${currW}] (${valPrev}) ➔ Item ${i} Excluded`,
          dpRule: {
            label: 'Traceback: was item taken?',
            tone: 'decision',
            check: { text: `dp[${i}][${currW}] = ${valCurr} ≠ dp[${i - 1}][${currW}] = ${valPrev}`, ok: false },
            formula: 'taken ⇔ dp[i][w] ≠ dp[i−1][w]',
            substitution: `w stays ${currW}`,
            action: `Item ${i} was not taken: move up to dp[${i - 1}][${currW}].`,
          },
        },
        highlights: {
          cells: [
            ...backtrackPath.map((p) => ({ ...p, status: 'path' as const })),
            { r: i, c: currW, status: 'active' as const },
            { r: i - 1, c: currW, status: 'source' as const },
          ],
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
    description: `Backtrack completed. Optimal solution achieved: Total Value = ${totalVal}, Total Weight = ${totalWeight}/${capacity}. Selected Items: [${selectedItems.map((id) => `Item ${id}`).join(', ')}].`,
    codeLine: 13,
    state: {
      items,
      capacity,
      dpTable: dp.map((row) => [...row]),
      currentRow: 0,
      currentCol: 0,
      selectedItems,
      backtrackPath,
      maxValue: totalVal,
      backtrackPhase: true,
      formulaExplanation: `Optimal Solution: Items [${selectedItems.join(', ')}] with total value = ${totalVal} and total weight = ${totalWeight}/${capacity}.`,
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
