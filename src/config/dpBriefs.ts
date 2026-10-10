/**
 * DP recurrence cases (condition → formula → action), shown under "How it works".
 * Keep every line short; longer material goes in `details`, collapsed by default.
 */
import { DpBrief } from '../types/algorithm';

const define = <K extends string>(entries: Record<K, DpBrief>) => entries;

export const DP_BRIEFS = define({
  'knapsack-dp': {
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
    details: [
      { label: 'Worked example', text: 'dp[2][5] = 7: with items 1 and 2 (weights 2, 3; values 3, 4) and capacity 5, take both.' },
      { label: 'Which items?', text: 'Walk up from dp[n][W]: if a cell differs from the one above, item i was taken; subtract wᵢ from w.' },
    ],
  },
  lcs: {
    cases: [
      { label: 'Match', tone: 'match', condition: 'str1[i−1] = str2[j−1]', formula: 'dp[i][j] = dp[i−1][j−1] + 1', action: 'Diagonal ↖ + 1.' },
      { label: 'Mismatch', tone: 'mismatch', condition: 'str1[i−1] ≠ str2[j−1]', formula: 'dp[i][j] = max( dp[i−1][j], dp[i][j−1] )', action: 'Larger of top ↑ and left ←.' },
    ],
    details: [
      { label: 'Worked example', text: 'dp[2][1] = 1: "AB" and "B" share "B".' },
      { label: 'Reading the string', text: 'From dp[m][n]: on a match take the character and go ↖; otherwise go to the larger of ↑ and ←. Read the characters in reverse.' },
    ],
  },
  'matrix-chain-multiplication': {
    cases: [
      {
        label: 'Try every split',
        tone: 'compare',
        condition: 'for each k with i ≤ k < j',
        formula: 'm[i, j] = min_k ( m[i, k] + m[k+1, j] + p[i−1]·p[k]·p[j] )',
        action: 'Build both halves, multiply the results, keep the cheapest k in s[i, j].',
      },
    ],
    details: [
      { label: 'Why order matters', text: 'A (10×100), B (100×5), C (5×50): (AB)C costs 7,500 multiplications, A(BC) costs 75,000. A p×q times q×r product costs p·q·r.' },
      { label: 'Worked example', text: 'With p = [10, 20, 30, 40, 30], m[1, 2] = 10·20·30 = 6,000.' },
      { label: 'Placing the brackets', text: 's[1, n] = k gives the outer split (A₁…Aₖ)(Aₖ₊₁…Aₙ); repeat on each half.' },
    ],
  },
  'assembly-line-scheduling': {
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
    details: [
      { label: 'Symbols', text: 'aₗ,ⱼ = time at station j on line l; tₗ,ⱼ = transfer time leaving line l after station j; eₗ, xₗ = entry and exit times.' },
      { label: 'Worked example', text: 'f₁[1] = e₁ + a₁,₁ = 2 + 7 = 9.' },
      { label: 'The route', text: 'Remember which line each minimum came from, then follow those choices back from the faster exit.' },
    ],
  },
  tsp: {
    cases: [
      {
        label: 'Choose the previous city',
        tone: 'compare',
        condition: 'for each k in S, k ≠ j',
        formula: 'DP[S, j] = min_k ( DP[S − {j}, k] + cost(k, j) )',
        action: 'Keep the cheapest; remember k as the parent.',
      },
    ],
    details: [
      { label: 'Why not try every tour?', text: '(n − 1)!/2 tours: 3 tours for 4 cities, 181,440 for 10, and about 6 × 10¹⁶ for 20.' },
      { label: 'Worked example', text: 'DP[{A, B}, B] = 10: go straight from A to B.' },
      { label: 'The tour', text: 'Follow parent pointers back from the best final city, removing one city from S each time.' },
    ],
  },
  'floyd-warshall': {
    cases: [
      { label: 'Shorter through k', tone: 'match', condition: 'D[i][k] + D[k][j] < D[i][j]', formula: 'D[i][j] = D[i][k] + D[k][j]', action: 'Update: route i → k → j.' },
      { label: 'Not shorter', tone: 'mismatch', condition: 'D[i][k] + D[k][j] ≥ D[i][j]', formula: 'D[i][j] stays the same', action: 'Keep the current best.' },
    ],
    details: [
      { label: 'Why in place is safe', text: 'D[i][k] and D[k][j] never change during round k: stopping at k on the way to or from k gains nothing.' },
      { label: 'Recovering a path', text: 'Store the next vertex on each best path and follow those pointers from i to j.' },
    ],
  },
});

export type DpBriefId = keyof typeof DP_BRIEFS;
