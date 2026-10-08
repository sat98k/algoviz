/**
 * Problems that have more than one algorithm in the registry. An algorithm joins
 * a group through `comparison.group` in its registry entry; every member of a
 * group must accept the same input format so both can run on one shared input.
 */
export interface ComparisonGroup {
  /** Short problem name shown on the problem picker. */
  title: string;
  /** Plain-language statement of the problem every member solves. */
  problem: string;
  /** Optional caveat a learner should know before comparing. */
  note?: string;
}

const defineComparisonGroups = <K extends string>(groups: Record<K, ComparisonGroup>) => groups;

export const COMPARISON_GROUPS = defineComparisonGroups({
  'knapsack-01': {
    title: '0/1 Knapsack',
    problem:
      'Choose whole items (each one is either taken or left behind) so their total value is as large as possible without exceeding the knapsack capacity.',
  },
  'string-matching': {
    title: 'String Matching',
    problem: 'Find every position where a pattern string occurs inside a longer text.',
  },
  'max-flow': {
    title: 'Maximum Flow',
    problem:
      'Send as much flow as possible from a source to a sink through a network where every edge has a capacity limit.',
  },
  'convex-hull': {
    title: 'Convex Hull',
    problem: 'Find the smallest convex polygon that encloses every point in a set — like a rubber band stretched around them.',
  },
  tsp: {
    title: 'Travelling Salesperson',
    problem: 'Visit every city exactly once and return to the start, with the lowest total travel cost.',
    note: 'The approximation is only guaranteed to be within 2× of the optimal cost when travel costs satisfy the triangle inequality.',
  },
});

export type ComparisonGroupId = keyof typeof COMPARISON_GROUPS;

/** Shown first when the Comparison page opens. */
export const DEFAULT_COMPARISON_GROUP: ComparisonGroupId = 'knapsack-01';
