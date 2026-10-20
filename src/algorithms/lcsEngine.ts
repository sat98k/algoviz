/**
 * Shared LCS Engine
 *
 * Computes DP table L[i][j], direction matrix, and step-by-step execution
 * covering:
 * 1. Table initialization (base row 0 and col 0)
 * 2. Table cell-by-cell calculation (fill phase with match/mismatch rules)
 * 3. Table complete (LCS length ready at bottom-right cell)
 * 4. Traceback reconstruction (recovering the exact LCS alignment)
 * 5. Backtracking complete
 */

import { AlgorithmStep, DpRuleStep } from '../types/algorithm';

export type LcsMoveType = 'match' | 'up' | 'left';
export type LcsPhase = 'init' | 'fill' | 'table_complete' | 'traceback' | 'final';
export type LcsDirection = 'diag' | 'up' | 'left' | 'tie' | 'none';

export interface LcsMove {
  type: LcsMoveType;
  /** 1-based row before move */
  i: number;
  /** 1-based col before move */
  j: number;
  /** Character matched, if type === 'match' */
  char?: string;
  /** 0-based index in X, if applicable */
  xIndex?: number;
  /** 0-based index in Y, if applicable */
  yIndex?: number;
  /** Textual explanation of rule applied */
  caption: string;
}

export interface UnifiedLcsStepState {
  str1: string;
  str2: string;
  phase: LcsPhase;
  dpTable: number[][];
  directions: LcsDirection[][];
  currentRow: number;
  currentCol: number;
  comparison?: 'match' | 'mismatch';
  currentMatchChar?: string;
  sourceCells?: { r: number; c: number }[];
  backtrackPath: { r: number; c: number; arrow?: '↖' | '↑' | '←' }[];
  matchedIndicesStr1: number[];
  matchedIndicesStr2: number[];
  matchedPairs: [number, number][]; // 1-based [x_i, y_j]
  lcsString: string;
  caption: string;
  dpRule?: DpRuleStep;
  tracebackPhase?: boolean;
}

export type UnifiedLcsStep = AlgorithmStep<UnifiedLcsStepState>;

export interface LcsEngineResult {
  X: string;
  Y: string;
  m: number;
  n: number;
  /** Final (m+1) x (n+1) DP table */
  L: number[][];
  /** Final (m+1) x (n+1) directions */
  directions: LcsDirection[][];
  /** Traceback moves */
  moves: LcsMove[];
  /** Expected final LCS string */
  lcsString: string;
  /** Expected LCS length */
  lcsLength: number;
  /** Matched 1-based pairs [x_i, y_j] */
  matchedPairs: [number, number][];
  /** All step-by-step execution steps (init, fill, complete, traceback, final) */
  steps: UnifiedLcsStep[];
  /** Alternative paths if ties occurred */
  alternativePaths: LcsMove[][];
}

/**
 * Validates X and Y inputs.
 * Rules:
 * - Both strings required
 * - Alphanumeric only (letters and digits)
 * - Max 9 characters
 */
export function validateLcsInput(xRaw: string, yRaw: string): { isValid: boolean; error: string | null; X: string; Y: string } {
  const X = (xRaw ?? '').trim().toUpperCase();
  const Y = (yRaw ?? '').trim().toUpperCase();

  if (!X || !Y) {
    return { isValid: false, error: 'Both String X and String Y are required.', X, Y };
  }

  const alphaNumericRegex = /^[A-Z0-9]+$/;
  if (!alphaNumericRegex.test(X) || !alphaNumericRegex.test(Y)) {
    return { isValid: false, error: 'Only alphanumeric characters (A-Z, 0-9) are allowed.', X, Y };
  }

  if (X.length > 9 || Y.length > 9) {
    return { isValid: false, error: 'Maximum length is 9 characters per string.', X, Y };
  }

  return { isValid: true, error: null, X, Y };
}

/**
 * Computes DP table L[i][j], direction matrix, and all execution steps.
 */
