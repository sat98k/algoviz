import { AlgorithmStep } from '../types/algorithm';

export interface RabinKarpState {
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
  hashInfo: {
    base: number;
    prime: number;
    highOrder: number;
    patternHash: number;
    windowHash: number;
    hashMatch: boolean;
    spurious?: boolean;
  };
}

const D = 256; // radix — size of the character set
const Q = 101; // a prime modulus that keeps the hash small

export function* rabinKarpSteps(inputs: {
  text: string;
  pattern: string;
}): Generator<AlgorithmStep<RabinKarpState>> {
  const text = inputs.text || 'ABABDABACDABABCABAB';
  const pattern = inputs.pattern || 'ABABCABAB';
  const n = text.length;
  const m = pattern.length;

  let stepIndex = 0;
  let comparisons = 0; // character comparisons made while verifying a hash hit
  let iterations = 0; // window alignments examined

  const matchIndices: number[] = [];
  let spuriousHits = 0;
  let hashChecks = 0;

  // h = D^(m-1) % Q — the weight of the leading character, used to roll the hash
  let h = 1;
  for (let i = 0; i < m - 1; i++) {
    h = (h * D) % Q;
  }

  const hashInfo = (
    patternHash: number,
    windowHash: number,
    hashMatch: boolean,
    spurious?: boolean
  ) => ({
    base: D,
    prime: Q,
    highOrder: h,
    patternHash,
    windowHash,
    hashMatch,
    spurious,
  });

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Rabin-Karp Algorithm',
    description: `Target Text of length ${n}, Pattern of length ${m}. Using radix d = ${D} and prime modulus q = ${Q}. Leading-digit weight h = d^(m-1) mod q = ${h}.`,
    codeLine: 1,
    state: {
      text,
      pattern,
      phase: 'search',
      textIndex: 0,
      patternIndex: 0,
      shift: 0,
      matchIndices: [],
      hashInfo: hashInfo(0, 0, false),
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  if (m > 0 && m <= n) {
    // Preprocess: hash of the pattern and hash of the first text window
    let p = 0;
    let t = 0;
    for (let i = 0; i < m; i++) {
      p = (D * p + pattern.charCodeAt(i)) % Q;
      t = (D * t + text.charCodeAt(i)) % Q;
    }

    yield {
      stepIndex: stepIndex++,
      title: 'Compute pattern hash and first window hash',
      description: `hash(P) = ${p}. hash(T[0…${m - 1}]) = ${t}. Both computed in O(m) using Horner's rule.`,
      codeLine: 6,
      state: {
        text,
        pattern,
        phase: 'search',
        textIndex: 0,
        patternIndex: 0,
        shift: 0,
        matchIndices: [],
        hashInfo: hashInfo(p, t, p === t),
      },
      highlights: { textIndex: 0, patternIndex: 0, shiftAmount: 0 },
      metrics: { comparisons, iterations },
    };

    for (let s = 0; s <= n - m; s++) {
      iterations++;
      hashChecks++;
      const hashMatch = p === t;

      yield {
        stepIndex: stepIndex++,
        title: `Shift s = ${s}: compare window hash ${t} vs pattern hash ${p}`,
        description: hashMatch
          ? `Hashes match (${t} == ${p}). Verify the window character by character to rule out a collision.`
          : `Hashes differ (${t} != ${p}). No match possible at this alignment — skip verification.`,
        codeLine: 8,
        state: {
          text,
          pattern,
          phase: 'search',
          textIndex: s,
          patternIndex: 0,
          shift: s,
          matchIndices: [...matchIndices],
          hashInfo: hashInfo(p, t, hashMatch),
        },
        highlights: {
          type: hashMatch ? 'match' : 'mismatch',
          textIndex: s,
          patternIndex: 0,
          shiftAmount: s,
        },
        metrics: { comparisons, iterations },
      };

      if (hashMatch) {
        let j = 0;
        for (; j < m; j++) {
          comparisons++;
          const isMatch = text[s + j] === pattern[j];

          yield {
            stepIndex: stepIndex++,
            title: `Verify text[${s + j}] vs pattern[${j}]`,
            description: `Comparing text[${s + j}] ('${text[s + j]}') with pattern[${j}] ('${pattern[j]}'). Result: ${isMatch ? 'MATCH' : 'MISMATCH'}.`,
            codeLine: 9,
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
              hashInfo: hashInfo(p, t, true),
            },
            highlights: {
              type: isMatch ? 'match' : 'mismatch',
              textIndex: s + j,
              patternIndex: j,
              shiftAmount: s,
            },
            metrics: { comparisons, iterations },
          };

          if (!isMatch) break;
        }

        if (j === m) {
          matchIndices.push(s);
          yield {
            stepIndex: stepIndex++,
            title: `Pattern Match Found at Index ${s}!`,
            description: `All ${m} characters matched. Pattern "${pattern}" occurs at text position ${s}.`,
            codeLine: 9,
            state: {
              text,
              pattern,
              phase: 'search',
              textIndex: s + m - 1,
              patternIndex: m - 1,
              shift: s,
              matchIndices: [...matchIndices],
              hashInfo: hashInfo(p, t, true),
            },
            highlights: {
              type: 'match',
              matchIndices: [...matchIndices],
              shiftAmount: s,
            },
            metrics: { comparisons, iterations },
          };
        } else {
          spuriousHits++;
          yield {
            stepIndex: stepIndex++,
            title: `Spurious Hit at Index ${s}`,
            description: `Hashes collided (${t} == ${p}) but the strings differ at offset ${j}. This is a false positive — keep scanning.`,
            codeLine: 9,
            state: {
              text,
              pattern,
              phase: 'search',
              textIndex: s + j,
              patternIndex: j,
              shift: s,
              matchIndices: [...matchIndices],
              hashInfo: hashInfo(p, t, true, true),
            },
            highlights: {
              type: 'mismatch',
              textIndex: s + j,
              patternIndex: j,
              shiftAmount: s,
            },
            metrics: { comparisons, iterations },
          };
        }
      }

      if (s < n - m) {
        const removed = text[s];
        const added = text[s + m];
        t = (D * (t - text.charCodeAt(s) * h) + text.charCodeAt(s + m)) % Q;
        if (t < 0) t += Q;

        yield {
          stepIndex: stepIndex++,
          title: `Roll hash to window at shift s = ${s + 1}`,
          description: `Slide right: drop leading '${removed}' (weight h = ${h}) and append '${added}'. New window hash = ${t}, computed in O(1).`,
          codeLine: 11,
          state: {
            text,
            pattern,
            phase: 'search',
            textIndex: s + 1,
            patternIndex: 0,
            shift: s + 1,
            matchIndices: [...matchIndices],
            hashInfo: hashInfo(p, t, p === t),
          },
          highlights: {
            textIndex: s + 1,
            patternIndex: 0,
            shiftAmount: s + 1,
          },
          metrics: { comparisons, iterations },
        };
      }
    }
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Rabin-Karp Search Complete',
    description: `Search completed. Found ${matchIndices.length} occurrence(s) at index positions: [${matchIndices.join(', ')}]. Hash checks: ${hashChecks}, spurious hits: ${spuriousHits}, character comparisons: ${comparisons}.`,
    codeLine: 11,
    state: {
      text,
      pattern,
      phase: 'search',
      textIndex: Math.max(n - 1, 0),
      patternIndex: 0,
      shift: Math.max(n - m, 0),
      matchIndices: [...matchIndices],
      hashInfo: hashInfo(0, 0, false),
    },
    highlights: {
      matchIndices: [...matchIndices],
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      matchCount: matchIndices.length,
      matchIndices,
      spuriousHits,
      base: D,
      prime: Q,
    },
  };
}
