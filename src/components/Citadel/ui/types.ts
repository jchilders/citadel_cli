import { CommandResult } from '../types/command-results';
import { CommandState, CommandHistoryEntry } from '../types/command-state';

export interface TerminalProps {
  onCommand: (command: string) => Promise<void>;
  history: string[];
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export interface TerminalState {
  commandHistory: string[];
  historyIndex: number;
  currentInput: string;
}

export interface CommandHistoryViewProps {
  history: CommandHistoryEntry[];
  onCommandSelect: (command: string) => void;
  onCommandClear: () => void;
}

export interface CommandDocViewProps {
  commandId?: string;
  onClose: () => void;
}

export interface OutputViewProps {
  result?: CommandResult;
  error?: Error;
  loading?: boolean;
}

export interface CommandStateViewProps {
  state: CommandState;
}
