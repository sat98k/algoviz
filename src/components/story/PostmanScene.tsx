import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases } from './useAnimPhases';
import { PALETTE, SceneDefs, tint, useSvgIds } from './kit/materials';
import { House, Walker } from './kit/props';
import { useChapter } from './kit/chapter';

/** The post office: a red-roofed building with a letter sign. */
const PostOffice: React.FC = () => (
  <g>
    <ellipse cx="0" cy="13" rx="16" ry="3" fill="#3a2414" opacity="0.14" />
    <rect x="-13" y="-4" width="26" height="17" rx="1.5" fill="#f3e3c3" />
    <rect x="3" y="-4" width="10" height="17" fill="#3a2414" opacity="0.08" />
    <path d="M-15 -3 H15 L12 -10 H-12 Z" fill="#cc2e2e" />
    <rect x="-7" y="-1" width="14" height="9" rx="1.5" fill="#ffffff" stroke={PALETTE.ink} strokeWidth="1" />
    <path d="M-7 -1 L0 4 L7 -1" fill="none" stroke={PALETTE.ink} strokeWidth="1" />
  </g>
);

/**
 * 📮 Travelling Salesman (Held-Karp) as a postman with a stamp card.
 *
 * The postman starts at the post office and must visit every house once and come back.
 * Held-Karp fills a notebook of small answers: "the cheapest way to start at the post
 * office, collect exactly these stamps, and stand at this house". For each page, the
 * postman compares arriving from each possible previous house (dotted trails) and inks
 * the cheapest. Finally the cheapest round trip home is traced in gold.
 */

const W = 640;
const H = 400;
const M = 60;
const GOLD = '#e8a817';

