import { Command } from './command-registry';
import { BaseCommandResult } from './command-results';

/**
 * Command execution status
 */
export enum CommandExecutionStatus {
  Ready = 'ready',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled'
}

/**
 * Entry in the command history
 */
export interface CommandHistoryEntry {
  id: string;
  command: Command;
  args: string[];
  startTime: Date;
  endTime?: Date;
  status: CommandExecutionStatus;
  result?: BaseCommandResult;
  error?: Error;
  context: Record<string, any>;
}

/**
 * Command execution context
 */
export interface CommandContext {
  user?: {
    id: string;
    permissions: string[];
  };
  environment: Record<string, any>;
  startTime: Date;
  metadata: Record<string, any>;
}

/**
 * Command state
 */
export interface CommandState {
  history: CommandHistoryEntry[];
  context: CommandContext;
  status: CommandExecutionStatus;
  progress: number;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Interface for managing command state
 */
export interface ICommandStateManager {
  /**
   * Get current command state
   */
  getState(): CommandState;

  /**
   * Get command history
   */
  getHistory(limit?: number): CommandHistoryEntry[];

  /**
   * Add entry to history
   */
  addHistoryEntry(entry: CommandHistoryEntry): void;

  /**
   * Clear history
   */
  clearHistory(): void;

  /**
   * Update command status
   */
  updateStatus(status: CommandExecutionStatus, progress?: number): void;

  /**
   * Get current context
   */
  getContext(): CommandContext;

  /**
   * Update context
   */
  updateContext(context: Partial<CommandContext>): void;

  /**
   * Check if undo is available
   */
  canUndo(): boolean;

  /**
   * Check if redo is available
   */
  canRedo(): boolean;

  /**
   * Undo last command
   */
  undo(): Promise<void>;

  /**
   * Redo last undone command
   */
  redo(): Promise<void>;

  /**
   * Save state to storage
   */
  save(): Promise<void>;

  /**
   * Load state from storage
   */
  load(): Promise<void>;
}

/**
 * Interface for state persistence
 */
export interface IStateStorage {
  /**
   * Save state
   */
  saveState(state: CommandState): Promise<void>;

  /**
   * Load state
   */
  loadState(): Promise<CommandState>;

  /**
   * Clear state
   */
  clearState(): Promise<void>;
}
