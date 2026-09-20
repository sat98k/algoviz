import React, { useState, useMemo } from 'react';
import { algorithmRegistry } from '../config/algorithmRegistry';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Search,
  Clock,
  Cpu,
  Grid,
} from 'lucide-react';

export const MODULE_DESCRIPTIONS: Record<
  number,
  { title: string; subtitle: string; description: string; paradigms: string[] }
> = {
  1: {
    title: 'Greedy Algorithms & Divide-and-Conquer',
    subtitle: 'Optimal substructure, greedy choices, and recursive decomposition',
    description:
      'Covers greedy strategies with the greedy-choice property (Huffman encoding, fractional knapsack) alongside divide-and-conquer recurrence formulations (maximum subarray, Karatsuba multiplication).',
    paradigms: ['Greedy', 'Divide & Conquer'],
  },
  2: {
    title: 'Dynamic Programming, Backtracking, Branch & Bound',
    subtitle: 'State memoization, combinatorial search, and state-space pruning',
    description:
      'Explores optimal substructure through 2D DP matrices (Knapsack, LCS, Matrix Chain, Assembly Line, Held-Karp TSP), state-space tree backtracking (N-Queens, Subset Sum, Graph Coloring), and branch-and-bound upper-bounding (Knapsack B&B, Job Selection B&B).',
    paradigms: ['Dynamic Programming', 'Backtracking', 'Branch & Bound'],
  },
  3: {
    title: 'String Matching Algorithms',
    subtitle: 'Pattern alignment, linear prefix-suffix transitions, and rolling hashes',
    description:
      'Analyzes exact string searching through sliding-window brute force, zero-backtrack failure functions via the KMP π table, polynomial rolling hash modulos with Rabin-Karp, and linear suffix tree structures.',
    paradigms: ['String Matching'],
  },
  4: {
    title: 'Graph Algorithms & Network Flow',
    subtitle: 'Shortest paths, residual flow networks, and preflow-push mechanics',
    description:
      'Solves single-source and all-pairs shortest paths via edge relaxation (Bellman-Ford, Floyd-Warshall), and investigates maximum network flow via augmenting paths (Ford-Fulkerson, Edmonds-Karp BFS) and Goldberg-Tarjan preflow-push heights.',
    paradigms: ['SSSP', 'APSP', 'Max Flow'],
  },
  5: {
    title: 'Geometric Algorithms',
    subtitle: 'Sweep-line segment status, cross-product orientations, and convex hulls',
    description:
      'Examines 2D computational geometry with the Bentley-Ottmann vertical sweep-line event queue, Graham’s Scan polar angle sorting with non-left-turn stacks, and Jarvis’ March gift-wrapping extremal anchors.',
    paradigms: ['Computational Geometry', 'Convex Hull'],
  },
  6: {
    title: 'Randomized Algorithms',
    subtitle: 'Probabilistic pivots, randomized contraction, and online decision theory',
    description:
      'Analyzes algorithms leveraging uniform random choices: Las Vegas randomized quicksort, sequential hiring under stochastic applicant order, and Karger’s multigraph contraction for global minimum cuts.',
    paradigms: ['Randomized', 'Online Selection', 'Min-Cut'],
  },
  7: {
    title: 'Complexity Classes & Approximation Algorithms',
    subtitle: 'Tractable polynomial-time approximations with provable bounds for NP-hard problems',
    description:
      'Explores approximation algorithms with theoretical performance bounds: 2-approximation for Vertex Cover using maximal matchings, greedy H(|U|) approximation for Set Cover, and 2-approximation for Metric TSP via MST edge-doubling and Eulerian shortcutting.',
    paradigms: ['Approximation', 'NP-Completeness'],
  },
};

interface ModulePageProps {
  moduleNumber: number;
  onSelectAlgorithm: (id: string) => void;
  onSelectModule: (moduleNumber: number) => void;
  onBack: () => void;
}

