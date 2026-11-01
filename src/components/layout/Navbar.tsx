import React from 'react';

interface NavbarProps {
  currentView: 'home' | 'module' | 'algorithm' | 'compare';
  onNavigate: (view: 'home' | 'compare') => void;
}

/**
 * A thin top bar (h-11 = 2.75rem; the player view and sticky panels are sized from it):
 * the wordmark and the catalog. The site uses the light theme only.
 */
export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const inCatalog = currentView === 'home' || currentView === 'module';
  return (
    <header className="chrome-a sticky top-0 z-50 w-full">
      <div className="ha-frame h-11 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="ha-display text-2xl leading-none min-h-[44px] transition-colors hover:text-[rgb(var(--a-accent))]"
        >
          AlgoViz
        </button>
        <nav className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-current={inCatalog ? 'page' : undefined}
            className={`min-h-[44px] text-[15px] font-semibold underline-offset-[6px] decoration-2 hover:underline ${
              inCatalog ? 'underline' : ''
            }`}
          >
            CATALOG
          </button>
        </nav>
      </div>
    </header>
  );
};
