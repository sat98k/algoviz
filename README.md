# DAA Algorithm Visualizer — BCSE204L Course Project

Interactive, web-based algorithm visualizer covering core paradigms from the **BCSE204L (Design and Analysis of Algorithms)** syllabus.

Built with **React, TypeScript, Tailwind CSS, and Vitest**, utilizing a **step-generator snapshot architecture** for deterministic forward and backward stepping.

> **Viva scope note**: The home catalog currently shows **Modules 1–4** (15 algorithms). Ford-Fulkerson (Mod 4 partial) through Module 7 are implemented and tested but temporarily hidden — see §2 for full status.

---

## 1. Syllabus Coverage — All 8 Modules

### Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented — step generator + visualizer + unit tests passing |
| 🔒 | Implemented & tested, but **hidden** from home catalog (toggle in `Home.tsx`) |
| 📋 | Syllabus topic — not yet implemented in this project |

---

### Module 1 — Greedy, Divide & Conquer

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 1.01 | Huffman Coding | Greedy | $O(n \log n)$ | $O(n)$ | `TreeVisualizer` | ✅ |
| 1.02 | Maximum Subarray (D&C) | Divide & Conquer | $O(n \log n)$ | $O(\log n)$ | `RecursionTreeVisualizer` | ✅ |
| 1.03 | Fractional Knapsack | Greedy | $O(n \log n)$ | $O(n)$ | `FractionalKnapsackVisualizer` | ✅ |
| 1.04 | Karatsuba Multiplication | Divide & Conquer | $O(n^{1.585})$ | $O(n)$ | `RecursionTreeVisualizer` | ✅ |

---

### Module 2 — DP, Backtracking, Branch & Bound

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 2.01 | 0-1 Knapsack (DP) | Dynamic Programming | $O(n \cdot W)$ | $O(n \cdot W)$ | `GridTableVisualizer` | ✅ |
| 2.02 | Longest Common Subsequence (LCS) | Dynamic Programming | $O(m \cdot n)$ | $O(m \cdot n)$ | `GridTableVisualizer` | ✅ |
| 2.03 | Matrix Chain Multiplication | Dynamic Programming | $O(n^3)$ | $O(n^2)$ | `GridTableVisualizer` | ✅ |
| 2.04 | Assembly Line Scheduling | Dynamic Programming | $O(n)$ | $O(n)$ | `AssemblyLineVisualizer` | ✅ |
| 2.05 | Travelling Salesman Problem (Held-Karp DP) | Dynamic Programming | $O(2^n \cdot n^2)$ | $O(2^n \cdot n)$ | — | 📋 |
| 2.06 | N-Queens | Backtracking | $O(N!)$ | $O(N)$ | `BoardVisualizer` | ✅ |
| 2.07 | Subset Sum | Backtracking | $O(2^n)$ | $O(n)$ | `TreeVisualizer` | ✅ |
| 2.08 | Graph Coloring (m-Coloring) | Backtracking | $O(k^n)$ | $O(n)$ | `GraphVisualizer` | ✅ |
| 2.09 | 0-1 Knapsack (Branch & Bound) | Branch & Bound | $O(2^n)$ worst | $O(2^n)$ worst | `TreeVisualizer` | ✅ |
| 2.10 | Job Selection Problem (Branch & Bound) | Branch & Bound | $O(2^n)$ worst | $O(2^n)$ worst | `TreeVisualizer` | ✅ |

---

### Module 3 — String Matching

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 3.01 | Naive String Matching | String Matching | $O(nm)$ | $O(1)$ | — | 📋 |
| 3.02 | Knuth-Morris-Pratt (KMP) | String Matching | $O(n + m)$ | $O(m)$ | `StringMatchVisualizer` | ✅ |
| 3.03 | Rabin-Karp | String Matching | $O(n + m)$ avg | $O(1)$ | — | 📋 |
| 3.04 | Suffix Trees | String Matching | $O(n)$ | $O(n)$ | — | 📋 |

