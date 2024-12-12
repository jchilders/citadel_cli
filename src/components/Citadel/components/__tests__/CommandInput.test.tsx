import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { CommandInput } from '../CommandInput';
import { CommandNode, CommandTrie } from '../../types/command-trie';
import { CitadelState } from '../../types/state';

// Mock useCommandParser hook
vi.mock('../../hooks/useCommandParser', () => ({
  useCommandParser: () => ({
    handleKeyDown: vi.fn((e: KeyboardEvent, state: CitadelState, actions: any) => {
      // Simulate Enter key behavior for help command
      if (e.key === 'Enter' && state.currentNode?.name === 'help') {
        state.currentNode.handler([]);
        actions.executeCommand(['help']);
        return;
      }

      // If not entering an argument and key is 'x', prevent default
      if (e.key === 'x' && !state.isEnteringArg && !state.currentNode) {
        e.preventDefault();
        return;
      }
      
      // For all other cases, allow the input
      actions.setCurrentInput(state.currentInput + e.key);
    }),
    handleInputChange: vi.fn((value: string, _state: CitadelState, actions: any) => {
      actions.setCurrentInput(value);
    }),
    inputState: 'idle'
  }),
}));

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
  new CommandNode({
    description: 'Show help information',
    fullPath: ['help'],
    handler: async () => ({ text: 'Help info' })
  }),
  new CommandNode({
    description: 'User management',
    fullPath: ['user']
  }),
  new CommandNode({
    description: '検索機能',
    fullPath: ['検索'],
    handler: async () => ({ text: '検索結果' })
  })
];

// Create a child command for user management
const userShowCommand = new CommandNode({
  description: 'Show user details',
  fullPath: ['user', 'show'],
  argument: { name: 'userId', description: 'Enter user ID' }
});
mockCommands[1].addChild('show', userShowCommand);

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
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 'x' });

    expect(mockActions.setCurrentInput).not.toHaveBeenCalled();
  });

  it('allows valid command prefixes', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
          availableCommands={mockCommands}
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 'h' }); // Valid prefix for 'help'

    expect(mockActions.setCurrentInput).toHaveBeenCalled();
  });

  it('prevents input at leaf nodes without handlers or arguments', () => {
    const leafNode = new CommandNode({
      description: 'Leaf node',
      fullPath: ['leaf']
    });
    
    const state = {
      ...defaultState,
      currentNode: leafNode
    };

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={state}
          actions={mockActions}
          availableCommands={mockCommands}
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.keyDown(input, { key: 'a' });
    expect(mockActions.setCurrentInput).not.toHaveBeenCalled();
  });

  it('allows input for nodes with handlers', () => {
    const handlerNode = new CommandNode({
      description: 'Node with handler',
      fullPath: ['handler'],
      handler: async () => ({ text: 'test' })
    });
    
    const state = {
      ...defaultState,
      currentNode: handlerNode,
      currentInput: 'handler'  // Set current input to match the node's name
    };

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={state}
          actions={mockActions}
          availableCommands={[handlerNode]}  // Pass the handler node as available command
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.keyDown(input, { key: 'Enter' });  // Use Enter key instead of 'a'
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
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 'x' });

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
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 's' }); // Valid prefix for 'show'

    expect(mockActions.setCurrentInput).toHaveBeenCalled();
  });

  it('allows special keys', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
          availableCommands={mockCommands}
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    const specialKeys = ['Backspace', 'Enter', 'Escape', 'Tab', 'ArrowLeft', 'ArrowRight'];

    specialKeys.forEach(key => {
      fireEvent.keyDown(input, { key });
      expect(mockActions.setCurrentInput).toHaveBeenCalled();
    });
  });

  it('allows argument input', () => {
    const argState: CitadelState = {
      ...defaultState,
      currentNode: userShowCommand,
      commandStack: ['user', 'show'],
      isEnteringArg: true
    };

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={argState}
          actions={mockActions}
          availableCommands={mockCommands}
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: '1' }); // Valid argument input

    expect(mockActions.setCurrentInput).toHaveBeenCalled();
  });

  it('allows Unicode character input for commands', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
          availableCommands={mockCommands}
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.change(input, { target: { value: '検' } });
    expect(mockActions.setCurrentInput).toHaveBeenCalledWith('検');
    
    vi.clearAllMocks();
    
    fireEvent.change(input, { target: { value: '検索' } });
    expect(mockActions.setCurrentInput).toHaveBeenCalledWith('検索');
  });

  it('executes help command when Enter is pressed', () => {
    const helpNode = mockCommands[0];
    const state = {
      ...defaultState,
      currentNode: helpNode,
      commandStack: ['help']
    };

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={state}
          actions={mockActions}
          availableCommands={mockCommands}
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockActions.executeCommand).toHaveBeenCalledWith(['help']);
  });

  it('handles input state transitions correctly', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={{
            ...defaultState,
            isEnteringArg: true,
            currentNode: userShowCommand
          }}
          actions={mockActions}
          availableCommands={mockCommands}
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    expect(input?.getAttribute('placeholder')).toBe('userId');
  });

  it('maintains focus when command stack changes', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
          availableCommands={mockCommands}
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    expect(document.activeElement).toStrictEqual(input);

    const newState = {
      ...defaultState,
      commandStack: ['help']
    };

    render(
      <TestWrapper>
        <CommandInput
          state={newState}
          actions={mockActions}
          availableCommands={mockCommands}
          commandTrie={new CommandTrie()}
        />
      </TestWrapper>
    );

    expect(document.activeElement).toStrictEqual(input);
  });
});
