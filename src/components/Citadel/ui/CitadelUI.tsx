import React, { useState, useCallback } from 'react';
import { Terminal } from './terminal/Terminal';
import { OutputView } from './output/OutputView';
import { CommandHistoryView } from './history/CommandHistoryView';
import { CommandState } from '../types/command-state';
import { CommandResult } from '../types/command-results';
import './CitadelUI.css';

interface CitadelUIProps {
  onCommand: (command: string) => Promise<CommandResult>;
  initialState?: CommandState;
}

export const CitadelUI: React.FC<CitadelUIProps> = ({
  onCommand,
  initialState,
}) => {
  const [state, setState] = useState<CommandState>(initialState || {
    history: [],
    context: {
      environment: {},
      startTime: new Date(),
      metadata: {},
    },
    status: 'ready',
    progress: 0,
    canUndo: false,
    canRedo: false,
  });

  const [currentResult, setCurrentResult] = useState<CommandResult>();
  const [currentError, setCurrentError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);

  const handleCommand = useCallback(async (command: string) => {
    setIsLoading(true);
    setCurrentError(undefined);
    
    try {
      const result = await onCommand(command);
      setCurrentResult(result);
      setState(prev => ({
        ...prev,
        history: [
          ...prev.history,
          {
            commandId: command.split(' ')[0],
            args: command.split(' ').slice(1),
            timestamp: new Date(),
            result,
          },
        ],
      }));
    } catch (error) {
      setCurrentError(error instanceof Error ? error : new Error(String(error)));
      setState(prev => ({
        ...prev,
        history: [
          ...prev.history,
          {
            commandId: command.split(' ')[0],
            args: command.split(' ').slice(1),
            timestamp: new Date(),
            error: error instanceof Error ? error : new Error(String(error)),
          },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  }, [onCommand]);

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
            entry => `${entry.commandId} ${entry.args.join(' ')}`
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
