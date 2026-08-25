import React, { useState, useMemo, useEffect } from 'react';
import { knapsackDPSteps } from '../algorithms/knapsackDP';
import { knapsackBBSteps } from '../algorithms/knapsackBB';
import { GridTableVisualizer } from '../components/visualizers/GridTableVisualizer';
import { TreeVisualizer } from '../components/visualizers/TreeVisualizer';
import { PlaybackControls } from '../components/common/PlaybackControls';
import { motion, useReducedMotion } from 'framer-motion';
import { GitCompare } from 'lucide-react';

export const ComparisonPage: React.FC = () => {
  const [weights, setWeights] = useState<number[]>([2, 3, 4, 5]);
  const [values, setValues] = useState<number[]>([3, 4, 5, 6]);
  const [capacity, setCapacity] = useState<number>(5);
  const shouldReduceMotion = useReducedMotion();

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
    <div className="flex flex-col gap-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Top Header & Parameters Ribbon */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-6 pb-6 border-b border-hairline"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-amber uppercase tracking-widest">
              <GitCompare className="w-3.5 h-3.5" />
              <span>[ 02 // PARADIGM SHOWDOWN ]</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl tracking-tighter text-chalk-100 mt-2">
              0-1 KNAPSACK <span className="font-serif italic font-normal text-chalk-300">DUAL ENGINE.</span>
            </h1>
          </div>

          {/* Input Parameters Monospace Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-obsidian-950 p-4 border border-hairline font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-chalk-500 uppercase">WEIGHTS:</span>
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
                className="w-28 px-2.5 py-1 bg-obsidian-900 border border-hairline text-chalk-200 focus:outline-none focus:border-amber"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-chalk-500 uppercase">VALUES:</span>
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
                className="w-28 px-2.5 py-1 bg-obsidian-900 border border-hairline text-chalk-200 focus:outline-none focus:border-amber"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-chalk-500 uppercase">CAPACITY:</span>
              <input
                type="number"
                value={capacity}
                min={1}
                max={20}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2.5 py-1 bg-obsidian-900 border border-hairline text-chalk-200 focus:outline-none focus:border-amber"
              />
            </div>
          </div>
        </div>
      </motion.div>

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

      {/* Side-by-Side Comparative Showdown Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: DP Engine */}
        <div className="flex flex-col gap-4 p-6 bg-obsidian-950 border border-hairline">
          {/* Column Header */}
          <div className="flex items-start justify-between pb-4 border-b border-hairline">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-amber font-semibold">
                [ 01 // DYNAMIC PROGRAMMING ]
              </span>
              <h3 className="font-display font-bold text-2xl text-chalk-100 mt-1">
                Bottom-Up Tabulation
              </h3>
            </div>
            <div className="text-right font-mono text-[11px] text-chalk-500">
              <div>TIME: <strong className="text-chalk-300">O(n · W)</strong></div>
              <div>SPACE: <strong className="text-chalk-300">O(n · W)</strong></div>
            </div>
          </div>

          <div className="font-mono text-xs text-chalk-400">
            STEP: {Math.min(currentStepIdx + 1, dpSteps.length)} / {dpSteps.length} | {currDPStep?.title}
          </div>

          {/* Visualizer Stage */}
          {currDPStep && <GridTableVisualizer step={currDPStep} />}

          {/* Comparative Metrics Telemetry */}
          <div className="grid grid-cols-2 gap-3 mt-2 font-mono text-xs">
            <div className="p-3 bg-obsidian-900 border border-hairline flex flex-col justify-between">
              <span className="text-[10px] text-chalk-500 uppercase tracking-wider">TABLE CELLS EVALUATED</span>
              <strong className="text-xl text-amber-glow mt-1 tabular-nums">{currDPStep?.metrics.iterations || 0}</strong>
            </div>
            <div className="p-3 bg-obsidian-900 border border-hairline flex flex-col justify-between">
              <span className="text-[10px] text-chalk-500 uppercase tracking-wider">OPTIMAL MAX VALUE</span>
              <strong className="text-xl text-acid-500 mt-1 tabular-nums">{currDPStep?.state.maxValue ?? '-'}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Branch & Bound Engine */}
        <div className="flex flex-col gap-4 p-6 bg-obsidian-950 border border-hairline">
          {/* Column Header */}
          <div className="flex items-start justify-between pb-4 border-b border-hairline">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-acid-500 font-semibold">
                [ 02 // BRANCH & BOUND ]
              </span>
              <h3 className="font-display font-bold text-2xl text-chalk-100 mt-1">
                State-Space Tree Pruning
              </h3>
            </div>
            <div className="text-right font-mono text-[11px] text-chalk-500">
              <div>TIME: <strong className="text-chalk-300">O(2ⁿ) worst</strong></div>
              <div>SPACE: <strong className="text-chalk-300">O(2ⁿ) worst</strong></div>
            </div>
          </div>

          <div className="font-mono text-xs text-chalk-400">
            STEP: {Math.min(currentStepIdx + 1, bbSteps.length)} / {bbSteps.length} | {currBBStep?.title}
          </div>

          {/* Visualizer Stage */}
          {currBBStep && <TreeVisualizer step={currBBStep} />}

          {/* Comparative Metrics Telemetry */}
          <div className="grid grid-cols-3 gap-3 mt-2 font-mono text-xs">
            <div className="p-3 bg-obsidian-900 border border-hairline flex flex-col justify-between">
              <span className="text-[10px] text-chalk-500 uppercase tracking-wider">NODES EXPLORED</span>
              <strong className="text-xl text-amber-glow mt-1 tabular-nums">{currBBStep?.metrics.nodesExplored || 0}</strong>
            </div>
            <div className="p-3 bg-obsidian-900 border border-hairline flex flex-col justify-between">
              <span className="text-[10px] text-chalk-500 uppercase tracking-wider">PRUNED BRANCHES</span>
              <strong className="text-xl text-rose-400 mt-1 tabular-nums">{currBBStep?.metrics.prunedNodes || 0}</strong>
            </div>
            <div className="p-3 bg-obsidian-900 border border-hairline flex flex-col justify-between">
              <span className="text-[10px] text-chalk-500 uppercase tracking-wider">BEST VALUE</span>
              <strong className="text-xl text-acid-500 mt-1 tabular-nums">{currBBStep?.state.bestValue ?? 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

