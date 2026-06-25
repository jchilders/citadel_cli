/**
 * Example CLI: the web demo's **DevOps** example, in your terminal.
 *
 * Like basic-cli, the registry is not duplicated — `createDevOpsCommandRegistry`
 * is the exact same shared file the web demo uses (@citadel/sample-commands).
 * Commands: deploy.*, monitor.*, infra.scale, check.* (simulated internal-tools
 * data). Same engine, same definitions, terminal presentation.
 *
 * Run it:
 *   npm run cli:devops                                       # interactive TUI
 *   npx tsx examples/devops-cli.ts --script=$'dp\nml\n'      # scripted
 */
import { createDevOpsCommandRegistry } from '@citadel/sample-commands';
import { runCli } from '../src/run';

runCli(createDevOpsCommandRegistry(), {
  welcome: 'Citadel devops-cli — the web "DevOps" example, in your terminal.',
});
