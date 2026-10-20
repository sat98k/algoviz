# Beginner Clarity Audit

**Goal (from the teacher):** a student who has never seen the course should be able to open the site and understand each algorithm from scratch, without anyone explaining it to them.

**Scope:** all 32 algorithms except Line Segment Intersection (sweep line, out of scope for now). Nothing has been implemented. This is analysis only.

**How it was checked:** I ran every algorithm's step generator on its default preset and read the full text of every step, read every story scene's owl narration, read the page layout code, and opened the site in a browser.

---

## 1. The short version

The animations and the owl are strong. The procedure is not clear yet for four reasons:

1. **A beginner never meets the owl by default.** Technical View is the default (`VisualizerStage.tsx`). The owl only lives inside Animation Mode, and Fractional Knapsack, the gold-standard scene, has no owl at all.
2. **Too many voices, no single guide.** One step is explained in up to four places at once: the owl bubble, "What happened and why?", the "Rule for this cell" card and the highlighted pseudocode. They use different vocabulary (cheese and cubbies vs. `dp[i][w]`), and nothing connects the two.
3. **There is no roadmap.** "How it works" lists 4–6 numbered steps, but while playing, nothing tells the learner which of those steps they are in now. The 88-step Max Subarray run and the 61-step Jarvis run feel like one long list.
4. **Step text often says *what* without *why*, or without the numbers.** Many descriptions are code-speak ("Assume matchFound = true", "Spawning child call tree branch", "Dequeue S. Queue: [empty]") or skip the arithmetic ("Taking it gives more value").

---

## 2. Site-wide findings

### 2.1 First visit (Home → Module → Track → Algorithm)

| Issue | Where | Suggestion |
|---|---|---|
| The home and module text is written for experts: "deterministic step-by-step visualizers, recurrence metrics, and invariant proofs", "zero-backtrack failure functions via the KMP π table", "polynomial rolling hash modulos". | `Home.tsx`, `ModulePage.tsx` module descriptions | Rewrite each card in one plain sentence about the *problem* ("Find a word inside a long text"). Keep the technical blurb as a second line or a tooltip. |
| There is no "Start here" or "How to use this site". | Home | Add a short owl-led intro: what a step is, what Play / Step do, what the two view modes are, and a suggested first algorithm per module. |
| It takes 3 clicks to reach an algorithm (module, then track, then algorithm). | ModulePage | Fine for browsing, but add a direct "Start with: Fractional Knapsack" button on each module card. |
| There is no prerequisite or ordering guidance. For example, Edmonds-Karp assumes Ford-Fulkerson, KMP assumes Naive, Knapsack B&B assumes Fractional Knapsack (for the bound), and TSP Approx assumes MSTs. | Algorithm page header | Add a "Before this, read: …" chip and a "Next: …" link. |
| Paradigm intros are abstract ("memoizing intermediate states in multi-dimensional tables"). | ModulePage track cards | Give each paradigm a one-minute primer with a tiny example (for example Fibonacci for DP, or a 3-item take/skip tree for backtracking), ideally told by the owl. |
| Module names are inconsistent: "Module 4: Graph Algorithms", "Module 4: Network Flow" and "Module 4: Graph Algorithms & Network Flow" all appear. Ford-Fulkerson is titled "Ford-Fulkerson (Edmonds-Karp Max Flow)", which beginners will confuse with the separate Edmonds-Karp page. | `algorithmRegistry.ts` (`moduleName`, `name`) | Normalise the module names. Rename Ford-Fulkerson and say explicitly how it differs from Edmonds-Karp (see §4). |

### 2.2 Algorithm page layout

From the browser at 1440×900 on 0-1 Knapsack DP:

- **The visualization starts below the fold.** The first screen is the "Problem & how it works" panel with formulas. The animation is the hook, but it only appears after scrolling.
- **Playback controls and the owl scroll away.** After scrolling down to see the scene, the Play / Step bar and the owl bubble (at the top of the stage) are off-screen. The learner keeps scrolling up and down.
- **Four explanation sources per step,** as described in §1. In Animation Mode the "What happened and why?" box under the scene repeats the owl in technical words.
- **The problem statement is generic.** "You have a knapsack that holds at most W kg and n items…" never says "here: 4 items, capacity 5". A beginner needs the concrete instance before the algorithm.
- **Complexity, inputs and the final answer are fine at the bottom,** but there is no "Check your understanding" at the end.

