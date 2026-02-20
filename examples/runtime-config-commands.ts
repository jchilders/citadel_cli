import { CommandRegistry } from '../src/components/Citadel/types/command-registry';
import {
  registerRuntimeConfigCommands,
  type RuntimeConfigControls
} from '../src/examples/runtimeConfigCommands';

export function createRuntimeConfigCommandRegistry(
  controls: RuntimeConfigControls
): CommandRegistry {
  const registry = new CommandRegistry();
  registerRuntimeConfigCommands(registry, controls);
  return registry;
}
