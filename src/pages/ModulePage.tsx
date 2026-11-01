import React, { useState, useMemo } from 'react';
import { algorithmRegistry } from '../config/algorithmRegistry';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { FIELDS, FieldName, moduleField, storyLine } from '../styles/chapters';
import '../styles/home-c.css';

export type Module2SubCategory = 'dp' | 'backtracking' | 'branch-and-bound';

export interface ParadigmTrackInfo {
  id: Module2SubCategory;
  numeral: string;
  name: string;
  shortName: string;
  badge: string;
  tagline: string;
  description: string;
  paradigm: string;
  accent: 'amber' | 'cyan' | 'acid';
  complexity: string;
  coreConcepts: string[];
  algorithmsCount: number;
}

export const MODULE_2_PARADIGM_TRACKS: Record<Module2SubCategory, ParadigmTrackInfo> = {
  dp: {
    id: 'dp',
    numeral: '01',
    name: 'Dynamic Programming',
    shortName: 'DP',
    badge: '02.A • DYNAMIC PROGRAMMING',
    tagline: 'Solve small questions once, reuse the answers',
    description:
      'Big problems often contain the same small questions again and again. DP answers each small question once, writes it in a table, and builds the final answer from those saved answers instead of recomputing them.',
    paradigm: 'Dynamic Programming',
    accent: 'amber',
    complexity: 'O(n · W) to O(n³)',
    coreConcepts: [
      'A rule that builds each answer from smaller ones (the recurrence)',
      'A table that stores every small answer',
      'Filling the table so the answers it needs already exist',
      'Tracing back through the table to see which choices were made',
    ],
    algorithmsCount: 5,
  },
  backtracking: {
    id: 'backtracking',
    numeral: '02',
    name: 'Backtracking',
    shortName: 'Backtracking',
    badge: '02.B • BACKTRACKING',
    tagline: 'Try a choice, undo it if it leads nowhere',
    description:
      'Builds a solution one choice at a time. As soon as a partial solution breaks a rule, it undoes the last choice (backtracks) and tries the next option, so hopeless options are never finished.',
    paradigm: 'Backtracking',
    accent: 'cyan',
    complexity: 'O(kⁿ) / O(n!) worst-case with pruning',
    coreConcepts: [
      'A tree of choices, explored one branch at a time',
      'Checking the rules after every choice',
      'Undoing a choice at a dead end (backtracking)',
      'Stopping at the first solution, or finding all of them',
    ],
    algorithmsCount: 3,
  },
  'branch-and-bound': {
    id: 'branch-and-bound',
    numeral: '03',
    name: 'Branch & Bound',
    shortName: 'Branch & Bound',
    badge: '02.C • BRANCH & BOUND',
    tagline: 'Explore the most promising option first',
    description:
      'Like backtracking it explores a tree of choices, but every option gets an optimistic estimate of the best it could ever reach (a bound). It explores the most promising option next and skips any option whose bound cannot beat the best answer found so far.',
    paradigm: 'Branch & Bound',
    accent: 'acid',
    complexity: 'Exponential worst-case, optimal average pruning',
    coreConcepts: [
      'An optimistic estimate (bound) for every option',
      'Always exploring the most promising option next',
      'Remembering the best answer found so far',
      'Skipping options that cannot beat it (pruning)',
    ],
    algorithmsCount: 2,
  },
};

export function getModule2SubCategory(paradigm: string): Module2SubCategory | null {
  const p = paradigm.toLowerCase();
  if (p.includes('dynamic') || p.includes('dp')) return 'dp';
  if (p.includes('backtrack')) return 'backtracking';
  if (p.includes('branch') || p.includes('bound')) return 'branch-and-bound';
  return null;
}

export const MODULE_DESCRIPTIONS: Record<
  number,
  { title: string; subtitle: string; description: string; paradigms: string[] }
