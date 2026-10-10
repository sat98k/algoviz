import React from 'react';
import { SEM } from '../../styles/semantics';
import type { KaratsubaDetails } from '../../algorithms/karatsuba';

/** A product once its recursive call has returned; "…" until then. */
const val = (v?: string) => (v !== undefined ? <strong className="text-chalk-100">{v}</strong> : <span className="text-chalk-500">…</span>);

/**
 * Karatsuba at the active call: 4 direct products vs P1, P2, P3; the cross term
 * P3 − P1 − P2 with numbers; and the full combination. Values appear only once known.
 */
export const KaratsubaPanel: React.FC<{ details: KaratsubaDetails; finalProduct?: string }> = ({ details: k, finalProduct }) => {
  if (k.baseProduct !== undefined)
    return (
      <div className="w-full p-4 bg-obsidian-950 border border-hairline">
        <p data-base-case className={`inline-block px-3 py-1.5 font-mono text-sm ${SEM.final.badge}`}>
          Base case · single digit → multiply directly = <strong>{k.baseProduct}</strong>
        </p>
      </div>
    );

  if (k.a === undefined)
    return finalProduct !== undefined ? (
      <div className="w-full p-4 bg-obsidian-950 border border-hairline">
        <p className={`inline-block px-3 py-1.5 font-mono text-base font-bold [overflow-wrap:anywhere] ${SEM.final.badge}`}>X·Y = {finalProduct}</p>
      </div>
    ) : null;

  const m = k.m!;
  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-obsidian-950 border border-hairline font-mono text-sm text-chalk-300">
      {/* Split */}
      <p className="[overflow-wrap:anywhere]">
        <span className="font-sans text-xs text-chalk-400">split at m = {m}: </span>X = {k.a}·10^{m} + {k.b} · Y = {k.c}·10^{m} + {k.d}
      </p>

      {/* 4 products vs 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div data-direct className="p-3 bg-obsidian-900 border border-dashed border-sem-pruned flex flex-col gap-1">
          <span className="font-sans text-xs font-semibold text-sem-pruned-ink">Direct: 4 products</span>
          <span className="text-xs text-chalk-400 [overflow-wrap:anywhere]">X·Y = ac·10^{2 * m} + (ad + bc)·10^{m} + bd</span>
          <ol className="grid grid-cols-2 gap-x-3">
            <li>ac = {k.a}×{k.c}</li>
            <li>ad = {k.a}×{k.d}</li>
            <li>bc = {k.b}×{k.c}</li>
            <li>bd = {k.b}×{k.d}</li>
          </ol>
        </div>
        <div data-karatsuba className={`p-3 flex flex-col gap-1 ${SEM.compare.cell} font-normal`}>
          <span className="font-sans text-xs font-semibold">Karatsuba: 3 products</span>
          <ol className="flex flex-col text-chalk-200 [overflow-wrap:anywhere]">
            <li>P1 = a·c = {k.a}×{k.c} = {val(k.p1)}</li>
            <li>P2 = b·d = {k.b}×{k.d} = {val(k.p2)}</li>
            <li>
              P3 = (a+b)(c+d) = {k.aPlusB}×{k.cPlusD} = {val(k.p3)}
            </li>
          </ol>
        </div>
      </div>

      {/* Cross term */}
      <div data-cross className={`flex flex-col gap-0.5 p-3 border ${k.crossTerm !== undefined ? 'border-sem-formula/60 bg-sem-formula/5' : 'border-hairline bg-obsidian-900'} [overflow-wrap:anywhere]`}>
        <span>
          <span className="text-chalk-400">cross term </span>ad + bc = <strong className="text-sem-formula-ink">P3 − P1 − P2</strong>
          {k.crossTerm !== undefined && (
            <>
              {' '}= {k.p3} − {k.p1} − {k.p2} = <strong className="text-sem-formula-ink text-base">{k.crossTerm}</strong>
            </>
          )}
        </span>
        {k.adCheck !== undefined && k.bcCheck !== undefined && (
          <span className="text-xs text-chalk-400">
            check: {k.a}×{k.d} + {k.b}×{k.c} = {k.adCheck} + {k.bcCheck} = {(BigInt(k.adCheck) + BigInt(k.bcCheck)).toString()} ✓
          </span>
        )}
      </div>

      {/* Combine */}
      <div data-combine className="flex flex-col gap-0.5 [overflow-wrap:anywhere]">
        <span className="text-chalk-400">X·Y = P1·10^{2 * m} + (P3 − P1 − P2)·10^{m} + P2</span>
        {k.finalResult !== undefined && (
          <>
            <span>
              = {k.p1}·10^{2 * m} + {k.crossTerm}·10^{m} + {k.p2}
            </span>
            <span>
              = {k.term1} + {k.term2} + {k.term3}
            </span>
            <span>
              = <strong className={`${SEM.final.text} text-base`}>{k.finalResult}</strong>
            </span>
          </>
        )}
      </div>
    </div>
  );
};
