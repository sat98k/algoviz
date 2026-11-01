import React from 'react';
import { Lit, PALETTE, tint, useSvgIds } from './materials';

export type HairStyle = 0 | 1 | 2 | 3 | 4;

export interface PersonProps {
  /** Full height from the soles to the top of the head, in SVG units. */
  height: number;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  pants?: string;
  /** Printed on the shirt like a team number. */
  number?: React.ReactNode;
  /** Highlight ring around the shirt (the one being measured). */
  outline?: string;
}

/**
 * A person drawn in the scenes' lit, rounded style, standing with the feet at (0, 0).
 * Parts GSAP can move: `.sk-figure` (the whole body, pivoting at the feet), `.sk-arm-l` /
 * `.sk-arm-r` (pivoting at the shoulder) and `.sk-eyes` (for blinking).
 */
export const Person: React.FC<PersonProps> = ({ height, skin, hair, hairStyle, shirt, pants = '#34405a', number, outline }) => {
  const id = useSvgIds();
  const head = Math.max(11, Math.min(17, height * 0.12));
  const legH = height * 0.36;
  const torsoH = height * 0.34;
  const torsoW = Math.max(24, head * 2.05);
  const shoulderY = -legH - torsoH;
  const headY = shoulderY - head * 0.95;
  const armLen = torsoH * 0.92;

  const hairShape = (() => {
    const top = headY - head;
    switch (hairStyle) {
      case 1: // bob
        return <path d={`M${-head * 1.12} ${headY + head * 0.55} C${-head * 1.25} ${top - head * 0.15} ${head * 1.25} ${top - head * 0.15} ${head * 1.12} ${headY + head * 0.55} L${head * 0.8} ${headY + head * 0.5} C${head * 0.85} ${headY - head * 0.3} ${-head * 0.2} ${headY - head * 0.5} ${-head * 0.82} ${headY + head * 0.5} Z`} fill={hair} />;
      case 2: // curly puff
        return (
          <g fill={hair}>
            {[-0.8, -0.35, 0.15, 0.65].map((dx, k) => (
              <circle key={k} cx={dx * head} cy={top + head * (k % 2 ? 0.15 : 0.3)} r={head * 0.52} />
            ))}
            <circle cx={-head * 0.95} cy={headY - head * 0.2} r={head * 0.4} />
            <circle cx={head * 0.95} cy={headY - head * 0.2} r={head * 0.4} />
          </g>
        );
      case 3: // bun
        return (
          <g fill={hair}>
            <circle cx="0" cy={top - head * 0.35} r={head * 0.45} />
            <path d={`M${-head} ${headY - head * 0.05} C${-head} ${top - head * 0.25} ${head} ${top - head * 0.25} ${head} ${headY - head * 0.05} C${head * 0.4} ${headY - head * 0.55} ${-head * 0.4} ${headY - head * 0.55} ${-head} ${headY - head * 0.05} Z`} />
          </g>
        );
      case 4: // side part
        return <path d={`M${-head * 1.02} ${headY} C${-head * 1.1} ${top - head * 0.2} ${head * 1.15} ${top - head * 0.3} ${head * 1.03} ${headY - head * 0.1} C${head * 0.5} ${headY - head * 0.75} ${-head * 0.1} ${headY - head * 0.3} ${-head * 1.02} ${headY} Z`} fill={hair} />;
      default: // short crop
        return <path d={`M${-head * 0.98} ${headY - head * 0.1} C${-head * 0.95} ${top - head * 0.12} ${head * 0.95} ${top - head * 0.12} ${head * 0.98} ${headY - head * 0.1} C${head * 0.6} ${headY - head * 0.62} ${-head * 0.6} ${headY - head * 0.62} ${-head * 0.98} ${headY - head * 0.1} Z`} fill={hair} />;
    }
  })();

  return (
    <g className="sk-figure">
      <defs>
        <Lit id={`${id}-shirt`} color={shirt} />
        <Lit id={`${id}-pants`} color={pants} light={0.18} />
        <radialGradient id={`${id}-skin`} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor={tint(skin, 0.25)} />
          <stop offset="1" stopColor={tint(skin, -0.08)} />
        </radialGradient>
      </defs>

      {/* legs and shoes */}
      <rect x={-torsoW * 0.36} y={-legH - 2} width={torsoW * 0.3} height={legH} rx={torsoW * 0.15} fill={`url(#${id}-pants)`} />
      <rect x={torsoW * 0.06} y={-legH - 2} width={torsoW * 0.3} height={legH} rx={torsoW * 0.15} fill={`url(#${id}-pants)`} />
      <ellipse cx={-torsoW * 0.24} cy="-2.5" rx={torsoW * 0.24} ry="4.5" fill={PALETTE.ink} />
      <ellipse cx={torsoW * 0.24} cy="-2.5" rx={torsoW * 0.24} ry="4.5" fill={PALETTE.ink} />

      {/* arms (behind the torso's edges) */}
      {[-1, 1].map((side) => (
        <g key={side} className={side < 0 ? 'sk-arm-l' : 'sk-arm-r'} style={{ transformBox: 'view-box', transformOrigin: `${side * torsoW * 0.42}px ${shoulderY + 6}px` }}>
          <path d={`M${side * torsoW * 0.42} ${shoulderY + 6} q${side * 7} ${armLen * 0.45} ${side * 4} ${armLen}`} stroke={tint(shirt, -0.08)} strokeWidth={torsoW * 0.26} strokeLinecap="round" fill="none" />
          <circle cx={side * (torsoW * 0.42 + 4)} cy={shoulderY + 6 + armLen + 2} r={torsoW * 0.13} fill={skin} />
        </g>
      ))}

      {/* torso */}
      <path
        d={`M${-torsoW / 2} ${-legH + 2} V${shoulderY + 9} Q${-torsoW / 2} ${shoulderY} ${-torsoW / 2 + 9} ${shoulderY} H${torsoW / 2 - 9} Q${torsoW / 2} ${shoulderY} ${torsoW / 2} ${shoulderY + 9} V${-legH + 2} Z`}
        fill={`url(#${id}-shirt)`}
        stroke={outline ?? 'none'}
        strokeWidth={outline ? 3 : 0}
      />
      <path d={`M${-torsoW / 2 + 5} ${shoulderY + 7} Q${-torsoW / 2 + 3} ${shoulderY + torsoH * 0.45} ${-torsoW / 2 + 5} ${-legH - 2}`} stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {number !== undefined && (
        <>
          <circle cx="0" cy={shoulderY + torsoH * 0.48} r={Math.min(11, torsoW * 0.36)} fill="#ffffff" fillOpacity="0.92" />
          <text x="0" y={shoulderY + torsoH * 0.48 + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill={tint(shirt, -0.45)} style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
            {number}
          </text>
        </>
      )}

      {/* neck, head, face */}
      <rect x={-head * 0.3} y={shoulderY - head * 0.3} width={head * 0.6} height={head * 0.5} rx={head * 0.2} fill={tint(skin, -0.1)} />
      <circle cx={-head * 0.98} cy={headY + head * 0.1} r={head * 0.24} fill={skin} />
      <circle cx={head * 0.98} cy={headY + head * 0.1} r={head * 0.24} fill={skin} />
      <circle cx="0" cy={headY} r={head} fill={`url(#${id}-skin)`} />
      {hairShape}
      <g className="sk-eyes" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <ellipse cx={-head * 0.36} cy={headY + head * 0.05} rx={head * 0.1} ry={head * 0.14} fill={PALETTE.ink} />
        <ellipse cx={head * 0.36} cy={headY + head * 0.05} rx={head * 0.1} ry={head * 0.14} fill={PALETTE.ink} />
      </g>
      <circle cx={-head * 0.58} cy={headY + head * 0.38} r={head * 0.16} fill="#e8846b" fillOpacity="0.35" />
      <circle cx={head * 0.58} cy={headY + head * 0.38} r={head * 0.16} fill="#e8846b" fillOpacity="0.35" />
      <path d={`M${-head * 0.24} ${headY + head * 0.4} Q0 ${headY + head * 0.62} ${head * 0.24} ${headY + head * 0.4}`} stroke={PALETTE.ink} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </g>
  );
};

/** Where the top of a person's head is, relative to the feet (for crowns and measuring lines). */
export const personTop = (height: number) => -(height * 0.7 + Math.max(11, Math.min(17, height * 0.12)) * 1.95);
