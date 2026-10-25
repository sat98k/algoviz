/**
 * Comparison-page profiles, referenced from algorithmRegistry.ts via
 * `comparison: COMPARISON_PROFILES['<id>']`. Only algorithms that share a
 * problem (see comparisonGroups.ts) with another registry entry need one.
 */
import { ComparisonProfile } from '../types/algorithm';

const defineProfiles = <K extends string>(profiles: Record<K, ComparisonProfile>) => profiles;

export const COMPARISON_PROFILES = defineProfiles({
  // ── 0/1 Knapsack ──────────────────────────────────────────────────────────
  'knapsack-dp': {
    group: 'knapsack-01',
    keyIdea: 'Fill a table with the best value for every (first i items, capacity w) pair, building each answer from smaller ones.',
    strengths: [
      'Steady O(n·W) time: no input is surprisingly slow for a given capacity.',
      'The table also gives the best value for every smaller capacity.',
      'Straightforward to implement and to trace back the chosen items.',
    ],
    limitations: [
      'Time and memory grow with the capacity W itself (pseudo-polynomial), so a huge W is impractical.',
      'Needs integer weights and capacity to index the table.',
      'Always fills the entire table, even when most cells are irrelevant.',
    ],
    chooseWhen: 'The capacity is a reasonably small integer and you want predictable performance.',
    answerQuality: 'Exact optimum',
  },
  'knapsack-bb': {
    group: 'knapsack-01',
    keyIdea: 'Search include/exclude decisions in a state-space tree, skipping branches whose optimistic (fractional) bound cannot beat the best solution found.',
    strengths: [
      'Handles large or non-integer weights and capacities.',
      'Good bounds can prune most of the tree, exploring far fewer than 2ⁿ nodes.',
      'Memory does not depend on the capacity.',
    ],
    limitations: [
      'Exponential O(2ⁿ) time in the worst case.',
      'Running time is hard to predict; it depends on how much the bounds prune.',
      'More complex to implement than the DP table.',
    ],
    chooseWhen: 'The capacity is large or non-integer, the number of items is moderate, and tight bounds are likely.',
    answerQuality: 'Exact optimum',
  },

  // ── String Matching ───────────────────────────────────────────────────────
  'naive-string-match': {
    group: 'string-matching',
    keyIdea: 'Try every possible shift of the pattern and compare it with the text character by character.',
    strengths: [
      'No preprocessing and no extra memory.',
      'Trivial to implement and easy to verify.',
      'Fast enough for short texts and patterns.',
    ],
    limitations: [
      'O((n−m+1)·m) in the worst case, e.g. text "AAAA…A" with pattern "AA…AB".',
      'Throws away what it learned after every mismatch and re-reads text characters.',
    ],
    chooseWhen: 'Texts and patterns are short, or simplicity matters more than speed.',
    answerQuality: 'Exact — every occurrence',
  },
  kmp: {
    group: 'string-matching',
    keyIdea: 'Precompute the LPS table so that after a mismatch the pattern jumps ahead without ever re-reading the text.',
    strengths: [
      'Guaranteed O(n + m) time on every input.',
      'The text pointer never moves backwards, so it works on streamed text.',
      'No hashing, so there are no false alarms to double-check.',
    ],
    limitations: [
      'Needs O(m) preprocessing and an extra table.',
      'Harder to understand and implement correctly than naive search.',
      'On random text with few partial matches it gains little over naive search.',
    ],
    chooseWhen: 'You need a worst-case linear-time guarantee, or the text arrives as a stream.',
    answerQuality: 'Exact — every occurrence',
  },
  'rabin-karp': {
    group: 'string-matching',
    keyIdea: "Compare a rolling hash of each text window with the pattern's hash, and check characters only when the hashes agree.",
    strengths: [
      'Expected O(n + m) time with a good modulus.',
      'Extends naturally to searching for many patterns at once.',
      'Each window hash is updated in O(1).',
    ],
    limitations: [
      'Worst case O(n·m) when many windows collide with the pattern hash.',
      'Needs a well-chosen modulus and care with arithmetic overflow.',
      'Every hash match must still be verified character by character.',
    ],
    chooseWhen: 'You are searching for many patterns at once, or comparing documents by fingerprints.',
    answerQuality: 'Exact — every occurrence',
  },
  'suffix-tree': {
    group: 'string-matching',
    keyIdea: 'Preprocess the text into a tree of all its suffixes; any pattern is then found by walking it down from the root.',
    strengths: [
      'After preprocessing, each query costs O(m + z), independent of the text length.',
      'Ideal when the same text is searched many times.',
      'The same tree answers other questions, such as the longest repeated substring.',
    ],
    limitations: [
      'Building the tree uses a lot of memory compared with the text size.',
      "Ukkonen's construction is complex to implement.",
      'Overkill for a single one-off search.',
    ],
    chooseWhen: 'The text is fixed and will be searched with many different patterns.',
    answerQuality: 'Exact — every occurrence',
  },

  // ── Maximum Flow ──────────────────────────────────────────────────────────
  'ford-fulkerson': {
    group: 'max-flow',
    keyIdea: 'Keep finding an augmenting path in the residual graph and push its bottleneck amount, until no path remains. (This visualizer finds each path with BFS and shows one step per augmentation.)',
    strengths: [
      'The simple, general method behind most max-flow algorithms.',
      'With integer capacities it needs at most |f*| augmentations.',
      'The final residual graph also reveals a minimum cut.',
    ],
    limitations: [
      'With arbitrary path choices, time depends on the flow value: O(E·|f*|).',
      'With irrational capacities and poor path choices it may never terminate.',
    ],
    chooseWhen: 'Capacities are small integers, or you want the clearest view of the augmenting-path idea.',
    answerQuality: 'Exact maximum flow',
  },
  'edmonds-karp': {
    group: 'max-flow',
    keyIdea: 'Ford-Fulkerson where every augmenting path is a shortest one (fewest edges), found by breadth-first search.',
    strengths: [
      'Polynomial O(V·E²) bound, whatever the capacity values.',
      'Easy to implement on top of BFS.',
      'Predictable behaviour on every input.',
    ],
    limitations: [
      'Can be slow on large, dense graphs.',
      'Runs a full BFS for every single augmentation.',
    ],
    chooseWhen: 'You need a guaranteed polynomial bound with a simple implementation on moderate-size graphs.',
    answerQuality: 'Exact maximum flow',
  },
  'push-relabel': {
    group: 'max-flow',
    keyIdea: 'Flood the network with a preflow, then push excess flow downhill and relabel vertex heights locally until no vertex has excess.',
    strengths: [
      'O(V²·E) generic bound, and among the fastest methods in practice on large, dense graphs.',
      'Operations are local to one vertex, so it parallelises well.',
      'Never has to search for whole source-to-sink paths.',
    ],
    limitations: [
      'Harder to understand and implement than augmenting-path methods.',
      'Intermediate states are preflows, not valid flows, so they are harder to interpret.',
      'Top performance needs extra heuristics such as global relabelling.',
    ],
    chooseWhen: 'The graph is large or dense and raw performance matters.',
    answerQuality: 'Exact maximum flow',
  },

  // ── Convex Hull ───────────────────────────────────────────────────────────
  'graham-scan': {
    group: 'convex-hull',
    keyIdea: 'Sort the points by angle around the lowest point, then scan them with a stack, popping any point that causes a right turn.',
    strengths: [
      'O(n log n) no matter how many points end up on the hull.',
      'After sorting, each point is pushed and popped at most once.',
      'Deterministic and widely taught.',
    ],
    limitations: [
      'Sorting dominates, even when the hull has only a few vertices.',
      'Needs care with collinear points and equal angles.',
    ],
    chooseWhen: 'General point sets, especially when many points lie on the hull.',
    answerQuality: 'Exact hull',
  },
  'jarvis-march': {
    group: 'convex-hull',
    keyIdea: 'Start at the lowest point and wrap counter-clockwise, like wrapping a gift: from each corner, the next corner is the point with every other point on its left.',
    strengths: [
      'Output-sensitive O(n·h): very fast when the hull has few vertices.',
      'No sorting; only simple orientation tests.',
      'Easy to picture and to visualise.',
    ],
    limitations: [
      'Degrades to O(n²) when most points lie on the hull.',
      'Scans every point again for each hull vertex.',
    ],
    chooseWhen: 'The hull is expected to have only a few vertices compared with the number of points.',
    answerQuality: 'Exact hull',
  },

  // ── Travelling Salesperson ────────────────────────────────────────────────
  tsp: {
    group: 'tsp',
    keyIdea: 'Held-Karp dynamic programming: compute the cheapest path for every subset of visited cities and every ending city.',
    strengths: [
      'Always returns an optimal tour.',
      'Works for any cost matrix, even asymmetric or non-metric costs.',
      'Far faster than checking all (n−1)! tours.',
    ],
    limitations: [
      'O(n²·2ⁿ) time and O(n·2ⁿ) memory, so it is practical only for about 20 cities or fewer.',
    ],
    chooseWhen: 'There are few cities and you need the guaranteed best tour.',
    answerQuality: 'Exact optimum',
  },
  'tsp-approx': {
    group: 'tsp',
    keyIdea: 'Build a minimum spanning tree, walk it in preorder, and skip cities that were already visited.',
    strengths: [
      'Polynomial time, dominated by building the MST.',
      'Guaranteed to cost at most 2× the optimal tour on metric inputs.',
      'Scales to many cities.',
    ],
    limitations: [
      'The tour is usually not optimal.',
      'The 2× guarantee no longer holds if costs break the triangle inequality.',
    ],
    chooseWhen: 'There are many cities, costs are metric (e.g. distances), and a good tour is needed quickly.',
    answerQuality: 'At most 2 × optimal (metric costs only)',
  },
});
