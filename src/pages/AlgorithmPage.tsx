import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AlgorithmStep } from '../types/algorithm';
import { getAlgorithmById } from '../config/algorithmRegistry';
import { motion, useReducedMotion } from 'framer-motion';

// Visualizer Components
import { ArrayBarVisualizer } from '../components/visualizers/ArrayBarVisualizer';
import { GridTableVisualizer } from '../components/visualizers/GridTableVisualizer';
import { TreeVisualizer } from '../components/visualizers/TreeVisualizer';
import { BoardVisualizer } from '../components/visualizers/BoardVisualizer';
import { GraphVisualizer } from '../components/visualizers/GraphVisualizer';
import { PointCanvasVisualizer } from '../components/visualizers/PointCanvasVisualizer';
import { StringMatchVisualizer } from '../components/visualizers/StringMatchVisualizer';
import { FractionalKnapsackVisualizer } from '../components/visualizers/FractionalKnapsackVisualizer';
import { RecursionTreeVisualizer } from '../components/visualizers/RecursionTreeVisualizer';
import { AssemblyLineVisualizer } from '../components/visualizers/AssemblyLineVisualizer';
import { TspVisualizer } from '../components/visualizers/TspVisualizer';
import { TreeTraversalOverride, createHuffmanDecodingAlgorithmSteps } from '../utils/huffmanCodec';
import { HUFFMAN_DECODING_PSEUDOCODE } from '../algorithms/huffman';

// Controls & Panels
import { PlaybackControls } from '../components/common/PlaybackControls';
import { ComplexityBadge } from '../components/common/ComplexityBadge';
import { MetricsPanel } from '../components/common/MetricsPanel';
import { ResultPanel } from '../components/common/ResultPanel';
import { InputControlPanel } from '../components/common/InputControlPanel';
import { CodeExplanation } from '../components/common/CodeExplanation';
import { CallFlowOverlay } from '../components/common/CallFlowOverlay';

import { ArrowLeft, Terminal, Columns, Maximize2, Play, Pause, RotateCcw, SkipBack, SkipForward, RefreshCw } from 'lucide-react';

interface AlgorithmPageProps {
  algorithmId: string;
  onBack: () => void;
}

