import { CommandRegistry } from './command-registry';
import { TextCommandResult } from './command-results';

export const createHelpHandler = (cmdRegistry: CommandRegistry) => {
  return async function() {
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

    if (commands.length === 0) {
      return new TextCommandResult(
        'No commands available yet. Add some commands to get started!'
      );
    }

    commands.push('help - Show available commands');

    return new TextCommandResult(
      'Available Commands:\n' + commands.join('\n')
    );
  };
};
