import React from 'react';
import ReactDOM from 'react-dom/client';
import { Citadel } from '../../src';
import { CitadelConfig } from '../../src/components/Citadel/config/types';
import { defaultConfig } from '../../src/components/Citadel/config/defaults';
import { createBasicCommandRegistry } from '../../src/examples/basicCommands';

type HarnessProps = {
  config?: Partial<CitadelConfig>;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Harness root element not found');
}

const props = window.__CITADEL_PROPS__ ?? ({} as HarnessProps);
delete window.__CITADEL_PROPS__;
const configOverrides = props.config ?? {};
const harnessConfig: CitadelConfig = {
  ...defaultConfig,
  ...configOverrides,
};

const commandRegistry = createBasicCommandRegistry();

const displayMode = harnessConfig.displayMode ?? 'panel';
const containerModeAttr = displayMode === 'inline' ? 'inline' : 'panel';

const content = (
  <React.StrictMode>
    <div className="harness-shell" data-mode={containerModeAttr}>
      {displayMode === 'panel' ? (
        <>
          <div className="harness-instructions">
            Press <code>.</code> to activate Citadel. Press <kbd>Escape</kbd> to hide.
          </div>
          <Citadel commandRegistry={commandRegistry} config={harnessConfig} />
        </>
      ) : (
        <div className="harness-inline-frame" data-testid="harness-inline-frame">
          <Citadel commandRegistry={commandRegistry} config={harnessConfig} />
        </div>
      )}
    </div>
  </React.StrictMode>
);

ReactDOM.createRoot(rootElement).render(content);
