import { useEffect } from 'react';
import { OutputItem } from '../types';

interface CommandOutputProps {
  output: OutputItem[];
  outputRef: React.RefObject<HTMLDivElement>;
}

export const CommandOutput: React.FC<CommandOutputProps> = ({ output, outputRef }) => {
  // Scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const formatResponse = (response: unknown) => {
    if (typeof response === 'object' && response !== null) {
      const entries = Object.entries(response);
      return (
        <div className="pl-4 text-sm">
          {entries.map(([key, value], index) => (
            <div key={key} className={Array.isArray(response) ? "text-gray-400" : ""}>
              <strong className="text-gray-300">{key}</strong>
              <span className="text-gray-400">: {formatResponse(value)}</span>
              {index < entries.length - 1 && (
                <span className="text-gray-400">{Array.isArray(response) ? "," : ", "}</span>
              )}
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-gray-400">{String(response)}</span>;
  };

  return (
    <div ref={outputRef} className="max-h-64 overflow-y-auto p-4 font-mono">
    {output.map((item, index) => (
      <div key={index} className="mb-3">
        <div className="text-gray-500 text-sm">{item.command}</div>
        {formatResponse(item.response)}
      </div>
    ))}
  </div>
  );
};