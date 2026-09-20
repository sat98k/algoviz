import { AlgorithmStep } from '../types/algorithm';

export interface HiringProblemState {
  mode: 'hiring';
  array: number[]; // Candidate scores
  currentIndex: number;
  currentScore?: number;
  currentBestScore?: number;
  currentBestIndex?: number;
  hiredIndices: number[];
  currentDecision?: 'hire' | 'skip';
  interviewCost: number;
  hiringCost: number;
  totalCost: number;
  phase: 'init' | 'interview' | 'decision' | 'complete';
}

export function* hiringProblemSteps(inputs: {
  candidates?: number[];
  interviewCost?: number;
  hiringCost?: number;
  shuffle?: boolean;
}): Generator<AlgorithmStep<HiringProblemState>> {
  const defaultCandidates = [4, 7, 2, 9, 8, 10, 5, 12];
  let scores = [...(inputs.candidates && inputs.candidates.length > 0 ? inputs.candidates : defaultCandidates)];

  if (inputs.shuffle) {
    // Fisher-Yates shuffle if randomized order requested
    for (let i = scores.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scores[i], scores[j]] = [scores[j], scores[i]];
    }
  }

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
    description: `Loaded ${scores.length} candidates. Interview cost c_i = ${ci}, Hiring cost c_h = ${ch}. Objective: Hire sequentially only when a candidate strictly surpasses all previous candidates.`,
    codeLine: 1,
    state: {
      mode: 'hiring',
      array: [...scores],
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

  for (let i = 0; i < scores.length; i++) {
    const candidateScore = scores[i];
    totalCost += ci; // Incur interview cost

    yield {
      stepIndex: stepIndex++,
      title: `Interview Candidate ${i} (Score: ${candidateScore})`,
      description: `Interviewing candidate ${i} with score ${candidateScore}. Interview cost incurred (+${ci}, Total Cost: ${totalCost}). Comparing against current best (${currentBestIndex >= 0 ? `Candidate ${currentBestIndex} with ${currentBestScore}` : 'None'}).`,
      codeLine: [2, 3],
      state: {
        mode: 'hiring',
        array: [...scores],
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
        title: `HIRE: Candidate ${i} Sets New High Score (${candidateScore})`,
        description: `Candidate ${i} (score ${candidateScore}) is strictly better than all previous candidates. Hired! Hiring cost incurred (+${ch}, Total Cost: ${totalCost}).`,
        codeLine: [4, 5, 6],
        state: {
          mode: 'hiring',
          array: [...scores],
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
        title: `SKIP: Candidate ${i} (${candidateScore}) ≤ Best (${currentBestScore})`,
        description: `Candidate ${i} (score ${candidateScore}) did not exceed the current best score of ${currentBestScore}. Candidate is skipped without hiring.`,
        codeLine: 7,
        state: {
          mode: 'hiring',
          array: [...scores],
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
    description: `All ${scores.length} candidates interviewed. Total hires: ${hiredIndices.length} (Candidates [${hiredIndices.join(', ')}]). Total expense: $${totalCost} (Interviews: $${scores.length * ci}, Hires: $${hiredIndices.length * ch}). Theoretical expected hires E[X] = ln(${scores.length}) + O(1) ≈ ${harmonicSum.toFixed(2)}.`,
    codeLine: 8,
    state: {
      mode: 'hiring',
      array: [...scores],
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
