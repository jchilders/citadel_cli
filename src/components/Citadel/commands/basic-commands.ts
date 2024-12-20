import { BaseCommand } from '../types/command-registry';
import { TextCommandResult, JsonCommandResult } from '../types/command-results';
import { validateCommandArguments } from '../utils/command-validation';

/**
 * Echo command that repeats the input back
 */
export class EchoCommand extends BaseCommand {
  constructor() {
    super(
      'system.echo',
      'Echo back the input',
      { name: 'message', description: 'Message to echo back' }
    );
  }

  async execute(args: string[]): Promise<TextCommandResult> {
    return new TextCommandResult(args.join(' '));
  }
}

/**
 * Help command that displays information about available commands
 */
export class HelpCommand extends BaseCommand {
  constructor() {
    super(
      'system.help',
      'Display help information',
      { name: 'command', description: 'Command to get help for' }
    );
  }

  async execute(args: string[]): Promise<TextCommandResult> {
    // This will be implemented when we have the registry available
    return new TextCommandResult('Help system not yet implemented');
  }
}

/**
 * Calculator command that performs basic math operations
 */
export class CalculatorCommand extends BaseCommand {
  constructor() {
    super(
      'math.add',
      'Add a list of numbers',
      { name: 'numbers', description: 'Space-separated numbers to add' }
    );
  }

  async execute(args: string[]): Promise<JsonCommandResult> {
    validateCommandArguments(args, undefined);
    
    const numbers = args.map(arg => {
      const num = Number(arg);
      if (isNaN(num)) {
        throw new Error(`Invalid number: ${arg}`);
      }
      return num;
    });

    const sum = numbers.reduce((a, b) => a + b, 0);
    return new JsonCommandResult({ result: sum });
  }
}
