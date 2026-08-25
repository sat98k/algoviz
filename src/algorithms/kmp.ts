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
    title: 'Initialize KMP Algorithm',
    description: `Target Text of length ${n}, Pattern of length ${m}. Phase 1: Construct LPS (Longest Proper Prefix which is also Suffix) table.`,
    codeLine: 1,
    state: {
      text,
      pattern,
      lpsTable: [...lps],
      phase: 'lps',
      textIndex: -1,
      patternIndex: 0,
      matchIndices: [],
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

    yield {
      stepIndex: stepIndex++,
      title: `LPS: Compare pattern[${i}] vs pattern[${len}]`,
      description: `Comparing pattern[${i}] ('${pattern[i]}') with pattern[${len}] ('${pattern[len]}') to compute LPS[${i}].`,
      codeLine: 2,
      state: {
        text,
        pattern,
        lpsTable: [...lps],
        phase: 'lps',
        textIndex: -1,
        patternIndex: i,
        lpsLen: len,
        matchIndices: [],
        currentComparison: {
          textChar: pattern[i],
          patternChar: pattern[len],
          isMatch: pattern[i] === pattern[len],
        },
      },
      highlights: {
        type: pattern[i] === pattern[len] ? 'match' : 'mismatch',
        compareIndices: [i, len],
      },
      metrics: { comparisons, iterations },
    };

    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      yield {
        stepIndex: stepIndex++,
        title: `LPS: Set LPS[${i}] = ${len}`,
        description: `Characters match! LPS[${i}] set to ${len} (prefix "${pattern.slice(0, len)}" matches suffix).`,
        codeLine: 3,
        state: {
          text,
          pattern,
          lpsTable: [...lps],
          phase: 'lps',
          textIndex: -1,
          patternIndex: i,
          lpsLen: len,
          matchIndices: [],
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
        len = lps[len - 1];
        yield {
          stepIndex: stepIndex++,
          title: `LPS: Fallback to len = LPS[${len}]`,
          description: `Mismatch in pattern prefix! Falling back len to ${len} using LPS[${len}] without advancing index ${i}.`,
          codeLine: 4,
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'lps',
            textIndex: -1,
            patternIndex: i,
            lpsLen: len,
            matchIndices: [],
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
          description: `No matching prefix found. LPS[${i}] = 0. Advancing index to ${i + 1}.`,
          codeLine: 5,
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'lps',
            textIndex: -1,
            patternIndex: i,
            lpsLen: 0,
            matchIndices: [],
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
    description: `Computed full LPS Table: [${lps.join(', ')}]. Now scanning text with zero backtracking of text pointer.`,
    codeLine: 6,
    state: {
      text,
      pattern,
      lpsTable: [...lps],
      phase: 'search',
      textIndex: 0,
      patternIndex: 0,
      matchIndices: [],
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

    yield {
      stepIndex: stepIndex++,
      title: `Compare text[${txtIdx}] vs pattern[${patIdx}]`,
      description: `Comparing text[${txtIdx}] ('${text[txtIdx]}') with pattern[${patIdx}] ('${pattern[patIdx]}'). Result: ${isCharMatch ? 'MATCH' : 'MISMATCH'}.`,
      codeLine: 7,
      state: {
        text,
        pattern,
        lpsTable: [...lps],
        phase: 'search',
        textIndex: txtIdx,
        patternIndex: patIdx,
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
          title: `Pattern Match Found at Index ${foundPos}!`,
          description: `Full pattern "${pattern}" successfully matched at text position ${foundPos}! Shifting pattern using LPS[${m - 1}] = ${lps[m - 1]}.`,
          codeLine: 8,
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'search',
            textIndex: txtIdx - 1,
            patternIndex: patIdx - 1,
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
        yield {
          stepIndex: stepIndex++,
          title: `Mismatch: Shift Pattern via LPS`,
          description: `Mismatch at pattern index ${oldPatIdx}. Shifting pattern index to LPS[${oldPatIdx - 1}] = ${patIdx} without rolling back text index (${txtIdx}).`,
          codeLine: 9,
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'search',
            textIndex: txtIdx,
            patternIndex: patIdx,
            matchIndices: [...matchIndices],
            shiftAmount: oldPatIdx - patIdx,
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
          title: `Mismatch at Start of Pattern: Advance Text`,
          description: `Mismatch at pattern index 0. Advancing text pointer to ${txtIdx}.`,
          codeLine: 10,
          state: {
            text,
            pattern,
            lpsTable: [...lps],
            phase: 'search',
            textIndex: txtIdx,
            patternIndex: 0,
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
    description: `Search completed. Found ${matchIndices.length} occurrence(s) at index positions: [${matchIndices.join(', ')}]. Total character comparisons: ${comparisons}.`,
    codeLine: 11,
    state: {
      text,
      pattern,
      lpsTable: [...lps],
      phase: 'search',
      textIndex: n - 1,
      patternIndex: patIdx,
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
