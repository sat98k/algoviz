import React, { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { LiquidOwl } from '../home/fx/lazy';
import { useAmbient } from '../home/fx/useAmbient';
import { GlowSection } from '../home/fx/GlowSection';

/** The last chapter: the name first, at full width, on the ink field. */
export const Footer: React.FC = () => {
  // The wordmark is filled with the hero's yellow-orange-red field. It flows for a few seconds
  // when it comes into view, then holds, and flows again under the pointer.
  const markRef = useRef<HTMLParagraphElement>(null);
  const { active, wake } = useAmbient(8000);
  const inView = useInView(markRef, { margin: '-10% 0px' });
  useEffect(() => {
    if (inView) wake();
  }, [inView, wake]);

  return (
    <GlowSection as="footer" field="ink" data-chapter="ink" className="chrome-c w-full bg-[#1a1a1a] text-[#e6e0d2]">
      <div className="hc-frame pt-[clamp(48px,8vh,96px)] pb-8 flex flex-col gap-[clamp(48px,9vh,112px)]">
        <p
          ref={markRef}
          onPointerMove={wake}
          className={`hc-display hc-wordmark text-[clamp(72px,19vw,340px)] leading-[0.85] select-none${active ? ' is-flowing' : ''}`}
          aria-hidden
        >
          algoviz
        </p>
        <div className="grid gap-10 md:grid-cols-12 items-end">
          <p className="md:col-span-6 text-[clamp(22px,2.2vw,34px)] font-bold leading-tight text-[#18bc42]">
            Every algorithm in BCSE204L, one small step at a time.
          </p>
          <div className="md:col-start-9 md:col-span-4 flex items-end justify-end">
            <LiquidOwl className="w-28 h-[124px] shrink-0" tint="#f2c21a" />
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 text-[14px] text-[#c9c2b2]">
          <span>Runs entirely in your browser</span>
          <span>© 2026 AlgoViz</span>
        </div>
      </div>
    </GlowSection>
  );
};
