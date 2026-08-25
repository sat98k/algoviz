import React, { useState } from 'react';
import { CheckCircle2, Copy, Check } from 'lucide-react';

interface ResultPanelProps {
  result: any;
  title?: string;
  isFinal?: boolean;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ result, title = 'Final Result', isFinal = false }) => {
  const [copied, setCopied] = useState(false);

  if (!result && !isFinal) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/90 border border-emerald-500/30 rounded-xl shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            {title}
          </h3>
        </div>
        {result && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-md text-xs font-mono border border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy JSON
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-48">
        <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
};
