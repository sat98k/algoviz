import { describe, it, expect } from 'vitest';
import { computeTreeLayout, TreeNodeInput } from '../utils/treeLayout';
import { getNodeTheme, NODE_THEMES } from '../utils/treeTheme';

describe('Tree Layout & Contrast Theme System', () => {
  it('guarantees zero horizontal overlap between sibling subtrees', () => {
    // Construct a deep, asymmetric binary tree with 4 levels
    const tree: TreeNodeInput = {
      id: 'root',
      label: 'Root',
      children: [
        {
          id: 'left',
          label: 'L1',
          children: [
            {
              id: 'left-left',
              label: 'LL',
              children: [
                { id: 'left-left-left', label: 'LLL' },
                { id: 'left-left-right', label: 'LLR' },
              ],
            },
            {
              id: 'left-right',
              label: 'LR',
              children: [
                { id: 'left-right-left', label: 'LRL' },
                { id: 'left-right-right', label: 'LRR' },
              ],
            },
          ],
        },
        {
          id: 'right',
          label: 'R1',
          children: [
            {
              id: 'right-left',
              label: 'RL',
              children: [
                { id: 'right-left-left', label: 'RLL' },
                { id: 'right-left-right', label: 'RLR' },
              ],
            },
            {
              id: 'right-right',
              label: 'RR',
              children: [
                { id: 'right-right-left', label: 'RRL' },
                { id: 'right-right-right', label: 'RRR' },
              ],
            },
          ],
        },
      ],
    };

    const nodeWidth = 84;
    const minSiblingGap = 24;
    const layout = computeTreeLayout([tree], { nodeWidth, minSiblingGap });

    expect(layout.nodes.length).toBe(15);

    // Check all nodes at the same depth for strict minimum separation
    const depthMap = new Map<number, typeof layout.nodes>();
    for (const node of layout.nodes) {
      if (!depthMap.has(node.depth)) depthMap.set(node.depth, []);
      depthMap.get(node.depth)!.push(node);
    }

    for (const [_depth, nodesAtDepth] of depthMap.entries()) {
      // Sort nodes by X ascending
      nodesAtDepth.sort((a, b) => a.x - b.x);
      for (let i = 0; i < nodesAtDepth.length - 1; i++) {
        const leftNode = nodesAtDepth[i];
        const rightNode = nodesAtDepth[i + 1];
        const distance = rightNode.x - leftNode.x;
        // Distance between centers must be at least nodeWidth + minSiblingGap
        expect(distance).toBeGreaterThanOrEqual(nodeWidth + minSiblingGap - 0.001);
      }
    }
  });

  it('centers each parent node directly over its children', () => {
    const tree: TreeNodeInput = {
      id: 'root',
      label: 'Root',
      children: [
        { id: 'child-1', label: 'C1' },
        { id: 'child-2', label: 'C2' },
      ],
    };

    const layout = computeTreeLayout([tree]);
    const root = layout.nodes.find((n) => n.id === 'root')!;
    const c1 = layout.nodes.find((n) => n.id === 'child-1')!;
    const c2 = layout.nodes.find((n) => n.id === 'child-2')!;

    expect(root.x).toBeCloseTo((c1.x + c2.x) / 2, 3);
  });

  it('correctly maps WCAG AA contrast-safe themes for all status states', () => {
    const statuses = ['active', 'best', 'solution', 'pruned', 'explored', 'normal'];

    for (const st of statuses) {
      const theme = getNodeTheme(st);
      expect(theme).toBeDefined();
      expect(theme.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.border).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.primaryText).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.subText).toMatch(/^#[0-9a-fA-F]{6}$/);
    }

    // Explicit contrast sanity checks
    // Active (amber bg) must have dark text
    expect(NODE_THEMES.active.primaryText).toBe('#0a0a0c');
    // Best (emerald bg) must have white text
    expect(NODE_THEMES.best.primaryText).toBe('#ffffff');
    // Pruned (maroon bg) must have white text
    expect(NODE_THEMES.pruned.primaryText).toBe('#ffffff');
    expect(NODE_THEMES.pruned.subText).toBe('#fecdd3');
  });
});
