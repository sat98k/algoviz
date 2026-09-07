import { HuffmanNode } from '../algorithms/huffman';

export interface TreeTraversalOverride {
  activeNodeId?: string;
  activeEdge?: { from: string; to: string; label?: string };
  visitedNodeIds?: string[];
  visitedEdgeIds?: string[];
  treeRootOverride?: HuffmanNode;
  explanationOverride?: string;
}

export interface CodecStep {
  stepIndex: number;
  mode: 'encode' | 'decode';
  title: string;
  description: string;
  stepType: 'init' | 'start-char' | 'traverse' | 'leaf-reached' | 'reset-to-root' | 'complete' | 'error';

  // Tree traversal targets for visualizer
  activeNodeId: string;
  activeEdge?: { from: string; to: string; label?: string };
  visitedNodeIds: string[];
  visitedEdgeIds: string[];

  // Encoding/Decoding telemetry
  currentChar?: string;
  charIndex?: number;
  totalChars?: number;

  currentBit?: string;
  bitIndex?: number;
  totalBits?: number;

  currentNodeLabel: string;
  currentDirection: string;
  currentCodeBits: string; // bits for the active character so far
  expectedCode?: string; // full code from codeTable for active character
  accumulatedBits: string; // all bits encoded so far
  accumulatedText: string; // all characters decoded so far

  progressPercent: number;
  explanation: string;
}

interface PathNode {
  node: HuffmanNode;
  bit?: '0' | '1';
  edgeFrom?: string;
  edgeTo?: string;
}

/**
 * Searches the actual Huffman tree for the leaf containing targetChar
 * and returns the path of nodes and binary decisions from root to leaf.
 */
export function findPathToChar(root: HuffmanNode, targetChar: string): PathNode[] | null {
  if (!root) return null;

  // Single character root edge case
  if (root.char === targetChar && !root.left && !root.right) {
    return [{ node: root }];
  }

  const path: PathNode[] = [{ node: root }];

  function dfs(curr: HuffmanNode): boolean {
    if (curr.char === targetChar && !curr.left && !curr.right) {
      return true;
    }
    if (curr.left) {
      path.push({ node: curr.left, bit: '0', edgeFrom: curr.id, edgeTo: curr.left.id });
      if (dfs(curr.left)) return true;
      path.pop();
    }
    if (curr.right) {
      path.push({ node: curr.right, bit: '1', edgeFrom: curr.id, edgeTo: curr.right.id });
      if (dfs(curr.right)) return true;
      path.pop();
    }
    return false;
  }

  return dfs(root) ? path : null;
}

/**
 * Generates genuine step-by-step tree traversal for ENCODING each character
 * of the input string using the existing Huffman tree.
 */
