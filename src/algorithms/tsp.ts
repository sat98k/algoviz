import { AlgorithmStep } from '../types/algorithm';

export interface TspCity {
  id: number;
  label: string;
  name?: string;
  x: number;
  y: number;
}

export interface CandidateEdge {
  u: number;
  v: number;
  subCost: number;
  edgeCost: number;
  totalCost: number;
  isChosen: boolean;
}

export interface TspState {
  numCities: number;
  cities: TspCity[];
  costMatrix: number[][];
  subsets: number[]; // valid masks ordered by size (only subsets containing city 0)
  dpTable: Record<string, number | null>; // key: `${mask},${city}` -> min cost
  parentTable: Record<string, number | null>; // key: `${mask},${city}` -> predecessor city
  currentMask: number;
  currentCity: number;
  currentPhase: 'init' | 'base' | 'fill' | 'close' | 'reconstruct' | 'complete';
  candidateEdges: CandidateEdge[];
  activeTourEdges: { u: number; v: number }[];
  optimalTour?: number[];
  optimalCost?: number;
  calculationFormula?: string;
  currentSubsetLabel?: string;
  explanation?: string;
}

export interface TspInputs {
  numCities?: number;
  costMatrix?: number[][];
  cityNames?: string[];
}

// Format a bitmask into human-readable subset string, e.g. "{A, B, C}"
export function formatSubsetMask(mask: number, cities: TspCity[]): string {
  const members: string[] = [];
  for (let i = 0; i < cities.length; i++) {
    if ((mask & (1 << i)) !== 0) {
      members.push(cities[i].label);
    }
  }
  return `{${members.join(', ')}}`;
}

// Count set bits in an integer
export function popcount(n: number): number {
  let count = 0;
  let val = n;
  while (val > 0) {
    count += val & 1;
    val >>= 1;
  }
  return count;
}

// Classic 4-city symmetric distance matrix from standard textbooks (CLRS / standard algorithms)
export const DEFAULT_TSP_MATRIX_4: number[][] = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];

export const DEFAULT_TSP_CITY_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const DEFAULT_BASE_COSTS: number[][] = [
  [0, 10, 15, 20, 25, 30, 35, 40],
  [10, 0, 35, 25, 18, 22, 28, 32],
  [15, 35, 0, 30, 24, 16, 20, 26],
  [20, 25, 30, 0, 14, 28, 34, 18],
  [25, 18, 24, 14, 0, 12, 16, 22],
  [30, 22, 16, 28, 12, 0, 10, 15],
  [35, 28, 20, 34, 16, 10, 0, 12],
  [40, 32, 26, 18, 22, 15, 12, 0],
];

export function createDefaultCostMatrix(n: number): number[][] {
  const targetN = Math.min(Math.max(n, 3), 8);
  return Array.from({ length: targetN }, (_, r) =>
    Array.from({ length: targetN }, (_, c) => DEFAULT_BASE_COSTS[r][c])
  );
}

export function ensureSymmetricCostMatrix(matrix: number[][] | undefined, n: number): number[][] {
  const targetN = Math.min(Math.max(n, 3), 8);
  const result: number[][] = Array.from({ length: targetN }, () => Array(targetN).fill(0));

  for (let r = 0; r < targetN; r++) {
    for (let c = 0; c < targetN; c++) {
      if (r === c) {
        result[r][c] = 0;
      } else {
        const raw = matrix?.[r]?.[c] ?? matrix?.[c]?.[r];
        const num = Number(raw);
        if (!isNaN(num) && num > 0) {
          result[r][c] = Math.round(num);
        } else {
          result[r][c] = DEFAULT_BASE_COSTS[r]?.[c] ?? (Math.abs(r - c) * 10 + 5);
        }
      }
    }
  }

  // Guarantee exact symmetry: result[r][c] === result[c][r]
  for (let r = 0; r < targetN; r++) {
    for (let c = r + 1; c < targetN; c++) {
      result[c][r] = result[r][c];
    }
  }

  return result;
}

