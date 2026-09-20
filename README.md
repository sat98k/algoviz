# DAA Algorithm Visualizer — BCSE204L Course Project

Interactive, web-based algorithm visualizer covering core paradigms from the **BCSE204L (Design and Analysis of Algorithms)** syllabus.

Built with **React, TypeScript, Tailwind CSS, and Vitest**, utilizing a **step-generator snapshot architecture** for deterministic forward and backward stepping.

> **Course Project Status**: All **32 algorithms** across **Modules 1 through 7** are fully implemented from scratch, equipped with interactive visualizers, tested via automated test suites (119 passing tests), and directly accessible in the home catalog.

---

## 1. Syllabus Coverage — All 8 Modules

### Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented — pure step generator + visualizer + unit tests passing |
| 📖 | Syllabus theoretical topic — conceptual / reduction proof (no step generator applicable) |

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
| 2.05 | Travelling Salesman Problem (Held-Karp DP) | Dynamic Programming | $O(n^2 \cdot 2^n)$ | $O(n \cdot 2^n)$ | `TspVisualizer` | ✅ |
| 2.06 | N-Queens | Backtracking | $O(N!)$ | $O(N)$ | `BoardVisualizer` | ✅ |
| 2.07 | Subset Sum | Backtracking | $O(2^n)$ | $O(n)$ | `TreeVisualizer` | ✅ |
| 2.08 | Graph Coloring (m-Coloring) | Backtracking | $O(k^n)$ | $O(n)$ | `GraphVisualizer` | ✅ |
| 2.09 | 0-1 Knapsack (Branch & Bound) | Branch & Bound | $O(2^n)$ worst | $O(2^n)$ worst | `TreeVisualizer` | ✅ |
| 2.10 | Job Selection Problem (Branch & Bound) | Branch & Bound | $O(2^n)$ worst | $O(2^n)$ worst | `TreeVisualizer` | ✅ |

---

### Module 3 — String Matching

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 3.01 | Naive String Matching | String Matching | $O(nm)$ | $O(1)$ | `StringMatchVisualizer` | ✅ |
| 3.02 | Knuth-Morris-Pratt (KMP) | String Matching | $O(n + m)$ | $O(m)$ | `StringMatchVisualizer` | ✅ |
| 3.03 | Rabin-Karp | String Matching | $O(n + m)$ avg | $O(1)$ | `StringMatchVisualizer` | ✅ |
| 3.04 | Suffix Trees (Ukkonen-style) | String Matching | $O(n)$ | $O(n)$ | `TreeVisualizer` | ✅ |

---

### Module 4 — Graph Algorithms & Network Flow

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 4.01 | Bellman-Ford | Graph / SSSP | $O(V \cdot E)$ | $O(V)$ | `GraphVisualizer` | ✅ |
| 4.02 | Floyd-Warshall (APSP) | Graph / APSP | $O(V^3)$ | $O(V^2)$ | `GraphVisualizer` | ✅ |
| 4.03 | Ford-Fulkerson | Max Flow | $O(V \cdot E^2)$ | $O(V + E)$ | `GraphVisualizer` | ✅ |
| 4.04 | Edmonds-Karp | Max Flow | $O(V \cdot E^2)$ | $O(V + E)$ | `GraphVisualizer` | ✅ |
| 4.05 | Push-Relabel (Goldberg-Tarjan) | Max Flow | $O(V^2 \cdot E)$ | $O(V + E)$ | `GraphVisualizer` | ✅ |

---

### Module 5 — Geometric Algorithms

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 5.01 | Line Segment Intersection (Sweep-Line) | Geometry | $O(n \log n)$ | $O(n)$ | `SweepLineVisualizer` | ✅ |
| 5.02 | Graham's Scan (Convex Hull) | Geometry | $O(n \log n)$ | $O(n)$ | `PointCanvasVisualizer` | ✅ |
| 5.03 | Jarvis' March (Gift Wrapping) | Geometry | $O(nh)$ | $O(h)$ | `PointCanvasVisualizer` | ✅ |

---

