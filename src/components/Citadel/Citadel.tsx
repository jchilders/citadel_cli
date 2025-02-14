import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useSlideAnimation } from './hooks/useSlideAnimation';
import { useCitadelConfig } from './config/CitadelConfigContext';
import { useCitadelState } from './hooks/useCitadelState';
import { CommandInput } from './components/CommandInput';
import { CommandOutput } from './components/CommandOutput';
import { AvailableCommands } from './components/AvailableCommands';
import { CitadelConfigProvider } from './config/CitadelConfigContext';
import { CommandRegistry } from './types/command-registry';
import { defaultConfig } from './config/defaults';
import { Logger, LogLevel } from './utils/logger';

// CSS is bundled during build

export interface CitadelProps {
  config?: typeof defaultConfig;
  commandRegistry?: CommandRegistry;
}

export const Citadel: React.FC<CitadelProps> = ({ 
  config = defaultConfig, 
  commandRegistry = new CommandRegistry()
}) => {
  useEffect(() => {
    Logger.configure({
      level: config.logLevel || defaultConfig.logLevel || LogLevel.ERROR,
      prefix: '[Citadel]'
    });
  }, []);

  return (
    <CitadelConfigProvider config={config} commandRegistry={commandRegistry}>
      <CitadelContent />
    </CitadelConfigProvider>
  );
};

const CitadelContent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const config = useCitadelConfig();
  const [height, setHeight] = useState<string | null>(() => {
    return config.initialHeight || null;
  });
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const { state, actions } = useCitadelState();

  // Set the key used to show Citadel
  useGlobalShortcut({
    onOpen: () => setIsVisible(true),
    onClose: () => setIsClosing(true),
    isVisible,
    showCitadelKey: config.showCitadelKey ?? '.'
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = containerRef.current.offsetHeight;
      document.documentElement.style.userSelect = 'none';
      // @ts-ignore: Vendor prefixed property
      document.documentElement.style.mozUserSelect = 'none';
      // @ts-ignore: Vendor prefixed property
      document.documentElement.style.msUserSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const delta = e.clientY - startYRef.current;
    
    const maxHeightValue = config.maxHeight?.endsWith('vh') 
      ? (window.innerHeight * parseInt(config.maxHeight, 10) / 100)
      : parseInt(config.maxHeight || '80vh', 10);

    const newHeight = Math.min(
      Math.max(startHeightRef.current - delta, parseInt(config.minHeight || '200', 10)),
      maxHeightValue
    );
    
    if (containerRef.current) {
      containerRef.current.style.height = `${newHeight}px`;
      containerRef.current.style.bottom = '0';
      setHeight(`${newHeight}px`);
    }
  }, [config.maxHeight]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.documentElement.style.userSelect = '';
    // @ts-ignore: Vendor prefixed property
    document.documentElement.style.mozUserSelect = '';
    // @ts-ignore: Vendor prefixed property
    document.documentElement.style.msUserSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className={`citadel-container ${isVisible ? 'slide-up' : ''} ${isClosing ? 'slide-down' : ''}`}
      style={{
        ...height ? { height } : undefined,
        maxHeight: config.maxHeight
      }}
    >
      <div className="citadel-resize-handle" onMouseDown={handleMouseDown} />
      <div className="citadel-inner">
        <div className="citadel-flex-1 citadel-min-h-0 citadel-overflow-y-auto citadel-pt-3 citadel-px-4">
          <CommandOutput output={state.output} outputRef={outputRef} />
        </div>
        <div className="citadel-flex-shrink-0">
          <CommandInput state={state} actions={actions} />
          <AvailableCommands />
        </div>
      </div>
    </div>
  );
};

