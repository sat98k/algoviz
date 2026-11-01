import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';
import { StateSpaceTree, SpaceTreeNode, SpaceNodeKind } from './StateSpaceTree';

/**
 * 🔦 Branch & Bound as explorers in treasure caves (0-1 Knapsack B&B, Job Selection B&B).
 *
 * Every cave is a partial plan; each tunnel down decides one cheese (or job): take it or
 * leave it. A crystal ball in each cave promises the most treasure that cave could ever
 * lead to (the bound). Explorers always visit the most promising cave first. A cave
 * whose promise can't beat the trophy chest — or whose plan is impossible — is roped off
 * without being explored (pruned). The caves are drawn as the shared search tree: the camera
 * follows the explorers as best-first search jumps around, and caves still waiting in line
 * stay visible with a ⏳ badge.
 */

type Cave = {
  id: string;
  level: number;
  loot: number;
  bound: number;
  weight?: number;
  took?: boolean;
  decided?: number;
  status: string;
  pruneType?: string;
  pruneReason?: string;
  children?: Cave[];
};

export const TreasureCaveScene: React.FC<StorySceneProps> = ({ step, algorithmId, stepMs }) => {
  const st: any = step.state || {};
  const isJobs = algorithmId === 'job-selection-bb';
  const title: string = step.title || '';
  const pruned: string[] = st.prunedNodeIds || [];
  const best: number = (isJobs ? st.bestProfit : st.bestValue) ?? 0;
  const bestPicks: number[] = (isJobs ? st.bestJobs : st.bestItems) || [];
  const items: { id: number; weight: number; value: number }[] = st.items || [];
  const capacity: number = st.capacity ?? 0;
  const activeId: string | undefined = st.activeNodeId;

  // Normalise both node shapes into caves.
  const toCave = (n: any, parentPicks: number[] = []): Cave => ({
    id: n.id,
    level: n.level,
    loot: isJobs ? n.profit : n.value,
    bound: n.bound,
    weight: n.weight,
    took: isJobs ? n.jobIncluded : n.itemIncluded,
    decided: isJobs ? n.jobId : n.level > 0 ? items[n.level - 1]?.id : undefined,
    status: n.status,
    pruneType: n.pruneType,
    pruneReason: n.pruneReason,
    children: (n.children || []).map((c: any) => toCave(c, parentPicks)),
  });
  const root: Cave | undefined = st.treeRoot ? toCave(st.treeRoot) : undefined;

  // ── State-space tree: caves become nodes of the shared search tree ──
  const caveById = new Map<string, Cave>();
  const parentOf = new Map<string, string | null>();
  const walk = (c: Cave, parent: string | null) => {
    caveById.set(c.id, c);
    parentOf.set(c.id, parent);
    (c.children || []).forEach((k) => walk(k, c.id));
  };
  if (root) walk(root, null);

  // What each cave has taken so far (its own choice plus every choice above it).
  const picksOf = (id: string): number[] => {
    const out: number[] = [];
    let cur: string | null = id;
    while (cur) {
      const c = caveById.get(cur)!;
      if (c.took && c.decided !== undefined) out.push(c.decided);
      cur = parentOf.get(cur) ?? null;
    }
    return out.sort((a, b) => a - b);
  };
  // Knapsack doesn't mark its best cave, so find the shallowest cave holding exactly the best picks.
  const bestKey = [...bestPicks].sort((a, b) => a - b).join(',');
  const bestCaveId = (() => {
    const marked = [...caveById.values()].filter((c) => ['best', 'incumbent', 'optimal'].includes(c.status));
    if (marked.length) return marked.sort((a, b) => a.level - b.level)[0].id;
    if (isJobs || best <= 0) return undefined;
    const match = [...caveById.values()].filter((c) => c.loot === best && c.level > 0 && picksOf(c.id).join(',') === bestKey);
    return match.sort((a, b) => a.level - b.level)[0]?.id;
  })();

  const treeNodes: Record<string, SpaceTreeNode> = {};
  for (const c of caveById.values()) {
    const isPruned = pruned.includes(c.id) || c.status === 'pruned';
    // Job Selection marks queued caves 'queued'; Knapsack leaves them 'active'. Either way a cave that
    // already has tunnels below it has been explored, so only childless ones are still in line.
    const unexplored = !(c.children || []).length && c.id !== activeId;
    const waiting = unexplored && (c.status === 'queued' || (!isJobs && c.status === 'active'));
    treeNodes[c.id] = {
      id: c.id,
      parentId: parentOf.get(c.id) ?? null,
      children: (c.children || []).map((k) => k.id),
      edgeLabel: c.level > 0 && c.decided !== undefined ? `${c.took ? 'take' : 'skip'} ${isJobs ? `J${c.decided}` : `cheese ${c.decided}`}` : undefined,
      status: c.id === bestCaveId ? 'solution' : isPruned ? 'pruned' : waiting ? 'waiting' : 'open',
      pruneNote: isPruned
        ? c.pruneType === 'infeasible' || /^Weight|Infeasible/.test(c.pruneReason || '')
          ? isJobs
            ? 'misses a deadline'
            : 'too heavy'
          : 'can’t beat the best'
        : undefined,
    };
  }
  // Which choice each level of the tree decides.
  const decidedAt = new Map<number, number>();
  for (const c of caveById.values()) if (c.level > 0 && c.decided !== undefined) decidedAt.set(c.level, c.decided);

  const renderCave = (id: string, k: SpaceNodeKind) => {
    const c = caveById.get(id)!;
    const rock = k === 'solution' ? '#f2c21a' : k === 'waiting' ? '#dfe7ec' : '#d9c7a8';
    return (
      <g>
        <path d="M-42 26 Q-46 -6 -30 -24 Q-8 -36 18 -30 Q42 -22 43 2 Q44 24 34 29 Z" fill="#3a2414" opacity="0.12" transform="translate(0, 4)" />
        <path d="M-42 26 Q-46 -6 -30 -24 Q-8 -36 18 -30 Q42 -22 43 2 Q44 24 34 29 Z" fill={rock} />
        <path d="M-30 -24 Q-8 -36 18 -30 Q30 -26 36 -16 Q10 -26 -26 -18 Z" fill="#ffffff" opacity="0.35" />
        {/* the loot: a small gold heap */}
        <g transform="translate(-22, -8)">
          <circle cx="-3" cy="2" r="5" fill="#c98a12" />
          <circle cx="3" cy="2" r="5" fill="#e8a817" />
          <circle cx="0" cy="-3" r="5" fill="#f0c94a" />
        </g>
        <text x="10" y="-4" textAnchor="middle" fontSize="13.5" fontWeight="900" fill="#1a1a1a" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
          {money(c.loot)}
        </text>
        {/* the promise: a crystal ball */}
        <g transform="translate(-22, 13)">
          <circle r="6" fill="#b48ad0" />
          <circle r="2" cx="-2" cy="-2" fill="#ffffff" opacity="0.8" />
          <rect x="-5" y="5" width="10" height="3" rx="1.5" fill="#6e4426" />
        </g>
        <text x="10" y="15" textAnchor="middle" fontSize="12" fontWeight="800" fill="#5a2378">
          ≤{money(c.bound)}
        </text>
        {!isJobs && c.weight !== undefined && c.level > 0 && (
          <text y="27" textAnchor="middle" fontSize="10" fontWeight="700" fill="#4a463e">
            {c.weight} of {capacity} kg
          </text>
        )}
      </g>
    );
  };
  const kind = (() => {
    if (step.isFinal) return 'final';
    if (/^Initialize/.test(title)) return 'intro';
    if (/^Explore Node/.test(title)) return 'explore';
    if (/by Bound/.test(title)) return 'prune-bound';
    if (/Infeasible/.test(title)) return 'prune-infeasible';
    if (/^New Best/.test(title)) return 'best';
    if (/Needs No Further Branching/.test(title)) return 'leaf-best';
    if (/Added to Queue/.test(title)) return 'queued';
    return 'idle';
  })();
  const phases: readonly (readonly [string, number])[] = kind.startsWith('prune') ? [['look', 0], ['rope', 0.4]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  const active = activeId ? caveById.get(activeId) : undefined;
  const thing = isJobs ? 'job' : 'cheese';
  const pickName = (id?: number) => (id === undefined ? '' : isJobs ? `J${id}` : `cheese ${id}`);
  const money = (v: number) => (isJobs ? `${v}` : `$${v}`);

  const narration = (() => {
    switch (kind) {
      case 'intro':
        return `Treasure caves! Each tunnel down decides one ${thing}: take it or leave it. Every cave has a crystal ball promising the most treasure it could ever lead to. Explorers always visit the most promising cave first.`;
      case 'explore':
        return active ? `Explore the most promising cave: it holds ${money(active.loot)} so far, and its crystal ball promises up to ${money(active.bound)}.` : step.title;
      case 'prune-bound':
        return phase === 'look' || !active
          ? `Look into the crystal ball of this cave…`
          : `It promises at most ${money(active.bound)}, but the trophy chest already holds ${money(best)}. Rope it off: exploring it can’t help.`;
      case 'prune-infeasible':
        if (phase === 'look' || !active) return `What if we also take ${pickName(active?.decided)}?`;
        return isJobs
          ? `Impossible: with ${pickName(active.decided)} too, not every job can finish before its deadline. Rope it off.`
          : `Too heavy: that makes ${active.weight} kg, more than the backpack’s ${capacity} kg. Rope it off.`;
      case 'best':
        return `New best treasure: ${money(best)}! It goes into the trophy chest. From now on, any cave promising less is roped off.`;
      case 'leaf-best':
        return 'This plan is the best so far, and nothing below it could add more, so there is no need to dig deeper.';
      case 'queued':
        return active ? `This cave looks promising (up to ${money(active.bound)}), so an explorer lines up to visit it.` : step.title;
      case 'final':
        return `All promising caves are explored. The best treasure is ${money(best)} with ${bestPicks.length ? bestPicks.map((p) => pickName(p)).join(', ') : `no ${thing}s`}. ${pruned.length} cave${pruned.length === 1 ? ' was' : 's were'} roped off without exploring.`;
      default:
        return step.title;
    }
  })();

  const status = `Trophy chest • ${money(best)}`;

  return (
    <StoryStage
      title="Treasure Caves"
      subtitle={`A crystal ball shows the most treasure a cave could still lead to. Caves that can’t beat the trophy chest get roped off.`}
      narration={narration}
      status={status}
    >
      <div className="flex flex-wrap items-center justify-center gap-4 mb-3 font-sans text-sm">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${kind === 'best' ? 'bg-[#f2c21a] animate-story-pop' : 'bg-[#fdf1c7]'}`}>
          <svg width="22" height="22" viewBox="-11 -12 22 24" aria-hidden>
            <path d="M-7 -10 H7 V-3 A7 7 0 0 1 -7 -3 Z" fill="#e8a817" />
            <rect x="-1.5" y="3" width="3" height="4" fill="#9a6416" />
            <rect x="-6" y="7" width="12" height="3.5" rx="1.5" fill="#6e4426" />
          </svg>
          <span className="font-bold text-stone-900">
            {money(best)} {bestPicks.length > 0 && <span className="font-normal text-stone-700">({bestPicks.map((p) => pickName(p)).join(', ')})</span>}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-600">
          <span className="font-semibold">Explorers waiting:</span>
          {Array.from({ length: Math.min(12, st.queueSize ?? 0) }, (_, i) => (
            <span key={i} className="w-3 h-3 rounded-full bg-[#2457c5]" aria-hidden />
          ))}
          {(st.queueSize ?? 0) === 0 && <span className="italic">none</span>}
        </div>
      </div>

      <StateSpaceTree
        nodes={treeNodes}
        rootId={root?.id ?? ""}
        activeId={kind === "final" ? bestCaveId ?? root?.id ?? "" : activeId ?? root?.id ?? ""}
        newId={["queued", "prune-infeasible", "best", "leaf-best"].includes(kind) ? activeId : undefined}
        revealPrune={!(kind.startsWith("prune") && phase === "look")}
        stepKey={step.stepIndex}
        nodeW={84}
        nodeH={58}
        leafGap={118}
        panelHeight={420}
        renderNode={renderCave}
        levelLabel={(d) => (d === 0 ? "start" : decidedAt.has(d) ? `${isJobs ? "J" : "cheese "}${decidedAt.get(d)}?` : undefined)}
        caption={`Each level decides one ${thing}: take it or skip it. The gold heap is the treasure so far, the crystal ball the most this cave could still lead to. Explorers visit the brightest crystal ball first, so the search jumps around the tree.`}
      />
    </StoryStage>
  );
};
