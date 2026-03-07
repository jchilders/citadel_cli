import { CommandRegistry } from './command-registry';
import { formatCommandNameWithPrefix, getCommandPrefixLengths } from './command-prefix';
import { TextCommandResult } from './command-results';

export const createHelpHandler = (cmdRegistry: CommandRegistry) => {
  return async function() {
    const prefixLengthCache = new Map<string, Map<string, number>>();
    const getPrefixLengthsForPath = (path: string[]) => {
      const key = path.join(' ');
      const existing = prefixLengthCache.get(key);
      if (existing) {
        return existing;
      }
      const lengths = getCommandPrefixLengths(
        cmdRegistry.getCompletions(path).filter(segment => segment.type === 'word')
      );
      prefixLengthCache.set(key, lengths);
      return lengths;
    };
    const commandEntries = cmdRegistry.commands
      .filter(command => command.fullPath[0] !== 'help')
      .map(command => {
        const rawCmdPath = command.segments.map(segment => {
          if (segment.type === 'argument') {
            return `<${segment.name}>`;
          }
          return segment.name;
        });
        const displayCmdPath = command.segments.map((segment, index) => {
          if (segment.type === 'argument') {
            return `<${segment.name}>`;
          }
          const path = command.segments
            .slice(0, index)
            .map((prevSegment) => (prevSegment.type === 'argument' ? '*' : prevSegment.name));
          const prefixLengths = getPrefixLengthsForPath(path);
          return formatCommandNameWithPrefix(segment.name, prefixLengths);
        });
        const commandLine = `${displayCmdPath.join(' ')} - ${command.description}`;
        const argumentLines = command.segments
          .filter((segment) => segment.type === 'argument' && segment.description)
          .map((segment) => `  <${segment.name}>: ${segment.description}`);

        return {
          commandLine,
          sortKey: rawCmdPath.join(' '),
          argumentLines,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    const commands:string[] = commandEntries.flatMap((entry) => [
      entry.commandLine,
      ...entry.argumentLines,
    ]);

    if (commands.length === 0) {
      return new TextCommandResult(
        'No commands available yet. Add some commands to get started!'
      );
    }

    const rootPrefixLengths = getPrefixLengthsForPath([]);
    commands.push(`${formatCommandNameWithPrefix('help', rootPrefixLengths)} - Show available commands`);

    return new TextCommandResult(
      'Available Commands:\n' + commands.join('\n')
    );
  };
};
