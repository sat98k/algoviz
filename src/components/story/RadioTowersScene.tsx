import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { PALETTE, SceneDefs, tint, useSvgIds } from './kit/materials';
import { House } from './kit/props';
import { useChapter } from './kit/chapter';

/**
 * 📡 Set Cover (greedy) as radio towers covering houses.
 *
 * Every house needs radio signal. Each tower reaches a fixed group of houses. Greedy
 * plan: switch on the tower that would light up the MOST houses still in the dark,
 * light them, and repeat until every house has signal.
 */

const TOWER_COLOURS = ['#d9573f', '#3f78b5', '#4f8a3c', '#e3a32b', '#8a5aa8', '#d4688c', '#2f9488', '#e07b39'];
const F = { fontFamily: '"Red Hat Display", system-ui, sans-serif' };

/** A lattice radio mast with a beacon; its foot is at (0, 0). */
const Mast: React.FC<{ color: string; on: boolean }> = ({ color, on }) => (
  <g>
    <ellipse cx="0" cy="2" rx="22" ry="5" fill="#3a2414" opacity="0.14" />
    <path d="M-16 0 L0 -86 L16 0" fill="none" stroke={on ? PALETTE.ink : '#a39b8c'} strokeWidth="3" strokeLinejoin="round" />
    {[-70, -52, -34, -16].map((y, k) => {
      const w = 16 * (1 - (-y) / 86);
      return <path key={k} d={`M${-w} ${y} L${w} ${y + 14} M${w} ${y} L${-w} ${y + 14}`} stroke={on ? '#5c554c' : '#c9c0ae'} strokeWidth="1.4" />;
    })}
    <circle cy="-90" r="7" fill={on ? color : '#d9d1c1'} stroke={on ? tint(color, -0.35) : '#a39b8c'} strokeWidth="1.6" />
    {on && <circle cy="-92" r="2.4" fill="#ffffff" opacity="0.8" />}
  </g>
);

