import React from 'react';
import { Minus, Plus, Volume2, VolumeX } from 'lucide-react';
import { OWL_SPEED, formatSpeed, nextSpeed, playChirp, setOwlSound, setOwlSpeed, useOwlPrefs } from './owlVoice';

const speedButton = 'c-pill';

/** − Slower · 1× · Faster +, shared by every owl (0.25 steps, 0.25× to 3×). */
export const OwlSpeedControl: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { speed } = useOwlPrefs();
  return (
    <div role="group" aria-label="Reading speed" className="c-group" data-owl-speed>
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
      <span className="c-group-value" aria-live="polite" data-owl-speed-value>
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
      className="c-pill"
    >
      {sound ? <Volume2 className="w-3.5 h-3.5" aria-hidden /> : <VolumeX className="w-3.5 h-3.5" aria-hidden />}
      {compact ? <span className="sr-only">Chirps</span> : 'Chirps'}
    </button>
  );
};
