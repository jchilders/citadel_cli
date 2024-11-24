import { DuplicateCommandError } from './types/duplicate_command_error';
import { CommandExecutionError } from './types/command_execution_error';
import { Command } from './types/command';

export class CommandRegistry {
  #commandTree = new Map<string, Command>();

  registerCommand(command: Command, parentPath: string[] = []): void {
    const fullPath = [...parentPath, command.name].join('.');
    
    if (this.#commandTree.has(fullPath)) {
      throw new DuplicateCommandError(fullPath);
    }

    this.#commandTree.set(fullPath, command);

    if (command.subcommands) {
      for (const subcommand of command.subcommands) {
        try {
          this.registerCommand(subcommand, [...parentPath, command.name]);
        } catch (error) {
          // If a subcommand fails to register, clean up the parent command
          this.#commandTree.delete(fullPath);
          throw error;
        }
      }
    }
  }

  registerCommands(commands: Command[]): void {
    const registeredPaths: string[] = [];

    try {
      for (const command of commands) {
        this.registerCommand(command);
        registeredPaths.push(command.name);
      }
    } catch (error) {
      // Rollback: remove all commands that were registered in this batch
      for (const path of registeredPaths) {
        this.#commandTree.delete(path);
      }
      throw error;
    }
  }

  async executeCommand(commandPath: string[], args: string[]): Promise<unknown> {
    const path = commandPath.join('.');
    const command = this.#commandTree.get(path);
    
    if (!command) {
      return undefined;
    }

    if (!command.handler) {
      return undefined;
    }

    try {
      return await command.handler(args);
    } catch (error) {
      throw new CommandExecutionError(
        `Failed to execute command: ${path}`,
        path,
        error as Error
      );
    }
  }

  getSubcommands(commandPath: string[]): Command[] {
    const path = commandPath.join('.');
    const command = this.#commandTree.get(path);
    
    return command?.subcommands || [];
  }

  getCommandByPath(commandPath: string[]): Command | undefined {
    const path = commandPath.join('.');
    return this.#commandTree.get(path);
  }

  getRootCommands(): Command[] {
    const rootCommands: Command[] = [];
    
    for (const [path, command] of this.#commandTree.entries()) {
      if (!path.includes('.')) {
        rootCommands.push(command);
      }
    }
    
    return rootCommands;
  }
}