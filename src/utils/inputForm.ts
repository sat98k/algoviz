/**
 * Input form logic for InputControlPanel, kept free of React so it can be tested.
 *
 * Model: every editable field keeps the RAW text the learner typed ("-", "3,", "3.5"
 * are all fine mid-edit). Nothing is parsed or normalized while typing. Values are
 * parsed and validated only when the learner presses Run; if anything is invalid the
 * last applied input (and its visualization) stays untouched.
 *
 * Comma-separated lists: values are separated by commas; spaces are ignored. A single
 * trailing comma is ignored ("3, 4," → [3, 4]) because it is the natural state while
 * typing the next value. An empty value between commas ("3,,4") or a leading comma is
 * reported as an error rather than silently dropped.
 */
import { AlgorithmConfig, InputFieldDefinition } from '../types/algorithm';

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface PointDraft {
  x: string;
  y: string;
}

export interface InputFormState {
  /** Raw text for number / text / array fields. */
  drafts: Record<string, string>;
  /** Raw x/y text for points fields. */
  points: Record<string, PointDraft[]>;
  /** Everything else: select and matrix fields, plus preset data with no editor (graphs, labels…). */
  other: Record<string, any>;
  /** Fields the learner has left at least once; their errors are shown. */
  touched: Record<string, boolean>;
  /** Set after a Run attempt so every error becomes visible. */
  submitted: boolean;
  /** Snapshot taken at reset, used to tell whether there are unapplied edits. */
  baseline: string;
}

export type InputFormAction =
  | { type: 'reset'; config: AlgorithmConfig; inputs: Record<string, any> }
  | { type: 'edit'; name: string; raw: string }
  | { type: 'blur'; name: string }
  | { type: 'editPoint'; name: string; index: number; axis: 'x' | 'y'; raw: string }
  | { type: 'addPoint'; name: string }
  | { type: 'removePoint'; name: string; index: number }
  | { type: 'setOther'; name: string; value: any }
  | { type: 'submitAttempt' };

const DRAFT_TYPES = new Set(['number', 'text', 'array']);
const NUMBER_RE = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

const fmt = (n: number) => String(n);

// ─── Parsing ────────────────────────────────────────────────────────────────

export function parseNumber(raw: string, field: Pick<InputFieldDefinition, 'min' | 'max' | 'integer'>): ParseResult<number> {
  const t = raw.trim();
  if (t === '') return { ok: false, error: 'Enter a number.' };
  if (!NUMBER_RE.test(t)) return { ok: false, error: `“${t}” is not a number.` };
  const value = Number(t);
  if (!Number.isFinite(value)) return { ok: false, error: `“${t}” is not a number.` };
  if (field.integer && !Number.isInteger(value)) return { ok: false, error: 'Enter a whole number.' };
  if (field.min !== undefined && field.max !== undefined && (value < field.min || value > field.max)) {
    return { ok: false, error: `Enter a value from ${fmt(field.min)} to ${fmt(field.max)}.` };
  }
  if (field.min !== undefined && value < field.min) return { ok: false, error: `Enter a value of at least ${fmt(field.min)}.` };
  if (field.max !== undefined && value > field.max) return { ok: false, error: `Enter a value of at most ${fmt(field.max)}.` };
  return { ok: true, value };
}

export function parseNumberList(
  raw: string,
  field: Pick<InputFieldDefinition, 'integer' | 'positive' | 'minLength' | 'maxLength' | 'itemMin' | 'itemMax'>
): ParseResult<number[]> {
  let t = raw.trim();
  if (t.endsWith(',')) t = t.slice(0, -1).trimEnd(); // one trailing comma is ignored
  const min = field.minLength ?? 1;
  if (t === '') return { ok: false, error: min > 1 ? `Enter at least ${min} values, separated by commas.` : 'Enter at least one value.' };

  const tokens = t.split(',').map((s) => s.trim());
  const values: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const pos = `Value ${i + 1}`;
    if (tok === '') return { ok: false, error: i === 0 ? 'Remove the comma at the start.' : `There is an empty value after value ${i} (two commas in a row).` };
    if (!NUMBER_RE.test(tok)) return { ok: false, error: `${pos} (“${tok}”) is not a number.` };
    const v = Number(tok);
    if (field.integer && !Number.isInteger(v)) return { ok: false, error: `${pos} (${tok}) must be a whole number.` };
    if (field.positive && v <= 0) return { ok: false, error: `${pos} (${tok}) must be greater than 0.` };
    if (field.itemMin !== undefined && v < field.itemMin) return { ok: false, error: `${pos} (${tok}) must be at least ${fmt(field.itemMin)}.` };
    if (field.itemMax !== undefined && v > field.itemMax) return { ok: false, error: `${pos} (${tok}) must be at most ${fmt(field.itemMax)}.` };
    values.push(v);
  }
  if (values.length < min) return { ok: false, error: `Enter at least ${min} values (you have ${values.length}).` };
  if (field.maxLength !== undefined && values.length > field.maxLength) {
    return { ok: false, error: `Use at most ${field.maxLength} values (you have ${values.length}).` };
  }
  return { ok: true, value: values };
}

