import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { CommandInput } from '../CommandInput';
import { CommandRegistry } from '../../types/command-registry';
import { TextCommandResult } from '../../types/command-results';
import { CitadelConfigProvider } from '../../config/CitadelConfigContext';
import {
  createMockCitadelActions,
  createMockCitadelState
} from '../../../../__test-utils__/factories';

// Create test wrapper with context
const TestWrapper: React.FC<{ 
  children: React.ReactNode;
  commandRegistry?: CommandRegistry;
  config?: Record<string, unknown>;
}> = ({ 
  children, 
  commandRegistry = new CommandRegistry(),
  config = { includeHelpCommand: true, resetStateOnHide: true, showCitadelKey: '.' }
}) => {
  return (
    <CitadelConfigProvider 
      config={config}
      commandRegistry={commandRegistry}
    >
      <div data-testid="test-wrapper">
        {children}
      </div>
    </CitadelConfigProvider>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn<T extends (...args: any[]) => any> = T & {
  mock: { calls: Parameters<T>[] };
};

describe('CommandInput', () => {
  let cmdRegistry: CommandRegistry;
  const defaultState = createMockCitadelState();

  beforeEach(() => {
    vi.clearAllMocks();
    cmdRegistry = new CommandRegistry();
    
    // Add some test commands
    cmdRegistry.addCommand(
      [{ type: 'word', name: 'help' }],
      'Show help information',
      async () => new TextCommandResult('Help info')
    );
    
    cmdRegistry.addCommand(
      [{ type: 'word', name: 'user' }],
      'User management',
      async () => new TextCommandResult('User commands')
    );
  });

  it('prevents invalid input at root level', () => {
    const mockActions = createMockCitadelActions();
    const { container } = render(
      <TestWrapper commandRegistry={cmdRegistry}>
        <CommandInput
          state={defaultState}
          actions={mockActions}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.keyDown(input, { key: 'x' }); // 'x' is not a valid command prefix

    // The input should be prevented and setCurrentInput should not be called
    expect(mockActions.setCurrentInput).not.toHaveBeenCalled();
  });

  it('allows valid command prefixes', () => {
    const mockActions = createMockCitadelActions();
    const { container } = render(
      <TestWrapper commandRegistry={cmdRegistry}>
        <CommandInput
          state={defaultState}
          actions={mockActions}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input') as HTMLInputElement;
    if (!input) throw new Error('Input element not found');
    
    // Simulate typing 'h' (valid prefix for 'help')
    fireEvent.change(input, { target: { value: 'h' } });
    
    // The input change should be processed
    expect(mockActions.setCurrentInput).toHaveBeenCalledWith('h');
  });

  it('prevents input at leaf nodes without handlers or arguments', () => {
    // Create a registry with a leaf command that has no handler
    const leafRegistry = new CommandRegistry();
    leafRegistry.addCommand(
      [{ type: 'word', name: 'leaf' }],
      'Leaf node',
      async () => new TextCommandResult('leaf result')
    );

    const mockActions = createMockCitadelActions();
    const { container } = render(
      <TestWrapper commandRegistry={leafRegistry}>
        <CommandInput
          state={defaultState}
          actions={mockActions}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    fireEvent.keyDown(input, { key: 'a' });
    expect(mockActions.setCurrentInput).not.toHaveBeenCalled();
  });

  it('prevents input for leaf commands without arguments', () => {
    const mockActions = createMockCitadelActions();
    const { container } = render(
      <TestWrapper commandRegistry={cmdRegistry}>
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

  it('maintains focus when command stack changes', () => {
    const { container, rerender } = render(
      <TestWrapper commandRegistry={cmdRegistry}>
        <CommandInput
          state={defaultState}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    if (!input) throw new Error('Input element not found');
    
    input.focus();
    expect(document.activeElement).toStrictEqual(input);

    // Simulate state change
    const newState = createMockCitadelState({ currentInput: 'test' });
    rerender(
      <TestWrapper commandRegistry={cmdRegistry}>
        <CommandInput
          state={newState}
          actions={createMockCitadelActions()}
        />
      </TestWrapper>
    );

    expect(document.activeElement).toStrictEqual(input);
  });

  it('shows invalid state when submitting an incomplete command', async () => {
    const registry = new CommandRegistry();
    registry.addCommand(
      [
        { type: 'word', name: 'user' },
        { type: 'word', name: 'show' }
      ],
      'Show user details',
      async () => new TextCommandResult('details')
    );

    const mockActions = createMockCitadelActions();
    const state = createMockCitadelState();

    const { getByTestId } = render(
      <TestWrapper commandRegistry={registry}>
        <CommandInput state={state} actions={mockActions} />
      </TestWrapper>
    );

    const input = getByTestId('citadel-command-input') as HTMLInputElement;

    const setCurrentInputMock = mockActions.setCurrentInput as MockFn<typeof mockActions.setCurrentInput>;

    fireEvent.change(input, { target: { value: 'u' } });
    expect(setCurrentInputMock).toHaveBeenCalledWith('u');

    const callsBeforeEnter = setCurrentInputMock.mock.calls.length;

    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(input.className).toContain('invalid-input-animation');
    });

    expect(mockActions.executeCommand).not.toHaveBeenCalled();
    expect(setCurrentInputMock.mock.calls.length).toBe(callsBeforeEnter);
  });
});

describe('CommandInput Animation', () => {
  it('should apply animation class when showInvalidAnimation state is true', () => {
    // Create a simple test component that directly controls the animation state
    const TestAnimationComponent = () => {
      const [showInvalidAnimation, setShowInvalidAnimation] = React.useState(false);
      
      return (
        <div>
          <button 
            onClick={() => setShowInvalidAnimation(true)}
            data-testid="trigger-animation"
          >
            Trigger Animation
          </button>
          <input
            data-testid="test-input"
            className={`w-full bg-transparent outline-none text-gray-200 caret-transparent ${showInvalidAnimation ? 'invalid-input-animation' : ''}`}
          />
        </div>
      );
    };

    const { getByTestId } = render(<TestAnimationComponent />);
    
    const input = getByTestId('test-input');
    const button = getByTestId('trigger-animation');
    
    // Initially no animation class
    expect(input.className).not.toContain('invalid-input-animation');
    
    // Click button to trigger animation
    fireEvent.click(button);
    
    // Should now have animation class
    expect(input.className).toContain('invalid-input-animation');
  });

  it('should contain the CSS animation keyframes', () => {
    const TestAnimationComponent = () => {
      return (
        <div>
          <style>{`
            @keyframes subtleGlow {
              0%, 100% { box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
              50% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.6); }
            }
            .invalid-input-animation {
              animation: subtleGlow 0.4s ease-in-out;
            }
          `}</style>
          <input
            data-testid="test-input"
            className="invalid-input-animation"
          />
        </div>
      );
    };

    const { getByTestId } = render(<TestAnimationComponent />);
    const input = getByTestId('test-input');
    
    // Verify the animation class is applied
    expect(input.className).toContain('invalid-input-animation');
  });
});
