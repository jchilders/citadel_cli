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

import citadelStyles from '../../styles/citadel.css?raw';
import citadelModuleStyles from './Citadel.module.css?raw';
import mainStyles from '../../styles/styles.css?raw';
import tailwindStyles from '../../styles/tailwind.css?raw';

// Count and log the number of CSS classes in each stylesheet
console.log('Citadel styles classes:', citadelStyles.match(/[.:][a-zA-Z][a-zA-Z0-9_-]*\s*{/g)?.length || 0);
console.log('Citadel module styles classes:', citadelModuleStyles.match(/[.:][a-zA-Z][a-zA-Z0-9_-]*\s*{/g)?.length || 0);
console.log('Main styles classes:', mainStyles.match(/[.:][a-zA-Z][a-zA-Z0-9_-]*\s*{/g)?.length || 0);
console.log('Tailwind styles classes:', tailwindStyles.match(/[.:][a-zA-Z][a-zA-Z0-9_-]*\s*{/g)?.length || 0);

export interface CitadelProps {
  config?: CitadelConfig;
  commands?: Record<string, any>;
  containerId?: string;
}

// Create custom element that will host our React app in Shadow DOM
class CitadelElement extends HTMLElement {
  private shadow: ShadowRoot;
  private root: ReturnType<typeof createRoot> | null = null;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
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
    } catch (e) {
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
    this.root.render(<CitadelInner />);
  }

  // disconnectedCallback() {
  //   if (this.root) {
  //     this.root.unmount();
  //     this.root = null;
  //   }
  // }
}

customElements.define('citadel-element', CitadelElement);

const CitadelInner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const config = useCitadelConfig();
  const { state, actions, getAvailableCommands } = useCitadelState();

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

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className={`container ${isVisible ? 'citadel_slideUp' : ''} ${isClosing ? 'citadel_slideDown' : ''}`}
      style={{
        ...height ? { height: `${height}px` } : undefined,
        maxHeight: config.maxHeight
      }}
    >
      <div className="resizeHandle" onMouseDown={handleMouseDown} />
      <div className="innerContainer">
        <div className="flex-1 min-h-0 pt-3 px-4">
          <CommandOutput output={state.output} outputRef={outputRef} />
        </div>
        <div>
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
};

export const Citadel: React.FC<CitadelProps> = ({ 
  config = defaultConfig, 
  commands 
}) => {
  useEffect(() => {
    const citadelElement = document.createElement('citadel-element');
    document.body.appendChild(citadelElement);

    return () => {
      document.body.removeChild(citadelElement);
    };
  }, []);

  return (
    <CitadelConfigProvider config={config} commands={commands}>
      <div id="citadel-wrapper" />
    </CitadelConfigProvider>
  );
};