export const ModulePage: React.FC<ModulePageProps> = ({
  moduleNumber,
  onSelectAlgorithm,
  onSelectModule,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const shouldReduceMotion = useReducedMotion();

  const moduleMeta = MODULE_DESCRIPTIONS[moduleNumber] || {
    title: `Module ${moduleNumber}`,
    subtitle: 'Course Algorithms',
    description: 'Explore the algorithms in this module.',
    paradigms: [],
  };

  const moduleAlgorithms = useMemo(() => {
    return algorithmRegistry.filter((algo) => algo.module === moduleNumber);
  }, [moduleNumber]);

  const filteredAlgorithms = useMemo(() => {
    if (!searchTerm.trim()) return moduleAlgorithms;
    const term = searchTerm.toLowerCase();
    return moduleAlgorithms.filter(
      (algo) =>
        algo.name.toLowerCase().includes(term) ||
        algo.paradigm.toLowerCase().includes(term) ||
        algo.problemStatement.toLowerCase().includes(term)
    );
  }, [moduleAlgorithms, searchTerm]);

  const formattedModuleNum = String(moduleNumber).padStart(2, '0');

  return (
    <div className="flex flex-col w-full min-h-screen bg-obsidian-900 text-chalk-100">
      {/* Top Breadcrumbs & Module Header */}
      <section className="border-b border-hairline bg-obsidian-950/60 pt-8 pb-10 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between font-mono text-xs text-chalk-400 mb-6">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 px-3 py-1.5 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 hover:text-amber border border-hairline transition-all duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>← ALL MODULES</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse"></span>
            <span className="uppercase text-chalk-400 font-semibold">
              MODULE {formattedModuleNum} OF 07
            </span>
          </div>
        </div>

        {/* Module Title Block */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display font-black text-4xl sm:text-5xl text-amber">
              {formattedModuleNum}
            </span>
            <div className="h-8 w-px bg-hairline hidden sm:block"></div>
            <div className="flex flex-wrap items-center gap-2">
              {moduleMeta.paradigms.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-0.5 bg-obsidian-900 border border-hairline text-amber-glow font-mono text-[11px] uppercase tracking-wider font-semibold"
                >
                  {p}
                </span>
              ))}
              <span className="px-2.5 py-0.5 bg-obsidian-900 border border-acid-500/30 text-acid-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
                {moduleAlgorithms.length} ALGORITHMS
              </span>
            </div>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-chalk-100 tracking-tight">
            {moduleMeta.title}
          </h1>

          <p className="text-sm sm:text-base text-chalk-300 font-sans max-w-3xl leading-relaxed mt-1">
            {moduleMeta.description}
          </p>
        </div>

        {/* In-Module Search Filter */}
        <div className="mt-8 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96 flex items-center group">
            <Search className="w-4 h-4 text-chalk-400 absolute left-3.5 pointer-events-none transition-colors group-focus-within:text-amber" />
            <input
              type="text"
              placeholder={`Search ${moduleAlgorithms.length} algorithms in Module ${moduleNumber}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 text-xs font-mono text-chalk-100 placeholder:text-chalk-400 border border-hairline hover:border-chalk-400/40 focus:border-amber focus:ring-1 focus:ring-amber/40 focus:outline-none transition-all shadow-sm"
            />
          </div>

          <span className="font-mono text-xs text-chalk-400 self-end sm:self-center">
            Showing {filteredAlgorithms.length} of {moduleAlgorithms.length} algorithms
          </span>
        </div>
      </section>

      {/* Algorithms Grid for this Module */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-10 flex-1">
        {filteredAlgorithms.length === 0 ? (
          <div className="p-16 text-center text-chalk-400 font-mono text-xs border border-hairline bg-obsidian-950">
            No algorithms in this module match your search query "{searchTerm}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlgorithms.map((algo, idx) => {
              const algoNum = `${formattedModuleNum}.${String(idx + 1).padStart(2, '0')}`;

              return (
                <motion.div
                  key={algo.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  onClick={() => onSelectAlgorithm(algo.id)}
                  className="group relative flex flex-col justify-between p-6 bg-obsidian-950 border border-hairline hover:border-amber/70 hover:bg-obsidian-900/60 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-black/30"
                >
                  {/* Numeral Watermark */}
                  <span className="absolute -right-2 -bottom-4 font-display font-black text-8xl text-obsidian-850 select-none pointer-events-none group-hover:text-amber/5 transition-colors">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  <div className="relative z-10 flex flex-col gap-3">
                    {/* Top Row: Algorithm index & Paradigm badge */}
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-amber font-bold tracking-wider">{algoNum}</span>
                      <span className="px-2 py-0.5 bg-obsidian-900 border border-hairline text-chalk-400 text-[10px] uppercase font-medium">
                        {algo.paradigm}
                      </span>
                    </div>

                    {/* Algorithm Name */}
                    <h3 className="font-display font-bold text-xl text-chalk-100 group-hover:text-amber-glow transition-colors">
                      {algo.name}
                    </h3>

                    {/* Problem Statement */}
                    <p className="text-xs text-chalk-400 font-sans leading-relaxed line-clamp-3">
                      {algo.problemStatement}
                    </p>
                  </div>

                  {/* Bottom Complexity Ledger & Action Button */}
                  <div className="relative z-10 pt-5 mt-5 border-t border-hairline flex items-center justify-between font-mono text-[11px]">
                    <div className="flex flex-col gap-1 text-chalk-400">
                      <span className="flex items-center gap-1.5 text-amber-glow font-medium text-[11px]">
                        <Clock className="w-3 h-3 text-amber" />
                        <span>{algo.complexity.timeAverage || algo.complexity.timeWorst}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-acid-400 font-medium text-[11px]">
                        <Cpu className="w-3 h-3 text-acid-500" />
                        <span>{algo.complexity.spaceWorst}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono text-chalk-400 group-hover:text-amber-glow transition-colors">
                      <span className="hidden sm:inline text-[11px] font-bold uppercase">Launch</span>
                      <div className="w-7 h-7 flex items-center justify-center bg-obsidian-900 group-hover:bg-amber group-hover:text-obsidian-950 text-chalk-300 border border-hairline transition-all">
                        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Module Switcher Pagination at Bottom */}
        <div className="mt-12 pt-8 border-t border-hairline flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          {moduleNumber > 1 ? (
            <button
              onClick={() => onSelectModule(moduleNumber - 1)}
              className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-950 hover:bg-obsidian-850 border border-hairline text-chalk-300 hover:text-amber transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>PREVIOUS: MODULE 0{moduleNumber - 1}</span>
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-900 hover:bg-obsidian-850 border border-hairline text-chalk-300 hover:text-chalk-100 transition-colors"
          >
            <Grid className="w-4 h-4 text-amber" />
            <span>VIEW ALL 7 MODULES</span>
          </button>

          {moduleNumber < 7 ? (
            <button
              onClick={() => onSelectModule(moduleNumber + 1)}
              className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-950 hover:bg-obsidian-850 border border-hairline text-chalk-300 hover:text-amber transition-colors"
            >
              <span>NEXT: MODULE 0{moduleNumber + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div></div>
          )}
        </div>
      </section>
    </div>
  );
};
