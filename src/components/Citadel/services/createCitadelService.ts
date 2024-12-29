import { CommandRegistry } from '../registry/CommandRegistry';
import { CommandStateManager } from '../registry/CommandStateManager';
import { CommandDocManager } from '../registry/CommandDocManager';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { CitadelService } from './CitadelService';
import { LocalStorageStateStorage } from '../registry/CommandStateManager';
import { InMemoryStateStorage } from '../registry/CommandStateManager';
import { Command } from '../types/command-registry';
import { BaseCommand } from '../types/command-registry';
import { CommandArgument } from '../types/command-trie';

export interface CreateCitadelServiceOptions {
  commands?: Record<string, any>;
  persistState?: boolean;
  stateStorageKey?: string;
}

const formatCommandId = (id: string): string => {
  // If already in dot notation, return as is
  if (id.includes('.')) {
    return id;
  }

  // Convert camelCase to dot notation
  // e.g., systemEcho -> system.echo
  return id.replace(/([A-Z])/g, '.$1').toLowerCase();
};

class DynamicCommand extends BaseCommand {
  constructor(
    id: string,
    description: string,
    private readonly executeFunction: (args: string[]) => Promise<any>,
    argument?: CommandArgument
  ) {
    super(id, description, argument);
  }

  async execute(args: string[]): Promise<any> {
    return this.executeFunction(args);
  }
}

export function createCitadelService(options: CreateCitadelServiceOptions = {}): CitadelService {
  const registry = new CommandRegistry();
  const docManager = new CommandDocManager();
  const middlewareManager = new MiddlewareManager();

  // Initialize state storage
  const stateStorage = typeof window !== 'undefined' 
    ? new LocalStorageStateStorage(options.stateStorageKey || 'citadel_state')
    : new InMemoryStateStorage();

  const stateManager = new CommandStateManager(stateStorage);

  // Register commands if provided
  if (options.commands) {
    Object.entries(options.commands).forEach(([id, handler]) => {
      const formattedId = formatCommandId(id);
      
      // Create a proper Command instance
      let command: Command;
      
      if (typeof handler === 'function') {
        // Function shorthand
        command = new DynamicCommand(
          formattedId,
          `Execute ${formattedId}`,
          handler
        );
      } else if (typeof handler === 'object') {
        // Object with properties
        command = new DynamicCommand(
          formattedId,
          handler.description || `Execute ${formattedId}`,
          handler.execute,
          handler.argument
        );
      } else {
        throw new Error(`Invalid command handler for ${formattedId}`);
      }

      // Register the command
      registry.register(command);

      // Add documentation if available
      if (handler.docs) {
        docManager.addDocs(formattedId, handler.docs);
      }
    });
  }

  return new CitadelService(
    registry,
    stateManager,
    docManager,
    middlewareManager,
  );
}
