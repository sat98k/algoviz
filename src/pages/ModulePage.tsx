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
  Layers,
  GitFork,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export type Module2SubCategory = 'dp' | 'backtracking' | 'branch-and-bound';

export interface ParadigmTrackInfo {
  id: Module2SubCategory;
  numeral: string;
  name: string;
  shortName: string;
  badge: string;
  tagline: string;
  description: string;
  paradigm: string;
  accent: 'amber' | 'cyan' | 'acid';
  complexity: string;
  coreConcepts: string[];
  algorithmsCount: number;
}

export const MODULE_2_PARADIGM_TRACKS: Record<Module2SubCategory, ParadigmTrackInfo> = {
  dp: {
    id: 'dp',
    numeral: '01',
    name: 'Dynamic Programming',
    shortName: 'DP',
    badge: '02.A • DYNAMIC PROGRAMMING',
    tagline: 'Solve small questions once, reuse the answers',
    description:
      'Big problems often contain the same small questions again and again. DP answers each small question once, writes it in a table, and builds the final answer from those saved answers instead of recomputing them.',
    paradigm: 'Dynamic Programming',
    accent: 'amber',
    complexity: 'O(n · W) to O(n³)',
    coreConcepts: [
      'A rule that builds each answer from smaller ones (the recurrence)',
      'A table that stores every small answer',
      'Filling the table so the answers it needs already exist',
      'Tracing back through the table to see which choices were made',
    ],
    algorithmsCount: 5,
  },
  backtracking: {
    id: 'backtracking',
    numeral: '02',
    name: 'Backtracking',
    shortName: 'Backtracking',
    badge: '02.B • BACKTRACKING',
    tagline: 'Try a choice, undo it if it leads nowhere',
    description:
      'Builds a solution one choice at a time. As soon as a partial solution breaks a rule, it undoes the last choice (backtracks) and tries the next option, so hopeless options are never finished.',
    paradigm: 'Backtracking',
    accent: 'cyan',
    complexity: 'O(kⁿ) / O(n!) worst-case with pruning',
    coreConcepts: [
      'A tree of choices, explored one branch at a time',
      'Checking the rules after every choice',
      'Undoing a choice at a dead end (backtracking)',
      'Stopping at the first solution, or finding all of them',
    ],
    algorithmsCount: 3,
  },
  'branch-and-bound': {
    id: 'branch-and-bound',
    numeral: '03',
    name: 'Branch & Bound',
    shortName: 'Branch & Bound',
    badge: '02.C • BRANCH & BOUND',
    tagline: 'Explore the most promising option first',
    description:
      'Like backtracking it explores a tree of choices, but every option gets an optimistic estimate of the best it could ever reach (a bound). It explores the most promising option next and skips any option whose bound cannot beat the best answer found so far.',
    paradigm: 'Branch & Bound',
    accent: 'acid',
    complexity: 'Exponential worst-case, optimal average pruning',
    coreConcepts: [
      'An optimistic estimate (bound) for every option',
      'Always exploring the most promising option next',
      'Remembering the best answer found so far',
      'Skipping options that cannot beat it (pruning)',
    ],
    algorithmsCount: 2,
  },
};

export function getModule2SubCategory(paradigm: string): Module2SubCategory | null {
  const p = paradigm.toLowerCase();
  if (p.includes('dynamic') || p.includes('dp')) return 'dp';
  if (p.includes('backtrack')) return 'backtracking';
  if (p.includes('branch') || p.includes('bound')) return 'branch-and-bound';
  return null;
}

export const MODULE_DESCRIPTIONS: Record<
  number,
  { title: string; subtitle: string; description: string; paradigms: string[] }