**Suggested layout for beginners** (it could be a third "Guided" layout, or simply what Animation Mode does):

1. A compact header with the problem in one sentence, *plus this exact input* drawn as objects.
2. The stage, with the owl attached to it, and the playback bar **sticky** right above it.
3. A **roadmap strip** under the bar showing the "How it works" steps as chips, with the current one lit (for example `① Build table → ② Base row → [③ Fill cells] → ④ Read answer → ⑤ Trace back`).
4. One explanation panel. In Animation Mode the owl *is* the explanation, and "What happened and why?" collapses into a "Show the technical version" disclosure. In Technical View it stays as it is.
5. Pseudocode and the rule card in a side column, or collapsed by default in Animation Mode.

### 2.3 Explanation text (step descriptions)

Patterns that recur across many algorithms:

| Pattern | Examples | Fix |
|---|---|---|
| **Code-speak instead of meaning** | Naive: "Assume matchFound = true and verify characters sequentially". Max Subarray: "Spawning child call tree branch", "with physical gap". Edmonds-Karp: "BFS Frontier: Dequeue S. Queue: [empty]". | Describe the idea; keep variable names in brackets if needed. |
| **Missing the numbers** | Knapsack DP: "Taking it gives more value." LCS: "keep the better result of dropping one of them" with no values. TSP: "DP({A,B,C},B)=50 :: can only reach B from C" without 15 + 35. | Always show the substitution in the text, not only in the rule card. |
| **Missing the *why*** | Graham: "Cross product = −9600. Turn is CW" does not say why a right turn means P5 is inside. Quicksort: "38 ≤ 82" does not say what happens next (the left region grows). | Add one "because…" clause per step type. |
| **0-based vs 1-based mixing** | Hiring: technical text says "Candidate 0", the owl says "candidate 1". Max Subarray: technical uses `arr[3..6]`, the owl says "tile 4". Floyd-Warshall: "Iteration k = 0 (Intermediate Node V1)". | Pick 1-based for every learner-facing label, and keep 0-based only inside pseudocode. |
| **Repetitive filler steps** | Floyd-Warshall: most of 30 steps are "Unreachable Leg … Distance remains ∞". Jarvis: 61 steps, including comparing a candidate with itself (`P7 → P0 → P0 COLLINEAR`). Knapsack DP / LCS: dozens of identical sentences. | Group trivial steps ("V1 can't help any of these 6 pairs: no road into V1") or offer "Skip routine steps". |
| **Wall-of-text finals** | Karger's final step (≈700 characters of probabilities). TSP-Approx repeats the full triangle-inequality sentence on every shortcut step. | Short final sentence, then a "Why can we trust this?" disclosure. |
| **Formatting glitches** | Bellman-Ford: "dist[T] + -4". Assembly Line: "Switching is faster (17 vs 16)" (which number is which?). N-Queens on a 4×4 board: "Proceeding to row 5". | Write "6 + (−4)", "stay 17 vs switch 16", and "All rows filled". |

---

## 3. The owl: what works and how to make it better

**What already works:** the narration is concrete, uses the scene's objects, plays in cause-then-effect phases (look, then result), and usually carries the real numbers (for example Town Map: "Through V2: 5 + 3 = 8 coins. Cheaper!"). The teacher's reaction confirms this is the strongest teaching asset.

**Gaps, and proposals in rough priority order:**

