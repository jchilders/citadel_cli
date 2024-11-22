import { useEffect } from 'react';

interface UseGlobalShortcutProps {
  onOpen: () => void;
}

export const useGlobalShortcut = ({ onOpen }: UseGlobalShortcutProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key is '.' and no input elements are focused
      if (
        event.key === '.' &&
        !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)
      ) {
        event.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
};