import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AlgorithmStep } from '../types/algorithm';
import { getAlgorithmById } from '../config/algorithmRegistry';

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

import { ArrowLeft, BookOpen } from 'lucide-react';

interface AlgorithmPageProps {
  algorithmId: string;
  onBack: () => void;
}

export const AlgorithmPage: React.FC<AlgorithmPageProps> = ({ algorithmId, onBack }) => {
  const config = useMemo(() => getAlgorithmById(algorithmId), [algorithmId]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-rose-400 font-mono">Algorithm '{algorithmId}' not found in registry.</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
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
          <div className="p-8 text-center text-slate-400">
            Visualizer '{config.visualizer}' is not registered.
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-sky-400">
                {config.moduleName}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">{config.paradigm}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {config.name}
            </h1>
          </div>
        </div>

        {/* Complexity Cards */}
        <div className="w-full md:w-auto min-w-[320px]">
          <ComplexityBadge complexity={config.complexity} paradigm={config.paradigm} />
        </div>
      </div>

      {/* Problem Statement Banner */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Problem Statement
          </h4>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
            {config.problemStatement}
          </p>
        </div>
      </div>

      {/* Main Visualizer Canvas Area */}
      <div className="flex flex-col gap-4">
        {renderVisualizer()}

        {/* Playback Controls */}
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
      </div>

      {/* Side-by-Side Lower Layout: Inputs & Explanation vs Metrics & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Code & Step Explanation */}
        <div className="flex flex-col gap-6">
          <CodeExplanation step={currentStep} pseudocode={config.pseudocode} />
          <InputControlPanel
            config={config}
            currentInputs={inputs}
            onApplyInputs={(newInputs) => setInputs(newInputs)}
          />
        </div>

        {/* Right Column: Live Metrics & Result Panel */}
        <div className="flex flex-col gap-6">
          <MetricsPanel metrics={currentStep.metrics || {}} />
          <ResultPanel
            result={currentStep.result || (currentStep.isFinal ? finalStep?.result : undefined)}
            title="Algorithm Output & Solution"
            isFinal={currentStep.isFinal}
          />
        </div>
      </div>
    </div>
  );
};
