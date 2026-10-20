import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';

/**
 * 👷 Karatsuba as a workshop with three helpers instead of four.
 *
 * Each big number is a strip of digit tiles. A knife cuts both strips into a high half
 * and a low half. Ordinary school multiplication would need four helpers (a·c, a·d, b·c,
 * b·d); Karatsuba gets away with three, so the fourth chair stays empty. The three
 * answers are then slid left by place value (extra zero tiles) and added up in columns.
 */

const HIGH = '#fde68a';
const LOW = '#bae6fd';

const Digits: React.FC<{ value: string; tone?: string; zeros?: number; label?: string }> = ({ value, tone = '#fffaf0', zeros = 0, label }) => (
  <span className="inline-flex items-center gap-1">
    {label && <span className="mr-1 text-xs font-bold text-stone-500">{label}</span>}
    {value.split('').map((d, i) => (
      <span key={i} className="w-7 h-8 flex items-center justify-center rounded-md border border-stone-400 font-mono text-base font-black text-stone-900 shadow-sm" style={{ background: tone }}>
        {d}
      </span>
    ))}
    {Array.from({ length: zeros }, (_, i) => (
      <span key={`z${i}`} className="w-7 h-8 flex items-center justify-center rounded-md border border-dashed border-stone-300 font-mono text-base font-bold text-stone-400 bg-white animate-story-pop">
        0
      </span>
    ))}
  </span>
);

