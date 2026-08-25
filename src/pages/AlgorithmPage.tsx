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

// Controls & Panels
import { PlaybackControls } from '../components/common/PlaybackControls';
import { ComplexityBadge } from '../components/common/ComplexityBadge';
import { MetricsPanel } from '../components/common/MetricsPanel';
import { ResultPanel } from '../components/common/ResultPanel';
import { InputControlPanel } from '../components/common/InputControlPanel';
import { CodeExplanation } from '../components/common/CodeExplanation';

import { ArrowLeft, Terminal } from 'lucide-react';

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
        <p className="text-rose-400 font-mono text-xs uppercase tracking-widest">
          ERROR 404 // ALGORITHM '{algorithmId}' NOT FOUND IN REGISTRY.
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
  }, [inputs, algorithmId]);

  // Playback timer loop
  const timerRef = useRef<number | null>(null);

  const stepForward = useCallback(() => {
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
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
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
        return <TreeVisualizer step={currentStep} />;
      case 'BoardVisualizer':
        return <BoardVisualizer step={currentStep} />;
      case 'GraphVisualizer':
        return <GraphVisualizer step={currentStep} />;
      case 'PointCanvasVisualizer':
        return <PointCanvasVisualizer step={currentStep} />;
      case 'StringMatchVisualizer':
        return <StringMatchVisualizer step={currentStep} />;
      default:
        return (
          <div className="p-12 text-center font-mono text-xs text-chalk-500 border border-hairline bg-obsidian-950">
            VISUALIZER '{config.visualizer}' IS NOT REGISTERED.
          </div>
        );
    }
  };

  const moduleNumStr = String(config.module).padStart(2, '0');

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Top Header & Navigation */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-6 pb-6 border-b border-hairline"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            {/* Back trigger + Chapter index */}
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-obsidian-950 hover:bg-obsidian-850 text-chalk-400 hover:text-chalk-100 border border-hairline font-mono text-xs uppercase tracking-wider transition-colors"
                title="Back to Catalog"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>CATALOG</span>
              </button>

              <span className="font-mono text-xs text-amber uppercase tracking-widest">
                [ {moduleNumStr} // {config.moduleName.toUpperCase()} ]
              </span>
            </div>

            {/* Main Algorithm Title */}
            <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl tracking-tighter text-chalk-100 mt-1">
              {config.name}
            </h1>
          </div>

          {/* Complexity Ledger Block */}
          <div className="w-full md:w-auto md:min-w-[420px]">
            <ComplexityBadge complexity={config.complexity} paradigm={config.paradigm} />
          </div>
        </div>

        {/* Problem Statement Ledger Banner */}
        <div className="p-4 bg-obsidian-950 border border-hairline flex items-start gap-3">
          <Terminal className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-chalk-500">
              FORMAL PROBLEM STATEMENT
            </span>
            <p className="text-xs sm:text-sm text-chalk-300 font-sans leading-relaxed">
              {config.problemStatement}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Visualizer Stage */}
      <section className="flex flex-col gap-4">
        {/* Visualizer Canvas Component */}
        <div className="w-full relative">
          {renderVisualizer()}
        </div>

        {/* Playback Controls Bar */}
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
          onSeek={(idx) => setCurrentStepIndex(idx)}
          onSpeedChange={(newSpeed) => setSpeed(newSpeed)}
        />
      </section>

      {/* Side-by-Side Lower Deck: Inputs & Explanation vs Metrics & Results */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Left Column: Code & Step Explanation + Inputs */}
        <div className="flex flex-col gap-8">
          <CodeExplanation step={currentStep} pseudocode={config.pseudocode} />
          <InputControlPanel
            config={config}
            currentInputs={inputs}
            onApplyInputs={(newInputs) => setInputs(newInputs)}
          />
        </div>

        {/* Right Column: Live Operation Telemetry + Result Panel */}
        <div className="flex flex-col gap-8">
          <MetricsPanel metrics={currentStep.metrics || {}} />
          <ResultPanel
            result={currentStep.result || (currentStep.isFinal ? finalStep?.result : undefined)}
            title="COMPUTED SOLUTION ARTIFACT"
            isFinal={currentStep.isFinal}
          />
        </div>
      </section>
    </div>
  );
};

