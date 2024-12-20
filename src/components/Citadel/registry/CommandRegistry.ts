import { Command, CommandMetadata, ICommandRegistry } from '../types/command-registry';
import { CommandTrie } from '../types/command-trie';
import { validateCommandId } from '../utils/command-validation';

/**
 * Implementation of the command registry using a trie data structure
 */
export class CommandRegistry implements ICommandRegistry {
  private readonly trie: CommandTrie;
  private readonly metadata: Map<string, CommandMetadata>;
  private readonly permissionIndex: Map<string, Set<string>>;

  constructor() {
    this.trie = new CommandTrie();
    this.metadata = new Map();
    this.permissionIndex = new Map();
  }

  register(command: Command, metadata?: CommandMetadata): void {
    // Validate command ID
    validateCommandId(command.id);

    // Convert dot notation to path array
    const path = command.id.split('.');

    // Add to trie
    this.trie.addCommand({
      path,
      description: command.description,
      argument: command.argument,
      handler: args => command.execute(args)
    });

    // Store metadata if provided
    if (metadata) {
      this.metadata.set(command.id, metadata);
      
      // Index permissions
      metadata.permissions?.forEach(permission => {
        const commands = this.permissionIndex.get(permission) ?? new Set();
        commands.add(command.id);
        this.permissionIndex.set(permission, commands);
      });
    }
  }

  unregister(commandId: string): void {
    // Remove metadata
    this.metadata.delete(commandId);

    // Remove from permission index
    const metadata = this.metadata.get(commandId);
    metadata?.permissions?.forEach(permission => {
      const commands = this.permissionIndex.get(permission);
      commands?.delete(commandId);
      if (commands?.size === 0) {
        this.permissionIndex.delete(permission);
      }
    });

    // Remove from trie
    // Note: We need to implement removal in CommandTrie
    // For now, we'll just leave it there as removing from a trie is complex
    // and the current implementation doesn't support it
  }

  get(commandId: string): Command | undefined {
    const path = commandId.split('.');
    const node = this.trie.getCommand(path);
    
    if (!node) return undefined;

    return {
      id: commandId,
      description: node._description,
      argument: node.argument,
      execute: node.handler,
      getName: () => node.name
    };
  }

  list(): Command[] {
    return this.trie.getLeafCommands().map(node => ({
      id: node._fullPath.join('.'),
      description: node._description,
      argument: node.argument,
      execute: node.handler,
      getName: () => node.name
    }));
  }

  findByName(name: string): Command[] {
    return this.list().filter(cmd => cmd.getName() === name);
  }

  findByPermission(permission: string): Command[] {
    const commandIds = this.permissionIndex.get(permission) ?? new Set();
    return Array.from(commandIds)
      .map(id => this.get(id))
      .filter((cmd): cmd is Command => cmd !== undefined);
  }

  getMetadata(commandId: string): CommandMetadata | undefined {
    return this.metadata.get(commandId);
  }

  updateMetadata(commandId: string, metadata: Partial<CommandMetadata>): void {
    const existing = this.metadata.get(commandId);
    if (!existing) {
      throw new Error(`No metadata found for command ${commandId}`);
    }

    // Update metadata
    const updated = { ...existing, ...metadata };
    this.metadata.set(commandId, updated);

    // Update permission index if permissions changed
    if (metadata.permissions) {
      // Remove from old permission index
      existing.permissions?.forEach(permission => {
        const commands = this.permissionIndex.get(permission);
        commands?.delete(commandId);
        if (commands?.size === 0) {
          this.permissionIndex.delete(permission);
        }
      });

      // Add to new permission index
      metadata.permissions.forEach(permission => {
        const commands = this.permissionIndex.get(permission) ?? new Set();
        commands.add(commandId);
        this.permissionIndex.set(permission, commands);
      });
    }
  }

  getCompletions(path: string[]): string[] {
    return this.trie.getCompletions(path);
  }

  validate(): { isValid: boolean; errors: string[] } {
    return this.trie.validate();
  }
}
