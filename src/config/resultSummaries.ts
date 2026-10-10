/**
 * Learner-facing result summaries, one per algorithm. Each is wired to its
 * algorithm through `summarizeResult` in algorithmRegistry.ts.
 *
 * Rules: only describe what is actually present in the result (or the inputs
 * that produced it), and return null when the expected fields are missing so the
 * generic fallback summary is shown instead. The raw result is always kept
 * available in the panel's technical section.
 */
import { ResultSummarizer, ResultSummaryDetail } from '../types/algorithm';
import { formatValue } from '../utils/resultSummary';

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isArr = Array.isArray;
const list = (items: unknown[], sep = ', ') => items.map((v) => formatValue(v)).join(sep);
const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;
const detailsOf = (...entries: (ResultSummaryDetail | false | null | undefined)[]) =>
  entries.filter(Boolean) as ResultSummaryDetail[];

// ─── Module 1: Greedy / Divide & Conquer ────────────────────────────────────

export const summarizeFractionalKnapsack: ResultSummarizer = (r) => {
  if (!isNum(r.maxValue) || !isArr(r.itemsTaken)) return null;
  const whole = r.itemsTaken.filter((it: any) => it.fraction === 1).length;
  const partial = r.itemsTaken.length - whole;
  return {
    headline: `Maximum value: ${formatValue(r.maxValue)}, using weight ${formatValue(r.totalWeight)} of capacity ${formatValue(r.capacity)}.`,
    details: detailsOf(
      { label: 'Items taken whole', value: whole },
      { label: 'Items taken partially', value: partial }
    ),
    table: {
      caption: 'What went into the knapsack',
      columns: ['Item', 'Portion taken', 'Weight taken', 'Value gained'],
      rows: r.itemsTaken.map((it: any) => [
        `Item ${it.id}`,
        it.fraction === 1 ? 'Whole item' : `${formatValue(it.fraction * 100)}%`,
        formatValue(it.weightTaken),
        formatValue(it.valueTaken),
      ]),
    },
  };
};

export const summarizeHuffman: ResultSummarizer = (r, inputs) => {
  if (!r.codeTable || typeof r.codeTable !== 'object') return null;
  const text: string | undefined = typeof inputs.text === 'string' ? inputs.text : undefined;
  const chars = Object.keys(r.codeTable);
  // Frequencies come from the input text the tree was built from; only shown if it covers every coded character.
  const freq = new Map<string, number>();
  if (text) for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  const hasFreq = !!text && chars.every((ch) => freq.has(ch));
  const showChar = (ch: string) => (ch === ' ' ? '␣ (space)' : ch);

  const rows = chars
    .map((ch) => ({ ch, code: String(r.codeTable[ch]), f: freq.get(ch) ?? 0 }))
    .sort((a, b) => b.f - a.f || a.code.length - b.code.length || a.ch.localeCompare(b.ch));

  return {
    headline:
      isNum(r.originalBits) && isNum(r.compressedBits)
        ? `${text ? `"${text}"` : 'The text'} is encoded in ${r.compressedBits} bits instead of ${r.originalBits} bits (${formatValue(r.compressionRatio)} space saved).`
        : `Built a prefix code for ${plural(chars.length, 'character')}.`,
    details: detailsOf(r.encodedBits && { label: 'Encoded bitstream', value: String(r.encodedBits) }),
    table: {
      caption: 'Huffman code table',
      columns: hasFreq ? ['Character', 'Frequency', 'Code', 'Code length'] : ['Character', 'Code', 'Code length'],
      rows: rows.map(({ ch, code, f }) =>
        hasFreq ? [showChar(ch), f, code, code.length] : [showChar(ch), code, code.length]
      ),
    },
  };
};

export const summarizeMaxSubarray: ResultSummarizer = (r) => {
  if (!isNum(r.maxSum) || !isArr(r.subarray)) return null;
  return {
    headline: `The maximum subarray sum is ${r.maxSum}, from index ${r.low} to index ${r.high}: [${list(r.subarray)}].`,
    details: detailsOf(isNum(r.totalCalls) && { label: 'Recursive calls', value: r.totalCalls }),
  };
};

