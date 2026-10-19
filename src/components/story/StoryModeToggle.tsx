import React from 'react';

export type StoryViewMode = 'technical' | 'story';

interface StoryModeToggleProps {
  mode: StoryViewMode;
  onChange: (mode: StoryViewMode) => void;
  /** What the animation shows, e.g. "Water pipes & droplet scouts". */
  storyHint: string;
}

/** The 🎬 / 📊 switch shown above any visualizer that has a story scene. */
export const StoryModeToggle: React.FC<StoryModeToggleProps> = ({ mode, onChange, storyHint }) => {
  const button = (value: StoryViewMode, icon: string, label: string, activeClass: string) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      data-view-mode={value}
      role="radio"
      aria-checked={mode === value}
      className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-all flex items-center gap-1.5 ${
        mode === value ? activeClass : 'text-chalk-400 hover:text-chalk-200'
      }`}
    >
      <span aria-hidden>{icon}</span> {label}
    </button>
  );

  return (
    <div
      data-story-toggle
      className="flex flex-wrap items-center justify-between w-full px-3 py-2 bg-obsidian-950 border border-hairline gap-3"
    >
      <div className="flex items-center gap-3">
        <span className="font-sans text-xs text-chalk-400 font-semibold uppercase tracking-wider">View Mode:</span>
        <div role="radiogroup" aria-label="View mode" className="inline-flex p-1 bg-obsidian-900 border border-hairline rounded-lg shadow-sm">
          {button('technical', '📊', 'Technical View', 'bg-obsidian-800 text-chalk-100 border border-hairline font-bold')}
          {button('story', '🎬', 'Animation Mode', 'bg-amber text-obsidian-950 shadow-sm font-bold')}
        </div>
      </div>
      <span className="text-xs font-sans text-chalk-400">
        {mode === 'story' ? storyHint : 'Switch to Animation Mode for a beginner-friendly story'}
      </span>
    </div>
  );
};