> = {
  1: {
    title: 'Greedy Algorithms & Divide-and-Conquer',
    subtitle: 'Take the best-looking step each time, or split the problem in half',
    description:
      'Greedy algorithms build an answer by always taking the choice that looks best right now (packing the most valuable cheese per kg, giving common letters short codes). Divide and conquer splits a problem into halves, solves each half and combines the answers (finding the richest stretch of numbers, multiplying big numbers faster).',
    paradigms: ['Greedy', 'Divide & Conquer'],
  },
  2: {
    title: 'Dynamic Programming, Backtracking, Branch & Bound',
    subtitle: 'Reuse small answers, or search through choices cleverly',
    description:
      'Three ways to handle problems with very many possible choices. Dynamic programming fills a table of small answers (Knapsack, LCS, Matrix Chain, Assembly Line, TSP). Backtracking tries choices and undoes the ones that fail (N-Queens, Subset Sum, Graph Coloring). Branch and bound skips choices that cannot beat the best answer so far (Knapsack, Job Selection).',
    paradigms: ['Dynamic Programming', 'Backtracking', 'Branch & Bound'],
  },
  3: {
    title: 'String Matching Algorithms',
    subtitle: 'Find a word inside a long text',
    description:
      'Four ways to find every place a pattern appears in a text: slide it along and check every letter (Naive), reuse what was already matched (KMP), compare quick number fingerprints first (Rabin-Karp), or build a tree of the text so any search is fast (Suffix Tree).',
    paradigms: ['String Matching'],
  },
  4: {
    title: 'Graph Algorithms & Network Flow',
    subtitle: 'Cheapest routes on a map, and the most a pipe network can carry',
    description:
      'Shortest paths: the cheapest route from one place to every other (Bellman-Ford) or between every pair of places (Floyd-Warshall), even when some roads have negative costs. Network flow: how much can be sent from a source to a sink through pipes of limited size (Ford-Fulkerson, Edmonds-Karp, Push-Relabel).',
    paradigms: ['SSSP', 'APSP', 'Max Flow'],
  },
  5: {
    title: 'Geometric Algorithms',
    subtitle: 'Problems about points and lines on a flat surface',
    description:
      'Find the tightest fence around a set of points (the convex hull), either by sorting the points around a corner and removing dents (Graham’s Scan) or by wrapping around the outside point by point (Jarvis’ March), and check whether any two line segments cross (Sweep Line).',
    paradigms: ['Computational Geometry', 'Convex Hull'],
  },
  6: {
    title: 'Randomized Algorithms',
    subtitle: 'Algorithms that make random choices on purpose',
    description:
      'Randomness can make an algorithm fast on every input, or make a hard problem simple. Sort by picking random pivots (Quicksort), see how often you hire when candidates arrive in random order (Hiring Problem), and find the weakest cut in a network by merging random neighbours (Karger).',
    paradigms: ['Randomized', 'Online Selection', 'Min-Cut'],
  },
  7: {
    title: 'Complexity Classes & Approximation Algorithms',
    subtitle: 'Quick answers that are guaranteed to be close to the best',
    description:
      'Some problems are so hard that no known method finds the best answer quickly. These algorithms run fast and promise how far from the best they can be: at most twice the best (Vertex Cover, TSP) or within a small factor (Set Cover).',
    paradigms: ['Approximation', 'NP-Completeness'],
  },
};

interface ModulePageProps {
  moduleNumber: number;
  subCategory?: string | null;
  onSelectAlgorithm: (id: string) => void;
  onSelectModule: (moduleNumber: number, subCategory?: string | null) => void;
  onSelectSubCategory?: (subCategory: string | null) => void;
  onBack: () => void;
}

/** Each Module 2 track keeps one chapter colour wherever it appears. */
const TRACK_FIELDS: Record<Module2SubCategory, FieldName> = {
  dp: 'yellow',
  backtracking: 'coral',
  'branch-and-bound': 'green',
};
const TRACK_ORDER: Module2SubCategory[] = ['dp', 'backtracking', 'branch-and-bound'];

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SPRING = { type: 'spring' as const, stiffness: 380, damping: 22 };

const rise = (reduce: boolean | null, i = 0) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: EASE_OUT, delay: i * 0.06 },
      };

type Algo = (typeof algorithmRegistry)[number];

/**
 * One algorithm as a full row: everything a student needs to choose it, nothing cut off.
 * The whole row is one button; the story line says what its Animation Mode shows.
 */
