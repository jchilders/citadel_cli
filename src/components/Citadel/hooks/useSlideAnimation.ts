import { useMemo, useEffect } from 'react';
import styles from '../Citadel.module.css';

interface SlideAnimationOptions {
  isVisible: boolean;
  isClosing: boolean;
  onAnimationComplete?: () => void;
}

export const useSlideAnimation = (options: SlideAnimationOptions) => {
  const { isVisible, isClosing, onAnimationComplete } = options;

  const animationClass = useMemo(() => {
    if (!isVisible) return '';
    return isClosing ? styles.slideDown : styles.slideUp;
  }, [isVisible, isClosing]);

  useEffect(() => {
    if (onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 200); // Match animation duration in CSS
      return () => clearTimeout(timer);
    }
  }, [isClosing, onAnimationComplete]);

  const style = useMemo(() => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible 
      ? 'translateY(0)' 
      : isClosing 
        ? 'translateY(100%)' 
        : 'translateY(-100%)',
    transition: 'opacity 200ms ease-in-out, transform 200ms ease-in-out'
  }), [isVisible, isClosing]);

  return {
    style,
    animationClass
  };
};