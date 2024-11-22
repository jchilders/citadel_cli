import { Loader2 } from 'lucide-react';
import { Cursor } from '../Cursor';
import { defaultCursorConfig } from '../cursor-config';

interface CommandInputProps {
  isLoading: boolean;
  commandStack: string[];
  input: string;
  inputValidation: {
    isValid: boolean;
    message?: string;
  };
}

export const CommandInput: React.FC<CommandInputProps> = ({
  isLoading,
  commandStack,
  input,
  inputValidation
}) => {
  return (
    <div className="flex items-center mb-2">
      <div className="text-gray-400 mr-2">
        {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : '⟩'}
      </div>
      <div className="font-mono">
        {commandStack.join(' ')}
        {commandStack.length > 0 && ' '}
        {input}
        <Cursor
          style={defaultCursorConfig}
          isValid={inputValidation.isValid}
          errorMessage={inputValidation.message}
        />
      </div>
    </div>
  );
};