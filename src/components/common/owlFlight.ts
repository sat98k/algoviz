import { useSyncExternalStore } from 'react';

/**
 * The owl's flight from the explanation page to the player: "Start the animation" records where
 * the owl is on screen; the player flies an owl from there to its own owl's spot. While it is in
 * the air, the player's owl is hidden and does not start reading yet.
 */
let pendingFrom: { x: number; y: number; size: number; at: number } | null = null;
let flying = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Call just before switching to the player, with the owl element on the explanation page. */
export const prepareOwlFlight = (from: Element | null) => {
  if (!from) return;
  const r = from.getBoundingClientRect();
  pendingFrom = { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.height, at: Date.now() };
};

/** The recorded start point, if "Start the animation" was just pressed. */
export const peekOwlFlight = () => (pendingFrom && Date.now() - pendingFrom.at < 4000 ? pendingFrom : null);

/** The flight is over (landed, or nowhere to land). */
export const clearOwlFlight = () => {
  pendingFrom = null;
};

export const setOwlFlying = (value: boolean) => {
  if (flying === value) return;
  flying = value;
  emit();
};

/** Whether the owl is in the air right now. */
export const useOwlFlying = () =>
  useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => flying,
    () => false
  );
