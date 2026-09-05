import { describe, it, expect } from 'vitest';
import { jobSelectionBBSteps } from '../algorithms/jobSelectionBB';

describe('Job Selection Problem (Branch & Bound)', () => {
  it('correctly solves the classic 5-job textbook problem (profit = 142)', () => {
    // Jobs:
    // J1: d=2, p=100
    // J2: d=1, p=19
    // J3: d=2, p=27
    // J4: d=1, p=25
    // J5: d=3, p=15
    const deadlines = [2, 1, 2, 1, 3];
    const profits = [100, 19, 27, 25, 15];

    const gen = jobSelectionBBSteps({ deadlines, profits });
    const steps = Array.from(gen);

    expect(steps.length).toBeGreaterThan(1);
    const finalStep = steps[steps.length - 1];
    expect(finalStep.isFinal).toBe(true);

    const result = finalStep.result;
    expect(result.maxProfit).toBe(142);

    // Selected jobs should be [1, 3, 5] in some order
    const selectedSorted = [...result.selectedJobs].sort((a, b) => a - b);
    expect(selectedSorted).toEqual([1, 3, 5]);

    // Check schedule validity
    const schedule = result.schedule as (number | null)[];
    expect(schedule.length).toBe(3); // max deadline is 3
    for (let slot = 0; slot < schedule.length; slot++) {
      const jobId = schedule[slot];
      if (jobId !== null) {
        const deadline = deadlines[jobId - 1];
        // Slot is 0-indexed, so time is slot + 1 <= deadline
        expect(slot + 1).toBeLessThanOrEqual(deadline);
      }
    }

    // Explored and pruned nodes must be tracked
    expect(result.nodesExplored).toBeGreaterThan(0);
    expect(result.prunedNodes).toBeGreaterThan(0);
  });

  it('correctly solves the Horowitz-Sahni 4-job benchmark (profit = 127)', () => {
    // Jobs:
    // J1: d=2, p=100
    // J2: d=1, p=10
    // J3: d=2, p=15
    // J4: d=1, p=27
    const deadlines = [2, 1, 2, 1];
    const profits = [100, 10, 15, 27];

    const steps = Array.from(jobSelectionBBSteps({ deadlines, profits }));
    const finalStep = steps[steps.length - 1];
    expect(finalStep.result.maxProfit).toBe(127);

    // Optimal selection is J1 and J4
    const selected = [...finalStep.result.selectedJobs].sort((a, b) => a - b);
    expect(selected).toEqual([1, 4]);
  });

  it('handles tight deadlines where all deadlines = 1 (single slot)', () => {
    const deadlines = [1, 1, 1, 1];
    const profits = [50, 40, 30, 20];

    const steps = Array.from(jobSelectionBBSteps({ deadlines, profits }));
    const finalStep = steps[steps.length - 1];
    expect(finalStep.result.maxProfit).toBe(50);
    expect(finalStep.result.selectedJobs).toEqual([1]);
  });

  it('handles sequential deadlines where all jobs can be scheduled', () => {
    const deadlines = [1, 2, 3, 4];
    const profits = [20, 35, 45, 60];

    const steps = Array.from(jobSelectionBBSteps({ deadlines, profits }));
    const finalStep = steps[steps.length - 1];
    expect(finalStep.result.maxProfit).toBe(160);
    expect(finalStep.result.selectedJobs.length).toBe(4);
  });

  it('generates branch-and-bound prune reasons correctly', () => {
    const deadlines = [2, 1, 2, 1, 3];
    const profits = [100, 19, 27, 25, 15];

    const steps = Array.from(jobSelectionBBSteps({ deadlines, profits }));
    const prunedSteps = steps.filter((s) => s.title.startsWith('Prune'));
    expect(prunedSteps.length).toBeGreaterThan(0);

    // Should include both infeasibility prunes and bound prunes
    const hasInfeasiblePrune = prunedSteps.some((s) => s.description.includes('infeasible'));
    const hasBoundPrune = prunedSteps.some((s) => s.description.includes('bound'));
    expect(hasInfeasiblePrune).toBe(true);
    expect(hasBoundPrune).toBe(true);
  });
});
