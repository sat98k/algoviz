# Owl Briefing: Architectural Review

**Goal:** before pressing Play, a beginner reads one pane at the top of the page, the 🦉 owl's briefing, and understands *what the problem is* and *how the whole procedure goes from start to finish*. The animation then confirms what they already expect, instead of being the first explanation.

**Scope:** 31 algorithms. Line Segment Intersection (sweep line) stays out of scope, as decided earlier. It keeps the current pane unchanged.

---

## 1. Current architecture

| Piece | Where | What it does today |
|---|---|---|
| `ProblemIntuitionPanel` | `src/components/common/ProblemIntuitionPanel.tsx` | Collapsible "Problem & how it works" section at the top of `AlgorithmPage`. Left column: `problemStatement`. Right column: numbered `coreSteps`, plus `DpCases` on DP pages. |
| `problemStatement` | `algorithmRegistry.ts` | At most 3 sentences (enforced by a test), no complexity talk. |
| `coreSteps` | `src/config/coreSteps.ts` | 3–6 numbered lines, at most 160 characters each (tested). Markup: `` `chip` ``, `**bold**`, ✓/✗. These also number the roadmap chips (`roadmaps.ts`). |
| `dpBrief` | `src/config/dpBriefs.ts` | The recurrence cases, rendered inside "How it works". |
| Glossary linking | `RichText.tsx`, `glossary.ts` | Each term is linked once across the pane (a shared `used` set). Tests require every listed term to be reachable in the problem statement and core steps. |
| Owl | `StoryStage.tsx` (`OwlBubble`) | Appears only inside 🎬 Animation Mode, and narrates one step at a time. |

**What tests pin about the pane:**
- the `aria-label="Problem and how it works"` and the "Problem & how it works" heading
- a "How it works" heading
- the core steps rendered with chips and bold text
- the DP cases rendered inside the pane, before "What happened and why?"
- glossary terms rendered in the pane
- no `uppercase` styling on headings
- the default input's answer never appearing in the problem statement or core steps

## 2. Why the current pane is not enough for a cold beginner

1. **No owl at the start.** The owl, which the teacher liked, first speaks *after* the learner switches to Animation Mode and presses Step. The pane before that is a dry definition plus a terse checklist.
2. **The core steps are a checklist, not an explanation.** Lines like "Give each node an upper bound…" assume the reader already knows what a node, a bound or a table is, and why the step is needed.
3. **No picture of the problem.** The problem statement is abstract. There is no small concrete example to make it tangible before the real input appears.
4. **No "why".** Nothing says why the method is correct or clever (why greedy works, why the table, why the bound lets us skip work).
5. **No bridge to the animation.** Nothing tells the learner what to look for once it plays, and the story metaphor (cheese, cubbies, water pipes…) is never introduced.

## 3. Target architecture

### 3.1 Data: `src/config/owlBriefings.ts`

```ts
export interface OwlBriefing {
  story: string;      // the problem as the owl tells it, using the same metaphor as the Animation Mode scene (2–4 sentences)
  goal: string;       // one sentence: the answer we want at the end
  example?: string;   // a tiny concrete example, NEVER the default input (no spoilers)
  overview: { title: string; text: string }[]; // the whole procedure, start to finish, in 3–6 plain stages
  insight: string;    // why the method works / what makes it clever
  watch: string[];    // what to look for in the animation and the technical view (2–4 items)
}
export const OWL_BRIEFINGS: Record<string, OwlBriefing>;
```

- Text uses the same RichText markup, so chips, bold text and glossary links work.
- Keeping the briefings in one config file, next to `coreSteps.ts`, means the wording can be reviewed in one place. The algorithm files and step generators are untouched, so the technical views and every existing test keep working.

### 3.2 UI: `ProblemIntuitionPanel` gains an optional `briefing`

When `briefing` is present, the panel renders the **owl pane**:

