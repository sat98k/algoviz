import React, { useEffect, useId } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { AlgorithmConfig } from '../../types/algorithm';
import { InputControlPanel } from './InputControlPanel';

interface InputDialogProps {
  config: AlgorithmConfig;
  currentInputs: Record<string, any>;
  /** New inputs were applied (Run, a preset or Randomize). The dialog closes after this. */
  onApply: (inputs: Record<string, any>) => void;
  onClose: () => void;
}

/**
 * "Edit input" popup on the player view: the usual input form in a dialog, so changing
 * the input never means scrolling away from the animation. Applying closes it and the
 * player restarts with the new input.
 */
export const InputDialog: React.FC<InputDialogProps> = ({ config, currentInputs, onApply, onClose }) => {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-2 sm:p-6" data-input-dialog>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-4xl max-h-[calc(92vh/var(--app-zoom,1))] flex flex-col bg-obsidian-900 border border-hairline shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-hairline">
          <h2 id={titleId} className="flex items-center gap-2 font-sans text-sm font-semibold text-chalk-100">
            <SlidersHorizontal className="w-4 h-4 text-amber" aria-hidden />
            Edit input: {config.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 text-chalk-400 hover:text-chalk-100 border border-hairline hover:bg-obsidian-850"
          >
            <X className="w-4 h-4" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 py-3">
          <p className="mb-2 font-sans text-xs text-chalk-400">Pick a preset, randomize, or type your own values and press Run. The animation restarts with the new input.</p>
          <InputControlPanel config={config} currentInputs={currentInputs} onApplyInputs={onApply} />
        </div>
      </div>
    </div>
  );
};
