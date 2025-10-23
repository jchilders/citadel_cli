# Use an official lightweight Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install Vite globally
RUN npm install -g create-vite

# Create a new Vite-based React+TS app first
RUN create-vite citadel-demo --template react-ts

# Copy library source
COPY package.json package-lock.json ./
COPY src ./src
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts ./
COPY tailwind.config.js postcss.config.cjs ./
COPY plugins ./plugins

# Install library deps using the same React version as test app
RUN cd citadel-demo && REACT_VERSION=$(npm list react --depth=0 | grep react@ | sed 's/.*react@//' | sed 's/ .*//')  && cd .. && npm install && npm install --save-dev react@$REACT_VERSION react-dom@$REACT_VERSION
RUN npm run build

# Change working directory to the test app
WORKDIR /app/citadel-demo

# Install dependencies and add local citadel_cli
RUN npm install && npm install file:../

# Replace default CSS with our styling
RUN cat > src/index.css << 'EOF'
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

#root {
  min-height: 100vh;
}
EOF

# Create styles directory and shared demo styles
RUN mkdir -p src/styles
RUN cat > src/styles/app.css << 'EOF'
.container {
  min-height: 100vh;
  background-color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  text-align: center;
  color: #374151;
}

code {
  padding: 2px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: #f9fafb;
}
EOF

# Create a demo App that exercises the published package build
RUN cat > src/App.tsx <<'EOF'
import {
  Citadel,
  CommandRegistry,
  JsonCommandResult,
  TextCommandResult,
} from 'citadel_cli';
import 'citadel_cli/citadel.css';
import './styles/app.css';
import { useMemo } from 'react';

function buildDemoRegistry() {
  const registry = new CommandRegistry();

  registry.addCommand(
    [
      { type: 'word', name: 'demo' },
      { type: 'word', name: 'hello' },
    ],
    'Display a welcome message',
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return new TextCommandResult('Welcome to the Citadel CLI demo!');
    },
  );

  registry.addCommand(
    [
      { type: 'word', name: 'demo' },
      { type: 'word', name: 'status' },
    ],
    'Show a simple status payload',
    async () =>
      new JsonCommandResult({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
  );

  return registry;
}

function App() {
  const commandRegistry = useMemo(() => buildDemoRegistry(), []);

  return (
    <div className="container">
      <div className="card">
        <p>
          Press <code>.</code> to<br />activate Citadel
        </p>
        <Citadel commandRegistry={commandRegistry} />
      </div>
    </div>
  );
}

export default App;
EOF

# Expose Vite's default port
EXPOSE 5173

# Start the Vite development server and make it accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
