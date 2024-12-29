import { CommandRegistry } from '../registry/CommandRegistry';
import { CommandStateManager } from '../registry/CommandStateManager';
import { CommandDocManager } from '../registry/CommandDocManager';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { CommandResult } from '../types/command-results';
import { CommandState } from '../types/command-state';
import { CommandDoc } from '../types/command-docs';
import { EventEmitter } from './EventEmitter';

interface CommandContext {
  command: string;
  args: string[];
  startTime: Date;
  environment: {
    userAgent: string;
    platform: string;
    language: string;
  };
  metadata: {};
}

interface CommandHistoryEntry {
  id: string;
  command: string;
  args: string[];
  timestamp: Date;
  startTime: Date;
  status: string;
  context: CommandContext;
  result?: CommandResult;
  error?: Error;
}

export class CommandService {
  private events = new EventEmitter();

  constructor(
    private readonly registry: CommandRegistry,
    private readonly stateManager: CommandStateManager,
    private readonly docManager: CommandDocManager,
    private readonly middlewareManager: MiddlewareManager,
  ) {}

  async executeCommand(commandLine: string): Promise<CommandResult> {
    // Parse command and args
    const [commandId, ...args] = commandLine.trim().split(/\s+/);
    const command = this.registry.get(commandId);

    if (!command) {
      throw new Error(`Command not found: ${commandId}`);
    }

    // Create execution context
    const context: CommandContext = {
      command: command.id,
      args: args.slice(1),
      startTime: new Date(),
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'node',
        platform: typeof navigator !== 'undefined' ? navigator.platform : process.platform,
        language: typeof navigator !== 'undefined' ? navigator.language : 'en-US'
      },
      metadata: {}
    };

    try {
      // Execute command through middleware pipeline
      const result = await this.middlewareManager.execute(context, async () => {
        return command.execute(args.slice(1));
      });

      // Update state
      const historyEntry: CommandHistoryEntry = {
        id: Date.now().toString(),
        command: command.id,
        args: args.slice(1),
        timestamp: new Date(),
        result,
        startTime: context.startTime,
        status: result.getStatus(),
        context
      };

      this.stateManager.addHistoryEntry(historyEntry);
      return result;

    } catch (error) {
      // Update state with error
      const historyEntry: CommandHistoryEntry = {
        id: Date.now().toString(),
        command: command.id,
        args: args.slice(1),
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
        startTime: context.startTime,
        status: 'error',
        context
      };

      this.stateManager.addHistoryEntry(historyEntry);
      throw error;
    }
  }

  getState(): CommandState {
    return this.stateManager.getState();
  }

  getDocs(commandId: string): CommandDoc | undefined {
    return this.docManager.getDocs(commandId);
  }

  searchDocs(query: string): CommandDoc[] {
    return this.docManager.searchDocs(query);
  }

  undo(): Promise<void> {
    return this.stateManager.undo();
  }

  redo(): Promise<void> {
    return this.stateManager.redo();
  }

  onStateChange(callback: (state: CommandState) => void): () => void {
    return this.events.on('stateChange', callback);
  }

  onCommandComplete(callback: (data: { commandId: string, result: CommandResult }) => void): () => void {
    return this.events.on('commandComplete', callback);
  }

  onCommandError(callback: (data: { commandId: string, error: Error }) => void): () => void {
    return this.events.on('commandError', callback);
  }
}
