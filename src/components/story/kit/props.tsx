import React from 'react';
import { PALETTE, tint } from './materials';

/**
 * Small drawn props that stand in for the emoji the old scenes used (🏠 🚚 🚩 🏁 🏛️ 🌀 🏆 🎀 ⭐ 🪙 …).
 * Each is centred on (0, 0) and about `size` units tall, lit from the upper left like the rest
 * of the scene. They take no ids: their shading is flat bands, so they can be used anywhere.
 */

type P = { size?: number; color?: string };

/** A little house: walls, a pitched roof, a door and a lit window. */
export const House: React.FC<P & { roof?: string; lit?: boolean }> = ({ size = 28, color = '#f3e3c3', roof = PALETTE.berry, lit = true }) => {
  const s = size / 28;
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx="0" cy="13" rx="15" ry="3" fill="#3a2414" opacity="0.14" />
      <rect x="-11" y="-3" width="22" height="16" rx="1.5" fill={color} />
      <rect x="2" y="-3" width="9" height="16" fill={tint(color, -0.12)} />
      <path d="M-14 -2 L0 -14 L14 -2 Z" fill={roof} />
      <path d="M0 -14 L14 -2 L7 -2 Z" fill={tint(roof, -0.2)} />
      <rect x="-4" y="5" width="6" height="8" rx="1" fill={tint(roof, -0.35)} />
      <rect x="4.5" y="1" width="5" height="5" rx="1" fill={lit ? PALETTE.goldLight : '#cdd6dd'} />
    </g>
  );
};

/** A delivery van facing right. */
export const Van: React.FC<P> = ({ size = 26, color = PALETTE.sky }) => {
  const s = size / 26;
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx="0" cy="11" rx="16" ry="2.5" fill="#3a2414" opacity="0.16" />
      <rect x="-16" y="-9" width="22" height="17" rx="3" fill={color} />
      <path d="M6 -4 H11 L16 2 V8 H6 Z" fill={tint(color, -0.15)} />
      <path d="M7.5 -2.5 H10.5 L14 1.5 H7.5 Z" fill="#dff1ff" />
      <rect x="-14" y="-7" width="18" height="3" rx="1.5" fill="#ffffff" opacity="0.35" />
      {[-9, 9].map((x) => (
        <g key={x}>
          <circle cx={x} cy="8.5" r="3.6" fill={PALETTE.ink} />
          <circle cx={x} cy="8.5" r="1.4" fill="#c9c2b2" />
        </g>
      ))}
    </g>
  );
};

/** A pennant on a pole; the pole's foot is at (0, 0). */
export const Flag: React.FC<P & { checkered?: boolean }> = ({ size = 22, color = PALETTE.berry, checkered }) => {
  const s = size / 22;
  return (
    <g transform={`scale(${s})`}>
      <line x1="0" y1="0" x2="0" y2="-22" stroke={PALETTE.walnut} strokeWidth="2.2" strokeLinecap="round" />
      {checkered ? (
        <g>
          <rect x="0" y="-22" width="14" height="10" fill="#ffffff" stroke={PALETTE.ink} strokeWidth="1" />
          {[0, 1].map((r) => [0, 1, 2].map((c) => ((r + c) % 2 === 0 ? <rect key={`${r}${c}`} x={c * 4.67} y={-22 + r * 5} width="4.67" height="5" fill={PALETTE.ink} /> : null)))}
        </g>
      ) : (
        <path d="M0 -22 L15 -17.5 L0 -13 Z" fill={color} />
      )}
    </g>
  );
};

/** A hub: a small civic building with columns. */
export const Hub: React.FC<P> = ({ size = 22, color = '#efe6d6' }) => {
  const s = size / 22;
  return (
    <g transform={`scale(${s})`}>
      <path d="M-11 -4 L0 -11 L11 -4 Z" fill={PALETTE.gold} />
      <rect x="-10" y="-4" width="20" height="2.5" fill={tint(color, -0.15)} />
      {[-7, -2.3, 2.3, 7].map((x) => (
        <rect key={x} x={x - 1.3} y="-1.5" width="2.6" height="9" fill={color} />
      ))}
      <rect x="-11" y="7.5" width="22" height="3" rx="1" fill={tint(color, -0.2)} />
    </g>
  );
};

