import React from 'react';
import { CommandNode, NoopHandler } from '../types/command-trie';
import { CitadelState } from '../types/state';
import { useCitadelConfig } from '../config/CitadelConfigContext';

interface AvailableCommandsProps {
  state: CitadelState;
  availableCommands: CommandNode[];
}

export const AvailableCommands: React.FC<AvailableCommandsProps> = ({
  state,
  availableCommands
}) => {
  const config = useCitadelConfig();
  const containerClasses = "h-12 mt-2 border-t border-gray-700 px-4";
  const contentClasses = "text-gray-300 pt-2";

  // Show argument description if entering argument
  if (state.isEnteringArg && state.currentNode?.argument) {
    return (
      <div className={containerClasses} data-testid="available-commands">
        <div className={contentClasses}>
          <span className="font-mono text-white">
            <span className="text-blue-400">{state.currentNode.argument.name}</span>
            <span className="text-gray-400 ml-2">- {state.currentNode.argument.description}</span>
          </span>
        </div>
      </div>
    );
  }

  // Show command description for leaf nodes
  if (state.currentNode?.isLeaf) {
    return (
      <div className={containerClasses} data-testid="available-commands">
        <div className={contentClasses}>
          <span className="font-mono text-white">
            <span className="text-blue-400">{state.currentNode.name}</span>
            <span className="text-gray-400 ml-2">- {state.currentNode.description}</span>
          </span>
        </div>
      </div>
    );
  }

  // Sort commands and handle help command placement
  const sortedCommands = React.useMemo(() => {
    if (!state.commandStack.length && config.includeHelpCommand) {
      // At root level, ensure help command is last
      const nonHelpCommands = availableCommands.filter(cmd => cmd.name !== 'help');
      const helpCommand = availableCommands.find(cmd => cmd.name === 'help');
      return [...nonHelpCommands, ...(helpCommand ? [helpCommand] : [])];
    }
    return availableCommands;
  }, [availableCommands, state.commandStack, config.includeHelpCommand]);

  // Show available commands for non-leaf nodes
  return (
    <div className={containerClasses} data-testid="available-commands">
      {availableCommands.length > 0 && (
        <div className={contentClasses}>
          <div className="flex flex-wrap gap-2">
            {sortedCommands.map((cmd) => {
              const boldLength = sortedCommands.reduce((length, other) => {
                if (other.name === cmd.name) return length;
                let commonPrefix = 0;
                while (
                  commonPrefix < cmd.name.length &&
                  commonPrefix < other.name.length &&
                  cmd.name[commonPrefix].toLowerCase() === other.name[commonPrefix].toLowerCase()
                ) {
                  commonPrefix++;
                }
                return Math.max(length, commonPrefix + 1);
              }, 1);

              return (
                <div
                  key={cmd.fullPath.join('.')}
                  className="px-2 py-1 rounded bg-gray-800 mr-2 last:mr-0"
                >
                  <span className="font-mono text-white">
                    <strong className="underline">{cmd.name.slice(0, boldLength)}</strong>
                    {cmd.name.slice(boldLength)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};