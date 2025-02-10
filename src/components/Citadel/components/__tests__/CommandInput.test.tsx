import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { CommandInput } from '../CommandInput';
import { CommandNode } from '../../types/command-trie';
import { TextCommandResult } from '../../types/command-results';
import {
  createMockCitadelActions,
  createMockCitadelState,
  createMockCommand
} from '../../../../__test-utils__/factories';
import { } from '../../../../__test-utils__/factories';

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
  createMockCommand('help', {
    description: 'Show help information',
    handler: async () => new TextCommandResult('Help info')
  }),
  createMockCommand('user', {
    description: 'User management'
  }),
  createMockCommand('検索', {
    description: '検索機能',
    handler: async () => new TextCommandResult('検索結果')
  })
];

// Create a child command for user management
const userShowCommand = createMockCommand('show', {
  description: 'Show user details',
});

// TODO: fix. the ones that are passing are passing incorrectly
describe.skip('CommandInput', () => {
  const defaultState = createMockCitadelState();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents invalid input at root level', () => {
    const mockActions = createMockCitadelActions();
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 'x' });

    expect(mockActions.setCurrentInput).not.toHaveBeenCalled();
  });

  it('allows valid command prefixes', () => {
    const mockActions = createMockCitadelActions();
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={mockActions}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 'h' }); // Valid prefix for 'help'

    expect(mockActions.setCurrentInput).toHaveBeenCalled();
  });

  it('prevents input at leaf nodes without handlers or arguments', () => {
    const leafNode = createMockCommand('leaf', {
      description: 'Leaf node',
      handler: undefined
    });
    
    const state = createMockCitadelState({
      currentNode: leafNode
    });

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={state}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.keyDown(input, { key: 'a' });
    expect(createMockCitadelActions().setCurrentInput).not.toHaveBeenCalled();
  });

  it('allows input for nodes with handlers', () => {
    const handlerNode = createMockCommand('handler', {
      description: 'Node with handler',
      handler: async () => new TextCommandResult('test')
    });
    
    const state = createMockCitadelState({
      currentNode: handlerNode,
      currentInput: 'handler'  // Set current input to match the node's name
    });

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={state}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.keyDown(input, { key: 'Enter' });  // Use Enter key instead of 'a'
    expect(createMockCitadelActions().setCurrentInput).toHaveBeenCalled();
  });

  it('prevents input for leaf commands without arguments', () => {
    const leafState = createMockCitadelState({
      currentNode: mockCommands[0], // 'help' command
      commandStack: ['help']
    });

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={leafState}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 'x' });

    expect(createMockCitadelActions().setCurrentInput).not.toHaveBeenCalled();
  });

  it('allows subcommand input', () => {
    const subcommandState = createMockCitadelState({
      currentNode: mockCommands[1], // 'user' command
      commandStack: ['user']
    });

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={subcommandState}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: 's' }); // Valid prefix for 'show'

    expect(createMockCitadelActions().setCurrentInput).toHaveBeenCalled();
  });

  it('allows special keys', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    const specialKeys = ['Backspace', 'Enter', 'Escape', 'Tab', 'ArrowLeft', 'ArrowRight'];

    specialKeys.forEach(key => {
      fireEvent.keyDown(input, { key });
      expect(createMockCitadelActions().setCurrentInput).toHaveBeenCalled();
    });
  });

  it('allows argument input', () => {
    const argState = createMockCitadelState({
      currentNode: userShowCommand,
      commandStack: ['user', 'show'],
      isEnteringArg: true
    });

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={argState}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    fireEvent.keyDown(input, { key: '1' }); // Valid argument input

    expect(createMockCitadelActions().setCurrentInput).toHaveBeenCalled();
  });

  it('allows Unicode character input for commands', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={defaultState}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.change(input, { target: { value: '要塞' } });
    expect(createMockCitadelActions().setCurrentInput).toHaveBeenCalledWith('要塞');
    
    vi.clearAllMocks();
    
    fireEvent.change(input, { target: { value: '正义' } });
    expect(createMockCitadelActions().setCurrentInput).toHaveBeenCalledWith('正义');
  });

  it('executes help command when Enter is pressed', () => {
    const helpNode = mockCommands[0];
    const state = createMockCitadelState({
      currentNode: helpNode,
      commandStack: ['help']
    });

    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={state}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(createMockCitadelActions().executeCommand).toHaveBeenCalledWith(['help']);
  });

  it('handles input state transitions correctly', () => {
    const { container } = render(
      <TestWrapper>
        <CommandInput
          state={createMockCitadelState({
            isEnteringArg: true,
            currentNode: userShowCommand
          })}
          actions={createMockCitadelActions()}
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
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    expect(document.activeElement).toStrictEqual(input);

    const newState = createMockCitadelState({
      commandStack: ['help']
    });

    render(
      <TestWrapper>
        <CommandInput
          state={newState}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    expect(document.activeElement).toStrictEqual(input);
  });
});