1. **Make the owl reachable by default.** Either open beginners in Animation Mode (remember the choice), or show a small owl in Technical View too. In Technical View it would explain the table or graph in plain words, essentially the owl version of "What happened and why?".
2. **Give Fractional Knapsack an owl.** It is the gold-standard scene, but `FractionalKnapsackAnimatedView.tsx` does not use `StoryStage`, so it has no narrator. It also keeps its own toggle instead of the shared one.
3. **Pin the owl to the action.** The bubble sits above the stage and scrolls away. Make it sticky with the stage, or place it beside the active object, as `MaxSubarrayTreeView` already does with its repeated narration next to the tree. That pattern should become the norm.
4. **The owl announces the roadmap.** At each phase change it says where we are: "We've filled the whole wall (step ③ done). Now step ④: read the answer." It links to the chip in the roadmap strip (§2.2).
5. **Bridge metaphor to term, once.** The first time a metaphor appears, the owl says what it stands for: "Each cubby is one cell `dp[i][w]` of the table", "A scout droplet = an augmenting path", "The crystal ball = the upper bound". Without this, students can follow the story but cannot answer an exam question.
6. **Predict, then reveal (optional quiz mode).** At decision points the owl pauses and asks: "Will cheese 2 fit in a size-2 backpack?", "Left turn or right turn at P3?", "Which tower lights the most houses?". The learner clicks an answer before the step continues. This is the single most effective change for self-study.
7. **Milestone recaps.** After each phase, and at the end, the owl gives a two- or three-line summary: "What we did: …, why it's correct: …, cost: …". It ends with "Try it yourself" and the hardest preset.
8. **Pace playback by reading time.** Default speed is 0.25 steps/s (4 s per step) for every step, but owl lines range from about 40 to about 250 characters. Auto-play should wait in proportion to the narration length, or pause on long lines.
9. **A narration history.** A small "📜 What the owl said" log, so a learner who missed a line can scroll back without stepping backwards.
10. **Never fall back to the technical title.** Every scene has `default: return step.title`, so unhandled step kinds suddenly switch to technical language. Audit these cases so that each step kind has an owl line.
11. **The owl uses the glossary.** Link terms such as *bottleneck*, *prefix*, *bound* and *pivot* in the owl's sentences, the same way `RichText` links them in the technical panels.
12. **Optional:** read aloud (Web Speech API) and an owl "Why?" button that expands the one-sentence reason behind the current step.

---

## 4. Per-algorithm findings

Each entry lists what to fix (✗) and what to add (＋). "Owl" refers to the Animation Mode narration.

### Module 1: Greedy and Divide & Conquer

**Fractional Knapsack** (9 steps)
- ✗ No owl, as covered in §3.2.
- ＋ Explain *why* greedy by ratio is optimal with a one-line exchange argument ("swapping any kg of a lower-ratio item for a higher one never loses value").
- ＋ Contrast it with 0-1 Knapsack on the same input: "if we couldn't cut, greedy would give X, but the best is Y". This sets up Module 2.

**Huffman Coding** (10 steps)
- ✗ Step 1 says "Computed character frequencies" but never lists them. Show "A:5, B:2, R:2, C:1, D:1".
- ✗ Merge steps don't say *why* we merge the two smallest: the rarest letters should sit deepest.
- ＋ After the tree is built, an owl step should read out one code from root to leaf ("A = 0, C = 100…") before the summary.
- ＋ The decode phase is good. Make the "Decode" button more prominent as "Part 2".

**Maximum Subarray (D&C)** (88 steps)
- ✗ Very long. A beginner gets lost in recursion. Add depth / "which call am I in" breadcrumbs in the owl ("Inside the left half of the left half: [−2, 1]").
- ✗ "with physical gap" and "Spawning child call tree branch" leak implementation language.
- ✗ Indexing: technical `arr[3..6]` vs the owl's "tile 4".
- ＋ Start with *why not brute force* (try every start/end pair: n(n+1)/2 = 45 stretches for these 9 numbers) so D&C has a motivation.
- ＋ Offer "Skip to the combine steps", or collapse fully solved subtrees.

**Karatsuba** (58 steps)
- ✗ "Base Case: 3 × 11: A single-digit number" is confusing because 11 is not single-digit. Say "one of them is a single digit".
- ＋ Open with the school method count (4 products) next to Karatsuba (3) on the *same* numbers, before recursing.
- ＋ The cross-term trick (P3 − P1 − P2) deserves a visual expansion: "(a+b)(c+d) = ac + ad + bc + bd".
- ＋ Owl breadcrumbs for the recursion level, as for Max Subarray.

### Module 2: Dynamic Programming

**0-1 Knapsack (DP)** (27 steps)
- ✗ Step text lacks the numbers ("Taking it gives more value"). The values appear only in the rule card.
- ✗ It never says *why* greedy fails here. Show the counter-example up front.
- ＋ Before the table, explain the "small question" idea (the owl already does this well in its intro), then map cubby to `dp[i][w]` explicitly.
- ＋ In the traceback, say *why* "differs from the cell above" means the item was taken.

