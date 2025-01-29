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
export class CommandNode {
  private _segments: CommandSegment[];
  private _description?: string;   // For `Help` command
  private _handler: CommandHandler;

  constructor(segments: CommandSegment[], description?: string, handler: CommandHandler = NoopHandler) {
    this._segments = segments;
    this._description = description;
    this._handler = handler;
  }

  get segments(): CommandSegment[] {
    return this._segments
  }

  get description(): string | undefined {
    return this._description;
  }

  get handler(): CommandHandler {
    return this._handler;
  }

  get arguments(): CommandArgument[] {
    return this.segments.filter((segment): segment is CommandArgument => segment.type === 'argument') || [];
  }

  get hasArguments(): boolean {
    return this.arguments.length > 0;
  }

  get fullPath(): string[] {
    const path: string[] = [];
    
    for (const segment of this.segments) {
      path.push(segment.type === 'word' ? segment.name : '*');
    }
    
    return path;
  }

  equals(other: CommandNode): boolean {
    return this.fullPath.join(' ') === other.fullPath.join(' ');
  }
}

/**
 * A trie data structure for managing hierarchical commands.
 * Provides functionality for adding commands, retrieving commands,
 * and getting command completions.
 */
export class CommandTrie {
  private _commands: CommandNode[] = [];

  /**
   * Adds a new command to the trie.
   * 
   * @param newCommandNode The new command to add
   * @throws {Error} If attempting to add a duplicate leaf command or a subcommand to a leaf
   * 
   */
  addCommand(segments: CommandSegment[], description: string, handler: CommandHandler = NoopHandler) {
    if (segments === undefined || segments.length === 0) {
      throw new Error('Command path cannot be empty');
    }

    const newCommandNode = new CommandNode(segments, description, handler);
    if (this.commandExistsForPath(newCommandNode.fullPath)) {
      throw new Error(`Duplicate command: ${newCommandNode.fullPath.join(' ')}`);
    }

    this._commands.push(newCommandNode);
  }

  /**
   * Retrieves a command from the trie.
   * 
   * @param path The path of the command.
   * @returns The command node or undefined if not found.
   */
  getCommand(path: string[]): CommandNode | undefined {
    return this._commands.find((command) => command.fullPath.join(' ') === path.join(' '));
  }

  commandExistsForPath(path: string[]): boolean {
    return this.getCommand(path) !== undefined;
  }

  /**
   * Gets command completions for a given path.
   * 
   * @param path The path to get completions for.
   * @returns An array of completion strings.
   */
  getCompletions(path: string[]): string[] {
    // If no path provided, get all top-level commands
    if (!path.length) {
      return [...new Set(this._commands.map(cmd => cmd.segments[0].name))];
    }

    const completions = new Set<string>();
    const pathDepth = path.length;

    // Find all commands that match the current path prefix
    this._commands.forEach(command => {
      const segments = command.segments;
      
      // Only look at commands that are long enough and match the path so far
      if (segments.length > pathDepth - 1) {
        let matches = true;
        
        // Check if all segments up to pathDepth-1 match
        for (let i = 0; i < pathDepth - 1; i++) {
          if (segments[i].name !== path[i] && path[i] !== '*') {
            matches = false;
            break;
          }
        }

        if (matches) {
          // Add the next segment name as a completion
          if (segments[pathDepth - 1]) {
            completions.add(segments[pathDepth - 1].name);
          }
        }
      }
    });

    return Array.from(completions);
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
      throw new Error(`Command '${path.join(' ')}' not found`);
    }

    return await command.handler(args);
  }
}