export function parsePoints(
  rows: PointDraft[],
  field: Pick<InputFieldDefinition, 'integer' | 'minLength' | 'maxLength'>
): ParseResult<{ x: number; y: number }[]> {
  const min = field.minLength ?? 3;
  if (rows.length < min) return { ok: false, error: `Add at least ${min} points (you have ${rows.length}).` };
  if (field.maxLength !== undefined && rows.length > field.maxLength) {
    return { ok: false, error: `Use at most ${field.maxLength} points (you have ${rows.length}).` };
  }
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (const axis of ['x', 'y'] as const) {
      const r = parseNumber(rows[i][axis], { integer: field.integer });
      if (!r.ok) return { ok: false, error: `Point ${i + 1}, ${axis}: ${r.error}` };
    }
    pts.push({ x: Number(rows[i].x.trim()), y: Number(rows[i].y.trim()) });
  }
  const distinct = new Set(pts.map((p) => `${p.x},${p.y}`));
  if (distinct.size < 3) return { ok: false, error: 'At least 3 points must be at different positions.' };
  const [a, b] = pts.filter((p, i, arr) => arr.findIndex((q) => q.x === p.x && q.y === p.y) === i);
  const allCollinear = pts.every((p) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) === 0);
  if (allCollinear) return { ok: false, error: 'All points lie on one straight line, so there is no hull to draw. Move at least one point off the line.' };
  return { ok: true, value: pts };
}

export function parseText(raw: string, field: Pick<InputFieldDefinition, 'pattern' | 'patternMessage'>): ParseResult<string> {
  if (raw.trim() === '') return { ok: false, error: 'This field cannot be empty.' };
  if (field.pattern) {
    const t = raw.trim();
    if (!new RegExp(field.pattern).test(t)) return { ok: false, error: field.patternMessage ?? 'This value has the wrong format.' };
    return { ok: true, value: t };
  }
  return { ok: true, value: raw };
}

// ─── Form state ─────────────────────────────────────────────────────────────

export function formatDraft(field: InputFieldDefinition, value: any): string {
  if (value === undefined || value === null || (typeof value === 'number' && !Number.isFinite(value))) return '';
  if (field.type === 'array') return Array.isArray(value) ? value.join(', ') : String(value);
  return String(value);
}

const toPointDrafts = (value: any): PointDraft[] =>
  Array.isArray(value) ? value.map((p: any) => ({ x: String(p?.x ?? ''), y: String(p?.y ?? '') })) : [];

const snapshot = (s: Pick<InputFormState, 'drafts' | 'points' | 'other'>) => JSON.stringify([s.drafts, s.points, s.other]);

export function initFormState(config: AlgorithmConfig, inputs: Record<string, any>): InputFormState {
  const drafts: Record<string, string> = {};
  const points: Record<string, PointDraft[]> = {};
  const other: Record<string, any> = { ...inputs };
  for (const field of config.inputSchema) {
    if (DRAFT_TYPES.has(field.type)) {
      drafts[field.name] = formatDraft(field, inputs[field.name]);
      delete other[field.name];
    } else if (field.type === 'points') {
      points[field.name] = toPointDrafts(inputs[field.name]);
      delete other[field.name];
    }
  }
  const base = { drafts, points, other };
  return { ...base, touched: {}, submitted: false, baseline: snapshot(base) };
}