---

### Module 4 — Graph Algorithms

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 4.01 | Bellman-Ford | Graph / SSSP | $O(V \cdot E)$ | $O(V)$ | — | 📋 |
| 4.02 | Floyd-Warshall (APSP) | Graph / APSP | $O(V^3)$ | $O(V^2)$ | `GraphVisualizer` | ✅ |
| 4.03 | Ford-Fulkerson | Max Flow | $O(V \cdot E^2)$ | $O(V + E)$ | `GraphVisualizer` | 🔒 |
| 4.04 | Edmonds-Karp | Max Flow | $O(V \cdot E^2)$ | $O(V + E)$ | — | 📋 |
| 4.05 | Push-Relabel | Max Flow | $O(V^2 \cdot E)$ | $O(V + E)$ | — | 📋 |

---

### Module 5 — Geometric Algorithms

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 5.01 | Line Segment Properties / Intersection / Sweep | Geometry | $O(n \log n)$ | $O(n)$ | — | 📋 |
| 5.02 | Graham's Scan (Convex Hull) | Geometry | $O(n \log n)$ | $O(n)$ | `PointCanvasVisualizer` | 🔒 |
| 5.03 | Jarvis' March (Gift Wrapping) | Geometry | $O(nh)$ | $O(n)$ | — | 📋 |

---

### Module 6 — Randomized Algorithms

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 6.01 | Randomized Quicksort | Randomized | $O(n \log n)$ avg | $O(\log n)$ | `ArrayBarVisualizer` | 🔒 |
| 6.02 | The Hiring Problem | Randomized | $O(n)$ | $O(1)$ | — | 📋 |
| 6.03 | Karger's Min-Cut | Randomized | $O(V^2)$ per run | $O(V + E)$ | — | 📋 |

---

### Module 7 — Complexity Classes & Approximation

| # | Algorithm / Topic | Paradigm | Complexity | Visualizer | Status |
|---|-----------|----------|------|------------|--------|
| 7.01 | SAT (problem definition) | NP-Complete | — | — | 📋 |
| 7.02 | 3-SAT | NP-Complete | — | — | 📋 |
| 7.03 | Independent Set | NP-Hard | — | — | 📋 |
| 7.04 | Clique | NP-Hard | — | — | 📋 |
| 7.05 | Vertex Cover (2-Approximation) | Approximation | $O(V + E)$ | `GraphVisualizer` | 🔒 |
| 7.06 | Set Cover | Approximation | $O(n \log n)$ | — | 📋 |
| 7.07 | TSP Approximation | Approximation | $O(n^2 \log n)$ | — | 📋 |

---

### Module 8 — Contemporary Issues

> Conceptual / discussion module — no algorithm implementations applicable.

---

## 2. Implementation Status Summary

| Category | Count |
|----------|-------|
| ✅ **Implemented & visible** (Modules 1–4) | **15** |
| 🔒 **Implemented & tested, hidden from catalog** | **4** |
| 📋 **Syllabus topic, not implemented** | **20** |
| **Total syllabus entries covered** | **39** |

### Hidden algorithms (🔒)
These are fully implemented, step-generator tested, and registered — only hidden from the Home catalog. To restore them, remove their IDs from `HIDDEN_ALGORITHM_IDS` in [`src/pages/Home.tsx`](src/pages/Home.tsx):

```ts
// src/pages/Home.tsx — remove any ID from this Set to restore visibility
const HIDDEN_ALGORITHM_IDS = new Set([
  'ford-fulkerson',        // Module 4 — Max Flow
  'graham-scan',           // Module 5 — Convex Hull
  'randomized-quicksort',  // Module 6 — Randomized
  'vertex-cover-approx',   // Module 7 — Approximation
]);
```

---

## 3. Key Features

