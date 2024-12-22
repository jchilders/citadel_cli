import { Command } from '../types/command-registry';

/**
 * Mock command registry for testing
 */
export class MockCommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.getName(), command);
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  clear(): void {
    this.commands.clear();
  }
}
