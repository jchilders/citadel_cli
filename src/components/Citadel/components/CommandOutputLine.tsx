import React from 'react';
import { Spinner } from './Spinner';
import { CommandStatus } from '../types/command-results';

interface CommandOutputLineProps {
  command: string;
  timestamp: string;
  status: CommandStatus;
}

export const CommandOutputLine: React.FC<CommandOutputLineProps> = ({
  command,
  timestamp,
  status
}) => {
  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="text-gray-200">
        &gt; {command.split(' ').map((part, i) => {
          const isArg = part.startsWith('<') && part.endsWith('>');
          return (
            <span 
              key={i} 
              className={isArg ? 'text-green-400' : 'text-gray-200'}
            >
              {i > 0 ? ' ' : ''}{part}
            </span>
          );
        })}
      </span>
      <span className="text-gray-400">·</span>
      <span className="text-gray-500">{timestamp}</span>
      {status === CommandStatus.Pending && <Spinner />}
      {status === CommandStatus.Success && (
        <div 
          data-testid="success-indicator"
          className="w-4 h-4 rounded-full bg-green-500" 
        />
      )}
      {(status === CommandStatus.Timeout || status === CommandStatus.Failure) && (
        <div 
          data-testid="success-indicator"
          className="w-4 h-4 rounded-full bg-red-500" 
        />
      )}
    </div>
  );
};
