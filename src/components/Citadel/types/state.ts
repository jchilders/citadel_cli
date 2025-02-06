import { CommandSegment } from './command-trie';
import { CommandResult, PendingCommandResult } from './command-results';
import { CommandStorage, StoredCommand } from './storage';

export interface CitadelState {
  currentInput: string;
  isEnteringArg: boolean;
  output: OutputItem[];
  history: {
    commands: StoredCommand[];
    position: number | null;
    savedInput: StoredCommand | null;
    storage?: CommandStorage;
  };
}

export interface CitadelActions {
  setCurrentInput: (input: string) => void;
  setIsEnteringArg: (isEntering: boolean) => void;
  addOutput: (output: OutputItem) => void;
  executeCommand: () => Promise<void>;
  executeHistoryCommand: (index: number) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export class OutputItem {
  readonly timestamp: number;
  readonly command: string[];
  result: CommandResult;

  constructor(command: string[] | CommandSegment[], result?: CommandResult) {
    this.command = command.map(segment => 
      typeof segment === 'string' ? segment : segment.toString()
    );
    this.timestamp = Date.now();
    this.result = result ?? new PendingCommandResult();
  }
}

