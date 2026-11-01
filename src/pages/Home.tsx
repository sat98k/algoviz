import React, { useState, useMemo } from 'react';
import { algorithmRegistry } from '../config/algorithmRegistry';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import { MODULE_DESCRIPTIONS } from './ModulePage';
import { STORY_SCENES } from '../components/story/storyRegistry';
import { VIGNETTES } from '../components/home/StoryVignettes';
import { OwlMascot } from '../components/home/OwlMascot';
import { FloatingStory3D, GradientField } from '../components/home/fx/lazy';
import { useLiquidGlass } from '../components/home/fx/useLiquidGlass';
import '../styles/home-c.css';

interface HomeProps {
  onSelectModule: (moduleNumber: number) => void;
  onSelectAlgorithm: (id: string) => void;
}

/** Field colours, ink to match. Each module is a chapter in one of them. */
const FIELDS = {
  coral: { bg: '#ed4b44', ink: '#0f0f0f', soft: '#2e0a08' },
  ink: { bg: '#1a1a1a', ink: '#e6e0d2', soft: '#c9c2b2' },
  green: { bg: '#18bc42', ink: '#1a1a1a', soft: '#0b3d17' },
  yellow: { bg: '#f2c21a', ink: '#1a1a1a', soft: '#4d3c00' },
  bone: { bg: '#dcd5c5', ink: '#1a1a1a', soft: '#4a463e' },
} as const;
type FieldName = keyof typeof FIELDS;

const MODULE_FIELDS: FieldName[] = ['coral', 'ink', 'green', 'yellow', 'bone', 'coral', 'green'];

/** The stories a visitor can pick: each plays the algorithm's default example. */
const STORIES: { id: string; label: string; fact: string; field: FieldName }[] = [
  { id: 'fractional-knapsack', label: 'Cheese', fact: 'Fractional Knapsack packs the best value per kilo first and slices the last wheel to fit.', field: 'green' },
  { id: 'ford-fulkerson', label: 'Pipes', fact: 'Ford-Fulkerson keeps finding a pipe path with room to spare and pushes more water through.', field: 'yellow' },
  { id: 'n-queens', label: 'Queens', fact: 'N-Queens puts one queen in each row and backs up the moment two can attack.', field: 'coral' },
  { id: 'graham-scan', label: 'Pegs', fact: 'Graham’s Scan walks the pegs in angle order and drops every dent in the rubber band.', field: 'yellow' },
  { id: 'randomized-quicksort', label: 'Kids', fact: 'Quicksort picks a random kid and splits everyone into shorter and taller.', field: 'ink' },
];

/** Algorithm names by id, for links that name where they go. */
const ALGO_NAMES: Record<string, string> = Object.fromEntries(algorithmRegistry.map((a) => [a.id, a.name]));

const STAGES = [
  { name: 'Read', text: 'Every algorithm opens with the problem it solves and its steps in plain words. No code, no symbols yet.' },
  { name: 'Watch', text: 'Switch on Animation Mode and the data turns into things: cheese wheels, water tanks, pegs and coins.' },
  { name: 'Listen', text: 'The owl says what each step does and why, one sentence at a time, while the scene acts it out.' },
  { name: 'Step', text: 'Go at your own pace with Step or the arrow keys. Change the input and watch a different run.' },
];
const STAGE_TINTS = ['#0b5e21', '#11883a', '#18bc42', '#7fd897'];
const STAGE_INKS = ['#e6e0d2', '#e6e0d2', '#1a1a1a', '#1a1a1a'];

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SPRING = { type: 'spring' as const, stiffness: 380, damping: 22 };

const rise = (reduce: boolean | null, i = 0) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-10% 0px' },
        transition: { duration: 0.55, ease: EASE_OUT, delay: i * 0.07 },
      };

/** One plain line about what an algorithm's story looks like, or its problem when it has none. */
const storyLine = (id: string, problem: string) =>
  id === 'fractional-knapsack'
    ? 'Cheese wheels sliced to fit a leather backpack'
    : STORY_SCENES[id]?.hint ?? problem.split(/(?<=\.)\s/)[0];

