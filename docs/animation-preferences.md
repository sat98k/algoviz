# Animation & Visual Design Preferences

This document captures the visual, animation, and interaction design rules established for AlgoViz's **Animated / Story Mode**. Any future visualizer or agent (including Claude) must consult these preferences when creating or updating visualizers.

---

## 1. Physical Tangibility Over Technical Abstraction
* **No Raw Number Dumps**: In Animated / Story Mode, avoid abstract stat cards, arrays of numbers, and formula boxes.
* **Literal Real-World Objects**: Represent problem entities as tangible physical items (e.g., in Fractional Knapsack, items are real 3D cheese wheels with rind and eyes; the knapsack is a physical leather backpack).
* **Mass/Weight Shown as Size**: Physical dimensions must scale directly with weight (e.g., weight 10 = small cheese wheel, weight 20 = medium cheese wheel, weight 30 = giant cheese wheel).
* **Natural, Cohesive Colors**: Use natural, authentic colors (e.g., appetizing golden-yellow cheese `#f59e0b` / `#fef08a`), not arbitrary rainbow palettes.

---

## 2. Bright Light-Mode Aesthetic
* **Warm & Inviting**: Use a clean, warm daylight palette (`#faf7f2` background, warm blonde oak / maple cutting boards `#efe3d3`, tan and caramel leather).
* **High Contrast & Readability**: Crisp dark stone typography (`text-stone-800`, `text-amber-950`).
* **Do Not Force Dark Mode**: The beginner-friendly animated views are designed in light mode.

---

## 3. Unclipped Stage & True Physical Trajectories
* **Never Clip Trajectories with `overflow-hidden`**: Objects moving from one zone to another (e.g., from table into the bag) must travel through open air across the shared canvas.
* **Physical Dragging**:
  * An item being packed lifts off the table, glides smoothly across the open stage, enters the container opening, and drops inside.
* **Clean CSS Transitions for Sorting**:
  * For sorting, use clean, smooth horizontal CSS transitions (`transition: all 1s ease-in-out` on slot positions).
  * Do NOT create awkward mid-air criss-cross flips. Let items smoothly glide horizontally into their sorted slots.

---

## 4. Slicing & Fractional Handling
* **Visible Slicing Action**: Show a proper slicing animation (e.g. chef's knife descending and cutting through the cheese).
* **Leftover Piece MUST Remain on Table**:
  * The leftover/unpicked fraction must **permanently remain anchored on the cutting board** at its table slot (labelled `Left on board (X%)`).
  * It must **never** move down to the bag, fade away, or glitch back into an uncut item on later steps.
* **Only Taken Piece Travels**: Only the cut fraction being packed detaches and flies into the bag.

---

## 5. Sequential Cause-and-Effect Timing
Never trigger actions simultaneously if they depend on each other physically:
1. **Action 1**: Knife chops down and slices through the object.
2. **Action 2**: The cut piece lifts and glides downward into the bag.
3. **Action 3**: The piece lands and settles inside the bag compartment.
4. **Action 4**: **ONLY AFTER** the piece has completely landed inside, the lid physically animates down and buckles shut.

---

## 6. Physical Lid Closing (No Loud Banners)
* **Literal Closing Animation**: Show a real physical lid flap pivoting in 3D (`perspective(600px)` rotating down via `animate-lid-close`) and buckling shut with clasps.
* **No "BAG FULL" Celebration Stamps**: Avoid loud, bouncing "BAG FULL!" badge overlays. The closed and buckled lid itself communicates that it is full.
* **Clean Profit Metric**: Display total profit cleanly next to the status (e.g., `Capacity Reached • Total Profit: $240`).
* **Consistent Container Shape**: The container must maintain identical fixed dimensions (e.g., exact `w-80` width) whether the lid is open or closed, with zero jumping or shape shifting.

---

## 7. Architecture & Preservation
* **Toggle at the Top**: Always provide a view switcher:
  * `[🎬 Animation Mode]`: The tangible physical storytelling view.
  * `[📊 Technical View]`: The existing classic cards, capacity bars, and mathematical formulas.
* **100% Backward Compatibility**: Both modes must consume the same `step.state` data and pass all unit and regression tests.
