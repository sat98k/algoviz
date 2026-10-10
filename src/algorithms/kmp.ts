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
  /** LPS phase: what the step did with the pointers i (= patternIndex) and len (= lpsLen). */
  lpsAction?: 'start' | 'compare' | 'extend' | 'fallback' | 'zero' | 'done';
  /** LPS phase, fallback: len before falling back. */
  prevLen?: number;
  /** LPS phase: number of LPS entries computed so far (entries 0 … lpsFilled−1 are final). */
  lpsFilled?: number;
  /** Search phase: the LPS entry used to move j back (fallback or after a full match). */
  lpsUsedIndex?: number;
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
    title: 'Phase 1: Build the LPS Table (Pattern Only)',
    description: `Before reading the text, KMP studies the pattern alone. For each position i, LPS[i] is the length of the longest proper prefix of P[0…i] that is also a suffix of it (proper = not the whole string). LPS[0] = 0 because a single character has no proper prefix. Start with len = 0 and i = 1.`,
    codeLine: [2, 3, 4, 5],
    state: {
      text,
      pattern,
      lpsTable: [...lps],
      phase: 'lps',
      textIndex: -1,
      patternIndex: Math.min(1, m),
      matchIndices: [],
      shift: 0,
      lpsLen: 0,
      lpsAction: 'start',
      lpsFilled: Math.min(1, m),
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
      title: `LPS: Compare P[i = ${i}] with P[len = ${len}]`,
      description:
        len === 0
          ? `No prefix is matched yet (len = 0). Can P[${i}] = '${pattern[i]}' start a prefix-suffix by matching P[0] = '${pattern[0]}'?`
          : `The prefix "${pattern.slice(0, len)}" already equals the suffix ending at index ${i - 1}. Can it grow by one? Compare the next prefix character P[${len}] = '${pattern[len]}' with P[${i}] = '${pattern[i]}'.`,
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
        lpsAction: 'compare',
        lpsFilled: i,
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
        title: `LPS: len Grows to ${len}, so LPS[${i}] = ${len}`,
        description: `P[${i}] = P[${len - 1}], so the prefix-suffix grows by one: the prefix "${pattern.slice(0, len)}" equals the suffix ending at index ${i}. Record LPS[${i}] = ${len} and move i to ${i + 1}.`,
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
          lpsAction: 'extend',
          lpsFilled: i + 1,
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
          title: `LPS: Fall Back, len = LPS[${prevLen - 1}] = ${len}`,
          description: `The prefix "${pattern.slice(0, prevLen)}" cannot be extended with '${pattern[i]}'. The next shorter candidate is the longest prefix-suffix of "${pattern.slice(0, prevLen)}" itself, which LPS[${prevLen - 1}] = ${len} already stores${len > 0 ? ` ("${pattern.slice(0, len)}")` : ''}. i stays at ${i}; try again with len = ${len}.`,
          codeLine: [11, 12],
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
            lpsAction: 'fallback',
            prevLen,
            lpsFilled: i,
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
          title: `LPS: No Prefix Fits, LPS[${i}] = 0`,
          description: `len = 0 and P[${i}] = '${pattern[i]}' differs from P[0] = '${pattern[0]}', so no proper prefix of P[0…${i}] is also a suffix. Record LPS[${i}] = 0 and move i to ${i + 1}.`,
          codeLine: [13, 14, 15],
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
            lpsAction: 'zero',
            lpsFilled: i + 1,
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
    title: 'LPS Table Complete',
    description: `LPS = [${lps.join(', ')}]. Phase 1 used only the pattern; the text has not been read yet.`,
    codeLine: 16,
    state: {
      text,
      pattern,
      lpsTable: [...lps],
      phase: 'lps',
      textIndex: -1,
      patternIndex: -1,
      lpsLen: len,
      matchIndices: [],
      shift: 0,
      lpsAction: 'done',
      lpsFilled: m,
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  yield {
    stepIndex: stepIndex++,
    title: 'Phase 2: Search the Text',
    description: `Scan the text with i (text index) and j (pattern index), both starting at 0. On a mismatch, the LPS table moves j back while i never moves backwards.`,
    codeLine: [20, 21, 22],
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
      title: `Compare text[i = ${txtIdx}] with P[j = ${patIdx}]`,
      description: isCharMatch
        ? `text[${txtIdx}] = '${text[txtIdx]}' equals P[${patIdx}]: advance both i and j.`
        : `text[${txtIdx}] = '${text[txtIdx]}' differs from P[${patIdx}] = '${pattern[patIdx]}'.`,
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
          description: `All ${m} characters matched: "${pattern}" occurs at index ${foundPos}. To find overlapping matches, keep the longest prefix that is also a suffix: j = LPS[${m - 1}] = ${lps[m - 1]}.`,
          codeLine: [26, 27, 28],
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
            lpsUsedIndex: m - 1,
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
          title: `Mismatch: j Falls Back to LPS[${oldPatIdx - 1}] = ${patIdx}`,
          description: `The ${oldPatIdx} text characters before i matched P[0…${oldPatIdx - 1}] = "${pattern.slice(0, oldPatIdx)}". ${patIdx > 0 ? `Its last ${patIdx} characters equal its first ${patIdx} ("${pattern.slice(0, patIdx)}"), so the pattern slides right and those ${patIdx} characters are already known to match: no text character is re-read.` : 'No prefix of it is also a suffix, so the pattern restarts from j = 0.'} i stays at ${txtIdx}; j = ${patIdx}.`,
          codeLine: [29, 30],
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
            lpsUsedIndex: oldPatIdx - 1,
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
          title: `Mismatch at j = 0: Advance i`,
          description: `Nothing of the pattern is matched, so there is nothing to reuse: move i to ${txtIdx}.`,
          codeLine: [31, 32],
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
    codeLine: 33,
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
