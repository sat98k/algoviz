import React from 'react';
import { Code, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 py-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-500" />
          <span>BCSE204L — Design and Analysis of Algorithms Course Project</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Code className="w-4 h-4 text-slate-500" />
          <span>Pure Client-Side React + TypeScript • Step Generator Architecture</span>
        </div>
      </div>
    </footer>
  );
};
