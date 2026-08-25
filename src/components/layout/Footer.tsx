import React from 'react';
import { Terminal, GitBranch } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-obsidian-950 border-t border-hairline pt-16 pb-12 text-chalk-400 overflow-hidden">
      {/* Continuous Marquee Ticker */}
      <div className="w-full border-y border-hairline py-3 mb-16 bg-obsidian-900/50 overflow-hidden flex select-none">
        <div className="flex shrink-0 items-center gap-8 animate-marquee font-mono text-xs uppercase tracking-widest text-chalk-400">
          <span>• DESIGN AND ANALYSIS OF ALGORITHMS</span>
          <span className="text-amber">• GREEDY HEURISTICS</span>
          <span>• DYNAMIC PROGRAMMING RECURRENCE</span>
          <span className="text-acid-500">• STATE-SPACE BRANCH & BOUND</span>
          <span>• NETWORK FLOW RESIDUAL AUGMENTATION</span>
          <span className="text-electric-400">• CONVEX HULL GEOMETRY</span>
          <span>• 2-APPROXIMATION BOUNDS</span>
          <span>• ASYMPTOTIC TIGHT BOUNDS Θ(g(n))</span>
        </div>
        <div className="flex shrink-0 items-center gap-8 animate-marquee font-mono text-xs uppercase tracking-widest text-chalk-400" aria-hidden="true">
          <span>• DESIGN AND ANALYSIS OF ALGORITHMS</span>
          <span className="text-amber">• GREEDY HEURISTICS</span>
          <span>• DYNAMIC PROGRAMMING RECURRENCE</span>
          <span className="text-acid-500">• STATE-SPACE BRANCH & BOUND</span>
          <span>• NETWORK FLOW RESIDUAL AUGMENTATION</span>
          <span className="text-electric-400">• CONVEX HULL GEOMETRY</span>
          <span>• 2-APPROXIMATION BOUNDS</span>
          <span>• ASYMPTOTIC TIGHT BOUNDS Θ(g(n))</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        {/* Giant Typographic Statement */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-amber">
              [ 08 // ARCHITECTURAL CONCLUSION ]
            </span>
            <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-tighter text-chalk-100 mt-2">
              COMPUTATIONAL <span className="font-serif italic font-normal text-chalk-300">PURITY.</span>
            </h2>
          </div>
          <div className="max-w-md text-xs font-mono text-chalk-400 leading-relaxed">
            Deterministic step generators calculating discrete machine state transitions for syllabus demonstration, academic viva evaluation, and algorithm analysis.
          </div>
        </div>

        {/* Ledger Bottom Row */}
        <div className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-chalk-500">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-amber" />
            <span>BCSE204L COURSE ARCHIVE • CLIENT-SIDE REACT + TYPESCRIPT</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-chalk-400">
              <GitBranch className="w-3 h-3 text-acid-500" />
              <span>12 DETERMINISTIC ENGINES</span>
            </span>
            <span className="text-chalk-500">© 2026 ALGOVIZ</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

