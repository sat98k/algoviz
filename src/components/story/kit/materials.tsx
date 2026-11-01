import React, { useId } from 'react';

/**
 * The story scenes' shared look: soft daylight from the upper left, so every object is lit the
 * same way. A fill is a vertical gradient (lighter on top, deeper underneath), objects stand on
 * a blurred contact shadow, and small highlights sit on the lit side.
 * Colours stay natural and warm (docs/animation-preferences.md).
 */

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const parse = (hex: string) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const toHex = (rgb: number[]) => `#${rgb.map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;

/** Mixes a colour toward white (amount > 0) or toward a warm near-black (amount < 0). */
export const tint = (hex: string, amount: number) => {
  const rgb = parse(hex);
  const to = amount >= 0 ? [255, 255, 255] : [40, 24, 16];
  const t = Math.abs(amount);
  return toHex(rgb.map((v, i) => v + (to[i] - v) * t));
};

/** Natural colours shared by the scenes. */
export const PALETTE = {
  paper: '#faf7f2',
  wall: '#f4ece0',
  wallLine: '#e9dccb',
  oak: '#e2c9a4',
  oakDeep: '#c9a77a',
  walnut: '#8a5a35',
  ink: '#2b211b',
  gold: '#e8a817',
  goldLight: '#fde68a',
  leaf: '#4f8a3c',
  berry: '#c2413b',
  sky: '#5b8fc7',
  skins: ['#f6d2b4', '#e9b48f', '#c98d63', '#a46a43', '#7a4a2c'],
  hair: ['#3b2618', '#6b3f22', '#1f1a17', '#b0702f', '#d9a441'],
  fabrics: ['#d9573f', '#3f78b5', '#4f8a3c', '#e3a32b', '#8a5aa8', '#d4688c', '#2f9488', '#e07b39', '#5466b8', '#8aa53a'],
};

/** A unique, url()-safe id prefix for one drawing's gradients and filters. */
export const useSvgIds = () => useId().replace(/[^a-zA-Z0-9_-]/g, '');

/** A lit vertical gradient for one colour: `<Lit id=… color=… />` inside `<defs>`, then fill={`url(#id)`}. */
export const Lit: React.FC<{ id: string; color: string; light?: number; dark?: number }> = ({ id, color, light = 0.28, dark = -0.18 }) => (
  <linearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stopColor={tint(color, light)} />
    <stop offset="0.55" stopColor={color} />
    <stop offset="1" stopColor={tint(color, dark)} />
  </linearGradient>
);

/** Shared filters and gradients; put once at the top of a scene's `<svg>`. `floor` is the chapter colour the scene stands on. */
export const SceneDefs: React.FC<{ ids: string; floor?: string }> = ({ ids, floor = PALETTE.oak }) => (
  <defs>
    <radialGradient id={`${ids}-contact`}>
      <stop offset="0" stopColor="#3a2414" stopOpacity="0.32" />
      <stop offset="0.6" stopColor="#3a2414" stopOpacity="0.12" />
      <stop offset="1" stopColor="#3a2414" stopOpacity="0" />
    </radialGradient>
    <filter id={`${ids}-soft`} x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3a2414" floodOpacity="0.18" />
    </filter>
    <linearGradient id={`${ids}-floor`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={tint(floor, 0.12)} />
      <stop offset="1" stopColor={tint(floor, -0.12)} />
    </linearGradient>
    <linearGradient id={`${ids}-wall`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f6f1e7" />
      <stop offset="1" stopColor="#e9e1d1" />
    </linearGradient>
    <linearGradient id={`${ids}-gold`} x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stopColor={PALETTE.goldLight} />
      <stop offset="0.5" stopColor={PALETTE.gold} />
      <stop offset="1" stopColor="#b7791f" />
    </linearGradient>
  </defs>
);

/** A soft shadow on the ground under an object. */
export const ContactShadow: React.FC<{ ids: string; cx?: number; cy: number; rx: number; ry?: number; className?: string }> = ({ ids, cx = 0, cy, rx, ry = rx * 0.22, className }) => (
  <ellipse className={className} cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${ids}-contact)`} />
);

/** A room: a warm wall with a skirting board and a wooden floor seen slightly from above. */
export const Room: React.FC<{ ids: string; width: number; floorY: number; depth?: number; floor?: string }> = ({ ids, width, floorY, depth = 46, floor = PALETTE.oak }) => (
  <g aria-hidden>
    <rect x="0" y="0" width={width} height={floorY} rx="18" fill={`url(#${ids}-wall)`} />
    <rect x="0" y={floorY - 10} width={width} height="10" fill={tint(floor, -0.25)} />
    <path d={`M0 ${floorY} H${width} V${floorY + depth - 14} Q${width} ${floorY + depth} ${width - 14} ${floorY + depth} H14 Q0 ${floorY + depth} 0 ${floorY + depth - 14} Z`} fill={`url(#${ids}-floor)`} />
    {Array.from({ length: Math.ceil(width / 90) }, (_, k) => (
      <line key={k} x1={k * 90 + 30} y1={floorY + 2} x2={k * 90 + 18} y2={floorY + depth - 2} stroke={tint(floor, -0.3)} strokeOpacity="0.3" strokeWidth="1.2" />
    ))}
  </g>
);