export function computeLcsEngine(xInput: string, yInput: string): LcsEngineResult {
  const X = (xInput || 'ABCBDAB').toUpperCase();
  const Y = (yInput || 'BDCAB').toUpperCase();
  const m = X.length;
  const n = Y.length;

  const L: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const directions: LcsDirection[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill('none'));

  // Pre-calculate full L and directions
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (X[i - 1] === Y[j - 1]) {
        L[i][j] = L[i - 1][j - 1] + 1;
        directions[i][j] = 'diag';
      } else {
        const topVal = L[i - 1][j];
        const leftVal = L[i][j - 1];
        if (topVal > leftVal) {
          L[i][j] = topVal;
          directions[i][j] = 'up';
        } else if (leftVal > topVal) {
          L[i][j] = leftVal;
          directions[i][j] = 'left';
        } else {
          L[i][j] = topVal;
          directions[i][j] = 'tie';
        }
      }
    }
  }

  // Pre-calculate traceback moves
  const moves: LcsMove[] = [];
  const finalMatchedPairs: [number, number][] = [];
  const finalChars: string[] = [];

  let currI = m;
  let currJ = n;

  while (currI > 0 && currJ > 0) {
    const charX = X[currI - 1];
    const charY = Y[currJ - 1];

    if (charX === charY) {
      finalChars.unshift(charX);
      finalMatchedPairs.unshift([currI, currJ]);
      moves.push({
        type: 'match',
        i: currI,
        j: currJ,
        char: charX,
        xIndex: currI - 1,
        yIndex: currJ - 1,
        caption: `X[${currI}] = '${charX}' and Y[${currJ}] = '${charY}' match! Added '${charX}' to LCS. Move diag ↖ to L[${currI - 1}][${currJ - 1}].`,
      });
      currI--;
      currJ--;
    } else if (L[currI - 1][currJ] >= L[currI][currJ - 1]) {
      const topVal = L[currI - 1][currJ];
      const leftVal = L[currI][currJ - 1];
      moves.push({
        type: 'up',
        i: currI,
        j: currJ,
        xIndex: currI - 1,
        caption: `X[${currI}] = '${charX}' and Y[${currJ}] = '${charY}' differ, and L[${currI - 1}][${currJ}] (${topVal}) >= L[${currI}][${currJ - 1}] (${leftVal}). Move up: X[${currI}] is skipped.`,
      });
      currI--;
    } else {
      const topVal = L[currI - 1][currJ];
      const leftVal = L[currI][currJ - 1];
      moves.push({
        type: 'left',
        i: currI,
        j: currJ,
        yIndex: currJ - 1,
        caption: `X[${currI}] = '${charX}' and Y[${currJ}] = '${charY}' differ, and L[${currI}][${currJ - 1}] (${leftVal}) > L[${currI - 1}][${currJ}] (${topVal}). Move left: Y[${currJ}] is skipped.`,
      });
      currJ--;
    }
  }

  while (currI > 0) {
    moves.push({
      type: 'up',
      i: currI,
      j: 0,
      xIndex: currI - 1,
      caption: `String Y is exhausted (j = 0). Move up: X[${currI}] is skipped.`,
    });
    currI--;
  }

  while (currJ > 0) {
    moves.push({
      type: 'left',
      i: 0,
      j: currJ,
      yIndex: currJ - 1,
      caption: `String X is exhausted (i = 0). Move left: Y[${currJ}] is skipped.`,
    });
    currJ--;
  }

  // Generate ALL unified execution steps
  const steps: UnifiedLcsStep[] = [];
  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  // Partial table for fill phase: initialized with 0
  const runningTable: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  const runningDirections: LcsDirection[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill('none')
  );

  // 1. STEP 0: TABLE INITIALIZATION
  steps.push({
    stepIndex: stepIndex++,
    title: 'Initialize LCS DP Table',
    description: `Created ${(m + 1)} x ${(n + 1)} DP table for string X ("${X}") and string Y ("${Y}"). Initialized base row 0 and column 0 with 0.`,
    codeLine: 2,
    state: {
      str1: X,
      str2: Y,
      phase: 'init',
      dpTable: runningTable.map((row) => [...row]),
      directions: runningDirections.map((row) => [...row]),
      currentRow: 0,
      currentCol: 0,
      backtrackPath: [],
      matchedIndicesStr1: [],
      matchedIndicesStr2: [],
      matchedPairs: [],
      lcsString: '',
      caption: `Initial state: ${(m + 1)} x ${(n + 1)} DP table initialized. Row 0 and column 0 are 0 (empty prefix base cases).`,
    },
    highlights: {
      cells: [
        ...Array.from({ length: n + 1 }, (_, c) => ({ r: 0, c, status: 'visited' as const })),
        ...Array.from({ length: m + 1 }, (_, r) => ({ r, c: 0, status: 'visited' as const })),
      ],
    },
    metrics: { comparisons, iterations },
  });

  // 2. FILL PHASE: CELL-BY-CELL COMPUTATION
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      iterations++;
      comparisons++;
      const char1 = X[i - 1];
      const char2 = Y[j - 1];

      if (char1 === char2) {
        runningTable[i][j] = (runningTable[i - 1][j - 1] ?? 0) + 1;
        runningDirections[i][j] = 'diag';

        const caption = `Table fill L[${i}][${j}]: X[${i}] = '${char1}' and Y[${j}] = '${char2}' match! Extended diagonal L[${i - 1}][${j - 1}] + 1 = ${runningTable[i][j]}. Direction ↖.`;

        steps.push({
          stepIndex: stepIndex++,
          title: `Match: '${char1}' == '${char2}'`,
          description: `'${char1}' matches '${char2}', so this character extends the longest common subsequence of the two shorter prefixes by one: dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${runningTable[i - 1][j - 1] ?? 0} + 1 = ${runningTable[i][j]}.`,
          codeLine: [5, 6],
          state: {
            str1: X,
            str2: Y,
            phase: 'fill',
            dpTable: runningTable.map((row) => [...row]),
            directions: runningDirections.map((row) => [...row]),
            currentRow: i,
            currentCol: j,
            currentMatchChar: char1,
            comparison: 'match',
            sourceCells: [{ r: i - 1, c: j - 1 }],
            backtrackPath: [],
            matchedIndicesStr1: [],
            matchedIndicesStr2: [],
            matchedPairs: [],
            lcsString: '',
            caption,
            dpRule: {
              label: 'Match',
              tone: 'match',
              check: { text: `'${char1}' = '${char2}'`, ok: true },
              formula: 'dp[i][j] = dp[i−1][j−1] + 1',
              substitution: `dp[${i}][${j}] = ${(runningTable[i - 1][j - 1] ?? 0)} + 1 = ${runningTable[i][j]}`,
              action: 'Diagonal ↖ + 1.',
            },
          },
          highlights: {
            cells: [
              { r: i, c: j, status: 'active' },
              { r: i - 1, c: j - 1, status: 'source' },
            ],
            type: 'match',
          },
          metrics: { comparisons, iterations },
        });
      } else {
        const topVal = runningTable[i - 1][j] ?? 0;
        const leftVal = runningTable[i][j - 1] ?? 0;
        const maxVal = Math.max(topVal, leftVal);
        runningTable[i][j] = maxVal;
        runningDirections[i][j] = topVal > leftVal ? 'up' : leftVal > topVal ? 'left' : 'tie';

        const caption = `Table fill L[${i}][${j}]: X[${i}] = '${char1}' and Y[${j}] = '${char2}' differ. Inherited max(top ${topVal}, left ${leftVal}) = ${maxVal}.`;

        steps.push({
          stepIndex: stepIndex++,
          title: `Mismatch: '${char1}' != '${char2}'`,
          description: `'${char1}' and '${char2}' differ, so they cannot both end the subsequence: keep the better result of dropping one of them, max(above ${topVal}, left ${leftVal}) = ${maxVal}.`,
          codeLine: [7, 8],
          state: {
            str1: X,
            str2: Y,
            phase: 'fill',
            dpTable: runningTable.map((row) => [...row]),
            directions: runningDirections.map((row) => [...row]),
            currentRow: i,
            currentCol: j,
            comparison: 'mismatch',
            sourceCells: [
              { r: i - 1, c: j },
              { r: i, c: j - 1 },
            ],
            backtrackPath: [],
            matchedIndicesStr1: [],
            matchedIndicesStr2: [],
            matchedPairs: [],
            lcsString: '',
            caption,
            dpRule: {
              label: 'Mismatch',
              tone: 'mismatch',
              check: { text: `'${char1}' = '${char2}'`, ok: false },
              formula: 'dp[i][j] = max( dp[i−1][j], dp[i][j−1] )',
              substitution: `dp[${i}][${j}] = max( ${topVal}, ${leftVal} ) = ${maxVal}`,
              action: topVal >= leftVal ? `Take the top value ↑ (${topVal}).` : `Take the left value ← (${leftVal}).`,
            },
          },
          highlights: {
            cells: [
              { r: i, c: j, status: 'active' },
              { r: i - 1, c: j, status: 'source' },
              { r: i, c: j - 1, status: 'source' },
            ],
            type: 'compare',
          },
          metrics: { comparisons, iterations },
        });
      }
    }
  }

  // 3. TABLE COMPLETE STEP
  steps.push({
    stepIndex: stepIndex++,
    title: `Table Complete: LCS Length = ${L[m][n]}`,
    description: `The bottom-right cell dp[${m}][${n}] = ${L[m][n]} is the length of the longest common subsequence. To recover the subsequence itself, walk back from this cell to where each value came from.`,
    codeLine: 9,
    state: {
      str1: X,
      str2: Y,
      phase: 'table_complete',
      dpTable: L.map((row) => [...row]),
      directions: directions.map((row) => [...row]),
      currentRow: m,
      currentCol: n,
      backtrackPath: [],
      matchedIndicesStr1: [],
      matchedIndicesStr2: [],
      matchedPairs: [],
      lcsString: '',
      tracebackPhase: true,
      caption: `Table complete: Bottom-right cell L[${m}][${n}] = ${L[m][n]}. Traceback starts here to reconstruct the LCS string.`,
    },
    highlights: { cells: [{ r: m, c: n, status: 'active' }] },
    metrics: { comparisons, iterations },
  });

  // 4. TRACEBACK STEPS
  const lcsChars: string[] = [];
  const matchedIndicesStr1: number[] = [];
  const matchedIndicesStr2: number[] = [];
  const matchedPairs: [number, number][] = [];
  const backtrackPath: { r: number; c: number; arrow?: '↖' | '↑' | '←' }[] = [];

  let tbI = m;
  let tbJ = n;

  while (tbI > 0 && tbJ > 0) {
    const c1 = X[tbI - 1];
    const c2 = Y[tbJ - 1];
    let arrow: '↖' | '↑' | '←';
    let title: string;
    let description: string;
    let codeLine: number;
    let rule: DpRuleStep;
    const from = { r: tbI, c: tbJ };

    if (c1 === c2) {
      arrow = '↖';
      lcsChars.unshift(c1);
      matchedIndicesStr1.unshift(tbI - 1);
      matchedIndicesStr2.unshift(tbJ - 1);
      matchedPairs.unshift([tbI, tbJ]);
      title = `↖ Match '${c1}': Add It to the LCS`;
      description = `'${c1}' matches, so this value came from the diagonal + 1: '${c1}' is part of the answer.`;
      codeLine = 11;
      rule = {
        label: 'Traceback: match',
        tone: 'match',
        check: { text: `'${c1}' = '${c2}'`, ok: true },
        formula: 'match → take the character, move ↖',
        substitution: `LCS so far: "${lcsChars.join('')}"`,
        action: `Add '${c1}' and move to dp[${tbI - 1}][${tbJ - 1}].`,
      };
      tbI--;
      tbJ--;
    } else if (L[tbI - 1][tbJ] >= L[tbI][tbJ - 1]) {
      arrow = '↑';
      title = `↑ Move Up: '${c1}' ≠ '${c2}'`;
      description = `The characters differ and the top value is at least the left one, so this value came from above: skip '${c1}'.`;
      codeLine = 12;
      rule = {
        label: 'Traceback: move up',
        tone: 'mismatch',
        check: { text: `top ${L[tbI - 1][tbJ]} ≥ left ${L[tbI][tbJ - 1]}`, ok: true },
        formula: 'mismatch → go to the larger of ↑ and ←',
        substitution: `dp[${tbI - 1}][${tbJ}] = ${L[tbI - 1][tbJ]}`,
        action: `Move up ↑ to dp[${tbI - 1}][${tbJ}].`,
      };
      tbI--;
    } else {
      arrow = '←';
      title = `← Move Left: '${c1}' ≠ '${c2}'`;
      description = `The characters differ and the left value is larger, so this value came from the left: skip '${c2}'.`;
      codeLine = 13;
      rule = {
        label: 'Traceback: move left',
        tone: 'mismatch',
        check: { text: `top ${L[tbI - 1][tbJ]} ≥ left ${L[tbI][tbJ - 1]}`, ok: false },
        formula: 'mismatch → go to the larger of ↑ and ←',
        substitution: `dp[${tbI}][${tbJ - 1}] = ${L[tbI][tbJ - 1]}`,
        action: `Move left ← to dp[${tbI}][${tbJ - 1}].`,
      };
      tbJ--;
    }

    backtrackPath.push({ ...from, arrow });

    steps.push({
      stepIndex: stepIndex++,
      title,
      description,
      codeLine,
      state: {
        str1: X,
        str2: Y,
        phase: 'traceback',
        dpTable: L.map((row) => [...row]),
        directions: directions.map((row) => [...row]),
        currentRow: tbI,
        currentCol: tbJ,
        lcsString: lcsChars.join(''),
        backtrackPath: backtrackPath.map((p) => ({ r: p.r, c: p.c, arrow: p.arrow })),
        matchedIndicesStr1: [...matchedIndicesStr1],
        matchedIndicesStr2: [...matchedIndicesStr2],
        matchedPairs: [...matchedPairs],
        tracebackPhase: true,
        caption: `${title}: ${description}`,
        dpRule: rule,
      },
      highlights: {
        cells: [
          ...backtrackPath.map((p) => ({ r: p.r, c: p.c, status: 'path' as const, arrow: p.arrow })),
          { r: tbI, c: tbJ, status: 'active' as const },
        ],
      },
      metrics: { comparisons, iterations },
    });
  }

  // Handle remaining up/left when one string runs out
  while (tbI > 0) {
    const from = { r: tbI, c: 0 };
    backtrackPath.push({ ...from, arrow: '↑' });
    tbI--;
    steps.push({
      stepIndex: stepIndex++,
      title: `↑ Move Up: Y is exhausted`,
      description: `Reached column 0. Move up: X[${tbI + 1}] is skipped.`,
      codeLine: 12,
      state: {
        str1: X,
        str2: Y,
        phase: 'traceback',
        dpTable: L.map((row) => [...row]),
        directions: directions.map((row) => [...row]),
        currentRow: tbI,
        currentCol: 0,
        lcsString: lcsChars.join(''),
        backtrackPath: backtrackPath.map((p) => ({ r: p.r, c: p.c, arrow: p.arrow })),
        matchedIndicesStr1: [...matchedIndicesStr1],
        matchedIndicesStr2: [...matchedIndicesStr2],
        matchedPairs: [...matchedPairs],
        tracebackPhase: true,
        caption: `Reached column 0. Move up: X[${tbI + 1}] is skipped.`,
      },
      highlights: {
        cells: [
          ...backtrackPath.map((p) => ({ r: p.r, c: p.c, status: 'path' as const, arrow: p.arrow })),
          { r: tbI, c: 0, status: 'active' as const },
        ],
      },
      metrics: { comparisons, iterations },
    });
  }

  while (tbJ > 0) {
    const from = { r: 0, c: tbJ };
    backtrackPath.push({ ...from, arrow: '←' });
    tbJ--;
    steps.push({
      stepIndex: stepIndex++,
      title: `← Move Left: X is exhausted`,
      description: `Reached row 0. Move left: Y[${tbJ + 1}] is skipped.`,
      codeLine: 13,
      state: {
        str1: X,
        str2: Y,
        phase: 'traceback',
        dpTable: L.map((row) => [...row]),
        directions: directions.map((row) => [...row]),
        currentRow: 0,
        currentCol: tbJ,
        lcsString: lcsChars.join(''),
        backtrackPath: backtrackPath.map((p) => ({ r: p.r, c: p.c, arrow: p.arrow })),
        matchedIndicesStr1: [...matchedIndicesStr1],
        matchedIndicesStr2: [...matchedIndicesStr2],
        matchedPairs: [...matchedPairs],
        tracebackPhase: true,
        caption: `Reached row 0. Move left: Y[${tbJ + 1}] is skipped.`,
      },
      highlights: {
        cells: [
          ...backtrackPath.map((p) => ({ r: p.r, c: p.c, status: 'path' as const, arrow: p.arrow })),
          { r: 0, c: tbJ, status: 'active' as const },
        ],
      },
      metrics: { comparisons, iterations },
    });
  }

  backtrackPath.push({ r: 0, c: 0 });
  const finalLCS = lcsChars.join('');

  // 5. FINAL STEP
  steps.push({
    stepIndex: stepIndex++,
    title: 'LCS Backtracking Complete',
    description: `Reached row 0 and column 0, where nothing more can match. Reading the collected characters in order gives the longest common subsequence "${finalLCS}" of length ${L[m][n]}.`,
    codeLine: 14,
    state: {
      str1: X,
      str2: Y,
      phase: 'final',
      dpTable: L.map((row) => [...row]),
      directions: directions.map((row) => [...row]),
      currentRow: 0,
      currentCol: 0,
      lcsString: finalLCS,
      backtrackPath,
      matchedIndicesStr1,
      matchedIndicesStr2,
      matchedPairs,
      tracebackPhase: true,
      caption: `Traceback finished: LCS = "${finalLCS}", length ${L[m][n]}.`,
      dpRule: {
        label: 'Result',
        tone: 'match',
        check: { text: `Final LCS found: "${finalLCS}"`, ok: true },
        formula: 'LCS length = dp[len1][len2]',
        substitution: `length = ${L[m][n]}, string = "${finalLCS}"`,
        action: `Longest common subsequence is "${finalLCS}".`,
      },
    },
    highlights: {
      cells: backtrackPath.map((p) => ({ ...p, status: 'path' as const })),
      indices: matchedIndicesStr1,
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      lcsLength: L[m][n],
      lcsString: finalLCS,
      matchedIndicesStr1,
      matchedIndicesStr2,
    },
  });

  const alternativePaths = findAlternativePaths(X, Y, L, 5);

  return {
    X,
    Y,
    m,
    n,
    L,
    directions,
    moves,
    lcsString: finalLCS,
    lcsLength: L[m][n],
    matchedPairs: finalMatchedPairs,
    steps,
    alternativePaths,
  };
}

