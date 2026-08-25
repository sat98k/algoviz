import React, { useState, useMemo } from 'react';
import { algorithmRegistry } from '../config/algorithmRegistry';
import { AlgorithmConfig } from '../types/algorithm';
import { Search, ArrowRight, Play, Sparkles, Filter, Layers, Clock, Cpu, GitCompare } from 'lucide-react';

interface HomeProps {
  onSelectAlgorithm: (id: string) => void;
  onNavigateComparison: () => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectAlgorithm, onNavigateComparison }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParadigm, setSelectedParadigm] = useState<string>('All');
  const [selectedModule, setSelectedModule] = useState<string>('All');

  const paradigms = useMemo(() => {
    const list: string[] = ['All'];
    algorithmRegistry.forEach((a) => {
      if (!list.includes(a.paradigm)) list.push(a.paradigm);
    });
    return list;
  }, []);

  const modules = useMemo(() => {
    return ['All', 'Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5', 'Module 6', 'Module 7'];
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

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden p-8 md:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-3xl flex flex-col gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/40 text-sky-300 text-xs font-mono font-medium w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BCSE204L — Design and Analysis of Algorithms</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Interactive DAA <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Algorithm Visualizer</span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans">
            Step-by-step interactive animations covering all 8 syllabus modules — from greedy Huffman trees and Kadane’s dynamic scan to Edmonds-Karp network flows, Graham’s convex hulls, and 2-approximation bounds.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectAlgorithm('randomized-quicksort')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/25"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Quickstart (Quicksort)</span>
            </button>

            <button
              onClick={onNavigateComparison}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-semibold text-sm transition-all"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare DP vs Branch & Bound</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search algorithms, paradigms (e.g. Greedy, DP, KMP)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-sans text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Paradigm & Module Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Paradigm Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedParadigm}
              onChange={(e) => setSelectedParadigm(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              {paradigms.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-slate-200">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Module Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              {modules.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-slate-200">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Algorithm Catalog Grouped by Module */}
      <section className="flex flex-col gap-10">
        {groupedByModule.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl">
            No algorithms match the current search or filters.
          </div>
        ) : (
          groupedByModule.map(([moduleName, algos]) => (
            <div key={moduleName} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50"></span>
                <h2 className="text-lg font-bold text-white tracking-wide font-mono">
                  {moduleName}
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  ({algos.length} algorithm{algos.length > 1 ? 's' : ''})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {algos.map((algo) => (
                  <div
                    key={algo.id}
                    onClick={() => onSelectAlgorithm(algo.id)}
                    className="group relative flex flex-col justify-between p-6 bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-sky-500/50 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-sky-500/10 hover:-translate-y-1"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Top Paradigm & Module Header */}
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-sky-950 border border-sky-600/40 text-sky-300">
                          {algo.paradigm}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Module {algo.module}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                        {algo.name}
                      </h3>

                      {/* Problem Statement */}
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {algo.problemStatement}
                      </p>
                    </div>

                    {/* Footer Complexities & CTA */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1 text-amber-300/90">
                          <Clock className="w-3 h-3" /> {algo.complexity.timeAverage || algo.complexity.timeWorst}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-300/90">
                          <Cpu className="w-3 h-3" /> {algo.complexity.spaceWorst}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-sky-500 text-slate-300 group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};
