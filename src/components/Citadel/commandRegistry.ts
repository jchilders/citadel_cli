import { Command, CommandResponse } from './types/command';

export class CommandRegistry {
  private commandTree: Map<string, Command> = new Map();

  registerCommand(command: Command, parentPath: string[] = []) {
    const fullPath = [...parentPath, command.name].join('.');
    this.commandTree.set(fullPath, command);

    // Recursively register subcommands, if any
    if (command.subcommands) {
      for (const subcommand of command.subcommands) {
        this.registerCommand(subcommand, [...parentPath, command.name]);
      }
    }
  }

  registerCommands(commands: Command[]) {
    for (const command of commands) {
      this.registerCommand(command);
    }
  }

  getSubcommands(commandPath: string[]): Command[] {
    const path = commandPath.join('.');
    const command = this.commandTree.get(path);
    
    return command?.subcommands || [];
  }

  getCommandByPath(commandPath: string[]): Command | undefined {
    const path = commandPath.join('.');
    return this.commandTree.get(path);
  }

  async executeCommand(commandPath: string[], args: string[]): Promise<CommandResponse | undefined> {
    const command = this.getCommandByPath(commandPath);
    
    if (!command) {
      return undefined;
    }

    if (!command.handler) {
      return undefined;
    }

    return command.handler(args);
  }

  // Helper method to get all root-level commands
  getRootCommands(): Command[] {
    const rootCommands: Command[] = [];
    
    for (const [path, command] of this.commandTree.entries()) {
      if (!path.includes('.')) {
        rootCommands.push(command);
      }
    }
    
    return rootCommands;
  }
}