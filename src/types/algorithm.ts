import type { GlossaryKey } from '../config/glossary';
import type { ComparisonGroupId } from '../config/comparisonGroups';

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
  | 'AssemblyLineVisualizer'
  | 'TspVisualizer'
  | 'SetCoverVisualizer'
  | 'SweepLineVisualizer';

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
  edges?: { u: string | number; v: string | number; status?: 'active' | 'flow' | 'residual' | 'visited' | 'cover' | 'conflict' | 'negcycle' }[];
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
  codeLine?: number | number[];
  callFlow?: {
    type: 'call' | 'return';
    nodeId: string | number;
  };
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
  /** Extra check on the parsed value; return an error message or null. */
  validate?: (val: any) => string | null;
  /** number / array / points: values must be whole numbers. */
  integer?: boolean;
  /** array: every entry must be > 0. */
  positive?: boolean;
  /** array / points: allowed number of entries. */
  minLength?: number;
  maxLength?: number;
  /** array: inclusive bounds for every entry. */
  itemMin?: number;
  itemMax?: number;
  /** text: regular expression the trimmed value must match, with a learner-facing message. */
  pattern?: string;
  patternMessage?: string;
}

export interface PresetInput {
  name: string;
  description?: string;
  data: Record<string, any>;
}

export interface ResultSummaryDetail {
  label: string;
  value: string | number;
}

export interface ResultSummaryTable {
  caption?: string;
  columns: string[];
  rows: (string | number)[][];
}

/** Learner-facing description of an algorithm's final result. */
export interface ResultSummary {
  headline: string;
  details?: ResultSummaryDetail[];
  table?: ResultSummaryTable;
}

/**
 * Turns a step's raw `result` into a ResultSummary. Return null when the result
 * doesn't have the expected shape; the generic fallback summary is used instead.
 */
export type ResultSummarizer = (result: any, inputs: Record<string, any>) => ResultSummary | null;

/**
 * How an algorithm presents itself on the Comparison page. Algorithms in the same
 * `group` solve the same problem from the same input format, so they can be run
 * side by side on one shared input.
 */
export interface ComparisonProfile {
  group: ComparisonGroupId;
  /** One-sentence summary of the approach. */
  keyIdea: string;
  strengths: string[];
  limitations: string[];
  /** The situation/input where this algorithm is the better choice. */
  chooseWhen: string;
  /** What kind of answer it returns, e.g. "Exact optimum" or "≤ 2 × optimal". */
  answerQuality: string;
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
  /** Glossary terms worth linking in this algorithm's learning text and step descriptions. */
  glossaryTerms?: GlossaryKey[];
  pseudocode: string[];
  visualizer: VisualizerType;
  inputSchema: InputFieldDefinition[];
  presets: PresetInput[];
  generateRandomInput: () => Record<string, any>;
  stepGenerator: (inputs: any) => Generator<AlgorithmStep<any>>;
  summarizeResult?: ResultSummarizer;
  /** Checks that span several fields (e.g. equal lengths). Return an error message or null. */
  validateInputs?: (inputs: Record<string, any>) => string | null;
  /** Present when the algorithm can be compared with others solving the same problem. */
  comparison?: ComparisonProfile;
}
