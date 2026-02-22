import { useEffect, useMemo, useState } from 'react';
import { Citadel } from './index';
import { createBasicCommandRegistry } from './examples/basicCommands.ts';
import { createDevOpsCommandRegistry } from './examples/devopsCommands';
import { createLocalDevCommandRegistry } from './examples/localDevCommands';
import { defaultConfig } from './components/Citadel/config/defaults';
import { useRuntimeConfigDemo } from './examples/runtimeConfigDemo';
import './App.css';

type ExampleId = 'basic' | 'localdev' | 'devops' | 'runtime';

const EXAMPLE_STORAGE_KEY = 'citadel-demo-example';
const EXAMPLE_LABELS: Record<ExampleId, string> = {
  basic: 'Basic',
  localdev: 'Local Full-Stack',
  devops: 'DevOps',
  runtime: 'Runtime Config',
};
const EXAMPLE_DESCRIPTIONS: Record<ExampleId, string> = {
  basic: 'A broad starter setup with user operations, error handling, and media output.',
  localdev: 'A local development setup for API checks, quick DB queries, seeding, and full-stack log inspection.',
  devops: 'An operations-flavored setup focused on deploy, logs, metrics, and infrastructure actions.',
  runtime: 'A live configuration setup that changes Citadel behavior while you use it.',
};
const EXAMPLE_HINTS: Record<ExampleId, string> = {
  basic: 'Great first stop to understand command structure and result types.',
  localdev: 'Use this when building locally and jumping between frontend, API, and database checks.',
  devops: 'Shows how Citadel can power fast operational workflows in internal tools.',
  runtime: 'Shows Citadel acting as a control surface, not just a command runner.',
};
const EXAMPLE_TRY_COMMAND: Record<ExampleId, string> = {
  basic: 'user.show 1234',
  localdev: 'stack.status',
  devops: 'monitor.metrics',
  runtime: 'display.mode.inline',
};
const EXAMPLE_TRY_KEYS: Record<ExampleId, string> = {
  basic: 'u s 1234',
  localdev: 's s',
  devops: 'm m',
  runtime: 'd m i',
};
const EXAMPLE_TRY_EXPLANATION: Record<ExampleId, string> = {
  basic: 'Shows a single user result.',
  localdev: 'Shows the current local stack health snapshot.',
  devops: 'Shows a live-style metrics payload.',
  runtime: 'Switches Citadel into inline mode in the page.',
};
const EXAMPLE_SOURCE_URL: Record<ExampleId, string> = {
  basic: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/basicCommands.ts',
  localdev: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/localDevCommands.ts',
  devops: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/devopsCommands.ts',
  runtime: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/runtimeConfigDemo.ts',
};

const VALID_EXAMPLE_IDS: ExampleId[] = ['basic', 'localdev', 'devops', 'runtime'];

const isExampleId = (value: string): value is ExampleId =>
  VALID_EXAMPLE_IDS.includes(value as ExampleId);

const getInitialExample = (): ExampleId => {
  if (typeof window === 'undefined') {
    return 'basic';
  }

  const stored = window.localStorage.getItem(EXAMPLE_STORAGE_KEY);
  if (stored && isExampleId(stored)) {
    return stored;
  }

  return 'basic';
};

function App() {
  const [selectedExample, setSelectedExample] = useState<ExampleId>(getInitialExample);
  const basicRegistry = useMemo(() => createBasicCommandRegistry(), []);
  const localDevRegistry = useMemo(() => createLocalDevCommandRegistry(), []);
  const devopsRegistry = useMemo(() => createDevOpsCommandRegistry(), []);
  const runtimeDemo = useRuntimeConfigDemo();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EXAMPLE_STORAGE_KEY, selectedExample);
    }
  }, [selectedExample]);

  const activeBaseRegistry = useMemo(() => {
    if (selectedExample === 'devops') {
      return devopsRegistry;
    }

    if (selectedExample === 'localdev') {
      return localDevRegistry;
    }

    if (selectedExample === 'runtime') {
      return runtimeDemo.commandRegistry;
    }

    return basicRegistry;
  }, [basicRegistry, localDevRegistry, devopsRegistry, runtimeDemo.commandRegistry, selectedExample]);

  const activeConfig = selectedExample === 'runtime' ? runtimeDemo.config : defaultConfig;

  return (
    <div className="demo-page">
      <div className="demo-shell">
        <header className="demo-header">
          <div className="demo-brand-wrap">
            <span className="demo-brand">&gt; citadel</span>
          </div>
          <h1 className="demo-title">
            Keyboard-driven command console
            <br />
            <span className="demo-title-sub">for your web app</span>
          </h1>
          <p className="demo-description">
            Press <kbd>.</kbd>, type fast-expand shortcuts, see results inline.
            These tabs show four different command registry setups.
          </p>
        </header>

        <main className="demo-card">
          <nav className="demo-tabbar" aria-label="Examples">
            {VALID_EXAMPLE_IDS.map((exampleId) => {
              const isActive = selectedExample === exampleId;
              return (
                <button
                  key={exampleId}
                  type="button"
                  onClick={() => setSelectedExample(exampleId)}
                  className={`demo-tab ${isActive ? 'is-active' : ''}`}
                >
                  {EXAMPLE_LABELS[exampleId]}
                </button>
              );
            })}
          </nav>

          <section className="demo-content">
            <div className="demo-example-info">
              <div className="demo-example-indicator" aria-hidden="true" />
              <div>
                <div className="demo-example-title-row">
                  <p className="demo-example-title">{EXAMPLE_LABELS[selectedExample]}</p>
                  <a
                    href={EXAMPLE_SOURCE_URL[selectedExample]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="demo-source-link"
                  >
                    view source
                  </a>
                </div>
                <p className="demo-example-description">{EXAMPLE_DESCRIPTIONS[selectedExample]}</p>
                <p className="demo-example-hint">{EXAMPLE_HINTS[selectedExample]}</p>
              </div>
            </div>

            <div className="demo-try-box">
              <p className="demo-try-title">
                <span className="demo-try-prefix">&gt;</span> Try it now
              </p>
              <p className="demo-try-copy">
                Press <kbd>.</kbd> to open Citadel, then type{' '}
                {EXAMPLE_TRY_KEYS[selectedExample].split(' ').map((k, i, arr) => (
                  <span key={i}>
                    <kbd>{k}</kbd>
                    {i < arr.length - 1 && ' '}
                  </span>
                ))}
                {' '}to auto-expand into{' '}
                <code className="demo-command-code">
                  {EXAMPLE_TRY_COMMAND[selectedExample]}
                </code>
                . {EXAMPLE_TRY_EXPLANATION[selectedExample]}
              </p>
            </div>
          </section>
        </main>

        <p className="demo-footer-note">
          citadel_cli - a keyboard-driven command surface for React apps
        </p>

        <Citadel
          key={selectedExample}
          commandRegistry={activeBaseRegistry}
          config={activeConfig}
        />
      </div>
    </div>
  );
}

export default App;
