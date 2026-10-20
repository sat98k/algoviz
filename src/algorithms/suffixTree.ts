import { AlgorithmStep } from '../types/algorithm';

interface STNode {
  id: string;
  start: number;
  end: number; // inclusive; LEAF sentinel means "extends to the current global leaf end"
  children: Map<string, STNode>;
  suffixLink: STNode | null;
  suffixIndex: number; // -1 for internal nodes
}

export interface SuffixTreeNodeSnapshot {
  id: string;
  edgeLabel: string; // substring on the edge from the parent ('' for the root)
  suffixIndex: number;
  isLeaf: boolean;
  status: 'active' | 'best' | 'explored' | 'normal';
  children: SuffixTreeNodeSnapshot[];
}

export interface SuffixTreeState {
  text: string; // the text with the terminal '$' appended
  pattern: string;
  phase: 'build' | 'search';
  suffixTree: SuffixTreeNodeSnapshot;
  activeNodeId?: string;
  activePointLabel?: string;
  remainingSuffixCount?: number;
  matchLeafIds?: string[];
  matchIndices: number[];
  explanation?: string;
  /** Search phase: number of pattern characters matched so far (P[0 … matchedLength−1]). */
  matchedLength?: number;
}

const LEAF = -1;

export function* suffixTreeSteps(inputs: {
  text: string;
  pattern: string;
}): Generator<AlgorithmStep<SuffixTreeState>> {
  const rawText = inputs.text || 'BANANA';
  const pattern = inputs.pattern || 'ANA';
  const s = rawText.endsWith('$') ? rawText : rawText + '$';
  const sLen = s.length;
  const originalLen = s.lastIndexOf('$'); // occurrences must start strictly before the terminal

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;
  let idCounter = 0;

  const root: STNode = {
    id: 'root',
    start: -1,
    end: -1,
    children: new Map(),
    suffixLink: null,
    suffixIndex: -1,
  };
  const mkNode = (start: number, end: number): STNode => ({
    id: `n${++idCounter}`,
    start,
    end,
    children: new Map(),
    suffixLink: root,
    suffixIndex: -1,
  });

  let leafEnd = LEAF; // becomes a concrete index during construction
  const edgeEnd = (node: STNode) => (node.end === LEAF ? leafEnd : node.end);
  const edgeLen = (node: STNode) => edgeEnd(node) - node.start + 1;
  const edgeStr = (node: STNode) => (node.start < 0 ? '' : s.slice(node.start, edgeEnd(node) + 1));

  // ---- Ukkonen active-point state ----
  let activeNode = root;
  let activeEdge = 0;
  let activeLength = 0;
  let remaining = 0;
  let lastNewNode: STNode | null = null;

  // ---- snapshot helper: materialize the live tree into a plain, highlighted copy ----
  const snapshot = (
    title: string,
    description: string,
    codeLine: number,
    opts: {
      phase: 'build' | 'search';
      activeIds?: Set<string>;
      bestIds?: Set<string>;
      exploredIds?: Set<string>;
      activePointLabel?: string;
      matchLeafIds?: string[];
      matchIndices?: number[];
      matchedLength?: number;
      isFinal?: boolean;
      result?: any;
    }
  ): AlgorithmStep<SuffixTreeState> => {
    const activeIds = opts.activeIds ?? new Set<string>();
    const bestIds = opts.bestIds ?? new Set<string>();
    const exploredIds = opts.exploredIds ?? new Set<string>();

    const conv = (node: STNode, parentEdge: string): SuffixTreeNodeSnapshot => {
      const status: SuffixTreeNodeSnapshot['status'] = bestIds.has(node.id)
        ? 'best'
        : activeIds.has(node.id)
        ? 'active'
        : exploredIds.has(node.id)
        ? 'explored'
        : 'normal';
      const kids = [...node.children.values()].sort((a, b) =>
        s[a.start] < s[b.start] ? -1 : s[a.start] > s[b.start] ? 1 : 0
      );
      return {
        id: node.id,
        edgeLabel: parentEdge,
        suffixIndex: node.suffixIndex,
        isLeaf: node.children.size === 0,
        status,
        children: kids.map((c) => conv(c, edgeStr(c))),
      };
    };

    return {
      stepIndex: stepIndex++,
      title,
      description,
      codeLine,
      state: {
        text: s,
        pattern,
        phase: opts.phase,
        suffixTree: conv(root, ''),
        activeNodeId: [...activeIds][0],
        activePointLabel: opts.activePointLabel,
        remainingSuffixCount: remaining,
        matchLeafIds: opts.matchLeafIds,
        matchIndices: opts.matchIndices ?? [],
        explanation: description,
        matchedLength: opts.matchedLength,
      },
      highlights: { nodes: [...bestIds, ...activeIds] },
      metrics: { comparisons, iterations },
      isFinal: opts.isFinal,
      result: opts.result,
    };
  };

  const apLabel = () =>
    `(${activeNode.id}, '${activeLength > 0 ? s[activeEdge] : '·'}', ${activeLength})`;

  yield snapshot(
    'Initialize — append terminal "$"',
    `A suffix is the text from some position to the end; "${s}" has ${sLen} of them. The "$" at the end makes sure no suffix is the beginning of another, so each one ends at its own leaf. We grow a tree holding all of them by adding the text one letter at a time (Ukkonen's method), then search by walking down from the root.`,
    2,
    { phase: 'build', activeIds: new Set(['root']), activePointLabel: apLabel() }
  );

  // ================= Phase-by-phase Ukkonen construction =================
  for (let i = 0; i < sLen; i++) {
    leafEnd = i; // Rule 1: every existing leaf edge grows by one via the global end
    remaining++;
    lastNewNode = null;
    iterations++;

    yield snapshot(
      `Phase ${i + 1}: extend with '${s[i]}'`,
      `Add the next letter, '${s[i]}' (position ${i}). Every branch ending in a leaf grows by this letter automatically (rule 1). ${remaining} suffix${remaining === 1 ? '' : 'es'} ending here still ${remaining === 1 ? 'needs' : 'need'} a place in the tree.`,
      4,
      { phase: 'build', activeIds: new Set([activeNode.id]), activePointLabel: apLabel() }
    );

    while (remaining > 0) {
      if (activeLength === 0) activeEdge = i;
      const ec = s[activeEdge];

      if (!activeNode.children.has(ec)) {
        // Rule 2: no edge starts with this character — hang a new leaf here
        const suffixStart = i - remaining + 1;
        const leaf = mkNode(i, LEAF);
        leaf.suffixIndex = suffixStart;
        activeNode.children.set(ec, leaf);
        comparisons++;

        yield snapshot(
          'Rule 2 — new leaf',
          `No branch from ${activeNode.id} starts with '${ec}', so the suffix starting at position ${suffixStart} gets a new leaf of its own (rule 2).`,
          6,
          {
            phase: 'build',
            activeIds: new Set([activeNode.id]),
            bestIds: new Set([leaf.id]),
            activePointLabel: apLabel(),
          }
        );

        if (lastNewNode) {
          lastNewNode.suffixLink = activeNode;
          lastNewNode = null;
        }
      } else {
        const next = activeNode.children.get(ec)!;
        if (activeLength >= edgeLen(next)) {
          // skip/count trick: hop over the whole edge and keep walking down
          activeEdge += edgeLen(next);
          activeLength -= edgeLen(next);
          activeNode = next;
          continue;
        }

        comparisons++;
        if (s[next.start + activeLength] === s[i]) {
          // Rule 3: the character is already there — show-stopper, end the phase
          if (lastNewNode && activeNode !== root) {
            lastNewNode.suffixLink = activeNode;
            lastNewNode = null;
          }
          activeLength++;
          yield snapshot(
            `Rule 3 — '${s[i]}' already present`,
            `'${s[i]}' is already on the branch "${edgeStr(next)}" from ${activeNode.id}, so this suffix is already in the tree (rule 3). Stop for this letter. The ${remaining} waiting suffix${remaining === 1 ? '' : 'es'} will get their own place later, as soon as the text stops repeating.`,
            7,
            {
              phase: 'build',
              activeIds: new Set([activeNode.id, next.id]),
              activePointLabel: apLabel(),
            }
          );
          break;
        }

        // Rule 2 with an edge split: break "next" into split -> {new leaf, next}
        const splitEnd = next.start + activeLength - 1;
        const split = mkNode(next.start, splitEnd);
        activeNode.children.set(ec, split);

        const suffixStart = i - remaining + 1;
        const leaf = mkNode(i, LEAF);
        leaf.suffixIndex = suffixStart;
        split.children.set(s[i], leaf);

        next.start += activeLength;
        split.children.set(s[next.start], next);

        yield snapshot(
          'Rule 2 — split edge',
          `Two suffixes share "${edgeStr(split)}" but then differ, so the branch from ${activeNode.id} splits there: a new fork ${split.id}, plus a new leaf for the suffix starting at position ${suffixStart} (rule 2).`,
          6,
          {
            phase: 'build',
            activeIds: new Set([activeNode.id]),
            bestIds: new Set([split.id, leaf.id]),
            activePointLabel: apLabel(),
          }
        );

        if (lastNewNode) lastNewNode.suffixLink = split;
        lastNewNode = split;
      }

      remaining--;
      if (activeNode === root && activeLength > 0) {
        activeLength--;
        activeEdge = i - remaining + 1;
      } else if (activeNode !== root) {
        activeNode = activeNode.suffixLink ?? root;
      }
    }
  }

  // Pin the leaf end so post-build snapshots render full leaf labels
  leafEnd = sLen - 1;

  // Assign / confirm suffix indices for every leaf (labelHeight = length of the spelled suffix)
  const setSuffixIndex = (node: STNode, labelHeight: number) => {
    if (node.children.size === 0) {
      node.suffixIndex = sLen - labelHeight;
      return;
    }
    node.children.forEach((c) => setSuffixIndex(c, labelHeight + edgeLen(c)));
  };
  setSuffixIndex(root, 0);

  let nodeCount = 0;
  const countNodes = (n: STNode) => {
    nodeCount++;
    n.children.forEach(countNodes);
  };
  countNodes(root);

  yield snapshot(
    'Suffix tree complete',
    `The tree is built (${nodeCount} nodes). Reading the branches from the root down to leaf k spells the suffix starting at position k. Now search for "${pattern}": any piece of the text is the start of some suffix, so walk the pattern down from the root.`,
    8,
    { phase: 'search', activeIds: new Set(['root']) }
  );

  // ================= Search: walk the pattern down from the root =================
  const m = pattern.length;
  let node = root;
  let child: STNode | null = null;
  let edgePos = 0;
  let k = 0;
  let matched = m > 0;
  const path: string[] = ['root'];

  while (k < m) {
    if (child === null) {
      if (!node.children.has(pattern[k])) {
        matched = false;
        comparisons++;
        yield snapshot(
          `Mismatch — no edge for '${pattern[k]}'`,
          `No branch from ${node.id} starts with '${pattern[k]}', so "${pattern}" does not appear in the text.`,
          11,
          {
            phase: 'search',
            activeIds: new Set([node.id]),
            exploredIds: new Set(path),
            matchIndices: [],
          }
        );
        break;
      }
      child = node.children.get(pattern[k])!;
      edgePos = 0;
    }

    const el = edgeLen(child);
    const tc = s[child.start + edgePos];
    comparisons++;

    if (tc !== pattern[k]) {
      matched = false;
      yield snapshot(
        'Mismatch on edge',
        `The pattern needs '${pattern[k]}' but the branch "${edgeStr(child)}" has '${tc}' here, so "${pattern}" does not appear in the text.`,
        11,
        {
          phase: 'search',
          activeIds: new Set([child.id]),
          exploredIds: new Set(path),
          matchIndices: [],
        }
      );
      break;
    }

    k++;
    edgePos++;

    yield snapshot(
      `Match P[${k - 1}] = '${pattern[k - 1]}'`,
      `'${pattern[k - 1]}' matches the next letter on the branch "${edgeStr(child)}" (${node.id} → ${child.id}). ${m - k} letter${m - k === 1 ? '' : 's'} of the pattern left.`,
      11,
      {
        phase: 'search',
        activeIds: new Set([child.id]),
        exploredIds: new Set(path),
        matchedLength: k,
      }
    );

    if (edgePos === el) {
      node = child;
      path.push(node.id);
      child = null;
      edgePos = 0;
    }
  }

  let matchIndices: number[] = [];
  let matchLeafIds: string[] = [];

  if (matched) {
    const subRoot = child ?? node;
    const acc: { idx: number; id: string }[] = [];
    const collect = (n: STNode) => {
      if (n.children.size === 0) {
        if (n.suffixIndex >= 0 && n.suffixIndex < originalLen) {
          acc.push({ idx: n.suffixIndex, id: n.id });
        }
        return;
      }
      n.children.forEach(collect);
    };
    collect(subRoot);
    acc.sort((a, b) => a.idx - b.idx);
    matchIndices = acc.map((a) => a.idx);
    matchLeafIds = acc.map((a) => a.id);

    const exploredSet = new Set(path);
    if (child) exploredSet.add(child.id);

    yield snapshot(
      'Pattern consumed — collect leaves',
      `The whole pattern fits on a path from the root, so it is the beginning of every suffix whose leaf lies below this point. Those leaves give the starting positions: ${matchIndices.length} found at [${matchIndices.join(', ')}].`,
      12,
      {
        phase: 'search',
        activeIds: new Set([subRoot.id]),
        exploredIds: exploredSet,
        bestIds: new Set(matchLeafIds),
        matchLeafIds,
        matchIndices,
        matchedLength: m,
      }
    );
  }

  yield snapshot(
    'Suffix Tree Search Complete',
    matched
      ? `Search complete. Pattern "${pattern}" occurs ${matchIndices.length} time(s) at index positions: [${matchIndices.join(', ')}]. Character comparisons: ${comparisons}.`
      : `Search complete. Pattern "${pattern}" does not occur in the text. Character comparisons: ${comparisons}.`,
    13,
    {
      phase: 'search',
      exploredIds: new Set(path),
      bestIds: new Set(matchLeafIds),
      matchLeafIds,
      matchIndices,
      isFinal: true,
      result: {
        matchCount: matchIndices.length,
        matchIndices,
        nodeCount,
        textWithTerminal: s,
      },
    }
  );
}
