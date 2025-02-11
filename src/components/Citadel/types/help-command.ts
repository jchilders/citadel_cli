import { CommandRegistry } from './command-registry';
import { TextCommandResult } from './command-results';

export const createHelpHandler = (cmdRegistry: CommandRegistry) => {
  return async function(_args: string[]) {
    const commands:string[] = cmdRegistry.commands
      .filter(command => command.fullPath[0] !== 'help')
      .map(command => {
        const cmdPath = command.segments.map(segment => {
          if (segment.type === 'argument') {
            return `<${segment.name}>`;
          }
          return segment.name;
        });
        return `${cmdPath.join(' ')} - ${command.description}`;
      })
      .sort();

    commands.push('help - Show available commands');

    return new TextCommandResult(
      commands.length > 0
        ? 'Available Commands:\n' + commands.join('\n')
        : 'No commands available yet. Add some commands to get started!'
    );
  };
};
