import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useCitadelConfig } from './config/hooks';
import { CitadelConfig } from './config/types';
import { CitadelConfigProvider } from './config/CitadelConfigContext';
import { CommandRegistry } from './types/command-registry';
import { defaultConfig } from './config/defaults';
import { Logger, LogLevel } from './utils/logger';
import { PanelController } from './controllers/PanelController';
import { InlineController } from './controllers/InlineController';

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
    const displayMode = this.config?.displayMode ?? 'panel';
    this.setAttribute('data-display-mode', displayMode);
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
        <CitadelRoot />
      </CitadelConfigProvider>
    );
  }
}

customElements.define('citadel-element', CitadelElement);

const CitadelRoot: React.FC = () => {
  const config = useCitadelConfig();
  const mode = config.displayMode ?? 'panel';

  return mode === 'inline'
    ? <InlineController />
    : <PanelController />;
};
