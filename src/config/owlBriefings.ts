/**
 * The 🦉 owl's briefing shown at the top of every algorithm page, in "Problem & how it works".
 * It explains the problem and the whole procedure in plain words BEFORE the animation runs,
 * using the same metaphor as the algorithm's Animation Mode scene (see storyRegistry.ts).
 *
 * Markup (RichText): `chip`, **bold**, ✓ / ✗. Rules:
 * - never use the default input's numbers or answer (no spoilers before playback);
 * - name every technical term in plain words the first time it appears;
 * - `overview` covers the entire procedure, start to finish, in 3–6 stages.
 *
 * Line Segment Intersection (sweep line) is deliberately left out for now: its page keeps
 * the classic pane.
 */
export interface OwlBriefingStage {
  /** A few words, e.g. "Line them up". */
  title: string;
  /** One to three plain sentences. */
  text: string;
}

export interface OwlBriefing {
  /** The problem told by the owl, with the scene's metaphor (2–4 sentences). */
  story: string;
  /** One sentence: the answer we want at the end. */
  goal: string;
  /** A tiny concrete example (never the default input). */
  example?: string;
  /** The whole procedure, in order. */
  overview: OwlBriefingStage[];
  /** Why the method works, or what makes it clever. */
  insight: string;
  /** What to look for in the animation and the technical view. */
  watch: string[];
}

