# Configuring Citadel and command history

Pass runtime options through the `config` prop.

```tsx
import {
  Citadel,
  type CitadelConfig,
  command,
  createCommandRegistry,
  text,
} from 'citadel_cli';

const commandRegistry = createCommandRegistry([
  command('hello')
    .describe('Print a hello message')
    .handle(async () => text('Hello from a configured Citadel')),
]);

const config: CitadelConfig = {
  showCitadelKey: '/',
  commandTimeoutMs: 5000,
  displayMode: 'panel',
  showOnLoad: false,
  closeOnEscape: true,
  includeHelpCommand: true,
  cursorType: 'blink',
  cursorSpeed: 530,
  cursorColor: 'oklch(0.92 0 0)',
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: '0.875rem',
  outputFontSize: '0.8125rem',
  initialHeight: '45vh',
  minHeight: '240px',
  maxHeight: '70vh',
  showOutputPane: true,
  resetStateOnHide: false,
  storage: {
    type: 'memory',
    maxCommands: 25,
  },
};

export function ConfiguredCitadelExample() {
  return <Citadel commandRegistry={commandRegistry} config={config} />;
}
```

## Common options

| Option | Purpose | Default |
| --- | --- | --- |
| `displayMode` | Choose `panel` or `inline` rendering. | `'panel'` |
| `showCitadelKey` | Keyboard shortcut that opens the panel. | `'.'` |
| `showOnLoad` | Start visible in panel mode. | `false` |
| `closeOnEscape` | Let `Escape` close the panel. | `true` |
| `includeHelpCommand` | Inject the built-in `help` command. | `true` |
| `showOutputPane` | Render the output/history pane. | `true` |
| `resetStateOnHide` | Clear state when the panel closes. | `false` |
| `commandTimeoutMs` | Maximum time before a command times out. | `10000` |
| `fontFamily` | Main font family. | `'monospace'` |
| `fontSize` | Base UI font size. | `'0.875rem'` |
| `outputFontSize` | Output text font size override. | `'0.875rem'` |
| `initialHeight` | Starting height for the panel. | `'50vh'` |
| `minHeight` | Minimum height. | `'200'` |
| `maxHeight` | Maximum height. | `'80vh'` |
| `cursorType` | Cursor style: `blink`, `spin`, `solid`, or `bbs`. | `'blink'` |
| `cursorSpeed` | Cursor animation speed in milliseconds. | `530` |
| `cursorColor` | Cursor color as any CSS color value. | `'var(--cursor-color, #fff)'` |
| `storage.type` | Command history backend. | `'localStorage'` |
| `storage.maxCommands` | Maximum saved history entries. | `100` |
| `logLevel` | Internal logger verbosity. | `DEBUG` in development, `ERROR` in production |

## History storage

Citadel stores command history through `config.storage`.

```tsx
storage: {
  type: 'localStorage',
  maxCommands: 100,
}
```

Available backends:

- `localStorage`: persisted across page reloads
- `memory`: reset on refresh

If local storage cannot be created, Citadel falls back to in-memory storage.

## Choosing sensible defaults

A few combinations work well:

- Internal admin overlay: `displayMode: 'panel'`, default `showOutputPane`, `storage.type: 'localStorage'`
- Embedded dashboard console: `displayMode: 'inline'`, explicit height constraints
- Action-only command surface: `showOutputPane: false`, `storage.type: 'memory'`

---

Previous: [Embedding Citadel and choosing a display mode](./03-embedding-and-display-modes.md)

Next: [Using integration recipes](./05-using-integration-recipes.md)