export const RadioTowersScene: React.FC<StorySceneProps> = ({ step }) => {
  const ids = useSvgIds();
  const field = useChapter();
  const st: any = step.state || {};
  const houses: number[] = st.universe || [];
  const towers: { id: string; label: string; elements: number[]; uncoveredCount: number }[] = st.subsets || [];
  const covered: number[] = st.coveredElements || [];
  const chosen: string[] = st.selectedSubsets || [];
  const picked = st.currentPickedSubset as { id: string; label: string; elements: number[] } | undefined;
  const fresh: number[] = st.newlyCoveredElements || [];
  const phase: string = st.phase || 'init';

  const colourOf = (id: string) => TOWER_COLOURS[Math.max(0, towers.findIndex((t) => t.id === id)) % TOWER_COLOURS.length];
  const darkCount = (t: { elements: number[] }) => t.elements.filter((e) => !covered.includes(e)).length;
  const coverer = (h: number) => chosen.find((id) => towers.find((t) => t.id === id)?.elements.includes(h));

  const narration = (() => {
    switch (phase) {
      case 'init':
        return `${houses.length} houses need radio signal and there are ${towers.length} towers, each reaching certain houses. Switch on as few towers as possible.`;
      case 'select':
        return `Which tower would light up the most dark houses? ${picked?.label} reaches ${picked ? darkCount(picked) : 0} of them, more than any other. Switch it on!`;
      case 'update':
        return `${fresh.length} more house${fresh.length === 1 ? ' lights' : 's light'} up. ${houses.length - covered.length} still dark.`;
      case 'complete':
        return `Every house has signal using ${chosen.length} tower${chosen.length === 1 ? '' : 's'} (${chosen.join(', ')}). Greedy isn’t always the very best, but it is never too far off.`;
      default:
        return step.title;
    }
  })();

  return (
    <StoryStage
      emoji="📡"
      title="Radio Towers"
      subtitle="Always switch on the tower that lights up the most houses still in the dark."
      narration={narration}
      status={`Houses with signal • ${covered.length} of ${houses.length}`}
    >
      {(() => {
        const W = Math.max(640, towers.length * 112 + 60, houses.length * 66 + 60);
        const TOWER_Y = 150;
        const HOUSE_Y = 330;
        const H = 400;
        const tx = (k: number) => 30 + (W - 60) * ((k + 0.5) / Math.max(1, towers.length));
        const hx = (k: number) => 30 + (W - 60) * ((k + 0.5) / Math.max(1, houses.length));
        return (
          <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Radio towers and houses">
            <SceneDefs ids={ids} floor={field.bg} />
            <rect x="0" y="0" width={W} height={H} rx="22" fill="#f4ede0" />
            <path d={`M0 ${TOWER_Y + 6} Q${W * 0.25} ${TOWER_Y - 30} ${W / 2} ${TOWER_Y + 2} T${W} ${TOWER_Y - 6} V${H} H0 Z`} fill={tint(field.bg, 0.6)} />
            <path d={`M0 ${HOUSE_Y - 6} H${W} V${H - 22} Q${W} ${H} ${W - 22} ${H} H22 Q0 ${H} 0 ${H - 22} Z`} fill={`url(#${ids}-floor)`} />
            {/* signal from the tower being picked to the dark houses it would light */}
            {picked &&
              phase === 'select' &&
              picked.elements.map((h) => {
                const hk = houses.indexOf(h);
                const tk = towers.findIndex((t) => t.id === picked.id);
                if (hk < 0 || tk < 0) return null;
                return <line key={`beam-${h}`} x1={tx(tk)} y1={TOWER_Y - 90} x2={hx(hk)} y2={HOUSE_Y - 26} stroke={colourOf(picked.id)} strokeWidth="2.5" strokeDasharray="4 6" opacity="0.7" className="animate-flow-dash" />;
              })}
            {towers.map((t, k) => {
              const on = chosen.includes(t.id);
              const isPick = picked?.id === t.id && phase === 'select';
              const dark = darkCount(t);
              const c = colourOf(t.id);
              return (
                <g key={t.id} transform={`translate(${tx(k)}, ${TOWER_Y})`}>
                  {(on || isPick) &&
                    [0, 1].map((r) => (
                      <circle key={r} cy="-90" r={18 + r * 14} fill="none" stroke={c} strokeWidth="2.5" opacity={0.6 - r * 0.2} className="animate-story-ripple" style={{ animationDelay: `${r * 0.5}s` }} />
                    ))}
                  <g className={isPick ? 'animate-story-pop' : undefined}>
                    <Mast color={c} on={on || isPick} />
                  </g>
                  <g transform="translate(0, 22)">
                    <rect x="-34" y="-12" width="68" height="24" rx="12" fill={on ? c : isPick ? PALETTE.goldLight : '#fbf9f4'} stroke={on ? tint(c, -0.3) : isPick ? PALETTE.gold : '#cfc6b4'} strokeWidth="1.4" />
                    <text textAnchor="middle" y="5" fontSize="13" fontWeight="900" fill={on ? '#ffffff' : PALETTE.ink} style={F}>
                      {t.label}
                    </text>
                  </g>
                  <text textAnchor="middle" y="52" fontSize="11.5" fontWeight="600" fill="#4a463e">
                    reaches {t.elements.join(', ')}
                  </text>
                  {!on && phase !== 'complete' && (
                    <text textAnchor="middle" y="68" fontSize="12" fontWeight="800" fill="#7a4a00">
                      +{dark} dark
                    </text>
                  )}
                  {on && (
                    <text textAnchor="middle" y="68" fontSize="12" fontWeight="900" fill={tint(c, -0.35)}>
                      ON
                    </text>
                  )}
                </g>
              );
            })}
            {houses.map((h, k) => {
              const lit = covered.includes(h);
              const byPick = picked?.elements.includes(h) && phase === 'select' && !lit;
              const tower = coverer(h);
              const c = tower ? colourOf(tower) : PALETTE.gold;
              return (
                <g key={h} transform={`translate(${hx(k)}, ${HOUSE_Y})`}>
                  {lit && <circle cy="-10" r="22" fill={PALETTE.goldLight} opacity="0.55" />}
                  <g className={fresh.includes(h) && phase === 'update' ? 'animate-story-pop' : undefined}>
                    <House size={34} roof={lit ? c : '#a39b8c'} color={lit ? '#f6e7c8' : '#ddd5c6'} lit={lit} />
                  </g>
                  <text textAnchor="middle" y="34" fontSize="13" fontWeight="900" fill={lit ? tint(c, -0.4) : byPick ? '#7a4a00' : '#5c554c'} style={F}>
                    {h}
                  </text>
                  {byPick && <circle cx="14" cy="-20" r="4" fill={PALETTE.gold} className="animate-story-pop" />}
                </g>
              );
            })}
          </svg>
        );
      })()}
    </StoryStage>
  );
};
