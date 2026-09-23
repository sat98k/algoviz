import { AlgorithmConfig } from '../types/algorithm';
import { randomizedQuicksortSteps } from '../algorithms/randomizedQuicksort';
import { maxSubarraySteps } from '../algorithms/maxSubarray';
import { huffmanSteps } from '../algorithms/huffman';
import { knapsackDPSteps } from '../algorithms/knapsackDP';
import { lcsSteps } from '../algorithms/lcs';
import { nQueensSteps } from '../algorithms/nQueens';
import { knapsackBBSteps } from '../algorithms/knapsackBB';
import { kmpSteps } from '../algorithms/kmp';
import { naiveStringMatchSteps } from '../algorithms/naiveStringMatch';
import { rabinKarpSteps } from '../algorithms/rabinKarp';
import { suffixTreeSteps } from '../algorithms/suffixTree';
import { bellmanFordSteps } from '../algorithms/bellmanFord';
import { floydWarshallSteps } from '../algorithms/floydWarshall';
import { fordFulkersonSteps } from '../algorithms/fordFulkerson';
import { edmondsKarpSteps } from '../algorithms/edmondsKarp';
import { pushRelabelSteps } from '../algorithms/pushRelabel';
import { grahamScanSteps } from '../algorithms/grahamScan';
import { jarvisMarchSteps } from '../algorithms/jarvisMarch';
import { lineSegmentIntersectionSteps } from '../algorithms/lineSegmentIntersection';
import { hiringProblemSteps } from '../algorithms/hiringProblem';
import { kargerMinCutSteps } from '../algorithms/kargerMinCut';
import { vertexCoverApproxSteps } from '../algorithms/vertexCoverApprox';
import { setCoverSteps } from '../algorithms/setCover';
import { tspApproxSteps } from '../algorithms/tspApprox';
import { fractionalKnapsackSteps } from '../algorithms/fractionalKnapsack';
import { matrixChainMultiplicationSteps } from '../algorithms/matrixChainMultiplication';
import { karatsubaSteps } from '../algorithms/karatsuba';
import { assemblyLineSchedulingSteps } from '../algorithms/assemblyLineScheduling';
import { tspSteps } from '../algorithms/tsp';
import { subsetSumSteps } from '../algorithms/subsetSum';
import {
  graphColoringSteps,
  GRAPH_COLORING_PSEUDOCODE_FIRST,
} from '../algorithms/graphColoring';
import { jobSelectionBBSteps } from '../algorithms/jobSelectionBB';

