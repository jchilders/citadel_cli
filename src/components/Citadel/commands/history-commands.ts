import { CommandNode } from '../types/command-trie';
import { TextCommandResult } from '../types/command-results';

export function createHistoryCommands(): [string, CommandNode] {
  const historyNode = new CommandNode({
    fullPath: ['history'],
    description: 'Command history management'
  });

  const showNode = new CommandNode({
    fullPath: ['history', 'show'],
    description: 'Show command history',
    handler: async (_args: string[]) => {
      return new TextCommandResult("Show command history - In progress");
    }
  });

  const clearNode = new CommandNode({
    fullPath: ['history', 'clear'],
    description: 'Clear command history',
    handler: async (_args: string[]) => {
      return new TextCommandResult('Clear command history - In progress');
    }
  });

  historyNode.addChild('show', showNode);
  historyNode.addChild('clear', clearNode);

  return ['history', historyNode];
}