const AlgorithmRow: React.FC<{ algo: Algo; onOpen: () => void }> = ({ algo, onOpen }) => (
  <button type="button" onClick={onOpen} className="mp-row">
    <span className="mp-row-head">
      <span className="mp-row-name">{algo.name}</span>
      <span className="mp-row-paradigm">{algo.paradigm}</span>
    </span>
    <span className="mp-row-story">{storyLine(algo.id, algo.problemStatement)}</span>
    <span className="mp-row-problem">{algo.problemStatement}</span>
    <span className="mp-row-foot">
      <span>
        Time <span className="mp-num">{algo.complexity.timeAverage || algo.complexity.timeWorst}</span>
        {'  ·  '}
        Space <span className="mp-num">{algo.complexity.spaceWorst}</span>
      </span>
      <span className="mp-row-open">
        Open <ArrowRight className="w-4 h-4" aria-hidden />
      </span>
    </span>
  </button>
);

/** The page header as a chapter field in its own colour. */
const ChapterHeader: React.FC<{
  field: (typeof FIELDS)[FieldName];
  back: { label: string; onClick: () => void };
  kicker: string;
  title: string;
  lead: string;
  body?: string;
  children?: React.ReactNode;
}> = ({ field, back, kicker, title, lead, body, children }) => {
  const reduce = useReducedMotion();
  return (
    <section className="mp-header" style={{ background: field.bg, color: field.ink, ['--soft' as string]: field.soft }}>
      <div className="hc-frame">
        <button type="button" onClick={back.onClick} className="mp-back">
          <ArrowLeft className="w-4 h-4" aria-hidden /> {back.label}
        </button>
        <motion.p className="mp-kicker" {...rise(reduce)}>
          {kicker}
        </motion.p>
        <motion.h1 className="hc-display mp-title" {...rise(reduce, 1)}>
          {title}
        </motion.h1>
        <motion.p className="hc-lead mp-lead" {...rise(reduce, 2)}>
          {lead}
        </motion.p>
        {body && (
          <motion.p className="hc-body mp-body" {...rise(reduce, 3)}>
            {body}
          </motion.p>
        )}
        {children}
      </div>
    </section>
  );
};

/** Search within the page, with its count announced to screen readers. */
const ModuleSearch: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; count: number; total: number }> = ({
  id,
  label,
  value,
  onChange,
  count,
  total,
}) => (
  <div className="mp-search">
    <label htmlFor={id} className="mp-search-label">
      {label}
    </label>
    <div className="relative">
      <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
      <input
        id={id}
        type="search"
        placeholder="Knapsack, Floyd, KMP…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="hc-input mp-search-input"
      />
    </div>
    <p role="status" className="mp-search-count">
      {value.trim() ? `${count} of ${total} shown` : ''}
    </p>
  </div>
);

const RowList: React.FC<{ algos: Algo[]; query: string; onSelect: (id: string) => void; emptyHint: string }> = ({
  algos,
  query,
  onSelect,
  emptyHint,
}) => {
  const reduce = useReducedMotion();
  if (algos.length === 0)
    return (
      <p className="hc-body mp-empty">
        Nothing here matches &ldquo;{query}&rdquo;. {emptyHint}
      </p>
    );
  return (
    <ul role="list" className="mp-rows">
      {algos.map((algo, i) => (
        <motion.li
          key={algo.id}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT, delay: Math.min(i, 8) * 0.05 }}
        >
          <AlgorithmRow algo={algo} onOpen={() => onSelect(algo.id)} />
        </motion.li>
      ))}
    </ul>
  );
};

/** Previous and next at the foot of a page, named for where they go. */
const PageTurn: React.FC<{
  prev?: { label: string; onClick: () => void };
  next?: { label: string; onClick: () => void };
}> = ({ prev, next }) => (
  <nav aria-label="More modules" className="hc-frame mp-turn">
    {prev ? (
      <button type="button" onClick={prev.onClick} className="mp-turn-btn">
        <ArrowLeft className="w-5 h-5" aria-hidden />
        <span>{prev.label}</span>
      </button>
    ) : (
      <span />
    )}
    {next && (
      <button type="button" onClick={next.onClick} className="mp-turn-btn mp-turn-next">
        <span>{next.label}</span>
        <ArrowRight className="w-5 h-5" aria-hidden />
      </button>
    )}
  </nav>
);

const filterAlgos = (algos: Algo[], query: string) => {
  const term = query.trim().toLowerCase();
  if (!term) return algos;
  return algos.filter(
    (a) =>
      a.name.toLowerCase().includes(term) ||
      a.paradigm.toLowerCase().includes(term) ||
      a.problemStatement.toLowerCase().includes(term)
  );
};

