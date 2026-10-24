import React, { useContext, useRef, useState } from 'react';
import { AlgorithmConfig, AlgorithmStep } from '../../types/algorithm';
import { TreeTraversalOverride } from '../../utils/huffmanCodec';
import { ArrayBarVisualizer } from './ArrayBarVisualizer';
import { GridTableVisualizer } from './GridTableVisualizer';
import { TreeVisualizer } from './TreeVisualizer';
import { BoardVisualizer } from './BoardVisualizer';
import { GraphVisualizer } from './GraphVisualizer';
import { PointCanvasVisualizer } from './PointCanvasVisualizer';
import { StringMatchVisualizer } from './StringMatchVisualizer';
import { FractionalKnapsackVisualizer } from './FractionalKnapsackVisualizer';
import { RecursionTreeVisualizer } from './RecursionTreeVisualizer';
import { AssemblyLineVisualizer } from './AssemblyLineVisualizer';
import { TspVisualizer } from './TspVisualizer';
import { SetCoverVisualizer } from './SetCoverVisualizer';
import { SweepLineVisualizer } from './SweepLineVisualizer';
import { LCSVisualizer } from './LCSVisualizer';
import { NQueensVisualizer } from './NQueensVisualizer';
import { STORY_SCENES } from '../story/storyRegistry';
import { StoryModeToggle, StoryViewMode } from '../story/StoryModeToggle';
import { stepDurationMs } from '../story/useAnimPhases';
import { FitResetKey, FitToBox, FitToScreenContext } from '../common/FitToBox';
import { NarrationGateProvider } from '../story/narrationGate';

interface VisualizerStageProps {
  config: AlgorithmConfig;
  step: AlgorithmStep;
  inputs: Record<string, any>;
  /** Huffman decode-phase traversal highlight (TreeVisualizer only). */
  traversalOverride?: TreeTraversalOverride | null;
  /** Lets visualizers with built-in editors (TSP) change the inputs. */
  onApplyInputs?: (newInputs: Record<string, any>) => void;
  /** Playback speed (steps per second); paces story-mode animations. */
  speed?: number;
  /** View shown first when the reader has not picked one for this algorithm yet. */
  defaultMode?: StoryViewMode;
  /**
   * Player only: the owl reads each step's sentence first, and the step's animation waits for it.
   * `onStepSettled` fires once the animation has played and the owl has finished reading;
   * `onNarratedChange` tells whether an owl is narrating (Animation Mode) or not.
   */
  narrate?: boolean;
  onStepSettled?: (stepIndex: number) => void;
  onNarratedChange?: (narrated: boolean) => void;
  /** The reader pressed the owl's ⏩ Skip. */
  onOwlSkip?: () => void;
  /** Player only: paused, so the owl and the animation stand still (Play / Pause controls both). */
  paused?: boolean;
}

/** View mode chosen per algorithm, so it survives the stage remounting (e.g. a layout switch). */
const chosenMode: Record<string, StoryViewMode> = {};

/**
 * Renders the visualizer registered for an algorithm. Algorithms with a story scene
 * (see storyRegistry) get a 📊 / 🎬 toggle; the technical view stays the default.
 */
export const VisualizerStage: React.FC<VisualizerStageProps> = (props) => {
  const { narrate, step, speed, onStepSettled, onNarratedChange, onOwlSkip, paused } = props;
  // A new key on every step change (even back to a step seen before, or to the same index of a
  // new run after the inputs or Huffman's phase change), so the owl reads again.
  const visit = useRef({ step, n: 0 });
  if (visit.current.step !== step) visit.current = { step, n: visit.current.n + 1 };
  if (!narrate) return <StageBody {...props} />;
  return (
    <NarrationGateProvider
      stepKey={`${props.config.id}|${visit.current.n}|${step.stepIndex}`}
      stepIndex={step.stepIndex}
      stepMs={stepDurationMs(speed)}
      onSettled={onStepSettled}
      onNarrated={onNarratedChange}
      onSkip={onOwlSkip}
      paused={paused}
    >
      <StageBody {...props} />
    </NarrationGateProvider>
  );
};

