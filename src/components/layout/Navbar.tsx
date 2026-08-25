import React, { useState, useEffect } from 'react';
import { GitCompare, BookOpen, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('algoviz_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('algoviz_theme', nextTheme);
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e);
    }
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-obsidian-950/85 backdrop-blur-xl border-b border-hairline transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Typographic Lock */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-baseline gap-3 cursor-pointer group select-none"
        >
          <span className="font-display font-bold text-2xl tracking-tighter text-chalk-100 group-hover:text-amber transition-colors">
            ALGO<span className="font-serif italic font-normal text-amber-glow">VIZ</span>
          </span>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-widest text-chalk-400 border-l border-hairline pl-3">
            DAA // BCSE204L
          </span>
        </div>

        {/* Center Live Badge (Editorial Style) */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-chalk-400 px-3 py-1 rounded-full bg-obsidian-850 border border-hairline">
          <span className="w-1.5 h-1.5 rounded-full bg-acid-500 animate-ping"></span>
          <span>8 SYLLABUS MODULES • INTERACTIVE STEP GENERATOR</span>
        </div>

        {/* Navigation & Theme Toggle */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('home')}
            className={`group relative px-3 sm:px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all duration-200 ${
              currentView === 'home'
                ? 'text-chalk-100 bg-obsidian-800 border border-hairline font-bold'
                : 'text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">[ 01 // Catalog ]</span>
              <span className="sm:hidden">Catalog</span>
            </span>
          </button>

          <button
            onClick={() => onNavigate('compare')}
            className={`group relative px-3 sm:px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all duration-200 ${
              currentView === 'compare'
                ? 'text-amber-glow bg-amber-dim/10 border border-amber/30 font-bold'
                : 'text-chalk-400 hover:text-amber-glow hover:bg-obsidian-850'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-amber" />
              <span className="hidden sm:inline">[ 02 // Showdown ]</span>
              <span className="sm:hidden">Showdown</span>
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Editorial Light Mode' : 'Switch to Dark Mode'}
            className="group relative flex items-center gap-1.5 px-3 py-2 text-xs font-mono tracking-wider uppercase bg-obsidian-850 hover:bg-obsidian-800 text-chalk-300 hover:text-amber-glow border border-hairline transition-all"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber" />
                <span className="hidden md:inline">[ ☼ LIGHT ]</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-amber" />
                <span className="hidden md:inline">[ ☽ DARK ]</span>
              </>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};

