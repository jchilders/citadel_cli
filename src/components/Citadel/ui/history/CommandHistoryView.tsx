import React from 'react';
import { CommandHistoryViewProps } from '../types';
import './CommandHistoryView.css';

export const CommandHistoryView: React.FC<CommandHistoryViewProps> = ({
  history,
  onCommandSelect,
  onCommandClear,
}) => {
  if (!history.length) {
    return (
      <div className="history-empty">
        <span>No commands in history</span>
      </div>
    );
  }

  return (
    <div className="history-view">
      <div className="history-header">
        <h3>Command History</h3>
        <button
          className="history-clear-btn"
          onClick={onCommandClear}
          title="Clear history"
        >
          Clear
        </button>
      </div>
      <div className="history-list">
        {history.map((entry, index) => (
          <div
            key={`${entry.commandId}-${entry.timestamp.getTime()}`}
            className="history-item"
            onClick={() => onCommandSelect(`${entry.commandId} ${entry.args.join(' ')}`)}
          >
            <div className="history-item-header">
              <span className="history-item-command">{entry.commandId}</span>
              <span className="history-item-time">
                {entry.timestamp.toLocaleTimeString()}
              </span>
            </div>
            {entry.args.length > 0 && (
              <div className="history-item-args">
                {entry.args.join(' ')}
              </div>
            )}
            {entry.error ? (
              <div className="history-item-error">
                {entry.error.message}
              </div>
            ) : entry.result && (
              <div className="history-item-result">
                Success
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
