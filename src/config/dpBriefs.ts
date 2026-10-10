/**
 * Compact visual DP rules (condition → formula → action), shown before the
 * demonstration. Keep every line short; longer material goes in `details`,
 * which is collapsed by default. Examples use each algorithm's default input.
 */
import { DpBrief } from '../types/algorithm';

const define = <K extends string>(entries: Record<K, DpBrief>) => entries;

export const DP_BRIEFS = define({
  'knapsack-dp': {
    cell: 'dp[i][w]',
    state: 'Best total value using items 1…i with capacity w.',
    cases: [
      { label: 'Item does not fit', tone: 'mismatch', condition: 'wᵢ > w', formula: 'dp[i][w] = dp[i−1][w]', action: 'Copy the cell above (leave item i out).' },
      {
        label: 'Item fits',
        tone: 'match',
        condition: 'wᵢ ≤ w',
        formula: 'dp[i][w] = max( dp[i−1][w], vᵢ + dp[i−1][w−wᵢ] )',
        action: 'Larger of: leave it out, or take it and use the remaining capacity.',
      },
    ],
    baseCase: 'dp[0][w] = dp[i][0] = 0 (no items, or no capacity).',
    fillOrder: 'Row by row, left → right. A row only reads the row above.',
    answer: 'dp[n][W], the bottom-right cell.',
    details: [
      { label: 'Worked example', text: 'dp[2][5] = 7: with items 1 and 2 (weights 2, 3; values 3, 4) and capacity 5, take both.' },
      { label: 'Which items?', text: 'Walk up from dp[n][W]: if a cell differs from the one above, item i was taken; subtract wᵢ from w.' },
    ],
  },
  lcs: {
    cell: 'dp[i][j]',
    state: 'LCS length of the first i characters of str1 and the first j of str2.',
    cases: [
      { label: 'Match', tone: 'match', condition: 'str1[i−1] = str2[j−1]', formula: 'dp[i][j] = dp[i−1][j−1] + 1', action: 'Diagonal ↖ + 1.' },
      { label: 'Mismatch', tone: 'mismatch', condition: 'str1[i−1] ≠ str2[j−1]', formula: 'dp[i][j] = max( dp[i−1][j], dp[i][j−1] )', action: 'Larger of top ↑ and left ←.' },
    ],
    baseCase: 'dp[0][j] = dp[i][0] = 0 (an empty prefix shares nothing).',
    fillOrder: 'Row by row, left → right. Top, left and diagonal are always ready.',
    answer: 'dp[m][n], the bottom-right cell.',
    details: [
      { label: 'Worked example', text: 'dp[2][1] = 1: "AB" and "B" share "B".' },
      { label: 'Reading the string', text: 'From dp[m][n]: on a match take the character and go ↖; otherwise go to the larger of ↑ and ←. Read the characters in reverse.' },
    ],
  },
  'matrix-chain-multiplication': {
    cell: 'm[i, j]',
    state: 'Fewest scalar multiplications to compute Aᵢ·…·Aⱼ (Aᵢ is p[i−1] × p[i]).',
    cases: [
      {
        label: 'Try every split',
        tone: 'compare',
        condition: 'for each k with i ≤ k < j',
        formula: 'm[i, j] = min_k ( m[i, k] + m[k+1, j] + p[i−1]·p[k]·p[j] )',
        action: 'Build both halves, multiply the results, keep the cheapest k in s[i, j].',
      },
    ],
    baseCase: 'm[i, i] = 0 (a single matrix needs no multiplication).',
    fillOrder: 'Diagonal by diagonal: chain length L = 2, 3, …, n. Both halves are shorter, so already filled.',
    answer: 'm[1, n], the top-right cell.',
    details: [
      { label: 'Why order matters', text: 'A (10×100), B (100×5), C (5×50): (AB)C costs 7,500 multiplications, A(BC) costs 75,000. A p×q times q×r product costs p·q·r.' },
      { label: 'Worked example', text: 'With p = [10, 20, 30, 40, 30], m[1, 2] = 10·20·30 = 6,000.' },
      { label: 'Placing the brackets', text: 's[1, n] = k gives the outer split (A₁…Aₖ)(Aₖ₊₁…Aₙ); repeat on each half.' },
    ],
  },
  'assembly-line-scheduling': {
    cell: 'f₁[j], f₂[j]',
    state: 'Fastest time to finish station j on line 1 (f₁) or line 2 (f₂).',
    cases: [
      {
        label: 'Station j on line 1',
        tone: 'compare',
        condition: 'stay on line 1, or switch from line 2',
        formula: 'f₁[j] = a₁,ⱼ + min( f₁[j−1], f₂[j−1] + t₂,ⱼ₋₁ )',
        action: 'Switching costs the transfer time t.',
      },
      {
        label: 'Station j on line 2',
        tone: 'compare',
        condition: 'stay on line 2, or switch from line 1',
        formula: 'f₂[j] = a₂,ⱼ + min( f₂[j−1], f₁[j−1] + t₁,ⱼ₋₁ )',
        action: 'Same rule with the lines swapped.',
      },
    ],
    baseCase: 'f₁[1] = e₁ + a₁,₁ and f₂[1] = e₂ + a₂,₁ (entry time + first station).',
    fillOrder: 'Station 1 → n, both lines at each station.',
    answer: 'min( f₁[n] + x₁, f₂[n] + x₂ ), the faster exit.',
    details: [
      { label: 'Symbols', text: 'aₗ,ⱼ = time at station j on line l; tₗ,ⱼ = transfer time leaving line l after station j; eₗ, xₗ = entry and exit times.' },
      { label: 'Worked example', text: 'f₁[1] = e₁ + a₁,₁ = 2 + 7 = 9.' },
      { label: 'The route', text: 'Remember which line each minimum came from, then follow those choices back from the faster exit.' },
    ],
  },
  tsp: {
    cell: 'DP[S, j]',
    state: 'Cheapest path from the start through exactly the cities in S, ending at city j.',
    cases: [
      {
        label: 'Choose the previous city',
        tone: 'compare',
        condition: 'for each k in S, k ≠ j',
        formula: 'DP[S, j] = min_k ( DP[S − {j}, k] + cost(k, j) )',
        action: 'Keep the cheapest; remember k as the parent.',
      },
    ],
    baseCase: 'DP[{start}, start] = 0.',
    fillOrder: 'By subset size: 2 cities, 3 cities, …, all n.',
    answer: 'min_j ( DP[all, j] + cost(j, start) ): finish, then return home.',
    details: [
      { label: 'Why not try every tour?', text: '(n − 1)!/2 tours: 3 tours for 4 cities, 181,440 for 10, and about 6 × 10¹⁶ for 20.' },
      { label: 'Worked example', text: 'DP[{A, B}, B] = 10: go straight from A to B.' },
      { label: 'The tour', text: 'Follow parent pointers back from the best final city, removing one city from S each time.' },
    ],
  },
  'floyd-warshall': {
    cell: 'D[i][j]',
    state: 'Shortest i → j distance using only vertices 1…k as stops (after round k).',
    cases: [
      { label: 'Shorter through k', tone: 'match', condition: 'D[i][k] + D[k][j] < D[i][j]', formula: 'D[i][j] = D[i][k] + D[k][j]', action: 'Update: route i → k → j.' },
      { label: 'Not shorter', tone: 'mismatch', condition: 'D[i][k] + D[k][j] ≥ D[i][j]', formula: 'D[i][j] stays the same', action: 'Keep the current best.' },
    ],
    baseCase: 'D[i][i] = 0; D[i][j] = edge weight, or ∞ if there is no edge.',
    fillOrder: 'Outer loop k = 1 → V (allow k as a new stop); then every pair (i, j).',
    answer: 'D[i][j] after round V (every vertex allowed as a stop).',
    details: [
      { label: 'Why in place is safe', text: 'D[i][k] and D[k][j] never change during round k: stopping at k on the way to or from k gains nothing.' },
      { label: 'Recovering a path', text: 'Store the next vertex on each best path and follow those pointers from i to j.' },
    ],
  },
});

export type DpBriefId = keyof typeof DP_BRIEFS;
