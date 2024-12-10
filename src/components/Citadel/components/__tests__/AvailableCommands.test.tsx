import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AvailableCommands } from '../AvailableCommands';
import { CitadelState } from '../../types/state';
import { CommandNode } from '../../types/command-trie';
import { CitadelConfigProvider } from '../../config/CitadelConfigContext';

describe('AvailableCommands', () => {
  const defaultState: CitadelState = {
    commandStack: [],
    currentInput: '',
    isEnteringArg: false,
    currentNode: undefined,
    output: [],
    validation: { isValid: true }
  };

  const mockCommands: CommandNode[] = [
    new CommandNode({
      fullPath: ['help'],
      description: 'Show help information'
    }),
    new CommandNode({
      fullPath: ['test'],
      description: 'Test command'
    })
  ];

  const renderWithConfig = (
    state: CitadelState = defaultState,
    availableCommands: CommandNode[] = mockCommands,
    config = { includeHelpCommand: true, resetStateOnHide: true, showCitadelKey: '.' }
  ) => {
    return render(
      <CitadelConfigProvider config={config}>
        <AvailableCommands
          state={state}
          availableCommands={availableCommands}
        />
      </CitadelConfigProvider>
    );
  };

  it('renders available commands when not entering arguments', () => {
    const { container } = renderWithConfig();
    expect(container.textContent).toContain('help');
    expect(container.textContent).toContain('test');
  });

  it('does not render commands when entering arguments', () => {
    const state = { ...defaultState, isEnteringArg: true };
    const { container } = renderWithConfig(state);
    expect(container.textContent).not.toContain('help');
    expect(container.textContent).not.toContain('test');
  });

  it('handles help command placement based on config', () => {
    const { container } = renderWithConfig(
      defaultState,
      mockCommands,
      { includeHelpCommand: true, resetStateOnHide: true, showCitadelKey: '.' }
    );
    const content = container.textContent || '';
    const helpIndex = content.indexOf('help');
    const testIndex = content.indexOf('test');
    expect(helpIndex).toBeGreaterThan(testIndex);
  });

  it('renders without help command when disabled in config', () => {
    const { container } = renderWithConfig(
      defaultState,
      mockCommands.filter(cmd => cmd.fullPath[0] !== 'help'),
      { includeHelpCommand: false, resetStateOnHide: true, showCitadelKey: '.' }
    );
    expect(container.textContent).not.toContain('help');
    expect(container.textContent).toContain('test');
  });
});
