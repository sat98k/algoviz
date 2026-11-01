import React from 'react';
import { PALETTE, tint } from './materials';

/**
 * Pipes, tanks and water in the scenes' lit style. A pipe is drawn as layered strokes along its
 * path: a soft shadow on the ground, a dark rim, the metal body, a highlight along its upper side
 * and, inside, the water core with a lighter stream and moving flow marks.
 */

export const WATER = { light: '#8fd0ff', mid: '#2f8fe0', deep: '#1a62b3', foam: '#e9f6ff' };
export const METAL = { rim: '#4a5560', body: '#9aa8b4', light: '#dfe6ec' };

export const PlumbingDefs: React.FC<{ ids: string }> = ({ ids }) => (
  <defs>
    <linearGradient id={`${ids}-glass`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#c9d6df" />
      <stop offset="0.18" stopColor="#f4f8fb" />
      <stop offset="0.5" stopColor="#e3ebf1" />
      <stop offset="1" stopColor="#aebdc9" />
    </linearGradient>
    <linearGradient id={`${ids}-water`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={WATER.deep} />
      <stop offset="0.25" stopColor={WATER.mid} />
      <stop offset="0.55" stopColor="#4aa5ee" />
      <stop offset="1" stopColor={WATER.deep} />
    </linearGradient>
    <radialGradient id={`${ids}-drop`} cx="0.35" cy="0.4" r="0.7">
      <stop offset="0" stopColor={WATER.foam} />
      <stop offset="0.35" stopColor={WATER.light} />
      <stop offset="1" stopColor={WATER.deep} />
    </radialGradient>
    <linearGradient id={`${ids}-brick`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#e9877a" />
      <stop offset="1" stopColor="#c45a4c" />
    </linearGradient>
  </defs>
);

interface PipeProps {
  d: string;
  /** Outer width of the pipe. */
  casing: number;
  /** Width of the water inside (0 = empty). */
  water: number;
  /** A gold halo: the pipe the step is about. */
  glow?: 'strong' | 'soft';
  /** A pale blue halo: water is being poured through it right now. */
  pouring?: boolean;
}

export const Pipe: React.FC<PipeProps> = ({ d, casing, water, glow, pouring }) => (
  <g>
    <path d={d} fill="none" stroke="#3a2414" strokeOpacity="0.12" strokeWidth={casing + 6} strokeLinecap="round" transform="translate(0, 5)" />
    {glow && <path d={d} fill="none" stroke={PALETTE.gold} strokeWidth={casing + (glow === 'strong' ? 14 : 9)} strokeLinecap="round" opacity={glow === 'strong' ? 0.85 : 0.55} />}
    {pouring && <path d={d} fill="none" stroke={WATER.light} strokeWidth={casing + 12} strokeLinecap="round" opacity="0.7" />}
    <path d={d} fill="none" stroke={METAL.rim} strokeWidth={casing + 3} strokeLinecap="round" />
    <path d={d} fill="none" stroke={METAL.body} strokeWidth={casing} strokeLinecap="round" />
    <path d={d} fill="none" stroke={METAL.light} strokeOpacity="0.85" strokeWidth={Math.max(1.5, casing * 0.22)} strokeLinecap="round" transform={`translate(0, ${-casing * 0.24})`} />
    <path d={d} fill="none" stroke={WATER.deep} strokeWidth={water} strokeLinecap="round" style={{ transition: 'stroke-width 0.9s var(--ease-move)' }} />
    <path d={d} fill="none" stroke={WATER.mid} strokeWidth={water * 0.62} strokeLinecap="round" style={{ transition: 'stroke-width 0.9s var(--ease-move)' }} />
    {water > 0 && (
      <path d={d} fill="none" stroke={WATER.foam} strokeOpacity="0.75" strokeWidth={Math.max(1, water * 0.22)} strokeLinecap="round" strokeDasharray="6 12" className="animate-flow-dash" />
    )}
  </g>
);

/** A coupling ring across a pipe at a point, turned to the pipe's direction. */
export const Coupling: React.FC<{ x: number; y: number; angle: number; casing: number }> = ({ x, y, angle, casing }) => (
  <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
    <rect x="-3.5" y={-casing / 2 - 3} width="7" height={casing + 6} rx="2.5" fill={METAL.rim} />
    <rect x="-2" y={-casing / 2 - 2} width="2.5" height={casing + 4} rx="1" fill={METAL.light} opacity="0.7" />
  </g>
);

/** A glossy water drop centred on (0, 0). */
export const Drop: React.FC<{ ids: string; scale?: number; deep?: boolean }> = ({ ids, scale = 1, deep }) => (
  <g transform={`scale(${scale})`}>
    <ellipse cx="0" cy="12" rx="6" ry="1.8" fill="#3a2414" opacity="0.12" />
    <path d="M0,-12 C6,-4 9,0 9,4.5 A9,9 0 0 1 -9,4.5 C-9,0 -6,-4 0,-12 Z" fill={deep ? WATER.deep : `url(#${ids}-drop)`} stroke="#ffffff" strokeWidth="1.6" />
    <ellipse cx="-3" cy="2" rx="2.2" ry="3.4" fill="#ffffff" opacity="0.7" />
  </g>
);

interface TankProps {
  ids: string;
  w: number;
  h: number;
  /** 0 to 1. */
  level: number;
  label: React.ReactNode;
  /** Ring colour: the tank working (gold) or receiving (water blue). */
  ring?: string;
}

/** A glass tank seen slightly from above, centred on (0, 0), with its water at `level`. */
export const Tank: React.FC<TankProps> = ({ ids, w, h, level, label, ring }) => {
  const rx = w / 2;
  const ry = Math.max(4, w * 0.13);
  const top = -h / 2;
  const bottom = h / 2;
  const waterTop = bottom - (h - 4) * Math.max(0, Math.min(1, level));
  return (
    <g>
      <ellipse cx="0" cy={bottom + 6} rx={rx + 6} ry={ry * 0.9} fill="#3a2414" opacity="0.14" />
      {ring && <rect x={-rx - 6} y={top - ry - 6} width={w + 12} height={h + ry * 2 + 12} rx={ry + 10} fill="none" stroke={ring} strokeWidth="4" />}
      <path d={`M${-rx} ${top} V${bottom} A${rx} ${ry} 0 0 0 ${rx} ${bottom} V${top} Z`} fill={`url(#${ids}-glass)`} stroke={METAL.rim} strokeWidth="2" />
      {level > 0 && (
        <g style={{ transition: 'transform 0.8s var(--ease-move)' }}>
          <path d={`M${-rx + 2.5} ${waterTop} V${bottom} A${rx - 2.5} ${ry - 1} 0 0 0 ${rx - 2.5} ${bottom} V${waterTop} Z`} fill={`url(#${ids}-water)`} style={{ transition: 'd 0.8s var(--ease-move)' }} />
          <ellipse cx="0" cy={waterTop} rx={rx - 2.5} ry={ry - 1} fill={WATER.light} opacity="0.9" style={{ transition: 'cy 0.8s var(--ease-move)' }} />
        </g>
      )}
      <ellipse cx="0" cy={top} rx={rx} ry={ry} fill={tint('#c9d6df', 0.3)} stroke={METAL.rim} strokeWidth="2" />
      <ellipse cx="0" cy={top} rx={rx - 4} ry={ry - 2} fill="#8fa2b1" opacity="0.5" />
      <rect x={-rx + 5} y={top + 4} width="4" height={h - 8} rx="2" fill="#ffffff" opacity="0.55" />
      <g transform={`translate(0, ${(top + bottom) / 2 + 5})`}>
        <circle r="11" cy="-5" fill="#ffffff" opacity="0.92" />
        <text textAnchor="middle" fontSize="13" fontWeight="900" fill={PALETTE.ink} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
          {label}
        </text>
      </g>
    </g>
  );
};

/** The source: a water tower on legs with a domed lid, centred on its tank. */
export const WaterTower: React.FC<{ ids: string; label: React.ReactNode }> = ({ ids, label }) => (
  <g>
    <ellipse cx="0" cy="58" rx="30" ry="6" fill="#3a2414" opacity="0.14" />
    {[-1, 1].map((s) => (
      <path key={s} d={`M${s * 16} 20 L${s * 24} 56`} stroke={PALETTE.walnut} strokeWidth="5" strokeLinecap="round" />
    ))}
    <path d="M-20 38 H20" stroke={PALETTE.walnut} strokeWidth="3" strokeLinecap="round" />
    <Tank ids={ids} w={58} h={40} level={0.85} label={label} />
    <path d="M-32 -24 Q0 -50 32 -24 Z" fill={PALETTE.berry} stroke={tint(PALETTE.berry, -0.35)} strokeWidth="2" />
    <circle cx="0" cy="-40" r="3.5" fill={PALETTE.gold} />
  </g>
);

/** The sink: a small city skyline above a basin that fills with `level`. */
export const CityBasin: React.FC<{ ids: string; level: number; label: React.ReactNode }> = ({ ids, level, label }) => (
  <g>
    <g transform="translate(0, -26)">
      <rect x="-28" y="-30" width="16" height="30" rx="2" fill={`url(#${ids}-brick)`} />
      <rect x="-10" y="-44" width="18" height="44" rx="2" fill={tint(PALETTE.sky, 0.15)} />
      <rect x="10" y="-24" width="18" height="24" rx="2" fill={tint(PALETTE.leaf, 0.2)} />
      {[-36, -26, -16, -6].map((y) => (
        <rect key={y} x="-6" y={y} width="10" height="4" rx="1" fill="#ffffff" opacity="0.65" />
      ))}
      {[-24, -14].map((y) => (
        <rect key={y} x="-25" y={y} width="10" height="4" rx="1" fill="#ffffff" opacity="0.6" />
      ))}
    </g>
    <Tank ids={ids} w={62} h={38} level={level} label={label} />
  </g>
);

/** A rounded tag with a pill shape, for capacities and notes. */
export const PillTag: React.FC<{ w: number; h?: number; fill: string; stroke: string; children: React.ReactNode }> = ({ w, h = 22, fill, stroke, children }) => (
  <g>
    <rect x={-w / 2} y={-h / 2 + 2} width={w} height={h} rx={h / 2} fill="#3a2414" opacity="0.1" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth="1.5" />
    {children}
  </g>
);
