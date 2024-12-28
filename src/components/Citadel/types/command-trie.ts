import { BaseCommandResult, TextCommandResult } from './command-results';

/**
 * Represents the result of a command execution.
 * Can be extended for specific result types.
 */
export type CommandResult = BaseCommandResult;

/** Function type for handling command execution */
export type CommandHandler = (args: string[]) => Promise<BaseCommandResult>;

/**
 * Represents an argument that can be passed to a command
 */
export interface CommandArgument {
  /** The name of the argument */
  name: string;
  /** Description of what the argument does */
  description: string;
}

/**
 * Represents a node in the command tree structure.
 * Each node can have children commands and optionally an argument and handler.
 */
export interface CommandNodeParams {
  fullPath: string[];
  description: string;
  parent?: CommandNode;
  argument?: CommandArgument;
  handler?: CommandHandler;
}

/**
 * A no-op handler that does nothing when executed. Used as the default handler
 * for CommandNodes that don't specify a handler.
 */
export const NoopHandler: CommandHandler = async () => {
  return new TextCommandResult('');
};

export class CommandNode {
  private _fullPath: string[];
  private _description: string;
  private _children: Map<string, CommandNode>;
  private _argument?: CommandArgument;
  private _handler: CommandHandler;
  private _parent?: CommandNode;

  /**
   * Creates a new CommandNode representing a command the user can enter. From a
   * high level, a command is one or more words followed by an optional
   * argument, and with an optional handler.
   * 
   * @param params Configuration parameters for the node
   * @param params.fullPath Complete path from root to this node (e.g., ['service', 'deploy'])
   * @param params.description Human-readable description of the command
   * @param params.parent Optional parent node in the command hierarchy
   * @param params.handler Optional async function to execute when command is invoked
   * @param params.argument Optional argument definition for the command
   * @throws {Error} If fullPath is empty or undefined
   * 
   * @example
   * ```typescript
   * // Create a leaf command node (service deploy)
   * const deployNode = new CommandNode({
   *   fullPath: ['service', 'deploy'],
   *   description: 'Deploy a microservice to the specified environment',
   *   argument: {
   *     name: 'environment',
   *     description: 'Target environment (dev/staging/prod)'
   *   },
   *   handler: async (args: string[]) => {
   *     const env = args[0];
   *     return { 
   *       text: `Deploying service to ${env}...`
   *     };
   *   }
   * });
   * 
   * // Create a parent command node for service operations
   * const serviceNode = new CommandNode({
   *   fullPath: ['service'],
   *   description: 'Manage microservice lifecycle operations (deploy/status/rollback)'
   * });
   * ```
   */
  constructor(params: CommandNodeParams) {
    if (!params.fullPath || params.fullPath.length === 0) {
      throw new Error('Command path cannot be empty');
    }

    this._fullPath = params.fullPath;
    this._description = params.description;
    this._children = new Map<string, CommandNode>();
    this._argument = params.argument;
    this._handler = params.handler || NoopHandler;
    this._parent = params.parent;
  }

  /**
   * Gets the name of this command (last segment of the path)
   */
  get name(): string {
    return this._fullPath[this._fullPath.length - 1];
  }

  /**
   * Whether this is a leaf node (has no children)
   */
  get isLeaf(): boolean {
    return this._children.size === 0;
  }

  /**
   * Whether this command has a handler
   */
  get hasHandler(): boolean {
    return this._handler !== undefined;
  }

  /**
   * Whether this command requires an argument
   */
  get requiresArgument(): boolean {
    return this._argument !== undefined;
  }

  /**
   * Gets the parent node if it exists
   */
  get parent(): CommandNode | undefined {
    return this._parent;
  }

  /**
   * Gets the map of child commands
   */
  get children(): ReadonlyMap<string, CommandNode> {
    return this._children;
  }

  /**
   * Whether this command has any children
   */
  get hasChildren(): boolean {
    return this._children.size > 0;
  }

  /**
   * Adds a child command
   */
  addChild(segment: string, node: CommandNode): void {
    this._children.set(segment, node);
  }

  /**
   * Gets a child command by name
   */
  getChild(name: string): CommandNode | undefined {
    return this._children.get(name);
  }

  /**
   * Gets the full path from root to this command
   */
  get fullPath(): string[] {
    return this._fullPath;
  }

  /**
   * Gets the command's description
   */
  get description(): string {
    return this._description;
  }

  /**
   * Gets the command's argument definition if it exists
   */
  get argument(): CommandArgument | undefined {
    return this._argument;
  }

