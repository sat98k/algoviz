import React from 'react';
import { ComplexityInfo } from '../../types/algorithm';
import { Clock, Cpu, Info } from 'lucide-react';

interface ComplexityBadgeProps {
  complexity: ComplexityInfo;
  paradigm: string;
}

export const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({ complexity, paradigm }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
      {/* Paradigm Badge */}
      <div className="flex flex-col p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3 text-sky-400" /> Paradigm
        </span>
        <span className="mt-1 text-sm font-semibold text-sky-300 font-mono">
          {paradigm}
        </span>
      </div>

      {/* Time Complexity */}
      <div className="flex flex-col p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" /> Time Complexity
        </span>
        <span className="mt-1 text-sm font-semibold text-amber-300 font-mono">
          {complexity.timeAverage ? `${complexity.timeAverage} (avg)` : complexity.timeWorst}
        </span>
        {complexity.timeWorst && complexity.timeAverage && (
          <span className="text-[10px] text-slate-500 font-mono">Worst: {complexity.timeWorst}</span>
        )}
      </div>

      {/* Space Complexity */}
      <div className="col-span-2 md:col-span-1 flex flex-col p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <Cpu className="w-3 h-3 text-emerald-400" /> Space Complexity
        </span>
        <span className="mt-1 text-sm font-semibold text-emerald-300 font-mono">
          {complexity.spaceWorst}
        </span>
        {complexity.description && (
          <span className="text-[10px] text-slate-500 font-mono truncate">{complexity.description}</span>
        )}
      </div>
    </div>
  );
};