### Module 6 — Randomized Algorithms

| # | Algorithm | Paradigm | Time | Space | Visualizer | Status |
|---|-----------|----------|------|-------|------------|--------|
| 6.01 | Randomized Quicksort | Randomized | $O(n \log n)$ avg | $O(\log n)$ | `ArrayBarVisualizer` | ✅ |
| 6.02 | The Hiring Problem | Randomized | $O(n)$ | $O(1)$ | `ArrayBarVisualizer` | ✅ |
| 6.03 | Karger's Min-Cut | Randomized | $O(V^2)$ per run | $O(V + E)$ | `GraphVisualizer` | ✅ |

---

### Module 7 — Complexity Classes & Approximation Algorithms

| # | Algorithm / Topic | Paradigm | Complexity | Visualizer | Status |
|---|-------------------|----------|------------|------------|--------|
| 7.01 | SAT, 3-SAT, Clique, Indep. Set | NP-Complete | Conceptual / Reductions | — | 📖 Theory |
| 7.02 | Vertex Cover (2-Approximation) | Approximation | $O(V + E)$ | `GraphVisualizer` | ✅ |
| 7.03 | Set Cover (Greedy Approximation) | Approximation | $O(m \cdot n)$ | `SetCoverVisualizer` | ✅ |
| 7.04 | TSP 2-Approximation (MST-Doubling) | Approximation | $O(V^2)$ | `TspVisualizer` | ✅ |

---

### Module 8 — Contemporary Issues

> Conceptual / discussion module — no algorithm implementations applicable.

---

## 2. Implementation Status Summary

| Category | Count |
|----------|-------|
| ✅ **Fully implemented, tested & visible in catalog** (Modules 1–7) | **32** |
| 📖 **Theoretical / Conceptual Topics** (NP-Completeness proofs, reductions, M8) | **5** |
| **Total Algorithms & Syllabus Topics Covered** | **37** |

---

### 3. Key Features

