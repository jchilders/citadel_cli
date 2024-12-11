import { CommandNode, CommandResult } from './command-trie';

export interface OutputItem {
  command: string[];
  timestamp: number;
  result: { json: any };
  error?: string;
  status: 'pending' | 'success' | 'timeout' | 'error';
}

export interface CitadelState {
  commandStack: string[];
  currentInput: string;
  isEnteringArg: boolean;
  currentNode?: CommandNode;
  output: OutputItem[];
  validation: {
    isValid: boolean;
    message?: string;
  };
}

export interface CitadelActions {
  setCommandStack: (stack: string[]) => void;
  setCurrentInput: (input: string) => void;
  setIsEnteringArg: (isEntering: boolean) => void;
  setCurrentNode: (node: CommandNode | undefined) => void;
  addOutput: (output: OutputItem) => void;
  setValidation: (validation: { isValid: boolean; message?: string }) => void;
  executeCommand: (path: string[], args?: string[]) => Promise<void>;
}
