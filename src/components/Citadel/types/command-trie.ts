  // Base result interface that can be extended for specific result types
export interface CommandResult {
  json?: any;
  text?: string;
}

export type CommandHandler = (args: string[]) => Promise<CommandResult>;

export interface CommandArgument {
  name: string;
  description: string;
}
export class CommandNode {
  private readonly fullPath: string[];
  private readonly description: string;
  private readonly children: Map<string, CommandNode>;
  private readonly argument?: CommandArgument;
  private readonly handler?: CommandHandler;
  private readonly parent?: CommandNode;

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

  get name(): string {
    return this.fullPath[this.fullPath.length - 1];
  }

  get isLeaf(): boolean {
    return this.children.size === 0;
  }

  get hasHandler(): boolean {
    return !!this.handler;
  }

  get requiresArgument(): boolean {
    return !!this.argument;
  }

  getChildren(): ReadonlyMap<string, CommandNode> {
    return this.children;
  }

  hasChildren(): boolean {
    return this.children.size > 0;
  }

  addChild(segment: string, node: CommandNode): void {
    this.children.set(segment, node);
  }

  getRootPath(): string[] {
    const path: string[] = [];
    let current: CommandNode | undefined = this;

    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }

    return path;
  }

  getFullPath(): string[] {
    return this.fullPath;
  }

  getName(): string {
    return this.getFullPath()[this.getFullPath().length - 1];
  }

  getDescription(): string {
    return this.description;
  }

  getArgument(): CommandArgument | undefined {
    return this.argument;
  }

  hasArgument(): boolean {
    return !!this.argument;
  }

  getHandler(): CommandHandler | undefined {
    return this.handler;
  }
}

export class CommandTrie {
  private readonly root: CommandNode;

  constructor() {
    // Create a root node with a special path
    this.root = new CommandNode({
      fullPath: ['ROOT'],
      description: 'Root command node'
    });
  }

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

  getRootCommands(): CommandNode[] {
    return Array.from(this.root.getChildren().values());
  }

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