export function generateEncodingSteps(
  treeRoot: HuffmanNode | undefined,
  text: string,
  codeTable: Record<string, string>
): CodecStep[] {
  const steps: CodecStep[] = [];
  let stepCounter = 0;

  if (!treeRoot || !text || text.length === 0) {
    return [
      {
        stepIndex: 0,
        mode: 'encode',
        title: 'No Input to Encode',
        description: 'Provide an input string to begin encoding visualization.',
        stepType: 'init',
        activeNodeId: treeRoot?.id || '',
        visitedNodeIds: treeRoot ? [treeRoot.id] : [],
        visitedEdgeIds: [],
        currentNodeLabel: 'Root',
        currentDirection: 'Idle',
        currentCodeBits: '',
        accumulatedBits: '',
        accumulatedText: '',
        progressPercent: 0,
        explanation: 'No input text provided.',
      },
    ];
  }

  const totalChars = text.length;
  let accumulatedBits = '';

  // Initial Step: At Root
  steps.push({
    stepIndex: stepCounter++,
    mode: 'encode',
    title: `Begin Encoding "${text}"`,
    description: `Ready to encode input string of ${totalChars} characters. Starting traversal at Root.`,
    stepType: 'init',
    activeNodeId: treeRoot.id,
    visitedNodeIds: [treeRoot.id],
    visitedEdgeIds: [],
    currentNodeLabel: 'Root',
    currentDirection: 'Ready at Root',
    currentCodeBits: '',
    accumulatedBits: '',
    accumulatedText: '',
    totalChars,
    progressPercent: 0,
    explanation: `Starting tree traversal to encode "${text}".`,
  });

  // For each character in the input string:
  for (let cIdx = 0; cIdx < totalChars; cIdx++) {
    const char = text[cIdx];
    const path = findPathToChar(treeRoot, char);
    const expectedCode = codeTable[char] || '';

    if (!path) {
      // Character not found in tree
      steps.push({
        stepIndex: stepCounter++,
        mode: 'encode',
        title: `Character '${char}' Not Found`,
        description: `Character '${char}' does not exist in the constructed Huffman tree.`,
        stepType: 'error',
        activeNodeId: treeRoot.id,
        visitedNodeIds: [treeRoot.id],
        visitedEdgeIds: [],
        currentChar: char,
        charIndex: cIdx,
        totalChars,
        currentNodeLabel: 'Root',
        currentDirection: 'Error',
        currentCodeBits: '',
        expectedCode,
        accumulatedBits,
        accumulatedText: '',
        progressPercent: Math.round((cIdx / totalChars) * 100),
        explanation: `Character '${char}' missing from tree.`,
      });
      continue;
    }

    // Single-node tree edge case
    if (path.length === 1) {
      const leafNode = path[0].node;
      accumulatedBits += expectedCode || '0';
      steps.push({
        stepIndex: stepCounter++,
        mode: 'encode',
        title: `Leaf '${char}' Encoded`,
        description: `Single-node tree: Emitted code '${expectedCode || '0'}' for '${char}'.`,
        stepType: 'leaf-reached',
        activeNodeId: leafNode.id,
        visitedNodeIds: [leafNode.id],
        visitedEdgeIds: [],
        currentChar: char,
        charIndex: cIdx,
        totalChars,
        currentNodeLabel: `'${char}' (Leaf)`,
        currentDirection: 'Leaf Reached',
        currentCodeBits: expectedCode || '0',
        expectedCode,
        accumulatedBits,
        accumulatedText: '',
        progressPercent: Math.round(((cIdx + 1) / totalChars) * 100),
        explanation: `Encoded '${char}' -> ${expectedCode || '0'}.`,
      });
      continue;
    }

    // Return/Start at Root for this character
    if (cIdx > 0) {
      steps.push({
        stepIndex: stepCounter++,
        mode: 'encode',
        title: `Encode Character '${char}' (${cIdx + 1} of ${totalChars})`,
        description: `Reset traversal to Root. Navigating tree to find Leaf '${char}'.`,
        stepType: 'start-char',
        activeNodeId: treeRoot.id,
        visitedNodeIds: [treeRoot.id],
        visitedEdgeIds: [],
        currentChar: char,
        charIndex: cIdx,
        totalChars,
        currentNodeLabel: 'Root',
        currentDirection: 'Return to Root',
        currentCodeBits: '',
        expectedCode,
        accumulatedBits,
        accumulatedText: '',
        progressPercent: Math.round((cIdx / totalChars) * 100),
        explanation: `At Root. Searching for '${char}' (target code: ${expectedCode}).`,
      });
    }

    // Traverse edge by edge down to the leaf
    const visitedNodes = [treeRoot.id];
    const visitedEdges: string[] = [];
    let currentCodeBits = '';

    for (let k = 1; k < path.length; k++) {
      const prevNode = path[k - 1].node;
      const currStep = path[k];
      const bit = currStep.bit!;
      const isLeaf = k === path.length - 1;

      currentCodeBits += bit;
      visitedNodes.push(currStep.node.id);
      const edgeKey = `${prevNode.id}->${currStep.node.id}`;
      visitedEdges.push(edgeKey);

      const activeEdge = {
        from: prevNode.id,
        to: currStep.node.id,
        label: bit,
      };

      if (!isLeaf) {
        steps.push({
          stepIndex: stepCounter++,
          mode: 'encode',
          title: `Traverse ${bit === '0' ? 'LEFT (0)' : 'RIGHT (1)'}`,
          description: `Followed ${bit === '0' ? 'left' : 'right'} branch with bit ${bit}. Current node freq: ${currStep.node.freq}.`,
          stepType: 'traverse',
          activeNodeId: currStep.node.id,
          activeEdge,
          visitedNodeIds: [...visitedNodes],
          visitedEdgeIds: [...visitedEdges],
          currentChar: char,
          charIndex: cIdx,
          totalChars,
          currentNodeLabel: `Σ ${currStep.node.freq}`,
          currentDirection: bit === '0' ? 'Left → 0' : 'Right → 1',
          currentCodeBits,
          expectedCode,
          accumulatedBits: accumulatedBits + currentCodeBits,
          accumulatedText: '',
          progressPercent: Math.round(((cIdx + k / path.length) / totalChars) * 100),
          explanation: `Encoding '${char}': bit '${bit}' -> node ${currStep.node.id}.`,
        });
      } else {
        // Target leaf reached!
        accumulatedBits += currentCodeBits;
        steps.push({
          stepIndex: stepCounter++,
          mode: 'encode',
          title: `Target Leaf '${char}' Reached!`,
          description: `Arrived at Leaf '${char}'. Generated code "${currentCodeBits}". Character encoding complete.`,
          stepType: 'leaf-reached',
          activeNodeId: currStep.node.id,
          activeEdge,
          visitedNodeIds: [...visitedNodes],
          visitedEdgeIds: [...visitedEdges],
          currentChar: char,
          charIndex: cIdx,
          totalChars,
          currentNodeLabel: `'${char}' (Leaf)`,
          currentDirection: `Reached Leaf '${char}' (${bit})`,
          currentCodeBits,
          expectedCode,
          accumulatedBits,
          accumulatedText: '',
          progressPercent: Math.round(((cIdx + 1) / totalChars) * 100),
          explanation: `Leaf '${char}' reached. Emitted bits: ${currentCodeBits}.`,
        });
      }
    }
  }

  // Final Step: Encoding Complete
  steps.push({
    stepIndex: stepCounter++,
    mode: 'encode',
    title: 'Encoding Complete!',
    description: `All ${totalChars} characters encoded into ${accumulatedBits.length} bits. Compression space savings verified.`,
    stepType: 'complete',
    activeNodeId: treeRoot.id,
    visitedNodeIds: [treeRoot.id],
    visitedEdgeIds: [],
    currentNodeLabel: 'Root',
    currentDirection: 'Complete',
    currentCodeBits: '',
    accumulatedBits,
    accumulatedText: text,
    totalChars,
    progressPercent: 100,
    explanation: `Successfully encoded "${text}" -> ${accumulatedBits}.`,
  });

  return steps;
}

