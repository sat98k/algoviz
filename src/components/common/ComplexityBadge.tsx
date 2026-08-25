import React from 'react';
import { ComplexityInfo } from '../../types/algorithm';
import { Clock, Cpu, Layers } from 'lucide-react';

interface ComplexityBadgeProps {
  complexity: ComplexityInfo;
  paradigm: string;
}

export const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({ complexity, paradigm }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-obsidian-900 border border-hairline w-full">
      {/* Paradigm */}
      <div className="p-3.5 flex flex-col justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-chalk-500 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-amber" /> PARADIGM
        </span>
        <span className="font-display font-bold text-sm tracking-tight text-chalk-100 mt-1">
          {paradigm}
        </span>
      </div>

      {/* Time Complexity */}
      <div className="p-3.5 flex flex-col justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-chalk-500 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-glow" /> TIME BOUND
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-mono font-bold text-sm text-amber-glow">
            {complexity.timeAverage ? `${complexity.timeAverage} (avg)` : complexity.timeWorst}
          </span>
          {complexity.timeWorst && complexity.timeAverage && (
            <span className="font-mono text-[10px] text-chalk-500">
              W: {complexity.timeWorst}
            </span>
          )}
        </div>
      </div>

      {/* Space Complexity */}
      <div className="p-3.5 flex flex-col justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-chalk-500 flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-acid-500" /> SPACE BOUND
        </span>
        <div className="flex flex-col mt-1">
          <span className="font-mono font-bold text-sm text-acid-500">
            {complexity.spaceWorst}
          </span>
          {complexity.description && (
            <span className="font-mono text-[10px] text-chalk-500 truncate" title={complexity.description}>
              {complexity.description}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

