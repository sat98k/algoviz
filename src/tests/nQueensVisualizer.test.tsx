import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { nQueensSteps } from '../algorithms/nQueens';
import { NQueensVisualizer } from '../components/visualizers/NQueensVisualizer';
import { buildNQueensStateSpaceTree } from '../algorithms/nQueensTree';

describe('NQueensVisualizer - State Space Tree & Zoom Exploration', () => {
  const steps = [...nQueensSteps({ n: 4 })] as any[];

  it('renders cinematic mode by default with both focused chessboard and state space tree', () => {
    const s = steps[1]; // First placement at (0, 0)
    const html = renderToStaticMarkup(<NQueensVisualizer step={s} inputs={{ n: 4 }} />);

    expect(html).toContain('Cinematic Tree &amp; Zoom');
    expect(html).toContain('State Space Tree');
    expect(html).toContain('Classic Board');
    expect(html).toContain('Camera Focus');
    expect(html).toContain('Zoom In (Solve)');
    expect(html).toContain('Zoom Out');
  });

  it('renders conflict steps with attacker ray, attempted square and pruning banner', () => {
    const conflictStep = steps.find((s) => s.state.action === 'conflict')!;
    const html = renderToStaticMarkup(<NQueensVisualizer step={conflictStep} inputs={{ n: 4 }} />);

    expect(html).toContain('CONFLICT');
    expect(html).toContain('Branch Pruned');
    expect(html).toContain('data-attempted');
    expect(html).toContain('data-attacker');
  });

  it('marks solutions in GREEN and non-solutions in RED on final step', () => {
    const finalStep = steps.at(-1)!;
    const html = renderToStaticMarkup(<NQueensVisualizer step={finalStep} inputs={{ n: 4 }} />);

    expect(html).toContain('Search Complete');
    expect(html).toContain('Solutions Found:');
    expect(html).toContain('Pruned Dead-Ends:');
    // Check color tokens for solutions (#10b981 or emerald) and conflicts (#f43f5e or rose)
    expect(html).toContain('#10b981'); // Green
    expect(html).toContain('#f43f5e'); // Red
  });

  it('shows branch diverge and continue status for safe placement', () => {
    const placeStep = steps.find((s) => s.state.action === 'place')!;
    const html = renderToStaticMarkup(<NQueensVisualizer step={placeStep} inputs={{ n: 4 }} />);

    expect(html).toContain('SAFE — Branch Continues');
    expect(html).toContain('Continue Deeper');
  });

  it('shows backtrack status when moving back up the tree', () => {
    const backtrackStep = steps.find((s) => s.state.action === 'backtrack')!;
    const html = renderToStaticMarkup(<NQueensVisualizer step={backtrackStep} inputs={{ n: 4 }} />);

    expect(html).toContain('Backtrack');
  });

  it('state space tree precomputation produces valid layout for N=4, 5, 6, 8', () => {
    for (const n of [4, 5, 6, 8]) {
      const tree = buildNQueensStateSpaceTree(n, false);
      expect(tree.totalNodes).toBeGreaterThan(0);
      expect(tree.maxDepth).toBeGreaterThan(0);
      expect(tree.nodes[tree.rootId].x).toBeDefined();
      expect(tree.nodes[tree.rootId].y).toBeDefined();
    }
  });
});
