import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GLOSSARY, GlossaryKey, PARADIGM_TERMS, getGlossaryEntry, linkGlossaryTerms } from '../config/glossary';
import { algorithmRegistry, getAlgorithmById } from '../config/algorithmRegistry';
import {
  Term,
  initialTermPopoverState,
  isTermPopoverOpen,
  termPopoverReducer,
  TermPopoverAction,
} from '../components/common/Term';
import { ProblemIntuitionPanel, panelTokens } from '../components/common/ProblemIntuitionPanel';
import { ComplexityAnalysisPanel } from '../components/common/ComplexityAnalysisPanel';
import { StepExplanation } from '../components/common/StepExplanation';

const linkedKeys = (text: string, keys: readonly GlossaryKey[], exclude?: Set<GlossaryKey>) =>
  linkGlossaryTerms(text, keys, exclude).filter((s) => s.termKey).map((s) => [s.termKey, s.text]);

/** Keys linked on the Problem & Intuition panel, mirroring ProblemIntuitionPanel. */
const panelLinks = (id: string) => {
  const c = getAlgorithmById(id)!;
  const t = panelTokens(c.problemStatement, c.explanation, c.coreSteps, c.glossaryTerms);
  const all = [...t.problem, ...(t.steps ?? []).flatMap((st) => [...st.main, ...st.subs.flat()]), ...(t.explanation ?? [])];
  return all
    .filter((tok) => (tok.kind === 'text' || tok.kind === 'bold') && tok.termKey)
    .map((tok) => [(tok as { termKey: GlossaryKey }).termKey, tok.text]);
};

describe('Glossary data', () => {
  const required: GlossaryKey[] = [
    'greedy-algorithm', 'greedy-choice-property', 'optimal-substructure', 'divide-and-conquer', 'recursion',
    'recurrence', 'priority-queue', 'prefix-code', 'huffman-coding', 'dynamic-programming',
    'overlapping-subproblems', 'backtracking', 'branch-and-bound', 'state-space-tree', 'bounding-function',
    'lps', 'string-matching', 'hash-function', 'collision', 'graph', 'vertex', 'edge', 'flow-network',
    'residual-graph', 'augmenting-path', 'maximum-flow', 'minimum-cut', 'relaxation', 'shortest-path',
    'dp-table', 'memoization', 'approximation-algorithm', 'np-hard', 'np-complete', 'recursion-tree',
    'preflow', 'eulerian-multigraph',
  ];

  it.each(required)('defines %s', (key) => {
    expect(getGlossaryEntry(key)).toBeDefined();
  });

  it('keeps every definition concise and every alias lowercase', () => {
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      expect(entry.term.length, key).toBeGreaterThan(0);
      expect(entry.definition.length, key).toBeGreaterThan(20);
      expect(entry.definition.length, key).toBeLessThanOrEqual(260);
      expect(entry.aliases.length, key).toBeGreaterThan(0);
      for (const alias of entry.aliases) expect(alias, key).toBe(alias.toLowerCase());
    }
  });

  it('never maps the same phrase to two different terms', () => {
    const seen = new Map<string, string>();
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      for (const alias of entry.aliases) {
        expect(seen.get(alias), `"${alias}" in ${key} and ${seen.get(alias)}`).toBeUndefined();
        seen.set(alias, key);
      }
    }
  });

  it('defines the LPS term as described in the audit', () => {
    expect(GLOSSARY.lps.definition).toMatch(/^Longest Proper Prefix which is also a Suffix\./);
    expect(GLOSSARY.lps.definition).toContain('how far the pattern can safely shift after a mismatch');
  });

  it('maps paradigm labels to existing glossary terms', () => {
    for (const key of Object.values(PARADIGM_TERMS)) expect(getGlossaryEntry(key!)).toBeDefined();
  });
});

describe('linkGlossaryTerms', () => {
  it('only links listed terms, once each, preserving the original text', () => {
    const text = 'Greedy picks. Greedy again. A priority queue here.';
    const segs = linkGlossaryTerms(text, ['greedy-algorithm']);
    expect(segs.map((s) => s.text).join('')).toBe(text);
    expect(segs.filter((s) => s.termKey)).toEqual([{ text: 'Greedy', termKey: 'greedy-algorithm' }]);
  });

  it('prefers the longest matching phrase', () => {
    expect(linkedKeys('exhibits the greedy choice property', ['greedy-algorithm', 'greedy-choice-property'])).toEqual([
      ['greedy-choice-property', 'greedy choice property'],
    ]);
  });

  it('matches whole words only', () => {
    expect(linkedKeys('knowledge of hedges', ['edge'])).toEqual([]);
    expect(linkedKeys('each edge (u, v)', ['edge'])).toEqual([['edge', 'edge']]);
  });

  it('skips excluded terms and returns plain text when nothing is listed', () => {
    expect(linkedKeys('uses LPS', ['lps'], new Set(['lps']))).toEqual([]);
    expect(linkGlossaryTerms('uses LPS')).toEqual([{ text: 'uses LPS' }]);
  });
});

