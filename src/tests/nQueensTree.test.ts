import { describe, it, expect } from 'vitest';
import { nQueensSteps } from '../algorithms/nQueens';
import { buildNQueensStateSpaceTree } from '../algorithms/nQueensTree';

describe('N-Queens State Space Tree Builder', () => {
  it('generates state space tree for N=4 matching steps', () => {
    const steps = [...nQueensSteps({ n: 4 })];
    const tree = buildNQueensStateSpaceTree(4, false);

    expect(tree.rootId).toBe('root');
    expect(tree.solutionNodeIds.length).toBeGreaterThan(0);
    expect(tree.conflictNodeIds.length).toBeGreaterThan(0);

    // Each step up to steps.length - 1 should have a corresponding node in the tree
    for (let i = 0; i < steps.length; i++) {
      const nodeId = tree.stepToNodeId[i];
      expect(nodeId).toBeDefined();
      expect(tree.nodes[nodeId]).toBeDefined();
    }
  });

  it('marks solutions in tree for N=4 with findAll=true', () => {
    const tree = buildNQueensStateSpaceTree(4, true);
    expect(tree.solutionNodeIds.length).toBe(2);
    for (const solId of tree.solutionNodeIds) {
      expect(tree.nodes[solId].status).toBe('solution');
    }
  });

  it('all conflict nodes have attack details recorded', () => {
    const tree = buildNQueensStateSpaceTree(4, false);
    for (const confId of tree.conflictNodeIds) {
      const node = tree.nodes[confId];
      expect(node.status).toBe('conflict');
      expect(node.attack).toBeDefined();
      expect(node.attack?.attacker).toBeDefined();
    }
  });
});
