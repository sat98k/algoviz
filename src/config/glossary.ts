/**
 * Shared DAA glossary. Each term is defined once here and referenced by key —
 * from algorithm configs (`glossaryTerms`), the paradigm badge, or directly via
 * `<Term termKey="...">`.
 *
 * `aliases` are the lowercase phrases that `linkGlossaryTerms` may turn into a
 * Term inside running text. Only keys an algorithm lists are ever linked, and
 * only their first occurrence per text block.
 */
import type { Paradigm } from '../types/algorithm';

export interface GlossaryEntry {
  term: string;
  definition: string;
  aliases: string[];
}

const defineGlossary = <K extends string>(entries: Record<K, GlossaryEntry>) => entries;

export const GLOSSARY = defineGlossary({
  // ── Paradigms & design principles ─────────────────────────────────────────
  'greedy-algorithm': {
    term: 'Greedy Algorithm',
    definition:
      'Builds a solution one step at a time, always taking the choice that looks best right now and never undoing it. Fast, but only correct when the problem has the greedy choice property.',
    aliases: ['greedy algorithm', 'greedy heuristic', 'greedily', 'greedy'],
  },
  'greedy-choice-property': {
    term: 'Greedy Choice Property',
    definition:
      'A problem has this property when making the locally best choice at each step can still lead to a globally optimal solution, so no earlier decision ever needs to be revisited.',
    aliases: ['greedy choice property', 'greedy-choice property'],
  },
  'optimal-substructure': {
    term: 'Optimal Substructure',
    definition:
      'An optimal solution to the whole problem is built from optimal solutions to its smaller subproblems. Both greedy algorithms and dynamic programming rely on it.',
    aliases: ['optimal substructure', 'optimal subproblems'],
  },
  'divide-and-conquer': {
    term: 'Divide and Conquer',
    definition:
      'Split the problem into smaller independent subproblems, solve each one recursively, then combine their answers into the answer for the original problem.',
    aliases: ['divide and conquer', 'divide & conquer'],
  },
  recursion: {
    term: 'Recursion',
    definition:
      'A function solving a problem by calling itself on smaller inputs, until it reaches a base case small enough to answer directly.',
    aliases: ['recursion', 'recursively', 'recursive calls', 'recursive'],
  },
  recurrence: {
    term: 'Recurrence',
    definition:
      'An equation that defines a value in terms of the same value on smaller inputs, e.g. T(n) = 2T(n/2) + n. Used to describe running times and DP table entries.',
    aliases: ['recurrence relation', 'recurrence'],
  },
  'recursion-tree': {
    term: 'Recursion Tree',
    definition:
      'A tree where each node is one recursive call and its children are the calls it makes. Summing the work level by level gives the total running time.',
    aliases: ['recursion tree'],
  },
  'dynamic-programming': {
    term: 'Dynamic Programming',
    definition:
      'Solves a problem by solving each smaller subproblem once, storing the answer in a table, and reusing it. Works when the problem has optimal substructure and overlapping subproblems.',
    aliases: ['dynamic programming'],
  },
  'overlapping-subproblems': {
    term: 'Overlapping Subproblems',
    definition:
      'The same smaller subproblems come up again and again during a naive recursive solution. Storing their answers (DP or memoization) avoids recomputing them.',
    aliases: ['overlapping subproblems'],
  },
  'dp-table': {
    term: 'Dynamic Programming Table',
    definition:
      'The array where a DP algorithm stores the answer to every subproblem. Each cell is filled from cells computed earlier, and the final answer is read from one cell.',
    aliases: ['dp table', '2d table', 'table'],
  },
  memoization: {
    term: 'Memoization',
    definition:
      'Top-down dynamic programming: a recursive function caches each result the first time it is computed and returns the cached value on later calls.',
    aliases: ['memoization', 'memoized'],
  },
  backtracking: {
    term: 'Backtracking',
    definition:
      'Builds a solution one choice at a time and, as soon as a partial solution breaks a constraint, undoes the last choice and tries the next option.',
    aliases: ['backtracking', 'backtracks', 'backtrack'],
  },
  'branch-and-bound': {
    term: 'Branch and Bound',
    definition:
      'Explores a state-space tree of partial solutions, computing a bound for each node and discarding (pruning) any branch whose bound shows it cannot beat the best solution found so far.',
    aliases: ['branch and bound', 'branch & bound'],
  },
  'state-space-tree': {
    term: 'State-Space Tree',
    definition:
      'A tree of all partial solutions: the root is the empty solution, and each level makes one more decision (e.g. include or exclude the next item).',
    aliases: ['state-space decision tree', 'state-space tree', 'binary decision tree', 'decision tree'],
  },
  'bounding-function': {
    term: 'Bounding Function',
    definition:
      'An optimistic estimate of the best result reachable from a node in the state-space tree. If even this estimate cannot beat the best known solution, the node is pruned.',
    aliases: ['bounding function', 'optimistic upper bounds', 'upper bounds', 'upper bound'],
  },
  pruning: {
    term: 'Pruning',
    definition:
      'Skipping an entire subtree of the search because it provably cannot contain a valid or better solution. This is what makes backtracking and branch and bound practical.',
    aliases: ['pruning', 'prunes', 'pruned', 'prune'],
  },
  'randomized-algorithm': {
    term: 'Randomized Algorithm',
    definition:
      'An algorithm that makes random choices while running. Its running time or answer is analysed in expectation or with a probability of success.',
    aliases: ['randomized algorithm', 'uniformly at random', 'randomized'],
  },
  'approximation-algorithm': {
    term: 'Approximation Algorithm',
    definition:
      'A fast algorithm for a hard optimization problem that returns a solution provably within a fixed factor (the approximation ratio) of the optimal one.',
    aliases: ['approximation algorithm', 'approximation ratio'],
  },
  'np-hard': {
    term: 'NP-Hard',
    definition:
      'At least as hard as every problem in NP. No polynomial-time algorithm is known for any NP-hard problem, so we often use approximation or exponential search instead.',
    aliases: ['np-hard'],
  },
  'np-complete': {
    term: 'NP-Complete',
    definition:
      'A problem that is both in NP (a proposed answer can be checked quickly) and NP-hard. Solving any one of them in polynomial time would solve them all.',
    aliases: ['np-complete'],
  },

  // ── Data structures & coding ──────────────────────────────────────────────
  'priority-queue': {
    term: 'Priority Queue',
    definition:
      'A collection where you can always remove the element with the smallest (min-priority queue) or largest key next, typically in O(log n) time using a heap.',
    aliases: ['min-priority queue', 'priority queue'],
  },
  'prefix-code': {
    term: 'Prefix Code',
    definition:
      'A set of binary codes where no code is the beginning of another, so an encoded bit string can be decoded unambiguously from left to right.',
    aliases: ['prefix code'],
  },
  'huffman-coding': {
    term: 'Huffman Coding',
    definition:
      'A greedy method for building an optimal prefix code: frequent characters get short codes and rare characters get long ones, minimizing the total encoded length.',
    aliases: ['huffman coding'],
  },

  // ── String matching ───────────────────────────────────────────────────────
  'string-matching': {
    term: 'String Matching',
    definition: 'Finding every position where a pattern string occurs inside a longer text string.',
    aliases: ['string matching', 'pattern matching'],
  },
  lps: {
    term: 'LPS (Longest Prefix-Suffix)',
    definition:
      'Longest Proper Prefix which is also a Suffix. For each position in the pattern it tells KMP how far the pattern can safely shift after a mismatch, so text characters are never re-read.',
    aliases: ['longest proper prefix which is also suffix (lps)', 'lps'],
  },
  'hash-function': {
    term: 'Hash Function',
    definition:
      'Maps data (like a string window) to a small number. Equal strings always get equal hashes, so comparing hashes is a quick first check before comparing characters.',
    aliases: ['hash function', 'hash value', 'hashes', 'hash'],
  },
  'rolling-hash': {
    term: 'Rolling Hash',
    definition:
      "A hash that can be updated in O(1) when a window slides by one position: remove the leaving character's contribution and add the new one, instead of rehashing the whole window.",
    aliases: ['rolling hash'],
  },
  collision: {
    term: 'Collision',
    definition:
      'Two different inputs that produce the same hash value. In Rabin-Karp this causes a spurious hit, which is why a matching hash must be confirmed by comparing characters.',
    aliases: ['hash collisions', 'hash collision', 'collisions', 'collision'],
  },

  // ── Graphs & flows ────────────────────────────────────────────────────────
  graph: {
    term: 'Graph',
    definition:
      'A set of vertices (nodes) connected by edges. Edges may be directed (one-way) or undirected, and may carry weights such as distances or capacities.',
    aliases: ['graph'],
  },
  vertex: {
    term: 'Vertex',
    definition: 'A node of a graph, such as a city, a station or a point. Plural: vertices.',
    aliases: ['vertices', 'vertex'],
  },
  edge: {
    term: 'Edge',
    definition: 'A connection between two vertices of a graph, possibly with a direction and a weight.',
    aliases: ['edges', 'edge'],
  },
  'shortest-path': {
    term: 'Shortest Path',
    definition:
      'The path between two vertices whose edge weights add up to the smallest total. It is undefined if a negative-weight cycle can be reached along the way.',
    aliases: ['shortest-path distance', 'shortest path', 'shortest paths', 'shortest-path'],
  },
  relaxation: {
    term: 'Relaxation',
    definition:
      'Checking whether going through edge (u, v) gives a shorter route to v: if dist[u] + w(u, v) < dist[v], update dist[v]. The core step of shortest-path algorithms.',
    aliases: ['relaxation', 'relaxes', 'relaxed', 'relax'],
  },
  'negative-cycle': {
    term: 'Negative-Weight Cycle',
    definition:
      'A cycle whose edge weights sum to less than zero. Going around it again always lowers the cost, so shortest paths through it do not exist.',
    aliases: ['negative-weight cycle', 'negative cycles', 'negative cycle'],
  },
  bfs: {
    term: 'Breadth-First Search (BFS)',
    definition:
      'Explores a graph level by level from a start vertex, so the first path it finds to any vertex uses the fewest edges.',
    aliases: ['breadth-first search', 'bfs'],
  },
  'flow-network': {
    term: 'Flow Network',
    definition:
      'A directed graph where each edge has a capacity, with a source s that produces flow and a sink t that absorbs it. Flow on an edge cannot exceed its capacity.',
    aliases: ['flow network', 'capacity network'],
  },
  'residual-graph': {
    term: 'Residual Graph',
    definition:
      'Shows how much more flow each edge can still carry, plus backward edges that allow already-sent flow to be undone. Augmenting paths are searched for here.',
    aliases: ['residual network', 'residual graph', 'residual capacities', 'residual edges'],
  },
  'augmenting-path': {
    term: 'Augmenting Path',
    definition:
      'A path from source to sink in the residual graph with spare capacity on every edge. Sending flow along it increases the total flow by its bottleneck capacity.',
    aliases: ['augmenting paths', 'augmenting path'],
  },
  'maximum-flow': {
    term: 'Maximum Flow',
    definition:
      'The largest total amount that can be sent from source to sink without exceeding any edge capacity. It always equals the capacity of the minimum cut.',
    aliases: ['maximum feasible flow', 'maximum flow', 'max flow'],
  },
  'minimum-cut': {
    term: 'Minimum Cut',
    definition:
      'A split of the vertices into two groups that minimizes the edges (or total capacity) crossing between them. Its size limits how much can flow from one side to the other.',
    aliases: ['global minimum cut', 'minimum cut', 'min cut'],
  },
  preflow: {
    term: 'Preflow',
    definition:
      'A relaxed flow used by Push-Relabel: vertices may temporarily receive more flow than they send out (excess). The algorithm pushes excess onward until a valid flow remains.',
    aliases: ['preflow'],
  },
  'edge-contraction': {
    term: 'Edge Contraction',
    definition:
      'Merging the two endpoints of an edge into a single vertex. Edges between them disappear; other edges are kept, which can create parallel edges.',
    aliases: ['edge contraction', 'contracts'],
  },
  'minimum-spanning-tree': {
    term: 'Minimum Spanning Tree (MST)',
    definition:
      'A set of edges that connects all vertices with no cycles and the smallest possible total weight.',
    aliases: ['minimum spanning tree', 'mst'],
  },
  'hamiltonian-cycle': {
    term: 'Hamiltonian Cycle',
    definition: 'A cycle that visits every vertex exactly once and returns to its starting vertex — a TSP tour.',
    aliases: ['hamiltonian cycle'],
  },
  'eulerian-multigraph': {
    term: 'Eulerian Multigraph',
    definition:
      'A graph (parallel edges allowed) in which a closed walk can use every edge exactly once. Doubling every MST edge produces one.',
    aliases: ['eulerian multigraph'],
  },
  'triangle-inequality': {
    term: 'Triangle Inequality',
    definition:
      'Going directly is never longer than going via a third point: cost(a, c) ≤ cost(a, b) + cost(b, c). It is what lets TSP shortcuts never increase the tour cost.',
    aliases: ['triangle inequality'],
  },

  // ── Geometry ──────────────────────────────────────────────────────────────
  'convex-hull': {
    term: 'Convex Hull',
    definition:
      'The smallest convex polygon that encloses all the given points — like a rubber band stretched around them.',
    aliases: ['convex hull'],
  },
  'sweep-line': {
    term: 'Sweep Line',
    definition:
      'An imaginary line moved across the plane, processing objects only when the line reaches them, so each object is compared only with its current neighbours.',
    aliases: ['sweep-line', 'sweep line'],
  },
});