export const summarizeKaratsuba: ResultSummarizer = (r) => {
  if (r.product === undefined || r.num1 === undefined || r.num2 === undefined) return null;
  return {
    headline: `${r.num1} × ${r.num2} = ${r.product}`,
    details: detailsOf(
      isNum(r.multiplications) && { label: 'Single-digit (base case) multiplications', value: r.multiplications },
      isNum(r.totalCalls) && { label: 'Recursive calls', value: r.totalCalls }
    ),
  };
};

// ─── Module 2: Dynamic Programming / Backtracking / Branch & Bound ─────────

export const summarizeKnapsackDp: ResultSummarizer = (r) => {
  if (!isNum(r.maxValue)) return null;
  const items = isArr(r.selectedItems) ? r.selectedItems : [];
  return {
    headline: `Maximum value: ${r.maxValue}, using weight ${formatValue(r.totalWeight)} of capacity ${formatValue(r.capacity)}.`,
    table: items.length
      ? {
          caption: 'Items selected (each taken whole)',
          columns: ['Item', 'Weight', 'Value'],
          rows: items.map((it: any) => [it.name ?? `Item ${it.id}`, it.weight, it.value]),
        }
      : undefined,
    details: items.length ? undefined : [{ label: 'Items selected', value: 'None' }],
  };
};

export const summarizeLcs: ResultSummarizer = (r) => {
  if (!isNum(r.lcsLength)) return null;
  return {
    headline:
      r.lcsLength > 0
        ? `The longest common subsequence is "${r.lcsString}" (length ${r.lcsLength}).`
        : 'The two strings have no characters in common, so the LCS is empty.',
    details: detailsOf(
      isArr(r.matchedIndicesStr1) && r.matchedIndicesStr1.length > 0 && { label: 'Matched indices in string 1', value: list(r.matchedIndicesStr1) },
      isArr(r.matchedIndicesStr2) && r.matchedIndicesStr2.length > 0 && { label: 'Matched indices in string 2', value: list(r.matchedIndicesStr2) }
    ),
  };
};

export const summarizeMatrixChainMultiplication: ResultSummarizer = (r) => {
  if (!isNum(r.minCost)) return null;
  return {
    headline: `Minimum cost: ${r.minCost} scalar multiplications, using the order ${r.optimalParenthesization}.`,
    details: detailsOf(
      isNum(r.matrixCount) && { label: 'Matrices', value: r.matrixCount },
      isArr(r.dimensions) && { label: 'Dimension sequence', value: list(r.dimensions) }
    ),
  };
};

export const summarizeAssemblyLineScheduling: ResultSummarizer = (r) => {
  if (!isNum(r.minTotalTime)) return null;
  return {
    headline: `Fastest total assembly time: ${r.minTotalTime}, finishing on line ${r.winningExitLine}.`,
    details: detailsOf(
      isNum(r.finalF1) && { label: 'Best time finishing on line 1', value: r.finalF1 },
      isNum(r.finalF2) && { label: 'Best time finishing on line 2', value: r.finalF2 }
    ),
    table: isArr(r.optimalPath)
      ? {
          caption: 'Fastest route through the stations',
          columns: ['Station', 'Line used'],
          rows: r.optimalPath.map((p: any) => [p.station, p.line]),
        }
      : undefined,
  };
};

export const summarizeTsp: ResultSummarizer = (r) => {
  if (!isNum(r.optimalCost)) return null;
  return {
    headline: `Shortest tour has cost ${r.optimalCost}: ${r.tourString ?? list(r.optimalTour ?? [], ' → ')}.`,
    details: detailsOf(isNum(r.numCities) && { label: 'Cities', value: r.numCities }),
  };
};

