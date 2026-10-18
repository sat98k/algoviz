import { NQueensAttack, attackBetween } from './nQueens';

export interface NQueensTreeNode {
  id: string; // e.g. "root", "0:0", "0:0/1:2"
  parentId: string | null;
  depth: number; // 0 for root, 1 for row 0, 2 for row 1, etc.
  row: number; // 0-indexed row (0 to n-1), -1 for root
  col: number; // 0-indexed col (0 to n-1), -1 for root
  board: number[]; // snapshot of board at this node, length n (-1 for unplaced)
  label: string; // e.g. "Root", "Q1 → Col 2"
  colLabel: string; // e.g. "Col 2"
  status: 'root' | 'safe' | 'conflict' | 'solution';
  attack?: NQueensAttack;
  solutionIndex?: number;
  children: string[];
  firstStepIndex: number; // Step index where this node was first visited
  lastStepIndex: number; // Step index when resolved or backtracked
  solutionStepIndex?: number;
  backtrackStepIndex?: number;
  // Layout coordinates for SVG rendering
  x: number;
  y: number;
}

export interface NQueensTreeResult {
  nodes: Record<string, NQueensTreeNode>;
  rootId: string;
  totalNodes: number;
  maxDepth: number;
  solutionNodeIds: string[];
  conflictNodeIds: string[];
  // Mapping from stepIndex to active nodeId
  stepToNodeId: Record<number, string>;
  // Mapping from stepIndex to active path of nodeIds
  stepToActivePath: Record<number, string[]>;
}

/**
 * Builds the complete state space tree explored by the N-Queens backtracking search.
 * This runs in <1ms for N up to 8 and matches the exact traversal sequence of nQueensSteps.
 */
