import { AlgorithmStep } from '../types/algorithm';

export interface MatrixInfo {
  id: number;
  name: string;
  rows: number;
  cols: number;
}

export interface MCMBacktrackStep {
  i: number;
  j: number;
  k: number;
  leftSubchain: string;
  rightSubchain: string;
  combinedSubchain: string;
  action: 'split' | 'merge';
}

export interface MCMState {
  dimensions: number[];
  matrices: MatrixInfo[];
  dpTable: number[][]; // m[i][j] (1-indexed for display)
  splitTable: number[][]; // s[i][j]
  chainLength: number;
  currentRow: number; // i
  currentCol: number; // j
  currentK?: number; // split point k
  currentCost?: number;
  bestK?: number;
  minCost?: number;
  formulaExplanation?: string;
  optimalParenthesization?: string;
  backtrackPhase?: boolean;
  backtrackInfo?: MCMBacktrackStep;
  partialParenthesesList?: string[];
}

export function* matrixChainMultiplicationSteps(inputs: {
  dimensions?: number[];
}): Generator<AlgorithmStep<MCMState>> {
  const p = inputs.dimensions && inputs.dimensions.length >= 2 ? [...inputs.dimensions] : [10, 20, 30, 40, 30];
  const n = p.length - 1; // number of matrices

  const matrices: MatrixInfo[] = [];
  for (let i = 1; i <= n; i++) {
    matrices.push({
      id: i,
      name: `A${i}`,
      rows: p[i - 1],
      cols: p[i],
    });
  }

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  // Initialize m and s tables with 0s (1-indexed (n+1) x (n+1))
  const m: number[][] = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
  const s: number[][] = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));

  // Initial step: Base cases (L=1)
  yield {
    stepIndex: stepIndex++,
    title: 'Initialize MCM Tables & Base Cases (Length 1)',
    description: `Initialized ${n}x${n} Dynamic Programming cost table m and split table s. For chain length L=1, m[i][i] = 0 (zero cost to multiply a single matrix).`,
    codeLine: 1,
    state: {
      dimensions: [...p],
      matrices,
      dpTable: m.map((r) => [...r]),
      splitTable: s.map((r) => [...r]),
      chainLength: 1,
      currentRow: 0,
      currentCol: 0,
      formulaExplanation: 'm[i][i] = 0 for all 1 <= i <= n',
    },
    highlights: {
      cells: Array.from({ length: n }, (_, i) => ({ r: i + 1, c: i + 1, status: 'visited' as const })),
    },
    metrics: { comparisons: 0, iterations: 0 },
  };

  // Chain length L from 2 to n (Table Filling Phase)
  for (let L = 2; L <= n; L++) {
    for (let i = 1; i <= n - L + 1; i++) {
      const j = i + L - 1;
      m[i][j] = Infinity;
      iterations++;

      yield {
        stepIndex: stepIndex++,
        title: `Compute Cell m[${i}, ${j}] (Chain Length L=${L})`,
        description: `Evaluating optimal split point for subchain A${i} through A${j} (${matrices.slice(i - 1, j).map((mat) => `${mat.name}[${mat.rows}x${mat.cols}]`).join(' × ')}).`,
        codeLine: 2,
        state: {
          dimensions: [...p],
          matrices,
          dpTable: m.map((r) => [...r]),
          splitTable: s.map((r) => [...r]),
          chainLength: L,
          currentRow: i,
          currentCol: j,
          formulaExplanation: `m[${i}][${j}] = min_{${i} <= k < ${j}} (m[${i}][k] + m[k+1][${j}] + p_${i-1} * p_k * p_${j})`,
        },
        highlights: {
          cells: [{ r: i, c: j, status: 'active' }],
        },
        metrics: { comparisons, iterations },
      };

      for (let k = i; k < j; k++) {
        comparisons++;
        const costLeft = m[i][k];
        const costRight = m[k + 1][j];
        const multCost = p[i - 1] * p[k] * p[j];
        const totalCost = costLeft + costRight + multCost;

        const isNewMin = totalCost < m[i][j];
        if (isNewMin) {
          m[i][j] = totalCost;
          s[i][j] = k;
        }

        yield {
          stepIndex: stepIndex++,
          title: `Evaluate Split Point k=${k} for m[${i}, ${j}]`,
          description: `Testing split (A${i}..A${k})(A${k + 1}..A${j}): Left cost m[${i},${k}]=${costLeft}, Right cost m[${k + 1},${j}]=${costRight}, Multiplications ${p[i - 1]}×${p[k]}×${p[j]}=${multCost}. Total = ${totalCost}.${isNewMin ? ' (New Minimum Cost!)' : ''}`,
          codeLine: 3,
          state: {
            dimensions: [...p],
            matrices,
            dpTable: m.map((r) => [...r]),
            splitTable: s.map((r) => [...r]),
            chainLength: L,
            currentRow: i,
            currentCol: j,
            currentK: k,
            currentCost: totalCost,
            bestK: s[i][j],
            minCost: m[i][j],
            formulaExplanation: `Cost at k=${k}: ${costLeft} + ${costRight} + (${p[i - 1]} * ${p[k]} * ${p[j]} = ${multCost}) = ${totalCost}`,
          },
          highlights: {
            cells: [
              { r: i, c: j, status: 'active' },
              { r: i, c: k, status: 'source' },
              { r: k + 1, c: j, status: 'source' },
            ],
          },
          metrics: { comparisons, iterations },
        };
      }
    }
  }

  // --- PHASE 2: Step-by-Step Parenthesization Backtracking Reconstruction ---
  yield {
    stepIndex: stepIndex++,
    title: 'DP Table Complete: Begin Optimal Parenthesization Backtrack',
    description: `DP cost table is complete with minimum scalar multiplication cost m[1, ${n}] = ${m[1][n]}. Now backtracking through split table s[i, j] to reconstruct the optimal matrix grouping one step at a time.`,
    codeLine: 4,
    state: {
      dimensions: [...p],
      matrices,
      dpTable: m.map((r) => [...r]),
      splitTable: s.map((r) => [...r]),
      chainLength: n,
      currentRow: 1,
      currentCol: n,
      minCost: m[1][n],
      backtrackPhase: true,
      formulaExplanation: `Reconstructing optimal parenthesization from split table s[1..${n}][1..${n}] starting at root cell (1, ${n}).`,
    },
    highlights: {
      cells: [{ r: 1, c: n, status: 'path' }],
    },
    metrics: { comparisons, iterations },
  };

  const partialParentheses: string[] = [];

  // Recursive generator to walk the split table and yield incremental combination steps
  function* reconstructSteps(i: number, j: number): Generator<AlgorithmStep<MCMState>, string> {
    if (i === j) {
      return `A${i}`;
    }

    const k = s[i][j];

    // Step: Querying split point from table s[i][j]
    yield {
      stepIndex: stepIndex++,
      title: `Backtrack: Query Split Table s[${i}, ${j}] = ${k}`,
      description: `For subchain A${i}..A${j}, stored split point in table s[${i}, ${j}] is k = ${k}. This divides the problem into Left subchain A${i}..A${k} and Right subchain A${k + 1}..A${j}.`,
      codeLine: 4,
      state: {
        dimensions: [...p],
        matrices,
        dpTable: m.map((r) => [...r]),
        splitTable: s.map((r) => [...r]),
        chainLength: j - i + 1,
        currentRow: i,
        currentCol: j,
        currentK: k,
        minCost: m[1][n],
        backtrackPhase: true,
        backtrackInfo: {
          i,
          j,
          k,
          leftSubchain: `A${i}..A${k}`,
          rightSubchain: `A${k + 1}..A${j}`,
          combinedSubchain: `(A${i}..A${k})(A${k + 1}..A${j})`,
          action: 'split',
        },
        partialParenthesesList: [...partialParentheses],
        formulaExplanation: `Split subchain A${i}..A${j} at k=${k} -> Left: A${i}..A${k}, Right: A${k + 1}..A${j}`,
      },
      highlights: {
        cells: [
          { r: i, c: j, status: 'path' },
          { r: i, c: k, status: 'source' },
          { r: k + 1, c: j, status: 'source' },
        ],
      },
      metrics: { comparisons, iterations },
    };

    // Recurse left and right
    const leftStr: string = yield* reconstructSteps(i, k);
    const rightStr: string = yield* reconstructSteps(k + 1, j);

    const mergedStr = `(${leftStr} ${rightStr})`;
    partialParentheses.push(mergedStr);

    // Step: Incrementally building combination
    yield {
      stepIndex: stepIndex++,
      title: `Merge Group: (${leftStr} × ${rightStr})`,
      description: `Combined optimal parenthesization for subchain A${i}..A${j} at split k=${k}: "${mergedStr}".`,
      codeLine: 4,
      state: {
        dimensions: [...p],
        matrices,
        dpTable: m.map((r) => [...r]),
        splitTable: s.map((r) => [...r]),
        chainLength: j - i + 1,
        currentRow: i,
        currentCol: j,
        currentK: k,
        minCost: m[1][n],
        backtrackPhase: true,
        backtrackInfo: {
          i,
          j,
          k,
          leftSubchain: leftStr,
          rightSubchain: rightStr,
          combinedSubchain: mergedStr,
          action: 'merge',
        },
        optimalParenthesization: mergedStr,
        partialParenthesesList: [...partialParentheses],
        formulaExplanation: `Merged subchain: ${mergedStr} (from cell m[${i},${j}] with split k=${k})`,
      },
      highlights: {
        cells: [
          { r: i, c: j, status: 'active' },
          { r: i, c: k, status: 'path' },
          { r: k + 1, c: j, status: 'path' },
        ],
      },
      metrics: { comparisons, iterations },
    };

    return mergedStr;
  }

  const finalOptimalParens = yield* reconstructSteps(1, n);

  // Final Step
  yield {
    stepIndex: stepIndex++,
    title: 'Matrix Chain Multiplication Complete',
    description: `Optimal chain multiplication fully evaluated and reconstructed. Minimum scalar multiplications: ${m[1][n]}. Optimal multiplication order: ${finalOptimalParens}.`,
    codeLine: 4,
    state: {
      dimensions: [...p],
      matrices,
      dpTable: m.map((r) => [...r]),
      splitTable: s.map((r) => [...r]),
      chainLength: n,
      currentRow: 1,
      currentCol: n,
      minCost: m[1][n],
      optimalParenthesization: finalOptimalParens,
      backtrackPhase: true,
      partialParenthesesList: [...partialParentheses],
      formulaExplanation: `Final Answer: Minimum Scalar Multiplications = ${m[1][n]} | Optimal Order = ${finalOptimalParens}`,
    },
    highlights: {
      cells: [{ r: 1, c: n, status: 'path' }],
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      minCost: m[1][n],
      optimalParenthesization: finalOptimalParens,
      dimensions: p,
      matrixCount: n,
      splitPointTable: s,
    },
  };
}
