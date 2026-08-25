import { AlgorithmStep } from '../types/algorithm';

export interface LCSState {
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
    codeLine: 1,
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
          description: `Characters match at str1[${i - 1}] and str2[${j - 1}] ('${char1}'). dp[${i}][${j}] = 1 + dp[${i - 1}][${j - 1}] = 1 + ${dp[i - 1][j - 1]} = ${dp[i][j]}.`,
          codeLine: 2,
          state: {
            str1,
            str2,
            dpTable: dp.map((row) => [...row]),
            currentRow: i,
            currentCol: j,
            currentMatchChar: char1,
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
          description: `Characters do not match ('${char1}' != '${char2}'). dp[${i}][${j}] = max(top: ${topVal}, left: ${leftVal}) = ${dp[i][j]}.`,
          codeLine: 3,
          state: {
            str1,
            str2,
            dpTable: dp.map((row) => [...row]),
            currentRow: i,
            currentCol: j,
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

  // Backtracking to find LCS string
  let lcsChars: string[] = [];
  const matchedIndicesStr1: number[] = [];
  const matchedIndicesStr2: number[] = [];
  const backtrackPath: { r: number; c: number }[] = [];

  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    backtrackPath.push({ r: i, c: j });
    if (str1[i - 1] === str2[j - 1]) {
      lcsChars.unshift(str1[i - 1]);
      matchedIndicesStr1.unshift(i - 1);
      matchedIndicesStr2.unshift(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  backtrackPath.push({ r: i, c: j });

  const finalLCS = lcsChars.join('');

  yield {
    stepIndex: stepIndex++,
    title: 'LCS Backtracking Complete',
    description: `Reconstructed Longest Common Subsequence: "${finalLCS}" of length ${dp[m][n]}.`,
    codeLine: 4,
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
