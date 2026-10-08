import React, { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, CheckCircle2, GitCompare, Info } from 'lucide-react';
import { AlgorithmConfig, AlgorithmStep, MetricData } from '../types/algorithm';
import { DEFAULT_COMPARISON_GROUP, ComparisonGroupId } from '../config/comparisonGroups';
import { getComparisonGroups, getDefaultInputs, getDefaultPair } from '../utils/comparison';
import { buildResultSummary } from '../utils/resultSummary';
import { VisualizerStage } from '../components/visualizers/VisualizerStage';
import { PlaybackControls } from '../components/common/PlaybackControls';
import { InputControlPanel } from '../components/common/InputControlPanel';

const runSteps = (config: AlgorithmConfig, inputs: Record<string, any>): AlgorithmStep[] => {
  try {
    return Array.from(config.stepGenerator(inputs));
  } catch (err) {
    console.error(`Error generating steps for ${config.id}:`, err);
    return [];
  }
};

const formatTime = (c: AlgorithmConfig['complexity']) => {
  const typical = c.timeAverage ?? c.timeWorst;
  return typical === c.timeWorst ? typical : `${typical} typical · ${c.timeWorst} worst`;
};

const METRIC_LABELS: { key: keyof MetricData; label: string }[] = [
  { key: 'comparisons', label: 'Comparisons' },
  { key: 'iterations', label: 'Iterations' },
  { key: 'nodesExplored', label: 'Nodes explored' },
  { key: 'prunedNodes', label: 'Branches pruned' },
  { key: 'relaxations', label: 'Relaxations' },
  { key: 'recursiveCalls', label: 'Recursive calls' },
  { key: 'backtracks', label: 'Backtracks' },
  { key: 'swaps', label: 'Swaps' },
];