> = {
  1: {
    title: 'Greedy Algorithms & Divide-and-Conquer',
    subtitle: 'Take the best-looking step each time, or split the problem in half',
    description:
      'Greedy algorithms build an answer by always taking the choice that looks best right now (packing the most valuable cheese per kg, giving common letters short codes). Divide and conquer splits a problem into halves, solves each half and combines the answers (finding the richest stretch of numbers, multiplying big numbers faster).',
    paradigms: ['Greedy', 'Divide & Conquer'],
  },
  2: {
    title: 'Dynamic Programming, Backtracking, Branch & Bound',
    subtitle: 'Reuse small answers, or search through choices cleverly',
    description:
      'Three ways to handle problems with very many possible choices. Dynamic programming fills a table of small answers (Knapsack, LCS, Matrix Chain, Assembly Line, TSP). Backtracking tries choices and undoes the ones that fail (N-Queens, Subset Sum, Graph Coloring). Branch and bound skips choices that cannot beat the best answer so far (Knapsack, Job Selection).',
    paradigms: ['Dynamic Programming', 'Backtracking', 'Branch & Bound'],
  },
  3: {
    title: 'String Matching Algorithms',
    subtitle: 'Find a word inside a long text',
    description:
      'Four ways to find every place a pattern appears in a text: slide it along and check every letter (Naive), reuse what was already matched (KMP), compare quick number fingerprints first (Rabin-Karp), or build a tree of the text so any search is fast (Suffix Tree).',
    paradigms: ['String Matching'],
  },
  4: {
    title: 'Graph Algorithms & Network Flow',
    subtitle: 'Cheapest routes on a map, and the most a pipe network can carry',
    description:
      'Shortest paths: the cheapest route from one place to every other (Bellman-Ford) or between every pair of places (Floyd-Warshall), even when some roads have negative costs. Network flow: how much can be sent from a source to a sink through pipes of limited size (Ford-Fulkerson, Edmonds-Karp, Push-Relabel).',
    paradigms: ['SSSP', 'APSP', 'Max Flow'],
  },
  5: {
    title: 'Geometric Algorithms',
    subtitle: 'Problems about points and lines on a flat surface',
    description:
      'Find the tightest fence around a set of points (the convex hull), either by sorting the points around a corner and removing dents (Graham’s Scan) or by wrapping around the outside point by point (Jarvis’ March), and check whether any two line segments cross (Sweep Line).',
    paradigms: ['Computational Geometry', 'Convex Hull'],
  },
  6: {
    title: 'Randomized Algorithms',
    subtitle: 'Algorithms that make random choices on purpose',
    description:
      'Randomness can make an algorithm fast on every input, or make a hard problem simple. Sort by picking random pivots (Quicksort), see how often you hire when candidates arrive in random order (Hiring Problem), and find the weakest cut in a network by merging random neighbours (Karger).',
    paradigms: ['Randomized', 'Online Selection', 'Min-Cut'],
  },
  7: {
    title: 'Complexity Classes & Approximation Algorithms',
    subtitle: 'Quick answers that are guaranteed to be close to the best',
    description:
      'Some problems are so hard that no known method finds the best answer quickly. These algorithms run fast and promise how far from the best they can be: at most twice the best (Vertex Cover, TSP) or within a small factor (Set Cover).',
    paradigms: ['Approximation', 'NP-Completeness'],
  },
};

interface ModulePageProps {
  moduleNumber: number;
  subCategory?: string | null;
  onSelectAlgorithm: (id: string) => void;
  onSelectModule: (moduleNumber: number, subCategory?: string | null) => void;
  onSelectSubCategory?: (subCategory: string | null) => void;
  onBack: () => void;
}

