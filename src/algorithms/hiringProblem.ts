import { AlgorithmStep } from '../types/algorithm';

export interface HiringProblemState {
  mode: 'hiring';
  array: number[]; // Candidate scores, in the order they will be interviewed
  /** Who stands at each place in line: `arrivalOrder[p]` is the place that candidate had when they arrived. */
  arrivalOrder: number[];
  currentIndex: number;
  currentScore?: number;
  currentBestScore?: number;
  currentBestIndex?: number;
  hiredIndices: number[];
  currentDecision?: 'hire' | 'skip';
  interviewCost: number;
  hiringCost: number;
  totalCost: number;
  phase: 'init' | 'shuffle' | 'interview' | 'decision' | 'complete';
}

export function* hiringProblemSteps(inputs: {
  candidates?: number[];
  interviewCost?: number;
  hiringCost?: number;
  /** 'shuffle' (the default) randomizes the line first; 'given' keeps the order as typed. */
  order?: 'shuffle' | 'given';
  shuffle?: boolean;
}): Generator<AlgorithmStep<HiringProblemState>> {
  const defaultCandidates = [4, 7, 2, 9, 8, 10, 5, 12];
  const given = [...(inputs.candidates && inputs.candidates.length > 0 ? inputs.candidates : defaultCandidates)];
  const shuffle = inputs.shuffle ?? inputs.order !== 'given';

  // Fisher-Yates: shuffle who stands where. order[p] is the arrival place of whoever now stands at place p.
  const order = given.map((_, k) => k);
  if (shuffle) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  const scores = order.map((k) => given[k]);

  const ci = inputs.interviewCost ?? 1;
  const ch = inputs.hiringCost ?? 5;

  let stepIndex = 0;
  let comparisons = 0;
  let totalCost = 0;
  const hiredIndices: number[] = [];
  let currentBestScore = -Infinity;
  let currentBestIndex = -1;

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize The Hiring Problem',
    description: `${scores.length} candidates arrive and wait in line. Each interview costs ${ci} and each hire costs ${ch}. Rule: hire a candidate right away if they are better than everyone seen so far.`,
    codeLine: 1,
    state: {
      mode: 'hiring',
      array: [...given],
      arrivalOrder: given.map((_, k) => k),
      currentIndex: -1,
      hiredIndices: [],
      interviewCost: ci,
      hiringCost: ch,
      totalCost: 0,
      phase: 'init',
    },
    highlights: {},
    metrics: { comparisons, custom: { hires: 0, totalCost: 0 } },
  };

  if (shuffle) {
    yield {
      stepIndex: stepIndex++,
      title: 'Shuffle the Line',
      description: `Before any interview, shuffle the line at random. Now no particular order (such as weakest to strongest, which would mean hiring every single person) can be forced on us. Candidates are numbered by their new places: ${scores.join(', ')}.`,
      codeLine: 2,
      state: {
        mode: 'hiring',
        array: [...scores],
        arrivalOrder: [...order],
        currentIndex: -1,
        hiredIndices: [],
        interviewCost: ci,
        hiringCost: ch,
        totalCost: 0,
        phase: 'shuffle',
      },
      highlights: {},
      metrics: { comparisons, custom: { hires: 0, totalCost: 0 } },
    };
  }

  for (let i = 0; i < scores.length; i++) {
    const candidateScore = scores[i];
    totalCost += ci; // Incur interview cost

    yield {
      stepIndex: stepIndex++,
      title: `Interview Candidate ${i + 1} (Score: ${candidateScore})`,
      description: `Interview candidate ${i + 1}: score ${candidateScore} (+${ci}, total cost so far ${totalCost}). ${currentBestIndex >= 0 ? `The best so far is candidate ${currentBestIndex + 1} with ${currentBestScore}.` : 'Nobody has been hired yet.'}`,
      codeLine: [4, 5],
      state: {
        mode: 'hiring',
        array: [...scores],
        arrivalOrder: [...order],
        currentIndex: i,
        currentScore: candidateScore,
        currentBestScore: currentBestIndex >= 0 ? currentBestScore : undefined,
        currentBestIndex: currentBestIndex >= 0 ? currentBestIndex : undefined,
        hiredIndices: [...hiredIndices],
        interviewCost: ci,
        hiringCost: ch,
        totalCost,
        phase: 'interview',
      },
      highlights: {
        activeIndices: [i],
        compareIndices: currentBestIndex >= 0 ? [i, currentBestIndex] : [i],
        pivotIndex: currentBestIndex >= 0 ? currentBestIndex : undefined,
      },
      metrics: { comparisons, custom: { hires: hiredIndices.length, totalCost } },
    };

    comparisons++;
    const isStrictlyBetter = candidateScore > currentBestScore;

    if (isStrictlyBetter) {
      currentBestScore = candidateScore;
      currentBestIndex = i;
      hiredIndices.push(i);
      totalCost += ch; // Incur hiring cost

      yield {
        stepIndex: stepIndex++,
        title: `HIRE: Candidate ${i + 1} Sets New High Score (${candidateScore})`,
        description: `Candidate ${i + 1} (score ${candidateScore}) is better than everyone so far, so hire them (+${ch}, total cost ${totalCost}).`,
        codeLine: [6, 7, 8],
        state: {
          mode: 'hiring',
          array: [...scores],
          arrivalOrder: [...order],
          currentIndex: i,
          currentScore: candidateScore,
          currentBestScore,
          currentBestIndex,
          hiredIndices: [...hiredIndices],
          currentDecision: 'hire',
          interviewCost: ci,
          hiringCost: ch,
          totalCost,
          phase: 'decision',
        },
        highlights: {
          activeIndices: [i],
          sortedIndices: [...hiredIndices],
          pivotIndex: currentBestIndex,
        },
        metrics: { comparisons, custom: { hires: hiredIndices.length, totalCost } },
      };
    } else {
      yield {
        stepIndex: stepIndex++,
        title: `SKIP: Candidate ${i + 1} (${candidateScore}) ≤ Best (${currentBestScore})`,
        description: `Candidate ${i + 1} (score ${candidateScore}) is not better than the best so far (${currentBestScore}), so they are not hired. Only the interview was paid.`,
        codeLine: [6, 9],
        state: {
          mode: 'hiring',
          array: [...scores],
          arrivalOrder: [...order],
          currentIndex: i,
          currentScore: candidateScore,
          currentBestScore,
          currentBestIndex,
          hiredIndices: [...hiredIndices],
          currentDecision: 'skip',
          interviewCost: ci,
          hiringCost: ch,
          totalCost,
          phase: 'decision',
        },
        highlights: {
          compareIndices: [i, currentBestIndex],
          pivotIndex: currentBestIndex,
          sortedIndices: [...hiredIndices],
        },
        metrics: { comparisons, custom: { hires: hiredIndices.length, totalCost } },
      };
    }
  }

  // Harmonic number H_n calculation for theoretical expectation
  let harmonicSum = 0;
  for (let k = 1; k <= scores.length; k++) harmonicSum += 1 / k;

  yield {
    stepIndex: stepIndex++,
    title: 'The Hiring Problem Complete',
    description: `All ${scores.length} candidates interviewed. Total hires: ${hiredIndices.length} (Candidates [${hiredIndices.map((idx) => idx + 1).join(', ')}]). Total expense: $${totalCost} (Interviews: $${scores.length * ci}, Hires: $${hiredIndices.length * ch}). If candidates arrived in random order, the expected number of hires would be the harmonic number H_${scores.length} = 1 + 1/2 + … + 1/${scores.length} ≈ ${harmonicSum.toFixed(2)} (H_n ≈ ln n + 0.577; here ln ${scores.length} ≈ ${Math.log(scores.length).toFixed(2)}).`,
    codeLine: 10,
    state: {
      mode: 'hiring',
      array: [...scores],
      arrivalOrder: [...order],
      currentIndex: scores.length,
      currentBestScore,
      currentBestIndex,
      hiredIndices: [...hiredIndices],
      interviewCost: ci,
      hiringCost: ch,
      totalCost,
      phase: 'complete',
    },
    highlights: {
      sortedIndices: [...hiredIndices],
      pivotIndex: currentBestIndex,
    },
    metrics: { comparisons, custom: { hires: hiredIndices.length, totalCost } },
    isFinal: true,
    result: {
      totalCandidates: scores.length,
      totalHires: hiredIndices.length,
      hiredCandidates: hiredIndices.map((idx) => ({ index: idx, score: scores[idx] })),
      bestCandidate: { index: currentBestIndex, score: currentBestScore },
      interviewExpense: scores.length * ci,
      hiringExpense: hiredIndices.length * ch,
      totalCost,
      theoreticalExpectedHires: parseFloat(harmonicSum.toFixed(2)),
    },
  };
}
