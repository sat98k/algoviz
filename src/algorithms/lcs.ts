import { AlgorithmStep, DpRuleStep } from '../types/algorithm';

export interface LCSState {
  /** The DP rule applied at this step, for the "Rule for this cell" card. */
  dpRule?: DpRuleStep;
  str1: string;
  str2: string;
  dpTable: number[][];
  currentRow: number;
  currentCol: number;
  currentMatchChar?: string;
  lcsString?: string;
  backtrackPath?: { r: number; c: number }[];
  matchedIndicesStr1?: number[];
  matchedIndicesStr2?: number[];
  /** Fill phase: whether the two characters being compared are equal. */
  comparison?: 'match' | 'mismatch';
  /** Traceback phase: true while walking back through the table. */
  tracebackPhase?: boolean;
}

export function* lcsSteps(inputs: { str1: string; str2: string }): Generator<AlgorithmStep<LCSState>> {
  const str1 = inputs.str1 || 'ABCBDAB';
  const str2 = inputs.str2 || 'BDCAB';
  const m = str1.length;
  const n = str2.length;

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  // dp table of size (m+1) x (n+1)
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize LCS DP Table',
    description: `Created ${(m + 1)} x ${(n + 1)} DP table for string 1 ("${str1}") and string 2 ("${str2}"). Initialized row 0 and column 0 with 0.`,
    codeLine: 2,
    state: {
      str1,
      str2,
      dpTable: dp.map((row) => [...row]),
      currentRow: 0,
      currentCol: 0,
    },
    highlights: {
      cells: [
        ...Array.from({ length: n + 1 }, (_, c) => ({ r: 0, c, status: 'visited' as const })),
        ...Array.from({ length: m + 1 }, (_, r) => ({ r, c: 0, status: 'visited' as const })),
      ],
    },
    metrics: { comparisons, iterations },
  };

  // Fill table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      iterations++;
      comparisons++;
      const char1 = str1[i - 1];
      const char2 = str2[j - 1];

      if (char1 === char2) {
        dp[i][j] = 1 + dp[i - 1][j - 1];
        yield {
          stepIndex: stepIndex++,
          title: `Match: '${char1}' == '${char2}'`,
          description: `'${char1}' matches '${char2}', so this character extends the longest common subsequence of the two shorter prefixes by one.`,
          codeLine: [5, 6],
          state: {
            str1,
            str2,
            dpTable: dp.map((row) => [...row]),
            currentRow: i,
            currentCol: j,
            currentMatchChar: char1,
            comparison: 'match',
            dpRule: {
              label: 'Match',
              tone: 'match',
              check: { text: `'${char1}' = '${char2}'`, ok: true },
              formula: 'dp[i][j] = dp[i−1][j−1] + 1',
              substitution: `dp[${i}][${j}] = ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}`,
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
        };
      } else {
        const topVal = dp[i - 1][j];
        const leftVal = dp[i][j - 1];
        dp[i][j] = Math.max(topVal, leftVal);

        yield {
          stepIndex: stepIndex++,
          title: `Mismatch: '${char1}' != '${char2}'`,
          description: `'${char1}' and '${char2}' differ, so they cannot both end the subsequence: keep the better result of dropping one of them.`,
          codeLine: [7, 8],
          state: {
            str1,
            str2,
            dpTable: dp.map((row) => [...row]),
            currentRow: i,
            currentCol: j,
            comparison: 'mismatch',
            dpRule: {
              label: 'Mismatch',
              tone: 'mismatch',
              check: { text: `'${char1}' = '${char2}'`, ok: false },
              formula: 'dp[i][j] = max( dp[i−1][j], dp[i][j−1] )',
              substitution: `dp[${i}][${j}] = max( ${topVal}, ${leftVal} ) = ${dp[i][j]}`,
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
        };
      }
    }
  }

  // Traceback: walk from dp[m][n] back to row/column 0, one move per step.
  const lcsChars: string[] = [];
  const matchedIndicesStr1: number[] = [];
  const matchedIndicesStr2: number[] = [];
  const backtrackPath: { r: number; c: number; arrow?: '↖' | '↑' | '←' }[] = [];

  let i = m;
  let j = n;

  yield {
    stepIndex: stepIndex++,
    title: `Table Complete: LCS Length = ${dp[m][n]}`,
    description: `The bottom-right cell dp[${m}][${n}] = ${dp[m][n]} is the length of the longest common subsequence. To recover the subsequence itself, walk back from this cell to where each value came from.`,
    codeLine: 9,
    state: { str1, str2, dpTable: dp.map((row) => [...row]), currentRow: m, currentCol: n, lcsString: '', backtrackPath: [], tracebackPhase: true },
    highlights: { cells: [{ r: m, c: n, status: 'active' }] },
    metrics: { comparisons, iterations },
  };

  while (i > 0 && j > 0) {
    const c1 = str1[i - 1];
    const c2 = str2[j - 1];
    let arrow: '↖' | '↑' | '←';
    let title: string;
    let description: string;
    let codeLine: number;
    let rule: DpRuleStep;
    const from = { r: i, c: j };
    if (c1 === c2) {
      arrow = '↖';
      lcsChars.unshift(c1);
      matchedIndicesStr1.unshift(i - 1);
      matchedIndicesStr2.unshift(j - 1);
      title = `↖ Match '${c1}': Add It to the LCS`;
      description = `'${c1}' matches, so this value came from the diagonal + 1: '${c1}' is part of the answer.`;
      codeLine = 11;
      rule = {
        label: 'Traceback: match',
        tone: 'match',
        check: { text: `'${c1}' = '${c2}'`, ok: true },
        formula: 'match → take the character, move ↖',
        substitution: `LCS so far: "${lcsChars.join('')}"`,
        action: `Add '${c1}' and move to dp[${i - 1}][${j - 1}].`,
      };
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      arrow = '↑';
      title = `↑ Move Up: '${c1}' ≠ '${c2}'`;
      description = `The characters differ and the top value is at least the left one, so this value came from above: skip '${c1}'.`;
      codeLine = 12;
      rule = {
        label: 'Traceback: move up',
        tone: 'mismatch',
        check: { text: `top ${dp[i - 1][j]} ≥ left ${dp[i][j - 1]}`, ok: true },
        formula: 'mismatch → go to the larger of ↑ and ←',
        substitution: `dp[${i - 1}][${j}] = ${dp[i - 1][j]}`,
        action: `Move up ↑ to dp[${i - 1}][${j}].`,
      };
      i--;
    } else {
      arrow = '←';
      title = `← Move Left: '${c1}' ≠ '${c2}'`;
      description = `The characters differ and the left value is larger, so this value came from the left: skip '${c2}'.`;
      codeLine = 13;
      rule = {
        label: 'Traceback: move left',
        tone: 'mismatch',
        check: { text: `top ${dp[i - 1][j]} ≥ left ${dp[i][j - 1]}`, ok: false },
        formula: 'mismatch → go to the larger of ↑ and ←',
        substitution: `dp[${i}][${j - 1}] = ${dp[i][j - 1]}`,
        action: `Move left ← to dp[${i}][${j - 1}].`,
      };
      j--;
    }
    backtrackPath.push({ ...from, arrow });
    yield {
      stepIndex: stepIndex++,
      title,
      description,
      codeLine,
      state: {
        str1,
        str2,
        dpTable: dp.map((row) => [...row]),
        currentRow: i,
        currentCol: j,
        lcsString: lcsChars.join(''),
        backtrackPath: backtrackPath.map((p) => ({ r: p.r, c: p.c })),
        matchedIndicesStr1: [...matchedIndicesStr1],
        matchedIndicesStr2: [...matchedIndicesStr2],
        tracebackPhase: true,
        dpRule: rule,
      },
      highlights: {
        cells: [...backtrackPath.map((p) => ({ r: p.r, c: p.c, status: 'path' as const, arrow: p.arrow })), { r: i, c: j, status: 'active' as const }],
      },
      metrics: { comparisons, iterations },
    };
  }
  backtrackPath.push({ r: i, c: j });

  const finalLCS = lcsChars.join('');

  yield {
    stepIndex: stepIndex++,
    title: 'LCS Backtracking Complete',
    description: `Reached ${i === 0 ? 'row' : 'column'} 0, where nothing more can match. Reading the collected characters in order gives the longest common subsequence "${finalLCS}" of length ${dp[m][n]}.`,
    codeLine: 14,
    state: {
      str1,
      str2,
      dpTable: dp.map((row) => [...row]),
      currentRow: 0,
      currentCol: 0,
      lcsString: finalLCS,
      backtrackPath,
      matchedIndicesStr1,
      matchedIndicesStr2,
    },
    highlights: {
      cells: backtrackPath.map((p) => ({ ...p, status: 'path' as const })),
      indices: matchedIndicesStr1,
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      lcsLength: dp[m][n],
      lcsString: finalLCS,
      matchedIndicesStr1,
      matchedIndicesStr2,
    },
  };
}
