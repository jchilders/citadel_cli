import { useEffect, useMemo } from 'react';

interface SlideAnimationOptions {
  isVisible: boolean;
  isClosing: boolean;
  onAnimationComplete?: () => void;
}

export const PANEL_CLOSE_DURATION_MS = 200;

export const useSlideAnimation = (options: SlideAnimationOptions) => {
  const { isVisible, isClosing, onAnimationComplete } = options;

  const animationClass = useMemo(() => {
    if (!isVisible) return '';
    return isClosing ? 'citadel_slideDown' : 'citadel_slideUp';
  }, [isVisible, isClosing]);

  useEffect(() => {
    if (!isClosing || !onAnimationComplete) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onAnimationComplete();
      return;
    }

    const timer = setTimeout(() => {
      onAnimationComplete();
    }, PANEL_CLOSE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isClosing, onAnimationComplete]);

  return {
    animationClass
  };
};