/** One row of the "At a glance" table: a label and one cell per algorithm. */
const GlanceRow: React.FC<{ label: string; a: React.ReactNode; b: React.ReactNode; names: [string, string] }> = ({
  label,
  a,
  b,
  names,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-[9rem_1fr_1fr] gap-x-6 gap-y-2 py-3.5 border-b border-hairline last:border-b-0">
    <div className="font-mono text-[10px] uppercase tracking-widest text-chalk-500 pt-0.5">{label}</div>
    {[a, b].map((cell, i) => (
      <div key={i} className="min-w-0 font-sans text-sm leading-relaxed text-chalk-200">
        <span className={`md:hidden block font-mono text-[10px] uppercase tracking-wider mb-0.5 ${i === 0 ? 'text-amber' : 'text-acid-500'}`}>
          {names[i]}
        </span>
        {cell}
      </div>
    ))}
  </div>
);

const BulletList: React.FC<{ items: string[]; tone: 'plus' | 'minus' }> = ({ items, tone }) => (
  <ul className="flex flex-col gap-1">
    {items.map((item) => (
      <li key={item} className="grid grid-cols-[1rem_1fr] gap-1">
        <span aria-hidden="true" className={`font-mono font-bold ${tone === 'plus' ? 'text-acid-500' : 'text-rose-400'}`}>
          {tone === 'plus' ? '+' : '−'}
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

interface ColumnProps {
  config: AlgorithmConfig;
  steps: AlgorithmStep[];
  stepIdx: number;
  inputs: Record<string, any>;
  accent: 'amber' | 'acid';
  onApplyInputs: (inputs: Record<string, any>) => void;
}

/** One side of the side-by-side deck. */
const AlgorithmColumn: React.FC<ColumnProps> = ({ config, steps, stepIdx, inputs, accent, onApplyInputs }) => {
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const finished = steps.length > 0 && stepIdx >= steps.length - 1;
  const finalResult = steps[steps.length - 1]?.result;
  const summary = finished ? buildResultSummary(finalResult, config.summarizeResult, inputs) : null;
  const metrics = METRIC_LABELS.filter(({ key }) => typeof step?.metrics?.[key] === 'number');
  const accentText = accent === 'amber' ? 'text-amber' : 'text-acid-500';

  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6 bg-obsidian-950 border border-hairline min-w-0">
      {/* Column Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <span className={`font-mono text-xs uppercase tracking-wider font-semibold ${accentText}`}>{config.paradigm}</span>
          <h3 className="font-display font-bold text-2xl text-chalk-100 mt-1">{config.name}</h3>
        </div>
        <div className="text-right font-mono text-[11px] text-chalk-500">
          <div>
            TIME: <strong className="text-chalk-300">{config.complexity.timeWorst}</strong> worst
          </div>
          <div>
            SPACE: <strong className="text-chalk-300">{config.complexity.spaceWorst}</strong>
          </div>
        </div>
      </div>

      {step ? (
        <>
          <div className="flex flex-col gap-1">
            <div className="font-mono text-xs text-chalk-400">
              STEP {Math.min(stepIdx + 1, steps.length)} / {steps.length}
              {finished && <span className="ml-2 text-acid-500 font-semibold">· FINISHED</span>}
            </div>
            <p className="font-display font-semibold text-sm text-chalk-100">{step.title}</p>
            <p className="font-sans text-xs leading-relaxed text-chalk-400 min-h-[2.5rem]">{step.description}</p>
          </div>

          {/* Visualizer Stage */}
          <div className="w-full min-w-0">
            <VisualizerStage config={config} step={step} inputs={inputs} onApplyInputs={onApplyInputs} />
          </div>

          {/* Work done so far */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              {metrics.map(({ key, label }) => (
                <div key={key} className="p-3 bg-obsidian-900 border border-hairline flex flex-col justify-between">
                  <span className="text-[10px] text-chalk-500 uppercase tracking-wider">{label}</span>
                  <strong className="text-xl text-amber-glow mt-1 tabular-nums">{step.metrics[key] as number}</strong>
                </div>
              ))}
            </div>
          )}

          {summary && (
            <div className="flex gap-2 p-3 bg-obsidian-900 border border-acid-500/30">
              <CheckCircle2 className="w-4 h-4 text-acid-500 shrink-0 mt-0.5" />
              <p className="font-sans text-sm text-chalk-100 leading-relaxed">{summary.headline}</p>
            </div>
          )}
        </>
      ) : (
        <p className="font-sans text-sm text-chalk-400">This input could not be run for {config.name}.</p>
      )}
    </div>
  );
};

export const ComparisonPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const groups = useMemo(() => getComparisonGroups(), []);
  const initialGroup = groups.find((g) => g.id === DEFAULT_COMPARISON_GROUP) ?? groups[0];

  const [groupId, setGroupId] = useState<ComparisonGroupId>(initialGroup.id);
  const [idA, setIdA] = useState(getDefaultPair(initialGroup)[0].id);
  const [idB, setIdB] = useState(getDefaultPair(initialGroup)[1].id);
  const [inputs, setInputs] = useState<Record<string, any>>(() => getDefaultInputs(getDefaultPair(initialGroup)[0]));

  const group = groups.find((g) => g.id === groupId)!;
  const configA = group.members.find((m) => m.id === idA)!;
  const configB = group.members.find((m) => m.id === idB)!;
  const profileA = configA.comparison!;
  const profileB = configB.comparison!;

  const selectGroup = (id: ComparisonGroupId) => {
    const next = groups.find((g) => g.id === id)!;
    const [a, b] = getDefaultPair(next);
    setGroupId(id);
    setIdA(a.id);
    setIdB(b.id);
    setInputs(getDefaultInputs(a));
  };

  // Members of a group share an input format, so the current input is kept when switching within the group.
  const selectA = (id: string) => {
    setIdA(id);
    if (id === idB) setIdB(group.members.find((m) => m.id !== id)!.id);
  };
  const selectB = (id: string) => {
    setIdB(id);
    if (id === idA) setIdA(group.members.find((m) => m.id !== id)!.id);
  };
  const swap = () => {
    setIdA(idB);
    setIdB(idA);
  };

  const stepsA = useMemo(() => runSteps(configA, inputs), [configA, inputs]);
  const stepsB = useMemo(() => runSteps(configB, inputs), [configB, inputs]);
  const maxSteps = Math.max(stepsA.length, stepsB.length, 1);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [inputs, idA, idB]);

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

  const names: [string, string] = [configA.name, configB.name];
  const selectClass =
    'w-full px-3 py-2 bg-obsidian-900 border border-hairline text-chalk-100 font-sans text-sm focus:outline-none focus:border-amber';

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Top Header: problem picker and algorithm selectors */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-6 pb-6 border-b border-hairline"
      >
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-amber uppercase tracking-wider font-semibold">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Algorithm Comparison</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl tracking-tighter text-chalk-100 mt-2 uppercase">
            {group.title} <span className="font-serif italic font-normal normal-case text-chalk-300">comparison.</span>
          </h1>
        </div>

        {/* 1. Pick a problem */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-chalk-500">1 · Choose a problem</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Problem to compare">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={g.id === groupId}
                onClick={() => selectGroup(g.id)}
                className={`px-3 py-1.5 font-mono text-xs border transition-colors ${
                  g.id === groupId
                    ? 'bg-amber text-obsidian-950 border-amber font-bold'
                    : 'bg-obsidian-950 text-chalk-300 border-hairline hover:text-chalk-100 hover:border-amber/50'
                }`}
              >
                {g.title}
                <span className={`ml-1.5 ${g.id === groupId ? 'opacity-70' : 'text-chalk-500'}`}>({g.members.length})</span>
              </button>
            ))}
          </div>
          <p className="font-sans text-sm sm:text-base text-chalk-200 leading-relaxed max-w-3xl">
            <span className="font-semibold text-chalk-100">The problem: </span>
            {group.problem}
          </p>
          {group.note && (
            <p className="flex gap-2 font-sans text-xs text-chalk-400 max-w-3xl">
              <Info className="w-3.5 h-3.5 text-amber shrink-0 mt-0.5" />
              {group.note}
            </p>
          )}
        </div>

        {/* 2. Pick two algorithms */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-chalk-500">2 · Choose two algorithms</span>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3 p-4 bg-obsidian-950 border border-hairline">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber font-semibold">Algorithm A</span>
              <select value={idA} onChange={(e) => selectA(e.target.value)} className={selectClass}>
                {group.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.paradigm}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={swap}
              title="Swap A and B"
              aria-label="Swap algorithm A and algorithm B"
              className="justify-self-center p-2 text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850 border border-hairline transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-acid-500 font-semibold">Algorithm B</span>
              <select value={idB} onChange={(e) => selectB(e.target.value)} className={selectClass}>
                {group.members
                  .filter((m) => m.id !== idA)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.paradigm}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </div>
      </motion.div>

      {/* At a glance: how the approaches differ and when to choose each */}
      <section aria-labelledby="glance-heading" className="flex flex-col gap-3">
        <h2 id="glance-heading" className="font-display font-bold text-xl sm:text-2xl text-chalk-100">
          At a glance
        </h2>
        <div className="px-4 sm:px-6 bg-obsidian-950 border border-hairline">
          <div className="hidden md:grid grid-cols-[9rem_1fr_1fr] gap-x-6 py-3 border-b border-hairline font-display font-bold text-base">
            <span />
            <span className="text-amber">{configA.name}</span>
            <span className="text-acid-500">{configB.name}</span>
          </div>
          <GlanceRow label="Key idea" names={names} a={profileA.keyIdea} b={profileB.keyIdea} />
          <GlanceRow label="Paradigm" names={names} a={configA.paradigm} b={configB.paradigm} />
          <GlanceRow
            label="Time"
            names={names}
            a={<span className="font-mono text-[13px]">{formatTime(configA.complexity)}</span>}
            b={<span className="font-mono text-[13px]">{formatTime(configB.complexity)}</span>}
          />
          <GlanceRow
            label="Space"
            names={names}
            a={<span className="font-mono text-[13px]">{configA.complexity.spaceWorst}</span>}
            b={<span className="font-mono text-[13px]">{configB.complexity.spaceWorst}</span>}
          />
          <GlanceRow label="Answer" names={names} a={profileA.answerQuality} b={profileB.answerQuality} />
          <GlanceRow
            label="Strengths"
            names={names}
            a={<BulletList items={profileA.strengths} tone="plus" />}
            b={<BulletList items={profileB.strengths} tone="plus" />}
          />
          <GlanceRow
            label="Limitations"
            names={names}
            a={<BulletList items={profileA.limitations} tone="minus" />}
            b={<BulletList items={profileB.limitations} tone="minus" />}
          />
          <GlanceRow
            label="Choose it when"
            names={names}
            a={<span className="font-medium text-chalk-100">{profileA.chooseWhen}</span>}
            b={<span className="font-medium text-chalk-100">{profileB.chooseWhen}</span>}
          />
        </div>
      </section>

      {/* Side-by-side run on the same input */}
      <section aria-labelledby="run-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="run-heading" className="font-display font-bold text-xl sm:text-2xl text-chalk-100">
            Watch them side by side
          </h2>
          <p className="font-sans text-sm text-chalk-400 mt-1">
            Both algorithms run on the same input. Steps are animation steps, so compare the work counters and final answers
            rather than the step counts.
          </p>
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

        {/* Side-by-Side Comparative Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AlgorithmColumn
            key={configA.id}
            config={configA}
            steps={stepsA}
            stepIdx={currentStepIdx}
            inputs={inputs}
            accent="amber"
            onApplyInputs={setInputs}
          />
          <AlgorithmColumn
            key={configB.id}
            config={configB}
            steps={stepsB}
            stepIdx={currentStepIdx}
            inputs={inputs}
            accent="acid"
            onApplyInputs={setInputs}
          />
        </div>
      </section>

      {/* Shared input */}
      <section aria-label="Shared input" className="pt-4 border-t border-hairline">
        <InputControlPanel key={groupId} config={configA} currentInputs={inputs} onApplyInputs={setInputs} />
      </section>
    </div>
  );
};
