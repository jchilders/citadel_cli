import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CommandRegistry } from '../../../../services/commands/CommandRegistry';
import { useCitadelKeyboard } from '../useCitadelKeyboard';
import { CommandValidationStrategy, DefaultCommandValidationStrategy } from '../../validation/command_validation_strategy';

vi.mock('react', () => ({
  useCallback: (fn: Function) => fn,
  useEffect: vi.fn(),
}));

describe('useCitadelKeyboard', () => {
  const mockActions = {
    open: vi.fn(),
    setClosing: vi.fn(),
    close: vi.fn(),
    reset: vi.fn(),
    setCommandStack: vi.fn(),
    setInput: vi.fn((_newInput: string) => {}),
    setCurrentArg: vi.fn(),
    setAvailable: vi.fn(),
    setInputValidation: vi.fn(),
  };

  const mockCommandProcessor = {
    getAvailableCommands: vi.fn(),
    getCommandFromStack: vi.fn(),
    executeCommand: vi.fn(),
    updateFilteredCommands: vi.fn(),
  };

  const mockCommandRegistry: vi.Mocked<CommandRegistry> = {
    getCommandByPath: vi.fn(),
    commandTree: {},
    registerCommand: vi.fn(),
    registerCommands: vi.fn(),
    executeCommand: vi.fn(),
    getCommands: vi.fn(),
    getCommandTree: vi.fn(),
  };

  const initialState = {
    isOpen: false,
    isClosing: false,
    commandStack: [],
    currentArg: null,
    input: '',
    available: [],
    output: [],
    isLoading: false,
    inputValidation: { isValid: true },
  };

  class MockCommandValidationStrategy implements CommandValidationStrategy {
    validate = vi.fn().mockReturnValue({ isValid: true });
  }

  const setupKeyboardTest = (initialStateOverrides = {},
    validationStrategy: CommandValidationStrategy = new MockCommandValidationStrategy()
  ) => {
    const state = {
      ...initialState,
      isOpen: true,
      ...initialStateOverrides
    };

    const kb = useCitadelKeyboard({
      state,
      validationStrategy: validationStrategy,
      commandRegistry: mockCommandRegistry,
      actions: mockActions,
      commandProcessor: mockCommandProcessor,
    });

    return { kb, state };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call open() action when "." key is pressed and Citadel is closed', () => {
    const kb =
      useCitadelKeyboard({
        state: initialState,
        validationStrategy: new MockCommandValidationStrategy(),
        commandRegistry: mockCommandRegistry,
        actions: mockActions,
        commandProcessor: mockCommandProcessor,
      });

    // Simulate pressing the '.' key
    const event = new KeyboardEvent('keydown', { key: '.' });
    kb.handleKeyDown(event);

    expect(mockActions.open).toHaveBeenCalledTimes(1);
  });

  it('should handle escape key to close Citadel', async () => {
    // Create state with Citadel open
    const state = {
      ...initialState,
      isOpen: true
    };

    vi.useFakeTimers();

    const kb = useCitadelKeyboard({
      state,
      validationStrategy: new MockCommandValidationStrategy(),
      commandRegistry: mockCommandRegistry,
      actions: mockActions,
      commandProcessor: mockCommandProcessor,
    });

    // Simulate pressing the Escape key
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    await kb.handleKeyDown(event);

    // Verify immediate actions
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(mockActions.setClosing).toHaveBeenCalledWith(true);

    // Fast-forward timers to trigger setTimeout callback
    vi.advanceTimersByTime(150);

    // Verify actions after timeout
    expect(mockActions.close).toHaveBeenCalledTimes(1);
    expect(mockActions.reset).toHaveBeenCalledTimes(1);

    // Cleanup
    vi.useRealTimers();
  });

  describe('Backspace handling', () => {
    it('should handle backspace with non-empty input by removing last character', () => {
      const { kb } = setupKeyboardTest({ input: 'test' });
  
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      kb.handleKeyDown(event);
  
      expect(mockActions.setInput).toHaveBeenCalledWith('tes');
      expect(mockCommandProcessor.updateFilteredCommands).toHaveBeenCalled();
    });
  
    it('should handle backspace with empty input by clearing command stack', () => {
      const { kb } = setupKeyboardTest({
        input: '',
        commandStack: ['some', 'command']
      });
  
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      kb.handleKeyDown(event);
  
      expect(mockActions.setCommandStack).toHaveBeenCalledWith(['some']);
      expect(mockActions.setInput).toHaveBeenCalledWith('');
      expect(mockActions.setCurrentArg).toHaveBeenCalledWith(null);
      expect(mockCommandProcessor.getAvailableCommands).toHaveBeenCalled();
      expect(mockActions.setAvailable).toHaveBeenCalled();
    });
  });

  describe('Enter handling', () => {
    const createEnterEvent = () => new KeyboardEvent('keydown', { key: 'Enter' });
  
    it('should execute command with input when command has args', async () => {
      const { kb } = setupKeyboardTest({
        input: 'test-input',
        commandStack: ['command'],
        currentArg: { name: 'arg1', type: 'string' }
      });
  
      mockCommandRegistry.getCommandByPath.mockReturnValue({ args: true });
      
      await kb.handleKeyDown(createEnterEvent());
  
      expect(mockCommandProcessor.executeCommand).toHaveBeenCalledWith(
        ['command'],
        ['test-input']
      );
    });
  
    it('should execute command without args when command has no args', async () => {
      const { kb } = setupKeyboardTest({
        commandStack: ['command'],
        currentArg: null
      });
  
      mockCommandRegistry.getCommandByPath.mockReturnValue({ args: false });
      
      await kb.handleKeyDown(createEnterEvent());
  
      expect(mockCommandProcessor.executeCommand).toHaveBeenCalledWith(
        ['command'],
        []
      );
    });
  
    it('should not execute command when input is empty and command requires args', async () => {
      const { kb } = setupKeyboardTest({
        input: '',
        commandStack: ['command'],
        currentArg: { name: 'arg1', type: 'string' }
      });
  
      mockCommandRegistry.getCommandByPath.mockReturnValue({ args: true });
      
      await kb.handleKeyDown(createEnterEvent());
  
      expect(mockCommandProcessor.executeCommand).not.toHaveBeenCalled();
    });
  });

  describe('Default character handling', () => {
    const createKeyEvent = (key: string) => new KeyboardEvent('keydown', { key });
  
    beforeEach(() => {
      vi.useFakeTimers();
    });
  
    afterEach(() => {
      vi.useRealTimers();
    });
  
    it('should append character to input and update filtered commands', () => {
      const { kb } = setupKeyboardTest({
        input: 'tes'
      });
  
      kb.handleKeyDown(createKeyEvent('t'));
  
      expect(mockActions.setInput).toHaveBeenCalledWith('test');
      expect(mockCommandProcessor.updateFilteredCommands).toHaveBeenCalled();
    });
  
    it('should validate input when no current arg exists', () => {
      const { kb } = setupKeyboardTest({
        input: 'test',
        currentArg: null
      });
  
      kb.handleKeyDown(createKeyEvent('x'));
      expect(mockActions.setInput).toHaveBeenCalledWith('testx');
    });
  
    it('should handle invalid input with timeout', () => {
      const { kb } = setupKeyboardTest({
        input: 'test',
        currentArg: null
      }, new DefaultCommandValidationStrategy());
  
      kb.handleKeyDown(createKeyEvent('x'));
      expect(mockActions.setInput).not.toHaveBeenCalled();
  
      vi.advanceTimersByTime(1000);
  
      expect(mockActions.setInputValidation).toHaveBeenLastCalledWith({ isValid: true });
    });
  
    it('should ignore ctrl/meta key combinations', () => {
      const { kb } = setupKeyboardTest();
  
      kb.handleKeyDown(new KeyboardEvent('keydown', { 
        key: 'c', 
        ctrlKey: true 
      }));
  
      expect(mockActions.setInput).not.toHaveBeenCalled();
      expect(mockCommandProcessor.updateFilteredCommands).not.toHaveBeenCalled();
    });
  });
});