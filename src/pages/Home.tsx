import React, { useState, useMemo } from 'react';
import { algorithmRegistry } from '../config/algorithmRegistry';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, ArrowUpRight } from 'lucide-react';
import { MODULE_DESCRIPTIONS } from './ModulePage';
import { VIGNETTES } from '../components/home/StoryVignettes';
import { CheeseWheel3D } from '../components/home/fx/lazy';

interface HomeProps {
  onSelectModule: (moduleNumber: number) => void;
  onSelectAlgorithm: (id: string) => void;
}

/** The stories a visitor can pick in the showcase: each plays the algorithm's default example. */
const STORIES = [
  { id: 'fractional-knapsack', label: 'Cheese in a backpack', note: 'Fractional Knapsack packs the best value per kilo first, and slices the last wheel to fit.' },
  { id: 'ford-fulkerson', label: 'Water through pipes', note: 'Ford-Fulkerson keeps finding a path with spare room and pushes more water down it.' },
  { id: 'n-queens', label: 'Queens on a chessboard', note: 'N-Queens places one queen per row and backs up the moment two can attack.' },
  { id: 'graham-scan', label: 'A rubber band round pegs', note: 'Graham’s Scan walks the pegs in angle order and drops every dent in the fence.' },
  { id: 'randomized-quicksort', label: 'Kids lining up by height', note: 'Quicksort picks a random kid and splits everyone into shorter and taller.' },
];

/** Algorithm names by id, for links that name where they go. */
const ALGO_NAMES: Record<string, string> = Object.fromEntries(algorithmRegistry.map((a) => [a.id, a.name]));

const STAIRS = [
  { line: 'First, read the problem.', note: 'Every page starts with what the algorithm solves, in plain words, before any code.' },
  { line: 'Then switch on the story.', note: 'Animation Mode turns the data into things you can picture: cheese, pipes, pegs, coins.' },
  { line: 'The owl tells each step.', note: 'One sentence per step says what just happened and why, while the scene acts it out.' },
  { line: 'You set the pace.', note: 'Press Step or the right arrow key. Change the input and watch a different run.' },
];

/** Each line starts further right, so the four read as a staircase. */
const STAIR_START = ['md:col-start-1', 'md:col-start-3', 'md:col-start-5', 'md:col-start-6'];

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const rise = (reduce: boolean | null, i = 0) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-10% 0px' },
        transition: { duration: 0.6, ease: EASE_OUT, delay: i * 0.08 },
      };