export const summarizeNQueens: ResultSummarizer = (r) => {
  if (!isNum(r.n) || !isNum(r.totalSolutionsFound)) return null;
  if (r.totalSolutionsFound === 0) {
    return { headline: `There is no way to place ${r.n} non-attacking queens on a ${r.n}×${r.n} board.` };
  }
  const first: number[] | undefined = r.firstSolution ?? r.solutions?.[0];
  return {
    headline: r.stoppedAtFirst
      ? `Found a way to place ${r.n} queens on a ${r.n}×${r.n} board so that none attack each other. The search stopped at this first solution, so other solutions may exist.`
      : `Found ${plural(r.totalSolutionsFound, 'way')} to place ${r.n} queens on a ${r.n}×${r.n} board so that none attack each other.`,
    table: isArr(first)
      ? {
          caption: `${r.totalSolutionsFound > 1 ? 'First solution' : 'Solution'}: queen position in each row (rows and columns numbered from 1)`,
          columns: ['Row', 'Column'],
          rows: first.map((col, row) => [row + 1, col + 1]),
        }
      : undefined,
  };
};

export const summarizeKnapsackBb: ResultSummarizer = (r) => {
  if (!isNum(r.maxValue)) return null;
  const ids = isArr(r.selectedItemIndices) ? r.selectedItemIndices : [];
  return {
    headline: `Maximum value: ${r.maxValue}, using weight ${formatValue(r.totalWeight)} of capacity ${formatValue(r.capacity)}.`,
    details: detailsOf(
      { label: 'Items selected', value: ids.length ? list(ids.map((id: number) => `Item ${id}`)) : 'None' },
      isNum(r.nodesExplored) && { label: 'Nodes explored', value: r.nodesExplored },
      isNum(r.prunedNodes) && { label: 'Nodes pruned', value: r.prunedNodes }
    ),
  };
};

export const summarizeSubsetSum: ResultSummarizer = (r) => {
  if (typeof r.found !== 'boolean') return null;
  if (!r.found) {
    return {
      headline: `No subset of the numbers adds up to ${formatValue(r.targetSum)}.`,
      details: detailsOf(isNum(r.nodesExplored) && { label: 'Nodes explored', value: r.nodesExplored }),
    };
  }
  const all: number[][] = isArr(r.allSolutions) ? r.allSolutions : [];
  const many = all.length > 1;
  return {
    headline: many
      ? `Found ${all.length} subsets that add up to ${formatValue(r.targetSum)}.`
      : `The subset {${list(r.subset ?? all[0] ?? [])}} adds up to ${formatValue(r.targetSum)}.`,
    details: detailsOf(
      isNum(r.nodesExplored) && { label: 'Nodes explored', value: r.nodesExplored },
      isNum(r.backtracks) && { label: 'Backtracks', value: r.backtracks }
    ),
    table: many
      ? { caption: 'All subsets found', columns: ['#', 'Subset'], rows: all.map((s, i) => [i + 1, `{${list(s)}}`]) }
      : undefined,
  };
};

export const summarizeGraphColoring: ResultSummarizer = (r) => {
  if (typeof r.solvable !== 'boolean') return null;
  if (!r.solvable) {
    return { headline: `The graph cannot be colored with ${r.numColors} colors without two adjacent vertices sharing a color.` };
  }
  return {
    headline: r.colorSummary
      ? `Valid ${r.numColors}-coloring found: ${r.colorSummary}.`
      : `Found a valid coloring using at most ${r.numColors} colors.`,
    details: detailsOf(
      isNum(r.numSolutions) && { label: 'Valid colorings found', value: r.numSolutions },
      isNum(r.nodesExplored) && { label: 'Nodes explored', value: r.nodesExplored },
      isNum(r.backtracks) && { label: 'Backtracks', value: r.backtracks }
    ),
  };
};

