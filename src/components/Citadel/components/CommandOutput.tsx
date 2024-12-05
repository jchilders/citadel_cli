import React, { useEffect } from 'react';
import { OutputItem } from '../types/state';

interface CommandOutputProps {
  output: OutputItem[];
  outputRef: React.RefObject<HTMLDivElement>;
}

const formatCommandOutput = (result: OutputItem['result']) => {
  if (result.text) {
    return <pre className="text-gray-200">{result.text}</pre>;
  }
  
  if (result.json) {
    return (
      <pre className="text-gray-200">
        {JSON.stringify(result.json, null, 2)}
      </pre>
    );
  }
  
  return null;
};

export const CommandOutput: React.FC<CommandOutputProps> = ({ output, outputRef }) => {
  // Scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div 
      ref={outputRef} 
      className="max-h-64 overflow-y-auto p-4 font-mono bg-gray-900 rounded-lg"
    >
      {output.length === 0 ? (
        <div className="text-gray-500">No output available</div>
      ) : (
        output.map((item, index) => (
          <div key={`${item.timestamp}-${index}`} className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500 text-sm">
                $ {item.command.join(' ')}
              </span>
              <span className="text-xs text-gray-600">
                {new Date(item.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {item.error ? (
              <div className="text-red-400">{item.error}</div>
            ) : (
              formatCommandOutput(item.result)
            )}
          </div>
        ))
      )}
    </div>
  );
};