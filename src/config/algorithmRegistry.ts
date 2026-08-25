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

export const algorithmRegistry: AlgorithmConfig[] = [
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
    name: 'Maximum Subarray (Kadane’s Algorithm)',
    paradigm: 'Divide & Conquer',
    complexity: {
      timeAverage: 'O(n)',
      timeWorst: 'O(n)',
      spaceWorst: 'O(1)',
      description: 'Single pass optimal scanning',
    },
    problemStatement:
      'Find the contiguous subarray within a one-dimensional array of numbers which has the largest sum.',
    explanation:
      'At each element, decide whether to extend the existing contiguous subarray or start a new subarray beginning at that element (Kadane’s linear scan), maintaining the running global maximum.',
    pseudocode: [
      'function MaximumSubarray(arr):',
      '  currentSum = arr[0], maxSum = arr[0]',
      '  start = 0, bestStart = 0, bestEnd = 0',
      '  for i = 1 to length(arr) - 1:',
      '    if arr[i] > currentSum + arr[i]:',
      '      currentSum = arr[i], start = i',
      '    else: currentSum = currentSum + arr[i]',
      '    if currentSum > maxSum:',
      '      maxSum = currentSum, bestStart = start, bestEnd = i',
      '  return (maxSum, bestStart, bestEnd)',
    ],
    visualizer: 'ArrayBarVisualizer',
    inputSchema: [
      {
        name: 'array',
        label: 'Array of Integers (comma-separated)',
        type: 'array',
        defaultValue: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
        placeholder: 'e.g. -2, 1, -3, 4, -1, 2, 1, -5, 4',
        helperText: 'Can include positive and negative numbers.',
      },
    ],
    presets: [
      { name: 'Standard Textbook', data: { array: [-2, 1, -3, 4, -1, 2, 1, -5, 4] } },
      { name: 'All Negative Values', data: { array: [-8, -3, -6, -2, -5, -4] } },
      { name: 'Alternating Highs/Lows', data: { array: [5, -2, 3, -1, 4, -8, 6, 2] } },
    ],
    generateRandomInput: () => {
      const len = Math.floor(Math.random() * 6) + 7;
      const array = Array.from({ length: len }, () => Math.floor(Math.random() * 25) - 12);
      return { array };
    },
    stepGenerator: maxSubarraySteps,
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
];

export const getAlgorithmById = (id: string): AlgorithmConfig | undefined => {
  return algorithmRegistry.find((algo) => algo.id === id);
};
