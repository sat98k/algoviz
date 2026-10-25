import { AlgorithmStep } from '../types/algorithm';

/**
 * The "you are here" strip shown above the visualizer: one short chip per entry of the
 * algorithm's "How it works" list (same order and numbering, see coreSteps.ts), with the
 * chip for the current step lit up.
 *
 * `rules` map a step's title to the chip it belongs to (0-based), or to a span of chips
 * [first, last] when one step does several "How it works" steps at once (e.g. creating the
 * table and filling its zero row). They are tried in order and the first match wins. A step
 * that matches nothing keeps the previous step's chips, so only the steps that start a new
 * stage need a rule.
 */
export type ChipSpan = [number, number];

export interface Roadmap {
  labels: string[];
  rules: [RegExp, number | ChipSpan][];
}

export const ROADMAPS: Record<string, Roadmap> = {
  // ── Module 1 ─────────────────────────────────────────────────────────────
  'fractional-knapsack': {
    labels: ['Value per kg', 'Sort by ratio', 'Take items in order', 'Stop when full'],
    rules: [
      [/^Initialize/, 0],
      [/^Sort/, 1],
      [/^(Examining|Take|Skip)/, 2],
      [/Complete/, 3],
    ],
  },
  huffman: {
    labels: ['Count letters', 'Queue of trees', 'Merge two smallest', 'Repeat to one tree', 'Read the codes'],
    rules: [
      [/^Frequency/, [0, 1]],
      [/^(Select|Merged)/, [2, 3]],
      [/Complete/, 4],
    ],
  },
  'max-subarray': {
    labels: ['One element', 'Split at middle', 'Solve both halves', 'Crossing stretch', 'Pick the best'],
    rules: [
      [/^Base Case/, 0],
      [/^(Divide|Split)/, 1],
      [/^Recursive Call/, 2],
      [/^(Crossing|Left Scan|Right Scan|CrossSum)/, 3],
      [/^(Combine|Maximum Subarray Complete)/, 4],
    ],
  },
  karatsuba: {
    labels: ['Single digit?', 'Split the numbers', 'Three products', 'Cross term', 'Combine'],
    rules: [
      [/^Base Case/, 0],
      [/^Recursive Call/, 0],
      [/Split Numbers/, 1],
      [/Compute P\d/, 2],
      [/Cross Term/, 3],
      [/(Combine Results|Complete)/, 4],
    ],
  },

  // ── Module 2: Dynamic Programming ────────────────────────────────────────
  'knapsack-dp': {
    labels: ['Build the table', 'Zero row & column', 'Fill every cell', 'Read the answer', 'Trace back'],
    rules: [
      [/^Initialize/, [0, 1]],
      [/^(Item \d+ Exceeds|Evaluate Item)/, 2],
      [/^DP Table Complete/, 3],
      [/^Backtrack/, 4],
      [/Knapsack Complete/, 4],
    ],
  },
  lcs: {
    labels: ['Build the table', 'Zero row & column', 'Fill every cell', 'Read the length', 'Trace back'],
    rules: [
      [/^Initialize/, [0, 1]],
      [/^(Match|Mismatch):/, 2],
      [/^Table Complete/, 3],
      [/^(↖|↑|←)/, 4],
      [/Backtracking Complete/, 4],
    ],
  },
  'matrix-chain-multiplication': {
    labels: ['Cost of one product', 'Single matrix = 0', 'Chain length 2, 3, …', 'Try every split', 'Read the brackets'],
    rules: [
      [/^Initialize/, [0, 1]],
      [/^Compute Cell/, 2],
      [/^Evaluate Split/, 3],
      [/^(DP Table Complete|Backtrack|Merge Group|Matrix Chain Multiplication Complete)/, 4],
    ],
  },
  'assembly-line-scheduling': {
    labels: ['Fastest time per station', 'Station 1', 'Stay or switch?', 'Add exit times', 'Trace the route'],
    rules: [
      [/^Initialize/, [0, 1]],
      [/^Compute Station/, 2],
      [/^Forward DP Pass Complete/, 3],
      [/^(Backtrack|Assembly Line Scheduling Complete)/, 4],
    ],
  },
  tsp: {
    labels: ['Notebook of paths', 'Start = 0', 'Grow the sets', 'Close the tour', 'Read the tour'],
    rules: [
      [/^Initialize/, 0],
      [/^Base Case/, 1],
      [/^DP\(/, 2],
      [/^Close Tour/, 3],
      [/^(Backtrack|Optimal Tour Complete)/, 4],
    ],
  },

  // ── Module 2: Backtracking ───────────────────────────────────────────────
  'n-queens': {
    labels: ['Row by row', 'Try each column', 'Attacked? Next', 'Safe? Place it', 'Backtrack', 'Solution'],
    rules: [
      [/^Initialize/, [0, 1]],
      [/^Conflict/, 2],
      [/^Place Queen/, 3],
      [/^Backtrack/, 4],
      [/(Solution|Search Complete)/, 5],
    ],
  },
  'subset-sum': {
    labels: ['Include or exclude', 'Running sum', 'Hit the target', 'Prune', 'Go deeper / backtrack'],
    rules: [
      [/^Initialize/, 0],
      [/^(Include|Exclude) Element/, [0, 1]],
      [/^Prune/, 3],
      [/^Backtrack/, 4],
      [/(Achieved|Found|Solution)/, 2],
    ],
  },
  'graph-coloring': {
    labels: ['Vertex by vertex', 'Try colours 1…k', 'Clash? Next colour', 'Safe? Assign it', 'Backtrack'],
    rules: [
      [/^Initialize/, 0],
      [/^Considering/, 1],
      [/^Conflict/, 2],
      [/^Assign/, 3],
      [/^Backtrack/, 4],
      [/(Found|Complete|Exists)/, 3],
    ],
  },

  // ── Module 2: Branch & Bound ─────────────────────────────────────────────
  'knapsack-bb': {
    labels: ['Sort by ratio', 'Take or skip', 'Upper bound', 'Most promising first', 'Prune', 'Best is optimal'],
    rules: [
      [/^Initialize/, 0],
      [/^Explore Node/, [2, 3]],
      [/^New Best/, 1],
      [/^Prune/, 4],
      [/Complete/, 5],
    ],
  },
  'job-selection-bb': {
    labels: ['Sort by profit', 'Include or exclude', 'Meets deadlines?', 'Bound & prune', 'Keep the best'],
    rules: [
      [/^Initialize/, 0],
      [/^Explore Node/, 1],
      [/(Added to Queue|New Best|Needs No Further)/, 1],
      [/Infeasible/, 2],
      [/by Bound/, 3],
      [/Complete/, 4],
    ],
  },

  // ── Module 3 ─────────────────────────────────────────────────────────────
  'naive-string-match': {
    labels: ['Place at shift 0', 'Compare letters', 'Mismatch: slide', 'Match: record', 'Until the end'],
    rules: [
      [/^Initialize/, 0],
      [/^Align Pattern/, 1],
      [/^Compare Character/, 1],
      [/^Mismatch/, 2],
      [/^Pattern Match Confirmed/, 3],
      [/Complete/, 4],
    ],
  },
  kmp: {
    labels: ['Build LPS table', 'Scan the text', 'Match: advance', 'Mismatch: fall back', 'Full match'],
    rules: [
      [/^(Phase 1|LPS)/, 0],
      [/^Phase 2/, 1],
      [/^Compare text/, 2],
      [/^Mismatch/, 3],
      [/(Full Pattern Match|Complete)/, 4],
    ],
  },
  'rabin-karp': {
    labels: ['Hash pattern & window', 'Hashes differ: skip', 'Equal: check letters', 'Roll the hash', 'Until the last window'],
    rules: [
      [/^(Initialize|Compute Initial)/, 0],
      [/^Shift \d+: Compare/, 1],
      [/^(Verify Character|Spurious Hit|Full Pattern Match)/, 2],
      [/^Roll Hash/, 3],
      [/Complete/, 4],
    ],
  },
  'suffix-tree': {
    labels: ['Append $', 'Grow the tree', 'Paths = suffixes', 'Walk the pattern', 'Collect the leaves'],
    rules: [
      [/^Initialize/, 0],
      [/^(Phase|Rule)/, 1],
      [/^Suffix tree complete/, 2],
      [/^(Match P|Mismatch)/, 3],
      [/^(Pattern consumed|Suffix Tree Search Complete)/, 4],
    ],
  },

  // ── Module 4 ─────────────────────────────────────────────────────────────
  'floyd-warshall': {
    labels: ['Direct distances', 'Next stop k', 'Check every pair', 'Shorter? Update', 'All shortest paths'],
    rules: [
      [/^Initialize/, 0],
      [/^Starting (Round|Iteration)/, 1],
      [/^Check D/, 2],
      [/^Shorter Path/, 3],
      [/Complete/, 4],
    ],
  },
  'bellman-ford': {
    labels: ['Source = 0, rest = ∞', 'Relax every edge', 'Repeat V − 1 passes', 'Negative-cycle check'],
    rules: [
      [/^Initialize/, 0],
      [/^(Relax|Check) /, 1],
      [/^(Pass|No changes)/, 2],
      [/^(Verification|Negative cycle|Bellman-Ford Halted|Bellman-Ford Complete)/, 3],
    ],
  },
  'ford-fulkerson': {
    labels: ['Zero flow', 'Find a path', 'Its bottleneck', 'Push the flow', 'Until no path'],
    rules: [
      [/^Initialize/, 0],
      [/^Augmenting Path Found/, [1, 2]],
      [/^Augmented Flow/, 3],
      [/Complete/, 4],
    ],
  },
  'edmonds-karp': {
    labels: ['BFS for a path', 'Its bottleneck', 'Push the flow', 'Until T unreachable'],
    rules: [
      [/^(Initialize|BFS)/, 0],
      [/^Shortest Augmenting Path/, 1],
      [/^Augment Residual/, 2],
      [/Complete/, 3],
    ],
  },
  'push-relabel': {
    labels: ['Preflow from S', 'Excess', 'Push downhill', 'Relabel (lift)', 'No excess left'],
    rules: [
      [/^Initialize Push-Relabel/, 0],
      [/^Initialize Preflow/, [0, 1]],
      [/^PUSH/, 2],
      [/^RELABEL/, 3],
      [/Complete/, 4],
    ],
  },

  // ── Module 5 (sweep line is out of scope for now) ────────────────────────
  'graham-scan': {
    labels: ['Lowest point', 'Sort by angle', 'Push in order', 'Right turn? Pop', 'The hull'],
    rules: [
      [/^(Initialize Graham|Pivot Selected)/, 0],
      [/^Points Sorted/, 1],
      [/^(Initialize Hull Stack|Push)/, 2],
      [/^(Check Orientation|Pop)/, 3],
      [/Complete/, 4],
    ],
  },
  'jarvis-march': {
    labels: ['Lowest point', 'Find the next corner', 'Move to it', 'Back at the start'],
    rules: [
      [/^(Initialize|Anchor)/, 0],
      [/^(Wrap from|Orientation Check|Update Candidate)/, 1],
      [/^Confirmed Hull Vertex/, 2],
      [/Complete/, 3],
    ],
  },

  // ── Module 6 ─────────────────────────────────────────────────────────────
  'randomized-quicksort': {
    labels: ['Random pivot', 'Partition', 'Sort both sides', 'Size 0 or 1: done', 'Why random?'],
    rules: [
      [/^Initial Array/, 0],
      [/^(Random Pivot|Move Pivot)/, 0],
      [/^(Begin Lomuto|Compare arr|Swap arr|Pivot in Final)/, 1],
      [/^Single Element/, 3],
      [/Complete/, 4],
    ],
  },
  'hiring-problem': {
    labels: ['Interview', 'Compare with best', 'Better? Hire', 'Otherwise skip', 'Expected hires'],
    rules: [
      [/^Initialize/, 0],
      [/^Interview Candidate/, 1],
      [/^HIRE/, 2],
      [/^SKIP/, 3],
      [/Complete/, 4],
    ],
  },
  'karger-min-cut': {
    labels: ['Random edge', 'Merge its ends', 'Until two remain', 'Repeat many runs'],
    rules: [
      [/^Initialize/, 0],
      [/^Random Edge/, 0],
      [/^Contract Edge/, [1, 2]],
      [/^Contraction Finished/, [2, 3]],
    ],
  },

  // ── Module 7 ─────────────────────────────────────────────────────────────
  'vertex-cover-approx': {
    labels: ['Pick an edge', 'Add both ends', 'Remove covered edges', 'Until none left', 'At most 2 × best'],
    rules: [
      [/^Initialize/, 0],
      [/^Pick/, 0],
      [/^Add Endpoints/, 1],
      [/^Remove/, [2, 3]],
      [/Complete/, 4],
    ],
  },
  'set-cover': {
    labels: ['All uncovered', 'Most new elements', 'Mark covered', 'Until all covered', 'Close to the best'],
    rules: [
      [/^Initialize/, 0],
      [/^Greedily Select/, 1],
      [/^Update Covered/, [2, 3]],
      [/Complete/, 4],
    ],
  },
  'tsp-approx': {
    labels: ['Build the MST', 'Double & walk', 'Skip visited cities', 'Return home'],
    rules: [
      [/^(Initialize|MST Cut|Add Edge)/, 0],
      [/Double Every MST Edge/, 1],
      [/^DFS Preorder Shortcut/, 2],
      [/Complete/, 3],
    ],
  },
};

/**
 * The roadmap chips lit for every step, as a span [first, last] (null before any rule has
 * matched). A step that matches no rule keeps the previous step's chips.
 */
export const roadmapPhases = (algorithmId: string, steps: AlgorithmStep[]): (ChipSpan | null)[] => {
  const map = ROADMAPS[algorithmId];
  if (!map) return steps.map(() => null);
  let current: ChipSpan | null = null;
  return steps.map((step) => {
    const rule = map.rules.find(([re]) => re.test(step.title));
    if (rule) current = typeof rule[1] === 'number' ? [rule[1], rule[1]] : rule[1];
    return current;
  });
};

/** Whether a chip is inside a step's span. */
export const spanHas = (span: ChipSpan | null | undefined, chip: number) => !!span && chip >= span[0] && chip <= span[1];