export const HelpersWorkshopScene: React.FC<StorySceneProps> = ({ step }) => {
  const st: any = step.state || {};
  const d = st.karatsubaDetails || {};
  const title: string = step.title || '';
  // The numbers being multiplied right now come from the active call's label, "X × Y".
  const activeLabel: string = (st.treeNodes || []).find((n: any) => n.id === st.activeNodeId)?.label ?? '';
  const [lx, ly] = activeLabel.split(' × ');
  const X: string = st.currentX ?? lx ?? st.num1 ?? '';
  const Y: string = st.currentY ?? ly ?? st.num2 ?? '';
  const nodes: { id: string; parentId?: string; label: string }[] = st.treeNodes || [];
  const m: number | undefined = d.m;

  // Breadcrumb from the original problem down to the one being worked on.
  const trail: string[] = [];
  let cur = nodes.find((n) => n.id === st.activeNodeId);
  for (let guard = 0; cur && guard < 20; guard++) {
    trail.unshift(cur.label);
    cur = cur.parentId ? nodes.find((n) => n.id === cur!.parentId) : undefined;
  }

  const kind = (() => {
    if (step.isFinal) return 'final';
    if (/^Base Case/.test(title)) return 'base';
    if (/^Recursive Call/.test(title)) return 'call';
    if (/^Step 1/.test(title)) return 'split';
    if (/^Step 2A/.test(title)) return 'p1';
    if (/^Step 2B/.test(title)) return 'p2';
    if (/^Step 2C/.test(title)) return 'p3';
    if (/^Step 3/.test(title)) return 'cross';
    if (/^Step 4/.test(title)) return 'combine';
    return 'intro';
  })();

  const split = m !== undefined && d.a !== undefined;
  const cut = (s: string) => (m !== undefined && s.length > m ? [s.slice(0, s.length - m), s.slice(s.length - m)] : [s, '']);
  const [xh, xl] = cut(X);
  const [yh, yl] = cut(Y);

  const chairs = [
    { key: 'p1', who: 'a × c', job: `${d.a} × ${d.c}`, result: d.p1 },
    { key: 'p2', who: 'b × d', job: `${d.b} × ${d.d}`, result: d.p2 },
    { key: 'p3', who: '(a+b) × (c+d)', job: `${d.aPlusB} × ${d.cPlusD}`, result: d.p3 },
  ];

  const narration = (() => {
    switch (kind) {
      case 'call':
        return trail.length > 1
          ? `A helper takes a smaller job: ${X} × ${Y}. It runs the very same recipe.`
          : `Let’s multiply ${X} × ${Y}. Instead of the long school method, we split the numbers and hand the pieces to helpers.`;
      case 'base':
        return `Single digits are easy: multiply directly. ${X} × ${Y} = ${d.baseProduct ?? ''}. Hand the answer back.`;
      case 'split':
        return `Cut both numbers ${m} digit${m === 1 ? '' : 's'} from the right: high parts a = ${d.a}, c = ${d.c} (yellow) and low parts b = ${d.b}, d = ${d.d} (blue).`;
      case 'p1':
        return `Helper 1 multiplies the high parts: ${d.a} × ${d.c}.`;
      case 'p2':
        return `Helper 2 multiplies the low parts: ${d.b} × ${d.d}.`;
      case 'p3':
        return `Helper 3 adds first, then multiplies once: (${d.a}+${d.b}) × (${d.c}+${d.d}) = ${d.aPlusB} × ${d.cPlusD}. This one answer secretly contains both middle products!`;
      case 'cross':
        return `Take helper 3’s answer and remove the other two: ${d.p3} − ${d.p1} − ${d.p2} = ${d.crossTerm}. That is the middle part, found without a fourth helper.`;
      case 'combine':
        return `Slide each answer left by its place value (add zeros), then add the columns: ${d.finalResult}.`;
      case 'final':
        return `Done: ${st.num1} × ${st.num2} = ${d.finalResult ?? nodes[0]?.label ?? ''}. Every split needed only three helpers instead of four, which adds up to big savings for long numbers.`;
      default:
        return step.title;
    }
  })();

  const finalAnswer = step.isFinal ? (step.result as any)?.product ?? d.finalResult : undefined;

  return (
    <StoryStage
      emoji="👷"
      title="Three Helpers, Not Four"
      subtitle="Split the numbers, let three helpers multiply the pieces, then put the answers back together."
      narration={narration}
      status={kind === 'final' ? 'Multiplication done' : `Depth • ${Math.max(0, trail.length - 1)}`}
    >
      <div className="flex flex-col items-center gap-5 font-sans">
        {trail.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-stone-500">
            {trail.map((t, i) => (
              <span key={i} className={`px-2 py-0.5 rounded-full border ${i === trail.length - 1 ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold' : 'bg-white border-stone-200'}`}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* the two numbers, cut into halves once split */}
        {kind !== 'final' && (
          <div className="flex flex-col items-center gap-2">
            {[
              [X, xh, xl, 'X'],
              [Y, yh, yl, 'Y'],
            ].map(([whole, hi, lo, name]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-5 text-sm font-black text-stone-500">{name}</span>
                {split && kind !== 'call' && kind !== 'base' ? (
                  <>
                    <Digits value={hi} tone={HIGH} />
                    <span className="text-lg" aria-hidden>
                      🔪
                    </span>
                    <Digits value={lo} tone={LOW} />
                  </>
                ) : (
                  <Digits value={whole} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* the workshop: three busy chairs and one empty */}
        {split && kind !== 'call' && kind !== 'base' && kind !== 'final' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
            {chairs.map((c) => {
              const busy = kind === c.key;
              return (
                <div key={c.key} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 ${busy ? 'border-amber-500 bg-amber-50 animate-story-pop' : 'border-stone-200 bg-white'}`}>
                  <span className="text-3xl">{busy ? '👷' : c.result ? '✅' : '🪑'}</span>
                  <span className="text-xs font-bold text-stone-600">{c.who}</span>
                  <span className="font-mono text-sm text-stone-800">{c.job}</span>
                  {c.result && <span className="font-mono text-base font-black text-green-800">= {c.result}</span>}
                </div>
              );
            })}
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-dashed border-green-400 bg-green-50">
              <span className="text-3xl opacity-60">🪑</span>
              <span className="text-xs font-bold text-green-800">4th helper</span>
              <span className="text-xs text-green-700 text-center">not needed! 🎉</span>
            </div>
          </div>
        )}

        {kind === 'cross' && (
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-base">
            <span className="px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-400 font-black">{d.p3}</span>
            <span>−</span>
            <span className="px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-300">{d.p1}</span>
            <span>−</span>
            <span className="px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-300">{d.p2}</span>
            <span>=</span>
            <span className="px-3 py-1.5 rounded-lg bg-green-100 border border-green-500 font-black animate-story-pop">{d.crossTerm}</span>
            <span className="text-xs font-sans text-stone-500">(= a·d + b·c)</span>
          </div>
        )}

        {kind === 'combine' && m !== undefined && (
          <div className="flex flex-col items-end gap-1.5 p-4 rounded-xl bg-white border border-stone-200">
            <Digits value={String(d.p1)} tone={HIGH} zeros={2 * m} />
            <Digits value={String(d.crossTerm)} tone="#dcfce7" zeros={m} label="+" />
            <Digits value={String(d.p2)} tone={LOW} label="+" />
            <div className="w-full border-t-2 border-stone-700 my-1" />
            <Digits value={String(d.finalResult)} tone="#fef3c7" />
          </div>
        )}

        {kind === 'base' && (
          <div className="flex items-center gap-3 text-2xl">
            <span>🧮</span>
            <span className="font-mono font-black text-stone-800">
              {X} × {Y} = {d.baseProduct}
            </span>
          </div>
        )}

        {kind === 'final' && (
          <div className="flex flex-col items-center gap-2 animate-story-pop">
            <span className="font-mono text-lg text-stone-600">
              {st.num1} × {st.num2} =
            </span>
            <Digits value={String(finalAnswer ?? '')} tone="#fef3c7" />
          </div>
        )}
      </div>
    </StoryStage>
  );
};
