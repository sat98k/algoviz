import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { nQueensSteps } from '../algorithms/nQueens';
import { NQueensVisualizer } from '../components/visualizers/NQueensVisualizer';
import { buildNQueensStateSpaceTree } from '../algorithms/nQueensTree';

describe('NQueensVisualizer - Chessboard & State Space Tree Autofocus', () => {
  const steps = [...nQueensSteps({ n: 4 })] as any[];

  it('renders main chessboard on top and state space tree with autofocus down below', () => {
    const s = steps[1]; // First placement at (0, 0)
    const html = renderToStaticMarkup(<NQueensVisualizer step={s} inputs={{ n: 4 }} />);

    // Chessboard on top
    expect(html).toContain('Board <strong class="font-mono">4 × 4</strong>');
    expect(html).toContain('Solutions found');
    expect(html).toContain('tree-node-0-0');

    // State space tree down below
    expect(html).toContain('State Space Tree Exploration');
    expect(html).toContain('Autofocus: ON');
    expect(html).toContain('Target Active 🎯');
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
    expect(html).toContain('Solutions Only');
    expect(html).toContain('Pruned Non-Solutions');
    // Check color tokens for solutions (#10b981 / emerald) and conflicts (#f43f5e / rose)
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
