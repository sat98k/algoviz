/**
 * Pseudocode auto-scroll that never moves the page.
 *
 * The browser's scrollIntoView method scrolls every scrollable ancestor, including
 * the document, so it is not used here. Instead the active line's position is
 * measured relative to the code container and only that container's
 * `scrollTop` changes, and only when the line is outside its visible area.
 */

export interface LineBox {
  /** Line top relative to the container's content (offsetTop within the container). */
  top: number;
  height: number;
}

export interface ScrollBox {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}

/**
 * New `scrollTop` for the container so the given lines are visible, or `null`
 * when they already are (nothing should scroll). Lines that do not fit are
 * aligned to the top; otherwise the block is centred.
 */
export const containerScrollFor = (lines: LineBox, box: ScrollBox, margin = 8): number | null => {
  const viewTop = box.scrollTop;
  const viewBottom = box.scrollTop + box.clientHeight;
  const lineTop = lines.top;
  const lineBottom = lines.top + lines.height;

  if (lineTop >= viewTop + margin && lineBottom <= viewBottom - margin) return null;

  const maxScroll = Math.max(0, box.scrollHeight - box.clientHeight);
  const target =
    lines.height + 2 * margin >= box.clientHeight
      ? lineTop - margin
      : lineTop - (box.clientHeight - lines.height) / 2;
  const clamped = Math.round(Math.min(maxScroll, Math.max(0, target)));
  return clamped === Math.round(box.scrollTop) ? null : clamped;
};

/** Box spanning the first to the last active line element, relative to the container. */
export const activeLinesBox = (container: HTMLElement, lineNumbers: number[]): LineBox | null => {
  const els = lineNumbers
    .map((n) => container.querySelector<HTMLElement>(`[data-line-num="${n}"]`))
    .filter((el): el is HTMLElement => !!el);
  if (els.length === 0) return null;
  const cRect = container.getBoundingClientRect();
  const tops = els.map((el) => el.getBoundingClientRect().top - cRect.top + container.scrollTop);
  const bottoms = els.map((el) => el.getBoundingClientRect().bottom - cRect.top + container.scrollTop);
  const top = Math.min(...tops);
  return { top, height: Math.max(...bottoms) - top };
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scroll only `container` so the active lines are visible. Never touches the document. */
export const revealActiveLines = (container: HTMLElement, lineNumbers: number[]) => {
  const box = activeLinesBox(container, lineNumbers);
  if (!box) return;
  const next = containerScrollFor(box, container);
  if (next === null) return;
  container.scrollTo({ top: next, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
};