export function* tspSteps(inputs: TspInputs = {}): Generator<AlgorithmStep<TspState>> {
  // 1. Determine number of cities and single source of truth cost matrix
  const requestedN = inputs.numCities || inputs.costMatrix?.length || 4;
  const n = Math.min(Math.max(requestedN, 3), 8);
  const costMatrix = ensureSymmetricCostMatrix(inputs.costMatrix, n);

  // Generate city objects with circular layout positions (viewBox 500 x 400, center 250, 200, radius 145)
  const cx = 250;
  const cy = 200;
  const radius = n <= 4 ? 135 : 155;
  const cities: TspCity[] = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2; // start from top (12 o'clock)
    return {
      id: i,
      label: inputs.cityNames?.[i] || DEFAULT_TSP_CITY_NAMES[i] || `C${i}`,
      name: `City ${inputs.cityNames?.[i] || DEFAULT_TSP_CITY_NAMES[i] || i}`,
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
    };
  });

  // Precompute all valid subsets containing city 0, ordered by size s = 1..n
  const subsetsBySize: number[][] = Array.from({ length: n + 1 }, () => []);
  const totalMasks = 1 << n;
  for (let mask = 1; mask < totalMasks; mask++) {
    // Only consider subsets containing start city 0
    if ((mask & 1) !== 0) {
      const size = popcount(mask);
      subsetsBySize[size].push(mask);
    }
  }

  const allSubsets: number[] = [];
  for (let s = 1; s <= n; s++) {
    allSubsets.push(...subsetsBySize[s]);
  }

  const dpTable: Record<string, number | null> = {};
  const parentTable: Record<string, number | null> = {};

  // Initialize DP table entries to null
  for (const mask of allSubsets) {
    for (let j = 0; j < n; j++) {
      if ((mask & (1 << j)) !== 0) {
        dpTable[`${mask},${j}`] = null;
        parentTable[`${mask},${j}`] = null;
      }
    }
  }

  let stepIndex = 0;

  // -------------------------------------------------------------
  // Step 1: Initial state
  // -------------------------------------------------------------
  yield {
    stepIndex: stepIndex++,
    title: 'Initialize TSP Held-Karp Solver',
    description: `Initialized Travelling Salesman Problem for ${n} cities (${cities.map((c) => c.label).join(', ')}). Start vertex is ${cities[0].label}.`,
    codeLine: 1,
    state: {
      numCities: n,
      cities,
      costMatrix,
      subsets: allSubsets,
      dpTable: { ...dpTable },
      parentTable: { ...parentTable },
      currentMask: 1,
      currentCity: 0,
      currentPhase: 'init',
      candidateEdges: [],
      activeTourEdges: [],
      currentSubsetLabel: formatSubsetMask(1, cities),
      calculationFormula: 'DP[S, j] = minimum cost of tour starting at 0, visiting all cities in S, ending at j',
      explanation: `Held-Karp Dynamic Programming computes the minimum Hamiltonian cycle in O(n² · 2ⁿ) time by memoizing subproblems indexed by (subset S, ending city j). City ${cities[0].label} is the starting anchor.`,
    },
    highlights: {
      nodes: [cities[0].id],
      activeNode: cities[0].id,
    },
    metrics: {
      iterations: 0,
      comparisons: 0,
    },
  };

  // -------------------------------------------------------------
  // Step 2: Base Case DP[{0}, 0] = 0
  // -------------------------------------------------------------
  dpTable['1,0'] = 0;
  parentTable['1,0'] = null;

  yield {
    stepIndex: stepIndex++,
    title: `Base Case: DP[{${cities[0].label}}, ${cities[0].label}] = 0`,
    description: `Base Case: DP[{${cities[0].label}}, ${cities[0].label}] = 0. Cost to start at ${cities[0].label} with subset {${cities[0].label}} is 0.`,
    codeLine: 2,
    state: {
      numCities: n,
      cities,
      costMatrix,
      subsets: allSubsets,
      dpTable: { ...dpTable },
      parentTable: { ...parentTable },
      currentMask: 1,
      currentCity: 0,
      currentPhase: 'base',
      candidateEdges: [],
      activeTourEdges: [],
      currentSubsetLabel: formatSubsetMask(1, cities),
      calculationFormula: `DP[{${cities[0].label}}, ${cities[0].label}] = 0`,
      explanation: `Base state initialization: A tour containing only start city ${cities[0].label} and ending at ${cities[0].label} incurs 0 cost.`,
    },
    highlights: {
      nodes: [cities[0].id],
      activeNode: cities[0].id,
      cells: [{ r: 0, c: 0, status: 'active' }],
    },
    metrics: {
      iterations: 1,
      comparisons: 0,
    },
  };

  // -------------------------------------------------------------
  // Steps 3+: Dynamic Programming Fill (s = 2..n)
  // -------------------------------------------------------------
  let comparisons = 0;
  let iterations = 1;

  for (let s = 2; s <= n; s++) {
    const currentSubsets = subsetsBySize[s];

    for (const mask of currentSubsets) {
      const subsetLabel = formatSubsetMask(mask, cities);

      // For every city j in mask except start city 0
      for (let j = 1; j < n; j++) {
        if ((mask & (1 << j)) === 0) continue;

        iterations++;
        const prevMask = mask ^ (1 << j);
        const prevSubsetLabel = formatSubsetMask(prevMask, cities);

        let minCost = Infinity;
        let bestPredecessor: number | null = null;
        const candidates: CandidateEdge[] = [];

        // Try every predecessor i in prevMask
        for (let i = 0; i < n; i++) {
          if ((prevMask & (1 << i)) !== 0) {
            const prevCost = dpTable[`${prevMask},${i}`];
            if (prevCost !== null && prevCost !== undefined) {
              comparisons++;
              const edgeCost = costMatrix[i][j];
              const totalCost = prevCost + edgeCost;

              candidates.push({
                u: i,
                v: j,
                subCost: prevCost,
                edgeCost,
                totalCost,
                isChosen: false,
              });

              if (totalCost < minCost) {
                minCost = totalCost;
                bestPredecessor = i;
              }
            }
          }
        }

        // Mark the chosen candidate
        for (const cand of candidates) {
          if (cand.u === bestPredecessor) {
            cand.isChosen = true;
          }
        }

        dpTable[`${mask},${j}`] = minCost;
        parentTable[`${mask},${j}`] = bestPredecessor;

        // Build formula explanation
        const candidateCalculations = candidates
          .map(
            (c) =>
              `DP(${prevSubsetLabel}, ${cities[c.u].label}) [${c.subCost}] + c(${cities[c.u].label}, ${cities[j].label}) [${c.edgeCost}] = ${c.totalCost}`
          )
          .join('\n  ');

        const bestPredLabel = bestPredecessor !== null ? cities[bestPredecessor].label : '?';
        const formula =
          candidates.length > 1
            ? `DP(${subsetLabel}, ${cities[j].label}) = min(\n  ${candidateCalculations}\n) = ${minCost} (via ${bestPredLabel})`
            : `DP(${subsetLabel}, ${cities[j].label}) = DP(${prevSubsetLabel}, ${bestPredLabel}) [${dpTable[`${prevMask},${bestPredecessor!}`]}] + c(${bestPredLabel}, ${cities[j].label}) [${costMatrix[bestPredecessor!][j]}] = ${minCost}`;

        const maskRowIndex = allSubsets.indexOf(mask);

        yield {
          stepIndex: stepIndex++,
          title: `DP(${subsetLabel}, ${cities[j].label}) = ${minCost}`,
          description: `Subset ${subsetLabel} (size ${s}): Computing DP for ending city ${cities[j].label} = ${minCost} via predecessor ${bestPredLabel}.`,
          codeLine: 6,
          state: {
            numCities: n,
            cities,
            costMatrix,
            subsets: allSubsets,
            dpTable: { ...dpTable },
            parentTable: { ...parentTable },
            currentMask: mask,
            currentCity: j,
            currentPhase: 'fill',
            candidateEdges: candidates,
            activeTourEdges: candidates
              .filter((c) => c.isChosen)
              .map((c) => ({ u: c.u, v: c.v })),
            currentSubsetLabel: subsetLabel,
            calculationFormula: formula,
            explanation: `To visit subset ${subsetLabel} ending at ${cities[j].label}, we transition from subproblem ${prevSubsetLabel} through city ${bestPredLabel} with minimum total cost ${minCost}.`,
          },
          highlights: {
            nodes: [j, ...(bestPredecessor !== null ? [bestPredecessor] : [])],
            activeNode: j,
            edges: bestPredecessor !== null ? [{ u: bestPredecessor, v: j, status: 'active' }] : [],
            cells: [{ r: maskRowIndex, c: j, status: 'active' }],
          },
          metrics: {
            iterations,
            comparisons,
          },
        };
      }
    }
  }

  // -------------------------------------------------------------
  // Step: Tour Closing - return from last city to city 0
  // -------------------------------------------------------------
  const fullMask = (1 << n) - 1;
  const fullSubsetLabel = formatSubsetMask(fullMask, cities);
  let optimalCost = Infinity;
  let bestLastCity: number = 1;
  const closingCandidates: CandidateEdge[] = [];

  for (let j = 1; j < n; j++) {
    const endCost = dpTable[`${fullMask},${j}`];
    if (endCost !== null && endCost !== undefined) {
      comparisons++;
      const returnCost = costMatrix[j][0];
      const totalCycleCost = endCost + returnCost;

      closingCandidates.push({
        u: j,
        v: 0,
        subCost: endCost,
        edgeCost: returnCost,
        totalCost: totalCycleCost,
        isChosen: false,
      });

      if (totalCycleCost < optimalCost) {
        optimalCost = totalCycleCost;
        bestLastCity = j;
      }
    }
  }

  for (const cand of closingCandidates) {
    if (cand.u === bestLastCity) {
      cand.isChosen = true;
    }
  }

  const closingCalculations = closingCandidates
    .map(
      (c) =>
        `DP(V, ${cities[c.u].label}) [${c.subCost}] + c(${cities[c.u].label}, ${cities[0].label}) [${c.edgeCost}] = ${c.totalCost}`
    )
    .join('\n  ');

  const closingFormula = `min_{j ≠ 0} [ DP(V, j) + c(j, ${cities[0].label}) ]:\n  ${closingCalculations}\n= ${optimalCost} (closing through ${cities[bestLastCity].label} ➔ ${cities[0].label})`;
  const fullMaskRowIndex = allSubsets.indexOf(fullMask);

  yield {
    stepIndex: stepIndex++,
    title: `Close Tour: Return to ${cities[0].label}`,
    description: `Tour Closing: Evaluating return edges from full subset ${fullSubsetLabel} to start city ${cities[0].label}. Minimum full tour cost = ${optimalCost} via last city ${cities[bestLastCity].label}.`,
    codeLine: 8,
    state: {
      numCities: n,
      cities,
      costMatrix,
      subsets: allSubsets,
      dpTable: { ...dpTable },
      parentTable: { ...parentTable },
      currentMask: fullMask,
      currentCity: 0,
      currentPhase: 'close',
      candidateEdges: closingCandidates,
      activeTourEdges: [{ u: bestLastCity, v: 0 }],
      currentSubsetLabel: fullSubsetLabel,
      calculationFormula: closingFormula,
      optimalCost,
      explanation: `All cities have been visited in full set V. Now connect the winning last city ${cities[bestLastCity].label} back to start vertex ${cities[0].label} to complete the Hamiltonian cycle.`,
    },
    highlights: {
      nodes: [bestLastCity, 0],
      activeNode: 0,
      edges: [{ u: bestLastCity, v: 0, status: 'active' }],
      cells: [{ r: fullMaskRowIndex, c: bestLastCity, status: 'active' }],
    },
    metrics: {
      iterations: iterations + 1,
      comparisons,
    },
  };

  // -------------------------------------------------------------
  // Step: Reconstruct Tour from parent pointers
  // -------------------------------------------------------------
  const reversedPath: number[] = [0, bestLastCity];
  let currMask = fullMask;
  let currCity = bestLastCity;

  while (currCity !== 0) {
    const parent = parentTable[`${currMask},${currCity}`];
    if (parent === null || parent === undefined) break;
    currMask = currMask ^ (1 << currCity);
    currCity = parent;
    if (currCity !== 0) {
      reversedPath.push(currCity);
    }
  }
  reversedPath.push(0);
  const optimalTour = reversedPath.reverse();

  // Active tour edges for visualizer
  const fullTourEdges: { u: number; v: number }[] = [];
  for (let k = 0; k < optimalTour.length - 1; k++) {
    fullTourEdges.push({ u: optimalTour[k], v: optimalTour[k + 1] });
  }

  const tourString = optimalTour.map((idx) => cities[idx].label).join(' ➔ ');

  yield {
    stepIndex: stepIndex++,
    title: 'Backtrack Optimal Tour',
    description: `Tour Reconstruction: Backtracking through parent pointers reveals optimal tour: ${tourString} with total cost ${optimalCost}.`,
    codeLine: 9,
    state: {
      numCities: n,
      cities,
      costMatrix,
      subsets: allSubsets,
      dpTable: { ...dpTable },
      parentTable: { ...parentTable },
      currentMask: fullMask,
      currentCity: 0,
      currentPhase: 'reconstruct',
      candidateEdges: [],
      activeTourEdges: fullTourEdges,
      optimalTour,
      optimalCost,
      currentSubsetLabel: fullSubsetLabel,
      calculationFormula: `Optimal Cycle: ${tourString}\nTotal Minimum Cost = ${optimalCost}`,
      explanation: `Backtracked parent table entries from (${fullSubsetLabel}, ${cities[bestLastCity].label}) back to base city ${cities[0].label}.`,
    },
    highlights: {
      nodes: optimalTour,
      edges: fullTourEdges.map((e) => ({ u: e.u, v: e.v, status: 'active' })),
    },
    metrics: {
      iterations: iterations + 2,
      comparisons,
    },
  };

  // -------------------------------------------------------------
  // Step: Complete State
  // -------------------------------------------------------------
  yield {
    stepIndex: stepIndex++,
    title: `Optimal Tour Complete: ${tourString} (Cost ${optimalCost})`,
    description: `Execution Complete: Minimum Hamiltonian Cycle is ${tourString} with optimal cost ${optimalCost}.`,
    codeLine: 10,
    state: {
      numCities: n,
      cities,
      costMatrix,
      subsets: allSubsets,
      dpTable: { ...dpTable },
      parentTable: { ...parentTable },
      currentMask: fullMask,
      currentCity: 0,
      currentPhase: 'complete',
      candidateEdges: [],
      activeTourEdges: fullTourEdges,
      optimalTour,
      optimalCost,
      currentSubsetLabel: fullSubsetLabel,
      calculationFormula: `Optimal TSP Tour: ${tourString}\nOptimal Cost: ${optimalCost}`,
      explanation: `The Held-Karp algorithm explored all 2ⁿ subproblems and guaranteed the optimal minimum-weight Hamiltonian cycle.`,
    },
    highlights: {
      nodes: optimalTour,
      edges: fullTourEdges.map((e) => ({ u: e.u, v: e.v, status: 'visited' })),
    },
    metrics: {
      iterations: iterations + 2,
      comparisons,
    },
    isFinal: true,
    result: {
      optimalCost,
      optimalTour,
      tourString,
      numCities: n,
    },
  };
}
