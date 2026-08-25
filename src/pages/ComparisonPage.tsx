import React, { useState, useMemo, useEffect } from 'react';
import { knapsackDPSteps } from '../algorithms/knapsackDP';
import { knapsackBBSteps } from '../algorithms/knapsackBB';
import { GridTableVisualizer } from '../components/visualizers/GridTableVisualizer';
import { TreeVisualizer } from '../components/visualizers/TreeVisualizer';
import { PlaybackControls } from '../components/common/PlaybackControls';
import { GitCompare } from 'lucide-react';

export const ComparisonPage: React.FC = () => {
  const [weights, setWeights] = useState<number[]>([2, 3, 4, 5]);
  const [values, setValues] = useState<number[]>([3, 4, 5, 6]);
  const [capacity, setCapacity] = useState<number>(5);

  const dpSteps = useMemo(() => {
    const gen = knapsackDPSteps({ weights, values, capacity });
    return Array.from(gen);
  }, [weights, values, capacity]);

  const bbSteps = useMemo(() => {
    const gen = knapsackBBSteps({ weights, values, capacity });
    return Array.from(gen);
  }, [weights, values, capacity]);

  const maxSteps = Math.max(dpSteps.length, bbSteps.length);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [weights, values, capacity]);

  useEffect(() => {
    let timer: number | null = null;
    if (isPlaying) {
      const intervalMs = Math.max(150, 1000 / speed);
      timer = window.setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev < maxSteps - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, speed, maxSteps]);

  const currDPStep = dpSteps[Math.min(currentStepIdx, dpSteps.length - 1)];
  const currBBStep = bbSteps[Math.min(currentStepIdx, bbSteps.length - 1)];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <GitCompare className="w-4 h-4" />
            <span>Paradigm Showdown (Module 2)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            0-1 Knapsack: Dynamic Programming vs Branch & Bound
          </h1>
        </div>

        {/* Input Parameters bar */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Weights:</span>
            <input
              type="text"
              value={weights.join(', ')}
              onChange={(e) =>
                setWeights(
                  e.target.value
                    .split(',')
                    .map((s) => parseFloat(s.trim()))
                    .filter((n) => !isNaN(n))
                )
              }
              className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Values:</span>
            <input
              type="text"
              value={values.join(', ')}
              onChange={(e) =>
                setValues(
                  e.target.value
                    .split(',')
                    .map((s) => parseFloat(s.trim()))
                    .filter((n) => !isNaN(n))
                )
              }
              className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Capacity:</span>
            <input
              type="number"
              value={capacity}
              min={1}
              max={20}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
              className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Global Comparison Playback Bar */}
      <PlaybackControls
        currentStep={currentStepIdx}
        totalSteps={maxSteps}
        isPlaying={isPlaying}
        speed={speed}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onStepForward={() => setCurrentStepIdx((p) => Math.min(maxSteps - 1, p + 1))}
        onStepBackward={() => setCurrentStepIdx((p) => Math.max(0, p - 1))}
        onReset={() => {
          setIsPlaying(false);
          setCurrentStepIdx(0);
        }}
        onSeek={(idx) => setCurrentStepIdx(idx)}
        onSpeedChange={(s) => setSpeed(s)}
      />

      {/* Side-by-Side Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: DP Version */}
        <div className="flex flex-col gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-mono text-sky-400 font-semibold uppercase">
                Dynamic Programming
              </span>
              <h3 className="text-lg font-bold text-white">Bottom-Up DP Table</h3>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-400">
              <div>Time: O(n · W)</div>
              <div>Space: O(n · W)</div>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-mono">
            Step: {Math.min(currentStepIdx + 1, dpSteps.length)} / {dpSteps.length} | {currDPStep?.title}
          </div>

          {currDPStep && <GridTableVisualizer step={currDPStep} />}

          {/* Metrics summary */}
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
              Table Iterations: <strong className="text-sky-300">{currDPStep?.metrics.iterations || 0}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
              Optimal Value: <strong className="text-emerald-400">{currDPStep?.state.maxValue ?? '-'}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Branch & Bound Version */}
        <div className="flex flex-col gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">
                Branch & Bound
              </span>
              <h3 className="text-lg font-bold text-white">State-Space Decision Tree</h3>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-400">
              <div>Time: O(2ⁿ) worst</div>
              <div>Space: O(2ⁿ) worst</div>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-mono">
            Step: {Math.min(currentStepIdx + 1, bbSteps.length)} / {bbSteps.length} | {currBBStep?.title}
          </div>

          {currBBStep && <TreeVisualizer step={currBBStep} />}

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs font-mono">
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
              Nodes Explored: <strong className="text-cyan-300">{currBBStep?.metrics.nodesExplored || 0}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
              Pruned Branches: <strong className="text-rose-400">{currBBStep?.metrics.prunedNodes || 0}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
              Best Value: <strong className="text-emerald-400">{currBBStep?.state.bestValue ?? 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
