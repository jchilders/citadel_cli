import { BaseCommand, ICommandRegistry } from '../types/command-registry';
import { TextCommandResult, JsonCommandResult } from '../types/command-results';
import { validateCommandArguments } from '../validation/command-validation';

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
  constructor(private readonly registry: ICommandRegistry) {
    super(
      'system.help',
      'Display help information',
      { name: 'command', description: 'Command to get help for (optional)' }
    );
  }

  async execute(args: string[]): Promise<TextCommandResult> {
    if (args.length === 0) {
      return this.listAllCommands();
    }

    const commandId = args[0];
    const command = this.registry.get(commandId);
    
    if (!command) {
      return new TextCommandResult(`Command not found: ${commandId}`);
    }

    return this.showCommandHelp(command);
  }

  private async listAllCommands(): Promise<TextCommandResult> {
    const commands = this.registry.list();
    const categories = new Map<string, BaseCommand[]>();

    // Group commands by category
    for (const command of commands) {
      const category = command.id.split('.')[0];
      const categoryCommands = categories.get(category) || [];
      categoryCommands.push(command);
      categories.set(category, categoryCommands);
    }

    // Format output
    const lines: string[] = ['Available Commands:'];
    
    for (const [category, categoryCommands] of categories) {
      lines.push(`\n${category}:`);
      for (const command of categoryCommands) {
        lines.push(`  ${command.id.padEnd(20)} ${command.description}`);
      }
    }

    lines.push('\nUse "system.help <command>" for detailed information about a command');
    return new TextCommandResult(lines.join('\n'));
  }

  private showCommandHelp(command: BaseCommand): TextCommandResult {
    const lines: string[] = [
      `Command: ${command.id}`,
      `Description: ${command.description}`
    ];

    if (command.argument) {
      lines.push('\nArguments:');
      lines.push(`  ${command.argument.name}: ${command.argument.description}`);
    }

    const metadata = this.registry.getMetadata(command.id);
    if (metadata) {
      lines.push('\nMetadata:');
      if (metadata.permissions) {
        lines.push(`  Required Permissions: ${metadata.permissions.join(', ')}`);
      }
      if (metadata.timeout) {
        lines.push(`  Timeout: ${metadata.timeout}ms`);
      }
      if (metadata.rateLimits) {
        lines.push(`  Rate Limits: ${metadata.rateLimits.maxRequests} requests per ${metadata.rateLimits.timeWindow}ms`);
      }
    }

    return new TextCommandResult(lines.join('\n'));
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
