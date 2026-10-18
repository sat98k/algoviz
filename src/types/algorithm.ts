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
  | 'SweepLineVisualizer'
  | 'LCSVisualizer';

export interface ComplexityInfo {
  timeBest?: string;
  timeAverage?: string;
  timeWorst: string;
  spaceWorst: string;
  description?: string;
}

/** How a bound should be read (shown as chips next to the analysis). */
export type BoundKind =
  | 'Worst-case'
  | 'Expected'
  | 'Amortized'
  | 'Pseudo-polynomial'
  | 'Output-sensitive'
  | 'Exponential'
  | 'Randomized (Monte Carlo)'
  | 'Approximation';

export interface TimeBound {
  /** 'all' = the same bound in every case (say why in `note`). */
  case: 'best' | 'expected' | 'average' | 'worst' | 'all';
  /** Plain-text formula, e.g. "O(n log n)", "O(n²·2ⁿ)". Never LaTeX. */
  bound: string;
  /** When this case happens / under which assumption. */
  note?: string;
}

/** Semantic tone of a DP case or rule (maps to the shared colour semantics). */
export type DpTone = 'match' | 'mismatch' | 'current' | 'compare' | 'decision';

/** One recurrence case: when it applies, what is computed, and what that means. */
export interface DpCase {
  /** Short case name, e.g. "Match". */
  label: string;
  tone: DpTone;
  /** When this case applies, as a short expression. */
  condition: string;
  /** The formula, plain-text math. */
  formula: string;
  /** What it means in a few words. */
  action: string;
}

/**
 * The recurrence cases of a DP algorithm, shown inside "How it works" (the numbered
 * core steps already define the cell, the base case, the fill order and the answer).
 */
export interface DpBrief {
  cases: DpCase[];
  /** Optional extras shown in a collapsed "worked example" section. */
  details?: { label: string; text: string }[];
}

/** The rule applied at the current step, read by the "Rule for this cell" card. Values are the step's real data. */
export interface DpRuleStep {
  label: string;
  tone: DpTone;
  /** The condition checked, with its outcome (✓ / ✗). */
  check?: { text: string; ok: boolean };
  formula: string;
  /** The formula with this step's actual numbers. */
  substitution: string;
  action: string;
}

/** The teaching analysis shown in the "Time and space complexity" section. */
export interface ComplexityAnalysis {
  variables: { symbol: string; meaning: string }[];
  time: TimeBound[];
  kinds: BoundKind[];
  /** What dominates the running time, in one sentence. */
  dominant: string;
  recurrence?: string;
  /** 2–4 sentence derivation. */
  derivation: string;
  space: { bound: string; explanation: string };
  /** Where this visualizer's code is simpler than the textbook version and costs more. */
  implementationNote?: string;
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
  cells?: { r: number; c: number; status?: 'active' | 'source' | 'path' | 'check' | 'skip' | 'visited'; arrow?: '↖' | '↑' | '←' }[];
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
  /** Short summary used by compact views (derived from `analysis`). */
  complexity: ComplexityInfo;
  analysis: ComplexityAnalysis;
  /** Present for dynamic-programming algorithms. */
  dpBrief?: DpBrief;
  problemStatement: string;
  explanation: string;
  /** "How it works": 3–6 short numbered steps (RichText markup), shown instead of `explanation`. */
  coreSteps?: string[];
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
