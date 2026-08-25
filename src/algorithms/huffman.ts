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
}

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
    description: `Computed character frequencies for text of length ${text.length}. Created ${forest.length} initial leaf nodes.`,
    codeLine: 1,
    state: {
      inputText: text,
      frequencyMap: { ...freqMap },
      forest: JSON.parse(JSON.stringify(forest)),
      codeTable: {},
      originalBits: text.length * 8,
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
      description: `Selected node '${left.char || left.id}' (freq: ${left.freq}) and node '${right.char || right.id}' (freq: ${right.freq}) to merge.`,
      codeLine: 2,
      state: {
        inputText: text,
        frequencyMap: { ...freqMap },
        forest: [left, right, ...JSON.parse(JSON.stringify(forest))],
        activeMergeNodes: [left.id, right.id],
        codeTable: {},
        originalBits: text.length * 8,
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
      description: `Created parent node with combined frequency ${parentNode.freq} = ${left.freq} + ${right.freq}.`,
      codeLine: 3,
      state: {
        inputText: text,
        frequencyMap: { ...freqMap },
        forest: JSON.parse(JSON.stringify(forest)),
        activeMergeNodes: [left.id, right.id],
        codeTable: {},
        originalBits: text.length * 8,
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
    description: `Optimal prefix tree constructed. Assigned binary codes to all ${Object.keys(codeTable).length} characters. Compression: ${originalBits} bits -> ${compressedBits} bits (${compressionRatio}% space saved).`,
    codeLine: 4,
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
