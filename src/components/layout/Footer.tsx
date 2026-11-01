import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { GradientField, LiquidOwl } from '../home/fx/lazy';
import { useLiquidGlass } from '../home/fx/useLiquidGlass';

/**
 * The close of every catalog page: an olive field (a slow shader gradient) with the name
 * returning at full width beside the owl in liquid metal, and the first step as a liquid-glass button.
 */
export const Footer: React.FC = () => {
  const root = useRef<HTMLElement>(null);
  useLiquidGlass(root);
  return (
    <footer ref={root} className="chrome-a ha-footer relative w-full overflow-hidden">
      <GradientField className="absolute inset-0" colors={['#38450f', '#55661c', '#323d0d']} speed={0.12} />
      <div className="ha-frame relative pt-10 pb-8 flex flex-col gap-[clamp(64px,12vh,160px)]">
        <p className="max-w-[38ch] text-[15px] leading-relaxed">
          A visual companion to Design and Analysis of Algorithms (BCSE204L): every algorithm in the course, one
          small step at a time.
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-6">
            <p className="ha-display text-[clamp(64px,21vw,380px)] leading-[0.8] -ml-[0.04em] select-none" aria-hidden>
              AlgoViz
            </p>
            <LiquidOwl className="w-[14vw] max-w-[260px] aspect-[200/220] shrink-0" tint="#f3eee5" />
          </div>
          <div className="flex flex-wrap justify-between gap-4 text-[14px]">
            <span>Runs entirely in your browser</span>
            <span>© 2026 AlgoViz</span>
          </div>
        </div>
      </div>
      <a href="#/module/1" data-glass className="ha-glass-cta">
        Start with module 1 <ArrowRight className="w-5 h-5" aria-hidden />
      </a>
    </footer>
  );
};
