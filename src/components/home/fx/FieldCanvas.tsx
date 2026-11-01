import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * A colour field drawn on a 2D canvas: soft gradient blobs in shades of the segment's colour and
 * a drift of small particles in front of them. It is the CSS-free, WebGL-free cousin of the home
 * hero's shader field, so every segment can have one.
 *
 * Scrolling drives it. Each particle sits at its own depth, so a scroll pushes near ones further
 * than far ones (parallax), and the blobs drift faster while the page moves. When scrolling stops
 * everything eases to a halt, so nothing keeps moving on its own (WCAG 2.2.2). A pointer moving
 * over the segment, or the segment coming into view, stirs it for a moment too. Off screen it does
 * not draw at all, and under reduced motion it is one still frame.
 */

export interface FieldPalette {
  /** Blob colours (two or three): lighter or neighbouring shades of the field, checked for text contrast. */
  blobs: string[];
  /** Particle colour. */
  particle: string;
  /** Peak particle opacity. */
  particleAlpha: number;
}

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

interface Particle {
  x: number; // 0..1 of width
  y: number; // px
  r: number; // px
  depth: number; // 0.3 (far) .. 1 (near)
  phase: number;
  alpha: number;
}

/** Particles per 100 000 px² of field, capped so tall segments stay cheap. */
const DENSITY = 2.2;
const MAX_PARTICLES = 90;

export const FieldCanvas: React.FC<{ palette: FieldPalette; hostRef: React.RefObject<HTMLElement> }> = ({
  palette,
  hostRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // One soft particle, drawn once: a bright core fading into a halo. Each frame stamps it with
    // drawImage, which is cheaper than building gradients per particle and has no hard edges.
    const SPRITE = 64;
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = SPRITE;
    const sctx = sprite.getContext('2d');
    if (sctx) {
      const g = sctx.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
      g.addColorStop(0, rgba(palette.particle, 1));
      g.addColorStop(0.18, rgba(palette.particle, 0.9));
      g.addColorStop(0.4, rgba(palette.particle, 0.25));
      g.addColorStop(1, rgba(palette.particle, 0));
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, SPRITE, SPRITE);
    }

    const seed = () => {
      const count = Math.min(MAX_PARTICLES, Math.round(((width * height) / 100000) * DENSITY));
      particles = Array.from({ length: count }, () => {
        const depth = 0.3 + Math.random() * 0.7;
        return {
          x: Math.random(),
          y: Math.random() * height,
          r: 0.8 + depth * 2.6,
          depth,
          phase: Math.random() * Math.PI * 2,
          alpha: palette.particleAlpha * (0.45 + depth * 0.55),
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw();
    };

    // Blob centres wander on slow Lissajous paths of `t`, nudged by where the segment sits in the
    // viewport (so they slide as the page scrolls past).
    let t = Math.random() * 100;
    const pick = (i: number) => palette.blobs[i % palette.blobs.length];
    const blobs = [
      { color: pick(0), ax: 0.22, ay: 0.3, fx: 0.13, fy: 0.17, r: 0.55, s: 0.18 },
      { color: pick(1), ax: 0.78, ay: 0.7, fx: 0.11, fy: 0.09, r: 0.5, s: -0.22 },
      { color: pick(2), ax: 0.62, ay: 0.15, fx: 0.07, fy: 0.12, r: 0.38, s: 0.12 },
      { color: pick(3), ax: 0.12, ay: 0.85, fx: 0.09, fy: 0.15, r: 0.34, s: -0.1 },
    ];

    const viewProgress = () => {
      const rect = host.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 when the segment's top is at the viewport bottom, 1 when its bottom is at the top.
      return ((vh - rect.top) / (vh + rect.height)) * 2 - 1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const p = viewProgress();
      const span = Math.max(width, height);
      for (const b of blobs) {
        const cx = (b.ax + Math.sin(t * b.fx) * 0.12) * width;
        const cy = (b.ay + Math.cos(t * b.fy) * 0.14 + p * b.s) * height;
        const r = b.r * span;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, rgba(b.color, 0.95));
        g.addColorStop(0.55, rgba(b.color, 0.35));
        g.addColorStop(1, rgba(b.color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }
      for (const q of particles) {
        const x = (q.x * width + Math.sin(t * 0.6 + q.phase) * 14 * q.depth + width) % width;
        // Twinkle gently as they drift.
        ctx.globalAlpha = q.alpha * (0.75 + 0.25 * Math.sin(t * 1.3 + q.phase * 3));
        const size = q.r * 6;
        ctx.drawImage(sprite, x - size / 2, q.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    if (reduce) return () => ro.disconnect();

    // Energy: how lively the field is. Scrolling, pointer movement and coming into view add to it;
    // it decays to zero, and at zero the loop stops.
    let energy = 0;
    let boostUntil = 0;
    let visible = false;
    let raf = 0;
    let last = 0;
    let lastScroll = window.scrollY;
    let pendingScroll = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      if (now > boostUntil) energy *= Math.pow(0.18, dt); // ~0.18× per second once the boost ends
      t += dt * (0.25 + energy * 1.6);

      const push = pendingScroll;
      pendingScroll = 0;
      for (const q of particles) {
        // Drift upward a little, and move against the scroll by depth: near particles travel
        // further than the page, far ones lag behind it.
        q.y -= (10 + 22 * energy) * q.depth * dt * energy + push * (q.depth - 0.55) * 0.6;
        if (q.y < -10) q.y += height + 20;
        else if (q.y > height + 10) q.y -= height + 20;
      }
      draw();

      if (visible && (energy > 0.02 || now < boostUntil)) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        last = 0;
      }
    };

    const wake = (amount: number, holdMs = 0) => {
      energy = Math.min(1, energy + amount);
      if (holdMs) boostUntil = Math.max(boostUntil, performance.now() + holdMs);
      if (visible && !raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScroll;
      lastScroll = y;
      if (!visible) return;
      pendingScroll += dy;
      wake(Math.min(0.5, Math.abs(dy) * 0.006));
    };
    const onPointer = () => wake(0.08);

    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) wake(1, 2500);
    });
    io.observe(host);
    window.addEventListener('scroll', onScroll, { passive: true });
    host.addEventListener('pointermove', onPointer);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      host.removeEventListener('pointermove', onPointer);
    };
  }, [palette, hostRef, reduce]);

  return <canvas ref={canvasRef} className="hc-field-canvas" aria-hidden />;
};
