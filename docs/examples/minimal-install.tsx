import { Citadel, command, createCommandRegistry, text } from '@citadel_cli/react';

const commandRegistry = createCommandRegistry([
  command('hello')
    .describe('Print a hello message')
    .handle(async () => text('Hello from Citadel')),
]);

export default function App() {
  return <Citadel commandRegistry={commandRegistry} />;
}
