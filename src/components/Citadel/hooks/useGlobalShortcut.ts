import { useEffect } from 'react';

interface UseGlobalShortcutProps {
  onOpen: () => void;
  onClose: () => void;
  isVisible: boolean;
  toggleKey: string;
}

export const useGlobalShortcut = ({ onOpen, onClose, isVisible, toggleKey }: UseGlobalShortcutProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key matches toggleKey and no input elements are focused
      if (
        event.key === toggleKey &&
        !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)
      ) {
        event.preventDefault();
        onOpen();
      }
      // Handle Escape key only when Citadel is visible
      if (event.key === 'Escape' && isVisible) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen, onClose, isVisible, toggleKey]);
};