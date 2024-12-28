import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useSlideAnimation } from './hooks/useSlideAnimation';
import { useCitadelService } from './hooks/useCitadelService';
import styles from './Citadel.module.css';
import { CommandInput } from './components/CommandInput';
import { CommandOutput } from './components/CommandOutput';
import { AvailableCommands } from './components/AvailableCommands';
import { CitadelConfig } from './config/types';
import { defaultConfig } from './config/defaults';
import { CitadelConfigProvider, useCitadelConfig } from './config/CitadelConfigContext';
import { CitadelService } from './services/CitadelService';
import { createCitadelService } from './services/createCitadelService';

export interface CitadelProps {
  config?: CitadelConfig;
  commands?: Record<string, any>;
  service?: CitadelService;
}

const CitadelInner: React.FC<{ service: CitadelService }> = ({ service }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const config = useCitadelConfig();
  
  const {
    state,
    actions,
    availableCommands,
    commandTrie,
  } = useCitadelService(service);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = containerRef.current.offsetHeight;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const delta = startYRef.current - e.clientY;
    // Convert maxHeight to pixels for calculation
    const maxHeightValue = config.maxHeight?.endsWith('vh') 
      ? (window.innerHeight * parseInt(config.maxHeight, 10) / 100)
      : parseInt(config.maxHeight || '80vh', 10);
    
    const newHeight = Math.min(
      Math.max(startHeightRef.current + delta, 200),
      maxHeightValue
    );
    
    setHeight(newHeight);
  }, [config.maxHeight]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Toggle visibility with key from config or '.'
  useGlobalShortcut({
    onOpen: () => setIsVisible(true),
    onClose: () => setIsClosing(true),
    isVisible,
    showCitadelKey: config.showCitadelKey || '.'
  });

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    if (isClosing) {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isClosing]);

  // Show/hide animation
  useSlideAnimation({
    isVisible,
    isClosing,
    onAnimationComplete: handleAnimationComplete
  });

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${isVisible ? styles.slideUp : ''} ${isClosing ? styles.slideDown : ''}`}
      style={{
        ...height ? { height: `${height}px` } : undefined,
        maxHeight: config.maxHeight
      }}
      id="citadel-root"
    >
      <div className={styles.resizeHandle} onMouseDown={handleMouseDown} />
      <div className={styles.innerContainer}>
        <div className="flex-1 min-h-0 pt-3 px-4">
          <CommandOutput output={state.output} outputRef={outputRef} />
        </div>
        <div className="flex-shrink-0">
          <CommandInput
            state={state}
            actions={actions}
            availableCommands={availableCommands}
            commandTrie={commandTrie}
          />
          <AvailableCommands
            state={state}
            availableCommands={availableCommands}
          />
        </div>
      </div>
    </div>
  );
};

export const Citadel: React.FC<CitadelProps> = ({ 
  config = defaultConfig, 
  commands,
  service: providedService
}) => {
  // Create service if not provided
  const service = providedService || createCitadelService({ commands });

  return (
    <CitadelConfigProvider 
      config={config}
      commands={commands}
    >
      <CitadelInner service={service} />
    </CitadelConfigProvider>
  );
};