/** A traveller pin: a little person-shaped marker. */
export const Walker: React.FC<P> = ({ size = 20, color = PALETTE.leaf }) => {
  const s = size / 20;
  return (
    <g transform={`scale(${s})`}>
      <circle cx="0" cy="-7" r="4" fill="#f6d2b4" />
      <path d="M-5 9 V0 Q-5 -3 -2 -3 H2 Q5 -3 5 0 V9 Z" fill={color} />
    </g>
  );
};

/** A swirl marking a loop that keeps getting cheaper (a negative cycle). */
export const Swirl: React.FC<P> = ({ size = 24, color = '#cc2e2e' }) => {
  const s = size / 24;
  return (
    <g transform={`scale(${s})`}>
      <circle r="11" fill={tint(color, 0.82)} />
      <path d="M0 -7 A7 7 0 1 1 -7 0 M-7 0 A4 4 0 1 0 0 -4" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M-9.5 -1.5 L-7 1.5 L-4.5 -1.5" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** A trophy cup. */
export const Trophy: React.FC<P> = ({ size = 22 }) => {
  const s = size / 22;
  return (
    <g transform={`scale(${s})`}>
      <path d="M-7 -10 H7 V-3 A7 7 0 0 1 -7 -3 Z" fill={PALETTE.gold} />
      <path d="M-7 -8 Q-12 -8 -11 -3 Q-10 1 -6 0 M7 -8 Q12 -8 11 -3 Q10 1 6 0" fill="none" stroke={tint(PALETTE.gold, -0.2)} strokeWidth="2" />
      <rect x="-1.5" y="3" width="3" height="4" fill={tint(PALETTE.gold, -0.25)} />
      <rect x="-6" y="7" width="12" height="3.5" rx="1.5" fill={PALETTE.walnut} />
      <path d="M-4.5 -8.5 V-4" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
};

/** A ribbon bow (a finished gift). */
export const Bow: React.FC<P> = ({ size = 22, color = PALETTE.berry }) => {
  const s = size / 22;
  return (
    <g transform={`scale(${s})`}>
      <path d="M0 0 C-6 -9 -13 -6 -11 0 C-13 6 -6 9 0 0 Z" fill={color} />
      <path d="M0 0 C6 -9 13 -6 11 0 C13 6 6 9 0 0 Z" fill={tint(color, -0.12)} />
      <path d="M-1 1 L-5 10 M1 1 L5 10" stroke={tint(color, -0.2)} strokeWidth="2.6" strokeLinecap="round" />
      <circle r="2.8" fill={tint(color, 0.2)} />
    </g>
  );
};

/** A five-point star. */
export const Star: React.FC<P> = ({ size = 18, color = PALETTE.gold }) => {
  const r = size / 2;
  const pts = Array.from({ length: 10 }, (_, k) => {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    const rr = k % 2 === 0 ? r : r * 0.45;
    return `${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`;
  }).join(' ');
  return <polygon points={pts} fill={color} stroke={tint(color, -0.3)} strokeWidth="1" strokeLinejoin="round" />;
};

/** A gold coin seen face on, with an optional value. */
export const Coin: React.FC<P & { value?: React.ReactNode }> = ({ size = 22, color = PALETTE.gold, value }) => {
  const r = size / 2;
  return (
    <g>
      <ellipse cx="0" cy={r + 2} rx={r * 0.9} ry={r * 0.22} fill="#3a2414" opacity="0.15" />
      <circle r={r} fill={tint(color, -0.18)} />
      <circle r={r * 0.82} cy={-r * 0.06} fill={color} />
      <circle r={r * 0.62} cy={-r * 0.06} fill="none" stroke={tint(color, -0.15)} strokeWidth="1" />
      <path d={`M${-r * 0.5} ${-r * 0.45} A${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.2} ${-r * 0.7}`} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {value !== undefined && (
        <text textAnchor="middle" y={r * 0.3} fontSize={Math.max(9, r * 0.9)} fontWeight="900" fill={tint(color, -0.55)} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
          {value}
        </text>
      )}
    </g>
  );
};

/** A glossy ball (beads, marbles, clay), lit from the upper left. */
export const Ball: React.FC<P & { r?: number }> = ({ r = 12, color = PALETTE.sky }) => (
  <g>
    <circle r={r} fill={tint(color, -0.15)} />
    <circle r={r * 0.86} cx={-r * 0.06} cy={-r * 0.08} fill={color} />
    <ellipse cx={-r * 0.35} cy={-r * 0.38} rx={r * 0.32} ry={r * 0.22} fill="#ffffff" opacity="0.55" transform={`rotate(-30 ${-r * 0.35} ${-r * 0.38})`} />
  </g>
);
