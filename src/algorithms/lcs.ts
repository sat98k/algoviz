import { AlgorithmStep } from '../types/algorithm';
import { computeLcsEngine, UnifiedLcsStepState } from './lcsEngine';

export type LCSState = UnifiedLcsStepState;

/**
 * Step generator for LCS.
 * Yields:
 * 1. Base table initialization (row 0 and col 0 = 0)
 * 2. Cell-by-cell table calculation (fill phase with match/mismatch rules)
 * 3. Table complete
 * 4. Step-by-step traceback reconstruction
 * 5. Final LCS result
 */
export function* lcsSteps(inputs: { str1: string; str2: string }): Generator<AlgorithmStep<LCSState>> {
  const result = computeLcsEngine(inputs.str1, inputs.str2);
  for (const s of result.steps) {
    yield s as unknown as AlgorithmStep<LCSState>;
  }
}
