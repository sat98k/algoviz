import React, { useCallback, useEffect, useId, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GlossaryKey, getGlossaryEntry } from '../../config/glossary';

// ─── Open/close state (pure, unit-tested) ───────────────────────────────────
// Three independent reasons keep the definition open: mouse hover (over the term
// or the popover), keyboard focus, and a click/tap that "pins" it open.

export interface TermPopoverState {
  hovered: boolean;
  focused: boolean;
  pinned: boolean;
}

export type TermPopoverAction =
  | { type: 'hoverStart' }
  | { type: 'hoverEnd' }
  | { type: 'keyboardFocus' }
  | { type: 'blur' }
  | { type: 'click' }
  | { type: 'dismiss' }; // Escape, outside click/tap

export const initialTermPopoverState: TermPopoverState = { hovered: false, focused: false, pinned: false };

export const termPopoverReducer = (state: TermPopoverState, action: TermPopoverAction): TermPopoverState => {
  switch (action.type) {
    case 'hoverStart':
      return { ...state, hovered: true };
    case 'hoverEnd':
      return { ...state, hovered: false };
    case 'keyboardFocus':
      return { ...state, focused: true };
    case 'blur':
      return { ...state, focused: false, pinned: false };
    case 'click':
      // Toggle: a pinned (or keyboard-opened) definition closes; otherwise pin it
      // open — including one currently shown by hover, so it stays after mouse-out.
      return state.pinned || (state.focused && !state.hovered) ? initialTermPopoverState : { ...state, pinned: true };
    case 'dismiss':
      return initialTermPopoverState;
    default:
      return state;
  }
};

export const isTermPopoverOpen = (s: TermPopoverState) => s.hovered || s.focused || s.pinned;

// ─── Component ──────────────────────────────────────────────────────────────

interface TermProps {
  /** Glossary key from src/config/glossary.ts. */
  termKey: GlossaryKey;
  /** Text shown inline; defaults to the glossary entry's name. */
  children?: React.ReactNode;
  className?: string;
}

const HOVER_CLOSE_DELAY_MS = 120;
const VIEWPORT_MARGIN = 12;

/**
 * Inline glossary term. Hover (mouse), keyboard focus, or click/tap shows a short
 * definition; Escape or clicking elsewhere dismisses it. The definition is
 * portalled to <body> with fixed positioning so it is never clipped by
 * scrolling or truncating containers.
 */
export const Term: React.FC<TermProps> = ({ termKey, children, className = '' }) => {
  const entry = getGlossaryEntry(termKey);
  const [state, dispatch] = useReducer(termPopoverReducer, initialTermPopoverState);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const popoverId = useId();
  const open = isTermPopoverOpen(state);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return; // touch/pen use tap instead
    cancelClose();
    dispatch({ type: 'hoverStart' });
  };

  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    cancelClose();
    // Short delay so the pointer can travel from the term into the popover.
    closeTimer.current = window.setTimeout(() => dispatch({ type: 'hoverEnd' }), HOVER_CLOSE_DELAY_MS);
  };

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const pop = popoverRef.current;
    if (!trigger || !pop) return;
    const t = trigger.getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    const below = t.bottom + 6;
    const top = below + p.height > window.innerHeight - VIEWPORT_MARGIN && t.top - 6 - p.height > VIEWPORT_MARGIN
      ? t.top - 6 - p.height
      : below;
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, t.left + t.width / 2 - p.width / 2),
      window.innerWidth - p.width - VIEWPORT_MARGIN
    );
    setPosition({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (open) reposition();
    else setPosition(null);
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'dismiss' });
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      dispatch({ type: 'dismiss' });
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, reposition]);

  useEffect(() => cancelClose, []);

  if (!entry) {
    console.warn(`Unknown glossary term "${termKey}"`);
    return <>{children}</>;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-glossary-term={termKey}
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        onClick={() => dispatch({ type: 'click' })}
        onFocus={(e) => {
          // Mouse/touch focus is handled by click; only keyboard focus opens here.
          if (e.currentTarget.matches(':focus-visible')) dispatch({ type: 'keyboardFocus' });
        }}
        onBlur={() => dispatch({ type: 'blur' })}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        className={`inline p-0 m-0 bg-transparent border-0 font-[inherit] text-[length:inherit] leading-[inherit] text-inherit text-left cursor-help underline decoration-dotted decoration-amber/70 underline-offset-[3px] hover:decoration-amber hover:text-amber-glow focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber focus-visible:outline-offset-2 ${
          open ? 'text-amber-glow decoration-amber' : ''
        } ${className}`}
      >
        {children ?? entry.term}
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="tooltip"
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            style={{
              position: 'fixed',
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
            className="z-[100] w-max max-w-[min(20rem,calc(100vw-24px))] p-3 bg-obsidian-950 border border-amber/40 shadow-lg shadow-black/40 text-left normal-case tracking-normal"
          >
            <span className="block font-mono text-[10px] uppercase tracking-widest text-amber font-bold mb-1">
              {entry.term}
            </span>
            <span className="block font-sans text-xs leading-relaxed text-chalk-200">{entry.definition}</span>
          </div>,
          document.body
        )}
    </>
  );
};
