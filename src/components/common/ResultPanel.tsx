import React, { useState } from 'react';
import { CheckCircle2, Copy, Check } from 'lucide-react';

interface ResultPanelProps {
  result: any;
  title?: string;
  isFinal?: boolean;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ result, title = 'FINAL SOLUTION & COMPUTED ARTIFACTS', isFinal = false }) => {
  const [copied, setCopied] = useState(false);

  if (!result && !isFinal) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-obsidian-900 border border-hairline">
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-acid-500" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-acid-500 font-semibold">
            {title}
          </h3>
        </div>
        {result && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-obsidian-950 hover:bg-obsidian-850 text-chalk-300 border border-hairline text-xs font-mono transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-acid-500" /> COPIED
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-chalk-400" /> COPY JSON
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-4 bg-obsidian-950 border border-hairline font-mono text-xs text-chalk-200 overflow-x-auto max-h-56 leading-relaxed">
        <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
};