export const summarizeJobSelectionBb: ResultSummarizer = (r) => {
  if (!isNum(r.maxProfit) || !isArr(r.selectedJobs)) return null;
  return {
    headline: r.selectedJobs.length
      ? `Maximum profit: ${r.maxProfit}, by doing jobs ${list(r.selectedJobs.map((j: number) => `J${j}`))}.`
      : `No feasible job could be scheduled (profit ${r.maxProfit}).`,
    details: detailsOf(
      isNum(r.nodesExplored) && { label: 'Nodes explored', value: r.nodesExplored },
      isNum(r.prunedNodes) && { label: 'Nodes pruned', value: r.prunedNodes }
    ),
    table: isArr(r.schedule)
      ? {
          caption: 'Schedule by time slot',
          columns: ['Slot', 'Job'],
          rows: r.schedule.map((j: number | null, slot: number) => [slot + 1, j === null ? 'Empty' : `J${j}`]),
        }
      : undefined,
  };
};

// ─── Module 3: String Matching ──────────────────────────────────────────────

const matchHeadline = (r: any, inputs: Record<string, any>) => {
  const pattern = typeof inputs.pattern === 'string' && inputs.pattern ? `"${inputs.pattern}"` : 'The pattern';
  if (r.matchCount === 0) return `${pattern} does not occur in the text.`;
  const where = r.matchCount === 1 ? 'index' : 'indices';
  return `${pattern} occurs ${plural(r.matchCount, 'time')} in the text, starting at ${where} ${list(r.matchIndices)}.`;
};

const stringMatchSummarizer =
  (extra: (r: any) => (ResultSummaryDetail | false | null | undefined)[] = () => []): ResultSummarizer =>
  (r, inputs) => {
    if (!isNum(r.matchCount) || !isArr(r.matchIndices)) return null;
    return { headline: matchHeadline(r, inputs), details: detailsOf(...extra(r)) };
  };

export const summarizeNaiveStringMatch = stringMatchSummarizer();

export const summarizeKmp = stringMatchSummarizer((r) => [
  isArr(r.lpsTable) && { label: 'LPS (failure function) table', value: list(r.lpsTable) },
]);

export const summarizeRabinKarp = stringMatchSummarizer((r) => [
  isNum(r.spuriousHits) && { label: 'Spurious hits (hash matched, text did not)', value: r.spuriousHits },
  isNum(r.base) && { label: 'Hash base', value: r.base },
  isNum(r.prime) && { label: 'Hash modulus (prime)', value: r.prime },
]);

export const summarizeSuffixTree = stringMatchSummarizer((r) => [
  r.textWithTerminal && { label: 'Indexed text', value: String(r.textWithTerminal) },
  isNum(r.nodeCount) && { label: 'Suffix tree nodes', value: r.nodeCount },
]);

// ─── Module 4: Graphs & Flows ───────────────────────────────────────────────

const distanceText = (d: unknown) => (isNum(d) ? d : 'Unreachable');

export const summarizeFloydWarshall: ResultSummarizer = (r) => {
  if (!r.paths || typeof r.paths !== 'object') return null;
  const entries = Object.entries(r.paths as Record<string, { distance: number | null; path: string }>).filter(
    ([pair]) => {
      const [from, to] = pair.split(' -> ');
      return from !== to;
    }
  );
  const n = isArr(r.distanceMatrix) ? r.distanceMatrix.length : undefined;
  return {
    headline: `Computed the shortest distance between every pair of ${n ? `the ${n} ` : ''}vertices.`,
    table: {
      caption: 'Shortest paths between pairs',
      columns: ['From → To', 'Distance', 'Path'],
      rows: entries.map(([pair, p]) => [pair.replace(' -> ', ' → '), distanceText(p.distance), p.path || '—']),
    },
  };
};

export const summarizeBellmanFord: ResultSummarizer = (r) => {
  if (r.hasNegativeCycle) {
    return {
      headline: `A negative-weight cycle is reachable from ${r.source}, so shortest distances are undefined.`,
      details: detailsOf(r.negativeCycleEdge && { label: 'Edge that could still be relaxed', value: r.negativeCycleEdge }),
    };
  }
  if (!r.paths || typeof r.paths !== 'object') return null;
  return {
    headline: `Shortest distances from ${r.source} to every vertex (no negative cycle found).`,
    table: {
      caption: `Shortest paths from ${r.source}`,
      columns: ['Vertex', 'Distance', 'Path'],
      rows: Object.entries(r.paths as Record<string, { distance: number | null; path: string }>).map(([v, p]) => [
        v,
        distanceText(p.distance),
        p.path || '—',
      ]),
    },
  };
};

