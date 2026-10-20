import React from 'react';
import { BookOpen } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'module' | 'algorithm' | 'compare';
  onNavigate: (view: 'home' | 'compare') => void;
}

/**
 * A thin top bar (h-11 = 2.75rem; the player view and sticky panels are sized from it):
 * the logo and the catalog. The site uses the light theme only.
 */
export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => (
  <header className="sticky top-0 z-50 w-full bg-obsidian-950/90 backdrop-blur-xl border-b border-hairline">
    <div className="px-3 sm:px-4 h-11 flex items-center justify-between">
      <div onClick={() => onNavigate('home')} className="flex items-baseline gap-2.5 cursor-pointer group select-none">
        <span className="font-display font-bold text-lg tracking-tighter text-chalk-100 group-hover:text-amber transition-colors">
          ALGO<span className="font-serif italic font-normal text-amber-glow">VIZ</span>
        </span>
        <span className="hidden sm:inline-block font-mono text-[11px] tracking-wider text-chalk-400 border-l border-hairline pl-2.5">
          ALGORITHM VISUALIZER
        </span>
      </div>

      <nav className="flex items-center">
        <button
          onClick={() => onNavigate('home')}
          className={`px-3 py-1 text-xs font-mono tracking-wider transition-colors ${
            currentView === 'home' || currentView === 'module'
              ? 'text-chalk-100 bg-obsidian-800 border border-hairline font-bold'
              : 'text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850 border border-transparent'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>CATALOG</span>
          </span>
        </button>
      </nav>
    </div>
  </header>
);
