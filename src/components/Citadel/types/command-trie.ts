import { CommandResult, TextCommandResult } from './command-results';

/** Function type for handling command execution */
export type CommandHandler = (args: string[]) => Promise<CommandResult>;

/**
 * A no-op handler that returns an empty string. Used as the default handler
 * for CommandNodes that don't specify a handler.
 */
export const NoopHandler: CommandHandler = async (_args) => {
  return new TextCommandResult('');
};

/** Base interface for command segments */
export interface BaseCommandSegment {
  type: 'word' | 'argument';
  name: string;
  description?: string;
}

/** Represents a segment in a command path - either a word or argument */
export type CommandSegment = CommandWord | CommandArgument;

/** Represents a literal word in a command path */
export interface CommandWord extends BaseCommandSegment {
  type: 'word';
}

/** Represents an argument that can be passed to a command */
export interface CommandArgument extends BaseCommandSegment {
  type: 'argument';
  required?: boolean;
  value?: any,
  valid?: ( ) => boolean;
}

/** Defines a complete command with its path and behavior */
export interface CommandDefinition {
  path: CommandSegment[];
  description?: string;
  handler?: CommandHandler;
}

/** Represents a command's unique signature for quick lookup */
export interface CommandSignature {
  signature: string[];
  node: CommandNode;
}

export class CommandNode {
  private _segment: CommandSegment; // CommandWord or CommandArgument
  private _description
  private _children: Map<string, CommandNode>;
  private _handler?: CommandHandler;
  private _parent?: CommandNode;
  private _signature?: string;
  private _arguments: CommandArgument[];

  constructor(definition: CommandDefinition, parent?: CommandNode) {
    const [segment, ...remainingPath] = definition.path;
    this._segment = segment;
    this._description = definition.description || '';
    this._children = new Map();
    this._handler = remainingPath.length === 0 ? definition.handler : undefined;
    this._parent = parent;
    this._arguments = definition.path
      .filter((segment): segment is CommandArgument => segment.type === 'argument') || [];
  }

  get segment(): CommandSegment {
    return this._segment;
  }

  get arguments(): CommandArgument[] {
    return this._arguments;
  }

  get isArgument(): boolean {
    return this._segment.type === 'argument';
  }

  get name(): string {
    return this._segment.name;
  }

  /**
   * Whether this is a leaf node (has no children)
   */
  get isLeaf(): boolean {
    return this._children.size === 0;
  }

  get hasHandler(): boolean {
    return this._handler !== undefined;
  }

  get requiresArgument(): boolean {
    return this._arguments.length > 0;
  }

  get parent(): CommandNode | undefined {
    return this._parent;
  }

  get signature(): string | undefined {
    return this._signature;
  }

  get fullPath(): string[] {
    const path: string[] = [];
    let current: CommandNode | undefined = this;
    
    while (current && current._segment) {
      // Skip the ROOT node
      if (current.name !== 'ROOT') {
        path.unshift(current.name);
      }
      current = current._parent;
    }
    
    return path;
  }

