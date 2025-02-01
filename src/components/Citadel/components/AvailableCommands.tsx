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
  const showCommands = !state.isEnteringArg && availableCommands.length > 0;
  const containerClasses = "h-12 mt-2 border-t border-gray-700 px-4";
  const contentClasses = "text-gray-300 pt-2";

  // Show description for leaf nodes without handlers or arguments
  const isLeafNode = state.currentNode?.isLeaf && state.currentNode.handler === NoopHandler && !state.currentNode.requiresArgument;

  // Sort commands and handle help command placement
  const sortedCommands = React.useMemo(() => {
    if (!state.commandStack.length && config.includeHelpCommand) {
      // At root level, ensure help command is last
      const nonHelpCommands = availableCommands.filter(cmd => cmd.fullPath_s !== 'help');
      const helpCommand = availableCommands.find(cmd => cmd.fullPath_s === 'help');
      return [...nonHelpCommands, ...(helpCommand ? [helpCommand] : [])];
    }
    return availableCommands;
  }, [availableCommands, state.commandStack, config.includeHelpCommand]);

  return (
    <div className={containerClasses} data-testid="available-commands">
      {isLeafNode ? (
        <div className={contentClasses}>
          {state.currentNode ? (
            <>
              <span className="text-blue-400">{state.currentNode.fullPath_s}</span>
              <span className="text-gray-400 ml-2">- {state.currentNode.description}</span>
            </>
          ) : null}
        </div>
      ) : showCommands ? (
        <div className={contentClasses}>
          <div className="flex flex-wrap gap-2">
            {sortedCommands.map((cmd) => {
              const boldLength = sortedCommands.reduce((length, other) => {
                if (other.fullPath_s === cmd.fullPath_s) return length;
                let commonPrefix = 0;
                while (
                  commonPrefix < cmd.fullPath_s.length &&
                  commonPrefix < other.fullPath_s.length &&
                  cmd.fullPath_s[commonPrefix].toLowerCase() === other.fullPath_s[commonPrefix].toLowerCase()
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
                    <strong className="underline">{cmd.fullPath_s.slice(0, boldLength)}</strong>
                    {cmd.fullPath_s.slice(boldLength)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={contentClasses}>{state.currentNode?.description}</div>
      )}
    </div>
  );
};