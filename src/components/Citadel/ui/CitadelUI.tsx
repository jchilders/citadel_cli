import * as React from 'react';
import { useState, useCallback } from 'react';
import { Terminal } from './terminal/Terminal';
import { OutputView } from './output/OutputView';
import { CommandHistoryView } from './history/CommandHistoryView';
import { CommandState, CommandExecutionStatus } from '../types/command-state';
import { CommandResult } from '../types/command-results';
import { Command } from '../types/command-registry';
import './CitadelUI.css';

interface CitadelUIProps {
  onCommand: (command: string) => Promise<CommandResult>;
  initialState?: CommandState;
  getCommand: (commandId: string) => Command;
}

export const CitadelUI: React.FC<CitadelUIProps> = ({
  onCommand,
  initialState,
  getCommand,
}) => {
  const [state, setState] = useState<CommandState>(initialState || {
    history: [],
    context: {
      environment: {},
      startTime: new Date(),
      metadata: {},
    },
    status: CommandExecutionStatus.Ready,
    progress: 0,
    canUndo: false,
    canRedo: false,
  });

  const [currentResult, setCurrentResult] = useState<CommandResult>();
  const [currentError, setCurrentError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);

  const handleCommand = useCallback(async (commandLine: string) => {
    setIsLoading(true);
    setCurrentError(undefined);
    
    const [commandId, ...args] = commandLine.trim().split(/\s+/);
    const command = getCommand(commandId);
    const startTime = new Date();
    
    try {
      const result = await onCommand(commandLine);
      setCurrentResult(result);
      setState(prev => ({
        ...prev,
        history: [
          ...prev.history,
          {
            id: `${commandId}-${startTime.getTime()}`,
            command,
            args,
            startTime,
            endTime: new Date(),
            status: CommandExecutionStatus.Completed,
            result,
            context: prev.context,
          },
        ],
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setCurrentError(err);
      setState(prev => ({
        ...prev,
        history: [
          ...prev.history,
          {
            id: `${commandId}-${startTime.getTime()}`,
            command,
            args,
            startTime,
            endTime: new Date(),
            status: CommandExecutionStatus.Failed,
            error: err,
            context: prev.context,
          },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  }, [onCommand, getCommand]);

  const handleHistorySelect = useCallback((command: string) => {
    handleCommand(command);
  }, [handleCommand]);

  const handleHistoryClear = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [],
    }));
  }, []);

  return (
    <div className="citadel-ui">
      <div className="citadel-main">
        <Terminal
          onCommand={handleCommand}
          history={state.history.map(
            entry => `${entry.command.id} ${entry.args.join(' ')}`
          )}
          disabled={isLoading}
        />
        <OutputView
          result={currentResult}
          error={currentError}
          loading={isLoading}
        />
      </div>
      <div className="citadel-sidebar">
        <CommandHistoryView
          history={state.history}
          onCommandSelect={handleHistorySelect}
          onCommandClear={handleHistoryClear}
        />
      </div>
    </div>
  );
};
