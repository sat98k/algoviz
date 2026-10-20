import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AlgorithmStep } from '../types/algorithm';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { motion, useReducedMotion } from 'framer-motion';

// Visualizer Components
import { VisualizerStage } from '../components/visualizers/VisualizerStage';
import { TreeTraversalOverride, createHuffmanDecodingAlgorithmSteps } from '../utils/huffmanCodec';
import { HUFFMAN_DECODING_PSEUDOCODE } from '../algorithms/huffman';
import { SUBSET_SUM_PSEUDOCODE_FIRST, SUBSET_SUM_PSEUDOCODE_ALL } from '../algorithms/subsetSum';
import { GRAPH_COLORING_PSEUDOCODE_FIRST, GRAPH_COLORING_PSEUDOCODE_ALL } from '../algorithms/graphColoring';

// Controls & Panels
import { PlaybackControls } from '../components/common/PlaybackControls';
import { ComplexityAnalysisPanel } from '../components/common/ComplexityAnalysisPanel';
import { MetricsPanel } from '../components/common/MetricsPanel';
import { ColoringSolutionsPanel } from '../components/common/ColoringSolutionsPanel';
import { InputControlPanel } from '../components/common/InputControlPanel';
import { CodeExplanation } from '../components/common/CodeExplanation';
import { CallFlowOverlay } from '../components/common/CallFlowOverlay';
import { ProblemIntuitionPanel } from '../components/common/ProblemIntuitionPanel';
import { StepExplanation } from '../components/common/StepExplanation';
import { DpCurrentRule } from '../components/common/DpCurrentRule';
import { FinalAnswerCard } from '../components/common/FinalAnswerCard';
import { NQueensSolutionsPanel, findSolutionSteps } from '../components/common/NQueensSolutionsPanel';
import { RoadmapStrip } from '../components/common/RoadmapStrip';
import { ROADMAPS, roadmapPhases, spanHas } from '../config/roadmaps';

import { ArrowLeft, Columns, Maximize2, Play, RefreshCw } from 'lucide-react';

interface AlgorithmPageProps {
  algorithmId: string;
  onBack: () => void;
  /** Starting layout; the reader can switch at any time. */
  initialLayoutMode?: 'split' | 'stacked';
}