export const ModulePage: React.FC<ModulePageProps> = ({
  moduleNumber,
  subCategory,
  onSelectAlgorithm,
  onSelectModule,
  onSelectSubCategory,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewAllGrid, setViewAllGrid] = useState(false);
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

  // Active track if in module 2 and a valid subcategory is provided
  const activeTrack: ParadigmTrackInfo | null = useMemo(() => {
    if (moduleNumber !== 2 || !subCategory) return null;
    const cat = subCategory.toLowerCase() as Module2SubCategory;
    return MODULE_2_PARADIGM_TRACKS[cat] || null;
  }, [moduleNumber, subCategory]);

  // Algorithms filtered by active subcategory (if active), otherwise all module algorithms
  const targetAlgorithms = useMemo(() => {
    if (moduleNumber === 2 && activeTrack) {
      return moduleAlgorithms.filter(
        (algo) => getModule2SubCategory(algo.paradigm) === activeTrack.id
      );
    }
    return moduleAlgorithms;
  }, [moduleNumber, activeTrack, moduleAlgorithms]);

  // Search filtered algorithms
  const filteredAlgorithms = useMemo(() => {
    if (!searchTerm.trim()) return targetAlgorithms;
    const term = searchTerm.toLowerCase();
    return targetAlgorithms.filter(
      (algo) =>
        algo.name.toLowerCase().includes(term) ||
        algo.paradigm.toLowerCase().includes(term) ||
        algo.problemStatement.toLowerCase().includes(term)
    );
  }, [targetAlgorithms, searchTerm]);

  const formattedModuleNum = String(moduleNumber).padStart(2, '0');

  // Handle switching subcategory
  const handleSelectSubCategory = (cat: Module2SubCategory | null) => {
    if (onSelectSubCategory) {
      onSelectSubCategory(cat);
    } else {
      onSelectModule(2, cat);
    }
  };

  // Group module 2 algorithms by category for the 3-split overview cards
  const module2Grouped = useMemo(() => {
    return {
      dp: moduleAlgorithms.filter((a) => getModule2SubCategory(a.paradigm) === 'dp'),
      backtracking: moduleAlgorithms.filter((a) => getModule2SubCategory(a.paradigm) === 'backtracking'),
      'branch-and-bound': moduleAlgorithms.filter(
        (a) => getModule2SubCategory(a.paradigm) === 'branch-and-bound'
      ),
    };
  }, [moduleAlgorithms]);

  // RENDER: Module 2 Dedicated Sub-Category Page (e.g. #/module/2/dp)
  if (moduleNumber === 2 && activeTrack) {
    const trackOrder: Module2SubCategory[] = ['dp', 'backtracking', 'branch-and-bound'];
    const currentIndex = trackOrder.indexOf(activeTrack.id);
    const prevTrackId = currentIndex > 0 ? trackOrder[currentIndex - 1] : null;
    const nextTrackId = currentIndex < trackOrder.length - 1 ? trackOrder[currentIndex + 1] : null;

    return (
      <div className="flex flex-col w-full min-h-screen bg-obsidian-900 text-chalk-100">
        {/* Top Header & Breadcrumb */}
        <section className="border-b border-hairline bg-obsidian-950/70 pt-7 pb-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
          {/* Navigation Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between font-mono text-xs text-chalk-400 mb-6 gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectSubCategory(null)}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 hover:text-amber border border-hairline transition-all duration-200"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>← MODULE 02 OVERVIEW</span>
              </button>

              <button
                onClick={onBack}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-400 hover:text-chalk-200 border border-hairline transition-colors"
              >
                <span>ALL MODULES</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber animate-pulse"></span>
              <span className="uppercase text-chalk-400 font-semibold">
                MODULE 02 / {activeTrack.name.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Quick Sub-Category Switcher Tab Bar */}
          <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-hairline/60">
            <button
              onClick={() => handleSelectSubCategory(null)}
              className="px-3 py-1.5 bg-obsidian-900/80 hover:bg-obsidian-850 text-chalk-400 hover:text-chalk-200 border border-hairline font-mono text-[11px] tracking-wider uppercase transition-all"
            >
              ← HUB
            </button>

            {trackOrder.map((trackKey) => {
              const track = MODULE_2_PARADIGM_TRACKS[trackKey];
              const isActive = track.id === activeTrack.id;

              return (
                <button
                  key={track.id}
                  onClick={() => handleSelectSubCategory(track.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all border ${
                    isActive
                      ? 'bg-amber/15 border-amber text-amber shadow-sm shadow-amber/10'
                      : 'bg-obsidian-950 hover:bg-obsidian-850 border-hairline text-chalk-400 hover:text-chalk-200'
                  }`}
                >
                  <span className={isActive ? 'text-amber' : 'text-chalk-400'}>{track.numeral}</span>
                  <span>{track.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-sm text-[10px] ${
                      isActive ? 'bg-amber text-obsidian-950' : 'bg-obsidian-900 text-chalk-400'
                    }`}
                  >
                    {track.algorithmsCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Track Title Block */}
          <div className="flex flex-col gap-3 mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display font-black text-3xl sm:text-4xl text-amber">
                {activeTrack.badge}
              </span>
              <span className="px-2.5 py-0.5 bg-obsidian-900 border border-acid-500/30 text-acid-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
                {activeTrack.algorithmsCount} ALGORITHMS
              </span>
              <span className="px-2.5 py-0.5 bg-obsidian-900 border border-hairline text-amber-glow font-mono text-[11px] uppercase tracking-wider">
                COMPLEXITY: {activeTrack.complexity}
              </span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-chalk-100 tracking-tight">
              {activeTrack.name}
            </h1>

            <p className="font-mono text-xs text-amber-glow/90 italic tracking-wide">
              {activeTrack.tagline}
            </p>

            <p className="text-sm sm:text-base text-chalk-300 font-sans max-w-4xl leading-relaxed mt-1">
              {activeTrack.description}
            </p>

            {/* Core Concepts Banner */}
            <div className="mt-3 p-4 bg-obsidian-950 border border-hairline/80 flex flex-col gap-2 max-w-4xl">
              <span className="font-mono text-[11px] text-chalk-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber" />
                <span>Foundational Principles & Theory Invariants</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans text-xs text-chalk-300">
                {activeTrack.coreConcepts.map((concept, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber flex-shrink-0 mt-0.5" />
                    <span>{concept}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* In-Track Search Filter */}
          <div className="mt-8 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96 flex items-center group">
              <Search className="w-4 h-4 text-chalk-400 absolute left-3.5 pointer-events-none transition-colors group-focus-within:text-amber" />
              <input
                type="text"
                placeholder={`Search ${activeTrack.algorithmsCount} ${activeTrack.shortName} algorithms...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 text-xs font-mono text-chalk-100 placeholder:text-chalk-400 border border-hairline hover:border-chalk-400/40 focus:border-amber focus:ring-1 focus:ring-amber/40 focus:outline-none transition-all shadow-sm"
              />
            </div>

            <span className="font-mono text-xs text-chalk-400 self-end sm:self-center">
              Showing {filteredAlgorithms.length} of {activeTrack.algorithmsCount} algorithms
            </span>
          </div>
        </section>

        {/* Algorithms Grid */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-10 flex-1">
          {filteredAlgorithms.length === 0 ? (
            <div className="p-16 text-center text-chalk-400 font-mono text-xs border border-hairline bg-obsidian-950">
              No algorithms in {activeTrack.name} match your search query "{searchTerm}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlgorithms.map((algo, idx) => {
                const algoNum = `02.${activeTrack.numeral}.${String(idx + 1).padStart(2, '0')}`;

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

          {/* Bottom Navigation Between Tracks */}
          <div className="mt-12 pt-8 border-t border-hairline flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            {prevTrackId ? (
              <button
                onClick={() => handleSelectSubCategory(prevTrackId)}
                className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-950 hover:bg-obsidian-850 border border-hairline text-chalk-300 hover:text-amber transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>PREVIOUS: {MODULE_2_PARADIGM_TRACKS[prevTrackId].name.toUpperCase()}</span>
              </button>
            ) : (
              <div></div>
            )}

            <button
              onClick={() => handleSelectSubCategory(null)}
              className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-900 hover:bg-obsidian-850 border border-hairline text-chalk-300 hover:text-chalk-100 transition-colors"
            >
              <Grid className="w-4 h-4 text-amber" />
              <span>MODULE 02 OVERVIEW</span>
            </button>

            {nextTrackId ? (
              <button
                onClick={() => handleSelectSubCategory(nextTrackId)}
                className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-950 hover:bg-obsidian-850 border border-hairline text-chalk-300 hover:text-amber transition-colors"
              >
                <span>NEXT: {MODULE_2_PARADIGM_TRACKS[nextTrackId].name.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div></div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // RENDER: Module 2 Hub / Split Portal View (#/module/2)
  if (moduleNumber === 2 && !viewAllGrid && !searchTerm.trim()) {
    const tracks: ParadigmTrackInfo[] = [
      MODULE_2_PARADIGM_TRACKS.dp,
      MODULE_2_PARADIGM_TRACKS.backtracking,
      MODULE_2_PARADIGM_TRACKS['branch-and-bound'],
    ];

    return (
      <div className="flex flex-col w-full min-h-screen bg-obsidian-900 text-chalk-100">
        {/* Top Breadcrumbs & Module Header */}
        <section className="border-b border-hairline bg-obsidian-950/60 pt-8 pb-10 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
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
              <span className="uppercase text-chalk-400 font-semibold">MODULE 02 OF 07</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display font-black text-4xl sm:text-5xl text-amber">02</span>
              <div className="h-8 w-px bg-hairline hidden sm:block"></div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-obsidian-900 border border-hairline text-amber-glow font-mono text-[11px] uppercase tracking-wider font-semibold">
                  3 PARADIGM TRACKS
                </span>
                <span className="px-2.5 py-0.5 bg-obsidian-900 border border-acid-500/30 text-acid-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
                  10 ALGORITHMS TOTAL
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

          {/* Quick Search & View Switcher */}
          <div className="mt-8 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96 flex items-center group">
              <Search className="w-4 h-4 text-chalk-400 absolute left-3.5 pointer-events-none transition-colors group-focus-within:text-amber" />
              <input
                type="text"
                placeholder="Search all 10 Module 2 algorithms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 text-xs font-mono text-chalk-100 placeholder:text-chalk-400 border border-hairline hover:border-chalk-400/40 focus:border-amber focus:ring-1 focus:ring-amber/40 focus:outline-none transition-all shadow-sm"
              />
            </div>

            <button
              onClick={() => setViewAllGrid(true)}
              className="font-mono text-xs text-chalk-400 hover:text-amber border border-hairline px-3 py-2 bg-obsidian-950 hover:bg-obsidian-900 transition-colors flex items-center gap-2"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>VIEW ALL 10 IN SINGLE GRID</span>
            </button>
          </div>
        </section>

        {/* 3 PARADIGM TRACK HERO CARDS */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-10 flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber font-semibold">
              <BookOpen className="w-4 h-4" />
              <span>CHOOSE A PARADIGM TRACK TO ENTER DEDICATED CONTENTS</span>
            </div>
            <span className="font-mono text-xs text-chalk-400">3 Structured Methodologies</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tracks.map((track, idx) => {
              const algosInTrack = module2Grouped[track.id];
              const IconComponent =
                track.id === 'dp' ? Layers : track.id === 'backtracking' ? GitFork : SlidersHorizontal;

              return (
                <motion.div
                  key={track.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  onClick={() => handleSelectSubCategory(track.id)}
                  className="group relative flex flex-col justify-between p-7 bg-obsidian-950 border border-hairline hover:border-amber hover:bg-obsidian-900/70 transition-all duration-300 cursor-pointer overflow-hidden shadow-xl shadow-black/40"
                >
                  {/* Large Numeral Watermark */}
                  <span className="absolute -right-3 -bottom-5 font-display font-black text-8xl text-obsidian-850 select-none pointer-events-none group-hover:text-amber/5 transition-colors">
                    {track.numeral}
                  </span>

                  <div className="relative z-10 flex flex-col gap-4">
                    {/* Header: Track Pill & Algorithm Count */}
                    <div className="flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber/10 border border-amber/30 text-amber font-bold">
                          TRACK {track.numeral}
                        </span>
                        <div className="p-1.5 bg-obsidian-900 text-amber border border-hairline">
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-obsidian-900 border border-acid-500/30 text-acid-400 font-mono text-[11px] font-bold">
                        {track.algorithmsCount} ALGORITHMS
                      </span>
                    </div>

                    {/* Paradigm Title */}
                    <div>
                      <h2 className="font-display font-bold text-2xl text-chalk-100 group-hover:text-amber-glow transition-colors leading-snug">
                        {track.name}
                      </h2>
                      <p className="font-mono text-xs text-amber-glow/85 italic mt-1">
                        {track.tagline}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-chalk-400 font-sans leading-relaxed line-clamp-3">
                      {track.description}
                    </p>

                    {/* Algorithms List Preview */}
                    <div className="pt-3 border-t border-hairline/70 flex flex-col gap-1.5">
                      <span className="font-mono text-[10px] text-chalk-400 uppercase tracking-wider font-semibold">
                        Included Algorithms:
                      </span>
                      <div className="flex flex-col gap-1">
                        {algosInTrack.map((algo, aIdx) => (
                          <div
                            key={algo.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAlgorithm(algo.id);
                            }}
                            className="group/item flex items-center justify-between px-2.5 py-1.5 bg-obsidian-900 hover:bg-amber hover:text-obsidian-950 border border-hairline/60 transition-colors text-chalk-300 font-mono text-xs cursor-pointer"
                          >
                            <span className="truncate pr-2">
                              {aIdx + 1}. {algo.name}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover/item:opacity-100 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Big CTA Action Button */}
                  <div className="relative z-10 pt-5 mt-5 border-t border-hairline flex items-center justify-between">
                    <span className="font-mono text-[11px] text-chalk-400">
                      {track.complexity}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSubCategory(track.id);
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 bg-obsidian-900 group-hover:bg-amber group-hover:text-obsidian-950 text-amber font-mono font-bold text-xs border border-amber/40 transition-all shadow-sm"
                    >
                      <span>EXPLORE {track.shortName.toUpperCase()}</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Module Switcher Pagination */}
          <div className="mt-12 pt-8 border-t border-hairline flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <button
              onClick={() => onSelectModule(1)}
              className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-950 hover:bg-obsidian-850 border border-hairline text-chalk-300 hover:text-amber transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>PREVIOUS: MODULE 01</span>
            </button>

            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-900 hover:bg-obsidian-850 border border-hairline text-chalk-300 hover:text-chalk-100 transition-colors"
            >
              <Grid className="w-4 h-4 text-amber" />
              <span>VIEW ALL 7 MODULES</span>
            </button>

            <button
              onClick={() => onSelectModule(3)}
              className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-950 hover:bg-obsidian-850 border border-hairline text-chalk-300 hover:text-amber transition-colors"
            >
              <span>NEXT: MODULE 03</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    );
  }

  // RENDER: Default Standard Algorithms Grid (For Modules 1, 3, 4, 5, 6, 7 OR Module 2 with search/view-all)
  return (
    <div className="flex flex-col w-full min-h-screen bg-obsidian-900 text-chalk-100">
      {/* Top Breadcrumbs & Module Header */}
      <section className="border-b border-hairline bg-obsidian-950/60 pt-8 pb-10 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between font-mono text-xs text-chalk-400 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="group flex items-center gap-2 px-3 py-1.5 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 hover:text-amber border border-hairline transition-all duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>← ALL MODULES</span>
            </button>

            {moduleNumber === 2 && viewAllGrid && (
              <button
                onClick={() => setViewAllGrid(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-obsidian-900 hover:bg-obsidian-850 text-amber border border-amber/30 transition-colors"
              >
                <span>← 3 TRACKS SPLIT</span>
              </button>
            )}
          </div>

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

          <div className="flex items-center gap-3 self-end sm:self-center">
            {moduleNumber === 2 && (
              <button
                onClick={() => setViewAllGrid(false)}
                className="font-mono text-xs text-amber hover:underline"
              >
                Switch to 3 Paradigm Tracks
              </button>
            )}
            <span className="font-mono text-xs text-chalk-400">
              Showing {filteredAlgorithms.length} of {moduleAlgorithms.length} algorithms
            </span>
          </div>
        </div>
      </section>

      {/* Algorithms Grid */}
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

