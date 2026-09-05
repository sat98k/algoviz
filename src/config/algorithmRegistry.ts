import { AlgorithmConfig } from '../types/algorithm';
import { randomizedQuicksortSteps } from '../algorithms/randomizedQuicksort';
import { maxSubarraySteps } from '../algorithms/maxSubarray';
import { huffmanSteps } from '../algorithms/huffman';
import { knapsackDPSteps } from '../algorithms/knapsackDP';
import { lcsSteps } from '../algorithms/lcs';
import { nQueensSteps } from '../algorithms/nQueens';
import { knapsackBBSteps } from '../algorithms/knapsackBB';
import { kmpSteps } from '../algorithms/kmp';
import { floydWarshallSteps } from '../algorithms/floydWarshall';
import { fordFulkersonSteps } from '../algorithms/fordFulkerson';
import { grahamScanSteps } from '../algorithms/grahamScan';
import { vertexCoverApproxSteps } from '../algorithms/vertexCoverApprox';
import { fractionalKnapsackSteps } from '../algorithms/fractionalKnapsack';
import { matrixChainMultiplicationSteps } from '../algorithms/matrixChainMultiplication';
import { karatsubaSteps } from '../algorithms/karatsuba';
import { assemblyLineSchedulingSteps } from '../algorithms/assemblyLineScheduling';
import { subsetSumSteps } from '../algorithms/subsetSum';
import { graphColoringSteps } from '../algorithms/graphColoring';
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
      'function FractionalKnapsack(weights, values, W):',
      '  for i = 1 to n: ratio[i] = values[i] / weights[i]',
      '  sort items descending by ratio',
      '  currentWeight = 0, currentValue = 0',
      '  for each item i in sortedItems:',
      '    if currentWeight + weights[i] <= W:',
      '      take 100% of item i; currentWeight += weights[i]; currentValue += values[i]',
      '    else:',
      '      fraction = (W - currentWeight) / weights[i]',
      '      take fraction of item i; currentValue += fraction * values[i]; break',
      '  return currentValue',
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
      'function HuffmanCoding(text):',
      '  freq = computeFrequencies(text)',
      '  Q = createMinPriorityQueue(freq)',
      '  while |Q| > 1:',
      '    left = extractMin(Q)',
      '    right = extractMin(Q)',
      '    parent = Node(freq = left.freq + right.freq, left, right)',
      '    insert(Q, parent)',
      '  root = extractMin(Q)',
      '  return generateCodes(root)',
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
      'function MaxSubarrayDC(A, low, high):',
      '  if low == high: return (A[low], low, high) // Base Case',
      '  mid = floor((low + high) / 2)',
      '  (leftSum, leftL, leftH) = MaxSubarrayDC(A, low, mid)',
      '  (rightSum, rightL, rightH) = MaxSubarrayDC(A, mid + 1, high)',
      '  (crossSum, crossL, crossH) = MaxCrossingSubarray(A, low, mid, high)',
      '  return max(leftSum, rightSum, crossSum)',
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
      '  if X < 10 or Y < 10: return X * Y // Base Case',
      '  m = floor(max(digits(X), digits(Y)) / 2)',
      '  (a, b) = split(X, m); (c, d) = split(Y, m)',
      '  z2 = Karatsuba(a, c)',
      '  z0 = Karatsuba(b, d)',
      '  z1 = Karatsuba(a + b, c + d) - z2 - z0',
      '  return z2 * 10^(2m) + z1 * 10^m + z0',
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
      'function KnapsackDP(weights, values, W, n):',
      '  DP = Matrix(n + 1, W + 1, initial=0)',
      '  for i = 1 to n:',
      '    for w = 1 to W:',
      '      if weights[i-1] > w:',
      '        DP[i][w] = DP[i-1][w]',
      '      else:',
      '        DP[i][w] = max(DP[i-1][w], values[i-1] + DP[i-1][w - weights[i-1]])',
      '  return backtrackSelectedItems(DP, weights, values, W, n)',
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
      'function LCS(X, Y, m, n):',
      '  DP = Matrix(m + 1, n + 1, initial=0)',
      '  for i = 1 to m:',
      '    for j = 1 to n:',
      '      if X[i-1] == Y[j-1]:',
      '        DP[i][j] = 1 + DP[i-1][j-1]',
      '      else:',
      '        DP[i][j] = max(DP[i-1][j], DP[i][j-1])',
      '  return backtrackLCS(DP, X, Y, m, n)',
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
      '  for i = 1 to n: m[i, i] = 0 // Base cases',
      '  for L = 2 to n: // L is chain length',
      '    for i = 1 to n - L + 1:',
      '      j = i + L - 1; m[i, j] = infinity',
      '      for k = i to j - 1:',
      '        q = m[i, k] + m[k+1, j] + p[i-1]*p[k]*p[j]',
      '        if q < m[i, j]:',
      '          m[i, j] = q; s[i, j] = k',
      '  return (m[1, n], reconstructParens(s, 1, n))',
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
      'function AssemblyLine(a1, a2, t1, t2, e1, e2, x1, x2, n):',
      '  f1[1] = e1 + a1[1]; f2[1] = e2 + a2[1]',
      '  for j = 2 to n:',
      '    f1[j] = min(f1[j-1] + a1[j], f2[j-1] + t2[j-1] + a1[j])',
      '    f2[j] = min(f2[j-1] + a2[j], f1[j-1] + t1[j-1] + a2[j])',
      '  f* = min(f1[n] + x1, f2[n] + x2)',
      '  return (f*, backtrackOptimalPath(l1, l2, winningExit))',
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
      '  if row == N: return recordSolution(board)',
      '  for col = 0 to N - 1:',
      '    if isSafe(board, row, col):',
      '      board[row] = col',
      '      SolveNQueens(row + 1, N, board)',
      '      board[row] = -1 // Backtrack',
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
      '  sort items by (value / weight) descending',
      '  Q = MaxHeapByBound()',
      '  root = Node(level=0, weight=0, value=0, bound=calcBound(0, 0, 0))',
      '  insert(Q, root)',
      '  while Q is not empty:',
      '    node = extractMax(Q)',
      '    if node.bound <= bestValue: prune(node); continue',
      '    generate LeftChild (+Item) and RightChild (-Item)',
      '    update bestValue if feasible; insert promising children into Q',
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
      'function KMP(T, P):',
      '  LPS = computeLPS(P)',
      '  i = 0, j = 0',
      '  while i < length(T):',
      '    if P[j] == T[i]: i++, j++',
      '    if j == length(P): recordMatch(i - j); j = LPS[j - 1]',
      '    else if i < length(T) and P[j] != T[i]:',
      '      if j != 0: j = LPS[j - 1]',
      '      else: i++',
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
      '  dist = copy(weightMatrix)',
      '  for k = 0 to V - 1:',
      '    for i = 0 to V - 1:',
      '      for j = 0 to V - 1:',
      '        if dist[i][k] + dist[k][j] < dist[i][j]:',
      '          dist[i][j] = dist[i][k] + dist[k][j]',
      '  return dist',
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
      '  flow = 0, residual = copy(capacities)',
      '  while (path = BFS_AugmentingPath(s, t, residual)) exists:',
      '    bottleneck = minResidualCapacityAlong(path)',
      '    for each edge (u, v) in path:',
      '      residual[u][v] -= bottleneck',
      '      residual[v][u] += bottleneck',
      '    flow += bottleneck',
      '  return flow',
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
      '  P0 = findLowestPoint(points)',
      '  sorted = sortRemainingByPolarAngle(points, P0)',
      '  stack = [sorted[0], sorted[1], sorted[2]]',
      '  for i = 3 to length(sorted) - 1:',
      '    while length(stack) >= 2 and orientation(stack[-2], stack[-1], sorted[i]) <= 0:',
      '      pop(stack)',
      '    push(stack, sorted[i])',
      '  return stack',
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
      '  if low < high:',
      '    pIdx = Random(low, high)',
      '    swap(arr[pIdx], arr[high])',
      '    pivotPos = LomutoPartition(arr, low, high)',
      '    RandomizedQuicksort(arr, low, pivotPos - 1)',
      '    RandomizedQuicksort(arr, pivotPos + 1, high)',
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
      '  C = {}',
      '  E_prime = copy(E)',
      '  while E_prime is not empty:',
      '    pick an arbitrary edge (u, v) in E_prime',
      '    C = C ∪ {u, v}',
      '    remove from E_prime all edges incident to u or v',
      '  return C',
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
      '  if currentSum == target: return SOLUTION(included)',
      '  if index >= n: return FAIL',
      '  // Option 1: Include numbers[index]',
      '  if currentSum + numbers[index] > target: PRUNE (overflow)',
      '  else if currentSum + numbers[index] + remaining < target: PRUNE (insufficient)',
      '  else: recurse(index+1, currentSum+numbers[index], remaining-numbers[index], included+[numbers[index]])',
      '  // Option 2: Exclude numbers[index]',
      '  if currentSum + remaining - numbers[index] < target: PRUNE (insufficient)',
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
    ],
    presets: [
      {
        name: 'Classic Example (Target 9)',
        description: 'Set [3, 34, 4, 12, 5, 2] with target sum 9 → subset [4, 5]',
        data: { numbers: [3, 34, 4, 12, 5, 2], targetSum: 9 },
      },
      {
        name: 'No Solution (Target 13)',
        description: 'Set [3, 5, 7] with target 13 → no valid subset',
        data: { numbers: [3, 5, 7], targetSum: 13 },
      },
      {
        name: 'Full Set Match (Target 12)',
        description: 'Set [2, 4, 6] with target 12 → all elements',
        data: { numbers: [2, 4, 6], targetSum: 12 },
      },
      {
        name: 'Larger Set (Target 21)',
        description: 'Set [1, 5, 3, 7, 4, 8, 2] with target 21',
        data: { numbers: [1, 5, 3, 7, 4, 8, 2], targetSum: 21 },
      },
    ],
    generateRandomInput: () => {
      const n = Math.floor(Math.random() * 4) + 4; // 4-7 elements
      const numbers = Array.from({ length: n }, () => Math.floor(Math.random() * 15) + 1);
      const totalSum = numbers.reduce((a, b) => a + b, 0);
      const targetSum = Math.floor(Math.random() * (totalSum - 1)) + 1;
      return { numbers, targetSum };
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
    pseudocode: [
      'function GraphColoring(vertexIndex, colorAssignment, k):',
      '  if vertexIndex == |V|: return SOLUTION(colorAssignment)',
      '  for c = 1 to k:',
      '    if isSafe(vertexIndex, c, colorAssignment):',
      '      colorAssignment[vertexIndex] = c',
      '      if GraphColoring(vertexIndex + 1, colorAssignment, k): return true',
      '      colorAssignment[vertexIndex] = 0  // Backtrack: uncolor',
      '  return false  // No valid color found',
    ],
    visualizer: 'GraphVisualizer',
    inputSchema: [
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
        name: '5-Node Planar (k=3, Solvable)',
        description: 'Standard 5-vertex planar graph solvable with 3 colors',
        data: {
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
      '  sort jobs descending by profit',
      '  Q = PriorityQueue([Root(profit=0, bound=calcBound())])',
      '  bestProfit = 0, bestSchedule = []',
      '  while Q not empty:',
      '    curr = Q.extractMax()',
      '    if curr.bound <= bestProfit: PRUNE',
      '    // Branch 1: Include job[curr.level]',
      '    if isFeasible(curr.selected + job):',
      '      leftBound = calcBound(curr.profit + job.profit)',
      '      if leftBound > bestProfit: Q.insert(LeftChild)',
      '    // Branch 2: Exclude job[curr.level]',
      '    rightBound = calcBound(curr.profit)',
      '    if rightBound > bestProfit: Q.insert(RightChild)',
      '  return bestSchedule, bestProfit',
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
