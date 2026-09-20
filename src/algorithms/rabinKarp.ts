import { AlgorithmStep } from '../types/algorithm';

export interface RabinKarpState {
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
  hashInfo: {
    base: number;
    prime: number;
    highOrder: number;
    patternHash: number;
    windowHash: number;
    hashMatch: boolean;
    spurious?: boolean;
  };
  rollingInfo?: {
    removedChar: string;
    removedAscii: number;
    removedTerm: number;
    removedIndex: number;
    addedChar: string;
    addedAscii: number;
    addedIndex: number;
    prevHash: number;
    nextHash: number;
    calculationText: string;
  };
}

const D = 256; // radix — size of the character set (extended ASCII)
const Q = 101; // a prime modulus that keeps the hash bounded

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

  // h = D^(m-1) % Q — the high-order digit weight used to remove the outgoing character
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
    description: `Target text length n = ${n}, pattern length m = ${m}. Base radix d = ${D}, prime modulus q = ${Q}. Leading-digit weight h = d^(m-1) mod q = ${h}.`,
    codeLine: [1, 2, 3, 4],
    state: {
      text,
      pattern,
      phase: 'search',
      textIndex: 0,
      patternIndex: 0,
      shift: 0,
      matchIndices: [],
      verifiedIndices: [],
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
      title: 'Compute Initial Pattern & First Window Hashes',
      description: `Pattern hash P = ${p}. First window hash T[0…${m - 1}] = ${t}. Both computed in O(m) time using Horner's polynomial rule.`,
      codeLine: [5, 6],
      state: {
        text,
        pattern,
        phase: 'search',
        textIndex: 0,
        patternIndex: 0,
        shift: 0,
        matchIndices: [],
        verifiedIndices: [],
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
        title: `Shift ${s}: Compare Window Hash (${t}) vs Pattern Hash (${p})`,
        description: hashMatch
          ? `Hashes match (${t} == ${p})! Candidate alignment found at shift ${s}. Performing character-by-character verification to rule out a hash collision.`
          : `Hashes differ (${t} != ${p}). No match possible at shift ${s}. Skipping character checks and rolling window right.`,
        codeLine: [7, 8],
        state: {
          text,
          pattern,
          phase: 'search',
          textIndex: s,
          patternIndex: 0,
          shift: s,
          matchIndices: [...matchIndices],
          verifiedIndices: [],
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
        const verified: number[] = [];
        let j = 0;
        for (; j < m; j++) {
          comparisons++;
          const isMatch = text[s + j] === pattern[j];

          yield {
            stepIndex: stepIndex++,
            title: `Verify Character: text[${s + j}] vs pattern[${j}]`,
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
              verifiedIndices: [...verified],
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

          if (!isMatch) {
            break;
          }
          verified.push(j);
        }

        if (j === m) {
          matchIndices.push(s);
          yield {
            stepIndex: stepIndex++,
            title: `Full Pattern Match Confirmed at Shift ${s}!`,
            description: `All ${m} characters matched! Pattern "${pattern}" occurs at text position ${s}.`,
            codeLine: 10,
            state: {
              text,
              pattern,
              phase: 'search',
              textIndex: s + m - 1,
              patternIndex: m - 1,
              shift: s,
              matchIndices: [...matchIndices],
              verifiedIndices: Array.from({ length: m }, (_, idx) => idx),
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
            title: `Spurious Hit (Hash Collision) at Shift ${s}`,
            description: `Hashes matched (${t} == ${p}), but characters differed at pattern offset ${j} ('${text[s + j]}' != '${pattern[j]}'). False positive recorded.`,
            codeLine: 12,
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
        const removedAscii = text.charCodeAt(s);
        const removedTerm = (removedAscii * h) % Q;
        const added = text[s + m];
        const addedAscii = text.charCodeAt(s + m);
        const prevT = t;

        t = (D * (t - removedAscii * h) + addedAscii) % Q;
        if (t < 0) t += Q;

        const formula = `(${D} × (${prevT} − '${removed}'(${removedAscii}) × ${h}) + '${added}'(${addedAscii})) mod ${Q} = ${t}`;

        yield {
          stepIndex: stepIndex++,
          title: `Roll Hash to Shift ${s + 1}`,
          description: `Slide window 1 position right: subtract outgoing '${removed}' (weight ${h}) and add incoming '${added}'. New window hash = ${t} computed in O(1) time.`,
          codeLine: [13, 14],
          state: {
            text,
            pattern,
            phase: 'search',
            textIndex: s + 1,
            patternIndex: 0,
            shift: s + 1,
            matchIndices: [...matchIndices],
            verifiedIndices: [],
            hashInfo: hashInfo(p, t, p === t),
            rollingInfo: {
              removedChar: removed,
              removedAscii,
              removedTerm,
              removedIndex: s,
              addedChar: added,
              addedAscii,
              addedIndex: s + m,
              prevHash: prevT,
              nextHash: t,
              calculationText: formula,
            },
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
    description: `Search complete. Found ${matchIndices.length} occurrence(s) at index positions: [${matchIndices.join(', ')}]. Total hash checks: ${hashChecks}, spurious hits: ${spuriousHits}, verified comparisons: ${comparisons}.`,
    codeLine: 15,
    state: {
      text,
      pattern,
      phase: 'search',
      textIndex: Math.max(n - 1, 0),
      patternIndex: 0,
      shift: Math.max(n - m, 0),
      matchIndices: [...matchIndices],
      verifiedIndices: [],
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