/**
 * Finds alternative optimal traceback paths when ties exist.
 */
function findAlternativePaths(X: string, Y: string, L: number[][], maxPaths = 4): LcsMove[][] {
  const m = X.length;
  const n = Y.length;
  const allPaths: LcsMove[][] = [];

  function explore(i: number, j: number, currentMoves: LcsMove[]) {
    if (allPaths.length >= maxPaths) return;

    if (i === 0 && j === 0) {
      allPaths.push([...currentMoves]);
      return;
    }

    if (i > 0 && j > 0 && X[i - 1] === Y[j - 1]) {
      const char = X[i - 1];
      explore(i - 1, j - 1, [
        ...currentMoves,
        {
          type: 'match',
          i,
          j,
          char,
          xIndex: i - 1,
          yIndex: j - 1,
          caption: `X[${i}] = '${char}' and Y[${j}] = '${char}' match! Added '${char}' to LCS. Move diag ↖.`,
        },
      ]);
      return;
    }

    const branches: Array<() => void> = [];

    // Up branch
    if (i > 0 && (j === 0 || L[i - 1][j] === L[i][j])) {
      branches.push(() => {
        explore(i - 1, j, [
          ...currentMoves,
          {
            type: 'up',
            i,
            j,
            xIndex: i - 1,
            caption: j === 0 ? `Y exhausted. Move up: X[${i}] skipped.` : `L[${i - 1}][${j}] = ${L[i - 1][j]}. Move up: X[${i}] skipped.`,
          },
        ]);
      });
    }

    // Left branch
    if (j > 0 && (i === 0 || L[i][j - 1] === L[i][j])) {
      branches.push(() => {
        explore(i, j - 1, [
          ...currentMoves,
          {
            type: 'left',
            i,
            j,
            yIndex: j - 1,
            caption: i === 0 ? `X exhausted. Move left: Y[${j}] skipped.` : `L[${i}][${j - 1}] = ${L[i][j - 1]}. Move left: Y[${j}] skipped.`,
          },
        ]);
      });
    }

    for (const b of branches) {
      if (allPaths.length >= maxPaths) break;
      b();
    }
  }

  explore(m, n, []);
  return allPaths;
}
