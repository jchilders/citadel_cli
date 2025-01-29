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
  private readonly _segments: CommandSegment[];
  private readonly _description?: string;   // Used by `Help` command, etc.
  private readonly _handler: CommandHandler;

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

  get hasArguments(): boolean {
    return this.segments.some(segment => segment.type === 'argument');
  }

  get fullPath(): string[] {
    return this.segments.map(segment => segment.name);
  }

  get fullPath_s(): string {
    return this.fullPath.join(' ');
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

  get commands(): CommandNode[] {
    return this._commands;
  }

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
    const existingCommand = this._commands.find(cmd => {
      const cmdPattern = cmd.segments.map(segment => 
        segment.type === 'argument' ? '*' : segment.name
      ).join(' ');
      
      const newPattern = segments.map(segment => 
        segment.type === 'argument' ? '*' : segment.name
      ).join(' ');
      
      return cmdPattern === newPattern;
    });

    if (existingCommand) {
      throw new Error(`Duplicate commands: '${existingCommand.fullPath_s}' and '${newCommandNode.fullPath_s}'`);
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
    return this._commands.find((command) => {
      const fullPath = command.fullPath.join(' ');
      const searchPath = path.join(' ');
      return fullPath === searchPath;
    });
  }

  commandExistsForPath(path: string[]): boolean {
    // Convert the path to a pattern where arguments are represented by '*'
    const pathPattern = this._commands.map(cmd => 
      cmd.segments.map(segment => 
        segment.type === 'argument' ? '*' : segment.name
      ).join(' ')
    );

    // Convert the new path to a pattern
    const newPathPattern = path.map((segment, index) => {
      const isArgument = this._commands.some(cmd => 
        cmd.segments[index]?.type === 'argument'
      );
      return isArgument ? '*' : segment;
    }).join(' ');

    return pathPattern.includes(newPathPattern);
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
      
      // Skip if command isn't long enough to have completions at this depth
      if (segments.length <= pathDepth - 1) {
        return;
      }

      // Check if all segments up to current depth match
      let matches = true;
      for (let i = 0; i < pathDepth; i++) {
        const pathSegment = path[i];
        const cmdSegment = segments[i];
        
        // Handle argument segments (marked with '*' in path)
        if (pathSegment === '*' && cmdSegment.type === 'argument') {
          continue;
        }
        
        // Handle word segments
        if (pathSegment !== cmdSegment.name) {
          matches = false;
          break;
        }
      }

      if (matches && segments.length > pathDepth) {
        // Add the next segment name as a completion
        completions.add(segments[pathDepth].name);
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
