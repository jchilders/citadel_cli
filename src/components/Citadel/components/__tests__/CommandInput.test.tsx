import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { CommandInput } from '../CommandInput';
import { CommandNode } from '../../types/command-trie';
import { CitadelState } from '../../types/state';

// Mock useCommandParser hook
vi.mock('../../hooks/useCommandParser', () => ({
  useCommandParser: () => ({
    handleKeyDown: (e: KeyboardEvent, state: CitadelState, actions: any) => {
      // If not entering an argument and key is 'x', prevent default
      if (e.key === 'x' && !state.isEnteringArg && !state.currentNode) {
        e.preventDefault();
        return;
      }
      
      // For all other cases, allow the input
      actions.setCurrentInput(state.currentInput + e.key);
    },
    handleInputChange: (value: string, state: CitadelState, actions: any) => {
      actions.setCurrentInput(value);
    },
  }),
}));

// Initialize happy-dom
GlobalRegistrator.register();

// Create test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

// Mock commands for testing
const mockCommands: CommandNode[] = [
  {
    name: 'help',
    description: 'Show help information',
    fullPath: ['help'],
    handler: async () => ({ text: 'Help info' })
  },
  {
    name: 'user',
    description: 'User management',
    fullPath: ['user'],
    children: new Map([
      ['show', {
        name: 'show',
        description: 'Show user details',
        fullPath: ['user', 'show'],
        argument: { name: 'userId', description: 'Enter user ID' }
      }]
    ])
  },
  {
    name: '検索',
    description: '検索機能',
    fullPath: ['検索'],
    handler: async () => ({ text: '検索結果' })
  }
];

// Mock actions
const mockActions = {
  setCommandStack: vi.fn(),
  setCurrentInput: vi.fn(),
  setIsEnteringArg: vi.fn(),
  setCurrentNode: vi.fn(),
  addOutput: vi.fn(),
  setValidation: vi.fn(),
  executeCommand: vi.fn()
};

describe('CommandInput', () => {
  const defaultState: CitadelState = {
    commandStack: [],
    currentInput: '',
    isEnteringArg: false,
    currentNode: undefined,
    output: [],
    validation: { isValid: true }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents invalid input at root level', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
          availableCommands={mockCommands}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 'x' });

    // Invalid input should be prevented
    expect(mockActions.setCurrentInput).not.toHaveBeenCalled();
  });

  it('allows valid command prefixes', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
          availableCommands={mockCommands}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 'h' }); // Valid prefix for 'help'

    // Should allow valid input
    expect(mockActions.setCurrentInput).toHaveBeenCalled();
  });

  it('prevents input for leaf commands without arguments', () => {
    const leafState: CitadelState = {
      ...defaultState,
      currentNode: mockCommands[0], // 'help' command
      commandStack: ['help']
    };

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={leafState}
          actions={mockActions}
          availableCommands={mockCommands}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 'x' });

    // Should prevent input at leaf nodes
    expect(mockActions.setCurrentInput).not.toHaveBeenCalled();
  });

  it('allows subcommand input', () => {
    const subcommandState: CitadelState = {
      ...defaultState,
      currentNode: mockCommands[1], // 'user' command
      commandStack: ['user']
    };

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={subcommandState}
          actions={mockActions}
          availableCommands={mockCommands}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 's' }); // Valid prefix for 'show'

    // Should allow valid subcommand input
    expect(mockActions.setCurrentInput).toHaveBeenCalled();
  });

  it('allows special keys', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
          availableCommands={mockCommands}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    const specialKeys = ['Backspace', 'Enter', 'Escape', 'Tab', 'ArrowLeft', 'ArrowRight'];

    specialKeys.forEach(key => {
      fireEvent.keyDown(input, { key });
      // Special keys should be allowed
      expect(mockActions.setCurrentInput).toHaveBeenCalled();
    });
  });

  it('allows argument input', () => {
    const argState: CitadelState = {
      ...defaultState,
      currentNode: mockCommands[1].children?.get('show'),
      commandStack: ['user', 'show'],
      isEnteringArg: true
    };

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={argState}
          actions={mockActions}
          availableCommands={mockCommands}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: '1' }); // Valid argument input

    // Should allow argument input
    expect(mockActions.setCurrentInput).toHaveBeenCalled();
  });

  it('allows Unicode character input for commands', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
          availableCommands={mockCommands}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    // Test input of first character
    fireEvent.change(input, { target: { value: '検' } });
    expect(mockActions.setCurrentInput).toHaveBeenCalledWith('検');
    
    // Reset mock
    vi.clearAllMocks();
    
    // Test complete word
    fireEvent.change(input, { target: { value: '検索' } });
    expect(mockActions.setCurrentInput).toHaveBeenCalledWith('検索');
  });
});