/** Keeps the TSP cost matrix in step with the city count (3–6), as the old form did. */
function resizeCostMatrix(other: Record<string, any>, raw: string): Record<string, any> {
  const r = parseNumber(raw, { integer: true, min: 3, max: 6 });
  if (!r.ok || !Array.isArray(other.costMatrix)) return other;
  const n = r.value;
  const cur = other.costMatrix as number[][];
  const costMatrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      const v = cur[i]?.[j] ?? cur[j]?.[i];
      return typeof v === 'number' && v > 0 ? v : Math.abs(i - j) * 10 + 5;
    })
  );
  const cityNames = Array.isArray(other.cityNames) ? Array.from({ length: n }, (_, i) => other.cityNames[i] ?? String.fromCharCode(65 + i)) : other.cityNames;
  return { ...other, costMatrix, ...(cityNames ? { cityNames } : {}) };
}

export function inputFormReducer(state: InputFormState, action: InputFormAction): InputFormState {
  switch (action.type) {
    case 'reset':
      return initFormState(action.config, action.inputs);
    case 'edit': {
      const other = action.name === 'numCities' ? resizeCostMatrix(state.other, action.raw) : state.other;
      return { ...state, drafts: { ...state.drafts, [action.name]: action.raw }, other };
    }
    case 'blur':
      return state.touched[action.name] ? state : { ...state, touched: { ...state.touched, [action.name]: true } };
    case 'editPoint': {
      const rows = (state.points[action.name] ?? []).map((p, i) => (i === action.index ? { ...p, [action.axis]: action.raw } : p));
      return { ...state, points: { ...state.points, [action.name]: rows } };
    }
    case 'addPoint': {
      const rows = state.points[action.name] ?? [];
      const last = rows[rows.length - 1];
      const next = last && NUMBER_RE.test(last.x.trim()) && NUMBER_RE.test(last.y.trim())
        ? { x: String(Number(last.x) + 40), y: String(Number(last.y) + 40) }
        : { x: '', y: '' };
      return { ...state, points: { ...state.points, [action.name]: [...rows, next] } };
    }
    case 'removePoint': {
      const rows = (state.points[action.name] ?? []).filter((_, i) => i !== action.index);
      return { ...state, points: { ...state.points, [action.name]: rows }, touched: { ...state.touched, [action.name]: true } };
    }
    case 'setOther':
      return { ...state, other: { ...state.other, [action.name]: action.value } };
    case 'submitAttempt':
      return { ...state, submitted: true };
    default:
      return state;
  }
}

export const isDirty = (state: InputFormState) => snapshot(state) !== state.baseline;

// ─── Validation ─────────────────────────────────────────────────────────────

export interface FormValidation {
  /** Complete inputs ready for the step generator (only meaningful when `valid`). */
  values: Record<string, any>;
  errors: Record<string, string>;
  formError: string | null;
  valid: boolean;
}

export function parseField(field: InputFieldDefinition, state: InputFormState): ParseResult<any> {
  let r: ParseResult<any>;
  switch (field.type) {
    case 'number':
      r = parseNumber(state.drafts[field.name] ?? '', field);
      break;
    case 'array':
      r = parseNumberList(state.drafts[field.name] ?? '', field);
      break;
    case 'text':
      r = parseText(state.drafts[field.name] ?? '', field);
      break;
    case 'points':
      r = parsePoints(state.points[field.name] ?? [], field);
      break;
    default:
      r = { ok: true, value: state.other[field.name] };
  }
  if (r.ok && field.validate) {
    const msg = field.validate(r.value);
    if (msg) return { ok: false, error: msg };
  }
  return r;
}

export function validateForm(config: AlgorithmConfig, state: InputFormState): FormValidation {
  const values: Record<string, any> = { ...state.other };
  const errors: Record<string, string> = {};
  for (const field of config.inputSchema) {
    const r = parseField(field, state);
    if (r.ok) values[field.name] = r.value;
    else errors[field.name] = r.error;
  }
  const fieldsOk = Object.keys(errors).length === 0;
  const formError = fieldsOk && config.validateInputs ? config.validateInputs(values) : null;
  return { values, errors, formError, valid: fieldsOk && !formError };
}

/** Validates a complete inputs object (e.g. a preset) the same way the form would. */
export function validateInputs(config: AlgorithmConfig, inputs: Record<string, any>): FormValidation {
  return validateForm(config, initFormState(config, inputs));
}
