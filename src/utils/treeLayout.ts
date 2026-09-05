export interface TreeNodeInput {
  id: string;
  label: string;
  subLabel?: string;
  status?: 'active' | 'explored' | 'pruned' | 'best' | 'solution' | 'normal';
  pruneReason?: string;
  edgeLabel?: string;
  edgeStatus?: 'include' | 'exclude' | 'normal' | 'active' | 'best' | string;
  children?: TreeNodeInput[];
  rawNode?: any;
}

export interface PositionedNode {
  id: string;
  label: string;
  subLabel?: string;
  status: 'active' | 'explored' | 'pruned' | 'best' | 'solution' | 'normal';
  pruneReason?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  subtreeWidth: number;
  rawNode?: any;
}

export interface PositionedEdge {
  u: string;
  v: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  status?: string;
}

export interface TreeLayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  minSiblingGap?: number;
  levelHeight?: number;
  paddingX?: number;
  paddingY?: number;
}

export interface TreeLayoutResult {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface InternalLayoutNode extends TreeNodeInput {
  x: number;
  y: number;
  depth: number;
  subtreeWidth: number;
  internalChildren: InternalLayoutNode[];
}

export function computeTreeLayout(
  roots: TreeNodeInput[],
  options: TreeLayoutOptions = {}
): TreeLayoutResult {
  const nodeWidth = options.nodeWidth ?? 76;
  const nodeHeight = options.nodeHeight ?? 36;
  const minSiblingGap = options.minSiblingGap ?? 24;
  const levelHeight = options.levelHeight ?? 76;
  const paddingX = options.paddingX ?? 36;
  const paddingY = options.paddingY ?? 36;

  if (!roots || roots.length === 0) {
    return {
      nodes: [],
      edges: [],
      width: 800,
      height: 380,
      minX: 0,
      maxX: 800,
      minY: 0,
      maxY: 380,
    };
  }

  // Convert input to internal layout nodes
  const buildInternalNode = (input: TreeNodeInput): InternalLayoutNode => {
    return {
      ...input,
      x: 0,
      y: 0,
      depth: 0,
      subtreeWidth: nodeWidth,
      internalChildren: (input.children || []).map(buildInternalNode),
    };
  };

  const internalRoots = roots.map(buildInternalNode);
  let maxDepth = 0;

  // Pass 1: Compute required subtree width bottom-up
  const computeSubtreeWidth = (node: InternalLayoutNode, depth: number): number => {
    if (depth > maxDepth) maxDepth = depth;
    if (node.internalChildren.length === 0) {
      node.subtreeWidth = nodeWidth;
      return nodeWidth;
    }

    let totalChildrenWidth = 0;
    node.internalChildren.forEach((child, idx) => {
      totalChildrenWidth += computeSubtreeWidth(child, depth + 1);
      if (idx > 0) totalChildrenWidth += minSiblingGap;
    });

    node.subtreeWidth = Math.max(nodeWidth, totalChildrenWidth);
    return node.subtreeWidth;
  };

  internalRoots.forEach((root) => computeSubtreeWidth(root, 0));

  // Pass 2: Assign x and y coordinates top-down
  let currentRootStartX = paddingX;

  const assignPositions = (node: InternalLayoutNode, startX: number, depth: number) => {
    node.depth = depth;
    node.y = paddingY + depth * levelHeight;

    if (node.internalChildren.length === 0) {
      node.x = startX + node.subtreeWidth / 2;
    } else {
      let currentChildX = startX;
      node.internalChildren.forEach((child) => {
        assignPositions(child, currentChildX, depth + 1);
        currentChildX += child.subtreeWidth + minSiblingGap;
      });
      const firstChild = node.internalChildren[0];
      const lastChild = node.internalChildren[node.internalChildren.length - 1];
      node.x = (firstChild.x + lastChild.x) / 2;
    }
  };

  internalRoots.forEach((root) => {
    assignPositions(root, currentRootStartX, 0);
    currentRootStartX += root.subtreeWidth + minSiblingGap * 2;
  });

  const positionedNodes: PositionedNode[] = [];
  const positionedEdges: PositionedEdge[] = [];

  const collectPositions = (node: InternalLayoutNode) => {
    positionedNodes.push({
      id: node.id,
      label: node.label,
      subLabel: node.subLabel,
      status: (node.status || 'normal') as any,
      pruneReason: node.pruneReason,
      x: node.x,
      y: node.y,
      width: nodeWidth,
      height: nodeHeight,
      depth: node.depth,
      subtreeWidth: node.subtreeWidth,
      rawNode: node.rawNode,
    });

    node.internalChildren.forEach((child) => {
      positionedEdges.push({
        u: node.id,
        v: child.id,
        x1: node.x,
        y1: node.y + nodeHeight / 2,
        x2: child.x,
        y2: child.y - nodeHeight / 2,
        label: child.edgeLabel,
        status: child.edgeStatus,
      });
      collectPositions(child);
    });
  };

  internalRoots.forEach(collectPositions);

  const allX = positionedNodes.map((n) => n.x);
  const allY = positionedNodes.map((n) => n.y);

  const minX = Math.min(...allX) - nodeWidth / 2 - paddingX;
  const maxX = Math.max(...allX) + nodeWidth / 2 + paddingX;
  const minY = Math.min(...allY) - nodeHeight / 2 - paddingY;
  const maxY = Math.max(...allY) + nodeHeight / 2 + paddingY;

  const totalWidth = Math.max(860, maxX - minX);
  const totalHeight = Math.max(380, (maxDepth + 1) * levelHeight + paddingY * 2);

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    width: totalWidth,
    height: totalHeight,
    minX: Math.min(0, minX),
    maxX: Math.max(totalWidth, maxX),
    minY: Math.min(0, minY),
    maxY: Math.max(totalHeight, maxY),
  };
}
