import { CommandNode } from './command-trie';
import { CommandResult, PendingCommandResult } from './command-results';

export class OutputItem {
  readonly timestamp: number;
  readonly command: string[];
  result: CommandResult;

  constructor(command: string[], result?: CommandResult) {
    this.command = command;
    this.timestamp = Date.now();
    this.result = result ?? new PendingCommandResult();
  }
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
