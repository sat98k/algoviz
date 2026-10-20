import { AlgorithmStep } from '../types/algorithm';

export interface HuffmanNode {
  id: string;
  char?: string;
  freq: number;
  left?: HuffmanNode;
  right?: HuffmanNode;
  code?: string;
}

export interface HuffmanState {
  inputText: string;
  frequencyMap: Record<string, number>;
  forest: HuffmanNode[];
  activeMergeNodes?: [string, string];
  treeRoot?: HuffmanNode;
  codeTable: Record<string, string>;
  encodedBits?: string;
  originalBits?: number;
  compressedBits?: number;
  compressionRatio?: number;
  mode?: 'encode' | 'decode';
  currentBit?: string;
  bitIndex?: number;
  totalBits?: number;
  accumulatedText?: string;
  codecStep?: any;
  /** Priority queue in order (smallest frequency first) for this step. */
  queue?: HuffmanQueueEntry[];
  /** The two entries taken from the front of the queue in this step. */
  queueRemoved?: [string, string];
  /** The merged tree just put back into the queue. */
  queueInserted?: string;
}

export interface HuffmanQueueEntry {
  id: string;
  /** The character of a leaf, or every character inside a merged tree. */
  label: string;
  freq: number;
  isLeaf: boolean;
}

/** Characters inside a (sub)tree, left to right: a readable name instead of an internal id. */
export const leafChars = (node: HuffmanNode): string =>
  node.char !== undefined ? node.char : `${node.left ? leafChars(node.left) : ''}${node.right ? leafChars(node.right) : ''}`;

/** Queue order the algorithm uses: by frequency, ties in insertion order (stable sort). */
const queueOf = (forest: HuffmanNode[]): HuffmanQueueEntry[] =>
  [...forest]
    .sort((a, b) => a.freq - b.freq)
    .map((n) => ({ id: n.id, label: leafChars(n), freq: n.freq, isLeaf: n.char !== undefined && !n.left && !n.right }));

export const HUFFMAN_DECODING_PSEUDOCODE = [
  'function HuffmanDecode(root, bitStream):',
  '  currentNode = root; decodedText = "" // Start at tree root with empty output',
  '  for each bit in bitStream: // Read input bit-by-bit from left to right',
  '    if bit == "0": currentNode = currentNode.left // Traverse left branch on "0"',
  '    else: currentNode = currentNode.right // Traverse right branch on "1"',
  '    if isLeaf(currentNode): // Leaf reached: symbol identified',
  '      decodedText += currentNode.character // Append character to output',
  '      currentNode = root // Reset traversal back to root for next symbol',
  '  return decodedText // Full message recovered losslessly',
];

