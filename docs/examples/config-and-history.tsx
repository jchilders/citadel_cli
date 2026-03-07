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