describe('Algorithm wiring', () => {
  it.each(algorithmRegistry.filter((a) => a.glossaryTerms?.length).map((a) => [a.id, a] as const))(
    '%s: every listed term is reachable in its problem statement or core idea',
    (id, config) => {
      const reachable = new Set(panelLinks(id).map(([k]) => k));
      expect([...reachable].sort()).toEqual([...new Set(config.glossaryTerms)].sort());
    }
  );

  it('links the expected phrases for the core teaching algorithms', () => {
    expect(panelLinks('fractional-knapsack')).toEqual([
      ['greedy-algorithm', 'greedy'],
      ['greedy-choice-property', 'greedy choice property'],
    ]);
    expect(panelLinks('huffman')).toEqual([
      ['prefix-code', 'prefix code'],
      ['priority-queue', 'priority queue'],
    ]);
    expect(panelLinks('max-subarray')).toEqual([
      ['divide-and-conquer', 'divide and conquer'],
      ['recursion', 'Recursively'],
    ]);
    expect(panelLinks('karatsuba')).toEqual([['recursion', 'Recursively']]);
    expect(panelLinks('n-queens')).toEqual([['backtracking', 'backtrack']]);
    expect(panelLinks('kmp')).toEqual([['lps', 'LPS']]);
  });

  it('links LPS inside KMP step descriptions', () => {
    const kmp = getAlgorithmById('kmp')!;
    const steps = [...kmp.stepGenerator({ text: 'ABABDABACDABABCABAB', pattern: 'ABABCABAB' })];
    const linked = steps.filter((s) => linkedKeys(s.description, kmp.glossaryTerms!).length > 0);
    expect(linked.length).toBeGreaterThan(0);
  });
});

describe('Term popover state', () => {
  const run = (...actions: TermPopoverAction['type'][]) =>
    actions.reduce((s, type) => termPopoverReducer(s, { type } as TermPopoverAction), initialTermPopoverState);

  it('opens on mouse hover and closes when the pointer leaves', () => {
    expect(isTermPopoverOpen(run('hoverStart'))).toBe(true);
    expect(isTermPopoverOpen(run('hoverStart', 'hoverEnd'))).toBe(false);
  });

  it('click/tap pins it open (even after hover ends) and a second click closes it', () => {
    expect(isTermPopoverOpen(run('click'))).toBe(true);
    expect(isTermPopoverOpen(run('hoverStart', 'click', 'hoverEnd'))).toBe(true);
    expect(isTermPopoverOpen(run('click', 'click'))).toBe(false);
  });

  it('opens on keyboard focus; Enter toggles it, Escape and blur close it', () => {
    expect(isTermPopoverOpen(run('keyboardFocus'))).toBe(true);
    expect(isTermPopoverOpen(run('keyboardFocus', 'click'))).toBe(false);
    expect(isTermPopoverOpen(run('keyboardFocus', 'click', 'click'))).toBe(true);
    expect(isTermPopoverOpen(run('keyboardFocus', 'dismiss'))).toBe(false);
    expect(isTermPopoverOpen(run('click', 'blur'))).toBe(false);
  });

  it('dismiss closes regardless of how it was opened', () => {
    expect(isTermPopoverOpen(run('hoverStart', 'keyboardFocus', 'click', 'dismiss'))).toBe(false);
  });
});

describe('Rendered markup', () => {
  it('Term renders a keyboard-focusable button with ARIA state', () => {
    const html = renderToStaticMarkup(<Term termKey="lps">LPS</Term>);
    expect(html).toContain('<button type="button"');
    expect(html).toContain('data-glossary-term="lps"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('aria-describedby');
    expect(html).toContain('>LPS</button>');
  });

  it('Term defaults its label to the glossary name', () => {
    expect(renderToStaticMarkup(<Term termKey="preflow" />)).toContain('>Preflow</button>');
  });

  it.each([
    ['fractional-knapsack', ['greedy-choice-property', 'greedy-algorithm']],
    ['huffman', ['prefix-code', 'priority-queue']],
    ['max-subarray', ['divide-and-conquer', 'recursion']],
    ['karatsuba', ['recursion']],
    ['n-queens', ['backtracking']],
    ['kmp', ['lps']],
  ] as const)('%s Problem & Intuition panel renders its terms', (id, keys) => {
    const c = getAlgorithmById(id)!;
    const html = renderToStaticMarkup(
      <ProblemIntuitionPanel problemStatement={c.problemStatement} explanation={c.explanation} coreSteps={c.coreSteps} terms={c.glossaryTerms} />
    );
    for (const key of keys) expect(html).toContain(`data-glossary-term="${key}"`);
  });

  it('paradigm badge links the paradigm term', () => {
    const c = getAlgorithmById('karatsuba')!;
    const html = renderToStaticMarkup(<ComplexityAnalysisPanel analysis={c.analysis} paradigm={c.paradigm} />);
    expect(html).toContain('data-glossary-term="divide-and-conquer"');
  });

  it('step description links listed terms', () => {
    const html = renderToStaticMarkup(
      <StepExplanation
        step={{ stepIndex: 0, title: 't', description: 'Falling back to LPS[2] = 1.', state: {}, highlights: {}, metrics: {} }}
        stepNumber={1}
        totalSteps={1}
        glossaryTerms={['lps']}
      />
    );
    expect(html).toContain('data-glossary-term="lps"');
  });
});
