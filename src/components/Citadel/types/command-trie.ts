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

export interface CommandNode {
  name: string;
  description: string;
  fullPath: string[];
  children?: Map<string, CommandNode>;
  argument?: CommandArgument;
  handler?: CommandHandler;
}

export class CommandTrie {
  private root: Map<string, CommandNode>;

  constructor() {
    this.root = new Map<string, CommandNode>();
  }

  /**
   * Adds a command to the trie
   * @param path Array of command names forming the path to this command
   * @param description Description of the command
   * @param handler Optional handler function for leaf commands
   * @param argument Optional argument for leaf commands
   * @throws Error if attempting to add a duplicate command
   */
  addCommand(
    path: string[],
    description: string,
    handler?: CommandHandler,
    argument?: CommandArgument
  ): void {
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
        current.set(segment, {
          name: segment,
          description: isLeaf ? description : `${segment} commands`,
          fullPath,
          children: isLeaf ? undefined : new Map<string, CommandNode>(),
          handler: isLeaf ? handler : undefined,
          argument: isLeaf ? argument : undefined,
        });
      } else {
        const existingNode = current.get(segment)!;
        if (isLeaf && (!existingNode.children || existingNode.children.size === 0)) {
          throw new Error(`Duplicate leaf command: ${path.join(" ")}`);
        }
        if (!isLeaf && !existingNode.children) {
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
    const prefix = path[path.length - 1] || "";
    const completions: string[] = [];

    current.forEach((_node, key) => {
      if (key.startsWith(prefix)) {
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

      // Validate leaf nodes
      if (!node.children || node.children.size === 0) {
        if (!node.handler) {
          errors.push(`Leaf command missing handler: ${pathStr}`);
        }
      } else {
        // Validate non-leaf nodes
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