  /**
   * Sets the command's argument definition
   */
  set argument(value: CommandArgument | undefined) {
    this._argument = value;
  }

  /**
   * Gets the command's handler
   */
  get handler(): CommandHandler {
    return this._handler;
  }

  /**
   * Sets the command's handler
   */
  set handler(value: CommandHandler) {
    this._handler = value;
  }
}

/**
 * A trie data structure for managing hierarchical commands.
 * Provides functionality for adding commands, retrieving commands,
 * and getting command completions.
 */
export class CommandTrie {
  private readonly _root: CommandNode;

  /**
   * Creates a new CommandTrie instance.
   */
  constructor() {
    // Create a root node with a special path
    this._root = new CommandNode({
      fullPath: ['ROOT'],
      description: 'Root command node'
    });
  }

  /**
   * Adds a new command to the trie.
   * 
   * @param params Parameters for the command.
   * @param params.path The path segments for the command (e.g., ['service', 'deploy'])
   * @param params.description Description of what the command does
   * @param params.handler Optional function to execute when command is invoked
   * @param params.argument Optional argument definition for the command
   * @throws {Error} If attempting to add a duplicate leaf command or a subcommand to a leaf
   * 
   * @example
   * ```typescript
   * const commandTrie = new CommandTrie();
   * 
   * // Add the root service management command
   * commandTrie.addCommand({
   *   path: ['service'],
   *   description: 'Manage microservice operations'
   * });
   * 
   * // Add deployment command with environment argument
   * commandTrie.addCommand({
   *   path: ['service', 'deploy'],
   *   description: 'Deploy a service to the specified environment',
   *   argument: {
   *     name: 'environment',
   *     description: 'Target environment (dev/staging/prod)'
   *   },
   *   handler: async (args) => {
   *     const env = args[0];
   *     return { 
   *       text: `Starting deployment to ${env}...`,
   *       json: { operation: 'deploy', environment: env }
   *     };
   *   }
   * });
   * 
   * // Add status check command with service name argument
   * commandTrie.addCommand({
   *   path: ['service', 'status'],
   *   description: 'Check service health and metrics',
   *   argument: {
   *     name: 'service-name',
   *     description: 'Name of the service to check'
   *   },
   *   handler: async (args) => {
   *     const serviceName = args[0];
   *     return {
   *       text: `Fetching status for ${serviceName}...`,
   *       json: { operation: 'status', service: serviceName }
   *     };
   *   }
   * });
   * 
   * // Add rollback command with version argument
   * commandTrie.addCommand({
   *   path: ['service', 'rollback'],
   *   description: 'Rollback service to a previous version',
   *   argument: {
   *     name: 'version',
   *     description: 'Target version to roll back to'
   *   },
   *   handler: async (args) => {
   *     const version = args[0];
   *     return {
   *       text: `Rolling back to version ${version}...`,
   *       json: { operation: 'rollback', targetVersion: version }
   *     };
   *   }
   * });
   * ```
   */
  addCommand(params: Omit<ConstructorParameters<typeof CommandNode>[0], 'fullPath' | 'parent'> & { path: string[] }): void {
    const { path, description, handler, argument } = params;
    
    if (!path?.length) {
      throw new Error("Command path cannot be empty");
    }

    let currentNode = this._root;
    const lastIndex = path.length - 1;

    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      const isLeaf = i === lastIndex;
      const fullPath = path.slice(0, i + 1);
      const children = currentNode.children;

      if (!children.has(segment)) {
        const newNode = new CommandNode({
          description: isLeaf ? description : `${segment} commands`,
          fullPath,
          parent: currentNode,
          handler: isLeaf ? handler : undefined,
          argument: isLeaf ? argument : undefined,
        });

        currentNode.addChild(segment, newNode);
        currentNode = newNode;
      } else {
        const existingNode = children.get(segment)!;
        if (isLeaf && existingNode.isLeaf) {
          throw new Error(`Duplicate leaf command: ${path.join(" ")}`);
        }
        if (!isLeaf && existingNode.isLeaf) {
          throw new Error(`Cannot add subcommand to leaf command: ${path.slice(0, i + 1).join(" ")}`);
        }
        
        currentNode = existingNode;
      }
    }
  }

  /**
   * Retrieves a command from the trie.
   * 
   * @param path The path of the command.
   * @returns The command node or undefined if not found.
   */
  getCommand(path: string[]): CommandNode | undefined {
    let current = this._root;

    for (const segment of path) {
      const children = current.children;
      const node = children.get(segment);
      if (!node) {
        return undefined;
      }
      current = node;
    }

    return current;
  }

  /**
   * Gets command completions for a given path.
   * 
   * @param path The path to get completions for.
   * @returns An array of completion strings.
   */
  getCompletions(path: string[]): string[] {
    let current = this._root;
    
    // Navigate to the last node in the path
    for (const segment of path.slice(0, -1)) {
      const children = current.children;
      const node = children.get(segment);
      if (!node) {
        return [];
      }
      current = node;
    }

    const lastSegment = path[path.length - 1] || "";
    const completions: string[] = [];
    const children = current.children;

    if (path.length > 0) {
      const node = children.get(lastSegment);
      if (node) {
        // If we have an exact match, return its children's names
        node.children.forEach((_node, key) => {
          completions.push(key);
        });
        return completions;
      }
    }

    // Otherwise return filtered completions from current level
    children.forEach((_node, key) => {
      if (key.startsWith(lastSegment)) {
        completions.push(key);
      }
    });

    return completions;
  }

  /**
   * Executes a command with the given path and arguments.
   * @param path The command path
   * @param args Arguments to pass to the command handler
   * @returns The command result or undefined if command not found
   * @throws Error if command validation fails
   */
  async executeCommand(path: string[], args: string[] = []): Promise<BaseCommandResult | undefined> {
    const command = this.getCommand(path);
    
    if (!command) {
      return undefined;
    }

    if (!command.hasHandler) {
      throw new Error(`Command '${path.join(' ')}' is not executable`);
    }

    if (command.requiresArgument && args.length === 0) {
      throw new Error(`Command '${path.join(' ')}' requires argument: ${command.argument?.name}`);
    }

    const handler = command.handler;
    if (!handler) {
      throw new Error(`Command '${path.join(' ')}' has no handler`);
    }

    return await handler(args);
  }

  /**
   * Gets all commands in the trie.
   * 
   * @returns An array of command paths.
   */
  getAllCommands(): string[][] {
    const paths: string[][] = [];

    const traverse = (node: CommandNode) => {
      if (node !== this._root) { // Skip the root node
        paths.push(node.fullPath);
      }
      node.children.forEach((child) => {
        traverse(child);
      });
    };

    traverse(this._root);
    return paths;
  }

  /**
   * Gets the root commands in the trie.
   * 
   * @returns An array of root command nodes.
   */
  getRootCommands(): CommandNode[] {
    return Array.from(this._root.children.values());
  }

  /**
   * Gets the leaf commands in the trie.
   * 
   * @returns An array of leaf command nodes.
   */
  getLeafCommands(): CommandNode[] {
    const leaves: CommandNode[] = [];

    const traverse = (node: CommandNode) => {
      if (node.isLeaf) {
        leaves.push(node);
      } else {
        node.children.forEach((child) => {
          traverse(child);
        });
      }
    };

    this._root.children.forEach((node) => {
      traverse(node);
    });

    return leaves;
  }

  /**
   * Validates the command trie structure for common errors.
   * 
   * Performs the following validations:
   * 1. Checks for duplicate command paths
   * 2. Ensures non-leaf nodes (nodes with children) use NoopHandler
   * 3. Ensures non-leaf nodes don't have arguments
   * 4. Verifies all nodes have a handler (either custom or NoopHandler)
   * 5. Validates command path uniqueness
   * 
   * @returns An object containing:
   *  - isValid: boolean indicating if the trie is valid
   *  - errors: array of error messages describing any validation failures
   * 
   * @example
   * ```typescript
   * const result = commandTrie.validate();
   * if (!result.isValid) {
   *   console.error('Command trie validation failed:');
   *   result.errors.forEach(error => console.error(error));
   * }
   * ```
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const seen = new Set<string>();
    
    const traverse = (node: CommandNode) => {
      if (node === this._root) {
        return; // Skip validation for root node
      }

      const pathStr = node.fullPath.join(" ");

      if (seen.has(pathStr)) {
        errors.push(`Duplicate command path: ${pathStr}`);
      }
      seen.add(pathStr);

      // All nodes must have a handler
      if (!node.handler) {
        errors.push(`Command missing handler: ${pathStr}`);
      }

      const children = node.children;
      if (children.size > 0) {
        // Non-leaf nodes should use NoopHandler
        if (node.handler !== NoopHandler) {
          errors.push(`Non-leaf command should use NoopHandler: ${pathStr}`);
        }
        if (node.argument) {
          errors.push(`Non-leaf command cannot have argument: ${pathStr}`);
        }

        children.forEach((child) => {
          traverse(child);
        });
      }
    };

    this._root.children.forEach((node) => {
      traverse(node);
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}