export const algorithmRegistry: AlgorithmConfig[] = [
  // Module 1: Greedy — Fractional Knapsack
  {
    id: 'fractional-knapsack',
    module: 1,
    moduleName: 'Module 1: Greedy Algorithms',
    name: 'Fractional Knapsack',
    paradigm: 'Greedy',
    complexity: {
      timeBest: 'O(n log n)',
      timeAverage: 'O(n log n)',
      timeWorst: 'O(n log n)',
      spaceWorst: 'O(n)',
      description: 'Sorting items by value/weight ratio descending + O(n) greedy linear fill',
    },
    problemStatement:
      'Given weights and values of n items and a knapsack capacity W, determine the maximum value achievable by taking entire items or fractional portions of items.',
    explanation:
      'The Fractional Knapsack problem exhibits the greedy choice property: items are sorted by their value-to-weight density (v_i / w_i). We greedily consume highest-density items in full, taking a fractional slice of the first item that exceeds remaining capacity.',
    pseudocode: [
      'function FractionalKnapsack(weights, values, capacity):',
      '  for i = 1 to n: ratio[i] = values[i] / weights[i] // Compute value density (value per unit weight)',
      '  sortedItems = sortDescendingByRatio(items) // Greedily sort from highest to lowest ratio',
      '  currentWeight = 0, totalValue = 0',
      '  for each item in sortedItems: // Greedily consume items in density order',
      '    if currentWeight + item.weight <= capacity: // Item fits completely',
      '      currentWeight += item.weight; totalValue += item.value // Take 100% of item',
      '    else: // Knapsack cannot hold entire item: take fractional slice',
      '      fraction = (capacity - currentWeight) / item.weight // Fill remaining capacity',
      '      totalValue += fraction * item.value; break // Knapsack full: stop',
      '  return totalValue',
    ],
    visualizer: 'FractionalKnapsackVisualizer',
    inputSchema: [
      {
        name: 'weights',
        label: 'Item Weights',
        type: 'array',
        defaultValue: [10, 20, 30],
        placeholder: 'e.g. 10, 20, 30',
        helperText: 'Weights of items (comma-separated).',
      },
      {
        name: 'values',
        label: 'Item Values ($)',
        type: 'array',
        defaultValue: [60, 100, 120],
        placeholder: 'e.g. 60, 100, 120',
        helperText: 'Values of items (comma-separated).',
      },
      {
        name: 'capacity',
        label: 'Knapsack Capacity (W)',
        type: 'number',
        defaultValue: 50,
        min: 1,
        max: 500,
        helperText: 'Total weight capacity of knapsack.',
      },
    ],
    presets: [
      {
        name: 'Classic Textbook (W=50)',
        description: 'Standard 3-item problem with ratio ordering 6, 5, 4',
        data: { weights: [10, 20, 30], values: [60, 100, 120], capacity: 50 },
      },
      {
        name: 'High Density Split (W=60)',
        description: '4 items with high value dense items',
        data: { weights: [10, 40, 20, 30], values: [60, 280, 120, 150], capacity: 60 },
      },
      {
        name: 'Small Knapsack (W=15)',
        description: 'Small capacity requiring early fraction slice',
        data: { weights: [10, 20, 30], values: [60, 100, 120], capacity: 15 },
      },
    ],
    generateRandomInput: () => {
      const count = Math.floor(Math.random() * 3) + 3; // 3 to 5 items
      const weights: number[] = [];
      const values: number[] = [];
      for (let i = 0; i < count; i++) {
        weights.push((Math.floor(Math.random() * 4) + 1) * 10);
        values.push((Math.floor(Math.random() * 10) + 2) * 20);
      }
      const totalW = weights.reduce((a, b) => a + b, 0);
      const capacity = Math.round(totalW * 0.6);
      return { weights, values, capacity };
    },
    stepGenerator: fractionalKnapsackSteps,
  },
  // Module 1: Greedy — Huffman Coding
  {
    id: 'huffman',
    module: 1,
    moduleName: 'Module 1: Greedy Algorithms',
    name: 'Huffman Coding',
    paradigm: 'Greedy',
    complexity: {
      timeAverage: 'O(n log n)',
      timeWorst: 'O(n log n)',
      spaceWorst: 'O(n)',
      description: 'Building priority queue forest & prefix tree',
    },
    problemStatement:
      'Construct a lossless, variable-length prefix code for characters in a given string based on their frequencies, minimizing total encoded bit length.',
    explanation:
      'Huffman Coding repeatedly merges the two lowest-frequency tree nodes in a min-priority queue, creating a full binary tree where more frequent characters receive shorter bit sequences.',
    pseudocode: [
      'function HuffmanCoding(inputText):',
      '  charFrequencies = countFrequencies(inputText) // Tally occurrences of each unique character',
      '  minHeap = PriorityQueue(charFrequencies) // Initialize min-heap forest of leaf nodes',
      '  while minHeap.size() > 1: // Greedily merge two rarest nodes until one tree remains',
      '    leftNode = minHeap.extractMin() // Node with lowest frequency',
      '    rightNode = minHeap.extractMin() // Node with second lowest frequency',
      '    mergedParent = Node(freq = leftNode.freq + rightNode.freq, left = leftNode, right = rightNode)',
      '    minHeap.insert(mergedParent) // Re-insert merged subtree back into priority queue',
      '  huffmanRoot = minHeap.extractMin() // Root of completed prefix code tree',
      '  return generatePrefixCodes(huffmanRoot) // Left branch = "0", Right branch = "1"',
    ],
    visualizer: 'TreeVisualizer',
    inputSchema: [
      {
        name: 'text',
        label: 'Input String',
        type: 'text',
        defaultValue: 'ABRACADABRA',
        placeholder: 'e.g. ABRACADABRA or BANANA',
        helperText: 'Characters will be analyzed for frequency distribution.',
      },
    ],
    presets: [
      { name: 'Classic ABRACADABRA', data: { text: 'ABRACADABRA' } },
      { name: 'Repeated BANANA', data: { text: 'BANANABANANA' } },
      { name: 'DAA Project Text', data: { text: 'ALGORITHM_VISUALIZER' } },
    ],
    generateRandomInput: () => {
      const letters = 'ABCDEFGH';
      let str = '';
      const len = Math.floor(Math.random() * 10) + 8;
      for (let i = 0; i < len; i++) {
        str += letters[Math.floor(Math.random() * letters.length)];
      }
      return { text: str };
    },
    stepGenerator: huffmanSteps,
  },

  // Module 1: Divide & Conquer — Maximum Subarray
  {
    id: 'max-subarray',
    module: 1,
    moduleName: 'Module 1: Divide & Conquer',
    name: 'Maximum Subarray (Divide & Conquer)',
    paradigm: 'Divide & Conquer',
    complexity: {
      timeBest: 'O(n log n)',
      timeAverage: 'O(n log n)',
      timeWorst: 'O(n log n)',
      spaceWorst: 'O(log n)',
      description: 'Master theorem T(n) = 2T(n/2) + O(n) -> O(n log n) recursive recursion tree',
    },
    problemStatement:
      'Find the contiguous subarray within a one-dimensional array of numbers which has the largest sum, using the classic Divide & Conquer paradigm.',
    explanation:
      'Recursively split the array at midpoint mid into left half [low..mid] and right half [mid+1..high]. Solve both recursively, compute the maximum crossing subarray spanning the midpoint in O(n) time, and return the maximum of the three subproblem answers.',
    pseudocode: [
      'function MaxSubarrayDC(arr, low, high):',
      '  if low == high: return { maxSum: arr[low], low, high } // Base Case: 1 element',
      '  mid = floor((low + high) / 2) // Divide array into balanced halves',
      '  leftResult = MaxSubarrayDC(arr, low, mid) // Recursively solve left half',
      '  rightResult = MaxSubarrayDC(arr, mid + 1, high) // Recursively solve right half',
      '  crossResult = MaxCrossingSubarray(arr, low, mid, high) // Find best subarray crossing midpoint',
      '  return max(leftResult, rightResult, crossResult) // Combine: return best of the three',
    ],
    visualizer: 'RecursionTreeVisualizer',
    inputSchema: [
      {
        name: 'array',
        label: 'Array of Integers (comma-separated)',
        type: 'array',
        defaultValue: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
        placeholder: 'e.g. -2, 1, -3, 4, -1, 2, 1, -5, 4',
        helperText: 'Elements may include negative, zero, and positive integers.',
      },
    ],
    presets: [
      {
        name: 'Classic CLRS Array',
        description: 'Textbook 9-element array with mixed values',
        data: { array: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
      },
      {
        name: 'All Negative Array',
        description: 'Requires selecting single least negative element',
        data: { array: [-8, -3, -6, -2, -5] },
      },
      {
        name: 'All Positive Array',
        description: 'Whole array constitutes optimal subarray',
        data: { array: [1, 2, 3, 4, 5] },
      },
      {
        name: 'Alternating Array',
        description: 'Multiple competing subpeaks',
        data: { array: [3, -2, 5, -1, 4, -3, 2] },
      },
    ],
    generateRandomInput: () => {
      const len = Math.floor(Math.random() * 4) + 6; // 6 to 9 elements
      const arr: number[] = [];
      for (let i = 0; i < len; i++) {
        arr.push(Math.floor(Math.random() * 21) - 10);
      }
      return { array: arr };
    },
    stepGenerator: maxSubarraySteps,
  },

  // Module 1: Divide & Conquer — Karatsuba Fast Multiplication
  {
    id: 'karatsuba',
    module: 1,
    moduleName: 'Module 1: Divide & Conquer',
    name: 'Karatsuba Fast Multiplication',
    paradigm: 'Divide & Conquer',
    complexity: {
      timeBest: 'O(n^{1.585})',
      timeAverage: 'O(n^{\\log_2 3}) \\approx O(n^{1.585})',
      timeWorst: 'O(n^{1.585})',
      spaceWorst: 'O(n)',
      description: 'Master theorem T(n) = 3T(n/2) + O(n) -> reduces 4 multiplications to 3 recursive subproblems',
    },
    problemStatement:
      'Multiply two large n-digit integers faster than standard O(n²) grade-school multiplication using recursive 3-way algebraic decomposition.',
    explanation:
      'Splits X = a·10^m + b and Y = c·10^m + d. Instead of computing 4 subproducts (ac, ad, bc, bd), Karatsuba computes z2 = ac, z0 = bd, and z1 = (a+b)(c+d) - z2 - z0 using only 3 recursive calls, combining them as z2·10^(2m) + z1·10^m + z0 in O(n^1.585) time.',
    pseudocode: [
      'function Karatsuba(X, Y):',
      '  if X < 10 or Y < 10: return X * Y // Base Case: direct single-digit multiplication',
      '  m = floor(max(digits(X), digits(Y)) / 2) // Halfway split threshold',
      '  (a, b) = split(X, m); (c, d) = split(Y, m) // Decompose: X = a·10ᵐ + b, Y = c·10ᵐ + d',
      '  p1 = Karatsuba(a, c) // Recursive call 1: high parts product',
      '  p2 = Karatsuba(b, d) // Recursive call 2: low parts product',
      '  p3 = Karatsuba(a + b, c + d) // Recursive call 3: sum parts product',
      '  crossTerm = p3 - p1 - p2 // Gauss-Karatsuba cross coefficient trick',
      '  return p1 * 10^(2m) + crossTerm * 10^m + p2 // Combine scaled components into final product',
    ],
    visualizer: 'RecursionTreeVisualizer',
    inputSchema: [
      {
        name: 'num1',
        label: 'First Integer (X)',
        type: 'text',
        defaultValue: '1234',
        placeholder: 'e.g. 1234 or 98765',
        helperText: 'Non-negative integer (arbitrary digits supported).',
      },
      {
        name: 'num2',
        label: 'Second Integer (Y)',
        type: 'text',
        defaultValue: '5678',
        placeholder: 'e.g. 5678 or 4321',
        helperText: 'Non-negative integer (arbitrary digits supported).',
      },
    ],
    presets: [
      {
        name: 'Classic 4-Digit (1234 × 5678)',
        description: 'Standard textbook CLRS 4-digit split example',
        data: { num1: '1234', num2: '5678' },
      },
      {
        name: 'Asymmetric 5x3 Digits (98765 × 432)',
        description: 'Unequal lengths with padding and split handling',
        data: { num1: '98765', num2: '432' },
      },
      {
        name: '6-Digit Large Integers (123456 × 654321)',
        description: 'Deep 3-level recursive tree demo',
        data: { num1: '123456', num2: '654321' },
      },
      {
        name: 'Single-Digit Base Case (7 × 8)',
        description: 'Immediate single-node resolution',
        data: { num1: '7', num2: '8' },
      },
    ],
    generateRandomInput: () => {
      const len1 = Math.floor(Math.random() * 3) + 3; // 3 to 5 digits
      const len2 = Math.floor(Math.random() * 3) + 3;
      let s1 = String(Math.floor(Math.random() * 9) + 1);
      let s2 = String(Math.floor(Math.random() * 9) + 1);
      for (let i = 1; i < len1; i++) s1 += Math.floor(Math.random() * 10);
      for (let i = 1; i < len2; i++) s2 += Math.floor(Math.random() * 10);
      return { num1: s1, num2: s2 };
    },
    stepGenerator: karatsubaSteps,
  },

  // Module 2: Dynamic Programming — 0-1 Knapsack (DP)
  {
    id: 'knapsack-dp',
    module: 2,
    moduleName: 'Module 2: Dynamic Programming',
    name: '0-1 Knapsack (DP)',
    paradigm: 'Dynamic Programming',
    complexity: {
      timeAverage: 'O(n · W)',
      timeWorst: 'O(n · W)',
      spaceWorst: 'O(n · W)',
      description: 'Pseudo-polynomial bottom-up table fill',
    },
    problemStatement:
      'Given weights and values of n items, determine the items to include in a knapsack of capacity W to maximize total value without exceeding capacity.',
    explanation:
      'Constructs a 2D table DP[i][w] representing the max value achievable using a subset of the first i items with weight capacity w. Backtracks through the table to identify chosen items.',
    pseudocode: [
      'function KnapsackDP(weights, values, capacity, n):',
      '  dpTable = Matrix(rows = n + 1, cols = capacity + 1, init = 0) // Base case: 0 items or 0 capacity = 0 value',
      '  for itemIndex = 1 to n:',
      '    weight = weights[itemIndex - 1], value = values[itemIndex - 1]',
      '    for cap = 1 to capacity:',
      '      if weight > cap: // Item is too heavy for remaining capacity',
      '        dpTable[itemIndex][cap] = dpTable[itemIndex - 1][cap] // Exclude item; inherit best from previous items',
      '      else: // Item fits: choose maximum of excluding vs including item',
      '        excludeVal = dpTable[itemIndex - 1][cap]',
      '        includeVal = value + dpTable[itemIndex - 1][cap - weight]',
      '        dpTable[itemIndex][cap] = max(excludeVal, includeVal)',
      '  selectedItems = backtrackSolution(dpTable, weights, values, capacity, n) // Trace chosen items',
      '  return { maxValue: dpTable[n][capacity], selectedItems }',
    ],
    visualizer: 'GridTableVisualizer',
    inputSchema: [
      {
        name: 'weights',
        label: 'Weights (comma-separated)',
        type: 'array',
        defaultValue: [2, 3, 4, 5],
        placeholder: 'e.g. 2, 3, 4, 5',
      },
      {
        name: 'values',
        label: 'Values (comma-separated)',
        type: 'array',
        defaultValue: [3, 4, 5, 6],
        placeholder: 'e.g. 3, 4, 5, 6',
      },
      {
        name: 'capacity',
        label: 'Knapsack Capacity (W)',
        type: 'number',
        defaultValue: 5,
        min: 1,
        max: 20,
      },
    ],
    presets: [
      { name: '4 Items (Cap 5)', data: { weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 5 } },
      { name: '5 Items (Cap 8)', data: { weights: [1, 2, 3, 5, 6], values: [1, 6, 10, 16, 18], capacity: 8 } },
      { name: 'Small Test (Cap 6)', data: { weights: [1, 2, 4], values: [10, 12, 28], capacity: 6 } },
    ],
    generateRandomInput: () => {
      const n = 4;
      const weights = Array.from({ length: n }, () => Math.floor(Math.random() * 4) + 1);
      const values = Array.from({ length: n }, () => Math.floor(Math.random() * 15) + 3);
      const capacity = Math.floor(Math.random() * 5) + 5;
      return { weights, values, capacity };
    },
    stepGenerator: knapsackDPSteps,
  },

  // Module 2: Dynamic Programming — LCS
  {
    id: 'lcs',
    module: 2,
    moduleName: 'Module 2: Dynamic Programming',
    name: 'Longest Common Subsequence (LCS)',
    paradigm: 'Dynamic Programming',
    complexity: {
      timeAverage: 'O(m · n)',
      timeWorst: 'O(m · n)',
      spaceWorst: 'O(m · n)',
      description: '2D matrix comparison & backtrack',
    },
    problemStatement:
      'Find the longest subsequence common to two sequences X and Y (characters appear in the same relative order, not necessarily contiguous).',
    explanation:
      'Fills an (m+1) × (n+1) table. If X[i-1] == Y[j-1], DP[i][j] = 1 + DP[i-1][j-1]; otherwise DP[i][j] = max(DP[i-1][j], DP[i][j-1]). Backtracks to recover the exact LCS string.',
    pseudocode: [
      'function LCS(str1, str2, len1, len2):',
      '  dpTable = Matrix(rows = len1 + 1, cols = len2 + 1, init = 0) // Base case: 0 matches with empty string',
      '  for i = 1 to len1:',
      '    for j = 1 to len2:',
      '      if str1[i - 1] == str2[j - 1]: // Character match: extend diagonal subsequence',
      '        dpTable[i][j] = 1 + dpTable[i - 1][j - 1]',
      '      else: // Character mismatch: inherit best score from top or left cell',
      '        dpTable[i][j] = max(dpTable[i - 1][j], dpTable[i][j - 1])',
      '  lcsString = backtrackLCS(dpTable, str1, str2, len1, len2) // Trace diagonal match steps',
      '  return { length: dpTable[len1][len2], lcsString }',
    ],
    visualizer: 'GridTableVisualizer',
    inputSchema: [
      {
        name: 'str1',
        label: 'String 1 (X)',
        type: 'text',
        defaultValue: 'ABCBDAB',
        placeholder: 'e.g. ABCBDAB',
      },
      {
        name: 'str2',
        label: 'String 2 (Y)',
        type: 'text',
        defaultValue: 'BDCAB',
        placeholder: 'e.g. BDCAB',
      },
    ],
    presets: [
      { name: 'Textbook Example', data: { str1: 'ABCBDAB', str2: 'BDCAB' } },
      { name: 'DNA Sequences', data: { str1: 'AGGTAB', str2: 'GXTXAYB' } },
      { name: 'Short Words', data: { str1: 'ALGORITHM', str2: 'LOGARITHM' } },
    ],
    generateRandomInput: () => {
      const chars = 'ABCD';
      const genStr = (len: number) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return { str1: genStr(6), str2: genStr(5) };
    },
    stepGenerator: lcsSteps,
  },

  // Module 2: Dynamic Programming — Matrix Chain Multiplication
  {
    id: 'matrix-chain-multiplication',
    module: 2,
    moduleName: 'Module 2: Dynamic Programming',
    name: 'Matrix Chain Multiplication',
    paradigm: 'Dynamic Programming',
    complexity: {
      timeBest: 'O(n³)',
      timeAverage: 'O(n³)',
      timeWorst: 'O(n³)',
      spaceWorst: 'O(n²)',
      description: 'Tabular computation across all chain lengths L=2..n testing split points k',
    },
    problemStatement:
      'Given a sequence of matrices A1, A2, ..., An with specified dimensions, find the optimal parenthesization that minimizes the total number of scalar multiplications.',
    explanation:
      'Matrix multiplication is associative. We define m[i, j] as the minimum scalar multiplications to compute A_i..A_j. The recurrence tests every split point k (i <= k < j) combining optimal costs m[i, k] + m[k+1, j] + p_{i-1}*p_k*p_j, storing the best split in table s to reconstruct parenthesization.',
    pseudocode: [
      'function MatrixChainOrder(p, n):',
      '  for i = 1 to n: m[i, i] = 0 // Base case: 0 multiplications for a single matrix',
      '  for chainLen = 2 to n: // Solve subchains of increasing length L',
      '    for i = 1 to n - chainLen + 1:',
      '      j = i + chainLen - 1; m[i, j] = infinity',
      '      for k = i to j - 1: // Test every candidate split point k',
      '        cost = m[i, k] + m[k + 1, j] + p[i - 1] * p[k] * p[j] // Left cost + Right cost + multiply',
      '        if cost < m[i, j]: // Found cheaper parenthesization',
      '          m[i, j] = cost; s[i, j] = k // Record best cost and split index',
      '  parentheses = reconstructParens(s, 1, n) // Trace optimal grouping from split table',
      '  return { minCost: m[1, n], parentheses }',
    ],
    visualizer: 'GridTableVisualizer',
    inputSchema: [
      {
        name: 'dimensions',
        label: 'Matrix Dimensions (p0, p1, ..., pn)',
        type: 'array',
        defaultValue: [10, 20, 30, 40, 30],
        placeholder: 'e.g. 10, 20, 30, 40, 30',
        helperText: 'Array of dimensions representing n matrices: A_i has dimension p_{i-1} x p_i.',
      },
    ],
    presets: [
      {
        name: 'Classic CLRS (4 Matrices)',
        description: 'Dimensions [10, 20, 30, 40, 30] -> min cost 30,000',
        data: { dimensions: [10, 20, 30, 40, 30] },
      },
      {
        name: '3 Matrices Split Comparison',
        description: 'Dimensions [10, 100, 5, 50] -> min cost 7,500',
        data: { dimensions: [10, 100, 5, 50] },
      },
      {
        name: '5 Matrices Chain',
        description: 'Dimensions [5, 10, 3, 12, 5, 50]',
        data: { dimensions: [5, 10, 3, 12, 5, 50] },
      },
      {
        name: '2 Matrices Base Pair',
        description: 'Dimensions [40, 20, 30]',
        data: { dimensions: [40, 20, 30] },
      },
    ],
    generateRandomInput: () => {
      const matrixCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 matrices (4 to 6 dimensions)
      const dims: number[] = [Math.floor(Math.random() * 4 + 1) * 10];
      for (let i = 0; i < matrixCount; i++) {
        dims.push(Math.floor(Math.random() * 5 + 1) * 10);
      }
      return { dimensions: dims };
    },
    stepGenerator: matrixChainMultiplicationSteps,
  },

  // Module 2: Dynamic Programming — Assembly Line Scheduling
  {
    id: 'assembly-line-scheduling',
    module: 2,
    moduleName: 'Module 2: Dynamic Programming',
    name: 'Assembly Line Scheduling',
    paradigm: 'Dynamic Programming',
    complexity: {
      timeBest: 'O(n)',
      timeAverage: 'O(n)',
      timeWorst: 'O(n)',
      spaceWorst: 'O(n)',
      description: 'Single-pass dynamic programming across n stations per line + O(n) path backtrack',
    },
    problemStatement:
      'Given two parallel assembly lines with n manufacturing stations, processing times, line transfer penalties, and entry/exit times, determine the fastest path to assemble an automobile.',
    explanation:
      'Maintains f1[j] and f2[j] representing the fastest time to exit station j on lines 1 and 2. At each station, decides whether to stay on the same line or transfer from the parallel line. Backtracks from the fastest exit to reconstruct the exact manufacturing sequence.',
    pseudocode: [
      'function AssemblyLineScheduling(a1, a2, t1, t2, e1, e2, x1, x2, n):',
      '  f1[1] = e1 + a1[1];  f2[1] = e2 + a2[1]  // Base cases: entry times + first stations',
      '  for j = 2 to n:  // Progressively compute fastest route to station j',
      '    f1[j] = min(f1[j-1] + a1[j], f2[j-1] + t2[j-1] + a1[j])  // Line 1: stay vs transfer',
      '    f2[j] = min(f2[j-1] + a2[j], f1[j-1] + t1[j-1] + a2[j])  // Line 2: stay vs transfer',
      '  f* = min(f1[n] + x1, f2[n] + x2)  // Add exit times and choose optimal finish',
      '  optimalPath = backtrackPath(l1, l2, winningExitLine)  // Reconstruct path from predecessors',
      '  return (f*, optimalPath)  // Return minimum overall assembly time and route',
    ],
    visualizer: 'AssemblyLineVisualizer',
    inputSchema: [
      {
        name: 'a1',
        label: 'Line 1 Station Times (a1)',
        type: 'array',
        defaultValue: [7, 9, 3, 4, 8, 4],
        placeholder: 'e.g. 7, 9, 3, 4, 8, 4',
        helperText: 'Processing times for stations on Line 1.',
      },
      {
        name: 'a2',
        label: 'Line 2 Station Times (a2)',
        type: 'array',
        defaultValue: [8, 5, 6, 4, 5, 7],
        placeholder: 'e.g. 8, 5, 6, 4, 5, 7',
        helperText: 'Processing times for stations on Line 2.',
      },
      {
        name: 't1',
        label: 'Transfer Line 1 ➔ Line 2 (t1)',
        type: 'array',
        defaultValue: [2, 3, 1, 3, 4],
        placeholder: 'e.g. 2, 3, 1, 3, 4',
        helperText: 'Transfer penalties to switch from Line 1 to Line 2 (n-1 values).',
      },
      {
        name: 't2',
        label: 'Transfer Line 2 ➔ Line 1 (t2)',
        type: 'array',
        defaultValue: [2, 1, 2, 2, 1],
        placeholder: 'e.g. 2, 1, 2, 2, 1',
        helperText: 'Transfer penalties to switch from Line 2 to Line 1 (n-1 values).',
      },
      {
        name: 'e1',
        label: 'Entry Time Line 1 (e1)',
        type: 'number',
        defaultValue: 2,
        min: 0,
        max: 50,
      },
      {
        name: 'e2',
        label: 'Entry Time Line 2 (e2)',
        type: 'number',
        defaultValue: 4,
        min: 0,
        max: 50,
      },
      {
        name: 'x1',
        label: 'Exit Time Line 1 (x1)',
        type: 'number',
        defaultValue: 3,
        min: 0,
        max: 50,
      },
      {
        name: 'x2',
        label: 'Exit Time Line 2 (x2)',
        type: 'number',
        defaultValue: 2,
        min: 0,
        max: 50,
      },
    ],
    presets: [
      {
        name: 'Classic CLRS 6 Stations',
        description: 'Textbook 6-station problem with optimal time 35',
        data: {
          a1: [7, 9, 3, 4, 8, 4],
          a2: [8, 5, 6, 4, 5, 7],
          t1: [2, 3, 1, 3, 4],
          t2: [2, 1, 2, 2, 1],
          e1: 2,
          e2: 4,
          x1: 3,
          x2: 2,
        },
      },
      {
        name: '4-Station Fast Track',
        description: 'Shorter 4-station manufacturing line',
        data: {
          a1: [4, 5, 3, 2],
          a2: [2, 10, 1, 4],
          t1: [1, 2, 1],
          t2: [1, 1, 2],
          e1: 1,
          e2: 2,
          x1: 2,
          x2: 1,
        },
      },
      {
        name: 'High Transfer Penalties',
        description: 'Forcing cars to stay on single lanes',
        data: {
          a1: [3, 4, 3, 5, 3],
          a2: [5, 2, 4, 2, 6],
          t1: [10, 10, 10, 10],
          t2: [10, 10, 10, 10],
          e1: 2,
          e2: 3,
          x1: 1,
          x2: 2,
        },
      },
    ],
    generateRandomInput: () => {
      const n = 5;
      const a1 = Array.from({ length: n }, () => Math.floor(Math.random() * 8) + 2);
      const a2 = Array.from({ length: n }, () => Math.floor(Math.random() * 8) + 2);
      const t1 = Array.from({ length: n - 1 }, () => Math.floor(Math.random() * 4) + 1);
      const t2 = Array.from({ length: n - 1 }, () => Math.floor(Math.random() * 4) + 1);
      return {
        a1,
        a2,
        t1,
        t2,
        e1: Math.floor(Math.random() * 4) + 1,
        e2: Math.floor(Math.random() * 4) + 1,
        x1: Math.floor(Math.random() * 4) + 1,
        x2: Math.floor(Math.random() * 4) + 1,
      };
    },
    stepGenerator: assemblyLineSchedulingSteps,
  },

  // Module 2: Dynamic Programming — Travelling Salesman Problem
  {
    id: 'tsp',
    module: 2,
    moduleName: 'Module 2: Dynamic Programming',
    name: 'Travelling Salesman Problem (Held-Karp DP)',
    paradigm: 'Dynamic Programming',
    complexity: {
      timeBest: 'O(n² · 2ⁿ)',
      timeAverage: 'O(n² · 2ⁿ)',
      timeWorst: 'O(n² · 2ⁿ)',
      spaceWorst: 'O(n · 2ⁿ)',
      description: 'Held-Karp dynamic programming memoizing subproblems indexed by (subset S, ending city j)',
    },
    problemStatement:
      'Given a list of cities and pairwise travel costs, find the minimum-weight Hamiltonian cycle that visits every city exactly once and returns to the origin.',
    explanation:
      'The Held-Karp algorithm uses dynamic programming with bitmask state compression. DP[S, j] stores the minimum cost of a path visiting all cities in subset S and ending at city j. Optimal subproblems are built bottom-up by subset size |S| = 2 to n, before closing the cycle back to start city 0 and backtracking the optimal tour.',
    pseudocode: [
      'function TSP_HeldKarp(costMatrix, n):',
      '  DP[{startCity}, startCity] = 0  // Base case: starting city at zero cost',
      '  for subsetSize = 2 to n:  // Iterate over increasing subset sizes',
      '    for each subset S containing startCity with |S| = subsetSize:',
      '      for each city j in S (j != startCity):',
      '        // Find predecessor i minimizing path cost to j',
      '        DP[S, j] = min_{i in S, i != j} (DP[S \\ {j}, i] + cost[i][j])',
      '  // Close tour: add return edge cost from last city back to startCity',
      '  minTourCost = min_{j != startCity} (DP[allCities, j] + cost[j][startCity])',
      '  optimalTour = reconstructTour(parentPointers, winningLastCity)',
      '  return (minTourCost, optimalTour)  // Return optimal cycle and minimum weight',
    ],
    visualizer: 'TspVisualizer',
    inputSchema: [
      {
        name: 'numCities',
        label: 'Number of Cities (3–6)',
        type: 'number',
        defaultValue: 4,
        min: 3,
        max: 6,
        helperText: 'Number of vertices in the TSP graph (capped at 6 for interactive visualization).',
      },
      {
        name: 'costMatrix',
        label: 'City Distance Matrix',
        type: 'matrix',
        defaultValue: [
          [0, 10, 15, 20],
          [10, 0, 35, 25],
          [15, 35, 0, 30],
          [20, 25, 30, 0],
        ],
        helperText: 'Symmetric travel distances between cities. Diagonal is fixed at 0.',
      },
    ],
    presets: [
      {
        name: 'Classic 4-City Textbook',
        description: 'Standard 4-city symmetric problem with optimal tour cost 80',
        data: {
          costMatrix: [
            [0, 10, 15, 20],
            [10, 0, 35, 25],
            [15, 35, 0, 30],
            [20, 25, 30, 0],
          ],
          cityNames: ['A', 'B', 'C', 'D'],
          numCities: 4,
        },
      },
      {
        name: '3-City Triangle',
        description: 'Simple 3-node cyclic tour with cost 21',
        data: {
          costMatrix: [
            [0, 5, 10],
            [5, 0, 6],
            [10, 6, 0],
          ],
          cityNames: ['A', 'B', 'C'],
          numCities: 3,
        },
      },
      {
        name: '5-City Metro Network',
        description: '5-city interconnected metropolitan route',
        data: {
          costMatrix: [
            [0, 12, 10, 19, 8],
            [12, 0, 3, 7, 6],
            [10, 3, 0, 2, 20],
            [19, 7, 2, 0, 4],
            [8, 6, 20, 4, 0],
          ],
          cityNames: ['A', 'B', 'C', 'D', 'E'],
          numCities: 5,
        },
      },
    ],
    generateRandomInput: () => {
      const n = 4;
      const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const cost = Math.floor(Math.random() * 25) + 5;
          matrix[i][j] = cost;
          matrix[j][i] = cost;
        }
      }
      return { costMatrix: matrix, cityNames: ['A', 'B', 'C', 'D'], numCities: n };
    },
    stepGenerator: tspSteps,
  },

  // Module 2: Backtracking — N-Queens
  {
    id: 'n-queens',
    module: 2,
    moduleName: 'Module 2: Backtracking',
    name: 'N-Queens Problem',
    paradigm: 'Backtracking',
    complexity: {
      timeWorst: 'O(N!)',
      spaceWorst: 'O(N)',
      description: 'Systematic constraint search with pruning',
    },
    problemStatement:
      'Place N non-attacking queens on an N×N chessboard so that no two queens share the same row, column, or diagonal.',
    explanation:
      'Places queens row by row. If a placement violates column or diagonal constraints, the algorithm immediately backtracks to try another column position.',
    pseudocode: [
      'function SolveNQueens(row, N, board):',
      '  if row == N: recordSolution(board); return  // Base case: all N queens placed safely',
      '  for col = 0 to N - 1:  // Try placing queen in each column of current row',
      '    if isSafe(board, row, col):  // Check row, column, and diagonal constraints',
      '      board[row] = col  // Tentatively place queen at (row, col)',
      '      SolveNQueens(row + 1, N, board)  // Recursive call: advance to next row',
      '      board[row] = -1  // Backtrack: remove queen and try next column',
      '  return  // Exhausted all columns for this row',
    ],
    visualizer: 'BoardVisualizer',
    inputSchema: [
      {
        name: 'n',
        label: 'Board Size (N)',
        type: 'number',
        defaultValue: 4,
        min: 4,
        max: 8,
        helperText: 'Size between 4 and 8 recommended for real-time visualization.',
      },
    ],
    presets: [
      { name: '4-Queens (2 Solutions)', data: { n: 4 } },
      { name: '5-Queens (10 Solutions)', data: { n: 5 } },
      { name: '6-Queens (4 Solutions)', data: { n: 6 } },
      { name: '8-Queens (92 Solutions)', data: { n: 8 } },
    ],
    generateRandomInput: () => {
      const sizes = [4, 5, 6];
      return { n: sizes[Math.floor(Math.random() * sizes.length)] };
    },
    stepGenerator: nQueensSteps,
  },

  // Module 2: Branch & Bound — 0-1 Knapsack (B&B)
  {
    id: 'knapsack-bb',
    module: 2,
    moduleName: 'Module 2: Branch & Bound',
    name: '0-1 Knapsack (Branch & Bound)',
    paradigm: 'Branch & Bound',
    complexity: {
      timeWorst: 'O(2ⁿ)',
      spaceWorst: 'O(2ⁿ)',
      description: 'State-space tree with fractional knapsack bounding',
    },
    problemStatement:
      'Solve 0-1 Knapsack by exploring a state-space decision tree, computing optimistic upper bounds to prune subtrees that cannot beat the current best solution.',
    explanation:
      'Sorts items by value/weight ratio. Calculates an upper bound at each node via fractional knapsack on remaining capacity. Explores promising nodes first (Best-First search) and prunes branches whose bound ≤ best known value.',
    pseudocode: [
      'function KnapsackBB(items, W):',
      '  sort items by (value / weight) descending  // Order by greedy efficiency',
      '  Q = PriorityQueueByBound()  // Max-heap prioritizing highest upper bound',
      '  insert(Q, Root(level=0, weight=0, value=0, bound=calcBound(0, 0, 0)))',
      '  while Q is not empty:  // Explore most promising state first',
      '    node = extractMax(Q)',
      '    if node.bound <= bestValue: prune(node); continue  // Prune unpromising branch',
      '    // Branch 1: Include item[level]',
      '    if inclWeight <= W and inclValue > bestValue: bestValue = inclValue  // Feasible new best',
      '    if inclWeight > W or leftBound <= bestValue: prune(LeftChild)  // Infeasible or bounded',
      '    // Branch 2: Exclude item[level]',
      '    if rightBound <= bestValue: prune(RightChild)  // Prune right child if bound too low',
      '  return (bestValue, bestItems)  // Optimal 0-1 subset found',
    ],
    visualizer: 'TreeVisualizer',
    inputSchema: [
      {
        name: 'weights',
        label: 'Weights (comma-separated)',
        type: 'array',
        defaultValue: [2, 3, 4, 5],
      },
      {
        name: 'values',
        label: 'Values (comma-separated)',
        type: 'array',
        defaultValue: [3, 4, 5, 6],
      },
      {
        name: 'capacity',
        label: 'Knapsack Capacity (W)',
        type: 'number',
        defaultValue: 5,
        min: 1,
        max: 20,
      },
    ],
    presets: [
      { name: '4 Items (Cap 5)', data: { weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 5 } },
      { name: '4 Items High Prune (Cap 10)', data: { weights: [4, 7, 5, 3], values: [40, 42, 25, 12], capacity: 10 } },
    ],
    generateRandomInput: () => {
      const n = 4;
      const weights = Array.from({ length: n }, () => Math.floor(Math.random() * 4) + 1);
      const values = Array.from({ length: n }, () => Math.floor(Math.random() * 15) + 5);
      const capacity = Math.floor(Math.random() * 5) + 5;
      return { weights, values, capacity };
    },
    stepGenerator: knapsackBBSteps,
  },

  // Module 3: String Matching — Naive / Brute-Force Algorithm
  {
    id: 'naive-string-match',
    module: 3,
    moduleName: 'Module 3: String Matching',
    name: 'Naive (Brute-Force) String Matching',
    paradigm: 'String Matching',
    complexity: {
      timeBest: 'O(n)',
      timeAverage: 'O(n · m)',
      timeWorst: 'O((n − m + 1) · m)',
      spaceWorst: 'O(1)',
      description: 'Checks every text alignment; no preprocessing',
    },
    problemStatement:
      'Find all occurrences of a pattern P of length m in a text T of length n by testing every possible alignment of P against T.',
    explanation:
      'Slides the pattern across the text one position at a time. At each shift s it compares the pattern against the aligned window T[s..s+m-1] character by character, abandoning the alignment on the first mismatch. Simple and preprocessing-free, but repeats comparisons — worst case (n−m+1)·m.',
    pseudocode: [
      'function NaiveStringMatch(text, pattern):',
      '  textLength = length(text)',
      '  patternLength = length(pattern)',
      '  for shift = 0 to (textLength - patternLength): // Test each alignment window',
      '    matchFound = true',
      '    for patternIndex = 0 to (patternLength - 1): // Compare characters sequentially',
      '      if text[shift + patternIndex] != pattern[patternIndex]:',
      '        matchFound = false // Character mismatch detected',
      '        break // Abandon alignment and slide window',
      '    if matchFound == true:',
      '      recordMatch(shift) // All pattern characters matched window',
      '  return matchedIndices',
    ],
    visualizer: 'StringMatchVisualizer',
    inputSchema: [
      {
        name: 'text',
        label: 'Target Text (T)',
        type: 'text',
        defaultValue: 'ABABDABACDABABCABAB',
        placeholder: 'e.g. ABABDABACDABABCABAB',
      },
      {
        name: 'pattern',
        label: 'Pattern String (P)',
        type: 'text',
        defaultValue: 'ABABCABAB',
        placeholder: 'e.g. ABABCABAB',
      },
    ],
    presets: [
      { name: 'Textbook Example', data: { text: 'ABABDABACDABABCABAB', pattern: 'ABABCABAB' } },
      { name: 'Multiple Overlapping', data: { text: 'AABAACAADAABAABA', pattern: 'AABA' } },
      { name: 'Repeated Characters', data: { text: 'AAAAABAAABA', pattern: 'AAAA' } },
    ],
    generateRandomInput: () => {
      return {
        text: 'AABABBAABABAAABABBA',
        pattern: 'AABAB',
      };
    },
    stepGenerator: naiveStringMatchSteps,
  },

  // Module 3: String Matching — KMP Algorithm
  {
    id: 'kmp',
    module: 3,
    moduleName: 'Module 3: String Matching',
    name: 'Knuth-Morris-Pratt (KMP) Algorithm',
    paradigm: 'String Matching',
    complexity: {
      timeAverage: 'O(m + n)',
      timeWorst: 'O(m + n)',
      spaceWorst: 'O(m)',
      description: 'Zero backtrack in text via LPS array',
    },
    problemStatement:
      'Find all occurrences of a pattern P of length m in a text T of length n in linear time without rolling back the text pointer.',
    explanation:
      'Precomputes a Longest Proper Prefix which is also Suffix (LPS) table in O(m) time. When a mismatch occurs during search, uses LPS to slide the pattern to the next potential alignment position.',
    pseudocode: [
      'function computeLPS(pattern):',
      '  patternLength = length(pattern)',
      '  lpsTable = array of zeros of size patternLength',
      '  longestPrefixLength = 0',
      '  currentIndex = 1',
      '  while currentIndex < patternLength:',
      '    if pattern[currentIndex] == pattern[longestPrefixLength]:',
      '      longestPrefixLength = longestPrefixLength + 1',
      '      lpsTable[currentIndex] = longestPrefixLength',
      '      currentIndex = currentIndex + 1',
      '    else:',
      '      if longestPrefixLength != 0:',
      '        longestPrefixLength = lpsTable[longestPrefixLength - 1] // Fall back to prior prefix',
      '      else:',
      '        lpsTable[currentIndex] = 0',
      '        currentIndex = currentIndex + 1',
      '  return lpsTable',
      '',
      'function KMP_Search(text, pattern):',
      '  lpsTable = computeLPS(pattern) // Phase 1: Build LPS prefix-suffix table',
      '  textIndex = 0',
      '  patternIndex = 0',
      '  while textIndex < length(text): // Phase 2: Scan text without backtracking',
      '    if pattern[patternIndex] == text[textIndex]:',
      '      textIndex = textIndex + 1',
      '      patternIndex = patternIndex + 1',
      '    if patternIndex == length(pattern):',
      '      recordMatch(textIndex - patternIndex) // Full pattern matched',
      '      patternIndex = lpsTable[patternIndex - 1] // Shift pattern via LPS fallback',
      '    else if textIndex < length(text) and pattern[patternIndex] != text[textIndex]:',
      '      if patternIndex != 0:',
      '        patternIndex = lpsTable[patternIndex - 1] // Shift pattern without moving text pointer',
      '      else:',
      '        textIndex = textIndex + 1 // Advance text pointer',
      '  return matchIndices',
    ],
    visualizer: 'StringMatchVisualizer',
    inputSchema: [
      {
        name: 'text',
        label: 'Target Text (T)',
        type: 'text',
        defaultValue: 'ABABDABACDABABCABAB',
        placeholder: 'e.g. ABABDABACDABABCABAB',
      },
      {
        name: 'pattern',
        label: 'Pattern String (P)',
        type: 'text',
        defaultValue: 'ABABCABAB',
        placeholder: 'e.g. ABABCABAB',
      },
    ],
    presets: [
      { name: 'Textbook Example', data: { text: 'ABABDABACDABABCABAB', pattern: 'ABABCABAB' } },
      { name: 'Multiple Overlapping', data: { text: 'AABAACAADAABAABA', pattern: 'AABA' } },
      { name: 'Repeated Characters', data: { text: 'AAAAABAAABA', pattern: 'AAAA' } },
    ],
    generateRandomInput: () => {
      return {
        text: 'AABABBAABABAAABABBA',
        pattern: 'AABAB',
      };
    },
    stepGenerator: kmpSteps,
  },

  // Module 3: String Matching — Rabin-Karp Algorithm
  {
    id: 'rabin-karp',
    module: 3,
    moduleName: 'Module 3: String Matching',
    name: 'Rabin-Karp Algorithm',
    paradigm: 'String Matching',
    complexity: {
      timeBest: 'O(n + m)',
      timeAverage: 'O(n + m)',
      timeWorst: 'O((n − m + 1) · m)',
      spaceWorst: 'O(1)',
      description: 'Rolling hash filters alignments; verify only on a hash hit',
    },
    problemStatement:
      'Find all occurrences of a pattern P of length m in a text T of length n by comparing a rolling hash of each text window against the hash of the pattern.',
    explanation:
      'Hashes the pattern and the first text window in O(m). Each subsequent window hash is derived from the previous one in O(1) by removing the leading character and appending the next (a "rolling" hash). Only when a window hash equals the pattern hash is a full character comparison performed, which rules out spurious hits (hash collisions). Expected linear time; worst case degrades to the naive bound when every window collides.',
    pseudocode: [
      'function RabinKarp(text, pattern, baseRadix = 256, primeModulus = 101):',
      '  patternLength = length(pattern)',
      '  textLength = length(text)',
      '  highOrderWeight = (baseRadix ^ (patternLength - 1)) mod primeModulus',
      '  patternHash = computeHash(pattern, patternLength, baseRadix, primeModulus)',
      '  windowHash = computeHash(text[0 .. patternLength - 1], patternLength, baseRadix, primeModulus)',
      '  for shift = 0 to (textLength - patternLength):',
      '    if windowHash == patternHash: // Candidate match found via hash equality',
      '      if verifyCharacters(text, shift, pattern): // Check character by character',
      '        recordMatch(shift) // Confirmed true occurrence',
      '      else:',
      '        recordSpuriousHit(shift) // False positive: hash collision',
      '    if shift < (textLength - patternLength):',
      '      windowHash = rollHash(windowHash, text[shift], text[shift + patternLength], highOrderWeight)',
      '  return matchedIndices',
    ],
    visualizer: 'StringMatchVisualizer',
    inputSchema: [
      {
        name: 'text',
        label: 'Target Text (T)',
        type: 'text',
        defaultValue: 'ABABDABACDABABCABAB',
        placeholder: 'e.g. ABABDABACDABABCABAB',
      },
      {
        name: 'pattern',
        label: 'Pattern String (P)',
        type: 'text',
        defaultValue: 'ABABCABAB',
        placeholder: 'e.g. ABABCABAB',
      },
    ],
    presets: [
      { name: 'Textbook Example', data: { text: 'ABABDABACDABABCABAB', pattern: 'ABABCABAB' } },
      { name: 'Multiple Overlapping', data: { text: 'AABAACAADAABAABA', pattern: 'AABA' } },
      { name: 'Numeric Pattern', data: { text: '3141592653589793', pattern: '26' } },
    ],
    generateRandomInput: () => {
      return {
        text: 'AABABBAABABAAABABBA',
        pattern: 'AABAB',
      };
    },
    stepGenerator: rabinKarpSteps,
  },

  // Module 3: String Matching — Suffix Tree (Ukkonen)
  {
    id: 'suffix-tree',
    module: 3,
    moduleName: 'Module 3: String Matching',
    name: 'Suffix Tree String Matching (Ukkonen)',
    paradigm: 'String Matching',
    complexity: {
      timeBest: 'O(n) build',
      timeAverage: 'O(n + m + z)',
      timeWorst: 'O(n + m + z)',
      spaceWorst: 'O(n)',
      description: "Ukkonen O(n) construction; each query O(m + occ)",
    },
    problemStatement:
      'Preprocess the text T (length n) into a suffix tree so that every occurrence of any pattern P (length m) can be reported in O(m + z), where z is the number of occurrences.',
    explanation:
      "Ukkonen's algorithm builds the suffix tree online in linear time using an active point (node, edge, length), a global leaf end, suffix links and the skip/count trick — applying extension rules 1–3 once per phase. Each root-to-leaf path spells a suffix of T$, and every leaf label is a suffix start index. Matching walks P down from the root; if P is fully consumed, every leaf beneath the stopping point is an occurrence.",
    pseudocode: [
      'function SuffixTreeMatch(text, pattern):',
      '  terminalText = text + "$"',
      '  tree = buildUkkonenSuffixTree(terminalText) // O(n) online construction',
      '    for each phase i (insert terminalText[i]):',
      '      Rule 1: extend existing leaf edges via global leaf end',
      '      Rule 2: create new leaf branch (split internal edge if required)',
      '      Rule 3: character already present -> terminate current phase',
      '  currentNode = root',
      '  patternIndex = 0',
      '  while patternIndex < length(pattern):',
      '    match next character along edge; return empty on mismatch',
      '  collect suffix indices of all leaves beneath search stopping point',
      '  return sortedMatchIndices',
    ],
    visualizer: 'TreeVisualizer',
    inputSchema: [
      {
        name: 'text',
        label: 'Target Text (T)',
        type: 'text',
        defaultValue: 'BANANA',
        placeholder: 'e.g. BANANA',
      },
      {
        name: 'pattern',
        label: 'Pattern String (P)',
        type: 'text',
        defaultValue: 'ANA',
        placeholder: 'e.g. ANA',
      },
    ],
    presets: [
      { name: 'Classic BANANA', data: { text: 'BANANA', pattern: 'ANA' } },
      { name: 'Multiple Overlapping', data: { text: 'AABAACAADAABAABA', pattern: 'AABA' } },
      { name: 'Pattern Absent', data: { text: 'ABABDABACDABAB', pattern: 'XYZ' } },
    ],
    generateRandomInput: () => ({ text: 'MISSISSIPPI', pattern: 'ISSI' }),
    stepGenerator: suffixTreeSteps,
  },

  // Module 4: Graph / Shortest Path — Floyd-Warshall
  {
    id: 'floyd-warshall',
    module: 4,
    moduleName: 'Module 4: Graph Algorithms',
    name: 'Floyd-Warshall (All-Pairs Shortest Path)',
    paradigm: 'Graph',
    complexity: {
      timeAverage: 'O(V³)',
      timeWorst: 'O(V³)',
      spaceWorst: 'O(V²)',
      description: 'Triply nested dynamic programming matrix updates',
    },
    problemStatement:
      'Compute the shortest path distances between every pair of vertices in a directed, weighted graph (which may contain negative edge weights but no negative cycles).',
    explanation:
      'Iteratively updates shortest distance estimates between all pairs (i, j) by testing if routing through an intermediate vertex k improves the path: D[i][j] = min(D[i][j], D[i][k] + D[k][j]).',
    pseudocode: [
      'function FloydWarshall(V, weightMatrix):',
      '  dist = copy(weightMatrix)  // Initialize distance matrix with direct edge weights',
      '  for k = 0 to V - 1:  // Iterate through all possible intermediate pivot vertices',
      '    for i = 0 to V - 1:  // Consider all source vertices',
      '      for j = 0 to V - 1:  // Consider all destination vertices',
      '        // Relax path (i -> j) if routing through intermediate k is shorter',
      '        if dist[i][k] + dist[k][j] < dist[i][j]:',
      '          dist[i][j] = dist[i][k] + dist[k][j]',
      '  return dist  // All-pairs shortest path matrix computed',
    ],
    visualizer: 'GraphVisualizer',
    inputSchema: [
      {
        name: 'numNodes',
        label: 'Number of Nodes (3–5)',
        type: 'number',
        defaultValue: 4,
        min: 3,
        max: 5,
      },
    ],
    presets: [
      {
        name: 'Textbook 4-Node Graph',
        data: {
          matrix: [
            [0, 5, null, 10],
            [null, 0, 3, null],
            [null, null, 0, 1],
            [null, null, null, 0],
          ],
        },
      },
      {
        name: '5-Node Graph with Negatives',
        data: {
          matrix: [
            [0, 3, 8, null, -4],
            [null, 0, null, 1, 7],
            [null, 4, 0, null, null],
            [2, null, -5, 0, null],
            [null, null, null, 6, 0],
          ],
        },
      },
    ],
    generateRandomInput: () => {
      return {
        matrix: [
          [0, 4, 11, null],
          [null, 0, 2, 7],
          [null, null, 0, 3],
          [6, null, null, 0],
        ],
      };
    },
    stepGenerator: floydWarshallSteps,
  },

  // Module 4: Graph / Shortest Path — Bellman-Ford
  {
    id: 'bellman-ford',
    module: 4,
    moduleName: 'Module 4: Graph Algorithms',
    name: 'Bellman-Ford (Single-Source Shortest Path)',
    paradigm: 'Graph',
    complexity: {
      timeBest: 'O(V + E)',
      timeAverage: 'O(V · E)',
      timeWorst: 'O(V · E)',
      spaceWorst: 'O(V)',
      description: 'Relax every edge V−1 times; handles negative weights',
    },
    problemStatement:
      'Compute the shortest-path distance from a single source vertex to every other vertex in a directed, weighted graph that may contain negative edge weights, and report whether a negative-weight cycle is reachable from the source.',
    explanation:
      'Initializes the source distance to 0 and all others to ∞, then relaxes every edge V−1 times: a shortest path visits at most V−1 edges, so after V−1 passes all distances are final. One extra pass over the edges detects a reachable negative-weight cycle — if any edge can still be relaxed, no shortest path exists.',
    pseudocode: [
      'function BellmanFord(V, E, weight, source):',
      '  dist[source] = 0; dist[v] = ∞ for all v ≠ source  // Initialize single-source distances',
      '  for pass = 1 to |V| - 1:  // Relax all edges |V| - 1 times',
      '    for each edge (u, v) in E:  // Consider each directed edge',
      '      if dist[u] + weight(u, v) < dist[v]:  // Check relaxation condition',
      '        dist[v] = dist[u] + weight(u, v); pred[v] = u  // Relax distance and update predecessor',
      '  for each edge (u, v) in E:  // Verification pass to detect negative-weight cycles',
      '    if dist[u] + weight(u, v) < dist[v]: report NEGATIVE_CYCLE  // Negative cycle detected!',
      '  return (dist, pred)  // Shortest path distances and predecessor tree',
    ],
    visualizer: 'GraphVisualizer',
    inputSchema: [
      {
        name: 'source',
        label: 'Source Node Index (0-based)',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 4,
      },
    ],
    presets: [
      {
        name: 'CLRS Textbook (S, T, X, Y, Z)',
        data: {
          source: 0,
          nodeLabels: ['S', 'T', 'X', 'Y', 'Z'],
          matrix: [
            [0, 6, null, 7, null],
            [null, 0, 5, 8, -4],
            [null, -2, 0, null, null],
            [null, null, -3, 0, 9],
            [2, null, 7, null, 0],
          ],
        },
      },
      {
        name: 'Negative Cycle (B → C → D → B)',
        data: {
          source: 0,
          nodeLabels: ['A', 'B', 'C', 'D'],
          matrix: [
            [0, 1, null, null],
            [null, 0, 2, null],
            [null, null, 0, 3],
            [null, -6, null, 0],
          ],
        },
      },
      {
        name: 'Simple DAG (no negatives)',
        data: {
          source: 0,
          nodeLabels: ['A', 'B', 'C', 'D'],
          matrix: [
            [0, 4, 5, null],
            [null, 0, null, 3],
            [null, -2, 0, 4],
            [null, null, null, 0],
          ],
        },
      },
    ],
    generateRandomInput: () => ({
      source: 0,
      nodeLabels: ['S', 'T', 'X', 'Y', 'Z'],
      matrix: [
        [0, 6, null, 7, null],
        [null, 0, 5, 8, -4],
        [null, -2, 0, null, null],
        [null, null, -3, 0, 9],
        [2, null, 7, null, 0],
      ],
    }),
    stepGenerator: bellmanFordSteps,
  },

  // Module 4: Network Flow — Ford-Fulkerson
  {
    id: 'ford-fulkerson',
    module: 4,
    moduleName: 'Module 4: Network Flow',
    name: 'Ford-Fulkerson (Edmonds-Karp Max Flow)',
    paradigm: 'Max Flow',
    complexity: {
      timeAverage: 'O(V · E²)',
      timeWorst: 'O(V · E²)',
      spaceWorst: 'O(V + E)',
      description: 'Edmonds-Karp BFS augmenting paths',
    },
    problemStatement:
      'Compute the maximum feasible flow from a source vertex s to a sink vertex t in a directed flow network with edge capacity constraints.',
    explanation:
      'Uses BFS to find augmenting paths from s to t in the residual network (Edmonds-Karp). Finds the bottleneck capacity along each path, pushes flow, and updates forward/backward residual capacities until no augmenting path remains.',
    pseudocode: [
      'function EdmondsKarp(s, t, capacities):',
      '  flow = 0; residual = copy(capacities)  // Initialize zero flow and residual capacities',
      '  while (path = BFS_AugmentingPath(s, t, residual)) exists:  // Find shortest path in residual graph',
      '    bottleneck = minResidualCapacityAlong(path)  // Find maximum pushable flow delta',
      '    for each edge (u, v) in path:  // Push flow along augmenting path',
      '      residual[u][v] -= bottleneck  // Reduce forward residual capacity',
      '      residual[v][u] += bottleneck  // Increase backward residual capacity',
      '    flow += bottleneck  // Accumulate total network flow',
      '  return flow  // Maximum s-t flow achieved (no more augmenting paths)',
    ],
    visualizer: 'GraphVisualizer',
    inputSchema: [
      {
        name: 'source',
        label: 'Source Node Index',
        type: 'number',
        defaultValue: 0,
      },
      {
        name: 'sink',
        label: 'Sink Node Index',
        type: 'number',
        defaultValue: 5,
      },
    ],
    presets: [
      {
        name: 'Classic 6-Node Network (Max Flow = 23)',
        data: {
          capacities: [
            [0, 16, 13, 0, 0, 0],
            [0, 0, 10, 12, 0, 0],
            [0, 4, 0, 0, 14, 0],
            [0, 0, 9, 0, 0, 20],
            [0, 0, 0, 7, 0, 4],
            [0, 0, 0, 0, 0, 0],
          ],
          source: 0,
          sink: 5,
          nodeLabels: ['S', 'A', 'B', 'C', 'D', 'T'],
        },
      },
      {
        name: 'Simple 4-Node Network',
        data: {
          capacities: [
            [0, 10, 10, 0],
            [0, 0, 2, 8],
            [0, 0, 0, 9],
            [0, 0, 0, 0],
          ],
          source: 0,
          sink: 3,
          nodeLabels: ['S', 'A', 'B', 'T'],
        },
      },
    ],
    generateRandomInput: () => {
      return {
        capacities: [
          [0, 10, 10, 0],
          [0, 0, 2, 8],
          [0, 0, 0, 9],
          [0, 0, 0, 0],
        ],
        source: 0,
        sink: 3,
        nodeLabels: ['S', 'A', 'B', 'T'],
      };
    },
    stepGenerator: fordFulkersonSteps,
  },

  // Module 4: Graph — Edmonds-Karp (BFS Max Flow)
  {
    id: 'edmonds-karp',
    module: 4,
    moduleName: 'Module 4: Graph Algorithms & Network Flow',
    name: 'Edmonds-Karp (BFS Maximum Flow)',
    paradigm: 'Max Flow',
    complexity: {
      timeBest: 'O(V · E²)',
      timeAverage: 'O(V · E²)',
      timeWorst: 'O(V · E²)',
      spaceWorst: 'O(V + E)',
      description: 'Polynomial time bound by finding the shortest augmenting path using BFS',
    },
    problemStatement:
      'Compute the maximum feasible flow from source S to sink T through a directed capacity network using Edmonds-Karp with explicit breadth-first search path discovery.',
    explanation:
      'Edmonds-Karp is an explicit BFS implementation of the Ford-Fulkerson method. By always choosing the augmenting path with the fewest edges, it guarantees termination in polynomial O(V · E²) time, completely avoiding infinite loops with irrational capacities.',
    pseudocode: [
      'function EdmondsKarp(network, source s, sink t):',
      '  initialize flow = 0 for all edges  // Empty initial flow assignment',
      '  while (path = BFS_ShortestPath(residualNetwork, s, t)) exists:  // Breadth-First Search',
      '    bottleneck = min_capacity_along(path)  // Find bottleneck residual capacity',
      '    for each edge (u, v) in path:  // Augment along shortest path',
      '      flow[u][v] += bottleneck; flow[v][u] -= bottleneck  // Update residual network',
      '  return totalFlow  // Max flow achieved in at most O(V · E) augmentations',
    ],
    visualizer: 'GraphVisualizer',
    inputSchema: [
      {
        name: 'capacities',
        label: 'Flow Network Topologies',
        type: 'select',
        defaultValue: 'classic6',
        options: [
          { label: 'Classic 6-Node Network (Max Flow = 23)', value: 'classic6' },
          { label: '4-Node Diamond Network (Max Flow = 17)', value: 'diamond4' },
        ],
      },
    ],
    presets: [
      {
        name: 'Classic 6-Node Network (Max Flow = 23)',
        description: 'Standard CLRS 6-node flow network with capacity bottleneck 23',
        data: {
          capacities: [
            [0, 16, 13, 0, 0, 0],
            [0, 0, 10, 12, 0, 0],
            [0, 4, 0, 0, 14, 0],
            [0, 0, 9, 0, 0, 20],
            [0, 0, 0, 7, 0, 4],
            [0, 0, 0, 0, 0, 0],
          ],
          source: 0,
          sink: 5,
          nodeLabels: ['S', 'A', 'B', 'C', 'D', 'T'],
        },
      },
      {
        name: 'Simple 4-Node Diamond (Max Flow = 17)',
        description: '4-node network with two parallel paths and cross edge',
        data: {
          capacities: [
            [0, 10, 10, 0],
            [0, 0, 2, 8],
            [0, 0, 0, 9],
            [0, 0, 0, 0],
          ],
          source: 0,
          sink: 3,
          nodeLabels: ['S', 'A', 'B', 'T'],
        },
      },
    ],
    generateRandomInput: () => {
      return {
        capacities: [
          [0, 16, 13, 0, 0, 0],
          [0, 0, 10, 12, 0, 0],
          [0, 4, 0, 0, 14, 0],
          [0, 0, 9, 0, 0, 20],
          [0, 0, 0, 7, 0, 4],
          [0, 0, 0, 0, 0, 0],
        ],
        source: 0,
        sink: 5,
        nodeLabels: ['S', 'A', 'B', 'C', 'D', 'T'],
      };
    },
    stepGenerator: edmondsKarpSteps,
  },

  // Module 4: Graph — Push-Relabel (Preflow-Push Max Flow)
  {
    id: 'push-relabel',
    module: 4,
    moduleName: 'Module 4: Graph Algorithms & Network Flow',
    name: 'Push-Relabel (Goldberg-Tarjan Max Flow)',
    paradigm: 'Max Flow',
    complexity: {
      timeBest: 'O(V² · E)',
      timeAverage: 'O(V² · E)',
      timeWorst: 'O(V² · E)',
      spaceWorst: 'O(V + E)',
      description: 'Preflow-push algorithm running in O(V²E) time, superior to Ford-Fulkerson on dense networks',
    },
    problemStatement:
      'Compute maximum feasible flow from source S to sink T using localized push and relabel operations on an active preflow network.',
    explanation:
      'Unlike augmenting path algorithms that push flow along entire paths from source to sink at once, Goldberg-Tarjan’s Push-Relabel operates locally. It maintains a preflow where excess flow accumulates at internal vertices, pushing flow downward along steep residual edges (height h(u) = h(v) + 1) and relabeling vertex heights whenever an overflowing vertex has no downward exit.',
    pseudocode: [
      'function PushRelabel(network, source s, sink t):',
      '  h[s] = |V|; h[v] = 0 for all v != s  // Source elevated to |V|; sink and others at 0',
      '  for each edge (s, v): preflowPush(s, v, c(s, v))  // Saturate source outgoing edges',
      '  while exists overflowing vertex u in V \\ {s, t} with e(u) > 0:  // Localized work',
      '    if exists residual neighbor v with h[u] == h[v] + 1:  // Admissible slope exists',
      '      push(u, v, min(e(u), c_f(u, v)))  // Push excess flow down to neighbor v',
      '    else:  // No downhill exit: vertex is trapped with excess',
      '      relabel(u): h[u] = 1 + min{h[v] | c_f(u, v) > 0}  // Raise height to permit future pushes',
      '  return e(t)  // Final accumulated excess at sink equals maximum flow',
    ],
    visualizer: 'GraphVisualizer',
    inputSchema: [
      {
        name: 'capacities',
        label: 'Network Capacities',
        type: 'select',
        defaultValue: 'classic6',
        options: [
          { label: 'Classic 6-Node Network (Max Flow = 23)', value: 'classic6' },
          { label: '4-Node Diamond Network (Max Flow = 17)', value: 'diamond4' },
        ],
      },
    ],
    presets: [
      {
        name: 'Classic 6-Node Network (Max Flow = 23)',
        description: 'Standard CLRS benchmark network with maximum flow 23',
        data: {
          capacities: [
            [0, 16, 13, 0, 0, 0],
            [0, 0, 10, 12, 0, 0],
            [0, 4, 0, 0, 14, 0],
            [0, 0, 9, 0, 0, 20],
            [0, 0, 0, 7, 0, 4],
            [0, 0, 0, 0, 0, 0],
          ],
          source: 0,
          sink: 5,
          nodeLabels: ['S', 'A', 'B', 'C', 'D', 'T'],
        },
      },
      {
        name: '4-Node Diamond (Max Flow = 17)',
        description: 'Diamond network with dual parallel routes',
        data: {
          capacities: [
            [0, 10, 10, 0],
            [0, 0, 2, 8],
            [0, 0, 0, 9],
            [0, 0, 0, 0],
          ],
          source: 0,
          sink: 3,
          nodeLabels: ['S', 'A', 'B', 'T'],
        },
      },
    ],
    generateRandomInput: () => {
      return {
        capacities: [
          [0, 16, 13, 0, 0, 0],
          [0, 0, 10, 12, 0, 0],
          [0, 4, 0, 0, 14, 0],
          [0, 0, 9, 0, 0, 20],
          [0, 0, 0, 7, 0, 4],
          [0, 0, 0, 0, 0, 0],
        ],
        source: 0,
        sink: 5,
        nodeLabels: ['S', 'A', 'B', 'C', 'D', 'T'],
      };
    },
    stepGenerator: pushRelabelSteps,
  },

  // Module 5: Geometric — Graham's Scan
  {
    id: 'graham-scan',
    module: 5,
    moduleName: 'Module 5: Computational Geometry',
    name: 'Graham’s Scan (2D Convex Hull)',
    paradigm: 'Geometric',
    complexity: {
      timeAverage: 'O(n log n)',
      timeWorst: 'O(n log n)',
      spaceWorst: 'O(n)',
      description: 'Polar angle sorting & linear stack scan',
    },
    problemStatement:
      'Compute the convex hull (smallest enclosing convex polygon) for a given set of n points in the 2D Cartesian plane.',
    explanation:
      'Finds the lowest y-coordinate anchor point P0. Sorts all other points by polar angle with P0. Iterates through points using a stack, popping vertices that make a clockwise (right) turn via cross-product orientation check.',
    pseudocode: [
      'function GrahamsScan(points):',
      '  P0 = findLowestPoint(points)  // Anchor pivot: lowest y-coordinate (tiebreaker: lowest x)',
      '  sorted = sortRemainingByPolarAngle(points, P0)  // Sort CCW by polar angle around P0',
      '  stack = [sorted[0], sorted[1], sorted[2]]  // Initialize hull stack with first 3 points',
      '  for i = 3 to length(sorted) - 1:  // Process remaining points sequentially',
      '    while length(stack) >= 2 and orientation(stack[-2], stack[-1], sorted[i]) <= 0:',
      '      pop(stack)  // Remove clockwise (right-turn) or collinear dent vertex',
      '    push(stack, sorted[i])  // Valid counter-clockwise left turn: add to hull',
      '  return stack  // Convex hull vertices in counter-clockwise boundary order',
    ],
    visualizer: 'PointCanvasVisualizer',
    inputSchema: [
      {
        name: 'points',
        label: '2D Points Array',
        type: 'points',
        defaultValue: [
          { x: 100, y: 100 },
          { x: 150, y: 250 },
          { x: 250, y: 300 },
          { x: 350, y: 220 },
          { x: 400, y: 120 },
          { x: 280, y: 180 },
          { x: 200, y: 150 },
          { x: 220, y: 80 },
        ],
      },
    ],
    presets: [
      {
        name: '8-Point Cloud',
        data: {
          points: [
            { x: 100, y: 100 },
            { x: 150, y: 250 },
            { x: 250, y: 300 },
            { x: 350, y: 220 },
            { x: 400, y: 120 },
            { x: 280, y: 180 },
            { x: 200, y: 150 },
            { x: 220, y: 80 },
          ],
        },
      },
      {
        name: 'Square with Interior Points (4 Corners Hull)',
        data: {
          points: [
            { x: 80, y: 80 },
            { x: 80, y: 320 },
            { x: 320, y: 320 },
            { x: 320, y: 80 },
            { x: 200, y: 200 },
            { x: 150, y: 150 },
          ],
        },
      },
    ],
    generateRandomInput: () => {
      const count = 7;
      const pts = Array.from({ length: count }, () => ({
        x: Math.floor(Math.random() * 320) + 60,
        y: Math.floor(Math.random() * 260) + 60,
      }));
      return { points: pts };
    },
    stepGenerator: grahamScanSteps,
  },

  // Module 5: Geometric — Jarvis' March (Gift Wrapping)
  {
    id: 'jarvis-march',
    module: 5,
    moduleName: 'Module 5: Computational Geometry',
    name: 'Jarvis’ March (Gift Wrapping)',
    paradigm: 'Geometric',
    complexity: {
      timeBest: 'O(n · h)',
      timeAverage: 'O(n · h)',
      timeWorst: 'O(n · h)',
      spaceWorst: 'O(h)',
      description: 'Output-sensitive O(nh) where h is the number of vertices on the convex hull',
    },
    problemStatement:
      'Compute the 2D convex hull of a point set by gift wrapping: start from the lowest point and repeatedly find the next hull point that forms the smallest counter-clockwise turn.',
    explanation:
      'Starting from the lowest-y anchor pivot, Jarvis’ March tests each point to find the most counter-clockwise candidate relative to the current hull point. It wraps around the exterior until returning to the start pivot.',
    pseudocode: [
      'function JarvisMarch(points):',
      '  pivot = findLowestPoint(points)  // Anchor: lowest y-coordinate (tiebreaker: lowest x)',
      '  hull = [pivot], current = pivot',
      '  repeat:  // Wrap around perimeter until returning to anchor pivot',
      '    nextPoint = selectInitialCandidate(points, current)  // Start with any other point',
      '    for each point in points:  // Find point with smallest CCW turn',
      '      if orientation(current, nextPoint, point) > 0: nextPoint = point  // Left turn updates candidate',
      '    hull.push(nextPoint); current = nextPoint  // Confirm hull vertex',
      '  until current == pivot  // Complete loop around perimeter',
      '  return hull  // Convex hull in counter-clockwise order',
    ],
    visualizer: 'PointCanvasVisualizer',
    inputSchema: [
      {
        name: 'points',
        label: '2D Points Array',
        type: 'points',
        defaultValue: [
          { x: 100, y: 100 },
          { x: 150, y: 250 },
          { x: 250, y: 300 },
          { x: 350, y: 220 },
          { x: 400, y: 120 },
          { x: 280, y: 180 },
          { x: 200, y: 150 },
          { x: 220, y: 80 },
        ],
      },
    ],
    presets: [
      {
        name: '8-Point Cloud',
        data: {
          points: [
            { x: 100, y: 100 },
            { x: 150, y: 250 },
            { x: 250, y: 300 },
            { x: 350, y: 220 },
            { x: 400, y: 120 },
            { x: 280, y: 180 },
            { x: 200, y: 150 },
            { x: 220, y: 80 },
          ],
        },
      },
      {
        name: 'Square with Interior Points (4 Corners Hull)',
        data: {
          points: [
            { x: 80, y: 80 },
            { x: 80, y: 320 },
            { x: 320, y: 320 },
            { x: 320, y: 80 },
            { x: 200, y: 200 },
            { x: 150, y: 150 },
          ],
        },
      },
      {
        name: 'Triangle with Interior Point',
        data: {
          points: [
            { x: 100, y: 80 },
            { x: 250, y: 320 },
            { x: 400, y: 80 },
            { x: 250, y: 160 },
          ],
        },
      },
    ],
    generateRandomInput: () => {
      const count = 7;
      const pts = Array.from({ length: count }, () => ({
        x: Math.floor(Math.random() * 320) + 60,
        y: Math.floor(Math.random() * 260) + 60,
      }));
      return { points: pts };
    },
    stepGenerator: jarvisMarchSteps,
  },

  // Module 5: Geometric — Line Segment Intersection (Sweep-Line)
  {
    id: 'line-segment-intersection',
    module: 5,
    moduleName: 'Module 5: Computational Geometry',
    name: 'Line Segment Intersection (Sweep-Line)',
    paradigm: 'Geometric',
    complexity: {
      timeBest: 'O(1)',
      timeAverage: 'O(n log n)',
      timeWorst: 'O(n log n)',
      spaceWorst: 'O(n)',
      description: 'O(n log n) sweep-line procedure detecting whether ANY pair of segments intersect',
    },
    problemStatement:
      'Given a collection of 2D line segments, determine whether any two segments intersect using a vertical sweep line moving left to right.',
    explanation:
      'The Bentley-Ottmann sweep-line paradigm sorts all segment endpoints by x-coordinate. As the sweep line moves left to right, segments currently cutting the sweep line are stored in an active status structure T ordered by y-coordinate. New segments are tested for intersection only with their immediate above/below neighbors in T, reducing naive O(n²) comparisons to O(n log n).',
    pseudocode: [
      'function AnySegmentsIntersect(segments):',
      '  events = sortEndpointsByX(segments)  // Event queue: left & right endpoints sorted by x',
      '  T = BalancedBinarySearchTree()  // Active status structure ordered by current y(x)',
      '  for each event in events:  // Sweep line advances left to right across plane',
      '    if event.type == LEFT_ENDPOINT:  // Segment starts: insert into active status',
      '      insert(T, event.segment)',
      '      if intersects(event.segment, above(T, event.segment)): return true  // Adjacent check',
      '      if intersects(event.segment, below(T, event.segment)): return true',
      '    else:  // RIGHT_ENDPOINT: segment ends: delete from active status',
      '      aboveSeg = above(T, event.segment); belowSeg = below(T, event.segment)',
      '      delete(T, event.segment)',
      '      if intersects(aboveSeg, belowSeg): return true  // Former neighbors are now adjacent',
      '  return false  // No intersecting pairs found across entire plane',
    ],
    visualizer: 'SweepLineVisualizer',
    inputSchema: [
      {
        name: 'segments',
        label: 'Line Segments Set',
        type: 'select',
        defaultValue: 'classic',
        options: [
          { label: 'Intersecting Pair (Classic)', value: 'classic' },
          { label: 'Non-Intersecting Parallel', value: 'parallel' },
          { label: 'Delayed Adjacency Intersection', value: 'delayed' },
        ],
      },
    ],
    presets: [
      {
        name: 'Intersecting Pair (Classic)',
        description: '4 segments with S1 and S2 crossing at an interior point',
        data: {
          segments: [
            { id: 'S1', label: 'S1', p1: { x: 50, y: 120 }, p2: { x: 280, y: 260 } },
            { id: 'S2', label: 'S2', p1: { x: 80, y: 300 }, p2: { x: 320, y: 80 } },
            { id: 'S3', label: 'S3', p1: { x: 200, y: 350 }, p2: { x: 420, y: 330 } },
            { id: 'S4', label: 'S4', p1: { x: 300, y: 150 }, p2: { x: 460, y: 220 } },
          ],
        },
      },
      {
        name: 'Non-Intersecting Parallel Segments',
        description: '3 horizontal parallel segments with zero intersections',
        data: {
          segments: [
            { id: 'S1', label: 'S1', p1: { x: 50, y: 100 }, p2: { x: 300, y: 100 } },
            { id: 'S2', label: 'S2', p1: { x: 50, y: 200 }, p2: { x: 300, y: 200 } },
            { id: 'S3', label: 'S3', p1: { x: 50, y: 300 }, p2: { x: 300, y: 300 } },
          ],
        },
      },
      {
        name: 'Delayed Adjacency Intersection',
        description: 'Segments become adjacent and intersect only after a middle segment ends',
        data: {
          segments: [
            { id: 'S1', label: 'S1', p1: { x: 50, y: 250 }, p2: { x: 450, y: 190 } },
            { id: 'S2', label: 'S2', p1: { x: 80, y: 200 }, p2: { x: 240, y: 200 } },
            { id: 'S3', label: 'S3', p1: { x: 50, y: 150 }, p2: { x: 450, y: 210 } },
          ],
        },
      },
    ],
    generateRandomInput: () => {
      const segs = [
        { id: 'S1', label: 'S1', p1: { x: 50, y: 120 }, p2: { x: 280, y: 260 } },
        { id: 'S2', label: 'S2', p1: { x: 80, y: 300 }, p2: { x: 320, y: 80 } },
        { id: 'S3', label: 'S3', p1: { x: 200, y: 350 }, p2: { x: 420, y: 330 } },
        { id: 'S4', label: 'S4', p1: { x: 300, y: 150 }, p2: { x: 460, y: 220 } },
      ];
      return { segments: segs };
    },
    stepGenerator: lineSegmentIntersectionSteps,
  },

  // Module 6: Randomized — Randomized Quicksort
  {
    id: 'randomized-quicksort',
    module: 6,
    moduleName: 'Module 6: Randomized Algorithms',
    name: 'Randomized Quicksort',
    paradigm: 'Randomized',
    complexity: {
      timeBest: 'O(n log n)',
      timeAverage: 'O(n log n)',
      timeWorst: 'O(n²)',
      spaceWorst: 'O(log n)',
      description: 'Expected linearithmic time by avoiding worst-case pivot bias',
    },
    problemStatement:
      'Sort an array of n numbers by choosing a pivot uniformly at random, partitioning around the pivot, and recursively sorting the left and right subarrays.',
    explanation:
      'Random pivot selection guarantees an expected O(n log n) runtime regardless of the input distribution, defeating adversarial inputs (like already sorted or reverse sorted arrays).',
    pseudocode: [
      'function RandomizedQuicksort(arr, low, high):',
      '  if low >= high: return // Base Case: subarray of size <= 1 is already sorted',
      '  pivotIndex = randomRange(low, high) // Uniform random pivot selection',
      '  swap(arr[pivotIndex], arr[high]) // Move random pivot to end boundary',
      '  pivot = arr[high], boundary = low - 1 // Begin Lomuto partitioning',
      '  for scanner = low to high - 1: // Scan elements against pivot',
      '    if arr[scanner] <= pivot: // Element belongs in left partition',
      '      boundary = boundary + 1; swap(arr[boundary], arr[scanner])',
      '  swap(arr[boundary + 1], arr[high]) // Place pivot into its final sorted position',
      '  pivotPos = boundary + 1',
      '  RandomizedQuicksort(arr, low, pivotPos - 1) // Recursively sort left subarray',
      '  RandomizedQuicksort(arr, pivotPos + 1, high) // Recursively sort right subarray',
    ],
    visualizer: 'ArrayBarVisualizer',
    inputSchema: [
      {
        name: 'array',
        label: 'Array to Sort (comma-separated)',
        type: 'array',
        defaultValue: [38, 27, 43, 3, 9, 82, 10, 19, 50],
        placeholder: 'e.g. 38, 27, 43, 3, 9, 82, 10',
      },
    ],
    presets: [
      { name: 'Mixed Array', data: { array: [38, 27, 43, 3, 9, 82, 10, 19, 50] } },
      { name: 'Reverse Sorted (Adversarial)', data: { array: [50, 45, 40, 35, 30, 25, 20, 15, 10] } },
      { name: 'Duplicates Present', data: { array: [15, 5, 20, 15, 30, 5, 20, 10] } },
    ],
    generateRandomInput: () => {
      const len = Math.floor(Math.random() * 5) + 8;
      const array = Array.from({ length: len }, () => Math.floor(Math.random() * 80) + 5);
      return { array };
    },
    stepGenerator: randomizedQuicksortSteps,
  },

  // Module 6: Randomized — The Hiring Problem
  {
    id: 'hiring-problem',
    module: 6,
    moduleName: 'Module 6: Randomized Algorithms',
    name: 'The Hiring Problem',
    paradigm: 'Randomized',
    complexity: {
      timeBest: 'O(n)',
      timeAverage: 'O(n)',
      timeWorst: 'O(n)',
      spaceWorst: 'O(1)',
      description: 'O(n) candidate interviews with expected O(ln n) hiring events under random permutation',
    },
    problemStatement:
      'Evaluate candidates sequentially: pay an interview cost c_i for every applicant, but pay a much larger hiring cost c_h only when an applicant is strictly better than everyone interviewed so far.',
    explanation:
      'The Hiring Problem models online decision-making under probabilistic input. In the worst case (ascending scores), all n candidates are hired costing O(n · c_h). Under random permutation, candidate i has probability 1/i of being the best so far, leading to expected hiring cost O(c_h · ln n).',
    pseudocode: [
      'function HiringProblem(candidates, costInterview, costHire):',
      '  bestScore = -infinity, totalCost = 0  // Initialize current best score and expenditure',
      '  for i = 0 to n - 1:  // Interview applicants sequentially in arrival order',
      '    totalCost += costInterview  // Always pay fixed fee to interview candidate',
      '    if candidates[i] > bestScore:  // Strictly superior to all previous candidates',
      '      bestScore = candidates[i]  // Promote candidate i as the new benchmark',
      '      totalCost += costHire  // Fire previous hire and pay substantial hiring fee',
      '    else: skip(candidates[i])  // Candidate does not beat current best: rejected',
      '  return (bestScore, totalCost)  // Final optimal employee and total recruitment expense',
    ],
    visualizer: 'ArrayBarVisualizer',
    inputSchema: [
      {
        name: 'candidates',
        label: 'Candidate Scores Array',
        type: 'array',
        defaultValue: [4, 7, 2, 9, 8, 10, 5, 12],
        placeholder: 'e.g. 4, 7, 2, 9, 8, 10, 5, 12',
        helperText: 'Applicant skill ratings (comma-separated). Evaluated left to right.',
      },
      {
        name: 'interviewCost',
        label: 'Interview Cost ($)',
        type: 'number',
        defaultValue: 1,
        min: 1,
        max: 50,
      },
      {
        name: 'hiringCost',
        label: 'Hiring Cost ($)',
        type: 'number',
        defaultValue: 5,
        min: 1,
        max: 100,
      },
    ],
    presets: [
      {
        name: 'Classic Textbook Sequence',
        description: 'Standard 8-candidate stream with mixed quality ratings',
        data: { candidates: [4, 7, 2, 9, 8, 10, 5, 12], interviewCost: 1, hiringCost: 5 },
      },
      {
        name: 'Worst Case (Ascending - Hire All)',
        description: 'Monotonically improving candidates: forces hiring on every single interview',
        data: { candidates: [2, 4, 6, 8, 10, 12, 14, 16], interviewCost: 1, hiringCost: 5 },
      },
      {
        name: 'Best Case (Descending - Hire First Only)',
        description: 'First applicant is the best: exactly 1 hire occurs, minimizing cost',
        data: { candidates: [20, 18, 15, 12, 9, 6, 4, 2], interviewCost: 1, hiringCost: 5 },
      },
    ],
    generateRandomInput: () => {
      const len = 8;
      const candidates = Array.from({ length: len }, () => Math.floor(Math.random() * 25) + 1);
      return { candidates, interviewCost: 1, hiringCost: 5 };
    },
    stepGenerator: hiringProblemSteps,
  },

  // Module 6: Randomized — Karger's Min-Cut
  {
    id: 'karger-min-cut',
    module: 6,
    moduleName: 'Module 6: Randomized Algorithms',
    name: 'Karger’s Algorithm (Randomized Min-Cut)',
    paradigm: 'Randomized',
    complexity: {
      timeBest: 'O(V²)',
      timeAverage: 'O(V²)',
      timeWorst: 'O(V²)',
      spaceWorst: 'O(V + E)',
      description: 'O(V²) per contraction run; success probability >= 2 / (V(V-1)), amplified by repeating O(V² ln V) times',
    },
    problemStatement:
      'Find a global minimum cut in a connected undirected graph: a partition of vertices (A, B) minimizing the number of crossing edges, using randomized edge contraction.',
    explanation:
      'Karger’s algorithm repeatedly selects an edge uniformly at random from the multigraph and contracts its endpoints into a super-node, discarding self-loops while keeping parallel edges. When exactly two super-nodes remain, the crossing edges form a cut. The probability of finding the true minimum cut in one run is at least 2/(V·(V-1)).',
    pseudocode: [
      'function KargerMinCut(G = (V, E)):',
      '  while |V| > 2:  // Repeat contraction until exactly 2 super-nodes remain',
      '    e = pickUniformRandomEdge(E)  // Pick edge uniformly at random from multigraph',
      '    contract(e = (u, v))  // Merge endpoints u and v into single super-node',
      '    removeSelfLoops(E)  // Eliminate all internal loops between u and v',
      '  cutEdges = remaining edges between the final 2 super-nodes',
      '  return (cutEdges, |cutEdges|)  // Candidate minimum cut for this randomized trial',
    ],
    visualizer: 'GraphVisualizer',
    inputSchema: [
      {
        name: 'edgeList',
        label: 'Graph Topology',
        type: 'select',
        defaultValue: 'barbell',
        options: [
          { label: 'Barbell / Bridge Graph (Min-Cut = 2)', value: 'barbell' },
          { label: 'Single Bridge Cut (Min-Cut = 1)', value: 'single_bridge' },
          { label: 'Complete Graph K4 (Min-Cut = 3)', value: 'k4' },
        ],
      },
    ],
    presets: [
      {
        name: 'Barbell / Bridge Graph (Min-Cut = 2)',
        description: 'Two triangles (0-1-2) and (3-4-5) connected by 2 bridge edges (1-3, 2-4)',
        data: {
          edgeList: [
            ['0', '1'],
            ['1', '2'],
            ['2', '0'],
            ['3', '4'],
            ['4', '5'],
            ['5', '3'],
            ['1', '3'],
            ['2', '4'],
          ],
        },
      },
      {
        name: 'Single Bridge Cut (Min-Cut = 1)',
        description: 'Two clusters connected by a single critical bottleneck bridge edge',
        data: {
          edgeList: [
            ['0', '1'],
            ['1', '2'],
            ['2', '0'],
            ['3', '4'],
            ['4', '5'],
            ['5', '3'],
            ['2', '3'],
          ],
        },
      },
      {
        name: 'Complete Graph K4 (Min-Cut = 3)',
        description: 'Complete 4-node graph: any partition separates at least 3 edges',
        data: {
          edgeList: [
            ['0', '1'],
            ['0', '2'],
            ['0', '3'],
            ['1', '2'],
            ['1', '3'],
            ['2', '3'],
          ],
        },
      },
    ],
    generateRandomInput: () => {
      const edges: [string, string][] = [
        ['0', '1'],
        ['1', '2'],
        ['2', '0'],
        ['3', '4'],
        ['4', '5'],
        ['5', '3'],
        ['1', '3'],
        ['2', '4'],
      ];
      return { edgeList: edges };
    },
    stepGenerator: kargerMinCutSteps,
  },

  // Module 7: Complexity & Approximation — Vertex Cover (2-Approx)
  {
    id: 'vertex-cover-approx',
    module: 7,
    moduleName: 'Module 7: Complexity & Approximation',
    name: 'Vertex Cover (2-Approximation)',
    paradigm: 'Approximation',
    complexity: {
      timeAverage: 'O(V + E)',
      timeWorst: 'O(V + E)',
      spaceWorst: 'O(V + E)',
      description: 'Polynomial time 2-approximation for NP-Complete problem',
    },
    problemStatement:
      'Find a subset of vertices C ⊆ V such that every edge (u, v) ∈ E has at least one endpoint in C, with size |C| ≤ 2 · OPT.',
    explanation:
      'Repeatedly picks an arbitrary uncovered edge (u, v), adds BOTH endpoints u and v to cover C, and deletes all incident edges. Since the picked edges form a matching M and OPT ≥ |M|, |C| = 2|M| ≤ 2 · OPT.',
    pseudocode: [
      'function ApproxVertexCover(G = (V, E)):',
      '  C = {};  E_prime = copy(E)  // Initialize empty vertex cover and uncovered edge set',
      '  while E_prime is not empty:  // Continue until all graph edges are covered',
      '    pick an arbitrary edge (u, v) in E_prime  // Greedily pick next uncovered edge',
      '    C = C ∪ {u, v}  // Add BOTH endpoints to cover (at least one must be in OPT)',
      '    remove from E_prime all edges incident to u or v  // Eliminate newly covered edges',
      '  return C  // Guaranteed |C| <= 2 * OPT (size <= 2 * maximal matching)',
    ],
    visualizer: 'GraphVisualizer',
    inputSchema: [
      {
        name: 'numNodes',
        label: 'Number of Vertices',
        type: 'number',
        defaultValue: 7,
        min: 4,
        max: 8,
      },
    ],
    presets: [
      {
        name: '7-Node Benchmark Graph',
        data: {
          edgeList: [
            ['0', '1'],
            ['1', '2'],
            ['1', '3'],
            ['2', '4'],
            ['3', '4'],
            ['3', '5'],
            ['4', '5'],
            ['5', '6'],
          ],
        },
      },
      {
        name: 'Bipartite / Star Graph',
        data: {
          edgeList: [
            ['0', '1'],
            ['0', '2'],
            ['0', '3'],
            ['0', '4'],
          ],
        },
      },
    ],
    generateRandomInput: () => {
      return {
        edgeList: [
          ['0', '1'],
          ['1', '2'],
          ['1', '3'],
          ['2', '4'],
          ['3', '4'],
          ['4', '5'],
        ],
      };
    },
    stepGenerator: vertexCoverApproxSteps,
  },

  // Module 7: Complexity & Approximation — Set Cover (Greedy Approx)
  {
    id: 'set-cover',
    module: 7,
    moduleName: 'Module 7: Complexity & Approximation',
    name: 'Set Cover (Greedy Approximation)',
    paradigm: 'Approximation',
    complexity: {
      timeBest: 'O(m · n)',
      timeAverage: 'O(m · n)',
      timeWorst: 'O(m · n)',
      spaceWorst: 'O(m + n)',
      description: 'Greedy O(ln |U| + 1) approximation factor for NP-hard Set Cover problem',
    },
    problemStatement:
      'Given a universe of elements U and a family of subsets S, find a minimum number of subsets whose union contains every element in U.',
    explanation:
      'Set Cover is a classic NP-hard optimization problem. The greedy heuristic repeatedly picks the subset that covers the maximum number of currently uncovered elements. This yields a provable approximation ratio of H(|U|) <= ln(|U|) + 1.',
    pseudocode: [
      'function GreedySetCover(universe U, subsets S):',
      '  covered = {}, selectedSubsets = []  // Initialize empty element cover and chosen set family',
      '  while covered != U:  // Repeat until every element in the universe is covered',
      '    bestSubset = argmax(S_i in S) |S_i ∩ (U \\ covered)|  // Pick set covering most new elements',
      '    selectedSubsets.push(bestSubset)  // Commit best subset to cover solution',
      '    covered = covered ∪ bestSubset  // Mark newly encompassed elements as covered',
      '  return selectedSubsets  // Solution guaranteed |C| <= OPT · (ln |U| + 1)',
    ],
    visualizer: 'SetCoverVisualizer',
    inputSchema: [
      {
        name: 'universeSize',
        label: 'Universe Size (|U|)',
        type: 'number',
        defaultValue: 10,
        min: 5,
        max: 20,
        helperText: 'Number of elements {1..|U|} in the universe to cover.',
      },
    ],
    presets: [
      {
        name: '10-Element Benchmark (5 Subsets)',
        description: 'Universe {1..10} with overlapping subsets S1 through S5',
        data: {
          universeSize: 10,
          subsets: [
            { id: 'S1', label: 'Set S1', elements: [1, 2, 3, 4] },
            { id: 'S2', label: 'Set S2', elements: [3, 4, 5, 6, 7] },
            { id: 'S3', label: 'Set S3', elements: [6, 7, 8] },
            { id: 'S4', label: 'Set S4', elements: [1, 5, 9, 10] },
            { id: 'S5', label: 'Set S5', elements: [2, 8, 10] },
          ],
        },
      },
      {
        name: 'Single Master Set Covers All',
        description: 'Set S2 contains entire universe {1..5}: greedy finds optimal in 1 step',
        data: {
          universeSize: 5,
          subsets: [
            { id: 'S1', label: 'Set S1', elements: [1, 2] },
            { id: 'S2', label: 'Set S2', elements: [1, 2, 3, 4, 5] },
            { id: 'S3', label: 'Set S3', elements: [3, 4] },
          ],
        },
      },
      {
        name: 'Disjoint Partition (3 Pairs)',
        description: 'Independent disjoint subsets partitioning elements {1..6}',
        data: {
          universeSize: 6,
          subsets: [
            { id: 'S1', label: 'Set S1', elements: [1, 2] },
            { id: 'S2', label: 'Set S2', elements: [3, 4] },
            { id: 'S3', label: 'Set S3', elements: [5, 6] },
          ],
        },
      },
    ],
    generateRandomInput: () => {
      const uSize = 10;
      const subs = [
        { id: 'S1', label: 'Set S1', elements: [1, 2, 3, 4] },
        { id: 'S2', label: 'Set S2', elements: [3, 4, 5, 6, 7] },
        { id: 'S3', label: 'Set S3', elements: [6, 7, 8] },
        { id: 'S4', label: 'Set S4', elements: [1, 5, 9, 10] },
        { id: 'S5', label: 'Set S5', elements: [2, 8, 10] },
      ];
      return { universeSize: uSize, subsets: subs };
    },
    stepGenerator: setCoverSteps,
  },

  // Module 7: Complexity & Approximation — TSP 2-Approximation (MST-Doubling)
  {
    id: 'tsp-approx',
    module: 7,
    moduleName: 'Module 7: Complexity & Approximation',
    name: 'Travelling Salesman Problem (2-Approximation)',
    paradigm: 'Approximation',
    complexity: {
      timeBest: 'O(V²)',
      timeAverage: 'O(V²)',
      timeWorst: 'O(V²)',
      spaceWorst: 'O(V²)',
      description: 'Polynomial time MST-doubling algorithm with 2.0x approximation factor for metric TSP',
    },
    problemStatement:
      'Find a minimum-cost Hamiltonian cycle visiting every city exactly once and returning to the origin in a complete metric graph with cost(Tour) <= 2 · OPT.',
    explanation:
      'For metric graphs satisfying the triangle inequality, the MST-Doubling heuristic: (1) builds an MST T, (2) doubles all edges to form an Eulerian multigraph with total weight 2 · W(T), and (3) visits cities in preorder DFS while shortcutting already-visited cities. Since OPT >= W(T) and shortcuts never increase distance, Cost(Tour) <= 2 · W(T) <= 2 · OPT.',
    pseudocode: [
      'function MetricTspApprox(cities, costMatrix):',
      '  T = PrimMST(cities, costMatrix)  // Phase 1: Minimum Spanning Tree has W(T) <= OPT',
      '  multigraph = doubleEdges(T)  // Phase 2: Every vertex has even degree (Eulerian circuit exists)',
      '  preorderWalk = dfsPreorder(T, startCity = 0)  // Phase 3: DFS traversal order',
      '  tour = shortcut(preorderWalk) + [startCity]  // Skip previously visited cities via Triangle Ineq',
      '  return tour  // Guaranteed Cost(tour) <= 2 · W(T) <= 2 · OPT',
    ],
    visualizer: 'TspVisualizer',
    inputSchema: [
      {
        name: 'numCities',
        label: 'Number of Cities (N)',
        type: 'number',
        defaultValue: 4,
        min: 3,
        max: 6,
        helperText: 'Number of cities in the TSP tour.',
      },
    ],
    presets: [
      {
        name: 'Classic 4-City Benchmark (OPT=80)',
        description: 'Standard 4-city asymmetric cost matrix (Held-Karp OPT=80, Approx=95)',
        data: {
          numCities: 4,
          costMatrix: [
            [0, 10, 15, 20],
            [10, 0, 35, 25],
            [15, 35, 0, 30],
            [20, 25, 30, 0],
          ],
          cityNames: ['A', 'B', 'C', 'D'],
        },
      },
      {
        name: '3-City Metric Triangle (OPT=21)',
        description: 'Triangle with costs 7, 6, 8 (OPT=21, Approx=21)',
        data: {
          numCities: 3,
          costMatrix: [
            [0, 7, 6],
            [7, 0, 8],
            [6, 8, 0],
          ],
          cityNames: ['A', 'B', 'C'],
        },
      },
      {
        name: '5-City Pentagon',
        description: '5 cities with metric distance layout',
        data: {
          numCities: 5,
          costMatrix: [
            [0, 12, 18, 25, 15],
            [12, 0, 22, 19, 28],
            [18, 22, 0, 14, 20],
            [25, 19, 14, 0, 16],
            [15, 28, 20, 16, 0],
          ],
          cityNames: ['A', 'B', 'C', 'D', 'E'],
        },
      },
    ],
    generateRandomInput: () => {
      const n = 4;
      const costMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const c = Math.floor(Math.random() * 25) + 10;
          costMatrix[i][j] = c;
          costMatrix[j][i] = c;
        }
      }
      return { numCities: n, costMatrix, cityNames: ['A', 'B', 'C', 'D'] };
    },
    stepGenerator: tspApproxSteps,
  },

  // Module 2: Backtracking — Subset Sum
  {
    id: 'subset-sum',
    module: 2,
    moduleName: 'Module 2: Backtracking',
    name: 'Subset Sum (Backtracking)',
    paradigm: 'Backtracking',
    complexity: {
      timeWorst: 'O(2ⁿ)',
      spaceWorst: 'O(n)',
      description: 'Backtracking with pruning — sum-exceeds and remaining-insufficient cutoffs',
    },
    problemStatement:
      'Given a set of positive integers and a target sum, determine whether any subset of the integers sums exactly to the target value using backtracking with pruning.',
    explanation:
      'Explores an include/exclude binary decision tree. At each level, decides whether to include the current element. Prunes branches where the running sum exceeds the target or the maximum achievable sum (current + all remaining) falls below the target.',
    pseudocode: [
      'function SubsetSum(index, currentSum, remaining, included):',
      '  if currentSum == target: return SOLUTION(included)  // Base case: target sum matched',
      '  if index >= n: return FAIL  // Base case: all elements evaluated',
      '  // Option 1: Try including numbers[index]',
      '  if currentSum + numbers[index] > target: PRUNE  // Overflow cutoff: exceeds target sum',
      '  else if currentSum + numbers[index] + remaining < target: PRUNE  // Insufficient remaining sum',
      '  else: recurse(index+1, currentSum+numbers[index], remaining-numbers[index], included+[numbers[index]])',
      '  // Option 2: Try excluding numbers[index]',
      '  if currentSum + remaining - numbers[index] < target: PRUNE  // Insufficient remaining without element',
      '  else: recurse(index+1, currentSum, remaining-numbers[index], included)',
    ],
    visualizer: 'TreeVisualizer',
    inputSchema: [
      {
        name: 'numbers',
        label: 'Set of Numbers',
        type: 'array',
        defaultValue: [3, 34, 4, 12, 5, 2],
        placeholder: 'e.g. 3, 34, 4, 12, 5, 2',
        helperText: 'Positive integers (comma-separated). Will be sorted internally for better pruning.',
      },
      {
        name: 'targetSum',
        label: 'Target Sum',
        type: 'number',
        defaultValue: 9,
        min: 1,
        max: 200,
        helperText: 'The exact sum to find among subsets.',
      },
      {
        name: 'findMode',
        label: 'Search Mode',
        type: 'select',
        defaultValue: 'first',
        options: [
          { label: 'Find First Solution (Fast / Decision)', value: 'first' },
          { label: 'Find All Solutions (Exhaustive)', value: 'all' },
        ],
        helperText: 'Choose whether to halt on first match or continue backtracking to discover all matching subsets.',
      },
    ],
    presets: [
      {
        name: 'Classic Example (Target 9)',
        description: 'Set [3, 34, 4, 12, 5, 2] with target sum 9 → subset [4, 5]',
        data: { numbers: [3, 34, 4, 12, 5, 2], targetSum: 9, findMode: 'first' },
      },
      {
        name: 'All Subsets Demo (Target 30)',
        description: 'Set [5, 10, 12, 13, 15, 18] with target 30 → all 3 subsets: [5, 10, 15], [5, 12, 13], [12, 18]',
        data: { numbers: [5, 10, 12, 13, 15, 18], targetSum: 30, findMode: 'all' },
      },
      {
        name: 'No Solution (Target 13)',
        description: 'Set [3, 5, 7] with target 13 → no valid subset',
        data: { numbers: [3, 5, 7], targetSum: 13, findMode: 'first' },
      },
      {
        name: 'Full Set Match (Target 12)',
        description: 'Set [2, 4, 6] with target 12 → all elements',
        data: { numbers: [2, 4, 6], targetSum: 12, findMode: 'first' },
      },
      {
        name: 'Larger Set (Target 21)',
        description: 'Set [1, 5, 3, 7, 4, 8, 2] with target 21',
        data: { numbers: [1, 5, 3, 7, 4, 8, 2], targetSum: 21, findMode: 'first' },
      },
    ],
    generateRandomInput: () => {
      const n = Math.floor(Math.random() * 4) + 4; // 4-7 elements
      const numbers = Array.from({ length: n }, () => Math.floor(Math.random() * 15) + 1);
      const totalSum = numbers.reduce((a, b) => a + b, 0);
      const targetSum = Math.floor(Math.random() * (totalSum - 1)) + 1;
      return { numbers, targetSum, findMode: 'first' };
    },
    stepGenerator: subsetSumSteps,
  },

  // Module 2: Backtracking — Graph Coloring
  {
    id: 'graph-coloring',
    module: 2,
    moduleName: 'Module 2: Backtracking',
    name: 'Graph Coloring (m-Coloring)',
    paradigm: 'Backtracking',
    complexity: {
      timeWorst: 'O(kⁿ)',
      spaceWorst: 'O(n)',
      description: 'Exponential backtracking trying k colors per vertex with neighbor conflict pruning',
    },
    problemStatement:
      'Given an undirected graph G = (V, E) and an integer k, determine if vertices can be assigned at most k colors such that no two adjacent vertices share the same color.',
    explanation:
      'Assigns colors 1 through k sequentially to vertices. For each vertex, tries each color in order, checking for conflicts with already-colored neighbors. If all k colors conflict, backtracks to uncolor the previous vertex and tries alternative assignments.',
    pseudocode: GRAPH_COLORING_PSEUDOCODE_FIRST,
    visualizer: 'GraphVisualizer',
    inputSchema: [
      {
        name: 'findMode',
        label: 'Search Strategy',
        type: 'select',
        defaultValue: 'first',
        options: [
          { label: 'Find First Solution (Fast / Decision)', value: 'first' },
          { label: 'Find All Solutions (Exhaustive)', value: 'all' },
        ],
        helperText: 'Choose whether to stop at the first valid coloring or exhaustively find all valid colorings.',
      },
      {
        name: 'numColors',
        label: 'Available Colors (k)',
        type: 'number',
        defaultValue: 3,
        min: 2,
        max: 6,
        helperText: 'Number of distinct colors available for vertex coloring.',
      },
    ],
    presets: [
      {
        name: '5-Node Planar (k=3, First Solution)',
        description: 'Standard 5-vertex planar graph finding first valid 3-coloring',
        data: {
          findMode: 'first',
          numColors: 3,
          edgeList: [
            ['0', '1'],
            ['0', '2'],
            ['0', '3'],
            ['1', '2'],
            ['2', '3'],
          ],
        },
      },
      {
        name: '5-Node Planar (All 3-Colorings)',
        description: 'Exhaustive backtracking to discover all valid 3-colorings for the 5-node planar graph',
        data: {
          findMode: 'all',
          numColors: 3,
          edgeList: [
            ['0', '1'],
            ['0', '2'],
            ['0', '3'],
            ['1', '2'],
            ['2', '3'],
          ],
        },
      },
      {
        name: 'Complete Graph K4 (k=3, Unsolvable)',
        description: 'K4 complete graph requires 4 colors; 3 colors fails with backtracking',
        data: {
          numColors: 3,
          edgeList: [
            ['0', '1'],
            ['0', '2'],
            ['0', '3'],
            ['1', '2'],
            ['1', '3'],
            ['2', '3'],
          ],
        },
      },
      {
        name: 'Complete Graph K4 (k=4, Solvable)',
        description: 'K4 complete graph colored with k=4 colors',
        data: {
          numColors: 4,
          edgeList: [
            ['0', '1'],
            ['0', '2'],
            ['0', '3'],
            ['1', '2'],
            ['1', '3'],
            ['2', '3'],
          ],
        },
      },
      {
        name: 'Odd Cycle C5 (k=2, Unsolvable)',
        description: '5-cycle is not bipartite, impossible with 2 colors',
        data: {
          numColors: 2,
          edgeList: [
            ['0', '1'],
            ['1', '2'],
            ['2', '3'],
            ['3', '4'],
            ['4', '0'],
          ],
        },
      },
      {
        name: 'Hexagon Cycle C6 (k=2, Solvable)',
        description: 'Even cycle C6 is bipartite, cleanly 2-colorable',
        data: {
          numColors: 2,
          edgeList: [
            ['0', '1'],
            ['1', '2'],
            ['2', '3'],
            ['3', '4'],
            ['4', '5'],
            ['5', '0'],
          ],
        },
      },
    ],
    generateRandomInput: () => {
      return {
        numColors: 3,
        edgeList: [
          ['0', '1'],
          ['0', '2'],
          ['1', '2'],
          ['2', '3'],
          ['3', '0'],
        ],
      };
    },
    stepGenerator: graphColoringSteps,
  },

  // Module 2: Branch & Bound — Job Selection Problem
  {
    id: 'job-selection-bb',
    module: 2,
    moduleName: 'Module 2: Branch & Bound',
    name: 'Job Selection Problem (Branch & Bound)',
    paradigm: 'Branch & Bound',
    complexity: {
      timeWorst: 'O(2ⁿ)',
      spaceWorst: 'O(2ⁿ)',
      description: 'Best-first search branch & bound with deadline feasibility pruning and greedy upper-bound cutoff',
    },
    problemStatement:
      'Given n jobs with individual deadlines and profits, select a subset of jobs that can be scheduled within their deadlines to maximize total profit.',
    explanation:
      'Explores a state-space tree where branches decide whether to include or exclude each job (sorted by profit descending). Subtrees are pruned if the accumulated job set violates deadlines or if the calculated upper bound cannot beat the best-known feasible profit.',
    pseudocode: [
      'function JobSelectionBB(jobs):',
      '  sort jobs descending by profit  // Greedy initial sorting by profit',
      '  Q = PriorityQueueByBound()  // Max-heap prioritizing highest upper bound',
      '  insert(Q, Root(profit=0, bound=calcBound(0, 0, maxDeadline)))',
      '  while Q is not empty:  // Explore best-promising state',
      '    curr = extractMax(Q)',
      '    if curr.bound <= bestProfit: prune(curr); continue  // Prune by upper bound cutoff',
      '    // Branch 1: Include job[curr.level]',
      '    if isFeasible(curr.selected + job) and newProfit > bestProfit: bestProfit = newProfit',
      '    if not isFeasible or leftBound <= bestProfit: prune(LeftChild)  // Deadline conflict or bounded',
      '    else: insert(Q, LeftChild)  // Promising include branch',
      '    // Branch 2: Exclude job[curr.level]',
      '    if rightBound <= bestProfit: prune(RightChild)  // Bound cannot beat best profit',
      '    else: insert(Q, RightChild)  // Promising exclude branch',
      '  return (bestProfit, bestSchedule)  // Optimal feasible job schedule',
    ],
    visualizer: 'TreeVisualizer',
    inputSchema: [
      {
        name: 'deadlines',
        label: 'Job Deadlines',
        type: 'array',
        defaultValue: [2, 1, 2, 1, 3],
        placeholder: 'e.g. 2, 1, 2, 1, 3',
        helperText: 'Deadlines for each job (comma-separated integers >= 1).',
      },
      {
        name: 'profits',
        label: 'Job Profits',
        type: 'array',
        defaultValue: [100, 19, 27, 25, 15],
        placeholder: 'e.g. 100, 19, 27, 25, 15',
        helperText: 'Profits earned if each job finishes by its deadline.',
      },
    ],
    presets: [
      {
        name: 'Classic 5-Job (Profit 142)',
        description: 'Standard textbook problem with 5 jobs, max profit 142 [J1, J3, J5]',
        data: {
          deadlines: [2, 1, 2, 1, 3],
          profits: [100, 19, 27, 25, 15],
        },
      },
      {
        name: 'Horowitz-Sahni 4-Job (Profit 127)',
        description: 'Classic benchmark: 4 jobs with deadlines [2, 1, 2, 1] and profits [100, 10, 15, 27]',
        data: {
          deadlines: [2, 1, 2, 1],
          profits: [100, 10, 15, 27],
        },
      },
      {
        name: 'Tight Deadlines (Single Slot)',
        description: 'All deadlines = 1, only 1 job can be scheduled: highest profit wins',
        data: {
          deadlines: [1, 1, 1, 1],
          profits: [50, 40, 30, 20],
        },
      },
      {
        name: 'Sequential Slots (All Fit)',
        description: 'Deadlines [1, 2, 3, 4] allow all 4 jobs to complete',
        data: {
          deadlines: [1, 2, 3, 4],
          profits: [20, 35, 45, 60],
        },
      },
    ],
    generateRandomInput: () => {
      const n = 5;
      const deadlines = Array.from({ length: n }, () => Math.floor(Math.random() * 3) + 1);
      const profits = Array.from({ length: n }, () => Math.floor(Math.random() * 80) + 10);
      return { deadlines, profits };
    },
    stepGenerator: jobSelectionBBSteps,
  },
];

export const getAlgorithmById = (id: string): AlgorithmConfig | undefined => {
  return algorithmRegistry.find((algo) => algo.id === id);
};