export const PostmanScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const ids = useSvgIds();
  const field = useChapter();
  const st: any = step.state || {};
  const cities: { id: number; label: string; x: number; y: number }[] = st.cities || [];
  const n = cities.length;
  const cost: number[][] = st.costMatrix || [];
  const mask: number = st.currentMask ?? 0;
  const at: number = st.currentCity ?? 0;
  const phaseName: string = st.currentPhase || 'init';
  const cands: { u: number; v: number; subCost: number; edgeCost: number; totalCost: number; isChosen: boolean }[] = st.candidateEdges || [];
  // The gold route only exists once the notebook is read back.
  const tour: { u: number; v: number }[] = ['reconstruct', 'complete'].includes(st.currentPhase) ? st.activeTourEdges || [] : [];
  const dp: Record<string, number | null> = st.dpTable || {};

  const comparing = (phaseName === 'fill' || phaseName === 'close') && cands.length > 0;
  const phases: readonly (readonly [string, number])[] = comparing ? [['compare', 0], ['choose', 0.5]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);

  // Fit the city coordinates into the map.
  const xs = cities.map((c) => c.x);
  const ys = cities.map((c) => c.y);
  const minX = (xs.length ? Math.min(...xs) : 0);
  const maxX = (xs.length ? Math.max(...xs) : 1);
  const minY = (ys.length ? Math.min(...ys) : 0);
  const maxY = (ys.length ? Math.max(...ys) : 1);
  const s = Math.min((W - 2 * M) / (maxX - minX || 1), (H - 2 * M) / (maxY - minY || 1));
  const px = (c: { x: number; y: number }) => ({ x: M + (c.x - minX) * s + ((W - 2 * M) - (maxX - minX) * s) / 2, y: M + (c.y - minY) * s + ((H - 2 * M) - (maxY - minY) * s) / 2 });
  const pos = cities.map(px);

  const inMask = (i: number) => (mask & (1 << i)) !== 0;
  const name = (i: number) => cities[i]?.label ?? `${i}`;
  const stamps = cities.filter((_, i) => inMask(i)).map((c) => c.label);
  const pages = Object.values(dp).filter((v) => v !== null && v !== undefined).length;
  const best = cands.find((c) => c.isChosen);

  const narration = (() => {
    switch (phaseName) {
      case 'init':
        return `The postman starts at the post office ${name(0)}, must visit every house exactly once, and come back. He keeps a notebook of small answers so nothing is worked out twice.`;
      case 'base':
        return `First page of the notebook: standing at the post office with only its stamp costs 0.`;
      case 'fill':
        if (!comparing) return step.title;
        return phase === 'compare'
          ? `Notebook page: start at ${name(0)}, collect the stamps {${stamps.join(', ')}}, and end at ${name(at)}. Which house should he arrive from? Each dotted trail = earlier page + the walk to ${name(at)}.`
          : `Arriving from ${best ? name(best.u) : '?'} is cheapest (${best?.totalCost}). Write it on the page.`;
      case 'close':
        return phase === 'compare'
          ? `All stamps collected! Now walk home to ${name(0)}: which last house makes the whole round trip cheapest?`
          : `Finishing at ${best ? name(best.u) : '?'} and walking home is cheapest: ${best?.totalCost} in total.`;
      case 'reconstruct':
        return 'Read the notebook backwards to recover the best round trip (gold).';
      case 'complete':
        return `The cheapest round trip costs ${st.optimalCost}: ${(st.optimalTour || []).map(name).join(' → ')}.`;
      default:
        return step.title;
    }
  })();

  return (
    <StoryStage
      title="The Postman’s Notebook"
      subtitle="Each notebook page: cheapest way to collect a set of stamps and stand at a house."
      narration={narration}
      status={st.optimalCost !== undefined && phaseName === 'complete' ? `Round trip • ${st.optimalCost}` : `Notebook pages • ${pages}`}
    >
      {/* the stamp card */}
      {(phaseName === 'fill' || phaseName === 'close' || phaseName === 'base') && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 font-sans text-xs">
          <span className="font-bold text-stone-700 mr-1">Stamp card:</span>
          {cities.map((c, i) => (
            <span key={c.id} className={`w-10 h-10 flex flex-col items-center justify-center rounded-full border-2 ${inMask(i) ? 'bg-[#18bc42] border-transparent text-stone-900' : 'bg-[#fbf9f4] border-dashed border-stone-300 text-stone-500'}`}>
              <span className="text-xs font-black">{c.label}</span>
              <span className="text-sm leading-none" aria-hidden>{inMask(i) ? '✓' : '·'}</span>
            </span>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Town map">
        <SceneDefs ids={ids} floor={field.bg} />
        <rect x="0" y="0" width={W} height={H} rx="22" fill={tint(field.bg, 0.84)} />

        {/* faint roads with walking costs */}
        {cities.map((_, i) =>
          cities.map((__, j) =>
            j > i ? (
              <g key={`r-${i}-${j}`}>
                <line x1={pos[i].x} y1={pos[i].y} x2={pos[j].x} y2={pos[j].y} stroke={tint(field.bg, 0.45)} strokeWidth="2.5" strokeDasharray="2 6" strokeLinecap="round" />
                {n <= 5 && (
                  <text x={(pos[i].x + pos[j].x) / 2} y={(pos[i].y + pos[j].y) / 2 - 4} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#6b645a">
                    {cost[i]?.[j]}
                  </text>
                )}
              </g>
            ) : null
          )
        )}

        {/* candidate trails into the current house */}
        {comparing &&
          cands.map((c) => {
            const win = phase === 'choose' && c.isChosen;
            const a = pos[c.u];
            const b = pos[c.v];
            return (
              <g key={`c-${c.u}-${c.v}`} opacity={phase === 'choose' && !c.isChosen ? 0.3 : 1}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={win ? '#0c8030' : '#2457c5'} strokeWidth={win ? 7 : 4} strokeDasharray={win ? undefined : '8 6'} strokeLinecap="round" />
                <g transform={`translate(${a.x * 0.6 + b.x * 0.4}, ${a.y * 0.6 + b.y * 0.4})`}>
                  <rect x="-42" y="-12" width="84" height="24" rx="12" fill={win ? '#dff5e5' : '#fbf9f4'} stroke={win ? '#0c8030' : '#2457c5'} strokeWidth="1.5" />
                  <text textAnchor="middle" y="4.5" fontSize="12" fontWeight="900" fill={PALETTE.ink} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                    {c.subCost}+{c.edgeCost}={c.totalCost}
                  </text>
                </g>
              </g>
            );
          })}

        {/* the final tour */}
        {tour.map((e) => (
          <line key={`tour-${e.u}-${e.v}`} x1={pos[e.u].x} y1={pos[e.u].y} x2={pos[e.v].x} y2={pos[e.v].y} stroke={GOLD} strokeWidth="8" strokeLinecap="round" className="animate-story-pop" />
        ))}

        {/* houses */}
        {cities.map((c, i) => {
          const p = pos[i];
          const here = (phaseName === 'fill' && i === at) || (phaseName === 'close' && i === 0);
          return (
            <g key={c.id} transform={`translate(${p.x}, ${p.y})`}>
              {here && <circle r="32" fill={PALETTE.goldLight} opacity="0.7" />}
              <ellipse cx="0" cy="19" rx="24" ry="6" fill="#3a2414" opacity="0.14" />
              <circle r="24" fill={inMask(i) && phaseName !== 'complete' ? '#dff5e5' : '#fbf9f4'} stroke={here ? '#c4501a' : tint(field.bg, -0.25)} strokeWidth={here ? 4.5 : 2.5} />
              <g transform="translate(0, 2)">{i === 0 ? <PostOffice /> : <House size={26} roof={[PALETTE.berry, PALETTE.sky, PALETTE.leaf][i % 3]} />}</g>
              <g transform="translate(0, 40)">
                <rect x="-14" y="-10" width="28" height="19" rx="9.5" fill={PALETTE.ink} />
                <text textAnchor="middle" y="4.5" fontSize="12.5" fontWeight="900" fill="#f3efe6" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                  {c.label}
                </text>
              </g>
              {here && phaseName === 'fill' && (
                <g transform="translate(28, -16)">
                  <g className="animate-story-bob">
                    <Walker size={22} color={PALETTE.sky} />
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </StoryStage>
  );
};