const StageBody: React.FC<VisualizerStageProps> = (props) => {
  const { config, step, speed, defaultMode = 'technical' } = props;
  const { enabled: fit } = useContext(FitToScreenContext);
  const [mode, setModeState] = useState<StoryViewMode>(chosenMode[config.id] ?? defaultMode);
  const setMode = (m: StoryViewMode) => {
    chosenMode[config.id] = m;
    setModeState(m);
  };
  // In the fit-to-screen player the pane fills its column; only the drawing zooms.
  const fill = fit ? 'lg:flex-1 lg:min-h-0' : '';
  const scene = STORY_SCENES[config.id];
  // Fractional Knapsack draws its own frame and toggle; it zooms only its drawing itself.
  if (!scene)
    return (
      <div className={`flex flex-col w-full ${fill}`}>
        <TechnicalVisualizer {...props} />
      </div>
    );

  const Scene = scene.component;
  return (
    <FitResetKey part={mode}>
      <div className={`flex flex-col w-full gap-3 ${fill} ${fit ? 'lg:gap-1.5' : ''}`}>
        <StoryModeToggle mode={mode} onChange={setMode} storyHint={scene.hint} compact={fit} />
        {mode === 'story' ? (
          <div className={`flex flex-col w-full ${fill}`}>
            <Scene step={step} algorithmId={config.id} stepMs={stepDurationMs(speed)} />
          </div>
        ) : (
          <FitToBox>
            <TechnicalVisualizer {...props} />
          </FitToBox>
        )}
      </div>
    </FitResetKey>
  );
};

/** The existing (technical) visualizer registered for an algorithm (`config.visualizer`). */
const TechnicalVisualizer: React.FC<VisualizerStageProps> = ({
  config,
  step,
  inputs,
  traversalOverride = null,
  onApplyInputs,
}) => {
  switch (config.visualizer) {
    case 'ArrayBarVisualizer':
      return <ArrayBarVisualizer step={step} />;
    case 'GridTableVisualizer':
      return <GridTableVisualizer step={step} />;
    case 'TreeVisualizer':
      return (
        <TreeVisualizer
          key={`${config.id}-${inputs.findMode ?? 'first'}-${Array.isArray(inputs.numbers) ? inputs.numbers.join('_') : ''}-${inputs.targetSum}`}
          step={step}
          traversalOverride={traversalOverride}
        />
      );
    case 'BoardVisualizer':
      return <BoardVisualizer step={step} />;
    case 'GraphVisualizer':
      return (
        <GraphVisualizer
          key={`${config.id}-${inputs.findMode ?? 'first'}-${inputs.numColors ?? 3}-${Array.isArray(inputs.edgeList) ? inputs.edgeList.length : ''}`}
          step={step}
        />
      );
    case 'PointCanvasVisualizer':
      return <PointCanvasVisualizer step={step} />;
    case 'StringMatchVisualizer':
      return <StringMatchVisualizer step={step} />;
    case 'FractionalKnapsackVisualizer':
      return <FractionalKnapsackVisualizer step={step} />;
    case 'RecursionTreeVisualizer':
      return <RecursionTreeVisualizer step={step} />;
    case 'AssemblyLineVisualizer':
      return <AssemblyLineVisualizer step={step} />;
    case 'TspVisualizer':
      return (
        <TspVisualizer
          step={step}
          inputs={inputs}
          onApplyInputs={(newInputs) => onApplyInputs?.(newInputs)}
          presets={config.presets}
        />
      );
    case 'SetCoverVisualizer':
      return <SetCoverVisualizer step={step} />;
    case 'SweepLineVisualizer':
      return <SweepLineVisualizer step={step} />;
    case 'LCSVisualizer':
      return (
        <LCSVisualizer
          step={step}
          inputs={inputs}
          onApplyInputs={(newInputs) => onApplyInputs?.(newInputs)}
        />
      );
    case 'NQueensVisualizer':
      return <NQueensVisualizer step={step} inputs={inputs} />;
    default:
      return (
        <div className="p-12 text-center font-mono text-xs text-chalk-500 border border-hairline bg-obsidian-950">
          VISUALIZER '{config.visualizer}' IS NOT REGISTERED.
        </div>
      );
  }
};
