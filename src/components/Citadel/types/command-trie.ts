  /**
 * Represents the result of a command execution.
 * Can be extended for specific result types.
 */
export interface CommandResult {
  /** Optional JSON data returned by the command */
  json?: any;
  /** Optional text output returned by the command */
  text?: string;
}

/** Function type for handling command execution */
export type CommandHandler = (args: string[]) => Promise<CommandResult>;

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
export class CommandNode {
  private readonly fullPath: string[];
  private readonly description: string;
  private readonly children: Map<string, CommandNode>;
  private readonly argument?: CommandArgument;
  private readonly handler?: CommandHandler;
  private readonly parent?: CommandNode;

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
  constructor(params: {
    fullPath: string[];
    description: string;
    parent?: CommandNode;
    handler?: CommandHandler;
    argument?: CommandArgument;
  }) {
    if (!params.fullPath?.length) {
      throw new Error('Command path cannot be empty');
    }

    this.fullPath = params.fullPath;
    this.description = params.description;
    this.children = new Map<string, CommandNode>();
    this.argument = params.argument;
    this.handler = params.handler;
    this.parent = params.parent;
  }

  /**
   * Gets the name of the node.
   */
  get name(): string {
    return this.fullPath[this.fullPath.length - 1];
  }

  /**
   * Checks if the node is a leaf node.
   */
  get isLeaf(): boolean {
    return this.children.size === 0;
  }

  /**
   * Checks if the node has a handler function.
   */
  get hasHandler(): boolean {
    return !!this.handler;
  }

  /**
   * Checks if the node requires an argument.
   */
  get requiresArgument(): boolean {
    return !!this.argument;
  }

  /**
   * Gets the parent node.
   */
  getParent(): CommandNode | undefined {
    return this.parent;
  }

  /**
   * Gets the children nodes.
   */
  getChildren(): ReadonlyMap<string, CommandNode> {
    return this.children;
  }

  /**
   * Checks if the node has children.
   */
  hasChildren(): boolean {
    return this.children.size > 0;
  }

  /**
   * Adds a child node to the current node.
   * 
   * @param segment The segment of the child node.
   * @param node The child node.
   */
  addChild(segment: string, node: CommandNode): void {
    this.children.set(segment, node);
  }

  /**
   * Gets the root path of the node.
   */
  getRootPath(): string[] {
    const path: string[] = [];
    let current: CommandNode | undefined = this;

    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }

    return path;
  }

  /**
   * Gets the full path of the node.
   */
  getFullPath(): string[] {
    return this.fullPath;
  }

  /**
   * Gets the name of the node.
   */
  getName(): string {
    return this.getFullPath()[this.getFullPath().length - 1];
  }

  /**
   * Gets the description of the node.
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Gets the argument of the node.
   */
  getArgument(): CommandArgument | undefined {
    return this.argument;
  }

  /**
   * Checks if the node has an argument.
   */
  hasArgument(): boolean {
    return !!this.argument;
  }

  /**
   * Gets the handler function of the node.
   */
  getHandler(): CommandHandler | undefined {
    return this.handler;
  }
}

/**
 * A trie data structure for managing hierarchical commands.
 * Provides functionality for adding commands, retrieving commands,
 * and getting command completions.
 */
export class CommandTrie {
  private readonly root: CommandNode;

  /**
   * Creates a new CommandTrie instance.
   */
  constructor() {
    // Create a root node with a special path
    this.root = new CommandNode({
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

    let currentNode = this.root;
    const lastIndex = path.length - 1;

    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      const isLeaf = i === lastIndex;
      const fullPath = path.slice(0, i + 1);
      const children = currentNode.getChildren();

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
    let current = this.root;

    for (const segment of path) {
      const children = current.getChildren();
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
    let current = this.root;
    
    // Navigate to the last node in the path
    for (const segment of path.slice(0, -1)) {
      const children = current.getChildren();
      const node = children.get(segment);
      if (!node) {
        return [];
      }
      current = node;
    }

    const lastSegment = path[path.length - 1] || "";
    const completions: string[] = [];
    const children = current.getChildren();

    if (path.length > 0) {
      const node = children.get(lastSegment);
      if (node) {
        // If we have an exact match, return its children's names
        node.getChildren().forEach((_node, key) => {
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
   * Gets all commands in the trie.
   * 
   * @returns An array of command paths.
   */
  getAllCommands(): string[][] {
    const paths: string[][] = [];

    const traverse = (node: CommandNode) => {
      if (node !== this.root) { // Skip the root node
        paths.push(node.getFullPath());
      }
      node.getChildren().forEach((child) => {
        traverse(child);
      });
    };

    traverse(this.root);
    return paths;
  }

  /**
   * Gets the root commands in the trie.
   * 
   * @returns An array of root command nodes.
   */
  getRootCommands(): CommandNode[] {
    return Array.from(this.root.getChildren().values());
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
        node.getChildren().forEach((child) => {
          traverse(child);
        });
      }
    };

    this.root.getChildren().forEach((node) => {
      traverse(node);
    });

    return leaves;
  }

  /**
   * Validates the command trie structure for common errors.
   * 
   * Performs the following validations:
   * 1. Checks for duplicate command paths
   * 2. Ensures non-leaf nodes (nodes with children) don't have handlers
   * 3. Ensures non-leaf nodes don't have arguments
   * 4. Verifies leaf nodes have required handlers
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
      if (node === this.root) {
        return; // Skip validation for root node
      }

      const pathStr = node.getFullPath().join(" ");

      if (seen.has(pathStr)) {
        errors.push(`Duplicate command path: ${pathStr}`);
      }
      seen.add(pathStr);

      const children = node.getChildren();
      if (children.size > 0) {
        if (node.getHandler()) {
          errors.push(`Non-leaf command cannot have handler: ${pathStr}`);
        }
        if (node.getArgument()) {
          errors.push(`Non-leaf command cannot have argument: ${pathStr}`);
        }

        children.forEach((child) => {
          traverse(child);
        });
      } else {
        if (!node.getHandler()) {
          errors.push(`Leaf command missing handler: ${pathStr}`);
        }
      }
    };

    this.root.getChildren().forEach((node) => {
      traverse(node);
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}