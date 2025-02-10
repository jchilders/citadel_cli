import { act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { 
  createMockCommand,
  createMockCommandTrie,
  createMockOutputItem,
  createMockSegmentStack,
  createMockCommandHistory,
  createMockCommandHistoryActions,
  setupCitadelStateHook
} from '../../../../__test-utils__/factories';
import { TextCommandResult, ErrorCommandResult } from '../../types/command-results';
import { useCommandHistory } from '../useCommandHistory';

// Mock CitadelConfigContext
vi.mock('../../config/CitadelConfigContext', () => ({
  useCitadelConfig: () => ({
    storage: { type: 'memory', maxCommands: 100 },
    commandTimeoutMs: 5000
  }),
  useCitadelStorage: () => ({
    addStoredCommand: vi.fn().mockResolvedValue(undefined),
    getStoredCommands: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined)
  }),
  useCitadelCommands: () => createMockCommandTrie(),
  useSegmentStack: () => createMockSegmentStack(),
  useSegmentStackVersion: () => 1
}));

// Mock useCommandHistory before any test runs
beforeEach(() => {
  const mockHistory = createMockCommandHistory();
  const mockActions = createMockCommandHistoryActions();
  vi.mocked(useCommandHistory).mockReturnValue({
    history: mockHistory,
    ...mockActions
  });
});

vi.mock('../useCommandHistory');

describe.skip('useCitadelState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { hook } = setupCitadelStateHook();
      
      expect(hook.result.current.state).toEqual({
        currentInput: '',
        isEnteringArg: false,
        output: [],
        history: {
          commands: [],
          position: null,
          storage: undefined
        }
      });
    });
  });

  describe('actions', () => {
    it('should handle setCurrentInput action', () => {
      const { hook } = setupCitadelStateHook();
      
      act(() => {
        hook.result.current.actions.setCurrentInput('test input');
      });

      expect(hook.result.current.state.currentInput).toBe('test input');
    });

    it('should handle setIsEnteringArg action', () => {
      const { hook } = setupCitadelStateHook();
      
      act(() => {
        hook.result.current.actions.setIsEnteringArg(true);
      });

      expect(hook.result.current.state.isEnteringArg).toBe(true);
    });

    it('should handle addOutput action', () => {
      const { hook } = setupCitadelStateHook();
      const output = createMockOutputItem(['test', 'command']);
      output.result = new TextCommandResult('test output');

      act(() => {
        hook.result.current.actions.addOutput(output);
      });

      expect(hook.result.current.state.output).toHaveLength(1);
      expect(hook.result.current.state.output[0]).toBe(output);
    });

    it('should handle executeCommand action success', async () => {
      const { hook } = setupCitadelStateHook();
      const mockResult = new TextCommandResult('Success');
      
      vi.mocked(createMockCommandTrie().getCommand).mockReturnValue(
        createMockCommand('test', { 
          handler: async () => mockResult 
        })
      );

      await act(async () => {
        await hook.result.current.actions.executeCommand();
      });

      expect(hook.result.current.state.output[0].result).toBe(mockResult);
    });

    it('should handle executeCommand action failure', async () => {
      const { hook } = setupCitadelStateHook();
      const mockError = new Error('Test error');
      
      vi.mocked(createMockCommandTrie().getCommand).mockReturnValue(
        createMockCommand('test', { 
          handler: async () => { throw mockError; }
        })
      );

      await act(async () => {
        await hook.result.current.actions.executeCommand();
      });

      const output = hook.result.current.state.output[0];
      expect(output.result).toBeInstanceOf(ErrorCommandResult);
      expect((output.result as ErrorCommandResult).error).toBe('Test error');
    });

    it('should handle clearHistory action', async () => {
      const { hook, mockActions } = setupCitadelStateHook();
      
      await act(async () => {
        await hook.result.current.actions.clearHistory();
      });

      expect(mockActions.clear).toHaveBeenCalled();
    });
  });

  describe('command completion', () => {
    it('should return available commands', () => {
      const { hook } = setupCitadelStateHook();
      const completions = hook.result.current.getAvailableCommands_s();
      expect(completions).toEqual([]);
    });

    it('should return available command segments', () => {
      const { hook } = setupCitadelStateHook();
      const segments = hook.result.current.getAvailableCommandSegments();
      expect(segments).toEqual([]);
    });
  });
});