export const AlgorithmPage: React.FC<AlgorithmPageProps> = ({ algorithmId, onBack }) => {
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
    if (config.presets && config.presets.length > 0) {
      return { ...config.presets[0].data };
    }
    config.inputSchema.forEach((field) => {
      init[field.name] = field.defaultValue;
    });
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

  const renderVisualizer = () => {
    switch (config.visualizer) {
      case 'ArrayBarVisualizer':
        return <ArrayBarVisualizer step={currentStep} />;
      case 'GridTableVisualizer':
        return <GridTableVisualizer step={currentStep} />;
      case 'TreeVisualizer':
        return <TreeVisualizer step={currentStep} traversalOverride={huffmanTraversal} />;
      case 'BoardVisualizer':
        return <BoardVisualizer step={currentStep} />;
      case 'GraphVisualizer':
        return <GraphVisualizer step={currentStep} />;
      case 'PointCanvasVisualizer':
        return <PointCanvasVisualizer step={currentStep} />;
      case 'StringMatchVisualizer':
        return <StringMatchVisualizer step={currentStep} />;
      case 'FractionalKnapsackVisualizer':
        return <FractionalKnapsackVisualizer step={currentStep} />;
      case 'RecursionTreeVisualizer':
        return <RecursionTreeVisualizer step={currentStep} />;
      case 'AssemblyLineVisualizer':
        return <AssemblyLineVisualizer step={currentStep} />;
      case 'TspVisualizer':
        return (
          <TspVisualizer
            step={currentStep}
            inputs={inputs}
            onApplyInputs={(newInputs) => setInputs(newInputs)}
            presets={config.presets}
          />
        );
      default:
        return (
          <div className="p-12 text-center font-mono text-xs text-chalk-500 border border-hairline bg-obsidian-950">
            VISUALIZER '{config.visualizer}' IS NOT REGISTERED.
          </div>
        );
    }
  };

  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>('split');

  const moduleNumStr = String(config.module).padStart(2, '0');

  const liveCaptionBanner = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-obsidian-950 border border-amber/40 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 bg-amber/15 border border-amber/30 text-amber font-mono text-[11px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse"></span>
          <span>STEP {currentStepIndex + 1}/{activeSteps.length}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber font-semibold shrink-0">
            ACTION:
          </span>
          <h3 className="font-display font-bold text-xs sm:text-sm text-chalk-100 truncate">
            {currentStep.title}
          </h3>
        </div>
        <span className="hidden lg:inline text-xs text-chalk-300 font-sans border-l border-hairline pl-2.5 truncate max-w-lg">
          {currentStep.description}
        </span>
      </div>
      {currentStep.codeLine && (
        <div className="shrink-0 font-mono text-[11px] px-2.5 py-1 bg-obsidian-900 border border-amber/40 text-amber-glow font-bold flex items-center gap-1.5 self-end sm:self-center shadow-sm">
          <Terminal className="w-3 h-3 text-amber" />
          <span>
            {Array.isArray(currentStep.codeLine)
              ? `L${currentStep.codeLine[0]}–${currentStep.codeLine[currentStep.codeLine.length - 1]}`
              : `L${currentStep.codeLine}`}
          </span>
        </div>
      )}
    </div>
  );

  const topPlaybackBar = (
    <div className="flex items-center justify-between gap-3 p-2 bg-obsidian-950 border border-hairline shadow-sm font-mono text-xs">
      <div className="flex items-center gap-1.5">
        {/* Reset button */}
        <button
          onClick={handleReset}
          title="Reset to start (R)"
          className="p-1.5 text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850 border border-hairline transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Step Backward */}
        <button
          onClick={stepBackward}
          disabled={currentStepIndex === 0}
          title="Step backward (←)"
          className="p-1.5 text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850 disabled:opacity-30 disabled:hover:bg-transparent border border-hairline transition-colors"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={currentStepIndex >= activeSteps.length - 1 && !isPlaying}
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all border ${
            isPlaying
              ? 'bg-amber text-obsidian-950 border-amber shadow-sm shadow-amber/20'
              : 'bg-obsidian-850 hover:bg-amber hover:text-obsidian-950 text-chalk-200 border-hairline'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span className="text-[11px] uppercase tracking-wider">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        {/* Step Forward */}
        <button
          onClick={stepForward}
          disabled={currentStepIndex >= activeSteps.length - 1}
          title="Step forward (→)"
          className="p-1.5 text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850 disabled:opacity-30 disabled:hover:bg-transparent border border-hairline transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress tracking */}
      <div className="flex items-center gap-2 text-chalk-400 text-[11px]">
        <span>STEP {currentStepIndex + 1} / {activeSteps.length}</span>
        <div className="w-20 sm:w-28 h-1.5 bg-obsidian-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber transition-all duration-150"
            style={{ width: `${Math.round(((currentStepIndex + 1) / Math.max(activeSteps.length, 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );

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

  const layoutToggle = (
    <div className="flex items-center gap-1 bg-obsidian-950 border border-hairline p-1 font-mono text-xs">
      <button
        onClick={() => setLayoutMode('split')}
        className={`flex items-center gap-1.5 px-2.5 py-1 transition-colors ${
          layoutMode === 'split'
            ? 'bg-amber/15 text-amber-glow font-bold border border-amber/30'
            : 'text-chalk-400 hover:text-chalk-200'
        }`}
        title="Side-by-side view: visualizer and pseudocode visible simultaneously"
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
        title="Full-width visualizer view"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">FULL WIDTH</span>
      </button>
    </div>
  );

  const lowerDeckStatusFallback = (
    <div className="p-5 bg-obsidian-950 border border-hairline flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between border-b border-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber" />
          <span className="font-mono text-xs uppercase font-bold text-chalk-200 tracking-wider">
            EXECUTION STATUS & TELEMETRY
          </span>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono text-amber bg-amber/10 border border-amber/30 uppercase font-semibold">
          ACTIVE
        </span>
      </div>

      <div className="space-y-2.5 font-mono text-xs">
        <div className="flex justify-between py-1 border-b border-hairline/50 text-chalk-400">
          <span>Algorithm:</span>
          <strong className="text-chalk-100">{config.name}</strong>
        </div>
        <div className="flex justify-between py-1 border-b border-hairline/50 text-chalk-400">
          <span>Paradigm:</span>
          <strong className="text-amber">{config.paradigm}</strong>
        </div>
        <div className="flex justify-between py-1 border-b border-hairline/50 text-chalk-400">
          <span>Worst-Case Time:</span>
          <strong className="text-chalk-200">{config.complexity.timeWorst}</strong>
        </div>
        <div className="flex justify-between py-1 text-chalk-400">
          <span>Execution Progress:</span>
          <strong className="text-electric-400">
            Step {currentStepIndex + 1} of {activeSteps.length} ({Math.round(((currentStepIndex + 1) / Math.max(activeSteps.length, 1)) * 100)}%)
          </strong>
        </div>
      </div>

      <div className="p-2.5 bg-obsidian-900 border border-hairline text-chalk-400 font-sans text-xs">
        Computed solution artifact and optimal result metrics will render here upon reaching the final step.
      </div>
    </div>
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

        {/* Fix #3 & Decision 1: High-visibility CURRENT ACTION banner elevated to top position.
            Problem statement is locked out of the frontend for now per user instruction. */}
        {liveCaptionBanner}
      </motion.div>

      {/* Main Execution Stage with Call-Flow Overlay */}
      <div ref={stageContainerRef} className="relative w-full">
        <CallFlowOverlay step={currentStep} containerRef={stageContainerRef} />

        {layoutMode === 'split' ? (
          /* Split Mode: 8-col Visualizer Stage on Left, 4-col Pseudocode & Telemetry on Right */
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Visualizer Canvas + Controls */}
            <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3">
              {config.id === 'huffman' && huffmanStageSwitch}
              {topPlaybackBar}

              <div className="w-full relative">
                {renderVisualizer()}
              </div>

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
            </div>

            {/* Right: Pseudocode Panel + Live Telemetry */}
            <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4">
              <CodeExplanation step={currentStep} pseudocode={activePseudocode} hideStepHeader={true} />
              <MetricsPanel metrics={currentStep.metrics || {}} />
            </div>
          </section>
        ) : (
          /* Stacked Mode: Full Width Visualizer Stage */
          <section className="flex flex-col gap-3">
            {config.id === 'huffman' && huffmanStageSwitch}
            {topPlaybackBar}

            <div className="w-full relative">
              {renderVisualizer()}
            </div>

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
          </section>
        )}
      </div>

      {/* Lower Deck: Inputs & Solution Artifact */}
      {layoutMode === 'split' ? (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-hairline">
          <InputControlPanel
            config={config}
            currentInputs={inputs}
            onApplyInputs={(newInputs) => setInputs(newInputs)}
          />
          {currentStep.result || currentStep.isFinal || finalStep?.result ? (
            <ResultPanel
              result={currentStep.result || (currentStep.isFinal ? finalStep?.result : undefined)}
              title="COMPUTED SOLUTION ARTIFACT"
              isFinal={currentStep.isFinal}
            />
          ) : (
            lowerDeckStatusFallback
          )}
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-hairline">
          <div className="flex flex-col gap-8">
            <CodeExplanation step={currentStep} pseudocode={activePseudocode} />
            <InputControlPanel
              config={config}
              currentInputs={inputs}
              onApplyInputs={(newInputs) => setInputs(newInputs)}
            />
          </div>
          <div className="flex flex-col gap-8">
            <MetricsPanel metrics={currentStep.metrics || {}} />
            {currentStep.result || currentStep.isFinal || finalStep?.result ? (
              <ResultPanel
                result={currentStep.result || (currentStep.isFinal ? finalStep?.result : undefined)}
                title="COMPUTED SOLUTION ARTIFACT"
                isFinal={currentStep.isFinal}
              />
            ) : (
              lowerDeckStatusFallback
            )}
          </div>
        </section>
      )}
      {/* Paradigm & Complexity Bounds Card at the end of the page */}
      <section className="pt-2 border-t border-hairline w-full">
        <ComplexityBadge complexity={config.complexity} paradigm={config.paradigm} />
      </section>
    </div>
  );
};