- **Discrete Step Generator Architecture**: Every algorithm is implemented from scratch as a generator yielding immutable state snapshots (`AlgorithmStep`).
- **Bidirectional Playback**: Step forward, step backward, scrubbing slider, speed control ($0.5\times$ to $4\times$), pause, and auto-play.
- **14 Parameterized Reusable Visualizers**:
  - `TspVisualizer` — Circular graph canvas with user-editable symmetric distance matrix (single source of truth), step-by-step subproblem candidate evaluation, cycle return edge closing, synchronized Held-Karp DP table (`TspDpMatrix`), and 3-phase MST-Doubling 2-approximation mode (Prim's MST, Eulerian multigraph, DFS preorder shortcutting).
  - `SetCoverVisualizer` — Universe element chips with real-time coverage checkmarks, candidate subset cards displaying new element yields, and greedy $H(|U|)$ bound tracking.
  - `SweepLineVisualizer` — 2D geometric plane with animated vertical sweep line, sorted event queue, active segment status structure $T$, and intersection markers.
  - `PointCanvasVisualizer` — 2D Cartesian coordinate plane with polar sweep order, cross-product turn checks, and Graham's Scan / Jarvis' March convex hull tracing.
  - `ArrayBarVisualizer` — Bar chart supporting Quicksort (pivot, compare, swap, window) and The Hiring Problem (`INTV`, `BEST`, `HIRED`, `SKIP` badges, candidate expenditure telemetry).
  - `GraphVisualizer` — SVG graphs with adjacency matrix and table views; Bellman-Ford distances, Floyd-Warshall distance matrices, Ford-Fulkerson & Edmonds-Karp residual flow networks, Push-Relabel vertex heights $h(u)$ and excess $e(u)$, Karger's Min-Cut randomized contraction, Vertex Cover matching, and Graph Coloring conflict rings.
  - `StringMatchVisualizer` — Dual text/pattern tape alignment with LPS array, match offsets, and rolling hash values.
  - `GridTableVisualizer` — 2D DP matrices with recurrence callouts, split points, backtrack paths (Knapsack DP, LCS, Matrix Chain).
  - `TreeVisualizer` — Huffman forests, backtracking decision trees (Subset Sum), B&B state-space trees with prune highlights (Knapsack B&B, Job Selection B&B), and Ukkonen Suffix Trees.
  - `BoardVisualizer` — $N \times N$ chessboard with threat paths and conflict backtracks.
  - `RecursionTreeVisualizer` — D&C call trees, subproblem breakdown, bottom-up combine phase (Max Subarray, Karatsuba).
  - `AssemblyLineVisualizer` — Dual-lane pipeline with transfer penalties and optimal route back-propagation.
  - `FractionalKnapsackVisualizer` — Capacity gauge, ratio-sorted item cards, fractional slice indicators.
  - `HuffmanCodecVisualizer` — Interactive encoding & decoding studio with real-time bitstream generation, tree traversal animation, and decode verification.
- **Live Operation Counters**: Comparisons, swaps, backtracks, relaxations, nodes explored, pruned branches.
- **Side-by-Side Comparison**: Real-time synchronous comparison between **0-1 Knapsack DP** and **0-1 Knapsack Branch & Bound**.

---

## 4. Project Structure

```
/Algoviz
├── src/
│   ├── algorithms/               # 32 pure step-generator functions
│   │   ├── fractionalKnapsack.ts       # M1: Greedy
│   │   ├── huffman.ts                  # M1: Greedy
│   │   ├── maxSubarray.ts              # M1: Divide & Conquer
│   │   ├── karatsuba.ts                # M1: Divide & Conquer
│   │   ├── knapsackDP.ts               # M2: Dynamic Programming
│   │   ├── lcs.ts                      # M2: Dynamic Programming
│   │   ├── matrixChainMultiplication.ts# M2: Dynamic Programming
│   │   ├── assemblyLineScheduling.ts   # M2: Dynamic Programming
│   │   ├── tsp.ts                      # M2: Held-Karp DP
│   │   ├── nQueens.ts                  # M2: Backtracking
│   │   ├── subsetSum.ts                # M2: Backtracking
│   │   ├── graphColoring.ts            # M2: Backtracking
│   │   ├── knapsackBB.ts               # M2: Branch & Bound
│   │   ├── jobSelectionBB.ts           # M2: Branch & Bound
│   │   ├── naiveStringMatch.ts         # M3: String Matching
│   │   ├── kmp.ts                      # M3: String Matching
│   │   ├── rabinKarp.ts                # M3: String Matching
│   │   ├── suffixTree.ts               # M3: String Matching
│   │   ├── bellmanFord.ts              # M4: SSSP
│   │   ├── floydWarshall.ts            # M4: APSP
│   │   ├── fordFulkerson.ts            # M4: Max Flow
│   │   ├── edmondsKarp.ts              # M4: BFS Max Flow
│   │   ├── pushRelabel.ts              # M4: Preflow-Push Max Flow
│   │   ├── lineSegmentIntersection.ts  # M5: Sweep-Line
│   │   ├── grahamScan.ts               # M5: Convex Hull
│   │   ├── jarvisMarch.ts              # M5: Gift Wrapping
│   │   ├── randomizedQuicksort.ts      # M6: Randomized
│   │   ├── hiringProblem.ts            # M6: Randomized
│   │   ├── kargerMinCut.ts             # M6: Randomized Min-Cut
│   │   ├── vertexCoverApprox.ts        # M7: 2-Approximation
│   │   ├── setCover.ts                 # M7: Greedy Approximation
│   │   └── tspApprox.ts                # M7: MST-Doubling 2-Approx
│   ├── components/
│   │   ├── common/               # PlaybackControls, MetricsPanel, ResultPanel, InputControlPanel
│   │   ├── layout/               # Navbar, Footer
│   │   └── visualizers/          # 14 Reusable visualizers (SetCoverVisualizer, SweepLineVisualizer, etc.)
│   ├── config/
│   │   └── algorithmRegistry.ts  # Central metadata & step-generator bindings (32 entries)
│   ├── pages/
│   │   ├── Home.tsx              # Syllabus catalog & filter dashboard (32 algorithms visible)
│   │   ├── AlgorithmPage.tsx     # Generic visualizer driver page
│   │   └── ComparisonPage.tsx    # DP vs Branch & Bound comparison
│   ├── tests/                    # Vitest unit test suite (35 suites, 119 tests — 100% passing)
│   ├── utils/
│   │   ├── treeLayout.ts         # 2-pass layout engine (bottom-up widths, top-down coordinates)
│   │   ├── treeTheme.ts          # WCAG AA contrast colour theme utility
│   │   └── huffmanCodec.ts       # Huffman encode/decode bit-level engine
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

All 32 implemented algorithms are covered by automated unit tests validating textbook cases, theoretical bounds, and cross-validation equivalence:

| Test Suite | File | Verified Invariant / Benchmark Case | Result |
|---|---|---|---|
| **Fractional Knapsack** | `fractionalKnapsack.test.ts` | Ratio-descending greedy fill, $W=50 \to V=240$, fractional slice | ✅ PASSED |
| **Huffman Coding** | `huffman.test.ts` | Prefix-free code property, `ABRACADABRA`, compression ratio | ✅ PASSED |
| **Huffman Codec Studio** | `huffmanCodec.test.ts` | Encode bitstream, tree traversal decode, arbitrary text roundtrip | ✅ PASSED |
| **Max Subarray (D&C)** | `maxSubarray.test.ts` | `[-2,1,-3,4,-1,2,1,-5,4] → 6`, all-negatives edge case | ✅ PASSED |
| **Karatsuba** | `karatsuba.test.ts` | 4-digit, asymmetric, single-digit base case, 16-digit large numbers | ✅ PASSED |
| **0-1 Knapsack DP** | `knapsackDP.test.ts` | Capacity 5 & 10 item sets, table values & item backtracking | ✅ PASSED |
| **LCS** | `lcs.test.ts` | `ABCBDAB & BDCAB → 4`, `AGGTAB & GXTXAYB` | ✅ PASSED |
| **Matrix Chain Mult** | `matrixChainMultiplication.test.ts` | CLRS `[10,20,30,40,30] → 30000`, reconstructed parens | ✅ PASSED |
| **Assembly Line Scheduling** | `assemblyLineScheduling.test.ts` | 2-line textbook ($T=35$, route 1-2-1-1-2-1), forward DP & backtrack | ✅ PASSED |
| **Travelling Salesman Problem** | `tsp.test.ts` | Textbook 4-city ($OPT=80$), 3-city ($OPT=21$), user distance editing | ✅ PASSED |
| **N-Queens** | `nQueens.test.ts` | $N=4$ (2 solutions), $N=8$ non-attacking row/col/diagonal checks | ✅ PASSED |
| **Subset Sum** | `subsetSum.test.ts` | Solvable subsets, unreachable sums with pruning, include/exclude paths | ✅ PASSED |
| **Graph Coloring** | `graphColoring.test.ts` | 5-node planar 3-coloring, K4 chromatic number conflict, C5 vs C6 cycles | ✅ PASSED |
| **0-1 Knapsack B&B** | `knapsackBB.test.ts` | Optimal value matches DP, branch pruning verified | ✅ PASSED |
| **Job Selection B&B** | `jobSelectionBB.test.ts` | 5-job benchmark (profit 142), Horowitz-Sahni (127), deadline pruning | ✅ PASSED |
| **Naive String Matching** | `naiveStringMatch.test.ts` | Pattern matching with shifts, prefix matches, repeated letters | ✅ PASSED |
| **KMP** | `kmp.test.ts` | `ABABDABACDABABCABAB` match pos 10, overlapping matches | ✅ PASSED |
| **Rabin-Karp** | `rabinKarp.test.ts` | Rolling hash collision verification, modulo arithmetic, string matches | ✅ PASSED |
| **Suffix Tree** | `suffixTree.test.ts` | Suffix edge labels, substring searches, linear construction | ✅ PASSED |
| **Bellman-Ford** | `bellmanFord.test.ts` | Negative weight edges, negative cycle detection, relaxation order | ✅ PASSED |
| **Floyd-Warshall** | `floydWarshall.test.ts` | 4-node & 5-node directed graphs with negative weights | ✅ PASSED |
| **Ford-Fulkerson** | `fordFulkerson.test.ts` | Classic 6-node network max flow $= 23$ | ✅ PASSED |
| **Edmonds-Karp** | `edmondsKarp.test.ts` | Shortest augmenting paths via BFS, 6-node ($23$) and 4-node ($17$) | ✅ PASSED |
| **Push-Relabel** | `pushRelabel.test.ts` | Goldberg-Tarjan preflow-push, height function, max flow $= 23$ | ✅ PASSED |
| **Line Segment Intersection** | `lineSegmentIntersection.test.ts` | Bentley-Ottmann sweep-line, active set $T$, crossing segment detection | ✅ PASSED |
| **Graham's Scan** | `grahamScan.test.ts` | Square + interior points → exactly 4 corner hull vertices | ✅ PASSED |
| **Jarvis' March** | `jarvisMarch.test.ts` | Gift wrapping CCW orientation checks, identical hull to Graham's Scan | ✅ PASSED |
| **Randomized Quicksort** | `randomizedQuicksort.test.ts` | 10 randomized runs: monotonic sort + multiset permutation preservation | ✅ PASSED |
| **The Hiring Problem** | `hiringProblem.test.ts` | Sequential online decision-making, interview vs hiring expense, $O(\ln n)$ | ✅ PASSED |
| **Karger's Min-Cut** | `kargerMinCut.test.ts` | Barbell graph edge contraction across randomized trials, min-cut $= 2$ | ✅ PASSED |
| **Vertex Cover Approx** | `vertexCoverApprox.test.ts` | Valid edge cover + $\|C\| = 2\|M\| \le 2 \cdot OPT$ bound | ✅ PASSED |
| **Set Cover Approx** | `setCover.test.ts` | Greedy maximum uncovered element selection, $H(\|U\|)$ bound | ✅ PASSED |
| **TSP 2-Approximation** | `tspApprox.test.ts` | Prim's MST → Doubled Eulerian multigraph → DFS shortcut tour $\le 2 \cdot OPT$ | ✅ PASSED |
| **Cross-Validation Suite** | `crossValidationReport.test.ts` | Exact numerical equivalence across independent algorithmic paradigms | ✅ PASSED |
| **Tree Layout** | `treeLayout.test.ts` | Zero sibling overlap, parent centered over children, correct depth | ✅ PASSED |

**Total: 35 test suites / 119 tests — all passing** (`npm test`)

### Empirical Cross-Validation Proof (Viva Evidence)

| Check | Algorithms Compared | Input / Benchmark | Output Values & Agreement |
|---|---|---|---|
| **1. 2D Convex Hull** | Jarvis’ March vs Graham’s Scan | 8-point Cartesian cloud | **Identical 6 vertices**: `P7 (220, 80) → P0 (100, 100) → P1 (150, 250) → P2 (250, 300) → P3 (350, 220) → P4 (400, 120)` *(Interior points $P5, P6$ omitted by both)*. **100% agreement.** |
| **2. Max Flow 3-Way Agreement** | Ford-Fulkerson vs Edmonds-Karp vs Push-Relabel | Standard CLRS 6-node network | Ford-Fulkerson: **23**<br>Edmonds-Karp: **23**<br>Push-Relabel: **23**<br>**100% exact numerical agreement.** |
| **3. Metric TSP 2-Approx Bound** | MST-Doubling Approx vs Held-Karp Exact DP | Standard 4-city cost matrix | Held-Karp Optimal ($\text{OPT}$): **80**<br>MST Weight $W(T)$: **45**<br>Doubled Weight $2 \cdot W(T)$: **90**<br>Approx Tour Cost: **95**<br>Ratio: **$1.19\times \le 2.0\times$** *(Strictly within the theoretical 2x bound)*. |

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
