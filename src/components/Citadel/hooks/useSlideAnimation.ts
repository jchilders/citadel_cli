import { useMemo } from 'react';
import styles from '../Citadel.module.css';

export const useSlideAnimation = (isOpen: boolean, isClosing: boolean) => {
  const animationClass = useMemo(() => {
    if (!isOpen) return '';
    return isClosing ? styles.slideDown : styles.slideUp;
  }, [isOpen, isClosing]);

  return animationClass;
};