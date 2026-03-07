import { Citadel, command, createCommandRegistry, text } from 'citadel_cli';

const commandRegistry = createCommandRegistry([
  command('greet')
    .describe('Print a greeting.')
    .arg('name', (arg) => arg.describe('Who should be greeted?'))
    .handle(async ({ namedArgs }) => text(`Hello, ${namedArgs.name}!`)),
]);

export default function App() {
  return <Citadel commandRegistry={commandRegistry} />;
}