**LCS** (46 steps)
- ✗ Mismatch and match descriptions are generic and identical across cells, with no values.
- ✗ Subsequence vs. substring is a common beginner confusion. Show one example of each in the problem panel.
- ＋ Show the arrows (↖ ↑ ←) as they are decided during the fill, not only during traceback.

**Matrix Chain Multiplication** (25 steps)
- ✗ The reason for filling "by chain length / diagonal by diagonal" is never explained. It is *because longer chains need the shorter ones first*.
- ✗ "(New Minimum Cost!)" appears even on the only option for L = 2.
- ＋ Open with the 3-matrix preset (10×100×5×50) comparing both orders: 7,500 vs 75,000. This is the "aha" moment, so it should be the first preset.
- ＋ Explain why the cost of an a×b by b×c product is a·b·c, with a tiny drawing.

**Assembly Line Scheduling** (18 steps)
- ✗ "Switching is faster (17 vs 16)" is ambiguous. Label it "stay 17 vs switch 16".
- ✗ The 8 input fields (a1, a2, t1, t2, e1, e2, x1, x2) are hard for a beginner. Add a labelled diagram next to the inputs.
- ＋ Mention why brute force is 2ⁿ routes, to motivate the DP.

**TSP (Held-Karp)** (17 steps)
- ✗ Bitmask and subset notation `DP({A,B,C},B)` arrives with no warm-up. The postman's notebook metaphor is good, so lead with it in the technical text too.
- ✗ Step text lacks arithmetic ("can only reach B from C" should show 15 + 35 = 50).
- ＋ Show the brute-force tour count, (n−1)!/2 = 3 for 4 cities, and why it explodes, before the DP.

**N-Queens** (33 steps)
- ✗ "Proceeding to row 5" on a 4×4 board.
- ＋ The owl is very good here. Add an explicit link to the state-space tree ("each placement is one node; a backtrack climbs back up").
- ＋ Find-all mode can be long. Suggest a "jump to next solution" button in the owl area.

**Subset Sum** (14 steps)
- ✓ Among the clearest pages: good prune reasons and a good beginner preset.
- ✗ The note "Will be sorted internally" matters for the prune rule but is hidden in helper text. Say so in step 1.
- ＋ Mention the brute-force count of 2ⁿ subsets so pruning is visibly valuable (e.g. "checked X of the 16 possible subsets").

**Graph Coloring** (26 steps)
- ✗ The step 0 text uses all-caps code-speak ("Search mode: FIND FIRST SOLUTION").
- ✗ Vertex order and colour order are fixed, but this is never stated. Beginners ask "why V1 first?".
- ＋ When backtracking happens, the owl should say *which* earlier choice caused the dead end.

**0-1 Knapsack (Branch & Bound)** (9 steps)
- ✗ Too few steps to teach the bound. "Root node bound calculated as 7" never shows *how*: a fractional fill of the remaining capacity. This is the core idea of B&B.
- ✗ "Explore Node at Level 0 (W 0, V 0)" is jargon. Say "Start: nothing decided yet".
- ＋ Add a step that computes one bound visibly (link to Fractional Knapsack as a prerequisite).
- ＋ State how B&B differs from backtracking: it chooses the *most promising* node next, not the deepest.

**Job Selection (Branch & Bound)** (28 steps)
- ✗ The scheduling rule (place each job in the latest free slot before its deadline) is never explained, but the schedule shows "Slot 2: J1" with Slot 1 empty, which looks like a mistake to a beginner.
- ✗ How the upper bound is computed is not shown in the steps.
- ＋ Make the queue of live nodes visible in the owl text, for example "Waiting caves: {J1,J3} promises 146, {¬J3} promises 144".

### Module 3: String Matching

**Naive** (53 steps)
- ✗ "Assume matchFound = true", "break out of loop" is code-speak.
- ＋ At the end, count the comparisons that were *repeated* (letters re-read). That sets up KMP's motivation directly.

