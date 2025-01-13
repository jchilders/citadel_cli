#!/bin/bash

# Exit on error
set -e

# Define directories
STYLES_DIR="src/styles"
COMPONENTS_DIR="src/components"
CITADEL_DIR="src/components/Citadel"

# Ensure target directories exist
mkdir -p "$STYLES_DIR"
mkdir -p "$CITADEL_DIR"
mkdir -p "${COMPONENTS_DIR}/CommandInput"

# Create new citadel-base.css
echo "Creating citadel-base.css..."
cat > "${STYLES_DIR}/citadel-base.css" << 'EOL'
.citadel-root {
  /* Scoped default styles */
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* Theme variables */
  --citadel-bg: rgb(17, 24, 39);
  --citadel-text: rgba(255, 255, 255, 0.87);
  --citadel-border: rgb(55, 65, 81);
  --citadel-accent: #646cff;
  --citadel-accent-hover: #535bf2;
  --citadel-min-height: 200px;
  --citadel-default-height: 33vh;
  --citadel-max-height: 80vh;
  --citadel-error: rgb(239, 68, 68);
}

/* Scope all element styles to our component */
.citadel-root button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}

.citadel-root button:hover {
  border-color: var(--citadel-accent);
}

.citadel-root button:focus,
.citadel-root button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

.citadel-root a {
  font-weight: 500;
  color: var(--citadel-accent);
  text-decoration: inherit;
}

.citadel-root a:hover {
  color: var(--citadel-accent-hover);
}

/* Animations with namespaced keyframes */
@keyframes citadel-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.citadel-animate-shake {
  animation: citadel-shake 0.15s ease-in-out;
}
EOL

# Update Citadel.module.css
echo "Updating Citadel.module.css..."
cat > "${CITADEL_DIR}/Citadel.module.css" << 'EOL'
.container {
  position: fixed;
  inset: auto 0 0 0;
  height: var(--citadel-default-height);
  min-height: var(--citadel-min-height);
  max-height: var(--citadel-max-height);
  background-color: var(--citadel-bg);
  color: var(--citadel-text);
  overflow: hidden;
  width: 100%;
  z-index: 9999;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.innerContainer {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.inputSection {
  border-top: 1px solid var(--citadel-border);
  padding: 1rem;
  margin: 0;
  box-sizing: border-box;
}

.resizeHandle {
  width: 100%;
  height: 6px;
  background: transparent;
  cursor: ns-resize;
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 10;
  user-select: none;
  -webkit-user-select: none;
}

.resizeHandle:hover {
  background: rgba(255, 255, 255, 0.1);
}

@keyframes citadel-slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes citadel-slideDown {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}

.slideUp {
  animation: citadel-slideUp 0.2s ease-out forwards;
}

.slideDown {
  animation: citadel-slideDown 0.2s ease-out forwards;
}
EOL

# Update CommandInput.module.css
echo "Updating CommandInput.module.css..."
cat > "${COMPONENTS_DIR}/CommandInput/CommandInput.module.css" << 'EOL'
@keyframes citadel-input-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes citadel-input-flashBorder {
  0%, 100% { border-color: transparent; }
  50% { border-color: var(--citadel-error); }
}

.invalidInput {
  animation: citadel-input-shake 0.2s ease-in-out, citadel-input-flashBorder 0.3s ease-in-out;
  border-width: 1px;
  border-style: solid;
}
EOL

# Update styles.css to keep only Tailwind imports
echo "Updating styles.css..."
cat > "${STYLES_DIR}/styles.css" << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL

echo "Done!"
echo "Files have been updated in their correct locations:"
echo "- ${STYLES_DIR}/citadel-base.css"
echo "- ${CITADEL_DIR}/Citadel.module.css"
echo "- ${COMPONENTS_DIR}/CommandInput/CommandInput.module.css"
echo "- ${STYLES_DIR}/styles.css"
echo ""
echo "Don't forget to:"
echo "1. Import citadel-base.css in your main component"
echo "2. Add the 'citadel-root' class to your root component"
echo "3. Update any animation class references in your components"