export function buildNQueensStateSpaceTree(n: number, findAll = false): NQueensTreeResult {
  const clampedN = Math.min(10, Math.max(1, n || 4));
  const nodes: Record<string, NQueensTreeNode> = {};
  const solutionNodeIds: string[] = [];
  const conflictNodeIds: string[] = [];
  const stepToNodeId: Record<number, string> = {};
  const stepToActivePath: Record<number, string[]> = {};

  let currentStepIndex = 0;
  const board: number[] = Array(clampedN).fill(-1);
  const solutions: number[][] = [];

  // Root node
  const rootId = 'root';
  nodes[rootId] = {
    id: rootId,
    parentId: null,
    depth: 0,
    row: -1,
    col: -1,
    board: [...board],
    label: 'Root (Empty Board)',
    colLabel: 'Start',
    status: 'root',
    children: [],
    firstStepIndex: 0,
    lastStepIndex: 0,
    x: 0,
    y: 0,
  };

  stepToNodeId[0] = rootId;
  stepToActivePath[0] = [rootId];
  currentStepIndex++; // Step 0 was init

  function isSafe(row: number, col: number): { safe: boolean; conflictingRow?: number } {
    for (let r = 0; r < row; r++) {
      const c = board[r];
      if (c === col || Math.abs(c - col) === Math.abs(r - row)) {
        return { safe: false, conflictingRow: r };
      }
    }
    return { safe: true };
  }

  function getPathId(row: number, col: number, parentId: string): string {
    return parentId === 'root' ? `${row}:${col}` : `${parentId}/${row}:${col}`;
  }

  function getActivePath(nodeId: string): string[] {
    const path: string[] = [];
    let cur: string | null = nodeId;
    while (cur) {
      path.unshift(cur);
      cur = nodes[cur]?.parentId ?? null;
    }
    return path;
  }

  function exploreRow(row: number, parentId: string): boolean {
    if (row === clampedN) {
      // Reached solution
      solutions.push([...board]);
      const solIdx = solutions.length;
      const solNode = nodes[parentId];
      if (solNode) {
        solNode.status = 'solution';
        solNode.solutionIndex = solIdx;
        solNode.solutionStepIndex = currentStepIndex;
        if (!solutionNodeIds.includes(parentId)) {
          solutionNodeIds.push(parentId);
        }
      }

      stepToNodeId[currentStepIndex] = parentId;
      stepToActivePath[currentStepIndex] = getActivePath(parentId);
      currentStepIndex++;
      return true;
    }

    for (let col = 0; col < clampedN; col++) {
      board[row] = col;
      const nodeId = getPathId(row, col, parentId);
      const check = isSafe(row, col);

      if (check.safe) {
        // Safe placement: node continues downward
        nodes[nodeId] = {
          id: nodeId,
          parentId,
          depth: row + 1,
          row,
          col,
          board: [...board],
          label: `Q${row + 1} at (${row + 1}, ${col + 1})`,
          colLabel: `Col ${col + 1}`,
          status: 'safe',
          children: [],
          firstStepIndex: currentStepIndex,
          lastStepIndex: currentStepIndex,
          x: 0,
          y: 0,
        };

        if (!nodes[parentId].children.includes(nodeId)) {
          nodes[parentId].children.push(nodeId);
        }

        stepToNodeId[currentStepIndex] = nodeId;
        stepToActivePath[currentStepIndex] = getActivePath(nodeId);
        currentStepIndex++; // place step

        exploreRow(row + 1, nodeId);

        if (solutions.length > 0 && !findAll) {
          nodes[nodeId].lastStepIndex = currentStepIndex - 1;
          return true;
        }

        // Backtrack step
        board[row] = -1;
        nodes[nodeId].backtrackStepIndex = currentStepIndex;
        nodes[nodeId].lastStepIndex = currentStepIndex;
        stepToNodeId[currentStepIndex] = nodeId;
        stepToActivePath[currentStepIndex] = getActivePath(nodeId);
        currentStepIndex++; // backtrack step
      } else {
        // Conflict step: pruned non-solution branch
        const confRow = check.conflictingRow!;
        const attack = attackBetween({ r: confRow, c: board[confRow] }, { r: row, c: col });

        nodes[nodeId] = {
          id: nodeId,
          parentId,
          depth: row + 1,
          row,
          col,
          board: [...board],
          label: `✗ Conflict at (${row + 1}, ${col + 1})`,
          colLabel: `Col ${col + 1}`,
          status: 'conflict',
          attack,
          children: [],
          firstStepIndex: currentStepIndex,
          lastStepIndex: currentStepIndex,
          x: 0,
          y: 0,
        };

        if (!nodes[parentId].children.includes(nodeId)) {
          nodes[parentId].children.push(nodeId);
        }
        if (!conflictNodeIds.includes(nodeId)) {
          conflictNodeIds.push(nodeId);
        }

        stepToNodeId[currentStepIndex] = nodeId;
        stepToActivePath[currentStepIndex] = getActivePath(nodeId);
        currentStepIndex++; // conflict step
        board[row] = -1;
      }
    }

    return false;
  }

  exploreRow(0, rootId);

  // Final step
  const finalStepIndex = currentStepIndex;
  stepToNodeId[finalStepIndex] = solutionNodeIds[0] || rootId;
  stepToActivePath[finalStepIndex] = solutionNodeIds[0] ? getActivePath(solutionNodeIds[0]) : [rootId];

  // Compute layout coordinates (x, y) for all nodes
  layoutTreeNodes(nodes, rootId);

  let maxDepth = 0;
  for (const n of Object.values(nodes)) {
    if (n.depth > maxDepth) maxDepth = n.depth;
  }

  return {
    nodes,
    rootId,
    totalNodes: Object.keys(nodes).length,
    maxDepth,
    solutionNodeIds,
    conflictNodeIds,
    stepToNodeId,
    stepToActivePath,
  };
}

/**
 * Assigns clean 2D positions (x, y) to each tree node using depth and subtree widths.
 */
function layoutTreeNodes(nodes: Record<string, NQueensTreeNode>, rootId: string) {
  const HORIZONTAL_SPACING = 90;
  const VERTICAL_SPACING = 110;

  // Post-order traversal to calculate subtree width and relative positions
  let nextLeafX = 0;

  function assignPositions(nodeId: string, depth: number) {
    const node = nodes[nodeId];
    if (!node) return;

    node.depth = depth;
    node.y = depth * VERTICAL_SPACING + 40;

    if (node.children.length === 0) {
      node.x = nextLeafX;
      nextLeafX += HORIZONTAL_SPACING;
    } else {
      for (const childId of node.children) {
        assignPositions(childId, depth + 1);
      }
      const firstChild = nodes[node.children[0]];
      const lastChild = nodes[node.children[node.children.length - 1]];
      node.x = (firstChild.x + lastChild.x) / 2;
    }
  }

  assignPositions(rootId, 0);

  // Normalize so minX starts with padding
  let minX = Infinity;
  for (const n of Object.values(nodes)) {
    if (n.x < minX) minX = n.x;
  }
  const shiftX = 50 - minX;
  for (const n of Object.values(nodes)) {
    n.x += shiftX;
  }
}
