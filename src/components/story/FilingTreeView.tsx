import React from 'react';
import type { AvlSnapshot, RotationInfo } from '../../algorithms/lineSegmentIntersection';
import { placeTree, useTweened } from '../visualizers/avlLayout';
import { PALETTE, tint } from './kit/materials';

/**
 * The clipboard's filing tree (the AVL tree) drawn as wooden name tags hanging on strings
 * from a rail. Left branch = lower sticks, right branch = higher sticks. A tag whose two
 * sides get too uneven tips over; a rotation is seen as the tags gliding to new hooks.
 */

interface FilingTreeViewProps {
  tree: AvlSnapshot | null;
  colour: (id: string) => string;
  label: (id?: string) => string;
  phase: string;
  searchPath: string[];
  insertedId?: string;
  rotation?: RotationInfo;
  aboveId?: string | null;
  belowId?: string | null;
  pair?: [string, string];
  found: boolean;
}

const LEVEL = 74;
const TAG_W = 62;
const TAG_H = 32;
const RED = '#cc2e2e';
const BLUE = '#2457c5';
const font = '"Red Hat Display", system-ui, sans-serif';

export const FilingTreeView: React.FC<FilingTreeViewProps> = ({
  tree,
  colour,
  label,
  phase,
  searchPath,
  insertedId,
  rotation,
  aboveId,
  belowId,
  pair,
  found,
}) => {
  const placed = placeTree(tree);
  const n = placed.length;
  const TW = Math.max(340, n * 118);
  const maxDepth = placed.reduce((m, p) => Math.max(m, p.depth), 0);
  const TH = Math.max(150, 74 + (maxDepth + 1) * LEVEL);
  const target: Record<string, { x: number; y: number }> = {};
  for (const p of placed) target[p.node.id] = { x: 50 + ((p.order + 0.5) * (TW - 100)) / Math.max(1, n), y: 58 + p.depth * LEVEL };
  const pos = useTweened(target, 700);
  const at = (id: string) => pos[id] ?? target[id];

  const onPath = new Set<string>();
  for (let i = 0; i + 1 < searchPath.length; i++) onPath.add(`${searchPath[i]}>${searchPath[i + 1]}`);
  const testing = phase === 'check_adj' || phase === 'found';
  const rootPos = tree ? at(tree.id) : null;

  return (
    <div className="w-full rounded-[22px] bg-[#fbf9f4] px-4 pt-3 pb-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-display font-black text-base text-stone-900">The clipboard’s filing tree</p>
        <p className="text-xs text-stone-600">
          ← left branch: lower sticks · right branch: higher sticks →
        </p>
      </div>

      {n === 0 ? (
        <p className="py-8 text-center text-sm italic text-stone-500">No sticks on file yet.</p>
      ) : (
        <svg viewBox={`0 0 ${TW} ${TH}`} className="block w-full mx-auto h-auto overflow-visible" style={{ maxWidth: TW * 1.6 }} role="img" aria-label="Filing tree of the sticks touching the curtain">
          <defs>
            <linearGradient id="ft-tag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fbefd9" />
              <stop offset="1" stopColor="#ecd6b0" />
            </linearGradient>
            <linearGradient id="ft-rail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c08a52" />
              <stop offset="1" stopColor="#8a5a2b" />
            </linearGradient>
            <marker id="ft-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={RED} />
            </marker>
          </defs>

          {/* the rail everything hangs from */}
          <rect x={20} y={6} width={TW - 40} height={10} rx={5} fill="url(#ft-rail)" />
          <rect x={20} y={14} width={TW - 40} height={3} rx={1.5} fill="#3a2414" opacity="0.15" />
          {rootPos && (
            <path
              d={`M ${rootPos.x} 16 L ${rootPos.x} ${rootPos.y - TAG_H / 2}`}
              stroke={searchPath.length > 1 ? PALETTE.gold : '#a8916e'}
              strokeWidth={searchPath.length > 1 ? 3 : 1.8}
              fill="none"
            />
          )}

          {/* strings */}
          {placed.map((p) => {
            if (!p.parent) return null;
            const a = at(p.parent);
            const b = at(p.node.id);
            if (!a || !b) return null;
            const hot = onPath.has(`${p.parent}>${p.node.id}`);
            const y1 = a.y + TAG_H / 2;
            const y2 = b.y - TAG_H / 2;
            return (
              <path
                key={`s-${p.node.id}`}
                d={`M ${a.x} ${y1} C ${a.x} ${y1 + 22}, ${b.x} ${y2 - 22}, ${b.x} ${y2}`}
                stroke={hot ? PALETTE.gold : '#a8916e'}
                strokeWidth={hot ? 3.2 : 1.8}
                fill="none"
              />
            );
          })}

          {/* the turn being made */}
          {rotation && at(rotation.pivot) && (
            <g transform={`translate(${at(rotation.pivot).x}, ${at(rotation.pivot).y})`}>
              <path
                d={rotation.direction === 'right' ? 'M -40 -12 A 44 44 0 0 1 40 -12' : 'M 40 -12 A 44 44 0 0 0 -40 -12'}
                fill="none"
                stroke={RED}
                strokeWidth="3"
                strokeLinecap="round"
                markerEnd="url(#ft-arrow)"
              />
            </g>
          )}

          {/* tags */}
          {placed.map((p) => {
            const q = at(p.node.id);
            if (!q) return null;
            const id = p.node.id;
            const lopsided = Math.abs(p.node.balance) >= 2;
            // Heavy side tips down: more on the left (balance +2) tips anticlockwise.
            const tilt = lopsided ? (p.node.balance > 0 ? -14 : 14) : 0;
            const inPair = testing && pair?.includes(id);
            const isNew = id === insertedId && phase === 'avl_insert';
            const isRiser = rotation?.riser === id;
            const isPivot = rotation?.pivot === id;
            const neighbour = aboveId === id ? 'above' : belowId === id ? 'below' : null;
            const glow = lopsided || isPivot ? RED : inPair ? (found ? RED : PALETTE.gold) : isRiser ? '#12803a' : neighbour ? BLUE : isNew ? PALETTE.gold : null;
            const note = lopsided
              ? 'lopsided!'
              : isPivot
              ? 'turns down'
              : isRiser
              ? 'moves up'
              : inPair
              ? found
                ? 'they cross!'
                : 'checking'
              : neighbour === 'above'
              ? '▲ just above'
              : neighbour === 'below'
              ? '▼ just below'
              : isNew
              ? 'new tag'
              : null;
            return (
              <g key={id} transform={`translate(${q.x}, ${q.y})`}>
                <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: `0px ${-TAG_H / 2}px`, transition: 'transform 0.6s var(--ease-move)' }}>
                  <g className={isNew ? 'animate-story-pop' : undefined}>
                    {glow && <rect x={-TAG_W / 2 - 6} y={-TAG_H / 2 - 6} width={TAG_W + 12} height={TAG_H + 12} rx={14} fill={glow} opacity="0.22" />}
                    <rect x={-TAG_W / 2} y={-TAG_H / 2 + 3} width={TAG_W} height={TAG_H} rx={9} fill="#3a2414" opacity="0.14" />
                    <rect x={-TAG_W / 2} y={-TAG_H / 2} width={TAG_W} height={TAG_H} rx={9} fill="url(#ft-tag)" stroke={glow ?? tint('#ecd6b0', -0.25)} strokeWidth={glow ? 2.5 : 1.2} />
                    <rect x={-TAG_W / 2 + 7} y={-4} width={16} height={8} rx={4} fill={colour(id)} />
                    <circle cx={0} cy={-TAG_H / 2 + 5} r={2.6} fill="#8a5a2b" />
                    <text x={8} y={6} textAnchor="middle" fontSize="15" fontWeight="900" fill="#2a1a0e" style={{ fontFamily: font }}>
                      {label(id)}
                    </text>
                  </g>
                </g>
                {note && (
                  <text
                    y={TAG_H / 2 + 17}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="800"
                    fill={glow === BLUE ? BLUE : glow === '#12803a' ? '#12803a' : glow === PALETTE.gold ? tint(PALETTE.gold, -0.45) : RED}
                    style={{ fontFamily: font }}
                  >
                    {note}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};