export const AlgorithmPage: React.FC<AlgorithmPageProps> = ({ algorithmId, onBack, initialLayoutMode = 'split' }) => {
  const config = useMemo(() => getAlgorithmById(algorithmId), [algorithmId]);
  const shouldReduceMotion = useReducedMotion();

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <p className="text-rose-400 font-mono text-sm tracking-wide">
          Algorithm '{algorithmId}' not found.
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-obsidian-850 hover:bg-obsidian-800 text-chalk-200 border border-hairline font-mono text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Catalog
        </button>
      </div>
    );
  }

  // Extract initial inputs from schema defaults or preset
  const defaultInputs = useMemo(() => {
    const init: Record<string, any> = {};
    config.inputSchema.forEach((field) => {
      init[field.name] = field.defaultValue;
    });
    if (config.presets && config.presets.length > 0) {
      return { ...init, ...config.presets[0].data };
    }
    return init;
  }, [config]);

  const [inputs, setInputs] = useState<Record<string, any>>(defaultInputs);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(0.25);
  const [huffmanTraversal, setHuffmanTraversal] = useState<TreeTraversalOverride | null>(null);
  const [huffmanPhase, setHuffmanPhase] = useState<'encode' | 'decode'>('encode');

  // Generate all steps upfront
  const steps: AlgorithmStep[] = useMemo(() => {
    try {
      const gen = config.stepGenerator(inputs);
      const allSteps: AlgorithmStep[] = [];
      for (const step of gen) {
        allSteps.push(step);
      }
      return allSteps;
    } catch (err) {
      console.error('Error generating steps:', err);
      return [];
    }
  }, [config, inputs]);

  // Generate decoding steps when on Huffman algorithm
  const decodeSteps: AlgorithmStep[] = useMemo(() => {
    if (config.id !== 'huffman') return [];
    const finalTreeStep = steps[steps.length - 1];
    const root = finalTreeStep?.state?.treeRoot;
    const bits = finalTreeStep?.state?.encodedBits || '';
    const txt = finalTreeStep?.state?.inputText || inputs.text || 'ABRACADABRA';
    if (!root || !bits) return [];
    return createHuffmanDecodingAlgorithmSteps(root, bits, txt);
  }, [config.id, steps, inputs.text]);

  const activeSteps =
    config.id === 'huffman' && huffmanPhase === 'decode' && decodeSteps.length > 0
      ? decodeSteps
      : steps;

  const activePseudocode =
    config.id === 'huffman' && huffmanPhase === 'decode'
      ? HUFFMAN_DECODING_PSEUDOCODE
      : config.id === 'subset-sum'
      ? inputs.findMode === 'all'
        ? SUBSET_SUM_PSEUDOCODE_ALL
        : SUBSET_SUM_PSEUDOCODE_FIRST
      : config.id === 'graph-coloring'
      ? inputs.findMode === 'all'
        ? GRAPH_COLORING_PSEUDOCODE_ALL
        : GRAPH_COLORING_PSEUDOCODE_FIRST
      : config.pseudocode;

  // Reset step index when inputs or algorithm change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setHuffmanTraversal(null);
    setHuffmanPhase('encode');
  }, [inputs, algorithmId]);

  // Playback timer loop
  const timerRef = useRef<number | null>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const stepForward = useCallback(() => {
    setHuffmanTraversal(null);
    setCurrentStepIndex((prev) => {
      if (prev < activeSteps.length - 1) {
        return prev + 1;
      } else {
        setIsPlaying(false);
        return prev;
      }
    });
  }, [activeSteps.length]);

  const stepBackward = useCallback(() => {
    setHuffmanTraversal(null);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setHuffmanTraversal(null);
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(150, 1000 / speed);
      timerRef.current = window.setInterval(() => {
        stepForward();
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, speed, stepForward]);

  const currentStep = activeSteps[currentStepIndex] || {
    stepIndex: 0,
    title: 'Ready',
    description: 'Press Play or Step Forward to start execution.',
    state: {},
    highlights: {},
    metrics: {},
  };

  const finalStep = steps[steps.length - 1];

  const renderVisualizer = () => (
    <VisualizerStage
      config={config}
      step={currentStep}
      inputs={inputs}
      traversalOverride={huffmanTraversal}
      onApplyInputs={(newInputs) => setInputs(newInputs)}
      speed={speed}
    />
  );

  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>(initialLayoutMode);

  const moduleNumStr = String(config.module).padStart(2, '0');

  const huffmanStageSwitch = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-obsidian-950 border border-amber/40 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-chalk-400 uppercase font-bold tracking-wider">
          STAGE:
        </span>
        <button
          onClick={() => {
            setIsPlaying(false);
            setHuffmanTraversal(null);
            setCurrentStepIndex(0);
            setHuffmanPhase('encode');
          }}
          className={`px-3 py-1 font-mono text-xs font-bold transition-all border ${
            huffmanPhase === 'encode'
              ? 'bg-amber text-obsidian-950 border-amber shadow-sm'
              : 'bg-obsidian-900 text-chalk-400 border-hairline hover:text-chalk-100'
          }`}
        >
          1. ENCODE / TREE BUILD
        </button>
        <button
          onClick={() => {
            setIsPlaying(false);
            setHuffmanTraversal(null);
            setCurrentStepIndex(0);
            setHuffmanPhase('decode');
          }}
          className={`px-3 py-1 font-mono text-xs font-bold transition-all border flex items-center gap-1.5 ${
            huffmanPhase === 'decode'
              ? 'bg-amber text-obsidian-950 border-amber shadow-sm'
              : 'bg-obsidian-900 text-chalk-400 border-hairline hover:text-chalk-100'
          }`}
        >
          <Play className="w-3 h-3" />
          2. DECODE ENCODED STRING
        </button>
      </div>

      {huffmanPhase === 'encode' && (
        <button
          onClick={() => {
            setIsPlaying(false);
            setHuffmanTraversal(null);
            setCurrentStepIndex(0);
            setHuffmanPhase('decode');
          }}
          className="flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold bg-amber/15 border border-amber/40 text-amber hover:bg-amber/25 transition-colors self-end sm:self-center"
        >
          <span>⚡ Decode String &gt;</span>
        </button>
      )}

      {huffmanPhase === 'decode' && (
        <button
          onClick={() => {
            setIsPlaying(false);
            setHuffmanTraversal(null);
            setCurrentStepIndex(0);
            setHuffmanPhase('encode');
          }}
          className="flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold bg-obsidian-900 border border-hairline text-chalk-400 hover:text-chalk-200 transition-colors self-end sm:self-center"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Back to Encoding</span>
        </button>
      )}
    </div>
  );

  /** First / All solutions switch shared by the search algorithms. Changing mode restarts the run. */
  const renderModeSwitch = (isAll: boolean, setAll: (all: boolean) => void, firstHint: string, allHint: string) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-obsidian-950 border border-hairline font-mono text-xs">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Search mode">
        <span className="text-[11px] text-chalk-400 uppercase font-bold tracking-wider">Search mode:</span>
        {([false, true] as const).map((all) => (
          <button
            key={String(all)}
            type="button"
            aria-pressed={isAll === all}
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex(0);
              setAll(all);
            }}
            className={`px-3 py-1 font-mono text-xs font-bold transition-all border ${
              isAll === all ? 'bg-amber text-obsidian-950 border-amber shadow-sm' : 'bg-obsidian-900 text-chalk-400 border-hairline hover:text-chalk-100'
            }`}
          >
            {all ? 'Find all solutions' : 'Find first solution'}
          </button>
        ))}
      </div>
      <span className="text-[11px] text-chalk-400">{isAll ? allHint : firstHint}</span>
    </div>
  );

  const subsetSumModeSwitch =
    config.id === 'subset-sum' &&
    renderModeSwitch(
      inputs.findMode === 'all',
      (all) => setInputs((prev) => ({ ...prev, findMode: all ? 'all' : 'first' })),
      'Stops as soon as one subset reaches the target.',
      'Keeps backtracking after each match to find every subset that reaches the target.'
    );

  const graphColoringModeSwitch =
    config.id === 'graph-coloring' &&
    renderModeSwitch(
      inputs.findMode === 'all',
      (all) => setInputs((prev) => ({ ...prev, findMode: all ? 'all' : 'first' })),
      'Stops as soon as every vertex has a valid color.',
      'Keeps backtracking after each valid coloring to find all of them.'
    );

  const nQueensModeSwitch =
    config.id === 'n-queens' &&
    renderModeSwitch(
      inputs.findAll === true,
      (all) => setInputs((prev) => ({ ...prev, findAll: all })),
      'Stops at the first valid placement. Other solutions may exist.',
      `Explores every placement and collects every solution (${activeSteps.length.toLocaleString()} steps for this board). Use the solutions gallery to jump straight to any solution.`
    );

  const layoutToggle = (
    <div className="flex items-center gap-1 bg-obsidian-950 border border-hairline p-1 font-mono text-xs">
      <button
        onClick={() => setLayoutMode('split')}
        className={`flex items-center gap-1.5 px-2.5 py-1 transition-colors ${
          layoutMode === 'split'
            ? 'bg-amber/15 text-amber-glow font-bold border border-amber/30'
            : 'text-chalk-400 hover:text-chalk-200'
        }`}
        title="Split view: visualization and explanation on the left, pseudocode and current values beside them"
      >
        <Columns className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">SPLIT VIEW</span>
      </button>
      <button
        onClick={() => setLayoutMode('stacked')}
        className={`flex items-center gap-1.5 px-2.5 py-1 transition-colors ${
          layoutMode === 'stacked'
            ? 'bg-amber/15 text-amber-glow font-bold border border-amber/30'
            : 'text-chalk-400 hover:text-chalk-200'
        }`}
        title="Full width: the largest visualization, with pseudocode and current values below it"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">FULL WIDTH</span>
      </button>
    </div>
  );

  const stepNumber = Math.min(currentStepIndex + 1, Math.max(activeSteps.length, 1));
  const totalSteps = Math.max(activeSteps.length, 1);

  const playbackControls = (
    <PlaybackControls
      currentStep={currentStepIndex}
      totalSteps={activeSteps.length}
      isPlaying={isPlaying}
      speed={speed}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onStepForward={stepForward}
      onStepBackward={stepBackward}
      onReset={handleReset}
      onSeek={(idx) => {
        setHuffmanTraversal(null);
        setCurrentStepIndex(idx);
      }}
      onSpeedChange={(newSpeed) => setSpeed(newSpeed)}
    />
  );

  // "You are here" roadmap over the How-it-works steps (the Huffman decoding stage has none).
  const roadmap = config.id === 'huffman' && huffmanPhase === 'decode' ? undefined : ROADMAPS[config.id];
  const phases = useMemo(() => (roadmap ? roadmapPhases(config.id, activeSteps) : []), [roadmap, config.id, activeSteps]);
  const reachedPhases = useMemo(() => {
    const seen = new Set<number>();
    for (let i = 0; i <= currentStepIndex && i < phases.length; i++) {
      const p = phases[i];
      if (p) for (let chip = p[0]; chip <= p[1]; chip++) seen.add(chip);
    }
    return seen;
  }, [phases, currentStepIndex]);
  const roadmapStrip = roadmap ? (
    <RoadmapStrip
      labels={roadmap.labels}
      active={phases[currentStepIndex] ?? null}
      reached={reachedPhases}
      onJump={(chip) => {
        const idx = phases.findIndex((p) => spanHas(p, chip));
        if (idx < 0) return;
        setIsPlaying(false);
        setHuffmanTraversal(null);
        setCurrentStepIndex(idx);
      }}
    />
  ) : null;

  // The playback dock stays under the navbar while the stage scrolls; its height is shared
  // with the story owl (StoryStage) through --dock-h so the owl can stick just below it.
  const dockRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dock = dockRef.current;
    const stage = stageContainerRef.current;
    if (!dock || !stage || typeof ResizeObserver === 'undefined') return;
    const update = () => stage.style.setProperty('--dock-h', `${dock.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(dock);
    return () => observer.disconnect();
  }, []);

  const stepExplanation = (
    <StepExplanation step={currentStep} stepNumber={stepNumber} totalSteps={totalSteps} glossaryTerms={config.glossaryTerms} />
  );

  // The step explanation carries the description, so the pseudocode panel shows only code.
  const pseudocodeFor = (maxHeightClass: string) => (
    <CodeExplanation step={currentStep} pseudocode={activePseudocode} maxHeightClass={maxHeightClass} />
  );
  // DP pages: the rule applied to the current cell. On narrow screens it follows the step
  // explanation (close to the table); on wide screens it sits under the pseudocode.
  const dpRulePanel = config.dpBrief ? (
    <div className="order-first lg:order-none">
      <DpCurrentRule rule={currentStep.state?.dpRule} />
    </div>
  ) : null;
  const operationCounts = <MetricsPanel metrics={currentStep.metrics || {}} />;

  const showColoringSolutions =
    config.id === 'graph-coloring' && (inputs.findMode === 'all' || currentStep.state?.allSolutions?.length);

  // N-Queens "find all": gallery of solutions found so far, each linked to the step that found it.
  const nQueensSolutionSteps = useMemo(
    () => (config.id === 'n-queens' ? findSolutionSteps(activeSteps) : []),
    [config.id, activeSteps]
  );

  const finalAnswer = config.id === 'n-queens' && inputs.findAll ? (
    <NQueensSolutionsPanel
      n={currentStep.state?.n ?? inputs.n ?? 4}
      solutions={currentStep.state?.solutions ?? []}
      foundAtStep={nQueensSolutionSteps}
      isFinal={!!currentStep.isFinal}
      onJump={(idx) => {
        setIsPlaying(false);
        setCurrentStepIndex(idx);
      }}
    />
  ) : showColoringSolutions ? (
    <ColoringSolutionsPanel
      solutions={currentStep.state?.allSolutions || (finalStep?.result?.allSolutions ?? [])}
      numColors={currentStep.state?.numColors ?? inputs.numColors ?? 3}
      numVertices={currentStep.state?.nodes?.length}
      isFinal={currentStep.isFinal}
    />
  ) : (
    <FinalAnswerCard
      isFinal={!!currentStep.isFinal}
      result={currentStep.result ?? finalStep?.result}
      summarizer={config.summarizeResult}
      inputs={inputs}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
    />
  );

  return (
    <div className="flex flex-col gap-5 max-w-[1560px] mx-auto px-3 sm:px-4 lg:px-6 py-6 w-full">
      {/* Top Header & Navigation */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-4 pb-4 border-b border-hairline"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left horizontal cluster: Catalog trigger, module index, and compact algorithm title */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={onBack}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-obsidian-950 hover:bg-obsidian-850 text-chalk-400 hover:text-chalk-100 border border-hairline font-mono text-xs uppercase tracking-wider transition-colors"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>CATALOG</span>
            </button>

            <span className="font-mono text-xs text-chalk-500">•</span>

            <span className="font-mono text-xs text-amber uppercase tracking-wider font-semibold">
              {moduleNumStr} • {config.moduleName}
            </span>

            <span className="font-mono text-xs text-chalk-500">—</span>

            {/* Horizontal Algorithm Name with smaller font */}
            <h1 className="font-display font-bold text-lg sm:text-xl md:text-2xl tracking-tight text-chalk-100">
              {config.name}
            </h1>
          </div>

          {/* Right: Layout Toggle */}
          <div className="flex items-center gap-2">
            {layoutToggle}
          </div>
        </div>

        {/* Learning flow: problem → how it works → visualization (collapsible while stepping). */}
        <ProblemIntuitionPanel
          problemStatement={config.problemStatement}
          explanation={config.explanation}
          coreSteps={config.coreSteps}
          dpBrief={config.dpBrief}
          terms={config.glossaryTerms}
        />
      </motion.div>

      {/* Visual learning stage. CallFlowOverlay draws between the visualizer and the
          pseudocode, so both must stay inside this container and render exactly once. */}
      <div ref={stageContainerRef} className="relative w-full flex flex-col gap-3">
        <CallFlowOverlay step={currentStep} containerRef={stageContainerRef} />

        {config.id === 'huffman' && huffmanStageSwitch}
        {subsetSumModeSwitch}
        {graphColoringModeSwitch}
        {nQueensModeSwitch}

        {/* One playback toolbar across the whole learning stage, with the roadmap under it.
            On wider screens the dock stays visible under the navbar while scrolling. */}
        <div
          ref={dockRef}
          data-playback-dock
          className="sm:sticky sm:top-20 z-40 flex flex-col gap-1 bg-obsidian-900 shadow-sm"
        >
          {playbackControls}
          {roadmapStrip}
        </div>

        {layoutMode === 'split' ? (
          /* Split: visualization and pseudocode side by side, tops aligned; explanation under the
             visualization, DP rule and operation counts under the pseudocode. */
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 min-w-0">
              <div className="w-full relative">{renderVisualizer()}</div>
              {stepExplanation}
            </div>
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 min-w-0">
              {pseudocodeFor('max-h-[22rem] lg:max-h-[min(34rem,70vh)]')}
              {dpRulePanel}
              {operationCounts}
            </div>
          </section>
        ) : (
          /* Full width: the largest visualization; pseudocode beside the DP rule and counts below it. */
          <section className="flex flex-col gap-3">
            <div className="w-full relative">{renderVisualizer()}</div>
            {stepExplanation}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
              {pseudocodeFor('max-h-[22rem]')}
              <div className="flex flex-col gap-3 min-w-0">
                {dpRulePanel}
                {operationCounts}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Final answer, immediately after the visual stage */}
      <section className="w-full">{finalAnswer}</section>

      {/* Inputs */}
      <section className="pt-4 border-t border-hairline w-full">
        <InputControlPanel config={config} currentInputs={inputs} onApplyInputs={(newInputs) => setInputs(newInputs)} />
      </section>

      {/* Paradigm & complexity at the end of the page */}
      <section className="pt-2 border-t border-hairline w-full">
        <ComplexityAnalysisPanel analysis={config.analysis} paradigm={config.paradigm} />
      </section>
    </div>
  );
};

