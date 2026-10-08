import { AlgorithmConfig } from '../types/algorithm';
import { algorithmRegistry } from '../config/algorithmRegistry';
import { COMPARISON_GROUPS, ComparisonGroup, ComparisonGroupId } from '../config/comparisonGroups';

export interface ComparisonGroupWithMembers extends ComparisonGroup {
  id: ComparisonGroupId;
  /** Registry algorithms in this group, in registry order. */
  members: AlgorithmConfig[];
}

/** Groups that have at least two algorithms, derived from `comparison.group` in the registry. */
export const getComparisonGroups = (registry: AlgorithmConfig[] = algorithmRegistry): ComparisonGroupWithMembers[] =>
  (Object.keys(COMPARISON_GROUPS) as ComparisonGroupId[])
    .map((id) => ({
      id,
      ...COMPARISON_GROUPS[id],
      members: registry.filter((a) => a.comparison?.group === id),
    }))
    .filter((g) => g.members.length >= 2);

/** Two algorithms may be compared only when they belong to the same comparison group. */
export const areComparable = (a: AlgorithmConfig, b: AlgorithmConfig) =>
  a.id !== b.id && !!a.comparison && a.comparison.group === b.comparison?.group;

/** The default pair for a group: its first two members in registry order. */
export const getDefaultPair = (group: ComparisonGroupWithMembers): [AlgorithmConfig, AlgorithmConfig] => [
  group.members[0],
  group.members[1],
];

/** Same defaults the algorithm page uses: schema defaults overlaid with the first preset. */
export const getDefaultInputs = (config: AlgorithmConfig): Record<string, any> => {
  const init: Record<string, any> = {};
  config.inputSchema.forEach((field) => {
    init[field.name] = field.defaultValue;
  });
  return { ...init, ...(config.presets[0]?.data ?? {}) };
};
