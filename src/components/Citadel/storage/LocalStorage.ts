import { StorageConfig, StoredCommand } from '../types/storage';
import { BaseStorage } from './BaseStorage';
import { CommandNode } from '../types/command-trie';

interface SerializedStoredCommand {
  nodePath: string[];
  args: string[];
  timestamp: number;
}

/**
 * localStorage-based command history storage
 */
export class LocalStorage extends BaseStorage {
  private readonly storageKey = 'citadel_command_history';
  private commandTrie?: CommandNode;

  constructor(config?: StorageConfig, rootNode?: CommandNode) {
    super(config);
    this.commandTrie = rootNode;
  }

  /**
   * Set the command trie root node. This is required for deserializing stored commands.
   */
  setCommandTrie(rootNode: CommandNode) {
    this.commandTrie = rootNode;
  }

  async getCommands(): Promise<StoredCommand[]> {
    if (!this.commandTrie) {
      console.warn('Command trie not set. Cannot deserialize stored commands.');
      return [];
    }

    try {
      const data = window.localStorage.getItem(this.storageKey);
      if (!data) return [];
      
      const serializedCommands = JSON.parse(data) as SerializedStoredCommand[];
      return serializedCommands
        .map(cmd => this.deserializeCommand(cmd))
        .filter((cmd): cmd is StoredCommand => cmd !== null);
    } catch (error) {
      console.warn('Failed to load commands from localStorage:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      window.localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  protected async saveCommands(commands: StoredCommand[]): Promise<void> {
    try {
      const serializedCommands = commands.map(cmd => ({
        nodePath: cmd.node.fullPath,
        args: [...cmd.args],
        timestamp: cmd.timestamp
      }));
      window.localStorage.setItem(this.storageKey, JSON.stringify(serializedCommands));
    } catch (error) {
      console.warn('Failed to save commands to localStorage:', error);
      throw error; // Re-throw to trigger fallback
    }
  }

  private deserializeCommand(serialized: SerializedStoredCommand): StoredCommand | null {
    if (!this.commandTrie) return null;

    // Traverse the command trie to find the node
    let currentNode: CommandNode | undefined = this.commandTrie;
    for (let i = 1; i < serialized.nodePath.length; i++) {
      const segment = serialized.nodePath[i];
      if (!currentNode || !currentNode.getChild) {
        console.warn(`Could not find command node for path: ${serialized.nodePath.join(' ')}`);
        return null;
      }
      currentNode = currentNode.getChild(segment);
      if (!currentNode) {
        console.warn(`Could not find command node for path: ${serialized.nodePath.join(' ')}`);
        return null;
      }
    }

    return {
      node: currentNode,
      args: [...serialized.args],
      timestamp: serialized.timestamp
    };
  }
}
