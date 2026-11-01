/**
 * Redesign C's colour chapters: flat poster fields with the ink that reads on each.
 * `soft` is the secondary text colour on that field (4.5:1 or better at body size).
 * Kept apart from chapters.ts so the story scenes can use it without importing their own registry.
 */
export const FIELDS = {
  coral: { bg: '#ed4b44', ink: '#0f0f0f', soft: '#2e0a08' },
  ink: { bg: '#1a1a1a', ink: '#e6e0d2', soft: '#c9c2b2' },
  green: { bg: '#18bc42', ink: '#1a1a1a', soft: '#0b3d17' },
  yellow: { bg: '#f2c21a', ink: '#1a1a1a', soft: '#4d3c00' },
  bone: { bg: '#dcd5c5', ink: '#1a1a1a', soft: '#4a463e' },
} as const;
export type FieldName = keyof typeof FIELDS;
export type Field = (typeof FIELDS)[FieldName];

/** Each module's chapter colour, the same on the home page and on the module's own page. */
export const MODULE_FIELDS: FieldName[] = ['coral', 'ink', 'green', 'yellow', 'bone', 'coral', 'green'];
export const moduleField = (moduleNumber: number): Field => FIELDS[MODULE_FIELDS[(moduleNumber - 1) % MODULE_FIELDS.length]];
