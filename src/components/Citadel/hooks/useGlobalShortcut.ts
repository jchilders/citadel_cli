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
      if (
        !isVisible &&
        event.key === showCitadelKey &&
        !['input', 'textarea'].includes((event.target as HTMLElement)?.tagName?.toLowerCase() || '')
      ) {
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