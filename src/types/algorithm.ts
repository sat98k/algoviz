export type Paradigm =
  | 'Greedy'
  | 'Divide & Conquer'
  | 'Dynamic Programming'
  | 'Backtracking'
  | 'Branch & Bound'
  | 'String Matching'
  | 'Graph'
  | 'Max Flow'
  | 'Geometric'
  | 'Randomized'
  | 'Approximation';

export type VisualizerType =
  | 'ArrayBarVisualizer'
  | 'GridTableVisualizer'
  | 'TreeVisualizer'
  | 'BoardVisualizer'
  | 'GraphVisualizer'
  | 'PointCanvasVisualizer'
  | 'StringMatchVisualizer'
  | 'RecursionTreeVisualizer'
  | 'FractionalKnapsackVisualizer'
  | 'AssemblyLineVisualizer';

export interface ComplexityInfo {
  timeBest?: string;
  timeAverage?: string;
  timeWorst: string;
  spaceWorst: string;
  description?: string;
}

export interface MetricData {
  comparisons?: number;
  swaps?: number;
  backtracks?: number;
  relaxations?: number;
  recursiveCalls?: number;
  nodesExplored?: number;
  prunedNodes?: number;
  iterations?: number;
  custom?: Record<string, string | number>;
}

export interface HighlightInfo {
  type?: string;
  indices?: number[];
  activeIndices?: number[];
  compareIndices?: number[];
  swapIndices?: number[];
  pivotIndex?: number;
  sortedIndices?: number[];
  window?: [number, number];
  cells?: { r: number; c: number; status?: 'active' | 'source' | 'path' | 'check' | 'skip' | 'visited' }[];
  nodes?: (string | number)[];
  activeNode?: string | number;
  prunedNodes?: (string | number)[];
  edges?: { u: string | number; v: string | number; status?: 'active' | 'flow' | 'residual' | 'visited' | 'cover' | 'conflict' }[];
  points?: number[];
  activePoint?: number;
  hullPoints?: number[];
  checkPoint?: number;
  patternIndex?: number;
  textIndex?: number;
  shiftAmount?: number;
  matchIndices?: number[];
}

export interface AlgorithmStep<T = any> {
  stepIndex: number;
  title: string;
  description: string;
  codeLine?: number;
  state: T;
  highlights: HighlightInfo;
  metrics: MetricData;
  isFinal?: boolean;
  result?: any;
}

export interface InputFieldDefinition {
  name: string;
  label: string;
  type: 'number' | 'text' | 'array' | 'matrix' | 'graph' | 'points' | 'select';
  defaultValue: any;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: { label: string; value: any }[];
  helperText?: string;
  validate?: (val: any) => string | null;
}

export interface PresetInput {
  name: string;
  description?: string;
  data: Record<string, any>;
}

export interface AlgorithmConfig {
  id: string;
  module: number;
  moduleName: string;
  name: string;
  paradigm: Paradigm;
  complexity: ComplexityInfo;
  problemStatement: string;
  explanation: string;
  pseudocode: string[];
  visualizer: VisualizerType;
  inputSchema: InputFieldDefinition[];
  presets: PresetInput[];
  generateRandomInput: () => Record<string, any>;
  stepGenerator: (inputs: any) => Generator<AlgorithmStep<any>>;
}