const maxFlowSummarizer =
  (extra: (r: any) => (ResultSummaryDetail | false | null | undefined)[] = () => []): ResultSummarizer =>
  (r) => {
    if (!isNum(r.maxFlow)) return null;
    const edges = isArr(r.edgesWithFlow) ? r.edgesWithFlow.filter((e: any) => e.flow > 0) : [];
    return {
      headline: `Maximum flow from ${r.source} to ${r.sink}: ${r.maxFlow}.`,
      details: detailsOf(...extra(r)),
      table: edges.length
        ? {
            caption: 'Edges carrying flow (graph vertex ids)',
            columns: ['Edge', 'Flow / Capacity'],
            rows: edges.map((e: any) => [`${e.u} → ${e.v}`, `${e.flow} / ${e.capacity}`]),
          }
        : undefined,
    };
  };

export const summarizeFordFulkerson = maxFlowSummarizer();
export const summarizeEdmondsKarp = maxFlowSummarizer();
export const summarizePushRelabel = maxFlowSummarizer((r) => [
  isNum(r.totalPushRelabelSteps) && { label: 'Push / relabel operations', value: r.totalPushRelabelSteps },
]);

// ─── Module 5: Geometry ─────────────────────────────────────────────────────

const convexHullSummarizer: ResultSummarizer = (r) => {
  if (!isNum(r.hullVertexCount) || !isArr(r.hullVertices)) return null;
  return {
    headline: `The convex hull has ${plural(r.hullVertexCount, 'vertex', 'vertices')}: ${r.perimeterOrder ?? list(r.hullVertices.map((p: any) => p.label), ' → ')}.`,
    table: {
      caption: 'Hull vertices in perimeter order',
      columns: ['Point', 'x', 'y'],
      rows: r.hullVertices.map((p: any) => [p.label, p.x, p.y]),
    },
  };
};

export const summarizeGrahamScan = convexHullSummarizer;
export const summarizeJarvisMarch = convexHullSummarizer;

export const summarizeLineSegmentIntersection: ResultSummarizer = (r) => {
  if (typeof r.hasIntersection !== 'boolean') return null;
  const details = detailsOf(
    isNum(r.eventsProcessed) && { label: 'Sweep events processed', value: r.eventsProcessed },
    isNum(r.segmentsChecked) && { label: 'Segments checked', value: r.segmentsChecked }
  );
  if (!r.hasIntersection) return { headline: 'No two segments intersect.', details };
  const [a, b] = isArr(r.intersectingPair) ? r.intersectingPair : [];
  const at = r.point && isNum(r.point.x) ? ` at (${formatValue(r.point.x)}, ${formatValue(r.point.y)})` : '';
  return { headline: `Yes — segments ${a} and ${b} intersect${at}.`, details };
};

// ─── Module 6: Randomized / Approximation ──────────────────────────────────

export const summarizeRandomizedQuicksort: ResultSummarizer = (r) => {
  if (!isArr(r)) return null;
  return { headline: `Sorted output: [${list(r)}]`, details: [{ label: 'Elements sorted', value: r.length }] };
};

export const summarizeHiringProblem: ResultSummarizer = (r) => {
  if (!isNum(r.totalHires) || !isNum(r.totalCandidates)) return null;
  const best = r.bestCandidate;
  return {
    headline: `Hired ${r.totalHires} of ${r.totalCandidates} candidates${best ? `; the final hire (index ${best.index}, score ${best.score}) is the best candidate` : ''}.`,
    details: detailsOf(
      isNum(r.interviewExpense) && { label: 'Interview cost', value: r.interviewExpense },
      isNum(r.hiringExpense) && { label: 'Hiring cost', value: r.hiringExpense },
      isNum(r.totalCost) && { label: 'Total cost', value: r.totalCost },
      isNum(r.theoreticalExpectedHires) && { label: 'Expected hires (random order)', value: r.theoreticalExpectedHires }
    ),
    table: isArr(r.hiredCandidates)
      ? {
          caption: 'Candidates hired, in order',
          columns: ['Candidate index', 'Score'],
          rows: r.hiredCandidates.map((c: any) => [c.index, c.score]),
        }
      : undefined,
  };
};

