import React, { useRef } from 'react';
import type { Field } from '../../../styles/fields';
import { FieldCanvas, type FieldPalette } from './FieldCanvas';

/**
 * Glow fields: soft peach, lemon and mint glows drifting behind a whole page (the learn view and
 * the player), on a warm white instead of the bone paper. One canvas fixed to the viewport, so it
 * stays the size of the screen however long the page is; it drifts while the page scrolls and
 * settles when it stops (see FieldCanvas). The first blob is a light shade of the module's chapter,
 * so each page still belongs to its chapter. Content sits on white panels above it, so text never
 * depends on the glow behind it.
 */
const BY_CHAPTER: Record<string, FieldPalette> = {
  '#ed4b44': { blobs: ['#ffcfc2', '#ffe7a6', '#cdf0d6'], particle: '#e0a21c', particleAlpha: 0.32 },
  '#18bc42': { blobs: ['#c6efcf', '#fff0b0', '#ffd8c8'], particle: '#e0a21c', particleAlpha: 0.32 },
  '#f2c21a': { blobs: ['#ffe8a2', '#ffd3c6', '#cfeee0'], particle: '#e0a21c', particleAlpha: 0.32 },
  '#1a1a1a': { blobs: ['#ffd6c8', '#ffeaa8', '#d3e9f7'], particle: '#e0a21c', particleAlpha: 0.32 },
  '#dcd5c5': { blobs: ['#ffe2c2', '#fff0b0', '#d3eedd'], particle: '#e0a21c', particleAlpha: 0.32 },
};

export const PageGlow: React.FC<{ field: Field }> = ({ field }) => {
  const ref = useRef<HTMLDivElement>(null);
  const palette = BY_CHAPTER[field.bg.toLowerCase()] ?? BY_CHAPTER['#ed4b44'];
  return (
    <div ref={ref} className="page-glow hc-glow" aria-hidden data-page-glow>
      <FieldCanvas palette={palette} hostRef={ref} />
    </div>
  );
};
