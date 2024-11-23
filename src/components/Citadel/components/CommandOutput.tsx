import { formatResponse } from '../../../utils/responseFormatter';
import { useEffect } from 'react';
import { OutputItem } from '../types/state';

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