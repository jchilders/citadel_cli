import { BaseCommand } from '../types/command-registry';
import { TextCommandResult } from '../types/command-results';

export class HelpCommand extends BaseCommand {
  constructor() {
    super('help', 'Show available commands');
  }

  async execute(_args: string[]): Promise<TextCommandResult> {
    return new TextCommandResult(`Available Commands:
help - Show available commands`);
  }
}
