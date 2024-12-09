export interface CommandResult {
  // Base result interface that can be extended for specific result types
  json?: any;
  text?: string;
}

export type CommandHandler = (args: string[]) => Promise<CommandResult>;

export interface CommandArgument {
  name: string;
  description: string;
}

export class CommandNode {
  public readonly fullPath: string[];
  public readonly description: string;
  public readonly children?: Map<string, CommandNode>;
  public readonly argument?: CommandArgument;
  public readonly handler?: CommandHandler;

  constructor(params: {
    fullPath: string[];
    description: string;
    children?: Map<string, CommandNode>;
    argument?: CommandArgument;
    handler?: CommandHandler;
  }) {
    if (!params.fullPath || params.fullPath.length === 0) {
      throw new Error('Command path cannot be empty');
    }

    this.fullPath = params.fullPath;
    this.description = params.description;
    this.children = params.children;
    this.argument = params.argument;
    this.handler = params.handler;
  }

  get name(): string {
    return this.fullPath[this.fullPath.length - 1];
  }

  get isLeaf(): boolean {
    return !this.children || this.children.size === 0;
  }

  get hasHandler(): boolean {
    return !!this.handler;
  }

  get requiresArgument(): boolean {
    return !!this.argument;
  }
}

import { createHelpCommand } from './default-commands';
import { CitadelConfig } from '../config/types';
import { defaultConfig } from '../config/defaults';

export class CommandTrie {
  private root: Map<string, CommandNode>;
  public readonly includeHelpCommand: boolean;

  constructor(config: Partial<CitadelConfig> = {}) {
    this.root = new Map<string, CommandNode>();
    const mergedConfig = { ...defaultConfig, ...config };
    this.includeHelpCommand = mergedConfig.includeHelpCommand;
    if (this.includeHelpCommand) {
      const [helpCommandName, helpCommandNode] = createHelpCommand(this);
      this.root.set(helpCommandName, helpCommandNode);
    }
  }

  /**
   * Adds a command to the trie
   * @param params Command node parameters
   * @throws Error if attempting to add a duplicate command
   */
  addCommand(params: Omit<ConstructorParameters<typeof CommandNode>[0], 'fullPath'> & { path: string[] }): void {
    const { path, description, handler, argument } = params;
    
    if (path.length === 0) {
      throw new Error("Command path cannot be empty");
    }

    let current = this.root;
    const lastIndex = path.length - 1;

    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      const isLeaf = i === lastIndex;
      const fullPath = path.slice(0, i + 1);

      if (!current.has(segment)) {
        current.set(segment, new CommandNode({
          description: isLeaf ? description : `${segment} commands`,
          fullPath,
          children: isLeaf ? undefined : new Map<string, CommandNode>(),
          handler: isLeaf ? handler : undefined,
          argument: isLeaf ? argument : undefined,
        }));
      } else {
        const existingNode = current.get(segment)!;
        if (isLeaf && existingNode.isLeaf) {
          throw new Error(`Duplicate leaf command: ${path.join(" ")}`);
        }
        if (!isLeaf && existingNode.isLeaf) {
          throw new Error(`Cannot add subcommand to leaf command: ${path.slice(0, i + 1).join(" ")}`);
        }
      }

      current = current.get(segment)!.children!;
    }
  }

  /**
   * Retrieves a command node from the trie
   * @param path Array of command names forming the path to the desired command
   * @returns The command node or undefined if not found
   */
  getCommand(path: string[]): CommandNode | undefined {
    let current = this.root;
    let node: CommandNode | undefined;

    for (const segment of path) {
      node = current.get(segment);
      if (!node) {
        return undefined;
      }
      if (!node.children) {
        return node;
      }
      current = node.children;
    }

    return node;
  }

  /**
   * Returns all possible completions for a partial command path
   * @param path Array of command names forming the partial path
   * @returns Array of possible command names that could complete the path
   */
  getCompletions(path: string[]): string[] {
    let current = this.root;
    
    // Navigate to the last node in the path
    for (const segment of path.slice(0, -1)) {
      const node = current.get(segment);
      if (!node?.children) {
        return [];
      }
      current = node.children;
    }

    // Get all possible completions from the last node
    const lastSegment = path[path.length - 1] || "";
    const completions: string[] = [];

    if (path.length > 0) {
      const node = current.get(lastSegment);
      if (node?.children) {
        // If we have an exact match and it has children, return its children's names
        node.children.forEach((_node, key) => {
          completions.push(key);
        });
        return completions;
      }
    }

    // Otherwise return filtered completions from current level
    current.forEach((_node, key) => {
      if (key.startsWith(lastSegment)) {
        completions.push(key);
      }
    });

    return completions;
  }

  /**
   * Returns all commands in the trie as flattened paths
   * @returns Array of command paths
   */
  getAllCommands(): string[][] {
    const paths: string[][] = [];

    const traverse = (node: CommandNode) => {
      paths.push(node.fullPath);
      if (node.children) {
        node.children.forEach((child) => {
          traverse(child);
        });
      }
    };

    this.root.forEach((node) => {
      traverse(node);
    });

    return paths;
  }

  /**
   * Returns all root level command nodes in the trie
   * @returns Array of root level command nodes
   */
  getRootCommands(): CommandNode[] {
    return Array.from(this.root.values());
  }

  /**
   * Returns all leaf command nodes in the trie
   * @returns Array of leaf command nodes
   */
  getLeafCommands(): CommandNode[] {
    const leaves: CommandNode[] = [];

    const traverse = (node: CommandNode) => {
      if (!node.children || node.children.size === 0) {
        leaves.push(node);
      } else {
        node.children.forEach((child) => {
          traverse(child);
        });
      }
    };

    this.root.forEach((node) => {
      traverse(node);
    });

    return leaves;
  }

  /**
   * Validates the entire command trie
   * @returns Object containing validation result and any error messages
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const seen = new Set<string>();
    
    const traverse = (node: CommandNode) => {
      const pathStr = node.fullPath.join(" ");

      // Check for duplicate paths
      if (seen.has(pathStr)) {
        errors.push(`Duplicate command path: ${pathStr}`);
      }
      seen.add(pathStr);

      // A node with children is a non-leaf node
      if (node.children) {
        // Non-leaf nodes cannot have handlers or arguments
        if (node.handler) {
          errors.push(`Non-leaf command cannot have handler: ${pathStr}`);
        }
        if (node.argument) {
          errors.push(`Non-leaf command cannot have argument: ${pathStr}`);
        }

        // Recursively validate children
        node.children.forEach((child) => {
          traverse(child);
        });
      } else {
        // Leaf nodes must have handlers
        if (!node.handler) {
          errors.push(`Leaf command missing handler: ${pathStr}`);
        }
      }
    };

    this.root.forEach((node) => {
      traverse(node);
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
