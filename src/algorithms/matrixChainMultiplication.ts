import { AlgorithmStep, DpRuleStep } from '../types/algorithm';

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
  /** The DP rule applied at this step, for the "Rule for this cell" card. */
  dpRule?: DpRuleStep;
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
    description: `Trying every bracketing takes too long, so we answer small questions first: m[i, j] = the cheapest cost to multiply Ai through Aj into one matrix. A single matrix needs no work, so every m[i, i] = 0. Table s will remember where the best split was.`,
    codeLine: 2,
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
        description: `How cheaply can A${i} through A${j} (${matrices.slice(i - 1, j).map((mat) => `${mat.name}[${mat.rows}x${mat.cols}]`).join(' × ')}) be multiplied into one? The last multiplication always joins a left group and a right group, so try every place to split them.`,
        codeLine: [4, 5],
        state: {
          dimensions: [...p],
          matrices,
          dpTable: m.map((r) => [...r]),
          splitTable: s.map((r) => [...r]),
          chainLength: L,
          currentRow: i,
          currentCol: j,
          formulaExplanation: `m[${i}][${j}] = min_{${i} <= k < ${j}} (m[${i}][k] + m[k+1][${j}] + p_${i-1} * p_k * p_${j})`,
          dpRule: {
            label: `New cell m[${i}, ${j}]`,
            tone: 'compare',
            formula: 'm[i, j] = min_k ( m[i, k] + m[k+1, j] + p[i−1]·p[k]·p[j] )',
            substitution: `try k = ${Array.from({ length: j - i }, (_, d) => i + d).join(', ')}`,
            action: 'Try each split and keep the cheapest.',
          },
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

        const prevBest = m[i][j];
        const isNewMin = totalCost < m[i][j];
        if (isNewMin) {
          m[i][j] = totalCost;
          s[i][j] = k;
        }

        yield {
          stepIndex: stepIndex++,
          title: `Evaluate Split Point k=${k} for m[${i}, ${j}]`,
          description: `Split after A${k}: the left group A${i}..A${k} costs ${costLeft} and the right group A${k + 1}..A${j} costs ${costRight} (both already in the table), and joining the two results costs ${p[i - 1]}×${p[k]}×${p[j]} = ${multCost}. Total = ${totalCost}.${isNewMin ? ' Cheapest so far.' : ' Not cheaper than an earlier split.'}`,
          codeLine: [6, 7, 8, 9],
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
            dpRule: {
              label: `Split at k = ${k}`,
              tone: 'compare',
              check: Number.isFinite(prevBest)
                ? { text: `${totalCost} < best so far ${prevBest}`, ok: isNewMin }
                : { text: 'first split tried', ok: true },
              formula: 'm[i, k] + m[k+1, j] + p[i−1]·p[k]·p[j]',
              substitution: `m[${i},${k}] + m[${k + 1},${j}] + ${p[i - 1]}·${p[k]}·${p[j]} = ${costLeft} + ${costRight} + ${multCost} = ${totalCost}`,
              action: isNewMin ? `New best: m[${i}, ${j}] = ${totalCost}, s[${i}, ${j}] = ${k}.` : `Keep m[${i}, ${j}] = ${prevBest}.`,
            },
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
    description: `The table is full. m[1, ${n}] = ${m[1][n]} is the cheapest cost for the whole chain. Now read the split table s to put the brackets back, from the outside in.`,
    codeLine: 10,
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
      description: `The best split for A${i}..A${j} was after A${k} (s[${i}, ${j}] = ${k}): bracket A${i}..A${k} and A${k + 1}..A${j} separately.`,
      codeLine: 10,
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
      description: `Put brackets around A${i}..A${j}, split after A${k}: "${mergedStr}".`,
      codeLine: 10,
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
        formulaExplanation: `Merged Subchain A${i}..A${j} = ${mergedStr}`,
      },
      highlights: {
        cells: [
          { r: i, c: j, status: 'active' },
          { r: i, c: k, status: 'visited' },
          { r: k + 1, c: j, status: 'visited' },
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
    description: `Done: the cheapest order is ${finalOptimalParens}, needing ${m[1][n]} multiplications of single numbers. Any other bracketing needs at least as many.`,
    codeLine: 11,
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
