import React from 'react';
import { CitadelState } from '../types/state';
import { useCitadelConfig } from '../config/CitadelConfigContext';
import { Logger } from '../utils/logger';

interface AvailableCommandsProps {
  state: CitadelState;
  availableCommands: string[];
}

export const AvailableCommands: React.FC<AvailableCommandsProps> = ({
  state,
  availableCommands
}) => {
  Logger.debug("[AvailableCommands] state: ", state);
  Logger.debug("[AvailableCommands] availableCommands: ", availableCommands);
  const config = useCitadelConfig();
  const showCommands = !state.isEnteringArg && availableCommands.length > 0;
  const containerClasses = "h-12 mt-2 border-t border-gray-700 px-4";
  const contentClasses = "text-gray-300 pt-2";

  // Show description for nodes at their last segment
  const isLastSegment = state.currentNode && 
    state.commandStack.length === state.currentNode.segments.length;

  // Sort commands and handle help command placement
  const sortedCommands = React.useMemo(() => {
    if (!state.commandStack.length && config.includeHelpCommand) {
      // At root level, ensure help command is last
      const nonHelpCommands = availableCommands.filter(cmd => cmd !== 'help');
      const helpCommand = availableCommands.find(cmd => cmd === 'help');
      return [...nonHelpCommands, ...(helpCommand ? [helpCommand] : [])];
    }
    return availableCommands;
  }, [availableCommands, state.commandStack, config.includeHelpCommand]);
  Logger.debug("[AvailableCommands] sortedCommands: ", sortedCommands);

  return (
    <div className={containerClasses} data-testid="available-commands">
      {isLastSegment ? (
        <div className={contentClasses}>
          {state.currentNode ? (
            <>
              <span className="text-blue-400">
                {state.currentNode.segments.map(seg => seg.toString()).join(' ')}
              </span>
              <span className="text-gray-400 ml-2">- {state.currentNode.description}</span>
            </>
          ) : null}
        </div>
      ) : showCommands ? (
        <div className={contentClasses}>
          <div className="flex flex-wrap gap-2">
            {sortedCommands.map((cmd) => {
              const boldLength = sortedCommands.reduce((length, other) => {
                if (other === cmd) return length;
                let commonPrefix = 0;
                while (
                  commonPrefix < cmd.length &&
                  commonPrefix < other.length &&
                  cmd[commonPrefix].toLowerCase() === other[commonPrefix].toLowerCase()
                ) {
                  commonPrefix++;
                }
                return Math.max(length, commonPrefix + 1);
              }, 1);

              return (
                <div
                  key={cmd}
                  className="px-2 py-1 rounded bg-gray-800 mr-2 last:mr-0"
                >
                  <span className="font-mono text-white">
                    <strong className="underline">{cmd.slice(0, boldLength)}</strong>
                    {cmd.slice(boldLength)}
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
