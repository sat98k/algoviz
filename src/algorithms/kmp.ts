import { AlgorithmStep } from '../types/algorithm';

export interface KMPState {
  text: string;
  pattern: string;
  lpsTable: number[];
  phase: 'lps' | 'search';
  textIndex: number;
  patternIndex: number;
  lpsLen?: number;
  matchIndices: number[];
  currentComparison?: {
    textChar?: string;
    patternChar?: string;
    isMatch: boolean;
  };
  shift?: number;
  shiftAmount?: number;
}

export function* kmpSteps(inputs: { text: string; pattern: string }): Generator<AlgorithmStep<KMPState>> {
  const text = inputs.text || 'ABABDABACDABABCABAB';
  const pattern = inputs.pattern || 'ABABCABAB';
  const n = text.length;
  const m = pattern.length;

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  const lps: number[] = Array(m).fill(0);
  const matchIndices: number[] = [];

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize KMP: Build LPS Table',
    description: `Target text length n = ${n}, pattern length m = ${m}. Phase 1: Precompute the Longest Proper Prefix which is also Suffix (LPS) table in O(m) time.`,
    codeLine: [1, 2, 3, 4, 5],
    state: {
      text,
      pattern,
      lpsTable: [...lps],
      phase: 'lps',
      textIndex: -1,
      patternIndex: 0,
      matchIndices: [],
      shift: 0,
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  // Phase 1: Build LPS Array
  let len = 0; // length of previous longest prefix suffix
  let i = 1;

  while (i < m) {
    iterations++;
    comparisons++;

    const isMatch = pattern[i] === pattern[len];

    yield {
      stepIndex: stepIndex++,
      title: `LPS: Compare pattern[${i}] vs pattern[${len}]`,
      description: `Comparing pattern[${i}] ('${pattern[i]}') with pattern[${len}] ('${pattern[len]}') to see if prefix can be extended.`,
      codeLine: [6, 7],
      state: {
        text,
        pattern,
        lpsTable: [...lps],
        phase: 'lps',
        textIndex: -1,
        patternIndex: i,
        lpsLen: len,
        matchIndices: [],
        shift: 0,
        currentComparison: {
          textChar: pattern[i],
          patternChar: pattern[len],
          isMatch,
        },
      },
      highlights: {
        type: isMatch ? 'match' : 'mismatch',
        compareIndices: [i, len],
      },
      metrics: { comparisons, iterations },
    };

    if (isMatch) {
      len++;
      lps[i] = len;
      yield {
        stepIndex: stepIndex++,
        title: `LPS: Set LPS[${i}] = ${len}`,
        description: `Characters match! Prefix "${pattern.slice(0, len)}" matches suffix ending at index ${i}. LPS[${i}] = ${len}.`,
        codeLine: [8, 9, 10],
        state: {
          text,
          pattern,
          lpsTable: [...lps],
          phase: 'lps',
          textIndex: -1,
          patternIndex: i,
          lpsLen: len,
          matchIndices: [],
          shift: 0,
        },
        highlights: {
          type: 'match',
          activeIndices: [i],
        },
        metrics: { comparisons, iterations },
      };
      i++;
    } else {
      if (len !== 0) {
        const prevLen = len;
        len = lps[len - 1];
        yield {
          stepIndex: stepIndex++,
          title: `LPS: Fallback len from ${prevLen} to LPS[${prevLen - 1}] = ${len}`,
          description: `Mismatch in prefix! Falling back prefix length to LPS[${prevLen - 1}] = ${len} without advancing index ${i}.`,
          codeLine: [11, 12, 13],
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'lps',
            textIndex: -1,
            patternIndex: i,
            lpsLen: len,
            matchIndices: [],
            shift: 0,
          },
          highlights: {
            type: 'backtrack',
            activeIndices: [len],
          },
          metrics: { comparisons, iterations },
        };
      } else {
        lps[i] = 0;
        yield {
          stepIndex: stepIndex++,
          title: `LPS: Set LPS[${i}] = 0`,
          description: `No proper prefix-suffix match exists for suffix ending at ${i}. LPS[${i}] = 0. Advancing index to ${i + 1}.`,
          codeLine: [14, 15, 16],
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'lps',
            textIndex: -1,
            patternIndex: i,
            lpsLen: 0,
            matchIndices: [],
            shift: 0,
          },
          highlights: {
            activeIndices: [i],
          },
          metrics: { comparisons, iterations },
        };
        i++;
      }
    }
  }

  yield {
    stepIndex: stepIndex++,
    title: 'LPS Table Complete — Begin Search Phase',
    description: `Computed full LPS Table: [${lps.join(', ')}]. Now scanning text with zero backtracking of the text pointer.`,
    codeLine: [17, 19, 20, 21, 22],
    state: {
      text,
      pattern,
      lpsTable: [...lps],
      phase: 'search',
      textIndex: 0,
      patternIndex: 0,
      matchIndices: [],
      shift: 0,
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  // Phase 2: Search in text
  let txtIdx = 0;
  let patIdx = 0;

  while (txtIdx < n) {
    iterations++;
    comparisons++;

    const isCharMatch = pattern[patIdx] === text[txtIdx];
    const currentShift = txtIdx - patIdx;

    yield {
      stepIndex: stepIndex++,
      title: `Compare: text[${txtIdx}] vs pattern[${patIdx}]`,
      description: `Comparing text[${txtIdx}] ('${text[txtIdx]}') with pattern[${patIdx}] ('${pattern[patIdx]}') at alignment shift ${currentShift}. Result: ${isCharMatch ? 'MATCH' : 'MISMATCH'}.`,
      codeLine: [23, 24],
      state: {
        text,
        pattern,
        lpsTable: [...lps],
        phase: 'search',
        textIndex: txtIdx,
        patternIndex: patIdx,
        shift: currentShift,
        matchIndices: [...matchIndices],
        currentComparison: {
          textChar: text[txtIdx],
          patternChar: pattern[patIdx],
          isMatch: isCharMatch,
        },
      },
      highlights: {
        type: isCharMatch ? 'match' : 'mismatch',
        textIndex: txtIdx,
        patternIndex: patIdx,
      },
      metrics: { comparisons, iterations },
    };

    if (isCharMatch) {
      txtIdx++;
      patIdx++;

      if (patIdx === m) {
        const foundPos = txtIdx - patIdx;
        matchIndices.push(foundPos);

        yield {
          stepIndex: stepIndex++,
          title: `Full Pattern Match Confirmed at Index ${foundPos}!`,
          description: `All ${m} characters matched! Pattern "${pattern}" found at position ${foundPos}. Shifting pattern via LPS[${m - 1}] = ${lps[m - 1]}.`,
          codeLine: [27, 28, 29],
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'search',
            textIndex: txtIdx - 1,
            patternIndex: patIdx - 1,
            shift: foundPos,
            matchIndices: [...matchIndices],
            shiftAmount: patIdx - lps[patIdx - 1],
          },
          highlights: {
            type: 'match',
            matchIndices: [...matchIndices],
          },
          metrics: { comparisons, iterations },
        };

        patIdx = lps[patIdx - 1];
      }
    } else {
      if (patIdx !== 0) {
        const oldPatIdx = patIdx;
        patIdx = lps[patIdx - 1];
        const newShift = txtIdx - patIdx;
        yield {
          stepIndex: stepIndex++,
          title: `Mismatch: Shift Pattern via LPS[${oldPatIdx - 1}] = ${patIdx}`,
          description: `Mismatch at pattern index ${oldPatIdx}. Fall back pattern index to ${patIdx} without decrementing text pointer (text[${txtIdx}] remains fixed). Alignment shift becomes ${newShift}.`,
          codeLine: [30, 31, 32],
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'search',
            textIndex: txtIdx,
            patternIndex: patIdx,
            shift: newShift,
            matchIndices: [...matchIndices],
            shiftAmount: oldPatIdx - patIdx,
            currentComparison: {
              textChar: text[txtIdx],
              patternChar: pattern[oldPatIdx],
              isMatch: false,
            },
          },
          highlights: {
            type: 'backtrack',
            textIndex: txtIdx,
            patternIndex: patIdx,
          },
          metrics: { comparisons, iterations },
        };
      } else {
        txtIdx++;
        yield {
          stepIndex: stepIndex++,
          title: `Mismatch at Pattern Start: Advance Text Pointer`,
          description: `Mismatch at pattern index 0. Advancing text pointer to index ${txtIdx}.`,
          codeLine: [30, 33, 34],
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'search',
            textIndex: txtIdx,
            patternIndex: 0,
            shift: txtIdx,
            matchIndices: [...matchIndices],
          },
          highlights: {
            textIndex: txtIdx,
          },
          metrics: { comparisons, iterations },
        };
      }
    }
  }

  yield {
    stepIndex: stepIndex++,
    title: 'KMP Search Complete',
    description: `Search complete. Found ${matchIndices.length} occurrence(s) at index positions: [${matchIndices.join(', ')}]. Total character comparisons: ${comparisons}.`,
    codeLine: 35,
    state: {
      text,
      pattern,
      lpsTable: [...lps],
      phase: 'search',
      textIndex: n - 1,
      patternIndex: patIdx,
      shift: Math.max(0, n - m),
      matchIndices: [...matchIndices],
    },
    highlights: {
      matchIndices: [...matchIndices],
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      matchCount: matchIndices.length,
      matchIndices,
      lpsTable: lps,
    },
  };
}
