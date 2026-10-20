import React from 'react';

interface StoryStageProps {
  emoji: string;
  title: string;
  subtitle: string;
  /** One plain-English sentence describing what is happening right now. */
  narration: string;
  /** Short status shown on the right of the header (e.g. "Flow reached • 23 L/s"). */
  status?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Warm daylight frame shared by every story scene: a header, a narrator speech
 * bubble and an unclipped stage. Follows docs/animation-preferences.md.
 */
export const StoryStage: React.FC<StoryStageProps> = ({ emoji, title, subtitle, narration, status, children }) => (
  <div
    data-story-stage
    className="flex flex-col w-full bg-[#faf7f2] border border-amber-200/90 rounded-2xl p-4 sm:p-6 select-none relative shadow-md text-stone-800 gap-4"
  >
    <div className="flex flex-wrap items-center justify-between pb-3 border-b border-amber-200/80 gap-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl drop-shadow" aria-hidden>
          {emoji}
        </span>
        <div>
          <h2 className="font-display font-bold text-lg sm:text-xl text-stone-900">{title}</h2>
          <p className="font-sans text-xs text-stone-600">{subtitle}</p>
        </div>
      </div>
      {status && (
        <div className="font-sans text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-full px-3 py-1.5">
          {status}
        </div>
      )}
    </div>

    <OwlBubble narration={narration} />

    <div className="relative w-full overflow-visible">{children}</div>
  </div>
);

/**
 * The owl narrator's speech bubble. On wider screens it sticks just below the playback
 * dock (AlgorithmPage sets --dock-h), so the owl stays in view while the scene scrolls.
 */
export const OwlBubble: React.FC<{ narration: string; className?: string }> = ({ narration, className = '' }) => (
  <div
    data-story-owl
    className={`flex items-start gap-3 sm:sticky z-30 -mx-2 px-2 py-1.5 bg-[#faf7f2]/95 rounded-xl ${className}`}
    style={{ top: 'calc(5rem + var(--dock-h, 0px) + 0.5rem)' }}
    aria-live="polite"
  >
    <span className="text-2xl shrink-0" aria-hidden>
      🦉
    </span>
    <p
      data-story-narration
      className="relative font-sans text-sm sm:text-base text-stone-800 bg-white border border-amber-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm leading-relaxed"
    >
      {narration}
    </p>
  </div>
);

/** Shared props every story scene receives. */
export interface StorySceneProps {
  step: import('../../types/algorithm').AlgorithmStep;
  /** Registry id, for scenes shared by several algorithms (e.g. 'kmp'). */
  algorithmId: string;
  /** How long this step stays on screen, in ms (drives animation pacing). */
  stepMs: number;
}