export function* huffmanSteps(inputs: { text: string }): Generator<AlgorithmStep<HuffmanState>> {
  const text = inputs.text || 'ABRACADABRA';
  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  // Step 1: Calculate frequencies
  const freqMap: Record<string, number> = {};
  for (const ch of text) {
    freqMap[ch] = (freqMap[ch] || 0) + 1;
  }

  // Initial forest of single-node trees
  let nodeIdCounter = 1;
  let forest: HuffmanNode[] = Object.keys(freqMap).map((char) => ({
    id: `node-${nodeIdCounter++}`,
    char,
    freq: freqMap[char],
  }));

  // Sort forest ascending by frequency
  forest.sort((a, b) => a.freq - b.freq);

  yield {
    stepIndex: stepIndex++,
    title: 'Frequency Analysis & Initial Forest',
    description: `Counted each character in the ${text.length}-character text: ${forest.map((n) => `${n.char} × ${n.freq}`).join(', ')}. Each character becomes a small one-node tree with its count, and the trees wait in line from smallest count to largest.`,
    codeLine: [2, 3],
    state: {
      inputText: text,
      frequencyMap: { ...freqMap },
      forest: JSON.parse(JSON.stringify(forest)),
      codeTable: {},
      originalBits: text.length * 8,
      queue: queueOf(forest),
    },
    highlights: {
      nodes: forest.map((n) => n.id),
    },
    metrics: { comparisons, iterations },
  };

  // Step 2: Merge 2 lowest nodes iteratively
  while (forest.length > 1) {
    iterations++;
    // Sort to get 2 smallest
    forest.sort((a, b) => {
      comparisons++;
      return a.freq - b.freq;
    });

    const left = forest.shift()!;
    const right = forest.shift()!;

    yield {
      stepIndex: stepIndex++,
      title: `Select 2 Lowest Frequency Trees`,
      description: `The two trees with the smallest counts are "${leafChars(left)}" (${left.freq}) and "${leafChars(right)}" (${right.freq}). Take both out to join them. Rare characters are joined first, so they end up deepest and get the longest codes.`,
      codeLine: [4, 5, 6],
      state: {
        inputText: text,
        frequencyMap: { ...freqMap },
        forest: [left, right, ...JSON.parse(JSON.stringify(forest))],
        activeMergeNodes: [left.id, right.id],
        codeTable: {},
        originalBits: text.length * 8,
        queue: queueOf([left, right, ...forest]),
        queueRemoved: [left.id, right.id],
      },
      highlights: {
        nodes: [left.id, right.id],
        type: 'compare',
      },
      metrics: { comparisons, iterations },
    };

    const parentNode: HuffmanNode = {
      id: `node-${nodeIdCounter++}`,
      freq: left.freq + right.freq,
      left,
      right,
    };

    forest.push(parentNode);

    yield {
      stepIndex: stepIndex++,
      title: `Merged Nodes into Subtree`,
      description: `Join them under a new parent "${leafChars(parentNode)}" with count ${left.freq} + ${right.freq} = ${parentNode.freq}. It goes back into the line at its place by count.`,
      codeLine: [7, 8],
      state: {
        inputText: text,
        frequencyMap: { ...freqMap },
        forest: JSON.parse(JSON.stringify(forest)),
        activeMergeNodes: [left.id, right.id],
        codeTable: {},
        originalBits: text.length * 8,
        queue: queueOf(forest),
        queueInserted: parentNode.id,
      },
      highlights: {
        nodes: [parentNode.id, left.id, right.id],
        type: 'active',
      },
      metrics: { comparisons, iterations },
    };
  }

  const root = forest[0];
  const codeTable: Record<string, string> = {};

  // Step 3: Traverse tree to assign binary prefix codes
  function assignCodes(node?: HuffmanNode, currentCode: string = '') {
    if (!node) return;
    if (node.char !== undefined && !node.left && !node.right) {
      codeTable[node.char] = currentCode || '0';
      node.code = currentCode || '0';
      return;
    }
    if (node.left) assignCodes(node.left, currentCode + '0');
    if (node.right) assignCodes(node.right, currentCode + '1');
  }

  assignCodes(root);

  // Encode input text
  let encodedBits = '';
  for (const ch of text) {
    encodedBits += codeTable[ch] || '';
  }

  const originalBits = text.length * 8;
  const compressedBits = encodedBits.length;
  const compressionRatio = originalBits > 0 ? parseFloat((((originalBits - compressedBits) / originalBits) * 100).toFixed(2)) : 0;

  yield {
    stepIndex: stepIndex++,
    title: 'Huffman Tree & Prefix Codes Complete',
    description: `Only one tree is left, so it is finished. Read each code from the top, left = 0 and right = 1: ${Object.entries(codeTable).map(([c, code]) => `${c} = ${code}`).join(', ')}. Common characters got short codes, so the text needs ${compressedBits} bits instead of ${originalBits} at 8 bits per character (${compressionRatio}% smaller).`,
    codeLine: [9, 10],
    state: {
      inputText: text,
      frequencyMap: { ...freqMap },
      forest: [JSON.parse(JSON.stringify(root))],
      treeRoot: JSON.parse(JSON.stringify(root)),
      codeTable,
      encodedBits,
      originalBits,
      compressedBits,
      compressionRatio,
    },
    highlights: {
      nodes: [root?.id || ''],
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      codeTable,
      encodedBits,
      originalBits,
      compressedBits,
      compressionRatio: `${compressionRatio}%`,
    },
  };
}
