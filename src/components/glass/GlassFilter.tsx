import React, { useEffect } from 'react';
import { DISPLACEMENT_MAP } from './displacementMap';

/**
 * The SVG filters behind the site's liquid glass, rendered once at the app root.
 *
 * Every glass surface is frosted with CSS (`backdrop-filter: blur() saturate()`, see home-c.css).
 * In Chromium browsers the same surfaces also refract: `backdrop-filter: url(#lg-…)` pushes the
 * backdrop outward along the rim using liquid-glass-react's displacement map, splitting red, green
 * and blue by slightly different amounts for a faint colour fringe (its "standard" mode). Safari
 * and Firefox do not apply SVG filters to backdrops, so they keep the frost only; nothing else
 * changes. With reduced transparency the glass turns solid (CSS).
 *
 * Two strengths: `lg-strong` for floating bars over moving content, `lg-soft` for panels.
 */
const Refract: React.FC<{ id: string; scale: number }> = ({ id, scale }) => {
  const s = -scale;
  const channel = (k: string, values: string) => <feColorMatrix in={`${k}_D`} type="matrix" values={values} result={`${k}_C`} />;
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feImage href={DISPLACEMENT_MAP} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="MAP" />
      <feDisplacementMap in="SourceGraphic" in2="MAP" scale={s} xChannelSelector="R" yChannelSelector="B" result="R_D" />
      {channel('R', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
      <feDisplacementMap in="SourceGraphic" in2="MAP" scale={s * 1.05} xChannelSelector="R" yChannelSelector="B" result="G_D" />
      {channel('G', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
      <feDisplacementMap in="SourceGraphic" in2="MAP" scale={s * 1.1} xChannelSelector="R" yChannelSelector="B" result="B_D" />
      {channel('B', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
      <feBlend in="G_C" in2="B_C" mode="screen" result="GB" />
      <feBlend in="R_C" in2="GB" mode="screen" />
    </filter>
  );
};

export const GlassFilter: React.FC = () => {
  // Only Chromium applies SVG filters to backdrops; elsewhere the class stays off and glass is frost only.
  useEffect(() => {
    const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands ?? [];
    const chromium = brands.some((b) => /Chromium/i.test(b.brand));
    document.documentElement.classList.toggle('lg-refract', chromium);
    return () => document.documentElement.classList.remove('lg-refract');
  }, []);
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} focusable="false">
      <defs>
        <Refract id="lg-strong" scale={56} />
        <Refract id="lg-soft" scale={26} />
      </defs>
    </svg>
  );
};
