import React, { useState } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { PALETTE } from './kit/materials';
import { Person } from './kit/Person';

/** A helper at a workbench (busy), a done tick, or an empty stool, as a small drawing. */
const Station: React.FC<{ state: 'busy' | 'done' | 'empty'; k: number }> = ({ state, k }) => (
  <svg width="64" height="64" viewBox="-32 -60 64 64" aria-hidden>
    <ellipse cx="0" cy="0" rx="26" ry="4" fill="#3a2414" opacity="0.14" />
    {state === 'busy' ? (
      <g>
        <Person height={56} skin={PALETTE.skins[(k * 2 + 1) % 5]} hair={PALETTE.hair[k % 5]} hairStyle={((k * 3) % 5) as 0 | 1 | 2 | 3 | 4} shirt={['#e3a32b', '#3f78b5', '#3e9b4f'][k % 3]} />
        <rect x="-11" y="-36" width="22" height="7" rx="3.5" fill={PALETTE.gold} />
      </g>
    ) : state === 'done' ? (
      <g transform="translate(0, -24)">
        <circle r="17" fill="#0c8030" />
        <path d="M-7 0 L-2 5 L8 -6" stroke="#ffffff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ) : (
      <g>
        <ellipse cx="0" cy="-26" rx="16" ry="5" fill="#a8743f" />
        <path d="M-12 -24 L-14 0 M12 -24 L14 0 M0 -22 V0" stroke="#8a5a35" strokeWidth="3" strokeLinecap="round" />
      </g>
    )}
  </svg>
);
import { KaratsubaTreeView } from './KaratsubaTreeView';

/**
 * 👷 Karatsuba as a workshop with three helpers instead of four.
 *
 * Each big number is a strip of digit tiles. A knife cuts both strips into a high half
 * and a low half. Ordinary school multiplication would need four helpers (a·c, a·d, b·c,
 * b·d); Karatsuba gets away with three, so the fourth chair stays empty. The three
 * answers are then slid left by place value (extra zero tiles) and added up in columns.
 *
 * An optional 🌳 recursion tree view (toggle above the workshop) shows the same steps as the
 * tree of jobs: every job splits into three helpers on the way down, and answers are handed
 * back up and combined.
 */

const VIEW_KEY = 'algoviz.karatsuba.storyView';
const readView = (): 'workshop' | 'tree' => {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'tree' ? 'tree' : 'workshop';
  } catch {
    return 'workshop';
  }
};

const HIGH = '#fde68a';
const LOW = '#bcd3ef';

const Digits: React.FC<{ value: string; tone?: string; zeros?: number; label?: string }> = ({ value, tone = '#fffaf0', zeros = 0, label }) => (
  <span className="inline-flex items-center gap-1">
    {label && <span className="mr-1 text-base font-black text-stone-600">{label}</span>}
    {value.split('').map((d, i) => (
      <span key={i} className="w-8 h-9 flex items-center justify-center rounded-xl font-display text-lg font-black text-stone-900" style={{ background: tone, boxShadow: 'inset 0 -3px 0 rgb(0 0 0 / 0.12)' }}>
        {d}
      </span>
    ))}
    {Array.from({ length: zeros }, (_, i) => (
      <span key={`z${i}`} className="w-8 h-9 flex items-center justify-center rounded-xl border-2 border-dashed border-stone-300 font-display text-lg font-bold text-stone-400 animate-story-pop">
        0
      </span>
    ))}
  </span>
);

