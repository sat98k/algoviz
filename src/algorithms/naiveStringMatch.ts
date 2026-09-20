import { AlgorithmStep } from '../types/algorithm';

export interface NaiveState {
  text: string;
  pattern: string;
  phase: 'search';
  textIndex: number;
  patternIndex: number;
  shift: number;
  matchIndices: number[];
  verifiedIndices?: number[];
  currentComparison?: {
    textChar?: string;
    patternChar?: string;
    isMatch: boolean;
  };
}

export function* naiveStringMatchSteps(inputs: {
  text: string;
  pattern: string;
}): Generator<AlgorithmStep<NaiveState>> {
  const text = inputs.text || 'ABABDABACDABABCABAB';
  const pattern = inputs.pattern || 'ABABCABAB';
  const n = text.length;
  const m = pattern.length;

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  const matchIndices: number[] = [];

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Naive String Matching',
    description: `Target text length n = ${n}, pattern length m = ${m}. Slide pattern across all window alignments shift = 0 … ${Math.max(n - m, 0)} and compare character by character.`,
    codeLine: [1, 2, 3],
    state: {
      text,
      pattern,
      phase: 'search',
      textIndex: 0,
      patternIndex: 0,
      shift: 0,
      matchIndices: [],
      verifiedIndices: [],
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  if (m > 0 && m <= n) {
    for (let s = 0; s <= n - m; s++) {
      yield {
        stepIndex: stepIndex++,
        title: `Align Pattern at Shift ${s}`,
        description: `Position pattern P[0…${m - 1}] directly under text window T[${s}…${s + m - 1}]. Assume matchFound = true and verify characters sequentially.`,
        codeLine: [4, 5],
        state: {
          text,
          pattern,
          phase: 'search',
          textIndex: s,
          patternIndex: 0,
          shift: s,
          matchIndices: [...matchIndices],
          verifiedIndices: [],
        },
        highlights: {
          textIndex: s,
          patternIndex: 0,
          shiftAmount: s,
        },
        metrics: { comparisons, iterations },
      };

      const verified: number[] = [];
      let j = 0;
      for (; j < m; j++) {
        iterations++;
        comparisons++;

        const isMatch = text[s + j] === pattern[j];

        yield {
          stepIndex: stepIndex++,
          title: `Compare Character: text[${s + j}] vs pattern[${j}]`,
          description: `Comparing text[${s + j}] ('${text[s + j]}') with pattern[${j}] ('${pattern[j]}'). Result: ${isMatch ? 'MATCH' : 'MISMATCH'}.`,
          codeLine: [6, 7],
          state: {
            text,
            pattern,
            phase: 'search',
            textIndex: s + j,
            patternIndex: j,
            shift: s,
            matchIndices: [...matchIndices],
            verifiedIndices: [...verified],
            currentComparison: {
              textChar: text[s + j],
              patternChar: pattern[j],
              isMatch,
            },
          },
          highlights: {
            type: isMatch ? 'match' : 'mismatch',
            textIndex: s + j,
            patternIndex: j,
            shiftAmount: s,
          },
          metrics: { comparisons, iterations },
        };

        if (!isMatch) {
          yield {
            stepIndex: stepIndex++,
            title: `Mismatch Detected at Offset ${j} — Slide Window`,
            description: `Characters differ ('${text[s + j]}' != '${pattern[j]}'). Set matchFound = false, break out of loop, and advance to shift ${s + 1}.`,
            codeLine: [8, 9],
            state: {
              text,
              pattern,
              phase: 'search',
              textIndex: s + j,
              patternIndex: j,
              shift: s,
              matchIndices: [...matchIndices],
              verifiedIndices: [...verified],
              currentComparison: {
                textChar: text[s + j],
                patternChar: pattern[j],
                isMatch: false,
              },
            },
            highlights: {
              type: 'mismatch',
              textIndex: s + j,
              patternIndex: j,
              shiftAmount: s,
            },
            metrics: { comparisons, iterations },
          };
          break;
        }

        verified.push(j);
      }

      if (j === m) {
        matchIndices.push(s);
        yield {
          stepIndex: stepIndex++,
          title: `Pattern Match Confirmed at Shift ${s}!`,
          description: `matchFound is true! All ${m} pattern characters matched text window T[${s}…${s + m - 1}]. Recording occurrence index ${s}.`,
          codeLine: [10, 11],
          state: {
            text,
            pattern,
            phase: 'search',
            textIndex: s + m - 1,
            patternIndex: m - 1,
            shift: s,
            matchIndices: [...matchIndices],
            verifiedIndices: Array.from({ length: m }, (_, idx) => idx),
          },
          highlights: {
            type: 'match',
            matchIndices: [...matchIndices],
            shiftAmount: s,
          },
          metrics: { comparisons, iterations },
        };
      }
    }
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Naive Search Complete',
    description: `Search complete. Found ${matchIndices.length} occurrence(s) at index positions: [${matchIndices.join(', ')}]. Total character comparisons: ${comparisons}.`,
    codeLine: 12,
    state: {
      text,
      pattern,
      phase: 'search',
      textIndex: Math.max(n - 1, 0),
      patternIndex: 0,
      shift: Math.max(n - m, 0),
      matchIndices: [...matchIndices],
      verifiedIndices: [],
    },
    highlights: {
      matchIndices: [...matchIndices],
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      matchCount: matchIndices.length,
      matchIndices,
    },
  };
}