- **Discrete Step Generator Architecture**: Every algorithm is implemented from scratch as a generator yielding immutable state snapshots (`AlgorithmStep`).
- **Bidirectional Playback**: Step forward, step backward, scrubbing slider, speed control ($0.5\times$ to $4\times$), pause, and auto-play.
- **10 Parameterized Reusable Visualizers**:
  - `RecursionTreeVisualizer` — D&C call trees, subproblem breakdown, bottom-up combine phase (Max Subarray, Karatsuba).
  - `AssemblyLineVisualizer` — Dual-lane pipeline with transfer penalties and optimal route back-propagation.
  - `FractionalKnapsackVisualizer` — Capacity gauge, ratio-sorted item cards, fractional slice indicators.
  - `GridTableVisualizer` — 2D DP matrices with recurrence callouts, split points, backtrack paths (Knapsack DP, LCS, Matrix Chain).
  - `TreeVisualizer` — Huffman forests, backtracking decision trees (Subset Sum), B&B state-space trees with prune highlights (Knapsack B&B, Job Selection B&B).
  - `ArrayBarVisualizer` — Pivot, compare, swap, and window highlights.
  - `BoardVisualizer` — $N \times N$ chessboard with threat paths and conflict backtracks.
  - `GraphVisualizer` — SVG graphs with adjacency matrices; residual flows (Ford-Fulkerson), vertex covers, graph coloring conflict rings.
  - `PointCanvasVisualizer` — 2D plane with polar sweep order and cross-product turn checks.
  - `StringMatchVisualizer` — Dual text/pattern tape alignment with LPS array and match offsets.
- **Live Operation Counters**: Comparisons, swaps, backtracks, relaxations, nodes explored, pruned branches.
- **Side-by-Side Comparison**: Real-time synchronous comparison between **0-1 Knapsack DP** and **0-1 Knapsack Branch & Bound**.

---

## 4. Project Structure

```
/Algoviz
├── src/
│   ├── algorithms/               # 19 pure step-generator functions
│   │   ├── fractionalKnapsack.ts
│   │   ├── huffman.ts
│   │   ├── maxSubarray.ts
│   │   ├── karatsuba.ts
│   │   ├── knapsackDP.ts
│   │   ├── lcs.ts
│   │   ├── matrixChainMultiplication.ts
│   │   ├── assemblyLineScheduling.ts
│   │   ├── nQueens.ts
│   │   ├── subsetSum.ts
│   │   ├── graphColoring.ts
│   │   ├── knapsackBB.ts
│   │   ├── jobSelectionBB.ts
│   │   ├── kmp.ts
│   │   ├── floydWarshall.ts
│   │   ├── fordFulkerson.ts      # 🔒 hidden (Module 4)
│   │   ├── grahamScan.ts         # 🔒 hidden (Module 5)
│   │   ├── randomizedQuicksort.ts# 🔒 hidden (Module 6)
│   │   └── vertexCoverApprox.ts  # 🔒 hidden (Module 7)
│   ├── components/
│   │   ├── common/               # PlaybackControls, MetricsPanel, ResultPanel, InputControlPanel
│   │   ├── layout/               # Navbar, Footer
│   │   └── visualizers/          # Reusable visualizer components (10 total)
│   ├── config/
│   │   └── algorithmRegistry.ts  # Central metadata & step-generator bindings (19 entries)
│   ├── pages/
│   │   ├── Home.tsx              # Syllabus catalog & filter dashboard (HIDDEN_ALGORITHM_IDS here)
│   │   ├── AlgorithmPage.tsx     # Generic visualizer driver page
│   │   └── ComparisonPage.tsx    # DP vs Branch & Bound comparison
│   ├── tests/                    # Vitest unit test suite (20 suites, 56 tests — all passing)
│   ├── utils/
│   │   ├── treeLayout.ts         # 2-pass layout engine (bottom-up widths, top-down coordinates)
│   │   └── treeTheme.ts          # WCAG AA contrast colour theme utility
│   ├── types/
│   │   └── algorithm.ts          # Shared TypeScript type definitions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
└── README.md
```