export const OWL_BRIEFINGS: Record<string, OwlBriefing> = {
  // ── Module 1: Greedy ─────────────────────────────────────────────────────
  'fractional-knapsack': {
    story:
      'Hoo! You have a leather backpack that can carry only so many kilograms, and a table full of cheese wheels. Every wheel has a weight and a price. The good news: cheese can be **cut**, so you may take just a slice of a wheel.',
    goal: 'Fill the backpack so the cheese inside is worth as much money as possible.',
    example:
      'A 10 kg backpack. Cheese A weighs 4 kg and is worth $20 (that is $5 per kg). Cheese B weighs 8 kg and is worth $24 ($3 per kg). Take all of A (4 kg), then cut 6 kg off B: $20 + $18 = $38.',
    overview: [
      { title: 'Price per kilo', text: 'For every wheel, work out `value ÷ weight`: how many dollars one kilogram of it is worth. This tells us which cheese is the best deal.' },
      { title: 'Line them up', text: 'Sort the wheels from the best deal (most dollars per kg) to the worst. This order is the **greedy** choice: always grab the best deal left.' },
      { title: 'Pack whole wheels', text: 'Go down the line. If a wheel fits in the space left, put the **whole wheel** in the backpack.' },
      { title: 'Slice the last one', text: 'When a wheel is too big for the space left, cut off **exactly** the slice that fills the backpack. The rest of that wheel stays on the board.' },
      { title: 'Done', text: 'The backpack is now full. Add up the value of everything inside: that is the best possible answer.' },
    ],
    insight:
      'If the backpack held any kilogram of a worse-deal cheese while a better-deal cheese was left on the board, swapping them would earn more money. So packing the best deal first can never be beaten, because we are allowed to cut.',
    watch: [
      'The wheels sliding into their sorted order (best dollars per kg first).',
      'The knife cutting the last wheel: only the slice flies into the backpack, and the leftover stays on the board.',
      'In the technical view: the capacity bar filling up and the running total value.',
    ],
  },

  huffman: {
    story:
      'Hoo! Computers store text as 0s and 1s (bits). Normally every letter uses the same number of bits, which wastes space when some letters are much more common than others. We will give every letter its own code, short for common letters and long for rare ones.',
    goal: 'Find a code for every letter so the whole text needs as few bits as possible, and can still be read back without confusion.',
    example:
      'In "AAAB", A appears 3 times and B once. Giving A the code 0 and B the code 1 stores it in 4 bits instead of 32 (8 bits per letter).',
    overview: [
      { title: 'Count the letters', text: 'Count how often each letter appears. Each letter becomes a jar holding one marble per appearance: common letters make heavy jars.' },
      { title: 'Line up the jars', text: 'Line the jars up from lightest to heaviest. (In code, this line is a **priority queue**: the smallest is always at the front.)' },
      { title: 'Tie the two lightest', text: 'Take the **two lightest** jars and hang them under a wooden bar. The new little mobile weighs their total, and goes back into the line at its place.' },
      { title: 'Repeat to one mobile', text: 'Keep tying the two lightest together until everything hangs from one big mobile (a tree).' },
      { title: 'Read the codes', text: 'Walk from the top of the mobile down to each jar: going **left = 0**, going **right = 1**. The path is that letter\'s code.' },
    ],
    insight:
      'Rare letters are tied first, so they end up hanging deepest, with long codes. Common letters are tied last, so they stay near the top, with short codes. And because every letter sits at the end of a branch, no code is the start of another (a **prefix code**), so the bits can be read back unambiguously.',
    watch: [
      'Each step lifts the two lightest jars and ties them together.',
      'At the end, follow one jar\'s path from the top: left 0, right 1.',
      'Press "Decode" afterwards to watch a marble roll down the mobile and read the bits back into letters.',
    ],
  },

  // ── Module 1: Divide & Conquer ───────────────────────────────────────────
  'max-subarray': {
    story:
      'Hoo! Picture a road made of tiles. Some tiles hold coins (positive numbers) and some hide thieves (negative numbers). You may walk along one unbroken stretch of tiles, collecting coins and losing money to thieves.',
    goal: 'Find the unbroken stretch of tiles that leaves you richest, its total and where it starts and ends.',
    example: 'On the road 3, −5, 4, 3, the best stretch is 4, 3 (total 7). Including the first 3 would also mean meeting the −5 thief.',
    overview: [
      { title: 'One tile', text: 'A road of just one tile is easy: the best stretch is that tile.' },
      { title: 'Cut in half', text: 'Otherwise, cut the road in the middle. The best stretch is in exactly one of three places: entirely in the **left half**, entirely in the **right half**, or **crossing the cut**.' },
      { title: 'Solve each half', text: 'Solve the left half and the right half the same way, by cutting them again and again (this is **divide and conquer**, done **recursively**).' },
      { title: 'The crossing stretch', text: 'For the third option, two lanterns start at the cut. One walks left, one walks right, each remembering the richest point it reached. Joining their best parts gives the best stretch that crosses the cut.' },
      { title: 'Pick the winner', text: 'Compare the three totals and keep the largest. Pass that answer up to the bigger road it came from, until the whole road has its answer.' },
    ],
    insight:
      'Every possible stretch is either entirely left of the cut, entirely right of it, or crosses it. Checking all three cases at every cut means no stretch is ever missed.',
    watch: [
      'The tree of halves growing downward as the road is cut, and answers flowing back up.',
      'The two lanterns walking outward from the cut, planting flags at the richest points.',
      'The "podium" step where left, right and crossing totals are compared.',
    ],
  },

  karatsuba: {
    story:
      'Hoo! Multiplying two long numbers the school way means multiplying every digit by every digit: lots of work. Karatsuba cuts each number in half and finds a trick that needs only **three** smaller multiplications instead of four.',
    goal: 'Multiply two large whole numbers using fewer multiplications than the school method.',
    example:
      '12 × 34: split into 1|2 and 3|4. High parts: 1 × 3 = 3. Low parts: 2 × 4 = 8. Sums: (1+2) × (3+4) = 21, and 21 − 3 − 8 = 10 is the middle part. Put back by place value: 300 + 100 + 8 = 408.',
    overview: [
      { title: 'Small numbers', text: 'If either number has only one digit, just multiply them directly. Nothing to split.' },
      { title: 'Split', text: 'Cut each number into a high part and a low part: `X = a·10^m + b` and `Y = c·10^m + d`.' },
      { title: 'Three helpers', text: 'Three helpers each do one smaller multiplication, using this same recipe (**recursively**): `a·c` (high parts), `b·d` (low parts), and `(a + b)(c + d)` (the sums).' },
      { title: 'The middle part', text: 'The third answer contains both middle products, so subtract the other two: `ad + bc = P3 − P1 − P2`. No fourth multiplication needed.' },
      { title: 'Put it back together', text: 'Shift each piece by its place value (add zeros) and add: `P1·10^(2m) + middle·10^m + P2`. Pass the answer back up.' },
    ],
    insight:
      'One clever product, (a + b)(c + d), holds both middle terms at once. Saving one multiplication out of four at every level of splitting adds up to a big saving for long numbers.',
    watch: [
      'The tree of helpers: each job splits into exactly three smaller jobs.',
      'The subtraction step that recovers the middle part.',
      'The final combine, where pieces are shifted by place value and added.',
    ],
  },

  // ── Module 2: Dynamic Programming ────────────────────────────────────────
  'knapsack-dp': {
    story:
      'Hoo! The backpack again, but this time the cheese wheels **cannot be cut**: you take a whole wheel or leave it. Grabbing the best deal first no longer always works, and trying every combination of wheels takes far too long when there are many.',
    goal: 'Choose the set of whole wheels that fits in the backpack and is worth the most, and find out which wheels they are.',
    example:
      'A 5 kg backpack, wheels of 3 kg ($5), 2 kg ($3) and 4 kg ($6). The 4 kg wheel is worth the most on its own, but 3 kg + 2 kg together ($8) beat it.',
    overview: [
      { title: 'Small questions first', text: 'Instead of trying every combination, answer small questions: "using only the first few wheels, and a backpack of a certain size, what is the most I can carry?" Each answer goes into one cubby of a wall (a **table**).' },
      { title: 'Empty edges', text: 'The top row (no wheels yet) and the left column (a backpack of size 0) are all 0: nothing to carry.' },
      { title: 'Fill cubby by cubby', text: 'Row by row, for each new wheel and each backpack size: if the wheel is **too heavy**, copy the cubby above (same answer without it). If it **fits**, weigh two choices: skip it (the cubby above) or take it (its value + the best answer for the space left over). Keep the better one.' },
      { title: 'Read the answer', text: 'The bottom-right cubby (all wheels, the full backpack) holds the best value.' },
      { title: 'Which wheels?', text: 'Walk back up from that cubby. If a cubby is worth more than the one above it, that wheel was taken: jump left by its weight. Otherwise it was skipped: go straight up.' },
    ],
    insight:
      'The best answer for a bigger question is always built from answers to smaller questions that are already in the wall. Each small question is answered only once, which is what makes this **dynamic programming** fast.',
    watch: [
      'The balance scale comparing "skip it" with "take it" for each cubby.',
      'In the technical view: the two cells each value is computed from, and the "Rule for this cell" card with the real numbers.',
      'The flashlight walking back up the wall at the end to find the chosen wheels.',
    ],
  },

  lcs: {
    story:
      'Hoo! Here are two bead necklaces, each a string of letters. We want the longest chain of beads that appears in **both** necklaces in the same order. Beads may be skipped in between, but the order must stay the same.',
    goal: 'Find how long the longest common chain is, and which beads it uses.',
    example: '"ACE" appears in both "ABCDE" and "AXCYE": skip B and D in the first, X and Y in the second. A chain does not have to be in one piece.',
    overview: [
      { title: 'Small questions first', text: 'Answer smaller questions: "what if each necklace were shorter, only its first few beads?" Write each answer in a **table**: rows for the first necklace, columns for the second.' },
      { title: 'Empty edges', text: 'Row 0 and column 0 mean an empty necklace, which shares nothing: all 0.' },
      { title: 'Compare the last beads', text: 'For each cell, look at the last bead of each shortened necklace. If they **match**, the answer is the diagonal cell + 1 (that pair joins the chain). If not, one of the two beads cannot be used: take the better of the cell above and the cell to the left.' },
      { title: 'Read the length', text: 'The bottom-right cell (both full necklaces) is the length of the longest common chain.' },
      { title: 'Find the beads', text: 'Walk back from that cell: on a match, collect the bead and step diagonally ↖; otherwise step towards the larger neighbour (↑ or ←). The collected beads, read in order, are the answer.' },
    ],
    insight:
      'The last beads either match, and then they can safely be used together, or they don\'t, and then at least one of them is not in the answer. Those two cases cover everything, so each cell needs only its three neighbours.',
    watch: [
      'Green cells (a match: diagonal + 1) versus the others (copy the larger neighbour).',
      'The arrows ↖ ↑ ← showing where each value came from.',
      'The beads being tied together with golden thread during the walk back.',
    ],
  },

  'matrix-chain-multiplication': {
    story:
      'Hoo! Several matrices (grids of numbers) must be multiplied in a row. Think of them as wooden panels glued together two at a time: gluing an a×b panel to a b×c panel costs a·b·c coins. The final result is the same whichever pair you glue first, but the total cost can be wildly different.',
    goal: 'Find the cheapest order to glue all the panels into one, and how many coins it costs.',
    example:
      'Panels 2×10, 10×3 and 3×5. Gluing the first two first: 2·10·3 = 60, then 2·3·5 = 30, total 90. Gluing the last two first: 10·3·5 = 150, then 2·10·5 = 100, total 250.',
    overview: [
      { title: 'One glue', text: 'Gluing two neighbouring panels costs rows × shared side × columns. A single panel on its own costs nothing.' },
      { title: 'A table of stretches', text: 'Make a **table** where cell `m[i, j]` will hold the cheapest cost to glue panels i to j into one.' },
      { title: 'Short stretches first', text: 'Fill the table for stretches of 2 panels, then 3, then 4, and so on, because a long stretch is built from shorter ones.' },
      { title: 'Try every divider', text: 'For a stretch, the very last glue joins a left group and a right group. Try every place for that divider: cost = left group + right group + the final glue. Keep the cheapest and remember where the divider was.' },
      { title: 'Read the brackets', text: 'The cell for all panels holds the cheapest total. Following the remembered dividers from the outside in gives the brackets.' },
    ],
    insight:
      'Whatever the best order is, its last glue joins two groups, and each group must itself be glued as cheaply as possible. So checking every divider, using the already-known best costs, finds the best order.',
    watch: [
      'The red divider sliding between panels while each split is tried.',
      '"Cheapest so far" when a split beats the earlier ones.',
      'At the end, the panels being wrapped into nested boxes: the brackets.',
    ],
  },

  'assembly-line-scheduling': {
    story:
      'Hoo! A car factory has two conveyor belts. Each belt has the same stations in the same order, but each station takes a different time on each belt. A forklift can move the car to the other belt between stations, but that also takes time.',
    goal: 'Find the fastest route through all the stations, from entry to exit, and which belt to use at each station.',
    example:
      'Station 1 takes 4 minutes on belt 1 and 6 on belt 2. Station 2 takes 9 on belt 1 but only 2 on belt 2, and the forklift costs 1 minute. Switching (4 + 1 + 2 = 7) beats staying on belt 1 (4 + 9 = 13).',
    overview: [
      { title: 'Why not try every route?', text: 'With two choices at every station, the number of routes doubles with each station. Instead, we keep just one number per station and belt: the fastest time to finish it.' },
      { title: 'Station 1', text: 'On each belt: the time to get onto the belt + the first station\'s time.' },
      { title: 'Stay or switch?', text: 'For every next station, on each belt, race two cars: one that **stays** on this belt, and one that **switches** over from the other belt (paying the forklift time). Keep only the faster one, and remember where it came from.' },
      { title: 'Exit', text: 'After the last station, add each belt\'s exit time and pick the faster belt.' },
      { title: 'Read the route', text: 'Follow the remembered choices backwards, station by station, to see the whole route.' },
    ],
    insight:
      'The fastest way to finish a station only depends on the fastest ways to finish the station before it. So keeping one best time per station and belt is enough: slower cars can never catch up.',
    watch: [
      'The race at every station: stay versus switch, and the winner parking.',
      'In the technical view: the two rows of best times filling up left to right.',
      'The winning route lighting up in gold at the end.',
    ],
  },

  tsp: {
    story:
      'Hoo! A postman starts at the post office, must visit every house exactly once, and come back. Every walk between two houses has a cost. With many houses, trying every possible round trip takes forever, so he keeps a notebook of small answers.',
    goal: 'Find the cheapest round trip that visits every house once and returns to the start.',
    example:
      'With the post office and 3 houses there are only 3 different round trips. With the post office and 9 houses there are already 181,440, and the number explodes from there.',
    overview: [
      { title: 'A notebook page', text: 'Each page answers: "starting at the post office, having visited exactly these houses (a stamp card), and standing at this house now, what is the cheapest walk so far?"' },
      { title: 'First page', text: 'Standing at the post office having visited only the post office costs 0.' },
      { title: 'Grow the stamp cards', text: 'Fill pages for stamp cards with 2 houses, then 3, and so on. For each page, try every house he could have arrived from: that earlier page + the walk from there. Write down the cheapest, and remember which house it was.' },
      { title: 'Walk home', text: 'Once every stamp is collected, add the walk back to the post office from each possible last house, and keep the cheapest.' },
      { title: 'Read the trip', text: 'Follow the remembered houses backwards through the notebook to recover the whole round trip.' },
    ],
    insight:
      'The cheapest way to reach a page always builds on the cheapest earlier pages (**optimal substructure**), so each page is worked out once and reused. That is much faster than trying every order, though it still grows quickly with more houses.',
    watch: [
      'The dotted candidate trails into a house, and the cheapest being written on the page.',
      'In the technical view: the table of pages filling up by stamp-card size.',
      'The winning round trip lighting up in gold at the end.',
    ],
  },

  // ── Module 2: Backtracking ───────────────────────────────────────────────
  'n-queens': {
    story:
      'Hoo! A queen in chess attacks every square in her row, her column and both diagonals. We want to place N queens on an N×N board so that **no queen attacks another**.',
    goal: 'Find a way to place all N queens safely (or, in "find all" mode, every way).',
    example: 'On a 4×4 board there are only two safe arrangements, and a queen in a corner can never be part of one.',
    overview: [
      { title: 'One row at a time', text: 'Each row must hold exactly one queen, so fill the board row by row, from the top.' },
      { title: 'Try each column', text: 'In the current row, try the columns from left to right.' },
      { title: 'Attacked or safe?', text: 'If an earlier queen attacks the square ✗, try the next column. If it is safe ✓, place the queen and move down to the next row.' },
      { title: 'Dead end? Go back', text: 'If no column in a row is safe, an earlier queen must be in the wrong place. Lift the previous queen and move it to its next column. This going back is called **backtracking**.' },
      { title: 'Solution', text: 'When every row holds a queen, the board is solved.' },
    ],
    insight:
      'As soon as a partial board breaks the rule, we stop and go back, instead of finishing a board that is already broken. That skips huge numbers of hopeless arrangements.',
    watch: [
      'The faint red marks: the squares the queens already on the board attack.',
      'Backtracking: a queen being lifted when the row below has nowhere safe.',
      'The search tree under the board growing, with dead branches snipped (✂).',
    ],
  },

  'subset-sum': {
    story:
      'Hoo! A gold block sits on one side of a balance scale. Next to it are some coins of different weights. For each coin we decide: on the pan, or into the skip tray.',
    goal: 'Find a group of coins that balances the gold block exactly (or, in "find all" mode, every such group).',
    example: 'With coins 3, 5 and 8 and a gold block of 11, the coins 3 and 8 balance it exactly.',
    overview: [
      { title: 'Sort the coins', text: 'Line the coins up from lightest to heaviest. Each coin will get one yes/no decision, which makes a tree of choices (a **binary decision tree**).' },
      { title: 'On the pan or not?', text: 'Walk down the tree one coin at a time, putting it on the pan or skipping it, and keep track of the pan\'s total.' },
      { title: 'Prune hopeless branches', text: 'Stop exploring a branch (**prune** it) if the pan is already too heavy, or if even all the remaining coins together could not reach the target.' },
      { title: 'Undo and try the other way', text: 'When a branch fails, take the last coin back off (**backtrack**) and try skipping it instead.' },
      { title: 'Balanced!', text: 'When the pan exactly matches the gold block, that group of coins is a solution.' },
    ],
    insight:
      'Pruning throws away a whole branch of the tree without looking inside it. Because the coins are sorted, a branch that is already too heavy can only get heavier.',
    watch: [
      'The scale tipping as coins land on the pan.',
      'The ✂ marks on the search tree, each with the reason it was pruned.',
      'Coins sliding back off the pan when the search backtracks.',
    ],
  },

  'graph-coloring': {
    story:
      'Hoo! Houses are joined by fences. Two houses that share a fence are neighbours, and neighbours must be painted different colours. We only have a few paint buckets (k colours).',
    goal: 'Paint every house using at most k colours so no two neighbours match (or, in "find all" mode, find every way).',
    example: 'Three houses in a triangle, each touching the other two, need 3 colours. With only 2 colours it is impossible.',
    overview: [
      { title: 'House by house', text: 'Take the houses in order (in the graph, each house is a **vertex** and each fence an **edge**).' },
      { title: 'Try each bucket', text: 'For the current house, try the colours in order.' },
      { title: 'Clash or safe?', text: 'If a neighbour already has that colour ✗, wipe it off and try the next bucket. If it is safe ✓, paint it and move to the next house.' },
      { title: 'Stuck? Go back', text: 'If no colour works for a house, an earlier choice was wrong: scrape the previous house and try its next colour (**backtracking**).' },
      { title: 'All painted', text: 'When every house is painted, the colouring is valid. If every option has been tried without success, k colours are not enough.' },
    ],
    insight:
      'Like N-Queens, we fix the most recent choice first and never finish a colouring that already has a clash. The order of houses and colours is fixed, so the search is systematic and misses nothing.',
    watch: [
      'Clashes across a fence, and the paint being wiped off.',
      'Scraping a house when the search backtracks.',
      'In "find all" mode, each finished colouring being saved to the shelf.',
    ],
  },

  // ── Module 2: Branch & Bound ─────────────────────────────────────────────
  'knapsack-bb': {
    story:
      'Hoo! The cheese backpack once more, with whole wheels only. This time we explore treasure caves: every tunnel down decides one wheel, take it or leave it, so the caves form a tree of choices. Exploring every cave would take forever, so each cave has a crystal ball.',
    goal: 'Find the most valuable set of whole wheels that fits, while exploring as few caves as possible.',
    example:
      'If the trophy chest already holds $40 and a cave\'s crystal ball says "at most $35 from here", that cave and everything below it can be roped off without a look.',
    overview: [
      { title: 'Sort by value per kg', text: 'Line the wheels up by dollars per kilogram, best first, so the crystal balls are accurate.' },
      { title: 'Take or leave', text: 'Each cave decides one wheel: one tunnel takes it, the other leaves it (a **state-space tree**).' },
      { title: 'The crystal ball', text: 'Each cave\'s crystal ball promises the most it could still reach: its value so far + what the space left could hold if wheels could be cut. This promise (an **upper bound**) is never too low.' },
      { title: 'Most promising first', text: 'Always explore the cave with the biggest promise next. Whenever a cave forms a set that fits and beats the trophy chest, it becomes the new best.' },
      { title: 'Rope off the rest', text: '**Prune** a cave if it is too heavy, or if its promise cannot beat the trophy chest. When no promising cave is left, the chest holds the best answer.' },
    ],
    insight:
      'The crystal ball never promises less than a cave can really give. So if even its promise cannot beat the best answer found so far, nothing below that cave can, and skipping it is safe.',
    watch: [
      'The crystal ball number on each cave versus the trophy chest.',
      'Rope barriers going up on caves that are too heavy or not promising enough.',
      'How few caves are actually explored compared with the whole tree.',
    ],
  },

  'job-selection-bb': {
    story:
      'Hoo! You have some jobs to schedule. Each job takes one time slot, earns a profit, and has a deadline: the last slot it may finish in. You cannot do every job in time, so you must choose.',
    goal: 'Choose the jobs that can all finish by their deadlines with the largest total profit, and when to do each one.',
    example:
      'Two slots, and three jobs: A ($50, deadline 1), B ($40, deadline 1), C ($30, deadline 2). A and B both need slot 1, so take A in slot 1 and C in slot 2: $80.',
    overview: [
      { title: 'Sort by profit', text: 'Line the jobs up from the highest profit to the lowest.' },
      { title: 'Include or leave out', text: 'Each level of the tree of caves decides one job: include it or leave it out (a **state-space tree**).' },
      { title: 'Still on time?', text: 'When a job is included, place it in the **latest** free slot before its deadline, which keeps earlier slots open for other jobs. If there is no free slot, that choice is impossible: rope it off.' },
      { title: 'The promise', text: 'Each cave promises the most it could still earn (an **upper bound**): its profit so far + the best remaining profits that could fit in the free slots. Always explore the most promising cave next.' },
      { title: 'Rope off and finish', text: '**Prune** every cave whose promise cannot beat the best schedule found. When none are left, the best schedule wins.' },
    ],
    insight:
      'Doing each job as late as its deadline allows never blocks a job that could have fit, and the promise never undercounts. So pruning by the promise is always safe.',
    watch: [
      'The time slots filling, each job placed as late as it can go.',
      'Caves roped off because a deadline would be missed, or because the promise is too low.',
      'The trophy chest updating whenever a better schedule is found.',
    ],
  },

  // ── Module 3: String Matching ────────────────────────────────────────────
  'naive-string-match': {
    story:
      'Hoo! You have a long sentence (the text) and a short word (the pattern) cut out as a stencil. We slide the stencil along the sentence and check, letter by letter, whether it fits.',
    goal: 'Find every position in the text where the pattern appears.',
    example: 'The pattern "AT" appears in "CATS AT HOME" at position 1 (in CATS) and at position 5.',
    overview: [
      { title: 'Start at the left', text: 'Place the stencil under the very first letters of the text (shift 0).' },
      { title: 'Compare letters', text: 'Compare the stencil with the text letter by letter, from left to right.' },
      { title: 'Mismatch: slide', text: 'At the first letter that differs ✗, stop checking. Slide the stencil one step to the right and start comparing again from its first letter.' },
      { title: 'All match: record', text: 'If every letter fits ✓, write down this position. Then slide on, because the pattern may appear again.' },
      { title: 'Until the end', text: 'Repeat until the stencil reaches the end of the text.' },
    ],
    insight:
      'It is the simplest possible method and always correct. Its weakness: after a mismatch it starts over, so the same text letters are read again and again. KMP and Rabin-Karp are two ways to avoid that repeated work.',
    watch: [
      'The reading finger jumping back after every mismatch (repeated work).',
      'The comparison counter growing, especially on the "AAA…A" worst-case preset.',
    ],
  },

  kmp: {
    story:
      'Hoo! The same stencil and sentence, but our stencil is smarter. Before reading the sentence, it studies itself and writes "jump-back notes". Then, when a letter does not fit, it uses what it already matched instead of starting over, and the finger reading the text never goes backwards.',
    goal: 'Find every position where the pattern appears in the text, reading each text letter only once.',
    example:
      'In the pattern "ABAB", the start "AB" also appears at its end. So if "ABAB" matched and the next letter fails, the last "AB" just read can already be the start of a new match.',
    overview: [
      { title: 'Phase 1: study the pattern', text: 'For each position of the pattern, note how long the longest piece at its **start** is that also appears at its **end** at that point. These notes form the **LPS** table.' },
      { title: 'Phase 2: scan the text', text: 'Slide along the text with two fingers: one in the text, one in the pattern.' },
      { title: 'Letters match', text: 'If the letters match ✓, both fingers move one step forward.' },
      { title: 'Letters differ', text: 'On a mismatch ✗, the text finger stays put. The pattern finger jumps back to the position the LPS note gives: that much of the pattern is already known to match. If nothing is matched, just move the text finger on.' },
      { title: 'Full match', text: 'When the whole pattern has matched, record the position and use the last note to keep searching for overlapping matches.' },
    ],
    insight:
      'The letters already matched tell us exactly where the next match could begin, so there is never a reason to re-read them. The text finger only moves forward, which is why KMP is fast even on repetitive text.',
    watch: [
      'Phase 1: the pattern comparing with itself and writing its notes.',
      'Phase 2: after a mismatch the stencil jumps ahead, but the finger in the text never moves back.',
      'In the technical view: the LPS table, and how `j` falls back while `i` stays.',
    ],
  },

  'rabin-karp': {
    story:
      'Hoo! Comparing whole words letter by letter is slow. So a detective gives the pattern, and every piece of the text of the same length, a fingerprint: a number worked out from its letters (a **hash**). Different fingerprints mean different words, so only equal fingerprints need a closer look.',
    goal: 'Find every position where the pattern appears in the text, checking letters only where the fingerprints match.',
    example:
      'A toy fingerprint: add up letter numbers (A = 1, B = 2, …). "AB" and "BA" both give 3: same fingerprint, different words. That false alarm is a **collision**, which is why the detective always checks the letters.',
    overview: [
      { title: 'Fingerprint the pattern', text: 'Work out the pattern\'s fingerprint once.' },
      { title: 'Fingerprint the first window', text: 'Work out the fingerprint of the first piece (window) of text with the same length.' },
      { title: 'Different? Skip', text: 'If the two fingerprints differ, this window cannot be the pattern: move on without reading its letters.' },
      { title: 'Same? Check', text: 'If they are equal, check the letters one by one. Usually it is a real match, but it might be a false alarm.' },
      { title: 'Slide cheaply', text: 'Slide the window one letter right. Instead of starting over, update the fingerprint: take out the letter that left, add the one that arrived (a **rolling hash**). Repeat to the end.' },
    ],
    insight:
      'Comparing two numbers is much quicker than comparing two words, and the rolling update makes each new fingerprint cheap. Letters are only read where a match is actually possible.',
    watch: [
      'The fingerprint numbers of the pattern and the current window.',
      'The detective checking letters only when the numbers are equal, including any false alarm.',
      'The letter going "out" and the letter coming "in" during each rolling update.',
    ],
  },

  'suffix-tree': {
    story:
      'Hoo! A suffix is an ending of a word: the endings of "TOOT" are TOOT, OOT, OT and T. We grow a tree where every ending is a path from the trunk to its own apple. Then any search is a single climb down the tree.',
    goal: 'Build the tree of all endings of the text, then find every position where the pattern appears.',
    example: 'To find "OT" in "TOOT", climb O then T from the trunk. The apple below is the ending "OT", which starts at position 2.',
    overview: [
      { title: 'Mark the end', text: 'Add `$` to the end of the text, so no ending is the start of another and each ending gets its own apple.' },
      { title: 'Grow letter by letter', text: 'Add the text one letter at a time. Every branch that ends in an apple grows by the new letter automatically.' },
      { title: 'New twigs, or wait', text: 'If an ending needs to go a way no branch goes yet, a new twig sprouts (splitting a branch if needed). If the letter is already there, nothing new is needed yet: the tree remembers to come back later.' },
      { title: 'Climb with the pattern', text: 'To search, an ant starts at the trunk and climbs down, following the pattern\'s letters along the branches. If no branch continues, the pattern is not in the text.' },
      { title: 'Collect the apples', text: 'If the whole pattern fits, every apple below the ant is an ending that starts with the pattern. Their numbers are the positions where it occurs.' },
    ],
    insight:
      'Any piece of the text is the start of some ending. Because the tree holds every ending, one climb finds every occurrence, however many times you search.',
    watch: [
      'New twigs and apples sprouting as each letter is added.',
      'Branches splitting into a fork when two endings go different ways.',
      'The ant climbing down, and the apples it finds at the end.',
    ],
  },

  // ── Module 4: Shortest Paths ─────────────────────────────────────────────
  'floyd-warshall': {
    story:
      'Hoo! A map of towns joined by one-way roads (a **graph**), each road with a travel cost, and some roads even pay you back (negative costs). A trip planner wants the cheapest trip, the **shortest path**, between every pair of towns.',
    goal: 'Find the cheapest travel cost from every town to every other town.',
    example: 'The road A → C costs 10, but A → B costs 3 and B → C costs 4. Passing through B makes the trip from A to C cost only 7.',
    overview: [
      { title: 'Direct roads first', text: 'Write the direct road costs in a table: 0 from a town to itself, ∞ where there is no direct road.' },
      { title: 'Open a hub', text: 'Pick one town (a **vertex** of the graph) and allow it as a stop in the middle of trips: a hub.' },
      { title: 'Check every trip', text: 'For every pair of towns, ask: is going through the hub cheaper than the best trip known so far? If yes ✓, update the table.' },
      { title: 'Next hub', text: 'Open the next town as a hub and check every trip again, until every town has been a hub.' },
      { title: 'Read the table', text: 'Now the table holds the cheapest trip between every pair. A loop with a negative total would make "cheapest" meaningless, so there must be no **negative cycle**.' },
    ],
    insight:
      'After a town has been a hub, every trip in the table may already pass through it. So after all towns have been hubs, every possible route has been considered.',
    watch: [
      'Each round opening a new hub town.',
      'The "via hub" comparison for each trip, and the table cells that drop.',
    ],
  },

  'bellman-ford': {
    story:
      'Hoo! Delivery vans leave one starting town (the source). Each road has a cost, and some roads give cash back (negative costs). Every town wears a price tag: the cheapest known cost to reach it, its **shortest path** so far.',
    goal: 'Find the cheapest cost from the source to every town, or report a money-making loop that makes "cheapest" impossible.',
    example: 'If the road A → B costs 5 and the road B → A pays back 7, driving the loop again and again earns 2 each time: there is no cheapest route.',
    overview: [
      { title: 'Price tags', text: 'The source costs 0. Every other town (each **vertex**) gets the tag ∞: no route known yet.' },
      { title: 'Drive every road', text: 'A van drives every road u → v once. If u\'s price + the road\'s cost is cheaper than v\'s tag, lower v\'s tag (this is called **relaxation** of the road) and remember the road.' },
      { title: 'Repeat rounds', text: 'Do whole rounds like this, at most (number of towns − 1) times. A cheapest route never needs to visit a town twice, so that many rounds are enough. If a round changes nothing, stop early.' },
      { title: 'Safety check', text: 'Drive every road once more. If any tag still drops, a loop with a negative total (a **negative cycle**) can be reached, and there is no cheapest route.' },
    ],
    insight:
      'Each round makes at least one more road of every cheapest route correct, so after enough rounds every tag is final, even with cash-back roads.',
    watch: [
      'Price tags dropping as vans find cheaper ways.',
      'A round where nothing changes, so the algorithm stops early.',
      'The negative-loop preset: tags that keep falling in the safety check.',
    ],
  },

  // ── Module 4: Network Flow ───────────────────────────────────────────────
  'ford-fulkerson': {
    story:
      'Hoo! Water flows from a water tower (the source) to a city (the sink) through a network of pipes, a **flow network**. Each pipe can carry only so many litres per second (its capacity).',
    goal: 'Find the most water per second that can reach the city: the **maximum flow**.',
    example: 'Two separate routes: one through pipes of size 5 and 3, one through pipes of size 4 and 6. The first carries at most 3, the second at most 4, so together 7.',
    overview: [
      { title: 'Empty pipes', text: 'Start with no water flowing anywhere.' },
      { title: 'Find a route with room', text: 'A scout droplet looks for any route from the tower to the city where every pipe still has spare room: an **augmenting path**. (This page finds it with a ripple search, **BFS**.)' },
      { title: 'The narrowest pipe', text: 'A route can only carry as much as its narrowest pipe allows: its bottleneck.' },
      { title: 'Send the water', text: 'Push that much water along the route. Also note that this water could be sent back later: the "room left" picture, including these backward pipes, is the **residual graph**.' },
      { title: 'Until no route has room', text: 'Repeat until no route to the city has spare room. The total now flowing is the maximum.' },
    ],
    insight:
      'The backward pipes mean an early, unlucky choice is never final: a later route can push water back and send it a better way. When no route has room left, the full pipes form a wall that no extra water can pass.',
    watch: [
      'The scout\'s route, and the narrowest pipe on it.',
      'Purple "undo" tags when a route sends water backwards through a pipe.',
      'The litres per second reaching the city growing with each route.',
    ],
  },

  'edmonds-karp': {
    story:
      'Hoo! The same water tower, city and pipes as Ford-Fulkerson. The difference is how the scout searches: it spreads out like ripples on a pond, checking the closest tanks first (**BFS**, breadth-first search).',
    goal: 'Find the **maximum flow** from the tower to the city, always using a route with the fewest pipes.',
    example: 'If one route has 2 pipes and another has 5, the ripples reach the city along the 2-pipe route first, so that route is used first.',
    overview: [
      { title: 'Ripple search', text: 'From the tower, look at every tank one pipe away, then two pipes away, and so on, using only pipes with spare room. A queue keeps the tanks waiting to be explored, closest first.' },
      { title: 'Shortest route found', text: 'When the ripples reach the city, follow the trail back: that route (an **augmenting path**) has the fewest pipes. Its narrowest pipe is the bottleneck.' },
      { title: 'Send the water', text: 'Push the bottleneck amount along the route, and add the same amount of backward room so it can be undone later.' },
      { title: 'Repeat', text: 'Run the ripple search again. When the ripples can no longer reach the city, the flow is the maximum.' },
    ],
    insight:
      'Always taking a route with the fewest pipes guarantees the algorithm finishes after a limited number of routes, whatever the pipe sizes. It is Ford-Fulkerson with a careful choice of route.',
    watch: [
      'The ripple rings spreading from the tower, and the queue of waiting tanks.',
      'Each shortest route lighting up, and its narrowest pipe.',
    ],
  },

  'push-relabel': {
    story:
      'Hoo! Picture every tank on stilts of a different height. Water can only roll downhill, from a tank to a neighbour exactly one step lower. Instead of finding whole routes (augmenting paths), the tower floods its neighbours and the tanks pass the extra water along, one pipe at a time.',
    goal: 'Find the **maximum flow** from the tower to the city.',
    example: 'A tank holds 5 extra litres, but every pipe out of it with room leads uphill. A jack lifts it one step above its lowest such neighbour, and the water can roll on.',
    overview: [
      { title: 'Lift the tower and flood', text: 'The tower starts very high (as high as the number of tanks). It opens every pipe out of it fully, a **preflow**, so its neighbours receive more than they can pass on.' },
      { title: 'Extra water', text: 'A tank holding more water than it passes on has excess. The work goes on while any tank, other than the tower and the city, has excess.' },
      { title: 'Push downhill', text: 'A tank with excess pours as much as fits into a neighbour exactly one step lower, along a pipe with room left in the **residual graph** (a push).' },
      { title: 'Lift when stuck', text: 'If no pipe with room leads downhill, a jack lifts the tank just above its lowest reachable neighbour (a relabel). Water that can never reach the city ends up flowing back to the tower.' },
      { title: 'Settled', text: 'When no tank holds extra water, everything that reached the city is the maximum flow.' },
    ],
    insight:
      'Each move is local, one tank and one pipe, so there is no need to search for whole routes. Heights make sure water keeps moving towards the city, or back to the tower if it cannot get there.',
    watch: [
      'Tanks with extra water (excess), and where they pour.',
      'The jack lifting a stuck tank (relabel).',
      'Late in the run, water rolling back to the tower: flow that could never reach the city.',
    ],
  },

  // ── Module 5: Geometry ───────────────────────────────────────────────────
  'graham-scan': {
    story:
      'Hoo! Pegs are stuck in a cork board. We want the tightest fence around all of them, as if we stretched a rubber band around the outside and let it snap tight: the **convex hull**.',
    goal: 'Find which pegs the rubber band touches, in order around the outside.',
    example: 'For four pegs at the corners of a square and one peg in the middle, the fence is the square: the middle peg is inside.',
    overview: [
      { title: 'Lowest peg', text: 'Start at the lowest peg (leftmost if tied). Nothing is below it, so it is surely on the fence.' },
      { title: 'Sweep a beam', text: 'A lighthouse beam sweeps around from that peg and numbers the other pegs in the order it reaches them (by angle).' },
      { title: 'Hook the band', text: 'Walk through the pegs in that order, hooking the band on each one.' },
      { title: 'Left turn or dent?', text: 'At every new peg, look at the last three: if the band turns **left**, all is well. If it turns right (or goes straight), the middle peg makes a dent, so unhook it: it is inside. Check again until the band turns left.' },
      { title: 'The fence', text: 'After the last peg, the pegs still hooked form the fence.' },
    ],
    insight:
      'A tight band going around counter-clockwise only ever turns left. Any peg where it would turn right is a dent, and a dent can never be part of the tightest fence.',
    watch: [
      'The beam numbering the pegs.',
      '"Snap!" when a dented peg is unhooked.',
      'In the technical view: the turn check, where a positive cross product means a left turn.',
    ],
  },

  'jarvis-march': {
    story:
      'Hoo! The same pegs on a cork board, and the same goal: the tightest fence around them (the **convex hull**). This time we wrap a ribbon around the outside, like wrapping a gift, one corner at a time.',
    goal: 'Find which pegs the ribbon touches, in order around the outside.',
    example: 'For a triangle of pegs with one peg inside, the ribbon visits the three corners and never touches the inside peg.',
    overview: [
      { title: 'Lowest peg', text: 'Start at the lowest peg. It is surely on the fence.' },
      { title: 'Aim the ribbon', text: 'Point the ribbon at any other peg for now.' },
      { title: 'Find the outermost', text: 'Test every other peg: if one lies further out (to the right of the ribbon), swing the ribbon to it. After checking all pegs, the ribbon points at the outermost one.' },
      { title: 'Tie and move', text: 'Tie the ribbon to that peg: it is the next corner. Move there and repeat, until the ribbon is back at the start.' },
    ],
    insight:
      'Each corner of the fence is the peg with every other peg on its left. Testing all pegs from each corner finds that next corner exactly.',
    watch: [
      'The ribbon swinging outward when a peg further out is found.',
      'Each corner being tied, and the ribbon returning to the start.',
    ],
  },

  // ── Module 6: Randomized ─────────────────────────────────────────────────
  'randomized-quicksort': {
    story:
      'Hoo! A group of kids must line up from shortest to tallest. Quicksort picks one kid as a measuring stick (the pivot), sends shorter kids to the left and taller kids to the right, then does the same for each side. Because it picks the pivot by chance, it is a **randomized** algorithm.',
    goal: 'Put all the numbers in order, from smallest to largest.',
    example: 'Heights 5, 2, 8, 1 with pivot 5: the left side gets 2 and 1, the right side gets 8. Then sort 2, 1 the same way. Result: 1, 2, 5, 8.',
    overview: [
      { title: 'Pick at random', text: 'Spin a wheel to pick the pivot **uniformly at random**, so every kid is equally likely.' },
      { title: 'Measure everyone', text: 'The pivot steps to the end. Every other kid is measured against it: shorter or equal kids go to the left of a little fence, taller ones stay right (the partition).' },
      { title: 'Pivot in place', text: 'The pivot steps into the gap at the fence. Everyone left is shorter and everyone right is taller, so this is exactly its final spot.' },
      { title: 'Repeat on each side', text: 'Sort the left group and the right group the same way (**recursively**).' },
      { title: 'Tiny groups are done', text: 'A group of one kid, or none, is already in order. When every group is that small, the whole line is sorted.' },
    ],
    insight:
      'A bad pivot (the very shortest or tallest kid) makes a lopsided split. Picking at random makes it very unlikely to get bad pivots again and again, whatever order the kids started in, so the work stays small on average.',
    watch: [
      'The prize wheel picking the pivot.',
      'The little fence moving right each time a shorter kid joins the left group.',
      'Medals (🏅) appearing as kids reach their final spots.',
    ],
  },

  'hiring-problem': {
    story:
      'Hoo! Candidates for a job arrive one at a time. Every interview costs a little (a coin in one jar). Whenever a candidate is better than everyone seen so far, you hire them on the spot, which costs a lot (coins in the other jar), and the old employee leaves.',
    goal: 'Count how many hires happen and the total cost, and see why a random order keeps hiring rare.',
    example: 'If candidates arrive from worst to best, every single one is hired. If the best arrives first, only one is.',
    overview: [
      { title: 'Interview', text: 'Interview the next candidate and pay the small interview cost.' },
      { title: 'Compare', text: 'Compare them with the person at the desk: the best so far.' },
      { title: 'Better? Hire', text: 'If they are better ✓, hire them right away and pay the big hiring cost. They become the best so far.' },
      { title: 'Otherwise, send home', text: 'If not ✗, they go home. Only the interview was paid.' },
      { title: 'Add it up', text: 'After the last candidate, count the hires and the total cost.' },
    ],
    insight:
      'In a random order, the 10th candidate is the best of the first ten only 1 time in 10, and the 100th only 1 time in 100. Hires get rarer and rarer, so only about ln n hires are expected, far fewer than n.',
    watch: [
      'The hiring jar filling fast at first, then more and more slowly.',
      'The worst-case preset (rising scores), where everyone is hired.',
    ],
  },

  'karger-min-cut': {
    story:
      'Hoo! Balls of clay are tied together with ropes. We want to split them into two groups by cutting as few ropes as possible: a **minimum cut**. Karger\'s trick sounds silly but works: squish random neighbours together. Because it relies on chance, it is a **randomized algorithm**.',
    goal: 'Find a way to split the balls into two groups with as few ropes between them as possible.',
    example: 'Two clusters joined by a single rope: the minimum cut is 1, cutting just that rope.',
    overview: [
      { title: 'Pick a random rope', text: 'Pick one rope at random, every rope equally likely.' },
      { title: 'Squish', text: 'Squish its two balls into one (**edge contraction**). Ropes between them disappear; ropes to other balls stay, even if two ropes now go to the same ball.' },
      { title: 'Until two are left', text: 'Repeat until only two balls remain. The ropes between them are a cut: the original balls inside each one form the two groups.' },
      { title: 'Try again, keep the best', text: 'One run can be unlucky, so run the whole thing many times and keep the smallest cut found.' },
    ],
    insight:
      'The smallest cut has very few ropes, so in each squish a random rope is rarely one of them. Most of the time those few ropes survive to the end, and repeating many runs makes missing them very unlikely.',
    watch: [
      'The spinning pointer picking a random rope.',
      'Ropes disappearing inside a squished ball, and doubled ropes appearing.',
      'The final count of ropes between the last two balls.',
    ],
  },

  // ── Module 7: Approximation ──────────────────────────────────────────────
  'vertex-cover-approx': {
    story:
      'Hoo! A town has streets (each an **edge**) that meet at corners (each a **vertex**). A camera on a corner watches every street touching that corner. We want every street watched with as few cameras as possible. Finding the true minimum is very hard, so we use a quick method with a promise.',
    goal: 'Choose corners for cameras so every street is watched, using at most twice as many cameras as the best possible plan.',
    example: 'A star: one central corner with four streets. The best plan is 1 camera, in the centre. Our method picks one street and puts cameras at both its ends: 2 cameras, exactly twice the best.',
    overview: [
      { title: 'Pick an unwatched street', text: 'Pick any street that no camera watches yet.' },
      { title: 'Cameras on both ends', text: 'Put a camera on **both** of its corners. We do not know which one the best plan uses, so we take both.' },
      { title: 'Cross off watched streets', text: 'Every street touching those two corners is now watched.' },
      { title: 'Repeat', text: 'Repeat until every street is watched.' },
    ],
    insight:
      'The streets we picked never share a corner, and any plan needs at least one camera for each of them. So the best plan has at least as many cameras as streets we picked, and we used exactly twice that.',
    watch: [
      'The streets that get picked: they never touch each other.',
      'The final count, compared with the "at least" number for the best plan.',
    ],
  },

  'set-cover': {
    story:
      'Hoo! Houses need radio signal, and there are several towers, each reaching certain houses. We want every house to have signal while switching on as few towers as possible. This problem is **NP-hard** (no known method finds the best answer quickly), so we use a quick **greedy** rule.',
    goal: 'Switch on a small set of towers so every house has signal.',
    example:
      'Houses 1 to 6. Tower X reaches 1, 2, 3, 4; tower Y reaches 1, 2, 5; tower Z reaches 3, 4, 6. Greedy takes X first, then still needs Y and Z: 3 towers, while Y and Z alone already cover everything.',
    overview: [
      { title: 'All dark', text: 'Start with every house dark.' },
      { title: 'Best tower now', text: 'Look at each tower and count how many **dark** houses it would light. Switch on the one that lights the most.' },
      { title: 'Light them up', text: 'Mark those houses as lit. Houses that already had signal do not count again.' },
      { title: 'Repeat', text: 'Repeat until no house is dark.' },
    ],
    insight:
      'Greedy is not always the very best (see the example), but it is proven never to be too far off: at most about ln(number of houses) + 1 times the best number of towers. That promise makes it an **approximation algorithm**.',
    watch: [
      'How many new houses each chosen tower lights: the number shrinks as fewer houses are dark.',
      'Houses that are already lit not being counted again.',
    ],
  },

  'tsp-approx': {
    story:
      'Hoo! A salesperson must visit every town once and come home: a round trip called a **Hamiltonian cycle**. Finding the very cheapest one is extremely slow, so here is a quick plan that is guaranteed to cost at most twice the best, as long as going direct is never more expensive than a detour (the **triangle inequality**).',
    goal: 'Build a round trip through every town quickly, costing at most twice the cheapest possible one.',
    example: 'If the ropes joining all towns cost 50 in total, walking around them costs 100, and the shortcut trip costs at most 100.',
    overview: [
      { title: 'Cheapest ropes', text: 'Tie the cheapest set of ropes that connects all the towns: a **minimum spanning tree** (MST). Add the cheapest rope that reaches a new town, again and again.' },
      { title: 'Walk around the ropes', text: 'Walk all the way around the rope network, like tracing a hedge with your hand. Every rope is walked twice, once in each direction (doubling the ropes makes an **Eulerian multigraph**, which can be walked in one go).' },
      { title: 'Take shortcuts', text: 'Follow that walk, but whenever the next town has already been visited, cut straight across to the next new town.' },
      { title: 'Go home', text: 'After the last new town, return to the start. That is the tour.' },
    ],
    insight:
      'Any round trip with one road removed connects all towns, so the cheapest ropes cost no more than the best trip. Walking around them costs twice the ropes, and shortcuts never add cost when direct is never worse than a detour. So the tour costs at most twice the best.',
    watch: [
      'The rope network growing, one cheapest rope at a time.',
      'The walk around the hedge, and the shortcuts skipping visited towns.',
      'The "non-metric" preset, where the promise no longer holds.',
    ],
  },
};
