import React, { useEffect, useRef, useState } from 'react';
import { clearOwlFlight, peekOwlFlight, setOwlFlying } from './owlFlight';
import { playChirp, prefersReducedMotion } from './owlVoice';
import { pageZoom } from '../../utils/pageZoom';

type Point = { x: number; y: number; size: number };

const FLIGHT_MS = 1600;

/**
 * Mounted in the player. If "Start the animation" recorded a flight, an owl flies in an arc
 * from the explanation page's owl to the player's owl spot (flapping, with a chirp on take-off
 * and on landing). The player's owl stays hidden, and silent, until it lands.
 */
export const OwlFlightLayer: React.FC = () => {
  const [flight, setFlight] = useState<{ from: Point; to: Point } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  // Find where to land once the player has rendered (Animation Mode shows an owl to land on).
  useEffect(() => {
    const from = peekOwlFlight();
    if (!from) return;
    setOwlFlying(true);
    let cancelled = false;
    let tries = 0;
    const find = () => {
      if (cancelled) return;
      const target = document.querySelector('[data-view="play"] [data-owl-avatar]');
      if (target) {
        const r = target.getBoundingClientRect();
        // Screen pixels to the page's CSS pixels (the page is zoomed on wide screens).
        const z = pageZoom();
        setFlight({
          from: { x: from.x / z, y: from.y / z, size: from.size / z },
          to: { x: (r.left + r.width / 2) / z, y: (r.top + r.height / 2) / z, size: r.height / z },
        });
      } else if (tries++ < 30) window.setTimeout(find, 50);
      else {
        // Technical View: nowhere to land, just a hello chirp.
        clearOwlFlight();
        setOwlFlying(false);
        playChirp(true);
      }
    };
    const t = window.setTimeout(find, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!flight || !el) return;
    const done = () => {
      clearOwlFlight();
      setOwlFlying(false);
      setFlight(null);
    };
    playChirp(true);
    if (typeof el.animate !== 'function' || prefersReducedMotion()) {
      done();
      return;
    }
    const { from, to } = flight;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // Rise above both points, then glide down onto the perch.
    const lift = Math.min(0, dy) - 150;
    const end = Math.max(0.35, to.size / from.size);
    const at = (x: number, y: number, rotate: number, scale: number) =>
      `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`;
    const animation = el.animate(
      [
        { transform: at(0, 0, 0, 1), offset: 0 },
        { transform: at(dx * 0.12, lift * 0.55, -16, 1.18), offset: 0.18 },
        { transform: at(dx * 0.4, lift, 12, 1.1), offset: 0.45 },
        { transform: at(dx * 0.75, lift * 0.35 + dy * 0.55, -10, (1 + end) / 2), offset: 0.75 },
        { transform: at(dx, dy - 6, 6, end * 1.08), offset: 0.92 },
        { transform: at(dx, dy, 0, end), offset: 1 },
      ],
      { duration: FLIGHT_MS, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards' }
    );
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      playChirp(true);
      done();
    };
    animation.onfinish = land;
    // If the browser pauses animations (a background tab), land anyway so the owl is not left hidden.
    const safety = window.setTimeout(land, FLIGHT_MS + 500);
    return () => {
      window.clearTimeout(safety);
      animation.cancel();
    };
  }, [flight]);

  // If the player closes mid-flight, the owl is not left hidden.
  useEffect(() => () => setOwlFlying(false), []);

  if (!flight) return null;
  return (
    <span
      ref={ref}
      aria-hidden
      data-owl-flight
      className="fixed z-[70] pointer-events-none select-none leading-none"
      style={{ left: flight.from.x, top: flight.from.y, fontSize: flight.from.size, transform: 'translate(-50%, -50%)' }}
    >
      <span className="inline-block owl-flap">🦉</span>
    </span>
  );
};
