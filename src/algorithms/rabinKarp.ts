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
    /** The update in four stages with this step's real numbers; each value feeds the next. */
    stages: { label: string; expr: string; value: number }[];
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
    description: `The text has ${n} letters and the pattern has ${m}. Idea: turn the pattern and every ${m}-letter window of the text into a number (a hash, like a fingerprint). If the numbers differ, the window cannot match, so letters are only checked where the numbers are equal. The hash reads the letters like the digits of a base-${D} number and keeps only the remainder after dividing by ${Q}, so it stays small (h = ${h} is the weight of the leftmost letter).`,
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
      description: `The pattern's hash is ${p} and the first window's hash is ${t}. Each is worked out once, letter by letter, the way you would read the digits of a number.`,
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
          ? `Hashes match (${t} = ${p}), so shift ${s} is a candidate. Equal hashes do not prove equal strings: the hash is taken mod ${Q}, so it has only ${Q} possible values and different windows can share one. Check the characters one by one.`
          : `Hashes differ (${t} ≠ ${p}), so this window cannot be the pattern. No letters need checking: slide on.`,
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
            description: `The hashes matched (${t} = ${p}), but the letters differ at position ${j} ('${text[s + j]}' ≠ '${pattern[j]}'). This is a spurious hit (a hash collision): two different windows happened to get the same number. That is why letters are always checked.`,
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

        const withoutOut = prevT - removedAscii * h;
        const shifted = D * withoutOut;
        const withIn = shifted + addedAscii;
        const stages = [
          { label: `Remove outgoing '${removed}'`, expr: `${prevT} − ${removedAscii} × ${h}`, value: withoutOut },
          { label: 'Shift one place (× d)', expr: `${withoutOut} × ${D}`, value: shifted },
          { label: `Add incoming '${added}'`, expr: `${shifted} + ${addedAscii}`, value: withIn },
          { label: 'Reduce mod q', expr: `${withIn} mod ${Q}`, value: t },
        ];

        const formula = `(${D} × (${prevT} − '${removed}'(${removedAscii}) × ${h}) + '${added}'(${addedAscii})) mod ${Q} = ${t}`;

        yield {
          stepIndex: stepIndex++,
          title: `Roll Hash to Shift ${s + 1}`,
          description: `Slide the window one place right: '${removed}' leaves on the left and '${added}' enters on the right. The new hash comes straight from the old one (take out the leaving letter, shift, add the new letter) without rereading the other ${m - 1} letters: ${prevT} → ${t}.`,
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
              stages,
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
    description: `Search complete. Found ${matchIndices.length} occurrence(s) at index positions: [${matchIndices.join(', ')}]. ${hashChecks} hash comparisons were made, and letters were only checked where the hashes matched (${comparisons} letter checks, ${spuriousHits} spurious hit${spuriousHits === 1 ? '' : 's'}).`,
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