  /**
   * Sets the signature for this command based on the current command trie state
   * @param trie The command trie to use for signature generation
   */
  setSignature(trie: CommandTrie): void {
    const sig = trie.buildSignatureForCommand(this);
    this._signature = sig.signature.join('');
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
   * Gets the command's description
   */
  get description(): string {
    return this._description;
  }


  /**
   * Gets the command's handler
   */
  get handler(): CommandHandler {
    return this._handler || NoopHandler;
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
  private static readonly ROOT_NODE: CommandNode = new CommandNode({
    path: [{ type: 'word', name: 'ROOT' }],
    description: 'Root command node'
  });

  private readonly _root: CommandNode;

  /**
   * Creates a new CommandTrie instance.
   */
  constructor() {
    this._root = CommandTrie.ROOT_NODE;
  }

  /**
   * Gets the root node of the command trie
   */
  static get root(): CommandNode {
    return CommandTrie.ROOT_NODE;
  }

  /**
   * Adds a new command to the trie.
   * 
   * @param commandDefinition Parameters for the command.
   * @param params.path The path segments for the command (e.g., ['service', 'deploy'])
   * @param params.description Description of what the command does
   * @param params.handler Optional function to execute when command is invoked
   * @param params.argument Optional argument definition for the command
   * @throws {Error} If attempting to add a duplicate leaf command or a subcommand to a leaf
   * 
   */
  addCommand(commandDefinition: CommandDefinition): void {
    const { path, description, handler } = commandDefinition;
    
    if (!path?.length) {
      throw new Error("Command path cannot be empty");
    }

    let currentNode = this._root;
    const lastIndex = path.length - 1;

    for (let i = 0; i < path.length; i++) {
      const segment = path[i]; // CommandWord or CommandArgument
      const isLeaf = i === lastIndex;
      const children = currentNode.children;

      if (!children.has(segment.name)) {
        const newNode = new CommandNode({
          path: [segment],
          description: description,
          handler: isLeaf ? handler : NoopHandler
        }, currentNode);

        currentNode.addChild(segment.name, newNode);
        currentNode = newNode;
        // this.setSignatures();
      } else {
        const existingNode = children.get(segment.name)!;
        if (isLeaf && existingNode.isLeaf) {
          throw new Error(`Duplicate command: ${path.map(s => s.name).join(" ")}`);
        }
        if (!isLeaf && existingNode.isLeaf) {
          throw new Error(`Cannot add subcommand to leaf command: ${path.slice(0, i + 1).map(s => s.name).join(" ")}`);
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
  async executeCommand(path: string[], args: string[] = []): Promise<CommandResult | undefined> {
    const command = this.getCommand(path);

    if (!command) {
      return undefined;
    }

    if (!command.hasHandler) {
      throw new Error(`Command '${path.join(' ')}' is not executable`);
    }

    const handler = command.handler;
    if (!handler) {
      throw new Error(`Command '${path.join(' ')}' has no handler`);
    }

    return await handler(args);
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
   * Retrieves a command using its unique signature.
   * A signature is the minimal sequence of prefixes that uniquely identifies a command.
   * 
   * @param signature Array of minimal prefixes that uniquely identify the command
   * @returns The matching command node or undefined if not found
   * 
   * @example
   * // Will match 'image random cat' command
   * getCommandBySignature(['i', 'r', 'c'])
   * // Will match 'user show' command (not ambiguous with 'user status')
   * getCommandBySignature(['u', 'sh'])
   */
  getCommandBySignature(signature: CommandSignature): CommandNode | undefined {
    // Handle empty signature or root case
    if (!signature.signature.length) return undefined;

    let current = this._root;

    for (const prefix of signature.signature) {
      if (!prefix) return undefined;

      // Find all children that match this prefix
      const matches = Array.from(current.children.entries())
        .filter(([key]) => key.toLowerCase().startsWith(prefix.toLowerCase()));

      // If no matches found, the signature is invalid
      if (matches.length === 0) {
        return undefined;
      }

      // If multiple matches, check if one exactly matches the prefix
      if (matches.length > 1) {
        const exactMatch = matches.find(([key]) =>
          key.toLowerCase() === prefix.toLowerCase()
        );
        if (!exactMatch) {
          return undefined;
        }
        current = exactMatch[1];
      } else {
        current = matches[0][1];
      }
    }

    // Don't return the root node
    return current === this._root ? undefined : current;
  }

  /**
   * Generates a minimal unique signature for a command node.
   * The signature consists of the shortest prefixes that uniquely identify each segment
   * in the path from root to this node.
   * 
   * @param command The command node to generate a signature for
   * @returns Array of minimal prefixes that uniquely identify the command
   * 
   * @example
   * // For commands: ['image', 'random', 'cat'] and ['image', 'random', 'dog']
   * buildSignatureForCommand(catCommand) // returns ['i', 'r', 'c']
   * // For commands: ['user', 'show'] and ['user', 'status']
   * buildSignatureForCommand(showCommand) // returns ['u', 'sh']
   */
  buildSignatureForCommand(_command: CommandNode): CommandSignature {
    throw new Error(
      'No implemented yet'
    );
    // if (!command || command === this._root) {
    //   return { signature: [] };
    // }
    //
    // const signature: string[] = [];
    // let current: CommandNode | undefined = command;
    // const path: CommandNode[] = [];
    //
    // // Build path from node to root
    // while (current && current !== this._root) {
    //   path.unshift(current);
    //   current = current.parent;
    // }
    //
    // // Now build signature going down from root
    // current = this._root;
    // 
    // for (const node of path) {
    //   const segment = node.name;
    //   
    //   // Get all siblings at this level
    //   const siblings = Array.from(current.children.keys());
    //   
    //   // Find minimum prefix length needed to uniquely identify this segment
    //   let prefixLength = 1;
    //   let found = false;
    //   
    //   while (prefixLength <= segment.length) {
    //     const prefix = segment.slice(0, prefixLength);
    //     const prefixLower = prefix.toLowerCase();
    //     
    //     // Count how many siblings match this prefix length
    //     const matches = siblings.filter(
    //       sib => sib.toLowerCase().startsWith(prefixLower)
    //     );
    //     
    //     // Only consider it a match if it uniquely identifies our target segment
    //     if (matches.length === 1 && matches[0].toLowerCase() === segment.toLowerCase()) {
    //       signature.push(prefix);
    //       found = true;
    //       break;
    //     }
    //     
    //     prefixLength++;
    //   }
    //   
    //   // If we haven't found a unique prefix, use the full segment
    //   if (!found) {
    //     signature.push(segment);
    //   }
    //
    //   current = node;
    // }
    //
    // return { signature };
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
  /**
   * Updates signatures for all nodes in the trie
   */
  // setSignatures(): void {
  //   const traverse = (node: CommandNode) => {
  //     if (node !== this._root) {
  //       node.setSignature(this);
  //     }
  //     node.children.forEach(child => traverse(child));
  //   };
  //   
  //   traverse(this._root);
  // }

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
        // if (node.argument) {
        //   errors.push(`Non-leaf command cannot have argument: ${pathStr}`);
        // }

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
