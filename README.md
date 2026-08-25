# DAA Algorithm Visualizer — BCSE204L Course Project

Interactive, web-based algorithm visualizer covering core paradigms from the **BCSE204L (Design and Analysis of Algorithms)** syllabus.

Built with **React, TypeScript, Tailwind CSS, and Vitest**, utilizing a **step-generator snapshot architecture** for deterministic forward and backward stepping.

---

## 1. Syllabus Module Coverage (12 Algorithms)

| # | Syllabus Module | Algorithm | Paradigm | Time Complexity | Space Complexity | Visualizer Component |
|---|---|---|---|---|---|---|
| 1 | **Module 1: Greedy** | **Huffman Coding** | Greedy | $O(n \log n)$ | $O(n)$ | `TreeVisualizer` |
| 2 | **Module 1: Divide & Conquer** | **Maximum Subarray (Kadane's)** | Divide & Conquer | $O(n)$ | $O(1)$ | `ArrayBarVisualizer` |
| 3 | **Module 2: Dynamic Programming** | **0-1 Knapsack (DP)** | Dynamic Programming | $O(n \cdot W)$ | $O(n \cdot W)$ | `GridTableVisualizer` |
| 4 | **Module 2: Dynamic Programming** | **Longest Common Subsequence (LCS)** | Dynamic Programming | $O(m \cdot n)$ | $O(m \cdot n)$ | `GridTableVisualizer` |
| 5 | **Module 2: Backtracking** | **N-Queens Problem** | Backtracking | $O(N!)$ | $O(N)$ | `BoardVisualizer` |
| 6 | **Module 2: Branch & Bound** | **0-1 Knapsack (B&B)** | Branch & Bound | $O(2^n)$ worst | $O(2^n)$ worst | `TreeVisualizer` |
| 7 | **Module 3: String Matching** | **Knuth-Morris-Pratt (KMP)** | String Matching | $O(m + n)$ | $O(m)$ | `StringMatchVisualizer` |
| 8 | **Module 4: Graph (Shortest Path)** | **Floyd-Warshall (APSP)** | Graph | $O(V^3)$ | $O(V^2)$ | `GraphVisualizer` |
| 9 | **Module 4: Network Flow** | **Ford-Fulkerson (Edmonds-Karp)** | Max Flow | $O(V \cdot E^2)$ | $O(V + E)$ | `GraphVisualizer` |
| 10 | **Module 5: Computational Geometry**| **Graham's Scan (Convex Hull)** | Geometric | $O(n \log n)$ | $O(n)$ | `PointCanvasVisualizer` |
| 11 | **Module 6: Randomized** | **Randomized Quicksort** | Randomized | $O(n \log n)$ avg | $O(\log n)$ | `ArrayBarVisualizer` |
| 12 | **Module 7: Complexity & Approx** | **Vertex Cover (2-Approximation)** | Approximation | $O(V + E)$ | $O(V + E)$ | `GraphVisualizer` |

---

## 2. Key Features

- **Discrete Step Generator Architecture**: Every algorithm is implemented from scratch as a generator yielding immutable state snapshots (`AlgorithmStep`).
- **Bidirectional Playback**: Step forward, step backward, scrubbing slider, speed control ($0.5\times$ to $4\times$), pause, and auto-play.
- **7 Parameterized Reusable Visualizers**:
  - `ArrayBarVisualizer`: Pivot, compare, swap, and window highlights for array algorithms.
  - `GridTableVisualizer`: 2D DP matrices with formula callouts, recurrence sources, and backtrack paths.
  - `TreeVisualizer`: Huffman merge forests and Branch & Bound decision state-space trees with prune highlights.
  - `BoardVisualizer`: $N \times N$ chessboard with queen placements, threat paths, and conflict backtracks.
  - `GraphVisualizer`: Graph nodes and edges with weights, matrix tabs, residual flow labels, and cover highlights.
  - `PointCanvasVisualizer`: 2D Cartesian plane with polar sweep order and cross-product turn checks.
  - `StringMatchVisualizer`: Dual text/pattern tape alignment with LPS array previews and match offsets.
- **Live Operation Counters**: Comparisons, swaps, backtracks, relaxations, nodes explored, and pruned branches.
- **Side-by-Side Comparison**: Real-time synchronous comparison between **0-1 Knapsack DP** and **0-1 Knapsack Branch & Bound**.

---

## 3. Project Structure

```
/Algoviz
├── src/
│   ├── algorithms/               # 12 pure algorithm generator functions
│   │   ├── huffman.ts
│   │   ├── maxSubarray.ts
│   │   ├── knapsackDP.ts
│   │   ├── lcs.ts
│   │   ├── nQueens.ts
│   │   ├── knapsackBB.ts
│   │   ├── kmp.ts
│   │   ├── floydWarshall.ts
│   │   ├── fordFulkerson.ts
│   │   ├── grahamScan.ts
│   │   ├── randomizedQuicksort.ts
│   │   └── vertexCoverApprox.ts
│   ├── components/
│   │   ├── common/               # PlaybackControls, MetricsPanel, ResultPanel, InputControlPanel, etc.
│   │   ├── layout/               # Navbar, Footer
│   │   └── visualizers/          # 7 Reusable Visualizer Components
│   ├── config/
│   │   └── algorithmRegistry.ts  # Central configuration metadata & bindings
│   ├── pages/
│   │   ├── Home.tsx              # Syllabus catalog & filter dashboard
│   │   ├── AlgorithmPage.tsx     # Generic visualizer driver page
│   │   └── ComparisonPage.tsx    # DP vs Branch & Bound comparison
│   ├── tests/                    # Vitest unit test suite (TR-1 through TR-8)
│   ├── types/
│   │   └── algorithm.ts          # Type definitions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
└── README.md
```

---

## 4. Verification & Testing

All algorithms are covered by automated unit tests validating textbook test cases and theoretical invariant properties:

| Test Suite | File | Verified Invariant / Test Case | Result |
|---|---|---|---|
| **Huffman Coding** | `huffman.test.ts` | Prefix-free code property, text `ABRACADABRA`, compression ratio | **PASSED** |
| **Max Subarray** | `maxSubarray.test.ts` | Kadane textbook array `[-2,1,-3,4,-1,2,1,-5,4] -> 6`, all-negatives | **PASSED** |
| **0-1 Knapsack DP** | `knapsackDP.test.ts` | Capacity 5 & 10 item sets, table values & item backtracking | **PASSED** |
| **LCS** | `lcs.test.ts` | `ABCBDAB` & `BDCAB` $\to$ length 4 (`BCAB`), `AGGTAB` & `GXTXAYB` | **PASSED** |
| **N-Queens** | `nQueens.test.ts` | $N=4$ (2 solutions), $N=8$ non-attacking row/col/diagonal checks | **PASSED** |
| **0-1 Knapsack B&B**| `knapsackBB.test.ts` | Optimal value matches DP version, branch pruning verified | **PASSED** |
| **KMP** | `kmp.test.ts` | `ABABDABACDABABCABAB` match pos 10, multiple overlapping matches | **PASSED** |
| **Floyd-Warshall** | `floydWarshall.test.ts` | 4-node & 5-node directed graphs with negative weights | **PASSED** |
| **Ford-Fulkerson** | `fordFulkerson.test.ts` | Classic 6-node network max flow $= 23$ | **PASSED** |
| **Graham's Scan** | `grahamScan.test.ts` | Square + interior points $\to$ exactly 4 corner hull vertices | **PASSED** |
| **Randomized Quicksort** | `randomizedQuicksort.test.ts` | 10 randomized runs: monotonic sort + multiset permutation preservation | **PASSED** |
| **Vertex Cover Approx** | `vertexCoverApprox.test.ts` | Valid edge cover verification and $|C| = 2\|M\| \le 2 \cdot OPT$ bound | **PASSED** |

---

## 5. Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run all unit tests
npm test

# Build for production
npm run build
```
