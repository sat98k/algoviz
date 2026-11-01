import React from 'react';

/**
 * The site's narrator drawn flat in the page's colours: a round ink body, a bone belly,
 * big eyes that blink and a yellow beak. `look` turns the pupils toward one side.
 */
export const OwlMascot: React.FC<{ className?: string; look?: 'left' | 'right' | 'ahead'; body?: string; wing?: string }> = ({
  className = '',
  look = 'ahead',
  body = '#1a1a1a',
  wing = '#ed4b44',
}) => {
  const dx = look === 'left' ? -5 : look === 'right' ? 5 : 0;
  return (
    <svg viewBox="0 0 200 220" className={`hc-owl ${className}`} role="img" aria-label="The AlgoViz owl">
      <g className="hc-owl-body">
        {/* ear tufts */}
        <path d="M44 58 L34 10 L82 44 Z" fill={body} />
        <path d="M156 58 L166 10 L118 44 Z" fill={body} />
        {/* body */}
        <ellipse cx="100" cy="122" rx="82" ry="90" fill={body} />
        {/* belly */}
        <ellipse cx="100" cy="150" rx="50" ry="54" fill="#e6e0d2" />
        <path d="M78 140 q8 8 16 0 M106 140 q8 8 16 0 M92 162 q8 8 16 0" stroke="#1a1a1a" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* wings */}
        <path d="M22 118 q-8 50 30 74 q-6 -40 2 -70 Z" fill={wing} />
        <path d="M178 118 q8 50 -30 74 q6 -40 -2 -70 Z" fill={wing} />
        {/* eyes */}
        <g className="hc-owl-eyes">
          <circle cx="68" cy="88" r="30" fill="#fff" />
          <circle cx="132" cy="88" r="30" fill="#fff" />
          <circle cx={68 + dx} cy="90" r="13" fill="#1a1a1a" />
          <circle cx={132 + dx} cy="90" r="13" fill="#1a1a1a" />
          <circle cx={72 + dx} cy="85" r="4" fill="#fff" />
          <circle cx={136 + dx} cy="85" r="4" fill="#fff" />
        </g>
        {/* beak */}
        <path d="M88 112 L112 112 L100 132 Z" fill="#f2c21a" />
      </g>
      {/* feet */}
      <path d="M70 206 h10 v10 h-4 v-6 h-2 v6 h-4 Z M120 206 h10 v10 h-4 v-6 h-2 v6 h-4 Z" fill="#f2c21a" />
    </svg>
  );
};
