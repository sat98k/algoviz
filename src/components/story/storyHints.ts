/**
 * One plain line per story scene, keyed by algorithm id: what the animation shows. Kept apart from
 * storyRegistry (which imports every scene) so pages that only need the words, like the home page
 * and the module pages, do not load the scenes themselves.
 */
export const STORY_HINTS: Record<string, string> = {
  'ford-fulkerson': 'Water pipes: a scout with a ball of string goes deep first',
  'edmonds-karp': 'Water pipes: ripple scouts check the nearest tanks first, then follow the trail back',
  'push-relabel': 'Tanks on stilts: water only rolls downhill',
  'naive-string-match': 'A word stencil sliding along a sentence',
  kmp: 'A smart stencil with jump-back notes',
  'rabin-karp': 'Fingerprints and a detective',
  'graham-scan': 'A rubber band hooked around pegs',
  'jarvis-march': 'Gift-wrapping pegs with a ribbon',
  'knapsack-dp': 'A wall of cubbies, a balance scale and a backpack',
  huffman: 'Marble jars tied into a hanging mobile',
  'n-queens': 'Queens on a wooden chessboard',
  'floyd-warshall': 'Hub towns and a trip planner',
  'bellman-ford': 'Delivery vans and price tags',
  'subset-sum': 'Coins on a balance scale',
  'graph-coloring': 'Painting houses so neighbours differ',
  'knapsack-bb': 'Treasure caves, crystal balls and rope barriers',
  'job-selection-bb': 'Treasure caves, crystal balls and rope barriers',
  'max-subarray': 'A road of coins and thieves',
  karatsuba: 'Three helpers instead of four',
  lcs: 'Two bead necklaces',
  'matrix-chain-multiplication': 'Gluing wooden panels in the cheapest order',
  'assembly-line-scheduling': 'A car factory with two belts',
  tsp: 'A postman with a stamp card and notebook',
  'suffix-tree': 'A word tree with apples and an ant',
  'line-segment-intersection': 'Sticks on a table and a sliding curtain',
  'randomized-quicksort': 'Kids lining up by height',
  'hiring-problem': 'An interview room with two coin jars',
  'karger-min-cut': 'Squishing balls of clay tied with ropes',
  'vertex-cover-approx': 'Security cameras at street corners',
  'set-cover': 'Radio towers lighting up houses',
  'tsp-approx': 'A rope network walked around like a hedge',
};
