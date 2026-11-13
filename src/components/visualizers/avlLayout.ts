import { useEffect, useRef, useState } from 'react';
import type { AvlSnapshot } from '../../algorithms/lineSegmentIntersection';

/** Shared by the Technical View and the Animation Mode scene of Line Segment Intersection. */

export interface PlacedNode {
  node: AvlSnapshot;
  depth: number;
  /** In-order position: 0 = bottom-most segment. */
  order: number;
  parent: string | null;
  side: 'left' | 'right' | null;
}

export function placeTree(root: AvlSnapshot | null): PlacedNode[] {
  const out: PlacedNode[] = [];
  let order = 0;
  const walk = (n: AvlSnapshot | null, depth: number, parent: string | null, side: 'left' | 'right' | null) => {
    if (!n) return;
    walk(n.left, depth + 1, n.id, 'left');
    out.push({ node: n, depth, order: order++, parent, side });
    walk(n.right, depth + 1, n.id, 'right');
  };
  walk(root, 0, null, null);
  return out;
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export type Positions = Record<string, { x: number; y: number }>;

/**
 * Glide every keyed point from where it was to where it should be, so a rotation is seen as
 * nodes physically moving (edges follow, since they are drawn from the same positions).
 * New keys drop in from slightly above.
 */
export function useTweened(target: Positions, ms = 650): Positions {
  const [pos, setPos] = useState(target);
  const fromRef = useRef(target);
  const key = JSON.stringify(target);

  useEffect(() => {
    const from = fromRef.current;
    if (reducedMotion()) {
      fromRef.current = target;
      setPos(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const k = ease(t);
      const next: Positions = {};
      for (const id of Object.keys(target)) {
        const a = from[id] ?? { x: target[id].x, y: target[id].y - 24 };
        next[id] = { x: a.x + (target[id].x - a.x) * k, y: a.y + (target[id].y - a.y) * k };
      }
      fromRef.current = next;
      setPos(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ms]);

  return pos;
}
