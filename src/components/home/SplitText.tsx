import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface SplitTextProps {
  /** One entry per line; lines are stacked as blocks. */
  lines: string[];
  /** Animate each letter (short headlines only) or each word. */
  by: 'char' | 'word';
  /** Play on mount, or the first time the text scrolls into view. */
  play: 'mount' | 'view';
  delay?: number;
}

/**
 * Text that rises into place a letter or a word at a time. Words never break across lines
 * mid-reveal.
 * Under reduced motion the text is simply there.
 */
export const SplitText: React.FC<SplitTextProps> = ({ lines, by, play, delay = 0 }) => {
  const reduce = useReducedMotion();
  const text = lines.join(' ');
  if (reduce) {
    return (
      <>
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </>
    );
  }

  const step = by === 'char' ? 0.035 : 0.07;
  const parent: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: step, delayChildren: delay } },
  };
  const piece: Variants = {
    hidden: { opacity: 0, y: by === 'char' ? '0.45em' : '0.35em', rotate: by === 'char' ? 6 : 0 },
    shown: { opacity: 1, y: 0, rotate: 0, transition: { duration: by === 'char' ? 0.6 : 0.55, ease: EASE_OUT } },
  };
  const trigger =
    play === 'mount'
      ? { initial: 'hidden', animate: 'shown' }
      : { initial: 'hidden', whileInView: 'shown', viewport: { once: true, margin: '-10% 0px' } };

  // Letters in separate spans read badly in some screen readers, so a letter reveal keeps the
  // whole text in a hidden copy. Words read fine as they are, so a word reveal stays the only copy
  // (and the heading's text is not doubled for copy-paste).
  const byChar = by === 'char';
  return (
    <>
      {byChar && <span className="sr-only">{text}</span>}
      <motion.span aria-hidden={byChar || undefined} className="hc-split" variants={parent} {...trigger}>
        {lines.map((line, li) => (
          <span key={li} className="hc-split-line">
            {li > 0 && !byChar && <span className="sr-only"> </span>}
            {line.split(' ').map((word, wi, words) => (
              <React.Fragment key={wi}>
                <span className="hc-split-word">
                  {by === 'char' ? (
                    [...word].map((ch, ci) => (
                      <motion.span key={ci} className="hc-split-piece" variants={piece}>
                        {ch}
                      </motion.span>
                    ))
                  ) : (
                    <motion.span className="hc-split-piece" variants={piece}>
                      {word}
                    </motion.span>
                  )}
                </span>
                {wi < words.length - 1 && ' '}
              </React.Fragment>
            ))}
          </span>
        ))}
      </motion.span>
    </>
  );
};