**KMP** (53 steps)
- ✓ The LPS phase text is careful and thorough.
- ✗ "Longest proper prefix which is also a suffix" is still abstract. Show one picture of the pattern with its prefix and suffix highlighted for a concrete i.
- ✗ It never says *why* jumping by LPS is safe: no match can start in between. One sentence is enough.
- ＋ Compare with Naive on the same input (32 vs 29 comparisons here, which is surprising, so explain that KMP wins on repetitive text like the "AAA…A" preset).

**Rabin-Karp** (36 steps)
- ✗ "Base radix d = 256, prime modulus q = 101, h = d^(m−1) mod q = 79" and "Horner's polynomial rule" are opaque to beginners.
- ＋ Teach hashing first with a toy hash (for example "sum of letter numbers"), then the real one. Show one rolling update as arithmetic: "remove A's contribution, shift, add D".
- ＋ The spurious hit is the best teaching moment. The owl should pause there ("same fingerprint, different word!").

**Suffix Tree (Ukkonen)** (24 steps)
- ✗ The hardest page for beginners: "active point", "Rule 1/2/3", "show-stopper" and "remaining = 3 suffixes still to insert" are all unexplained. Ukkonen's tricks are graduate-level detail.
- ＋ Offer a **"simple build" mode** first: insert suffixes one by one into a tree, which is easy to see. Keep Ukkonen as "advanced: the same tree, built faster".
- ＋ The owl's "the tree remembers to come back later" is a good start. Make the pending-suffix counter visible as physical objects (for example seeds waiting).

### Module 4: Graphs and Network Flow

**Floyd-Warshall** (30 steps)
- ✗ "k = 0 (Intermediate Node V1)" mixes indexing.
- ✗ Most steps are "Unreachable Leg … remains ∞". Group them.
- ＋ Explain why the order of k matters: after round k, D only uses hubs V1…Vk. The owl's "hub town" story says this nicely, so put it in the technical text too.
- ＋ Show the path (not just the distance) for one pair at the end.

**Bellman-Ford** (48 steps)
- ✗ "dist[T] + -4" should read "6 + (−4)".
- ✗ The reason for exactly V − 1 passes is stated, but not shown.
- ＋ Contrast it with Dijkstra in one line (why negative edges break greedy). Students will ask.
- ＋ Make the negative-cycle preset the second preset and have the owl narrate the price "falling forever".

**Ford-Fulkerson** (8 steps)
- ✗ The title "Ford-Fulkerson (Edmonds-Karp Max Flow)" plus BFS in the core steps makes it identical to the Edmonds-Karp page. Beginners will not see the difference.
- ✗ Only 8 steps: path found, then augmented. *How* the path was found and the backward ("undo") edges are never explained in text, even though the scene draws an "undo" tag.
- ＋ Present it as "the general method: any path with spare room (here found by DFS)", and add a step explaining a backward edge the first time one is used. This is the #1 confusion in max flow.
- ＋ End with the min-cut ("these full pipes are the bottleneck of the whole network") as the proof that the flow is maximum.

**Edmonds-Karp** (25 steps)
- ✗ "Dequeue S. Queue: [empty]" is confusing because it shows the queue before neighbours are added, and never says which neighbours were discovered.
- ＋ Show "Found A and B, added to queue → [A, B]". State the difference from Ford-Fulkerson up front: always the *shortest* path, and why that guarantees it finishes.

**Push-Relabel** (32 steps)
- ✗ Notation-heavy: "Δ = min(e(A)=16, c_f(A,B)=10)", "h(u) = h(v)+1", "preflow".
- ✗ Heights climbing above the source (h(B)=7 > h(S)=6) to send water *back* is never explained, and it looks like a bug to beginners.
- ＋ The owl's "tanks on stilts" is the right picture. Use it in the technical text and add the "excess goes back to the source" explanation when it happens.

### Module 5: Geometry (excluding Line Segment Intersection)

**Graham's Scan** (19 steps)
- ✗ **Label clash:** the core steps call the anchor "P0", but on the default input the anchor is labelled **P7** and a different point is P0. This is very confusing.
- ✗ Cross-product numbers (9000, −9600) without meaning. Say "positive = left turn".
- ＋ Show one "left turn vs right turn" picture before the scan. Explain why a right turn means the middle point is inside.