export const Home: React.FC<HomeProps> = ({ onSelectModule, onSelectAlgorithm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [storyId, setStoryId] = useState(STORIES[0].id);
  const [stage, setStage] = useState(0);
  const reduce = useReducedMotion();
  const glassRoot = React.useRef<HTMLDivElement>(null);
  useLiquidGlass(glassRoot);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return algorithmRegistry.filter(
      (algo) =>
        algo.name.toLowerCase().includes(term) ||
        algo.paradigm.toLowerCase().includes(term) ||
        algo.problemStatement.toLowerCase().includes(term) ||
        algo.moduleName.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const totalAlgorithms = algorithmRegistry.length;

  const modulesList = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6, 7].map((num) => ({
        number: num,
        ...(MODULE_DESCRIPTIONS[num] || { title: `Module ${num}`, subtitle: '', description: '', paradigms: [] }),
        algorithms: algorithmRegistry.filter((a) => a.module === num),
      })),
    []
  );

  const story = STORIES.find((s) => s.id === storyId) ?? STORIES[0];
  const StoryVignette = VIGNETTES[story.id];
  const headline = (
    <>
      Algorithms
      <br />
      at play
    </>
  );

  return (
    <div className="home-c flex flex-col w-full">
      {/* HERO: two fields meeting halfway; the headline changes ink as it crosses the seam. */}
      <section data-chapter="bone" className="hc-hero relative overflow-hidden">
        {/* Paper above, with the story objects floating in 3D; a moving shader-gradient field below. */}
        <div className="hc-hero-top">
          <FloatingStory3D className="absolute inset-0" queenColor="#1a1a1a" />
        </div>
        <div className="hc-hero-bottom" ref={glassRoot}>
          <GradientField className="absolute inset-0" colors={['#f2c21a', '#f59e0b', '#ed4b44']} speed={0.2} />
          <p className="hc-lead hc-hero-lead">
            All {totalAlgorithms} algorithms of Design and Analysis of Algorithms, acted out with cheese, pipes and
            chessboards while an owl explains every step.
          </p>
          {/* The first step sits on a liquid-glass pill that refracts the field under it. */}
          <div data-glass className="hc-glass-cta">
            <motion.button
              type="button"
              onClick={() => onSelectModule(1)}
              whileHover={reduce ? undefined : { scale: 1.05, rotate: -1.5 }}
              whileTap={reduce ? undefined : { scale: 0.96 }}
              transition={SPRING}
            >
              Start with module 1 <ArrowRight className="w-5 h-5" aria-hidden />
            </motion.button>
          </div>
        </div>

        <motion.div
          className="hc-headline-wrap"
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduce ? undefined : { type: 'spring', stiffness: 120, damping: 16 }}
        >
          <h1 className="hc-display hc-headline hc-headline-top">{headline}</h1>
          <p className="hc-display hc-headline hc-headline-bottom" aria-hidden>
            {headline}
          </p>
          {/* The owl lands on the headline, perched on its last letters. */}
          <motion.div
            className="hc-owl-perch"
            initial={reduce ? false : { y: -320, rotate: -25 }}
            animate={{ y: 0, rotate: 0 }}
            transition={reduce ? undefined : { type: 'spring', stiffness: 170, damping: 10, delay: 0.6 }}
          >
            <OwlMascot look="left" />
          </motion.div>
        </motion.div>
      </section>

      {/* SHOWCASE: pick an object and its story plays on a coloured disc. The picker comes first so its
          heading leads in reading order; on wide screens the grid puts the disc on the right. */}
      <section data-chapter="bone" className="hc-frame hc-showcase" aria-labelledby="hc-stories">
        <div className="hc-picker">
          <h2 id="hc-stories" className="hc-display hc-picker-title">
            Pick a story
          </h2>
          <ul role="list" className="hc-picker-list">
            {STORIES.map((s) => (
              <li key={s.id}>
                <motion.button
                  type="button"
                  aria-pressed={s.id === storyId}
                  onClick={() => setStoryId(s.id)}
                  className={`hc-display hc-pick ${s.id === storyId ? 'is-on' : ''}`}
                  whileHover={reduce ? undefined : { x: 6 }}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  transition={SPRING}
                >
                  {s.label}
                </motion.button>
              </li>
            ))}
          </ul>
          <p className="hc-body max-w-[34ch]">{story.fact}</p>
          <button type="button" onClick={() => onSelectAlgorithm(story.id)} className="hc-text-link">
            Open {ALGO_NAMES[story.id]}
          </button>
        </div>

        <div className="hc-disc-wrap">
          <motion.div
            className="hc-disc"
            animate={{ backgroundColor: FIELDS[story.field].bg }}
            transition={{ duration: 0.4 }}
          />
          <div className="hc-scene-card" style={{ color: FIELDS[story.field].ink }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={storyId}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotate: 2 }}
                transition={reduce ? { duration: 0.2 } : SPRING}
              >
                <StoryVignette controls />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: an accordion of green panels, dark to light. */}
      <section data-chapter="bone" className="hc-frame hc-section" aria-labelledby="hc-how">
        <div className="grid gap-8 lg:grid-cols-12 items-end">
          <motion.h2 id="hc-how" className="hc-display hc-h2 lg:col-span-5" {...rise(reduce)}>
            How a lesson goes
          </motion.h2>
          <motion.p className="hc-body lg:col-start-7 lg:col-span-5" {...rise(reduce, 1)}>
            Four moves, the same on every one of the {totalAlgorithms} algorithms. Open a stage to see what happens
            in it.
          </motion.p>
        </div>
        <div className="hc-accordion">
          {STAGES.map((s, i) => {
            const open = i === stage;
            return (
              <button
                key={s.name}
                type="button"

                aria-expanded={open}
                onClick={() => setStage(i)}
                className={`hc-panel ${open ? 'is-open' : ''}`}
                style={{ background: STAGE_TINTS[i], color: STAGE_INKS[i] }}
              >
                <span className="hc-display hc-panel-name">{s.name}</span>
                <span className="hc-panel-text hc-body">{s.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* THE CATALOGUE: search, then every module as its own colour chapter. */}
      <section id="find" data-chapter="bone" className="hc-frame hc-section scroll-mt-16" aria-labelledby="hc-find">
        <div className="grid gap-8 lg:grid-cols-12 items-end">
          <motion.h2 id="hc-find" className="hc-display hc-h2 lg:col-span-6" {...rise(reduce)}>
            Find an algorithm
          </motion.h2>
          <motion.div className="lg:col-start-7 lg:col-span-6 relative" {...rise(reduce, 1)}>
            <label htmlFor="hc-search" className="sr-only">
              Search all algorithms
            </label>
            <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
            <input
              id="hc-search"
              type="search"
              placeholder="Rabin-Karp, Held-Karp, KMP…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hc-input"
            />
          </motion.div>
        </div>
        {/* Rendered empty first, so screen readers announce the count as it changes. */}
        <p role="status" className="sr-only">
          {searchTerm.trim() ? `${searchResults.length} found` : ''}
        </p>
        {searchTerm.trim() && (
          <div className="mt-14">
            {searchResults.length === 0 ? (
              <p className="hc-body">Nothing matches &ldquo;{searchTerm}&rdquo;. Try another word, or browse the chapters below.</p>
            ) : (
              <ul role="list" className="hc-items">
                {searchResults.map((algo) => (
                  <li key={algo.id}>
                    <AlgoItem
                      name={algo.name}
                      meta={algo.paradigm}
                      line={storyLine(algo.id, algo.problemStatement)}
                      onClick={() => onSelectAlgorithm(algo.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {modulesList.map((mod, mi) => {
        const f = FIELDS[MODULE_FIELDS[mi]];
        return (
          <section
            key={mod.number}
            data-chapter={MODULE_FIELDS[mi]}
            className="hc-chapter"
            style={{ background: f.bg, color: f.ink, ['--soft' as string]: f.soft }}
            aria-labelledby={`hc-mod-${mod.number}`}
          >
            <div className="hc-frame">
              <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
                <motion.h2 id={`hc-mod-${mod.number}`} className="hc-display hc-chapter-title" {...rise(reduce)}>
                  {mod.title}
                </motion.h2>
                <span className="hc-body font-bold whitespace-nowrap">
                  Module {mod.number} · {mod.algorithms.length} algorithms
                </span>
              </div>
              <motion.p className="hc-body mt-5 max-w-[60ch] hc-soft" {...rise(reduce, 1)}>
                {mod.subtitle}.
              </motion.p>
              <ul role="list" className="hc-items mt-12">
                {mod.algorithms.map((algo, i) => (
                  <motion.li key={algo.id} {...rise(reduce, Math.min(i, 6) * 0.6)}>
                    <AlgoItem
                      name={algo.name}
                      meta={algo.paradigm}
                      line={storyLine(algo.id, algo.problemStatement)}
                      onClick={() => onSelectAlgorithm(algo.id)}
                    />
                  </motion.li>
                ))}
              </ul>
              <motion.button
                type="button"
                onClick={() => onSelectModule(mod.number)}
                className="hc-chapter-link"
                style={{ background: f.ink, color: f.bg }}
                whileHover={reduce ? undefined : { scale: 1.04, rotate: -1 }}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                transition={SPRING}
              >
                Open module {mod.number} <ArrowRight className="w-5 h-5" aria-hidden />
              </motion.button>
            </div>
          </section>
        );
      })}
    </div>
  );
};

const AlgoItem: React.FC<{ name: string; meta: string; line: string; onClick: () => void }> = ({
  name,
  meta,
  line,
  onClick,
}) => (
  <button type="button" onClick={onClick} className="hc-item">
    <span className="flex flex-col gap-1 min-w-0">
      <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="hc-item-name">{name}</span>
        <span className="hc-item-meta">{meta}</span>
      </span>
      <span className="hc-item-line">{line}</span>
    </span>
  </button>
);
