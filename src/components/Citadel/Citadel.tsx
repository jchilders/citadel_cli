import React, { useEffect, useMemo, useRef } from 'react';
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

interface CitadelProps {
  config?: CitadelConfig;
  commandRegistry?: CommandRegistry;
  containerId?: string | null;
}

/**
 * Top-level entry point for embedding Citadel.
 *
 * @param config Optional `CitadelConfig` describing runtime behaviour (keyboard shortcuts, logging, sizing)
 *               with `defaultConfig` used when omitted.
 * @param commandRegistry Optional pre-populated registry. A fresh instance is created by default so consumers
 *                        can register commands before mounting.
 * @param containerId Optional DOM id where the custom element should be appended. When not supplied the
 *                    component appends to `document.body` in panel mode and to an internal host in inline mode.
 */
export const Citadel: React.FC<CitadelProps> = ({
  config = defaultConfig,
  commandRegistry,
  containerId = null
}) => {
  const fallbackRegistryRef = useRef<CommandRegistry>(new CommandRegistry());
  const resolvedRegistry = commandRegistry ?? fallbackRegistryRef.current;

  // Used only for inline mode (no containerId) so the custom element can attach to a DOM node
  // provisioned by React instead of falling back to document.body.
  const inlineHostRef = useRef<HTMLDivElement | null>(null);
  const inlineHostStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
  const displayMode = config.displayMode ?? defaultConfig.displayMode ?? 'panel';

  const elementRef = useRef<CitadelElement | null>(null);
  // Latest props for the mount effect, so host changes don't have to wait for
  // (or be triggered by) config/registry identity changes.
  const configRef = useRef(config);
  configRef.current = config;
  const registryRef = useRef(resolvedRegistry);
  registryRef.current = resolvedRegistry;

  // Create the custom element only when its host changes. Config and registry
  // updates are applied in place (below) so panel visibility, output history,
  // and other internal state survive reconfiguration.
  useEffect(() => {
    const citadelElement = new CitadelElement(registryRef.current, configRef.current);
    const isInlineWithoutContainer = displayMode === 'inline' && !containerId;
    const container = isInlineWithoutContainer
      ? inlineHostRef.current
      : containerId
        ? document.getElementById(containerId)
        : document.body;

    if (!container) {
      if (isInlineWithoutContainer) {
        console.warn('[Citadel] No host available for inline mode; skipping mount.');
        return;
      }
      console.warn(`Container with id "${containerId}" not found, falling back to body`);
      document.body.appendChild(citadelElement);
    } else {
      container.appendChild(citadelElement);
    }

    elementRef.current = citadelElement;
    return () => {
      elementRef.current = null;
      citadelElement.parentElement?.removeChild(citadelElement);
    };
  }, [containerId, displayMode]);

  useEffect(() => {
    Logger.configure({
      level: config.logLevel || defaultConfig.logLevel || LogLevel.ERROR,
      prefix: '[Citadel]'
    });
    elementRef.current?.update(resolvedRegistry, config);
  }, [resolvedRegistry, config]);

  if (displayMode === 'inline' && !containerId) {
    return <div ref={inlineHostRef} style={inlineHostStyle} />;
  }

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
      const sheets = [citadelStyles].map(styles => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        return sheet;
      });
      
      this.shadow.adoptedStyleSheets = [...sheets];
    } catch {
      // Fallback for browsers that don't support constructable stylesheets
      const combinedStyles = [citadelStyles].join('\n');
      const styleElement = document.createElement('style');
      styleElement.textContent = combinedStyles;
      this.shadow.appendChild(styleElement);
    }

    // Create container for React component
    const container = document.createElement('div');
    container.id = 'citadel-root';
    container.style.width = '100%';
    container.style.height = '100%';
    this.shadow.appendChild(container);

    // Initialize React within shadow DOM
    this.root = createRoot(container);
    this.renderApp();
  }

  /**
   * Applies a new config and/or registry by re-rendering the existing React
   * root, preserving internal state (panel visibility, output history) that a
   * full element remount would reset.
   */
  update(commandRegistry: CommandRegistry, config?: CitadelConfig) {
    this.commandRegistry = commandRegistry;
    this.config = config;
    this.setAttribute('data-display-mode', this.config?.displayMode ?? 'panel');
    this.renderApp();
  }

  private renderApp() {
    this.root?.render(
      <CitadelConfigProvider config={this.config || defaultConfig} commandRegistry={this.commandRegistry}>
        <CitadelRoot />
      </CitadelConfigProvider>
    );
  }

  disconnectedCallback() {
    const root = this.root;
    this.root = null;

    if (!root) {
      this.shadow.replaceChildren();
      return;
    }

    queueMicrotask(() => {
      root.unmount();
      this.shadow.replaceChildren();
    });
  }
}

if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('citadel-element')) {
  window.customElements.define('citadel-element', CitadelElement);
}

const CitadelRoot: React.FC = () => {
  const config = useCitadelConfig();
  const mode = config.displayMode ?? 'panel';

  return mode === 'inline'
    ? <InlineController />
    : <PanelController />;
};
