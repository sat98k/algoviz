import React from 'react';
import { Minus, Plus, Volume2, VolumeX } from 'lucide-react';
import { OWL_SPEED, formatSpeed, nextSpeed, playChirp, setOwlSound, setOwlSpeed, useOwlPrefs } from './owlVoice';

const speedButton =
  'flex items-center gap-1 px-2 py-1 font-sans text-xs font-semibold text-chalk-300 hover:text-chalk-100 hover:bg-obsidian-850 disabled:opacity-40 disabled:hover:bg-transparent';

/** − Slower · 1× · Faster +, shared by every owl (0.25 steps, 0.25× to 3×). */
export const OwlSpeedControl: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { speed } = useOwlPrefs();
  return (
    <div role="group" aria-label="Reading speed" className="flex items-center border border-hairline bg-obsidian-950" data-owl-speed>
      <button
        type="button"
        onClick={() => setOwlSpeed(nextSpeed(speed, -1))}
        disabled={speed <= OWL_SPEED.min}
        data-owl-slower
        title="Slower (−0.25×)"
        className={speedButton}
      >
        <Minus className="w-3.5 h-3.5" aria-hidden />
        {!compact && 'Slower'}
        {compact && <span className="sr-only">Slower</span>}
      </button>
      <span className="px-2 py-1 min-w-[3.25rem] text-center font-mono text-xs font-bold text-amber tabular-nums border-x border-hairline" aria-live="polite" data-owl-speed-value>
        {formatSpeed(speed)}
      </span>
      <button
        type="button"
        onClick={() => setOwlSpeed(nextSpeed(speed, 1))}
        disabled={speed >= OWL_SPEED.max}
        data-owl-faster
        title="Faster (+0.25×)"
        className={speedButton}
      >
        {!compact && 'Faster'}
        {compact && <span className="sr-only">Faster</span>}
        <Plus className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  );
};

/** Chirp sounds on / off, shared by every owl. */
export const OwlSoundToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { sound } = useOwlPrefs();
  return (
    <button
      type="button"
      onClick={() => {
        setOwlSound(!sound);
        if (!sound) playChirp(true);
      }}
      data-owl-sound
      aria-pressed={sound}
      title={sound ? 'Chirp sounds on' : 'Chirp sounds off'}
      className={`flex items-center gap-1.5 px-2.5 py-1 font-sans text-xs font-semibold border bg-obsidian-950 transition-colors ${
        sound ? 'border-amber/60 text-amber' : 'border-hairline text-chalk-400 hover:text-chalk-200'
      }`}
    >
      {sound ? <Volume2 className="w-3.5 h-3.5" aria-hidden /> : <VolumeX className="w-3.5 h-3.5" aria-hidden />}
      {compact ? <span className="sr-only">Chirps</span> : 'Chirps'}
    </button>
  );
};
