import React from 'react';
import { Spinner } from './Spinner';

interface CommandOutputLineProps {
  command: string;
  timestamp: string;
  status: 'pending' | 'success';
}

export const CommandOutputLine: React.FC<CommandOutputLineProps> = ({
  command,
  timestamp,
  status
}) => {
  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="text-gray-200">&gt; {command}</span>
      <span className="text-gray-400">·</span>
      <span className="text-gray-500">{timestamp}</span>
      {status === 'pending' && <Spinner />}
      {status === 'success' && (
        <div 
          data-testid="success-indicator"
          className="w-4 h-4 rounded-full bg-green-500" 
        />
      )}
    </div>
  );
};
