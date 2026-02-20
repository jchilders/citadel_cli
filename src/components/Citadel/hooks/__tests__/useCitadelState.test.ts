import { act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { 
  createMockCommand,
  createMockCommandRegistry,
  createMockOutputItem,
  createMockSegmentStack,
  createMockCommandHistory,
  createMockCommandHistoryActions,
  setupCitadelStateHook
} from '../../../../__test-utils__/factories';
import { TextCommandResult, ErrorCommandResult } from '../../types/command-results';
import { useCommandHistory } from '../useCommandHistory';

// Mock hooks
const {
  mockUseCitadelConfig,
  mockUseCitadelStorage,
  mockUseCitadelCommands,
  mockUseSegmentStack,
  mockUseSegmentStackVersion
} = vi.hoisted(() => ({
  mockUseCitadelConfig: vi.fn(),
  mockUseCitadelStorage: vi.fn(),
  mockUseCitadelCommands: vi.fn(),
  mockUseSegmentStack: vi.fn(),
  mockUseSegmentStackVersion: vi.fn(() => 1)
}));

vi.mock('../../config/hooks', () => ({
  useCitadelConfig: mockUseCitadelConfig,
  useCitadelStorage: mockUseCitadelStorage,
  useCitadelCommands: mockUseCitadelCommands,
  useSegmentStack: mockUseSegmentStack,
  useSegmentStackVersion: mockUseSegmentStackVersion
}));

// Mock useCommandHistory before any test runs
let mockCommands: ReturnType<typeof createMockCommandRegistry>;
let mockSegmentStack: ReturnType<typeof createMockSegmentStack>;

beforeEach(() => {
  vi.clearAllMocks();

  mockCommands = createMockCommandRegistry();
  mockSegmentStack = createMockSegmentStack();

  mockUseCitadelConfig.mockReturnValue({
    storage: { type: 'memory', maxCommands: 100 },
    commandTimeoutMs: 5000
  });
  mockUseCitadelStorage.mockReturnValue(undefined);
  mockUseCitadelCommands.mockReturnValue(mockCommands);
  mockUseSegmentStack.mockReturnValue(mockSegmentStack);
  mockUseSegmentStackVersion.mockReturnValue(1);

  const mockHistory = createMockCommandHistory();
  const mockActions = createMockCommandHistoryActions();
  vi.mocked(useCommandHistory).mockReturnValue({
    history: mockHistory,
    ...mockActions
  });
});

vi.mock('../useCommandHistory');

describe('useCitadelState', () => {
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
      
      vi.mocked(mockCommands.getCommand).mockReturnValue(
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
      
      vi.mocked(mockCommands.getCommand).mockReturnValue(
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

});