---

## 5. Verification & Testing

All implemented algorithms are covered by automated unit tests validating textbook cases and theoretical invariant properties:

| Test Suite | File | Verified Invariant / Test Case | Result |
|---|---|---|---|
| **Fractional Knapsack** | `fractionalKnapsack.test.ts` | Ratio-descending greedy fill, $W=50 \to V=240$, fractional slice | ✅ PASSED |
| **Huffman Coding** | `huffman.test.ts` | Prefix-free code property, `ABRACADABRA`, compression ratio | ✅ PASSED |
| **Max Subarray (D&C)** | `maxSubarray.test.ts` | `[-2,1,-3,4,-1,2,1,-5,4] → 6`, all-negatives edge case | ✅ PASSED |
| **Karatsuba** | `karatsuba.test.ts` | 4-digit, asymmetric, single-digit base case, 16-digit large numbers | ✅ PASSED |
| **0-1 Knapsack DP** | `knapsackDP.test.ts` | Capacity 5 & 10 item sets, table values & item backtracking | ✅ PASSED |
| **LCS** | `lcs.test.ts` | `ABCBDAB & BDCAB → 4`, `AGGTAB & GXTXAYB` | ✅ PASSED |
| **Matrix Chain Mult** | `matrixChainMultiplication.test.ts` | CLRS `[10,20,30,40,30] → 30000`, reconstructed parens | ✅ PASSED |
| **Assembly Line Scheduling** | `assemblyLineScheduling.test.ts` | 2-line textbook ($T=35$, route 1-2-1-1-2-1), forward DP & backtrack | ✅ PASSED |
| **N-Queens** | `nQueens.test.ts` | $N=4$ (2 solutions), $N=8$ non-attacking row/col/diagonal checks | ✅ PASSED |
| **Subset Sum** | `subsetSum.test.ts` | Solvable subsets, unreachable sums with pruning, include/exclude paths | ✅ PASSED |
| **Graph Coloring** | `graphColoring.test.ts` | 5-node planar 3-coloring, K4 chromatic number conflict, C5 vs C6 cycles | ✅ PASSED |
| **0-1 Knapsack B&B** | `knapsackBB.test.ts` | Optimal value matches DP, branch pruning verified | ✅ PASSED |
| **Job Selection B&B** | `jobSelectionBB.test.ts` | 5-job benchmark (profit 142), Horowitz-Sahni (127), deadline pruning | ✅ PASSED |
| **KMP** | `kmp.test.ts` | `ABABDABACDABABCABAB` match pos 10, overlapping matches | ✅ PASSED |
| **Floyd-Warshall** | `floydWarshall.test.ts` | 4-node & 5-node directed graphs with negative weights | ✅ PASSED |
| **Ford-Fulkerson** 🔒 | `fordFulkerson.test.ts` | Classic 6-node network max flow $= 23$ | ✅ PASSED |
| **Graham's Scan** 🔒 | `grahamScan.test.ts` | Square + interior points → exactly 4 corner hull vertices | ✅ PASSED |
| **Randomized Quicksort** 🔒 | `randomizedQuicksort.test.ts` | 10 randomized runs: monotonic sort + multiset permutation preservation | ✅ PASSED |
| **Vertex Cover Approx** 🔒 | `vertexCoverApprox.test.ts` | Valid edge cover + $\|C\| = 2\|M\| \le 2 \cdot OPT$ bound | ✅ PASSED |
| **Tree Layout** | `treeLayout.test.ts` | Zero sibling overlap, parent centered over children, correct depth assignment | ✅ PASSED |

**Total: 20 test suites / 56 tests — all passing** (`npm test`)

---

## 6. Getting Started

### Prerequisites
- Node.js v18+
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
