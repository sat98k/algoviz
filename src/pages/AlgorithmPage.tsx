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
import { HuffmanCodecVisualizer } from '../components/visualizers/HuffmanCodecVisualizer';
import { TreeTraversalOverride } from '../utils/huffmanCodec';

// Controls & Panels
import { PlaybackControls } from '../components/common/PlaybackControls';
import { ComplexityBadge } from '../components/common/ComplexityBadge';
import { MetricsPanel } from '../components/common/MetricsPanel';
import { ResultPanel } from '../components/common/ResultPanel';
import { InputControlPanel } from '../components/common/InputControlPanel';
import { CodeExplanation } from '../components/common/CodeExplanation';
import { CallFlowOverlay } from '../components/common/CallFlowOverlay';

import { ArrowLeft, Terminal, Columns, Maximize2 } from 'lucide-react';

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
  const [speed, setSpeed] = useState<number>(1);
  const [huffmanTraversal, setHuffmanTraversal] = useState<TreeTraversalOverride | null>(null);

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

  // Reset step index when inputs or algorithm change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setHuffmanTraversal(null);
  }, [inputs, algorithmId]);

  // Playback timer loop
  const timerRef = useRef<number | null>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const stepForward = useCallback(() => {
    setHuffmanTraversal(null);
    setCurrentStepIndex((prev) => {
      if (prev < steps.length - 1) {
        return prev + 1;
      } else {
        setIsPlaying(false);
        return prev;
      }
    });
  }, [steps.length]);

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

  const currentStep = steps[currentStepIndex] || {
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-obsidian-950 border border-amber/40 shadow-lg shadow-amber/5">
      <div className="flex items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 bg-amber/15 border border-amber/30 text-amber font-mono text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber animate-pulse"></span>
          <span>STEP {currentStepIndex + 1}/{steps.length}</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber font-semibold">
              CURRENT ACTION:
            </span>
            <h3 className="font-display font-bold text-sm sm:text-base text-chalk-100">
              {currentStep.title}
            </h3>
          </div>
          <p className="font-sans text-xs sm:text-sm text-chalk-200 leading-relaxed mt-0.5">
            {currentStep.description}
          </p>
        </div>
      </div>
      {currentStep.codeLine && (
        <div className="shrink-0 font-mono text-xs px-3 py-1.5 bg-obsidian-900 border border-amber/40 text-amber-glow font-bold flex items-center gap-2 self-end sm:self-center shadow-sm">
          <Terminal className="w-3.5 h-3.5 text-amber" />
          <span>
            {Array.isArray(currentStep.codeLine)
              ? `LINES ${currentStep.codeLine[0]}–${currentStep.codeLine[currentStep.codeLine.length - 1]}`
              : `LINE ${currentStep.codeLine}`}
          </span>
        </div>
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

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Header & Navigation */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-5 pb-5 border-b border-hairline"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            {/* Back trigger + Chapter index + Layout Toggle */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="group flex items-center gap-1.5 px-3 py-1.5 bg-obsidian-950 hover:bg-obsidian-850 text-chalk-400 hover:text-chalk-100 border border-hairline font-mono text-xs uppercase tracking-wider transition-colors"
                  title="Back to Catalog"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>CATALOG</span>
                </button>

                <span className="font-mono text-xs text-amber uppercase tracking-wider font-semibold">
                  {moduleNumStr} • {config.moduleName}
                </span>
              </div>

              {layoutToggle}
            </div>

            {/* Main Algorithm Title */}
            <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tighter text-chalk-100 mt-1">
              {config.name}
            </h1>
          </div>

          {/* Complexity Ledger Block */}
          <div className="w-full md:w-auto md:min-w-[420px]">
            <ComplexityBadge complexity={config.complexity} paradigm={config.paradigm} />
          </div>
        </div>

        {/* Problem Statement Banner */}
        <div className="p-3.5 bg-obsidian-950 border border-hairline flex items-start gap-3">
          <Terminal className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-chalk-400 font-semibold">
              PROBLEM STATEMENT
            </span>
            <p className="text-xs sm:text-sm text-chalk-300 font-sans leading-relaxed">
              {config.problemStatement}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Execution Stage with Call-Flow Overlay */}
      <div ref={stageContainerRef} className="relative w-full">
        <CallFlowOverlay step={currentStep} containerRef={stageContainerRef} />

        {layoutMode === 'split' ? (
          /* Split Mode: Visualizer & Playback on Left, Pseudocode & Telemetry on Right */
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Visualizer Canvas + Controls + Live Caption */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-4">
              <div className="w-full relative">
                {renderVisualizer()}
              </div>

              <PlaybackControls
                currentStep={currentStepIndex}
                totalSteps={steps.length}
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

              {liveCaptionBanner}
            </div>

            {/* Right: Pseudocode Panel + Live Telemetry */}
            <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
              <CodeExplanation step={currentStep} pseudocode={config.pseudocode} hideStepHeader={true} />
              <MetricsPanel metrics={currentStep.metrics || {}} />
            </div>
          </section>
        ) : (
          /* Stacked Mode: Full Width Visualizer Stage */
          <section className="flex flex-col gap-4">
            <div className="w-full relative">
              {renderVisualizer()}
            </div>

            <PlaybackControls
              currentStep={currentStepIndex}
              totalSteps={steps.length}
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

            {liveCaptionBanner}
          </section>
        )}
      </div>

      {/* Huffman Encoding & Decoding Studio (Traversal Phase) */}
      {config.id === 'huffman' && finalStep?.state?.treeRoot && (
        <HuffmanCodecVisualizer
          treeRoot={finalStep.state.treeRoot}
          inputText={finalStep.state.inputText || inputs.text || 'ABRACADABRA'}
          codeTable={finalStep.state.codeTable || {}}
          encodedBits={finalStep.state.encodedBits || ''}
          onTraversalChange={setHuffmanTraversal}
        />
      )}

      {/* Lower Deck: Inputs & Solution Artifact */}
      {layoutMode === 'split' ? (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-hairline">
          <InputControlPanel
            config={config}
            currentInputs={inputs}
            onApplyInputs={(newInputs) => setInputs(newInputs)}
          />
          <ResultPanel
            result={currentStep.result || (currentStep.isFinal ? finalStep?.result : undefined)}
            title="COMPUTED SOLUTION ARTIFACT"
            isFinal={currentStep.isFinal}
          />
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-hairline">
          <div className="flex flex-col gap-8">
            <CodeExplanation step={currentStep} pseudocode={config.pseudocode} />
            <InputControlPanel
              config={config}
              currentInputs={inputs}
              onApplyInputs={(newInputs) => setInputs(newInputs)}
            />
          </div>
          <div className="flex flex-col gap-8">
            <MetricsPanel metrics={currentStep.metrics || {}} />
            <ResultPanel
              result={currentStep.result || (currentStep.isFinal ? finalStep?.result : undefined)}
              title="COMPUTED SOLUTION ARTIFACT"
              isFinal={currentStep.isFinal}
            />
          </div>
        </section>
      )}
    </div>
  );
};

