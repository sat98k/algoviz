import { GlassFilter } from './components/glass/GlassFilter';
import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import type { AlgorithmView } from './pages/AlgorithmPage';

// Only the home page ships with the first load; the rest arrive when needed, and are fetched
// while the browser is idle so a click rarely waits for them.
const loadModule = () => import('./pages/ModulePage');
const loadAlgorithm = () => import('./pages/AlgorithmPage');
const loadCompare = () => import('./pages/ComparisonPage');
const ModulePage = lazy(() => loadModule().then((m) => ({ default: m.ModulePage })));
const AlgorithmPage = lazy(() => loadAlgorithm().then((m) => ({ default: m.AlgorithmPage })));
const ComparisonPage = lazy(() => loadCompare().then((m) => ({ default: m.ComparisonPage })));
import { algorithmRegistry } from './config/algorithmRegistry';

export function App() {
  const [view, setView] = useState<'home' | 'module' | 'algorithm' | 'compare'>('home');
  const [selectedModuleNumber, setSelectedModuleNumber] = useState<number>(1);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('randomized-quicksort');
  // #/algorithm/<id> is the owl's explanation; #/algorithm/<id>/play is the player.
  const [algoView, setAlgoView] = useState<AlgorithmView>('learn');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const warm = () => void Promise.all([loadModule(), loadAlgorithm(), loadCompare()]).catch(() => {});
    const t = window.setTimeout(() => (w.requestIdleCallback ? w.requestIdleCallback(warm, { timeout: 4000 }) : warm()), 2500);
    return () => window.clearTimeout(t);
  }, []);

  // A hash route changes nothing a screen reader notices on its own: name the page in the tab
  // title and move focus to its heading (not on the very first load, which starts at the top).
  const firstRoute = useRef(true);
  useEffect(() => {
    const algo = algorithmRegistry.find((a) => a.id === selectedAlgoId);
    document.title =
      view === 'algorithm' && algo
        ? `${algo.name}${algoView === 'play' ? ' (player)' : ''} · AlgoViz`
        : view === 'module'
          ? `Module ${selectedModuleNumber} · AlgoViz`
          : view === 'compare'
            ? 'Compare algorithms · AlgoViz'
            : 'AlgoViz: algorithms, acted out';
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => {
      const heading = mainRef.current?.querySelector<HTMLElement>('h1');
      const target = heading ?? mainRef.current;
      if (!target) return;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [view, selectedModuleNumber, selectedSubCategory, selectedAlgoId, algoView]);

  // Handle URL hash for easy bookmarking and viva demo navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash.startsWith('algorithm/')) {
        const [id, page] = hash.replace('algorithm/', '').split('/');
        setSelectedAlgoId(id);
        setAlgoView(page === 'play' ? 'play' : 'learn');
        const algo = algorithmRegistry.find((a) => a.id === id);
        if (algo) {
          setSelectedModuleNumber(algo.module);
        }
        setView('algorithm');
      } else if (hash.startsWith('module/')) {
        const path = hash.replace('module/', '');
        const parts = path.split('/');
        const modNum = parseInt(parts[0], 10) || 1;
        let subCategory: string | null = parts[1] || null;
        if (subCategory) {
          const sc = subCategory.toLowerCase();
          if (sc === 'dp' || sc === 'dynamic-programming') {
            subCategory = 'dp';
          } else if (sc === 'backtracking') {
            subCategory = 'backtracking';
          } else if (sc === 'branch-and-bound' || sc === 'branch-bound' || sc === 'bb') {
            subCategory = 'branch-and-bound';
          } else {
            subCategory = null;
          }
        }
        setSelectedModuleNumber(modNum);
        setSelectedSubCategory(subCategory);
        setView('module');
      } else if (hash === 'compare') {
        setView('compare');
      } else {
        setView('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newView: string) => {
    if (newView === 'home') {
      window.location.hash = '#/';
      setView('home');
    } else if (newView === 'compare') {
      window.location.hash = '#/compare';
      setView('compare');
    }
  };

  const selectModule = (moduleNum: number, subCategory?: string | null) => {
    setSelectedModuleNumber(moduleNum);
    setSelectedSubCategory(subCategory || null);
    if (subCategory) {
      window.location.hash = `#/module/${moduleNum}/${subCategory}`;
    } else {
      window.location.hash = `#/module/${moduleNum}`;
    }
    setView('module');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectAlgorithm = (id: string) => {
    setSelectedAlgoId(id);
    const algo = algorithmRegistry.find((a) => a.id === id);
    if (algo) {
      setSelectedModuleNumber(algo.module);
      if (algo.module === 2 && !selectedSubCategory) {
        const p = algo.paradigm.toLowerCase();
        if (p.includes('dynamic') || p.includes('dp')) {
          setSelectedSubCategory('dp');
        } else if (p.includes('backtrack')) {
          setSelectedSubCategory('backtracking');
        } else if (p.includes('branch') || p.includes('bound')) {
          setSelectedSubCategory('branch-and-bound');
        }
      }
    }
    window.location.hash = `#/algorithm/${id}`;
    setAlgoView('learn');
    setView('algorithm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[calc(100vh/var(--app-zoom,1))] flex flex-col bg-obsidian-900 text-chalk-100 font-sans selection:bg-amber selection:text-obsidian-950">
      {/* First stop for keyboard users. A button, not an #anchor: the hash is the router. */}
      <button
        type="button"
        className="skip-link"
        onClick={() => {
          const target = mainRef.current?.querySelector<HTMLElement>('h1') ?? mainRef.current;
          if (!target) return;
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus();
        }}
      >
        Skip to content
      </button>
      <GlassFilter />
      <Navbar currentView={view} onNavigate={navigateTo} />

      <main ref={mainRef} id="main" className="flex-1 focus:outline-none">
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
        {view === 'home' && (
          <Home
            onSelectModule={selectModule}
            onSelectAlgorithm={selectAlgorithm}
          />
        )}

        {view === 'module' && (
          <ModulePage
            moduleNumber={selectedModuleNumber}
            subCategory={selectedSubCategory}
            onSelectAlgorithm={selectAlgorithm}
            onSelectModule={selectModule}
            onSelectSubCategory={(subCat) => selectModule(selectedModuleNumber, subCat)}
            onBack={() => navigateTo('home')}
          />
        )}

        {view === 'algorithm' && (
          <AlgorithmPage
            // A fresh page per algorithm, so inputs and playback never carry over between algorithms.
            key={selectedAlgoId}
            algorithmId={selectedAlgoId}
            view={algoView}
            onViewChange={(next) => {
              setAlgoView(next);
              window.location.hash = next === 'play' ? `#/algorithm/${selectedAlgoId}/play` : `#/algorithm/${selectedAlgoId}`;
              window.scrollTo({ top: 0 });
            }}
            onBack={() => {
              if (selectedModuleNumber === 2 && selectedSubCategory) {
                selectModule(2, selectedSubCategory);
              } else if (selectedModuleNumber) {
                selectModule(selectedModuleNumber);
              } else {
                navigateTo('home');
              }
            }}
          />
        )}

        {view === 'compare' && <ComparisonPage />}
        </Suspense>
      </main>

      {view !== 'algorithm' && <Footer />}
    </div>
  );
}

export default App;