export const Home: React.FC<HomeProps> = ({ onSelectModule, onSelectAlgorithm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [storyId, setStoryId] = useState(STORIES[0].id);
  const reduce = useReducedMotion();

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

  return (
    <div className="home-a flex flex-col w-full">
      {/* HERO: the sentence is the layout; a 3D cheese wheel stands in for its last word. */}
      <section className="ha-frame pt-[clamp(48px,9vh,120px)] pb-[clamp(72px,12vh,160px)]">
        <motion.h1
          className="ha-display text-[clamp(56px,9.6vw,172px)] leading-[0.88]"
          initial={reduce ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Algorithms,
          <br />
          acted out with{' '}
          <span className="ha-slot" aria-hidden>
            <CheeseWheel3D className="ha-slot-3d" />
          </span>
          <span className="sr-only">a cheese wheel</span>
        </motion.h1>

        <motion.div
          className="mt-10 grid gap-8 md:grid-cols-12 items-end"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="md:col-span-6 ha-lead max-w-[46ch]">
            AlgoViz plays all {totalAlgorithms} algorithms of Design and Analysis of Algorithms (BCSE204L) one step at a
            time, as stories with cheese, pipes and chessboards, told by an owl. No prior knowledge needed.
          </p>
          <div className="md:col-span-6 flex flex-wrap items-center gap-x-8 gap-y-4 md:justify-end">
            <button type="button" onClick={() => onSelectModule(1)} className="ha-button">
              Start with module 1 <ArrowRight className="w-5 h-5" aria-hidden />
            </button>
            <a href="#find" className="ha-link">
              Find an algorithm
            </a>
          </div>
        </motion.div>
      </section>

      {/* SHOWCASE: the live thing. Pick a story and its example plays. On narrow screens the drawing
          comes between the introduction and the list, so a pick always changes something in view. */}
      <section
        className="ha-frame ha-section grid gap-x-12 gap-y-10 lg:grid-cols-12 lg:grid-rows-[auto_1fr] items-start"
        aria-labelledby="ha-stories"
      >
        <div className="lg:col-span-5 lg:row-start-1 flex flex-col gap-8">
          <motion.h2 id="ha-stories" className="ha-display text-[clamp(44px,5vw,88px)] leading-[0.9]" {...rise(reduce)}>
            Pick a story, watch it play
          </motion.h2>
          <motion.p className="ha-body max-w-[42ch]" {...rise(reduce, 1)}>
            Each one plays an algorithm&rsquo;s first example with the objects its Animation Mode uses. Open it to
            step through the same run, with the owl explaining.
          </motion.p>
        </div>

        <div className="lg:col-start-6 lg:col-span-7 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-20 flex flex-col gap-5">
          <motion.div
            className="ha-stage"
            initial={reduce ? false : { clipPath: 'inset(0 0 100% 0)' }}
            whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={storyId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StoryVignette controls />
              </motion.div>
            </AnimatePresence>
          </motion.div>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <p className="ha-body max-w-[52ch]">{story.note}</p>
            <button type="button" onClick={() => onSelectAlgorithm(story.id)} className="ha-link">
              Open {ALGO_NAMES[story.id]}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 lg:row-start-2">
          <motion.ul className="flex flex-col" role="list" {...rise(reduce, 2)}>
            {STORIES.map((s) => {
              const on = s.id === storyId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setStoryId(s.id)}
                    className={`ha-story ${on ? 'is-on' : ''}`}
                  >
                    <span>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        </div>
      </section>

      {/* HOW IT WORKS: four lines stepping across the page. */}
      <section className="ha-frame ha-section" aria-labelledby="ha-how">
        <ol className="grid grid-cols-12 gap-y-14">
          {STAIRS.map((s, i) => (
            <motion.li
              key={s.line}
              className={`col-span-12 md:col-span-7 ${STAIR_START[i]}`}
              {...rise(reduce, i)}
            >
              {i === 0 ? (
                <h2 id="ha-how" className="ha-display text-[clamp(36px,4.6vw,84px)] leading-none">
                  {s.line}
                </h2>
              ) : (
                <p className={`ha-display text-[clamp(36px,4.6vw,84px)] leading-none ${i === STAIRS.length - 1 ? 'ha-accent' : ''}`}>
                  {s.line}
                </p>
              )}
              <p className="ha-body mt-3 max-w-[38ch]">{s.note}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* THE CATALOGUE: a statement, the search on the left, the modules as a table on the right. */}
      <section id="find" className="ha-frame ha-section scroll-mt-16" aria-labelledby="ha-modules">
        <motion.h2 id="ha-modules" className="ha-display text-[clamp(44px,5.4vw,96px)] leading-[0.92] md:pl-[3vw]" {...rise(reduce)}>
          Seven modules,
          <br />
          {totalAlgorithms} algorithms
        </motion.h2>

        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <motion.div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20 self-start" {...rise(reduce, 1)}>
            <label htmlFor="ha-search" className="ha-body font-semibold">
              Find an algorithm
            </label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ha-muted" aria-hidden />
              <input
                id="ha-search"
                type="search"
                placeholder="Rabin-Karp, Held-Karp, KMP…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ha-input"
              />
            </div>
            <p role="status" className="ha-small ha-muted">
              {searchTerm.trim() ? `${searchResults.length} found` : 'Searches names, problems and paradigms.'}
            </p>
          </motion.div>

          <div className="lg:col-start-6 lg:col-span-7">
            {searchTerm.trim() ? (
              searchResults.length === 0 ? (
                <p className="ha-body">
                  Nothing matches &ldquo;{searchTerm}&rdquo;. Try another word, or browse the modules.
                </p>
              ) : (
                <ul role="list" className="flex flex-col gap-2">
                  {searchResults.map((algo) => (
                    <li key={algo.id}>
                      <button type="button" onClick={() => onSelectAlgorithm(algo.id)} className="ha-row">
                        <span className="ha-row-main">
                          <span className="ha-row-title">{algo.name}</span>
                          <span className="ha-small ha-muted">{algo.moduleName}</span>
                        </span>
                        <span className="ha-small ha-muted text-right">{algo.paradigm}</span>
                        <ArrowUpRight className="w-5 h-5 ha-arrow" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <ul role="list" className="flex flex-col gap-2">
                {modulesList.map((mod, i) => (
                  <motion.li key={mod.number} {...rise(reduce, i * 0.5)}>
                    <button type="button" onClick={() => onSelectModule(mod.number)} className="ha-row">
                      <span className="ha-row-main">
                        <span className="ha-row-title">{mod.title}</span>
                        <span className="ha-small ha-muted">{mod.algorithms.map((a) => a.name).join(' · ')}</span>
                      </span>
                      <span className="ha-small ha-muted text-right whitespace-nowrap">Module {mod.number}</span>
                      <ArrowRight className="w-5 h-5 ha-arrow" aria-hidden />
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
