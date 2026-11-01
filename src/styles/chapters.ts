import { algorithmRegistry } from '../config/algorithmRegistry';
import { STORY_SCENES } from '../components/story/storyRegistry';

export { FIELDS, MODULE_FIELDS, moduleField } from './fields';
export type { FieldName } from './fields';

/** Algorithm names by id, for links that name where they go. */
export const ALGO_NAMES: Record<string, string> = Object.fromEntries(algorithmRegistry.map((a) => [a.id, a.name]));

/** One plain line about what an algorithm's story looks like, or its problem when it has none. */
export const storyLine = (id: string, problem: string) =>
  id === 'fractional-knapsack'
    ? 'Cheese wheels sliced to fit a leather backpack'
    : STORY_SCENES[id]?.hint ?? problem.split(/(?<=\.)\s/)[0];
