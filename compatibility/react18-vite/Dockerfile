FROM node:20-slim

WORKDIR /workspace

# Copy the library sources needed to build the local package
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts ./
COPY tailwind.config.js postcss.config.cjs ./
COPY src ./src
COPY plugins ./plugins

# Install dependencies without running postinstall hooks (Playwright browsers)
RUN npm ci --ignore-scripts

# Build the library so consumers can import the bundled outputs
RUN npm run build

# Scaffold a fresh React + Vite demo project
RUN npm create vite@5.2.0 react18-vite -- --template react-ts

WORKDIR /workspace/react18-vite

# Pin the React toolchain to 18.x to verify compatibility
RUN npm pkg set dependencies.react=18.3.1 \
  && npm pkg set dependencies."react-dom"=18.3.1 \
  && npm pkg set devDependencies."@types/react"=18.3.3 \
  && npm pkg set devDependencies."@types/react-dom"=18.3.1

# Install the app deps and link the local citadel_cli build
RUN npm install --ignore-scripts
RUN npm install ../ --save --ignore-scripts

# Drop in a demo app that exercises the published build
RUN mkdir -p src/styles

RUN cat > src/styles/app.css <<'EOF'
body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
  background-color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
}

#root {
  width: 100%;
}

.demo-card {
  width: min(720px, 92vw);
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.24);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.toggle {
  display: inline-flex;
  border-radius: 9999px;
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  padding: 4px;
}

.toggle button {
  padding: 8px 16px;
  border-radius: 9999px;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  background: transparent;
  color: #4b5563;
  transition: all 0.2s ease-in-out;
}

.toggle button.active {
  background: white;
  color: #111827;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
}

.toggle button:hover {
  color: #111827;
}

.help-toggle {
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  background: #e5e7eb;
  color: #374151;
  cursor: pointer;
  transition: background 0.2s ease-in-out;
}

.help-toggle:hover {
  background: #d1d5db;
}

.inline-host {
  height: 420px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #111827;
  margin-top: 16px;
}

.panel-message {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  color: #4b5563;
  margin: 16px 0;
}

.panel-message code {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #9ca3af;
  background: white;
}
EOF

RUN cat > src/App.tsx <<'EOF'
import { useMemo, useState } from 'react';
import {
  Citadel,
  CommandRegistry,
  JsonCommandResult,
  TextCommandResult,
} from 'citadel_cli';
import 'citadel_cli/citadel.css';
import './styles/app.css';

function buildCommandRegistry() {
  const registry = new CommandRegistry();

  registry.addCommand(
    [
      { type: 'word', name: 'demo' },
      { type: 'word', name: 'hello' },
    ],
    'Show a welcome message',
    async () => new TextCommandResult('Welcome to the React 18 + Vite demo!'),
  );

  registry.addCommand(
    [
      { type: 'word', name: 'demo' },
      { type: 'word', name: 'status' },
    ],
    'Display a mock status payload',
    async () =>
      new JsonCommandResult({
        framework: 'React 18 + Vite',
        verified: false,
        timestamp: new Date().toISOString(),
      }),
  );

  registry.addCommand(
    [
      { type: 'word', name: 'storage' },
      { type: 'word', name: 'clear' },
    ],
    'Clear demo data from localStorage',
    async () => {
      localStorage.clear();
      return new TextCommandResult('localStorage cleared');
    },
  );

  return registry;
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'panel' | 'inline';
  onChange: (mode: 'panel' | 'inline') => void;
}) {
  return (
    <div className="actions">
      <div className="toggle">
        <button
          type="button"
          className={mode === 'panel' ? 'active' : ''}
          data-testid="mode-toggle-panel"
          onClick={() => onChange('panel')}
        >
          Panel
        </button>
        <button
          type="button"
          className={mode === 'inline' ? 'active' : ''}
          data-testid="mode-toggle-inline"
          onClick={() => onChange('inline')}
        >
          Inline
        </button>
      </div>
    </div>
  );
}

function HelpToggle({
  includeHelp,
  onToggle,
}: {
  includeHelp: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="help-toggle"
      data-testid="toggle-help-command"
      onClick={onToggle}
    >
      {includeHelp ? 'Disable help command' : 'Enable help command'}
    </button>
  );
}

function App() {
  const [mode, setMode] = useState<'panel' | 'inline'>('panel');
  const [includeHelpCommand, setIncludeHelpCommand] = useState(true);
  const commandRegistry = useMemo(() => buildCommandRegistry(), []);

  return (
    <div className="demo-card">
      <ModeToggle mode={mode} onChange={setMode} />
      <div className="actions">
        <HelpToggle
          includeHelp={includeHelpCommand}
          onToggle={() => setIncludeHelpCommand((prev) => !prev)}
        />
      </div>
      {mode === 'inline' ? (
        <div className="inline-host" data-testid="citadel-inline-demo">
          <Citadel
            config={{ displayMode: 'inline', includeHelpCommand }}
            commandRegistry={commandRegistry}
          />
        </div>
      ) : (
        <>
          <div className="panel-message">
            <p>
              Press <code>.</code> to activate Citadel.
            </p>
            <p>Press Escape to close the command palette.</p>
          </div>
          <Citadel
            commandRegistry={commandRegistry}
            config={{ includeHelpCommand }}
          />
        </>
      )}
    </div>
  );
}

export default App;
EOF

RUN cat > src/main.tsx <<'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
