import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { useSlideAnimation } from './hooks/useSlideAnimation';
import { useCitadelConfig } from './config/hooks';
import { useCitadelState } from './hooks/useCitadelState';
import { CommandInput } from './components/CommandInput';
import { CommandOutput } from './components/CommandOutput';
import { AvailableCommands } from './components/AvailableCommands';
import { CitadelConfig } from './config/types';
import { CitadelConfigProvider } from './config/CitadelConfigContext';
import { CommandRegistry } from './types/command-registry';
import { defaultConfig } from './config/defaults';
import { Logger, LogLevel } from './utils/logger';

import citadelStyles from '../../styles/citadel.css?raw';
import citadelModuleStyles from './Citadel.module.css?raw';
import mainStyles from '../../styles/styles.css?raw';
import tailwindStyles from '../../styles/tailwind.css?raw';

export const Citadel = ({ 
  config = defaultConfig, 
  commandRegistry = new CommandRegistry(),
  containerId = null
}) => {
  useEffect(() => {
    Logger.configure({
      level: config.logLevel || defaultConfig.logLevel || LogLevel.ERROR,
      prefix: '[Citadel]'
    });
    const citadelElement = new CitadelElement(commandRegistry, config);
    const container = containerId ? document.getElementById(containerId) : document.body;
    
    if (!container) {
      console.warn(`Container with id "${containerId}" not found, falling back to body`);
      document.body.appendChild(citadelElement);
    } else {
      container.appendChild(citadelElement);
    }

    return () => {
      citadelElement.parentElement?.removeChild(citadelElement);
    };
  }, [commandRegistry, containerId, config]);

  return null;
};

// Custom element to host the Citadel component inside shadow DOM. This is done
// to isolate the styling of the component from its container (and vice versa).
export class CitadelElement extends HTMLElement {
  private shadow: ShadowRoot;
  private root: ReturnType<typeof createRoot> | null = null;
  private commandRegistry?: CommandRegistry;
  
  private config?: CitadelConfig;

  constructor(commandRegistry: CommandRegistry, config?: CitadelConfig) {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.commandRegistry = commandRegistry;
    this.config = config;
  }

  connectedCallback() {
    // Create and inject styles
    try {
      const sheets = [citadelStyles, citadelModuleStyles, mainStyles, tailwindStyles].map(styles => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        return sheet;
      });
      
      this.shadow.adoptedStyleSheets = [...sheets];
    } catch {
      // Fallback for browsers that don't support constructable stylesheets
      const combinedStyles = [citadelStyles, citadelModuleStyles, mainStyles].join('\n');
      const styleElement = document.createElement('style');
      styleElement.textContent = combinedStyles;
      this.shadow.appendChild(styleElement);
    }

    // Create container for React component
    const container = document.createElement('div');
    container.id = 'citadel-root';
    this.shadow.appendChild(container);

    // Initialize React within shadow DOM
    this.root = createRoot(container);
    this.root.render(
      <CitadelConfigProvider config={this.config || defaultConfig} commandRegistry={this.commandRegistry}>
        <CitadelInner />
      </CitadelConfigProvider>
    );
  }
}

customElements.define('citadel-element', CitadelElement);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CitadelInnerProps {}

const CitadelInner: React.FC<CitadelInnerProps> = () => {
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
    showCitadelKey: config.showCitadelKey || '.'
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = containerRef.current.offsetHeight;
      document.documentElement.style.userSelect = 'none';
      document.documentElement.style.webkitUserSelect = 'none';
      // @ts-expect-error: Vendor prefixed property
      document.documentElement.style.mozUserSelect = 'none';
      // @ts-expect-error: Vendor prefixed property
      document.documentElement.style.msUserSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseMove, handleMouseUp]);

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
  }, [config.maxHeight, config.minHeight]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.documentElement.style.userSelect = '';
    document.documentElement.style.webkitUserSelect = '';
    // @ts-expect-error: Vendor prefixed property
    document.documentElement.style.mozUserSelect = '';
    // @ts-expect-error: Vendor prefixed property
    document.documentElement.style.msUserSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

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
      className={`container ${isVisible ? 'citadel_slideUp' : ''} ${isClosing ? 'citadel_slideDown' : ''}`}
      style={{
        ...height ? { height } : undefined,
        maxHeight: config.maxHeight
      }}
    >
      <div className="resizeHandle" onMouseDown={handleMouseDown} />
      <div className="innerContainer">
        <div className="flex-1 min-h-0 pt-3 px-4">
          <CommandOutput output={state.output} outputRef={outputRef} />
        </div>
        <div>
          <CommandInput state={state} actions={actions} />
          <AvailableCommands />
        </div>
      </div>
    </div>
  );
};

