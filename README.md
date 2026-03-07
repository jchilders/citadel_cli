# Citadel CLI

Embed a terminal-style command console directly inside your React app.

Citadel helps you turn repetitive UI workflows into fast keyboard commands for
developers, support engineers, and power users, without sending them to a
separate admin tool.

The key interaction model is prefix expansion: users usually do not type the
full command. They type the shortest unambiguous prefix and Citadel expands it
for them. For example, `us` can expand to `user show`.

## Why Developers Add Citadel

- **Move faster in existing apps**: expose internal actions as commands instead
  of building more buttons and forms
- **Debug in context**: call APIs, inspect JSON, clear storage, and run app
  actions without leaving the page
- **Keep UI clean**: hidden-by-default overlay (toggle key is configurable;
  default is `.`, and can be shown on load if desired)
- **Scale safely**: typed command DSL with argument help, async handlers, and
  structured result rendering (`text`, `json`, `image`, `error`, `bool`)

## Common Use Cases

- **Internal Tools**: replace repetitive click paths with direct commands
- **Support & Operations**: add safe operational commands to admin dashboards
- **API Testing & Debugging**: execute REST calls and inspect responses inline
- **Power User Workflows**: give advanced users terminal speed in web UI

![Animated screenshot of Citadel CLI](https://github.com/user-attachments/assets/b64da0f7-a4a0-4f76-bc03-c0e40c0e14e5)

## Installation

```bash
npm i citadel_cli
```

## Documentation

Start with the docs in `docs/`:

- [`docs/README.md`](docs/README.md) for the full guide
- [`docs/01-installing-citadel-in-an-existing-react-app.md`](docs/01-installing-citadel-in-an-existing-react-app.md) for the fastest setup
- [`docs/02-defining-commands.md`](docs/02-defining-commands.md) for the command DSL

## Quick Start (Hello World)

Commands are the core concept in Citadel. Think `user add 1234` or
`qa deploy my_feature_branch`.

Users usually enter prefixes rather than full commands. If your command is
`greet`, typing `g` is enough. If your command is `user.show`, typing `us` is
enough as long as that prefix is unambiguous.

To get running:

1. Define commands with the typed DSL
2. Build a `CommandRegistry` from those definitions
3. Pass the registry to `Citadel`

```typescript
import {
  Citadel,
  command,
  createCommandRegistry,
  text,
} from "citadel_cli";

// 1. Define and register commands
const registry = createCommandRegistry([
  command("greet")
    .describe("Say hello to someone")
    .arg("name", (arg) => arg.describe("Who are we greeting?"))
    .handle(async ({ namedArgs }) => text(`Hello ${namedArgs.name} world!`)),
]);

// 2. Pass the registry to the component
function App() {
  return <Citadel commandRegistry={registry} />;
}
```

![screenshot_greeting_cmd](https://github.com/user-attachments/assets/a3c1acad-69b3-4079-87af-0425aea3980a)

## Prefix Expansion

Prefix expansion is the core way users interact with Citadel.

Users usually do not type full command names. They type the shortest
unambiguous prefix, and Citadel expands it in place.

For the quick start example above, typing <kbd>g</kbd> expands to `greet `
(with a trailing space), and the user can then enter the `name` argument.

For hierarchical commands, expansion is prefix-based:

- `us` can resolve to `user show`
- `ud` can resolve to `user deactivate`
- If two options share a prefix (`show` and `search`), continue until unique:
  `ush` => `user show`, `use` => `user search`

Think of the DSL path as the canonical command definition and the prefix as the
normal way the user enters it.

## Help Text

Argument segment `description` values are shown as argument-level help text.
Example built-in help output:

```text
user show <userId> - Show user details
  <userId>: Enter user ID
```

Handlers must return one of the following:

- `TextCommandResult`
- `JsonCommandResult`
- `ImageCommandResult`
- `ErrorCommandResult`
- `BooleanCommandResult`

## Typed DSL

For clearer command authoring, you can define commands with a DSL and compile
them into a `CommandRegistry`:

```typescript
import {
  Citadel,
  command,
  createCommandRegistry,
  text,
} from "citadel_cli";

const registry = createCommandRegistry([
  command("user.show")
    .describe("Show user details")
    .arg("userId", (arg) => arg.describe("Enter user ID"))
    .handle(async ({ namedArgs }) => {
      return text(`Showing user ${namedArgs.userId}`);
    }),
]);

function App() {
  return <Citadel commandRegistry={registry} />;
}
```

DSL handlers receive:

- `rawArgs`: positional values (`string[]`)
- `namedArgs`: argument-name map (`Record<string, string | undefined>`)
- `commandPath`: dot-delimited path string

Helper constructors exported by the DSL:

- `text(value)`
- `json(value)`
- `image(url, altText?)`
- `error(message)`
- `bool(value, trueText?, falseText?)`

### Boolean Result Example

```typescript
import { command, createCommandRegistry, bool } from "citadel_cli";

const registry = createCommandRegistry([
  command("bool.random")
    .describe("Return a random boolean")
    .handle(async () => bool(Math.random() >= 0.5, "👍", "👎")),
]);
```

Demo registries include boolean commands:

- Basic example: `bool.true`, `bool.false`, `bool.random`
- DevOps example: `bool.deploy.window`, `bool.error.budget.healthy`, `bool.autoscale.recommended`

## Legacy `addCommand` API

`CommandRegistry#addCommand` still works and is fully supported. The DSL is now
the recommended authoring path for new command definitions.

### Arguments

1. Each command can have zero or more arguments
2. Argument values are passed to the handler as a `String[]`
3. Arguments can be single- or double-quoted

### Example Handlers

Clearing localstorage:

```
  async () => {
    localStorage.clear();
    return new TextCommandResult('localStorage cleared!');
  }
```

Make an HTTP POST with a body containing a given `name`:

```
async (args: string[]) => {
  const response = await fetch('https://api.example.com/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: args[0] }),
  });
  return new JsonCommandResult(await response.json());
}
```


## Configuration

Certain configuration options can be passed to the Citadel component. These are
given below, along with their default values.

```
const config = {
  commandTimeoutMs: 10000,
  includeHelpCommand: true,
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: '0.875rem', // CSS font-size value (e.g. '14px', '0.875rem')
  maxHeight: '80vh',
  initialHeight: '50vh',
  minHeight: '200',
  outputFontSize: '0.75rem', // optional CSS font-size override for output text
  showOutputPane: true, // set false to hide command output pane
  resetStateOnHide: false,
  closeOnEscape: true,
  showCitadelKey: '.',
  showOnLoad: false,
  cursorType: 'blink', // 'blink', 'spin', 'solid', or 'bbs'
  cursorSpeed: 530,
  storage: {
    type: 'localStorage',
    maxCommands: 100
  }
};
```

Then to make the component aware of them:

```
<Citadel commandRegistry={cmdRegistry} config={config} />
```

## Performance Metrics

Citadel includes scripts to capture and compare before/after performance and
size metrics.

### Metrics collected

- Build metrics:
  - Bundle size (raw + gzip) for `dist/citadel.es.js`, `dist/citadel.umd.cjs`,
    and `dist/citadel.css`
  - Total LOC and extension breakdown
  - Dependency presence for `tailwindcss`, `postcss`, and `autoprefixer`
  - `node_modules` size (`du -sk`)
- Runtime metrics (Chromium):
  - JS heap usage before/after interaction
  - Input latency (keydown to input update)
  - FPS sample over a short window
  - Long task count and duration
  - DOM node count

All outputs are written to `test-results/metrics/`.

### Commands

```bash
npm run metrics:build
npm run metrics:runtime
npm run metrics:compare -- --before <before.json> --after <after.json>
npm run metrics:all -- --label <label>
npm run metrics:report -- --label <label> --before-build <before-build.json> --before-runtime <before-runtime.json>
```

### Before/After workflow

1. Capture a baseline snapshot:

```bash
npm run metrics:all -- --label before
```

2. After your changes, capture the new snapshot and generate comparisons:

```bash
npm run metrics:all -- --label after \
  --before-build test-results/metrics/build-before-<timestamp>.json \
  --before-runtime test-results/metrics/runtime-before-<timestamp>.json
```

3. Open generated reports:
- `test-results/metrics/run-after.md`
- `test-results/metrics/compare-build-after.md` (if `--before-build` provided)
- `test-results/metrics/compare-runtime-after.md` (if `--before-runtime` provided)

Notes:
- `metrics:runtime` starts a local dev server and requires local port binding.
- If you only want comparison output from existing snapshots, use
  `npm run metrics:report`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on developing, testing, and releasing Citadel CLI.
