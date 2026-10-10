# Visual semantics

AlgoViz uses one small, fixed colour language across every visualizer so that a
colour always means the same thing, whichever algorithm you are watching.

**Rules**

1. **One meaning, one colour, one symbol.** A colour is never the only cue: every
   state that matters also has a symbol (✓ ✗ ✂ ↩ ★ ⚠ …) or a word (OUT, IN, PRUNED).
2. **Restraint.** Per step, emphasise the current element and at most one verdict
   (match or mismatch). Everything else stays neutral grey.
3. **Errors are red; skips are not.** Pruning a branch, skipping a candidate or a
   character leaving a window is routine and uses the neutral *pruned* style.
4. **Readable in both themes.** Text drawn in a semantic colour uses its *ink*
   variant, which meets WCAG AA (≥ 4.5:1) on its own 15% tint and on the page, in
   light and dark themes. Accents meet ≥ 3:1 against the page.

## The palette

| Semantic | Symbol | Meaning | Used for (examples) |
|---|---|---|---|
| **current** (amber) | ▶ | What the algorithm is looking at right now; the strongest cue | Active pseudocode line, cell being computed, square being tried, current window, item being interviewed, element being swapped |
| **compare** (sky) | ⇄ | Values being compared or read for the current decision | DP source cells, hash hit awaiting character check, character entering a Rabin-Karp window, bars being compared |
| **match** (green) | ✓ | A comparison succeeded / a check passed | Matching characters, verified window characters, found occurrences |
| **mismatch** (rose) | ✗ | A comparison failed / a constraint is violated | Character mismatch, attacked N-Queens square, colouring conflict, negative-weight cycle edge |
| **pruned** (slate, dashed) | ✂ | Deliberately skipped; cannot lead to a better answer. Not an error | Pruned / infeasible search-tree nodes, candidate not hired, character leaving a window (OUT) |
| **backtrack** (violet) | ↩ | A choice being undone | Reserved for backtracking undo states |
| **decision** (teal) | ● | An option the algorithm selected | Placed queen, pivot, hired candidate, shortest-path tree / flow / cover edges |
| **final** (green, heavier border) | ★ | Part of the completed answer | Final answer card, DP traceback path, elements in their final sorted position |
| **formula** (indigo) | ƒ | A formula or reference value; read, not acted on | Recurrence and formula call-outs |
| **warning** (orange) | ⚠ | Something to notice | Hash collision (spurious hit), TSP input that is not metric |

## Where it lives

- **Tokens:** `--sem-<name>` and `--sem-<name>-ink` in `src/index.css`. Each one is
  defined for the light theme in `:root` and for the dark theme in `.dark`.
- **Tailwind:** `bg-sem-<name>/15`, `border-sem-<name>` and `text-sem-<name>-ink`
  are defined in `tailwind.config.js`.
- **Recipes:** `src/styles/semantics.ts` exports `SEM[name]`, which contains:
  - class strings: `cell`, `badge`, `text`, `border`, `swatch`;
  - the `label` and `symbol`;
  - `semColor(name)` for inline SVG styles (`style={{ stroke: semColor('mismatch') }}`).
- **Tests:** `src/tests/visualSemantics.test.tsx`
  - keeps the CSS and the TypeScript mirror in sync;
  - checks contrast for every semantic in both themes;
  - checks that string matching shows ✓/✗ and uses the same styles in Naive, KMP and Rabin-Karp;
  - checks that a character leaving the window is neutral and a hash collision is a warning.

## Adoption status

Converted:

- **String matching** (Naive, KMP and Rabin-Karp all use the same visualizer):
  - characters, pattern, comparison chip, window bar, hash panel and rolling-hash breakdown;
  - LPS entry;
  - legend.
- **Pseudocode:** the active line.
- **Final answer card.**
- **DP tables:** cell being computed, cells it reads from, answer path (with a thicker border).
- **N-Queens board:** the current square, placed queens, and attacked squares (marked ✗).
- **Array bars** (Quicksort, Hiring), which also carry text badges.
- **Search trees:** pruned nodes are now neutral with a dashed outline and "✂ PRUNED".
- **Graph edges:** negative cycle/conflict as mismatch (dashed), active as current, tree/flow/cover as decision. Their arrowheads use the same colours.
- **TSP:** the non-metric warning.

Not yet converted (they keep their existing palettes, which already use text labels):

- Recursion tree (Max Subarray, Karatsuba)
- Assembly Line
- TSP routes
- Fractional Knapsack
- Set Cover
- Sweep line
- Point canvas
- Huffman codec
- Graph node fills
- Graph-colouring vertex colours (these are data, not semantics)

Convert them with `SEM` / `semColor` when they are next touched.