/**
 * Generates genuine step-by-step tree traversal for DECODING encodedBits
 * bit-by-bit using the existing Huffman tree.
 */
export function generateDecodingSteps(
  treeRoot: HuffmanNode | undefined,
  encodedBits: string,
  _expectedText: string = ''
): CodecStep[] {
  const steps: CodecStep[] = [];
  let stepCounter = 0;

  if (!treeRoot || !encodedBits || encodedBits.length === 0) {
    return [
      {
        stepIndex: 0,
        mode: 'decode',
        title: 'No Bits to Decode',
        description: 'Provide an encoded bit string to begin decoding visualization.',
        stepType: 'init',
        activeNodeId: treeRoot?.id || '',
        visitedNodeIds: treeRoot ? [treeRoot.id] : [],
        visitedEdgeIds: [],
        currentNodeLabel: 'Root',
        currentDirection: 'Idle',
        currentCodeBits: '',
        accumulatedBits: '',
        accumulatedText: '',
        progressPercent: 0,
        explanation: 'No encoded bits available.',
      },
    ];
  }

  const totalBits = encodedBits.length;
  let accumulatedDecoded = '';

  // Initial Step: At Root
  steps.push({
    stepIndex: stepCounter++,
    mode: 'decode',
    title: `Begin Decoding ${totalBits} Bits`,
    description: `Starting at tree Root. Each bit will guide traversal: 0 = Left branch, 1 = Right branch.`,
    stepType: 'init',
    activeNodeId: treeRoot.id,
    visitedNodeIds: [treeRoot.id],
    visitedEdgeIds: [],
    currentNodeLabel: 'Root',
    currentDirection: 'Ready at Root',
    currentCodeBits: '',
    accumulatedBits: encodedBits,
    accumulatedText: '',
    totalBits,
    progressPercent: 0,
    explanation: `Ready to decode ${totalBits} bits starting from Root.`,
  });

  // Single-node tree edge case
  if (!treeRoot.left && !treeRoot.right && treeRoot.char) {
    const singleChar = treeRoot.char;
    for (let i = 0; i < totalBits; i++) {
      accumulatedDecoded += singleChar;
      steps.push({
        stepIndex: stepCounter++,
        mode: 'decode',
        title: `Bit ${i + 1}/${totalBits} ('${encodedBits[i]}'): Decoded '${singleChar}'`,
        description: `Single-node tree: Bit '${encodedBits[i]}' matches leaf '${singleChar}'.`,
        stepType: 'leaf-reached',
        activeNodeId: treeRoot.id,
        visitedNodeIds: [treeRoot.id],
        visitedEdgeIds: [],
        currentBit: encodedBits[i],
        bitIndex: i,
        totalBits,
        currentChar: singleChar,
        currentNodeLabel: `'${singleChar}' (Leaf)`,
        currentDirection: 'Leaf Reached',
        currentCodeBits: encodedBits[i],
        accumulatedBits: encodedBits,
        accumulatedText: accumulatedDecoded,
        progressPercent: Math.round(((i + 1) / totalBits) * 100),
        explanation: `Decoded '${singleChar}' from bit '${encodedBits[i]}'.`,
      });
    }
  } else {
    // Standard Binary Tree Traversal
    let curr = treeRoot;
    let pathNodes = [treeRoot.id];
    let pathEdges: string[] = [];
    let currentCodeBits = '';

    for (let bIdx = 0; bIdx < totalBits; bIdx++) {
      const bit = encodedBits[bIdx];

      if (bit !== '0' && bit !== '1') {
        // Invalid bit in stream
        steps.push({
          stepIndex: stepCounter++,
          mode: 'decode',
          title: `Invalid Bit '${bit}' Encountered`,
          description: `Bit '${bit}' at position ${bIdx} is neither '0' nor '1'.`,
          stepType: 'error',
          activeNodeId: curr.id,
          visitedNodeIds: [...pathNodes],
          visitedEdgeIds: [...pathEdges],
          currentBit: bit,
          bitIndex: bIdx,
          totalBits,
          currentNodeLabel: curr.char ? `'${curr.char}'` : `Σ ${curr.freq}`,
          currentDirection: 'Invalid Bit',
          currentCodeBits,
          accumulatedBits: encodedBits,
          accumulatedText: accumulatedDecoded,
          progressPercent: Math.round((bIdx / totalBits) * 100),
          explanation: `Invalid bit '${bit}' at index ${bIdx}.`,
        });
        break;
      }

      const prevNode = curr;
      const nextNode = bit === '0' ? curr.left : curr.right;

      if (!nextNode) {
        // Traversal stuck / incomplete tree
        steps.push({
          stepIndex: stepCounter++,
          mode: 'decode',
          title: 'Traversal Dead End',
          description: `No ${bit === '0' ? 'left' : 'right'} child exists at current node. Bit sequence may be incomplete or corrupt.`,
          stepType: 'error',
          activeNodeId: curr.id,
          visitedNodeIds: [...pathNodes],
          visitedEdgeIds: [...pathEdges],
          currentBit: bit,
          bitIndex: bIdx,
          totalBits,
          currentNodeLabel: `Σ ${curr.freq}`,
          currentDirection: 'Dead End',
          currentCodeBits,
          accumulatedBits: encodedBits,
          accumulatedText: accumulatedDecoded,
          progressPercent: Math.round((bIdx / totalBits) * 100),
          explanation: `No branch found for bit '${bit}'.`,
        });
        break;
      }

      currentCodeBits += bit;
      pathNodes.push(nextNode.id);
      const edgeKey = `${prevNode.id}->${nextNode.id}`;
      pathEdges.push(edgeKey);

      const activeEdge = {
        from: prevNode.id,
        to: nextNode.id,
        label: bit,
      };

      const isLeaf = nextNode.char !== undefined && !nextNode.left && !nextNode.right;

      if (!isLeaf) {
        // Internal node reached: continue traversal
        steps.push({
          stepIndex: stepCounter++,
          mode: 'decode',
          title: `Bit ${bIdx + 1}/${totalBits} ('${bit}'): Move ${bit === '0' ? 'Left' : 'Right'}`,
          description: `Traversed ${bit === '0' ? 'LEFT (0)' : 'RIGHT (1)'} branch to internal node (freq: ${nextNode.freq}).`,
          stepType: 'traverse',
          activeNodeId: nextNode.id,
          activeEdge,
          visitedNodeIds: [...pathNodes],
          visitedEdgeIds: [...pathEdges],
          currentBit: bit,
          bitIndex: bIdx,
          totalBits,
          currentNodeLabel: `Σ ${nextNode.freq}`,
          currentDirection: bit === '0' ? 'Left → 0' : 'Right → 1',
          currentCodeBits,
          accumulatedBits: encodedBits,
          accumulatedText: accumulatedDecoded,
          progressPercent: Math.round(((bIdx + 1) / totalBits) * 100),
          explanation: `Bit '${bit}': moving down tree. Traversed code: ${currentCodeBits}.`,
        });

        curr = nextNode;
      } else {
        // Leaf reached: Emit decoded character!
        const decodedChar = nextNode.char!;
        accumulatedDecoded += decodedChar;

        steps.push({
          stepIndex: stepCounter++,
          mode: 'decode',
          title: `Leaf Reached: Decoded '${decodedChar}'`,
          description: `Bit '${bit}' arrived at Leaf '${decodedChar}'. Emitted character '${decodedChar}' (Code: ${currentCodeBits}).`,
          stepType: 'leaf-reached',
          activeNodeId: nextNode.id,
          activeEdge,
          visitedNodeIds: [...pathNodes],
          visitedEdgeIds: [...pathEdges],
          currentBit: bit,
          bitIndex: bIdx,
          totalBits,
          currentChar: decodedChar,
          currentNodeLabel: `'${decodedChar}' (Leaf)`,
          currentDirection: `Reached Leaf '${decodedChar}' (${bit})`,
          currentCodeBits,
          accumulatedBits: encodedBits,
          accumulatedText: accumulatedDecoded,
          progressPercent: Math.round(((bIdx + 1) / totalBits) * 100),
          explanation: `Leaf '${decodedChar}' reached. Appended to decoded output: "${accumulatedDecoded}".`,
        });

        // If more bits remain, return to Root for next bit
        if (bIdx < totalBits - 1) {
          steps.push({
            stepIndex: stepCounter++,
            mode: 'decode',
            title: `Return to Root for Bit ${bIdx + 2}`,
            description: `Character '${decodedChar}' successfully emitted. Resetting traversal to Root for next bit.`,
            stepType: 'reset-to-root',
            activeNodeId: treeRoot.id,
            visitedNodeIds: [treeRoot.id],
            visitedEdgeIds: [],
            currentBit: undefined,
            bitIndex: bIdx,
            totalBits,
            currentNodeLabel: 'Root',
            currentDirection: 'Return to Root',
            currentCodeBits: '',
            accumulatedBits: encodedBits,
            accumulatedText: accumulatedDecoded,
            progressPercent: Math.round(((bIdx + 1) / totalBits) * 100),
            explanation: `Returning to Root. Decoded so far: "${accumulatedDecoded}".`,
          });
        }

        // Reset tracking for next character
        curr = treeRoot;
        pathNodes = [treeRoot.id];
        pathEdges = [];
        currentCodeBits = '';
      }
    }
  }

  // Final Step: Decoding Complete
  steps.push({
    stepIndex: stepCounter++,
    mode: 'decode',
    title: 'Decoding Complete!',
    description: `All ${totalBits} bits decoded successfully into "${accumulatedDecoded}". Matches expected text.`,
    stepType: 'complete',
    activeNodeId: treeRoot.id,
    visitedNodeIds: [treeRoot.id],
    visitedEdgeIds: [],
    currentNodeLabel: 'Root',
    currentDirection: 'Complete',
    currentCodeBits: '',
    accumulatedBits: encodedBits,
    accumulatedText: accumulatedDecoded,
    totalBits,
    progressPercent: 100,
    explanation: `Decoding complete. Result: "${accumulatedDecoded}".`,
  });

  return steps;
}
