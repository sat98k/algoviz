import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';

/**
 * 📡 Set Cover (greedy) as radio towers covering houses.
 *
 * Every house needs radio signal. Each tower reaches a fixed group of houses. Greedy
 * plan: switch on the tower that would light up the MOST houses still in the dark,
 * light them, and repeat until every house has signal.
 */

const TOWER_COLOURS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];

export const RadioTowersScene: React.FC<StorySceneProps> = ({ step }) => {
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
      <div className="flex flex-col items-center gap-5 font-sans">
        {/* towers */}
        <div className="flex flex-wrap justify-center gap-3">
          {towers.map((t) => {
            const on = chosen.includes(t.id);
            const isPick = picked?.id === t.id && phase === 'select';
            const dark = darkCount(t);
            return (
              <div
                key={t.id}
                className={`flex flex-col items-center gap-1 w-24 p-2 rounded-xl border-2 transition-all ${isPick ? 'border-amber-500 bg-amber-50 animate-story-pop' : on ? 'bg-white' : 'border-stone-200 bg-stone-50 opacity-80'}`}
                style={on && !isPick ? { borderColor: colourOf(t.id) } : undefined}
              >
                <span className={`text-3xl ${on ? '' : 'grayscale opacity-60'}`}>📡</span>
                <span className="text-xs font-black text-stone-800">{t.label}</span>
                <span className="text-[11px] text-stone-500">reaches {t.elements.join(', ')}</span>
                {!on && phase !== 'complete' && <span className="text-[11px] font-bold text-amber-700">+{dark} dark</span>}
                {on && <span className="text-[11px] font-bold" style={{ color: colourOf(t.id) }}>ON</span>}
              </div>
            );
          })}
        </div>

        {/* houses */}
        <div className="flex flex-wrap justify-center gap-2 p-4 rounded-2xl bg-[#1e293b]">
          {houses.map((h) => {
            const lit = covered.includes(h);
            const byPick = picked?.elements.includes(h) && phase === 'select' && !lit;
            const tower = coverer(h);
            return (
              <div key={h} className="flex flex-col items-center gap-0.5 w-12">
                <span className={`text-2xl transition-all duration-700 ${lit ? '' : 'grayscale brightness-50'} ${fresh.includes(h) && phase === 'update' ? 'animate-story-pop' : ''}`}>🏠</span>
                <span className="text-[11px] font-bold" style={{ color: lit ? (tower ? colourOf(tower) : '#fde68a') : byPick ? '#fbbf24' : '#94a3b8' }}>
                  {h}
                  {lit ? ' 💡' : byPick ? ' ✨' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </StoryStage>
  );
};