```
┌ 🦉 Problem & how it works ─────────────────────────────── Hide ┐
│ 🦉 ┌ speech bubble ───────────────────────────────────────────┐ │
│    │ The problem      story + goal (+ tiny example)            │ │
│    │                  "In textbook words: …" (problemStatement)│ │
│    └───────────────────────────────────────────────────────────┘ │
│ How it works: the big picture                                    │
│   ① stage title — plain explanation   ② …   ③ …                  │
│ Why it works: insight                                            │
│ ┌ The steps in short ───────┐  ┌ While you watch ──────────────┐ │
│ │ numbered coreSteps (same  │  │ • what to look for            │ │
│ │ numbers as the roadmap)   │  │ • …                           │ │
│ │ + DP cases                │  │                               │ │
│ └───────────────────────────┘  └───────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

- The owl speaks first, in plain language. The formal statement and the short numbered steps stay underneath, so nothing a test or the roadmap relies on is lost. The short steps keep the **same numbering** as the roadmap chips in the playback dock.
- The pane uses the site's theme tokens (it sits on the dark/light page shell, not inside an animation), with an amber owl accent that matches the narrator bubble.
- It stays collapsible ("Hide"), so it is out of the way while stepping.
- Glossary links: one shared `used` set, in reading order (owl text first), so each term is linked at its first appearance.
- Without a briefing (the sweep line), the panel renders exactly as today.

### 3.3 Rules for the owl's text

1. Use the metaphor of that algorithm's story scene, so the briefing and the animation tell one story.
2. Cover the **entire** procedure in order: setup, the repeated core step, how it ends, how the answer is read off.
3. Name every technical term once in plain words before using it (for example "a table of small answers (the DP table)").
4. Never state the default input's answer. Examples use different, tiny numbers.
5. Short sentences, second person or "we", no complexity notation.

### 3.4 Tests

- Every in-scope algorithm has a briefing with all fields, 3–6 stages and 2–4 watch items, and balanced markup.
- The rendered page shows the owl pane, all stages and the short steps, inside the same `aria-label`.
- The default input's answer does not appear in the briefing.
- The sweep line page still renders the classic pane.

---

## 4. Per-algorithm review

Each entry has two parts. **Today** names the gap a cold beginner hits in the current pane. **Briefing** gives the owl's plan: metaphor, stages, insight and what to watch.

### Module 1: Greedy and Divide & Conquer

**Fractional Knapsack**
- *Today:* the statement is clear, but nothing explains *why* "best value per kg first" is safe, or what "value ÷ weight" means in practice.
- *Briefing:* cheese wheels and a leather backpack. Stages: price per kg → line up best-first → pack whole wheels while they fit → slice the last one to fill exactly → stop. Insight: any kg of a worse cheese can be swapped for a better one, so best-first can't be beaten. Watch: the knife cut, and the leftover staying on the board.

**Huffman Coding**
- *Today:* "priority queue", "prefix code" and "single-node tree" arrive undefined, and it never says why merging the two smallest gives short codes to common letters.
- *Briefing:* marble jars hung into a mobile. Stages: count letters → one jar each, lightest first → tie the two lightest under a bar, repeat → read codes left = 0 / right = 1 → encode and decode. Insight: rare letters are tied first, so they hang deepest (long codes), and common ones stay near the top (short codes). Watch: the two lightest jars lifted each time; the codes read from top to bottom.

**Maximum Subarray (D&C)**
- *Today:* "contiguous", "recursively" and "crossing subarray" are unexplained, and the recursion's shape is never pictured.
- *Briefing:* a road of coins and thieves. Stages: one tile is its own answer → cut the road in half → solve each half the same way → the best stretch crossing the cut (two lanterns walking outward) → keep the best of three, passed back up. Insight: every stretch is entirely left, entirely right, or crosses the cut, so the three cases miss nothing. Watch: the tree of halves, the lanterns, the "podium" comparisons.

**Karatsuba**
- *Today:* the formulas are correct but heavy; the core idea "3 multiplications instead of 4" is buried.
- *Briefing:* three helpers instead of four. Stages: tiny numbers → multiply directly; split each number into high and low halves; three helpers (high×high, low×low, sum×sum); subtract to get the middle part; put the parts back by place value. Example with 12 × 34. Insight: one clever product holds both middle terms, and saving one of four at every level adds up. Watch: the helpers' tree and the subtraction step.

### Module 2: Dynamic Programming

**0-1 Knapsack (DP)**
- *Today:* the table appears with no motivation ("why a table?"), and the difference from the fractional version is not pictured.
- *Briefing:* a wall of cubbies, a scale and the backpack. Stages: why not try every combination → each cubby = a small question (first i cheeses, backpack of size w) → fill row by row: too heavy → copy above; fits → weigh skip vs take → the bottom-right cubby is the answer → walk back to see which cheeses were taken. Insight: every bigger answer is built from smaller ones already written down. Watch: the scale weighing two choices; the flashlight walking back.

**LCS**
- *Today:* subsequence vs substring is easy to confuse; "prefix" is never explained.
- *Briefing:* two bead necklaces. Example: "ACE" in "ABCDE"/"AXCYE". Stages: small questions on shorter necklaces → table of answers → compare the last beads (match → diagonal + 1; no match → better of dropping one) → read the length at the corner → walk back collecting matched beads. Insight: the last beads either match (then they must be used) or one of them is not in the answer. Watch: the arrows ↖ ↑ ←.

**Matrix Chain Multiplication**
- *Today:* why the order matters and why we fill by chain length are never shown.
- *Briefing:* gluing wooden panels. Example: 3 panels, two orders with very different costs. Stages: cost of one glue (a·b·c) → table of cheapest costs for every stretch → short stretches first → try every divider position, keep the cheapest, remember it → read the brackets from the dividers. Insight: the last glue joins a left group and a right group, and both must already be built as cheaply as possible. Watch: the divider sliding; "cheapest so far".

**Assembly Line Scheduling**
- *Today:* 8 input names (e, a, t, x) with no picture.
- *Briefing:* the car factory with two belts and a forklift. Stages: entry → station 1 on each belt → for each next station, on each belt: stay, or switch (forklift time), keep the faster → add the exit times, pick the faster belt → walk back to read the route. Insight: the fastest way to finish a station only depends on the fastest ways to finish the previous one. Watch: the race at each station.

**TSP (Held-Karp)**
- *Today:* set notation `DP[S, j]` appears with no warm-up.
- *Briefing:* the postman's notebook of stamp cards. Stages: why trying every round trip explodes → notebook page = cheapest way to collect a set of stamps and stand at a house → start page cost 0 → grow the sets one house at a time, arriving from the best previous house → close the loop home → read the notebook backwards. Insight: the best way to reach a page reuses the best earlier pages. Watch: the dotted candidate trails, and the cheapest one being written down.

### Module 2: Backtracking and Branch & Bound

**N-Queens**
- *Today:* how a queen attacks and what "backtrack" means are only in the checklist.
- *Briefing:* queens on a wooden board. Stages: one queen per row → in a row, try columns left to right → attacked? next column; safe? place and go down a row → no column left? lift the previous queen and move it on (backtracking) → all rows filled = solution. Insight: we never finish a board that is already broken, which saves enormous work. Watch: the red attack marks, and the search tree growing and being snipped.

**Subset Sum**
- *Today:* the "decision tree" and the two prune rules need a picture.
- *Briefing:* coins on a balance scale against a gold block. Stages: sort the coins → for each coin, on the pan or in the skip tray → keep the pan's total → too heavy? prune; even all the remaining coins can't reach it? prune → undo and try the other choice → balanced = found. Insight: pruning cuts whole branches of the tree without looking inside them. Watch: the scale tipping, and the ✂ marks.

**Graph Coloring**
- *Today:* "vertex", "adjacent" and "k" are assumed.
- *Briefing:* painting houses joined by fences. Stages: houses in order → try paint buckets in order → a neighbour has it? next bucket; safe? paint and move on → no bucket works? scrape the previous house and try its next colour → all painted = done (or, in find-all mode, keep going). Insight: same as backtracking: fix the latest choice first. Watch: clashes across a fence.

**0-1 Knapsack (Branch & Bound)**
- *Today:* "upper bound" and "best-first" are the whole idea and are explained in one line each.
- *Briefing:* treasure caves with crystal balls. Stages: sort by value per kg → each tunnel decides one item, take or leave → each cave's crystal ball promises the most it could still reach (fill the rest as if items could be cut) → always explore the most promising cave → rope off caves that are overweight or can't beat the trophy chest → when nothing promising is left, the chest holds the best. Insight: the promise is never too low, so roping off is always safe. Watch: crystal ball numbers vs the trophy chest.

**Job Selection (Branch & Bound)**
- *Today:* the slot-placement rule and the bound are never explained.
- *Briefing:* the same caves, now with jobs, time slots and deadlines. Stages: sort by profit → include or leave each job → check that every chosen job still fits by its deadline (latest free slot first) → the promise = profit + best remaining profits that fit in the free slots → explore the most promising, rope off the rest → the best feasible set wins. Insight: putting a job as late as possible keeps early slots open for others. Watch: the schedule slots filling.

### Module 3: String Matching

**Naive**
- *Today:* fine for the idea; it never says why it is slow.
- *Briefing:* a word stencil sliding along a sentence. Stages: place at the start → compare letters left to right → mismatch: slide one step right and start over → all match: record it → repeat to the end. Insight: simple, but letters get re-read many times, which is what KMP fixes. Watch: the reading finger going back.

**KMP**
- *Today:* LPS is the hardest idea and is defined only formally.
- *Briefing:* a smart stencil with jump-back notes. Example: in "ABAB", the start "AB" repeats at the end. Stages: phase 1, study the pattern alone and write notes (how much of the start repeats at each point) → phase 2, slide along the text → match: both move on → mismatch: the notes say how much is already matched, so jump the stencil, while the finger in the text never goes back → full match: record it and continue using the notes. Insight: what we already matched tells us where the next match could start. Watch: the finger in the text only moves forward.

**Rabin-Karp**
- *Today:* hash, modulus and "rolling" are unexplained.
- *Briefing:* fingerprints and a detective. Stages: turn the pattern into a number (fingerprint) → fingerprint the first window of text → different fingerprints: skip without reading letters → same fingerprint: the detective checks letter by letter (it might be a false alarm) → slide: update the fingerprint by removing the old letter and adding the new one. Example of a toy fingerprint (sum of letter numbers) and a false alarm. Insight: comparing two numbers is much quicker than comparing whole words. Watch: the spurious hit.

**Suffix Tree**
- *Today:* Ukkonen's rules, the active point and "remaining" are far beyond a beginner.
- *Briefing:* a word tree with apples and an ant. Stages: what a suffix is (all endings of the word) and why the "$" → the tree stores every ending as a path from the trunk to an apple → it grows one letter at a time: branches grow automatically, new twigs sprout where an ending goes a new way, and if the letter is already there, wait → search: the ant climbs down following the pattern's letters → every apple below where it stops is a match. Insight: any piece of the text is the start of some ending, so one climb finds all matches. Watch: twigs sprouting, the ant climbing.

### Module 4: Shortest Paths and Network Flow

**Floyd-Warshall**
- *Today:* "intermediate vertex k" is abstract.
- *Briefing:* hub towns and a trip planner. Stages: start with direct roads (∞ where none) → open one town as a hub → for every trip, is going through the hub cheaper? update → next hub → after every town has been a hub, every trip is the cheapest. Insight: after round k, every trip may use towns 1…k as stops. Watch: the "via hub" comparisons.

**Bellman-Ford**
- *Today:* "relax" and the V − 1 passes are the core and are unexplained.
- *Briefing:* delivery vans and price tags. Stages: the start town costs 0, others unknown → a van drives every road: cheaper price? update the tag → repeat whole rounds (at most towns − 1), stopping early if nothing changes → one extra round: still getting cheaper = a money-making loop (negative cycle). Insight: each round makes at least one more road of every best route correct. Watch: price tags dropping.

**Ford-Fulkerson**
- *Today:* the backward edge (undo) is never explained in plain words.
- *Briefing:* water pipes, a tower and a city. Stages: no water flowing yet → a scout droplet finds any route with spare room → the narrowest pipe limits it (the bottleneck) → push that much; note that it can be undone later → repeat until no route has room → the full pipes form the bottleneck of the whole city. Insight: the "undo" lets a later route reroute water, so we never get stuck with a bad early choice. Watch: purple "undo" tags.

**Edmonds-Karp**
- *Today:* reads like a second copy of Ford-Fulkerson.
- *Briefing:* the same pipes; the scout now spreads like ripples (BFS), closest tanks first, so each route has the fewest pipes. Stages: ripple search → bottleneck → push + undo room → repeat until the city can't be reached. Insight: always using the shortest route guarantees it finishes quickly. Watch: the ripple rings, and the queue.

**Push-Relabel**
- *Today:* heights, excess and relabel are pure notation.
- *Briefing:* tanks on stilts. Stages: the tower is lifted high and floods its neighbours → tanks holding extra water try to pour it one step downhill → no way down? jack the tank up just enough → water that can't reach the city eventually pours back to the tower → when no tank holds extra water, the city receives the maximum. Insight: local moves only, with no need to find whole routes. Watch: the jacks lifting the tanks.

### Module 5: Geometry (Line Segment Intersection out of scope)

**Graham's Scan**
- *Today:* polar angle and the cross product are unexplained.
- *Briefing:* a rubber band around pegs. Stages: start at the lowest peg → a lighthouse beam orders the pegs by angle → walk through them, hooking the band → at each peg: left turn = keep, right turn = dent, so remove the previous peg → the pegs left form the fence. Insight: a tight band only ever turns left. Watch: "snap!" when a dented peg is removed.

**Jarvis' March**
- *Today:* "most counter-clockwise" is hard to picture.
- *Briefing:* wrapping a ribbon around pegs. Stages: start at the lowest peg → aim the ribbon at some peg → test every other peg: further out? swing the ribbon to it → tie the ribbon to the outermost peg and move there → repeat until back at the start. Insight: each corner is the peg with all others on its left. Watch: the ribbon swinging.

### Module 6: Randomized

**Randomized Quicksort**
- *Today:* the partition procedure and why randomness helps are thin.
- *Briefing:* kids lining up by height. Stages: spin a wheel to pick a random kid (the pivot) → that kid steps to the end → measure every other kid: shorter or equal goes left of a little fence → the pivot steps into the gap: final spot → sort each side the same way → groups of one are done. Insight: a random pivot is very unlikely to be the shortest or tallest every time, so the splits stay balanced. Watch: the fence moving.

**Hiring Problem**
- *Today:* the probability claim (about ln n hires) is abstract.
- *Briefing:* the interview room with two coin jars. Stages: interview each candidate (a small coin) → better than the person at the desk? hire (a big coin) → otherwise send them home → count hires and cost. Insight: in random order, the 10th candidate is the best so far only 1 time in 10, so hires get rarer and rarer. Watch: the hiring jar filling more slowly over time.

**Karger's Min-Cut**
- *Today:* why repeating is necessary is buried in probabilities.
- *Briefing:* clay balls tied with ropes. Stages: pick a random rope → squish its two balls into one (ropes between them vanish, others stay) → repeat until two balls are left → the ropes between them are a cut → one run can be unlucky, so repeat many times and keep the smallest. Insight: the few ropes of the smallest cut are rarely picked, so most runs keep them. Watch: the rope count between the final two balls.

### Module 7: Approximation

**Vertex Cover (2-Approximation)**
- *Today:* the "twice the best" promise feels magic, and the default result looks big.
- *Briefing:* cameras at street corners. Stages: pick any unwatched street → put cameras on both corners → all streets touching them are now watched → repeat until every street is watched. Insight: the picked streets share no corners, and any plan needs a camera on each of them, so we use at most twice the best. Watch: the picked streets (they never touch).

**Set Cover (Greedy)**
- *Today:* "universe" and "subsets" are jargon.
- *Briefing:* radio towers lighting up houses. Stages: every house dark → switch on the tower that lights the most *dark* houses → mark them lit → repeat until all lit. Insight: greedy is not always the best, but it is never too far off. Watch: the count of new houses each tower adds.

**TSP (2-Approximation)**
- *Today:* MST, Euler walk and shortcutting are three unfamiliar ideas at once.
- *Briefing:* a rope network walked like a hedge. Stages: tie the cheapest ropes connecting all towns (a minimum spanning tree) → walk around the ropes, like tracing a hedge with your hand, so each rope is walked twice → follow that walk, but jump straight past towns already visited (shortcuts) → return home. Insight: the ropes cost less than any round trip, and the walk costs twice the ropes, so the tour is at most twice the best (when shortcuts never cost more: the triangle inequality). Watch: the shortcuts.
