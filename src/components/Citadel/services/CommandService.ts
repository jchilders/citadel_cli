import { CommandRegistry } from '../registry/CommandRegistry';
import { CommandStateManager } from '../registry/CommandStateManager';
import { CommandDocManager } from '../registry/CommandDocManager';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { CommandResult } from '../types/command-results';
import { CommandDoc } from '../types/command-docs';
import { CommandState, CommandExecutionStatus } from '../types/command-state';
import { Command } from '../types/command-registry';
import { EventEmitter } from './EventEmitter';

export interface CommandContext {
  command: Command;
  args: string[];
  startTime: Date;
  environment: {
    userAgent: string;
    platform: string;
    language: string;
  };
  metadata: Record<string, any>;
}

export interface CommandHistoryEntry {
  id: string;
  command: Command;
  args: string[];
  timestamp: Date;
  startTime: Date;
  status: CommandExecutionStatus;
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
      command,
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
        command,
        args: args.slice(1),
        timestamp: new Date(),
        result,
        startTime: context.startTime,
        status: result.getStatus() === 'success' ? CommandExecutionStatus.Completed : 
               result.getStatus() === 'error' ? CommandExecutionStatus.Failed :
               result.getStatus() === 'cancelled' ? CommandExecutionStatus.Cancelled :
               CommandExecutionStatus.Ready,
        context
      };

      this.stateManager.addHistoryEntry(historyEntry);
      return result;

    } catch (error) {
      // Update state with error
      const historyEntry: CommandHistoryEntry = {
        id: Date.now().toString(),
        command,
        args: args.slice(1),
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
        startTime: context.startTime,
        status: CommandExecutionStatus.Failed,
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
