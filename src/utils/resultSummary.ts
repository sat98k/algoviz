import { ResultSummarizer, ResultSummary, ResultSummaryDetail } from '../types/algorithm';

const isPrimitive = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

/** "selectedItemIndices" -> "Selected item indices" */
export const humanizeKey = (key: string): string => {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const formatValue = (v: unknown): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)));
  if (Array.isArray(v)) return `[${v.map(formatValue).join(', ')}]`;
  return String(v);
};

/**
 * Fallback used when an algorithm has no summarizer or its summarizer can't
 * handle the result. Surfaces top-level scalar / scalar-array fields only.
 */
export const genericResultSummary = (result: unknown): ResultSummary => {
  if (result === null || result === undefined) {
    return { headline: 'The algorithm has finished running.' };
  }
  if (isPrimitive(result)) {
    return { headline: `Result: ${formatValue(result)}` };
  }
  if (Array.isArray(result)) {
    return result.every(isPrimitive)
      ? { headline: `Final output: ${formatValue(result)}` }
      : { headline: `The algorithm produced ${result.length} result entries.` };
  }

  const details: ResultSummaryDetail[] = [];
  for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
    if (isPrimitive(value) || (Array.isArray(value) && value.length > 0 && value.every(isPrimitive))) {
      details.push({ label: humanizeKey(key), value: formatValue(value) });
    }
  }
  return {
    headline: details.length
      ? 'The algorithm has finished. Key results:'
      : 'The algorithm has finished. See the technical result below for details.',
    details,
  };
};

/** Runs the algorithm's summarizer, falling back to the generic summary on null or error. */
export const buildResultSummary = (
  result: unknown,
  summarizer: ResultSummarizer | undefined,
  inputs: Record<string, any> = {}
): ResultSummary => {
  if (summarizer && result !== null && result !== undefined) {
    try {
      const summary = summarizer(result, inputs);
      if (summary && summary.headline) return summary;
    } catch (err) {
      console.warn('Result summarizer failed; using generic summary.', err);
    }
  }
  return genericResultSummary(result);
};
