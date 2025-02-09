import { Logger } from '../utils/logger';
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
export abstract class BaseSegment {
  constructor(
    public readonly type: 'word' | 'argument' | 'null',
    public readonly name: string,
    public readonly description?: string
  ) {}

  toString(): string {
    return this.name;
  }
}

/** Represents a null segment for empty stack operations */
export class NullSegment extends BaseSegment {
  constructor() {
    super('null', '>null<', 'Empty segment');
  }
}

/** Represents a segment in a command path - either a word or argument */
export type CommandSegment = WordSegment | ArgumentSegment | NullSegment;

/** Represents a literal word in a command path */
export class WordSegment extends BaseSegment {
   constructor(
     name: string,
     description?: string
   ) {
     super('word', name, description);
   }
 }

/** Represents an argument that can be passed to a command, and its value*/
export class ArgumentSegment extends BaseSegment {
   constructor(
     name: string,
     description?: string,
     public value?: string,
     public readonly valid?: () => boolean
   ) {
     super('argument', name, description);
   }
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
   * Gets possible matches for a given path.
   * 
   * @param path The path to get completions for.
   * @returns An array of completion strings.
   */
  // used by AvailableCommands
  getCompletions_s(path: string[]): string[] {
    return this.getCompletions(path).map(segment => segment.name);
  }

  /**
   * Gets an array of segments reachable from a given path
   * 
   * @param path The path to get completions for.
   * @returns An array of completion strings.
   */
  getCompletions(path: string[]): CommandSegment[] {
    Logger.debug("[getCompletions] path: ", path);
    // If no path provided, get all top-level segments
    if (!path.length) {
      const topLevelSegments = this._commands.map(cmd => cmd.segments[0]);
      const isEqual = (a: CommandSegment, b: CommandSegment): boolean => 
        a.type === b.type && a.name === b.name;
      
      const uniqueSegments = topLevelSegments.filter((seg, index, self) =>
        index === self.findIndex(o => isEqual(o, seg))
      );

      return uniqueSegments;
    }

    const pathDepth = path.length;

    // Find all commands that match the current path prefix
    const matchingSegments = this._commands
      .filter(command => {
        const segments = command.segments;
        
        // Skip if command isn't long enough to have completions at this depth
        if (segments.length <= pathDepth - 1) {
          return false;
        }

        // Check if all segments up to current depth match
        for (let i = 0; i < pathDepth; i++) {
          const pathSegment = path[i];
          const cmdSegment = segments[i];
          
          // Handle argument segments (marked with '*' in path)
          if (pathSegment === '*' && cmdSegment.type === 'argument') {
            continue;
          }
          
          // Handle word segments
          if (pathSegment !== cmdSegment.name) {
            return false;
          }
        }
        return true;
      })
      .filter(command => command.segments.length > pathDepth)
      .map(command => {
        const segment = command.segments[pathDepth];
        const SegmentClass = segment.type === 'argument' ? ArgumentSegment : WordSegment;
        return new SegmentClass(segment.name, segment.description);
      });

    // Deduplicate segments based on type and name
    const uniqueSegments = matchingSegments.filter((segment, index, self) =>
      index === self.findIndex(s => 
        s.type === segment.type && s.name === segment.name
      )
    );

    return uniqueSegments;
  }

  hasNextSegment(path: string[]): boolean {
    return this.getCompletions(path).length > 0;
  }
}