export const HelpersWorkshopScene: React.FC<StorySceneProps> = ({ step }) => {
  const [view, setView] = useState<'workshop' | 'tree'>(() => (typeof window === 'undefined' ? 'workshop' : readView()));
  const choose = (v: 'workshop' | 'tree') => {
    setView(v);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {
      // Remembering the view is only a convenience.
    }
  };
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
      title="Three Helpers, Not Four"
      subtitle="Split the numbers, let three helpers multiply the pieces, then put the answers back together."
      narration={narration}
      status={kind === 'final' ? 'Multiplication done' : `Depth • ${Math.max(0, trail.length - 1)}`}
    >
      <div className="flex justify-center mb-3">
        <div className="c-group" role="radiogroup" aria-label="Picture">
          {(
            [
              ['workshop', 'Workshop'],
              ['tree', 'Recursion tree'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              data-workshop-view={v}
              onClick={() => choose(v)}
              className="c-pill"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'tree' ? (
        <KaratsubaTreeView num1={String(st.num1 ?? '')} num2={String(st.num2 ?? '')} nodes={st.treeNodes || []} activeId={st.activeNodeId} title={title} isFinal={!!step.isFinal} stepKey={step.stepIndex} />
      ) : (
      <div className="flex flex-col items-center gap-5 font-sans">
        {trail.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-stone-600">
            {trail.map((t, i) => (
              <span key={i} className={`px-3 py-0.5 rounded-full ${i === trail.length - 1 ? 'bg-[#1a1a1a] text-[#f3efe6] font-bold' : 'bg-[#fbf9f4]'}`}>
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
                <span className="w-6 font-display text-base font-black text-stone-700">{name}</span>
                {split && kind !== 'call' && kind !== 'base' ? (
                  <>
                    <Digits value={hi} tone={HIGH} />
                    <span aria-hidden className="inline-block w-1.5 h-8 rounded-full bg-[#cc2e2e]" />
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
                <div key={c.key} className={`flex flex-col items-center gap-1 p-3 rounded-[20px] ${busy ? 'bg-[#fdf1c7] animate-story-pop' : 'bg-[#fbf9f4]'}`}>
                  <Station state={busy ? 'busy' : c.result ? 'done' : 'empty'} k={chairs.indexOf(c)} />
                  <span className="text-sm font-bold text-stone-700">{c.who}</span>
                  <span className="font-mono text-sm text-stone-800">{c.job}</span>
                  {c.result && <span className="font-mono text-base font-black text-green-800">= {c.result}</span>}
                </div>
              );
            })}
            <div className="flex flex-col items-center gap-1 p-3 rounded-[20px] bg-[#18bc42]">
              <Station state="empty" k={3} />
              <span className="text-sm font-bold text-stone-900">4th helper</span>
              <span className="text-sm font-black text-stone-900 text-center">not needed!</span>
            </div>
          </div>
        )}

        {kind === 'cross' && (
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-base">
            <span className="px-3 py-1.5 rounded-full bg-[#fdf1c7] font-black">{d.p3}</span>
            <span>−</span>
            <span className="px-3 py-1.5 rounded-full bg-[#e3dccd]">{d.p1}</span>
            <span>−</span>
            <span className="px-3 py-1.5 rounded-full bg-[#e3dccd]">{d.p2}</span>
            <span>=</span>
            <span className="px-3 py-1.5 rounded-full bg-[#18bc42] font-black animate-story-pop">{d.crossTerm}</span>
            <span className="text-sm font-sans text-stone-600">(= a·d + b·c)</span>
          </div>
        )}

        {kind === 'combine' && m !== undefined && (
          <div className="flex flex-col items-end gap-1.5 p-5 rounded-[22px] bg-[#fbf9f4]">
            <Digits value={String(d.p1)} tone={HIGH} zeros={2 * m} />
            <Digits value={String(d.crossTerm)} tone="#dcfce7" zeros={m} label="+" />
            <Digits value={String(d.p2)} tone={LOW} label="+" />
            <div className="w-full h-1 rounded-full bg-stone-800 my-1" />
            <Digits value={String(d.finalResult)} tone="#fef3c7" />
          </div>
        )}

        {kind === 'base' && (
          <div className="flex items-center gap-3 text-2xl">
            <span className="font-mono font-black text-stone-800 px-4 py-2 rounded-full bg-[#fbf9f4]">
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
      )}
    </StoryStage>
  );
};
