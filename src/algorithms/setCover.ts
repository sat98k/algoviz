import { AlgorithmStep } from '../types/algorithm';

export interface SetCoverCandidate {
  id: string;
  label: string;
  elements: number[];
  uncoveredCount: number;
}

export interface SetCoverState {
  universe: number[];
  subsets: SetCoverCandidate[];
  coveredElements: number[];
  uncoveredElements: number[];
  selectedSubsets: string[];
  currentPickedSubset?: SetCoverCandidate;
  newlyCoveredElements?: number[];
  phase: 'init' | 'select' | 'update' | 'complete';
}

export function* setCoverSteps(inputs: {
  universeSize?: number;
  subsets?: { id: string; label: string; elements: number[] }[];
}): Generator<AlgorithmStep<SetCoverState>> {
  const defaultUniverseSize = 10;
  const defaultSubsets: { id: string; label: string; elements: number[] }[] = [
    { id: 'S1', label: 'Set S1', elements: [1, 2, 3, 4] },
    { id: 'S2', label: 'Set S2', elements: [3, 4, 5, 6, 7] },
    { id: 'S3', label: 'Set S3', elements: [6, 7, 8] },
    { id: 'S4', label: 'Set S4', elements: [1, 5, 9, 10] },
    { id: 'S5', label: 'Set S5', elements: [2, 8, 10] },
  ];

  const uSize = inputs.universeSize ?? defaultUniverseSize;
  const universe: number[] = Array.from({ length: uSize }, (_, i) => i + 1);

  const rawSubsets = inputs.subsets && inputs.subsets.length > 0 ? inputs.subsets : defaultSubsets;

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  const covered = new Set<number>();
  const selectedSubsetIds: string[] = [];

  const getCandidates = (): SetCoverCandidate[] => {
    return rawSubsets.map((s) => {
      const uncovCount = s.elements.filter((e) => !covered.has(e)).length;
      return {
        id: s.id,
        label: s.label,
        elements: [...s.elements],
        uncoveredCount: uncovCount,
      };
    });
  };

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Greedy Set Cover',
    description: `Loaded Universe U with ${universe.length} elements {1..${uSize}} and ${rawSubsets.length} candidate subsets. Goal: Find minimal subset collection covering all elements.`,
    codeLine: 1,
    state: {
      universe: [...universe],
      subsets: getCandidates(),
      coveredElements: [],
      uncoveredElements: [...universe],
      selectedSubsets: [],
      phase: 'init',
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  while (covered.size < universe.length) {
    iterations++;
    const candidates = getCandidates();

    // Greedily pick subset with maximum uncovered elements among unselected subsets
    let bestSubset: SetCoverCandidate | null = null;
    let maxUncovered = 0;

    for (const sub of candidates) {
      if (selectedSubsetIds.includes(sub.id)) continue;
      comparisons++;
      if (sub.uncoveredCount > maxUncovered) {
        maxUncovered = sub.uncoveredCount;
        bestSubset = sub;
      }
    }

    if (!bestSubset || maxUncovered === 0) {
      // Cannot cover remaining elements (disconnected universe)
      break;
    }

    // Newly covered elements by this subset
    const newlyCovered = bestSubset.elements.filter((e) => !covered.has(e));

    yield {
      stepIndex: stepIndex++,
      title: `Greedily Select ${bestSubset.label} (Covers +${maxUncovered} New Elements)`,
      description: `Evaluated candidate subsets. ${bestSubset.label} contains the highest number of currently uncovered elements (${maxUncovered} new elements: {${newlyCovered.join(', ')}}).`,
      codeLine: [2, 3, 4],
      state: {
        universe: [...universe],
        subsets: candidates,
        coveredElements: Array.from(covered),
        uncoveredElements: universe.filter((e) => !covered.has(e)),
        selectedSubsets: [...selectedSubsetIds],
        currentPickedSubset: bestSubset,
        newlyCoveredElements: newlyCovered,
        phase: 'select',
      },
      highlights: {
        indices: newlyCovered,
      },
      metrics: { comparisons, iterations },
    };

    // Add to selected
    selectedSubsetIds.push(bestSubset.id);
    for (const elem of newlyCovered) {
      covered.add(elem);
    }

    yield {
      stepIndex: stepIndex++,
      title: `Update Covered Elements (+${newlyCovered.length} Covered)`,
      description: `Added ${bestSubset.label} to the cover. Total elements covered: ${covered.size} / ${universe.length} (${Math.round((covered.size / universe.length) * 100)}%).`,
      codeLine: [5, 6],
      state: {
        universe: [...universe],
        subsets: getCandidates(),
        coveredElements: Array.from(covered),
        uncoveredElements: universe.filter((e) => !covered.has(e)),
        selectedSubsets: [...selectedSubsetIds],
        currentPickedSubset: bestSubset,
        newlyCoveredElements: newlyCovered,
        phase: 'update',
      },
      highlights: {
        indices: Array.from(covered),
      },
      metrics: { comparisons, iterations },
    };
  }

  // Harmonic number H(|U|) approximation guarantee
  let harmonicBound = 0;
  for (let k = 1; k <= universe.length; k++) harmonicBound += 1 / k;

  const isCoverComplete = covered.size === universe.length;

  yield {
    stepIndex: stepIndex++,
    title: 'Greedy Set Cover Complete',
    description: `Set cover finished! ${selectedSubsetIds.length} subsets selected: [${selectedSubsetIds.join(', ')}]. ${covered.size}/${universe.length} elements covered. Greedy approximation guarantee: |C| <= OPT * (ln |U| + 1) = OPT * ${harmonicBound.toFixed(2)}.`,
    codeLine: 7,
    state: {
      universe: [...universe],
      subsets: getCandidates(),
      coveredElements: Array.from(covered),
      uncoveredElements: universe.filter((e) => !covered.has(e)),
      selectedSubsets: [...selectedSubsetIds],
      phase: 'complete',
    },
    highlights: {
      indices: Array.from(covered),
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      totalSubsetsSelected: selectedSubsetIds.length,
      selectedSubsets: selectedSubsetIds,
      totalUniverseSize: universe.length,
      coveredCount: covered.size,
      isFullyCovered: isCoverComplete,
      harmonicBound: parseFloat(harmonicBound.toFixed(2)),
      approximationFactor: `ln(|U|) + 1 ≈ ${harmonicBound.toFixed(2)}`,
    },
  };
}
