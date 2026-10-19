import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { HuffmanNode, leafChars } from '../../algorithms/huffman';

/**
 * 🫙 Huffman coding as a hanging mobile.
 *
 * Every letter is a glass jar holding one marble per appearance, hung from a wooden
 * rail in order of weight. The two lightest mobiles are lifted, tied under a new
 * wooden bar, and the combined mobile glides back into line by its weight. At the end
 * the left string of every bar is "0" and the right one "1", so heavy (frequent)
 * letters hang near the top with short codes. While decoding, a marble rolls down
 * the strings one bit at a time.
 */

type Placed = { node: HuffmanNode; x: number; y: number; parent?: string; side?: '0' | '1'; tree: string; code: string };

const LEVEL = 66;
const RAIL_Y = 22;
const ROOT_Y = 64;
const GAP = 26;

const MARBLES = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5'];

export const HuffmanMobileScene: React.FC<StorySceneProps> = ({ step }) => {
  const st: any = step.state || {};
  const decoding = st.mode === 'decode';
  const forest: HuffmanNode[] = st.forest || [];
  const freqMap: Record<string, number> = st.frequencyMap || {};
  const queue: { id: string }[] = st.queue || [];
  const removed: string[] = st.queueRemoved || [];
  const inserted: string | undefined = st.queueInserted;
  const codeTable: Record<string, string> = st.codeTable || {};
  const title: string = step.title || '';
  const isFinal = !decoding && (step.isFinal || !!st.treeRoot);
  const showCodes = isFinal || decoding;

  // Letters get a stable marble colour, in alphabetical order.
  const letters = [...new Set(forest.map(leafChars).join(''))].sort();
  const colourOf = (ch?: string) => MARBLES[Math.max(0, letters.indexOf(ch ?? '')) % MARBLES.length];

  // ── Order the mobiles along the rail: queue order (lightest first) ──
  const order = queue.length ? queue.map((q) => q.id) : forest.map((t) => t.id);
  const trees = [...forest].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const leafFreqs = (n: HuffmanNode): number[] =>
    n.left || n.right ? [...(n.left ? leafFreqs(n.left) : []), ...(n.right ? leafFreqs(n.right) : [])] : [n.freq];
  const maxFreq = Math.max(1, ...Object.values(freqMap), ...forest.flatMap(leafFreqs));
  const jarR = (f: number) => 13 + 13 * Math.sqrt(f / maxFreq);

  const widthOf = (n: HuffmanNode): number =>
    n.left || n.right ? (n.left ? widthOf(n.left) : 0) + (n.right ? widthOf(n.right) : 0) : 2 * jarR(n.freq) + 16;

  const placed: Placed[] = [];
  const place = (n: HuffmanNode, left: number, y: number, tree: string, parent?: string, side?: '0' | '1', code = ''): number => {
    if (!n.left && !n.right) {
      const x = left + widthOf(n) / 2;
      placed.push({ node: n, x, y, parent, side, tree, code });
      return x;
    }
    const lw = n.left ? widthOf(n.left) : 0;
    const lx = n.left ? place(n.left, left, y + LEVEL, tree, n.id, '0', code + '0') : left;
    const rx = n.right ? place(n.right, left + lw, y + LEVEL, tree, n.id, '1', code + '1') : lx;
    const x = (lx + rx) / 2;
    placed.push({ node: n, x, y, parent, side, tree, code });
    return x;
  };

  let cursor = 20;
  trees.forEach((t) => {
    place(t, cursor, ROOT_Y, t.id);
    cursor += widthOf(t) + GAP;
  });
  const width = Math.max(560, cursor);
  const depthOf = (n: HuffmanNode): number => (n.left || n.right ? 1 + Math.max(n.left ? depthOf(n.left) : 0, n.right ? depthOf(n.right) : 0) : 0);
  const maxDepth = Math.max(0, ...trees.map(depthOf));
  const height = ROOT_Y + maxDepth * LEVEL + 2 * jarR(maxFreq) * 1.2 + (showCodes ? 48 : 24);

  const byId = new Map(placed.map((p) => [p.node.id, p]));
  const lifted = (p: Placed) => removed.includes(p.tree);
  const LIFT = -16;

  // ── Decoding: where the marble is and the path it has taken ──
  const hl: any = step.highlights || {};
  const activeId: string | undefined = hl.activeNodeId;
  const visited: string[] = decoding ? (hl.nodes || []).map(String) : [];
  const marble = decoding && activeId ? byId.get(activeId) : undefined;
  const codec = st.codecStep || {};

  // ── Narration ──
  const name = (id: string) => {
    const t = forest.find((f) => f.id === id);
    return t ? `“${leafChars(t)}”` : '';
  };
  const weight = (id: string) => forest.find((f) => f.id === id)?.freq ?? 0;
  const narration = (() => {
    if (decoding) {
      if (codec.stepType === 'init') return 'Let’s read the secret bits back into letters. A marble starts at the top of the mobile.';
      if (codec.stepType === 'traverse')
        return `Read bit “${st.currentBit}”: the marble rolls down the ${st.currentBit === '0' ? 'left' : 'right'} string.`;
      if (codec.stepType === 'leaf-reached') return `The marble lands in a jar, so we write down its letter. So far: “${st.accumulatedText}”.`;
      if (codec.stepType === 'reset-to-root') return 'Back to the top for the next letter.';
      if (step.isFinal) return `All bits read! The message is “${st.accumulatedText}”. No code is the start of another, so there was never any doubt where a letter ended.`;
      return step.title;
    }
    if (isFinal) {
      return `One big mobile! Left string = 0, right string = 1. Frequent letters hang near the top and get short codes; rare ones hang deep with longer codes. The text now needs ${st.compressedBits} bits instead of ${st.originalBits}.`;
    }
    if (/^Select/.test(title) && removed.length === 2)
      return `Lift the two lightest mobiles: ${name(removed[0])} (weight ${weight(removed[0])}) and ${name(removed[1])} (weight ${weight(removed[1])}).`;
    if (/^Merged/.test(title) && inserted) {
      const t = forest.find((f) => f.id === inserted);
      return `Tie them under one wooden bar. Together they weigh ${t?.left?.freq} + ${t?.right?.freq} = ${t?.freq}, so the new mobile slides into line by its weight.`;
    }
    return `Count the letters of “${st.inputText}”: each letter gets a jar with one marble per appearance. The jars hang in line from lightest to heaviest.`;
  })();

  const status = decoding
    ? `Decoded • ${(st.accumulatedText || '').length} letters`
    : isFinal
    ? `Space saved • ${st.compressionRatio}%`
    : `Mobiles on the rail • ${forest.length}`;

  const renderNode = (p: Placed) => {
    const n = p.node;
    const leaf = !n.left && !n.right;
    const dy = lifted(p) ? LIFT : 0;
    const glow = lifted(p) && p.parent === undefined;
    const isNew = n.id === inserted;
    const onPath = visited.includes(n.id);
    const parent = p.parent ? byId.get(p.parent) : undefined;
    const stringTop = parent ? -LEVEL : RAIL_Y - (p.y + dy);
    const r = jarR(n.freq);
    // A lone letter still needs one bit.
    const leafCode = codeTable[n.char ?? ''] || p.code || '0';

    return (
      <g key={n.id} style={{ transform: `translate(${p.x}px, ${p.y + dy}px)`, transition: 'transform 0.9s ease-in-out' }}>
        {/* string up to the parent's bar or to the rail */}
        <line x1="0" y1={stringTop} x2="0" y2="0" stroke={onPath ? '#f59e0b' : '#78716c'} strokeWidth={onPath ? 3.5 : 1.8} />
        {showCodes && p.side && (
          <g transform={`translate(${p.side === '0' ? -11 : 11}, ${-LEVEL / 2})`}>
            <circle r="9" fill={p.side === '0' ? '#e0f2fe' : '#fef3c7'} stroke={p.side === '0' ? '#0284c7' : '#d97706'} strokeWidth="1.5" />
            <text textAnchor="middle" y="4" fontSize="11" fontWeight="900" fill={p.side === '0' ? '#075985' : '#92400e'}>
              {p.side}
            </text>
          </g>
        )}
        <g className={isNew ? 'animate-story-pop' : undefined}>
          {leaf ? (
            <g>
              {glow && <rect x={-r - 6} y="-2" width={2 * r + 12} height={2.3 * r + 10} rx="10" fill="#fde68a" opacity="0.7" />}
              {/* lid and glass jar */}
              <rect x={-r * 0.7} y="0" width={r * 1.4} height="6" rx="2" fill="#a16207" />
              <rect x={-r} y="6" width={2 * r} height={2.1 * r} rx={r * 0.45} fill="#f0f9ff" fillOpacity="0.85" stroke="#94a3b8" strokeWidth="1.8" />
              {Array.from({ length: Math.min(n.freq, 9) }, (_, k) => {
                const per = 3;
                const mr = Math.max(3, r * 0.26);
                const cx = (k % per - 1) * mr * 2.1;
                const cy = 6 + 2.1 * r - mr - 3 - Math.floor(k / per) * mr * 1.9;
                return <circle key={k} cx={cx} cy={cy} r={mr} fill={colourOf(n.char)} stroke="#ffffff" strokeWidth="0.8" />;
              })}
              <rect x={-r * 0.62} y={6 + r * 0.25} width={r * 1.24} height={r * 0.78} rx="3" fill="#fffbeb" stroke="#d6c3a5" />
              <text textAnchor="middle" y={6 + r * 0.25 + r * 0.6} fontSize={Math.max(11, r * 0.62)} fontWeight="900" fill="#451a03">
                {n.char === ' ' ? '␣' : n.char}
              </text>
              <text textAnchor="middle" y={6 + 2.1 * r + 14} fontSize="10" fontWeight="700" fill="#57534e">
                ×{n.freq}
              </text>
              {showCodes && n.char !== undefined && (
                <g transform={`translate(0, ${6 + 2.1 * r + 30})`}>
                  <rect x={-Math.max(16, leafCode.length * 4 + 8)} y="-10" width={2 * Math.max(16, leafCode.length * 4 + 8)} height="18" rx="5" fill="#ffffff" stroke="#a8a29e" />
                  <text textAnchor="middle" y="3" fontSize="11" fontWeight="800" fill="#1c1917" fontFamily="ui-monospace, monospace">
                    {leafCode}
                  </text>
                </g>
              )}
            </g>
          ) : (
            <g>
              {(() => {
                const lx = n.left ? (byId.get(n.left.id)?.x ?? p.x) - p.x : 0;
                const rx = n.right ? (byId.get(n.right.id)?.x ?? p.x) - p.x : 0;
                return (
                  <>
                    {glow && <rect x={lx - 8} y="-8" width={rx - lx + 16} height="16" rx="8" fill="#fde68a" opacity="0.8" />}
                    <rect x={lx - 4} y="-4" width={rx - lx + 8} height="8" rx="4" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
                  </>
                );
              })()}
              <circle r="5" fill="#78350f" />
              <g transform="translate(0, 16)">
                <rect x="-14" y="-8" width="28" height="15" rx="7" fill="#fef3c7" stroke="#d97706" />
                <text textAnchor="middle" y="3" fontSize="10" fontWeight="800" fill="#78350f">
                  {n.freq}
                </text>
              </g>
            </g>
          )}
        </g>
      </g>
    );
  };

  return (
    <StoryStage
      emoji="🫙"
      title={decoding ? 'Marble Decoder' : 'The Huffman Mobile'}
      subtitle={
        decoding ? 'Each bit tells the marble which string to roll down: 0 = left, 1 = right.' : 'Jar size = how often a letter appears. Always tie the two lightest together.'
      }
      narration={narration}
      status={status}
    >
      {decoding && (
        <div className="flex flex-wrap justify-center gap-0.5 mb-3 font-mono text-sm" aria-label="Bits to read">
          {(st.encodedBits || '').split('').map((b: string, i: number) => (
            <span
              key={i}
              className={`w-5 text-center rounded ${
                i === st.bitIndex ? 'bg-amber-400 text-amber-950 font-black' : i < (st.bitIndex ?? -1) ? 'text-stone-400' : 'text-stone-700 bg-white border border-stone-200'
              }`}
            >
              {b}
            </span>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.25 }} role="img" aria-label="Huffman mobile">
        {/* wooden rail */}
        <rect x="6" y={RAIL_Y - 7} width={width - 12} height="12" rx="6" fill="#a16207" stroke="#78350f" strokeWidth="1.5" />
        {placed.map(renderNode)}
        {marble && (
          <circle
            r="9"
            fill="#dc2626"
            stroke="#ffffff"
            strokeWidth="2.5"
            style={{ transform: `translate(${marble.x}px, ${marble.y - 9}px)`, transition: 'transform 0.7s ease-in' }}
          />
        )}
      </svg>

      {decoding && (
        <p className="mt-3 text-center font-sans text-base text-stone-700">
          Message so far: <strong className="font-mono text-lg text-amber-900 tracking-wider">{st.accumulatedText || '…'}</strong>
        </p>
      )}
    </StoryStage>
  );
};
