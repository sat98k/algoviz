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
  /** Position in value/weight order (1 = highest ratio); set once the items are sorted. */
  rank?: number;
}

export interface FractionalKnapsackState {
  items: FractionalKnapsackItem[];
  capacity: number;
  currentWeight: number;
  currentValue: number;
  currentItemIndex: number;
  isSorted: boolean;
  explanation?: string;
  /** Item ids in the order they were entered. */
  originalOrder: number[];
  /** The test on the current item: does it fit in the remaining capacity? */
  fitCheck?: { weight: number; remaining: number; fits: boolean };
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

  const originalOrder = initialItems.map((it) => it.id);

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Items & Ratios',
    description: `We have ${n} items and a knapsack that holds ${capacity} kg. For each item, value ÷ weight tells us what one kg of it is worth: the higher, the better the deal.`,
    codeLine: 2,
    state: {
      items: initialItems.map((it) => ({ ...it })),
      capacity,
      currentWeight: 0,
      currentValue: 0,
      currentItemIndex: -1,
      isSorted: false,
      originalOrder,
      explanation: 'Calculate value/weight ratio for each item to prepare for greedy selection.',
    },
    highlights: {
      indices: initialItems.map((_, i) => i),
    },
    metrics: { comparisons: 0, iterations: 0 },
  };

  // 2. Sorting by Ratio descending
  const sortedItems = [...initialItems]
    .sort((a, b) => {
      comparisons++;
      return b.ratio - a.ratio;
    })
    .map((it, idx) => ({ ...it, rank: idx + 1 }));

  yield {
    stepIndex: stepIndex++,
    title: 'Sort Items by Value/Weight Ratio Descending',
    description: `Sorted the items by value per kg, best deal first. We will always pack the best deal first (the greedy choice): [${sortedItems
      .map((it) => `Item ${it.id} (${it.ratio})`)
      .join(' > ')}].`,
    codeLine: 3,
    state: {
      items: sortedItems.map((it) => ({ ...it, status: 'sorting' })),
      capacity,
      currentWeight: 0,
      currentValue: 0,
      currentItemIndex: -1,
      isSorted: true,
      originalOrder,
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
      description: `Next best deal: Item ${item.id} (weight ${item.weight} kg, value ${item.value}). The knapsack has ${remainingCap} kg of space left. Does the whole item fit?`,
      codeLine: 5,
      state: {
        items: sortedItems.map((it) => ({ ...it })),
        capacity,
        currentWeight,
        currentValue,
        currentItemIndex: i,
        isSorted: true,
        originalOrder,
        explanation: `Comparing item weight (${item.weight}) against remaining capacity (${remainingCap}).`,
        fitCheck: remainingCap > 0 ? { weight: item.weight, remaining: remainingCap, fits: item.weight <= remainingCap } : undefined,
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
        description: `The knapsack is already full (${currentWeight}/${capacity} kg), so Item ${item.id} is left out.`,
        codeLine: 10,
        state: {
          items: sortedItems.map((it) => ({ ...it })),
          capacity,
          currentWeight,
          currentValue,
          currentItemIndex: i,
          isSorted: true,
          originalOrder,
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
        description: `Yes: Item ${item.id} weighs ${item.weight} kg and ${remainingCap} kg of space is left, so we take all of it (+${item.value} value). The knapsack now holds ${currentWeight}/${capacity} kg worth ${currentValue}.`,
        codeLine: [6, 7],
        state: {
          items: sortedItems.map((it) => ({ ...it })),
          capacity,
          currentWeight,
          currentValue,
          currentItemIndex: i,
          isSorted: true,
          originalOrder,
          explanation: `Full item added: fraction = 1.0, weight = ${item.weight}, value = ${item.value}.`,
          fitCheck: { weight: item.weight, remaining: remainingCap, fits: true },
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
        description: `No: Item ${item.id} weighs ${item.weight} kg but only ${remainingCap} kg of space is left. Because items can be cut, we take just ${remainingCap}/${item.weight} of it (${(fraction * 100).toFixed(1)}%), which adds ${valueTaken} value. The knapsack is now exactly full.`,
        codeLine: [8, 9, 10],
        state: {
          items: sortedItems.map((it) => ({ ...it })),
          capacity,
          currentWeight,
          currentValue,
          currentItemIndex: i,
          isSorted: true,
          originalOrder,
          explanation: `Fractional slice: fraction = ${fraction.toFixed(3)}, weight added = ${weightTaken}, value added = ${valueTaken}.`,
          fitCheck: { weight: item.weight, remaining: remainingCap, fits: false },
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
    description: `Done: the knapsack is full (${currentWeight}/${capacity} kg) with total value ${currentValue}. When items can be cut, packing the best value per kg first can never be beaten.`,
    codeLine: 11,
    state: {
      items: sortedItems.map((it) => ({ ...it })),
      capacity,
      currentWeight,
      currentValue,
      currentItemIndex: -1,
      isSorted: true,
      originalOrder,
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
