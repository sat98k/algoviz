import { describe, it, expect } from 'vitest';
import { hiringProblemSteps } from '../algorithms/hiringProblem';

describe('The Hiring Problem (M6 Randomized Algorithms)', () => {
  it('correctly computes hire events and cost on deterministic textbook sequence', () => {
    const candidates = [4, 7, 2, 9, 8, 10, 5, 12];
    const ci = 1;
    const ch = 5;

    const steps = Array.from(hiringProblemSteps({ candidates, interviewCost: ci, hiringCost: ch, shuffle: false }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.totalHires).toBe(5);
    expect(finalStep.result.hiredCandidates.map((c: any) => c.index)).toEqual([0, 1, 3, 5, 7]);
    expect(finalStep.result.bestCandidate).toEqual({ index: 7, score: 12 });
    expect(finalStep.result.interviewExpense).toBe(8 * 1);
    expect(finalStep.result.hiringExpense).toBe(5 * 5);
    expect(finalStep.result.totalCost).toBe(33);
  });

  it('hires only the first candidate when candidates arrive in strictly descending order', () => {
    const candidates = [100, 90, 80, 70, 60];
    const steps = Array.from(hiringProblemSteps({ candidates, interviewCost: 2, hiringCost: 10, shuffle: false }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.totalHires).toBe(1);
    expect(finalStep.result.hiredCandidates.map((c: any) => c.index)).toEqual([0]);
    expect(finalStep.result.totalCost).toBe(5 * 2 + 1 * 10); // 10 interview + 10 hire = 20
  });

  it('hires every candidate when candidates arrive in strictly ascending order (worst case)', () => {
    const candidates = [10, 20, 30, 40, 50];
    const steps = Array.from(hiringProblemSteps({ candidates, interviewCost: 1, hiringCost: 5, shuffle: false }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.result.totalHires).toBe(5);
    expect(finalStep.result.hiredCandidates.map((c: any) => c.index)).toEqual([0, 1, 2, 3, 4]);
    expect(finalStep.result.totalCost).toBe(5 * 1 + 5 * 5); // 5 + 25 = 30
  });
});
