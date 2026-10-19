import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';

/**
 * 🔦 Branch & Bound as explorers in treasure caves (0-1 Knapsack B&B, Job Selection B&B).
 *
 * Every cave is a partial plan; each tunnel down decides one cheese (or job): take it or
 * leave it. A crystal ball in each cave promises the most treasure that cave could ever
 * lead to (the bound). Explorers always visit the most promising cave first. A cave
 * whose promise can't beat the trophy chest — or whose plan is impossible — is roped off
 * without being explored (pruned).
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
  children?: Cave[];
};

const LEVEL_H = 104;
const LEAF_W = 104;
const GOLD = '#f59e0b';

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
    children: (n.children || []).map((c: any) => toCave(c, parentPicks)),
  });
  const root: Cave | undefined = st.treeRoot ? toCave(st.treeRoot) : undefined;

  // ── Tidy tree layout: leaves side by side, parents centred above children ──
  const placed: { cave: Cave; x: number; y: number; parent?: Cave }[] = [];
  let leafCursor = 0;
  const layout = (c: Cave, depth: number, parent?: Cave): number => {
    const kids = c.children || [];
    let x: number;
    if (!kids.length) {
      x = 60 + leafCursor * LEAF_W;
      leafCursor++;
    } else {
      const xs = kids.map((k) => layout(k, depth + 1, c));
      x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    placed.push({ cave: c, x, y: 70 + depth * LEVEL_H, parent });
    return x;
  };
  if (root) layout(root, 0);
  const byId = new Map(placed.map((p) => [p.cave.id, p]));
  const width = Math.max(520, 120 + leafCursor * LEAF_W - LEAF_W + 60);
  const depth = Math.max(0, ...placed.map((p) => p.cave.level));
  const height = 70 + depth * LEVEL_H + 70;

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

  const active = activeId ? byId.get(activeId)?.cave : undefined;
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
      emoji="🔦"
      title="Treasure Caves"
      subtitle={`🔮 = the most treasure a cave could still lead to. Caves that can’t beat the trophy chest get roped off.`}
      narration={narration}
      status={status}
    >
      <div className="flex flex-wrap items-center justify-center gap-4 mb-3 font-sans text-sm">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 ${kind === 'best' ? 'border-amber-500 bg-amber-100 animate-story-pop' : 'border-amber-300 bg-amber-50'}`}>
          <span className="text-xl">🏆</span>
          <span className="font-bold text-amber-950">
            {money(best)} {bestPicks.length > 0 && <span className="font-normal text-amber-800">({bestPicks.map((p) => pickName(p)).join(', ')})</span>}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-600">
          <span className="font-semibold">Explorers waiting:</span>
          {Array.from({ length: Math.min(12, st.queueSize ?? 0) }, (_, i) => (
            <span key={i}>🔦</span>
          ))}
          {(st.queueSize ?? 0) === 0 && <span className="italic">none</span>}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.1 }} role="img" aria-label="Cave map">
        <rect x="0" y="0" width={width} height={height} rx="18" fill="#efe3d3" />

        {/* tunnels */}
        {placed
          .filter((p) => p.parent)
          .map((p) => {
            const a = byId.get(p.parent!.id)!;
            const isPruned = pruned.includes(p.cave.id) || p.cave.status === 'pruned';
            const roping = isPruned && p.cave.id === activeId && kind.startsWith('prune') && phase === 'look';
            const mx = a.x + (p.x - a.x) * 0.62;
            const my = a.y + (p.y - a.y) * 0.62;
            return (
              <g key={`t-${p.cave.id}`}>
                <line x1={a.x} y1={a.y + 26} x2={p.x} y2={p.y - 28} stroke="#a8896a" strokeWidth="14" strokeLinecap="round" />
                <line x1={a.x} y1={a.y + 26} x2={p.x} y2={p.y - 28} stroke="#5c4033" strokeWidth="8" strokeLinecap="round" opacity="0.55" />
                <g transform={`translate(${(a.x + p.x) / 2 + (p.cave.took ? -26 : 26)}, ${(a.y + p.y) / 2 - 4})`}>
                  <rect x="-24" y="-10" width="48" height="19" rx="9" fill={p.cave.took ? '#dcfce7' : '#f5f5f4'} stroke={p.cave.took ? '#16a34a' : '#a8a29e'} />
                  <text textAnchor="middle" y="4" fontSize="10" fontWeight="800" fill={p.cave.took ? '#166534' : '#57534e'}>
                    {p.cave.took ? '+' : '−'}
                    {isJobs ? `J${p.cave.decided}` : `🧀${p.cave.decided}`}
                  </text>
                </g>
                {isPruned && !roping && (
                  <g transform={`translate(${mx}, ${my})`}>
                    <g className={p.cave.id === activeId ? 'animate-story-pop' : undefined}>
                      <rect x="-22" y="-5" width="44" height="10" rx="3" fill="#ffffff" stroke="#b91c1c" strokeWidth="1.5" />
                      {[-16, -6, 4, 14].map((dx) => (
                        <rect key={dx} x={dx} y="-5" width="5" height="10" fill="#dc2626" />
                      ))}
                    </g>
                  </g>
                )}
              </g>
            );
          })}

        {/* caves */}
        {placed.map((p) => {
          const c = p.cave;
          const isActive = c.id === activeId && kind !== 'final';
          const isPruned = pruned.includes(c.id) || c.status === 'pruned';
          const isBest = ['best', 'incumbent', 'optimal'].includes(c.status);
          const waiting = c.status === 'queued';
          return (
            <g key={c.id} transform={`translate(${p.x}, ${p.y})`} opacity={isPruned ? 0.5 : 1}>
              {isActive && <circle r="48" fill="#fde68a" opacity="0.55" className="animate-story-ripple" />}
              <rect
                x="-42"
                y="-28"
                width="84"
                height="56"
                rx="24"
                fill={isBest ? '#fef3c7' : '#d6c3a5'}
                stroke={isBest ? GOLD : isActive ? '#ea580c' : '#8b6b4a'}
                strokeWidth={isBest || isActive ? 3.5 : 2}
                strokeDasharray={waiting ? '6 4' : undefined}
              />
              <text x="-20" y="-4" textAnchor="middle" fontSize="15">
                💰
              </text>
              <text x="12" y="-3" textAnchor="middle" fontSize="13" fontWeight="900" fill="#451a03">
                {money(c.loot)}
              </text>
              <text x="-20" y="18" textAnchor="middle" fontSize="13">
                🔮
              </text>
              <text x="12" y="19" textAnchor="middle" fontSize="11" fontWeight="700" fill="#6b21a8">
                ≤{money(c.bound)}
              </text>
              {!isJobs && c.weight !== undefined && c.level > 0 && (
                <text x="0" y="42" textAnchor="middle" fontSize="10" fill="#78716c">
                  {c.weight} kg
                </text>
              )}
              {isBest && (
                <text x="40" y="-22" fontSize="16">
                  🏆
                </text>
              )}
              {isActive && (
                <text x="-48" y="-20" fontSize="18">
                  🧭
                </text>
              )}
              {isPruned && (
                <text x="40" y="-20" fontSize="14">
                  ⛔
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </StoryStage>
  );
};
