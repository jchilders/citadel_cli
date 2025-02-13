import { useEffect } from 'react';

interface UseGlobalShortcutProps {
  onOpen: () => void;
  onClose: () => void;
  isVisible: boolean;
  showCitadelKey: string;
}

export const useGlobalShortcut = ({ onOpen, onClose, isVisible, showCitadelKey }: UseGlobalShortcutProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key matches showCitadelKey and no input elements are focused
      const targetTag = (event.target as HTMLElement)?.tagName?.toLowerCase() || '';
      const isInputElement = ['input', 'textarea'].includes(targetTag);
      
      if (!isVisible && event.key === showCitadelKey && !isInputElement) {
        console.log('Citadel shortcut triggered:', {
          key: event.key,
          target: targetTag,
          isVisible
        });
        event.preventDefault();
        onOpen();
      }

      // Handle escape key
      if (isVisible && event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen, onClose, isVisible, showCitadelKey]);
};