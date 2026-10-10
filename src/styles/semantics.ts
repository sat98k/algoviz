/**
 * Semantic visual language shared by every visualizer. See docs/visual-semantics.md.
 *
 * One meaning → one colour → one symbol/label. Colour is never the only cue: every
 * state that matters also carries a symbol (✓ ✗ ✂ ↩ …) or a word.
 *
 * Restraint rule: at most one `current` element and one verdict (`match`/`mismatch`)
 * should be emphasised per step; everything else stays neutral.
 */

export type Semantic =
  | 'current'
  | 'compare'
  | 'match'
  | 'mismatch'
  | 'pruned'
  | 'backtrack'
  | 'decision'
  | 'final'
  | 'formula'
  | 'warning';

export const SEMANTIC_KINDS: Semantic[] = [
  'current',
  'compare',
  'match',
  'mismatch',
  'pruned',
  'backtrack',
  'decision',
  'final',
  'formula',
  'warning',
];

/**
 * Mirror of the --sem-* variables in src/index.css ("r g b"), for the rare places that
 * need raw values (contrast tests). Keep in sync; a test fails if they drift.
 */
export const SEMANTIC_TOKENS: Record<'light' | 'dark', Record<Semantic, { accent: string; ink: string }>> = {
  light: {
    current: { accent: '180 83 9', ink: '120 53 15' },
    compare: { accent: '2 132 199', ink: '7 89 133' },
    match: { accent: '4 120 87', ink: '6 78 59' },
    mismatch: { accent: '190 18 60', ink: '136 19 55' },
    pruned: { accent: '100 116 139', ink: '51 65 85' },
    backtrack: { accent: '109 40 217', ink: '76 29 149' },
    decision: { accent: '15 118 110', ink: '19 78 74' },
    final: { accent: '4 120 87', ink: '6 78 59' },
    formula: { accent: '67 56 202', ink: '49 46 129' },
    warning: { accent: '194 65 12', ink: '124 45 18' },
  },
  dark: {
    current: { accent: '245 158 11', ink: '252 211 77' },
    compare: { accent: '56 189 248', ink: '186 230 253' },
    match: { accent: '212 255 50', ink: '236 252 203' },
    mismatch: { accent: '251 113 133', ink: '254 205 211' },
    pruned: { accent: '100 116 139', ink: '148 163 184' },
    backtrack: { accent: '167 139 250', ink: '221 214 254' },
    decision: { accent: '45 212 191', ink: '153 246 228' },
    final: { accent: '212 255 50', ink: '236 252 203' },
    formula: { accent: '165 180 252', ink: '199 210 254' },
    warning: { accent: '251 146 60', ink: '254 215 170' },
  },
};

export interface SemanticStyle {
  /** Plain-language name for legends and screen readers. */
  label: string;
  /** Non-colour cue shown next to or inside the element. */
  symbol: string;
  /** What the colour means, for the legend/docs. */
  meaning: string;
  /** A highlighted cell/chip: tinted background, accent border, readable ink. */
  cell: string;
  /** A small pill/badge. */
  badge: string;
  /** Text only (ink colour). */
  text: string;
  /** Border/outline only. */
  border: string;
  /** Legend swatch. */
  swatch: string;
}

