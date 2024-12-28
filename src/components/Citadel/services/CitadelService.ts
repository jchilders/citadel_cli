import { CommandRegistry } from '../registry/CommandRegistry';
import { CommandStateManager } from '../registry/CommandStateManager';
import { CommandDocManager } from '../registry/CommandDocManager';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { ErrorCommandResult, BaseCommandResult, TextCommandResult } from '../types/command-results';
import { CitadelState, CitadelActions, OutputItem } from '../types/state';
import { CommandDoc } from '../types/command-docs';
import { CommandNode, CommandTrie } from '../types/command-trie';
import { EventEmitter } from './EventEmitter';
import { CommandExecutionStatus } from '../types/command-state';

export class CitadelService {
  private events = new EventEmitter();
  private commandTrie: CommandTrie;
  private state: CitadelState;

  constructor(
    private readonly registry: CommandRegistry,
    private readonly stateManager: CommandStateManager,
    private readonly docManager: CommandDocManager,
    private readonly middlewareManager: MiddlewareManager,
  ) {
    this.commandTrie = new CommandTrie();
    this.state = {
      commandStack: [],
      currentInput: '',
      isEnteringArg: false,
      currentNode: undefined,
      output: [],
      validation: { isValid: true }
    };
    this.initializeCommands();
  }

  private initializeCommands() {
    this.registry.getAllCommands().forEach(command => {
      const path = command.id.split('.');
      this.commandTrie.addCommand({
        path,
        description: command.description,
        argument: command.argument,
        handler: args => command.execute(args)
      });
    });
  }

  getCommandTrie(): CommandTrie {
    return this.commandTrie;
  }

  getAvailableCommands(currentPath: string[] = []): CommandNode[] {
    const node = this.commandTrie.getCommand(currentPath);
    if (node?.hasChildren) {
      return Array.from(node.children.values());
    }
    return this.commandTrie.getRootCommands();
  }

  createActions(): CitadelActions {
    return {
      setCommandStack: (stack: string[]) => {
        this.state.commandStack = stack;
        this.state.currentNode = this.commandTrie.getCommand(stack);
        this.events.emit('stateChange', this.state);
      },

      setCurrentInput: (input: string) => {
        this.state.currentInput = input;
        this.events.emit('stateChange', this.state);
      },

      setIsEnteringArg: (isEntering: boolean) => {
        this.state.isEnteringArg = isEntering;
        this.events.emit('stateChange', this.state);
      },

      setCurrentNode: (node: CommandNode | undefined) => {
        this.state.currentNode = node;
        this.events.emit('stateChange', this.state);
      },

      addOutput: (output: OutputItem) => {
        this.state.output.push(output);
        this.events.emit('stateChange', this.state);
      },

      setValidation: (validation: { isValid: boolean; message?: string }) => {
        this.state.validation = validation;
        this.events.emit('stateChange', this.state);
      },

      executeCommand: async (path: string[], args?: string[]) => {
        const command = this.registry.get(path.join('.'));
        if (!command) return;

        const outputItem = new OutputItem([...path, ...(args || [])]);
        this.state.output.push(outputItem);
        this.events.emit('stateChange', this.state);

        try {
          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              const result = new TextCommandResult('Command timed out after 10 seconds');
              result.markTimeout();
              reject(result);
            }, 10000);
          });

          // Race between command execution and timeout
          const result = await Promise.race([
            this.middlewareManager.execute(
              {
                command: command,
                args: args || [],
                startTime: new Date(),
                metadata: typeof window !== 'undefined' ? { 
                  userAgent: window.navigator.userAgent,
                  platform: window.navigator.platform,
                  language: window.navigator.language
                } : {},
              },
              () => command.execute(args || [])
            ),
            timeoutPromise
          ]);

          // Mark as success and update state history
          if (result instanceof BaseCommandResult) {
            result.markSuccess();
          }

          // Update state history
          this.stateManager.addHistoryEntry({
            command: command,
            args: args || [],
            timestamp: new Date(),
            result: result
          });

          // Update output
          outputItem.result = result;
          this.events.emit('stateChange', this.state);
          this.events.emit('commandComplete', { commandId: path.join('.'), result });

        } catch (error) {
          // If it's already a BaseCommandResult (like our timeout result), use it
          const errorResult = error instanceof BaseCommandResult ? error :
            new ErrorCommandResult(error instanceof Error ? error.message : 'Unknown error');

          // Update state history
          this.stateManager.addHistoryEntry({
            id: error.id,
            context: {},
            status: CommandExecutionStatus.Failed,
            command: command,
            args: args || [],
            startTime: new Date(),
            error: error instanceof Error ? error : new Error(String(error)),
          });

          // Update output
          outputItem.result = errorResult;
          this.events.emit('stateChange', this.state);
          this.events.emit('commandError', { 
            commandId: path.join('.'), 
            error: error instanceof Error ? error : new Error(String(error))
          });
        }
      }
    };
  }

  getState(): CitadelState {
    return { ...this.state };
  }

  getDocs(commandId: string): CommandDoc | undefined {
    return this.docManager.getDocs(commandId);
  }

  searchDocs(query: string): CommandDoc[] {
    return this.docManager.searchDocs(query);
  }

  onStateChange(callback: (state: CitadelState) => void): () => void {
    return this.events.on('stateChange', callback);
  }

  onCommandComplete(callback: (data: { commandId: string, result: CommandResult }) => void): () => void {
    return this.events.on('commandComplete', callback);
  }

  onCommandError(callback: (data: { commandId: string, error: Error }) => void): () => void {
    return this.events.on('commandError', callback);
  }
}
