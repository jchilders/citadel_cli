import { Citadel, command, createCommandRegistry, text } from 'citadel_cli';

const panelRegistry = createCommandRegistry([
  command('hello')
    .describe('Print a hello message')
    .handle(async () => text('Hello from the panel')),
]);

const inlineRegistry = createCommandRegistry([
  command('status')
    .describe('Show the current status')
    .handle(async () => text('All systems nominal')),
]);

const containerRegistry = createCommandRegistry([
  command('status')
    .describe('Show the current status')
    .handle(async () => text('Mounted into a specific element')),
]);

const hiddenOutputRegistry = createCommandRegistry([
  command('status.refresh')
    .describe('Refresh the surrounding UI')
    .handle(async () => text('Refreshed')),
]);

export function PanelModeExample() {
  return <Citadel commandRegistry={panelRegistry} />;
}

export function InlineModeExample() {
  return (
    <div style={{ minHeight: '320px' }}>
      <Citadel
        commandRegistry={inlineRegistry}
        config={{ displayMode: 'inline' }}
      />
    </div>
  );
}

export function InlineContainerExample() {
  return (
    <>
      <section id="citadel-inline-host" />
      <Citadel
        containerId="citadel-inline-host"
        commandRegistry={containerRegistry}
        config={{ displayMode: 'inline' }}
      />
    </>
  );
}

export function HiddenOutputExample() {
  return (
    <Citadel
      commandRegistry={hiddenOutputRegistry}
      config={{ showOutputPane: false }}
    />
  );
}
