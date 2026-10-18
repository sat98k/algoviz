# AlgoViz Project Guidelines & Claude Instructions

This repository contains **AlgoViz**, an interactive algorithm visualization platform built with React, TypeScript, Vite, and Tailwind CSS.

---

## 🎨 Animation & Visual Design Preferences (CRITICAL)

When creating, refactoring, or reviewing visualizers—especially **Story / Animated Mode**—you **MUST** adhere to the user's design preferences documented in detail in [`docs/animation-preferences.md`](./docs/animation-preferences.md).

### Core Animation Rules

1. **Physical Tangibility Over Technical Abstraction**:
   - **No Raw Numbers in Story Mode**: Avoid abstract stat boxes, arrays of numbers, or formula cards in the animation view.
   - **Literal Physical Objects**: Use real-world metaphors (e.g., in Fractional Knapsack, items are literal 3D cheese wheels with realistic crust, color, and eyes; the knapsack is a physical leather backpack).
   - **Scale Mass by Size**: Physical dimensions must directly reflect weight/mass (e.g., small, medium, giant cheese wheels).
   - **Natural Colors**: Use authentic, appetizing colors (e.g., golden yellow `#f59e0b` / `#fef08a`), not arbitrary neon or rainbow palettes.

2. **Full Light Mode Aesthetic**:
   - Beginner-friendly animated views use a warm daylight palette (`#faf7f2` background, blonde oak / maple cutting board `#efe3d3`, tan/caramel leather).
   - Do **NOT** force dark mode or cold grays in the animation views.

3. **Unclipped Stage & True Physical Trajectories**:
   - **Never clip animations with `overflow-hidden`**: Moving elements must travel across open air on a shared canvas.
   - **Physical Dragging**: Items must physically glide across the open space from the table into the container.
   - **Clean CSS Transitions for Sorting**: Use smooth horizontal transitions (`transition: all 1s ease-in-out`). Do **NOT** use jarring mid-air flips or manual criss-cross gymnastics.

4. **Slicing & Fractional Handling**:
   - Show a visible slicing action (e.g., chef knife descending and chopping).
   - **Leftover Piece MUST Remain on the Board**: The unpicked leftover fraction must **permanently anchor on the table** with a label like `Left on board (X%)`. It must **never** disappear, glitch back into an uncut item, or move into the container.
   - **Only the Taken Fraction Flies**: Only the slice entering the container moves.

5. **Sequential Cause-and-Effect Timing**:
   - Actions must happen in natural chronological order:
     1. Slice occurs.
     2. Cut slice flies down into the container.
     3. Piece lands and settles inside.
     4. **ONLY AFTER** the piece has settled, the lid physically closes.

6. **Physical Lid Closing (No Loud Banners)**:
   - Show a 3D lid flap rotating down (`perspective(600px)` with `animate-lid-close`) and buckling shut with clasps.
   - **No "BAG FULL!" celebratory banner stamps**. The closed and buckled lid itself communicates fullness.
   - Show metrics cleanly next to the status (e.g., `Capacity Reached • Total Profit: $240`).
   - Keep container dimensions fixed (`w-80`) with zero jumping or shape shifting.

7. **Dual-Mode Architecture & Preservation**:
   - Always provide a top toggle:
     - `[🎬 Animation Mode]`: Tangible physical storytelling view.
     - `[📊 Technical View]`: Classic cards, capacity bars, formulas, and math steps.
   - **100% Backward Compatibility**: Both views consume the same `step.state`. Never break existing technical views or tests.

---

## 🛠️ Build & Test Commands

- **Build**: `npm run build`
- **Typecheck**: `npx tsc --noEmit`
- **Run All Tests**: `npm test` or `npx vitest run`
- **Run Specific Test**: `npx vitest run src/tests/visualTeaching.test.tsx`
- **Dev Server**: `npm run dev`

---

## 📂 Key Architecture Files

- `docs/animation-preferences.md`: Detailed visualizer animation standards and rules.
- `src/components/visualizers/FractionalKnapsackAnimatedView.tsx`: Gold-standard implementation of the animated view following all preferences.
- `src/components/visualizers/FractionalKnapsackVisualizer.tsx`: Dual-mode toggle integration.
- `src/index.css`: Reusable animation keyframes (`lidClose`, `knifeChop`, `bagSettle`, `sliceLaser`, `stampIn`).