// Class strings are written out in full so Tailwind can find them.
export const SEM: Record<Semantic, SemanticStyle> = {
  current: {
    label: 'Current step',
    symbol: '▶',
    meaning: 'What the algorithm is looking at right now; the strongest cue on screen.',
    cell: 'bg-sem-current/15 border border-sem-current text-sem-current-ink font-bold',
    badge: 'bg-sem-current/15 border border-sem-current/60 text-sem-current-ink',
    text: 'text-sem-current-ink',
    border: 'border-sem-current',
    swatch: 'bg-sem-current/30 border border-sem-current',
  },
  compare: {
    label: 'Being compared',
    symbol: '⇄',
    meaning: 'Values being compared or read as input to the current decision.',
    cell: 'bg-sem-compare/15 border border-sem-compare text-sem-compare-ink font-semibold',
    badge: 'bg-sem-compare/15 border border-sem-compare/60 text-sem-compare-ink',
    text: 'text-sem-compare-ink',
    border: 'border-sem-compare',
    swatch: 'bg-sem-compare/30 border border-sem-compare',
  },
  match: {
    label: 'Match',
    symbol: '✓',
    meaning: 'A comparison succeeded or a check passed.',
    cell: 'bg-sem-match/15 border border-sem-match text-sem-match-ink font-bold',
    badge: 'bg-sem-match/15 border border-sem-match/60 text-sem-match-ink',
    text: 'text-sem-match-ink',
    border: 'border-sem-match',
    swatch: 'bg-sem-match/30 border border-sem-match',
  },
  mismatch: {
    label: 'Mismatch',
    symbol: '✗',
    meaning: 'A comparison failed or a constraint is violated.',
    cell: 'bg-sem-mismatch/15 border-2 border-sem-mismatch text-sem-mismatch-ink font-bold',
    badge: 'bg-sem-mismatch/15 border border-sem-mismatch/60 text-sem-mismatch-ink',
    text: 'text-sem-mismatch-ink',
    border: 'border-sem-mismatch',
    swatch: 'bg-sem-mismatch/30 border-2 border-sem-mismatch',
  },
  pruned: {
    label: 'Pruned / skipped',
    symbol: '✂',
    meaning: 'Deliberately skipped because it cannot lead to a better answer. Not an error.',
    cell: 'bg-sem-pruned/10 border border-dashed border-sem-pruned text-sem-pruned-ink line-through',
    badge: 'bg-sem-pruned/10 border border-dashed border-sem-pruned text-sem-pruned-ink',
    text: 'text-sem-pruned-ink',
    border: 'border-sem-pruned border-dashed',
    swatch: 'bg-sem-pruned/20 border border-dashed border-sem-pruned',
  },
  backtrack: {
    label: 'Backtrack',
    symbol: '↩',
    meaning: 'A choice being undone so another option can be tried.',
    cell: 'bg-sem-backtrack/15 border border-sem-backtrack text-sem-backtrack-ink',
    badge: 'bg-sem-backtrack/15 border border-sem-backtrack/60 text-sem-backtrack-ink',
    text: 'text-sem-backtrack-ink',
    border: 'border-sem-backtrack',
    swatch: 'bg-sem-backtrack/30 border border-sem-backtrack',
  },
  decision: {
    label: 'Chosen',
    symbol: '●',
    meaning: 'An option the algorithm has selected (taken item, chosen edge, kept value).',
    cell: 'bg-sem-decision/15 border border-sem-decision text-sem-decision-ink font-bold',
    badge: 'bg-sem-decision/15 border border-sem-decision/60 text-sem-decision-ink',
    text: 'text-sem-decision-ink',
    border: 'border-sem-decision',
    swatch: 'bg-sem-decision/30 border border-sem-decision',
  },
  final: {
    label: 'Final answer',
    symbol: '★',
    meaning: 'Part of the completed answer.',
    cell: 'bg-sem-final/20 border-2 border-sem-final text-sem-final-ink font-bold',
    badge: 'bg-sem-final/15 border border-sem-final/60 text-sem-final-ink',
    text: 'text-sem-final-ink',
    border: 'border-sem-final',
    swatch: 'bg-sem-final/30 border-2 border-sem-final',
  },
  formula: {
    label: 'Formula',
    symbol: 'ƒ',
    meaning: 'A formula, recurrence or reference value; read, not acted on.',
    cell: 'bg-sem-formula/10 border border-sem-formula/50 text-sem-formula-ink font-mono',
    badge: 'bg-sem-formula/10 border border-sem-formula/50 text-sem-formula-ink',
    text: 'text-sem-formula-ink',
    border: 'border-sem-formula/50',
    swatch: 'bg-sem-formula/20 border border-sem-formula/50',
  },
  warning: {
    label: 'Warning',
    symbol: '⚠',
    meaning: 'Something the learner should notice: a collision, an unmet assumption.',
    cell: 'bg-sem-warning/15 border border-sem-warning text-sem-warning-ink',
    badge: 'bg-sem-warning/15 border border-sem-warning/60 text-sem-warning-ink',
    text: 'text-sem-warning-ink',
    border: 'border-sem-warning',
    swatch: 'bg-sem-warning/30 border border-sem-warning',
  },
};

/** CSS colour for inline SVG styles, theme-aware: semColor('mismatch') → "rgb(var(--sem-mismatch))". */
export const semColor = (kind: Semantic, part: 'accent' | 'ink' = 'accent', alpha?: number) => {
  const v = part === 'ink' ? `--sem-${kind}-ink` : `--sem-${kind}`;
  return alpha === undefined ? `rgb(var(${v}))` : `rgb(var(${v}) / ${alpha})`;
};
