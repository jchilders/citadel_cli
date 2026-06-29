import { RefObject, useEffect } from 'react';

interface UseInlineFocusShortcutProps {
  /** The inline container hosting the console input. */
  containerRef: RefObject<HTMLElement>;
  /** The key that focuses the console (same key panel mode uses to open). */
  showCitadelKey: string;
  enabled?: boolean;
}

/**
 * In inline mode there is no panel to open, so the activation key instead moves
 * focus into the always-visible console — the inline analogue of panel mode's
 * "press the key to start typing". It stays out of the way when the console is
 * already focused (so the key can be typed as an argument) or when another field
 * on the host page has focus.
 */
export const useInlineFocusShortcut = ({
  containerRef,
  showCitadelKey,
  enabled = true
}: UseInlineFocusShortcutProps) => {
  useEffect(() => {
    if (!enabled || !showCitadelKey) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== showCitadelKey || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const container = containerRef.current;
      const input = container?.querySelector<HTMLInputElement>('input.citadel-input-field');
      if (!input) return;

      // Already typing in the console — let the key through (e.g. "." in an
      // argument value). Works across the shadow boundary via getRootNode().
      const root = input.getRootNode() as Document | ShadowRoot;
      if (root.activeElement === input) return;

      // Don't hijack the key while another input/textarea on the page has focus.
      const inOtherField = event
        .composedPath()
        .some(
          (el) =>
            el instanceof HTMLElement &&
            el !== input &&
            (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
        );
      if (inOtherField) return;

      event.preventDefault();
      input.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, showCitadelKey, enabled]);
};
