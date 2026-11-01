import { algorithmRegistry } from '../config/algorithmRegistry';
import { STORY_SCENES } from '../components/story/storyRegistry';

/**
 * Redesign C's colour chapters: flat poster fields with the ink that reads on each.
 * `soft` is the secondary text colour on that field (4.5:1 or better at body size).
 */
export const FIELDS = {
  coral: { bg: '#ed4b44', ink: '#0f0f0f', soft: '#2e0a08' },
  ink: { bg: '#1a1a1a', ink: '#e6e0d2', soft: '#c9c2b2' },
  green: { bg: '#18bc42', ink: '#1a1a1a', soft: '#0b3d17' },
  yellow: { bg: '#f2c21a', ink: '#1a1a1a', soft: '#4d3c00' },
  bone: { bg: '#dcd5c5', ink: '#1a1a1a', soft: '#4a463e' },
} as const;
export type FieldName = keyof typeof FIELDS;

/** Each module's chapter colour, the same on the home page and on the module's own page. */
export const MODULE_FIELDS: FieldName[] = ['coral', 'ink', 'green', 'yellow', 'bone', 'coral', 'green'];
export const moduleField = (moduleNumber: number) => FIELDS[MODULE_FIELDS[(moduleNumber - 1) % MODULE_FIELDS.length]];

/** Algorithm names by id, for links that name where they go. */
export const ALGO_NAMES: Record<string, string> = Object.fromEntries(algorithmRegistry.map((a) => [a.id, a.name]));

/** One plain line about what an algorithm's story looks like, or its problem when it has none. */
export const storyLine = (id: string, problem: string) =>
  id === 'fractional-knapsack'
    ? 'Cheese wheels sliced to fit a leather backpack'
    : STORY_SCENES[id]?.hint ?? problem.split(/(?<=\.)\s/)[0];