export type GlossaryKey = keyof typeof GLOSSARY;

export const getGlossaryEntry = (key: string): GlossaryEntry | undefined =>
  (GLOSSARY as Record<string, GlossaryEntry>)[key];

/** Glossary term behind each paradigm label (Geometric has no single defining term). */
export const PARADIGM_TERMS: Partial<Record<Paradigm, GlossaryKey>> = {
  Greedy: 'greedy-algorithm',
  'Divide & Conquer': 'divide-and-conquer',
  'Dynamic Programming': 'dynamic-programming',
  Backtracking: 'backtracking',
  'Branch & Bound': 'branch-and-bound',
  'String Matching': 'string-matching',
  Graph: 'graph',
  'Max Flow': 'maximum-flow',
  Randomized: 'randomized-algorithm',
  Approximation: 'approximation-algorithm',
};

export type GlossarySegment = { text: string; termKey?: GlossaryKey };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Splits `text` into plain and term segments. Only the listed `keys` are
 * considered, each linked at most once (its first non-overlapping occurrence,
 * longest alias winning). Keys in `exclude` are skipped — use it to avoid
 * re-linking a term already linked in an earlier block on the same panel.
 */
export const linkGlossaryTerms = (
  text: string,
  keys: readonly GlossaryKey[] = [],
  exclude: ReadonlySet<GlossaryKey> = new Set()
): GlossarySegment[] => {
  if (!text || keys.length === 0) return [{ text }];

  const candidates = keys
    .filter((key) => !exclude.has(key))
    .flatMap((key) => (getGlossaryEntry(key)?.aliases ?? []).map((alias) => ({ key, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const claimed: { start: number; end: number; key: GlossaryKey }[] = [];
  const linked = new Set<GlossaryKey>();

  for (const { key, alias } of candidates) {
    if (linked.has(key)) continue;
    const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(alias)}(?![A-Za-z0-9])`, 'gi');
    for (const m of text.matchAll(re)) {
      const start = m.index!;
      const end = start + m[0].length;
      if (claimed.some((c) => start < c.end && end > c.start)) continue;
      claimed.push({ start, end, key });
      linked.add(key);
      break;
    }
  }

  if (claimed.length === 0) return [{ text }];
  claimed.sort((a, b) => a.start - b.start);

  const segments: GlossarySegment[] = [];
  let cursor = 0;
  for (const c of claimed) {
    if (c.start > cursor) segments.push({ text: text.slice(cursor, c.start) });
    segments.push({ text: text.slice(c.start, c.end), termKey: c.key });
    cursor = c.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
};
