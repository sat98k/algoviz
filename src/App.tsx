import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { AlgorithmPage } from './pages/AlgorithmPage';
import { ComparisonPage } from './pages/ComparisonPage';

export function App() {
  const [view, setView] = useState<'home' | 'algorithm' | 'compare'>('home');
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('randomized-quicksort');

  // Handle URL hash for easy bookmarking and viva demo navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash.startsWith('algorithm/')) {
        const id = hash.replace('algorithm/', '');
        setSelectedAlgoId(id);
        setView('algorithm');
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

  const selectAlgorithm = (id: string) => {
    setSelectedAlgoId(id);
    window.location.hash = `#/algorithm/${id}`;
    setView('algorithm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar currentView={view} onNavigate={navigateTo} />

      <main className="flex-1">
        {view === 'home' && (
          <Home
            onSelectAlgorithm={selectAlgorithm}
            onNavigateComparison={() => navigateTo('compare')}
          />
        )}

        {view === 'algorithm' && (
          <AlgorithmPage
            algorithmId={selectedAlgoId}
            onBack={() => navigateTo('home')}
          />
        )}

        {view === 'compare' && <ComparisonPage />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
