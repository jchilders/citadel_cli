import { CommandNode } from './command-trie';
import { BaseCommandResult, PendingCommandResult } from './command-results';

export class OutputItem {
  readonly timestamp: number;
  readonly command: string[];
  result: BaseCommandResult;

  constructor(command: string[], result?: BaseCommandResult) {
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