export const summarizeKargerMinCut: ResultSummarizer = (r) => {
  if (!isNum(r.cutSize)) return null;
  const many = isNum(r.trials) && r.trials > 1 && isNum(r.bestCutSize);
  const truth = isNum(r.trueMinCutSize)
    ? ` The true minimum cut (checked over every partition) has size ${r.trueMinCutSize}.`
    : '';
  return {
    headline: many
      ? `The animated run found a cut of size ${r.cutSize}; the best of ${r.trials} runs found a cut of size ${r.bestCutSize}.${truth}`
      : `This run found a cut crossed by ${plural(r.cutSize, 'edge')}: ${r.partition}. A single run is not guaranteed to find the minimum.${truth}`,
    details: detailsOf(
      { label: 'Cut found by the animated run', value: `${r.cutSize} (${r.partition})` },
      many && { label: `Best cut over ${r.trials} runs`, value: `${r.bestCutSize} (${r.bestPartition})` },
      typeof r.thisRunIsMinimum === 'boolean' && { label: 'Animated run found a minimum cut', value: formatValue(r.thisRunIsMinimum) },
      many && typeof r.bestIsMinimum === 'boolean' && { label: 'Best run found a minimum cut', value: formatValue(r.bestIsMinimum) },
      r.successProbabilityBound && { label: 'Success probability bound', value: String(r.successProbabilityBound) }
    ),
  };
};

export const summarizeVertexCoverApprox: ResultSummarizer = (r) => {
  if (!isNum(r.coverSize) || !isArr(r.coverVertices)) return null;
  return {
    headline: `Vertex cover of size ${r.coverSize}: {${list(r.coverVertices)}}.`,
    details: detailsOf(
      isNum(r.matchingSize) && { label: 'Edges picked (maximal matching)', value: r.matchingSize },
      r.approxRatioGuarantee && { label: 'Guarantee', value: String(r.approxRatioGuarantee) },
      typeof r.isCoverValid === 'boolean' && { label: 'Covers every edge', value: formatValue(r.isCoverValid) }
    ),
  };
};

export const summarizeSetCover: ResultSummarizer = (r) => {
  if (!isArr(r.selectedSubsets)) return null;
  return {
    headline: `Selected ${plural(r.selectedSubsets.length, 'subset')} (${list(r.selectedSubsets)}), covering ${formatValue(r.coveredCount)} of ${formatValue(r.totalUniverseSize)} elements.`,
    details: detailsOf(
      typeof r.isFullyCovered === 'boolean' && { label: 'Universe fully covered', value: formatValue(r.isFullyCovered) },
      r.approximationFactor && { label: 'Approximation factor', value: String(r.approximationFactor) }
    ),
  };
};

export const summarizeTspApprox: ResultSummarizer = (r) => {
  if (!isNum(r.tourCost) || !isArr(r.tour)) return null;
  return {
    headline:
      r.guaranteeHolds === false
        ? `Tour with cost ${r.tourCost}: ${list(r.tour, ' → ')}. The costs are not metric, so this tour has no 2× guarantee.`
        : `Approximate tour with cost ${r.tourCost}: ${list(r.tour, ' → ')}.`,
    details: detailsOf(
      isNum(r.mstWeight) && { label: 'MST weight', value: r.mstWeight },
      isNum(r.doubledWeight) && { label: '2 × MST weight', value: r.doubledWeight },
      typeof r.isMetric === 'boolean' && { label: 'Metric costs (triangle inequality holds)', value: formatValue(r.isMetric) },
      r.metricViolation && { label: 'Why not metric', value: String(r.metricViolation) },
      r.approxRatioBound && { label: r.guaranteeHolds === false ? 'Guarantee' : 'Bound', value: String(r.approxRatioBound) }
    ),
  };
};
