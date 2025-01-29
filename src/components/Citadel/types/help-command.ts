import { CommandNode, CommandTrie } from './command-trie';
import { CitadelConfig } from '../config/types';
import { TextCommandResult } from './command-results';

export const createHelpCommand = (trie: CommandTrie, config: CitadelConfig): [string, CommandNode] => {
  /**
   * Handles the help command, printing out all available leaf commands
   * with their descriptions. If includeHelpCommand is true, the help
   * command itself is also included in the output.
   * @returns TextCommandResult with a string containing a list of all
   * available commands.
   */
  const handler = async function(_args: string[]) {
    const commands = trie.getLeafCommands()
      .filter((cmd: CommandNode) => cmd.name !== 'help')
      .map((cmd: CommandNode) => {
        const cmdPath = cmd.fullPath.join(' ');
        const args = cmd.arguments.map(arg => 
          `<${arg.name}${arg.required ? '' : '?'}>`
        ).join(' ');
        const usage = [cmdPath, args].filter(Boolean).join(' ');
        return `${usage} - ${cmd.description}`;
      })
      .sort();

    // Add help command at the end if it's enabled
    if (config.includeHelpCommand) {
      commands.push('help - Show available commands');
    }

    return new TextCommandResult(
      commands.length > 0
        ? 'Available Commands:\n' + commands.join('\n')
        : 'No commands available yet. Add some commands to get started!'
    );
  };

  return ['help', new CommandNode({
    segments: [{ type: 'word', name: 'help' }],
    description: 'Show available commands',
    handler
  })];
};
