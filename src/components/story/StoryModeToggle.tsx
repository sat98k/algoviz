import React from 'react';
import { BarChart3, Clapperboard } from 'lucide-react';

export type StoryViewMode = 'technical' | 'story';

interface StoryModeToggleProps {
  mode: StoryViewMode;
  onChange: (mode: StoryViewMode) => void;
  /** What the animation shows, e.g. "Water pipes & droplet scouts". */
  storyHint: string;
  /** Slimmer bar for the fit-to-screen player. */
  compact?: boolean;
}

/** The Technical View / Animation Mode switch shown above any visualizer that has a story scene. */
export const StoryModeToggle: React.FC<StoryModeToggleProps> = ({ mode, onChange, storyHint, compact = false }) => {
  const button = (value: StoryViewMode, Icon: typeof BarChart3, label: string) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      data-view-mode={value}
      role="radio"
      aria-checked={mode === value}
      className="c-pill"
    >
      <Icon className="w-4 h-4" aria-hidden /> {label}
    </button>
  );

  return (
    <div data-story-toggle className={`ss-toggle ${compact ? 'ss-toggle-fit' : ''}`}>
      <div role="radiogroup" aria-label="View mode" className="c-group">
        {button('technical', BarChart3, 'Technical View')}
        {button('story', Clapperboard, 'Animation Mode')}
      </div>
      <span className="ss-toggle-hint">{mode === 'story' ? storyHint : 'Switch to Animation Mode for a beginner-friendly story'}</span>
    </div>
  );
};