export const ModulePage: React.FC<ModulePageProps> = ({
  moduleNumber,
  subCategory,
  onSelectAlgorithm,
  onSelectModule,
  onSelectSubCategory,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewAll, setViewAll] = useState(false);
  const reduce = useReducedMotion();

  const moduleMeta = MODULE_DESCRIPTIONS[moduleNumber] || {
    title: `Module ${moduleNumber}`,
    subtitle: 'Course algorithms',
    description: 'Explore the algorithms in this module.',
    paradigms: [],
  };
  const field = moduleField(moduleNumber);

  const moduleAlgorithms = useMemo(() => algorithmRegistry.filter((a) => a.module === moduleNumber), [moduleNumber]);

  const activeTrack: ParadigmTrackInfo | null = useMemo(() => {
    if (moduleNumber !== 2 || !subCategory) return null;
    return MODULE_2_PARADIGM_TRACKS[subCategory.toLowerCase() as Module2SubCategory] || null;
  }, [moduleNumber, subCategory]);

  const selectTrack = (cat: Module2SubCategory | null) => {
    setSearchTerm('');
    if (onSelectSubCategory) onSelectSubCategory(cat);
    else onSelectModule(2, cat);
  };

  const prevModule = moduleNumber > 1 ? moduleNumber - 1 : null;
  const nextModule = moduleNumber < 7 ? moduleNumber + 1 : null;
  const moduleTurn = {
    prev: prevModule ? { label: `Module ${prevModule}: ${MODULE_DESCRIPTIONS[prevModule]?.title}`, onClick: () => onSelectModule(prevModule) } : undefined,
    next: nextModule ? { label: `Module ${nextModule}: ${MODULE_DESCRIPTIONS[nextModule]?.title}`, onClick: () => onSelectModule(nextModule) } : undefined,
  };

  // ── Module 2, one track (#/module/2/dp and so on) ──────────────────────────────────────────
  if (moduleNumber === 2 && activeTrack) {
    const trackAlgos = moduleAlgorithms.filter((a) => getModule2SubCategory(a.paradigm) === activeTrack.id);
    const shown = filterAlgos(trackAlgos, searchTerm);
    const i = TRACK_ORDER.indexOf(activeTrack.id);
    const prevTrack = i > 0 ? MODULE_2_PARADIGM_TRACKS[TRACK_ORDER[i - 1]] : null;
    const nextTrack = i < TRACK_ORDER.length - 1 ? MODULE_2_PARADIGM_TRACKS[TRACK_ORDER[i + 1]] : null;
    return (
      <div className="home-c mp-page">
        <ChapterHeader
          field={FIELDS[TRACK_FIELDS[activeTrack.id]]}
          back={{ label: 'Module 2 overview', onClick: () => selectTrack(null) }}
          kicker={`Module 2 · ${trackAlgos.length} algorithms`}
          title={activeTrack.name}
          lead={activeTrack.tagline}
          body={activeTrack.description}
        >
          <ul role="list" className="mp-concepts">
            {activeTrack.coreConcepts.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <nav aria-label="Module 2 tracks" className="mp-tracktabs">
            {TRACK_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                aria-current={id === activeTrack.id ? 'page' : undefined}
                onClick={() => selectTrack(id)}
                className="mp-tracktab"
              >
                {MODULE_2_PARADIGM_TRACKS[id].name}
              </button>
            ))}
          </nav>
        </ChapterHeader>
        <section className="hc-frame mp-body-section" aria-labelledby="mp-list">
          <div className="mp-list-head">
            <h2 id="mp-list" className="hc-display hc-h2">
              The algorithms
            </h2>
            <ModuleSearch
              id="mp-search"
              label={`Search ${activeTrack.name}`}
              value={searchTerm}
              onChange={setSearchTerm}
              count={shown.length}
              total={trackAlgos.length}
            />
          </div>
          <RowList algos={shown} query={searchTerm} onSelect={onSelectAlgorithm} emptyHint="Try another word." />
        </section>
        <PageTurn
          prev={prevTrack ? { label: prevTrack.name, onClick: () => selectTrack(prevTrack.id) } : { label: 'Module 2 overview', onClick: () => selectTrack(null) }}
          next={nextTrack ? { label: nextTrack.name, onClick: () => selectTrack(nextTrack.id) } : moduleTurn.next}
        />
      </div>
    );
  }

  const shown = filterAlgos(moduleAlgorithms, searchTerm);

  // ── Module 2 hub: the three tracks first ────────────────────────────────────────────────────
  if (moduleNumber === 2 && !viewAll && !searchTerm.trim()) {
    return (
      <div className="home-c mp-page">
        <ChapterHeader
          field={field}
          back={{ label: 'All modules', onClick: onBack }}
          kicker={`Module 2 · ${moduleAlgorithms.length} algorithms in 3 tracks`}
          title={moduleMeta.title}
          lead={moduleMeta.subtitle + '.'}
          body={moduleMeta.description}
        >
          <ModuleSearch
            id="mp-search"
            label="Search Module 2"
            value={searchTerm}
            onChange={setSearchTerm}
            count={shown.length}
            total={moduleAlgorithms.length}
          />
        </ChapterHeader>
        <section className="mp-tracks" aria-label="Module 2 tracks">
          {TRACK_ORDER.map((id, k) => {
            const track = MODULE_2_PARADIGM_TRACKS[id];
            const f = FIELDS[TRACK_FIELDS[id]];
            const algos = moduleAlgorithms.filter((a) => getModule2SubCategory(a.paradigm) === id);
            return (
              <motion.article
                key={id}
                className="mp-track"
                style={{ background: f.bg, color: f.ink, ['--soft' as string]: f.soft }}
                {...rise(reduce, k)}
                aria-labelledby={`mp-track-${id}`}
              >
                <h2 id={`mp-track-${id}`} className="hc-display mp-track-title">
                  {track.name}
                </h2>
                <p className="hc-lead mp-track-tagline">{track.tagline}</p>
                <p className="hc-body mp-soft">{track.description}</p>
                <ul role="list" className="mp-track-algos">
                  {algos.map((a) => (
                    <li key={a.id}>
                      <button type="button" onClick={() => onSelectAlgorithm(a.id)} className="mp-track-algo">
                        {a.name}
                      </button>
                    </li>
                  ))}
                </ul>
                <motion.button
                  type="button"
                  onClick={() => selectTrack(id)}
                  className="hc-chapter-link"
                  style={{ background: f.ink, color: f.bg }}
                  whileHover={reduce ? undefined : { scale: 1.04, rotate: -1 }}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  transition={SPRING}
                >
                  Open {track.name} <ArrowRight className="w-5 h-5" aria-hidden />
                </motion.button>
              </motion.article>
            );
          })}
        </section>
        <div className="hc-frame mp-viewall">
          <button type="button" onClick={() => setViewAll(true)} className="hc-text-link">
            Show all {moduleAlgorithms.length} Module 2 algorithms in one list
          </button>
        </div>
        <PageTurn {...moduleTurn} />
      </div>
    );
  }

  // ── Any module as one list (and Module 2's "show all") ─────────────────────────────────────
  return (
    <div className="home-c mp-page">
      <ChapterHeader
        field={field}
        back={
          moduleNumber === 2 && viewAll
            ? { label: 'Module 2 tracks', onClick: () => setViewAll(false) }
            : { label: 'All modules', onClick: onBack }
        }
        kicker={`Module ${moduleNumber} · ${moduleAlgorithms.length} algorithms`}
        title={moduleMeta.title}
        lead={moduleMeta.subtitle + '.'}
        body={moduleMeta.description}
      />
      <section className="hc-frame mp-body-section" aria-labelledby="mp-list">
        <div className="mp-list-head">
          <h2 id="mp-list" className="hc-display hc-h2">
            The algorithms
          </h2>
          <ModuleSearch
            id="mp-search"
            label={`Search Module ${moduleNumber}`}
            value={searchTerm}
            onChange={setSearchTerm}
            count={shown.length}
            total={moduleAlgorithms.length}
          />
        </div>
        <RowList
          algos={shown}
          query={searchTerm}
          onSelect={onSelectAlgorithm}
          emptyHint="Try another word, or search every module from the home page."
        />
      </section>
      <PageTurn {...moduleTurn} />
    </div>
  );
};
