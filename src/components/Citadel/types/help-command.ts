import { CommandRegistry } from './command-registry';
import { TextCommandResult } from './command-results';

export const createHelpHandler = (cmdRegistry: CommandRegistry) => {
  return async function() {
    const commandEntries = cmdRegistry.commands
      .filter(command => command.fullPath[0] !== 'help')
      .map(command => {
        const cmdPath = command.segments.map(segment => {
          if (segment.type === 'argument') {
            return `<${segment.name}>`;
          }
          return segment.name;
        });
        const commandLine = `${cmdPath.join(' ')} - ${command.description}`;
        const argumentLines = command.segments
          .filter((segment) => segment.type === 'argument' && segment.description)
          .map((segment) => `  <${segment.name}>: ${segment.description}`);

        return {
          commandLine,
          argumentLines,
        };
      })
      .sort((a, b) => a.commandLine.localeCompare(b.commandLine));

    const commands:string[] = commandEntries.flatMap((entry) => [
      entry.commandLine,
      ...entry.argumentLines,
    ]);

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
