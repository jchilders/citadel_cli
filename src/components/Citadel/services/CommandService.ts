import { CommandRegistry } from '../registry/CommandRegistry';
import { CommandStateManager } from '../registry/CommandStateManager';
import { CommandDocManager } from '../registry/CommandDocManager';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { OutputManager } from '../output/OutputManager';
import { CommandResult } from '../types/command-results';
import { CommandState } from '../types/command-state';
import { CommandDoc } from '../types/command-docs';
import { EventEmitter } from './EventEmitter';

export class CommandService {
  private events = new EventEmitter();

  constructor(
    private readonly registry: CommandRegistry,
    private readonly stateManager: CommandStateManager,
    private readonly docManager: CommandDocManager,
    private readonly middlewareManager: MiddlewareManager,
    private readonly outputManager: OutputManager,
  ) {}

  async executeCommand(commandLine: string): Promise<CommandResult> {
    // Parse command and args
    const [commandId, ...args] = commandLine.trim().split(/\s+/);
    const command = this.registry.get(commandId);

    if (!command) {
      throw new Error(`Command not found: ${commandId}`);
    }

    // Create execution context
    const context = {
      commandId,
      args,
      startTime: new Date(),
      environment: typeof window !== 'undefined' ? { 
        userAgent: window.navigator.userAgent,
        platform: window.navigator.platform,
        language: window.navigator.language
      } : {},
      metadata: {},
    };

    try {
      // Execute through middleware pipeline
      const result = await this.middlewareManager.execute(context, () => 
        command.execute(args)
      );

      // Update state
      this.stateManager.addHistoryEntry({
        commandId,
        args,
        timestamp: new Date(),
        result,
      });

      // Emit events
      this.events.emit('commandComplete', { commandId, result });

      return result;
    } catch (error) {
      // Update state with error
      this.stateManager.addHistoryEntry({
        commandId,
        args,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });

      // Emit error event
      this.events.emit('commandError', { commandId, error });

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
