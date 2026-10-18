import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  computeLcsEngine,
  validateLcsInput,
} from '../algorithms/lcsEngine';
import { lcsSteps } from '../algorithms/lcs';
import { LCSVisualizer } from '../components/visualizers/LCSVisualizer';
import { LcsMatrixView } from '../components/visualizers/LcsMatrixView';
import { LcsAlignmentView } from '../components/visualizers/LcsAlignmentView';

describe('LCS Shared Engine & Full Execution Steps', () => {
  it('correctly solves textbook problem X = ABCBDAB, Y = BDCABA with length 4', () => {
    const X = 'ABCBDAB';
    const Y = 'BDCABA';
    const engine = computeLcsEngine(X, Y);

    expect(engine.lcsLength).toBe(4);
    expect(engine.lcsString.length).toBe(4);

    // Verify subsequence property for both strings
    const isSubsequence = (sub: string, full: string) => {
      let idx = 0;
      for (const ch of full) {
        if (ch === sub[idx]) idx++;
      }
      return idx === sub.length;
    };

    expect(isSubsequence(engine.lcsString, X)).toBe(true);
    expect(isSubsequence(engine.lcsString, Y)).toBe(true);

    // Check matched pairs consistency
    expect(engine.matchedPairs.length).toBe(4);
    for (const [xi, yj] of engine.matchedPairs) {
      expect(X[xi - 1]).toBe(Y[yj - 1]);
    }

    // Trace moves to verify that matched pairs in moves match engine.matchedPairs
    const matchMoves = engine.moves.filter((m) => m.type === 'match');
    expect(matchMoves.length).toBe(4);
    const movePairs = matchMoves.map((m) => [m.i, m.j]);
    expect(movePairs.reverse()).toEqual(engine.matchedPairs);
  });

  it('generates full table initialization and cell-by-cell calculation steps', () => {
    const X = 'ABCBDAB';
    const Y = 'BDCAB';
    const m = X.length;
    const n = Y.length;
    const engine = computeLcsEngine(X, Y);

    // Step 0 must be Table Initialization
    const initStep = engine.steps[0];
    expect(initStep.state.phase).toBe('init');
    expect(initStep.title).toBe('Initialize LCS DP Table');
    expect(initStep.codeLine).toBe(2);

    // Fill steps: exactly m * n steps
    const fillSteps = engine.steps.filter((s) => s.state.phase === 'fill');
    expect(fillSteps.length).toBe(m * n);

    for (const s of fillSteps) {
      const { currentRow: i, currentCol: j } = s.state;
      expect(i).toBeGreaterThanOrEqual(1);
      expect(j).toBeGreaterThanOrEqual(1);
      expect(s.state.comparison).toBeDefined();

      if (X[i - 1] === Y[j - 1]) {
        expect(s.state.comparison).toBe('match');
        expect(s.codeLine).toEqual([5, 6]);
      } else {
        expect(s.state.comparison).toBe('mismatch');
        expect(s.codeLine).toEqual([7, 8]);
      }
    }

    // Table complete step
    const tableCompleteStep = engine.steps.find((s) => s.state.phase === 'table_complete');
    expect(tableCompleteStep).toBeDefined();
    expect(tableCompleteStep?.codeLine).toBe(9);

    // Traceback steps
    const tbSteps = engine.steps.filter((s) => s.state.phase === 'traceback');
    expect(tbSteps.length).toBeGreaterThanOrEqual(4);

    // Final step
    const finalStep = engine.steps[engine.steps.length - 1];
    expect(finalStep.state.phase).toBe('final');
    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.codeLine).toBe(14);
    expect(finalStep.result.lcsLength).toBe(4);
  });

  it('lcsSteps generator yields all unified steps in sync with engine', () => {
    const str1 = 'ABCBDAB';
    const str2 = 'BDCAB';
    const genSteps = Array.from(lcsSteps({ str1, str2 }));
    const engine = computeLcsEngine(str1, str2);

    expect(genSteps.length).toBe(engine.steps.length);
    expect(genSteps[0].title).toBe('Initialize LCS DP Table');
    expect(genSteps[genSteps.length - 1].result.lcsLength).toBe(4);
  });

  describe('Edge cases', () => {
    it('handles identical strings', () => {
      const X = 'AAAA';
      const Y = 'AAAA';
      const engine = computeLcsEngine(X, Y);

      expect(engine.lcsLength).toBe(4);
      expect(engine.lcsString).toBe('AAAA');
      expect(engine.matchedPairs.length).toBe(4);
      expect(engine.matchedPairs).toEqual([
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ]);
    });

    it('handles completely disjoint strings', () => {
      const X = 'ABC';
      const Y = 'XYZ';
      const engine = computeLcsEngine(X, Y);

      expect(engine.lcsLength).toBe(0);
      expect(engine.lcsString).toBe('');
      expect(engine.matchedPairs.length).toBe(0);
      expect(engine.moves.every((m) => m.type === 'up' || m.type === 'left')).toBe(true);
    });

    it('handles one string of length 1 (matching)', () => {
      const X = 'A';
      const Y = 'BAC';
      const engine = computeLcsEngine(X, Y);

      expect(engine.lcsLength).toBe(1);
      expect(engine.lcsString).toBe('A');
      expect(engine.matchedPairs).toEqual([[1, 2]]);
    });

    it('handles one string of length 1 (non-matching)', () => {
      const X = 'Z';
      const Y = 'ABC';
      const engine = computeLcsEngine(X, Y);

      expect(engine.lcsLength).toBe(0);
      expect(engine.lcsString).toBe('');
      expect(engine.matchedPairs.length).toBe(0);
    });
  });

  describe('Input validation', () => {
    it('accepts valid alphanumeric strings up to 9 chars', () => {
      const res = validateLcsInput('abc1', 'xyz9');
      expect(res.isValid).toBe(true);
      expect(res.error).toBeNull();
      expect(res.X).toBe('ABC1');
      expect(res.Y).toBe('XYZ9');
    });

    it('rejects empty strings', () => {
      const res = validateLcsInput('', 'ABC');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Both String X and String Y are required');
    });

    it('rejects non-alphanumeric characters', () => {
      const res = validateLcsInput('A-B', 'CD');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Only alphanumeric characters');
    });

    it('rejects strings longer than 9 characters', () => {
      const res = validateLcsInput('ABCDEFGHIJ', 'XYZ');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Maximum length is 9 characters');
    });
  });
});

