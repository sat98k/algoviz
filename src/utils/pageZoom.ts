/**
 * The CSS zoom on the page (see `html` in index.css: 0.75 on wide screens, else 1).
 * Screen coordinates (getBoundingClientRect, pointer clientX/Y) are in zoomed pixels, while
 * CSS lengths inside the page are not: divide screen coordinates by this before using them as
 * CSS lengths (fixed positions, SVG coordinates in the page).
 */
export const pageZoom = (): number => {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return 1;
  const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-zoom'));
  return z > 0 ? z : 1;
};
