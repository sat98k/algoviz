import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { ModulePage } from './pages/ModulePage';
import { AlgorithmPage } from './pages/AlgorithmPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { algorithmRegistry } from './config/algorithmRegistry';

export function App() {
  const [view, setView] = useState<'home' | 'module' | 'algorithm' | 'compare'>('home');
  const [selectedModuleNumber, setSelectedModuleNumber] = useState<number>(1);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('randomized-quicksort');

  // Handle URL hash for easy bookmarking and viva demo navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash.startsWith('algorithm/')) {
        const id = hash.replace('algorithm/', '');
        setSelectedAlgoId(id);
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
    setView('algorithm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-900 text-chalk-100 font-sans selection:bg-amber selection:text-obsidian-950">
      <Navbar currentView={view} onNavigate={navigateTo} />

      <main className="flex-1">
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
            algorithmId={selectedAlgoId}
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
      </main>

      <Footer />
    </div>
  );
}

export default App;
