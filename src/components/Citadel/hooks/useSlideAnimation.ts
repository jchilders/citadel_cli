import { useEffect } from 'react';

interface SlideAnimationOptions {
  isVisible: boolean;
  isClosing: boolean;
  onAnimationComplete?: () => void;
}

export const useSlideAnimation = (options: SlideAnimationOptions) => {
  const { isClosing, onAnimationComplete } = options;

  useEffect(() => {
    if (onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 200); // Match animation duration in CSS
      return () => clearTimeout(timer);
    }
  }, [isClosing, onAnimationComplete]);

  return {
    style: {},
    animationClass: ''
  };
};
