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
        const modNum = parseInt(hash.replace('module/', ''), 10) || 1;
        setSelectedModuleNumber(modNum);
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

  const selectModule = (moduleNum: number) => {
    setSelectedModuleNumber(moduleNum);
    window.location.hash = `#/module/${moduleNum}`;
    setView('module');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectAlgorithm = (id: string) => {
    setSelectedAlgoId(id);
    const algo = algorithmRegistry.find((a) => a.id === id);
    if (algo) {
      setSelectedModuleNumber(algo.module);
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
            onNavigateComparison={() => navigateTo('compare')}
          />
        )}

        {view === 'module' && (
          <ModulePage
            moduleNumber={selectedModuleNumber}
            onSelectAlgorithm={selectAlgorithm}
            onSelectModule={selectModule}
            onBack={() => navigateTo('home')}
          />
        )}

        {view === 'algorithm' && (
          <AlgorithmPage
            algorithmId={selectedAlgoId}
            onBack={() => {
              if (selectedModuleNumber) {
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
