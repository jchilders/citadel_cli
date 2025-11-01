FROM node:20-slim

WORKDIR /workspace

# Copy the library sources needed to build the local package
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts ./
COPY tailwind.config.js postcss.config.cjs ./
COPY src ./src
COPY plugins ./plugins

# Install dependencies and build the library once
RUN npm ci --ignore-scripts
RUN npm run build

# Scaffold the Next.js App Router demo
RUN mkdir -p nextjs-app-router/app

WORKDIR /workspace/nextjs-app-router

RUN cat > package.json <<'EOF'
{
  "name": "citadel-next-app-router-demo",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "citadel_cli": "file:../",
    "next": "15.2.4",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.16.5",
    "@types/react": "^19.1.3",
    "@types/react-dom": "^19.1.3",
    "eslint": "^9.13.0",
    "eslint-config-next": "15.2.4",
    "typescript": "^5.6.3"
  }
}
EOF

RUN cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

RUN cat > next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference types="next/navigation-types/compat/navigation" />

// NOTE: This file should not be edited
EOF

RUN cat > next.config.ts <<'EOF'
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
EOF

RUN cat > app/globals.css <<'EOF'
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  padding: 0;
  margin: 0;
  background-color: #1f2937;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100%;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

#root,
#__next {
  width: 100%;
}

.demo-card {
  width: min(720px, 92vw);
  margin: 48px auto;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.24);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
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

RUN cat > app/layout.tsx <<'EOF'
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import 'citadel_cli/citadel.css';

export const metadata: Metadata = {
  title: 'Citadel App Router Demo',
  description: 'Compatibility harness for Citadel with Next.js App Router',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

RUN cat > app/page.tsx <<'EOF'
'use client';

import { useEffect, useMemo, useState } from 'react';

type CitadelModule = typeof import('citadel_cli');

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

export default function Page() {
  const [mode, setMode] = useState<'panel' | 'inline'>('panel');
  const [includeHelpCommand, setIncludeHelpCommand] = useState(true);
  const [citadel, setCitadel] = useState<CitadelModule | null>(null);

  useEffect(() => {
    let active = true;
    import('citadel_cli').then((module) => {
      if (!active) {
        return;
      }
      setCitadel(module);
    });
    return () => {
      active = false;
    };
  }, []);

  const commandRegistry = useMemo(() => {
    if (!citadel) {
      return null;
    }

    const registry = new citadel.CommandRegistry();

    registry.addCommand(
      [
        { type: 'word', name: 'demo' },
        { type: 'word', name: 'hello' },
      ],
      'Show a welcome message',
      async () => new citadel.TextCommandResult('Welcome to the Next.js App Router demo!'),
    );

    registry.addCommand(
      [
        { type: 'word', name: 'demo' },
        { type: 'word', name: 'status' },
      ],
      'Display a mock status payload',
      async () =>
        new citadel.JsonCommandResult({
          framework: 'Next.js App Router',
          verified: true,
          timestamp: new Date().toISOString(),
        }),
    );

    registry.addCommand(
      [
        { type: 'word', name: 'localstorage' },
        { type: 'word', name: 'clear' },
      ],
      'Clear demo data from localStorage',
      async () => {
        localStorage.clear();
        return new citadel.TextCommandResult('localStorage cleared');
      },
    );

    return registry;
  }, [citadel]);

  if (!citadel || !commandRegistry) {
    return (
      <div className="demo-card">
        <p>Loading Citadel…</p>
      </div>
    );
  }

  const { Citadel } = citadel;

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
          <Citadel commandRegistry={commandRegistry} config={{ includeHelpCommand }} />
        </>
      )}
    </div>
  );
}
EOF

RUN npm install --ignore-scripts

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
