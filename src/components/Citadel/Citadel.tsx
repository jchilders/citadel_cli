import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useSlideAnimation } from './hooks/useSlideAnimation';
import { useCitadelConfig } from './config/CitadelConfigContext';
import { useCitadelState } from './hooks/useCitadelState';
import { CommandInput } from './components/CommandInput';
import { CommandOutput } from './components/CommandOutput';
import { AvailableCommands } from './components/AvailableCommands';
import { CitadelConfig } from './config/types';
import { CitadelConfigProvider } from './config/CitadelConfigContext';
import { defaultConfig } from './config/defaults';

import styles from './Citadel.module.css';

export interface CitadelProps {
  config?: CitadelConfig;
  commands?: Record<string, any>;
  containerId?: string;
}

const CitadelInner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const config = useCitadelConfig();
  const { state, actions, getAvailableCommands } = useCitadelState();

  // Shadow DOM management
  useEffect(() => {
    const containerId = 'citadel-shadow-root';
    let hostElement = document.getElementById(containerId);

    if (!hostElement) {
      hostElement = document.createElement('div');
      hostElement.id = containerId;
      document.body.appendChild(hostElement);
    }

    // Create Shadow DOM if it doesn't exist
    if (!hostElement.shadowRoot) {
      shadowRootRef.current = hostElement.attachShadow({ mode: 'open' });
      
      // Add styles to Shadow DOM
      const styleSheet = new CSSStyleSheet();
      styleSheet.replaceSync(`
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 9999;
          pointer-events: none;
        }
        .citadel-container {
          pointer-events: auto;
        }
      `);
      shadowRootRef.current.adoptedStyleSheets = [styleSheet];
      
      // Create root element for React
      const rootElement = document.createElement('div');
      shadowRootRef.current.appendChild(rootElement);
      
      // Initialize React root
      const root = createRoot(rootElement);
      root.render(
        <div className="citadel-container">
          {/* Your existing content will be rendered here */}
        </div>
      );
    }

    return () => {
      if (hostElement && !document.getElementById(containerId)) {
        document.body.removeChild(hostElement);
      }
    };
  }, []);

  // Rest of your component logic...
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

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useGlobalShortcut({
    onOpen: () => setIsVisible(true),
    onClose: () => setIsClosing(true),
    isVisible,
    showCitadelKey: config.showCitadelKey || '.'
  });

  const handleAnimationComplete = useCallback(() => {
    if (isClosing) {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isClosing]);

  useSlideAnimation({
    isVisible,
    isClosing,
    onAnimationComplete: handleAnimationComplete
  });

  if (!isVisible || !shadowRootRef.current) return null;

  const content = (
    <div 
      ref={containerRef}
      className={`${styles.container} ${isVisible ? styles.slideUp : ''} ${isClosing ? styles.slideDown : ''}`}
      style={{
        ...height ? { height: `${height}px` } : undefined,
        maxHeight: config.maxHeight
      }}
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
            availableCommands={getAvailableCommands()}
          />
          <AvailableCommands
            state={state}
            availableCommands={getAvailableCommands()}
          />
        </div>
      </div>
    </div>
  );

  return content;
};

export const Citadel: React.FC<CitadelProps> = ({ 
  config = defaultConfig, 
  commands 
}) => {
  return (
    <CitadelConfigProvider config={config} commands={commands}>
      <CitadelInner />
    </CitadelConfigProvider>
  );
};
