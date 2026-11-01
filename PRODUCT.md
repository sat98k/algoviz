# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People learning the Design and Analysis of Algorithms material: classmates, other students and self-learners who
open the site to understand an algorithm, plus the course teacher, who is shown the site. The course project has
already been graded, so the site now exists for its users, not for an evaluation.

## Product Purpose

AlgoViz acts out all 32 algorithms of the BCSE204L (Design and Analysis of Algorithms) syllabus, step by step, so
someone meeting an algorithm for the first time can watch it work and follow why each step happens. Success: a
visitor who did not know the algorithm can explain it after one play-through.

## Positioning

Every algorithm is told twice from the same steps: as a physical story (cheese wheels in a backpack, water in pipes,
queens on a wooden board) narrated by an owl, and as a technical view with the tables, formulas and counters.

## Capabilities and Constraints

- React 18, TypeScript, Vite, Tailwind 3, Vitest; static site with no backend or accounts.
- Step-generator snapshots drive forward and backward stepping; both views read the same `step.state`.
- Story scenes follow `docs/animation-preferences.md` (binding): literal objects scaled by weight, cause before effect,
  warm daylight, unclipped trajectories, leftovers stay where they were cut.
- The owl narrates every step in the player, and the step's animation waits for it.
- The technical view stays one toggle away and its tests must keep passing.
- Inferred: laptop screens are the main viewport; phones should work without sideways scrolling.

## Brand Commitments

- Name: AlgoViz, with the owl as narrator and mark.
- The C home page (`redesign/playful`) is the confirmed reference for the whole site's feel: colour chapters per
  module, very large display type, lit 3D objects, grainy shader gradients, playful motion.

## Evidence on Hand

The 32 implemented algorithms with their default inputs (`src/config/algorithmRegistry.ts`) and the test suite.
No testimonials, user counts or outside reviews exist; do not invent any.

## Product Principles

1. Show the thing, then name it: the story first, the formal view one toggle away.
2. Every motion explains a step; nothing moves only to decorate.
3. One feel across every page: a visitor should never feel they left the home page's world.
4. Beginners first: plain words, no unexplained symbols in the story view.

## Accessibility & Inclusion

Inferred from the existing work: WCAG 2.1 AA contrast, full keyboard use of the player, reduced motion respected,
looping motion pauses with the player.
