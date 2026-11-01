import React from 'react';
import { LiquidOwl } from '../home/fx/lazy';

/** The last chapter: the name first, at full width, on the ink field. */
export const Footer: React.FC = () => {
  return (
    <footer data-chapter="ink" className="chrome-c w-full overflow-hidden bg-[#1a1a1a] text-[#e6e0d2]">
      <div className="hc-frame pt-[clamp(48px,8vh,96px)] pb-8 flex flex-col gap-[clamp(48px,9vh,112px)]">
        <p className="hc-display text-[clamp(72px,19vw,340px)] leading-[0.85] select-none" aria-hidden>
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
    </footer>
  );
};
