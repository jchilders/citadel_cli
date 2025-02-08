import { ArgumentSegment } from './command-trie';
import { CommandResult, PendingCommandResult } from './command-results';
import { CommandStorage, StoredCommand } from './storage';
import { SegmentStack } from './segment-stack';

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

  constructor(segmentStack: SegmentStack, result?: CommandResult) {
    this.command = segmentStack.toArray().map((segment): string => {
      if (segment.type === 'argument') {
        return (segment as ArgumentSegment).value;
      }
      return segment.name;
    });
    this.timestamp = Date.now();
    this.result = result ?? new PendingCommandResult();
  }
}

