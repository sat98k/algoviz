import React, { useState, useMemo } from 'react';
import { algorithmRegistry } from '../config/algorithmRegistry';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  Terminal,
  BookOpen,
} from 'lucide-react';
import { MODULE_DESCRIPTIONS } from './ModulePage';

interface HomeProps {
  onSelectModule: (moduleNumber: number) => void;
  onSelectAlgorithm: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  onSelectModule,
  onSelectAlgorithm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const shouldReduceMotion = useReducedMotion();

  // Instant global search filter (if user types in search bar)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return algorithmRegistry.filter(
      (algo) =>
        algo.name.toLowerCase().includes(term) ||
        algo.paradigm.toLowerCase().includes(term) ||
        algo.problemStatement.toLowerCase().includes(term) ||
        algo.moduleName.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const totalAlgorithms = algorithmRegistry.length;

  // 7 Modules metadata array
  const modulesList = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7].map((num) => {
      const algos = algorithmRegistry.filter((a) => a.module === num);
      const meta = MODULE_DESCRIPTIONS[num] || {
        title: `Module ${num}`,
        subtitle: '',
        description: '',
        paradigms: [],
      };
      return {
        number: num,
        ...meta,
        algorithms: algos,
      };
    });
  }, []);

  return (
    <div className="flex flex-col w-full min-h-screen bg-obsidian-900 text-chalk-100">
      {/* HERO SECTION: Concise & Typographic */}
      <section className="relative pt-10 pb-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full border-b border-hairline">
        <div className="flex flex-wrap items-center justify-between font-mono text-xs text-chalk-400 tracking-wider pb-6 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-acid-500 rounded-full animate-pulse"></span>
            <span className="text-chalk-300 uppercase font-semibold">
              BCSE204L • Design and Analysis of Algorithms
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-obsidian-950 border border-hairline text-amber-glow font-bold">
              7 COURSE MODULES
            </span>
            <span className="px-2.5 py-1 bg-obsidian-950 border border-acid-500/40 text-acid-400 font-bold">
              {totalAlgorithms} ALGORITHMS
            </span>
          </div>
        </div>

        {/* Hero Title & Subtext */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 py-4">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-2 max-w-2xl"
          >
            <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-amber font-semibold uppercase">
              <Terminal className="w-3.5 h-3.5 text-amber" />
              <span>Interactive Step-by-Step Curriculum</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight text-chalk-100 leading-tight">
              ALGORITHM <span className="font-serif italic font-normal text-chalk-300">CATALOG.</span>
            </h1>

            <p className="text-sm sm:text-base text-chalk-400 font-sans leading-relaxed mt-1">
              Select any of the <strong>7 course modules</strong> below to explore deterministic step-by-step visualizers,
              live code execution, recurrence metrics, and invariant proofs.
            </p>
          </motion.div>
        </div>

        {/* Global Quick Search Bar */}
        <div className="mt-6 pt-5 border-t border-hairline relative">
          <div className="relative flex items-center w-full group">
            <Search className="w-4 h-4 text-chalk-400 absolute left-4 pointer-events-none transition-colors group-focus-within:text-amber" />
            <input
              type="text"
              placeholder="Quick search any algorithm across all modules (e.g., 'Rabin-Karp', 'Held-Karp', 'Push-Relabel', 'KMP')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-20 py-3.5 bg-obsidian-950 text-xs sm:text-sm font-mono text-chalk-100 placeholder:text-chalk-400 border border-hairline hover:border-chalk-400/40 focus:border-amber focus:ring-1 focus:ring-amber/40 focus:outline-none transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 px-2.5 py-1 font-mono text-[11px] text-chalk-400 hover:text-amber hover:bg-obsidian-850 border border-hairline rounded transition-all"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>
      </section>

      {/* SEARCH RESULTS OVERLAY (When user actively searches) */}
      {searchTerm.trim() ? (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-10 flex-1">
          <div className="flex items-center justify-between font-mono text-xs text-chalk-400 uppercase tracking-wider pb-6 border-b border-hairline">
            <span className="font-bold text-chalk-200">Search Results</span>
            <span>{searchResults.length} algorithm(s) matched</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-16 text-center text-chalk-400 font-mono text-xs border border-hairline bg-obsidian-950 mt-6">
              No algorithms match "{searchTerm}". Try another keyword or browse by module.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {searchResults.map((algo) => (
                <div
                  key={algo.id}
                  onClick={() => onSelectAlgorithm(algo.id)}
                  className="group flex flex-col justify-between p-6 bg-obsidian-950 border border-hairline hover:border-amber transition-all cursor-pointer shadow-md"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-amber font-semibold">{algo.moduleName}</span>
                      <span className="px-2 py-0.5 bg-obsidian-900 border border-hairline text-chalk-400 text-[10px] uppercase">
                        {algo.paradigm}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-chalk-100 group-hover:text-amber-glow transition-colors">
                      {algo.name}
                    </h3>
                    <p className="text-xs text-chalk-400 font-sans line-clamp-2 leading-relaxed">
                      {algo.problemStatement}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-hairline flex items-center justify-between font-mono text-xs text-chalk-400 group-hover:text-amber transition-colors">
                    <span>Launch Visualizer</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* MAIN 7 MODULES GRID (Simple, No endless scrolling!) */
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-10 flex-1">
          <div className="flex items-center justify-between font-mono text-xs text-chalk-400 uppercase tracking-wider pb-6 border-b border-hairline">
            <span className="font-bold text-chalk-200">Syllabus Modules (Click to Open)</span>
            <span>7 Core Modules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {modulesList.map((mod, idx) => {
              const formattedNum = String(mod.number).padStart(2, '0');

              return (
                <motion.div
                  key={mod.number}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  onClick={() => onSelectModule(mod.number)}
                  className="group relative flex flex-col justify-between p-7 bg-obsidian-950 border border-hairline hover:border-amber hover:bg-obsidian-900/60 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-black/20"
                >
                  {/* Huge Numeral Watermark */}
                  <span className="absolute -right-3 -bottom-5 font-display font-black text-8xl text-obsidian-850 select-none pointer-events-none group-hover:text-amber/5 transition-colors">
                    {formattedNum}
                  </span>

                  <div className="relative z-10 flex flex-col gap-4">
                    {/* Top Row: Module # and Paradigm Tags */}
                    <div className="flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber/10 border border-amber/30 text-amber font-bold">
                          MODULE {formattedNum}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-obsidian-900 border border-acid-500/30 text-acid-400 text-[11px] font-bold">
                        {mod.algorithms.length} ALGORITHMS
                      </span>
                    </div>

                    {/* Module Title */}
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-chalk-100 group-hover:text-amber-glow transition-colors leading-snug">
                      {mod.title}
                    </h2>

                    {/* Paradigm Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {mod.paradigms.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 bg-obsidian-900 border border-hairline text-chalk-400 font-mono text-[10px] uppercase font-semibold"
                        >
                          {p}
                        </span>
                      ))}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-chalk-400 font-sans leading-relaxed line-clamp-3">
                      {mod.description}
                    </p>

                    {/* Algorithm Preview Chips */}
                    <div className="pt-3 border-t border-hairline/60">
                      <span className="text-[10px] font-mono text-chalk-500 uppercase tracking-wider block mb-1.5">
                        Algorithms included:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {mod.algorithms.slice(0, 4).map((a) => (
                          <span
                            key={a.id}
                            className="px-2 py-0.5 bg-obsidian-900/90 text-chalk-300 font-mono text-[10px] border border-hairline/50 truncate max-w-[200px]"
                          >
                            {a.name}
                          </span>
                        ))}
                        {mod.algorithms.length > 4 && (
                          <span className="px-1.5 py-0.5 text-amber text-[10px] font-mono font-bold">
                            +{mod.algorithms.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="relative z-10 pt-5 mt-5 border-t border-hairline flex items-center justify-between font-mono text-xs text-chalk-400 group-hover:text-amber-glow transition-colors">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber" />
                      View {mod.algorithms.length} Algorithms
                    </span>
                    <div className="w-8 h-8 flex items-center justify-center bg-obsidian-900 group-hover:bg-amber group-hover:text-obsidian-950 text-chalk-300 border border-hairline transition-all">
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom Information Footer Strip */}
      <div className="border-t border-hairline py-6 bg-obsidian-950 text-center font-mono text-xs text-chalk-500">
        BCSE204L DAA Algorithm Visualizer • 32 Implemented Step-Generator Algorithms Across 7 Modules
      </div>
    </div>
  );
};