**Jarvis' March** (61 steps)
- ✗ **Owl contradicts the algorithm:** `PegboardScene.tsx:122` says "Start at the leftmost peg", but the algorithm starts at the *lowest* point.
- ✗ Includes a useless step comparing the candidate with itself (`P7 → P0 → P0 COLLINEAR`).
- ✗ "Most counter-clockwise" is hard to picture. The owl's "further out" is better.
- ＋ Show the complexity contrast with Graham (O(nh) vs O(n log n)) on the "Triangle with interior point" preset.

### Module 6: Randomized

**Randomized Quicksort** (61 steps)
- ✗ Compare steps don't say what happens next ("38 ≤ 82", so it joins the left side and the fence moves).
- ✗ "Lomuto partition" and "Move Pivot to End" are unexplained.
- ＋ Because the run is random, the step count changes on every visit. Add a "re-roll pivot" button and show how a bad pivot (smallest value) creates a lopsided split. That is the whole point of randomizing.

**Hiring Problem** (18 steps)
- ✗ 0-based "Candidate 0" in the technical text, but "candidate 1" from the owl.
- ✗ The "1/i" probability is stated but never made intuitive.
- ＋ Add a "shuffle the line" button that runs several random orders and counts hires, so the student *sees* about ln n.

**Karger's Min-Cut** (10 steps)
- ✗ The final step is a 700-character paragraph of probabilities.
- ＋ Show a second run that gets *unlucky* (merges across the bridge), so beginners understand why repeating is needed. Then show the "best of 20 runs" result as a simple tally.

### Module 7: Approximation

**Vertex Cover (2-Approx)** (11 steps)
- ✗ The default preset ends with 6 of 7 vertices chosen. Without context a beginner thinks the algorithm is bad or broken.
- ＋ Show the true optimum for the small graph (brute force is cheap at 7 vertices) beside the result: "optimal 3, ours 6, exactly the 2× worst case". The final text already mentions OPT ≥ 3.
- ＋ Explain "why both endpoints?": we don't know which one the optimum uses.

**Set Cover (Greedy)** (8 steps)
- ✗ The select step announces the winner but not the competition. Show "S1 would add 4, S2 adds 5, S3 adds 3…".
- ＋ Add a preset where greedy is *not* optimal, and say so.

**TSP 2-Approximation** (13 steps)
- ✗ The same long triangle-inequality sentence repeats on every shortcut step.
- ✗ Assumes the learner knows what a minimum spanning tree and Prim's algorithm are.
- ＋ Add a one-step "What's an MST?" mini explainer. Compare the result with Held-Karp's exact answer on the same 4 cities (link to the Comparison page).
- ＋ The non-metric preset is great. Make the owl point out the exact shortcut that breaks the guarantee.

---

## 5. Suggested order of work

**Quick wins (text and config only, low risk):**
1. Fix the factual and label clashes: Jarvis "leftmost" vs lowest, Graham anchor "P0" vs P7, N-Queens "row 5", Hiring and Max Subarray 0- vs 1-based, Floyd "k = 0 (V1)", Bellman "+ -4", Assembly "17 vs 16" labels, Karatsuba "single-digit".
2. Rename Ford-Fulkerson and normalise the module names.
3. Rewrite the Home and Module card text in plain language.
4. Add the actual numbers to Knapsack DP, LCS and TSP step text.

**Medium (shared components):**
5. Roadmap strip linked to `coreSteps` (each step needs a `phase` / core-step index).
6. Sticky playback bar and owl, plus "technical version" disclosure in Animation Mode.
7. Owl for Fractional Knapsack; owl metaphor-to-term bridge lines; no `step.title` fallbacks.
8. Problem panel shows *this input* concretely.
9. Group repetitive steps (Floyd, Jarvis, DP fills) behind "skip routine steps".

**Bigger (new teaching features):**
10. Predict-then-reveal owl questions at decision points.
11. Phase recaps and an end-of-page "check your understanding".
12. Simple-build mode for Suffix Tree, a toy hash intro for Rabin-Karp, and a bound walkthrough for Knapsack B&B.
13. "Before this, read" prerequisite links and paradigm primers.
14. Re-roll and shuffle experiments for the randomized algorithms.

All of these keep to `docs/animation-preferences.md`: they add narration, layout and text, and both views keep consuming the same `step.state`.
