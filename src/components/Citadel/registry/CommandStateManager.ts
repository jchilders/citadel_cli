import {
  CommandState,
  CommandContext,
  CommandHistoryEntry,
  ICommandStateManager,
  IStateStorage,
  CommandExecutionStatus
} from '../types/command-state';

/**
 * Manages command state and history
 */
export class CommandStateManager implements ICommandStateManager {
  private state: CommandState;
  private readonly maxHistory: number = 100;
  private redoStack: CommandHistoryEntry[] = [];

  constructor(
    private readonly storage: IStateStorage,
    initialState?: Partial<CommandState>
  ) {
    this.state = {
      history: [],
      context: {
        environment: {},
        startTime: new Date(),
        metadata: {}
      },
      status: CommandExecutionStatus.Ready,
      progress: 0,
      canUndo: false,
      canRedo: false,
      ...initialState
    };
    this.redoStack = [];
  }

  getState(): CommandState {
    return { ...this.state };
  }

  getHistory(limit?: number): CommandHistoryEntry[] {
    const history = [...this.state.history];
    return limit ? history.slice(-limit) : history;
  }

  addHistoryEntry(entry: CommandHistoryEntry): void {
    // Clear redo stack when new command is executed
    this.redoStack = [];
    this.state.canRedo = false;
    
    // Add to history
    this.state.history.push(entry);
    
    // Update undo state
    this.state.canUndo = true;

    // Trim history if needed
    if (this.state.history.length > this.maxHistory) {
      this.state.history.shift();
    }
  }

  clearHistory(): void {
    this.state.history = [];
    this.redoStack = [];
    this.state.canUndo = false;
    this.state.canRedo = false;
  }

  updateStatus(status: CommandExecutionStatus, progress?: number): void {
    this.state.status = status;
    if (progress !== undefined) {
      this.state.progress = Math.max(0, Math.min(100, progress));
    }
  }

  getContext(): CommandContext {
    return { ...this.state.context };
  }

  updateContext(context: Partial<CommandContext>): void {
    this.state.context = {
      ...this.state.context,
      ...context
    };
  }

  canUndo(): boolean {
    return this.state.canUndo;
  }

  canRedo(): boolean {
    return this.state.canRedo;
  }

  async undo(): Promise<void> {
    if (!this.canUndo()) {
      throw new Error('No commands to undo');
    }

    const lastEntry = this.state.history.pop();
    if (!lastEntry) return;

    // Add to redo stack
    this.redoStack.push(lastEntry);

    // Update state
    this.state.canRedo = true;
    this.state.canUndo = this.state.history.length > 0;

    // Execute undo if command supports it
    const command = lastEntry.command as any;
    if (command.undo) {
      await command.undo(lastEntry.args, lastEntry.context);
    }
  }

  async redo(): Promise<void> {
    if (!this.canRedo()) {
      throw new Error('No commands to redo');
    }

    const nextEntry = this.redoStack.pop();
    if (!nextEntry) return;

    // Add back to history
    this.state.history.push(nextEntry);

    // Update state
    this.state.canUndo = true;
    this.state.canRedo = this.redoStack.length > 0;

    // Re-execute command
    await nextEntry.command.execute(nextEntry.args);
  }

  async save(): Promise<void> {
    await this.storage.saveState(this.state);
  }

  async load(): Promise<void> {
    this.state = await this.storage.loadState();
    
    // Recompute undo/redo state
    this.state.canUndo = this.state.history.length > 0;
    this.state.canRedo = false;
  }
}

/**
 * In-memory state storage implementation
 */
export class InMemoryStateStorage implements IStateStorage {
  private state?: CommandState;

  async saveState(state: CommandState): Promise<void> {
    this.state = { ...state };
  }

  async loadState(): Promise<CommandState> {
    if (!this.state) {
      throw new Error('No state saved');
    }
    return { ...this.state };
  }

  async clearState(): Promise<void> {
    this.state = undefined;
  }
}

/**
 * Local storage state storage implementation
 */
export class LocalStorageStateStorage implements IStateStorage {
  constructor(private readonly key: string = 'command_state') {}

  async saveState(state: CommandState): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(state));
  }

  async loadState(): Promise<CommandState> {
    const data = localStorage.getItem(this.key);
    if (!data) {
      throw new Error('No state saved');
    }

    const state = JSON.parse(data);
    
    // Convert date strings back to Date objects
    state.context.startTime = new Date(state.context.startTime);
    state.history.forEach((entry: CommandHistoryEntry) => {
      entry.startTime = new Date(entry.startTime);
      if (entry.endTime) {
        entry.endTime = new Date(entry.endTime);
      }
    });

    return state;
  }

  async clearState(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

export { CommandExecutionStatus } from '../types/command-state';
