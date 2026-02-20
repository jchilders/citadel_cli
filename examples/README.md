# Examples Directory

This folder contains sample command definitions you can copy into your app.

## What's in here

- `basic-commands.ts`
  - Exports `registerCommands()`.
  - Returns a fully built `CommandRegistry` from `src/examples/basicCommands.ts`.
  - Use this when you want a ready-to-run starter command set.

- `runtime-config-commands.ts`
  - Exports `createRuntimeConfigCommandRegistry(controls)`.
  - Builds a `CommandRegistry` with runtime config commands (cursor type/color, display mode, help toggle, reset).
  - Use this when your app manages Citadel config in React state and you want commands to mutate that state.

- `customer-service-commands.ts`
- `devops-commands.ts`
  - Export nested `commands` objects with handlers and metadata.
  - These are domain examples and are not auto-registered into `CommandRegistry`.
  - Use them as templates, or adapt each entry into `registry.addCommand(...)`.

## Quick start with the basic example

```ts
import { Citadel } from 'citadel_cli';
import { registerCommands } from './examples/basic-commands';

const commandRegistry = registerCommands();

// In your component render:
// <Citadel commandRegistry={commandRegistry} />
```

## Runtime config example

```ts
import { Citadel } from 'citadel_cli';
import { createRuntimeConfigCommandRegistry } from './examples/runtime-config-commands';

const commandRegistry = createRuntimeConfigCommandRegistry({
  setCursorType: (type) => setConfig((prev) => ({ ...prev, cursorType: type })),
  setCursorColor: (color) => setConfig((prev) => ({ ...prev, cursorColor: color })),
  setDisplayMode: (mode) => setConfig((prev) => ({ ...prev, displayMode: mode })),
  setIncludeHelpCommand: (enabled) => setConfig((prev) => ({ ...prev, includeHelpCommand: enabled })),
  resetConfig: () => setConfig(defaultConfig)
});

// <Citadel commandRegistry={commandRegistry} config={config} />
```

## Running the demo locally

From the repo root:

```bash
npm run dev
```

The default demo app currently uses `src/examples/devopsCommands.ts`.
