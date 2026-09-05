import { AlgorithmStep } from '../types/algorithm';

export interface FractionalKnapsackItem {
  id: number;
  weight: number;
  value: number;
  ratio: number;
  fractionTaken: number; // 0.0 to 1.0
  weightTaken: number;
  valueTaken: number;
  status: 'pending' | 'sorting' | 'examining' | 'taken_full' | 'taken_fraction' | 'skipped';
}

export interface FractionalKnapsackState {
  items: FractionalKnapsackItem[];
  capacity: number;
  currentWeight: number;
  currentValue: number;
  currentItemIndex: number;
  isSorted: boolean;
  explanation?: string;
}

export function* fractionalKnapsackSteps(inputs: {
  weights?: number[];
  values?: number[];
  capacity?: number;
}): Generator<AlgorithmStep<FractionalKnapsackState>> {
  const rawWeights = inputs.weights || [10, 20, 30];
  const rawValues = inputs.values || [60, 100, 120];
  const capacity = Math.max(1, inputs.capacity ?? 50);

  const n = Math.min(rawWeights.length, rawValues.length);
  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  // 1. Initial State
  const initialItems: FractionalKnapsackItem[] = [];
  for (let i = 0; i < n; i++) {
    const w = Math.max(1, rawWeights[i]);
    const v = Math.max(0, rawValues[i]);
    initialItems.push({
      id: i + 1,
      weight: w,
      value: v,
      ratio: parseFloat((v / w).toFixed(3)),
      fractionTaken: 0,
      weightTaken: 0,
      valueTaken: 0,
      status: 'pending',
    });
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Items & Ratios',
    description: `Initialized ${n} items with capacity W = ${capacity}. Computed value-to-weight ratio (v/w) for each item.`,
    codeLine: 1,
    state: {
      items: initialItems.map((it) => ({ ...it })),
      capacity,
      currentWeight: 0,
      currentValue: 0,
      currentItemIndex: -1,
      isSorted: false,
      explanation: 'Calculate value/weight ratio for each item to prepare for greedy selection.',
    },
    highlights: {
      indices: initialItems.map((_, i) => i),
    },
    metrics: { comparisons: 0, iterations: 0 },
  };

  // 2. Sorting by Ratio descending
  const sortedItems = [...initialItems].sort((a, b) => {
    comparisons++;
    return b.ratio - a.ratio;
  });

  yield {
    stepIndex: stepIndex++,
    title: 'Sort Items by Value/Weight Ratio Descending',
    description: `Sorted items by greedy heuristic ratio: [${sortedItems
      .map((it) => `Item ${it.id} (${it.ratio})`)
      .join(' > ')}].`,
    codeLine: 2,
    state: {
      items: sortedItems.map((it) => ({ ...it, status: 'sorting' })),
      capacity,
      currentWeight: 0,
      currentValue: 0,
      currentItemIndex: -1,
      isSorted: true,
      explanation: 'Greedy choice property: Prioritize items providing the highest value density per unit weight.',
    },
    highlights: {
      sortedIndices: sortedItems.map((_, i) => i),
    },
    metrics: { comparisons, iterations },
  };

  let currentWeight = 0;
  let currentValue = 0;

  // 3. Process each sorted item
  for (let i = 0; i < sortedItems.length; i++) {
    iterations++;
    const item = sortedItems[i];
    const remainingCap = capacity - currentWeight;

    // Examining item step
    sortedItems[i] = { ...item, status: 'examining' };
    yield {
      stepIndex: stepIndex++,
      title: `Examining Item ${item.id} (Ratio: ${item.ratio})`,
      description: `Examining Item ${item.id} with weight ${item.weight}, value ${item.value}. Remaining knapsack capacity: ${remainingCap} / ${capacity}.`,
      codeLine: 3,
      state: {
        items: sortedItems.map((it) => ({ ...it })),
        capacity,
        currentWeight,
        currentValue,
        currentItemIndex: i,
        isSorted: true,
        explanation: `Comparing item weight (${item.weight}) against remaining capacity (${remainingCap}).`,
      },
      highlights: {
        activeIndices: [i],
      },
      metrics: { comparisons, iterations },
    };

    if (remainingCap <= 0) {
      // Knapsack already full, skip remaining
      sortedItems[i] = {
        ...item,
        status: 'skipped',
        fractionTaken: 0,
        weightTaken: 0,
        valueTaken: 0,
      };
      yield {
        stepIndex: stepIndex++,
        title: `Skip Item ${item.id} (Capacity Saturated)`,
        description: `Knapsack capacity is fully saturated (current weight = ${currentWeight}/${capacity}). Skipping Item ${item.id}.`,
        codeLine: 4,
        state: {
          items: sortedItems.map((it) => ({ ...it })),
          capacity,
          currentWeight,
          currentValue,
          currentItemIndex: i,
          isSorted: true,
          explanation: 'No remaining capacity available; remaining items are skipped.',
        },
        highlights: {
          indices: [i],
        },
        metrics: { comparisons, iterations },
      };
      continue;
    }

    if (item.weight <= remainingCap) {
      // Take 100% of item
      currentWeight += item.weight;
      currentValue += item.value;
      sortedItems[i] = {
        ...item,
        status: 'taken_full',
        fractionTaken: 1,
        weightTaken: item.weight,
        valueTaken: item.value,
      };

      yield {
        stepIndex: stepIndex++,
        title: `Take 100% of Item ${item.id}`,
        description: `Item ${item.id} fits entirely (${item.weight} <= ${remainingCap}). Added weight +${item.weight}, value +${item.value}. Cumulative Weight: ${currentWeight}/${capacity}, Cumulative Value: ${currentValue}.`,
        codeLine: 5,
        state: {
          items: sortedItems.map((it) => ({ ...it })),
          capacity,
          currentWeight,
          currentValue,
          currentItemIndex: i,
          isSorted: true,
          explanation: `Full item added: fraction = 1.0, weight = ${item.weight}, value = ${item.value}.`,
        },
        highlights: {
          activeIndices: [i],
        },
        metrics: { comparisons, iterations },
      };
    } else {
      // Take fractional part of item
      const fraction = remainingCap / item.weight;
      const weightTaken = remainingCap;
      const valueTaken = parseFloat((fraction * item.value).toFixed(2));

      currentWeight += weightTaken;
      currentValue = parseFloat((currentValue + valueTaken).toFixed(2));

      sortedItems[i] = {
        ...item,
        status: 'taken_fraction',
        fractionTaken: parseFloat(fraction.toFixed(3)),
        weightTaken,
        valueTaken,
      };

      yield {
        stepIndex: stepIndex++,
        title: `Take ${(fraction * 100).toFixed(1)}% Fraction of Item ${item.id}`,
        description: `Item ${item.id} (weight ${item.weight}) exceeds remaining capacity ${remainingCap}. Sliced item to take fraction ${remainingCap}/${item.weight} (${(fraction * 100).toFixed(1)}%). Added weight +${weightTaken}, value +${valueTaken}. Knapsack is now 100% full.`,
        codeLine: 6,
        state: {
          items: sortedItems.map((it) => ({ ...it })),
          capacity,
          currentWeight,
          currentValue,
          currentItemIndex: i,
          isSorted: true,
          explanation: `Fractional slice: fraction = ${fraction.toFixed(3)}, weight added = ${weightTaken}, value added = ${valueTaken}.`,
        },
        highlights: {
          activeIndices: [i],
        },
        metrics: { comparisons, iterations },
      };
    }
  }

  // 4. Final step
  const takenItems = sortedItems.filter((it) => it.fractionTaken > 0);
  yield {
    stepIndex: stepIndex++,
    title: 'Fractional Knapsack Complete',
    description: `Greedy selection completed. Maximum achievable value: ${currentValue} with total knapsack weight ${currentWeight} / ${capacity}.`,
    codeLine: 7,
    state: {
      items: sortedItems.map((it) => ({ ...it })),
      capacity,
      currentWeight,
      currentValue,
      currentItemIndex: -1,
      isSorted: true,
      explanation: `Optimal solution achieved by greedy strategy using value/weight sorting.`,
    },
    highlights: {
      sortedIndices: sortedItems.map((_, idx) => idx),
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      maxValue: currentValue,
      totalWeight: currentWeight,
      capacity,
      itemsTaken: takenItems.map((it) => ({
        id: it.id,
        fraction: it.fractionTaken,
        weightTaken: it.weightTaken,
        valueTaken: it.valueTaken,
      })),
      fractions: sortedItems.map((it) => ({
        id: it.id,
        fraction: it.fractionTaken,
      })),
    },
  };
}
