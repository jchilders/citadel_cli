import { Command, CommandMetadata, ICommandRegistry } from '../types/command-registry';
import { CommandTrie } from '../types/command-trie';
import { validateCommandId, validateCommandDescription, validateCommandArgument, validateCommandHandler } from '../validation/command-validation';

interface DefaultMetadata {
  name: string;
  description: string;
  category: string;
  version: string;
  permissions?: string[];
}

/**
 * Implementation of the command registry using a trie data structure
 */
export class CommandRegistry implements ICommandRegistry {
  private readonly trie: CommandTrie;
  private readonly metadata: Map<string, CommandMetadata>;
  private readonly permissionIndex: Map<string, Set<string>>;
  private readonly commands: Map<string, Command>;

  constructor() {
    this.trie = new CommandTrie();
    this.metadata = new Map();
    this.permissionIndex = new Map();
    this.commands = new Map();
  }

  register(command: Command, metadata?: CommandMetadata): void {
    if (!command || !command.id) {
      throw new Error('Command and command ID are required');
    }

    // Validate command
    validateCommandId(command.id);
    validateCommandDescription(command.description);
    if (command.argument) {
      validateCommandArgument(command.argument);
    }
    validateCommandHandler(command.execute);

    // Store command
    this.commands.set(command.id, command);

    // Convert dot notation to path array
    const path = command.id.split('.');

    // Add to trie
    this.trie.addCommand({
      path,
      description: command.description,
      argument: command.argument,
      handler: args => command.execute(args)
    });

    const meta: DefaultMetadata = {
      name: command.getName(),
      description: command.description || '',
      category: 'default',
      version: '1.0.0',
      ...metadata
    };

    this.metadata.set(command.id, meta as CommandMetadata);

    // Index permissions
    if (meta.permissions) {
      meta.permissions.forEach(permission => {
        const commands = this.permissionIndex.get(permission) || new Set();
        commands.add(command.id);
        this.permissionIndex.set(permission, commands);
      });
    }
  }

  unregister(commandId: string): void {
    // Remove command
    this.commands.delete(commandId);

    // Remove metadata
    this.metadata.delete(commandId);

    // Remove from permission index
    for (const [permission, commands] of this.permissionIndex.entries()) {
      commands.delete(commandId);
      if (commands.size === 0) {
        this.permissionIndex.delete(permission);
      }
    }

    // Remove from trie
    this.trie.removeCommand(commandId.split('.'));
  }

  get(commandId: string): Command | undefined {
    return this.commands.get(commandId);
  }

  list(): Command[] {
    return Array.from(this.commands.values());
  }

  findByName(name: string): Command[] {
    return this.list().filter(command => command.id.split('.').pop() === name);
  }

  findByPermission(permission: string): Command[] {
    const commandIds = this.permissionIndex.get(permission);
    if (!commandIds) {
      return [];
    }
    return Array.from(commandIds).map(id => this.commands.get(id)!);
  }

  getMetadata(commandId: string): CommandMetadata | undefined {
    return this.metadata.get(commandId);
  }

  updateMetadata(commandId: string, metadata: Partial<CommandMetadata>): void {
    const existingMetadata = this.metadata.get(commandId);
    if (!existingMetadata) {
      throw new Error(`Command not found: ${commandId}`);
    }

    // If permissions are being updated, update the permission index
    if (metadata.permissions) {
      // Remove from old permissions
      existingMetadata.permissions?.forEach(permission => {
        const commands = this.permissionIndex.get(permission);
        if (commands) {
          commands.delete(commandId);
          if (commands.size === 0) {
            this.permissionIndex.delete(permission);
          }
        }
      });

      // Add to new permissions
      metadata.permissions.forEach(permission => {
        const commands = this.permissionIndex.get(permission) ?? new Set();
        commands.add(commandId);
        this.permissionIndex.set(permission, commands);
      });
    }

    // Update metadata
    this.metadata.set(commandId, { ...existingMetadata, ...metadata });
  }

  getCompletions(path: string[]): string[] {
    return this.trie.getCompletions(path);
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate command IDs
    const commandIds = new Set<string>();
    for (const command of this.commands.values()) {
      if (commandIds.has(command.id)) {
        errors.push(`Duplicate command ID: ${command.id}`);
      }
      commandIds.add(command.id);
    }

    // Check for orphaned metadata
    for (const [commandId] of this.metadata) {
      if (!this.commands.has(commandId)) {
        errors.push(`Metadata exists for unknown command: ${commandId}`);
      }
    }

    // Check for orphaned permission index entries
    for (const [permission, commandIds] of this.permissionIndex) {
      for (const commandId of commandIds) {
        if (!this.commands.has(commandId)) {
          errors.push(`Permission index contains unknown command: ${commandId} for permission ${permission}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}