describe('LCS Views Rendering & Accessibility Across All Phases', () => {
  it('renders Matrix View at table initialization, fill phase, and traceback', () => {
    const engine = computeLcsEngine('ABCBDAB', 'BDCAB');

    // 1. Init phase
    const initHtml = renderToStaticMarkup(
      <LcsMatrixView engine={engine} currentStep={0} />
    );
    expect(initHtml).toContain('Phase: init');
    expect(initHtml).toContain('Matrix Pointer:');
    expect(initHtml).toContain('—');

    // 2. Fill phase
    const fillHtml = renderToStaticMarkup(
      <LcsMatrixView engine={engine} currentStep={5} />
    );
    expect(fillHtml).toContain('Phase: fill');
    expect(fillHtml).toContain('Matrix Pointer:');

    // 3. Traceback phase
    const tbIdx = engine.steps.findIndex((s) => s.state.phase === 'traceback');
    const tbHtml = renderToStaticMarkup(
      <LcsMatrixView engine={engine} currentStep={tbIdx} />
    );
    expect(tbHtml).toContain('Phase: traceback');
    expect(tbHtml).toContain('aria-label="Matrix Legend"');
  });

  it('renders Alignment View at table initialization, fill phase, and traceback', () => {
    const engine = computeLcsEngine('ABCBDAB', 'BDCAB');

    // 1. Init phase
    const initHtml = renderToStaticMarkup(
      <LcsAlignmentView engine={engine} currentStep={0} />
    );
    expect(initHtml).toContain('1. Table Initialization');
    expect(initHtml).toContain('aria-live="polite"');

    // 2. Fill phase
    const fillHtml = renderToStaticMarkup(
      <LcsAlignmentView engine={engine} currentStep={3} />
    );
    expect(fillHtml).toContain('2. Table Calculation');
    expect(fillHtml).toContain('Comparing now');

    // 3. Traceback phase
    const tbIdx = engine.steps.findIndex((s) => s.state.phase === 'traceback');
    const tbHtml = renderToStaticMarkup(
      <LcsAlignmentView engine={engine} currentStep={tbIdx} />
    );
    expect(tbHtml).toContain('LCS so far:');
    expect(tbHtml).toContain('aria-label="Alignment Box States Legend"');
  });

  it('renders LCSVisualizer with segmented control, playback controls, and inputs', () => {
    const html = renderToStaticMarkup(
      <LCSVisualizer initialX="ABCBDAB" initialY="BDCABA" defaultViewMode="alignment" />
    );

    // Segmented control
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Matrix DP View (Key: M)"');
    expect(html).toContain('aria-label="Alignment View (Key: M)"');

    // Playback toolbar
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Step scrubber slider"');
    expect(html).toContain('aria-label="LCS speed slider"');

    // Inputs
    expect(html).toContain('id="lcs-input-x"');
    expect(html).toContain('id="lcs-input-y"');

    // Alignment view is rendered
    expect(html).toContain('String X (Length 7)');
    expect(html).toContain('String Y (Length 6)');
  });

  it('renders in matrix mode when defaultViewMode is matrix', () => {
    const html = renderToStaticMarkup(
      <LCSVisualizer initialX="ABCBDAB" initialY="BDCABA" defaultViewMode="matrix" />
    );

    expect(html).toContain('role="grid"');
    expect(html).toContain('Matrix Pointer:');
  });
});
