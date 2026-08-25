import React, { useState, useMemo } from 'react';
import { algorithmRegistry } from '../config/algorithmRegistry';
import { AlgorithmConfig } from '../types/algorithm';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Search,
  ArrowUpRight,
  Play,
  Filter,
  Layers,
  Clock,
  Cpu,
  GitCompare,
  Terminal,
} from 'lucide-react';

interface HomeProps {
  onSelectAlgorithm: (id: string) => void;
  onNavigateComparison: () => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectAlgorithm, onNavigateComparison }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParadigm, setSelectedParadigm] = useState<string>('All');
  const [selectedModule, setSelectedModule] = useState<string>('All');
  const shouldReduceMotion = useReducedMotion();

  const paradigms = useMemo(() => {
    const list: string[] = ['All'];
    algorithmRegistry.forEach((a) => {
      if (!list.includes(a.paradigm)) list.push(a.paradigm);
    });
    return list;
  }, []);

  const modules = useMemo(() => {
    return ['All', 'Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5', 'Module 6', 'Module 7', 'Module 8'];
  }, []);

  const filteredAlgorithms = useMemo(() => {
    return algorithmRegistry.filter((algo) => {
      const matchesSearch =
        algo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        algo.paradigm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        algo.problemStatement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        algo.moduleName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesParadigm = selectedParadigm === 'All' || algo.paradigm === selectedParadigm;
      const matchesModule = selectedModule === 'All' || `Module ${algo.module}` === selectedModule;

      return matchesSearch && matchesParadigm && matchesModule;
    });
  }, [searchTerm, selectedParadigm, selectedModule]);

  // Group filtered by module
  const groupedByModule = useMemo(() => {
    const map = new Map<string, AlgorithmConfig[]>();
    filteredAlgorithms.forEach((algo) => {
      const key = algo.moduleName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(algo);
    });
    return Array.from(map.entries());
  }, [filteredAlgorithms]);

  const totalAlgorithms = algorithmRegistry.length;

  return (
    <div className="flex flex-col w-full min-h-screen bg-obsidian-900 text-chalk-100 overflow-hidden">
      {/* ========================================================================= */}
      {/* SECTION 01: HERO EXPOSITION (Fullscreen Editorial Scale)                  */}
      {/* ========================================================================= */}
      <section className="relative min-h-[90vh] flex flex-col justify-between pt-12 pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full border-b border-hairline">
        {/* Top Section Index Marker */}
        <div className="flex items-center justify-between font-mono text-xs text-chalk-500 uppercase tracking-widest pb-8">
          <div className="flex items-center gap-3">
            <span className="text-amber font-bold">[ 01 // EXPOSITION ]</span>
            <span className="hidden sm:inline-block text-chalk-600">/</span>
            <span className="hidden sm:inline-block">BCSE204L • DESIGN & ANALYSIS OF ALGORITHMS</span>
          </div>
          <div className="flex items-center gap-2 text-chalk-400">
            <span className="w-2 h-2 bg-acid-500 rounded-full animate-pulse"></span>
            <span>{totalAlgorithms} ACTIVE SIMULATION ENGINES</span>
          </div>
        </div>

        {/* Giant Typographic Statement with Asymmetric Layout */}
        <div className="relative z-10 my-auto py-8">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-2 sm:gap-4"
          >
            <div className="flex items-center gap-3 font-mono text-xs tracking-widest text-amber-glow uppercase">
              <Terminal className="w-3.5 h-3.5" />
              <span>DETERMINISTIC STATE RECURRENCE</span>
            </div>

            <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-chalk-100 leading-[0.9] text-balance">
              ALGORITHMIC <br />
              <span className="font-serif italic font-normal text-chalk-300">ARCHITECTURE.</span>
            </h1>
          </motion.div>

          {/* Subtext and Quickstart Ledger Block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-12 items-end">
            <div className="lg:col-span-7">
              <p className="text-base sm:text-lg md:text-xl text-chalk-400 font-sans font-light leading-relaxed max-w-2xl text-balance">
                An interactive computational archive dissecting all 8 course modules — from greedy Huffman trees and dynamic tabulation to branch-and-bound pruning, network flows, and 2-approximation bounds.
              </p>
            </div>

            {/* Quick Action Triggers */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 font-mono text-xs">
              <button
                onClick={() => onSelectAlgorithm('randomized-quicksort')}
                className="group flex items-center justify-between p-4 bg-chalk-100 text-obsidian-950 font-bold uppercase tracking-wider transition-all duration-300 hover:bg-amber hover:text-obsidian-950 shadow-lg shadow-black/40"
              >
                <div className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Quicksort Studio</span>
                </div>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                onClick={onNavigateComparison}
                className="group flex items-center justify-between p-4 bg-obsidian-850 text-chalk-200 border border-hairline uppercase tracking-wider transition-all duration-300 hover:border-amber hover:text-amber-glow"
              >
                <div className="flex items-center gap-2.5">
                  <GitCompare className="w-4 h-4 text-amber" />
                  <span>Compare DP vs Branch & Bound</span>
                </div>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 01 Footer Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-hairline border-t border-hairline pt-6 text-xs font-mono text-chalk-400">
          <div className="px-3 py-1 flex flex-col">
            <span className="text-chalk-600 uppercase text-[10px]">PARADIGMS</span>
            <span className="font-bold text-chalk-200 text-sm mt-0.5">8 Classifications</span>
          </div>
          <div className="px-3 py-1 flex flex-col">
            <span className="text-chalk-600 uppercase text-[10px]">TIME BOUNDS</span>
            <span className="font-bold text-amber-glow text-sm mt-0.5">O(n log n) .. O(2ⁿ)</span>
          </div>
          <div className="px-3 py-1 flex flex-col">
            <span className="text-chalk-600 uppercase text-[10px]">ENGINES</span>
            <span className="font-bold text-acid-500 text-sm mt-0.5">12 Step Generators</span>
          </div>
          <div className="px-3 py-1 flex flex-col">
            <span className="text-chalk-600 uppercase text-[10px]">ARCHITECTURE</span>
            <span className="font-bold text-chalk-200 text-sm mt-0.5">Pure Client-Side</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 02: CONTINUOUS MARQUEE TICKER (Typography Flow)                   */}
      {/* ========================================================================= */}
      <div className="w-full border-b border-hairline py-4 bg-obsidian-950 overflow-hidden flex select-none">
        <div className="flex shrink-0 items-center gap-12 animate-marquee font-mono text-xs uppercase tracking-widest text-chalk-400">
          <span>01. GREEDY HUFFMAN PREFIX CODES</span>
          <span className="text-amber">✦</span>
          <span>02. DYNAMIC PROGRAMMING RECURRENCE & LCS</span>
          <span className="text-acid-500">✦</span>
          <span>03. RANDOMIZED EXPECTED O(N LOG N) QUICKSORT</span>
          <span className="text-electric-400">✦</span>
          <span>04. N-QUEENS BACKTRACKING STATE SEARCH</span>
          <span className="text-amber">✦</span>
          <span>05. BRANCH & BOUND 0-1 KNAPSACK PRUNING</span>
          <span className="text-acid-500">✦</span>
          <span>06. FLOYD-WARSHALL ALL-PAIRS SHORTEST PATHS</span>
          <span className="text-electric-400">✦</span>
          <span>07. KMP STRING PATTERN MATCHER & LPS ARRAY</span>
          <span className="text-amber">✦</span>
          <span>08. GRAHAM SCAN COMPUTATIONAL CONVEX HULL</span>
        </div>
        <div className="flex shrink-0 items-center gap-12 animate-marquee font-mono text-xs uppercase tracking-widest text-chalk-400" aria-hidden="true">
          <span>01. GREEDY HUFFMAN PREFIX CODES</span>
          <span className="text-amber">✦</span>
          <span>02. DYNAMIC PROGRAMMING RECURRENCE & LCS</span>
          <span className="text-acid-500">✦</span>
          <span>03. RANDOMIZED EXPECTED O(N LOG N) QUICKSORT</span>
          <span className="text-electric-400">✦</span>
          <span>04. N-QUEENS BACKTRACKING STATE SEARCH</span>
          <span className="text-amber">✦</span>
          <span>05. BRANCH & BOUND 0-1 KNAPSACK PRUNING</span>
          <span className="text-acid-500">✦</span>
          <span>06. FLOYD-WARSHALL ALL-PAIRS SHORTEST PATHS</span>
          <span className="text-electric-400">✦</span>
          <span>07. KMP STRING PATTERN MATCHER & LPS ARRAY</span>
          <span className="text-amber">✦</span>
          <span>08. GRAHAM SCAN COMPUTATIONAL CONVEX HULL</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 03: HUD FILTER & SEARCH BAR (Minimal Editorial Control)           */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-16 pb-8">
        <div className="flex items-center justify-between font-mono text-xs text-chalk-500 uppercase tracking-widest pb-6">
          <div className="flex items-center gap-2">
            <span className="text-amber font-bold">[ 02 // SEARCH & FILTERS ]</span>
            <span>/ CATALOG DISSECTION</span>
          </div>
          <span>MATCHING: {filteredAlgorithms.length} / {totalAlgorithms}</span>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-4 p-2 bg-obsidian-950 border border-hairline">
          {/* Search Input */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-chalk-500 absolute left-4" />
            <input
              type="text"
              placeholder="Search algorithm, paradigm (e.g. Greedy, DP, KMP, Flow)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-obsidian-950 text-xs sm:text-sm font-mono text-chalk-200 placeholder-chalk-600 focus:outline-none focus:bg-obsidian-900 border-none"
            />
          </div>

          {/* Paradigm & Module Filters */}
          <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 lg:border-l border-hairline pt-2 lg:pt-0 lg:pl-3">
            {/* Paradigm Dropdown */}
            <div className="flex items-center gap-2 px-3 py-2 bg-obsidian-900 border border-hairline text-xs font-mono text-chalk-300">
              <Filter className="w-3.5 h-3.5 text-amber" />
              <select
                value={selectedParadigm}
                onChange={(e) => setSelectedParadigm(e.target.value)}
                className="bg-transparent text-chalk-200 text-xs focus:outline-none cursor-pointer"
              >
                {paradigms.map((p) => (
                  <option key={p} value={p} className="bg-obsidian-950 text-chalk-200">
                    {p === 'All' ? 'All Paradigms' : p}
                  </option>
                ))}
              </select>
            </div>

            {/* Module Dropdown */}
            <div className="flex items-center gap-2 px-3 py-2 bg-obsidian-900 border border-hairline text-xs font-mono text-chalk-300">
              <Layers className="w-3.5 h-3.5 text-acid-500" />
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="bg-transparent text-chalk-200 text-xs focus:outline-none cursor-pointer"
              >
                {modules.map((m) => (
                  <option key={m} value={m} className="bg-obsidian-950 text-chalk-200">
                    {m === 'All' ? 'All Modules (1-8)' : m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 04: SYLLABUS LEDGER INDEX (Editorial Numbered Chapters 01 - 08)   */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-12 flex flex-col gap-20">
        {groupedByModule.length === 0 ? (
          <div className="p-16 text-center text-chalk-500 font-mono text-xs border border-hairline bg-obsidian-950">
            NO ALGORITHMS MATCH THE ACTIVE CRITERIA. ADJUST SEARCH QUERY OR PARADIGM FILTER.
          </div>
        ) : (
          groupedByModule.map(([moduleName, algos], moduleIdx) => {
            const moduleNumber = algos[0]?.module || moduleIdx + 1;
            const formattedModuleNum = String(moduleNumber).padStart(2, '0');

            return (
              <motion.div
                key={moduleName}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6 }}
                className="relative flex flex-col gap-6"
              >
                {/* Chapter Section Header (Editorial Style with Numeral Watermark) */}
                <div className="relative flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-hairline pb-4 gap-2">
                  <div className="flex items-baseline gap-4">
                    <span className="font-display font-black text-3xl sm:text-4xl text-amber">
                      {formattedModuleNum}
                    </span>
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-chalk-100 uppercase tracking-tight">
                      {moduleName}
                    </h2>
                  </div>

                  <span className="font-mono text-xs text-chalk-500 uppercase tracking-widest">
                    [ {algos.length} ALGORITHM{algos.length > 1 ? 'S' : ''} ]
                  </span>
                </div>

                {/* Editorial Ledger Grid for the Module */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {algos.map((algo, algoIdx) => {
                    const algoNum = `${formattedModuleNum}.${String(algoIdx + 1).padStart(2, '0')}`;

                    return (
                      <div
                        key={algo.id}
                        onClick={() => onSelectAlgorithm(algo.id)}
                        className="group relative flex flex-col justify-between p-7 bg-obsidian-950 border border-hairline hover:border-amber/60 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        {/* Numeral Watermark Background */}
                        <span className="absolute -right-2 -bottom-6 font-display font-black text-8xl text-obsidian-850 select-none pointer-events-none group-hover:text-amber/5 transition-colors">
                          {String(algoIdx + 1).padStart(2, '0')}
                        </span>

                        <div className="relative z-10 flex flex-col gap-4">
                          {/* Top Meta Line */}
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span className="text-amber font-semibold tracking-wider">
                              {algoNum}
                            </span>
                            <span className="px-2 py-0.5 bg-obsidian-850 border border-hairline text-chalk-400 text-[10px] uppercase">
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

                        {/* Bottom Complexity Ledger & Arrow Trigger */}
                        <div className="relative z-10 pt-6 mt-6 border-t border-hairline flex items-center justify-between font-mono text-[11px]">
                          <div className="flex flex-col gap-1 text-chalk-400">
                            <span className="flex items-center gap-1.5 text-amber-glow font-medium">
                              <Clock className="w-3 h-3" />
                              <span>{algo.complexity.timeAverage || algo.complexity.timeWorst}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-acid-500 font-medium">
                              <Cpu className="w-3 h-3" />
                              <span>{algo.complexity.spaceWorst}</span>
                            </span>
                          </div>

                          <div className="w-8 h-8 flex items-center justify-center bg-obsidian-850 group-hover:bg-amber group-hover:text-obsidian-950 text-chalk-400 border border-hairline transition-all">
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </section>
    </div>
  );
};

