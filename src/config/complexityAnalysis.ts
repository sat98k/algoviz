/**
 * Time and space complexity analysis for every algorithm, written to teach the
 * reasoning rather than just state Big-O. Referenced from algorithmRegistry.ts
 * via `analysis` (and `complexity`, which is derived from it so they never disagree).
 *
 * Rules:
 * - Only list best / expected cases that are meaningful and supported; never invent them.
 * - Formulas are plain text (n², 2ⁿ, n^1.585, log₂), never LaTeX.
 * - When this visualizer's code is simpler than the textbook data structure and costs
 *   more, the textbook bound is shown (it matches the pseudocode taught) and the
 *   difference is stated in `implementationNote`.
 */
import { ComplexityAnalysis, ComplexityInfo } from '../types/algorithm';

const define = <K extends string>(entries: Record<K, ComplexityAnalysis>) => entries;

export const COMPLEXITY_ANALYSIS = define({
  // ── Module 1 ──────────────────────────────────────────────────────────────
  'fractional-knapsack': {
    variables: [{ symbol: 'n', meaning: 'number of items' }],
    time: [{ case: 'all', bound: 'O(n log n)', note: 'Same in every case: the sort always runs in full, whatever the weights and values.' }],
    kinds: ['Worst-case'],
    dominant: 'Sorting the items by value/weight ratio.',
    derivation:
      'Computing the n ratios costs O(n). Sorting them takes O(n log n) with a comparison sort, whatever the input. The greedy fill then visits each item at most once, O(n), stopping when the knapsack is full. The sort dominates, so the total is O(n log n).',
    space: { bound: 'O(n)', explanation: 'A sorted copy of the items with their ratios; the fill itself needs only a few running totals.' },
  },
  huffman: {
    variables: [
      { symbol: 'n', meaning: 'number of distinct characters' },
      { symbol: 'L', meaning: 'length of the input text' },
    ],
    time: [{ case: 'all', bound: 'O(n log n)', note: 'Same in every case (plus O(L) to count frequencies and encode the text): there are always exactly n − 1 merges.' }],
    kinds: ['Worst-case'],
    dominant: 'The n − 1 merges, each taking the two smallest trees from a priority queue.',
    derivation:
      'Counting frequencies reads the text once, O(L). With a binary min-heap of the n leaves, each of the n − 1 merges does two extract-min operations and one insert, O(log n) each, so building the tree costs O(n log n). Reading off the codes visits each of the 2n − 1 tree nodes once, O(n).',
    space: { bound: 'O(n)', explanation: 'The tree has 2n − 1 nodes, the queue at most n trees, and the code table n entries.' },
    implementationNote:
      'This visualizer keeps the forest in an array and re-sorts it before every merge: O(n log n) per merge, O(n² log n) overall. That is fine for a handful of characters; a binary heap gives the O(n log n) bound.',
  },
  'max-subarray': {
    variables: [{ symbol: 'n', meaning: 'length of the array' }],
    time: [{ case: 'all', bound: 'O(n log n)', note: 'Same in every case: every call splits evenly and scans its whole range, whatever the values.' }],
    kinds: ['Worst-case'],
    recurrence: 'T(n) = 2T(n/2) + O(n)',
    dominant: 'The crossing-subarray scan at every level of the recursion.',
    derivation:
      'Each call splits its range in half and makes two recursive calls. The crossing scan walks outward from the midpoint over the whole range, O(n). So T(n) = 2T(n/2) + O(n): there are log₂ n levels and each level does O(n) work in total, giving O(n log n) (Master theorem, case 2). Kadane’s algorithm solves the same problem in O(n).',
    space: { bound: 'O(log n)', explanation: 'The recursion is log₂ n calls deep and each call keeps O(1) indices and sums. (The visualizer also stores every call for the tree, O(n).)' },
  },
  karatsuba: {
    variables: [{ symbol: 'n', meaning: 'number of digits in the larger number' }],
    time: [{ case: 'all', bound: 'O(n^log2(3)) ≈ O(n^1.585)', note: 'For two n-digit numbers. If either number is a single digit, it is multiplied directly and the recursion stops at once.' }],
    kinds: ['Worst-case'],
    recurrence: 'T(n) = 3T(n/2) + O(n)',
    dominant: 'The three recursive multiplications of half-size numbers.',
    derivation:
      'Splitting the numbers and recombining p1, p2 and p3 takes only additions, subtractions and shifts by powers of 10, all O(n). Three half-size multiplications remain, so T(n) = 3T(n/2) + O(n). Depth k of the recursion has 3ᵏ subproblems, so the 3^(log₂ n) = n^(log₂ 3) leaves dominate. Schoolbook splitting needs four products, T(n) = 4T(n/2) + O(n) = O(n²).',
    space: { bound: 'O(n)', explanation: 'The recursion is log₂ n deep, and the numbers on the current path have n + n/2 + n/4 + … = O(n) digits in total.' },
  },

  // ── Module 2: dynamic programming ─────────────────────────────────────────
  'knapsack-dp': {
    variables: [
      { symbol: 'n', meaning: 'number of items' },
      { symbol: 'W', meaning: 'capacity, as a number (not the number of digits used to write it)' },
    ],
    time: [{ case: 'all', bound: 'O(n·W)', note: 'Same in every case: every cell of the table is filled.' }],
    kinds: ['Pseudo-polynomial'],
    dominant: 'Filling the (n + 1) × (W + 1) table at O(1) per cell.',
    derivation:
      'There is one cell for each item count i (0..n) and each capacity w (0..W), and each cell compares two values already in the table: leave item i out, or take it. So the fill costs O(n·W), and tracing back the chosen items adds O(n). This is pseudo-polynomial: it is polynomial in the value of W, but W can be exponential in the number of digits needed to write it, so adding one digit to W can multiply the work by 10.',
    space: { bound: 'O(n·W)', explanation: 'The whole table is kept so the chosen items can be traced back. The best value alone needs only two rows, O(W).' },
  },
  lcs: {
    variables: [
      { symbol: 'm', meaning: 'length of the first string' },
      { symbol: 'n', meaning: 'length of the second string' },
    ],
    time: [{ case: 'all', bound: 'O(m·n)', note: 'Same in every case: every pair of prefixes gets a cell.' }],
    kinds: ['Worst-case'],
    dominant: 'Filling the (m + 1) × (n + 1) table.',
    derivation:
      'The table has one cell per pair of prefix lengths. Each cell compares one pair of characters and reads at most three neighbouring cells, O(1). Filling therefore costs O(m·n) in every case, and tracing back the subsequence adds O(m + n) because every move decreases i, j or both.',
    space: { bound: 'O(m·n)', explanation: 'The full table is kept for the traceback; the length alone can be computed with two rows, O(min(m, n)).' },
  },
  'matrix-chain-multiplication': {
    variables: [{ symbol: 'n', meaning: 'number of matrices in the chain' }],
    time: [{ case: 'all', bound: 'O(n³)', note: 'Same in every case: every split of every subchain is tried, whatever the dimensions.' }],
    kinds: ['Worst-case'],
    dominant: 'O(n²) subchains, each trying O(n) split points.',
    derivation:
      'There is one cell m[i, j] for each pair i ≤ j, about n²/2 subchains. Cell m[i, j] tries every split k from i to j − 1 in O(1) each, using cells already computed for shorter chains. Summing (j − i) over all pairs gives about n³/6 split tests, so the total is O(n³).',
    space: { bound: 'O(n²)', explanation: 'Two n × n tables: the costs m and the best splits s, used to rebuild the parenthesization.' },
  },
  'assembly-line-scheduling': {
    variables: [{ symbol: 'n', meaning: 'number of stations on each line' }],
    time: [{ case: 'all', bound: 'O(n)', note: 'Same in every case: each station is computed once.' }],
    kinds: ['Worst-case'],
    dominant: 'One pass over the 2n stations.',
    derivation:
      'The fastest time to finish station j on a line is the smaller of two options computed from station j − 1, O(1) each. With 2n stations that is O(n), and tracing the route back from the exit is another O(n).',
    space: { bound: 'O(n)', explanation: 'f₁, f₂ and the line choices are stored for every station so the route can be traced back; the best time alone needs O(1).' },
  },
  tsp: {
    variables: [{ symbol: 'n', meaning: 'number of cities' }],
    time: [{ case: 'all', bound: 'O(n²·2ⁿ)', note: 'Same in every case: every (subset, end city) state is computed.' }],
    kinds: ['Exponential'],
    dominant: 'About n·2ⁿ states (subset, end city), each minimising over up to n previous cities.',
    derivation:
      'A state is a set S of visited cities (always containing the start) plus the city j where the path ends: about n·2ⁿ⁻¹ states. Each state takes the minimum over the previous city k, up to n choices, so the table costs O(n²·2ⁿ). That is far less than checking all (n − 1)!/2 tours, but still exponential, which is why this visualizer caps n at 6.',
    space: { bound: 'O(n·2ⁿ)', explanation: 'One cost and one parent pointer per (subset, end city) state.' },
  },

  // ── Module 2: backtracking & branch and bound ─────────────────────────────
  'n-queens': {
    variables: [{ symbol: 'N', meaning: 'board size (and number of queens)' }],
    time: [{ case: 'worst', bound: 'O(N²·N!)', note: 'Upper bound with no pruning benefit. Often quoted as O(N!), which counts placements without the cost of checking each one.' }],
    kinds: ['Worst-case', 'Exponential'],
    dominant: 'The number of partial placements explored.',
    derivation:
      'One queen goes in each row, so a placement of k queens is an ordered choice of k distinct columns: at most N!/(N − k)! of them, and fewer than e·N! in total. Each one tries N columns for the next row, and this implementation checks a square against the earlier rows in O(N), giving O(N²·N!). Conflicts prune most branches early, so real runs visit far fewer nodes; there is no simple formula for the best case.',
    space: { bound: 'O(N)', explanation: 'One column per row on the board and a recursion N levels deep. Find-all mode also stores every solution found.' },
  },
  'knapsack-bb': {
    variables: [{ symbol: 'n', meaning: 'number of items' }],
    time: [{ case: 'worst', bound: 'O(n·2ⁿ)', note: 'When the bounds prune nothing. Good bounds usually prune most of the tree, but no better guarantee exists.' }],
    kinds: ['Worst-case', 'Exponential'],
    dominant: 'The number of state-space tree nodes explored, each computing an O(n) bound.',
    derivation:
      'Sorting the items by value/weight ratio costs O(n log n). The include/exclude tree has up to 2ⁿ⁺¹ − 1 nodes, and every explored node computes a fractional-knapsack bound over the remaining items in O(n). If nothing is pruned, that is O(n·2ⁿ).',
    space: { bound: 'O(n·2ⁿ)', explanation: 'In the worst case the queue holds exponentially many live nodes, each remembering its path of up to n items.' },
    implementationNote:
      'The live-node queue is an array re-sorted before each pop instead of a binary heap. With q live nodes that costs O(q log q) per pop rather than O(log q), so a run with almost no pruning can be much slower than O(n·2ⁿ); with the at most 6 items allowed here it does not matter.',
  },
  'subset-sum': {
    variables: [{ symbol: 'n', meaning: 'number of input numbers' }],
    time: [{ case: 'worst', bound: 'O(2ⁿ)', note: 'When pruning cuts little. Subset sum is NP-complete, so no polynomial bound is known.' }],
    kinds: ['Worst-case', 'Exponential'],
    dominant: 'The number of include/exclude decisions explored.',
    derivation:
      'Sorting the numbers costs O(n log n). The include/exclude tree has at most 2ⁿ⁺¹ − 1 nodes, and each does O(1) work: one addition and two comparisons using the running sum and the precomputed total of the remaining numbers. Without pruning that is O(2ⁿ); the two prune rules often remove large parts of the tree, but cannot improve the worst case.',
    space: { bound: 'O(n)', explanation: 'The recursion is n levels deep and the current subset has at most n numbers. Find-all mode also stores every solution.' },
  },
  'graph-coloring': {
    variables: [
      { symbol: 'n', meaning: 'number of vertices' },
      { symbol: 'k', meaning: 'number of colours available' },
    ],
    time: [{ case: 'worst', bound: 'O(n·kⁿ)', note: 'When conflicts prune little. Deciding k-colourability is NP-complete for k ≥ 3.' }],
    kinds: ['Worst-case', 'Exponential'],
    dominant: 'The number of colour assignments tried.',
    derivation:
      'Vertices are coloured in a fixed order and each tries up to k colours, so the search tree has at most k + k² + … + kⁿ = O(kⁿ) nodes. Each colour test scans the vertex’s neighbours, up to n − 1 of them. That gives O(n·kⁿ) in the worst case; conflicts usually prune early.',
    space: { bound: 'O(n)', explanation: 'One colour per vertex and a recursion n levels deep. Find-all mode also stores every colouring found.' },
  },
  'job-selection-bb': {
    variables: [{ symbol: 'n', meaning: 'number of jobs' }],
    time: [{ case: 'worst', bound: 'O(n log n · 2ⁿ)', note: 'When neither the bound nor the deadlines prune anything.' }],
    kinds: ['Worst-case', 'Exponential'],
    dominant: 'The number of nodes explored, each running a feasibility check and a bound.',
    derivation:
      'Sorting the jobs by profit costs O(n log n). The include/exclude tree has up to 2ⁿ⁺¹ − 1 nodes. At each node the feasibility test sorts the chosen jobs by deadline, O(n log n), and the bound adds up to n remaining profits, O(n). So the worst case is O(n log n · 2ⁿ); bounds and infeasible deadlines usually cut most branches.',
    space: { bound: 'O(n·2ⁿ)', explanation: 'In the worst case the queue holds exponentially many live nodes, each storing its list of up to n chosen jobs.' },
    implementationNote:
      'As in Knapsack B&B, the queue is an array re-sorted before each pop rather than a binary heap, which only matters for runs with very little pruning.',
  },

  // ── Module 3: string matching ─────────────────────────────────────────────
  'naive-string-match': {
    variables: [
      { symbol: 'n', meaning: 'length of the text' },
      { symbol: 'm', meaning: 'length of the pattern' },
    ],
    time: [
      { case: 'best', bound: 'O(n)', note: 'The first character mismatches at every shift: n − m + 1 comparisons.' },
      { case: 'expected', bound: 'O(n)', note: 'For random text over an alphabet of at least 2 letters: fewer than 2 comparisons per shift on average.' },
      { case: 'worst', bound: 'O((n − m + 1)·m)', note: 'Almost every shift matches m − 1 characters before failing, e.g. text "AAAA…A" and pattern "AA…AB".' },
    ],
    kinds: ['Worst-case', 'Expected'],
    dominant: 'Character comparisons across the n − m + 1 shifts.',
    derivation:
      'There are n − m + 1 shifts, and each compares characters left to right until the first mismatch. If the first character fails every time, the work is n − m + 1 comparisons; if nearly every shift matches m − 1 characters first, it is (n − m + 1)·m. On random text the chance of matching k characters shrinks geometrically, so a shift costs fewer than 2 comparisons on average.',
    space: { bound: 'O(1)', explanation: 'Only the current shift and character index are stored.' },
  },
  kmp: {
    variables: [
      { symbol: 'n', meaning: 'length of the text' },
      { symbol: 'm', meaning: 'length of the pattern' },
    ],
    time: [{ case: 'all', bound: 'O(n + m)', note: 'Same in every case: at most 2m comparisons to build the LPS table and 2n to search.' }],
    kinds: ['Worst-case', 'Amortized'],
    dominant: 'One left-to-right pass over the pattern (LPS) and one over the text.',
    derivation:
      'Building the LPS table takes O(m): the index i only moves forward, and each fallback shrinks len, which grew by at most 1 per step, so fallbacks total at most m (an amortized argument). The same reasoning on the text bounds the search by 2n comparisons, because the text pointer never moves backwards. Neither phase depends on the characters, so the bound holds in every case.',
    space: { bound: 'O(m)', explanation: 'The LPS table has one entry per pattern character.' },
  },
  'rabin-karp': {
    variables: [
      { symbol: 'n', meaning: 'length of the text' },
      { symbol: 'm', meaning: 'length of the pattern' },
      { symbol: 'z', meaning: 'number of occurrences found' },
    ],
    time: [
      { case: 'best', bound: 'O(n + m)', note: 'No window hash ever equals the pattern hash, so no characters are compared.' },
      { case: 'expected', bound: 'O(n + m + z·m)', note: 'Assuming hash values behave randomly, so spurious hits are rare; each real occurrence still costs m comparisons.' },
      { case: 'worst', bound: 'O((n − m + 1)·m)', note: 'Every window’s hash matches (all collisions or all occurrences), e.g. text "AAAA…" and pattern "AA…A".' },
    ],
    kinds: ['Worst-case', 'Expected'],
    dominant: 'Rolling the window hash n − m times, plus character checks on hash hits.',
    derivation:
      'Hashing the pattern and the first window costs O(m), and each of the other n − m windows updates its hash in O(1). Characters are compared only on a hash hit: m comparisons for each real occurrence and for each spurious hit. With a good modulus spurious hits are rare, giving O(n + m + z·m); if every window is a hit, all n − m + 1 windows are verified, O((n − m + 1)·m).',
    space: { bound: 'O(1)', explanation: 'Only the two hashes, the radix power h and the current shift are stored.' },
  },
  'suffix-tree': {
    variables: [
      { symbol: 'n', meaning: 'length of the text' },
      { symbol: 'm', meaning: 'length of the pattern' },
      { symbol: 'z', meaning: 'number of occurrences found' },
    ],
    time: [{ case: 'all', bound: 'O(n + m + z)', note: 'O(n) to build the tree once (constant-size alphabet), then O(m + z) for each search.' }],
    kinds: ['Worst-case', 'Amortized'],
    dominant: 'Building the tree; afterwards each search is proportional to the pattern and answer size.',
    derivation:
      'Ukkonen’s algorithm adds one text character per phase. A phase may insert several suffixes, but leaves never stop being leaves, suffix links jump between insertion points without restarting from the root, and the skip/count trick crosses whole edges at once; together these bound the total work by O(n) (an amortized argument). A search walks at most m characters down from the root and then collects the z leaves below; that subtree has fewer than 2z nodes, so the search costs O(m + z).',
    space: { bound: 'O(n)', explanation: 'At most 2n nodes; edges store (start, end) positions in the text instead of copies of substrings.' },
  },

  // ── Module 4: graphs and flows ────────────────────────────────────────────
  'floyd-warshall': {
    variables: [{ symbol: 'V', meaning: 'number of vertices' }],
    time: [{ case: 'all', bound: 'O(V³)', note: 'Same in every case: exactly V³ updates, whatever the edge weights.' }],
    kinds: ['Worst-case'],
    dominant: 'The three nested loops over k, i and j.',
    derivation:
      'The loops over the intermediate vertex k, the start i and the end j each run V times, and the body is one addition and one comparison. That is exactly V³ updates, so the time is O(V³) for every graph, sparse or dense.',
    space: { bound: 'O(V²)', explanation: 'The V × V distance matrix (updated in place) and a matrix used to rebuild the paths.' },
  },
  'bellman-ford': {
    variables: [
      { symbol: 'V', meaning: 'number of vertices' },
      { symbol: 'E', meaning: 'number of edges' },
    ],
    time: [
      {
        case: 'best',
        bound: 'O(V + E)',
        note: 'This implementation stops as soon as a pass changes nothing. If the first pass already settles every distance, the work is about three passes over the edges (that pass, a pass with no change, and the negative-cycle check) plus O(V) to initialise.',
      },
      { case: 'worst', bound: 'O(V·E)', note: 'V − 1 full passes over all E edges, plus one more pass to check for negative cycles.' },
    ],
    kinds: ['Worst-case'],
    dominant: 'Relaxing all E edges in each of up to V − 1 passes.',
    derivation:
      'Initialising the distances costs O(V). Each pass relaxes all E edges, and V − 1 passes always suffice because a shortest path has at most V − 1 edges, so the worst case is O(V·E), plus one more pass to detect a negative cycle. Stopping early after a pass with no change can finish in O(V + E). Dijkstra’s algorithm is faster, O((V + E) log V) with a heap, but only works with non-negative weights.',
    space: { bound: 'O(V)', explanation: 'One distance and one predecessor per vertex (plus the edge list itself).' },
  },
  'ford-fulkerson': {
    variables: [
      { symbol: 'V', meaning: 'number of vertices' },
      { symbol: 'E', meaning: 'number of edges' },
      { symbol: '|f*|', meaning: 'value of the maximum flow' },
    ],
    time: [
      {
        case: 'worst',
        bound: 'O(V·E²)',
        note: 'With paths found by BFS, as in this implementation. With arbitrary path choices and integer capacities the bound is O(E·|f*|), which depends on the size of the answer.',
      },
    ],
    kinds: ['Worst-case'],
    dominant: 'One path search per augmentation, times the number of augmentations.',
    derivation:
      'Each augmentation finds an s–t path in the residual graph and pushes flow along it, O(E) with adjacency lists. Choosing shortest paths (BFS) limits the number of augmentations to O(V·E): each one saturates a bottleneck edge, and an edge can be a bottleneck only O(V) times because the BFS distance to it keeps growing. Multiplying gives O(V·E²). With arbitrary paths, each augmentation adds at least 1 unit of integer flow, giving O(E·|f*|).',
    space: { bound: 'O(V²)', explanation: 'Capacities and flows are stored as V × V matrices here; adjacency lists would need O(V + E).' },
    implementationNote:
      'Because residual capacities live in a V × V matrix, each BFS scans a whole row per vertex: O(V²) per search instead of O(E), so O(V³·E) overall. That equals O(V·E²) on dense graphs and is fine for the small networks here.',
  },
  'edmonds-karp': {
    variables: [
      { symbol: 'V', meaning: 'number of vertices' },
      { symbol: 'E', meaning: 'number of edges' },
    ],
    time: [{ case: 'worst', bound: 'O(V·E²)', note: 'Independent of the capacity values, unlike Ford-Fulkerson with arbitrary paths.' }],
    kinds: ['Worst-case'],
    dominant: 'Up to O(V·E) augmentations, each needing one BFS.',
    derivation:
      'Each BFS finds a shortest augmenting path in O(E) with adjacency lists. The BFS distance from s to every vertex never decreases, and an edge can become the bottleneck only O(V) times, so there are O(V·E) augmentations. Together that gives O(V·E²), whatever the capacities.',
    space: { bound: 'O(V²)', explanation: 'Capacities and flows are stored as V × V matrices here; adjacency lists would need O(V + E).' },
    implementationNote:
      'The matrix representation makes each BFS O(V²) instead of O(E), so this implementation runs in O(V³·E); the same as O(V·E²) on dense graphs.',
  },
  'push-relabel': {
    variables: [
      { symbol: 'V', meaning: 'number of vertices' },
      { symbol: 'E', meaning: 'number of edges' },
    ],
    time: [{ case: 'worst', bound: 'O(V²·E)', note: 'Number of push and relabel operations in the generic algorithm.' }],
    kinds: ['Worst-case'],
    dominant: 'Non-saturating pushes, of which there are O(V²·E).',
    derivation:
      'Every height stays below 2V and each relabel raises a height by at least 1, so there are O(V²) relabels. There are O(V·E) saturating pushes, and a potential-function argument limits non-saturating pushes to O(V²·E). With O(1) work per operation that gives O(V²·E); the FIFO and highest-label variants improve this to O(V³) and O(V²·√E).',
    space: { bound: 'O(V²)', explanation: 'Capacity and flow matrices, plus a height and an excess value per vertex.' },
    implementationNote:
      'Finding an admissible edge here scans a row of the V × V matrix, so a push or relabel can cost O(V) instead of O(1); harmless for the small networks shown.',
  },

  // ── Module 5: geometry ────────────────────────────────────────────────────
  'graham-scan': {
    variables: [
      { symbol: 'n', meaning: 'number of points' },
      { symbol: 'h', meaning: 'number of hull vertices' },
    ],
    time: [{ case: 'all', bound: 'O(n log n)', note: 'Same in every case: the angle sort always runs, even when the hull has only a few vertices.' }],
    kinds: ['Worst-case'],
    dominant: 'Sorting the points by polar angle.',
    derivation:
      'Finding the lowest point is O(n) and sorting the others by polar angle is O(n log n). During the scan each point is pushed once and popped at most once, so all orientation tests together cost O(n). The sort dominates.',
    space: { bound: 'O(n)', explanation: 'The sorted points and the hull stack.' },
  },
  'jarvis-march': {
    variables: [
      { symbol: 'n', meaning: 'number of points' },
      { symbol: 'h', meaning: 'number of hull vertices (part of the output)' },
    ],
    time: [{ case: 'all', bound: 'O(n·h)', note: 'Output-sensitive: O(n) when h is a small constant, O(n²) when every point is on the hull.' }],
    kinds: ['Output-sensitive'],
    dominant: 'h wrapping steps, each scanning all n points.',
    derivation:
      'Each step finds the next hull vertex by comparing every point with the current best candidate using one orientation test, O(n). The walk takes exactly h steps before returning to the start, so the total is O(n·h). That beats O(n log n) when h is smaller than log n, but degrades to O(n²) when all points are on the hull.',
    space: { bound: 'O(h)', explanation: 'The list of hull vertices, besides the input points.' },
  },
  'line-segment-intersection': {
    variables: [{ symbol: 'n', meaning: 'number of segments' }],
    time: [
      {
        case: 'all',
        bound: 'O(n log n)',
        note: 'Same in every case: sorting the 2n endpoints already costs O(n log n), even if an intersection is found at the first check.',
      },
    ],
    kinds: ['Worst-case'],
    dominant: 'Sorting the endpoint events, plus O(log n) per event in the sweep status.',
    derivation:
      'Sorting the 2n endpoint events costs O(n log n). Each event does a constant number of insert, delete and neighbour lookups in the sweep status, O(log n) each in a balanced search tree, plus at most two O(1) intersection tests. With 2n events that is O(n log n), and the algorithm stops at the first intersection it finds.',
    space: { bound: 'O(n)', explanation: 'The event list and the sweep status, each holding at most 2n entries.' },
    implementationNote:
      'The pseudocode uses a balanced search tree. This visualizer keeps the status in an array and re-sorts it on each insertion: O(n log n) per event and O(n² log n) in the worst case, which is fine for a few segments.',
  },

  // ── Module 6: randomized ──────────────────────────────────────────────────
  'randomized-quicksort': {
    variables: [{ symbol: 'n', meaning: 'number of elements' }],
    time: [
      { case: 'best', bound: 'O(n log n)', note: 'Every pivot splits its subarray evenly.' },
      { case: 'expected', bound: 'O(n log n)', note: 'Over the random pivot choices, for any input of distinct values: about 2n ln n ≈ 1.39·n log₂ n comparisons.' },
      {
        case: 'worst',
        bound: 'O(n²)',
        note: 'Pivots keep landing at the smallest or largest value (very unlikely), or the array has many equal values: this partition sends every value equal to the pivot to the left, so an array of identical values is always quadratic.',
      },
    ],
    kinds: ['Expected', 'Worst-case'],
    recurrence: 'T(n) = T(k) + T(n − 1 − k) + O(n), k = position of the random pivot',
    dominant: 'Partitioning, O(size) at each recursive call.',
    derivation:
      'Partitioning a subarray of size s costs O(s). Even splits give T(n) = 2T(n/2) + O(n) = O(n log n). The i-th and j-th smallest values are compared only if one of them is the first pivot chosen from the values between them, with probability 2/(j − i + 1); summing over all pairs gives about 2n ln n expected comparisons. Always choosing an extreme pivot gives T(n) = T(n − 1) + O(n) = O(n²).',
    space: { bound: 'O(n)', explanation: 'Recursion depth: O(log n) expected, but up to n in the worst case, because both sides are sorted recursively.' },
  },
  'hiring-problem': {
    variables: [
      { symbol: 'n', meaning: 'number of candidates' },
      { symbol: 'm', meaning: 'number of hires' },
      { symbol: 'cᵢ, cₕ', meaning: 'interview cost and hiring cost' },
    ],
    time: [{ case: 'all', bound: 'O(n)', note: 'Every candidate is interviewed once and compared once. The interesting quantity is the cost, which depends on m (below).' }],
    kinds: ['Expected', 'Worst-case'],
    dominant: 'The n interviews; the cost the problem studies is n·cᵢ + m·cₕ.',
    derivation:
      'Each candidate is interviewed and compared with the best so far, so the running time is O(n) in every case. The cost is n·cᵢ + m·cₕ: m = 1 at best (the best candidate comes first) and m = n at worst (increasing order). In a random order, candidate i is the best so far with probability 1/i, so the expected number of hires is Hₙ = 1 + 1/2 + … + 1/n ≈ ln n + 0.58, giving expected cost O(n·cᵢ + cₕ·ln n).',
    space: { bound: 'O(1)', explanation: 'Only the best candidate so far and the running cost are needed (the visualizer also lists who was hired).' },
  },
  'karger-min-cut': {
    variables: [
      { symbol: 'V', meaning: 'number of vertices' },
      { symbol: 'E', meaning: 'number of edges' },
      { symbol: 'R', meaning: 'number of independent runs' },
    ],
    time: [{ case: 'all', bound: 'O(R·V·E)', note: 'Each run does V − 2 contractions at O(E) each in this implementation; R runs repeat that.' }],
    kinds: ['Randomized (Monte Carlo)'],
    dominant: 'The V − 2 contractions of each run.',
    derivation:
      'A run contracts V − 2 random edges. Each contraction here rebuilds the list of remaining multigraph edges to pick one uniformly, O(E), so one run costs O(V·E); an adjacency-matrix version achieves O(V²). The running time is fixed, but the answer is not: one run finds a given minimum cut with probability at least 2/(V(V − 1)), and R runs all miss it with probability at most (1 − 2/(V(V − 1)))^R, which is at most 1/V after about V² ln V runs.',
    space: { bound: 'O(V + E)', explanation: 'The current multigraph: super-node memberships and edge multiplicities.' },
    implementationNote:
      'The page also checks every partition to show the true minimum cut, O(2^V·E). That is extra verification for learners, not part of Karger’s algorithm, and only runs on small graphs.',
  },

  // ── Module 7: approximation ───────────────────────────────────────────────
  'vertex-cover-approx': {
    variables: [
      { symbol: 'V', meaning: 'number of vertices' },
      { symbol: 'E', meaning: 'number of edges' },
    ],
    time: [{ case: 'all', bound: 'O(V + E)', note: 'With adjacency lists, each edge is examined a constant number of times.' }],
    kinds: ['Approximation'],
    dominant: 'Removing the edges covered by each chosen pair of endpoints.',
    derivation:
      'Minimum vertex cover is NP-hard as an optimization problem (its decision version, “is there a cover of size ≤ k?”, is NP-complete), so a fast approximation is used. Each picked edge adds its two endpoints and removes every edge touching them, so each edge is handled a constant number of times: O(V + E). The quality guarantee is separate from the time: the picked edges form a matching M, every cover needs a different vertex for each edge of M (so OPT ≥ |M|), and the algorithm takes 2|M| ≤ 2·OPT vertices.',
    space: { bound: 'O(V + E)', explanation: 'The remaining edges and the cover being built.' },
    implementationNote:
      'This visualizer removes covered edges by filtering the whole edge list after each pick: O(E) per pick and O(V·E) overall.',
  },
  'set-cover': {
    variables: [
      { symbol: 'n', meaning: 'number of elements in the universe |U|' },
      { symbol: 'm', meaning: 'number of subsets' },
    ],
    time: [{ case: 'all', bound: 'O(m·n·min(m, n))', note: 'Each round rescans every subset; there are at most min(m, n) rounds.' }],
    kinds: ['Approximation'],
    dominant: 'Recounting the uncovered elements of every subset in each round.',
    derivation:
      'Each round counts, for every subset, how many of its elements are still uncovered: O(m·n) in total. Every round covers at least one new element with a new subset, so there are at most min(m, n) rounds, giving O(m·n·min(m, n)). Smarter bookkeeping brings greedy set cover down to time linear in the total size of the subsets. The quality guarantee is at most H(n) ≤ ln n + 1 times the optimal number of subsets.',
    space: { bound: 'O(n + m)', explanation: 'The set of covered elements and a count per subset, besides the input.' },
  },
  'tsp-approx': {
    variables: [{ symbol: 'V', meaning: 'number of cities' }],
    time: [{ case: 'all', bound: 'O(V²)', note: 'Same in every case: building the minimum spanning tree of the complete graph dominates.' }],
    kinds: ['Approximation'],
    dominant: 'Building the minimum spanning tree with Prim’s algorithm.',
    derivation:
      'Prim’s algorithm on a complete graph with a key array costs O(V²): V rounds, each scanning V keys. Walking the doubled tree in DFS preorder and adding up the tour costs O(V). The quality guarantee (at most 2·OPT) is separate from the time, and only holds when the costs are metric.',
    space: { bound: 'O(V²)', explanation: 'The V × V cost matrix; the tree and tour need only O(V).' },
    implementationNote:
      'This visualizer’s Prim compares every tree vertex with every outside vertex in each round: O(V²) per round and O(V³) in total, which is fine for at most 6 cities.',
  },
});

export type AnalysisId = keyof typeof COMPLEXITY_ANALYSIS;

/** Short summary for compact views (Comparison page etc.), derived so it never disagrees. */
export function complexityFrom(a: ComplexityAnalysis): ComplexityInfo {
  const pick = (c: string) => a.time.find((t) => t.case === c)?.bound;
  const all = pick('all');
  return {
    timeBest: pick('best') ?? all,
    timeAverage: pick('expected') ?? pick('average') ?? all,
    timeWorst: pick('worst') ?? all ?? a.time[a.time.length - 1].bound,
    spaceWorst: a.space.bound,
    description: a.dominant,
  };
}
