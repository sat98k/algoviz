# Software Requirements Specification (SRS)
## DAA Algorithm Visualizer — BCSE204L Course Project

**Version:** 1.0
**Course:** BCSE204L – Design and Analysis of Algorithms
**Project Type:** Interactive web-based algorithm visualizer covering all core paradigms in the syllabus

---

## 1. Project Overview

### 1.1 Purpose
Build a single web application that visually demonstrates, step-by-step, one representative algorithm from each major paradigm/module of the DAA syllabus. The tool must let a user select an algorithm, provide/generate input, and watch the algorithm execute with play/pause/step/speed controls, while displaying complexity information and operation counters.

### 1.2 Scope
**In scope (12 algorithms across 8 syllabus modules):**

| # | Module | Algorithm | Paradigm |
|---|--------|-----------|----------|
| 1 | M1 – Greedy | Huffman Coding | Greedy |
| 2 | M1 – Divide & Conquer | Maximum Subarray (Kadane's or D&C version) | Divide & Conquer |
| 3 | M2 – DP | 0-1 Knapsack (DP) | Dynamic Programming |
| 4 | M2 – DP | Longest Common Subsequence (LCS) | Dynamic Programming |
| 5 | M2 – Backtracking | N-Queens | Backtracking |
| 6 | M2 – Branch & Bound | 0-1 Knapsack (B&B) | Branch & Bound |
| 7 | M3 – String Matching | KMP Algorithm | String Matching |
| 8 | M4 – Graph (shortest path) | Floyd-Warshall (or Bellman-Ford) | Graph / All-Pairs Shortest Path |
| 9 | M4 – Network Flow | Ford-Fulkerson | Max Flow |
| 10 | M5 – Geometric | Graham's Scan (Convex Hull) | Geometric |
| 11 | M6 – Randomized | Randomized Quicksort | Randomized |
| 12 | M7 – Complexity/Approx | Vertex Cover (2-Approximation) | Approximation |

**Out of scope (v1):** Suffix Trees, Rabin-Karp, Karatsuba, Assembly Line Scheduling, Matrix Chain Multiplication, TSP (DP/approx), Graph Coloring, Subset Sum, Job Selection B&B, Edmond-Karp/Push-Relabel, Jarvis' March, Line Segment Intersection, Hiring Problem, Karger's Min-Cut, SAT/3SAT/Clique/Set Cover. These may be added later as a "Phase 2" list — build the architecture so adding them later is low-effort (see Section 6).

### 1.3 Target Users
Solo student demo + faculty evaluation (viva). No auth, no backend persistence required. Must run locally or be deployable as a static/simple-hosted web app.

---

## 2. Functional Requirements

### 2.1 Global / Shell Requirements
- **FR-1**: Landing page listing all algorithms grouped by syllabus Module (1–7), matching the table in Section 1.2.
- **FR-2**: Clicking an algorithm navigates to a dedicated visualizer page for that algorithm.
- **FR-3**: Each visualizer page must have:
  - A short **problem statement** (1–3 sentences)
  - **Time/space complexity** displayed (e.g., "O(V³) time, O(V²) space")
  - **Input controls**: random generate button + manual input option
  - **Playback controls**: Play, Pause, Step Forward, Step Back, Reset, Speed slider
  - **Visualization canvas** (the animated area — see Section 3 for per-algorithm spec)
  - **Live operation counter** (comparisons / swaps / backtracks / relaxations / recursive calls — whichever is relevant to that algorithm)
  - **Result panel** showing final output (e.g., final sorted array, shortest path, compressed size, Huffman codes table, matched positions, hull points, matching set, etc.)
- **FR-4**: All algorithm logic must be implemented from scratch (no built-in library shortest-path/sort/etc. functions) — this is a hard requirement, since the whole point is demonstrating understanding of the algorithm, not calling a library.
- **FR-5**: Step-back must be possible (not just step-forward) — requires storing a full history of state snapshots per algorithm run, not just current state.
- **FR-6**: Responsive enough to demo on a single laptop screen during viva (does not need to be mobile-responsive).

### 2.2 Algorithm-Specific Functional Requirements

Each algorithm must expose its execution as a **sequence of discrete "steps,"** where each step is a serializable state object the UI can render and step through. This is the core architectural requirement — see Section 4.

| Algorithm | Input | Output | Key states to capture per step |
|---|---|---|---|
| Huffman Coding | Text string or file | Encoded bitstream + codes table + compression ratio | Current frequency table, current forest of trees, two nodes being merged, final tree, code table |
| Maximum Subarray | Array of integers (can include negatives) | Max sum + subarray indices | Current split point (if D&C) or current running sum/window (if Kadane's), current best |
| 0-1 Knapsack (DP) | Item weights/values array + capacity | Max value + selected items | DP table state after each cell fill, backtrack path through table for selected items |
| LCS | Two strings | LCS string + length | DP table state after each cell fill, backtrack path highlighting matched characters |
| N-Queens | Board size N | One (or all) valid solution(s) | Board state at each placement attempt, conflict highlighting, backtrack events |
| 0-1 Knapsack (B&B) | Same as DP version | Max value + selected items | Branch-and-bound tree: node bound calculation, pruned vs explored nodes |
| KMP | Text + pattern | All match positions | Partial match (failure) table build steps, pointer positions in text/pattern per comparison, mismatch/shift events |
| Floyd-Warshall | Weighted graph (adjacency matrix) | All-pairs shortest distances + path reconstruction | Distance matrix after each k-iteration, which cell updated and why |
| Ford-Fulkerson | Flow network (capacities) + source/sink | Max flow value + final flow assignment | Current augmenting path (via BFS/DFS), residual graph update, bottleneck capacity per iteration |
| Graham's Scan | Set of 2D points | Convex hull point sequence | Sorted points by angle, current hull stack state, push/pop events during scan |
| Randomized Quicksort | Array of integers | Sorted array | Current pivot (randomly chosen), partition boundary, swap events |
| Vertex Cover (2-Approx) | Graph (edge list) | Approximate vertex cover set | Current uncovered edge picked, both endpoints added, edges removed from consideration |

---

## 3. Visualization Component Requirements (Build Reusable, Not One-Off)

To keep this buildable in the timeframe, the agent should build a small set of **reusable visual components**, each parameterized by algorithm-specific step data. Do NOT build a bespoke renderer per algorithm from scratch.

| Component | Used by | Requirements |
|---|---|---|
| **ArrayBarVisualizer** | Max Subarray, Randomized Quicksort | Renders array as bars; supports highlighting (compare/swap/pivot/window) with distinct colors; shows index labels |
| **GridTableVisualizer** | 0-1 Knapsack (DP), LCS | Renders 2D DP table; highlights current cell being filled, source cells used in recurrence, and final backtrack path |
| **TreeVisualizer** | Huffman Coding, N-Queens (optional: search tree), 0-1 Knapsack (B&B) | Renders a tree structure; supports node merge animation (Huffman), node expand/prune animation (B&B) |
| **BoardVisualizer** | N-Queens | Renders an N×N grid; places/removes queen icons; highlights attacked cells/conflicts in red during backtrack |
| **GraphVisualizer** | Floyd-Warshall, Ford-Fulkerson, Vertex Cover | Renders nodes + weighted edges (force-directed or fixed layout); highlights active edge/path, updates edge labels (flow/residual capacity) dynamically |
| **PointCanvasVisualizer** | Graham's Scan | Renders 2D points on a canvas; draws hull edges incrementally; highlights current point under consideration and hull stack |
| **StringMatchVisualizer** | KMP | Renders text and pattern as aligned character cells; highlights current comparison, shift amount, match/mismatch color coding |

**Component build order recommendation** (highest reuse leverage first):
1. GraphVisualizer (used 3x) — build first
2. GridTableVisualizer (used 2x)
3. ArrayBarVisualizer (used 2x)
4. TreeVisualizer, BoardVisualizer, PointCanvasVisualizer, StringMatchVisualizer (1x each, but simpler)

---

## 4. Technical Architecture Requirements

### 4.1 Recommended Stack
- **Frontend framework**: React (function components + hooks) — good fit for state-driven step visualization
- **Styling**: Tailwind CSS or plain CSS — keep it clean, no need for a design system
- **Visualization rendering**: SVG or HTML5 Canvas (SVG preferred for graph/tree/board components since DOM-based highlighting is easier; Canvas acceptable for point/array-heavy ones)
- **No backend required** — this is a pure client-side app; all algorithms run in-browser in JavaScript/TypeScript
- **Language**: TypeScript strongly recommended over plain JS — catches step-object shape mismatches early, which is the most common bug class in this kind of project

### 4.2 Core Architectural Pattern: "Step Generator"

Every algorithm implementation must be refactored (or written from the start) as a **generator function** that yields a snapshot object at each meaningful step, rather than a function that just computes and returns a final answer. This is the single most important architectural decision — get the agent to implement this pattern first, before writing any specific algorithm.

Example shape (TypeScript-style pseudocode):
```typescript
interface AlgorithmStep {
  stepIndex: number;
  description: string;       // human-readable: "Comparing node 3 and node 5"
  state: Record<string, any>; // algorithm-specific snapshot (array copy, tree copy, matrix copy, etc.)
  highlight: {
    type: string;             // e.g. "compare", "swap", "backtrack", "merge"
    targets: (string|number)[]; // which indices/nodes/cells are involved
  };
  metrics: {
    comparisons?: number;
    swaps?: number;
    backtracks?: number;
    recursiveCalls?: number;
  };
}

function* huffmanSteps(input: string): Generator<AlgorithmStep> {
  // yield a step object at each meaningful point:
  // frequency table built, each merge, final tree, final codes
}
```

The UI layer then:
1. Calls the generator once at "Run/Generate," collecting **all steps into an array** (not streaming live) — this is what enables step-back and scrubbing.
2. Renders `steps[currentIndex]` via the relevant visual component.
3. Play/Pause just auto-increments `currentIndex` on a timer based on the speed slider.

**Why collect all steps upfront rather than compute live:** step-back requires this, and for the input sizes used in a classroom demo (arrays of 10-20, graphs of 8-15 nodes, N≤10 for N-Queens), pre-computing every step is computationally trivial — no performance concern.

### 4.3 File/Folder Structure (suggested)
```
/src
  /algorithms
    huffman.ts
    maxSubarray.ts
    knapsackDP.ts
    lcs.ts
    nQueens.ts
    knapsackBB.ts
    kmp.ts
    floydWarshall.ts
    fordFulkerson.ts
    grahamScan.ts
    randomizedQuicksort.ts
    vertexCoverApprox.ts
  /components
    /visualizers
      ArrayBarVisualizer.tsx
      GridTableVisualizer.tsx
      TreeVisualizer.tsx
      BoardVisualizer.tsx
      GraphVisualizer.tsx
      PointCanvasVisualizer.tsx
      StringMatchVisualizer.tsx
    PlaybackControls.tsx
    ComplexityBadge.tsx
    MetricsPanel.tsx
    ResultPanel.tsx
  /pages
    Home.tsx
    AlgorithmPage.tsx   // generic page, driven by algorithm config
  /config
    algorithmRegistry.ts // maps algorithm id -> { module, name, description, complexity, stepGenerator, visualizerComponent, inputSchema }
  /tests
    huffman.test.ts
    ...one test file per algorithm with known correct outputs
```

### 4.4 Algorithm Registry Pattern
To keep adding algorithms low-friction (in case Phase 2 expansion happens), require a central registry:
```typescript
export const algorithmRegistry: AlgorithmConfig[] = [
  {
    id: "huffman",
    module: 1,
    name: "Huffman Coding",
    paradigm: "Greedy",
    complexity: { time: "O(n log n)", space: "O(n)" },
    description: "...",
    stepGenerator: huffmanSteps,
    visualizer: "TreeVisualizer",
    inputSchema: { type: "text" }
  },
  // ...
];
```
The `Home.tsx` and `AlgorithmPage.tsx` should be **generic and driven entirely by this registry** — no hardcoded per-algorithm routing/UI logic outside the registry + the algorithm/visualizer implementations themselves.

---

## 5. Correctness & Testing Requirements (Non-Negotiable)

This is the section most likely to be skipped by an agent unless explicitly instructed — enforce it.

- **TR-1**: Every algorithm must have a unit test file with at least 2 known-correct test cases (input → expected final output), verified against manually computed or textbook examples.
- **TR-2**: DP algorithms (Knapsack, LCS) — verify final DP table values against hand-computed small examples (e.g., capacity=10, 4 items).
- **TR-3**: Graph algorithms (Floyd-Warshall, Ford-Fulkerson) — verify against a small graph (≤6 nodes) where the correct shortest-path/max-flow values are known/computed by hand.
- **TR-4**: N-Queens — verify the solver finds a valid solution for N=4 (2 solutions exist) and N=8 (92 solutions exist — verifying count is optional, but at least one valid found solution must satisfy all constraints programmatically).
- **TR-5**: KMP — verify against a string with multiple overlapping pattern occurrences.
- **TR-6**: Randomized Quicksort — verify output is sorted AND is a permutation of the input (length + multiset equality), for at least 5 random runs (since randomness means single-run testing isn't enough).
- **TR-7**: Graham's Scan — verify hull output against a manually verifiable point set (e.g., a square with points inside it — hull should be exactly the 4 corners).
- **TR-8**: Vertex Cover approx — verify output is a valid cover (every edge has at least one endpoint in the returned set) and that |cover| ≤ 2 × |optimal| is at least plausible for the test graph.
- **TR-9**: A README section titled "Verification" documenting each test case and its expected vs actual result — this doubles as viva evidence.

---

## 6. Non-Functional Requirements
- **NFR-1 (Performance)**: All animations must run smoothly for the input sizes used in demo (arrays ≤ 30 elements, graphs ≤ 15 nodes, N-Queens N ≤ 10, text/pattern ≤ 100 chars). No need to optimize for large inputs.
- **NFR-2 (Extensibility)**: Adding a new algorithm should require: (1) one new file in `/algorithms`, (2) one registry entry, (3) reuse of an existing visualizer component wherever possible. This must not require touching routing/shell code.
- **NFR-3 (Explainability)**: Every visualizer page must include enough inline text/tooltips that someone unfamiliar with the algorithm could follow along — this matters for viva credibility, not just demo polish.
- **NFR-4 (No external paid services)**: No paid APIs, no map services requiring billing — everything must run fully offline/locally after initial setup.

---

## 7. Deliverables Checklist (for the student, not just the agent)

- [ ] Working web app covering all 12 algorithms listed in Section 1.2
- [ ] Each algorithm has: problem statement, complexity display, working step-by-step visualization, operation counter, result panel
- [ ] Unit tests for all 12 algorithms with documented known-correct outputs (Section 5)
- [ ] README with: setup instructions, architecture overview, verification section, syllabus-module mapping table
- [ ] Project report (separate doc) covering: motivation, module-by-module algorithm writeups (problem statement, why this paradigm, complexity derivation/proof sketch, implementation notes), and screenshots of each visualizer
- [ ] Personal understanding check: for each of the 12 algorithms, be able to explain — without looking at code — why the paradigm fits, the time/space complexity derivation, and walk through one example by hand

---

## 8. Build Order / Milestones (map to the 3-month plan)

**Milestone 1 (Weeks 1-2): Architecture**
- App shell, routing, algorithm registry pattern, PlaybackControls component
- ONE fully working algorithm end-to-end (recommend: Randomized Quicksort, using ArrayBarVisualizer) to validate the whole pipeline before scaling out

**Milestone 2 (Weeks 3-5): DP + Backtracking + B&B cluster**
- GridTableVisualizer → 0-1 Knapsack (DP), LCS
- BoardVisualizer → N-Queens
- TreeVisualizer (B&B mode) → 0-1 Knapsack (B&B)
- *Deliberately pair DP Knapsack and B&B Knapsack for side-by-side comparison — this is your strongest talking point*

**Milestone 3 (Weeks 6-8): Graph cluster**
- GraphVisualizer → Floyd-Warshall, Ford-Fulkerson, Vertex Cover Approx

**Milestone 4 (Weeks 9-10): String + Geometric + remaining Greedy/D&C**
- StringMatchVisualizer → KMP
- PointCanvasVisualizer → Graham's Scan
- TreeVisualizer (merge mode) → Huffman Coding
- ArrayBarVisualizer → Maximum Subarray

**Milestone 5 (Weeks 11-12): Testing, polish, report**
- Fill in all unit tests (Section 5)
- Write README + verification section
- Write project report
- Full run-through rehearsal for viva

---

## 9. Instructions for the Coding Agent (paste-ready summary)

> Build a React + TypeScript web application per this SRS. Start with Milestone 1: implement the algorithm registry pattern, the generic AlgorithmPage driven by that registry, the PlaybackControls component, and get ONE algorithm (Randomized Quicksort) working fully end-to-end using the "step generator" pattern described in Section 4.2, before implementing any other algorithm. Every algorithm's core logic must be implemented from scratch — do not use built-in sort/shortest-path/etc. library functions. Every algorithm requires a unit test file with known-correct test cases before being considered done. Follow the reusable component list in Section 3 — do not build a new visual renderer per algorithm if an existing component fits with parameterization. After Milestone 1 is verified working, proceed through Milestones 2-5 in order.
