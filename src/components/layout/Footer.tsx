import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-obsidian-950 border-t border-hairline pt-12 pb-12 text-chalk-400 overflow-hidden">
      {/* Topics Ticker */}
      <div className="w-full border-y border-hairline py-3 mb-12 bg-obsidian-900/50 overflow-hidden flex select-none">
        <div className="flex shrink-0 items-center gap-8 animate-marquee font-mono text-xs uppercase tracking-wider text-chalk-400">
          <span>Divide & Conquer</span>
          <span className="text-amber">•</span>
          <span>Greedy Heuristics</span>
          <span className="text-acid-500">•</span>
          <span>Dynamic Programming</span>
          <span className="text-electric-400">•</span>
          <span>Backtracking</span>
          <span className="text-amber">•</span>
          <span>Branch & Bound</span>
          <span className="text-acid-500">•</span>
          <span>String Matching</span>
          <span className="text-electric-400">•</span>
          <span>Graph Algorithms</span>
          <span className="text-amber">•</span>
        </div>
        <div className="flex shrink-0 items-center gap-8 animate-marquee font-mono text-xs uppercase tracking-wider text-chalk-400" aria-hidden="true">
          <span>Divide & Conquer</span>
          <span className="text-amber">•</span>
          <span>Greedy Heuristics</span>
          <span className="text-acid-500">•</span>
          <span>Dynamic Programming</span>
          <span className="text-electric-400">•</span>
          <span>Backtracking</span>
          <span className="text-amber">•</span>
          <span>Branch & Bound</span>
          <span className="text-acid-500">•</span>
          <span>String Matching</span>
          <span className="text-electric-400">•</span>
          <span>Graph Algorithms</span>
          <span className="text-amber">•</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-chalk-100">
              ALGO<span className="text-amber">VIZ</span>
            </h2>
            <p className="text-xs sm:text-sm text-chalk-400 font-sans mt-1.5 max-w-lg leading-relaxed">
              An interactive visualization platform for learning and analyzing fundamental algorithms step-by-step.
            </p>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-chalk-400">
          <div>
            <span>Design & Analysis of Algorithms</span>
          </div>
          <div className="flex items-center gap-4 text-chalk-400">
            <span>Client-Side Interactive Visualizer</span>
            <span>© 2026 AlgoViz</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

