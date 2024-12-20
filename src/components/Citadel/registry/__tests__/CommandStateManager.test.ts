import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandStateManager, InMemoryStateStorage } from '../CommandStateManager';
import { Command } from '../../types/command-registry';
import { TextCommandResult } from '../../types/command-results';
import { CommandStatus } from '../../types/command-state';

describe('CommandStateManager', () => {
  let manager: CommandStateManager;
  let storage: InMemoryStateStorage;

  const createCommand = (id: string): Command => ({
    id,
    description: `Test command ${id}`,
    execute: async (args: string[]) => new TextCommandResult(args.join(' ')),
    getName: () => id
  });

  beforeEach(() => {
    storage = new InMemoryStateStorage();
    manager = new CommandStateManager(storage);
  });

  describe('state management', () => {
    it('should initialize with default state', () => {
      const state = manager.getState();
      expect(state.status).toBe(CommandStatus.Ready);
      expect(state.progress).toBe(0);
      expect(state.history).toHaveLength(0);
    });

    it('should update status and progress', () => {
      manager.updateStatus(CommandStatus.Running, 50);
      const state = manager.getState();
      expect(state.status).toBe(CommandStatus.Running);
      expect(state.progress).toBe(50);
    });

    it('should clamp progress values', () => {
      manager.updateStatus(CommandStatus.Running, 150);
      expect(manager.getState().progress).toBe(100);

      manager.updateStatus(CommandStatus.Running, -50);
      expect(manager.getState().progress).toBe(0);
    });
  });

  describe('history management', () => {
    it('should add and retrieve history entries', () => {
      const command = createCommand('test');
      const entry = {
        id: '1',
        command,
        args: ['hello'],
        startTime: new Date(),
        status: CommandStatus.Completed,
        context: {}
      };

      manager.addHistoryEntry(entry);
      expect(manager.getHistory()).toHaveLength(1);
      expect(manager.getHistory()[0]).toBe(entry);
    });

    it('should limit history retrieval', () => {
      const entries = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        command: createCommand(`test${i}`),
        args: ['test'],
        startTime: new Date(),
        status: CommandStatus.Completed,
        context: {}
      }));

      entries.forEach(entry => manager.addHistoryEntry(entry));
      expect(manager.getHistory(3)).toHaveLength(3);
      expect(manager.getHistory(3)[2].id).toBe('4');
    });

    it('should clear history', () => {
      manager.addHistoryEntry({
        id: '1',
        command: createCommand('test'),
        args: [],
        startTime: new Date(),
        status: CommandStatus.Completed,
        context: {}
      });

      manager.clearHistory();
      expect(manager.getHistory()).toHaveLength(0);
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });
  });

  describe('context management', () => {
    it('should update and retrieve context', () => {
      const context = {
        user: { id: 'user1', permissions: ['test'] },
        metadata: { key: 'value' }
      };

      manager.updateContext(context);
      expect(manager.getContext().user).toEqual(context.user);
      expect(manager.getContext().metadata).toEqual(context.metadata);
    });
  });

  describe('undo/redo', () => {
    let undoableCommand: Command & { undo?: () => Promise<void> };

    beforeEach(() => {
      undoableCommand = {
        ...createCommand('test'),
        undo: vi.fn().mockResolvedValue(undefined)
      };
    });

    it('should handle undo/redo state', () => {
      const entry = {
        id: '1',
        command: undoableCommand,
        args: ['test'],
        startTime: new Date(),
        status: CommandStatus.Completed,
        context: {}
      };

      // Initial state
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);

      // After adding command
      manager.addHistoryEntry(entry);
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
    });

    it('should execute undo', async () => {
      const entry = {
        id: '1',
        command: undoableCommand,
        args: ['test'],
        startTime: new Date(),
        status: CommandStatus.Completed,
        context: {}
      };

      manager.addHistoryEntry(entry);
      await manager.undo();

      expect(undoableCommand.undo).toHaveBeenCalled();
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);
    });

    it('should throw on invalid undo', async () => {
      await expect(manager.undo()).rejects.toThrow('No commands to undo');
    });

    it('should execute redo', async () => {
      const entry = {
        id: '1',
        command: undoableCommand,
        args: ['test'],
        startTime: new Date(),
        status: CommandStatus.Completed,
        context: {}
      };

      // Add and undo
      manager.addHistoryEntry(entry);
      await manager.undo();

      // Redo
      const executeSpy = vi.spyOn(undoableCommand, 'execute');
      await manager.redo();

      expect(executeSpy).toHaveBeenCalledWith(['test']);
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
    });

    it('should throw on invalid redo', async () => {
      await expect(manager.redo()).rejects.toThrow('No commands to redo');
    });
  });

  describe('persistence', () => {
    it('should save and load state', async () => {
      // Setup initial state
      manager.updateStatus(CommandStatus.Running, 50);
      manager.addHistoryEntry({
        id: '1',
        command: createCommand('test'),
        args: ['test'],
        startTime: new Date(),
        status: CommandStatus.Completed,
        context: {}
      });

      // Save state
      await manager.save();

      // Create new manager and load state
      const newManager = new CommandStateManager(storage);
      await newManager.load();

      // Verify state
      const state = newManager.getState();
      expect(state.status).toBe(CommandStatus.Running);
      expect(state.progress).toBe(50);
      expect(state.history).toHaveLength(1);
    });

    it('should handle load errors', async () => {
      const emptyStorage = new InMemoryStateStorage();
      const errorManager = new CommandStateManager(emptyStorage);
      await expect(errorManager.load()).rejects.toThrow('No state saved');
    });
  });
});
