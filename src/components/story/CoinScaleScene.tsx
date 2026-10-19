import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';

/**
 * ⚖️ Subset Sum as coins on a balance scale.
 *
 * A gold block of the target weight sits on the left pan. Coins wait on the table in
 * order; for each coin we either drop it onto the right pan (include) or slide it into
 * the skip tray (exclude). If a coin would tip the scale past the target, it bounces
 * back (pruned). If even all the coins still waiting can't reach the target, the branch
 * is given up. Backtracking lifts the last coin back off the pan.
 */

type CoinState = 'table' | 'pan' | 'skipped' | 'trying';

const W = 860;
const H = 380;
const PIVOT = { x: 430, y: 120 };
const ARM = 200;

export const CoinScaleScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const st: any = step.state || {};
  const numbers: number[] = st.numbers || [];
  const target: number = st.targetSum ?? 0;
  const sum: number = st.currentSum ?? 0;
  const included: number[] = st.includedElements || [];
  const index: number = st.currentIndex ?? -1;
  const elem: number | undefined = st.currentElement;
  const title: string = step.title || '';
  const solutions: number[][] = st.allSolutions || [];

  const kind = (() => {
    if (step.isFinal) return 'final';
    if (/^Initialize/.test(title)) return 'intro';
    if (/Achieved|^Solution #/.test(title)) return 'solution';
    if (/Exceeds Target/.test(title)) return 'overflow';
    if (/^Prune: \+.*Insufficient/.test(title)) return 'short-in';
    if (/^Prune: Exclude/.test(title)) return 'short-out';
    if (/^Include/.test(title)) return 'include';
    if (/^Exclude/.test(title)) return 'exclude';
    if (/^Backtrack/.test(title)) return 'undo';
    return 'idle';
  })();

  const phases: readonly (readonly [string, number])[] =
    kind === 'overflow' || kind === 'short-in' ? [['try', 0], ['reject', 0.45]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  // ── Where is each coin? Coins before the deciding index are already decided. ──
  const decidedUpTo = kind === 'include' || kind === 'exclude' ? index : kind === 'solution' || kind === 'final' ? numbers.length - 1 : index - 1;
  const pool = [...included];
  const coinState: CoinState[] = numbers.map((v, i) => {
    if (i <= decidedUpTo) {
      const k = pool.indexOf(v);
      if (k >= 0) {
        pool.splice(k, 1);
        return 'pan';
      }
      return kind === 'solution' || kind === 'final' ? 'table' : 'skipped';
    }
    if (i === index && (kind === 'overflow' || kind === 'short-in') && phase === 'try') return 'trying';
    return 'table';
  });

  const panSum = sum + (coinState.includes('trying') && elem !== undefined ? elem : 0);
  const remainingAfter = numbers.slice(index + 1).reduce((a, b) => a + b, 0);
  const tilt = Math.max(-14, Math.min(14, target > 0 ? ((panSum - target) / target) * 22 : 0));
  const balanced = panSum === target;

  // ── Geometry ──
  const maxV = Math.max(1, ...numbers);
  const coinR = (v: number) => 14 + 12 * Math.sqrt(v / maxV);
  const rad = (tilt * Math.PI) / 180;
  const leftEnd = { x: PIVOT.x - ARM * Math.cos(rad), y: PIVOT.y - ARM * Math.sin(rad) };
  const rightEnd = { x: PIVOT.x + ARM * Math.cos(rad), y: PIVOT.y + ARM * Math.sin(rad) };
  const PAN_DROP = 70;
  const tableY = H - 36;
  // Waiting coins sit left of the stand, six to a row.
  const slot = (i: number) => ({ x: 50 + (i % 6) * 56, y: tableY - 8 - Math.floor(i / 6) * 46 });
  const trayX = W - 150;

  const panCoins = numbers.map((v, i) => ({ v, i })).filter((c) => coinState[c.i] === 'pan' || coinState[c.i] === 'trying');
  const skipped = numbers.map((v, i) => ({ v, i })).filter((c) => coinState[c.i] === 'skipped');

  const coinPos = (i: number): { x: number; y: number } => {
    const s = coinState[i];
    if (s === 'pan' || s === 'trying') {
      const k = panCoins.findIndex((c) => c.i === i);
      return { x: rightEnd.x - 32 + (k % 3) * 32, y: rightEnd.y + PAN_DROP - 12 - Math.floor(k / 3) * 22 };
    }
    if (s === 'skipped') {
      const k = skipped.findIndex((c) => c.i === i);
      return { x: trayX + 18 + (k % 3) * 34, y: tableY - 8 - Math.floor(k / 3) * 30 };
    }
    return slot(i);
  };

  // ── Narration ──
  const narration = (() => {
    switch (kind) {
      case 'intro':
        return `The gold block on the left weighs ${target}. Can we pick some of the coins (${numbers.join(', ')}) so the scale balances exactly? For each coin we decide: on the pan, or into the skip tray.`;
      case 'include':
        return `Drop coin ${elem} onto the pan. The pan now holds ${sum}.`;
      case 'exclude':
        return `Slide coin ${elem} into the skip tray. The pan still holds ${sum}.`;
      case 'overflow':
        return phase === 'try' ? `What if coin ${elem} goes on the pan?` : `Too heavy! ${sum} + ${elem} = ${sum + (elem ?? 0)} tips past ${target}. The coins only get bigger from here, so this whole branch is skipped.`;
      case 'short-in':
        return phase === 'try'
          ? `What if coin ${elem} goes on the pan?`
          : `Even with coin ${elem} and every coin still waiting, the pan could only reach ${sum + (elem ?? 0) + remainingAfter}: not enough for ${target}. Skip this branch.`;
      case 'short-out':
        return `Without coin ${elem}, all the coins still waiting add up to only ${sum} + ${remainingAfter} = ${sum + remainingAfter}: not enough for ${target}. So leaving it out can’t work.`;
      case 'undo':
        return `Nothing below worked with coin ${elem} on the pan, so lift it back off and try leaving it out.`;
      case 'solution':
        return `Balanced! ${included.join(' + ')} = ${target}.`;
      case 'final':
        return solutions.length > 1
          ? `Search finished: ${solutions.length} different groups of coins balance the scale (see the shelf).`
          : st.found
          ? `Found it: ${(st.solutionSubset || included).join(' + ')} = ${target}.`
          : `No group of coins weighs exactly ${target}.`;
      default:
        return step.title;
    }
  })();

  const status = kind === 'final' || kind === 'solution' ? `Balanced groups • ${Math.max(solutions.length, st.found ? 1 : 0)}` : `On the pan • ${sum} of ${target}`;

  return (
    <StoryStage emoji="⚖️" title="Balance the Scale" subtitle="Each coin goes on the pan or into the skip tray. Match the gold block exactly." narration={narration} status={status}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Balance scale">
        {/* table */}
        <rect x="0" y={tableY + 14} width={W} height="22" rx="6" fill="#d9c2a3" />
        <rect x="0" y={tableY + 10} width={W} height="8" rx="4" fill="#efe3d3" />
        {/* skip tray */}
        <rect x={trayX} y={tableY - 34} width="120" height="44" rx="10" fill="#e7e5e4" stroke="#a8a29e" strokeDasharray="5 4" />
        <text x={trayX + 60} y={tableY + 30} textAnchor="middle" fontSize="11" fontWeight="700" fill="#78716c">
          skip tray
        </text>

        {/* stand */}
        <rect x={PIVOT.x - 7} y={PIVOT.y} width="14" height={tableY - PIVOT.y + 12} fill="#a16207" />
        <path d={`M ${PIVOT.x - 46} ${tableY + 12} L ${PIVOT.x + 46} ${tableY + 12} L ${PIVOT.x + 24} ${tableY - 6} L ${PIVOT.x - 24} ${tableY - 6} Z`} fill="#78350f" />
        {/* beam */}
        <line x1={leftEnd.x} y1={leftEnd.y} x2={rightEnd.x} y2={rightEnd.y} stroke="#b45309" strokeWidth="10" strokeLinecap="round" style={{ transition: 'all 0.8s ease-in-out' }} />
        <circle cx={PIVOT.x} cy={PIVOT.y} r="9" fill="#78350f" />
        {balanced && kind !== 'intro' && (
          <text x={PIVOT.x} y={PIVOT.y - 22} textAnchor="middle" fontSize="22" className="animate-story-pop">
            ✨
          </text>
        )}

        {/* pans */}
        {[leftEnd, rightEnd].map((e, k) => (
          <g key={k}>
            <line x1={e.x} y1={e.y} x2={e.x - 44} y2={e.y + PAN_DROP} stroke="#78716c" strokeWidth="1.5" />
            <line x1={e.x} y1={e.y} x2={e.x + 44} y2={e.y + PAN_DROP} stroke="#78716c" strokeWidth="1.5" />
            <path d={`M ${e.x - 56} ${e.y + PAN_DROP} Q ${e.x} ${e.y + PAN_DROP + 26} ${e.x + 56} ${e.y + PAN_DROP} Z`} fill="#fde68a" stroke="#b45309" strokeWidth="2" />
          </g>
        ))}
        {/* gold target block */}
        <g>
          <rect x={leftEnd.x - 32} y={leftEnd.y + PAN_DROP - 44} width="64" height="40" rx="6" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
          <text x={leftEnd.x} y={leftEnd.y + PAN_DROP - 18} textAnchor="middle" fontSize="16" fontWeight="900" fill="#451a03">
            {target}
          </text>
        </g>
        <text x={rightEnd.x} y={rightEnd.y + PAN_DROP + 34} textAnchor="middle" fontSize="12" fontWeight="800" fill={phase === 'reject' ? '#dc2626' : '#57534e'}>
          {phase === 'reject' && kind === 'overflow' ? 'too heavy!' : phase === 'reject' && kind === 'short-in' ? 'can’t reach it' : `pan: ${panSum}`}
        </text>

        {/* coins */}
        {numbers.map((v, i) => {
          const p = coinPos(i);
          const r = coinR(v);
          const s = coinState[i];
          const isNow = i === index && (kind === 'include' || kind === 'exclude' || kind === 'overflow' || kind === 'short-in' || kind === 'short-out' || kind === 'undo');
          return (
            <g key={`coin-${i}`} style={{ transform: `translate(${p.x}px, ${p.y}px) scale(${s === 'pan' || s === 'trying' ? 0.72 : 1})`, transition: 'transform 0.8s ease-in-out', opacity: s === 'skipped' ? 0.55 : 1 }}>
              <g className={s === 'trying' ? 'animate-story-bob' : undefined}>
                <ellipse cx="0" cy={r * 0.25} rx={r} ry={r * 0.82} fill="#a16207" />
                <ellipse cx="0" cy="0" rx={r} ry={r * 0.82} fill={s === 'trying' ? '#fde68a' : '#facc15'} stroke={isNow ? '#ea580c' : '#a16207'} strokeWidth={isNow ? 3 : 1.5} strokeDasharray={s === 'trying' ? '4 3' : undefined} />
                <text textAnchor="middle" y="5" fontSize={Math.max(11, r * 0.7)} fontWeight="900" fill="#713f12">
                  {v}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {solutions.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 font-sans text-xs">
          <span className="self-center font-semibold uppercase tracking-wider text-stone-500">🏆 Balanced groups:</span>
          {solutions.map((s, k) => (
            <span key={k} className={`px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 font-bold text-amber-900 ${k === solutions.length - 1 && kind === 'solution' ? 'animate-story-pop' : ''}`}>
              {s.join(' + ')}
            </span>
          ))}
        </div>
      )}
    </StoryStage>
  );
};
