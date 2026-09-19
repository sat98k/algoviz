import { AlgorithmStep } from '../types/algorithm';

export interface NaiveState {
  text: string;
  pattern: string;
  phase: 'search';
  textIndex: number;
  patternIndex: number;
  shift: number;
  matchIndices: number[];
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
    description: `Target Text of length ${n}, Pattern of length ${m}. Slide the pattern across every alignment s = 0 … ${Math.max(n - m, 0)} and compare character by character.`,
    codeLine: 1,
    state: {
      text,
      pattern,
      phase: 'search',
      textIndex: 0,
      patternIndex: 0,
      shift: 0,
      matchIndices: [],
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  if (m > 0 && m <= n) {
    for (let s = 0; s <= n - m; s++) {
      yield {
        stepIndex: stepIndex++,
        title: `Align pattern at shift s = ${s}`,
        description: `Position the pattern so P[0] lines up with text[${s}]. Compare P[0…${m - 1}] against text[${s}…${s + m - 1}].`,
        codeLine: 2,
        state: {
          text,
          pattern,
          phase: 'search',
          textIndex: s,
          patternIndex: 0,
          shift: s,
          matchIndices: [...matchIndices],
        },
        highlights: {
          textIndex: s,
          patternIndex: 0,
          shiftAmount: s,
        },
        metrics: { comparisons, iterations },
      };

      let j = 0;
      for (; j < m; j++) {
        iterations++;
        comparisons++;

        const isMatch = text[s + j] === pattern[j];

        yield {
          stepIndex: stepIndex++,
          title: `Compare text[${s + j}] vs pattern[${j}]`,
          description: `Comparing text[${s + j}] ('${text[s + j]}') with pattern[${j}] ('${pattern[j]}'). Result: ${isMatch ? 'MATCH' : 'MISMATCH'}.`,
          codeLine: 3,
          state: {
            text,
            pattern,
            phase: 'search',
            textIndex: s + j,
            patternIndex: j,
            shift: s,
            matchIndices: [...matchIndices],
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
            title: `Mismatch — slide window to shift s = ${s + 1}`,
            description: `Characters differ at pattern index ${j}. Abandon this alignment and shift the pattern one position right${s + 1 <= n - m ? '.' : ' (end of text reached).'}`,
            codeLine: 4,
            state: {
              text,
              pattern,
              phase: 'search',
              textIndex: s + j,
              patternIndex: j,
              shift: s,
              matchIndices: [...matchIndices],
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
      }

      if (j === m) {
        matchIndices.push(s);
        yield {
          stepIndex: stepIndex++,
          title: `Pattern Match Found at Index ${s}!`,
          description: `All ${m} characters matched. Pattern "${pattern}" occurs at text position ${s}. Continue scanning from shift s = ${s + 1}.`,
          codeLine: 5,
          state: {
            text,
            pattern,
            phase: 'search',
            textIndex: s + m - 1,
            patternIndex: m - 1,
            shift: s,
            matchIndices: [...matchIndices],
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
    description: `Search completed. Found ${matchIndices.length} occurrence(s) at index positions: [${matchIndices.join(', ')}]. Total character comparisons: ${comparisons}.`,
    codeLine: 6,
    state: {
      text,
      pattern,
      phase: 'search',
      textIndex: Math.max(n - 1, 0),
      patternIndex: 0,
      shift: Math.max(n - m, 0),
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
    },
  };
}
