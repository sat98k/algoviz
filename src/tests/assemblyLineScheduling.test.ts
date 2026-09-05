import { describe, it, expect } from 'vitest';
import { assemblyLineSchedulingSteps } from '../algorithms/assemblyLineScheduling';

describe('Assembly Line Scheduling (M2 Dynamic Programming)', () => {
  it('correctly solves classic CLRS 6-station assembly line problem -> min total time 38 (arrival 35 + exit 3)', () => {
    const a1 = [7, 9, 3, 4, 8, 4];
    const a2 = [8, 5, 6, 4, 5, 7];
    const t1 = [2, 3, 1, 3, 4];
    const t2 = [2, 1, 2, 2, 1];
    const e1 = 2;
    const e2 = 4;
    const x1 = 3;
    const x2 = 2;

    const steps = Array.from(
      assemblyLineSchedulingSteps({ a1, a2, t1, t2, e1, e2, x1, x2 })
    );
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.minTotalTime).toBe(38);
    expect(finalStep.result.finalF1).toBe(35);
    expect(finalStep.result.winningExitLine).toBe(1);
    expect(finalStep.result.stationCount).toBe(6);

    // Verify optimal path stations: L1:S1 -> L2:S2 -> L1:S3 -> L2:S4 -> L2:S5 -> L1:S6
    const path = finalStep.result.optimalPath;
    expect(path).toHaveLength(6);
    expect(path[0]).toEqual({ station: 1, line: 1 });
    expect(path[1]).toEqual({ station: 2, line: 2 });
    expect(path[2]).toEqual({ station: 3, line: 1 });
    expect(path[3]).toEqual({ station: 4, line: 2 });
    expect(path[4]).toEqual({ station: 5, line: 2 });
    expect(path[5]).toEqual({ station: 6, line: 1 });
  });

  it('correctly solves 4-station assembly line with zero transfer penalties', () => {
    const a1 = [4, 5, 3, 2];
    const a2 = [2, 10, 1, 4];
    const t1 = [0, 0, 0];
    const t2 = [0, 0, 0];
    const e1 = 1;
    const e2 = 1;
    const x1 = 1;
    const x2 = 1;

    const steps = Array.from(
      assemblyLineSchedulingSteps({ a1, a2, t1, t2, e1, e2, x1, x2 })
    );
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.minTotalTime).toBe(12);
  });
});
